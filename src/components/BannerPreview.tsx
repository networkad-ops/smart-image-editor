// BannerPreview.tsx 수정
import React, { useEffect, RefObject } from 'react';
import { BannerConfig, TextElement } from '../types';
import { drawTextWithLetterSpacing } from '../utils/canvasUtils';

interface BannerPreviewProps {
  config: BannerConfig;
  uploadedImage: File | null;
  uploadedLogo?: File | null;
  textElements: TextElement[];
  existingImageUrl?: string | null;
  existingLogoUrl?: string | null;
}

export const BannerPreview = React.forwardRef<HTMLCanvasElement, BannerPreviewProps>(({
  config,
  uploadedImage,
  uploadedLogo,
  textElements,
  existingImageUrl,
  existingLogoUrl
}, ref) => {
  // 텍스트 렌더링 함수
  const drawTextElements = (ctx: CanvasRenderingContext2D, elements: TextElement[]) => {
    elements.forEach(element => {
      ctx.save();
      
      // 버튼 텍스트인 경우 배경 그리기 (텍스트가 없어도 표시)
      if (element.id === 'button-text') {
        console.log('버튼 텍스트 렌더링:', {
          text: element.text,
          x: element.x,
          y: element.y,
          width: element.width,
          height: element.height,
          backgroundColor: element.backgroundColor
        });
        
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
      if (element.id === 'button-text') {
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
      } else if (element.id === 'sub-title' || element.id === 'main-title') {
        // 서브타이틀과 메인타이틀은 중앙 정렬
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
      } else {
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
        } else if (element.id === 'sub-title' || element.id === 'main-title') {
          // 서브타이틀과 메인타이틀은 중앙 정렬
          y = element.y + (lineIndex * lineHeight);
          currentX = element.x + element.width / 2;
        } else {
          // 일반 텍스트는 왼쪽 정렬
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
          
          // 중앙 정렬인 경우 전체 텍스트 너비를 계산해서 시작 위치 조정
          if (element.id === 'sub-title' || element.id === 'main-title') {
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
  };

  useEffect(() => {
    console.log('BannerPreview useEffect:', {
      uploadedImage: !!uploadedImage,
      existingImageUrl,
      textElements: textElements.length
    });

    const canvas = (ref as RefObject<HTMLCanvasElement>).current;
    if (!canvas) {
      console.log('Canvas가 없음');
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.log('Canvas context가 없음');
      return;
    }

    // 캔버스 초기화
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    console.log('Canvas 초기화 완료:', canvas.width, 'x', canvas.height);

    // 이미지 그리기 (새 이미지 우선, 없으면 기존 이미지)
    const imageToUse = uploadedImage || existingImageUrl;
    console.log('사용할 이미지 상세:', {
      uploadedImage: !!uploadedImage,
      uploadedImageName: uploadedImage?.name,
      existingImageUrl,
      imageToUse: typeof imageToUse,
      imageToUseValue: imageToUse
    });
    if (imageToUse) {
      const img = new Image();
      img.crossOrigin = 'anonymous'; // CORS 문제 해결
      img.onload = () => {
        console.log('이미지 로드 성공:', img.width, 'x', img.height);
        // 이미지 비율 계산
        const imageRatio = img.width / img.height;
        const canvasRatio = canvas.width / canvas.height;
        
        let drawWidth = canvas.width;
        let drawHeight = canvas.height;
        let offsetX = 0;
        let offsetY = 0;

        if (imageRatio > canvasRatio) {
          // 이미지가 더 넓은 경우
          drawHeight = canvas.width / imageRatio;
          offsetY = (canvas.height - drawHeight) / 2;
        } else {
          // 이미지가 더 높은 경우
          drawWidth = canvas.height * imageRatio;
          offsetX = (canvas.width - drawWidth) / 2;
        }

        // 이미지를 캔버스 중앙에 맞춰 그리기
        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
        
        // 로고 그리기 (새 로고 우선, 없으면 기존 로고)
        const logoToUse = uploadedLogo || existingLogoUrl;
        console.log('로고 정보:', {
          uploadedLogo: !!uploadedLogo,
          existingLogoUrl,
          logoToUse: typeof logoToUse,
          hasLogoConfig: !!config.logo
        });
        
        if (logoToUse && config.logo) {
          const logoImg = new Image();
          logoImg.crossOrigin = 'anonymous'; // CORS 문제 해결
          logoImg.onload = () => {
            console.log('로고 로드 성공:', logoImg.width, 'x', logoImg.height);
            ctx.drawImage(
              logoImg,
              config.logo!.x,
              config.logo!.y,
              config.logo!.width,
              config.logo!.height
            );
            // 텍스트는 로고 로드 후에 그리기
            drawTextElements(ctx, textElements);
          };
          logoImg.onerror = (error) => {
            console.error('로고 로드 실패:', error);
            console.error('실패한 로고 src:', logoImg.src);
            // 로고 로드 실패 시에도 텍스트는 그리기
            drawTextElements(ctx, textElements);
          };
          
          if (uploadedLogo) {
            const logoBlobUrl = URL.createObjectURL(uploadedLogo);
            console.log('업로드된 로고 Blob URL 설정:', logoBlobUrl);
            logoImg.src = logoBlobUrl;
          } else {
            const logoUrl = logoToUse as string;
            console.log('기존 로고 URL 설정:', logoUrl);
            logoImg.src = logoUrl;
          }
          
          console.log('최종 logoImg.src 설정:', logoImg.src);
        } else {
          // 로고가 없는 경우 바로 텍스트 그리기
          console.log('로고 없음, 텍스트만 그리기');
          drawTextElements(ctx, textElements);
        }
      };
      
      img.onerror = (error) => {
        console.error('이미지 로드 실패:', error);
        console.error('실패한 이미지 src:', img.src);
        // 이미지 로드 실패 시에도 텍스트는 그리기
        drawTextElements(ctx, textElements);
      };
      
      if (uploadedImage) {
        const blobUrl = URL.createObjectURL(uploadedImage);
        console.log('업로드된 이미지 Blob URL 설정:', blobUrl);
        img.src = blobUrl;
      } else {
        const imageUrl = imageToUse as string;
        console.log('기존 이미지 URL 설정:', imageUrl);
        console.log('URL 유효성 검사:', {
          isString: typeof imageUrl === 'string',
          isNotEmpty: imageUrl && imageUrl.length > 0,
          startsWithHttp: imageUrl && imageUrl.startsWith('http'),
          fullUrl: imageUrl
        });
        img.src = imageUrl;
      }
      
      console.log('최종 img.src 설정:', img.src);
    }

    // 텍스트 그리기 (이미지가 없는 경우)
    if (!imageToUse) {
      console.log('이미지 없음, 텍스트 요소 그리기:', textElements.length);
      drawTextElements(ctx, textElements);
    }
  }, [uploadedImage, uploadedLogo, textElements, existingImageUrl, existingLogoUrl, config.width, config.height, ref]);

  // 미리보기 프레임 크기 계산
  const maxPreviewSize = 600; // 최대 미리보기 크기 증가
  const previewScale = Math.min(1, maxPreviewSize / Math.max(config.width, config.height));
  const previewWidth = config.width * previewScale;
  const previewHeight = config.height * previewScale;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-4">
        미리보기 
        <span className="text-sm text-gray-500 ml-2">
          ({config.width} × {config.height})
        </span>
      </h2>
      <div className="flex justify-center">
        <div className="relative" style={{ width: previewWidth, height: previewHeight }}>
          <canvas
            ref={ref}
            width={config.width}
            height={config.height}
            className="border-2 border-gray-300 rounded-lg shadow-sm"
            style={{
              width: previewWidth,
              height: previewHeight,
              maxWidth: '100%',
              backgroundColor: '#f8f9fa' // 기본 배경색 추가
            }}
          />
        </div>
      </div>
    </div>
  );
});