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

  'splash-mobile': {
    name: '스플래시 (Mobile)',
    width: 390,
    height: 844,
    maxFileSize: 5 * 1024 * 1024,
    fixedText: false,
    allowCustomText: true
  },

  'event-pc': {
    name: '이벤트 배너 (PC)',
    width: 2880,
    height: 480,
    maxFileSize: 2 * 1024 * 1024,
    fixedText: false,
    allowCustomText: true,
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

  'event-mobile': {
    name: '이벤트 배너 (Mobile)',
    width: 1560,
    height: 468,
    maxFileSize: 1 * 1024 * 1024,
    fixedText: false,
    allowCustomText: true,
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

  'interactive-pc': {
    name: '인터랙티브 (PC)',
    width: 2880,
    height: 1620,
    maxFileSize: 10 * 1024 * 1024,
    fixedText: false,
    allowCustomText: true,
    buttonText: {
      x: 975,  // 버튼 정중앙 (2880/2 - 465)
      y: 1400,  // 하단 버튼 위치
      width: 930,  // 버튼 너비
      height: 144,  // 버튼 높이
      fontSize: 48,  // 큰 버튼에 맞춰 폰트 크기 증가
      lineHeight: 60,
      fontFamily: 'Pretendard',
      fontWeight: 600,
      letterSpacing: -0.96,
      maxLength: 7,  // 띄어쓰기 포함 7글자
      maxLines: 1
    }
  },

  'interactive-mobile': {
    name: '인터랙티브 (Mobile)',
    width: 1050,
    height: 1050,
    maxFileSize: 5 * 1024 * 1024,
    fixedText: false,
    allowCustomText: true,
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
  fixedText: false,
  allowCustomText: true,
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
