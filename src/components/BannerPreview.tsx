import React from 'react';
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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">배너 미리보기</h3>
        <div className="text-sm text-gray-500">
          {config.width} × {config.height}px
        </div>
      </div>

      <div
        className="relative bg-white border rounded-lg overflow-auto"
        style={{
          width: config.width,
          height: config.height,
          margin: '0 auto',
          overflow: 'auto'
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
              left: element.x,
              top: element.y,
              width: element.width,
              height: element.height,
              fontSize: element.fontSize,
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