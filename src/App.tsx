import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BannerSelector from './components/BannerSelector';
import { BannerEditor } from './components/BannerEditor';
import { CompletionForm } from './components/CompletionForm';
import { TextElement, BannerWork, Project, BannerSelection } from './types';
import { bannerConfigs } from './config/bannerConfigs';

function App() {
  const [step, setStep] = useState<'project' | 'selection' | 'editor' | 'completion' | 'edit'>('project');
  const [bannerSelection, setBannerSelection] = useState<BannerSelection | null>(null);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [textElements, setTextElements] = useState<TextElement[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [finalImage, setFinalImage] = useState<Blob | null>(null);

  // 프로젝트 생성
  const handleProjectNameSubmit = (name: string) => {
    const newProject: Project = {
      id: Date.now().toString(),
      name,
      banners: []
    };
    setSelectedProject(newProject);
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
  const handleAddText = (text: TextElement) => {
    setTextElements(prev => [...prev, text]);
  };

  // 텍스트 요소 업데이트
  const handleTextUpdate = (id: string, updates: Partial<TextElement>) => {
    setTextElements(prev =>
      prev.map(text =>
        text.id === id ? { ...text, ...updates } : text
      )
    );
  };

  // 텍스트 요소 삭제
  const handleTextDelete = (id: string) => {
    setTextElements(prev => prev.filter(text => text.id !== id));
  };

  // 완성 단계로 이동
  const handleComplete = (image: Blob) => {
    setFinalImage(image);
    setStep('completion');
  };

  // 배너 등록 - completedWorks에 추가
  const handleRegister = (work: BannerWork) => {
    if (selectedProject) {
      setSelectedProject({
        ...selectedProject,
        banners: [...selectedProject.banners, work]
      });
    }
    setStep('project');
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
    setFinalImage(null);
    setStep('project');
  };

  // 목록으로 이동
  const handleGoToList = () => {
    setStep('project');
  };

  // 완성된 작업에서 편집 클릭 시
  const handleEditWork = (work: BannerWork) => {
    setBannerSelection({
      bannerType: work.bannerType,
      deviceType: work.deviceType,
      config: bannerConfigs[`${work.bannerType}-${work.deviceType}`]
    });
    setTextElements(work.textElements);
    setStep('edit');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">배너 에디터</h1>
          <p className="mt-2 text-gray-600">배너 타입을 선택하고 이미지를 편집하세요</p>
        </header>

        <AnimatePresence mode="wait">
          {(step === 'project' || step === 'selection') && (
            <motion.div
              key="project-selection"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <BannerSelector
                onSelect={handleBannerSelect}
                onProjectCreate={handleProjectNameSubmit}
                onProjectSelect={(project) => setSelectedProject(project)}
                onDownload={handleDownload}
                onEdit={handleEditWork}
                projects={selectedProject ? [selectedProject] : []}
              />
            </motion.div>
          )}

          {(step === 'editor' || step === 'edit') && bannerSelection && (
            <motion.div
              key="editor"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <BannerEditor
                config={bannerSelection.config}
                onImageUpload={handleImageUpload}
                onAddText={handleAddText}
                onTextUpdate={handleTextUpdate}
                onTextDelete={handleTextDelete}
                onComplete={handleComplete}
                textElements={textElements}
                uploadedImage={uploadedImage}
              />
            </motion.div>
          )}

          {step === 'completion' && (
            <motion.div
              key="completion"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <CompletionForm
                onRegister={handleRegister}
                onReset={handleReset}
                onGoToList={handleGoToList}
                finalImage={finalImage || undefined}
                workTitle={selectedProject?.name}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default App;