import { useState, useEffect } from 'react';
import { Team, Project, Banner, TeamFormData, ProjectFormData } from '../types';
import { isMockMode } from '../lib/supabase';
import { 
  mockTeamService, 
  mockProjectService, 
  mockBannerService, 
  mockStorageService,
  mockDashboardService 
} from '../services/mockService';
import {
  teamService,
  projectService,
  bannerService,
  storageService,
  dashboardService,
  getOrCreateDefaultProject
} from '../services/supabaseService';

export const useSupabase = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 서비스 선택 (Mock 모드 여부에 따라)
  const getTeamService = () => isMockMode ? mockTeamService : teamService;
  const getProjectService = () => isMockMode ? mockProjectService : projectService;
  const getBannerService = () => isMockMode ? mockBannerService : bannerService;
  const getStorageService = () => isMockMode ? mockStorageService : storageService;
  const getDashboardService = () => isMockMode ? mockDashboardService : dashboardService;

  console.log('🔧 useSupabase 훅 초기화:', { isMockMode });

  // 초기 데이터 로드
  const initializeData = async () => {
    try {
      setLoading(true);
      const [teamsData, projectsData, bannersData] = await Promise.all([
        getTeamService().getTeams(),
        getProjectService().getProjects(),
        getBannerService().getBanners()
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
      const data = await getTeamService().getTeams();
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
      const newTeam = await getTeamService().createTeam(teamData);
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
      const updatedTeam = await getTeamService().updateTeam(id, teamData);
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
      await getTeamService().deleteTeam(id);
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
      const data = await getProjectService().getProjects();
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
      const newProject = await getProjectService().createProject(projectData);
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
      const updatedProject = await getProjectService().updateProject(id, projectData);
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
      await getProjectService().deleteProject(id);
      setProjects(prev => prev.filter(project => project.id !== id));
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
      const data = await getBannerService().getBanners();
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
      const newBanner = await getBannerService().createBanner(bannerData);
      setBanners(prev => [...prev, newBanner]);
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
      const updatedBanner = await getBannerService().updateBanner(id, bannerData);
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
      await getBannerService().deleteBanner(id);
      setBanners(prev => prev.filter(banner => banner.id !== id));
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '배너 삭제 중 오류가 발생했습니다.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const uploadBannerImage = async (file: File, type?: string): Promise<string> => {
    try {
      setLoading(true);
      const imageUrl = await getStorageService().uploadBannerImage(file, type);
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
      const logoUrl = await getStorageService().uploadLogo(file);
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
      const stats = await getDashboardService().getDashboardStats();
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
      const activity = await getDashboardService().getRecentActivity();
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

  // getAllBanners 별칭 함수 추가
  const getAllBanners = async (): Promise<Banner[]> => {
    try {
      const data = await getBannerService().getBanners();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '배너 목록을 가져오는데 실패했습니다.';
      setError(errorMessage);
      throw new Error(errorMessage);
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
    getAllBanners,
    createBanner,
    updateBanner,
    deleteBanner,
    uploadBannerImage,
    uploadLogo,
    getDashboardStats,
    getRecentActivity,
    getOrCreateDefaultProject
  };
};
