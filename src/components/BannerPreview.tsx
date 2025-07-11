// BannerPreview.tsx 수정
import React, { useEffect, RefObject, useCallback, useRef, useState } from 'react';
import { BannerConfig, TextElement } from '../types';
import { drawTextWithLetterSpacing } from '../utils/canvasUtils';

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
  const backgroundImageRef = useRef<ImageData | null>(null);
  // 드래그 상태
  const [dragging, setDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState<number | null>(null);
  const [startHeight, setStartHeight] = useState<number>(logoHeight || 56);
  // 이미지 로딩 상태
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
      
      // 폰트 두께 설정 (기본값 400)
      const fontWeight = element.fontWeight || 400;
      ctx.font = `${fontWeight} ${element.fontSize}px Pretendard`;
      ctx.textBaseline = 'top'; // 텍스트의 기준선을 상단으로 설정
      
      // 텍스트 정렬 설정
      const isInteractiveBanner = config.name === '인터랙티브';
      
      if (element.id === 'button-text') {
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
      } else if ((element.id === 'sub-title' || element.id === 'main-title') && isInteractiveBanner) {
        // 인터랙티브 배너의 서브타이틀과 메인타이틀만 중앙 정렬
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
      } else {
        // 나머지는 모두 왼쪽 정렬 (기본 배너, 전면 배너 등)
        ctx.textAlign = 'start';
        ctx.textBaseline = 'top';
      }
      
      // 줄바꿈 처리
      const lines = element.text.split('\n');
      const lineHeight = element.fontSize * 1.2; // 줄 간격 설정
      
      lines.forEach((line, lineIndex) => {
        let y, currentX;
        
        if (element.id === 'button-text') {
          // 버튼 텍스트는 가운데 정렬
          y = element.y + element.height / 2 + (lineIndex * lineHeight);
          currentX = element.x + element.width / 2;
        } else if ((element.id === 'sub-title' || element.id === 'main-title') && isInteractiveBanner) {
          // 인터랙티브 배너의 서브타이틀과 메인타이틀만 중앙 정렬
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
        // 부분 색상이 있는 경우
        else if (element.colorSegments && element.colorSegments.length > 0) {
          // 현재 줄의 시작 인덱스 계산
          const lineStart = lines.slice(0, lineIndex).join('\n').length + (lineIndex > 0 ? 1 : 0);
          
          // 인터랙티브 배너의 중앙 정렬인 경우 전체 텍스트 너비를 계산해서 시작 위치 조정
          if ((element.id === 'sub-title' || element.id === 'main-title') && isInteractiveBanner) {
            const totalWidth = element.letterSpacing 
              ? line.split('').reduce((sum, char, idx) => 
                  sum + ctx.measureText(char).width + (idx < line.length - 1 ? (element.letterSpacing || 0) : 0), 0)
              : ctx.measureText(line).width;
            currentX = currentX - totalWidth / 2;
          }
          
          let lastIndex = 0;
          
          for (let i = 0; i < line.length; i++) {
            const globalIndex = lineStart + i;
            
            // 이 위치에 적용되는 색상 세그먼트 찾기
            const segment = element.colorSegments.find(seg => 
              globalIndex >= seg.start && globalIndex < seg.end
            );
            
            const nextChar = line[i + 1];
            const nextGlobalIndex = globalIndex + 1;
            const nextSegment = element.colorSegments.find(seg => 
              nextGlobalIndex >= seg.start && nextGlobalIndex < seg.end
            );
            
            // 색상이 바뀌거나 마지막 글자인 경우 렌더링
            if (!nextChar || segment?.color !== nextSegment?.color) {
              const textPart = line.substring(lastIndex, i + 1);
              ctx.fillStyle = segment?.color || element.color;
              
              // letterSpacing 적용
              if (element.letterSpacing) {
                drawTextWithLetterSpacing(ctx, textPart, currentX, y, element.letterSpacing);
                // letterSpacing이 적용된 텍스트의 너비 계산
                let partWidth = 0;
                for (let j = 0; j < textPart.length; j++) {
                  partWidth += ctx.measureText(textPart[j]).width + (j < textPart.length - 1 ? element.letterSpacing : 0);
                }
                currentX += partWidth;
              } else {
                ctx.fillText(textPart, currentX, y);
                currentX += ctx.measureText(textPart).width;
              }
              lastIndex = i + 1;
            }
          }
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
      
      ctx.restore();
    });
  }, [config.name]);

  // 이미지/로고 캐싱용 useRef 추가
  const cachedBackgroundImg = useRef<{ src: string; img: HTMLImageElement } | null>(null);
  const cachedLogoImg = useRef<{ src: string; img: HTMLImageElement } | null>(null);
  const cachedMultiLogoImgs = useRef<{ src: string; img: HTMLImageElement }[]>([]);

  // drawBackground 함수 내 이미지/로고 로딩 최적화
  const drawBackground = useCallback(async (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    if (onDrawStart) onDrawStart();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 배경 이미지
    const imageToUse = uploadedImage || existingImageUrl;
    let bgImg: HTMLImageElement | null = null;
    let bgSrc = '';
    if (imageToUse) {
      bgSrc = uploadedImage ? URL.createObjectURL(uploadedImage) : (imageToUse as string);
      if (!cachedBackgroundImg.current || cachedBackgroundImg.current.src !== bgSrc) {
        const img = new window.Image();
        img.crossOrigin = 'anonymous';
        await new Promise<void>((resolve) => {
          img.onload = () => {
            cachedBackgroundImg.current = { src: bgSrc, img };
            resolve();
          };
          img.onerror = () => resolve();
          img.src = bgSrc;
        });
      }
      bgImg = cachedBackgroundImg.current?.img || null;
      if (bgImg) {
        // 이미지 비율 계산
        const imageRatio = bgImg.width / bgImg.height;
        const canvasRatio = canvas.width / canvas.height;
        let drawWidth = canvas.width;
        let drawHeight = canvas.height;
        let offsetX = 0;
        let offsetY = 0;
        if (imageRatio > canvasRatio) {
          drawHeight = canvas.width / imageRatio;
          offsetY = (canvas.height - drawHeight) / 2;
        } else {
          drawWidth = canvas.height * imageRatio;
          offsetX = (canvas.width - drawWidth) / 2;
        }
        ctx.drawImage(bgImg, offsetX, offsetY, drawWidth, drawHeight);
      }
    }

    // 단일 로고
    const logoToUse = uploadedLogo || existingLogoUrl;
    let logoImg: HTMLImageElement | null = null;
    let logoSrc = '';
    if (logoToUse && config.logo) {
      logoSrc = uploadedLogo ? URL.createObjectURL(uploadedLogo) : (logoToUse as string);
      if (!cachedLogoImg.current || cachedLogoImg.current.src !== logoSrc) {
        const img = new window.Image();
        img.crossOrigin = 'anonymous';
        await new Promise<void>((resolve) => {
          img.onload = () => {
            cachedLogoImg.current = { src: logoSrc, img };
            resolve();
          };
          img.onerror = () => resolve();
          img.src = logoSrc;
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
      if (cachedMultiLogoImgs.current.length !== logosToUse.length ||
          cachedMultiLogoImgs.current.some((c, i) => {
            const src = logosToUse[i] instanceof File ? URL.createObjectURL(logosToUse[i] as File) : logosToUse[i] as string;
            return c.src !== src;
          })) {
        cachedMultiLogoImgs.current = await Promise.all(
          logosToUse.map(async (logo) => {
            const src = logo instanceof File ? URL.createObjectURL(logo) : (logo as string);
            const img = new window.Image();
            img.crossOrigin = 'anonymous';
            await new Promise<void>((resolve) => {
              img.onload = () => resolve();
              img.onerror = () => resolve();
              img.src = src;
            });
            return { src, img };
          })
        );
      }
      const validLogos = cachedMultiLogoImgs.current;
      if (validLogos.length > 0 && config.multiLogo) {
        const logoHe = logoHeight || config.multiLogo.maxHeight;
        const logoWidths = validLogos.map(({ img }) => {
          const aspectRatio = img.width / img.height;
          return logoHe * aspectRatio;
        });

        // 전체 너비 계산 (로고 너비들 + 구분자들)
        const totalLogoWidth = logoWidths.reduce((sum, width) => sum + width, 0);
        const totalSeparatorWidth = (validLogos.length - 1) * (config.multiLogo?.logoGap ?? 0);
        const totalWidth = totalLogoWidth + totalSeparatorWidth;

        // 시작 X 위치 (왼쪽 정렬)
        let currentX = config.multiLogo?.x ?? 0;

        // 각 로고 그리기
        validLogos.forEach(({ img }, index) => {
          const logoWidth = logoWidths[index];
          
          // 로고 그리기
          ctx.drawImage(
            img,
            currentX,
            config.multiLogo?.y ?? 0,
            logoWidth,
            logoHe
          );

          currentX += logoWidth;

          // 마지막 로고가 아니면 구분자 그리기
          if (index < validLogos.length - 1 && config.multiLogo) {
            const separatorX = currentX + ((config.multiLogo.logoGap - config.multiLogo.separatorWidth) / 2);
            const separatorY = (config.multiLogo.y ?? 0) + logoHe * 0.2;
            const separatorHeight = logoHe * 0.6;

            // 세로선 구분자 그리기
            ctx.fillStyle = '#6B7280'; // 회색 구분자
            ctx.fillRect(separatorX, separatorY, config.multiLogo.separatorWidth, separatorHeight);

            currentX += config.multiLogo.logoGap;
          }
        });
      }
    }

    // 배경 이미지 데이터 저장 (텍스트 렌더링 최적화용)
    backgroundImageRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
    if (onDrawComplete) onDrawComplete();
  }, [uploadedImage, uploadedLogo, uploadedLogos, existingImageUrl, existingLogoUrl, existingLogoUrls, config.logo, config.multiLogo, logoHeight, onDrawStart, onDrawComplete]);

  // drawBackground useEffect 최적화: config.width, config.height, drawBackground 등 불필요한 의존성 제거
  useEffect(() => {
    const canvas = (ref as RefObject<HTMLCanvasElement>).current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawBackground(ctx, canvas).then(() => {
      drawTextElements(ctx, textElements);
    });
  }, [uploadedImage, uploadedLogo, uploadedLogos, existingImageUrl, existingLogoUrl, existingLogoUrls, config.logo, config.multiLogo, logoHeight]);

  // 3. When text changes, only update text, never set isLoading
  useEffect(() => {
    const canvas = (ref as RefObject<HTMLCanvasElement>).current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    if (backgroundImageRef.current) {
      ctx.putImageData(backgroundImageRef.current, 0, 0);
      drawTextElements(ctx, textElements);
    }
  }, [textElements, drawTextElements]);

  // 미리보기 프레임 크기 계산 - 컨테이너에 맞게 조정
  const maxPreviewWidth = 600; // 좌측 70% 컨테이너에 맞는 크기
  const maxPreviewHeight = 400;
  
  const scaleByWidth = maxPreviewWidth / config.width;
  const scaleByHeight = maxPreviewHeight / config.height;
  const previewScale = Math.min(scaleByWidth, scaleByHeight, 1); // 1을 넘지 않도록
  
  const previewWidth = config.width * previewScale;
  const previewHeight = config.height * previewScale;

  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      <h2 className="text-lg font-semibold mb-3">
        미리보기
        <span className="text-sm text-gray-500 ml-2">
          ({config.width} × {config.height})
        </span>
      </h2>
      <div className="flex justify-center items-center bg-gray-50 rounded-lg p-4">
        <div className="relative" style={{ width: previewWidth, height: previewHeight }}>
          <canvas
            ref={ref}
            width={config.width}
            height={config.height}
            className="border-2 border-gray-300 rounded-lg shadow-sm w-full h-full"
            style={{
              width: '100%',
              height: '100%',
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              backgroundColor: '#f8f9fa'
            }}
          />
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