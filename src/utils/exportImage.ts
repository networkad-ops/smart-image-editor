import { BannerConfig, TextElement } from '../types';
import { drawTextWithLetterSpacing } from './canvasUtils';
import { buildRuns } from './textSegments';

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

// 각 배너의 실제 해상도 사용 (함수 내에서 config로부터 가져옴)

interface ExportOptions {
  scale?: number;
  format?: 'image/jpeg' | 'image/png';
  quality?: number;
}

// 오프스크린 캔버스 기반 배너 내보내기 함수
export const exportBanner = async (
  config: BannerConfig,
  textElements: TextElement[],
  uploadedImage: File | null,
  uploadedLogo?: File | null,
  uploadedLogos?: File[],
  existingImageUrl?: string | null,
  existingLogoUrl?: string | null,
  existingLogoUrls?: string[],
  logoHeight?: number,
  options: ExportOptions = {}
): Promise<Blob> => {
  const { scale = 1, format = 'image/jpeg', quality = 0.92 } = options;
  
  // 웹폰트 로딩 완료 대기
  await document.fonts.ready;
  
  // 오프스크린 캔버스 생성
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas context를 생성할 수 없습니다.');
  }
  
  // 캔버스 크기 설정 (각 배너의 실제 해상도 사용)
  canvas.width = config.width * scale;
  canvas.height = config.height * scale;
  
  // 스케일 적용 (좌표계는 기준 해상도 유지)
  ctx.scale(scale, scale);
  
  // 배경 렌더링
  await drawBackground(ctx, config, uploadedImage, existingImageUrl);
  
  // 로고 렌더링
  await drawLogo(ctx, config, uploadedLogo, uploadedLogos, existingLogoUrl, existingLogoUrls, logoHeight);
  
  // 텍스트 렌더링
  drawTextElements(ctx, textElements, config);
  
  // Blob으로 변환
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('이미지 생성에 실패했습니다.'));
      }
    }, format, quality);
  });
};

// 배경 이미지 그리기
const drawBackground = async (
  ctx: CanvasRenderingContext2D,
  config: BannerConfig,
  uploadedImage: File | null,
  existingImageUrl?: string | null
): Promise<void> => {
  const imageToUse = uploadedImage || existingImageUrl;
  if (!imageToUse) return;
  
  const img = new Image();
  img.crossOrigin = 'anonymous';
  
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('이미지 로딩에 실패했습니다.'));
    img.src = uploadedImage ? URL.createObjectURL(uploadedImage) : (imageToUse as string);
  });
  
  // 이미지 비율 계산하여 전체 화면에 맞추기
  const imageRatio = img.width / img.height;
  const canvasRatio = config.width / config.height;
  let drawWidth = config.width;
  let drawHeight = config.height;
  let offsetX = 0;
  let offsetY = 0;
  
  if (imageRatio > canvasRatio) {
    drawHeight = config.width / imageRatio;
    offsetY = (config.height - drawHeight) / 2;
  } else {
    drawWidth = config.height * imageRatio;
    offsetX = (config.width - drawWidth) / 2;
  }
  
  ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
  
  // URL 정리
  if (uploadedImage) {
    URL.revokeObjectURL(img.src);
  }
};

// 로고 그리기
const drawLogo = async (
  ctx: CanvasRenderingContext2D,
  config: BannerConfig,
  uploadedLogo?: File | null,
  uploadedLogos?: File[],
  existingLogoUrl?: string | null,
  existingLogoUrls?: string[],
  logoHeight?: number
): Promise<void> => {
  // 단일 로고
  const logoToUse = uploadedLogo || existingLogoUrl;
  if (logoToUse && config.logo) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('로고 이미지 로딩에 실패했습니다.'));
      img.src = uploadedLogo ? URL.createObjectURL(uploadedLogo) : (logoToUse as string);
    });
    
    // 높이 고정, 비율에 맞는 너비 계산
    const fixedHeight = logoHeight || 56;
    const aspectRatio = img.width / img.height;
    const calculatedWidth = fixedHeight * aspectRatio;
    
    ctx.drawImage(
      img,
      config.logo.x,
      config.logo.y,
      calculatedWidth,
      fixedHeight
    );
    
    // URL 정리
    if (uploadedLogo) {
      URL.revokeObjectURL(img.src);
    }
  }
  
  // 다중 로고 (항공팀)
  const logosToUse = uploadedLogos && uploadedLogos.length > 0 ? uploadedLogos : existingLogoUrls;
  if (logosToUse && logosToUse.length > 0 && config.multiLogo) {
    const logoImgs = await Promise.all(
      logosToUse.map(async (logo) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error('다중 로고 이미지 로딩에 실패했습니다.'));
          img.src = logo instanceof File ? URL.createObjectURL(logo) : (logo as string);
        });
        
        return { img, isFile: logo instanceof File, src: img.src };
      })
    );
    
    const logoHe = logoHeight || config.multiLogo.maxHeight;
    const logoGap = config.multiLogo.logoGap ?? 16;
    const separatorWidth = config.multiLogo.separatorWidth ?? 4;
    
    const logoWidths = logoImgs.map(({ img }) => {
      const aspectRatio = img.width / img.height;
      return logoHe * aspectRatio;
    });
    
    // 첫 번째 로고 기준 X, Y
    let currentX = config.multiLogo.x ?? 0;
    const baseY = config.multiLogo.y ?? 0;
    
    logoImgs.forEach(({ img, isFile, src }, index) => {
      const logoWidth = logoWidths[index];
      
      // 로고 그리기
      ctx.drawImage(img, currentX, baseY, logoWidth, logoHe);
      currentX += logoWidth;
      
      // 마지막 로고가 아니면 구분자 그리기
      if (index < logoImgs.length - 1) {
        const separatorHeight = logoHe * 0.8;
        const separatorX = currentX + ((logoGap - separatorWidth) / 2);
        const separatorY = baseY + (logoHe - separatorHeight) / 2;
        
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(separatorX, separatorY, separatorWidth, separatorHeight);
        currentX += logoGap;
      }
      
      // URL 정리
      if (isFile) {
        URL.revokeObjectURL(src);
      }
    });
  }
};

// 텍스트 요소 그리기
const drawTextElements = (
  ctx: CanvasRenderingContext2D,
  textElements: TextElement[],
  config: BannerConfig
): void => {
  
  textElements.forEach(element => {
    ctx.save();
    
    // 버튼 텍스트인 경우 배경 그리기
    if (element.id === 'button-text') {
      const buttonX = element.x;
      const buttonY = element.y;
      const buttonWidth = element.width;
      const buttonHeight = element.height;
      const borderRadius = 20;
      
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

    // CTA 버튼인 경우 배경 그리기 (popup 배너에서만)
    if (element.id === 'cta-button' && config.dbType === 'popup') {
      const buttonX = element.x;
      const buttonY = element.y;
      const buttonWidth = element.width;
      const buttonHeight = element.height;
      const borderRadius = 8;  // CTA 버튼의 둥근 모서리

      // CTA 버튼 배경색
      const backgroundColor = element.backgroundColor || 'transparent';
      if (backgroundColor !== 'transparent') {
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
        ctx.lineTo(buttonX, buttonY + buttonHeight - borderRadius);
        ctx.quadraticCurveTo(buttonX, buttonY, buttonX + borderRadius, buttonY);
        ctx.closePath();
        ctx.fill();

        // CTA 버튼 그림자 효과
        ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
        ctx.shadowBlur = 6;
        ctx.shadowOffsetY = 3;
        ctx.fill();
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;
      }
    }
    
    // 폰트 설정 (fontPxAtBase 우선 사용)
    const fontWeight = element.fontWeight || 400;
    const finalFontSize = element.fontPxAtBase || element.fontSize;
    ctx.font = `${fontWeight} ${finalFontSize}px Pretendard`;
    ctx.textBaseline = 'top';
    
    // 텍스트 정렬 설정
    const isInteractiveBanner = config.name.includes('인터랙티브');
    
    if (element.id === 'button-text') {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
    } else if (element.id === 'cta-button') {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
    } else if ((element.id === 'sub-title' || element.id === 'main-title' || element.id === 'bottom-sub-title') && isInteractiveBanner) {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
    } else {
      ctx.textAlign = 'start';
      ctx.textBaseline = 'top';
    }
    
    // 줄바꿈 처리 (maxLines 제한 적용) - \r\n도 \n으로 통일하여 처리
    const lines = element.text.replace(/\r\n/g, '\n').split('\n');
    
    // 메인타이틀인 경우 특별 처리 (2줄까지 허용)
    if (element.id === 'main-title') {
      const normalizedText = textNormalize(element.text);
      const lines = normalizedText.split('\n').slice(0, 2);
      const lineHeight = (config.mainTitle?.lineHeight ?? (finalFontSize * 1.24));
      ctx.textBaseline = 'top';
      
      lines.forEach((line, lineIndex) => {
        const y = element.y + (lineIndex * lineHeight);
        const letterSpacing = finalFontSize * -0.02; // -2% 자간
        
        // 해당 줄의 세그먼트 필터링
        const lineColorSegments = (element.colorSegments || []).filter(s => s.line === lineIndex);
        const linePreviewSegments = (element.previewSegments || []).filter(s => s.line === lineIndex);
        
        // buildRunsForLine을 사용하여 부분 색상 렌더링
        const runs = buildRunsForLine(line, lineColorSegments, linePreviewSegments, element.color);
        
        // 메인타이틀: 팝업 배너일 때만 중앙 정렬, 아니면 좌측 정렬
        let x;
        if (config.dbType === 'popup') {
          // 팝업 배너: 수동으로 중앙 정렬 계산
          const totalRunsWidth = runs.reduce((sum, run) => {
            if (letterSpacing !== 0) {
              return sum + run.text.split('').reduce((runSum, char, idx) =>
                runSum + ctx.measureText(char).width + (idx < run.text.length - 1 ? letterSpacing : 0), 0);
            } else {
              return sum + ctx.measureText(run.text).width;
            }
          }, 0);
          x = (element.x + element.width / 2) - totalRunsWidth / 2;
        } else {
          // 팝업이 아닌 경우: 좌측 정렬
          x = element.x;
        }
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
    } else if (element.id === 'cta-button') {
      // CTA 버튼은 단일 줄이므로 별도 처리 (popup 배너에서만)
      if (config.dbType === 'popup' && element.text && element.text.trim() !== '') {
        ctx.fillStyle = element.color || '#000000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const centerX = element.x + element.width / 2;
        const centerY = element.y + element.height / 2;
        if (element.letterSpacing) {
          drawTextWithLetterSpacing(ctx, element.text, centerX, centerY, element.letterSpacing);
        } else {
          ctx.fillText(element.text, centerX, centerY);
        }
      }
    } else {
      // 다른 텍스트 요소들은 기존 maxLines 제한 적용 (서브타이틀은 1줄)
      const maxLines = element.id === 'sub-title' ? 1 : (config.mainTitle?.maxLines || config.subTitle?.maxLines || config.bottomSubTitle?.maxLines || 1);
      const limitedLines = lines.slice(0, maxLines);
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
        y = element.y + element.height / 2 + (lineIndex * lineHeight);
        currentX = element.x + element.width / 2;
      } else if ((element.id === 'sub-title' || element.id === 'main-title' || element.id === 'bottom-sub-title') && isInteractiveBanner) {
        y = element.y + (lineIndex * lineHeight);
        currentX = element.x + element.width / 2;
      } else if (element.id === 'sub-title' || element.id === 'main-title' || element.id === 'bottom-sub-title') {
        // 메인타이틀은 팝업 배너일 때만 중앙 정렬, 서브타이틀과 bottom-sub-title은 팝업 배너일 때만 중앙 정렬
        y = element.y + (lineIndex * lineHeight);
        if (element.id === 'main-title' && config.dbType === 'popup') {
          // 팝업 메인타이틀: 수동으로 중앙 정렬 계산
          const totalWidth = ctx.measureText(line).width;
          currentX = (element.x + element.width / 2) - totalWidth / 2;
        } else if (config.dbType === 'popup' && (element.id === 'sub-title' || element.id === 'bottom-sub-title')) {
          // 팝업 서브타이틀: 수동으로 중앙 정렬 계산
          const totalWidth = ctx.measureText(line).width;
          currentX = (element.x + element.width / 2) - totalWidth / 2;
        } else {
          // 팝업이 아닌 경우: 좌측 정렬
          currentX = element.x;
        }
      } else {
        y = element.y + (lineIndex * lineHeight);
        currentX = element.x;
      }
      
      // 부분 색상 렌더링 시 textAlign을 start로 설정
      ctx.textAlign = 'start';
      
      // 버튼 텍스트 간단 처리
      if (element.id === 'button-text') {
        ctx.fillStyle = element.color;
        const displayText = line || 'Button';
        if (element.letterSpacing) {
          drawTextWithLetterSpacing(ctx, displayText, currentX, y, element.letterSpacing);
        } else {
          ctx.fillText(displayText, currentX, y);
        }
      }
      // 부분 색상이 있는 경우 (buildRuns 사용)
      else if ((element.colorSegments && element.colorSegments.length > 0) || (element.previewSegments && element.previewSegments.length > 0)) {
        const lineStart = lines.slice(0, lineIndex).join('\n').length + (lineIndex > 0 ? 1 : 0);
        
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
        // 부분 색상이 없는 경우
        if (element.gradient) {
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
};

