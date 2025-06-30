import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { MultiLogoConfig } from '../types';

interface MultiLogoUploadProps {
  onUpload: (files: File[]) => void;
  multiLogoConfig: MultiLogoConfig;
  uploadedLogos: File[];
}

export const MultiLogoUpload: React.FC<MultiLogoUploadProps> = ({ 
  onUpload, 
  multiLogoConfig, 
  uploadedLogos 
}) => {
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // 파일 크기 확인
    const validFiles = acceptedFiles.filter(file => {
      if (multiLogoConfig.maxFileSize && file.size > multiLogoConfig.maxFileSize) {
        alert(`파일 크기가 너무 큽니다. ${Math.round(multiLogoConfig.maxFileSize / 1024)}KB 이하로 업로드해주세요.`);
        return false;
      }
      return true;
    });

    // 최대 로고 개수 확인
    const totalCount = uploadedLogos.length + validFiles.length;
    if (totalCount > multiLogoConfig.maxLogos) {
      alert(`최대 ${multiLogoConfig.maxLogos}개의 로고만 업로드할 수 있습니다.`);
      return;
    }

    onUpload([...uploadedLogos, ...validFiles]);
  }, [uploadedLogos, multiLogoConfig, onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.svg', '.webp']
    },
    multiple: true
  });

  // 개별 로고 제거
  const removeLogo = (index: number) => {
    const newLogos = uploadedLogos.filter((_, i) => i !== index);
    onUpload(newLogos);
  };

  // 로고 순서 변경 (드래그 앤 드롭)
  const moveLogoPosition = (fromIndex: number, toIndex: number) => {
    const newLogos = [...uploadedLogos];
    const [movedLogo] = newLogos.splice(fromIndex, 1);
    newLogos.splice(toIndex, 0, movedLogo);
    onUpload(newLogos);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          다중 로고 업로드
        </h3>
        <span className="text-sm text-gray-500">
          {uploadedLogos.length}/{multiLogoConfig.maxLogos}
        </span>
      </div>

      {/* 업로드 영역 */}
      {uploadedLogos.length < multiLogoConfig.maxLogos && (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive 
              ? 'border-blue-400 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input {...getInputProps()} />
          <div className="space-y-2">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <div className="text-sm text-gray-600">
              <span className="font-medium">클릭하여 로고 업로드</span> 또는 드래그 앤 드롭
            </div>
            <p className="text-xs text-gray-500">
              PNG, JPG, SVG, WEBP 
              {multiLogoConfig.maxFileSize && ` | 최대 ${Math.round(multiLogoConfig.maxFileSize / 1024)}KB`}
            </p>
          </div>
        </div>
      )}

      {/* 로고 미리보기 및 순서 조정 */}
      {uploadedLogos.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">
            업로드된 로고 (드래그로 순서 변경 가능)
          </h4>
          
          {/* 로고 배치 미리보기 */}
          <div className="bg-gray-100 p-4 rounded-lg">
            <div className="flex items-center justify-center space-x-2" style={{ minHeight: multiLogoConfig.maxHeight }}>
              {uploadedLogos.map((logo, index) => (
                <React.Fragment key={`${logo.name}-${logo.lastModified}-${index}`}>
                  {index > 0 && (
                    <div 
                      className="bg-gray-400"
                      style={{ 
                        width: multiLogoConfig.separatorWidth,
                        height: multiLogoConfig.maxHeight * 0.6,
                        marginLeft: multiLogoConfig.logoGap / 2 - multiLogoConfig.separatorWidth / 2,
                        marginRight: multiLogoConfig.logoGap / 2 - multiLogoConfig.separatorWidth / 2
                      }}
                    />
                  )}
                  <div className="relative">
                    <img
                      src={URL.createObjectURL(logo)}
                      alt={`로고 ${index + 1}`}
                      className="object-contain"
                      style={{
                        maxHeight: multiLogoConfig.maxHeight,
                        maxWidth: 100
                      }}
                    />
                  </div>
                </React.Fragment>
              ))}
            </div>
            <p className="text-xs text-gray-500 text-center mt-2">
              실제 배너에서의 로고 배치 미리보기
            </p>
          </div>

          {/* 개별 로고 관리 */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {uploadedLogos.map((logo, index) => (
              <div
                key={`logo-${logo.name}-${logo.lastModified}-${index}`}
                className="relative bg-white border border-gray-200 rounded-lg p-3 group"
                draggable
                onDragStart={() => setDragIndex(index)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (dragIndex !== null && dragIndex !== index) {
                    moveLogoPosition(dragIndex, index);
                  }
                  setDragIndex(null);
                }}
              >
                <div className="aspect-square bg-gray-50 rounded-lg mb-2 flex items-center justify-center">
                  <img
                    src={URL.createObjectURL(logo)}
                    alt={`로고 ${index + 1}`}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
                
                <div className="text-xs text-gray-600 text-center mb-2">
                  로고 {index + 1}
                </div>

                {/* 삭제 버튼 */}
                <button
                  onClick={() => removeLogo(index)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                >
                  ×
                </button>

                {/* 드래그 핸들 */}
                <div className="absolute top-1 left-1 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 사용 안내 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <h4 className="text-sm font-medium text-blue-900 mb-1">다중 로고 배치 안내</h4>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• 로고들은 가로로 나란히 배치됩니다</li>
          <li>• 로고 간 간격: {multiLogoConfig.logoGap}px (구분선 포함)</li>
          <li>• 로고가 2개 이상일 때 구분선(|)이 사이에 추가됩니다</li>
          <li>• 최대 {multiLogoConfig.maxLogos}개까지 업로드 가능</li>
          <li>• 드래그로 로고 순서를 변경할 수 있습니다</li>
        </ul>
      </div>
    </div>
  );
}; 