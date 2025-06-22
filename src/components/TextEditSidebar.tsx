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
    
    console.log('Applying color segments:', updatedSegments);
    onUpdateText(elementId, { colorSegments: updatedSegments });
    
    // 선택 범위 초기화
    setSelectedRange(null);
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
          
          {/* 색상 설정 섹션 */}
          <div className="bg-gray-50 rounded-lg p-3 space-y-3">
            <h4 className="text-sm font-semibold text-gray-700">🎨 색상 설정</h4>
            
            {/* 선택된 텍스트 표시 */}
            {selectedRange && selectedRange.elementId === 'sub-title' ? (
              <div className="bg-green-50 border border-green-200 rounded p-2">
                <div className="text-xs text-green-700 font-medium">선택된 텍스트</div>
                <div className="text-sm text-green-800 font-mono bg-white px-2 py-1 rounded mt-1">
                  "{(subTitle?.text || '').substring(selectedRange.start, selectedRange.end)}"
                </div>
                <div className="text-xs text-green-600 mt-1">
                  아래 색상을 클릭하여 선택된 부분의 색상을 변경하세요
                </div>
              </div>
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded p-2">
                <div className="text-xs text-blue-700">
                  💡 <strong>부분 색상 변경:</strong> 위 텍스트를 드래그로 선택한 후 색상을 클릭하세요
                </div>
              </div>
            )}
            
            {/* 색상 팔레트 */}
            <div>
              <div className="text-xs text-gray-600 mb-2">색상 팔레트</div>
              <div className="flex flex-wrap gap-2">
                {[
                  { color: '#FF0000', name: '빨강' },
                  { color: '#FF6B35', name: '주황' },
                  { color: '#F7931E', name: '오렌지' },
                  { color: '#FFD700', name: '금색' },
                  { color: '#32CD32', name: '초록' },
                  { color: '#00CED1', name: '청록' },
                  { color: '#4169E1', name: '파랑' },
                  { color: '#8A2BE2', name: '보라' },
                  { color: '#FF1493', name: '핑크' },
                  { color: '#000000', name: '검정' },
                  { color: '#666666', name: '회색' },
                  { color: '#FFFFFF', name: '흰색' }
                ].map(({ color, name }) => (
                  <button
                    key={color}
                    className="w-8 h-8 rounded-lg border-2 border-gray-300 cursor-pointer hover:scale-110 hover:border-gray-400 transition-all shadow-sm"
                    style={{ backgroundColor: color }}
                    onClick={() => applyPartialColor('sub-title', color)}
                    title={`${name} (${color})`}
                  />
                ))}
              </div>
            </div>
            
            {/* 초기화 버튼 */}
            <button
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs py-2 px-3 rounded transition-colors"
              onClick={() => onUpdateText('sub-title', { colorSegments: [] })}
            >
              🔄 부분 색상 초기화
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
          
          {/* 색상 설정 섹션 */}
          <div className="bg-gray-50 rounded-lg p-3 space-y-3">
            <h4 className="text-sm font-semibold text-gray-700">🎨 색상 설정</h4>
            
            {/* 선택된 텍스트 표시 */}
            {selectedRange && selectedRange.elementId === 'main-title' ? (
              <div className="bg-green-50 border border-green-200 rounded p-2">
                <div className="text-xs text-green-700 font-medium">선택된 텍스트</div>
                <div className="text-sm text-green-800 font-mono bg-white px-2 py-1 rounded mt-1">
                  "{(mainTitle?.text || '').substring(selectedRange.start, selectedRange.end)}"
                </div>
                <div className="text-xs text-green-600 mt-1">
                  아래 색상을 클릭하여 선택된 부분의 색상을 변경하세요
                </div>
              </div>
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded p-2">
                <div className="text-xs text-blue-700">
                  💡 <strong>부분 색상 변경:</strong> 위 텍스트를 드래그로 선택한 후 색상을 클릭하세요
                </div>
              </div>
            )}
            
            {/* 색상 팔레트 */}
            <div>
              <div className="text-xs text-gray-600 mb-2">색상 팔레트</div>
              <div className="flex flex-wrap gap-2">
                {[
                  { color: '#FF0000', name: '빨강' },
                  { color: '#FF6B35', name: '주황' },
                  { color: '#F7931E', name: '오렌지' },
                  { color: '#FFD700', name: '금색' },
                  { color: '#32CD32', name: '초록' },
                  { color: '#00CED1', name: '청록' },
                  { color: '#4169E1', name: '파랑' },
                  { color: '#8A2BE2', name: '보라' },
                  { color: '#FF1493', name: '핑크' },
                  { color: '#000000', name: '검정' },
                  { color: '#666666', name: '회색' },
                  { color: '#FFFFFF', name: '흰색' }
                ].map(({ color, name }) => (
                  <button
                    key={color}
                    className="w-8 h-8 rounded-lg border-2 border-gray-300 cursor-pointer hover:scale-110 hover:border-gray-400 transition-all shadow-sm"
                    style={{ backgroundColor: color }}
                    onClick={() => applyPartialColor('main-title', color)}
                    title={`${name} (${color})`}
                  />
                ))}
              </div>
            </div>
            
            {/* 초기화 버튼 */}
            <button
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs py-2 px-3 rounded transition-colors"
              onClick={() => onUpdateText('main-title', { colorSegments: [] })}
            >
              🔄 부분 색상 초기화
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