import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BannerSelector } from './components/BannerSelector';
import { BannerEditor } from './components/BannerEditor';
import { CompletionForm } from './components/CompletionForm';
import { BannerType, DeviceType, TextElement, BannerWork, BannerConfig } from './types/index';

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