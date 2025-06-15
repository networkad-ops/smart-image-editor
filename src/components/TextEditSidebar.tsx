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

  // 색상 적용 핸들러 (선택 영역에만 적용)
  const applyColorToSelection = (element: TextElement, color: string) => {
    const ref = refs.current[element.id];
    if (!ref) return;
    ref.focus();
    document.execCommand('styleWithCSS', false, 'true');
    document.execCommand('foreColor', false, color);
    // 변경된 HTML을 저장
    onTextUpdate(element.id, { text: ref.innerHTML });
  };

  // contentEditable 변경 핸들러
  const handleInput = (element: TextElement) => {
    const ref = refs.current[element.id];
    if (!ref) return;
    onTextUpdate(element.id, { text: ref.innerHTML });
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
        {textElements.map((element) => (
          <div key={element.id} className="border rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">{getLabel(element)}</label>
                <div
                  ref={el => (refs.current[element.id] = el)}
                  contentEditable
                  suppressContentEditableWarning
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm resize-none min-h-[40px] bg-white focus:outline-blue-400"
                  onInput={() => handleInput(element)}
                  dangerouslySetInnerHTML={{ __html: element.text || '' }}
                  spellCheck={false}
                  style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}
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
                  onChange={(e) => applyColorToSelection(element, e.target.value)}
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