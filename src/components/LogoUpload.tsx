import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import Cropper from 'react-easy-crop';
import { LogoConfig } from '../types';

interface LogoUploadProps {
  onUpload: (file: File) => void;
  logoConfig: LogoConfig;
  uploadedLogo?: File | null;
}

export const LogoUpload: React.FC<LogoUploadProps> = ({ onUpload, logoConfig, uploadedLogo }) => {
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      
      // 파일 크기 체크
      if (logoConfig.maxFileSize && file.size > logoConfig.maxFileSize) {
        alert(`파일 크기가 너무 큽니다. ${Math.round(logoConfig.maxFileSize / 1024)}KB 이하로 업로드해주세요.`);
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageSrc(e.target?.result as string);
        setOriginalFile(file);
        // 높이 고정 로고는 크롭 없이 바로 리사이즈
        processLogoWithFixedHeight(e.target?.result as string, file);
      };
      reader.readAsDataURL(file);
    }
  }, [logoConfig.maxFileSize]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif']
    },
    maxFiles: 1
  });

  // 높이 56고정, 비율에 맞는 너비로 리사이즈
  const processLogoWithFixedHeight = async (imageSrc: string, originalFile: File) => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    
    // 높이 56고정, 비율에 맞는 너비 계산
    const fixedHeight = 56;
    const aspectRatio = image.width / image.height;
    const calculatedWidth = Math.round(fixedHeight * aspectRatio);
    
    canvas.width = calculatedWidth;
    canvas.height = fixedHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // 이미지를 새 크기로 그리기
    ctx.drawImage(image, 0, 0, calculatedWidth, fixedHeight);
    
    // 파일로 변환
    canvas.toBlob((blob) => {
      if (blob) {
        const resizedFile = new File([blob], originalFile.name || 'logo.jpg', { type: 'image/jpeg' });
        onUpload(resizedFile);
      }
    }, 'image/jpeg', 0.9);
  };

  // 크롭 완료 시 Blob 생성 (기존 크롭 기능 - 사용하지 않음)
  const getCroppedImg = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    canvas.width = logoConfig.width ?? 56;
    canvas.height = logoConfig.height ?? 56;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(
      image,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      0,
      0,
      logoConfig.width ?? 56,
      logoConfig.height ?? 56
    );
    return new Promise<File>((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], originalFile?.name || 'logo.jpg', { type: 'image/jpeg' });
          resolve(file);
        }
      }, 'image/jpeg');
    });
  };

  const onCropComplete = useCallback((_: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCropDone = async () => {
    const croppedFile = await getCroppedImg();
    if (croppedFile) {
      onUpload(croppedFile);
    }
    setCropModalOpen(false);
    setImageSrc(null);
    setOriginalFile(null);
  };

  // 유틸: base64 -> HTMLImageElement
  function createImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.src = url;
      img.onload = () => resolve(img);
      img.onerror = reject;
    });
  }

  return (
    <>
      <div className="mb-4">
        <h3 className="font-medium mb-2">로고 업로드</h3>
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-500'}`}
        >
          <input {...getInputProps()} />
          <div className="space-y-2">
            <svg
              className="mx-auto h-8 w-8 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
              aria-hidden="true"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="text-sm text-gray-600">
              {isDragActive ? (
                <p>로고를 여기에 놓으세요</p>
              ) : (
                <p>
                  로고를 드래그하거나 <span className="text-blue-500">클릭</span>하여 업로드하세요
                </p>
              )}
            </div>
            <p className="text-xs text-gray-500">
              높이 56px로 자동 조정됩니다
              {logoConfig.maxFileSize && ` | 최대 ${Math.round(logoConfig.maxFileSize / 1024)}KB`}
            </p>
          </div>
        </div>
        
        {uploadedLogo && (
          <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
            <p className="text-sm text-green-700">✓ 로고가 업로드되었습니다: {uploadedLogo.name}</p>
          </div>
        )}
      </div>

      {/* 크롭 모달 */}
      {cropModalOpen && imageSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl">
            <h3 className="text-lg font-semibold mb-4">로고 자르기</h3>
            <div className="relative w-full h-[400px] bg-gray-100">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={(logoConfig.width ?? 56) / (logoConfig.height ?? 56)}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                cropShape="rect"
                showGrid={true}
              />
            </div>
            <div className="text-xs text-gray-600 mt-2 mb-4">
              로고의 원하는 영역을 선택해 주세요. (높이 56px로 자동 조정됩니다)
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                onClick={() => { setCropModalOpen(false); setImageSrc(null); setOriginalFile(null); }}
              >
                취소
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={handleCropDone}
              >
                자르기 완료
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}; 