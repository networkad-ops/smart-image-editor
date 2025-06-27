import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Team, 
  Project, 
  Banner, 
  ProjectFormData, 
  TeamFormData,
  ProjectStatus,
  ProjectPriority,
  BannerStatus
} from '../../types';
import { useSupabase } from '../../hooks/useSupabase';

interface ProjectManagerProps {
  onBannerEdit: (banner: Banner) => void;
  onBannerCreate: (projectId: string) => void;
}

type ViewMode = 'dashboard' | 'teams' | 'projects';

export const ProjectManager: React.FC<ProjectManagerProps> = ({
  onBannerEdit,
  onBannerCreate
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Supabase hooks
  const { 
    teams, 
    projects, 
    banners,
    loading,
    createTeam,
    updateTeam,
    deleteTeam,
    createProject,
    updateProject,
    deleteProject,
    deleteBanner,
    fetchTeams,
    fetchProjects,
    fetchBanners
  } = useSupabase();

  useEffect(() => {
    fetchTeams();
    fetchProjects();
    fetchBanners();
  }, []);

  // 선택된 프로젝트가 있을 때 자동으로 확장
  useEffect(() => {
    if (selectedProjectId) {
      setExpandedProjects(new Set([selectedProjectId]));
    }
  }, [selectedProjectId]);

  // 프로젝트 확장/축소
  const toggleProjectExpansion = (projectId: string) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
    }
    setExpandedProjects(newExpanded);
  };

  // 프로젝트 선택 (대시보드에서 프로젝트 클릭 시)
  const handleProjectSelect = (projectId: string) => {
    setSelectedProjectId(projectId);
    setViewMode('projects');
    setExpandedProjects(new Set([projectId]));
  };

  // 프로젝트 뷰에서 뒤로 가기
  const handleBackToDashboard = () => {
    setSelectedProjectId(null);
    setViewMode('dashboard');
    setExpandedProjects(new Set());
  };

  // 팀 생성/수정
  const handleTeamSubmit = async (data: TeamFormData) => {
    try {
      if (editingTeam) {
        await updateTeam(editingTeam.id, data);
      } else {
        await createTeam(data);
      }
      setShowTeamForm(false);
      setEditingTeam(null);
      fetchTeams();
    } catch (error) {
      console.error('Error saving team:', error);
      alert('팀 저장에 실패했습니다: ' + (error instanceof Error ? error.message : '알 수 없는 오류'));
    }
  };

  // 프로젝트 생성/수정
  const handleProjectSubmit = async (data: ProjectFormData) => {
    try {
      if (editingProject) {
        await updateProject(editingProject.id, data);
      } else {
        await createProject(data);
      }
      setShowProjectForm(false);
      setEditingProject(null);
      fetchProjects();
    } catch (error) {
      console.error('Error saving project:', error);
      alert('프로젝트 저장에 실패했습니다: ' + (error instanceof Error ? error.message : '알 수 없는 오류'));
    }
  };

  // 팀 삭제
  const handleTeamDelete = async (teamId: string) => {
    if (window.confirm('이 팀을 삭제하시겠습니까? 팀에 속한 모든 프로젝트도 함께 삭제됩니다.')) {
      try {
        await deleteTeam(teamId);
        fetchTeams();
        fetchProjects();
        // 모달이 열려있다면 닫기 (최신 데이터 반영을 위해)
        setShowTeamForm(false);
        setShowProjectForm(false);
        setEditingTeam(null);
        setEditingProject(null);
      } catch (error) {
        console.error('Error deleting team:', error);
        alert('팀 삭제에 실패했습니다: ' + (error instanceof Error ? error.message : '알 수 없는 오류'));
      }
    }
  };

  // 프로젝트 삭제
  const handleProjectDelete = async (projectId: string) => {
    if (window.confirm('이 프로젝트를 삭제하시겠습니까? 프로젝트에 속한 모든 배너도 함께 삭제됩니다.')) {
      try {
        await deleteProject(projectId);
        fetchProjects();
        fetchBanners();
        // 모달이 열려있다면 닫기 (최신 데이터 반영을 위해)
        setShowProjectForm(false);
        setEditingProject(null);
      } catch (error) {
        console.error('Error deleting project:', error);
        alert('프로젝트 삭제에 실패했습니다: ' + (error instanceof Error ? error.message : '알 수 없는 오류'));
      }
    }
  };

  // 배너 삭제
  const handleBannerDelete = async (bannerId: string) => {
    if (window.confirm('이 배너를 삭제하시겠습니까?')) {
      try {
        await deleteBanner(bannerId);
        fetchBanners();
      } catch (error) {
        console.error('Error deleting banner:', error);
        alert('배너 삭제에 실패했습니다: ' + (error instanceof Error ? error.message : '알 수 없는 오류'));
      }
    }
  };

  // 상태별 색상 반환
  const getStatusColor = (status: ProjectStatus | BannerStatus) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      on_hold: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-red-100 text-red-800',
      draft: 'bg-gray-100 text-gray-800',
      in_progress: 'bg-blue-100 text-blue-800',
      review: 'bg-purple-100 text-purple-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // 우선순위별 색상 반환
  const getPriorityColor = (priority: ProjectPriority) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };
    return colors[priority];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">프로젝트 관리</h1>
            <nav className="flex space-x-4">
              {(['dashboard', 'teams', 'projects'] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    viewMode === mode
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {mode === 'dashboard' && '대시보드'}
                  {mode === 'teams' && '팀 관리'}
                  {mode === 'projects' && '프로젝트'}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {/* 대시보드 뷰 */}
          {viewMode === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* 최근 프로젝트 */}
              <div className="bg-white rounded-lg shadow-sm">
                <div className="p-6 border-b">
                  <h2 className="text-lg font-semibold text-gray-900">최근 프로젝트</h2>
                </div>
                <div className="divide-y">
                  {projects.slice(0, 10).map((project) => (
                    <div 
                      key={project.id} 
                      className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => handleProjectSelect(project.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            {project.team && (
                              <div 
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: project.team.color }}
                              ></div>
                            )}
                            <h3 className="font-medium text-gray-900 hover:text-blue-600 transition-colors">{project.name}</h3>
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                          <p className="text-sm text-gray-500">{project.description}</p>
                          <div className="flex items-center space-x-3 mt-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(project.status)}`}>
                              {project.status === 'completed' && '완료'}
                              {project.status === 'on_hold' && '보류'}
                              {project.status === 'cancelled' && '취소'}
                            </span>
                            <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(project.priority)}`}>
                              {project.priority === 'low' && '낮음'}
                              {project.priority === 'high' && '높음'}
                              {project.priority === 'urgent' && '긴급'}
                            </span>
                            {project.manager_name && (
                              <span className="text-xs text-gray-500">담당자: {project.manager_name}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="text-sm text-gray-500">
                              배너 {banners.filter(b => b.project_id === project.id).length}개
                            </p>
                            <p className="text-xs text-gray-400">
                              {new Date(project.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onBannerCreate(project.id);
                            }}
                            className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition-colors"
                          >
                            배너 추가
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {projects.length === 0 && (
                    <div className="p-6 text-center text-gray-500">
                      <p>아직 프로젝트가 없습니다.</p>
                      <button
                        onClick={() => setViewMode('projects')}
                        className="text-blue-500 hover:text-blue-700 text-sm mt-2"
                      >
                        첫 프로젝트 만들기 →
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* 팀 관리 뷰 */}
          {viewMode === 'teams' && (
            <motion.div
              key="teams"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">팀 관리</h2>
                <button
                  onClick={() => setShowTeamForm(true)}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  새 팀 추가
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teams.map((team) => (
                  <div key={team.id} className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: team.color }}
                        ></div>
                        <h3 className="font-semibold text-gray-900">{team.name}</h3>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setEditingTeam(team);
                            setShowTeamForm(true);
                          }}
                          className="text-gray-400 hover:text-blue-500"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleTeamDelete(team.id)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    {team.description && (
                      <p className="text-sm text-gray-600 mb-4">{team.description}</p>
                    )}
                    <div className="text-sm text-gray-500">
                      프로젝트 {projects.filter(p => p.team_id === team.id).length}개
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* 프로젝트 뷰 */}
          {viewMode === 'projects' && (
            <motion.div
              key="projects"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  {selectedProjectId && (
                    <button
                      onClick={handleBackToDashboard}
                      className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      <span>대시보드로</span>
                    </button>
                  )}
                  <h2 className="text-xl font-semibold text-gray-900">
                    {selectedProjectId 
                      ? `${projects.find(p => p.id === selectedProjectId)?.name} - 배너 목록`
                      : '프로젝트 목록'
                    }
                  </h2>
                </div>
                <button
                  onClick={() => setShowProjectForm(true)}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  새 프로젝트 추가
                </button>
              </div>

              <div className="bg-white rounded-lg shadow-sm">
                <div className="divide-y">
                  {(selectedProjectId ? projects.filter(p => p.id === selectedProjectId) : projects).map((project) => {
                    const projectBanners = banners.filter(b => b.project_id === project.id);
                    const isExpanded = expandedProjects.has(project.id);
                    
                    return (
                      <div key={project.id} className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              {project.team && (
                                <div 
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: project.team.color }}
                                ></div>
                              )}
                              <h3 className="font-semibold text-gray-900">{project.name}</h3>
                              <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(project.status)}`}>
                                {project.status}
                              </span>
                              <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(project.priority)}`}>
                                {project.priority}
                              </span>
                            </div>
                            {project.description && (
                              <p className="text-sm text-gray-600 mb-2">{project.description}</p>
                            )}
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              {project.manager_name && <span>담당자: {project.manager_name}</span>}
                              {project.team && <span>팀: {project.team.name}</span>}
                              {project.deadline && (
                                <span>마감일: {new Date(project.deadline).toLocaleDateString()}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <p className="text-sm font-medium text-gray-900">
                                배너 {projectBanners.length}개
                              </p>
                              <p className="text-xs text-gray-500">
                                완료 {projectBanners.filter(b => b.status === 'completed').length}개
                              </p>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => toggleProjectExpansion(project.id)}
                                className="text-gray-400 hover:text-blue-500"
                                title="배너 목록 보기"
                              >
                                <svg 
                                  className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                                  fill="none" 
                                  stroke="currentColor" 
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>
                              <button
                                onClick={() => onBannerCreate(project.id)}
                                className="text-blue-500 hover:text-blue-700"
                                title="새 배너 추가"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                              </button>
                              <button
                                onClick={() => {
                                  setEditingProject(project);
                                  setShowProjectForm(true);
                                }}
                                className="text-gray-400 hover:text-blue-500"
                                title="프로젝트 수정"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleProjectDelete(project.id)}
                                className="text-gray-400 hover:text-red-500"
                                title="프로젝트 삭제"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                        
                        {/* 배너 목록 (확장 시) */}
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="mt-6 border-t border-gray-200 pt-6"
                          >
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="text-lg font-medium text-gray-900">배너 목록</h4>
                              <button
                                onClick={() => onBannerCreate(project.id)}
                                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                배너 생성
                              </button>
                            </div>

                            {projectBanners.length > 0 ? (
                              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                <div className="divide-y divide-gray-200">
                                  {projectBanners.map((banner) => (
                                    <motion.div
                                      key={banner.id}
                                      initial={{ opacity: 0, y: 10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      transition={{ duration: 0.2 }}
                                      className="p-4 hover:bg-gray-50 transition-colors"
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4 flex-1">
                                          {/* 배너 썸네일 */}
                                          <div className="w-20 h-12 bg-gray-100 rounded border flex-shrink-0 overflow-hidden">
                                            {(() => {
                                              // 우선순위: final_banner_url > background_image_url > image_url
                                              const imageUrl = banner.final_banner_url || banner.background_image_url || banner.image_url;
                                              return imageUrl ? (
                                                <img 
                                                  src={imageUrl} 
                                                  alt={banner.title}
                                                  className="w-full h-full object-cover"
                                                />
                                              ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2z" />
                                                  </svg>
                                                </div>
                                              );
                                            })()}
                                          </div>
                                          
                                          {/* 배너 정보 */}
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center space-x-2 mb-1">
                                              <h5 className="font-medium text-gray-900 truncate">
                                                {banner.title || '제목 없음'}
                                              </h5>
                                              <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(banner.status)}`}>
                                                {banner.status === 'draft' && '초안'}
                                                {banner.status === 'review' && '검토중'}
                                                {banner.status === 'approved' && '승인됨'}
                                                {banner.status === 'rejected' && '거부됨'}
                                                {banner.status === 'completed' && '완료'}
                                              </span>
                                            </div>
                                            
                                            {banner.description && (
                                              <p className="text-sm text-gray-600 truncate mb-2">{banner.description}</p>
                                            )}
                                            
                                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                                              <span>크기: {banner.canvas_width}×{banner.canvas_height}px</span>
                                              {banner.banner_type && (
                                                <span>타입: {banner.banner_type}</span>
                                              )}
                                              {banner.device_type && (
                                                <span>기기: {banner.device_type}</span>
                                              )}
                                              <span>생성: {new Date(banner.created_at).toLocaleDateString()}</span>
                                              {banner.updated_at && banner.updated_at !== banner.created_at && (
                                                <span>수정: {new Date(banner.updated_at).toLocaleDateString()}</span>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                        
                                        {/* 액션 버튼 */}
                                        <div className="flex items-center space-x-2 ml-4">
                                          <button
                                            onClick={() => {
                                              console.log('Editing banner:', banner);
                                              onBannerEdit(banner);
                                            }}
                                            className="bg-blue-500 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-600 transition-colors flex items-center gap-1.5"
                                          >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                            편집
                                          </button>
                                          <button
                                            onClick={() => handleBannerDelete(banner.id)}
                                            className="bg-red-500 text-white px-3 py-1.5 rounded text-sm hover:bg-red-600 transition-colors flex items-center gap-1.5"
                                          >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                            삭제
                                          </button>
                                        </div>
                                      </div>
                                    </motion.div>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <div className="text-center py-12 bg-gray-50 rounded-lg">
                                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <p className="text-lg font-medium text-gray-900 mb-2">아직 생성된 배너가 없습니다</p>
                                <p className="text-sm text-gray-600 mb-6">이 프로젝트의 첫 번째 배너를 만들어보세요.</p>
                                <button
                                  onClick={() => onBannerCreate(project.id)}
                                  className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors inline-flex items-center gap-2 font-medium"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                  </svg>
                                  첫 배너 생성하기
                                </button>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 팀 생성/수정 모달 */}
      {showTeamForm && (
        <TeamFormModal
          team={editingTeam}
          onSubmit={handleTeamSubmit}
          onClose={() => {
            setShowTeamForm(false);
            setEditingTeam(null);
          }}
        />
      )}

      {/* 프로젝트 생성/수정 모달 */}
      {showProjectForm && (
        <ProjectFormModal
          project={editingProject}
          teams={teams}
          onSubmit={handleProjectSubmit}
          onClose={() => {
            setShowProjectForm(false);
            setEditingProject(null);
          }}
        />
      )}
    </div>
  );
};

// 팀 폼 모달 컴포넌트
interface TeamFormModalProps {
  team: Team | null;
  onSubmit: (data: TeamFormData) => void;
  onClose: () => void;
}

const TeamFormModal: React.FC<TeamFormModalProps> = ({ team, onSubmit, onClose }) => {
  const [formData, setFormData] = useState<TeamFormData>({
    name: team?.name || '',
    description: team?.description || '',
    color: team?.color || '#3B82F6'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">
          {team ? '팀 수정' : '새 팀 추가'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              팀 이름
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              설명
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              팀 색상
            </label>
            <input
              type="color"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              className="w-full h-10 border border-gray-300 rounded-lg"
            />
          </div>
          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              {team ? '수정' : '추가'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors"
            >
              취소
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 프로젝트 폼 모달 컴포넌트
interface ProjectFormModalProps {
  project: Project | null;
  teams: Team[];
  onSubmit: (data: ProjectFormData) => void;
  onClose: () => void;
}

const ProjectFormModal: React.FC<ProjectFormModalProps> = ({ project, teams, onSubmit, onClose }) => {
  const [formData, setFormData] = useState<ProjectFormData>({
    name: project?.name || '',
    description: project?.description || '',
    team_id: project?.team_id || '',
    manager_name: project?.manager_name || '',
    manager_email: project?.manager_email || '',
    manager_phone: project?.manager_phone || '',
    status: project?.status || 'completed',
    priority: project?.priority || 'low',
    deadline: project?.deadline || undefined
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">
          {project ? '프로젝트 수정' : '새 프로젝트 추가'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                프로젝트 이름
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                설명
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                소속 팀
              </label>
              <select
                value={formData.team_id}
                onChange={(e) => setFormData({ ...formData, team_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">팀 선택 안함</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                담당자명
              </label>
              <input
                type="text"
                value={formData.manager_name}
                onChange={(e) => setFormData({ ...formData, manager_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                담당자 이메일
              </label>
              <input
                type="email"
                value={formData.manager_email}
                onChange={(e) => setFormData({ ...formData, manager_email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                담당자 전화번호
              </label>
              <input
                type="tel"
                value={formData.manager_phone}
                onChange={(e) => setFormData({ ...formData, manager_phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                상태
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as ProjectStatus })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="completed">완료</option>
                <option value="on_hold">보류</option>
                <option value="cancelled">취소</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                우선순위
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as ProjectPriority })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">낮음</option>
                <option value="high">높음</option>
                <option value="urgent">긴급</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                마감일
              </label>
              <input
                type="date"
                value={formData.deadline ? new Date(formData.deadline).toISOString().split('T')[0] : ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  deadline: e.target.value ? new Date(e.target.value) : undefined 
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              {project ? '수정' : '추가'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors"
            >
              취소
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 