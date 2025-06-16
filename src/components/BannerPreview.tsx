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
        // 이미지를 캔버스 크기에 맞게 그리기
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // 텍스트 그리기
        textElements.forEach(element => {
          ctx.font = `${element.fontSize}px ${element.fontFamily}`;
          ctx.fillStyle = element.color;
          ctx.fillText(element.text, element.x, element.y + element.fontSize);
        });
      };
      img.src = URL.createObjectURL(uploadedImage);
    }

    // 텍스트 그리기 (이미지가 없는 경우에도)
    textElements.forEach(element => {
      ctx.font = `${element.fontSize}px ${element.fontFamily}`;
      ctx.fillStyle = element.color;
      ctx.fillText(element.text, element.x, element.y + element.fontSize);
    });
  }, [uploadedImage, textElements, config.width, config.height, ref]);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-4">미리보기</h2>
      <div className="relative" style={{ width: config.width, height: config.height }}>
        <canvas
          ref={ref}
          width={config.width}
          height={config.height}
          className="border border-gray-200"
        />
      </div>
    </div>
  );
});