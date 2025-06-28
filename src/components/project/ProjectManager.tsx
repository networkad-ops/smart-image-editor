import React, { useState, useEffect } from 'react';
import { 
  Team, 
  Project, 
  Banner, 
  ProjectFormData, 
  ProjectStatus,
  ProjectPriority,
  BannerStatus
} from '../../types';
import { useSupabase } from '../../hooks/useSupabase';

interface ProjectManagerProps {
  onBannerEdit: (banner: Banner) => void;
  onBannerCreate: (projectId: string) => void;
}

export const ProjectManager: React.FC<ProjectManagerProps> = ({
  onBannerEdit,
  onBannerCreate
}) => {
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [quickProjectName, setQuickProjectName] = useState('');
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  // Supabase hooks
  const { 
    teams, 
    projects, 
    banners,
    loading,
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

  // 검색 필터링된 프로젝트 목록
  const filteredProjects = projects.filter(project => 
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.manager_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.team?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 빠른 프로젝트 생성
  const handleQuickProjectCreate = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && quickProjectName.trim()) {
      try {
        await createProject({
          name: quickProjectName.trim(),
          description: '',
          team_id: '',
          manager_name: '',
          manager_email: '',
          manager_phone: '',
          status: 'completed',
          priority: 'low',
          deadline: undefined
        });
        setQuickProjectName('');
        fetchProjects();
      } catch (error) {
        console.error('Error creating project:', error);
        alert('프로젝트 생성에 실패했습니다: ' + (error instanceof Error ? error.message : '알 수 없는 오류'));
      }
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

  // 프로젝트 삭제
  const handleProjectDelete = async (projectId: string) => {
    if (window.confirm('이 프로젝트를 삭제하시겠습니까? 프로젝트에 속한 모든 배너도 함께 삭제됩니다.')) {
      try {
        await deleteProject(projectId);
        fetchProjects();
        fetchBanners();
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
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
            <div className="flex items-center space-x-4">
              {/* 검색 입력 */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="프로젝트 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-80 pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <button
                onClick={() => setShowProjectForm(true)}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors text-sm"
              >
                상세 추가
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* 빠른 프로젝트 추가 */}
          <div className="bg-white rounded-lg shadow-sm p-4 border-2 border-dashed border-gray-200 hover:border-blue-300 transition-colors">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <input
                type="text"
                placeholder="프로젝트 이름을 입력하고 Enter를 누르세요..."
                value={quickProjectName}
                onChange={(e) => setQuickProjectName(e.target.value)}
                onKeyDown={handleQuickProjectCreate}
                className="flex-1 border-0 focus:outline-none text-gray-900 placeholder-gray-500 bg-transparent"
              />
              <span className="text-xs text-gray-400">Enter</span>
            </div>
          </div>

          {/* 프로젝트 목록 */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  프로젝트 목록 {searchTerm && `(검색: "${searchTerm}")`}
                </h2>
                <span className="text-sm text-gray-500">
                  {filteredProjects.length}개 프로젝트
                </span>
              </div>
            </div>
            <div className="divide-y">
              {filteredProjects.map((project) => {
                const projectBanners = banners.filter(b => b.title.toLowerCase().includes(project.name.toLowerCase()));
                const isExpanded = expandedProjects.has(project.id);
                
                return (
                  <div key={project.id}>
                    <div className="p-6">
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
                              {project.status === 'completed' && '완료'}
                              {project.status === 'on_hold' && '보류'}
                              {project.status === 'cancelled' && '취소'}
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
                            <span>생성일: {new Date(project.created_at).toLocaleDateString()}</span>
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
                              className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition-colors"
                            >
                              배너 추가
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
                    </div>

                    {/* 배너 목록 확장 */}
                    {isExpanded && (
                      <div className="px-6 pb-6">
                        <div className="border-t pt-4">
                          <h4 className="text-sm font-medium text-gray-900 mb-3">배너 목록</h4>
                          {projectBanners.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {projectBanners.map((banner) => (
                                <div key={banner.id} className="bg-gray-50 rounded-lg p-4">
                                  <div className="flex items-center justify-between mb-2">
                                    <h5 className="font-medium text-gray-900 truncate">{banner.title}</h5>
                                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(banner.status)}`}>
                                      {banner.status === 'draft' && '초안'}
                                      {banner.status === 'in_progress' && '진행중'}
                                      {banner.status === 'review' && '검토중'}
                                      {banner.status === 'approved' && '승인'}
                                      {banner.status === 'completed' && '완료'}
                                      {banner.status === 'rejected' && '반려'}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-500 mb-3">
                                    생성일: {new Date(banner.created_at).toLocaleDateString()}
                                  </p>
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => onBannerEdit(banner)}
                                      className="flex-1 bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600 transition-colors"
                                    >
                                      편집
                                    </button>
                                    <button
                                      onClick={() => handleBannerDelete(banner.id)}
                                      className="text-gray-400 hover:text-red-500"
                                      title="배너 삭제"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8 text-gray-500">
                              <p>아직 배너가 없습니다.</p>
                              <button
                                onClick={() => onBannerCreate(project.id)}
                                className="text-blue-500 hover:text-blue-700 text-sm mt-2"
                              >
                                첫 배너 만들기 →
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {filteredProjects.length === 0 && (
                <div className="p-6 text-center text-gray-500">
                  <p>
                    {searchTerm ? `"${searchTerm}"에 대한 검색 결과가 없습니다.` : '아직 프로젝트가 없습니다.'}
                  </p>
                  {!searchTerm && (
                    <p className="text-sm mt-2">위의 입력 필드에서 프로젝트를 빠르게 추가하거나 상세 추가 버튼을 사용하세요.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

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

  const [deadlineString, setDeadlineString] = useState<string>(
    project?.deadline 
      ? (project.deadline instanceof Date 
          ? project.deadline.toISOString().split('T')[0] 
          : new Date(project.deadline).toISOString().split('T')[0])
      : ''
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      deadline: deadlineString ? new Date(deadlineString) : undefined
    };
    onSubmit(submitData);
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
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                마감일
              </label>
              <input
                type="date"
                value={deadlineString}
                onChange={(e) => setDeadlineString(e.target.value)}
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