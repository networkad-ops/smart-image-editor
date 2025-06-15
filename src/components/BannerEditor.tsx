import React from 'react';
import { BannerType, DeviceType, TextElement, BannerConfig } from '../types/index';
import { ImageUpload } from './ImageUpload';
import { TextEditSidebar } from './TextEditSidebar';
import { BannerPreview } from './BannerPreview';

interface BannerEditorProps {
  bannerSelection: {
    bannerType: BannerType;
    deviceType: DeviceType;
    config: BannerConfig;
  };
  uploadedImage: File | null;
  textElements: TextElement[];
  onImageUpload: (file: File) => void;
  onAddText: () => void;
  onTextUpdate: (id: string, updates: Partial<TextElement>) => void;
  onTextDelete: (id: string) => void;
  onComplete: () => void;
  onBack: () => void;
}

export const BannerEditor: React.FC<BannerEditorProps> = ({
  bannerSelection,
  uploadedImage,
  textElements,
  onImageUpload,
  onAddText,
  onTextUpdate,
  onTextDelete,
  onComplete,
  onBack
}) => {
  return (
    <div className="relative">
      {/* 상단 좌측 뒤로가기 버튼 */}
      <button
        onClick={onBack}
        className="absolute top-4 left-4 z-10 px-4 py-2 bg-white text-gray-600 border border-gray-200 rounded hover:bg-gray-100 shadow"
      >
        ← 뒤로 가기
      </button>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 메인 작업 영역 */}
        <div className="lg:col-span-3 space-y-6">
          {/* 이미지 업로드 */}
          <div className="bg-white rounded-lg shadow p-6">
            {/* 이미지 규격 안내 */}
            <div className="mb-2 text-sm text-gray-700 font-medium">
              필요한 이미지 규격: {bannerSelection.config.width} × {bannerSelection.config.height}px, 최대 {(bannerSelection.config.maxFileSize ? bannerSelection.config.maxFileSize / 1024 / 1024 : '?')}MB
            </div>
            <ImageUpload 
              onUpload={onImageUpload} 
              requiredWidth={bannerSelection.config.width}
              requiredHeight={bannerSelection.config.height}
            />
          </div>

          {/* 배너 미리보기 */}
          <div className="bg-white rounded-lg shadow p-6">
            <BannerPreview
              bannerSelection={bannerSelection}
              uploadedImage={uploadedImage}
              textElements={textElements}
              onTextUpdate={onTextUpdate}
            />
          </div>
        </div>

        {/* 사이드바 */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6">
            <TextEditSidebar
              textElements={textElements}
              onAddText={onAddText}
              onTextUpdate={onTextUpdate}
              onTextDelete={onTextDelete}
            />
          </div>
        </div>

        {/* 하단 완료 버튼만 남김 */}
        <div className="lg:col-span-4 flex justify-end">
          <button
            onClick={onComplete}
            disabled={!uploadedImage}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            완료하기
          </button>
        </div>
      </div>
    </div>
  );
}; 