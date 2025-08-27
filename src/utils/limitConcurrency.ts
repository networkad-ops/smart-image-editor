/**
 * 동시 실행 개수를 제한하여 Promise 배열을 처리하는 유틸리티
 * @param n 최대 동시 실행 개수 (기본값: 환경변수 VITE_IMG_CONCURRENCY 또는 6)
 * @param tasks Promise를 반환하는 함수 배열
 * @returns 모든 작업의 결과를 담은 Promise 배열
 */

// 환경변수에서 동시성 한도 가져오기 (기본값: 6)
const getDefaultConcurrency = (): number => {
  const envValue = import.meta.env.VITE_IMG_CONCURRENCY;
  const parsed = envValue ? parseInt(envValue, 10) : 6;
  return isNaN(parsed) || parsed < 1 ? 6 : Math.min(parsed, 20); // 최대 20개로 제한
};

export function withLimit<T>(n: number = getDefaultConcurrency(), tasks: (() => Promise<T>)[]): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const results: T[] = new Array(tasks.length);
    let completed = 0;
    let running = 0;
    let index = 0;

    function runNext() {
      if (index >= tasks.length) {
        return;
      }

      const currentIndex = index++;
      const task = tasks[currentIndex];
      running++;

      task()
        .then((result) => {
          results[currentIndex] = result;
          completed++;
          running--;

          if (completed === tasks.length) {
            resolve(results);
          } else {
            runNext();
          }
        })
        .catch((error) => {
          reject(error);
        });
    }

    // 초기 실행
    const initialRuns = Math.min(n, tasks.length);
    for (let i = 0; i < initialRuns; i++) {
      runNext();
    }

    // 빈 배열인 경우 즉시 해결
    if (tasks.length === 0) {
      resolve([]);
    }
  });
}
