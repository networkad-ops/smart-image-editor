import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import Cropper from 'react-easy-crop';

interface ImageUploadProps {
  onUpload: (file: File) => void;
  requiredWidth?: number;
  requiredHeight?: number;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ onUpload, requiredWidth, requiredHeight }) => {
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageSrc(e.target?.result as string);
        setOriginalFile(file);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif']
    },
    maxFiles: 1
  });

  // 이미지가 로드되면 크기 체크 후 크롭 모달 표시
  React.useEffect(() => {
    if (imageSrc && requiredWidth && requiredHeight) {
      const img = new window.Image();
      img.src = imageSrc;
      img.onload = () => {
        if (img.width !== requiredWidth || img.height !== requiredHeight) {
          setCropModalOpen(true);
        } else {
          // 규격이 맞으면 바로 업로드
          if (originalFile) onUpload(originalFile);
          setImageSrc(null);
          setOriginalFile(null);
        }
      };
    }
  }, [imageSrc, requiredWidth, requiredHeight, originalFile, onUpload]);

  // 크롭 완료 시 Blob 생성 (항상 requiredWidth/requiredHeight로 리사이즈)
  const getCroppedImg = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    canvas.width = requiredWidth!;
    canvas.height = requiredHeight!;
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
      requiredWidth!,
      requiredHeight!
    );
    return new Promise<File>((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], originalFile?.name || 'cropped.png', { type: 'image/png' });
          resolve(file);
        }
      }, 'image/png');
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
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-500'}`}
      >
        <input {...getInputProps()} />
        <div className="space-y-2">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
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
              <p>이미지를 여기에 놓으세요</p>
            ) : (
              <p>
                이미지를 드래그하거나 <span className="text-blue-500">클릭</span>하여 업로드하세요
              </p>
            )}
          </div>
          <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
        </div>
      </div>
      {/* 크롭 모달 */}
      {cropModalOpen && imageSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl">
            <h3 className="text-lg font-semibold mb-4">이미지 자르기</h3>
            <div className="relative w-full h-[480px] bg-gray-100">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={requiredWidth! / requiredHeight!}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                cropShape="rect"
                showGrid={true}
              />
            </div>
            <div className="text-xs text-gray-600 mt-2 mb-4">이미지의 원하는 영역을 선택해 주세요. (비율은 {requiredWidth}:{requiredHeight}로 고정됩니다)</div>
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