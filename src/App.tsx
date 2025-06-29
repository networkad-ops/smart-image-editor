import { useState, useRef } from 'react';
import BannerSelector from './components/BannerSelector';
import { BannerEditor } from './components/BannerEditor';
import { BannerHistory } from './components/BannerHistory';
import { TextElement, Banner, BannerSelection } from './types';
import { bannerConfigs } from './config/bannerConfigs';
import { useSupabase } from './hooks/useSupabase';
import { testSupabaseConnection } from './services/supabaseService';

type AppStep = 'home' | 'banner-selection' | 'banner-history' | 'editor';

function App() {
  const [step, setStep] = useState<AppStep>('home');
  const [bannerSelection, setBannerSelection] = useState<BannerSelection | null>(null);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [textElements, setTextElements] = useState<TextElement[]>([]);
  const [finalImage, setFinalImage] = useState<Blob | null>(null);
  const [loading, setLoading] = useState(false);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const [uploadedLogo, setUploadedLogo] = useState<File | null>(null);

  const { uploadBannerImage, uploadLogo, createBanner, updateBanner } = useSupabase();

  // 새 배너 만들기 시작
  const handleNewBanner = () => {
    setEditingBanner(null);
    setStep('banner-selection');
  };

  // 배너 히스토리 보기
  const handleBannerHistory = () => {
    setStep('banner-history');
  };

  // 배너 편집 (히스토리에서)
  const handleBannerEdit = async (banner: Banner) => {
    console.log('handleBannerEdit 호출됨:', banner);
    
    setEditingBanner(banner);
    
    // 배너 설정으로 BannerSelection 생성
    const configKey = `${banner.banner_type}-${banner.device_type}` as keyof typeof bannerConfigs;
    let config = bannerConfigs[configKey];
    
    console.log('Config Key:', configKey);
    console.log('Config:', config);
    
    // Config가 없는 경우 기본 설정 사용
    if (!config) {
      console.warn('Config를 찾을 수 없음. 기본 설정 사용:', configKey);
        config = bannerConfigs['basic-no-logo-pc'];
        console.log('기본 설정 사용:', config);
    }
    
    if (config) {
      setBannerSelection({
        bannerType: banner.banner_type,
        deviceType: banner.device_type,
        config
      });
      
      console.log('기존 배너의 텍스트 요소:', banner.text_elements);
      console.log('기존 배너의 텍스트 요소 타입:', typeof banner.text_elements);
      console.log('기존 배너의 텍스트 요소 배열 여부:', Array.isArray(banner.text_elements));
      
      // 기존 텍스트 요소가 올바른 형태인지 확인하고 설정
      if (Array.isArray(banner.text_elements)) {
        // 기존 배너에 누락된 기본 텍스트 요소들을 보완
        const existingElements = [...banner.text_elements];
        const selection = { bannerType: banner.banner_type, deviceType: banner.device_type, config };
        
        // 메인타이틀이 없고 설정에 있는 경우 추가
        if (config.mainTitle && !existingElements.find(el => el.id === 'main-title')) {
          console.log('메인타이틀 요소 추가');
          existingElements.push({
            id: 'main-title',
            type: 'fixed',
            text: '',
            x: config.mainTitle.x,
            y: config.mainTitle.y,
            width: config.mainTitle.width,
            height: config.mainTitle.height,
            fontSize: config.mainTitle.fontSize,
            fontFamily: config.mainTitle.fontFamily,
            fontWeight: config.mainTitle.fontWeight ?? 700,
            letterSpacing: config.mainTitle.letterSpacing,
            color: '#000000',
            editable: { position: !config.fixedText, size: false, color: true }
          });
        }
        
        // 서브타이틀이 없고 설정에 있는 경우 추가
        if (config.subTitle && !existingElements.find(el => el.id === 'sub-title')) {
          console.log('서브타이틀 요소 추가');
          existingElements.push({
            id: 'sub-title',
            type: 'fixed',
            text: '',
            x: config.subTitle.x,
            y: config.subTitle.y,
            width: config.subTitle.width,
            height: config.subTitle.height,
            fontSize: config.subTitle.fontSize,
            fontFamily: config.subTitle.fontFamily,
            fontWeight: config.subTitle.fontWeight ?? 500,
            letterSpacing: config.subTitle.letterSpacing,
            color: '#000000',
            editable: { position: !config.fixedText, size: false, color: true }
          });
        }
        
        // 버튼 텍스트가 없고 설정에 있는 경우 추가
        if (config.buttonText && !existingElements.find(el => el.id === 'button-text')) {
          console.log('버튼 텍스트 요소 추가');
          existingElements.push({
            id: 'button-text',
            type: 'fixed',
            text: '',
            x: config.buttonText.x,
            y: config.buttonText.y,
            width: config.buttonText.width,
            height: config.buttonText.height,
            fontSize: config.buttonText.fontSize,
            fontFamily: config.buttonText.fontFamily,
            fontWeight: config.buttonText.fontWeight ?? 600,
            letterSpacing: config.buttonText.letterSpacing,
            color: '#FFFFFF',
            backgroundColor: '#4F46E5',
            editable: { position: true, size: false, color: true }
          });
        }
        
        setTextElements(existingElements);
      } else {
        console.warn('텍스트 요소가 배열이 아닙니다. 기본 설정으로 초기화합니다.');
        initializeTextElements({ bannerType: banner.banner_type, deviceType: banner.device_type, config });
      }
      
      // 기존 이미지와 로고 로드
      try {
        // 배경 이미지 로드
        const imageUrl = banner.background_image_url || banner.image_url;
        if (imageUrl) {
          console.log('배경 이미지 로드 중:', imageUrl);
          const response = await fetch(imageUrl);
          const blob = await response.blob();
          const file = new File([blob], 'background.jpg', { type: blob.type });
          setUploadedImage(file);
        }
        
        // 로고 이미지 로드
        if (banner.logo_url) {
          console.log('로고 이미지 로드 중:', banner.logo_url);
          const response = await fetch(banner.logo_url);
          const blob = await response.blob();
          const file = new File([blob], 'logo.png', { type: blob.type });
          setUploadedLogo(file);
        }
      } catch (error) {
        console.error('이미지 로드 실패:', error);
        // 이미지 로드에 실패해도 편집은 계속 진행
      }
      
      console.log('Editor 단계로 이동');
      setStep('editor');
    } else {
      console.error('모든 fallback 실패:', configKey);
      alert('배너 설정을 찾을 수 없습니다. 관리자에게 문의하세요.');
    }
  };

  // 배너 타입/디바이스 변경 처리
  const handleBannerTypeChange = (bannerType: string, deviceType: string) => {
    console.log('배너 타입/디바이스 변경:', bannerType, deviceType);
    const configKey = `${bannerType}-${deviceType}` as keyof typeof bannerConfigs;
    const config = bannerConfigs[configKey];
    
    if (config) {
      setBannerSelection({
        bannerType: bannerType as any,
        deviceType: deviceType as any,
        config
      });
      
      // 편집 모드에서 배너 타입이 변경되면 텍스트 요소도 업데이트
      if (editingBanner) {
        initializeTextElements({
          bannerType: bannerType as any,
          deviceType: deviceType as any,
          config
        });
      }
    }
  };

  const handleBannerSelect = (selection: BannerSelection) => {
    setBannerSelection(selection);
    initializeTextElements(selection);
    setStep('editor');
  };

  const initializeTextElements = (selection: BannerSelection) => {
    const elements: TextElement[] = [];
    
    // 메인 타이틀
    if (selection.config.mainTitle) {
      elements.push({
        id: 'main-title',
        type: 'fixed',
        text: '',
        x: selection.config.mainTitle.x,
        y: selection.config.mainTitle.y,
        width: selection.config.mainTitle.width,
        height: selection.config.mainTitle.height,
        fontSize: selection.config.mainTitle.fontSize,
        fontFamily: selection.config.mainTitle.fontFamily,
        fontWeight: selection.config.mainTitle.fontWeight ?? 700,
        letterSpacing: selection.config.mainTitle.letterSpacing,
        color: '#000000',
        editable: {
          position: !selection.config.fixedText,
          size: false,
          color: true
        }
      });
    }
    
    // 서브 타이틀
    if (selection.config.subTitle) {
      elements.push({
        id: 'sub-title',
        type: 'fixed',
        text: '',
        x: selection.config.subTitle.x,
        y: selection.config.subTitle.y,
        width: selection.config.subTitle.width,
        height: selection.config.subTitle.height,
        fontSize: selection.config.subTitle.fontSize,
        fontFamily: selection.config.subTitle.fontFamily,
        fontWeight: selection.config.subTitle.fontWeight ?? 500,
        letterSpacing: selection.config.subTitle.letterSpacing,
        color: '#000000',
        editable: {
          position: !selection.config.fixedText,
          size: false,
          color: true
        }
      });
    }
    
    // 하단 서브 타이틀
    if (selection.config.bottomSubTitle) {
      elements.push({
        id: 'bottom-sub-title',
        type: 'fixed',
        text: '',
        x: selection.config.bottomSubTitle.x,
        y: selection.config.bottomSubTitle.y,
        width: selection.config.bottomSubTitle.width,
        height: selection.config.bottomSubTitle.height,
        fontSize: selection.config.bottomSubTitle.fontSize,
        fontFamily: selection.config.bottomSubTitle.fontFamily,
        fontWeight: selection.config.bottomSubTitle.fontWeight ?? 700,
        letterSpacing: selection.config.bottomSubTitle.letterSpacing,
        color: '#000000',
        editable: {
          position: !selection.config.fixedText,
          size: false,
          color: true
        }
      });
    }
    
    // 버튼 텍스트
    if (selection.config.buttonText) {
      elements.push({
        id: 'button-text',
        type: 'fixed',
        text: '',
        x: selection.config.buttonText.x,
        y: selection.config.buttonText.y,
        width: selection.config.buttonText.width,
        height: selection.config.buttonText.height,
        fontSize: selection.config.buttonText.fontSize,
        fontFamily: selection.config.buttonText.fontFamily,
        fontWeight: selection.config.buttonText.fontWeight ?? 600,
        letterSpacing: selection.config.buttonText.letterSpacing,
        color: '#FFFFFF',
        backgroundColor: '#4F46E5',
        editable: {
          position: true,
          size: false,
          color: true
        }
      });
    }
    
    setTextElements(elements);
  };

  const handleImageUpload = (file: File) => {
    setUploadedImage(file);
  };

  const handleLogoUpload = (file: File) => {
    setUploadedLogo(file);
  };

  const handleAddText = (text: TextElement) => {
    setTextElements(prev => [...prev, text]);
  };

  const handleTextUpdate = (id: string, updates: Partial<TextElement>) => {
    setTextElements(prev => 
      prev.map(element => 
        element.id === id 
          ? { ...element, ...updates }
          : element
      )
    );
  };

  const handleTextDelete = (id: string) => {
    setTextElements(prev => prev.filter(element => element.id !== id));
  };

  const handleComplete = async (image: Blob) => {
    if (!bannerSelection) return;
    
    setLoading(true);
    try {
      console.log('🚀 배너 저장 프로세스 시작');
      
      // 1. Supabase 연결 상태 확인
      console.log('🔍 Supabase 연결 상태 확인 중...');
      const connectionTest = await testSupabaseConnection();
      
      if (!connectionTest.success) {
        console.error('❌ Supabase 연결 실패:', connectionTest);
        throw new Error(`데이터베이스 연결 오류: ${connectionTest.message}`);
      }
      
      console.log('✅ Supabase 연결 정상:', connectionTest.message);
      
      setFinalImage(image);
      
      let backgroundImageUrl = '';
      let logoUrl = '';
      let finalBannerUrl = '';
      
      // 2. 배경 이미지 업로드
      if (uploadedImage) {
        console.log('📸 배경 이미지 업로드 중...');
        try {
          backgroundImageUrl = await uploadBannerImage(uploadedImage, 'background');
          console.log('✅ 배경 이미지 업로드 성공:', backgroundImageUrl);
        } catch (error) {
          console.error('❌ 배경 이미지 업로드 실패:', error);
          throw new Error(`배경 이미지 업로드 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
        }
      }
      
      // 3. 로고 이미지 업로드
      if (uploadedLogo) {
        console.log('🏷️ 로고 이미지 업로드 중...');
        try {
          logoUrl = await uploadLogo(uploadedLogo);
          console.log('✅ 로고 이미지 업로드 성공:', logoUrl);
        } catch (error) {
          console.error('❌ 로고 이미지 업로드 실패:', error);
          throw new Error(`로고 이미지 업로드 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
        }
      }
      
      // 4. 최종 배너 이미지 업로드
      console.log('🎨 최종 배너 이미지 업로드 중...');
      try {
        const finalImageFile = new File([image], 'final-banner.png', { type: 'image/png' });
        finalBannerUrl = await uploadBannerImage(finalImageFile, 'final');
        console.log('✅ 최종 배너 이미지 업로드 성공:', finalBannerUrl);
      } catch (error) {
        console.error('❌ 최종 배너 이미지 업로드 실패:', error);
        throw new Error(`최종 배너 이미지 업로드 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
      }
      
      // 5. 썸네일 생성 및 업로드
      console.log('🖼️ 썸네일 생성 및 업로드 중...');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      const thumbnailUrl = await new Promise<string>((resolve, reject) => {
        img.onload = async () => {
          try {
            const maxSize = 300;
            const ratio = Math.min(maxSize / img.width, maxSize / img.height);
            canvas.width = img.width * ratio;
            canvas.height = img.height * ratio;
            
            ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            canvas.toBlob(async (thumbnailBlob) => {
              if (thumbnailBlob) {
                try {
                  const thumbnailFile = new File([thumbnailBlob], 'thumbnail.png', { type: 'image/png' });
                  const url = await uploadBannerImage(thumbnailFile, 'thumbnail');
                  console.log('✅ 썸네일 업로드 성공:', url);
                  resolve(url);
                } catch (error) {
                  console.error('❌ 썸네일 업로드 실패:', error);
                  reject(new Error(`썸네일 업로드 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`));
                }
              } else {
                reject(new Error('썸네일 생성 실패'));
              }
            }, 'image/png', 0.8);
          } catch (error) {
            reject(error);
          }
        };
        img.onerror = () => reject(new Error('썸네일 이미지 로드 실패'));
        img.src = URL.createObjectURL(image);
      });
      
      // 6. 배너 데이터 저장
      console.log('💾 배너 데이터 저장 중...');
      const bannerData = {
        // 프로젝트 연결 제거 - title에 통합
        title: editingBanner?.title || '새 배너',
        description: editingBanner?.description || '',
        banner_type: bannerSelection.bannerType,
        device_type: bannerSelection.deviceType,
        status: editingBanner?.status || 'draft' as const,
        background_image_url: backgroundImageUrl,
        logo_url: logoUrl,
        final_banner_url: finalBannerUrl,
        thumbnail_url: thumbnailUrl,
        text_elements: textElements,
        canvas_width: bannerSelection.config.width,
        canvas_height: bannerSelection.config.height,
        version: editingBanner ? editingBanner.version + 1 : 1,
        tags: editingBanner?.tags || [],
        notes: editingBanner?.notes || ''
      };
      
      try {
        if (editingBanner) {
          await updateBanner(editingBanner.id, bannerData);
          console.log('✅ 배너 업데이트 완료');
        } else {
          await createBanner(bannerData);
          console.log('✅ 새 배너 생성 완료');
        }
      } catch (error) {
        console.error('❌ 배너 데이터 저장 실패:', error);
        throw new Error(`배너 데이터 저장 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
      }
      
      // 완료 후 홈으로 이동
      console.log('🎉 배너 저장 프로세스 완료');
      handleReset();
      setStep('home');
      
    } catch (error) {
      console.error('💥 배너 저장 프로세스 전체 실패:', error);
      
      // 사용자에게 더 자세한 오류 메시지 표시
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
      const detailedMessage = `배너 저장에 실패했습니다.\n\n오류 내용: ${errorMessage}\n\n이 문제가 계속 발생하면 관리자에게 문의해주세요.`;
      
      alert(detailedMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setBannerSelection(null);
    setEditingBanner(null);
    setUploadedImage(null);
    setUploadedLogo(null);
    setTextElements([]);
    setFinalImage(null);
  };

  const handleGoBack = () => {
    if (step === 'editor') {
      setStep('banner-selection');
    } else if (step === 'banner-selection' || step === 'banner-history') {
      setStep('home');
    }
  };

  const handleGoHome = () => {
    handleReset();
    setStep('home');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 홈 화면 */}
      {step === 'home' && (
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="max-w-4xl mx-auto px-4 py-8 text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Smart Banner Editor
            </h1>
            <p className="text-xl text-gray-600 mb-12">
              원하는 작업을 선택해주세요
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
              {/* 배너 히스토리 */}
              <button
                onClick={handleBannerHistory}
                className="bg-sky-500 hover:bg-sky-600 text-white p-8 rounded-2xl shadow-lg transition-colors group"
              >
                <h2 className="text-2xl font-bold mb-2">배너 히스토리</h2>
                <p className="text-white group-hover:text-white transition-colors">
                  이전 배너 보기 및 재편집
                </p>
              </button>

              {/* 새 배너 만들기 */}
              <button
                onClick={handleNewBanner}
                className="bg-sky-500 hover:bg-sky-600 text-white p-8 rounded-2xl shadow-lg transition-colors group"
              >
                <h2 className="text-2xl font-bold mb-2">새 배너 만들기</h2>
                <p className="text-white group-hover:text-white transition-colors">
                  빠르게 새 배너 제작 시작하기
                </p>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 배너 선택 화면 */}
      {step === 'banner-selection' && (
        <div>
          <BannerSelector
            onBannerSelect={handleBannerSelect}
            onBannerTypeChange={handleBannerTypeChange}
            onBack={handleGoBack}
            onGoHome={handleGoHome}
            editingBanner={editingBanner}
          />
        </div>
      )}

      {/* 배너 히스토리 화면 */}
      {step === 'banner-history' && (
        <div>
          <BannerHistory
            onBannerEdit={handleBannerEdit}
            onBack={handleGoBack}
            onGoHome={handleGoHome}
          />
        </div>
      )}

      {/* 에디터 화면 */}
      {step === 'editor' && bannerSelection && (
        <div>
          <BannerEditor
            selection={bannerSelection}
            uploadedImage={uploadedImage}
            uploadedLogo={uploadedLogo}
            textElements={textElements}
            onImageUpload={handleImageUpload}
            onLogoUpload={handleLogoUpload}
            onAddText={handleAddText}
            onTextUpdate={handleTextUpdate}
            onTextDelete={handleTextDelete}
            onComplete={handleComplete}
            onReset={handleReset}
            onBack={handleGoBack}
            onGoHome={handleGoHome}
            previewCanvasRef={previewCanvasRef}
            editingBanner={editingBanner}
            loading={loading}
          />
        </div>
      )}
    </div>
  );
}

export default App;