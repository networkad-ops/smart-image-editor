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
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const parentWidth = containerRef.current.clientWidth;
        const newScale = Math.min(1, parentWidth / config.width);
        setScale(newScale);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [config.width]);

  // 텍스트 요소를 config 순서대로 정렬 (subTitle → mainTitle → 기타)
  const getOrderedElements = () => {
    const order: string[] = [];
    if (config.subTitle) order.push('sub-title');
    if (config.mainTitle) order.push('main-title');
    const fixed = textElements.filter(e => order.includes(e.id));
    const custom = textElements.filter(e => !order.includes(e.id));
    // subTitle, mainTitle 순서대로, 그 뒤에 custom
    return [
      ...order.map(id => fixed.find(e => e.id === id)).filter(Boolean),
      ...custom
    ] as TextElement[];
  };

  // 줄바꿈 지원: \n → <br />
  const renderTextWithLineBreaks = (text: string) =>
    text.split(/\r?\n/).map((line, i) => (
      <React.Fragment key={i}>
        {line}
        {i < text.split(/\r?\n/).length - 1 && <br />}
      </React.Fragment>
    ));

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">배너 미리보기</h3>
        <div className="text-sm text-gray-500">
          {config.width} × {config.height}px
        </div>
      </div>
      <div
        ref={containerRef}
        className="relative bg-white border rounded-lg mx-auto"
        style={{
          width: '100%',
          maxWidth: 900,
          minWidth: 320,
          aspectRatio: `${config.width} / ${config.height}`,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: config.width,
            height: config.height,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            position: 'absolute',
            left: 0,
            top: 0,
          }}
        >
          {uploadedImage && (
            <img
              src={URL.createObjectURL(uploadedImage)}
              alt="배너 이미지"
              style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', left: 0, top: 0 }}
            />
          )}
          {getOrderedElements().map((element) => (
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
                color: element.color,
                letterSpacing: (element as any).letterSpacing || undefined,
                whiteSpace: 'pre-line',
                overflow: 'hidden',
                wordBreak: 'break-all',
                lineHeight: 1.2,
              }}
              className="outline-none"
              // contentEditable 제거, 미리보기에서는 HTML 렌더링만
              dangerouslySetInnerHTML={{ __html: element.text || '' }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}; 