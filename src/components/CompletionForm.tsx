import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BannerWork } from '../types';

interface CompletionFormProps {
  onRegister: (work: BannerWork) => void;
  onReset: () => void;
  onGoToList: () => void;
  finalImage?: Blob;
  workTitle?: string;
}

export function CompletionForm({ onRegister, onReset, onGoToList, finalImage, workTitle }: CompletionFormProps) {
  const [title, setTitle] = useState(workTitle || '');
  const [isDownloading, setIsDownloading] = useState(false);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!finalImage) return;

    const work: BannerWork = {
      id: Date.now().toString(),
      title,
      bannerType: 'basic-no-logo', // TODO: 실제 배너 타입으로 수정
      deviceType: 'pc', // TODO: 실제 디바이스 타입으로 수정
      originalImage: new File([], 'original.jpg'), // TODO: 실제 원본 이미지로 수정
      finalImage,
      editedImageUrl: URL.createObjectURL(finalImage),
      textElements: [], // TODO: 실제 텍스트 요소로 수정
      createdAt: new Date()
    };

    onRegister(work);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-lg shadow-lg p-6"
    >
      <h2 className="text-2xl font-bold mb-6">작업 완료</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            작업 제목
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="작업 제목을 입력하세요"
            required
          />
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
            disabled={!finalImage}
            className={`w-full px-4 py-2 rounded-md text-white font-medium
              ${!finalImage 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-green-600 hover:bg-green-700'
              }`}
          >
            작업 등록
          </button>

          <button
            type="button"
            onClick={onReset}
            className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            새로 시작
          </button>

          <button
            type="button"
            onClick={onGoToList}
            className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            목록으로
          </button>
        </div>
      </form>
    </motion.div>
  );
} 