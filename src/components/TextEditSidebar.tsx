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
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const subTitleInputRef = useRef<HTMLInputElement>(null);
  const mainTitleInputRef = useRef<HTMLTextAreaElement>(null);
  
  // 텍스트 지우기 상태 추가
  const [clearStatus, setClearStatus] = useState<{[key: string]: boolean}>({});
  
  // 색상 팔레트 정의
  const colorPalette = [
    '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
    '#800000', '#808080', '#FF8080', '#80FF80', '#8080FF', '#FFFF80', '#FF80FF', '#80FFFF',
    '#404040', '#C0C0C0', '#FF4040', '#40FF40', '#4040FF', '#FFFF40', '#FF40FF', '#40FFFF',
    '#800080', '#008080', '#808000', '#000080', '#008000', '#804000', '#400080', '#408000'
  ];
  
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

  // 색상 즉시 적용 - 엑셀 스타일
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

  // 색상 팔레트 컴포넌트
  const ColorPalette = ({ elementId, isEnabled }: { elementId: string, isEnabled: boolean }) => (
    <div className={`space-y-2 ${!isEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <div className="text-xs font-medium text-gray-700">
        🎨 색상 팔레트 {!isEnabled && '(텍스트를 선택하거나 전체 색상 변경용)'}
      </div>
      <div className="grid grid-cols-8 gap-1 p-2 bg-gray-50 rounded border">
        {colorPalette.map((color) => (
          <button
            key={color}
            className="w-6 h-6 rounded border border-gray-300 cursor-pointer hover:scale-110 hover:border-gray-500 transition-all"
            style={{ backgroundColor: color }}
            onClick={() => applyColorInstantly(elementId, color)}
            title={`색상: ${color}`}
          />
        ))}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-600">사용자 정의:</span>
        <input
          type="color"
          onChange={(e) => applyColorInstantly(elementId, e.target.value)}
          className="w-8 h-6 border rounded cursor-pointer"
          title="사용자 정의 색상"
        />
      </div>
    </div>
  );

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
              🎨 <strong>인터랙티브 배너:</strong> 서브타이틀과 메인타이틀은 중앙 정렬되며, 🎯위치 조정 버튼으로 자유롭게 이동할 수 있습니다.
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
                // 전체 지우기 상태 표시
                setClearStatus(prev => ({ ...prev, 'all': true }));
                setTimeout(() => {
                  setClearStatus(prev => ({ ...prev, 'all': false }));
                }, 3000);
              }
            }}
            className={`text-xs px-3 py-1 rounded transition-all ${
              clearStatus['all'] 
                ? 'bg-green-500 text-white border border-green-400' 
                : 'bg-red-500 text-white hover:bg-red-600'
            }`}
          >
            {clearStatus['all'] ? '✅ 모두 지워짐' : '🗑️ 전체 지우기'}
          </button>
        </div>
      </div>
      
      {/* 서브타이틀 편집 */}
      {config.subTitle && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center space-x-2">
              <h3 className="font-medium">🏷️ 서브타이틀</h3>
              <button
                onClick={() => setSelectedElementId(selectedElementId === 'sub-title' ? null : 'sub-title')}
                className={`text-xs px-2 py-1 rounded transition-colors ${
                  selectedElementId === 'sub-title'
                    ? 'bg-blue-500 text-white font-medium'
                    : 'bg-green-100 text-green-700 hover:bg-green-200 font-medium'
                }`}
              >
                {selectedElementId === 'sub-title' ? '✅ 선택됨' : '🎯 위치 조정'}
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
            className="w-full px-3 py-2 border rounded mb-3"
            placeholder="서브타이틀 입력"
            maxLength={config.subTitle.maxLength}
          />
          
          {/* 선택된 텍스트 표시 */}
          {selectedRange && selectedRange.elementId === 'sub-title' && (
            <div className="bg-green-50 border border-green-200 rounded p-2 mb-3">
              <div className="text-xs text-green-700 font-medium">✅ 선택된 텍스트</div>
              <div className="text-sm text-green-800 font-mono bg-white px-2 py-1 rounded mt-1">
                "{(subTitle?.text || '').substring(selectedRange.start, selectedRange.end)}"
              </div>
            </div>
          )}
          
          {/* 색상 팔레트 */}
          <ColorPalette elementId="sub-title" isEnabled={true} />
        </div>
      )}

      {/* 메인타이틀 편집 */}
      {config.mainTitle && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center space-x-2">
              <h3 className="font-medium">📢 메인타이틀</h3>
              <button
                onClick={() => setSelectedElementId(selectedElementId === 'main-title' ? null : 'main-title')}
                className={`text-xs px-2 py-1 rounded transition-colors ${
                  selectedElementId === 'main-title'
                    ? 'bg-blue-500 text-white font-medium'
                    : 'bg-green-100 text-green-700 hover:bg-green-200 font-medium'
                }`}
              >
                {selectedElementId === 'main-title' ? '✅ 선택됨' : '🎯 위치 조정'}
              </button>
            </div>
            <span className="text-sm text-gray-500">
              {mainTitle?.text?.length || 0}/{config.mainTitle.maxLength}
            </span>
          </div>
          
          <textarea
            ref={mainTitleInputRef}
            value={mainTitle?.text || ''}
            onChange={(e) => onUpdateText('main-title', { text: e.target.value })}
            onSelect={() => handleTextSelect('main-title', mainTitleInputRef)}
            onMouseUp={() => handleTextSelect('main-title', mainTitleInputRef)}
            onKeyUp={() => handleTextSelect('main-title', mainTitleInputRef)}
            className="w-full px-3 py-2 border rounded mb-3 min-h-[80px] resize-y"
            placeholder="메인타이틀 입력 (여러 줄 가능)"
            maxLength={config.mainTitle.maxLength}
          />
          
          {/* 선택된 텍스트 표시 */}
          {selectedRange && selectedRange.elementId === 'main-title' && (
            <div className="bg-green-50 border border-green-200 rounded p-2 mb-3">
              <div className="text-xs text-green-700 font-medium">✅ 선택된 텍스트</div>
              <div className="text-sm text-green-800 font-mono bg-white px-2 py-1 rounded mt-1">
                "{(mainTitle?.text || '').substring(selectedRange.start, selectedRange.end)}"
              </div>
            </div>
          )}
          
          {/* 색상 팔레트 */}
          <ColorPalette elementId="main-title" isEnabled={true} />
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
                className={`text-xs px-2 py-1 rounded transition-colors ${
                  selectedElementId === 'button-text'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-green-100 text-green-700 hover:bg-green-200 font-medium'
                }`}
              >
                {selectedElementId === 'button-text' ? '선택됨' : '🎯 위치 조정'}
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
                  className="w-6 h-6 rounded border-2 border-gray-300 cursor-pointer hover:border-gray-400 transition-colors"
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
                  className="w-6 h-6 rounded border-2 border-gray-300 cursor-pointer hover:border-gray-400 transition-colors"
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
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedElementId(element.id === selectedElementId ? null : element.id);
                      }}
                      className={`text-xs px-2 py-1 rounded transition-all ${
                        selectedElementId === element.id
                          ? 'bg-blue-500 text-white font-medium'
                          : 'bg-green-100 text-green-700 hover:bg-green-200 font-medium'
                      }`}
                    >
                      {selectedElementId === element.id ? '✅ 선택됨' : '🎯 위치 조정'}
                    </button>
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
                  <div className={`border rounded p-2 ${
                    selectedElementId === element.id 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-blue-50 border-blue-200'
                  }`}>
                    <div className={`text-xs ${
                      selectedElementId === element.id 
                        ? 'text-green-700' 
                        : 'text-blue-700'
                    }`}>
                      {selectedElementId === element.id ? (
                        <>
                          ✅ <strong>위치 조정 활성화:</strong> 상단의 "위치 및 정렬 조정" 패널에서 정밀한 위치 조정이 가능합니다!
                        </>
                      ) : (
                        <>
                          💡 <strong>위치 조정:</strong> 🎯위치 조정 버튼을 클릭하면 상단에 Position Control Panel이 나타납니다!
                        </>
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
                          className="w-6 h-6 rounded border-2 border-gray-300 cursor-pointer hover:border-gray-400 transition-colors"
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