import { BannerConfig } from '../types';

export const bannerConfigs: Record<string, BannerConfig> = {
  'basic-no-logo-pc': {
    name: '기본 배너 (PC, 로고 없음)',
    dbType: 'basic-no-logo',
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
      lineHeight: 66.96, // 54 * 1.24
      fontFamily: 'Pretendard',
      fontWeight: 500,
      letterSpacing: -0.54, // 54 * -0.01
      maxLength: 20,
      maxLines: 1
    },
    mainTitle: {
      x: 110,
      y: 182,
      width: 2680,
      height: 100,
      fontSize: 84,
      lineHeight: 104.16, // 84 * 1.24
      fontFamily: 'Pretendard',
      fontWeight: 700,
      letterSpacing: -1.68, // 84 * -0.02
      maxLength: 36,
      maxLines: 1
    }
  },

  'basic-no-logo-mobile': {
    name: '기본 배너 (Mobile, 로고 없음)',
    dbType: 'basic-no-logo',
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
      lineHeight: 74.4, // 60 * 1.24
      fontFamily: 'Pretendard',
      fontWeight: 500,
      letterSpacing: -0.6, // 60 * -0.01
      maxLength: 20,
      maxLines: 1
    },
    mainTitle: {
      x: 81,
      y: 187,
      width: 1460,
      height: 90,
      fontSize: 80,
      lineHeight: 99.2, // 80 * 1.24
      fontFamily: 'Pretendard',
      fontWeight: 700,
      letterSpacing: -1.6, // 80 * -0.02
      maxLength: 24,
      maxLines: 1
    }
  },

  'basic-with-logo-pc': {
    name: '기본 배너 (PC, 로고 포함)',
    dbType: 'basic-with-logo',
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
      lineHeight: 104.16, // 84 * 1.24
      fontFamily: 'Pretendard',
      fontWeight: 700,
      letterSpacing: -1.68, // 84 * -0.02
      maxLength: 36,
      maxLines: 2
    },
    logo: {
      x: 110,
      y: 90,
      height: 56,
      maxFileSize: 500 * 1024
    }
  },

  'basic-with-logo-mobile': {
    name: '기본 배너 (Mobile, 로고 포함)',
    dbType: 'basic-with-logo',
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
      height: 56,
      maxFileSize: 300 * 1024
    }
  },

  'interactive-pc': {
    name: '인터랙티브 (PC)',
    dbType: 'interactive',
    width: 1920,
    height: 1080,
    maxFileSize: 10 * 1024 * 1024,
    fixedText: false,
    allowCustomText: true,
    subTitle: {
      x: 460,
      y: 200,
      width: 1000,
      height: 60,
      fontSize: 50,
      lineHeight: 62,
      fontFamily: 'Pretendard',
      fontWeight: 600,
      letterSpacing: -0.5,
      maxLength: 25,
      maxLines: 1
    },
    mainTitle: {
      x: 460,
      y: 270,
      width: 1000,
      height: 160,
      fontSize: 100,
      lineHeight: 124,
      fontFamily: 'Pretendard',
      fontWeight: 700,
      letterSpacing: -2,
      maxLength: 30,
      maxLines: 2
    },
    logo: {
      x: 879,
      y: 800,
      height: 64,
      maxFileSize: 500 * 1024
    },
    buttonText: {
      x: 410,
      y: 900,
      width: 1100,
      height: 120,
      fontSize: 50,
      lineHeight: 62,
      fontFamily: 'Pretendard',
      fontWeight: 600,
      letterSpacing: -1,
      maxLength: 10,
      maxLines: 1
    }
  },

  'interactive-mobile': {
    name: '인터랙티브 (Mobile)',
    dbType: 'interactive',
    width: 1050,
    height: 1050,
    maxFileSize: 5 * 1024 * 1024,
    fixedText: false,
    allowCustomText: true,
    subTitle: {
      x: 200,  // 중앙 정렬: 1050/2 - 650/2 = 525 - 325 = 200
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
      x: 180,  // 중앙 정렬: 1050/2 - 690/2 = 525 - 345 = 180
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
      height: 56, // 56으로 통일
      maxFileSize: 300 * 1024
    },
    buttonText: {
      x: 60,   // 버튼 위치 조정
      y: 848,  // 하단 버튼 위치 (2px 아래로 조정)
      width: 954,  // 버튼 너비 확대
      height: 144,  // 버튼 높이 (이미지 기준)
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
    name: '메인 홈 전면 배너',
    dbType: 'fullscreen',
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
  },

  'aviation-no-logo-mobile': {
    name: '항공팀 배너 (Mobile, 로고 없음)',
    dbType: 'airline',
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
      lineHeight: 74.4, // 124%
      fontFamily: 'Pretendard',
      fontWeight: 500, // Medium
      letterSpacing: -0.6, // -1%
      maxLength: 20,
      maxLines: 1
    },
    mainTitle: {
      x: 81,
      y: 187,
      width: 1460,
      height: 90,
      fontSize: 80,
      lineHeight: 99.2, // 124%
      fontFamily: 'Pretendard',
      fontWeight: 700, // Bold
      letterSpacing: -1.6, // -2%
      maxLength: 24,
      maxLines: 1
    },
    bottomSubTitle: {
      x: 81,
      y: 310,
      width: 1460,
      height: 60,
      fontSize: 60,
      lineHeight: 74.4, // 124%
      fontFamily: 'Pretendard',
      fontWeight: 700, // Bold
      letterSpacing: -1.2, // -2%
      maxLength: 20,
      maxLines: 1
    }
  },

  'aviation-no-logo-pc': {
    name: '항공팀 배너 (PC, 로고 없음)',
    dbType: 'airline',
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
      lineHeight: 66.96, // 124%
      fontFamily: 'Pretendard',
      fontWeight: 500, // Medium
      letterSpacing: -0.54, // -1%
      maxLength: 20,
      maxLines: 1
    },
    mainTitle: {
      x: 110,
      y: 182,
      width: 2680,
      height: 90,
      fontSize: 80,
      lineHeight: 99.2, // 124%
      fontFamily: 'Pretendard',
      fontWeight: 700, // Bold
      letterSpacing: -1.6, // -2%
      maxLength: 36,
      maxLines: 1
    },
    bottomSubTitle: {
      x: 110,
      y: 306,
      width: 2680,
      height: 70,
      fontSize: 64,
      lineHeight: 79.36, // 124%
      fontFamily: 'Pretendard',
      fontWeight: 700, // Bold
      letterSpacing: -1.28, // -2%
      maxLength: 30,
      maxLines: 1
    }
  },

  'aviation-with-logo-mobile': {
    name: '항공팀 배너 (Mobile, 로고 포함)',
    dbType: 'airline',
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
      lineHeight: 99.2, // 80 * 1.24
      fontFamily: 'Pretendard',
      fontWeight: 700, // Bold
      letterSpacing: -1.6, // 80 * -0.02
      maxLength: 24,
      maxLines: 1
    },
    bottomSubTitle: {
      x: 81,
      y: 310,
      width: 1460,
      height: 60,
      fontSize: 60,
      lineHeight: 74.4, // 60 * 1.24
      fontFamily: 'Pretendard',
      fontWeight: 700, // Bold
      letterSpacing: -1.2, // 60 * -0.02
      maxLength: 20,
      maxLines: 1
    },
    multiLogo: {
      x: 81,
      y: 96,
      height: 56,
      maxHeight: 56, // 개별 로고 최대 높이
      logoGap: 17, // 로고 간 간격 (구분자 포함)
      separatorWidth: 1, // 구분자 선 너비
      maxLogos: 5, // 최대 로고 개수
      maxFileSize: 300 * 1024
    }
  },

  'aviation-with-logo-pc': {
    name: '항공팀 배너 (PC, 로고 포함)',
    dbType: 'airline',
    width: 2880,
    height: 480,
    maxFileSize: 1.5 * 1024 * 1024,
    fixedText: true,
    allowCustomText: false,
    mainTitle: {
      x: 110,
      y: 182,
      width: 2680,
      height: 90,
      fontSize: 80,
      lineHeight: 99.2, // 80 * 1.24
      fontFamily: 'Pretendard',
      fontWeight: 700, // Bold
      letterSpacing: -1.6, // 80 * -0.02
      maxLength: 36,
      maxLines: 1
    },
    bottomSubTitle: {
      x: 110,
      y: 306,
      width: 2680,
      height: 70,
      fontSize: 64,
      lineHeight: 79.36, // 64 * 1.24
      fontFamily: 'Pretendard',
      fontWeight: 700, // Bold
      letterSpacing: -1.28, // 64 * -0.02
      maxLength: 30,
      maxLines: 1
    },
    multiLogo: {
      x: 110,
      y: 90,
      height: 56,
      maxHeight: 56, // 개별 로고 최대 높이
      logoGap: 17, // 로고 간 간격 (구분자 포함)
      separatorWidth: 1, // 구분자 선 너비
      maxLogos: 6, // 최대 로고 개수 (PC는 더 많이)
      maxFileSize: 500 * 1024
    }
  },

  'event-pc': {
    name: '이벤트 배너 (PC)',
    dbType: 'event',
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
      lineHeight: 66.96, // 124%
      fontFamily: 'Pretendard',
      fontWeight: 500, // Medium
      letterSpacing: -0.54, // -1%
      maxLength: 20,
      maxLines: 1
    },
    mainTitle: {
      x: 110,
      y: 182,
      width: 2680,
      height: 90,
      fontSize: 80,
      lineHeight: 99.2, // 124%
      fontFamily: 'Pretendard',
      fontWeight: 700, // Bold
      letterSpacing: -1.6, // -2%
      maxLength: 36,
      maxLines: 1
    },
    bottomSubTitle: {
      x: 110,
      y: 306,
      width: 2680,
      height: 70,
      fontSize: 64,
      lineHeight: 79.36, // 124%
      fontFamily: 'Pretendard',
      fontWeight: 700, // Bold
      letterSpacing: -1.28, // -2%
      maxLength: 30,
      maxLines: 1
    }
  },

  'event-mobile': {
    name: '이벤트 배너 (Mobile)',
    dbType: 'event',
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
      lineHeight: 74.4, // 124%
      fontFamily: 'Pretendard',
      fontWeight: 500, // Medium
      letterSpacing: -0.6, // -1%
      maxLength: 20,
      maxLines: 1
    },
    mainTitle: {
      x: 81,
      y: 187,
      width: 1460,
      height: 90,
      fontSize: 80,
      lineHeight: 99.2, // 124%
      fontFamily: 'Pretendard',
      fontWeight: 700, // Bold
      letterSpacing: -1.6, // -2%
      maxLength: 24,
      maxLines: 1
    },
    bottomSubTitle: {
      x: 81,
      y: 310,
      width: 1460,
      height: 60,
      fontSize: 60,
      lineHeight: 74.4, // 124%
      fontFamily: 'Pretendard',
      fontWeight: 700, // Bold
      letterSpacing: -1.2, // -2%
      maxLength: 20,
      maxLines: 1
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


