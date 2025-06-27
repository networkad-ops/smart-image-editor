import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BannerSelector from './components/BannerSelector';
import { BannerEditor } from './components/BannerEditor';

import { ProjectManager } from './components/project/ProjectManager';
import { TextElement, Banner, BannerSelection, Team, Project, ProjectFormData, TeamFormData } from './types';
import { bannerConfigs } from './config/bannerConfigs';
import { useSupabase } from './hooks/useSupabase';

type AppStep = 'project-manager' | 'banner-selection' | 'editor';

function App() {
  const [step, setStep] = useState<AppStep>('project-manager');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [bannerSelection, setBannerSelection] = useState<BannerSelection | null>(null);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [textElements, setTextElements] = useState<TextElement[]>([]);
  const [finalImage, setFinalImage] = useState<Blob | null>(null);
  const [showBannerProjectModal, setShowBannerProjectModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const [uploadedLogo, setUploadedLogo] = useState<File | null>(null);

  const { uploadBannerImage, uploadLogo, createBanner, updateBanner, createProject, createTeam, teams, projects } = useSupabase();

  // 새 배너 만들기 모달 표시
  const handleShowBannerProjectModal = () => {
    setShowBannerProjectModal(true);
  };

  // 배너 프로젝트 선택 완료
  const handleBannerProjectSelect = (projectId: string) => {
    setSelectedProjectId(projectId);
    setEditingBanner(null);
    setShowBannerProjectModal(false);
    setStep('banner-selection');
  };

  // 프로젝트 매니저에서 새 배너 생성 요청
  const handleBannerCreate = (projectId: string) => {
    setSelectedProjectId(projectId);
    setEditingBanner(null);
    setStep('banner-selection');
  };

  // 프로젝트 매니저에서 배너 편집 요청
  const handleBannerEdit = async (banner: Banner) => {
    console.log('handleBannerEdit 호출됨:', banner);
    
    setEditingBanner(banner);
    setSelectedProjectId(banner.project_id);
    
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
        setEditingBanner({
          ...editingBanner,
          banner_type: bannerType as any,
          device_type: deviceType as any
        });
      }
    }
  };

  // 타이틀 변경 처리
  const handleTitleChange = (title: string) => {
    if (editingBanner) {
      setEditingBanner({
        ...editingBanner,
        title
      });
    }
  };

  // 배너 + 디바이스 선택
  const handleBannerSelect = (selection: BannerSelection) => {
    setBannerSelection(selection);
    
    // 편집 모드가 아닌 경우 기본 텍스트 요소 초기화
    if (!editingBanner) {
      initializeTextElements(selection);
    }
    
    setStep('editor');
  };

  // 기본 텍스트 요소 초기화
  const initializeTextElements = (selection: BannerSelection) => {
    const elements: TextElement[] = [];
    
    // 메인타이틀 설정이 있는 경우 텍스트 요소 추가
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
        editable: { position: !selection.config.fixedText, size: false, color: true }
      });
    }
    
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
        editable: { position: !selection.config.fixedText, size: false, color: true }
      });
    }
    
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
        backgroundColor: '#4F46E5', // 기본 버튼 배경색
        editable: { position: true, size: false, color: true }
      });
    }
    
    setTextElements(elements);
  };

  // 이미지 업로드
  const handleImageUpload = (file: File) => {
    setUploadedImage(file);
  };

  // 로고 업로드
  const handleLogoUpload = (file: File) => {
    setUploadedLogo(file);
  };

  // 텍스트 요소 추가 (자유도 높은 배너만)
  const handleAddText = (text: TextElement) => {
    setTextElements(prev => [...prev, text]);
  };

  // 텍스트 요소 업데이트
  const handleTextUpdate = (id: string, updates: Partial<TextElement>) => {
    console.log('텍스트 업데이트 호출됨:', id, updates);
    setTextElements(prev => {
      const updated = prev.map(text =>
        text.id === id ? { ...text, ...updates } : text
    );
      console.log('업데이트된 텍스트 요소들:', updated);
      return updated;
    });
  };

  // 텍스트 요소 삭제
  const handleTextDelete = (id: string) => {
    setTextElements(prev => prev.filter(text => text.id !== id));
  };

  // 완료 버튼 클릭 시 바로 저장
  const handleComplete = async (image: Blob) => {
    if (!selectedProjectId || !bannerSelection) {
      alert('프로젝트 정보가 없습니다.');
      return;
    }

    try {
      setLoading(true);
      console.log('handleComplete 호출됨 - 바로 저장 시작');

      // Blob을 File로 변환
      const fileName = editingBanner?.title 
        ? `${editingBanner.title.replace(/[^\w\s-]/g, '').trim()}_${Date.now()}.jpg`
        : `banner_${Date.now()}.jpg`;
      
      const bannerFile = new File([image], fileName, { type: 'image/jpeg' });
      console.log('배너 파일 생성:', bannerFile.name, bannerFile.size, 'bytes');

      // 이미지 업로드 (임시로 Mock URL 사용)
      let imageUrl: string;
      try {
        imageUrl = await uploadBannerImage(bannerFile);
        console.log('이미지 업로드 완료:', imageUrl);
      } catch (uploadError) {
        console.error('이미지 업로드 실패, Mock URL 사용:', uploadError);
        // 임시로 Mock URL 사용
        imageUrl = `https://via.placeholder.com/800x400/0066cc/ffffff?text=Banner_${Date.now()}`;
        console.log('Mock 이미지 URL 사용:', imageUrl);
      }

      // 로고 업로드 (있는 경우)
      let logoUrl = editingBanner?.logo_url || '';
      if (uploadedLogo) {
        logoUrl = await uploadLogo(uploadedLogo);
        console.log('로고 업로드 완료:', logoUrl);
      }
      
      // 배너 타입과 디바이스 타입은 이미 BannerSelection에서 올바르게 분리되어 있음
      const bannerType = bannerSelection.bannerType;
      const deviceType = bannerSelection.deviceType;

      console.log('배너 타입 확인:', {
        bannerType,
        deviceType
      });

      // 배너 이름 기본값: 드롭다운에서 선택한 배너 타입 이름 사용
      const defaultTitle = editingBanner?.title || 
        bannerSelection.config.name || 
        `배너_${Date.now()}`;

      // 배너 데이터 구성
      const bannerData: Partial<Banner> = {
        title: defaultTitle,
        description: editingBanner?.description || '',
        banner_type: bannerType as any,
        device_type: deviceType as any,
        status: 'draft' as const,
        project_id: selectedProjectId,
        background_image_url: imageUrl,
        logo_url: logoUrl,
        text_elements: textElements,
        canvas_width: bannerSelection.config.width,
        canvas_height: bannerSelection.config.height
      };

      console.log('배너 데이터:', bannerData);

      // 배너 저장 또는 업데이트
      if (editingBanner) {
        await updateBanner(editingBanner.id, bannerData);
        console.log('배너 업데이트 완료');
      } else {
        await createBanner(bannerData);
        console.log('새 배너 생성 완료');
      }

      alert('배너가 성공적으로 저장되었습니다!');
      
      // 상태 초기화 후 프로젝트 매니저로 돌아가기
      handleReset();
    } catch (error) {
      console.error('배너 저장 실패:', error);
      alert(`배너 저장에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setLoading(false);
    }
  };

  // 상태 초기화
  const handleReset = () => {
    console.log('상태 초기화');
    setSelectedProjectId(null);
    setBannerSelection(null);
    setEditingBanner(null);
    setUploadedImage(null);
    setUploadedLogo(null);
    setTextElements([]);
    setFinalImage(null);
    setShowBannerProjectModal(false);
    setStep('project-manager');
  };

  // 뒤로 가기
  const handleGoBack = () => {
    if (step === 'editor') {
      if (editingBanner) {
        handleReset();
      } else {
        setStep('banner-selection');
      }
    } else if (step === 'banner-selection') {
      handleReset();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">배너 에디터</h1>
              <p className="mt-2 text-gray-600">
                {step === 'project-manager' && '프로젝트를 관리하고 배너를 생성하세요'}
                {step === 'banner-selection' && '배너 타입과 디바이스를 선택하세요'}
                {step === 'editor' && '배너를 편집하세요'}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {step === 'project-manager' && (
                <button
                  onClick={handleShowBannerProjectModal}
                  className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors font-medium flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>새 배너 만들기</span>
                </button>
              )}
              {step !== 'project-manager' && (
                <button
                  onClick={handleGoBack}
                  className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span>뒤로</span>
                </button>
              )}
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {/* 프로젝트 관리 */}
          {step === 'project-manager' && (
            <motion.div
              key="project-manager"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <ProjectManager 
                onBannerCreate={handleBannerCreate}
                onBannerEdit={handleBannerEdit}
              />
            </motion.div>
          )}

          {/* 배너 선택 */}
          {step === 'banner-selection' && (
            <motion.div
              key="banner-selection"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <BannerSelector
                onSelect={handleBannerSelect}
                onProjectCreate={() => {}} // 사용하지 않음
                onProjectSelect={() => {}} // 사용하지 않음
                onDownload={() => {}} // 사용하지 않음
                onEdit={() => {}} // 사용하지 않음
                projects={[]} // 사용하지 않음
                hideProjectManagement={true} // 프로젝트 관리 UI 숨김
              />
            </motion.div>
          )}

          {/* 배너 에디터 */}
          {step === 'editor' && bannerSelection && (
            <motion.div
              key="editor"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <BannerEditor
                ref={previewCanvasRef}
                config={bannerSelection.config}
                textElements={textElements}
                onImageUpload={handleImageUpload}
                onLogoUpload={handleLogoUpload}
                onAddText={handleAddText}
                onTextUpdate={handleTextUpdate}
                onTextDelete={handleTextDelete}
                onComplete={handleComplete}
                uploadedImage={uploadedImage}
                uploadedLogo={uploadedLogo}
                editingBanner={editingBanner}
                isLoading={loading}
              />
            </motion.div>
          )}


        </AnimatePresence>
      </div>

      {/* 배너 프로젝트 선택 모달 */}
      {showBannerProjectModal && (
        <BannerProjectModal
          teams={teams}
          projects={projects}
          onProjectSelect={handleBannerProjectSelect}
          onCreateTeam={createTeam}
          onCreateProject={createProject}
          onClose={() => setShowBannerProjectModal(false)}
        />
      )}
    </div>
  );
}

// 배너 프로젝트 선택 모달 컴포넌트
interface BannerProjectModalProps {
  teams: Team[];
  projects: Project[];
  onProjectSelect: (projectId: string) => void;
  onCreateTeam: (data: TeamFormData) => Promise<Team>;
  onCreateProject: (data: ProjectFormData) => Promise<Project>;
  onClose: () => void;
}

const BannerProjectModal: React.FC<BannerProjectModalProps> = ({
  teams,
  projects,
  onProjectSelect,
  onCreateTeam,
  onCreateProject,
  onClose
}) => {
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [showNewTeamForm, setShowNewTeamForm] = useState(false);
  const [showNewProjectForm, setShowNewProjectForm] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');

  // 팀별 프로젝트 필터링
  const filteredProjects = selectedTeamId 
    ? projects.filter(p => p.team_id === selectedTeamId)
    : projects;

  // 새 팀 생성
  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) return;
    
    try {
      const newTeam = await onCreateTeam({
        name: newTeamName,
        description: '',
        color: '#3B82F6'
      });
      setSelectedTeamId(newTeam.id);
      setNewTeamName('');
      setShowNewTeamForm(false);
    } catch (error) {
      console.error('팀 생성 실패:', error);
      alert('팀 생성에 실패했습니다.');
    }
  };

  // 새 프로젝트 생성
  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    
    try {
      const newProject = await onCreateProject({
        name: newProjectName,
        description: newProjectDescription,
        team_id: selectedTeamId || undefined,
        status: 'active',
        priority: 'medium'
      });
      // 프로젝트 생성 후 배너 만들기 시작
      onProjectSelect(newProject.id);
      onClose(); // 모달 닫기
    } catch (error) {
      console.error('프로젝트 생성 실패:', error);
      alert('프로젝트 생성에 실패했습니다.');
    }
  };

  // 기존 프로젝트 선택
  const handleProjectSelect = () => {
    if (selectedProjectId) {
      onProjectSelect(selectedProjectId);
      onClose(); // 모달 닫기
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-semibold mb-6">새 배너 만들기</h3>
        
        {/* 팀 선택 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700">
              담당사업팀
            </label>
            <button
              onClick={() => setShowNewTeamForm(!showNewTeamForm)}
              className="text-blue-500 hover:text-blue-700 text-sm"
            >
              + 새 팀 추가
            </button>
          </div>
          
          {showNewTeamForm && (
            <div className="mb-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="팀 이름"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleCreateTeam}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                >
                  추가
                </button>
                <button
                  onClick={() => setShowNewTeamForm(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                >
                  취소
                </button>
              </div>
            </div>
          )}
          
          <select
            value={selectedTeamId}
            onChange={(e) => {
              setSelectedTeamId(e.target.value);
              setSelectedProjectId(''); // 팀 변경 시 프로젝트 선택 초기화
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">팀 선택 (선택사항)</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </div>

        {/* 프로젝트 선택 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700">
              프로젝트 <span className="text-red-500">*</span>
            </label>
            <button
              onClick={() => setShowNewProjectForm(!showNewProjectForm)}
              className="text-blue-500 hover:text-blue-700 text-sm"
            >
              + 새 프로젝트 추가
            </button>
          </div>
          
          {showNewProjectForm && (
            <div className="mb-3 p-4 bg-gray-50 rounded-lg">
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="프로젝트 이름"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <textarea
                  placeholder="프로젝트 설명 (선택사항)"
                  value={newProjectDescription}
                  onChange={(e) => setNewProjectDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                />
                <div className="flex space-x-2">
                  <button
                    onClick={handleCreateProject}
                    className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
                  >
                    프로젝트 생성 후 배너 만들기
                  </button>
                  <button
                    onClick={() => setShowNewProjectForm(false)}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                  >
                    취소
                  </button>
                </div>
              </div>
            </div>
          )}
          
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">프로젝트 선택</option>
            {filteredProjects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name} {project.team && `(${project.team.name})`}
              </option>
            ))}
          </select>
        </div>

        {/* 버튼 */}
        <div className="flex space-x-3">
          <button
            onClick={handleProjectSelect}
            disabled={!selectedProjectId}
            className="flex-1 bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            배너 만들기 시작
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400 transition-colors"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;