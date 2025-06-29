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
  const [hexInput, setHexInput] = useState('000000');
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

  // 초기 색상 설정 - 한 번만 실행
  useEffect(() => {
    const rgb = hexToRgb(color);
    if (rgb) {
      const newHsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
      setHsv(newHsv);
      setHexInput(color.replace('#', '').toUpperCase());
      // 투명도는 rgba에서 추출하거나 기본값 100
      if (color.includes('rgba')) {
        const alphaMatch = color.match(/rgba\([^,]+,[^,]+,[^,]+,([^)]+)\)/);
        if (alphaMatch) {
          setAlpha(Math.round(parseFloat(alphaMatch[1]) * 100));
        }
      }
    }
  }, []); // 빈 의존성 배열로 초기화만 수행

  // 현재 색상 계산
  const currentRgb = hsvToRgb(hsv.h, hsv.s, hsv.v);
  const currentHex = rgbToHex(currentRgb.r, currentRgb.g, currentRgb.b);
  const currentColor = `rgba(${currentRgb.r}, ${currentRgb.g}, ${currentRgb.b}, ${alpha / 100})`;

  // 색상 업데이트 함수
  const updateColor = useCallback((newRgb: RGB, newAlpha: number) => {
    const color = `rgba(${newRgb.r}, ${newRgb.g}, ${newRgb.b}, ${newAlpha / 100})`;
    if (onPreview) {
      onPreview(color);
    } else {
      onChange(color);
    }
  }, [onPreview, onChange]);

  // 채도/명도 드래그
  const handleSaturationDrag = useCallback((clientX: number, clientY: number) => {
    if (!saturationRef.current) return;
    
    const rect = saturationRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, clientY - rect.top));
    
    const newS = Math.round((x / rect.width) * 100);
    const newV = Math.round(((rect.height - y) / rect.height) * 100);
    
    const newHsv = { ...hsv, s: newS, v: newV };
    setHsv(newHsv);
    
    const rgb = hsvToRgb(newHsv.h, newHsv.s, newHsv.v);
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
    setHexInput(hex.replace('#', '').toUpperCase());
    updateColor(rgb, alpha);
  }, [hsv, alpha, updateColor]);

  // 색조 드래그
  const handleHueDrag = useCallback((clientX: number) => {
    if (!hueRef.current) return;
    
    const rect = hueRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const newH = Math.round((x / rect.width) * 360);
    
    const newHsv = { ...hsv, h: newH };
    setHsv(newHsv);
    
    const rgb = hsvToRgb(newHsv.h, newHsv.s, newHsv.v);
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
    setHexInput(hex.replace('#', '').toUpperCase());
    updateColor(rgb, alpha);
  }, [hsv, alpha, updateColor]);

  // 투명도 드래그
  const handleAlphaDrag = useCallback((clientX: number) => {
    if (!alphaRef.current) return;
    
    const rect = alphaRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const newAlpha = Math.round((x / rect.width) * 100);
    
    setAlpha(newAlpha);
    updateColor(currentRgb, newAlpha);
  }, [currentRgb, updateColor]);

  // 마우스 다운
  const handleMouseDown = (e: React.MouseEvent, type: 'saturation' | 'hue' | 'alpha') => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragging(true);
    setDragType(type);
    
    const clientX = e.clientX;
    const clientY = e.clientY;
    
    if (type === 'saturation') {
      handleSaturationDrag(clientX, clientY);
    } else if (type === 'hue') {
      handleHueDrag(clientX);
    } else if (type === 'alpha') {
      handleAlphaDrag(clientX);
    }
  };

  // 마우스 무브
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !dragType) return;
    
    e.preventDefault();
    
    if (dragType === 'saturation') {
      handleSaturationDrag(e.clientX, e.clientY);
    } else if (dragType === 'hue') {
      handleHueDrag(e.clientX);
    } else if (dragType === 'alpha') {
      handleAlphaDrag(e.clientX);
    }
  }, [isDragging, dragType, handleSaturationDrag, handleHueDrag, handleAlphaDrag]);

  // 마우스 업
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragType(null);
  }, []);

  // 글로벌 이벤트 리스너
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Hex 입력 핸들러
  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace('#', '').toUpperCase();
    setHexInput(value);
    
    if (value.length === 6 && /^[0-9A-F]{6}$/i.test(value)) {
      const rgb = hexToRgb('#' + value);
      if (rgb) {
        const newHsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
        setHsv(newHsv);
        updateColor(rgb, alpha);
      }
    }
  };

  // 투명도 입력 핸들러
  const handleAlphaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
    setAlpha(value);
    updateColor(currentRgb, value);
  };

  return (
    <div className="w-full bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
      {/* 메인 색상 선택 영역 */}
      <div
        ref={saturationRef}
        className={`relative w-full h-32 mb-3 rounded cursor-crosshair select-none ${
          isDragging && dragType === 'saturation' ? 'cursor-grabbing' : ''
        }`}
        style={{
          background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${hsv.h}, 100%, 50%))`
        }}
        onMouseDown={(e) => handleMouseDown(e, 'saturation')}
      >
        <div
          className="absolute w-3 h-3 border-2 border-white rounded-full shadow-lg transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
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
          className={`relative w-full h-4 rounded cursor-pointer select-none ${
            isDragging && dragType === 'hue' ? 'cursor-grabbing' : ''
          }`}
          style={{
            background: 'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)'
          }}
          onMouseDown={(e) => handleMouseDown(e, 'hue')}
        >
          <div
            className="absolute w-4 h-4 border-2 border-white rounded-full shadow-lg transform -translate-x-1/2 pointer-events-none"
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
          className={`relative w-full h-4 rounded overflow-hidden cursor-pointer select-none ${
            isDragging && dragType === 'alpha' ? 'cursor-grabbing' : ''
          }`}
          style={{
            background: `linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)`,
            backgroundSize: '8px 8px'
          }}
          onMouseDown={(e) => handleMouseDown(e, 'alpha')}
        >
          <div
            className="absolute inset-0 rounded"
            style={{
              background: `linear-gradient(to right, transparent, ${currentHex})`
            }}
          />
          <div
            className="absolute w-4 h-4 border-2 border-white rounded-full shadow-lg transform -translate-x-1/2 pointer-events-none"
            style={{
              left: `${alpha}%`,
              backgroundColor: currentColor
            }}
          />
        </div>
      </div>

      {/* 컨트롤들 */}
      <div className="space-y-2">
        {/* Hex 입력 */}
        <div className="flex items-center space-x-2">
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

        {/* 투명도 입력 */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600 w-8">A</span>
          <div className="flex items-center border border-gray-300 rounded px-2 py-1 flex-1">
            <input
              type="number"
              value={Math.round(alpha)}
              onChange={handleAlphaChange}
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
              className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
            >
              ✓ 확인
            </button>
            <button
              onClick={onCancel}
              className="flex-1 px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm font-medium"
            >
              ✕ 취소
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 