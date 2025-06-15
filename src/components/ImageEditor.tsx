import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { DeviceType, DeviceConfig } from '../types';

interface ImageEditorProps {
  deviceType: DeviceType;
  deviceConfig: DeviceConfig;
  image: File;
  onComplete: (croppedImage: Blob) => void;
  onCancel: () => void;
}

export function ImageEditor({ deviceConfig, image, onComplete, onCancel }: Omit<ImageEditorProps, 'deviceType'>) {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [imageUrl, setImageUrl] = useState<string>('');
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const url = URL.createObjectURL(image);
    setImageUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  useEffect(() => {
    if (!imgRef.current) return;

    const { width, height } = imgRef.current;
    const crop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 90,
        },
        deviceConfig.aspectRatio,
        width,
        height
      ),
      width,
      height
    );
    setCrop(crop);
  }, [deviceConfig.aspectRatio]);

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const crop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 90,
        },
        deviceConfig.aspectRatio,
        width,
        height
      ),
      width,
      height
    );
    setCrop(crop);
  };

  const generateCroppedImage = () => {
    if (!completedCrop || !imgRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
    const scaleY = imgRef.current.naturalHeight / imgRef.current.height;

    canvas.width = deviceConfig.width;
    canvas.height = deviceConfig.height;

    ctx.drawImage(
      imgRef.current,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      deviceConfig.width,
      deviceConfig.height
    );

    canvas.toBlob((blob) => {
      if (blob) {
        onComplete(blob);
      }
    }, 'image/jpeg', 0.95);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900">이미지 편집</h2>
        <div className="space-x-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            취소
          </button>
          <button
            onClick={generateCroppedImage}
            className="px-4 py-2 bg-primary text-white rounded-button hover:bg-primary-dark"
          >
            확인
          </button>
        </div>
      </div>

      <div className="relative">
        <ReactCrop
          crop={crop}
          onChange={(c) => setCrop(c)}
          onComplete={(c) => setCompletedCrop(c)}
          aspect={deviceConfig.aspectRatio}
          className="max-w-full"
        >
          <img
            ref={imgRef}
            src={imageUrl}
            onLoad={onImageLoad}
            alt="Crop me"
            className="max-w-full"
          />
        </ReactCrop>
      </div>

      <div className="hidden">
        <canvas ref={canvasRef} />
      </div>

      <div className="bg-gray-50 p-4 rounded-card">
        <h3 className="text-sm font-medium text-gray-700 mb-2">미리보기</h3>
        <div className="aspect-video bg-gray-100 rounded-card overflow-hidden">
          {completedCrop && (
            <img
              src={imageUrl}
              alt="Preview"
              className="w-full h-full object-cover"
              style={{
                objectPosition: `${(completedCrop.x / completedCrop.width) * 100}% ${
                  (completedCrop.y / completedCrop.height) * 100
                }%`,
                objectFit: 'cover',
                width: '100%',
                height: '100%',
              }}
            />
          )}
        </div>
      </div>
    </motion.div>
  );
} 