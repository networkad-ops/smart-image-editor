// BannerPreview.tsx 수정
import React, { useEffect, RefObject, useCallback, useRef, useState } from 'react';
import { BannerConfig, TextElement } from '../types';
import { drawTextWithLetterSpacing } from '../utils/canvasUtils';
import { buildRuns } from '../utils/textSegments';

// 텍스트 정규화 함수
const textNormalize = (s: string | undefined): string => s?.replace(/\r\n/g, '\n') ?? '';

// 줄별 런 생성 함수
const buildRunsForLine = (
  lineText: string,
  colorSegments: Array<{start: number, end: number, color: string}> = [],
  previewSegments: Array<{start: number, end: number, color: string}> = [],
  defaultColor: string
): Array<{text: string, color: string}> => {
  const allSegments = [...colorSegments, ...previewSegments]
    .sort((a, b) => a.start - b.start);
  
  const runs: Array<{text: string, color: string}> = [];
  let currentIndex = 0;
  
  for (const segment of allSegments) {
    // 세그먼트 시작 전까지의 텍스트
    if (currentIndex < segment.start) {
      const textBefore = lineText.slice(currentIndex, segment.start);
      if (textBefore) {
        runs.push({ text: textBefore, color: defaultColor });
      }
    }
    
    // 세그먼트 텍스트
    const segmentText = lineText.slice(segment.start, segment.end);
    if (segmentText) {
      runs.push({ text: segmentText, color: segment.color });
    }
    
    currentIndex = Math.max(currentIndex, segment.end);
  }
  
  // 남은 텍스트
  if (currentIndex < lineText.length) {
    const remainingText = lineText.slice(currentIndex);
    if (remainingText) {
      runs.push({ text: remainingText, color: defaultColor });
    }
  }
  
  // 텍스트가 비어있으면 기본 런 반환
  if (runs.length === 0 && lineText) {
    runs.push({ text: lineText, color: defaultColor });
  }
  
  return runs;
};

interface BannerPreviewProps {
  config: BannerConfig;
  uploadedImage: File | null;
  uploadedLogo?: File | null;
  uploadedLogos?: File[]; // 다중 로고
  textElements: TextElement[];
  existingImageUrl?: string | null;
  existingLogoUrl?: string | null;
  existingLogoUrls?: string[]; // 다중 로고 URLs
  logoHeight?: number;
  onDrawStart?: () => void;
  onDrawComplete?: () => void;
}

export const BannerPreview = React.forwardRef<HTMLCanvasElement, BannerPreviewProps>(({
  config,
  uploadedImage,
  uploadedLogo,
  uploadedLogos = [],
  textElements,
  existingImageUrl,
  existingLogoUrl,
  existingLogoUrls = [],
  logoHeight,
  onDrawStart,
  onDrawComplete
}, ref) => {
  // 더블 버퍼링을 위한 오프스크린 캔버스
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // 드래그 상태
  const [dragging, setDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState<number | null>(null);
  const [startHeight, setStartHeight] = useState<number>(logoHeight || 56);
  // 이미지 로딩 상태
  const [isLoading, setIsLoading] = useState(false);
  // 핸들 위치 계산 (단일/다중 로고 모두 지원)
  let handleX = 0, handleY = 0, handleW = 16, handleH = 16;
  let logoX = config.logo?.x ?? config.multiLogo?.x ?? 0;
  let logoY = config.logo?.y ?? config.multiLogo?.y ?? 0;
  let logoW = 0;
  let aspect = 1;
  if (uploadedLogo && config.logo) {
    // 단일 로고
    aspect = 1;
    if (uploadedLogo instanceof File) {
      const img = new window.Image();
      img.src = URL.createObjectURL(uploadedLogo);
      img.onload = () => {
        aspect = img.width / img.height;
      };
    }
    logoW = (logoHeight ?? 56) * aspect;
    handleX = logoX + logoW - handleW / 2;
    handleY = logoY + (logoHeight ?? 56) - handleH / 2;
  } else if (uploadedLogos.length > 0 && config.multiLogo) {
    // 다중 로고: 첫 번째 로고 기준
    aspect = 1;
    const firstLogo = uploadedLogos[0];
    if (firstLogo instanceof File) {
      const img = new window.Image();
      img.src = URL.createObjectURL(firstLogo);
      img.onload = () => {
        aspect = img.width / img.height;
      };
    }
    logoW = (logoHeight ?? config.multiLogo.maxHeight) * aspect;
    handleX = logoX + logoW - handleW / 2;
    handleY = logoY + (logoHeight ?? config.multiLogo.maxHeight) - handleH / 2;
  }

  // 기본배너 PC 전용 preset 적용
  const isBasicBannerPC = config.dbType === 'basic-pc' || config.dbType === 'basic-pc-logo';
  
  // 디자인 크기 설정 (기본배너 PC는 2880×480 고정, 나머지는 config 기준)
  const designSize = isBasicBannerPC 
    ? { w: 2880, h: 480 }
    : { w: config.width, h: config.height };
  
  // 각 배너의 실제 해상도 사용
  const CANVAS_WIDTH = designSize.w;
  const CANVAS_HEIGHT = designSize.h;
  
  // 더블 버퍼링용 오프스크린 캔버스 초기화 - 기본배너 PC는 2880×480 고정
  useEffect(() => {
    const dpr = window.devicePixelRatio || 1;
    const offscreenCanvas = document.createElement('canvas');
    
    if (isBasicBannerPC) {
      // 기본배너 PC: 2880×480 고정, DPR 반영
      offscreenCanvas.width = 2880 * dpr;
      offscreenCanvas.height = 480 * dpr;
    } else {
      // 기타 배너: config 기준, DPR 반영
      offscreenCanvas.width = config.width * dpr;
      offscreenCanvas.height = config.height * dpr;
    }
    
    const ctx = offscreenCanvas.getContext('2d');
    if (ctx) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    offscreenCanvasRef.current = offscreenCanvas;
  }, [config.width, config.height, isBasicBannerPC]);

  // 드래그 이벤트 핸들러
  const onHandleMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    setDragStartY(e.clientY);
    setStartHeight(logoHeight || 56);
    e.stopPropagation();
    e.preventDefault();
  };
  useEffect(() => {
    if (!dragging) return;
    const onMouseMove = (e: MouseEvent) => {
      if (dragStartY !== null) {
        let delta = e.clientY - dragStartY;
        let newHeight = Math.max(24, Math.min(200, startHeight + delta));
        setStartHeight(newHeight);
      }
    };
    const onMouseUp = () => setDragging(false);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [dragging, dragStartY, startHeight]);

  // 텍스트 렌더링 함수
  const drawTextElements = useCallback((ctx: CanvasRenderingContext2D, elements: TextElement[]) => {
    // 진단 로그: 메인타이틀과 서브타이틀 색상 정보 출력
    const mainTitle = elements.find(el => el.id === 'main-title');
    const subTitle = elements.find(el => el.id === 'sub-title');
    console.debug('[PREVIEW_COLOR]', { 
      subtitle: subTitle?.color, 
      mainTitle: mainTitle?.color 
    });
    
    elements.forEach(element => {
      ctx.save();
      
      // 버튼 텍스트인 경우 배경 그리기 (텍스트가 없어도 표시)
      if (element.id === 'button-text') {
        // 버튼 배경 그리기 (끝만 둥근 사각형)
        const buttonX = element.x;
        const buttonY = element.y;
        const buttonWidth = element.width;
        const buttonHeight = element.height;
        const borderRadius = 20;  // 적당한 둥근 모서리
        
        // 사용자 설정 배경색 또는 기본값
        const backgroundColor = element.backgroundColor || '#4F46E5';
        ctx.fillStyle = backgroundColor;
        
        // 둥근 모서리 사각형 그리기
        ctx.beginPath();
        ctx.moveTo(buttonX + borderRadius, buttonY);
        ctx.lineTo(buttonX + buttonWidth - borderRadius, buttonY);
        ctx.quadraticCurveTo(buttonX + buttonWidth, buttonY, buttonX + buttonWidth, buttonY + borderRadius);
        ctx.lineTo(buttonX + buttonWidth, buttonY + buttonHeight - borderRadius);
        ctx.quadraticCurveTo(buttonX + buttonWidth, buttonY + buttonHeight, buttonX + buttonWidth - borderRadius, buttonY + buttonHeight);
        ctx.lineTo(buttonX + borderRadius, buttonY + buttonHeight);
        ctx.quadraticCurveTo(buttonX, buttonY + buttonHeight, buttonX, buttonY + buttonHeight - borderRadius);
        ctx.lineTo(buttonX, buttonY + borderRadius);
        ctx.quadraticCurveTo(buttonX, buttonY, buttonX + borderRadius, buttonY);
        ctx.closePath();
        ctx.fill();
        
        // 버튼 그림자 효과
        ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
        ctx.shadowBlur = 6;
        ctx.shadowOffsetY = 3;
        ctx.fill();
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;
      }
      
      // 폰트 설정 (fontPxAtBase 우선 사용)
      const fontWeight = element.fontWeight || 400;
      const finalFontSize = element.fontPxAtBase || element.fontSize;
      ctx.font = `${fontWeight} ${finalFontSize}px Pretendard`;
      ctx.textBaseline = 'top'; // 텍스트의 기준선을 상단으로 설정
      
      // 텍스트 정렬 설정
      const isInteractiveBanner = config.name.includes('인터랙티브');
      
      if (element.id === 'button-text') {
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
      } else if ((element.id === 'sub-title' || element.id === 'main-title' || element.id === 'bottom-sub-title') && isInteractiveBanner) {
        // 인터랙티브 배너의 텍스트들만 중앙 정렬
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
      } else {
        // 나머지는 모두 왼쪽 정렬 (기본 배너, 전면 배너 등)
        ctx.textAlign = 'start';
        ctx.textBaseline = 'top';
      }
      
<<<<<<< HEAD
      // 줄바꿈 처리 (maxLines 제한 적용) - \r\n도 \n으로 통일하여 처리
      const lines = element.text.replace(/\r\n/g, '\n').split('\n');
=======
      // 줄바꿈 처리
      const lines = element.text.split('\n');
      // 설정된 lineHeight가 있으면 우선 사용, 없으면 1.2배수 기본값
      const configLineHeight = (() => {
        if (element.id === 'sub-title' && config.subTitle?.lineHeight) return config.subTitle.lineHeight;
        if (element.id === 'main-title' && config.mainTitle?.lineHeight) return config.mainTitle.lineHeight;
        if (element.id === 'bottom-sub-title' && config.bottomSubTitle?.lineHeight) return config.bottomSubTitle.lineHeight;
        if (element.id === 'button-text' && config.buttonText?.lineHeight) return config.buttonText.lineHeight;
        return undefined;
      })();
      const lineHeight = configLineHeight ?? (element.fontSize * 1.2);
>>>>>>> b50c1ee (fix(text): respect configured lineHeight in preview and export renderers)
      
      // 메인타이틀인 경우 특별 처리 (2줄까지 허용)
      if (element.id === 'main-title') {
        const normalizedText = textNormalize(element.text);
        const lines = normalizedText.split('\n').slice(0, 2);
        const lineHeight = (config.mainTitle?.lineHeight ?? 66.96);
        ctx.textBaseline = 'top';
        
        lines.forEach((line, lineIndex) => {
          const y = element.y + (lineIndex * lineHeight);
          let x = element.x; // 줄마다 x를 left로 초기화
          const letterSpacing = finalFontSize * -0.02; // -2% 자간
          
          // 해당 줄의 세그먼트 필터링
          const lineColorSegments = (element.colorSegments || []).filter(s => s.line === lineIndex);
          const linePreviewSegments = (element.previewSegments || []).filter(s => s.line === lineIndex);
          
          // buildRunsForLine을 사용하여 부분 색상 렌더링
          const runs = buildRunsForLine(line, lineColorSegments, linePreviewSegments, element.color);
          
          runs.forEach(run => {
            ctx.fillStyle = run.color;
            if (letterSpacing !== 0) {
              drawTextWithLetterSpacing(ctx, run.text, x, y, letterSpacing);
            } else {
              ctx.fillText(run.text, x, y);
            }
            x += ctx.measureText(run.text).width;
          });
        });
      } else {
        // 다른 텍스트 요소들은 기존 maxLines 제한 적용 (서브타이틀은 1줄)
        const maxLines = element.id === 'sub-title' ? 1 : (config.mainTitle?.maxLines || config.subTitle?.maxLines || config.bottomSubTitle?.maxLines || 1);
        // 줄바꿈 처리 (CRLF 통일)
        const lines = element.text.replace(/\r\n/g, '\n').split('\n');
        const limitedLines = lines.slice(0, maxLines);
        // 설정된 lineHeight가 있으면 우선 사용, 없으면 1.2배수 기본값
        const lineHeight = (() => {
          if (element.id === 'sub-title' && config.subTitle?.lineHeight) return config.subTitle.lineHeight;
          if (element.id === 'main-title' && config.mainTitle?.lineHeight) return config.mainTitle.lineHeight;
          if (element.id === 'bottom-sub-title' && config.bottomSubTitle?.lineHeight) return config.bottomSubTitle.lineHeight;
          if (element.id === 'button-text' && config.buttonText?.lineHeight) return config.buttonText.lineHeight;
          return finalFontSize * 1.2;
        })();
        
        limitedLines.forEach((line, lineIndex) => {
        let y, currentX;
        
        if (element.id === 'button-text') {
          // 버튼 텍스트는 가운데 정렬
          y = element.y + element.height / 2 + (lineIndex * lineHeight);
          currentX = element.x + element.width / 2;
        } else if ((element.id === 'sub-title' || element.id === 'main-title' || element.id === 'bottom-sub-title') && isInteractiveBanner) {
          // 인터랙티브 배너의 텍스트들만 중앙 정렬
          y = element.y + (lineIndex * lineHeight);
          currentX = element.x + element.width / 2;
        } else {
          // 나머지는 모두 왼쪽 정렬 (기본 배너, 전면 배너 등)
          y = element.y + (lineIndex * lineHeight);
          currentX = element.x;
        }
        
        // 버튼 텍스트는 간단하게 처리 (부분 색상 없음)
        if (element.id === 'button-text') {
          ctx.fillStyle = element.color;
          const displayText = line || 'Button'; // 텍스트가 없으면 기본값 표시
          if (element.letterSpacing) {
            drawTextWithLetterSpacing(ctx, displayText, currentX, y, element.letterSpacing);
          } else {
            ctx.fillText(displayText, currentX, y);
          }
        }
        // 부분 색상이 있는 경우 (buildRuns 사용)
        else if ((element.colorSegments && element.colorSegments.length > 0) || (element.previewSegments && element.previewSegments.length > 0)) {
          // 현재 줄의 시작 인덱스 계산
          const lineStart = lines.slice(0, lineIndex).join('\n').length + (lineIndex > 0 ? 1 : 0);
          
          // 인터랙티브 배너의 중앙 정렬인 경우 전체 텍스트 너비를 계산해서 시작 위치 조정
          if ((element.id === 'sub-title' || element.id === 'main-title' || element.id === 'bottom-sub-title') && isInteractiveBanner) {
            const totalWidth = element.letterSpacing 
              ? line.split('').reduce((sum, char, idx) => 
                  sum + ctx.measureText(char).width + (idx < line.length - 1 ? (element.letterSpacing || 0) : 0), 0)
              : ctx.measureText(line).width;
            currentX = currentX - totalWidth / 2;
          }
          
          // buildRuns를 사용하여 부분 색상 렌더링 (줄 단위)
          const runs = buildRuns(line, element.color, element.colorSegments, element.previewSegments);
          const lineRuns = runs.filter(run => run.line === lineIndex);
          console.debug('[RUNS]', { elementId: element.id, lineIndex, runsLength: lineRuns.length });
          let x = currentX;
          
          lineRuns.forEach(run => {
            ctx.fillStyle = run.color;
            if (element.letterSpacing) {
              drawTextWithLetterSpacing(ctx, run.text, x, y, element.letterSpacing);
            } else {
              ctx.fillText(run.text, x, y);
            }
            x += ctx.measureText(run.text).width;
          });
        } else {
          // 부분 색상이 없는 경우 전체 색상 또는 그라데이션으로 렌더링
          if (element.gradient) {
            // 좌→우 linearGradient
            const grad = ctx.createLinearGradient(element.x, element.y, element.x + element.width, element.y);
            grad.addColorStop(0, element.gradient.from);
            grad.addColorStop(1, element.gradient.to);
            ctx.fillStyle = grad;
          } else {
            ctx.fillStyle = element.color;
          }
          if (element.letterSpacing) {
            drawTextWithLetterSpacing(ctx, line, currentX, y, element.letterSpacing);
          } else {
            ctx.fillText(line, currentX, y);
          }
        }
      });
      }
      
      ctx.restore();
    });
  }, [config.name]);

  // 이미지/로고 캐싱용 useRef 추가 (URL도 함께 캐싱)
  const cachedBackgroundImg = useRef<{ src: string; url: string; img: HTMLImageElement } | null>(null);
  const cachedLogoImg = useRef<{ src: string; url: string; img: HTMLImageElement } | null>(null);
  const cachedMultiLogoImgs = useRef<{ src:string; url: string; img: HTMLImageElement }[]>([]);

  // drawBackground 함수 내 이미지/로고 로딩 최적화
  const drawBackground = useCallback(async (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    setIsLoading(true);
    if (onDrawStart) onDrawStart();
    
    if (isBasicBannerPC) {
      // 기본배너 PC: 2880×480 고정
      ctx.clearRect(0, 0, 2880, 480);
    } else {
      // 기타 배너: designSize 기준
      ctx.clearRect(0, 0, designSize.w, designSize.h);
    }

    // 배경 이미지
    const imageToUse = uploadedImage || existingImageUrl;
    let bgImg: HTMLImageElement | null = null;
    let bgSrc = '';
    let bgUrl = '';
    if (imageToUse) {
      bgSrc = uploadedImage ? (uploadedImage as File).name + (uploadedImage as File).size : (imageToUse as string);
      if (!cachedBackgroundImg.current || cachedBackgroundImg.current.src !== bgSrc) {
        if (cachedBackgroundImg.current && cachedBackgroundImg.current.url) {
          URL.revokeObjectURL(cachedBackgroundImg.current.url);
        }
        bgUrl = uploadedImage ? URL.createObjectURL(uploadedImage) : (imageToUse as string);
        const img = new window.Image();
        img.crossOrigin = 'anonymous';
        await new Promise<void>((resolve) => {
          img.onload = () => {
            cachedBackgroundImg.current = { src: bgSrc, url: bgUrl, img };
            resolve();
          };
          img.onerror = () => resolve();
          img.src = bgUrl;
        });
      }
      bgImg = cachedBackgroundImg.current?.img || null;
              if (bgImg) {
          // 이미지 비율 계산
          const imageRatio = bgImg.width / bgImg.height;
          let canvasRatio, drawWidth, drawHeight, offsetX, offsetY;
          
          if (isBasicBannerPC) {
            // 기본배너 PC: 2880×480 고정
            canvasRatio = 2880 / 480;
            drawWidth = 2880;
            drawHeight = 480;
            offsetX = 0;
            offsetY = 0;
            if (imageRatio > canvasRatio) {
              drawHeight = 2880 / imageRatio;
              offsetY = (480 - drawHeight) / 2;
            } else {
              drawWidth = 480 * imageRatio;
              offsetX = (2880 - drawWidth) / 2;
            }
          } else {
            // 기타 배너: designSize 기준
            canvasRatio = designSize.w / designSize.h;
            drawWidth = designSize.w;
            drawHeight = designSize.h;
            offsetX = 0;
            offsetY = 0;
            if (imageRatio > canvasRatio) {
              drawHeight = designSize.w / imageRatio;
              offsetY = (designSize.h - drawHeight) / 2;
            } else {
              drawWidth = designSize.h * imageRatio;
              offsetX = (designSize.w - drawWidth) / 2;
            }
          }
          ctx.drawImage(bgImg, offsetX, offsetY, drawWidth, drawHeight);
        }
    }

    // 단일 로고
    const logoToUse = uploadedLogo || existingLogoUrl;
    let logoImg: HTMLImageElement | null = null;
    let logoSrc = '';
    let logoUrl = '';
    if (logoToUse && config.logo) {
      logoSrc = uploadedLogo ? (uploadedLogo as File).name + (uploadedLogo as File).size : (logoToUse as string);
      if (!cachedLogoImg.current || cachedLogoImg.current.src !== logoSrc) {
        if (cachedLogoImg.current && cachedLogoImg.current.url) {
          URL.revokeObjectURL(cachedLogoImg.current.url);
        }
        logoUrl = uploadedLogo ? URL.createObjectURL(uploadedLogo) : (logoToUse as string);
        const img = new window.Image();
        img.crossOrigin = 'anonymous';
        await new Promise<void>((resolve) => {
          img.onload = () => {
            cachedLogoImg.current = { src: logoSrc, url: logoUrl, img };
            resolve();
          };
          img.onerror = () => resolve();
          img.src = logoUrl;
        });
      }
      logoImg = cachedLogoImg.current?.img || null;
      if (logoImg) {
        // 높이 logoHeight 고정, 비율에 맞는 너비 계산
        const fixedHeight = logoHeight || 56;
        const aspectRatio = logoImg.width / logoImg.height;
        const calculatedWidth = fixedHeight * aspectRatio;
        
        ctx.drawImage(
          logoImg,
          config.logo!.x,
          config.logo!.y,
          calculatedWidth,
          fixedHeight
        );
      }
    }

    // 다중 로고 (항공팀)
    const logosToUse = uploadedLogos.length > 0 ? uploadedLogos : existingLogoUrls;
    if (logosToUse.length > 0 && config.multiLogo) {
      // 캐싱된 로고 배열 초기화
      if (
        cachedMultiLogoImgs.current.length !== logosToUse.length ||
        cachedMultiLogoImgs.current.some((c, i) => {
          const src = logosToUse[i] instanceof File ? (logosToUse[i] as File).name + (logosToUse[i] as File).size : logosToUse[i] as string;
          return c.src !== src;
        })
      ) {
        // 기존 URL revoke
        cachedMultiLogoImgs.current.forEach(c => {
          if (c.url && c.url.startsWith('blob:')) URL.revokeObjectURL(c.url);
        });
        cachedMultiLogoImgs.current = await Promise.all(
          logosToUse.map(async (logo) => {
            const src = logo instanceof File ? (logo as File).name + (logo as File).size : (logo as string);
            const url = logo instanceof File ? URL.createObjectURL(logo) : (logo as string);
            const img = new window.Image();
            img.crossOrigin = 'anonymous';
            await new Promise<void>((resolve) => {
              img.onload = () => resolve();
              img.onerror = () => resolve();
              img.src = url;
            });
            return { src, url, img };
          })
        );
      }
      const validLogos = cachedMultiLogoImgs.current;
      if (validLogos.length > 0 && config.multiLogo) {
        const logoHe = logoHeight || config.multiLogo.maxHeight;
        const logoGap = config.multiLogo.logoGap ?? 16;
        const separatorWidth = config.multiLogo.separatorWidth ?? 4;
        const logoWidths = validLogos.map(({ img }) => {
          const aspectRatio = img.width / img.height;
          return logoHe * aspectRatio;
        });
        // 첫 번째 로고 기준 X, Y
        let currentX = config.multiLogo?.x ?? 0;
        const baseY = config.multiLogo?.y ?? 0;
        validLogos.forEach(({ img }, index) => {
          const logoWidth = logoWidths[index];
          // 로고 그리기
          ctx.drawImage(
            img,
            currentX,
            baseY,
            logoWidth,
            logoHe
          );
          currentX += logoWidth;
          // 마지막 로고가 아니면 구분자 그리기
          if (index < validLogos.length - 1 && config.multiLogo) {
            const separatorHeight = logoHe * 0.8;
            const separatorX = currentX + ((logoGap - separatorWidth) / 2);
            const separatorY = baseY + (logoHe - separatorHeight) / 2;
            ctx.fillStyle = '#FFFFFF'; // 흰색으로 변경
            ctx.fillRect(separatorX, separatorY, separatorWidth, separatorHeight);
            currentX += logoGap;
          }
        });
      }
    }

    // 배경이 모두 그려진 후 콜백 실행 (로딩 상태 종료)
    if (onDrawComplete) onDrawComplete();
    setIsLoading(false);
  }, [uploadedImage, uploadedLogo, uploadedLogos, existingImageUrl, existingLogoUrl, existingLogoUrls, config.logo, config.multiLogo, logoHeight, onDrawStart, onDrawComplete]);
  
  // 렌더링 로직 통합 (더블 버퍼링 적용)
  useEffect(() => {
    const visibleCanvas = (ref as RefObject<HTMLCanvasElement>).current;
    const offscreenCanvas = offscreenCanvasRef.current;
    if (!visibleCanvas || !offscreenCanvas) return;

    const visibleCtx = visibleCanvas.getContext('2d');
    const offscreenCtx = offscreenCanvas.getContext('2d');
    if (!visibleCtx || !offscreenCtx) return;

    const render = async () => {
      const dpr = window.devicePixelRatio || 1;
      
      if (isBasicBannerPC) {
        // 기본배너 PC: 2880×480 고정, DPR 반영
        // HTML 속성 width/height 설정으로 내부 픽셀 확정
        visibleCanvas.width = 2880 * dpr;
        visibleCanvas.height = 480 * dpr;
        visibleCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
        
        // 1. 모든 드로잉을 오프스크린 캔버스에서 수행
        await drawBackground(offscreenCtx, offscreenCanvas);
        drawTextElements(offscreenCtx, textElements);

        // 2. 완성된 결과물을 보이는 캔버스로 한번에 복사
        visibleCtx.clearRect(0, 0, 2880, 480);
        visibleCtx.drawImage(offscreenCanvas, 0, 0);
      } else {
        // 기타 배너: designSize 기준으로 DPR 반영하여 렌더링
        visibleCanvas.width = designSize.w * dpr;
        visibleCanvas.height = designSize.h * dpr;
        visibleCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
        
        // 1. 모든 드로잉을 오프스크린 캔버스에서 수행
        await drawBackground(offscreenCtx, offscreenCanvas);
        drawTextElements(offscreenCtx, textElements);

        // 2. 완성된 결과물을 보이는 캔버스로 한번에 복사
        visibleCtx.clearRect(0, 0, designSize.w, designSize.h);
        visibleCtx.drawImage(offscreenCanvas, 0, 0);
      }
    };

    render();
  }, [
    ref, 
    textElements, 
    drawTextElements, 
    drawBackground, 
    uploadedImage, 
    uploadedLogo, 
    uploadedLogos, 
    existingImageUrl, 
    existingLogoUrl, 
    existingLogoUrls, 
    logoHeight, 
    config
  ]);

  // 미리보기 컨테이너 크기 - CSS 스케일링만 적용
  const maxPreviewWidth = 600; // 좌측 70% 컨테이너에 맞는 크기
  const maxPreviewHeight = 400;
  
  // 컨테이너 크기 계산 (designSize 기준)
  const containerWidth = Math.min(designSize.w, maxPreviewWidth);
  const containerHeight = Math.min(designSize.h, maxPreviewHeight);
  
  // 미리보기 스케일 계산 (designSize 대비 컨테이너 크기)
  const previewScale = Math.min(containerWidth / designSize.w, containerHeight / designSize.h);
  
  // exportToImage 함수 - CSS 배율 무시하고 디자인 해상도로만 출력
  const exportToImage = (format: 'image/jpeg' | 'image/png' = 'image/jpeg', quality: number = 0.92): string => {
    const canvas = document.createElement('canvas');
    const dpr = window.devicePixelRatio || 1;
    
    if (isBasicBannerPC) {
      // 기본배너 PC: 2880×480 고정, DPR 반영
      // HTML 속성 width/height 설정으로 내부 픽셀 확정
      canvas.width = 2880 * dpr;
      canvas.height = 480 * dpr;
    } else {
      // 기타 배너: designSize 기준, DPR 반영
      canvas.width = designSize.w * dpr;
      canvas.height = designSize.h * dpr;
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas context를 생성할 수 없습니다.');
    }
    
    // DPR 변환 적용
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    
    // 오프스크린 캔버스에서 렌더링
    if (offscreenCanvasRef.current) {
      ctx.drawImage(offscreenCanvasRef.current, 0, 0);
    }
    
    return canvas.toDataURL(format, quality);
  };


  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      <h2 className="text-lg font-semibold mb-3">
        미리보기
      </h2>
      <div className="flex justify-center items-center bg-gray-50 rounded-lg p-4 overflow-hidden">
        <div 
          className="relative" 
          style={{ 
            width: containerWidth, 
            height: containerHeight,
            boxSizing: 'border-box',
            overflow: 'hidden'
          }}
        >
          <canvas
            ref={ref}
            className="border-2 border-gray-300 rounded-lg shadow-sm w-full h-auto"
            style={{
              backgroundColor: '#f8f9fa'
            }}
          />
          {isLoading && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'rgba(255,255,255,0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 20,
              fontSize: 24,
              fontWeight: 'bold',
              color: '#2563eb',
              borderRadius: 12
            }}>
              로딩중...
            </div>
          )}
          {/* 드래그 리사이즈 핸들 (오른쪽 아래) */}
          {(uploadedLogo || (uploadedLogos && uploadedLogos.length > 0)) && (
            <div
              style={{
                position: 'absolute',
                left: handleX * previewScale,
                top: handleY * previewScale,
                width: handleW,
                height: handleH,
                cursor: 'nwse-resize',
                zIndex: 10,
                background: dragging ? '#2563eb' : '#fff',
                border: '2px solid #2563eb',
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
              }}
              onMouseDown={onHandleMouseDown}
            >
              <svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 10h8M10 10V2" stroke="#2563eb" strokeWidth="2" strokeLinecap="round"/></svg>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});