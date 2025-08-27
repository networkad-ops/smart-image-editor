/**
 * 레이아웃 시프트 계측 및 모니터링
 * CLS (Cumulative Layout Shift) 측정 및 임계값 초과 시 알림
 */

interface LayoutShiftEntry extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
  sources: Array<{
    node?: Node;
    currentRect: DOMRectReadOnly;
    previousRect: DOMRectReadOnly;
  }>;
}

class LayoutShiftMonitor {
  private observer: PerformanceObserver | null = null;
  private cumulativeScore = 0;
  private readonly THRESHOLD = 0.1; // CLS 임계값
  private readonly SENTRY_THRESHOLD = 0.25; // Sentry 전송 임계값

  /**
   * 레이아웃 시프트 모니터링 시작
   */
  start(): void {
    if (!('PerformanceObserver' in window)) {
      console.warn('PerformanceObserver not supported');
      return;
    }

    try {
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as LayoutShiftEntry[]) {
          // 사용자 입력으로 인한 시프트는 제외
          if (!entry.hadRecentInput) {
            this.cumulativeScore += entry.value;
            this.handleLayoutShift(entry);
          }
        }
      });

      this.observer.observe({ entryTypes: ['layout-shift'] });
      console.log('✅ Layout Shift Observer 시작됨');
    } catch (error) {
      console.error('Layout Shift Observer 시작 실패:', error);
    }
  }

  /**
   * 레이아웃 시프트 처리
   */
  private handleLayoutShift(entry: LayoutShiftEntry): void {
    const shift = {
      value: entry.value,
      cumulative: this.cumulativeScore,
      timestamp: entry.startTime,
      sources: entry.sources?.length || 0
    };

    // 콘솔 로그
    if (entry.value > this.THRESHOLD) {
      console.warn('⚠️ 레이아웃 시프트 감지:', shift);
    }

    // Sentry 전송 (임계값 초과 시)
    if (this.cumulativeScore > this.SENTRY_THRESHOLD) {
      this.sendToSentry(shift);
    }

    // 개발 환경에서 시각적 알림
    if (process.env.NODE_ENV === 'development' && entry.value > this.THRESHOLD) {
      this.showDevToast(entry.value);
    }
  }

  /**
   * Sentry로 레이아웃 시프트 데이터 전송
   */
  private sendToSentry(shift: any): void {
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureMessage('High Layout Shift Detected', {
        level: 'warning',
        tags: {
          feature: 'banner-history',
          performance: 'layout-shift'
        },
        extra: {
          cls_value: shift.value,
          cumulative_cls: shift.cumulative,
          sources_count: shift.sources,
          timestamp: shift.timestamp
        }
      });
    }
  }

  /**
   * 개발 환경 토스트 알림
   */
  private showDevToast(value: number): void {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-4 left-4 bg-yellow-500 text-black px-4 py-2 rounded-lg shadow-lg z-50 text-sm font-mono';
    toast.innerHTML = `
      <div class="font-bold">Layout Shift 감지</div>
      <div>CLS: ${value.toFixed(4)} (누적: ${this.cumulativeScore.toFixed(4)})</div>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
      }, 300);
    }, 3000);
  }

  /**
   * 현재 CLS 점수 반환
   */
  getCumulativeScore(): number {
    return this.cumulativeScore;
  }

  /**
   * 모니터링 중지
   */
  stop(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
      console.log('🛑 Layout Shift Observer 중지됨');
    }
  }

  /**
   * CLS 점수 초기화
   */
  reset(): void {
    this.cumulativeScore = 0;
  }
}

// 싱글톤 인스턴스
export const layoutShiftMonitor = new LayoutShiftMonitor();

/**
 * 배너 히스토리 페이지용 레이아웃 시프트 모니터링
 */
export const startBannerHistoryMonitoring = (): void => {
  layoutShiftMonitor.reset();
  layoutShiftMonitor.start();
  
  // 페이지 언로드 시 결과 로그
  window.addEventListener('beforeunload', () => {
    const finalScore = layoutShiftMonitor.getCumulativeScore();
    console.log(`📊 최종 CLS 점수: ${finalScore.toFixed(4)}`);
    
    if (finalScore > 0.25) {
      console.warn('⚠️ CLS 점수가 높습니다. 레이아웃 최적화가 필요합니다.');
    }
  });
};

/**
 * 배너 히스토리 모니터링 중지
 */
export const stopBannerHistoryMonitoring = (): void => {
  layoutShiftMonitor.stop();
};
