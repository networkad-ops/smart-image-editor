import React, { useState } from 'react';
import { BannerSelection, TextElement, Banner } from '../types';
import { ImageUpload } from './ImageUpload';
import { LogoUpload } from './LogoUpload';
import { TextEditSidebar } from './TextEditSidebar';
import { BannerPreview } from './BannerPreview';

interface BannerEditorProps {
  selection: BannerSelection;
  uploadedImage: File | null;
  uploadedLogo: File | null;
  textElements: TextElement[];
  onImageUpload: (file: File) => void;
  onLogoUpload: (file: File) => void;
  onAddText: (text: TextElement) => void;
  onTextUpdate: (id: string, updates: Partial<TextElement>) => void;
  onTextDelete: (id: string) => void;
  onComplete: (image: Blob) => void;
  onReset: () => void;
  onBack: () => void;
  onGoHome?: () => void;
  previewCanvasRef: React.RefObject<HTMLCanvasElement>;
  editingBanner: Banner | null;
  loading: boolean;
}

export const BannerEditor: React.FC<BannerEditorProps> = ({
  selection,
  uploadedImage,
  uploadedLogo,
  textElements,
  onImageUpload,
  onLogoUpload,
  onAddText,
  onTextUpdate,
  onTextDelete,
  onComplete,
  onReset,
  onBack,
  onGoHome,
  previewCanvasRef,
  editingBanner,
  loading
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleComplete = async () => {
    if (!previewCanvasRef.current || !uploadedImage) {
      alert('이미지를 업로드해주세요.');
      return;
    }

    try {
      setIsProcessing(true);
      
      // Canvas를 Blob으로 변환
      const blob = await new Promise<Blob>((resolve, reject) => {
        if (!previewCanvasRef.current) {
          reject(new Error('Canvas를 찾을 수 없습니다.'));
          return;
        }
        
        previewCanvasRef.current.toBlob((blob: Blob | null) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Canvas에서 이미지를 생성할 수 없습니다.'));
          }
        }, 'image/jpeg', 0.95);
      });

      onComplete(blob);
    } catch (error) {
      console.error('이미지 처리 중 오류 발생:', error);
      alert(`이미지 처리 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadJPG = async () => {
    if (!previewCanvasRef.current || !uploadedImage) return;

    try {
      // Canvas를 Blob으로 변환
      const blob = await new Promise<Blob>((resolve) => {
        previewCanvasRef.current?.toBlob((blob: Blob | null) => {
          if (blob) resolve(blob);
        }, 'image/jpeg', 0.95);
      });

      // 다운로드 링크 생성
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // 파일명 생성
      const fileName = editingBanner?.title 
        ? `${editingBanner.title.replace(/[^\w\s-]/g, '').trim()}_${Date.now()}.jpg`
        : `banner_${Date.now()}.jpg`;
      
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('JPG 다운로드 중 오류 발생:', error);
      alert('JPG 다운로드 중 오류가 발생했습니다.');
    }
  };



  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 
                className="text-3xl font-bold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
                onClick={onGoHome}
                title="홈으로 이동"
              >
                Smart Banner Editor
              </h1>
              <p className="mt-2 text-gray-600">
                {editingBanner ? `"${editingBanner.title}" 편집 중` : '새 배너 만들기'}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>뒤로</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 왼쪽: 편집 도구 */}
          <div className="lg:col-span-1 space-y-6">
            {/* 이미지 업로드 */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">배경 이미지</h2>
              <ImageUpload
                onUpload={onImageUpload}
                requiredWidth={selection.config.width}
                requiredHeight={selection.config.height}
              />
            </div>

            {/* 로고 업로드 */}
            {selection.config.logo && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-4">로고</h2>
                <LogoUpload
                  onUpload={onLogoUpload}
                  logoConfig={selection.config.logo}
                  uploadedLogo={uploadedLogo}
                />
              </div>
            )}

            {/* 텍스트 편집 */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">텍스트 편집</h2>
              <TextEditSidebar
                config={selection.config}
                textElements={textElements}
                onAddText={onAddText}
                onUpdateText={onTextUpdate}
                onDeleteText={onTextDelete}
              />
            </div>

            {/* 액션 버튼 */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="space-y-3">
                <button
                  onClick={handleComplete}
                  disabled={!uploadedImage || isProcessing || loading}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
                >
                  {isProcessing || loading ? '처리 중...' : editingBanner ? '배너 업데이트' : '배너 저장'}
                </button>
                
                <button
                  onClick={handleDownloadJPG}
                  disabled={!uploadedImage}
                  className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
                >
                  JPG 다운로드
                </button>
                
                <button
                  onClick={onReset}
                  className="w-full px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 font-medium"
                >
                  초기화
                </button>
              </div>
            </div>
          </div>

          {/* 오른쪽: 미리보기 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">미리보기</h2>
              <div className="flex justify-center">
                <BannerPreview
                  ref={previewCanvasRef}
                  config={selection.config}
                  uploadedImage={uploadedImage}
                  uploadedLogo={uploadedLogo}
                  textElements={textElements}
                  existingImageUrl={editingBanner?.background_image_url || editingBanner?.image_url}
                  existingLogoUrl={editingBanner?.logo_url}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default BannerEditor; 