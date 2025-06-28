import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { bannerConfigs } from '../config/bannerConfigs';
import { Banner, BannerSelection } from '../types';

interface BannerSelectorProps {
  onBannerSelect: (selection: BannerSelection) => void;
  onBannerTypeChange: (bannerType: string, deviceType: string) => void;
  onBack: () => void;
  editingBanner?: Banner | null;
}

const BannerSelector: React.FC<BannerSelectorProps> = ({ onBannerSelect, onBannerTypeChange, onBack, editingBanner }) => {
  const [selectedOption, setSelectedOption] = useState('');
  
  const handleSelect = () => {
    if (!selectedOption) return;
    
    const config = bannerConfigs[selectedOption];
    
    // 올바른 방법으로 bannerType과 deviceType 분리
    let bannerType: 'basic-no-logo' | 'basic-with-logo' | 'interactive' | 'fullscreen';
    let deviceType: 'pc' | 'mobile';
    
    if (selectedOption.endsWith('-pc')) {
      bannerType = selectedOption.replace('-pc', '') as any;
      deviceType = 'pc';
    } else if (selectedOption.endsWith('-mobile')) {
      bannerType = selectedOption.replace('-mobile', '') as any;
      deviceType = 'mobile';
    } else {
      // fallback
      console.error('올바르지 않은 selectedOption:', selectedOption);
      return;
    }

    console.log('BannerSelector에서 분리된 타입:', { selectedOption, bannerType, deviceType });

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
              <h1 className="text-3xl font-bold text-gray-900">배너 타입 선택</h1>
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
          <h2 className="text-xl font-semibold mb-4">배너 타입을 선택하세요</h2>
          
          <div className="space-y-4">
            <div className="relative">
              <select
                value={selectedOption}
                onChange={(e) => setSelectedOption(e.target.value)}
                className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
              >
                <option value="">배너 타입을 선택하세요</option>
                {Object.entries(bannerConfigs).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
            
            {selectedOption && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium mb-2">선택된 배너 규격</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>크기: {bannerConfigs[selectedOption].width} × {bannerConfigs[selectedOption].height}</p>
                  <p>텍스트: {bannerConfigs[selectedOption].fixedText ? '고정 위치' : '자유 편집'}</p>
                </div>
              </div>
            )}
            
            <button
              onClick={handleSelect}
              disabled={!selectedOption}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {editingBanner ? '배너 편집 시작' : '배너 만들기 시작'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BannerSelector; 