import { DeviceConfig, DeviceType } from '../types';

export const deviceConfigs: Record<DeviceType, DeviceConfig> = {
  pc: {
    width: 1920,
    height: 1080,
    aspectRatio: 16 / 9,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    logo: {
      width: 266,
      height: 56,
      x: 110,
      y: 90
    },
    text: {
      title: {
        maxLength: 50,
        fontFamily: 'Pretendard',
        fontSize: 48,
        fontWeight: 700,
        letterSpacing: -0.02,
        lineHeight: 1.2,
        x: 81,
        y: 187
      },
      subtitle: {
        maxLength: 100,
        fontFamily: 'Pretendard',
        fontSize: 24,
        fontWeight: 500,
        letterSpacing: -0.01,
        lineHeight: 1.4,
        x: 81,
        y: 86
      }
    }
  },
  mobile: {
    width: 750,
    height: 1334,
    aspectRatio: 9 / 16,
    maxFileSize: 5 * 1024 * 1024, // 5MB
    logo: {
      width: 266,
      height: 56,
      x: 81,
      y: 98
    },
    text: {
      title: {
        maxLength: 30,
        fontFamily: 'Pretendard',
        fontSize: 32,
        fontWeight: 700,
        letterSpacing: -0.02,
        lineHeight: 1.2,
        x: 81,
        y: 187
      },
      subtitle: {
        maxLength: 50,
        fontFamily: 'Pretendard',
        fontSize: 18,
        fontWeight: 500,
        letterSpacing: -0.01,
        lineHeight: 1.4,
        x: 81,
        y: 86
      }
    }
  }
}; 