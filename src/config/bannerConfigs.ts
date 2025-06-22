import { BannerConfig } from '../types';

export const bannerConfigs: Record<string, BannerConfig> = {
  'basic-no-logo-pc': {
    name: '기본 배너',
    width: 2880,
    height: 480,
    maxFileSize: 1.5 * 1024 * 1024,
    fixedText: true,
    allowCustomText: false,
    subTitle: {
      x: 110,
      y: 90,
      width: 2680,
      height: 60,
      fontSize: 54,
      lineHeight: 67,
      fontFamily: 'Pretendard',
      fontWeight: 500,
      maxLength: 20,
      maxLines: 1
    },
    mainTitle: {
      x: 110,
      y: 182,
      width: 2680,
      height: 100,
      fontSize: 84,
      lineHeight: 104,
      fontFamily: 'Pretendard',
      fontWeight: 700,
      maxLength: 36,
      maxLines: 1
    }
  },

  'basic-no-logo-mobile': {
    name: '기본 배너',
    width: 1560,
    height: 468,
    maxFileSize: 500 * 1024,
    fixedText: true,
    allowCustomText: false,
    subTitle: {
      x: 81,
      y: 86,
      width: 1460,
      height: 60,
      fontSize: 60,
      lineHeight: 74,
      fontFamily: 'Pretendard',
      fontWeight: 500,
      maxLength: 20,
      maxLines: 1
    },
    mainTitle: {
      x: 81,
      y: 187,
      width: 1460,
      height: 90,
      fontSize: 80,
      lineHeight: 99,
      fontFamily: 'Pretendard',
      fontWeight: 700,
      maxLength: 24,
      maxLines: 1
    }
  },

  'basic-with-logo-pc': {
    name: '로고 배너',
    width: 2880,
    height: 480,
    maxFileSize: 1.5 * 1024 * 1024,
    fixedText: true,
    allowCustomText: false,
    mainTitle: {
      x: 100,
      y: 182,
      width: 2680,
      height: 100,
      fontSize: 84,
      lineHeight: 104,
      fontFamily: 'Pretendard',
      fontWeight: 700,
      maxLength: 36,
      maxLines: 2
    },
    logo: {
      x: 110,
      y: 90,
      width: 266,
      height: 56,
      maxFileSize: 500 * 1024
    }
  },

  'basic-with-logo-mobile': {
    name: '로고 배너',
    width: 1560,
    height: 468,
    maxFileSize: 500 * 1024,
    fixedText: true,
    allowCustomText: false,
    mainTitle: {
      x: 81,
      y: 187,
      width: 1460,
      height: 90,
      fontSize: 80,
      lineHeight: 99,
      fontFamily: 'Pretendard',
      fontWeight: 700,
      maxLength: 24,
      maxLines: 2
    },
    logo: {
      x: 81,
      y: 96,
      width: 266,
      height: 56,
      maxFileSize: 300 * 1024
    }
  },

  'splash-mobile': {
    name: '스플래시',
    width: 390,
    height: 844,
    maxFileSize: 5 * 1024 * 1024,
    fixedText: false,
    allowCustomText: true
  },

  'event-pc': {
    name: '이벤트 배너',
    width: 2880,
    height: 480,
    maxFileSize: 2 * 1024 * 1024,
    fixedText: true,
    allowCustomText: false,
    subTitle: {
      x: 110,
      y: 90,
      width: 2680,
      height: 60,
      fontSize: 54,
      lineHeight: 67,
      fontFamily: 'Pretendard',
      fontWeight: 500,
      maxLength: 20,
      maxLines: 1
    },
    mainTitle: {
      x: 110,
      y: 182,
      width: 2680,
      height: 100,
      fontSize: 84,
      lineHeight: 104,
      fontFamily: 'Pretendard',
      fontWeight: 700,
      maxLength: 36,
      maxLines: 1
    }
  },

  'event-mobile': {
    name: '이벤트 배너',
    width: 1560,
    height: 468,
    maxFileSize: 1 * 1024 * 1024,
    fixedText: true,
    allowCustomText: false,
    subTitle: {
      x: 81,
      y: 86,
      width: 1460,
      height: 60,
      fontSize: 60,
      lineHeight: 74,
      fontFamily: 'Pretendard',
      fontWeight: 500,
      maxLength: 20,
      maxLines: 1
    },
    mainTitle: {
      x: 81,
      y: 187,
      width: 1460,
      height: 90,
      fontSize: 80,
      lineHeight: 99,
      fontFamily: 'Pretendard',
      fontWeight: 700,
      maxLength: 24,
      maxLines: 1
    }
  },

  'interactive-mobile': {
    name: '인터랙티브',
    width: 1050,
    height: 1050,
    maxFileSize: 5 * 1024 * 1024,
    fixedText: false,
    allowCustomText: true
  },

  'fullscreen-pc': {
  name: '전면 배너',
  width: 2880,
  height: 570,
  maxFileSize: 10 * 1024 * 1024,
  fixedText: true,
  allowCustomText: false,
  subTitle: {
    x: 165,
    y: 197,
    width: 679,
    height: 50, // 실제 렌더링 기준 보정 가능
    fontSize: 38,
    lineHeight: 47, // 38 * 1.24
    fontFamily: 'Pretendard',
    fontWeight: 600, // Semibold
    letterSpacing: -2
  },
  mainTitle: {
    x: 165,
    y: 250,
    width: 679,
    height: 100,
    fontSize: 54,
    lineHeight: 67, // 54 * 1.24
    fontFamily: 'Pretendard',
    fontWeight: 700, // Bold
    letterSpacing: -2
  }
}

};

// 배너 타입별 설정 가져오기
export const getBannerConfig = (bannerType: string, deviceType: string): BannerConfig => {
  const key = `${bannerType}-${deviceType}`;
  return bannerConfigs[key];
};

// 사용 가능한 배너 타입 목록
export const getAvailableBannerTypes = (deviceType: string): string[] => {
  return Object.keys(bannerConfigs)
    .filter(key => key.endsWith(deviceType))
    .map(key => key.replace(`-${deviceType}`, ''));
};
