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
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* 메인 작업 영역 */}
      <div className="lg:col-span-3 space-y-6">
        {/* 이미지 업로드 */}
        <div className="bg-white rounded-lg shadow p-6">
          <ImageUpload onUpload={onImageUpload} />
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

      {/* 하단 버튼 */}
      <div className="lg:col-span-4 flex justify-between">
        <button
          onClick={onBack}
          className="px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          뒤로 가기
        </button>
        <button
          onClick={onComplete}
          disabled={!uploadedImage}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          완료하기
        </button>
      </div>
    </div>
  );
}; 