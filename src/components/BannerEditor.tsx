import React, { useState, useEffect } from 'react';
import { BannerConfig, TextElement, Banner, BannerType, DeviceType } from '../types';
import { ImageUpload } from './ImageUpload';
import { LogoUpload } from './LogoUpload';
import { TextEditSidebar } from './TextEditSidebar';
import { BannerPreview } from './BannerPreview';

interface BannerEditorProps {
  config: BannerConfig;
  onImageUpload: (file: File) => void;
  onLogoUpload?: (file: File) => void;
  onAddText: (text: TextElement) => void;
  onTextUpdate: (id: string, updates: Partial<TextElement>) => void;
  onTextDelete: (id: string) => void;
  onComplete: (image: Blob) => void;
  textElements: TextElement[];
  uploadedImage: File | null;
  uploadedLogo?: File | null;
  isEditing?: boolean;
  editingBanner?: Banner | null;
  onBannerTypeChange?: (bannerType: BannerType, deviceType: DeviceType) => void;
  onTitleChange?: (title: string) => void;
  onGoHome?: () => void;
  isLoading: boolean;
}

const BannerEditor = React.forwardRef<HTMLCanvasElement, BannerEditorProps>(
  ({
    config,
    onImageUpload,
    onLogoUpload,
    onAddText,
    onTextUpdate,
    onTextDelete,
    onComplete,
    textElements,
    uploadedImage,
    uploadedLogo,
    isEditing = false,
    editingBanner,
    onBannerTypeChange,
    onTitleChange,
    onGoHome
  }, ref) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [currentTitle, setCurrentTitle] = useState(editingBanner?.title || '');
    const [currentBannerType, setCurrentBannerType] = useState<string>(editingBanner?.banner_type || 'basic-no-logo');
    const [currentDeviceType, setCurrentDeviceType] = useState<string>(editingBanner?.device_type || 'pc');
    const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);

    // 편집 모드일 때 기존 데이터 로드
    useEffect(() => {
      console.log('BannerEditor useEffect:', { isEditing, editingBanner });
      if (isEditing && editingBanner) {
        console.log('기존 배너 데이터 로드:', {
          title: editingBanner.title,
          banner_type: editingBanner.banner_type,
          device_type: editingBanner.device_type,
          background_image_url: editingBanner.background_image_url,
          image_url: editingBanner.image_url
        });
        setCurrentTitle(editingBanner.title);
        setCurrentBannerType(editingBanner.banner_type);
        setCurrentDeviceType(editingBanner.device_type);
        // 우선순위: background_image_url > image_url (호환성)
        setExistingImageUrl(editingBanner.background_image_url || editingBanner.image_url || null);
      } else if (!isEditing) {
        // 편집 모드가 아닐 때는 초기화
        setExistingImageUrl(null);
      }
    }, [isEditing, editingBanner]);

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newTitle = e.target.value;
      setCurrentTitle(newTitle);
      onTitleChange?.(newTitle);
    };

    const handleBannerTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newType = e.target.value;
      setCurrentBannerType(newType);
      onBannerTypeChange?.(newType as BannerType, currentDeviceType as DeviceType);
    };

    const handleDeviceTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newDevice = e.target.value;
      setCurrentDeviceType(newDevice);
      onBannerTypeChange?.(currentBannerType as BannerType, newDevice as DeviceType);
    };

    const handleComplete = async () => {
      if (!ref || !('current' in ref) || !ref.current || (!uploadedImage && !existingImageUrl)) {
        alert('이미지를 업로드해주세요.');
        return;
      }

      try {
        setIsProcessing(true);
        
        console.log('완료 버튼 클릭 - Canvas 상태:', {
          canvasExists: !!ref.current,
          uploadedImage: !!uploadedImage,
          existingImageUrl: !!existingImageUrl,
          textElements: textElements.length
        });
        
        // Canvas를 Blob으로 변환
        const blob = await new Promise<Blob>((resolve, reject) => {
          if (!ref.current) {
            reject(new Error('Canvas를 찾을 수 없습니다.'));
            return;
          }
          
          ref.current.toBlob((blob: Blob | null) => {
            if (blob) {
              console.log('Blob 생성 성공:', blob.size, 'bytes');
              resolve(blob);
            } else {
              console.error('toBlob이 null을 반환했습니다.');
              reject(new Error('Canvas에서 이미지를 생성할 수 없습니다.'));
            }
          }, 'image/jpeg', 0.95);
        });

        console.log('onComplete 호출 전');
        onComplete(blob);
        console.log('onComplete 호출 후');
      } catch (error) {
        console.error('이미지 처리 중 오류 발생:', error);
        alert(`이미지 처리 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
      } finally {
        setIsProcessing(false);
      }
    };

    const handleDownloadJPG = async () => {
      if (!ref || !('current' in ref) || !ref.current || (!uploadedImage && !existingImageUrl)) return;

      try {
        // Canvas를 Blob으로 변환
        const blob = await new Promise<Blob>((resolve) => {
          ref.current?.toBlob((blob: Blob | null) => {
            if (blob) resolve(blob);
          }, 'image/jpeg', 0.95);
        });

        // 다운로드 링크 생성
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        // 파일명 생성
        const fileName = currentTitle 
          ? `${currentTitle.replace(/[^\w\s-]/g, '').trim()}_${Date.now()}.jpg`
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
      <div className="space-y-6">
        {/* 상단 네비게이션 */}
        <div className="bg-white rounded-lg shadow-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {onGoHome && (
                <button
                  onClick={onGoHome}
                  className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <span>홈으로 돌아가기</span>
                </button>
              )}
              <div className="text-lg font-semibold text-gray-900">
                {isEditing ? '배너 편집' : '새 배너 만들기'}
              </div>
            </div>
            <div className="text-sm text-gray-500">
              {isEditing && editingBanner ? `편집 중: ${editingBanner.title}` : '새 배너'}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
          {/* 배너 정보 편집 섹션 */}
          {isEditing && (
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">배너 정보 편집</h2>
              
              <div className="space-y-4">
                {/* 타이틀 편집 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    배너 타이틀
                  </label>
                  <input
                    type="text"
                    value={currentTitle}
                    onChange={handleTitleChange}
                    placeholder="배너 타이틀을 입력하세요"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* 배너 타입 변경 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      배너 타입
                    </label>
                    <select
                      value={currentBannerType}
                      onChange={handleBannerTypeChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="basic-no-logo">기본형 (로고 없음)</option>
                      <option value="basic-with-logo">기본형 (로고 포함)</option>
                      <option value="splash">스플래시</option>
                      <option value="event">이벤트</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      디바이스 타입
                    </label>
                    <select
                      value={currentDeviceType}
                      onChange={handleDeviceTypeChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="pc">PC</option>
                      <option value="mobile">모바일</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">
              {isEditing ? '이미지 변경' : '이미지 업로드'}
            </h2>
            
            {/* 기존 이미지 표시 (편집 모드) */}
            {isEditing && existingImageUrl && !uploadedImage && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">현재 이미지:</p>
                <img 
                  src={existingImageUrl} 
                  alt="현재 배너 이미지" 
                  className="max-w-full h-auto max-h-40 rounded border"
                />
                <p className="text-xs text-gray-500 mt-2">
                  새 이미지를 업로드하면 기존 이미지가 교체됩니다.
                </p>
              </div>
            )}
            
            <ImageUpload 
              onUpload={onImageUpload} 
              requiredWidth={config.width}
              requiredHeight={config.height}
            />
            
            {/* 로고 업로드 섹션 */}
            {config.logo && onLogoUpload && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <LogoUpload
                  onUpload={onLogoUpload}
                  logoConfig={config.logo}
                  uploadedLogo={uploadedLogo}
                />
              </div>
            )}
          </div>

          <div className="mt-6">
            <BannerPreview
              ref={ref}
              config={config}
              uploadedImage={uploadedImage}
              uploadedLogo={uploadedLogo}
              textElements={textElements}
              existingImageUrl={existingImageUrl}
              existingLogoUrl={editingBanner?.logo_url}
            />
          </div>
        </div>

        <div>
          <TextEditSidebar
            config={config}
            textElements={textElements}
            onAddText={onAddText}
            onUpdateText={onTextUpdate}
            onDeleteText={onTextDelete}
          />

          <div className="mt-6 space-y-3">
            {/* JPG 다운로드 버튼 */}
            <button
              onClick={handleDownloadJPG}
              disabled={(!uploadedImage && !existingImageUrl)}
              className={`w-full px-4 py-2 rounded-md font-medium border-2 transition-colors
                ${(!uploadedImage && !existingImageUrl)
                  ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'
                  : 'bg-white border-green-500 text-green-600 hover:bg-green-50'
                }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>JPG로 다운로드</span>
              </div>
            </button>

            {/* 완료 버튼 */}
            <button
              onClick={handleComplete}
              disabled={(!uploadedImage && !existingImageUrl) || isProcessing}
              className={`w-full px-4 py-2 rounded-md text-white font-medium
                ${(!uploadedImage && !existingImageUrl) || isProcessing
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
                }`}
            >
              {isProcessing ? '처리 중...' : isEditing ? '수정 완료' : '완료하기'}
            </button>
          </div>
        </div>


      </div>
    </div>
  );
});

BannerEditor.displayName = 'BannerEditor';

export { BannerEditor };
export default BannerEditor; 