import React, { useState } from 'react';

interface CompletionFormProps {
  onRegister: (title: string) => void;
  onBack: () => void;
  onGoToList: () => void;
}

export const CompletionForm: React.FC<CompletionFormProps> = ({
  onRegister,
  onBack,
  onGoToList
}) => {
  const [title, setTitle] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onRegister(title);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">작품 등록</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            작품 제목
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            placeholder="작품 제목을 입력하세요"
            required
          />
        </div>
        <div className="flex justify-between">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            뒤로 가기
          </button>
          <div className="space-x-2">
            <button
              type="button"
              onClick={onGoToList}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              목록으로
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              등록하기
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}; 