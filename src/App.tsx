import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BannerSelector from './components/BannerSelector';
import { BannerEditor } from './components/BannerEditor';
import { CompletionForm } from './components/CompletionForm';
import { ProjectManager } from './components/project/ProjectManager';
import { TextElement, Banner, BannerSelection, Team, Project, ProjectFormData, TeamFormData } from './types';
import { bannerConfigs } from './config/bannerConfigs';
import { useSupabase } from './hooks/useSupabase';

type AppStep = 'project-manager' | 'banner-selection' | 'editor' | 'completion';

function App() {
  const [step, setStep] = useState<AppStep>('project-manager');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [bannerSelection, setBannerSelection] = useState<BannerSelection | null>(null);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [uploadedLogo, setUploadedLogo] = useState<File | null>(null);
  const [textElements, setTextElements] = useState<TextElement[]>([]);
  const [finalImage, setFinalImage] = useState<Blob | null>(null);
  const [showBannerProjectModal, setShowBannerProjectModal] = useState(false);

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
  const handleBannerEdit = (banner: Banner) => {
    console.log('handleBannerEdit 호출됨:', banner);
    
    setEditingBanner(banner);
    setSelectedProjectId(banner.project_id);
    
    // 배너 설정으로 BannerSelection 생성
    const configKey = `${banner.banner_type}-${banner.device_type}` as keyof typeof bannerConfigs;
    let config = bannerConfigs[configKey];
    
    console.log('Config Key:', configKey);
    console.log('Config:', config);
    
    // Config가 없는 경우 fallback 로직
    if (!config) {
      console.warn('Config를 찾을 수 없음. Fallback 적용:', configKey);
      
      // event 타입인 경우 basic-no-logo로 fallback
      if (banner.banner_type === 'event') {
        const fallbackKey = `basic-no-logo-${banner.device_type}`;
        config = bannerConfigs[fallbackKey];
        console.log('Event 타입 fallback:', fallbackKey, config);
      }
      
      // 그래도 없으면 기본 PC 설정 사용
      if (!config) {
        config = bannerConfigs['basic-no-logo-pc'];
        console.log('기본 설정 사용:', config);
      }
    }
    
    if (config) {
      setBannerSelection({
        bannerType: banner.banner_type,
        deviceType: banner.device_type,
        config
      });
      setTextElements(banner.text_elements);
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
        color: '#000000',
        editable: { position: false, size: false, color: true }
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
        color: '#000000',
        editable: { position: false, size: false, color: true }
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

  // 배너 저장
  const handleSaveBanner = async (title: string, description?: string) => {
    if (!bannerSelection || !selectedProjectId || !finalImage) return;

    try {
      // 이미지 업로드
      const imageFile = new File([finalImage], `${title}_${Date.now()}.jpg`, { type: 'image/jpeg' });
      const imageUrl = await uploadBannerImage(imageFile);

      // 로고 업로드 (있는 경우)
      let logoUrl: string | undefined;
      if (uploadedLogo) {
        logoUrl = await uploadLogo(uploadedLogo);
      }

      const bannerData = {
        title,
        description,
        banner_type: bannerSelection.bannerType,
        device_type: bannerSelection.deviceType,
        status: 'draft' as const,
        project_id: selectedProjectId,
        image_url: imageUrl,
        logo_url: logoUrl,
        text_elements: textElements,
        canvas_width: bannerSelection.config.width,
        canvas_height: bannerSelection.config.height
      };

      if (editingBanner) {
        // 기존 배너 업데이트
        await updateBanner(editingBanner.id, bannerData);
      } else {
        // 새 배너 생성
        await createBanner(bannerData);
      }

      // 상태 초기화 후 프로젝트 매니저로 돌아가기
      handleReset();
    } catch (error) {
      console.error('배너 저장 실패:', error);
      alert('배너 저장에 실패했습니다.');
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
    if (step === 'completion') {
      setStep('editor');
    } else if (step === 'editor') {
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
                {step === 'completion' && '배너를 저장하세요'}
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
                config={bannerSelection.config}
                onImageUpload={handleImageUpload}
                onLogoUpload={handleLogoUpload}
                onAddText={handleAddText}
                onTextUpdate={handleTextUpdate}
                onTextDelete={handleTextDelete}
                onComplete={handleComplete}
                uploadedImage={uploadedImage}
                uploadedLogo={uploadedLogo}
                textElements={textElements}
                isEditing={!!editingBanner}
                editingBanner={editingBanner || undefined}
                onBannerTypeChange={handleBannerTypeChange}
                onTitleChange={handleTitleChange}
                onGoHome={() => setStep('project-manager')}
              />
            </motion.div>
          )}

          {/* 완성 단계 */}
          {step === 'completion' && finalImage && bannerSelection && (
            <motion.div
              key="completion"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <CompletionForm
                finalImage={finalImage}
                bannerType={bannerSelection.bannerType}
                deviceType={bannerSelection.deviceType}
                onSave={handleSaveBanner}
                onEdit={() => setStep('editor')}
                isEditing={!!editingBanner}
                defaultTitle={editingBanner?.title || bannerSelection.config.name}
                defaultDescription={editingBanner?.description}
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