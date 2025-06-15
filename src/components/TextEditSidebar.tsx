import React, { useRef, useState } from 'react';
import { BannerConfig, TextElement } from '../types';

interface TextEditSidebarProps {
  config: BannerConfig;
  textElements: TextElement[];
  onAddText: (text: TextElement) => void;
  onUpdateText: (id: string, updates: Partial<TextElement>) => void;
  onDeleteText: (id: string) => void;
}

export function TextEditSidebar({
  config,
  textElements,
  onAddText,
  onUpdateText,
  onDeleteText
}: TextEditSidebarProps) {
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);

  const handleAddText = () => {
    if (!config.allowCustomText) return;

    const newText: TextElement = {
      id: crypto.randomUUID(),
      type: 'custom',
      text: '새 텍스트',
      x: 100,
      y: 100,
      width: 200,
      height: 50,
      fontSize: 24,
      fontFamily: 'Pretendard',
      color: '#000000',
      editable: { position: true, size: true, color: true }
    };

    onAddText(newText);
    setSelectedTextId(newText.id);
  };

  const selectedText = textElements.find(text => text.id === selectedTextId);

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
    onUpdateText(element.id, { text: ref.innerHTML });
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
    onUpdateText(element.id, { text: ref.innerHTML });
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
        // 직접 <br> 삽입 및 커서 이동
        e.preventDefault();
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          // <br> 삽입
          const br = document.createElement('br');
          range.insertNode(br);
          // 커서를 <br> 뒤로 이동
          range.setStartAfter(br);
          range.collapse(false);
          selection.removeAllRanges();
          selection.addRange(range);
        }
        // 입력 후 2줄 초과 시 자동 잘림 (handleInput에서 처리)
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
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-4">텍스트 편집</h2>
      
      {config.allowCustomText && (
        <button
          onClick={handleAddText}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 mb-4"
        >
          텍스트 추가
        </button>
      )}

      <div className="space-y-4">
        {textElements.map(text => (
          <div
            key={text.id}
            className={`p-4 border rounded-md cursor-pointer ${
              selectedTextId === text.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
            }`}
            onClick={() => setSelectedTextId(text.id)}
          >
            <div className="flex justify-between items-start mb-2">
              <span className="font-medium">{text.text}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteText(text.id);
                  if (selectedTextId === text.id) {
                    setSelectedTextId(null);
                  }
                }}
                className="text-red-500 hover:text-red-700"
              >
                삭제
              </button>
            </div>
            
            {selectedTextId === text.id && (
              <div className="space-y-2">
                <input
                  type="text"
                  value={text.text}
                  onChange={(e) => onUpdateText(text.id, { text: e.target.value })}
                  className="w-full px-2 py-1 border rounded"
                />
                <input
                  type="number"
                  value={text.fontSize}
                  onChange={(e) => onUpdateText(text.id, { fontSize: Number(e.target.value) })}
                  className="w-full px-2 py-1 border rounded"
                />
                <input
                  type="color"
                  value={text.color}
                  onChange={(e) => onUpdateText(text.id, { color: e.target.value })}
                  className="w-full h-8"
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 