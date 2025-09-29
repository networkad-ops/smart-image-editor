import { BannerConfig } from '../types';

// 기본배너 PC 전용 preset 상수
export const BASIC_PC = {
  name: '기본배너 PC (로고없음)',
  dbType: 'basic-no-logo' as const,
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
    maxLines: 2
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
    maxLines: 2
  }
};

export const BASIC_PC_LOGO = {
  name: '기본배너 PC (로고포함)',
  dbType: 'basic-with-logo' as const,
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
};

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
      maxLines: 2
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
      maxLines: 2
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
      maxLines: 2
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
      maxLines: 2
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
      maxLines: 2
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
      maxLines: 2
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
      maxLines: 2
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
      maxLines: 2
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
      maxLines: 2
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
      maxLines: 2
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
      maxLines: 2
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
      maxLines: 2
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
      maxLines: 2
    },
    multiLogo: {
      x: 81,
      y: 96,
      height: 56,
      maxHeight: 56, // 개별 로고 최대 높이
      logoGap: 24, // 로고 간 간격 (17 -> 24)
      separatorWidth: 2, // 구분자 선 너비 (1 -> 2)
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
      maxLines: 2
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
      maxLines: 2
    },
    multiLogo: {
      x: 110,
      y: 90,
      height: 56,
      maxHeight: 56, // 개별 로고 최대 높이
      logoGap: 24, // 로고 간 간격 (17 -> 24)
      separatorWidth: 2, // 구분자 선 너비 (1 -> 2)
      maxLogos: 6, // 최대 로고 개수 (PC는 더 많이)
      maxFileSize: 500 * 1024
    }
  },

  'popup': {
    name: '메인홈 팝업',
    dbType: 'popup',
    width: 390,
    height: 520,
    maxFileSize: 1 * 1024 * 1024,
    fixedText: true,
    allowCustomText: false,
    subTitle: {
      x: 20,
      y: 80,
      width: 350,
      height: 40,
      fontSize: 16,
      lineHeight: 20,
      fontFamily: 'Pretendard',
      fontWeight: 500,
      letterSpacing: -0.16,
      maxLength: 50,
      maxLines: 2
    },
    mainTitle: {
      x: 20,
      y: 130,
      width: 350,
      height: 80,
      fontSize: 24,
      lineHeight: 30,
      fontFamily: 'Pretendard',
      fontWeight: 700,
      letterSpacing: -0.48,
      maxLength: 100,
      maxLines: 3
    },
    ctaButton: {
      x: 20,
      y: 420,
      width: 350,
      height: 50,
      backgroundColor: '#FFD700',
      textColor: '#000000',
      fontSize: 18,
      fontFamily: 'Pretendard',
      fontWeight: 700,
      borderRadius: 8,
      text: '할인받고 구매하기',
      allowCustomText: true,
      maxLength: 20,
      placeholder: '버튼 텍스트를 입력하세요'
    }
  }

};

// 배너 타입별 설정 가져오기
export const getBannerConfig = (bannerType: string, deviceType: string): BannerConfig => {
  // 팝업 배너는 deviceType을 무시하고 단일 설정 사용
  if (bannerType === 'popup') {
    return bannerConfigs['popup'];
  }
  
  const key = `${bannerType}-${deviceType}`;
  return bannerConfigs[key];
};

// 사용 가능한 배너 타입 목록
export const getAvailableBannerTypes = (deviceType: string): string[] => {
  const types = Object.keys(bannerConfigs)
    .filter(key => key.endsWith(deviceType))
    .map(key => key.replace(`-${deviceType}`, ''));
  
  // 팝업 배너는 모든 deviceType에서 사용 가능
  if (!types.includes('popup')) {
    types.push('popup');
  }
  
  return types;
};


