import { useState, useRef, useCallback, useEffect } from 'react';

interface FigmaColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  onPreview?: (color: string) => void;
  onConfirm?: () => void;
  onCancel?: () => void;
  showPreviewControls?: boolean;
}

interface HSV {
  h: number; // 0-360
  s: number; // 0-100
  v: number; // 0-100
}

interface RGB {
  r: number; // 0-255
  g: number; // 0-255
  b: number; // 0-255
}

export default function FigmaColorPicker({ 
  color, 
  onChange, 
  onPreview, 
  onConfirm, 
  onCancel, 
  showPreviewControls = false 
}: FigmaColorPickerProps) {
  const [hsv, setHsv] = useState<HSV>({ h: 0, s: 100, v: 100 });
  const [alpha, setAlpha] = useState(100);
  const [hexInput, setHexInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState<'saturation' | 'hue' | 'alpha' | null>(null);
  
  const saturationRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);
  const alphaRef = useRef<HTMLDivElement>(null);

  // 색상 변환 함수들
  const hexToRgb = (hex: string): RGB | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  const rgbToHex = (r: number, g: number, b: number): string => {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  };

  const rgbToHsv = (r: number, g: number, b: number): HSV => {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;
    
    let h = 0;
    if (diff !== 0) {
      if (max === r) h = ((g - b) / diff) % 6;
      else if (max === g) h = (b - r) / diff + 2;
      else h = (r - g) / diff + 4;
    }
    h = Math.round(h * 60);
    if (h < 0) h += 360;
    
    const s = max === 0 ? 0 : Math.round((diff / max) * 100);
    const v = Math.round(max * 100);
    
    return { h, s, v };
  };

  const hsvToRgb = (h: number, s: number, v: number): RGB => {
    h /= 360;
    s /= 100;
    v /= 100;
    
    const c = v * s;
    const x = c * (1 - Math.abs((h * 6) % 2 - 1));
    const m = v - c;
    
    let r = 0, g = 0, b = 0;
    
    if (h >= 0 && h < 1/6) { r = c; g = x; b = 0; }
    else if (h >= 1/6 && h < 2/6) { r = x; g = c; b = 0; }
    else if (h >= 2/6 && h < 3/6) { r = 0; g = c; b = x; }
    else if (h >= 3/6 && h < 4/6) { r = 0; g = x; b = c; }
    else if (h >= 4/6 && h < 5/6) { r = x; g = 0; b = c; }
    else { r = c; g = 0; b = x; }
    
    return {
      r: Math.round((r + m) * 255),
      g: Math.round((g + m) * 255),
      b: Math.round((b + m) * 255)
    };
  };

  // 초기 색상 설정
  useEffect(() => {
    const rgb = hexToRgb(color);
    if (rgb) {
      const newHsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
      setHsv(newHsv);
      setHexInput(color.replace('#', '').toUpperCase());
    }
  }, [color]);

  // 현재 색상 계산
  const currentRgb = hsvToRgb(hsv.h, hsv.s, hsv.v);
  const currentHex = rgbToHex(currentRgb.r, currentRgb.g, currentRgb.b);
  const currentColor = `rgba(${currentRgb.r}, ${currentRgb.g}, ${currentRgb.b}, ${alpha / 100})`;

  // 마우스 이벤트 핸들러들
  const handleMouseDown = (e: React.MouseEvent, type: 'saturation' | 'hue' | 'alpha') => {
    setIsDragging(true);
    setDragType(type);
    handleMouseMove(e, type);
    e.preventDefault();
    e.stopPropagation();
  };

  const handleMouseMove = useCallback((e: React.MouseEvent | MouseEvent, type?: 'saturation' | 'hue' | 'alpha') => {
    if (!isDragging && !type) return;
    
    const activeType = type || dragType;
    if (!activeType) return;

    // 드래그 중일 때만 실시간 업데이트
    const shouldUpdateLive = isDragging || type;
    if (!shouldUpdateLive) return;

    if (activeType === 'saturation' && saturationRef.current) {
      const rect = saturationRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
      const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
      
      const newS = Math.round((x / rect.width) * 100);
      const newV = Math.round(((rect.height - y) / rect.height) * 100);
      
      const newHsv = { ...hsv, s: newS, v: newV };
      setHsv(newHsv);
      
      const rgb = hsvToRgb(newHsv.h, newHsv.s, newHsv.v);
      const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
      setHexInput(hex.replace('#', '').toUpperCase());
      
      const color = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha / 100})`;
      if (onPreview) {
        onPreview(color);
      } else {
        onChange(color);
      }
    } else if (activeType === 'hue' && hueRef.current) {
      const rect = hueRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
      const newH = Math.round((x / rect.width) * 360);
      
      const newHsv = { ...hsv, h: newH };
      setHsv(newHsv);
      
      const rgb = hsvToRgb(newHsv.h, newHsv.s, newHsv.v);
      const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
      setHexInput(hex.replace('#', '').toUpperCase());
      
      const color = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha / 100})`;
      if (onPreview) {
        onPreview(color);
      } else {
        onChange(color);
      }
    } else if (activeType === 'alpha' && alphaRef.current) {
      const rect = alphaRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
      const newAlpha = Math.round((x / rect.width) * 100);
      
      setAlpha(newAlpha);
      
      const color = `rgba(${currentRgb.r}, ${currentRgb.g}, ${currentRgb.b}, ${newAlpha / 100})`;
      if (onPreview) {
        onPreview(color);
      } else {
        onChange(color);
      }
    }
  }, [isDragging, dragType, hsv, alpha, currentRgb, onPreview, onChange]);

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragType(null);
  };

  useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseMove = (e: MouseEvent) => {
        // requestAnimationFrame으로 부드러운 드래그 구현
        requestAnimationFrame(() => handleMouseMove(e));
      };
      const handleGlobalMouseUp = () => handleMouseUp();
      
      document.addEventListener('mousemove', handleGlobalMouseMove, { passive: false });
      document.addEventListener('mouseup', handleGlobalMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [isDragging, handleMouseMove]);

  // Hex 입력 핸들러
  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace('#', '').toUpperCase();
    setHexInput(value);
    
    if (value.length === 6 && /^[0-9A-F]{6}$/i.test(value)) {
      const rgb = hexToRgb('#' + value);
      if (rgb) {
        const newHsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
        setHsv(newHsv);
        
        if (onPreview) {
          onPreview(`rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha / 100})`);
        } else {
          onChange(`rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha / 100})`);
        }
      }
    }
  };

  // 스포이드 도구 (EyeDropper API)
  const handleEyeDropper = async () => {
    if ('EyeDropper' in window) {
      try {
        // @ts-ignore
        const eyeDropper = new EyeDropper();
        const result = await eyeDropper.open();
        const rgb = hexToRgb(result.sRGBHex);
        if (rgb) {
          const newHsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
          setHsv(newHsv);
          setHexInput(result.sRGBHex.replace('#', '').toUpperCase());
          
          if (onPreview) {
            onPreview(`rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha / 100})`);
          } else {
            onChange(`rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha / 100})`);
          }
        }
      } catch (error) {
        console.log('EyeDropper cancelled or not supported');
      }
    }
  };

  return (
    <div className="w-full bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
      {/* 메인 색상 선택 영역 */}
      <div
        ref={saturationRef}
        className="relative w-full h-32 mb-3 rounded cursor-crosshair select-none"
        style={{
          background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${hsv.h}, 100%, 50%))`
        }}
        onMouseDown={(e) => handleMouseDown(e, 'saturation')}
        onTouchStart={(e) => {
          const touch = e.touches[0];
          if (touch) {
            const mouseEvent = new MouseEvent('mousedown', {
              clientX: touch.clientX,
              clientY: touch.clientY
            });
            handleMouseDown(mouseEvent as any, 'saturation');
          }
        }}
      >
        {/* 선택된 위치 표시 */}
        <div
          className="absolute w-3 h-3 border-2 border-white rounded-full shadow-md transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            left: `${hsv.s}%`,
            top: `${100 - hsv.v}%`
          }}
        />
      </div>

      {/* 색조 슬라이더 */}
      <div className="mb-3">
        <div
          ref={hueRef}
          className="relative w-full h-4 rounded cursor-pointer select-none"
          style={{
            background: 'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)'
          }}
          onMouseDown={(e) => handleMouseDown(e, 'hue')}
          onTouchStart={(e) => {
            const touch = e.touches[0];
            if (touch) {
              const mouseEvent = new MouseEvent('mousedown', {
                clientX: touch.clientX,
                clientY: touch.clientY
              });
              handleMouseDown(mouseEvent as any, 'hue');
            }
          }}
        >
          {/* 색조 선택 표시 */}
          <div
            className="absolute w-4 h-4 border-2 border-white rounded-full shadow-md transform -translate-x-1/2 -translate-y-0 pointer-events-none"
            style={{
              left: `${(hsv.h / 360) * 100}%`,
              backgroundColor: `hsl(${hsv.h}, 100%, 50%)`
            }}
          />
        </div>
      </div>

      {/* 투명도 슬라이더 */}
      <div className="mb-3">
        <div
          ref={alphaRef}
          className="relative w-full h-4 rounded cursor-pointer overflow-hidden select-none"
          style={{
            background: `linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)`,
            backgroundSize: '8px 8px',
            backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px'
          }}
          onMouseDown={(e) => handleMouseDown(e, 'alpha')}
          onTouchStart={(e) => {
            const touch = e.touches[0];
            if (touch) {
              const mouseEvent = new MouseEvent('mousedown', {
                clientX: touch.clientX,
                clientY: touch.clientY
              });
              handleMouseDown(mouseEvent as any, 'alpha');
            }
          }}
        >
          <div
            className="absolute inset-0 rounded"
            style={{
              background: `linear-gradient(to right, transparent, ${currentHex})`
            }}
          />
          {/* 투명도 선택 표시 */}
          <div
            className="absolute w-4 h-4 border-2 border-white rounded-full shadow-md transform -translate-x-1/2 -translate-y-0 pointer-events-none"
            style={{
              left: `${alpha}%`,
              backgroundColor: currentColor
            }}
          />
        </div>
      </div>

      {/* 컨트롤 패널 */}
      <div className="space-y-2">
        {/* Hex 입력과 스포이드 */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 flex-1">
            <span className="text-sm text-gray-600 w-8">Hex</span>
            <div className="flex items-center border border-gray-300 rounded px-2 py-1 flex-1">
              <span className="text-gray-400">#</span>
              <input
                type="text"
                value={hexInput}
                onChange={handleHexChange}
                className="flex-1 outline-none text-sm"
                maxLength={6}
              />
            </div>
          </div>
          
          {/* 스포이드 도구 */}
          {'EyeDropper' in window && (
            <button
              onClick={handleEyeDropper}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
              title="스포이드 도구"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
            </button>
          )}
        </div>

        {/* 투명도 수치 */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600 w-8">A</span>
          <div className="flex items-center border border-gray-300 rounded px-2 py-1 flex-1">
            <input
              type="number"
              value={Math.round(alpha)}
              onChange={(e) => {
                const value = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
                setAlpha(value);
                if (onPreview) {
                  onPreview(`rgba(${currentRgb.r}, ${currentRgb.g}, ${currentRgb.b}, ${value / 100})`);
                } else {
                  onChange(`rgba(${currentRgb.r}, ${currentRgb.g}, ${currentRgb.b}, ${value / 100})`);
                }
              }}
              className="flex-1 outline-none text-sm"
              min={0}
              max={100}
            />
            <span className="text-gray-400 text-sm">%</span>
          </div>
        </div>

        {/* 색상 미리보기 */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600 w-8">미리</span>
          <div 
            className="flex-1 h-8 rounded border border-gray-300"
            style={{ 
              background: `linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)`,
              backgroundSize: '8px 8px'
            }}
          >
            <div 
              className="w-full h-full rounded"
              style={{ backgroundColor: currentColor }}
            />
          </div>
        </div>

        {/* 확인/취소 버튼 */}
        {showPreviewControls && (
          <div className="flex space-x-2 pt-2 border-t border-gray-200">
            <button
              onClick={onConfirm}
              className="flex-1 px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs font-medium"
            >
              ✓ 확인
            </button>
            <button
              onClick={onCancel}
              className="flex-1 px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-xs font-medium"
            >
              ✕ 취소
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 