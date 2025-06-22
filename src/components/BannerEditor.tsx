import { useState, useRef, useEffect } from 'react';
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
  editingBanner?: Banner;
  onBannerTypeChange?: (bannerType: BannerType, deviceType: DeviceType) => void;
  onTitleChange?: (title: string) => void;
}

export function BannerEditor({
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
  onTitleChange
}: BannerEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentTitle, setCurrentTitle] = useState(editingBanner?.title || '');
  const [currentBannerType, setCurrentBannerType] = useState<string>(editingBanner?.banner_type || 'basic-no-logo');
  const [currentDeviceType, setCurrentDeviceType] = useState<string>(editingBanner?.device_type || 'pc');
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);

  // 편집 모드일 때 기존 데이터 로드
  useEffect(() => {
    if (isEditing && editingBanner) {
      setCurrentTitle(editingBanner.title);
      setCurrentBannerType(editingBanner.banner_type);
      setCurrentDeviceType(editingBanner.device_type);
      setExistingImageUrl(editingBanner.image_url);
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
    if (!canvasRef.current || (!uploadedImage && !existingImageUrl)) return;

    try {
      setIsProcessing(true);
      
      // Canvas를 Blob으로 변환
      const blob = await new Promise<Blob>((resolve) => {
        canvasRef.current?.toBlob((blob) => {
          if (blob) resolve(blob);
        }, 'image/jpeg', 0.95);
      });

      onComplete(blob);
    } catch (error) {
      console.error('이미지 처리 중 오류 발생:', error);
      alert('이미지 처리 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
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
            ref={canvasRef}
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

        <div className="mt-6">
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
  );
} 