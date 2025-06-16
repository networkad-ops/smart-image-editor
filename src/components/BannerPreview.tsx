// BannerPreview.tsx 수정
import { forwardRef, useEffect, RefObject } from 'react';
import { BannerConfig, TextElement } from '../types';

interface BannerPreviewProps {
  config: BannerConfig;
  uploadedImage: File | null;
  textElements: TextElement[];
}

export const BannerPreview = forwardRef<HTMLCanvasElement, BannerPreviewProps>(({
  config,
  uploadedImage,
  textElements
}, ref) => {
  useEffect(() => {
    const canvas = (ref as RefObject<HTMLCanvasElement>).current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 캔버스 초기화
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 이미지 그리기
    if (uploadedImage) {
      const img = new Image();
      img.onload = () => {
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
        
        // 텍스트 그리기
        textElements.forEach(element => {
          ctx.save();
          ctx.font = `${element.fontSize}px "Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, "Helvetica Neue", "Segoe UI", "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif`;
          ctx.fillStyle = element.color;
          
          // 줄바꿈 처리
          const lines = element.text.split('\n');
          const lineHeight = element.fontSize * 1.2; // 줄 간격 설정
          
          // 텍스트 정렬을 위한 설정
          ctx.textBaseline = 'top'; // 텍스트의 기준선을 상단으로 설정
          
          lines.forEach((line, index) => {
            const y = element.y + (index * lineHeight);
            ctx.fillText(line, element.x, y);
          });
          
          ctx.restore();
        });
      };
      img.src = URL.createObjectURL(uploadedImage);
    }

    // 텍스트 그리기 (이미지가 없는 경우에도)
    textElements.forEach(element => {
      ctx.save();
      ctx.font = `${element.fontSize}px "Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, "Helvetica Neue", "Segoe UI", "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif`;
      ctx.fillStyle = element.color;
      
      // 줄바꿈 처리
      const lines = element.text.split('\n');
      const lineHeight = element.fontSize * 1.2; // 줄 간격 설정
      
      // 텍스트 정렬을 위한 설정
      ctx.textBaseline = 'top'; // 텍스트의 기준선을 상단으로 설정
      
      lines.forEach((line, index) => {
        const y = element.y + (index * lineHeight);
        ctx.fillText(line, element.x, y);
      });
      
      ctx.restore();
    });
  }, [uploadedImage, textElements, config.width, config.height, ref]);

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