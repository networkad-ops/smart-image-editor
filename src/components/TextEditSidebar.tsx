import { useState, useRef } from 'react';
import { BannerConfig, TextElement, ColorSegment } from '../types';
import { PositionControlPanel } from './PositionControlPanel';

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
  const [previewColor, setPreviewColor] = useState<string>('#000000');
  const [isColorPickerOpen, setIsColorPickerOpen] = useState<boolean>(false);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
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
      setIsColorPickerOpen(false); // 새로 선택하면 컬러 피커 닫기
    } else {
      setSelectedRange(null);
      setIsColorPickerOpen(false);
    }
  };

  // 미리보기용 색상 변경
  const handleColorPreview = (color: string) => {
    setPreviewColor(color);
  };

  // 색상 선택 시작
  const startColorPicking = () => {
    if (selectedRange) {
      setIsColorPickerOpen(true);
      // 현재 선택된 부분의 색상을 가져와서 초기값으로 설정
      const element = textElements.find(el => el.id === selectedRange.elementId);
      if (element) {
        const existingSegment = element.colorSegments?.find(seg => 
          seg.start <= selectedRange.start && seg.end >= selectedRange.end
        );
        setPreviewColor(existingSegment?.color || element.color || '#000000');
      }
    }
  };

  // 색상 적용 완료
  const applyColorFinal = () => {
    if (selectedRange) {
      applyPartialColor(selectedRange.elementId, previewColor);
      setIsColorPickerOpen(false);
    }
  };

  // 색상 적용 취소
  const cancelColorPicking = () => {
    setIsColorPickerOpen(false);
    setSelectedRange(null);
  };

  // 부분 색상 변경 함수
  const applyPartialColor = (elementId: string, color: string) => {
    let start: number, end: number;
    
    if (selectedRange && selectedRange.elementId === elementId) {
      // 저장된 선택 범위 사용
      start = selectedRange.start;
      end = selectedRange.end;
      console.log('저장된 선택 범위 사용:', { elementId, start, end, color });
    } else {
      // 현재 선택 범위 확인
      const inputRef = elementId === 'sub-title' ? subTitleInputRef : mainTitleInputRef;
      const input = inputRef.current;
      if (!input) {
        console.log('Input이 없음:', elementId);
        return;
      }
      
      start = input.selectionStart || 0;
      end = input.selectionEnd || 0;
      console.log('현재 선택 범위:', { elementId, start, end, color });
    }
    
    if (start === end) {
      // 선택된 텍스트가 없으면 전체 색상 변경
      console.log('선택된 텍스트가 없어서 전체 색상 변경:', { elementId, color });
      onUpdateText(elementId, { color });
      return;
    }
    
    const element = textElements.find(el => el.id === elementId);
    if (!element) {
      console.log('Element를 찾을 수 없음:', elementId);
      return;
    }
    
    console.log('선택된 텍스트:', element.text?.substring(start, end));
    
    // 기존 colorSegments 복사 또는 새로 생성
    const existingSegments = element.colorSegments || [];
    
    // 새로운 세그먼트 생성
    const newSegment: ColorSegment = {
      start,
      end,
      color
    };
    
    console.log('새 세그먼트:', newSegment);
    console.log('기존 세그먼트:', existingSegments);
    
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
    
    console.log('최종 세그먼트:', updatedSegments);
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

  // 메인타이틀과 서브타이틀, 버튼 텍스트 분리
  const mainTitle = textElements.find(el => el.id === 'main-title');
  const subTitle = textElements.find(el => el.id === 'sub-title');
  const buttonText = textElements.find(el => el.id === 'button-text');
  const otherTexts = textElements.filter(el => el.id !== 'main-title' && el.id !== 'sub-title' && el.id !== 'button-text');

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-4">📝 텍스트 편집</h2>
      
      {/* 배너 타입 안내 */}
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="text-xs text-blue-700">
          {config.fixedText ? (
            <>
              💡 <strong>기본 배너:</strong> 고정된 위치의 텍스트를 편집할 수 있습니다.
            </>
          ) : (
            <>
              🎨 <strong>자유 배너:</strong> 텍스트를 자유롭게 추가하고 위치와 크기를 조정할 수 있습니다.
            </>
          )}
        </div>
      </div>

      {/* 전체 텍스트 초기화 */}
      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="text-xs text-red-700">
            💥 <strong>전체 초기화:</strong> 모든 텍스트를 한 번에 지웁니다
          </div>
          <button
            onClick={() => {
              if (window.confirm('모든 텍스트를 지우시겠습니까? (취소할 수 없습니다)')) {
                // 모든 고정 텍스트 초기화
                textElements.forEach(element => {
                  if (element.type === 'fixed') {
                    onUpdateText(element.id, { text: '', colorSegments: [] });
                  }
                });
                // 자유 텍스트는 삭제
                textElements.forEach(element => {
                  if (element.type === 'free') {
                    onDeleteText(element.id);
                  }
                });
              }
            }}
            className="text-xs px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-all"
          >
            🗑️ 전체 지우기
          </button>
        </div>
      </div>
      
      {/* 서브타이틀 편집 */}
      {config.subTitle && config.fixedText && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center space-x-2">
              <h3 className="font-medium">🏷️ 서브타이틀</h3>
              <button
                onClick={() => setSelectedElementId(selectedElementId === 'sub-title' ? null : 'sub-title')}
                className={`text-xs px-2 py-1 rounded transition-all ${
                  selectedElementId === 'sub-title'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {selectedElementId === 'sub-title' ? '선택됨' : '위치 조정'}
              </button>
              {/* 텍스트 초기화 버튼 추가 */}
              <button
                onClick={() => onUpdateText('sub-title', { text: '' })}
                className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-all"
                title="서브타이틀 내용 지우기"
              >
                🗑️ 지우기
              </button>
              {/* 텍스트 복사 버튼 */}
              <button
                onClick={async () => {
                  if (subTitle?.text) {
                    await navigator.clipboard.writeText(subTitle.text);
                    alert('서브타이틀이 복사되었습니다!');
                  }
                }}
                className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-all"
                title="서브타이틀 복사"
              >
                📋 복사
              </button>
            </div>
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
          
          {/* 부분 색상 설정 */}
          <div className="bg-gray-50 rounded-lg p-3 space-y-3">
            <h4 className="text-sm font-semibold text-gray-700">🎨 부분 색상 변경</h4>
            
            {/* 선택된 텍스트 표시 */}
            {selectedRange && selectedRange.elementId === 'sub-title' ? (
              <div className="bg-green-50 border border-green-200 rounded p-2">
                <div className="text-xs text-green-700 font-medium">✅ 선택된 텍스트</div>
                <div className="text-sm text-green-800 font-mono bg-white px-2 py-1 rounded mt-1">
                  "{(subTitle?.text || '').substring(selectedRange.start, selectedRange.end)}"
                </div>
                <div className="text-xs text-green-600 mt-1">
                  위치 {selectedRange.start + 1}~{selectedRange.end}글자 | 아래 색상을 선택하세요
                </div>
              </div>
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded p-2">
                <div className="text-xs text-blue-700">
                  💡 <strong>사용법:</strong> 위 텍스트를 마우스로 드래그하여 선택한 후, 원하는 색상을 클릭하세요
                </div>
              </div>
            )}
            
            {/* 부분 색상 선택 */}
            <div>
              <div className="text-xs text-gray-600 mb-2">
                {selectedRange && selectedRange.elementId === 'sub-title' ? '선택 부분에 적용할 색상' : '부분 색상 (텍스트 선택 후 사용)'}
              </div>
              
              {/* 색상 선택 UI */}
              {!isColorPickerOpen ? (
                // 색상 선택 시작 버튼
                <button
                  onClick={startColorPicking}
                  disabled={!selectedRange || selectedRange.elementId !== 'sub-title'}
                  className={`w-full px-4 py-3 rounded-lg border-2 transition-all ${
                    selectedRange && selectedRange.elementId === 'sub-title' 
                      ? 'border-blue-400 bg-blue-50 text-blue-700 hover:bg-blue-100' 
                      : 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {selectedRange && selectedRange.elementId === 'sub-title' 
                    ? '🎨 선택 부분 색상 변경하기' 
                    : '텍스트를 먼저 드래그로 선택해주세요'}
                </button>
              ) : selectedRange && selectedRange.elementId === 'sub-title' ? (
                // 색상 선택 중
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-3">
                  <div className="text-sm font-medium text-blue-800">
                    🎨 색상 선택 중... (미리보기)
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={previewColor}
                      onChange={(e) => handleColorPreview(e.target.value)}
                      className="w-12 h-12 border-2 border-blue-400 rounded-lg cursor-pointer"
                      title="색상을 선택하여 미리보기"
                    />
                    <div className="flex-1">
                      <div className="text-xs text-blue-700 font-medium">선택한 색상: {previewColor}</div>
                      <div className="text-xs text-blue-600">색상을 바꿔가며 미리보기하세요</div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={applyColorFinal}
                      className="flex-1 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm font-medium"
                    >
                      ✅ 적용 완료
                    </button>
                    <button
                      onClick={cancelColorPicking}
                      className="px-3 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 text-sm"
                    >
                      ❌ 취소
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
            
            {/* 초기화 버튼 */}
            <button
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs py-2 px-3 rounded transition-colors"
              onClick={() => onUpdateText('sub-title', { colorSegments: [] })}
            >
              🔄 부분 색상 모두 초기화
            </button>
          </div>
        </div>
      )}

      {/* 메인타이틀 편집 */}
      {config.mainTitle && config.fixedText && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center space-x-2">
              <h3 className="font-medium">🎯 메인타이틀</h3>
              <button
                onClick={() => setSelectedElementId(selectedElementId === 'main-title' ? null : 'main-title')}
                className={`text-xs px-2 py-1 rounded transition-all ${
                  selectedElementId === 'main-title'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {selectedElementId === 'main-title' ? '선택됨' : '위치 조정'}
              </button>
              {/* 텍스트 초기화 버튼 추가 */}
              <button
                onClick={() => onUpdateText('main-title', { text: '' })}
                className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-all"
                title="메인타이틀 내용 지우기"
              >
                🗑️ 지우기
              </button>
              {/* 텍스트 복사 버튼 */}
              <button
                onClick={async () => {
                  if (mainTitle?.text) {
                    await navigator.clipboard.writeText(mainTitle.text);
                    alert('메인타이틀이 복사되었습니다!');
                  }
                }}
                className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-all"
                title="메인타이틀 복사"
              >
                📋 복사
              </button>
            </div>
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
          
          {/* 부분 색상 설정 */}
          <div className="bg-gray-50 rounded-lg p-3 space-y-3">
            <h4 className="text-sm font-semibold text-gray-700">🎨 부분 색상 변경</h4>
            
            {/* 선택된 텍스트 표시 */}
            {selectedRange && selectedRange.elementId === 'main-title' ? (
              <div className="bg-green-50 border border-green-200 rounded p-2">
                <div className="text-xs text-green-700 font-medium">✅ 선택된 텍스트</div>
                <div className="text-sm text-green-800 font-mono bg-white px-2 py-1 rounded mt-1">
                  "{(mainTitle?.text || '').substring(selectedRange.start, selectedRange.end)}"
                </div>
                <div className="text-xs text-green-600 mt-1">
                  위치 {selectedRange.start + 1}~{selectedRange.end}글자 | 아래 색상을 선택하세요
                </div>
              </div>
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded p-2">
                <div className="text-xs text-blue-700">
                  💡 <strong>사용법:</strong> 위 텍스트를 마우스로 드래그하여 선택한 후, 원하는 색상을 클릭하세요
                </div>
              </div>
            )}
            
            {/* 부분 색상 선택 */}
            <div>
              <div className="text-xs text-gray-600 mb-2">
                {selectedRange && selectedRange.elementId === 'main-title' ? '선택 부분에 적용할 색상' : '부분 색상 (텍스트 선택 후 사용)'}
              </div>
              
              {/* 색상 선택 UI */}
              {!isColorPickerOpen ? (
                // 색상 선택 시작 버튼
                <button
                  onClick={startColorPicking}
                  disabled={!selectedRange || selectedRange.elementId !== 'main-title'}
                  className={`w-full px-4 py-3 rounded-lg border-2 transition-all ${
                    selectedRange && selectedRange.elementId === 'main-title' 
                      ? 'border-blue-400 bg-blue-50 text-blue-700 hover:bg-blue-100' 
                      : 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {selectedRange && selectedRange.elementId === 'main-title' 
                    ? '🎨 선택 부분 색상 변경하기' 
                    : '텍스트를 먼저 드래그로 선택해주세요'}
                </button>
              ) : selectedRange && selectedRange.elementId === 'main-title' ? (
                // 색상 선택 중
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-3">
                  <div className="text-sm font-medium text-blue-800">
                    🎨 색상 선택 중... (미리보기)
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={previewColor}
                      onChange={(e) => handleColorPreview(e.target.value)}
                      className="w-12 h-12 border-2 border-blue-400 rounded-lg cursor-pointer"
                      title="색상을 선택하여 미리보기"
                    />
                    <div className="flex-1">
                      <div className="text-xs text-blue-700 font-medium">선택한 색상: {previewColor}</div>
                      <div className="text-xs text-blue-600">색상을 바꿔가며 미리보기하세요</div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={applyColorFinal}
                      className="flex-1 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm font-medium"
                    >
                      ✅ 적용 완료
                    </button>
                    <button
                      onClick={cancelColorPicking}
                      className="px-3 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 text-sm"
                    >
                      ❌ 취소
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
            
            {/* 초기화 버튼 */}
            <button
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs py-2 px-3 rounded transition-colors"
              onClick={() => onUpdateText('main-title', { colorSegments: [] })}
            >
              🔄 부분 색상 모두 초기화
            </button>
          </div>
        </div>
      )}

      {/* 버튼 텍스트 편집 */}
      {config.buttonText && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center space-x-2">
              <h3 className="font-medium">🔘 버튼 텍스트</h3>
              <button
                onClick={() => setSelectedElementId(selectedElementId === 'button-text' ? null : 'button-text')}
                className={`text-xs px-2 py-1 rounded transition-all ${
                  selectedElementId === 'button-text'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {selectedElementId === 'button-text' ? '선택됨' : '위치 조정'}
              </button>
              {/* 버튼 텍스트 초기화 버튼 추가 */}
              <button
                onClick={() => onUpdateText('button-text', { text: '' })}
                className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-all"
                title="버튼 텍스트 내용 지우기"
              >
                🗑️ 지우기
              </button>
              {/* 텍스트 복사 버튼 */}
              <button
                onClick={async () => {
                  if (buttonText?.text) {
                    await navigator.clipboard.writeText(buttonText.text);
                    alert('버튼 텍스트가 복사되었습니다!');
                  }
                }}
                className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-all"
                title="버튼 텍스트 복사"
              >
                📋 복사
              </button>
            </div>
            <span className="text-sm text-gray-500">
              {buttonText?.text?.length || 0}/{config.buttonText.maxLength}
            </span>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
            <div className="text-xs text-yellow-700 mb-1">
              💡 <strong>버튼 텍스트:</strong> 인터랙티브 배너의 행동 유도 버튼에 표시됩니다
            </div>
            <div className="text-xs text-yellow-600">
              • 띄어쓰기 포함 최대 {config.buttonText.maxLength}글자<br/>
              • 예시: "지금 시작", "자세히 보기", "신청하기" 등
            </div>
          </div>
          
          <input
            type="text"
            value={buttonText?.text || ''}
            onChange={(e) => onUpdateText('button-text', { text: e.target.value })}
            className="w-full px-3 py-2 border rounded mb-2"
            placeholder="버튼 텍스트 입력 (예: 지금 시작)"
            maxLength={config.buttonText.maxLength}
          />
          
                     {/* 버튼 텍스트 색상 설정 */}
           <div className="grid grid-cols-2 gap-3 mb-3">
             <div>
               <label className="text-sm font-medium block mb-1">텍스트 색상:</label>
               <div className="flex items-center gap-2">
                 <input
                   type="color"
                   value={buttonText?.color || '#FFFFFF'}
                   onChange={(e) => onUpdateText('button-text', { color: e.target.value })}
                   className="w-8 h-8 border rounded cursor-pointer"
                 />
                 <span className="text-xs text-gray-500">{buttonText?.color || '#FFFFFF'}</span>
               </div>
             </div>
             <div>
               <label className="text-sm font-medium block mb-1">배경 색상:</label>
               <div className="flex items-center gap-2">
                 <input
                   type="color"
                   value={buttonText?.backgroundColor || '#4F46E5'}
                   onChange={(e) => onUpdateText('button-text', { backgroundColor: e.target.value })}
                   className="w-8 h-8 border rounded cursor-pointer"
                 />
                 <span className="text-xs text-gray-500">{buttonText?.backgroundColor || '#4F46E5'}</span>
               </div>
             </div>
           </div>
           
           {/* 빠른 텍스트 색상 선택 */}
           <div className="mb-3">
             <label className="block text-xs font-medium text-gray-600 mb-1">빠른 텍스트 색상</label>
             <div className="flex flex-wrap gap-1">
               {[
                 '#FFFFFF', '#000000', '#FF6B35', '#F7931E', 
                 '#FFD700', '#32CD32', '#4169E1', '#8A2BE2'
               ].map((color) => (
                 <button
                   key={color}
                   className="w-6 h-6 rounded border-2 border-gray-300 cursor-pointer hover:scale-110 transition-all"
                   style={{ backgroundColor: color }}
                   onClick={() => onUpdateText('button-text', { color })}
                   title={`텍스트 색상: ${color}`}
                 />
               ))}
             </div>
           </div>
           
           {/* 빠른 배경 색상 선택 */}
           <div>
             <label className="block text-xs font-medium text-gray-600 mb-1">빠른 배경 색상</label>
             <div className="flex flex-wrap gap-1">
               {[
                 '#4F46E5', '#059669', '#DC2626', '#7C2D12', 
                 '#7C3AED', '#DB2777', '#EA580C', '#000000'
               ].map((color) => (
                 <button
                   key={color}
                   className="w-6 h-6 rounded border-2 border-gray-300 cursor-pointer hover:scale-110 transition-all"
                   style={{ backgroundColor: color }}
                   onClick={() => onUpdateText('button-text', { backgroundColor: color })}
                   title={`배경 색상: ${color}`}
                 />
               ))}
             </div>
           </div>
        </div>
      )}

      {/* 추가 텍스트 입력 */}
      {config.allowCustomText && (
        <div className="mb-6">
          <h3 className="font-medium mb-2">🆕 자유 텍스트 추가</h3>
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
            <div className="text-xs text-green-700 mb-2">
              ✨ <strong>자유 텍스트:</strong> 원하는 위치에 텍스트를 추가할 수 있습니다
            </div>
            <div className="text-xs text-green-600">
              • 색상, 크기, 굵기, 위치와 크기를 자유롭게 조정 가능<br/>
              • 여러 줄 텍스트 지원<br/>
              • Position Control Panel로 정밀한 위치 조정
            </div>
          </div>
          <div className="space-y-2">
            <textarea
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              className="w-full px-3 py-2 border rounded min-h-[60px] resize-y"
              placeholder="새 텍스트를 입력하세요&#10;(여러 줄 입력 가능)"
            />
            <button
              onClick={handleAddText}
              disabled={!newText.trim()}
              className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              ➕ 텍스트 추가하기
            </button>
          </div>
        </div>
      )}

      {/* Position Control Panel - 선택된 요소가 있을 때만 표시 */}
      {selectedElementId && (
        <div className="mb-6">
          <h3 className="font-medium mb-2">🎯 위치 및 정렬 조정</h3>
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
          <h3 className="font-medium mb-2">추가된 자유 텍스트 ({otherTexts.length}개)</h3>
          <div className="space-y-4">
            {otherTexts.map((element) => (
              <div 
                key={element.id} 
                className={`border rounded p-3 cursor-pointer transition-all ${
                  selectedElementId === element.id 
                    ? 'bg-blue-50 border-blue-300 shadow-md' 
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                }`}
                onClick={() => setSelectedElementId(element.id === selectedElementId ? null : element.id)}
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-700">텍스트 #{element.id.slice(-4)}</span>
                    {selectedElementId === element.id && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">선택됨</span>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteText(element.id);
                    }}
                    className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                  >
                    ✕ 삭제
                  </button>
                </div>
                
                {/* 텍스트 입력 */}
                <textarea
                  value={element.text}
                  onChange={(e) => onUpdateText(element.id, { text: e.target.value })}
                  className="w-full px-3 py-2 border rounded mb-3 min-h-[60px] resize-y"
                  placeholder="텍스트를 입력하세요"
                />
                
                {/* 텍스트 스타일 설정 */}
                <div className="space-y-3">
                  {/* 색상 및 크기 */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">색상</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={element.color}
                          onChange={(e) => onUpdateText(element.id, { color: e.target.value })}
                          className="w-8 h-8 border rounded cursor-pointer"
                        />
                        <span className="text-xs text-gray-500">{element.color}</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">크기</label>
                      <input
                        type="number"
                        value={element.fontSize}
                        onChange={(e) => onUpdateText(element.id, { fontSize: parseInt(e.target.value) || 24 })}
                        className="w-full px-2 py-1 text-sm border rounded"
                        min="8"
                        max="100"
                      />
                    </div>
                  </div>
                  
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
                  <div className="bg-blue-50 border border-blue-200 rounded p-2">
                    <div className="text-xs text-blue-700">
                      💡 <strong>위치 조정:</strong> 상단의 "위치 조정" 버튼을 클릭하여 Position Control Panel을 사용하세요!
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
                          className="w-6 h-6 rounded border-2 border-gray-300 cursor-pointer hover:scale-110 transition-all"
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
    </div>
  );
}; 