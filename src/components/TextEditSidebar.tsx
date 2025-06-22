import { useState, useRef } from 'react';
import { BannerConfig, TextElement, ColorSegment } from '../types';

interface TextEditSidebarProps {
  config: BannerConfig;
  textElements: TextElement[];
  onAddText: (text: TextElement) => void;
  onUpdateText: (id: string, updates: Partial<TextElement>) => void;
  onDeleteText: (id: string) => void;
}

export const TextEditSidebar: React.FC<TextEditSidebarProps> = ({
  config,
  textElements,
  onAddText,
  onUpdateText,
  onDeleteText
}) => {
  const [newText, setNewText] = useState('');
  const [selectedRange, setSelectedRange] = useState<{elementId: string, start: number, end: number} | null>(null);
  const subTitleInputRef = useRef<HTMLInputElement>(null);
  const mainTitleInputRef = useRef<HTMLTextAreaElement>(null);
  
  // 텍스트 선택 감지
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
  
  // 부분 색상 변경 함수
  const applyPartialColor = (elementId: string, color: string) => {
    let start: number, end: number;
    
    if (selectedRange && selectedRange.elementId === elementId) {
      // 저장된 선택 범위 사용
      start = selectedRange.start;
      end = selectedRange.end;
    } else {
      // 현재 선택 범위 확인
      const inputRef = elementId === 'sub-title' ? subTitleInputRef : mainTitleInputRef;
      const input = inputRef.current;
      if (!input) return;
      
      start = input.selectionStart || 0;
      end = input.selectionEnd || 0;
    }
    
    if (start === end) {
      // 선택된 텍스트가 없으면 전체 색상 변경
      onUpdateText(elementId, { color });
      return;
    }
    
    const element = textElements.find(el => el.id === elementId);
    if (!element) return;
    
    // 기존 colorSegments 복사 또는 새로 생성
    const existingSegments = element.colorSegments || [];
    
    // 새로운 세그먼트 생성
    const newSegment: ColorSegment = {
      start,
      end,
      color
    };
    
    // 기존 세그먼트와 겹치는 부분 처리
    let updatedSegments = existingSegments.filter(segment => 
      segment.end <= start || segment.start >= end
    );
    
    // 부분적으로 겹치는 세그먼트 처리
    existingSegments.forEach(segment => {
      if (segment.start < start && segment.end > start && segment.end <= end) {
        // 앞부분만 남김
        updatedSegments.push({
          ...segment,
          end: start
        });
      } else if (segment.start >= start && segment.start < end && segment.end > end) {
        // 뒷부분만 남김
        updatedSegments.push({
          ...segment,
          start: end
        });
      } else if (segment.start < start && segment.end > end) {
        // 중간이 잘리는 경우 - 앞뒤로 분할
        updatedSegments.push({
          ...segment,
          end: start
        });
        updatedSegments.push({
          ...segment,
          start: end
        });
      }
    });
    
    // 새 세그먼트 추가
    updatedSegments.push(newSegment);
    
    // 세그먼트를 시작 위치순으로 정렬
    updatedSegments.sort((a, b) => a.start - b.start);
    
    onUpdateText(elementId, { colorSegments: updatedSegments });
    
    // 선택 범위 초기화
    setSelectedRange(null);
  };

  const handleAddText = () => {
    if (!newText.trim()) return;

    const newElement: TextElement = {
      id: Date.now().toString(),
      type: 'custom',
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

  // 메인타이틀과 서브타이틀 분리
  const mainTitle = textElements.find(el => el.id === 'main-title');
  const subTitle = textElements.find(el => el.id === 'sub-title');
  const otherTexts = textElements.filter(el => el.id !== 'main-title' && el.id !== 'sub-title');

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-4">텍스트 편집</h2>
      
      {/* 서브타이틀 편집 */}
      {config.subTitle && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium">서브타이틀</h3>
            <span className="text-sm text-gray-500">
              {subTitle?.text?.length || 0}/{config.subTitle.maxLength}
            </span>
          </div>
          <input
            ref={subTitleInputRef}
            type="text"
            value={subTitle?.text || ''}
            onChange={(e) => onUpdateText('sub-title', { text: e.target.value })}
            onSelect={() => handleTextSelect('sub-title', subTitleInputRef)}
            onMouseUp={() => handleTextSelect('sub-title', subTitleInputRef)}
            onKeyUp={() => handleTextSelect('sub-title', subTitleInputRef)}
            className="w-full px-3 py-2 border rounded mb-2"
            placeholder="서브타이틀 입력 (한 줄만 가능)"
            maxLength={config.subTitle.maxLength}
          />
          
          {/* 서브타이틀 색상 설정 */}
          <div className="flex items-center gap-2 mb-2">
            <label className="text-sm font-medium">전체 색상:</label>
            <input
              type="color"
              value={subTitle?.color || '#000000'}
              onChange={(e) => onUpdateText('sub-title', { color: e.target.value })}
              className="w-8 h-8 border rounded cursor-pointer"
            />
            <span className="text-xs text-gray-500">{subTitle?.color || '#000000'}</span>
          </div>
          
          {/* 부분 색상 변경 안내 */}
          <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
            💡 <strong>부분 색상 변경:</strong> 텍스트를 드래그하여 선택한 후 아래 색상을 클릭하세요
            {selectedRange && selectedRange.elementId === 'sub-title' && (
              <div className="mt-1 text-green-600">
                ✓ 선택됨: "{(subTitle?.text || '').substring(selectedRange.start, selectedRange.end)}"
              </div>
            )}
          </div>
          
          {/* 부분 색상 변경용 색상 팔레트 */}
          <div className="flex gap-1 mt-2">
            {['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080'].map((color) => (
              <button
                key={color}
                className="w-6 h-6 rounded border border-gray-300 cursor-pointer hover:scale-110 transition-transform"
                style={{ backgroundColor: color }}
                onClick={() => applyPartialColor('sub-title', color)}
                title={`색상: ${color}`}
              />
            ))}
            <button
              className="w-6 h-6 rounded border border-gray-300 cursor-pointer hover:scale-110 transition-transform bg-white text-xs flex items-center justify-center"
              onClick={() => onUpdateText('sub-title', { colorSegments: [] })}
              title="부분 색상 초기화"
            >
              ↺
            </button>
          </div>
        </div>
      )}

      {/* 메인타이틀 편집 */}
      {config.mainTitle && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium">메인타이틀</h3>
            <span className="text-sm text-gray-500">
              {mainTitle?.text?.length || 0}/{config.mainTitle.maxLength}
            </span>
          </div>
          <textarea
            ref={mainTitleInputRef}
            value={mainTitle?.text || ''}
            onChange={(e) => {
              const lines = e.target.value.split('\n');
              // 최대 1번만 줄바꿈 허용 (총 2줄)
              if (lines.length <= 2) {
                onUpdateText('main-title', { text: e.target.value });
              } else {
                // 첫 번째 줄바꿈까지만 허용 (2줄까지)
                const limitedText = lines.slice(0, 2).join('\n');
                onUpdateText('main-title', { text: limitedText });
              }
            }}
            onSelect={() => handleTextSelect('main-title', mainTitleInputRef)}
            onMouseUp={() => handleTextSelect('main-title', mainTitleInputRef)}
            onKeyUp={() => handleTextSelect('main-title', mainTitleInputRef)}
            className="w-full px-3 py-2 border rounded min-h-[80px] resize-y mb-2"
            placeholder="메인타이틀 입력 (최대 2줄, 줄바꿈 1번만 가능)"
            maxLength={config.mainTitle.maxLength}
            rows={2}
          />
          
          {/* 메인타이틀 색상 설정 */}
          <div className="flex items-center gap-2 mb-2">
            <label className="text-sm font-medium">전체 색상:</label>
            <input
              type="color"
              value={mainTitle?.color || '#000000'}
              onChange={(e) => onUpdateText('main-title', { color: e.target.value })}
              className="w-8 h-8 border rounded cursor-pointer"
            />
            <span className="text-xs text-gray-500">{mainTitle?.color || '#000000'}</span>
          </div>
          
          {/* 부분 색상 변경 안내 */}
          <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
            💡 <strong>부분 색상 변경:</strong> 텍스트를 드래그하여 선택한 후 아래 색상을 클릭하세요
            {selectedRange && selectedRange.elementId === 'main-title' && (
              <div className="mt-1 text-green-600">
                ✓ 선택됨: "{(mainTitle?.text || '').substring(selectedRange.start, selectedRange.end)}"
              </div>
            )}
          </div>
          
          {/* 부분 색상 변경용 색상 팔레트 */}
          <div className="flex gap-1 mt-2">
            {['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080'].map((color) => (
              <button
                key={color}
                className="w-6 h-6 rounded border border-gray-300 cursor-pointer hover:scale-110 transition-transform"
                style={{ backgroundColor: color }}
                onClick={() => applyPartialColor('main-title', color)}
                title={`색상: ${color}`}
              />
            ))}
            <button
              className="w-6 h-6 rounded border border-gray-300 cursor-pointer hover:scale-110 transition-transform bg-white text-xs flex items-center justify-center"
              onClick={() => onUpdateText('main-title', { colorSegments: [] })}
              title="부분 색상 초기화"
            >
              ↺
            </button>
          </div>
        </div>
      )}

      {/* 추가 텍스트 입력 */}
      <div className="mb-6">
        <h3 className="font-medium mb-2">추가 텍스트</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            className="flex-1 px-3 py-2 border rounded"
            placeholder="새 텍스트 입력"
          />
          <button
            onClick={handleAddText}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            추가
          </button>
        </div>
      </div>

      {/* 추가된 텍스트 목록 */}
      {otherTexts.length > 0 && (
        <div>
          <h3 className="font-medium mb-2">추가된 텍스트</h3>
          <div className="space-y-4">
            {otherTexts.map((element) => (
              <div key={element.id} className="border rounded p-3">
                <input
                  type="text"
                  value={element.text}
                  onChange={(e) => onUpdateText(element.id, { text: e.target.value })}
                  className="w-full px-3 py-2 border rounded mb-2"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => onDeleteText(element.id)}
                    className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}; 