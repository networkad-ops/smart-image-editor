// 배너 관련 타입
export type BannerType =
  | 'basic-no-logo'
  | 'basic-with-logo'
  | 'splash'
  | 'main-popup'
  | 'interactive'
  | 'fullscreen';

export type DeviceType = 'pc' | 'mobile';

// 배너 설정 타입
export interface BannerConfig {
  name: string;
  width: number;
  height: number;
  maxFileSize?: number;
  fixedText?: boolean;
  allowCustomText?: boolean;
  mainTitle?: TextConfig;
  subTitle?: TextConfig;
  logo?: LogoConfig;
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
  width: number;
  height: number;
  maxFileSize?: number;
}

// 텍스트 요소 타입
export interface TextElement {
  id: string;
  type: 'fixed' | 'custom';
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontFamily: string;
  fontWeight: number;
  color: string;
  editable: {
    position: boolean;
    size: boolean;
    color: boolean;
  };
}

// 배너 작업 타입
export interface BannerWork {
  id: string;
  title: string;
  bannerType: BannerType;
  deviceType: DeviceType;
  originalImage: File;
  logoFile?: File;
  finalImage: Blob;
  editedImageUrl: string;
  textElements: TextElement[];
  createdAt: Date;
}

// 프로젝트 타입
export interface Project {
  id: string;
  name: string;
  banners: BannerWork[];
  createdAt: Date;
  updatedAt: Date;
}

// 배너 선택 타입
export interface BannerSelection {
  bannerType: BannerType;
  deviceType: DeviceType;
  config: BannerConfig;
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
