import React from 'react';
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

  // maxLength, maxLines 적용
  const handleTextChange = (element: TextElement, value: string) => {
    let text = value;
    const maxLength = (element as any).maxLength || 100;
    const maxLines = (element as any).maxLines || 2;
    // 줄 수 제한
    let lines = text.split(/\r?\n/);
    if (lines.length > maxLines) lines = lines.slice(0, maxLines);
    text = lines.join('\n');
    // 글자 수 제한
    if (text.length > maxLength) text = text.slice(0, maxLength);
    onTextUpdate(element.id, { text });
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
                <textarea
                  value={element.text}
                  onChange={(e) => handleTextChange(element, e.target.value)}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm resize-none"
                  placeholder="텍스트 입력"
                  rows={2}
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
              <div>
                <label className="block text-xs text-gray-500 mb-1">색상</label>
                <input
                  type="color"
                  value={element.color}
                  onChange={(e) => onTextUpdate(element.id, { color: e.target.value })}
                  className="w-full h-8"
                />
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