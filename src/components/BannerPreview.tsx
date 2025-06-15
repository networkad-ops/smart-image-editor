import React, { useRef, useEffect, useState } from 'react';
import { BannerType, DeviceType, TextElement, BannerConfig } from '../types/index';

interface BannerPreviewProps {
  bannerSelection: {
    bannerType: BannerType;
    deviceType: DeviceType;
    config: BannerConfig;
  };
  uploadedImage: File | null;
  textElements: TextElement[];
  onTextUpdate: (id: string, updates: Partial<TextElement>) => void;
}

export const BannerPreview: React.FC<BannerPreviewProps> = ({
  bannerSelection,
  uploadedImage,
  textElements,
  onTextUpdate
}) => {
  const { config } = bannerSelection;
  const previewRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState({ x: 1, y: 1 });

  useEffect(() => {
    const handleResize = () => {
      if (previewRef.current) {
        const rect = previewRef.current.getBoundingClientRect();
        setScale({
          x: rect.width / config.width,
          y: rect.height / config.height
        });
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [config.width, config.height]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">배너 미리보기</h3>
        <div className="text-sm text-gray-500">
          {config.width} × {config.height}px
        </div>
      </div>

      <div
        ref={previewRef}
        className="relative bg-white border rounded-lg overflow-hidden"
        style={{
          width: config.width,
          height: config.height,
          maxWidth: '100%',
          margin: '0 auto'
        }}
      >
        {uploadedImage && (
          <img
            src={URL.createObjectURL(uploadedImage)}
            alt="배너 이미지"
            className="w-full h-full object-cover"
          />
        )}

        {textElements.map((element) => (
          <div
            key={element.id}
            style={{
              position: 'absolute',
              left: element.x * scale.x,
              top: element.y * scale.y,
              width: element.width * scale.x,
              height: element.height * scale.y,
              fontSize: element.fontSize * scale.y,
              fontFamily: element.fontFamily,
              color: element.color
            }}
            contentEditable={true}
            onBlur={(e) => onTextUpdate(element.id, { text: e.currentTarget.textContent || '' })}
            suppressContentEditableWarning={true}
            className="outline-none"
          >
            {element.text}
          </div>
        ))}
      </div>
    </div>
  );
}; 