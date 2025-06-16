export type BannerType = 'basic-no-logo' | 'splash' | 'main-popup';
export type DeviceType = 'pc' | 'mobile';

export interface BannerConfig {
  name: string;
  width: number;
  height: number;
  maxFileSize?: number;
  fixedText?: boolean;
  allowCustomText?: boolean;
  mainTitle?: {
    x: number;
    y: number;
    width: number;
    height: number;
    fontSize: number;
    fontFamily: string;
    fontWeight: number;
    letterSpacing?: number;
    maxLength?: number;
    maxLines?: number;
  };
  subTitle?: {
    x: number;
    y: number;
    width: number;
    height: number;
    fontSize: number;
    fontFamily: string;
    fontWeight: number;
    letterSpacing?: number;
    maxLength?: number;
    maxLines?: number;
  };
}

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

export interface BannerWork {
  id: string;
  title: string;
  bannerType: BannerType;
  deviceType: DeviceType;
  originalImage: File;
  finalImage: Blob;
  editedImageUrl: string;
  textElements: TextElement[];
  createdAt: Date;
}

export interface Project {
  id: string;
  name: string;
  banners: BannerWork[];
}

export interface BannerSelection {
  bannerType: BannerType;
  deviceType: DeviceType;
  config: BannerConfig;
}

export interface DeviceConfig {
  width: number;
  height: number;
  maxFileSize?: number;
  aspectRatio?: number;
} 