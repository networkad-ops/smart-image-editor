// 배너 관련 타입
export type BannerType =
  | 'basic-no-logo'
  | 'basic-with-logo'
  | 'interactive'
  | 'fullscreen';

export type DeviceType = 'pc' | 'mobile';

// 배너 설정 타입
export interface BannerConfig {
  name: string;
  dbType: Banner['banner_type'];
  width: number;
  height: number;
  maxFileSize: number;
  fixedText?: boolean;
  allowCustomText?: boolean;
  mainTitle?: TextConfig;
  subTitle?: TextConfig;
  bottomSubTitle?: TextConfig; // 하단 서브타이틀 추가
  logo?: LogoConfig;
  multiLogo?: MultiLogoConfig; // 다중 로고 설정 (항공팀용)
  buttonText?: TextConfig;
}

// 텍스트 설정 타입
export interface TextConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  lineHeight?: number;
  fontFamily: string;
  fontWeight: number;
  letterSpacing?: number;
  maxLength?: number;
  maxLines?: number;
}

// 로고 설정 타입
export interface LogoConfig {
  x: number;
  y: number;
  width?: number; // width is now optional
  height: number;
  maxFileSize?: number;
}

// 다중 로고 설정 타입 (항공팀용)
export interface MultiLogoConfig {
  x: number;
  y: number;
  width?: number; // 전체 로고 영역의 최대 너비 (선택사항)
  height: number;
  maxHeight: number; // 개별 로고 최대 높이
  logoGap: number; // 로고 간 간격 (구분자 포함)
  separatorWidth: number; // 구분자 너비
  maxLogos: number; // 최대 로고 개수
  maxFileSize?: number;
}

// 색상 세그먼트 타입 (부분 색상 변경용)
export interface ColorSegment {
  start: number;
  end: number;
  color: string;
}

// 텍스트 요소 타입
export interface TextElement {
  id: string;
  type: 'fixed' | 'free';
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontFamily: string;
  fontWeight?: number;
  letterSpacing?: number;
  color: string;
  backgroundColor?: string; // 버튼 배경색 (button-text일 때만 사용)
  colorSegments?: ColorSegment[];
  editable?: {
    position?: boolean;
    size?: boolean;
    color?: boolean;
  };
  gradient?: {
    from: string;
    to: string;
  };
}

// 팀 타입 (담당사업팀)
export interface Team {
  id: string;
  name: string;
  description?: string;
  color: string; // hex 색상
  user_id: string;
  created_at: Date;
  updated_at: Date;
}

// 프로젝트 상태 타입
export type ProjectStatus = 'active' | 'completed' | 'on_hold' | 'cancelled';
export type ProjectPriority = 'low' | 'medium' | 'high' | 'urgent';

// 프로젝트 타입 (개선된 버전)
export interface Project {
  id: string;
  name: string;
  description?: string;
  team_id?: string;
  manager_name?: string;
  manager_email?: string;
  manager_phone?: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  deadline?: Date;
  user_id: string;
  created_at: Date;
  updated_at: Date;
  // 관계 데이터
  team?: Team;
  banners?: Banner[];
  // 통계 데이터
  total_banners?: number;
  draft_banners?: number;
  completed_banners?: number;
  in_progress_banners?: number;
}

// 배너 상태 타입
export type BannerStatus = 'draft' | 'in_progress' | 'review' | 'approved' | 'rejected' | 'completed';

// 배너 타입 (개선된 버전)
export interface Banner {
  id: string;
  project_id?: string; // 프로젝트 ID 추가
  title: string; // 이제 "팀명/프로젝트명" 형태로 저장
  description?: string;
  banner_type: 'basic-no-logo' | 'basic-with-logo' | 'event' | 'interactive' | 'fullscreen' | 'airline';
  device_type: 'pc' | 'mobile';
  status: BannerStatus;
  // 새로운 URL 구조
  background_image_url: string;  // 배경 이미지
  logo_url?: string;             // 로고 이미지  
  logo_urls?: string[];          // 다중 로고 이미지 (항공팀용)
  final_banner_url?: string;     // 최종 완성된 배너
  thumbnail_url?: string;        // 썸네일
  // 기존 호환성을 위해 유지 (deprecated)
  image_url?: string;
  text_elements: TextElement[];
  canvas_width: number;
  canvas_height: number;
  version: number;
  tags?: string[];
  notes?: string;
  approved_by?: string;
  approved_at?: Date;
  created_at: Date;
  updated_at: Date;
  // 관계 데이터
  project?: Project;
  comments?: BannerComment[];
  history?: BannerHistory[];
  // 통계 데이터
  comment_count?: number;
}

// 배너 히스토리 타입
export interface BannerHistory {
  id: string;
  banner_id: string;
  version: number;
  title: string;
  // 새로운 URL 구조
  background_image_url: string;
  logo_url?: string;
  logo_urls?: string[]; // 다중 로고 이미지 (항공팀용)
  final_banner_url?: string;
  thumbnail_url?: string;
  // 기존 호환성을 위해 유지 (deprecated)
  image_url?: string;
  text_elements: TextElement[];
  notes?: string;
  created_at: Date;
}

// 배너 댓글 타입
export interface BannerComment {
  id: string;
  banner_id: string;
  user_id: string;
  comment: string;
  x_position?: number; // 댓글 위치 (캔버스 상의 좌표)
  y_position?: number; // 댓글 위치 (캔버스 상의 좌표)
  created_at: Date;
  updated_at: Date;
}

// 배너 선택 타입
export interface BannerSelection {
  bannerType: string;
  deviceType: 'pc' | 'mobile';
  config: BannerConfig;
}

// 배너 작업 타입 (기존 호환성 유지)
export interface BannerWork {
  id: string;
  title: string;
  bannerType: 'basic-no-logo' | 'basic-with-logo' | 'interactive' | 'fullscreen';
  deviceType: 'pc' | 'mobile';
  originalImageUrl: string;
  editedImageUrl: string;
  logoUrl?: string;
  textElements: TextElement[];
  createdAt: Date;
}

// 프로젝트 개요 뷰 타입
export interface ProjectOverview {
  id: string;
  name: string;
  description?: string;
  manager_name?: string;
  manager_email?: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  deadline?: Date;
  created_at: Date;
  updated_at: Date;
  team_name?: string;
  team_color?: string;
  total_banners: number;
  completed_banners: number;
  draft_banners: number;
  in_progress_banners: number;
}

// 배너 개요 뷰 타입
export interface BannerOverview {
  id: string;
  title: string;
  description?: string;
  banner_type: string;
  device_type: string;
  status: BannerStatus;
  version: number;
  tags?: string[];
  approved_by?: string;
  approved_at?: Date;
  created_at: Date;
  updated_at: Date;
  project_name: string;
  manager_name?: string;
  team_name?: string;
  team_color?: string;
  comment_count: number;
}

// 프로젝트 통계 타입
export interface ProjectStats {
  total_banners: number;
  draft_banners: number;
  completed_banners: number;
  in_progress_banners: number;
}

// 팀 생성/수정 폼 타입
export interface TeamFormData {
  name: string;
  description?: string;
  color: string;
}

// 프로젝트 생성/수정 폼 타입
export interface ProjectFormData {
  name: string;
  description?: string;
  team_id?: string;
  manager_name?: string;
  manager_email?: string;
  manager_phone?: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  deadline?: Date;
}

// 배너 생성/수정 폼 타입
export interface BannerFormData {
  title: string;
  description?: string;
  banner_type: 'basic-no-logo' | 'basic-with-logo' | 'interactive' | 'fullscreen';
  device_type: 'pc' | 'mobile';
  status: BannerStatus;
  tags?: string[];
  notes?: string;
}

// 필터 옵션 타입
export interface FilterOptions {
  team_id?: string;
  project_id?: string;
  project_status?: ProjectStatus;
  project_priority?: ProjectPriority;
  banner_status?: BannerStatus;
  banner_type?: string;
  device_type?: string;
  date_from?: Date;
  date_to?: Date;
  search_term?: string;
}

// 정렬 옵션 타입
export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

// 페이지네이션 타입
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

// 디바이스 설정 타입
export interface DeviceConfig {
  width: number;
  height: number;
  maxFileSize?: number;
  aspectRatio?: number;
  logo?: {
    width: number;
    height: number;
    x: number;
    y: number;
  };
  text?: {
    title: TextConfig;
    subtitle: TextConfig;
  };
}

// 이미지 편집 타입
export interface ImageEditState {
  crop: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  zoom: number;
  rotation: number;
}

// UI 상태 타입
export interface EditorState {
  currentProject: Project | null;
  currentBanner: BannerWork | null;
  selectedBannerType: BannerType | null;
  selectedDeviceType: DeviceType | null;
  imageEditState: ImageEditState;
  isEditing: boolean;
}
