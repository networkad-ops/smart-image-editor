import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { bannerConfigs } from '../config/bannerConfigs';
import { BannerWork, BannerConfig, BannerType, DeviceType } from '../types';

interface BannerSelection {
  bannerType: BannerType;
  deviceType: DeviceType;
  config: BannerConfig;
}

interface BannerSelectorProps {
  onSelect: (selection: BannerSelection) => void;
  completedWorks: BannerWork[];
  onDownload: (work: BannerWork) => void;
}

const BannerSelector: React.FC<BannerSelectorProps> = ({ onSelect, completedWorks, onDownload }) => {
  const [selectedOption, setSelectedOption] = useState('');
  
  const handleSelect = () => {
    if (!selectedOption) return;
    
    const config = bannerConfigs[selectedOption];
    const [bannerTypeString, deviceTypeString] = selectedOption.split('-');
    
    const bannerType = bannerTypeString as BannerType;
    const deviceType = (deviceTypeString === 'mobile' ? 'mobile' : 'pc') as DeviceType;

    onSelect({
      bannerType,
      deviceType,
      config
    });
  };

  return (
    <div className="space-y-8">
      {/* 배너 선택 */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">배너 타입 선택</h2>
        
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
            선택하기
          </button>
        </div>
      </div>

      {/* 완성된 작업 목록 */}
      {completedWorks.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">완성된 작업</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {completedWorks.map((work) => (
              <div key={work.id} className="border border-gray-200 rounded-lg p-4">
                <div className="aspect-video bg-gray-100 rounded mb-3 overflow-hidden">
                  <img
                    src={work.editedImageUrl}
                    alt={work.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="font-medium text-sm mb-2">{work.title}</h3>
                <p className="text-xs text-gray-500 mb-3">
                  {work.bannerType} - {work.deviceType.toUpperCase()}
                </p>
                <button
                  onClick={() => onDownload(work)}
                  className="w-full px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                >
                  JPG 다운로드
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BannerSelector; 