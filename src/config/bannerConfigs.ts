import { BannerConfig } from '../types';

export const bannerConfigs: Record<string, BannerConfig> = {
  'basic-no-logo-pc': {
    name: '기본배너(로고x) - PC',
    width: 2880,
    height: 480,
    fixedText: true,
    allowCustomText: false,
    maxFileSize: 10 * 1024 * 1024,
    mainTitle: {
      x: 110, y: 182, width: 1227, height: 104,
      fontSize: 84, fontFamily: 'Pretendard Bold'
    },
    subTitle: {
      x: 110, y: 306, width: 1279, height: 64,
      fontSize: 64, fontFamily: 'Pretendard Bold'
    }
  },
  'basic-no-logo-mobile': {
    name: '기본배너(로고x) - MO',
    width: 1560, height: 468,
    fixedText: true, allowCustomText: false,
    maxFileSize: 5 * 1024 * 1024,
    mainTitle: {
      x: 81, y: 187, width: 1199, height: 80,
      fontSize: 80, fontFamily: 'Pretendard Bold'
    },
    subTitle: {
      x: 81, y: 310, width: 1376, height: 60,
      fontSize: 60, fontFamily: 'Pretendard Bold'
    }
  },
  'splash-mobile': {
    name: '스플래시배너 - MO',
    width: 390, height: 844,
    fixedText: false, allowCustomText: true,
    maxFileSize: 5 * 1024 * 1024
  },
  'main-popup-mobile': {
    name: '메인홈 팝업 - MO',
    width: 375, height: 203,
    fixedText: false, allowCustomText: true,
    maxFileSize: 5 * 1024 * 1024
  },
  'interactive-pc': {
    name: '인터랙티브&전면배너 - PC',
    width: 2880, height: 570,
    fixedText: false, allowCustomText: true,
    maxFileSize: 10 * 1024 * 1024
  },
  'interactive-mobile': {
    name: '인터랙티브&전면배너 - MO',
    width: 1050, height: 1050,
    fixedText: false, allowCustomText: true,
    maxFileSize: 5 * 1024 * 1024
  }
}; 