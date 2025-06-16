import { useState } from 'react';
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