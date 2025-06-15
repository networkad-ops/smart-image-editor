export type FormatType = 'instagram-post' | 'instagram-story' | 'facebook-post' | 'youtube-thumbnail' | 'web-banner';

export interface Format {
  id: FormatType;
  name: string;
  width: number;
  height: number;
  ratio: string;
}

export interface CropData {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TextStyle {
  maxLength: number;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  letterSpacing: number;
  lineHeight: number;
  x: number;
  y: number;
}

export interface LogoConfig {
  width: number;
  height: number;
  x: number;
  y: number;
}

export interface TextConfig {
  title: string;
  subtitle: string;
}

export interface Work {
  id: string;
  title: string;
  format: FormatType;
  originalImage: {
    url: string;
    filename: string;
    size: number;
  };
  cropData: CropData;
  textConfig: TextConfig;
  executions: Execution[];
  createdAt: string;
  updatedAt: string;
}

export interface Execution {
  id: string;
  workId: string;
  textConfig: TextConfig;
  outputUrl: string;
  createdAt: string;
}

export const FORMATS: Record<FormatType, Format> = {
  'instagram-post': {
    id: 'instagram-post',
    name: 'Instagram Post',
    width: 1080,
    height: 1080,
    ratio: '1:1'
  },
  'instagram-story': {
    id: 'instagram-story',
    name: 'Instagram Story',
    width: 1080,
    height: 1920,
    ratio: '9:16'
  },
  'facebook-post': {
    id: 'facebook-post',
    name: 'Facebook Post',
    width: 1200,
    height: 630,
    ratio: '1.91:1'
  },
  'youtube-thumbnail': {
    id: 'youtube-thumbnail',
    name: 'YouTube Thumbnail',
    width: 1280,
    height: 720,
    ratio: '16:9'
  },
  'web-banner': {
    id: 'web-banner',
    name: 'Web Banner',
    width: 728,
    height: 90,
    ratio: '8.09:1'
  }
};

export type DeviceType = 'PC' | 'MO';

export interface DeviceConfig {
  width: number;
  height: number;
  aspectRatio: number;
  maxFileSize: number;
  logo: LogoConfig;
  text: {
    title: TextStyle;
    subtitle: TextStyle;
  };
}

export const DEVICE_CONFIGS: Record<DeviceType, DeviceConfig> = {
  PC: {
    width: 2880,
    height: 480,
    aspectRatio: 6,
    maxFileSize: 10 * 1024 * 1024,
    logo: {
      width: 266,
      height: 56,
      x: 110,
      y: 90
    },
    text: {
      subtitle: {
        x: 81,
        y: 86,
        maxLength: 20,
        fontSize: 60,
        fontFamily: 'Pretendard',
        fontWeight: 500,
        letterSpacing: -2,
        lineHeight: 124
      },
      title: {
        x: 81,
        y: 187,
        maxLength: 36,
        fontSize: 80,
        fontFamily: 'Pretendard',
        fontWeight: 700,
        letterSpacing: -2,
        lineHeight: 124
      }
    }
  },
  MO: {
    width: 1560,
    height: 468,
    aspectRatio: 3.33,
    maxFileSize: 5 * 1024 * 1024,
    logo: {
      width: 266,
      height: 56,
      x: 81,
      y: 98
    },
    text: {
      subtitle: {
        x: 81,
        y: 86,
        maxLength: 20,
        fontSize: 60,
        fontFamily: 'Pretendard',
        fontWeight: 500,
        letterSpacing: -2,
        lineHeight: 124
      },
      title: {
        x: 81,
        y: 187,
        maxLength: 24,
        fontSize: 80,
        fontFamily: 'Pretendard',
        fontWeight: 700,
        letterSpacing: -2,
        lineHeight: 124
      }
    }
  }
};

export interface ImageConfig {
  url: string;
  width: number;
  height: number;
  x: number;
  y: number;
}

export interface Work {
  id: string;
  deviceType: DeviceType;
  textConfig: TextConfig;
  backgroundImage: ImageConfig;
  logoImage?: ImageConfig;
  createdAt: string;
  updatedAt: string;
} 