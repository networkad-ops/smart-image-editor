import { useState, useEffect } from 'react'
import {
  Team,
  Project,
  Banner,
  BannerHistory,
  BannerComment,
  TeamFormData,
  ProjectFormData,
  BannerFormData,
  FilterOptions,
  ProjectStats
} from '../types'
import {
  teamService,
  projectService,
  bannerService,
  bannerHistoryService,
  bannerCommentService,
  storageService,
  dashboardService
} from '../services/supabaseService'

export const useSupabase = () => {
  // 상태 관리
  const [teams, setTeams] = useState<Team[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ===== 팀 관리 =====
  
  const fetchTeams = async () => {
    try {
      setLoading(true)
      const data = await teamService.getTeams()
      setTeams(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : '팀 목록을 가져오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const createTeam = async (teamData: TeamFormData): Promise<Team> => {
    try {
      setLoading(true)
      const newTeam = await teamService.createTeam(teamData)
      setTeams(prev => [newTeam, ...prev])
      setError(null)
      return newTeam
    } catch (err) {
      const message = err instanceof Error ? err.message : '팀 생성에 실패했습니다.'
      setError(message)
      throw new Error(message)
    } finally {
      setLoading(false)
    }
  }

  const updateTeam = async (id: string, teamData: Partial<TeamFormData>): Promise<Team> => {
    try {
      setLoading(true)
      const updatedTeam = await teamService.updateTeam(id, teamData)
      setTeams(prev => prev.map(team => team.id === id ? updatedTeam : team))
      setError(null)
      return updatedTeam
    } catch (err) {
      const message = err instanceof Error ? err.message : '팀 수정에 실패했습니다.'
      setError(message)
      throw new Error(message)
    } finally {
      setLoading(false)
    }
  }

  const deleteTeam = async (id: string): Promise<void> => {
    try {
      setLoading(true)
      await teamService.deleteTeam(id)
      setTeams(prev => prev.filter(team => team.id !== id))
      // 해당 팀의 프로젝트들도 제거
      setProjects(prev => prev.filter(project => project.team_id !== id))
      setError(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : '팀 삭제에 실패했습니다.'
      setError(message)
      throw new Error(message)
    } finally {
      setLoading(false)
    }
  }

  // ===== 프로젝트 관리 =====

  const fetchProjects = async () => {
    try {
      setLoading(true)
      const data = await projectService.getProjects()
      setProjects(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : '프로젝트 목록을 가져오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const getProject = async (id: string): Promise<Project> => {
    try {
      setLoading(true)
      const project = await projectService.getProject(id)
      setError(null)
      return project
    } catch (err) {
      const message = err instanceof Error ? err.message : '프로젝트를 가져오는데 실패했습니다.'
      setError(message)
      throw new Error(message)
    } finally {
      setLoading(false)
    }
  }

  const createProject = async (projectData: ProjectFormData): Promise<Project> => {
    try {
      setLoading(true)
      const newProject = await projectService.createProject(projectData)
      setProjects(prev => [newProject, ...prev])
      setError(null)
      return newProject
    } catch (err) {
      const message = err instanceof Error ? err.message : '프로젝트 생성에 실패했습니다.'
      setError(message)
      throw new Error(message)
    } finally {
      setLoading(false)
    }
  }

  const updateProject = async (id: string, projectData: Partial<ProjectFormData>): Promise<Project> => {
    try {
      setLoading(true)
      const updatedProject = await projectService.updateProject(id, projectData)
      setProjects(prev => prev.map(project => project.id === id ? updatedProject : project))
      setError(null)
      return updatedProject
    } catch (err) {
      const message = err instanceof Error ? err.message : '프로젝트 수정에 실패했습니다.'
      setError(message)
      throw new Error(message)
    } finally {
      setLoading(false)
    }
  }

  const deleteProject = async (id: string): Promise<void> => {
    try {
      setLoading(true)
      await projectService.deleteProject(id)
      setProjects(prev => prev.filter(project => project.id !== id))
      // 해당 프로젝트의 배너들도 제거
      setBanners(prev => prev.filter(banner => banner.project_id !== id))
      setError(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : '프로젝트 삭제에 실패했습니다.'
      setError(message)
      throw new Error(message)
    } finally {
      setLoading(false)
    }
  }

  const getProjectStats = async (id: string): Promise<ProjectStats> => {
    try {
      const stats = await projectService.getProjectStats(id)
      return stats
    } catch (err) {
      const message = err instanceof Error ? err.message : '프로젝트 통계를 가져오는데 실패했습니다.'
      setError(message)
      throw new Error(message)
    }
  }

  // ===== 배너 관리 =====

  const fetchBanners = async (filters?: FilterOptions) => {
    try {
      setLoading(true)
      const data = await bannerService.getBanners(filters)
      setBanners(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : '배너 목록을 가져오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const getBanner = async (id: string): Promise<Banner> => {
    try {
      setLoading(true)
      const banner = await bannerService.getBanner(id)
      setError(null)
      return banner
    } catch (err) {
      const message = err instanceof Error ? err.message : '배너를 가져오는데 실패했습니다.'
      setError(message)
      throw new Error(message)
    } finally {
      setLoading(false)
    }
  }

  const createBanner = async (bannerData: BannerFormData & {
    project_id: string;
    image_url: string;
    logo_url?: string;
    text_elements: any[];
    canvas_width: number;
    canvas_height: number;
  }): Promise<Banner> => {
    try {
      setLoading(true)
      const newBanner = await bannerService.createBanner(bannerData)
      setBanners(prev => [newBanner, ...prev])
      setError(null)
      return newBanner
    } catch (err) {
      const message = err instanceof Error ? err.message : '배너 생성에 실패했습니다.'
      setError(message)
      throw new Error(message)
    } finally {
      setLoading(false)
    }
  }

  const updateBanner = async (id: string, bannerData: Partial<Banner>): Promise<Banner> => {
    try {
      setLoading(true)
      const updatedBanner = await bannerService.updateBanner(id, bannerData)
      setBanners(prev => prev.map(banner => banner.id === id ? updatedBanner : banner))
      setError(null)
      return updatedBanner
    } catch (err) {
      const message = err instanceof Error ? err.message : '배너 수정에 실패했습니다.'
      setError(message)
      throw new Error(message)
    } finally {
      setLoading(false)
    }
  }

  const deleteBanner = async (id: string): Promise<void> => {
    try {
      setLoading(true)
      await bannerService.deleteBanner(id)
      setBanners(prev => prev.filter(banner => banner.id !== id))
      setError(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : '배너 삭제에 실패했습니다.'
      setError(message)
      throw new Error(message)
    } finally {
      setLoading(false)
    }
  }

  const updateBannerStatus = async (id: string, status: string, approvedBy?: string): Promise<Banner> => {
    try {
      setLoading(true)
      const updatedBanner = await bannerService.updateBannerStatus(id, status, approvedBy)
      setBanners(prev => prev.map(banner => banner.id === id ? updatedBanner : banner))
      setError(null)
      return updatedBanner
    } catch (err) {
      const message = err instanceof Error ? err.message : '배너 상태 변경에 실패했습니다.'
      setError(message)
      throw new Error(message)
    } finally {
      setLoading(false)
    }
  }

  // ===== 배너 히스토리 관리 =====

  const getBannerHistory = async (bannerId: string): Promise<BannerHistory[]> => {
    try {
      const history = await bannerHistoryService.getBannerHistory(bannerId)
      return history
    } catch (err) {
      const message = err instanceof Error ? err.message : '배너 히스토리를 가져오는데 실패했습니다.'
      setError(message)
      throw new Error(message)
    }
  }

  const createBannerHistory = async (historyData: Omit<BannerHistory, 'id' | 'created_at'>): Promise<BannerHistory> => {
    try {
      const history = await bannerHistoryService.createBannerHistory(historyData)
      return history
    } catch (err) {
      const message = err instanceof Error ? err.message : '배너 히스토리 생성에 실패했습니다.'
      setError(message)
      throw new Error(message)
    }
  }

  // ===== 배너 댓글 관리 =====

  const getBannerComments = async (bannerId: string): Promise<BannerComment[]> => {
    try {
      const comments = await bannerCommentService.getBannerComments(bannerId)
      return comments
    } catch (err) {
      const message = err instanceof Error ? err.message : '댓글을 가져오는데 실패했습니다.'
      setError(message)
      throw new Error(message)
    }
  }

  const createComment = async (commentData: {
    banner_id: string;
    comment: string;
    x_position?: number;
    y_position?: number;
  }): Promise<BannerComment> => {
    try {
      const comment = await bannerCommentService.createComment(commentData)
      return comment
    } catch (err) {
      const message = err instanceof Error ? err.message : '댓글 생성에 실패했습니다.'
      setError(message)
      throw new Error(message)
    }
  }

  const updateComment = async (id: string, comment: string): Promise<BannerComment> => {
    try {
      const updatedComment = await bannerCommentService.updateComment(id, comment)
      return updatedComment
    } catch (err) {
      const message = err instanceof Error ? err.message : '댓글 수정에 실패했습니다.'
      setError(message)
      throw new Error(message)
    }
  }

  const deleteComment = async (id: string): Promise<void> => {
    try {
      await bannerCommentService.deleteComment(id)
    } catch (err) {
      const message = err instanceof Error ? err.message : '댓글 삭제에 실패했습니다.'
      setError(message)
      throw new Error(message)
    }
  }

  // ===== 파일 업로드 =====

  const uploadBannerImage = async (file: File, path?: string): Promise<string> => {
    try {
      setLoading(true)
      const url = await storageService.uploadBannerImage(file, path)
      setError(null)
      return url
    } catch (err) {
      const message = err instanceof Error ? err.message : '이미지 업로드에 실패했습니다.'
      setError(message)
      throw new Error(message)
    } finally {
      setLoading(false)
    }
  }

  const uploadLogo = async (file: File, path?: string): Promise<string> => {
    try {
      setLoading(true)
      const url = await storageService.uploadLogo(file, path)
      setError(null)
      return url
    } catch (err) {
      const message = err instanceof Error ? err.message : '로고 업로드에 실패했습니다.'
      setError(message)
      throw new Error(message)
    } finally {
      setLoading(false)
    }
  }

  const uploadThumbnail = async (file: File, path?: string): Promise<string> => {
    try {
      setLoading(true)
      const url = await storageService.uploadThumbnail(file, path)
      setError(null)
      return url
    } catch (err) {
      const message = err instanceof Error ? err.message : '썸네일 업로드에 실패했습니다.'
      setError(message)
      throw new Error(message)
    } finally {
      setLoading(false)
    }
  }

  const deleteFile = async (bucket: string, path: string): Promise<void> => {
    try {
      await storageService.deleteFile(bucket, path)
      setError(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : '파일 삭제에 실패했습니다.'
      setError(message)
      throw new Error(message)
    }
  }

  // ===== 대시보드 통계 =====

  const getDashboardStats = async () => {
    try {
      const stats = await dashboardService.getDashboardStats()
      return stats
    } catch (err) {
      const message = err instanceof Error ? err.message : '통계를 가져오는데 실패했습니다.'
      setError(message)
      throw new Error(message)
    }
  }

  const getRecentActivity = async () => {
    try {
      const activity = await dashboardService.getRecentActivity()
      return activity
    } catch (err) {
      const message = err instanceof Error ? err.message : '최근 활동을 가져오는데 실패했습니다.'
      setError(message)
      throw new Error(message)
    }
  }

  // ===== 초기 데이터 로드 =====

  const initializeData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        fetchTeams(),
        fetchProjects(),
        fetchBanners()
      ])
    } catch (err) {
      setError(err instanceof Error ? err.message : '데이터 초기화에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 오류 초기화
  const clearError = () => {
    setError(null)
  }

  return {
    // 상태
    teams,
    projects,
    banners,
    loading,
    error,
    
    // 팀 관리
    fetchTeams,
    createTeam,
    updateTeam,
    deleteTeam,
    
    // 프로젝트 관리
    fetchProjects,
    getProject,
    createProject,
    updateProject,
    deleteProject,
    getProjectStats,
    
    // 배너 관리
    fetchBanners,
    getBanner,
    createBanner,
    updateBanner,
    deleteBanner,
    updateBannerStatus,
    
    // 배너 히스토리
    getBannerHistory,
    createBannerHistory,
    
    // 배너 댓글
    getBannerComments,
    createComment,
    updateComment,
    deleteComment,
    
    // 파일 업로드
    uploadBannerImage,
    uploadLogo,
    uploadThumbnail,
    deleteFile,
    
    // 대시보드
    getDashboardStats,
    getRecentActivity,
    
    // 유틸리티
    initializeData,
    clearError
  }
} 