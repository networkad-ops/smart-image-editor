import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BannerSelector from './components/BannerSelector';
import { BannerEditor } from './components/BannerEditor';
import { CompletionForm } from './components/CompletionForm';
import { BannerType, DeviceType, TextElement, BannerWork, BannerConfig, Project } from './types'; // types/index.ts로 변경될 수 있음

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

  // 프로젝트 선택/생성
  const handleProjectSelect = (project: Project) => {
    setStep('selection');
  };
  const handleProjectCreate = (name: string) => {
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

  // 최종 등록
  const handleRegister = async (title: string) => {
    if (!bannerSelection || !uploadedImage) return;

    // 캔버스에서 최종 이미지 생성
    const { blob: finalImageBlob, url: finalImageUrl } = await generateFinalImage();
    
    const newWork: BannerWork = {
      id: crypto.randomUUID(),
      title,
      bannerType: bannerSelection.bannerType,
      deviceType: bannerSelection.deviceType,
      originalImage: uploadedImage, // 원본 이미지 유지
      finalImage: finalImageBlob, // 캔버스에서 생성된 Blob
      editedImageUrl: finalImageUrl, // 캔버스에서 생성된 이미지 URL 추가
      textElements: [...textElements],
      createdAt: new Date()
    };

    handleReset();
  };

  // 최종 이미지 생성 (캔버스 렌더링)
  const generateFinalImage = async (): Promise<{ blob: Blob, url: string }> => {
    if (!bannerSelection || !uploadedImage) {
      throw new Error("배너 선택 또는 이미지가 없습니다.");
    }

    const { width, height } = bannerSelection.config;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error("캔버스 렌더링 컨텍스트를 가져올 수 없습니다.");
    }

    // 1. 이미지 그리기
    const img = new Image();
    img.src = URL.createObjectURL(uploadedImage);
    await new Promise((resolve) => {
      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, height);
        URL.revokeObjectURL(img.src); // 메모리 해제
        resolve(null);
      };
      img.onerror = (error) => {
        console.error("이미지 로드 오류:", error);
        resolve(null); // 오류 발생 시에도 프로미스 완료
      };
    });

    // 2. 텍스트 요소 그리기
    textElements.forEach(element => {
      ctx.font = `${element.fontSize}px ${element.fontFamily}`;
      ctx.fillStyle = element.color;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top'; // 텍스트를 위쪽 기준으로 정렬

      // 텍스트를 중앙 정렬해야 하는 경우 (필요시 활성화)
      // ctx.textAlign = 'center';
      // const textX = element.x + element.width / 2;
      // const textY = element.y + element.height / 2 - (element.fontSize / 2); // 대략적인 수직 중앙 정렬
      // ctx.fillText(element.text, textX, textY, element.width);

      // 현재는 왼쪽 상단 기준으로 그리기
      ctx.fillText(element.text, element.x, element.y, element.width);
    });

    // 3. 캔버스에서 Blob 생성
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          resolve({ blob, url });
        } else {
          reject(new Error('캔버스에서 Blob을 생성하지 못했습니다.'));
        }
      }, 'image/jpeg', 0.9); // JPG 형식으로 0.9 품질로 저장
    });
  };

  // JPG 다운로드
  const handleDownload = (work: BannerWork) => {
    // editedImageUrl을 사용하므로 finalImage에서 다시 URL을 생성할 필요 없음
    const a = document.createElement('a');
    a.href = work.editedImageUrl; // 이미 생성된 URL 사용
    a.download = `${work.title}_${work.bannerType}_${work.deviceType}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // URL.revokeObjectURL(url); // 이제 필요 없음, work.editedImageUrl이 관리해야 함.
    // 만약 `work.editedImageUrl`이 더 이상 필요 없을 때 (예: completedWorks에서 제거될 때) 명시적으로 `URL.revokeObjectURL(work.editedImageUrl)`을 호출해야 메모리 누수를 방지할 수 있습니다.
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