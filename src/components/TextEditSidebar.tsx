import { useState, useRef } from 'react';
import { BannerConfig, TextElement, ColorSegment } from '../types';
import FigmaColorPicker from './FigmaColorPicker';
import { mergeSegments, getMultiLineRanges } from '../utils/textSegments';

// 텍스트 정규화 함수
const textNormalize = (s: string | undefined): string => s?.replace(/\r\n/g, '\n') ?? '';

interface TextEditSidebarProps {
  config: BannerConfig;
  textElements: TextElement[];
  onAddText: (text: TextElement) => void;
  onUpdateText: ({ target, patch }: { target: 'subtitle' | 'mainTitle'; patch: Partial<TextElement> }) => void;
  onUpdateTextLegacy: (id: string, updates: Partial<TextElement>) => void;
  onDeleteText: (id: string) => void;
  showTitle?: boolean;
  showBackground?: boolean;
}

export const TextEditSidebar: React.FC<TextEditSidebarProps> = ({
  config,
  textElements,
  onAddText,
  onUpdateText,
  onUpdateTextLegacy,
  onDeleteText,
  showTitle = true,
  showBackground = true
}) => {
  // 기본배너 PC 전용 preset 검증
  const isBasicBannerPC = config.dbType === 'basic-pc' || config.dbType === 'basic-pc-logo';
  const isBasicBannerPCLogo = config.dbType === 'basic-pc-logo';
  const [newText, setNewText] = useState('');
  const [selectionRange, setSelectionRange] = useState<{start: number, end: number} | null>(null);
  const [selectionRanges, setSelectionRanges] = useState<Array<{line: number, start: number, end: number}> | null>(null);
  const [activeTextKey, setActiveTextKey] = useState<'subtitle' | 'mainTitle'>('subtitle');
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
      setSelectionRange({ start, end });
    } else {
      setSelectionRange(null);
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

  // throttle 함수
  const throttle = (func: Function, delay: number) => {
    let timeoutId: NodeJS.Timeout | null = null;
    let lastExecTime = 0;
    return (...args: any[]) => {
      const currentTime = Date.now();
      
      if (currentTime - lastExecTime > delay) {
        func(...args);
        lastExecTime = currentTime;
      } else {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          func(...args);
          lastExecTime = Date.now();
        }, delay - (currentTime - lastExecTime));
      }
    };
  };

  // 색상 미리보기 적용
  const applyColorPreview = ({ target, color, mode, cancel }: { 
    target: 'subtitle' | 'mainTitle'; 
    color: string; 
    mode: any;
    cancel?: boolean;
  }) => {
    console.debug('[APPLY_PREVIEW]', { target, selectionRanges, color, mode, cancel });
    
    const elementId = target === 'subtitle' ? 'sub-title' : 'main-title';
    setColorPickerMode(prev => ({ ...prev, previewColor: color }));
    
    if (cancel) {
      // 미리보기 상태 초기화
      onUpdateText({ target, patch: { previewSegments: [] } });
      return;
    }
    
    // 선택된 범위가 있으면 부분 색상 미리보기
    if (selectionRanges && selectionRanges.length > 0) {
      const element = textElements.find(el => el.id === elementId);
      if (!element) return;
      
      const existingSegments = element.colorSegments || [];
      const updatedSegments = mergeSegments(existingSegments, selectionRanges, color);
      
      onUpdateText({ target, patch: { previewSegments: updatedSegments } });
    } else {
      // 선택 범위가 비었거나 공백이면 전체 텍스트에 적용
      const element = textElements.find(el => el.id === elementId);
      if (element) {
        const text = element.text;
        const fullRanges = getMultiLineRanges(text, 0, text.length);
        const existingSegments = element.colorSegments || [];
        const updatedSegments = mergeSegments(existingSegments, fullRanges, color);
        
        onUpdateText({ target, patch: { previewSegments: updatedSegments } });
      } else {
        // 전체 색상 미리보기 - segments 비우기
        onUpdateText({ target, patch: { color, colorSegments: [], previewSegments: [] } });
      }
    }
  };

  // throttled applyColorPreview
  const throttledApplyColorPreview = throttle(applyColorPreview, 16);

  // 색상 변경 확인
  const confirmColorChange = () => {
    if (colorPickerMode.previewColor && colorPickerMode.elementId) {
      // 최종 색상 적용
      const elementId = colorPickerMode.elementId;
      const target = elementId === 'sub-title' ? 'subtitle' : 'mainTitle';
      applyColorInstantly({ target, color: colorPickerMode.previewColor });
    }
    
    setColorPickerMode({
      isActive: false,
      elementId: null,
      originalColor: null,
      originalColorSegments: undefined,
      previewColor: null
    });
    setSelectionRange(null);
  };

  // 색상 변경 취소
  const cancelColorChange = () => {
    if (!colorPickerMode.isActive || !colorPickerMode.elementId) return;
    
    // 미리보기 상태 초기화
    const elementId = colorPickerMode.elementId;
    const target = elementId === 'sub-title' ? 'subtitle' : 'mainTitle';
    
    applyColorPreview({ target, color: '', mode: colorPickerMode, cancel: true });
    
    setColorPickerMode({
      isActive: false,
      elementId: null,
      originalColor: null,
      originalColorSegments: undefined,
      previewColor: null
    });
    setSelectionRange(null);
  };

  // 색상 즉시 적용 - 엑셀 스타일 (기존 방식 유지)
  const applyColorInstantly = ({ target, color }: { 
    target: 'subtitle' | 'mainTitle'; 
    color: string; 
  }) => {
    console.debug('[APPLY_NOW]', { target, selectionRanges, color });
    
    const elementId = target === 'subtitle' ? 'sub-title' : 'main-title';
    const element = textElements.find(el => el.id === elementId);
    if (!element) return;
    
    // 선택된 범위가 있으면 부분 색상 적용
    if (selectionRanges && selectionRanges.length > 0) {
      const existingSegments = element.colorSegments || [];
      const updatedSegments = mergeSegments(existingSegments, selectionRanges, color);
      
      onUpdateText({ target, patch: { colorSegments: updatedSegments, previewSegments: [] } });
    } else {
      // 선택 범위가 비었거나 공백이면 전체 텍스트에 적용
      const text = element.text;
      const fullRanges = getMultiLineRanges(text, 0, text.length);
      const existingSegments = element.colorSegments || [];
      const updatedSegments = mergeSegments(existingSegments, fullRanges, color);
      
      onUpdateText({ target, patch: { colorSegments: updatedSegments, previewSegments: [] } });
    }
  };
    
  // 부분 색상 변경 함수 (줄 단위)
  const applyPartialColor = (elementId: string, color: string) => {
    if (!selectionRanges || selectionRanges.length === 0) return;
    
    const element = textElements.find(el => el.id === elementId);
    if (!element) return;
    
    // 기존 colorSegments 복사 또는 새로 생성
    const existingSegments = element.colorSegments || [];
    
    // 줄 단위로 세그먼트 병합
    const updatedSegments = mergeSegments(existingSegments, selectionRanges, color);
    
    const target = elementId === 'sub-title' ? 'subtitle' : 'mainTitle';
    onUpdateText({ target, patch: { colorSegments: updatedSegments } });
    setSelectionRange(null);
    setSelectionRanges(null);
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
            console.debug('[PICKER]', { activeTextKey, selectionRanges, color });
            // 색상이 변경될 때마다 즉시 미리보기에 반영
            if (colorPickerMode.elementId) {
              throttledApplyColorPreview({ target: activeTextKey, color, mode: colorPickerMode });
            }
          }}
          onPreview={(color) => {
            // 드래그 중일 때도 실시간 반영
            if (colorPickerMode.elementId) {
              throttledApplyColorPreview({ target: activeTextKey, color, mode: colorPickerMode });
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
      fontPxAtBase: 24, // 기준 해상도에서의 폰트 크기
      fontFamily: 'Pretendard',
      fontWeight: 400,
      color: '#000000',
      editable: { position: true, size: true, color: true }
    };

    onAddText(newElement);
    setNewText('');
  };

  // 메인타이틀과 서브타이틀, 버튼 텍스트, 하단 서브타이틀, CTA 버튼 분리
  const mainTitle = textElements.find(el => el.id === 'main-title');
  const subTitle = textElements.find(el => el.id === 'sub-title');
  const bottomSubTitle = textElements.find(el => el.id === 'bottom-sub-title');
  const buttonText = textElements.find(el => el.id === 'button-text');
  const ctaButton = textElements.find(el => el.id === 'cta-button');
  const otherTexts = textElements.filter(el => el.id !== 'main-title' && el.id !== 'sub-title' && el.id !== 'bottom-sub-title' && el.id !== 'button-text' && el.id !== 'cta-button');

  // 텍스트 색상/그라데이션 UI 렌더링 보완
  const renderColorControls = (element: TextElement) => (
    <div className="flex flex-col gap-1 mt-2">
      <div className="flex items-center gap-2">
        <span className="text-xs">색상</span>
        <input
          type="color"
          value={element.color}
          onChange={e => onUpdateTextLegacy(element.id, { color: e.target.value })}
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
                onUpdateTextLegacy(element.id, { gradient: { from: gradientFrom, to: gradientTo } });
              } else {
                onUpdateTextLegacy(element.id, { gradient: undefined });
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
              onUpdateTextLegacy(element.id, { gradient: { from: e.target.value, to: gradientTo } });
            }} className="w-5 h-5 p-0 border rounded" />
            <span className="text-xs">→</span>
            <span className="text-xs">끝</span>
            <input type="color" value={gradientTo} onChange={e => {
              setGradientTo(e.target.value);
              onUpdateTextLegacy(element.id, { gradient: { from: gradientFrom, to: e.target.value } });
            }} className="w-5 h-5 p-0 border rounded" />
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className={showBackground ? "bg-white rounded-lg shadow-lg p-4" : ""}>
      {showTitle && <h2 className="text-lg font-semibold mb-3">텍스트 편집</h2>}

      {/* 서브타이틀 편집 - 기본배너 PC preset 강제 적용 */}
      {config.subTitle && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center space-x-2">
              <h3 className="font-medium text-sm">서브타이틀</h3>
              {isBasicBannerPC && (
                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-500 rounded">
                  고정 위치
                </span>
              )}
            </div>
            <span className="text-xs text-gray-500">
              {subTitle?.text?.length || 0}/{isBasicBannerPC ? 20 : config.subTitle.maxLength} | {subTitle?.text?.split('\n').length || 0}/{isBasicBannerPC ? 1 : config.subTitle.maxLines || 1}줄
            </span>
          </div>
          
                    <input
            ref={subTitleInputRef}
            type="text"
            value={subTitle?.text || ''}
            onChange={(e) => onUpdateText({ target: 'subtitle', patch: { text: e.target.value } })}
            onFocus={() => {
              handleTextFocus('sub-title');
              setActiveTextKey('subtitle');
            }}
            onSelect={(e) => {
              const target = e.target as HTMLInputElement;
              const start = target.selectionStart || 0;
              const end = target.selectionEnd || 0;
              const normalizedText = textNormalize(target.value);
              
              setSelectionRange({ start, end });
              setSelectionRanges(getMultiLineRanges(normalizedText, start, end));
              handleTextSelect('sub-title', subTitleInputRef);
            }}
            onMouseUp={() => handleTextSelect('sub-title', subTitleInputRef)}
            onKeyUp={() => handleTextSelect('sub-title', subTitleInputRef)}
            className="w-full px-3 py-2 border rounded mb-2 text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
            placeholder={isBasicBannerPC ? "서브타이틀 입력 (최대 20자, 1줄)" : "서브타이틀 입력"}
            maxLength={isBasicBannerPC ? 20 : config.subTitle.maxLength}
          />
          
                    {/* 선택된 텍스트 표시 - 더 컴팩트하게 */}
          {selectionRange && activeTextKey === 'subtitle' && (
            <div className="bg-blue-50 border border-blue-200 rounded p-2 mb-2">
              <div className="text-xs text-blue-700">선택된 텍스트: "{(subTitle?.text || '').substring(selectionRange.start, selectionRange.end)}"</div>
              </div>
          )}
        </div>
      )}

      {/* 메인타이틀 편집 - 기본배너 PC preset 강제 적용 */}
      {config.mainTitle && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center space-x-2">
              <h3 className="font-medium text-sm">메인타이틀</h3>
              {isBasicBannerPC && (
                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-500 rounded">
                  고정 위치
                </span>
              )}
            </div>
            <span className="text-xs text-gray-500">
              {mainTitle?.text?.length || 0}/{isBasicBannerPC ? 36 : config.mainTitle.maxLength} | {mainTitle?.text?.split('\n').length || 0}/2줄
            </span>
          </div>
          
                    <textarea
            ref={mainTitleInputRef}
            value={mainTitle?.text || ''}
            onChange={(e) => {
              onUpdateText({ target: 'mainTitle', patch: { text: e.target.value.replace(/\r\n/g, '\n') } });
            }}
            onFocus={() => {
              handleTextFocus('main-title');
              setActiveTextKey('mainTitle');
            }}
            onSelect={(e) => {
              const target = e.target as HTMLTextAreaElement;
              const start = target.selectionStart || 0;
              const end = target.selectionEnd || 0;
              const normalizedText = textNormalize(target.value);
              
              setSelectionRange({ start, end });
              setSelectionRanges(getMultiLineRanges(normalizedText, start, end));
              handleTextSelect('main-title', mainTitleInputRef);
            }}
            onMouseUp={() => handleTextSelect('main-title', mainTitleInputRef)}
            onKeyUp={() => handleTextSelect('main-title', mainTitleInputRef)}
            className="w-full px-3 py-2 border rounded mb-2 min-h-[70px] resize-y text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
            placeholder={isBasicBannerPC ? `메인타이틀 입력 (최대 36자, ${isBasicBannerPCLogo ? '2줄' : '1줄'} 가능)` : "메인타이틀 입력 (여러 줄 가능)"}
            maxLength={isBasicBannerPC ? 36 : config.mainTitle.maxLength}
          />
          
                                        {/* 선택된 텍스트 표시 - 더 컴팩트하게 */}
          {selectionRange && activeTextKey === 'mainTitle' && (
            <div className="bg-blue-50 border border-blue-200 rounded p-2 mb-2">
              <div className="text-xs text-blue-700">선택된 텍스트: "{(mainTitle?.text || '').substring(selectionRange.start, selectionRange.end)}"</div>
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
            </div>
            <span className="text-xs text-gray-500">
              {bottomSubTitle?.text?.length || 0}/{config.bottomSubTitle.maxLength} | {bottomSubTitle?.text?.split('\n').length || 0}/{config.bottomSubTitle.maxLines || 1}줄
            </span>
                  </div>
                  
                                        <input
            ref={bottomSubTitleInputRef}
            type="text"
            value={bottomSubTitle?.text || ''}
            onChange={(e) => onUpdateTextLegacy('bottom-sub-title', { text: e.target.value })}
            onFocus={() => handleTextFocus('bottom-sub-title')}
            onSelect={() => handleTextSelect('bottom-sub-title', bottomSubTitleInputRef)}
            onMouseUp={() => handleTextSelect('bottom-sub-title', bottomSubTitleInputRef)}
            onKeyUp={() => handleTextSelect('bottom-sub-title', bottomSubTitleInputRef)}
            className="w-full px-3 py-2 border rounded mb-2 text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
            placeholder="하단 서브타이틀 입력"
            maxLength={config.bottomSubTitle.maxLength}
          />
          
                                        {/* 선택된 텍스트 표시 - 더 컴팩트하게 */}
          {selectionRange && activeTextKey === 'subtitle' && (
            <div className="bg-blue-50 border border-blue-200 rounded p-2 mb-2">
              <div className="text-xs text-blue-700">선택된 텍스트: "{(bottomSubTitle?.text || '').substring(selectionRange.start, selectionRange.end)}"</div>
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
            </div>
            <span className="text-xs text-gray-500">
              {buttonText?.text?.length || 0}/{config.buttonText.maxLength} | {buttonText?.text?.split('\n').length || 0}/{config.buttonText.maxLines || 1}줄
            </span>
          </div>
          
          <div className="text-xs text-gray-600 mb-2">
            행동 유도 버튼에 표시됩니다. 예: "지금 시작", "자세히 보기"
          </div>
          
          <input
            type="text"
            value={buttonText?.text || ''}
            onChange={(e) => onUpdateTextLegacy('button-text', { text: e.target.value })}
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
                  onInput={(e) => onUpdateTextLegacy('button-text', { color: (e.target as HTMLInputElement).value })}
                  onChange={(e) => onUpdateTextLegacy('button-text', { color: (e.target as HTMLInputElement).value })}
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
                  onInput={(e) => onUpdateTextLegacy('button-text', { backgroundColor: (e.target as HTMLInputElement).value })}
                  onChange={(e) => onUpdateTextLegacy('button-text', { backgroundColor: (e.target as HTMLInputElement).value })}
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
                   onClick={() => onUpdateTextLegacy('button-text', { color })}
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
                   onClick={() => onUpdateTextLegacy('button-text', { backgroundColor: color })}
                   title={`배경 색상: ${color}`}
                 />
               ))}
              </div>
             </div>
          </div>
        </div>
      )}

      {/* CTA 버튼 텍스트 편집 */}
      {ctaButton && config.ctaButton && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-medium text-sm mb-2 text-yellow-800">CTA 버튼 텍스트</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium mb-1">버튼 텍스트</label>
              <input
                type="text"
                value={ctaButton.text || ''}
                onChange={(e) => onUpdateTextLegacy('cta-button', { text: e.target.value })}
                placeholder={config.ctaButton.placeholder || '버튼 텍스트를 입력하세요'}
                maxLength={config.ctaButton.maxLength || 20}
                className="w-full px-3 py-2 border rounded text-sm"
              />
              {config.ctaButton.maxLength && (
                <div className="text-xs text-gray-500 mt-1">
                  {ctaButton.text?.length || 0}/{config.ctaButton.maxLength}
                </div>
              )}
            </div>
            
            {/* CTA 버튼 색상 편집 */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium block mb-1">텍스트 색상</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={ctaButton.color || '#000000'}
                    onChange={(e) => onUpdateTextLegacy('cta-button', { color: e.target.value })}
                    className="w-8 h-8 border rounded cursor-pointer"
                  />
                  <span className="text-xs text-gray-500">{ctaButton.color || '#000000'}</span>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium block mb-1">배경 색상</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={ctaButton.backgroundColor || '#FFD700'}
                    onChange={(e) => onUpdateTextLegacy('cta-button', { backgroundColor: e.target.value })}
                    className="w-8 h-8 border rounded cursor-pointer"
                  />
                  <span className="text-xs text-gray-500">{ctaButton.backgroundColor || '#FFD700'}</span>
                </div>
              </div>
            </div>
            
            {/* 빠른 색상 선택 */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">빠른 텍스트 색상</label>
                <div className="flex flex-wrap gap-1">
                  {[
                    '#000000', '#FFFFFF', '#FF6B35', '#F7931E', 
                    '#FFD700', '#32CD32', '#4169E1', '#8A2BE2'
                  ].map((color) => (
                    <button
                      key={color}
                      className="w-5 h-5 rounded border border-gray-300 cursor-pointer hover:border-gray-400 transition-colors"
                      style={{ backgroundColor: color }}
                      onClick={() => onUpdateTextLegacy('cta-button', { color })}
                      title={`텍스트 색상: ${color}`}
                    />
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-xs text-gray-600 mb-1">빠른 배경 색상</label>
                <div className="flex flex-wrap gap-1">
                  {[
                    '#FFD700', '#4F46E5', '#059669', '#DC2626', 
                    '#7C3AED', '#DB2777', '#EA580C', '#000000'
                  ].map((color) => (
                    <button
                      key={color}
                      className="w-5 h-5 rounded border border-gray-300 cursor-pointer hover:border-gray-400 transition-colors"
                      style={{ backgroundColor: color }}
                      onClick={() => onUpdateTextLegacy('cta-button', { backgroundColor: color })}
                      title={`배경 색상: ${color}`}
                    />
                  ))}
                </div>
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

      {/* Position Control Panel - 선택된 요소가 있을 때만 표시 */}

      {/* 추가된 텍스트 목록 */}
      {config.allowCustomText && otherTexts.length > 0 && (
        <div>
          <h3 className="font-medium text-sm mb-2">추가된 자유 텍스트 ({otherTexts.length}개)</h3>
          <div className="space-y-2">
            {otherTexts.map((element) => (
              <div 
                key={element.id} 
                className="border rounded p-2 cursor-pointer transition-all text-sm bg-gray-50 border-gray-200 hover:bg-gray-100"
              >
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-medium text-gray-700">텍스트 #{element.id.slice(-4)}</span>
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
                  onChange={(e) => onUpdateTextLegacy(element.id, { text: e.target.value })}
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
                      onChange={(e) => onUpdateTextLegacy(element.id, { fontWeight: parseInt(e.target.value) })}
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
                        onChange={(e) => onUpdateTextLegacy(element.id, { width: parseInt(e.target.value) || 100 })}
                        className="w-full px-2 py-1 text-sm border rounded"
                        min="10"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">높이</label>
                      <input
                        type="number"
                        value={element.height}
                        onChange={(e) => onUpdateTextLegacy(element.id, { height: parseInt(e.target.value) || 30 })}
                        className="w-full px-2 py-1 text-sm border rounded"
                        min="10"
                      />
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
                          onClick={() => onUpdateTextLegacy(element.id, { color })}
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