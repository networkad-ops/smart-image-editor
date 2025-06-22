import React, { useState } from 'react';
import { motion } from 'framer-motion';
// import { BannerWork } from '../types'; // 현재 사용하지 않음

interface CompletionFormProps {
  finalImage: Blob;
  bannerType: 'basic-no-logo' | 'basic-with-logo' | 'splash' | 'event';
  deviceType: 'pc' | 'mobile';
  onSave: (title: string, description?: string) => Promise<void>;
  onEdit: () => void;
  isEditing: boolean;
}

export function CompletionForm({ finalImage, bannerType, deviceType, onSave, onEdit, isEditing }: CompletionFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleDownload = async () => {
    if (!finalImage) return;
    
    try {
      setIsDownloading(true);
      
      // Blob을 URL로 변환
      const url = URL.createObjectURL(finalImage);
      
      // 다운로드 링크 생성
      const link = document.createElement('a');
      link.href = url;
      link.download = `${title || 'banner'}.jpg`;
      
      // 다운로드 실행
      document.body.appendChild(link);
      link.click();
      
      // 정리
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('다운로드 중 오류 발생:', error);
      alert('다운로드 중 오류가 발생했습니다.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!finalImage || !title.trim()) return;

    try {
      setIsSaving(true);
      await onSave(title.trim(), description.trim() || undefined);
    } catch (error) {
      console.error('저장 실패:', error);
      alert('배너 저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-lg shadow-lg p-6"
    >
      <h2 className="text-2xl font-bold mb-6">
        {isEditing ? '배너 수정' : '배너 저장'}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            배너 제목 *
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="배너 제목을 입력하세요"
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            설명
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="배너에 대한 설명을 입력하세요 (선택사항)"
            rows={3}
          />
        </div>

        <div className="text-sm text-gray-600 space-y-1">
          <p>배너 타입: {bannerType}</p>
          <p>디바이스: {deviceType}</p>
        </div>

        <div className="flex flex-col space-y-4">
          <button
            type="button"
            onClick={handleDownload}
            disabled={!finalImage || isDownloading}
            className={`w-full px-4 py-2 rounded-md text-white font-medium
              ${!finalImage || isDownloading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
              }`}
          >
            {isDownloading ? '다운로드 중...' : 'JPG 다운로드'}
          </button>

          <button
            type="submit"
            disabled={!finalImage || !title.trim() || isSaving}
            className={`w-full px-4 py-2 rounded-md text-white font-medium
              ${!finalImage || !title.trim() || isSaving
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-green-600 hover:bg-green-700'
              }`}
          >
            {isSaving ? '저장 중...' : isEditing ? '수정 완료' : '배너 저장'}
          </button>

          <button
            type="button"
            onClick={onEdit}
            className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            편집으로 돌아가기
          </button>
        </div>
      </form>
    </motion.div>
  );
} 