# 배너 히스토리 성능 최적화 비교

## 📊 최적화 개요

이 문서는 배너 히스토리 페이지의 성능 최적화 전후를 비교합니다.

### 🔄 변경사항 요약

#### **Before (기존 방식)**
- 전체 배너 데이터를 한 번에 로드
- 테이블 형태의 UI
- 원본 이미지 직접 로딩
- 클라이언트 사이드 필터링
- 동기적 이미지 로딩

#### **After (최적화된 방식)**
- 커서 기반 페이지네이션 (30개씩)
- 무한 스크롤 + 그리드 UI
- 썸네일 기반 렌더링 (320px 제한)
- 서버 사이드 필터링 + 300ms 디바운스
- 최대 6개 동시 이미지 로딩 제한
- AbortController를 통한 요청 취소
- 스켈레톤 UI + 지연 로딩

## 🎯 성능 측정 방법

### Lighthouse 측정
```bash
# Chrome DevTools > Lighthouse
# Performance 탭에서 측정
# 조건: Fast 3G, 4x CPU Slowdown
```

### 네트워크 패널 측정
```bash
# Chrome DevTools > Network 탭
# 조건: Fast 3G 시뮬레이션
# 측정 항목:
# - First List TTFB (Time to First Byte)
# - First Paint
# - First Interactive
# - Total Transfer Size
```

### 성능 메트릭 수집
```javascript
// 자동 수집되는 메트릭들
import { historyMetrics } from './src/utils/metrics';

// 사용법
historyMetrics.collectMetrics();
historyMetrics.generateReport();
```

## 📈 예상 성능 개선

### 초기 로딩 시간
- **Before**: ~3-5초 (전체 데이터 로드)
- **After**: ~0.5-1초 (첫 30개만 로드)

### 네트워크 전송량
- **Before**: ~5-15MB (원본 이미지들)
- **After**: ~500KB-1MB (썸네일들)

### 메모리 사용량
- **Before**: 높음 (모든 이미지 메모리 상주)
- **After**: 낮음 (가시 영역만 로드)

### 사용자 체감 성능
- **Before**: 긴 로딩 시간, 한 번에 모든 데이터
- **After**: 빠른 초기 로딩, 점진적 데이터 로드

## 🧪 테스트 시나리오

### 1. 초기 페이지 로드
```
시나리오: 배너 히스토리 페이지 첫 방문
측정 항목:
- TTFB (Time to First Byte)
- FCP (First Contentful Paint)  
- LCP (Largest Contentful Paint)
- TTI (Time to Interactive)
```

### 2. 스크롤 성능
```
시나리오: 무한 스크롤로 추가 데이터 로드
측정 항목:
- 스크롤 응답성
- 추가 페이지 로드 시간
- 메모리 사용량 변화
```

### 3. 검색 성능
```
시나리오: 검색어 입력 후 결과 표시
측정 항목:
- 디바운스 효과
- 서버 응답 시간
- UI 반응성
```

### 4. 이미지 로딩 성능
```
시나리오: 썸네일 vs 원본 이미지 로딩
측정 항목:
- 이미지 로드 시간
- 네트워크 전송량
- 레이아웃 시프트 (CLS)
```

## 📋 측정 체크리스트

### 배포 전 측정 (기존 방식)
- [ ] Lighthouse Performance 점수
- [ ] Network 패널 총 전송량
- [ ] 초기 로딩 완료 시간
- [ ] 메모리 사용량 (DevTools Memory 탭)
- [ ] Core Web Vitals (FCP, LCP, CLS, FID)

### 배포 후 측정 (최적화 방식)
- [ ] Lighthouse Performance 점수
- [ ] Network 패널 총 전송량  
- [ ] 초기 로딩 완료 시간
- [ ] 메모리 사용량 (DevTools Memory 탭)
- [ ] Core Web Vitals (FCP, LCP, CLS, FID)
- [ ] 무한 스크롤 성능
- [ ] 검색 디바운스 효과

## 🔧 성능 모니터링 도구

### 1. 내장 메트릭 수집
```javascript
// 성능 메트릭 자동 수집
import { historyMetrics } from './src/utils/metrics';

// 개발자 도구 콘솔에서 확인
historyMetrics.generateReport();
```

### 2. Chrome DevTools
- Performance 탭: CPU/메모리 사용량
- Network 탭: 네트워크 요청 분석
- Lighthouse: 종합 성능 점수

### 3. 실제 사용자 모니터링 (RUM)
```javascript
// Web Vitals 측정
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

getCLS(console.log);
getFID(console.log);
getFCP(console.log);
getLCP(console.log);
getTTFB(console.log);
```

## 📊 결과 기록 템플릿

### 측정 결과 기록
```markdown
## 성능 측정 결과 (날짜: YYYY-MM-DD)

### 환경
- 브라우저: Chrome 120+
- 네트워크: Fast 3G
- CPU: 4x slowdown
- 배너 개수: XXX개

### Before (기존 방식)
- Lighthouse Performance: XX/100
- First Contentful Paint: XXXXms
- Largest Contentful Paint: XXXXms  
- Total Transfer Size: XXXMB
- Time to Interactive: XXXXms

### After (최적화 방식)
- Lighthouse Performance: XX/100
- First Contentful Paint: XXXXms
- Largest Contentful Paint: XXXXms
- Total Transfer Size: XXXMB  
- Time to Interactive: XXXXms

### 개선율
- Performance Score: +XX점
- 초기 로딩: -XX% 
- 전송량: -XX%
- 상호작용 시간: -XX%
```

## 🚀 배포 가이드

### 1. 기존 브랜치 성능 측정
```bash
git checkout main
npm run build
npm run preview
# Lighthouse 측정 실행
```

### 2. 최적화 브랜치 성능 측정  
```bash
git checkout feat/history-keyset-pagination
npm run build
npm run preview
# Lighthouse 측정 실행
```

### 3. 결과 비교 및 배포 결정
- 성능 개선이 확인되면 main 브랜치로 병합
- 회귀가 발견되면 추가 최적화 작업

## 📝 주의사항

1. **측정 환경 일관성**: 동일한 조건에서 측정
2. **캐시 초기화**: 각 측정 전 브라우저 캐시 클리어
3. **네트워크 시뮬레이션**: 실제 사용자 환경과 유사한 조건
4. **반복 측정**: 최소 3회 측정 후 평균값 사용
5. **실제 데이터**: 프로덕션과 유사한 데이터량으로 테스트
