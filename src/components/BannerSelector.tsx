import React, { useState } from 'react';
import { BannerType, DeviceType, BannerWork, BannerConfig } from '../types/index';
import { bannerConfigs } from '../config/bannerConfigs';

interface BannerSelectorProps {
  onSelect: (selection: { bannerType: BannerType; deviceType: DeviceType; config: BannerConfig }) => void;
  completedWorks: BannerWork[];
  onDownload: (work: BannerWork) => void;
}

export const BannerSelector: React.FC<BannerSelectorProps> = ({ onSelect, completedWorks, onDownload }) => {
  const [selectedOption, setSelectedOption] = useState<{
    bannerType?: BannerType;
    deviceType?: DeviceType;
  }>({});

  const handleSelect = () => {
    if (!selectedOption.bannerType || !selectedOption.deviceType) return;
    const config = bannerConfigs[`${selectedOption.bannerType}_${selectedOption.deviceType}`];
    if (!config) return;
    onSelect({ ...selectedOption, config } as { bannerType: BannerType; deviceType: DeviceType; config: BannerConfig });
  };

  const handleBannerTypeChange = (bannerType: BannerType) => {
    setSelectedOption(prev => ({ ...prev, bannerType }));
  };

  const handleDeviceTypeChange = (deviceType: DeviceType) => {
    setSelectedOption(prev => ({ ...prev, deviceType }));
  };

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">배너 타입 선택</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">배너 타입</label>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              value={selectedOption.bannerType || ''}
              onChange={(e) => handleBannerTypeChange(e.target.value as BannerType)}
            >
              <option value="">배너 타입을 선택하세요</option>
              <option value="basic-no-logo">기본 배너 (로고 없음)</option>
              <option value="basic-with-logo">기본 배너 (로고 있음)</option>
              <option value="aviation">항공 배너</option>
              <option value="main-popup">메인 팝업</option>
              <option value="splash">스플래시</option>
              <option value="interactive">인터랙티브</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">디바이스</label>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              value={selectedOption.deviceType || ''}
              onChange={(e) => handleDeviceTypeChange(e.target.value as DeviceType)}
            >
              <option value="">디바이스를 선택하세요</option>
              <option value="pc">PC</option>
              <option value="mobile">모바일</option>
            </select>
          </div>
        </div>
        <button
          className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
          onClick={handleSelect}
          disabled={!selectedOption.bannerType || !selectedOption.deviceType}
        >
          선택 완료
        </button>
      </div>
      {completedWorks.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">완성된 작품</h2>
          <div className="grid grid-cols-2 gap-4">
            {completedWorks.map((work) => (
              <div key={work.id} className="border rounded-lg p-4">
                <h3 className="font-medium">{work.title}</h3>
                <p className="text-sm text-gray-500">
                  {work.bannerType} - {work.deviceType}
                </p>
                <button
                  className="mt-2 text-blue-600 hover:text-blue-800"
                  onClick={() => onDownload(work)}
                >
                  다운로드
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}; 