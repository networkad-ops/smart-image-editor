/**
 * 네트워크 요청 재시도 유틸리티
 * 8초 타임아웃과 최대 2회 지수 백오프 재시도를 제공
 */

interface RetryOptions {
  maxRetries?: number;
  timeoutMs?: number;
  baseDelayMs?: number;
  onError?: (error: Error, attempt: number) => void;
}

/**
 * 지수 백오프로 Promise를 재시도하는 함수
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 2,
    timeoutMs = 8000,
    baseDelayMs = 1000,
    onError
  } = options;

  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // 타임아웃 적용
      const result = await Promise.race([
        fn(),
        new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), timeoutMs);
        })
      ]);

      return result;
    } catch (error) {
      lastError = error as Error;
      
      if (onError) {
        onError(lastError, attempt + 1);
      }

      // 마지막 시도인 경우 에러 던지기
      if (attempt === maxRetries) {
        break;
      }

      // 429/503 에러에 대한 특별한 지수 백오프 처리
      let delay = baseDelayMs * Math.pow(2, attempt);
      
      // HTTP 에러 코드 확인 (Supabase 에러 또는 fetch 에러)
      const isRateLimitError = lastError.message.includes('429') || 
                              lastError.message.includes('503') ||
                              lastError.message.includes('Too Many Requests') ||
                              lastError.message.includes('Service Unavailable');
      
      if (isRateLimitError) {
        // 429/503의 경우 더 긴 지연 (800ms → 1600ms → 3200ms, 최대 5초)
        delay = Math.min(800 * Math.pow(2, attempt), 5000);
        
        // 네트워크 혼잡 메시지 표시
        if (attempt < maxRetries) {
          showNetworkCongestionToast();
        }
      }

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

/**
 * 네트워크 혼잡 토스트 표시
 */
export function showNetworkCongestionToast() {
  const toast = document.createElement('div');
  toast.className = 'fixed top-4 right-4 bg-orange-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-opacity';
  toast.textContent = '네트워크 혼잡으로 썸네일 재시도 중...';
  
  document.body.appendChild(toast);
  
  // 2초 후 제거
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => {
      if (document.body.contains(toast)) {
        document.body.removeChild(toast);
      }
    }, 300);
  }, 2000);
}

/**
 * 썸네일 로딩 실패 토스트 표시
 */
export function showThumbnailError(message: string = '썸네일 불러오기 실패') {
  // 간단한 토스트 알림 (실제 프로젝트에서는 toast 라이브러리 사용 권장)
  const toast = document.createElement('div');
  toast.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-opacity';
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  // 3초 후 제거
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
 * Supabase 호출을 재시도와 함께 래핑하는 함수
 */
export async function supabaseWithRetry<T>(
  supabaseCall: () => Promise<T>,
  errorMessage: string = '데이터 로드 실패'
): Promise<T> {
  return withRetry(supabaseCall, {
    maxRetries: 2,
    timeoutMs: 8000,
    baseDelayMs: 1000,
    onError: (error, attempt) => {
      console.warn(`Supabase 호출 실패 (시도 ${attempt}):`, error);
      if (attempt > 2) {
        showThumbnailError(errorMessage);
      }
    }
  });
}
