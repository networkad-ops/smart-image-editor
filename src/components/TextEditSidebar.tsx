import React, { useRef } from 'react';
import { TextElement } from '../types/index';

interface TextEditSidebarProps {
  textElements: TextElement[];
  onAddText: () => void;
  onTextUpdate: (id: string, updates: Partial<TextElement>) => void;
  onTextDelete: (id: string) => void;
}

export const TextEditSidebar: React.FC<TextEditSidebarProps> = ({
  textElements,
  onAddText,
  onTextUpdate,
  onTextDelete
}) => {
  // 텍스트 속성명 라벨 추출
  const getLabel = (element: TextElement) => {
    if (element.id === 'main-title') return '메인타이틀';
    if (element.id === 'sub-title') return '서브타이틀';
    return '텍스트';
  };

  // contentEditable ref 관리
  const refs = useRef<Record<string, HTMLDivElement | null>>({});

  // 색상 변경 핸들러 (실시간 반영, 선택 영역 없으면 전체 적용)
  const handleColorChange = (element: TextElement, color: string) => {
    const ref = refs.current[element.id];
    if (!ref) return;
    const selection = window.getSelection();
    ref.focus();
    document.execCommand('styleWithCSS', false, 'true');
    if (selection && selection.rangeCount > 0 && !selection.isCollapsed && ref.contains(selection.anchorNode)) {
      // 선택 영역이 있으면 해당 영역에만 색상 적용
      document.execCommand('foreColor', false, color);
    } else {
      // 선택 영역이 없으면 전체 텍스트에 색상 적용
      const range = document.createRange();
      range.selectNodeContents(ref);
      selection?.removeAllRanges();
      selection?.addRange(range);
      document.execCommand('foreColor', false, color);
      selection?.removeAllRanges();
    }
    onTextUpdate(element.id, { text: ref.innerHTML });
  };

  // contentEditable 변경 핸들러
  const handleInput = (element: TextElement) => {
    const ref = refs.current[element.id];
    if (!ref) return;

    // 메인타이틀인 경우 줄 수 제한 처리 (최대 2줄)
    if (element.id === 'main-title') {
      // <br>을 기준으로 split, 2줄 초과 시 2줄까지만 남김
      let html = ref.innerHTML;
      const lines = html.split(/<br\s*\/?>(?!$)/i);
      if (lines.length > 2) {
        html = lines.slice(0, 2).join('<br>');
        ref.innerHTML = html;
        // 커서를 마지막에 위치
        const range = document.createRange();
        range.selectNodeContents(ref);
        range.collapse(false);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }
    onTextUpdate(element.id, { text: ref.innerHTML });
  };

  // 키보드 이벤트 핸들러
  const handleKeyDown = (element: TextElement, e: React.KeyboardEvent) => {
    if (element.id === 'main-title') {
      const ref = refs.current[element.id];
      if (!ref) return;
      // Shift+Enter로만 줄바꿈 허용, 최대 1개까지만(2줄)
      if (e.key === 'Enter') {
        const html = ref.innerHTML;
        const lines = html.split(/<br\s*\/?>(?!$)/i);
        if (!e.shiftKey) {
          e.preventDefault();
          return;
        }
        if (lines.length >= 2) {
          e.preventDefault();
          return;
        }
        // 줄바꿈 허용 (브라우저 기본 동작)
        // 이후 handleInput에서 2줄 초과 시 자동 잘림
      }
    }
  };

  // 텍스트 요소 정렬 (main-title → sub-title → 기타)
  const getOrderedElements = () => {
    const order: string[] = [];
    if (textElements.some(e => e.id === 'main-title')) order.push('main-title');
    if (textElements.some(e => e.id === 'sub-title')) order.push('sub-title');
    const fixed = textElements.filter(e => order.includes(e.id));
    const custom = textElements.filter(e => !order.includes(e.id));
    return [
      ...order.map(id => fixed.find(e => e.id === id)).filter(Boolean),
      ...custom
    ] as TextElement[];
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">텍스트 요소</h3>
        <button
          onClick={onAddText}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          텍스트 추가
        </button>
      </div>

      <div className="space-y-4">
        {getOrderedElements().map((element) => (
          <div key={element.id} className="border rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">
                  {getLabel(element)}
                  {element.id === 'main-title' && (
                    <span className="ml-2 text-xs text-gray-400">
                      (Shift + Enter로 줄바꿈)
                    </span>
                  )}
                </label>
                <div
                  ref={el => (refs.current[element.id] = el)}
                  contentEditable
                  suppressContentEditableWarning
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm resize-none min-h-[40px] bg-white focus:outline-blue-400"
                  onInput={() => handleInput(element)}
                  onKeyDown={(e) => handleKeyDown(element, e)}
                  dangerouslySetInnerHTML={{ __html: element.text || '' }}
                  spellCheck={false}
                  style={{ 
                    whiteSpace: 'pre-wrap', 
                    wordBreak: 'break-all',
                    position: 'relative' // 자동 이동 방지
                  }}
                />
              </div>
              <button
                onClick={() => onTextDelete(element.id)}
                className="ml-2 text-red-600 hover:text-red-800"
              >
                삭제
              </button>
            </div>

            {element.editable.color && (
              <div className="flex items-center gap-2 mt-1">
                <label className="block text-xs text-gray-500">색상</label>
                <input
                  type="color"
                  onChange={(e) => handleColorChange(element, e.target.value)}
                  className="w-8 h-8 border-none bg-transparent cursor-pointer"
                  title="선택 영역에 색상 적용"
                />
                <span className="text-xs text-gray-400">(텍스트 일부만 선택 후 색상 변경 가능)</span>
              </div>
            )}

            {element.editable.size && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">폰트 크기</label>
                  <input
                    type="number"
                    value={element.fontSize}
                    onChange={(e) => onTextUpdate(element.id, { fontSize: Number(e.target.value) })}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                    min="8"
                    max="72"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">폰트</label>
                  <select
                    value={element.fontFamily}
                    onChange={(e) => onTextUpdate(element.id, { fontFamily: e.target.value })}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                  >
                    <option value="Pretendard">Pretendard</option>
                    <option value="Noto Sans KR">Noto Sans KR</option>
                    <option value="Arial">Arial</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}; 