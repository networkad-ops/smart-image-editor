// BannerPreview.tsx 수정
import { forwardRef } from 'react';
import { BannerConfig } from '../types';

interface BannerPreviewProps {
  config: BannerConfig;
}

export const BannerPreview = forwardRef<HTMLCanvasElement, BannerPreviewProps>(({
  config
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