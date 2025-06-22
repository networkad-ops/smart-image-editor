import { useState } from 'react';
import { BannerConfig, TextElement } from '../types';

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
          <h3 className="font-medium mb-2">서브타이틀</h3>
          <input
            type="text"
            value={subTitle?.text || ''}
            onChange={(e) => onUpdateText('sub-title', { text: e.target.value })}
            className="w-full px-3 py-2 border rounded"
            placeholder="서브타이틀 입력 (한 줄만 가능)"
            maxLength={config.subTitle.maxLength}
          />
        </div>
      )}

      {/* 메인타이틀 편집 */}
      {config.mainTitle && (
        <div className="mb-6">
          <h3 className="font-medium mb-2">메인타이틀</h3>
          <textarea
            value={mainTitle?.text || ''}
            onChange={(e) => {
              const lines = e.target.value.split('\n');
              // 최대 1번만 줄바꿈 허용 (총 2줄)
              if (lines.length <= 1) {
                onUpdateText('main-title', { text: e.target.value });
              } else {
                // 첫 번째 줄바꿈까지만 허용
                const limitedText = lines.slice(0, 1).join('\n');
                onUpdateText('main-title', { text: limitedText });
              }
            }}
            className="w-full px-3 py-2 border rounded min-h-[80px] resize-y"
            placeholder="메인타이틀 입력 (줄바꿈 불가)"
            maxLength={config.mainTitle.maxLength}
            rows={1}
          />
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