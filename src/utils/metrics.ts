/**
 * 성능 계측 유틸리티
 * Performance API를 사용하여 체감 성능을 측정하고 모니터링
 */

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
}

interface HistoryMetrics {
  firstListTTFB?: number;      // Time to First Byte
  firstPaint?: number;         // First Paint
  firstInteractive?: number;   // First Interactive
}

class MetricsCollector {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private readonly WARNING_THRESHOLD = 2000; // 2초

  /**
   * 성능 측정 시작
   */
  startMeasure(name: string): void {
    performance.mark(`${name}-start`);
  }

  /**
   * 성능 측정 종료 및 기록
   */
  endMeasure(name: string): number {
    const endMarkName = `${name}-end`;
    const measureName = `${name}-measure`;
    
    performance.mark(endMarkName);
    performance.measure(measureName, `${name}-start`, endMarkName);
    
    const measure = performance.getEntriesByName(measureName)[0] as PerformanceEntry;
    const duration = measure.duration;
    
    this.metrics.set(name, {
      name,
      duration,
      timestamp: Date.now()
    });

    // 경고 임계값 초과 시 알림
    if (duration > this.WARNING_THRESHOLD) {
      this.reportSlowPerformance(name, duration);
    }

    // 메모리 정리
    performance.clearMarks(`${name}-start`);
    performance.clearMarks(endMarkName);
    performance.clearMeasures(measureName);

    return duration;
  }

  /**
   * 배너 히스토리 페이지 전용 메트릭 수집
   */
  measureHistoryMetrics(): HistoryMetrics {
    const metrics: HistoryMetrics = {};

    // First List TTFB (API 응답 시간)
    if (this.metrics.has('history-first-list-ttfb')) {
      metrics.firstListTTFB = this.metrics.get('history-first-list-ttfb')!.duration;
    }

    // First Paint (첫 번째 렌더링)
    if (this.metrics.has('history-first-paint')) {
      metrics.firstPaint = this.metrics.get('history-first-paint')!.duration;
    }

    // First Interactive (사용자 상호작용 가능)
    if (this.metrics.has('history-first-interactive')) {
      metrics.firstInteractive = this.metrics.get('history-first-interactive')!.duration;
    }

    return metrics;
  }

  /**
   * 느린 성능 보고
   */
  private reportSlowPerformance(name: string, duration: number): void {
    const message = `⚠️ 성능 경고: ${name} - ${duration.toFixed(2)}ms (임계값: ${this.WARNING_THRESHOLD}ms)`;
    
    console.warn(message, {
      metric: name,
      duration,
      threshold: this.WARNING_THRESHOLD,
      timestamp: new Date().toISOString()
    });

    // Sentry나 다른 모니터링 도구로 전송 (예시)
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureMessage(message, 'warning');
    }

    // 개발 환경에서는 콘솔에 표시
    if (process.env.NODE_ENV === 'development') {
      this.showPerformanceToast(name, duration);
    }
  }

  /**
   * 성능 경고 토스트 표시 (개발용)
   */
  private showPerformanceToast(name: string, duration: number): void {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-4 right-4 bg-orange-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm';
    toast.innerHTML = `
      <div class="font-bold">성능 경고</div>
      <div>${name}: ${duration.toFixed(0)}ms</div>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
      }, 300);
    }, 4000);
  }

  /**
   * 모든 메트릭 가져오기
   */
  getAllMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values());
  }

  /**
   * 메트릭 초기화
   */
  clear(): void {
    this.metrics.clear();
  }

  /**
   * 메트릭 요약 리포트 생성
   */
  generateReport(): string {
    const metrics = this.getAllMetrics();
    if (metrics.length === 0) {
      return 'No metrics collected';
    }

    const report = metrics
      .map(metric => `${metric.name}: ${metric.duration.toFixed(2)}ms`)
      .join('\n');

    return `Performance Report:\n${report}`;
  }
}

// 싱글톤 인스턴스
export const metricsCollector = new MetricsCollector();

/**
 * 배너 히스토리 페이지 성능 측정 헬퍼
 */
export const historyMetrics = {
  /**
   * 첫 번째 API 호출 시작
   */
  startFirstListTTFB(): void {
    metricsCollector.startMeasure('history-first-list-ttfb');
  },

  /**
   * 첫 번째 API 응답 완료
   */
  endFirstListTTFB(): number {
    return metricsCollector.endMeasure('history-first-list-ttfb');
  },

  /**
   * 첫 번째 페인트 시작
   */
  startFirstPaint(): void {
    metricsCollector.startMeasure('history-first-paint');
  },

  /**
   * 첫 번째 페인트 완료
   */
  endFirstPaint(): number {
    return metricsCollector.endMeasure('history-first-paint');
  },

  /**
   * 상호작용 가능 시점 시작
   */
  startFirstInteractive(): void {
    metricsCollector.startMeasure('history-first-interactive');
  },

  /**
   * 상호작용 가능 시점 완료
   */
  endFirstInteractive(): number {
    return metricsCollector.endMeasure('history-first-interactive');
  },

  /**
   * 전체 메트릭 수집 및 리포트
   */
  collectMetrics(): HistoryMetrics {
    return metricsCollector.measureHistoryMetrics();
  },

  /**
   * 리포트 생성
   */
  generateReport(): string {
    return metricsCollector.generateReport();
  }
};

/**
 * 성능 측정 데코레이터 (함수용)
 */
export function measurePerformance<T extends (...args: any[]) => Promise<any>>(
  name: string,
  fn: T
): T {
  return (async (...args: any[]) => {
    metricsCollector.startMeasure(name);
    try {
      const result = await fn(...args);
      return result;
    } finally {
      metricsCollector.endMeasure(name);
    }
  }) as T;
}
