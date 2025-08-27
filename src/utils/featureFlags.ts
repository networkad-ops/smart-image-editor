/**
 * 기능 플래그 관리 유틸리티
 * 환경변수를 통한 기능 토글 및 롤백 지원
 */

interface FeatureFlags {
  bannerHistoryCursor: boolean;
  thumbnailOptimization: boolean;
  performanceMetrics: boolean;
}

class FeatureFlagManager {
  private flags: FeatureFlags;

  constructor() {
    this.flags = {
      bannerHistoryCursor: this.getEnvFlag('VITE_FEATURE_BANNER_HISTORY_CURSOR', true),
      thumbnailOptimization: this.getEnvFlag('VITE_FEATURE_THUMBNAIL_OPTIMIZATION', true),
      performanceMetrics: this.getEnvFlag('VITE_FEATURE_PERFORMANCE_METRICS', true),
    };

    // 개발 환경에서 플래그 상태 로그
    if (process.env.NODE_ENV === 'development') {
      console.log('🚩 Feature Flags:', this.flags);
    }
  }

  /**
   * 환경변수에서 불린 플래그 값 가져오기
   */
  private getEnvFlag(key: string, defaultValue: boolean): boolean {
    const value = import.meta.env[key];
    if (value === undefined) return defaultValue;
    return value === 'true' || value === '1';
  }

  /**
   * 배너 히스토리 커서 페이지네이션 사용 여부
   */
  get useBannerHistoryCursor(): boolean {
    return this.flags.bannerHistoryCursor;
  }

  /**
   * 썸네일 최적화 사용 여부
   */
  get useThumbnailOptimization(): boolean {
    return this.flags.thumbnailOptimization;
  }

  /**
   * 성능 메트릭 수집 사용 여부
   */
  get usePerformanceMetrics(): boolean {
    return this.flags.performanceMetrics;
  }

  /**
   * 런타임에 플래그 값 변경 (개발/테스트용)
   */
  setFlag(flag: keyof FeatureFlags, value: boolean): void {
    this.flags[flag] = value;
    console.log(`🚩 Feature Flag 변경: ${flag} = ${value}`);
  }

  /**
   * 모든 플래그 상태 반환
   */
  getAllFlags(): FeatureFlags {
    return { ...this.flags };
  }

  /**
   * 플래그 상태를 로컬 스토리지에 저장 (개발용)
   */
  saveToLocalStorage(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('featureFlags', JSON.stringify(this.flags));
    }
  }

  /**
   * 로컬 스토리지에서 플래그 상태 복원 (개발용)
   */
  loadFromLocalStorage(): void {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('featureFlags');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          this.flags = { ...this.flags, ...parsed };
          console.log('🚩 Feature Flags 복원됨:', this.flags);
        } catch (error) {
          console.error('Feature Flags 복원 실패:', error);
        }
      }
    }
  }
}

// 싱글톤 인스턴스
export const featureFlags = new FeatureFlagManager();

// 개발 환경에서 전역 접근 가능하도록 설정
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  (window as any).featureFlags = featureFlags;
}

/**
 * 배너 히스토리 커서 페이지네이션 사용 여부 확인
 */
export const useBannerHistoryCursor = (): boolean => {
  return featureFlags.useBannerHistoryCursor;
};

/**
 * 썸네일 최적화 사용 여부 확인
 */
export const useThumbnailOptimization = (): boolean => {
  return featureFlags.useThumbnailOptimization;
};

/**
 * 성능 메트릭 수집 사용 여부 확인
 */
export const usePerformanceMetrics = (): boolean => {
  return featureFlags.usePerformanceMetrics;
};
