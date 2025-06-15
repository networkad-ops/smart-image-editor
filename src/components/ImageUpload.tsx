import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { DeviceType, DeviceConfig } from '../types';

interface ImageUploadProps {
  deviceType: DeviceType;
  deviceConfig: DeviceConfig;
  onUpload: (file: File) => void;
}

export function ImageUpload({ deviceType, deviceConfig, onUpload }: ImageUploadProps) {
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // 파일 형식 검증
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('JPEG, PNG, 또는 WebP 형식의 이미지만 업로드 가능합니다.');
      return;
    }

    // 파일 크기 검증 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('파일 크기는 10MB 이하여야 합니다.');
      return;
    }

    // 이미지 크기 검증
    const img = new Image();
    img.onload = () => {
      // 최소 크기 검증
      if (img.width < deviceConfig.width || img.height < deviceConfig.height) {
        setError(`이미지 크기는 최소 ${deviceConfig.width}x${deviceConfig.height}px 이상이어야 합니다.`);
        return;
      }

      // 비율 검증 (허용 오차 10%)
      const targetRatio = deviceConfig.width / deviceConfig.height;
      const imageRatio = img.width / img.height;
      const ratioDiff = Math.abs(targetRatio - imageRatio) / targetRatio;

      if (ratioDiff > 0.1) {
        setError(`이미지 비율이 ${deviceConfig.width}:${deviceConfig.height}에 맞지 않습니다.`);
        return;
      }

      setError(null);
      onUpload(file);
    };
    img.src = URL.createObjectURL(file);
  }, [deviceConfig, onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp']
    },
    maxFiles: 1
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-card p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary'}`}
      >
        <input {...getInputProps()} />
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="space-y-2"
        >
          <div className="text-4xl mb-2">📸</div>
          {isDragActive ? (
            <p className="text-primary font-medium">이미지를 여기에 놓으세요...</p>
          ) : (
            <>
              <p className="font-medium">이미지를 드래그하여 놓거나 클릭하여 선택하세요</p>
              <p className="text-sm text-gray-500">
                지원 형식: JPEG, PNG, WebP (최대 10MB)
              </p>
            </>
          )}
        </motion.div>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-red-500 text-sm text-center"
        >
          {error}
        </motion.div>
      )}

      <div className="text-sm text-gray-500 text-center">
        <p>권장 크기: {deviceConfig.width} x {deviceConfig.height} 픽셀</p>
        <p>비율: {deviceConfig.width}:{deviceConfig.height}</p>
        <p>디바이스: {deviceType}</p>
      </div>
    </div>
  );
} 