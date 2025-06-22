import { Team, Project, Banner, TeamFormData, ProjectFormData } from '../types';

// LocalStorage 키
const TEAMS_KEY = 'mock_teams';
const PROJECTS_KEY = 'mock_projects';
const BANNERS_KEY = 'mock_banners';

// Mock 데이터 생성 함수
const generateId = () => `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// LocalStorage 헬퍼 함수
const getFromStorage = <T>(key: string): T[] => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const saveToStorage = <T>(key: string, data: T[]) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// Mock Team Service
export const mockTeamService = {
  async getTeams(): Promise<Team[]> {
    return getFromStorage<Team>(TEAMS_KEY);
  },

  async createTeam(teamData: TeamFormData): Promise<Team> {
    const teams = getFromStorage<Team>(TEAMS_KEY);
    const newTeam: Team = {
      id: generateId(),
      ...teamData,
      user_id: 'temp-user-id',
      created_at: new Date(),
      updated_at: new Date()
    };
    teams.push(newTeam);
    saveToStorage(TEAMS_KEY, teams);
    return newTeam;
  },

  async updateTeam(id: string, teamData: Partial<TeamFormData>): Promise<Team> {
    const teams = getFromStorage<Team>(TEAMS_KEY);
    const index = teams.findIndex(team => team.id === id);
    if (index === -1) throw new Error('팀을 찾을 수 없습니다.');
    
    teams[index] = {
      ...teams[index],
      ...teamData,
      updated_at: new Date()
    };
    saveToStorage(TEAMS_KEY, teams);
    return teams[index];
  },

  async deleteTeam(id: string): Promise<void> {
    const teams = getFromStorage<Team>(TEAMS_KEY);
    const filteredTeams = teams.filter(team => team.id !== id);
    saveToStorage(TEAMS_KEY, filteredTeams);
  }
};

// Mock Project Service
export const mockProjectService = {
  async getProjects(): Promise<Project[]> {
    const projects = getFromStorage<Project>(PROJECTS_KEY);
    const teams = getFromStorage<Team>(TEAMS_KEY);
    const banners = getFromStorage<Banner>(BANNERS_KEY);
    
    return projects.map(project => {
      const team = teams.find(t => t.id === project.team_id);
      const projectBanners = banners.filter(b => b.project_id === project.id);
      
      return {
        ...project,
        team,
        total_banners: projectBanners.length,
        draft_banners: projectBanners.filter(b => b.status === 'draft').length,
        completed_banners: projectBanners.filter(b => b.status === 'completed').length,
        in_progress_banners: projectBanners.filter(b => b.status === 'in_progress').length
      };
    });
  },

  async getProject(id: string): Promise<Project> {
    const projects = getFromStorage<Project>(PROJECTS_KEY);
    const teams = getFromStorage<Team>(TEAMS_KEY);
    const project = projects.find(p => p.id === id);
    
    if (!project) throw new Error('프로젝트를 찾을 수 없습니다.');
    
    const team = teams.find(t => t.id === project.team_id);
    return { ...project, team };
  },

  async createProject(projectData: ProjectFormData): Promise<Project> {
    const projects = getFromStorage<Project>(PROJECTS_KEY);
    const teams = getFromStorage<Team>(TEAMS_KEY);
    
    const newProject: Project = {
      id: generateId(),
      ...projectData,
      user_id: 'temp-user-id',
      created_at: new Date(),
      updated_at: new Date(),
      total_banners: 0,
      draft_banners: 0,
      completed_banners: 0,
      in_progress_banners: 0
    };
    
    if (projectData.team_id) {
      const team = teams.find(t => t.id === projectData.team_id);
      if (team) {
        newProject.team = team;
      }
    }
    
    projects.push(newProject);
    saveToStorage(PROJECTS_KEY, projects);
    return newProject;
  },

  async updateProject(id: string, projectData: Partial<ProjectFormData>): Promise<Project> {
    const projects = getFromStorage<Project>(PROJECTS_KEY);
    const teams = getFromStorage<Team>(TEAMS_KEY);
    const index = projects.findIndex(project => project.id === id);
    
    if (index === -1) throw new Error('프로젝트를 찾을 수 없습니다.');
    
    projects[index] = {
      ...projects[index],
      ...projectData,
      updated_at: new Date()
    };
    
    if (projectData.team_id) {
      const team = teams.find(t => t.id === projectData.team_id);
      if (team) {
        projects[index].team = team;
      }
    }
    
    saveToStorage(PROJECTS_KEY, projects);
    return projects[index];
  },

  async deleteProject(id: string): Promise<void> {
    const projects = getFromStorage<Project>(PROJECTS_KEY);
    const filteredProjects = projects.filter(project => project.id !== id);
    saveToStorage(PROJECTS_KEY, filteredProjects);
  },

  async getProjectStats(id: string): Promise<any> {
    const banners = getFromStorage<Banner>(BANNERS_KEY);
    const projectBanners = banners.filter(b => b.project_id === id);
    
    return {
      total_banners: projectBanners.length,
      draft_banners: projectBanners.filter(b => b.status === 'draft').length,
      completed_banners: projectBanners.filter(b => b.status === 'completed').length,
      in_progress_banners: projectBanners.filter(b => b.status === 'in_progress').length
    };
  }
};

// Mock Banner Service
export const mockBannerService = {
  async getBanners(): Promise<Banner[]> {
    const banners = getFromStorage<Banner>(BANNERS_KEY);
    const projects = getFromStorage<Project>(PROJECTS_KEY);
    const teams = getFromStorage<Team>(TEAMS_KEY);
    
    return banners.map(banner => {
      const project = projects.find(p => p.id === banner.project_id);
      if (project && project.team_id) {
        const team = teams.find(t => t.id === project.team_id);
        if (team) {
          project.team = team;
        }
      }
      return { ...banner, project };
    });
  },

  async getBanner(id: string): Promise<Banner> {
    const banners = getFromStorage<Banner>(BANNERS_KEY);
    const banner = banners.find(b => b.id === id);
    if (!banner) throw new Error('배너를 찾을 수 없습니다.');
    return banner;
  },

  async createBanner(bannerData: any): Promise<Banner> {
    const banners = getFromStorage<Banner>(BANNERS_KEY);
    const projects = getFromStorage<Project>(PROJECTS_KEY);
    
    const newBanner: Banner = {
      id: generateId(),
      ...bannerData,
      version: 1,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    const project = projects.find(p => p.id === bannerData.project_id);
    if (project) {
      newBanner.project = project;
    }
    
    banners.push(newBanner);
    saveToStorage(BANNERS_KEY, banners);
    return newBanner;
  },

  async updateBanner(id: string, bannerData: Partial<Banner>): Promise<Banner> {
    const banners = getFromStorage<Banner>(BANNERS_KEY);
    const index = banners.findIndex(banner => banner.id === id);
    
    if (index === -1) throw new Error('배너를 찾을 수 없습니다.');
    
    banners[index] = {
      ...banners[index],
      ...bannerData,
      updated_at: new Date()
    };
    
    saveToStorage(BANNERS_KEY, banners);
    return banners[index];
  },

  async deleteBanner(id: string): Promise<void> {
    const banners = getFromStorage<Banner>(BANNERS_KEY);
    const filteredBanners = banners.filter(banner => banner.id !== id);
    saveToStorage(BANNERS_KEY, filteredBanners);
  },

  async updateBannerStatus(id: string, status: string): Promise<Banner> {
    return this.updateBanner(id, { status: status as any });
  }
};

// Mock Storage Service
export const mockStorageService = {
  async uploadBannerImage(file: File): Promise<string> {
    // 실제로는 파일을 업로드하지 않고 Mock URL 반환
    return `https://mock-storage.com/banners/${file.name}`;
  },

  async uploadLogo(file: File): Promise<string> {
    return `https://mock-storage.com/logos/${file.name}`;
  },

  async uploadThumbnail(file: File): Promise<string> {
    return `https://mock-storage.com/thumbnails/${file.name}`;
  },

  async deleteFile(): Promise<void> {
    // Mock 삭제 - 실제로는 아무것도 하지 않음
  }
};

// Mock Dashboard Service
export const mockDashboardService = {
  async getDashboardStats() {
    const teams = getFromStorage<Team>(TEAMS_KEY);
    const projects = getFromStorage<Project>(PROJECTS_KEY);
    const banners = getFromStorage<Banner>(BANNERS_KEY);
    
    return {
      totalTeams: teams.length,
      totalProjects: projects.length,
      totalBanners: banners.length,
      completedBanners: banners.filter(b => b.status === 'completed').length,
      inProgressBanners: banners.filter(b => b.status === 'in_progress').length,
      draftBanners: banners.filter(b => b.status === 'draft').length
    };
  },

  async getRecentActivity() {
    const projects = getFromStorage<Project>(PROJECTS_KEY);
    const banners = getFromStorage<Banner>(BANNERS_KEY);
    
    return {
      recentProjects: projects.slice(0, 5),
      recentBanners: banners.slice(0, 5)
    };
  }
}; 