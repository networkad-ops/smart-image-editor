import { BannerConfig } from '../types';

export const bannerConfigs: Record<string, BannerConfig> = {
  'basic-no-logo-pc': {
    name: '기본 배너 (PC, 로고 없음)',
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
      letterSpacing: -0.54,
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
      letterSpacing: -1.68,
      maxLength: 36,
      maxLines: 1
    }
  },

  'basic-no-logo-mobile': {
    name: '기본 배너 (Mobile, 로고 없음)',
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
      letterSpacing: -0.6,
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
      letterSpacing: -1.6,
      maxLength: 24,
      maxLines: 1
    }
  },

  'basic-with-logo-pc': {
    name: '기본 배너 (PC, 로고 포함)',
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
    name: '기본 배너 (Mobile, 로고 포함)',
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

  'interactive-mobile': {
    name: '인터랙티브 (Mobile)',
    width: 1050,
    height: 1050,
    maxFileSize: 5 * 1024 * 1024,
    fixedText: false,
    allowCustomText: true,
    subTitle: {
      x: 199.86,
      y: 105,
      width: 650,  // 적절한 너비 설정
      height: 52,  // 42 * 1.24
      fontSize: 42,
      lineHeight: 52,
      fontFamily: 'Pretendard',
      fontWeight: 600,  // Semibold
      letterSpacing: -0.42,
      maxLength: 20,
      maxLines: 1
    },
    mainTitle: {
      x: 180,
      y: 163.56,
      width: 690,  // 적절한 너비 설정
      height: 104,  // 84 * 1.24
      fontSize: 84,
      lineHeight: 104,
      fontFamily: 'Pretendard',
      fontWeight: 700,  // Bold
      letterSpacing: -1.68,
      maxLength: 24,
      maxLines: 2
    },
    logo: {
      x: 444,
      y: 776,
      width: 162,
      height: 42,
      maxFileSize: 300 * 1024
    },
    buttonText: {
      x: 60,  // 버튼 정중앙 (1050/2 - 465)
      y: 850,  // 하단 버튼 위치
      width: 930,  // 버튼 너비
      height: 144,  // 버튼 높이
      fontSize: 42,  // 모바일에 맞춰 조정
      lineHeight: 52,
      fontFamily: 'Pretendard',
      fontWeight: 600,
      letterSpacing: -0.84,
      maxLength: 7,  // 띄어쓰기 포함 7글자
      maxLines: 1
    }
  },

  'fullscreen-pc': {
    name: '전면 배너',
    width: 2880,
    height: 570,
    maxFileSize: 10 * 1024 * 1024,
    fixedText: true,
    allowCustomText: false,
    subTitle: {
      x: 645,
      y: 196.25,
      width: 679,
      height: 50,
      fontSize: 38,
      lineHeight: 47,
      fontFamily: 'Pretendard',
      fontWeight: 600,
      letterSpacing: -0.76,
      maxLength: 25,
      maxLines: 1
    },
    mainTitle: {
      x: 645,
      y: 243.25,
      width: 679,
      height: 100,
      fontSize: 54,
      lineHeight: 67,
      fontFamily: 'Pretendard',
      fontWeight: 700,
      letterSpacing: -1.08,
      maxLength: 30,
      maxLines: 2
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
