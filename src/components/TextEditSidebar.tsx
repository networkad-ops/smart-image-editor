import { useState, useRef } from 'react';
import { BannerConfig, TextElement, ColorSegment } from '../types';
import { PositionControlPanel } from './PositionControlPanel';
import FigmaColorPicker from './FigmaColorPicker';

interface TextEditSidebarProps {
  config: BannerConfig;
  textElements: TextElement[];
  onAddText: (text: TextElement) => void;
  onUpdateText: (id: string, updates: Partial<TextElement>) => void;
  onDeleteText: (id: string) => void;
  showTitle?: boolean;
  showBackground?: boolean;
}

export const TextEditSidebar: React.FC<TextEditSidebarProps> = ({
  config,
  textElements,
  onAddText,
  onUpdateText,
  onDeleteText,
  showTitle = true,
  showBackground = true
}) => {
  const [newText, setNewText] = useState('');
  const [selectedRange, setSelectedRange] = useState<{elementId: string, start: number, end: number} | null>(null);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const subTitleInputRef = useRef<HTMLInputElement>(null);
  const mainTitleInputRef = useRef<HTMLTextAreaElement>(null);
  const bottomSubTitleInputRef = useRef<HTMLInputElement>(null);
  

  
  // 색상 피커 상태 추가
  const [colorPickerMode, setColorPickerMode] = useState<{
    isActive: boolean;
    elementId: string | null;
    originalColor: string | null;
    originalColorSegments: ColorSegment[] | undefined;
    previewColor: string | null;
  }>({
    isActive: false,
    elementId: null,
    originalColor: null,
    originalColorSegments: undefined,
    previewColor: null
  });
  
  // 그라데이션 상태
  const [gradientMode, setGradientMode] = useState<{elementId: string|null, enabled: boolean}>({elementId: null, enabled: false});
  const [gradientFrom, setGradientFrom] = useState('#4F46E5');
  const [gradientTo, setGradientTo] = useState('#9333EA');
  

  
  // 텍스트 선택 감지 및 자동 색상 피커 활성화
  const handleTextSelect = (elementId: string, inputRef: React.RefObject<HTMLInputElement | HTMLTextAreaElement>) => {
    const input = inputRef.current;
    if (!input) return;
    
    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    
    if (start !== end) {
      setSelectedRange({ elementId, start, end });
    } else {
      setSelectedRange(null);
    }
  };

  // 텍스트 필드 포커스 시 자동 색상 피커 활성화
  const handleTextFocus = (elementId: string) => {
    if (!colorPickerMode.isActive || colorPickerMode.elementId !== elementId) {
      startColorPreview(elementId);
    }
  };

  // 색상 미리보기 시작
  const startColorPreview = (elementId: string) => {
    const element = textElements.find(el => el.id === elementId);
    if (!element) return;
    
    setColorPickerMode({
      isActive: true,
      elementId,
      originalColor: element.color || '#000000',
      originalColorSegments: element.colorSegments || undefined,
      previewColor: null
    });
  };

  // 색상 미리보기 적용
  const applyColorPreview = (elementId: string, color: string) => {
    setColorPickerMode(prev => ({ ...prev, previewColor: color }));
    
    // 선택된 범위가 있으면 부분 색상 미리보기
    if (selectedRange && selectedRange.elementId === elementId) {
      const element = textElements.find(el => el.id === elementId);
      if (!element) return;
      
      const { start, end } = selectedRange;
      const existingSegments = element.colorSegments || [];
      const newSegment: ColorSegment = { start, end, color };
      
      let updatedSegments = existingSegments.filter(segment => 
        segment.end <= start || segment.start >= end
      );
      
      existingSegments.forEach(segment => {
        if (segment.start < start && segment.end > start && segment.end <= end) {
          updatedSegments.push({ ...segment, end: start });
        } else if (segment.start >= start && segment.start < end && segment.end > end) {
          updatedSegments.push({ ...segment, start: end });
        } else if (segment.start < start && segment.end > end) {
          updatedSegments.push({ ...segment, end: start });
          updatedSegments.push({ ...segment, start: end });
        }
      });
      
      updatedSegments.push(newSegment);
      updatedSegments.sort((a, b) => a.start - b.start);
      
      onUpdateText(elementId, { colorSegments: updatedSegments });
    } else {
      // 전체 색상 미리보기
      onUpdateText(elementId, { color });
    }
  };

  // 색상 변경 확인
  const confirmColorChange = () => {
    setColorPickerMode({
      isActive: false,
      elementId: null,
      originalColor: null,
      originalColorSegments: undefined,
      previewColor: null
    });
    setSelectedRange(null);
  };

  // 색상 변경 취소
  const cancelColorChange = () => {
    if (!colorPickerMode.isActive || !colorPickerMode.elementId) return;
    
    // 원래 색상으로 복구
    if (colorPickerMode.originalColorSegments) {
      onUpdateText(colorPickerMode.elementId, { 
        color: colorPickerMode.originalColor || undefined,
        colorSegments: colorPickerMode.originalColorSegments 
      });
    } else {
      onUpdateText(colorPickerMode.elementId, { 
        color: colorPickerMode.originalColor || undefined,
        colorSegments: []
      });
    }
    
    setColorPickerMode({
      isActive: false,
      elementId: null,
      originalColor: null,
      originalColorSegments: undefined,
      previewColor: null
    });
    setSelectedRange(null);
  };

  // 색상 즉시 적용 - 엑셀 스타일 (기존 방식 유지)
  const applyColorInstantly = (elementId: string, color: string) => {
    // 선택된 범위가 있으면 부분 색상 적용
    if (selectedRange && selectedRange.elementId === elementId) {
      applyPartialColor(elementId, color);
    } else {
      // 선택된 범위가 없으면 전체 색상 적용
      onUpdateText(elementId, { color });
    }
  };
    
  // 부분 색상 변경 함수
  const applyPartialColor = (elementId: string, color: string) => {
    if (!selectedRange || selectedRange.elementId !== elementId) return;
    
    const { start, end } = selectedRange;
    const element = textElements.find(el => el.id === elementId);
    if (!element) return;
    
    // 기존 colorSegments 복사 또는 새로 생성
    const existingSegments = element.colorSegments || [];
    
    // 새로운 세그먼트 생성
    const newSegment: ColorSegment = { start, end, color };
    
    // 기존 세그먼트와 겹치는 부분 처리
    let updatedSegments = existingSegments.filter(segment => 
      segment.end <= start || segment.start >= end
    );
    
    // 부분적으로 겹치는 세그먼트 처리
    existingSegments.forEach(segment => {
      if (segment.start < start && segment.end > start && segment.end <= end) {
        updatedSegments.push({ ...segment, end: start });
      } else if (segment.start >= start && segment.start < end && segment.end > end) {
        updatedSegments.push({ ...segment, start: end });
      } else if (segment.start < start && segment.end > end) {
        updatedSegments.push({ ...segment, end: start });
        updatedSegments.push({ ...segment, start: end });
      }
    });
    
    // 새 세그먼트 추가
    updatedSegments.push(newSegment);
    updatedSegments.sort((a, b) => a.start - b.start);
    
    onUpdateText(elementId, { colorSegments: updatedSegments });
    setSelectedRange(null);
  };

  // 통합 색상 선택기 컴포넌트
  const renderUnifiedColorPicker = () => {
    const isActiveColorPicker = colorPickerMode.isActive;
    const currentElement = textElements.find(el => el.id === colorPickerMode.elementId);
    const currentColor = currentElement?.color || '#000000';
    
    // 선택된 요소 이름 표시
    const getElementDisplayName = (elementId: string) => {
      switch(elementId) {
        case 'sub-title': return '서브타이틀';
        case 'main-title': return '메인타이틀';
        case 'bottom-sub-title': return '하단 서브타이틀';
        case 'button-text': return '버튼 텍스트';
        default: return '자유 텍스트';
      }
    };
    
    return (
      <div className="mb-4 p-3 bg-gray-50 border rounded">
        <div className="text-sm font-medium text-gray-700 mb-2">
          통합 색상 선택기
        </div>
        
        {/* 현재 선택된 요소 표시 */}
        {isActiveColorPicker ? (
          <div className="mb-2">
            <div className="text-xs text-blue-700 mb-1">
              편집 중: {colorPickerMode.elementId ? getElementDisplayName(colorPickerMode.elementId) : ''}
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded p-2 text-xs text-yellow-800">
              미리보기 중입니다. 확인 또는 취소를 선택해주세요.
            </div>
          </div>
        ) : (
          <div className="text-xs text-gray-500 mb-2">
            텍스트 입력 필드를 클릭하면 색상 편집이 활성화됩니다
          </div>
        )}
        
        <FigmaColorPicker
          key={`${colorPickerMode.elementId}-${currentColor}`}
          color={currentColor}
          onChange={(color) => {
            // 색상이 변경될 때마다 즉시 미리보기에 반영
            if (colorPickerMode.elementId) {
              applyColorPreview(colorPickerMode.elementId, color);
            }
          }}
          onPreview={(color) => {
            // 드래그 중일 때도 실시간 반영
            if (colorPickerMode.elementId) {
              applyColorPreview(colorPickerMode.elementId, color);
            }
          }}
          onConfirm={confirmColorChange}
          onCancel={cancelColorChange}
          showPreviewControls={isActiveColorPicker}
        />
      </div>
    );
  };

  const handleAddText = () => {
    if (!newText.trim()) return;

    const newElement: TextElement = {
      id: Date.now().toString(),
      type: 'free',
      text: newText,
      x: 50,
      y: 50,
      width: 200,
      height: 100,
      fontSize: 24,
      fontFamily: 'Pretendard',
      fontWeight: 400,
      color: '#000000',
      editable: { position: true, size: true, color: true }
    };

    onAddText(newElement);
    setNewText('');
  };

  // 메인타이틀과 서브타이틀, 버튼 텍스트, 하단 서브타이틀 분리
  const mainTitle = textElements.find(el => el.id === 'main-title');
  const subTitle = textElements.find(el => el.id === 'sub-title');
  const bottomSubTitle = textElements.find(el => el.id === 'bottom-sub-title');
  const buttonText = textElements.find(el => el.id === 'button-text');
  const otherTexts = textElements.filter(el => el.id !== 'main-title' && el.id !== 'sub-title' && el.id !== 'bottom-sub-title' && el.id !== 'button-text');

  // 텍스트 색상/그라데이션 UI 렌더링 보완
  const renderColorControls = (element: TextElement) => (
    <div className="flex flex-col gap-1 mt-2">
      <div className="flex items-center gap-2">
        <span className="text-xs">색상</span>
        <input
          type="color"
          value={element.color}
          onChange={e => onUpdateText(element.id, { color: e.target.value })}
          disabled={gradientMode.enabled && gradientMode.elementId === element.id}
        />
      </div>
      {/* 그라데이션 토글 항상 표시, 작고 미니멀하게 */}
      <div className="flex items-center gap-2 ml-1 mt-1">
        <label className="flex items-center gap-1 text-xs cursor-pointer">
          <input
            type="checkbox"
            checked={gradientMode.enabled && gradientMode.elementId === element.id}
            onChange={e => {
              setGradientMode({elementId: element.id, enabled: e.target.checked});
              if (e.target.checked) {
                onUpdateText(element.id, { gradient: { from: gradientFrom, to: gradientTo } });
              } else {
                onUpdateText(element.id, { gradient: undefined });
              }
            }}
            className="w-3 h-3"
          />
          <span className="text-xs">그라데이션</span>
        </label>
        {/* 토글이 켜진 경우에만 색상 선택 */}
        {gradientMode.enabled && gradientMode.elementId === element.id && (
          <div className="flex items-center gap-1 ml-2">
            <span className="text-xs">시작</span>
            <input type="color" value={gradientFrom} onChange={e => {
              setGradientFrom(e.target.value);
              onUpdateText(element.id, { gradient: { from: e.target.value, to: gradientTo } });
            }} className="w-5 h-5 p-0 border rounded" />
            <span className="text-xs">→</span>
            <span className="text-xs">끝</span>
            <input type="color" value={gradientTo} onChange={e => {
              setGradientTo(e.target.value);
              onUpdateText(element.id, { gradient: { from: gradientFrom, to: e.target.value } });
            }} className="w-5 h-5 p-0 border rounded" />
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className={showBackground ? "bg-white rounded-lg shadow-lg p-4" : ""}>
      {showTitle && <h2 className="text-lg font-semibold mb-3">텍스트 편집</h2>}

      {/* 서브타이틀 편집 - 컴팩트하게 */}
      {config.subTitle && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center space-x-2">
              <h3 className="font-medium text-sm">서브타이틀</h3>
              <button
                onClick={() => setSelectedElementId(selectedElementId === 'sub-title' ? null : 'sub-title')}
                className={`text-xs px-2 py-1 rounded transition-colors ${
                  selectedElementId === 'sub-title'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {selectedElementId === 'sub-title' ? '선택됨' : '위치 조정'}
              </button>
            </div>
            <span className="text-xs text-gray-500">
              {subTitle?.text?.length || 0}/{config.subTitle.maxLength}
            </span>
          </div>
          
                    <input
            ref={subTitleInputRef}
            type="text"
            value={subTitle?.text || ''}
            onChange={(e) => onUpdateText('sub-title', { text: e.target.value })}
            onFocus={() => handleTextFocus('sub-title')}
            onSelect={() => handleTextSelect('sub-title', subTitleInputRef)}
            onMouseUp={() => handleTextSelect('sub-title', subTitleInputRef)}
            onKeyUp={() => handleTextSelect('sub-title', subTitleInputRef)}
            className="w-full px-3 py-2 border rounded mb-2 text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
            placeholder="서브타이틀 입력"
            maxLength={config.subTitle.maxLength}
          />
          
          {/* 선택된 텍스트 표시 - 더 컴팩트하게 */}
          {selectedRange && selectedRange.elementId === 'sub-title' && (
            <div className="bg-blue-50 border border-blue-200 rounded p-2 mb-2">
              <div className="text-xs text-blue-700">선택된 텍스트: "{(subTitle?.text || '').substring(selectedRange.start, selectedRange.end)}"</div>
              </div>
            )}
        </div>
      )}

      {/* 메인타이틀 편집 - 컴팩트하게 */}
      {config.mainTitle && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center space-x-2">
              <h3 className="font-medium text-sm">메인타이틀</h3>
              <button
                onClick={() => setSelectedElementId(selectedElementId === 'main-title' ? null : 'main-title')}
                className={`text-xs px-2 py-1 rounded transition-colors ${
                  selectedElementId === 'main-title'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {selectedElementId === 'main-title' ? '선택됨' : '위치 조정'}
              </button>
            </div>
            <span className="text-xs text-gray-500">
              {mainTitle?.text?.length || 0}/{config.mainTitle.maxLength}
            </span>
          </div>
          
                    <textarea
            ref={mainTitleInputRef}
            value={mainTitle?.text || ''}
            onChange={(e) => onUpdateText('main-title', { text: e.target.value })}
            onFocus={() => handleTextFocus('main-title')}
            onSelect={() => handleTextSelect('main-title', mainTitleInputRef)}
            onMouseUp={() => handleTextSelect('main-title', mainTitleInputRef)}
            onKeyUp={() => handleTextSelect('main-title', mainTitleInputRef)}
            className="w-full px-3 py-2 border rounded mb-2 min-h-[70px] resize-y text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
            placeholder="메인타이틀 입력 (여러 줄 가능)"
            maxLength={config.mainTitle.maxLength}
          />
          
                    {/* 선택된 텍스트 표시 - 더 컴팩트하게 */}
          {selectedRange && selectedRange.elementId === 'main-title' && (
            <div className="bg-blue-50 border border-blue-200 rounded p-2 mb-2">
              <div className="text-xs text-blue-700">선택된 텍스트: "{(mainTitle?.text || '').substring(selectedRange.start, selectedRange.end)}"</div>
              </div>
            )}
              </div>
            )}
            
      {/* 하단 서브타이틀 편집 - 컴팩트하게 */}
      {config.bottomSubTitle && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center space-x-2">
              <h3 className="font-medium text-sm">하단 서브타이틀</h3>
                <button
                onClick={() => setSelectedElementId(selectedElementId === 'bottom-sub-title' ? null : 'bottom-sub-title')}
                className={`text-xs px-2 py-1 rounded transition-colors ${
                  selectedElementId === 'bottom-sub-title'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {selectedElementId === 'bottom-sub-title' ? '선택됨' : '위치 조정'}
                </button>
            </div>
            <span className="text-xs text-gray-500">
              {bottomSubTitle?.text?.length || 0}/{config.bottomSubTitle.maxLength}
            </span>
                  </div>
                  
                                        <input
            ref={bottomSubTitleInputRef}
            type="text"
            value={bottomSubTitle?.text || ''}
            onChange={(e) => onUpdateText('bottom-sub-title', { text: e.target.value })}
            onFocus={() => handleTextFocus('bottom-sub-title')}
            onSelect={() => handleTextSelect('bottom-sub-title', bottomSubTitleInputRef)}
            onMouseUp={() => handleTextSelect('bottom-sub-title', bottomSubTitleInputRef)}
            onKeyUp={() => handleTextSelect('bottom-sub-title', bottomSubTitleInputRef)}
            className="w-full px-3 py-2 border rounded mb-2 text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
            placeholder="하단 서브타이틀 입력"
            maxLength={config.bottomSubTitle.maxLength}
          />
          
                    {/* 선택된 텍스트 표시 - 더 컴팩트하게 */}
          {selectedRange && selectedRange.elementId === 'bottom-sub-title' && (
            <div className="bg-blue-50 border border-blue-200 rounded p-2 mb-2">
              <div className="text-xs text-blue-700">선택된 텍스트: "{(bottomSubTitle?.text || '').substring(selectedRange.start, selectedRange.end)}"</div>
              </div>
            )}
        </div>
      )}

      {/* 버튼 텍스트 편집 - 노란색 박스 제거하고 컴팩트하게 */}
      {config.buttonText && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center space-x-2">
              <h3 className="font-medium text-sm">버튼 텍스트</h3>
              <button
                onClick={() => setSelectedElementId(selectedElementId === 'button-text' ? null : 'button-text')}
                className={`text-xs px-2 py-1 rounded transition-colors ${
                  selectedElementId === 'button-text'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {selectedElementId === 'button-text' ? '선택됨' : '위치 조정'}
              </button>
            </div>
            <span className="text-xs text-gray-500">
              {buttonText?.text?.length || 0}/{config.buttonText.maxLength}
            </span>
          </div>
          
          <div className="text-xs text-gray-600 mb-2">
            행동 유도 버튼에 표시됩니다. 예: "지금 시작", "자세히 보기"
          </div>
          
          <input
            type="text"
            value={buttonText?.text || ''}
            onChange={(e) => onUpdateText('button-text', { text: e.target.value })}
            onFocus={() => handleTextFocus('button-text')}
            className="w-full px-3 py-2 border rounded mb-3 text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
            placeholder="버튼 텍스트 입력"
            maxLength={config.buttonText.maxLength}
          />
          
          {/* 버튼 텍스트 색상 설정 - 더 컴팩트하게 */}
          <div className="grid grid-cols-2 gap-3 mb-2">
             <div>
              <label className="text-xs font-medium block mb-1">텍스트 색상</label>
               <div className="flex items-center gap-2">
                 <input
                   type="color"
                   value={buttonText?.color || '#FFFFFF'}
                  onInput={(e) => onUpdateText('button-text', { color: (e.target as HTMLInputElement).value })}
                  onChange={(e) => onUpdateText('button-text', { color: (e.target as HTMLInputElement).value })}
                   className="w-8 h-8 border rounded cursor-pointer"
                 />
                 <span className="text-xs text-gray-500">{buttonText?.color || '#FFFFFF'}</span>
               </div>
             </div>
             <div>
              <label className="text-xs font-medium block mb-1">배경 색상</label>
               <div className="flex items-center gap-2">
                 <input
                   type="color"
                   value={buttonText?.backgroundColor || '#4F46E5'}
                  onInput={(e) => onUpdateText('button-text', { backgroundColor: (e.target as HTMLInputElement).value })}
                  onChange={(e) => onUpdateText('button-text', { backgroundColor: (e.target as HTMLInputElement).value })}
                   className="w-8 h-8 border rounded cursor-pointer"
                 />
                 <span className="text-xs text-gray-500">{buttonText?.backgroundColor || '#4F46E5'}</span>
               </div>
             </div>
           </div>
           
          {/* 빠른 색상 선택 - 더 컴팩트하게 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">빠른 텍스트 색상</label>
             <div className="flex flex-wrap gap-1">
               {[
                 '#FFFFFF', '#000000', '#FF6B35', '#F7931E', 
                 '#FFD700', '#32CD32', '#4169E1', '#8A2BE2'
               ].map((color) => (
                 <button
                   key={color}
                    className="w-5 h-5 rounded border border-gray-300 cursor-pointer hover:border-gray-400 transition-colors"
                   style={{ backgroundColor: color }}
                   onClick={() => onUpdateText('button-text', { color })}
                   title={`텍스트 색상: ${color}`}
                 />
               ))}
             </div>
           </div>
           
           <div>
              <label className="block text-xs text-gray-600 mb-1">빠른 배경 색상</label>
             <div className="flex flex-wrap gap-1">
               {[
                 '#4F46E5', '#059669', '#DC2626', '#7C2D12', 
                 '#7C3AED', '#DB2777', '#EA580C', '#000000'
               ].map((color) => (
                 <button
                   key={color}
                    className="w-5 h-5 rounded border border-gray-300 cursor-pointer hover:border-gray-400 transition-colors"
                   style={{ backgroundColor: color }}
                   onClick={() => onUpdateText('button-text', { backgroundColor: color })}
                   title={`배경 색상: ${color}`}
                 />
               ))}
              </div>
             </div>
          </div>
        </div>
      )}

      {/* 추가 텍스트 입력 - 초록색 박스 제거하고 컴팩트하게 */}
      {config.allowCustomText && (
      <div className="mb-4">
        <h3 className="font-medium text-sm mb-2">자유 텍스트 추가</h3>
        <div className="text-xs text-gray-600 mb-2">
          원하는 위치에 텍스트를 추가하고 색상, 크기, 위치를 자유롭게 조정할 수 있습니다.
        </div>
        <div className="space-y-2">
          <textarea
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            className="w-full px-3 py-2 border rounded min-h-[60px] resize-y text-sm"
            placeholder="새 텍스트를 입력하세요&#10;(여러 줄 입력 가능)"
          />
          <button
            onClick={handleAddText}
            disabled={!newText.trim()}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm"
          >
            텍스트 추가하기
          </button>
        </div>
      </div>
      )}

      {/* Position Control Panel - 인터랙티브 배너에서만 표시 */}
      {selectedElementId && config.dbType === 'interactive' && (
        <div className="mb-4">
          <h3 className="font-medium text-sm mb-2">위치 및 정렬 조정</h3>
          <PositionControlPanel
            selectedElement={textElements.find(el => el.id === selectedElementId) || null}
            onUpdateElement={onUpdateText}
            canvasWidth={config.width}
            canvasHeight={config.height}
          />
        </div>
      )}

      {/* 추가된 텍스트 목록 */}
      {config.allowCustomText && otherTexts.length > 0 && (
        <div>
          <h3 className="font-medium text-sm mb-2">추가된 자유 텍스트 ({otherTexts.length}개)</h3>
          <div className="space-y-2">
            {otherTexts.map((element) => (
              <div 
                key={element.id} 
                className={`border rounded p-2 cursor-pointer transition-all text-sm ${
                  selectedElementId === element.id 
                    ? 'bg-blue-50 border-blue-300 shadow-sm' 
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                }`}
                onClick={() => setSelectedElementId(element.id === selectedElementId ? null : element.id)}
              >
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-medium text-gray-700">텍스트 #{element.id.slice(-4)}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedElementId(element.id === selectedElementId ? null : element.id);
                      }}
                      className={`text-xs px-1 py-0.5 rounded transition-all ${
                        selectedElementId === element.id
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {selectedElementId === element.id ? '선택됨' : '편집'}
                    </button>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteText(element.id);
                    }}
                    className="px-1 py-0.5 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                  >
                    ✕ 삭제
                  </button>
                </div>
                
                {/* 텍스트 입력 */}
                <textarea
                  value={element.text}
                  onChange={(e) => onUpdateText(element.id, { text: e.target.value })}
                  onFocus={() => handleTextFocus(element.id)}
                  className="w-full px-3 py-2 border rounded mb-3 min-h-[60px] resize-y text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
                  placeholder="텍스트를 입력하세요"
                />
                
                {/* 텍스트 스타일 설정 */}
                <div className="space-y-3">
                  {renderColorControls(element)}
                  
                  {/* 폰트 굵기 */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">폰트 굵기</label>
                    <select
                      value={element.fontWeight || 400}
                      onChange={(e) => onUpdateText(element.id, { fontWeight: parseInt(e.target.value) })}
                      className="w-full px-2 py-1 text-sm border rounded"
                    >
                      <option value={100}>얇게 (100)</option>
                      <option value={200}>가늘게 (200)</option>
                      <option value={300}>밝게 (300)</option>
                      <option value={400}>보통 (400)</option>
                      <option value={500}>중간 (500)</option>
                      <option value={600}>반굵게 (600)</option>
                      <option value={700}>굵게 (700)</option>
                      <option value={800}>더굵게 (800)</option>
                      <option value={900}>매우굵게 (900)</option>
                    </select>
                  </div>
                  
                  {/* 크기 조정 */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">너비</label>
                      <input
                        type="number"
                        value={element.width}
                        onChange={(e) => onUpdateText(element.id, { width: parseInt(e.target.value) || 100 })}
                        className="w-full px-2 py-1 text-sm border rounded"
                        min="10"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">높이</label>
                      <input
                        type="number"
                        value={element.height}
                        onChange={(e) => onUpdateText(element.id, { height: parseInt(e.target.value) || 30 })}
                        className="w-full px-2 py-1 text-sm border rounded"
                        min="10"
                      />
                    </div>
                  </div>
                  
                  {/* 위치 조정 안내 */}
                  <div className="border rounded p-2 bg-gray-50 border-gray-200">
                    <div className="text-xs text-gray-700">
                      {selectedElementId === element.id ? (
                        <>위치 조정 활성화: 상단의 "위치 및 정렬 조정" 패널에서 정밀한 위치 조정이 가능합니다.</>
                      ) : (
                        <>위치 조정: 편집 버튼을 클릭하면 상단에 위치 조정 패널이 나타납니다.</>
                      )}
                    </div>
                  </div>
                  
                  {/* 빠른 색상 선택 */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">빠른 색상 선택</label>
                    <div className="flex flex-wrap gap-1">
                      {[
                        '#FF0000', '#FF6B35', '#F7931E', '#FFD700', 
                        '#32CD32', '#00CED1', '#4169E1', '#8A2BE2', 
                        '#FF1493', '#000000', '#666666', '#FFFFFF'
                      ].map((color) => (
                        <button
                          key={color}
                          className="w-5 h-5 rounded border border-gray-300 cursor-pointer hover:border-gray-400 transition-colors"
                          style={{ backgroundColor: color }}
                          onClick={() => onUpdateText(element.id, { color })}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 통합 색상 선택기 - 하단에 배치 */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        {renderUnifiedColorPicker()}
      </div>

    </div>
  );
}; 