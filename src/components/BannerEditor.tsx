import { useState, useRef } from 'react';
import { BannerConfig, TextElement } from '../types';
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
  uploadedLogo
}: BannerEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleComplete = async () => {
    if (!canvasRef.current || !uploadedImage) return;

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
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">이미지 편집</h2>
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
            disabled={!uploadedImage || isProcessing}
            className={`w-full px-4 py-2 rounded-md text-white font-medium
              ${!uploadedImage || isProcessing
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
              }`}
          >
            {isProcessing ? '처리 중...' : '완료하기'}
          </button>
        </div>
      </div>
    </div>
  );
} 