// BannerPreview.tsx 수정
import { forwardRef } from 'react';
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