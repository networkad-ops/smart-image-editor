// BannerPreview.tsx 수정
import { forwardRef, useEffect, RefObject } from 'react';
import { BannerConfig, TextElement } from '../types';

interface BannerPreviewProps {
  config: BannerConfig;
  uploadedImage: File | null;
  uploadedLogo?: File | null;
  textElements: TextElement[];
  existingImageUrl?: string | null;
  existingLogoUrl?: string | null;
}

export const BannerPreview = forwardRef<HTMLCanvasElement, BannerPreviewProps>(({
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
      // 폰트 두께 설정 (기본값 400)
      const fontWeight = element.fontWeight || 400;
      ctx.font = `${fontWeight} ${element.fontSize}px Pretendard`;
      ctx.textBaseline = 'top'; // 텍스트의 기준선을 상단으로 설정
      
      // 줄바꿈 처리
      const lines = element.text.split('\n');
      const lineHeight = element.fontSize * 1.2; // 줄 간격 설정
      
      lines.forEach((line, lineIndex) => {
        const y = element.y + (lineIndex * lineHeight);
        let currentX = element.x;
        
        // 부분 색상이 있는 경우
        if (element.colorSegments && element.colorSegments.length > 0) {
          // 현재 줄의 시작 인덱스 계산
          const lineStart = lines.slice(0, lineIndex).join('\n').length + (lineIndex > 0 ? 1 : 0);
          
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
              ctx.fillText(textPart, currentX, y);
              currentX += ctx.measureText(textPart).width;
              lastIndex = i + 1;
            }
          }
        } else {
          // 부분 색상이 없는 경우 전체 색상으로 렌더링
          ctx.fillStyle = element.color;
          ctx.fillText(line, currentX, y);
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
        if (logoToUse && config.logo) {
          const logoImg = new Image();
          logoImg.crossOrigin = 'anonymous'; // CORS 문제 해결
          logoImg.onload = () => {
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
          logoImg.onerror = () => {
            // 로고 로드 실패 시에도 텍스트는 그리기
            drawTextElements(ctx, textElements);
          };
          
          if (uploadedLogo) {
            logoImg.src = URL.createObjectURL(uploadedLogo);
          } else {
            logoImg.src = logoToUse as string;
          }
        } else {
          // 로고가 없는 경우 바로 텍스트 그리기
          drawTextElements(ctx, textElements);
        }
      };
      
      img.onerror = () => {
        console.error('이미지 로드 실패');
        // 이미지 로드 실패 시에도 텍스트는 그리기
        drawTextElements(ctx, textElements);
      };
      
      if (uploadedImage) {
        img.src = URL.createObjectURL(uploadedImage);
      } else {
        img.src = imageToUse as string;
      }
    }

    // 텍스트 그리기 (이미지가 없는 경우에만)
    if (!imageToUse) {
      drawTextElements(ctx, textElements);
    }
  }, [uploadedImage, uploadedLogo, textElements, existingImageUrl, existingLogoUrl, config.width, config.height, ref]);

  // 미리보기 프레임 크기 계산
  const previewScale = Math.min(1, 800 / Math.max(config.width, config.height));
  const previewWidth = config.width * previewScale;
  const previewHeight = config.height * previewScale;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-4">미리보기</h2>
      <div className="relative" style={{ width: previewWidth, height: previewHeight }}>
        <canvas
          ref={ref}
          width={config.width}
          height={config.height}
          className="border border-gray-200"
          style={{
            width: previewWidth,
            height: previewHeight
          }}
        />
      </div>
    </div>
  );
});