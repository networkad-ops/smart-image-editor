import { BannerConfig } from '../types';

export const bannerConfigs: Record<string, BannerConfig> = {
  'basic-no-logo-pc': {name: '기본배너(로고x) - PC',
    width: 2880,
    height: 480,
    maxFileSize: 1.5 * 1024 * 1024,
    fixedText: true,
    allowCustomText: false,
    subTitle: {
      x: 110,
      y: 170,
      width: 1227, // 기존 width 유지 가능
      height: 66,
      fontSize: 54,
      fontFamily: 'Pretendard Medium',
      letterSpacing: -0.54,
      maxLength: 20,
      maxLines: 1
    },
    mainTitle: {
      x: 110,
      y: 254,
      width: 1227,
      height: 208,
      fontSize: 84,
      fontFamily: 'Pretendard Bold',
      letterSpacing: -1.68,
      maxLength: 36,
      maxLines: 2
    }
   
  },
  'basic-no-logo-mobile': {
  name: '기본배너(로고x) - MO',
  width: 1560,
  height: 468,
  maxFileSize: 500 * 1024,
  fixedText: true,
  allowCustomText: false,
  subTitle: {
    x: 81,
    y: 86,
    width: 1199,
    height: 74,
    fontSize: 60,
    fontFamily: 'Pretendard Medium',
    letterSpacing: -1.2,
    maxLength: 20,
    maxLines: 1
  },
  mainTitle: {
    x: 81,
    y: 86 + 74 + 27, // 187
    width: 1199,
    height: 198, // 2줄 * 99.2px(lineHeight) 예상
    fontSize: 80,
    fontFamily: 'Pretendard Bold',
    letterSpacing: -1.6,
    maxLength: 24,
    maxLines: 2
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