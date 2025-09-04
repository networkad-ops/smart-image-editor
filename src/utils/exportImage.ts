import { BannerConfig, TextElement } from '../types';
import { drawTextWithLetterSpacing } from './canvasUtils';

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
      const maxLines = 2;
      const limitedLines = lines.slice(0, maxLines);
      const lineHeight = finalFontSize * 1.24; // 124% 행간
      ctx.textBaseline = 'top';
      limitedLines.forEach((line, lineIndex) => {
        const y = element.y + (lineIndex * lineHeight);
        const currentX = element.x;
        const letterSpacing = finalFontSize * -0.02; // -2% 자간
        
        // 색상 설정
        ctx.fillStyle = element.color;
        
        if (letterSpacing !== 0) {
          drawTextWithLetterSpacing(ctx, line || ' ', currentX, y, letterSpacing);
        } else {
          ctx.fillText(line || ' ', currentX, y);
        }
      });
    } else {
      // 다른 텍스트 요소들은 기존 maxLines 제한 적용 (서브타이틀은 1줄)
      const maxLines = element.id === 'sub-title' ? 1 : (config.mainTitle?.maxLines || config.subTitle?.maxLines || config.bottomSubTitle?.maxLines || 1);
      const limitedLines = lines.slice(0, maxLines);
      const lineHeight = finalFontSize * 1.2;
      
      limitedLines.forEach((line, lineIndex) => {
      let y, currentX;
      
      if (element.id === 'button-text') {
        y = element.y + element.height / 2 + (lineIndex * lineHeight);
        currentX = element.x + element.width / 2;
      } else if ((element.id === 'sub-title' || element.id === 'main-title' || element.id === 'bottom-sub-title') && isInteractiveBanner) {
        y = element.y + (lineIndex * lineHeight);
        currentX = element.x + element.width / 2;
      } else {
        y = element.y + (lineIndex * lineHeight);
        currentX = element.x;
      }
      
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
      // 부분 색상이 있는 경우
      else if (element.colorSegments && element.colorSegments.length > 0) {
        const lineStart = lines.slice(0, lineIndex).join('\n').length + (lineIndex > 0 ? 1 : 0);
        
        if ((element.id === 'sub-title' || element.id === 'main-title' || element.id === 'bottom-sub-title') && isInteractiveBanner) {
          const totalWidth = element.letterSpacing 
            ? line.split('').reduce((sum, char, idx) => 
                sum + ctx.measureText(char).width + (idx < line.length - 1 ? (element.letterSpacing || 0) : 0), 0)
            : ctx.measureText(line).width;
          currentX = currentX - totalWidth / 2;
        }
        
        let lastIndex = 0;
        
        for (let i = 0; i < line.length; i++) {
          const globalIndex = lineStart + i;
          
          const segment = element.colorSegments.find(seg => 
            globalIndex >= seg.start && globalIndex < seg.end
          );
          
          const nextChar = line[i + 1];
          const nextGlobalIndex = globalIndex + 1;
          const nextSegment = element.colorSegments.find(seg => 
            nextGlobalIndex >= seg.start && nextGlobalIndex < seg.end
          );
          
          if (!nextChar || segment?.color !== nextSegment?.color) {
            const textPart = line.substring(lastIndex, i + 1);
            ctx.fillStyle = segment?.color || element.color;
            
            if (element.letterSpacing) {
              drawTextWithLetterSpacing(ctx, textPart, currentX, y, element.letterSpacing);
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

