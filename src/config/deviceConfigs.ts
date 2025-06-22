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
        x: 81,
        y: 187,
        width: 1758,
        height: 60,
        fontSize: 48,
        lineHeight: 1.2,
        fontFamily: 'Pretendard',
        fontWeight: 700,
        letterSpacing: -0.02,
        maxLength: 50
      },
      subtitle: {
        x: 81,
        y: 86,
        width: 1758,
        height: 40,
        fontSize: 24,
        lineHeight: 1.4,
        fontFamily: 'Pretendard',
        fontWeight: 500,
        letterSpacing: -0.01,
        maxLength: 100
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
        x: 81,
        y: 187,
        width: 588,
        height: 40,
        fontSize: 32,
        lineHeight: 1.2,
        fontFamily: 'Pretendard',
        fontWeight: 700,
        letterSpacing: -0.02,
        maxLength: 30
      },
      subtitle: {
        x: 81,
        y: 86,
        width: 588,
        height: 25,
        fontSize: 18,
        lineHeight: 1.4,
        fontFamily: 'Pretendard',
        fontWeight: 500,
        letterSpacing: -0.01,
        maxLength: 50
      }
    }
  }
}; 