import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BannerSelector } from './components/BannerSelector';
import { BannerEditor } from './components/BannerEditor';
import { CompletionForm } from './components/CompletionForm';
import { BannerType, DeviceType, TextElement, BannerWork } from './types';
import { bannerConfigs } from './config/bannerConfigs';

interface BannerSelection {
  bannerType: BannerType;
  deviceType: DeviceType;
  config: BannerConfig;
}

function App() {
  const [step, setStep] = useState<'selection' | 'editor' | 'completion'>('selection');
  const [bannerSelection, setBannerSelection] = useState<BannerSelection | null>(null);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [textElements, setTextElements] = useState<TextElement[]>([]);
  const [completedWorks, setCompletedWorks] = useState<BannerWork[]>([]);

  // 배너 + 디바이스 선택
  const handleBannerSelect = (selection: BannerSelection) => {
    setBannerSelection(selection);
    // 선택된 배너의 기본 텍스트 요소들 초기화
    initializeTextElements(selection);
    setStep('editor');
  };

  // 기본 텍스트 요소 초기화
  const initializeTextElements = (selection: BannerSelection) => {
    const { config } = selection;
    const elements: TextElement[] = [];

    // 규격이 정해진 배너들의 기본 텍스트
    if (config.fixedText) {
      if (config.mainTitle) {
        elements.push({
          id: 'main-title',
          type: 'fixed',
          text: '',
          x: config.mainTitle.x,
          y: config.mainTitle.y,
          width: config.mainTitle.width,
          height: config.mainTitle.height,
          fontSize: config.mainTitle.fontSize,
          fontFamily: config.mainTitle.fontFamily,
          color: '#000000',
          editable: { position: false, size: false, color: true }
        });
      }

      if (config.subTitle) {
        elements.push({
          id: 'sub-title',
          type: 'fixed',
          text: '',
          x: config.subTitle.x,
          y: config.subTitle.y,
          width: config.subTitle.width,
          height: config.subTitle.height,
          fontSize: config.subTitle.fontSize,
          fontFamily: config.subTitle.fontFamily,
          color: '#000000',
          editable: { position: false, size: false, color: true }
        });
      }
    }

    setTextElements(elements);
  };

  // 이미지 업로드
  const handleImageUpload = (file: File) => {
    setUploadedImage(file);
  };

  // 텍스트 요소 추가 (자유도 높은 배너만)
  const handleAddText = () => {
    if (!bannerSelection?.config.allowCustomText) return;

    const newElement: TextElement = {
      id: crypto.randomUUID(),
      type: 'custom',
      text: '새 텍스트',
      x: 100,
      y: 100,
      width: 200,
      height: 50,
      fontSize: 24,
      fontFamily: 'Pretendard',
      color: '#000000',
      editable: { position: true, size: true, color: true }
    };

    setTextElements(prev => [...prev, newElement]);
  };

  // 텍스트 요소 업데이트
  const handleTextUpdate = (id: string, updates: Partial<TextElement>) => {
    setTextElements(prev => 
      prev.map(element => 
        element.id === id ? { ...element, ...updates } : element
      )
    );
  };

  // 텍스트 요소 삭제
  const handleTextDelete = (id: string) => {
    setTextElements(prev => prev.filter(element => element.id !== id));
  };

  // 완성 단계로 이동
  const handleComplete = () => {
    setStep('completion');
  };

  // 최종 등록
  const handleRegister = async (title: string) => {
    if (!bannerSelection || !uploadedImage) return;

    // 캔버스에서 최종 이미지 생성
    const finalImage = await generateFinalImage();
    
    const newWork: BannerWork = {
      id: crypto.randomUUID(),
      title,
      bannerType: bannerSelection.bannerType,
      deviceType: bannerSelection.deviceType,
      originalImage: uploadedImage,
      finalImage,
      textElements: [...textElements],
      createdAt: new Date()
    };

    setCompletedWorks(prev => [...prev, newWork]);
    handleReset();
  };

  // 최종 이미지 생성 (캔버스 렌더링)
  const generateFinalImage = async (): Promise<Blob> => {
    // 실제 구현에서는 캔버스 API를 사용하여 이미지 + 텍스트를 합성
    // 여기서는 예시로 원본 이미지 반환
    return uploadedImage as Blob;
  };

  // JPG 다운로드
  const handleDownload = (work: BannerWork) => {
    const url = URL.createObjectURL(work.finalImage);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${work.title}_${work.bannerType}_${work.deviceType}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 상태 초기화
  const handleReset = () => {
    setBannerSelection(null);
    setUploadedImage(null);
    setTextElements([]);
    setStep('selection');
  };

  // 목록으로 이동
  const handleGoToList = () => {
    setStep('selection');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">배너 에디터</h1>
          <p className="mt-2 text-gray-600">배너 타입을 선택하고 이미지를 편집하세요</p>
        </header>

        <AnimatePresence mode="wait">
          {step === 'selection' && (
            <motion.div
              key="selection"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <BannerSelector
                onSelect={handleBannerSelect}
                completedWorks={completedWorks}
                onDownload={handleDownload}
              />
            </motion.div>
          )}

          {step === 'editor' && bannerSelection && (
            <motion.div
              key="editor"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <BannerEditor
                bannerSelection={bannerSelection}
                uploadedImage={uploadedImage}
                textElements={textElements}
                onImageUpload={handleImageUpload}
                onAddText={handleAddText}
                onTextUpdate={handleTextUpdate}
                onTextDelete={handleTextDelete}
                onComplete={handleComplete}
                onBack={handleReset}
              />
            </motion.div>
          )}

          {step === 'completion' && (
            <motion.div
              key="completion"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <CompletionForm
                onRegister={handleRegister}
                onBack={() => setStep('editor')}
                onGoToList={handleGoToList}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default App;

// types.ts
export type BannerType = 
  | 'basic-no-logo' 
  | 'basic-with-logo' 
  | 'aviation' 
  | 'main-popup' 
  | 'splash' 
  | 'interactive';

export type DeviceType = 'pc' | 'mobile';

export interface TextElement {
  id: string;
  type: 'fixed' | 'custom';
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  editable: {
    position: boolean;
    size: boolean;
    color: boolean;
  };
}

export interface BannerConfig {
  name: string;
  width: number;
  height: number;
  fixedText: boolean;
  allowCustomText: boolean;
  mainTitle?: {
    x: number;
    y: number;
    width: number;
    height: number;
    fontSize: number;
    fontFamily: string;
  };
  subTitle?: {
    x: number;
    y: number;
    width: number;
    height: number;
    fontSize: number;
    fontFamily: string;
  };
  background?: {
    type: 'image' | 'color';
    value: string;
  };
}

export interface BannerWork {
  id: string;
  title: string;
  bannerType: BannerType;
  deviceType: DeviceType;
  originalImage: File;
  finalImage: Blob;
  textElements: TextElement[];
  createdAt: Date;
}

// components/BannerSelector.tsx
import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { bannerConfigs } from '../config/bannerConfigs';

const BannerSelector = ({ onSelect, completedWorks, onDownload }) => {
  const [selectedOption, setSelectedOption] = useState('');
  
  const handleSelect = () => {
    if (!selectedOption) return;
    
    const config = bannerConfigs[selectedOption];
    const [bannerType, deviceType] = selectedOption.split('-');
    
    onSelect({
      bannerType,
      deviceType: deviceType === 'mobile' ? 'mobile' : 'pc',
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
                    src={URL.createObjectURL(work.finalImage)}
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

// components/BannerEditor.tsx
import React, { useState } from 'react';
import { ImageUpload } from './ImageUpload';
import { TextEditSidebar } from './TextEditSidebar';
import { BannerPreview } from './BannerPreview';

const BannerEditor = ({ 
  bannerSelection, 
  uploadedImage, 
  textElements, 
  onImageUpload, 
  onAddText, 
  onTextUpdate, 
  onTextDelete, 
  onComplete, 
  onBack 
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold">{bannerSelection.config.name}</h2>
          <p className="text-sm text-gray-500">
            {bannerSelection.config.width} × {bannerSelection.config.height}
          </p>
        </div>
        <button
          onClick={onBack}
          className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          뒤로가기
        </button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* 메인 작업 영역 */}
        <div className="col-span-8 space-y-6">
          {/* 이미지 업로드 */}
          {!uploadedImage && (
            <ImageUpload 
              config={bannerSelection.config}
              onUpload={onImageUpload}
            />
          )}

          {/* 미리보기 */}
          {uploadedImage && (
            <BannerPreview
              config={bannerSelection.config}
              image={uploadedImage}
              textElements={textElements}
              onTextUpdate={onTextUpdate}
            />
          )}

          {uploadedImage && (
            <div className="flex justify-end">
              <button
                onClick={onComplete}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                완성
              </button>
            </div>
          )}
        </div>

        {/* 텍스트 편집 사이드바 */}
        <div className="col-span-4">
          <TextEditSidebar
            config={bannerSelection.config}
            textElements={textElements}
            onAddText={onAddText}
            onTextUpdate={onTextUpdate}
            onTextDelete={onTextDelete}
          />
        </div>
      </div>
    </div>
  );
};

// components/CompletionForm.tsx
import React, { useState } from 'react';

const CompletionForm = ({ onRegister, onBack, onGoToList }) => {
  const [title, setTitle] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (title.trim()) {
      onRegister(title.trim());
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-6">작업 완료</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            요청사업팀/담당자 양식으로 타이틀을 적재해주세요.
          </label>
          <p className="text-xs text-gray-500 mb-3">EX. (광고사업팀/OOO)</p>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="(광고사업팀/홍길동)"
            required
          />
        </div>

        <div className="flex space-x-3">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            뒤로
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            등록
          </button>
        </div>
      </form>

      <div className="mt-6 pt-6 border-t border-gray-200">
        <button
          onClick={onGoToList}
          className="w-full px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50"
        >
          목록으로 가기
        </button>
      </div>
    </div>
  );
};

// config/bannerConfigs.ts - 전체 설정
export const bannerConfigs: Record<string, BannerConfig> = {
  'basic-no-logo-pc': {
    name: '기본배너(로고x) - PC',
    width: 2880,
    height: 480,
    fixedText: true,
    allowCustomText: false,
    mainTitle: {
      x: 110, y: 182, width: 1227, height: 104,
      fontSize: 84, fontFamily: 'Pretendard Bold'
    },
    subTitle: {
      x: 110, y: 306, width: 1279, height: 64,
      fontSize: 64, fontFamily: 'Pretendard Bold'
    }
  },
  'basic-no-logo-mobile': {
    name: '기본배너(로고x) - MO',
    width: 1560, height: 468,
    fixedText: true, allowCustomText: false,
    mainTitle: {
      x: 81, y: 187, width: 1199, height: 80,
      fontSize: 80, fontFamily: 'Pretendard Bold'
    },
    subTitle: {
      x: 81, y: 310, width: 1376, height: 60,
      fontSize: 60, fontFamily: 'Pretendard Bold'
    }
  },
  'splash-mobile': {
    name: '스플래시배너 - MO',
    width: 390, height: 844,
    fixedText: false, allowCustomText: true
  },
  'main-popup-mobile': {
    name: '메인홈 팝업 - MO',
    width: 375, height: 203,
    fixedText: false, allowCustomText: true
  },
  'interactive-pc': {
    name: '인터랙티브&전면배너 - PC',
    width: 2880, height: 570,
    fixedText: false, allowCustomText: true
  },
  'interactive-mobile': {
    name: '인터랙티브&전면배너 - MO',
    width: 1050, height: 1050,
    fixedText: false, allowCustomText: true
  }
};