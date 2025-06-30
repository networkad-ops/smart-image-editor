// BannerPreview.tsx 수정
import React, { useEffect, RefObject, useCallback, useRef } from 'react';
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
}

export const BannerPreview = React.forwardRef<HTMLCanvasElement, BannerPreviewProps>(({
  config,
  uploadedImage,
  uploadedLogo,
  uploadedLogos = [],
  textElements,
  existingImageUrl,
  existingLogoUrl,
  existingLogoUrls = []
}, ref) => {
  const backgroundImageRef = useRef<ImageData | null>(null);

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
          // 부분 색상이 없는 경우 전체 색상으로 렌더링
          ctx.fillStyle = element.color;
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

  // 배경과 로고를 그리는 함수
  const drawBackground = useCallback(async (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    // 캔버스 초기화
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const imageToUse = uploadedImage || existingImageUrl;
    
    if (imageToUse) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          // 이미지 비율 계산
          const imageRatio = img.width / img.height;
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

          ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
          resolve();
        };
        
        img.onerror = () => resolve(); // 이미지 로드 실패해도 계속 진행
        
        if (uploadedImage) {
          img.src = URL.createObjectURL(uploadedImage);
        } else {
          img.src = imageToUse as string;
        }
      });
    }

    // 단일 로고 그리기
    const logoToUse = uploadedLogo || existingLogoUrl;
    if (logoToUse && config.logo) {
      const logoImg = new Image();
      logoImg.crossOrigin = 'anonymous';
      
      await new Promise<void>((resolve) => {
        logoImg.onload = () => {
          // 높이 56고정, 비율에 맞는 너비 계산
          const fixedHeight = 56;
          const aspectRatio = logoImg.width / logoImg.height;
          const calculatedWidth = fixedHeight * aspectRatio;
          
          ctx.drawImage(
            logoImg,
            config.logo!.x,
            config.logo!.y,
            calculatedWidth,
            fixedHeight
          );
          resolve();
        };
        logoImg.onerror = () => resolve();
        
        if (uploadedLogo) {
          logoImg.src = URL.createObjectURL(uploadedLogo);
        } else {
          logoImg.src = logoToUse as string;
        }
      });
    }

    // 다중 로고 그리기 (항공팀용)
    const logosToUse = uploadedLogos.length > 0 ? uploadedLogos : existingLogoUrls;
    if (logosToUse.length > 0 && config.multiLogo) {
      const logoImages = await Promise.all(
        logosToUse.map((logo, index) => {
          return new Promise<{ img: HTMLImageElement; index: number } | null>((resolve) => {
            const logoImg = new Image();
            logoImg.crossOrigin = 'anonymous';
            
            logoImg.onload = () => resolve({ img: logoImg, index });
            logoImg.onerror = () => resolve(null);
            
            if (logo instanceof File) {
              logoImg.src = URL.createObjectURL(logo);
            } else {
              logoImg.src = logo as string;
            }
          });
        })
      );

      // 로고 배치 계산
      const validLogos = logoImages.filter(item => item !== null) as { img: HTMLImageElement; index: number }[];
      if (validLogos.length > 0) {
        // 각 로고의 너비 계산 (높이 고정)
        const logoWidths = validLogos.map(({ img }) => {
          const aspectRatio = img.width / img.height;
          return config.multiLogo!.maxHeight * aspectRatio;
        });

        // 전체 너비 계산 (로고 너비들 + 구분자들)
        const totalLogoWidth = logoWidths.reduce((sum, width) => sum + width, 0);
        const totalSeparatorWidth = (validLogos.length - 1) * config.multiLogo!.logoGap;
        const totalWidth = totalLogoWidth + totalSeparatorWidth;

        // 시작 X 위치 (중앙 정렬)
        let currentX = config.multiLogo!.x + (config.multiLogo!.width - totalWidth) / 2;

        // 각 로고 그리기
        validLogos.forEach(({ img }, index) => {
          const logoWidth = logoWidths[index];
          
          // 로고 그리기
          ctx.drawImage(
            img,
            currentX,
            config.multiLogo!.y,
            logoWidth,
            config.multiLogo!.maxHeight
          );

          currentX += logoWidth;

          // 마지막 로고가 아니면 구분자 그리기
          if (index < validLogos.length - 1) {
            const separatorX = currentX + (config.multiLogo!.logoGap - config.multiLogo!.separatorWidth) / 2;
            const separatorY = config.multiLogo!.y + config.multiLogo!.maxHeight * 0.2;
            const separatorHeight = config.multiLogo!.maxHeight * 0.6;

            // 세로선 구분자 그리기
            ctx.fillStyle = '#6B7280'; // 회색 구분자
            ctx.fillRect(separatorX, separatorY, config.multiLogo!.separatorWidth, separatorHeight);

            currentX += config.multiLogo!.logoGap;
          }
        });
      }
    }

    // 배경 이미지 데이터 저장 (텍스트 렌더링 최적화용)
    backgroundImageRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
  }, [uploadedImage, uploadedLogo, uploadedLogos, existingImageUrl, existingLogoUrl, existingLogoUrls, config.logo, config.multiLogo]);

  // 배경 이미지나 로고가 변경될 때만 실행
  useEffect(() => {
    const canvas = (ref as RefObject<HTMLCanvasElement>).current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawBackground(ctx, canvas).then(() => {
      drawTextElements(ctx, textElements);
    });
  }, [uploadedImage, uploadedLogo, uploadedLogos, existingImageUrl, existingLogoUrl, existingLogoUrls, config.width, config.height, drawBackground, drawTextElements]);

  // 텍스트만 변경될 때 실행 (배경 다시 그리지 않음)
  useEffect(() => {
    const canvas = (ref as RefObject<HTMLCanvasElement>).current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 저장된 배경 이미지가 있으면 복원 후 텍스트만 다시 그리기
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
        </div>
      </div>
    </div>
  );
});