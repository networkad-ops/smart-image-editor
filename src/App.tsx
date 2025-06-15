import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BannerSelector from './components/BannerSelector';
import { BannerEditor } from './components/BannerEditor';
import { CompletionForm } from './components/CompletionForm';
import { BannerType, DeviceType, TextElement, BannerWork, BannerConfig } from './types';
import { bannerConfigs } from './config/bannerConfigs';

interface BannerSelection {
  bannerType: BannerType;
  deviceType: DeviceType;
  config: BannerConfig;
}

function App() {
  const [step, setStep] = useState<'project' | 'selection' | 'editor' | 'completion' | 'edit'>('project');
  const [bannerSelection, setBannerSelection] = useState<BannerSelection | null>(null);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [textElements, setTextElements] = useState<TextElement[]>([]);
  const [completedWorks, setCompletedWorks] = useState<BannerWork[]>([]);

  // 프로젝트 선택/생성
  const handleProjectSelect = () => {
    setStep('selection');
  };
  const handleProjectCreate = () => {
    setStep('selection');
  };

  // 배너 + 디바이스 선택
  const handleBannerSelect = (selection: BannerSelection) => {
    setBannerSelection(selection);
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

  // 배너 등록
  const handleRegister = () => {
    setStep('completion');
  };

  // JPG 다운로드
  const handleDownload = (work: BannerWork) => {
    const a = document.createElement('a');
    a.href = work.editedImageUrl;
    a.download = `${work.title}_${work.bannerType}_${work.deviceType}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // 상태 초기화
  const handleReset = () => {
    setBannerSelection(null);
    setUploadedImage(null);
    setTextElements([]);
    setStep('project');
  };

  // 목록으로 이동
  const handleGoToList = () => {
    setStep('selection');
  };

  // 완성된 작업에서 편집 클릭 시
  const handleEditWork = (work: BannerWork) => {
    setBannerSelection({
      bannerType: work.bannerType,
      deviceType: work.deviceType,
      config: getBannerConfig(work.bannerType, work.deviceType)
    });
    setUploadedImage(work.originalImage);
    setTextElements(work.textElements);
    setStep('edit');
  };

  // 배너 config 찾기
  const getBannerConfig = (bannerType: BannerType, deviceType: DeviceType): BannerConfig => {
    const key = `${bannerType}-${deviceType}`;
    // @ts-ignore
    return bannerConfigs[key];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">배너 에디터</h1>
          <p className="mt-2 text-gray-600">배너 타입을 선택하고 이미지를 편집하세요</p>
        </header>

        <AnimatePresence mode="wait">
          {step === 'project' && (
            <motion.div
              key="project"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* 프로젝트 선택/생성 컴포넌트 */}
            </motion.div>
          )}

          {step === 'selection' && (
            <motion.div
              key="selection"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <BannerSelector
                onSelect={handleBannerSelect}
                onProjectSelect={handleProjectSelect}
                onProjectCreate={handleProjectCreate}
                onDownload={handleDownload}
                onEdit={handleEditWork}
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

          {/* 편집 모드 */}
          {step === 'edit' && bannerSelection && (
            <motion.div
              key="edit"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <BannerEditor
                bannerSelection={bannerSelection}
                uploadedImage={uploadedImage}
                textElements={textElements}
                onImageUpload={setUploadedImage}
                onAddText={handleAddText}
                onTextUpdate={handleTextUpdate}
                onTextDelete={handleTextDelete}
                onComplete={() => setStep('completion')}
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