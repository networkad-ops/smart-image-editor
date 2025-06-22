import { useState, useEffect } from 'react';
import { Team, Project, Banner, TeamFormData, ProjectFormData } from '../types';
import { 
  mockTeamService, 
  mockProjectService, 
  mockBannerService, 
  mockStorageService,
  mockDashboardService 
} from '../services/mockService';

export const useSupabase = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 초기 데이터 로드
  const initializeData = async () => {
    try {
      setLoading(true);
      const [teamsData, projectsData, bannersData] = await Promise.all([
        mockTeamService.getTeams(),
        mockProjectService.getProjects(),
        mockBannerService.getBanners()
      ]);
      
      setTeams(teamsData);
      setProjects(projectsData);
      setBanners(bannersData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '데이터 로드 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initializeData();
  }, []);

  // Team 관련 함수들
  const fetchTeams = async () => {
    try {
      setLoading(true);
      const data = await mockTeamService.getTeams();
      setTeams(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '팀 목록을 가져오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const createTeam = async (teamData: TeamFormData): Promise<Team> => {
    try {
      setLoading(true);
      const newTeam = await mockTeamService.createTeam(teamData);
      setTeams(prev => [...prev, newTeam]);
      setError(null);
      return newTeam;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '팀 생성 중 오류가 발생했습니다.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const updateTeam = async (id: string, teamData: Partial<TeamFormData>): Promise<Team> => {
    try {
      setLoading(true);
      const updatedTeam = await mockTeamService.updateTeam(id, teamData);
      setTeams(prev => prev.map(team => team.id === id ? updatedTeam : team));
      setError(null);
      return updatedTeam;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '팀 수정 중 오류가 발생했습니다.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const deleteTeam = async (id: string): Promise<void> => {
    try {
      setLoading(true);
      await mockTeamService.deleteTeam(id);
      setTeams(prev => prev.filter(team => team.id !== id));
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '팀 삭제 중 오류가 발생했습니다.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Project 관련 함수들
  const fetchProjects = async () => {
    try {
      setLoading(true);
      const data = await mockProjectService.getProjects();
      setProjects(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '프로젝트 목록을 가져오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const createProject = async (projectData: ProjectFormData): Promise<Project> => {
    try {
      setLoading(true);
      const newProject = await mockProjectService.createProject(projectData);
      setProjects(prev => [...prev, newProject]);
      setError(null);
      return newProject;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '프로젝트 생성 중 오류가 발생했습니다.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const updateProject = async (id: string, projectData: Partial<ProjectFormData>): Promise<Project> => {
    try {
      setLoading(true);
      const updatedProject = await mockProjectService.updateProject(id, projectData);
      setProjects(prev => prev.map(project => project.id === id ? updatedProject : project));
      setError(null);
      return updatedProject;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '프로젝트 수정 중 오류가 발생했습니다.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const deleteProject = async (id: string): Promise<void> => {
    try {
      setLoading(true);
      await mockProjectService.deleteProject(id);
      setProjects(prev => prev.filter(project => project.id !== id));
      setBanners(prev => prev.filter(banner => banner.project_id !== id));
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '프로젝트 삭제 중 오류가 발생했습니다.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Banner 관련 함수들
  const fetchBanners = async () => {
    try {
      setLoading(true);
      const data = await mockBannerService.getBanners();
      setBanners(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '배너 목록을 가져오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const createBanner = async (bannerData: any): Promise<Banner> => {
    try {
      setLoading(true);
      const newBanner = await mockBannerService.createBanner(bannerData);
      setBanners(prev => [...prev, newBanner]);
      const updatedProjects = await mockProjectService.getProjects();
      setProjects(updatedProjects);
      setError(null);
      return newBanner;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '배너 생성 중 오류가 발생했습니다.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const updateBanner = async (id: string, bannerData: Partial<Banner>): Promise<Banner> => {
    try {
      setLoading(true);
      const updatedBanner = await mockBannerService.updateBanner(id, bannerData);
      setBanners(prev => prev.map(banner => banner.id === id ? updatedBanner : banner));
      setError(null);
      return updatedBanner;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '배너 수정 중 오류가 발생했습니다.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const deleteBanner = async (id: string): Promise<void> => {
    try {
      setLoading(true);
      await mockBannerService.deleteBanner(id);
      setBanners(prev => prev.filter(banner => banner.id !== id));
      const updatedProjects = await mockProjectService.getProjects();
      setProjects(updatedProjects);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '배너 삭제 중 오류가 발생했습니다.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const uploadBannerImage = async (file: File): Promise<string> => {
    try {
      setLoading(true);
      const imageUrl = await mockStorageService.uploadBannerImage(file);
      setError(null);
      return imageUrl;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '이미지 업로드 중 오류가 발생했습니다.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const uploadLogo = async (file: File): Promise<string> => {
    try {
      setLoading(true);
      const logoUrl = await mockStorageService.uploadLogo(file);
      setError(null);
      return logoUrl;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '로고 업로드 중 오류가 발생했습니다.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getDashboardStats = async () => {
    try {
      setLoading(true);
      const stats = await mockDashboardService.getDashboardStats();
      setError(null);
      return stats;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '통계 데이터 로드 중 오류가 발생했습니다.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getRecentActivity = async () => {
    try {
      setLoading(true);
      const activity = await mockDashboardService.getRecentActivity();
      setError(null);
      return activity;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '최근 활동 데이터 로드 중 오류가 발생했습니다.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    teams,
    projects,
    banners,
    loading,
    error,
    initializeData,
    fetchTeams,
    createTeam,
    updateTeam,
    deleteTeam,
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
    fetchBanners,
    createBanner,
    updateBanner,
    deleteBanner,
    uploadBannerImage,
    uploadLogo,
    getDashboardStats,
    getRecentActivity
  };
};
