import React, { useState } from 'react';
import { X, Image } from 'lucide-react';
import { sampleImages, categories, getSampleImagesByCategory, SampleImage } from '../config/sampleImages';

interface SampleImageSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onImageSelect: (file: File) => void;
}

export const SampleImageSelector: React.FC<SampleImageSelectorProps> = ({
  isOpen,
  onClose,
  onImageSelect
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [loading, setLoading] = useState<string | null>(null);

  if (!isOpen) return null;

  const displayImages = getSampleImagesByCategory(selectedCategory || undefined);

  const handleImageSelect = async (image: SampleImage) => {
    setLoading(image.id);
    try {
      // 이미지를 Blob으로 변환하여 File 객체 생성
      const response = await fetch(image.url);
      const blob = await response.blob();
      const file = new File([blob], `sample-${image.id}.jpg`, { type: 'image/jpeg' });
      
      // File 객체를 직접 전달
      onImageSelect(file);
      onClose();
    } catch (error) {
      console.error('샘플 이미지 로드 실패:', error);
      alert('이미지를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">샘플 이미지 선택</h2>
            <p className="text-sm text-gray-600 mt-1">원하는 이미지를 클릭하여 선택하세요</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 카테고리 필터 */}
        <div className="p-6 border-b bg-gray-50">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === ''
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              전체
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center space-x-2 ${
                  selectedCategory === category.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span>{category.icon}</span>
                <span>{category.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 이미지 그리드 */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {displayImages.map((image) => (
              <div
                key={image.id}
                className="relative group cursor-pointer rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                onClick={() => handleImageSelect(image)}
              >
                <div className="aspect-[3/2] bg-gray-100">
                  <img
                    src={image.url}
                    alt={image.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  
                  {/* 로딩 오버레이 */}
                  {loading === image.id && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                  
                  {/* 호버 오버레이 */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity duration-150 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Image className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>
                
                {/* 이미지 정보 */}
                <div className="p-3 bg-white">
                  <h3 className="font-medium text-sm text-gray-900 truncate">{image.name}</h3>
                  {image.description && (
                    <p className="text-xs text-gray-500 mt-1 truncate">{image.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {displayImages.length === 0 && (
            <div className="text-center py-12">
              <Image className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">선택한 카테고리에 이미지가 없습니다.</p>
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="p-6 border-t bg-gray-50">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <p>총 {displayImages.length}개의 이미지</p>
            <p>이미지 출처: Unsplash</p>
          </div>
        </div>
      </div>
    </div>
  );
}; 