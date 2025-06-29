import React from 'react';
import { bannerConfigs } from '../config/bannerConfigs';
import { Banner, BannerSelection } from '../types';

interface BannerSelectorProps {
  onBannerSelect: (selection: BannerSelection) => void;
  onBannerTypeChange: (bannerType: string, deviceType: string) => void;
  onBack: () => void;
  onGoHome?: () => void;
  editingBanner?: Banner | null;
}

const BannerSelector: React.FC<BannerSelectorProps> = ({ onBannerSelect, onBannerTypeChange, onBack, onGoHome, editingBanner }) => {
  
  const handleCardClick = (key: string, config: any) => {
    // 올바른 방법으로 bannerType과 deviceType 분리
    let bannerType: 'basic-no-logo' | 'basic-with-logo' | 'interactive' | 'fullscreen';
    let deviceType: 'pc' | 'mobile';
    
    if (key.endsWith('-pc')) {
      bannerType = key.replace('-pc', '') as any;
      deviceType = 'pc';
    } else if (key.endsWith('-mobile')) {
      bannerType = key.replace('-mobile', '') as any;
      deviceType = 'mobile';
    } else {
      // fallback
      console.error('올바르지 않은 key:', key);
      return;
    }

    onBannerSelect({
      bannerType,
      deviceType,
      config
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
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
                {editingBanner ? `"${editingBanner.title}" 배너를 편집합니다` : '새 배너를 만들어보세요'}
              </p>
            </div>
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

        {/* 배너 선택 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-6">배너 타입을 선택하세요</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(bannerConfigs).map(([key, config]) => (
              <div
                key={key}
                onClick={() => handleCardClick(key, config)}
                className="relative cursor-pointer border-2 rounded-lg transition-colors hover:border-blue-400 hover:shadow-md bg-white p-4 border-gray-200"
              >
                {/* 배너 정보 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 text-lg">{config.name}</h3>
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                    <span>{config.width} × {config.height}</span>
                  </div>
                  
                  <div className="mt-3 pt-2 border-t border-gray-100">
                    <div className="flex items-center justify-center text-blue-600 font-medium">
                      <span>클릭하여 시작하기</span>
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BannerSelector; 