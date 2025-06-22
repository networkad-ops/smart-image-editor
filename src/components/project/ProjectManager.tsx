import React, { useState, useEffect } from 'react';
import { Project } from '../../types';

interface ProjectManagerProps {
  onProjectSelect: (project: Project) => void;
  onProjectCreate: (projectName: string) => void;
  currentProject: Project | null;
}

export const ProjectManager: React.FC<ProjectManagerProps> = ({
  onProjectSelect,
  onProjectCreate,
  currentProject
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [newProjectName, setNewProjectName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  // 로컬 스토리지에서 프로젝트 목록 불러오기
  useEffect(() => {
    const savedProjects = localStorage.getItem('banner-projects');
    if (savedProjects) {
      const parsedProjects = JSON.parse(savedProjects);
      // Date 문자열을 Date 객체로 변환
      const projectsWithDates = parsedProjects.map((project: any) => ({
        ...project,
        createdAt: new Date(project.createdAt),
        updatedAt: new Date(project.updatedAt)
      }));
      setProjects(projectsWithDates);
    }
  }, []);

  // 프로젝트 생성
  const handleCreateProject = () => {
    if (!newProjectName.trim()) return;

    const newProject: Project = {
      id: Date.now().toString(),
      name: newProjectName,
      banners: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const updatedProjects = [...projects, newProject];
    setProjects(updatedProjects);
    localStorage.setItem('banner-projects', JSON.stringify(updatedProjects));
    
    onProjectCreate(newProjectName);
    setNewProjectName('');
    setShowCreateForm(false);
  };

  // 프로젝트 선택
  const handleProjectSelect = (project: Project) => {
    onProjectSelect(project);
  };

  // 프로젝트 삭제
  const handleDeleteProject = (projectId: string) => {
    const updatedProjects = projects.filter(p => p.id !== projectId);
    setProjects(updatedProjects);
    localStorage.setItem('banner-projects', JSON.stringify(updatedProjects));
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">프로젝트 관리</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          새 프로젝트
        </button>
      </div>

      {/* 새 프로젝트 생성 폼 */}
      {showCreateForm && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">새 프로젝트 생성</h3>
          <div className="flex gap-3">
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="프로젝트 이름을 입력하세요"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleCreateProject}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              생성
            </button>
            <button
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* 프로젝트 목록 */}
      <div className="space-y-3">
        {projects.length === 0 ? (
          <p className="text-gray-500 text-center py-8">생성된 프로젝트가 없습니다.</p>
        ) : (
          projects.map((project) => (
            <div
              key={project.id}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                currentProject?.id === project.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleProjectSelect(project)}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-gray-800">{project.name}</h3>
                  <p className="text-sm text-gray-500">
                    배너 {project.banners.length}개 • 
                    생성일: {project.createdAt.toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteProject(project.id);
                  }}
                  className="px-2 py-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                >
                  삭제
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}; 