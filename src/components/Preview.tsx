import { motion } from 'framer-motion';
import { DeviceType, DeviceConfig, TextConfig } from '../types';

interface PreviewProps {
  deviceType: DeviceType;
  deviceConfig: DeviceConfig;
  image: Blob;
  text: TextConfig;
  onDownload: () => void;
  onComplete: () => void;
  onBack: () => void;
}

export function Preview({ deviceType, deviceConfig, image, text, onDownload, onComplete, onBack }: PreviewProps) {
  const imageUrl = URL.createObjectURL(image);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900">최종 미리보기</h2>
        <div className="space-x-2">
          <button
            onClick={onBack}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            뒤로
          </button>
          <button
            onClick={onDownload}
            className="px-4 py-2 bg-gray-600 text-white rounded-button hover:bg-gray-700"
          >
            다운로드
          </button>
          <button
            onClick={onComplete}
            className="px-4 py-2 bg-primary text-white rounded-button hover:bg-primary-dark"
          >
            완료
          </button>
        </div>
      </div>

      <div className="bg-gray-50 p-6 rounded-card">
        <div className="aspect-video bg-white rounded-card overflow-hidden shadow-sm relative"
          style={{
            maxWidth: deviceType === 'PC' ? '100%' : '375px',
            margin: '0 auto'
          }}
        >
          <img
            src={imageUrl}
            alt="Preview"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 p-8 flex flex-col justify-end">
            {text.subtitle && (
              <div
                style={{
                  fontFamily: deviceConfig.text.subtitle.fontFamily,
                  fontSize: `${deviceConfig.text.subtitle.fontSize / 16}rem`,
                  fontWeight: deviceConfig.text.subtitle.fontWeight,
                  letterSpacing: deviceConfig.text.subtitle.letterSpacing,
                  lineHeight: deviceConfig.text.subtitle.lineHeight,
                  color: 'white',
                  textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                }}
                className="mb-2"
              >
                {text.subtitle}
              </div>
            )}
            {text.title && (
              <div
                style={{
                  fontFamily: deviceConfig.text.title.fontFamily,
                  fontSize: `${deviceConfig.text.title.fontSize / 16}rem`,
                  fontWeight: deviceConfig.text.title.fontWeight,
                  letterSpacing: deviceConfig.text.title.letterSpacing,
                  lineHeight: deviceConfig.text.title.lineHeight,
                  color: 'white',
                  textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                }}
              >
                {text.title}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-card">
        <h3 className="text-sm font-medium text-gray-700 mb-2">작업 정보</h3>
        <div className="space-y-2 text-sm text-gray-600">
          <div>디바이스: {deviceType}</div>
          <div>해상도: {deviceConfig.width} x {deviceConfig.height}</div>
          <div>비율: {deviceConfig.aspectRatio === 16/9 ? '16:9' : '9:16'}</div>
        </div>
      </div>
    </motion.div>
  );
} 