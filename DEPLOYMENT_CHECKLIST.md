# 🚀 최종 배포 체크리스트

## ✅ 즉시 적용 완료

### 1. 레이아웃 시프트 계측
- [x] PerformanceObserver('layout-shift') 등록
- [x] LCP/CLS 로그 수집
- [x] 콘솔/Sentry 전송 로직 구현
- [x] 개발 환경 시각적 알림

### 2. 스켈레톤 12개 고정 슬롯
- [x] BannerHistory.tsx에 SkeletonCard × 12 기본 렌더
- [x] 썸네일 로드 완료 시 교체 로직
- [x] 레이아웃 시프트 방지

### 3. 기능 플래그
- [x] .env → FEATURE_BANNER_HISTORY_CURSOR=true
- [x] 기존 로직 제거 대신 fallback UI 유지
- [x] 런타임 토글 지원

### 4. 필수 의존성
- [x] npm install sharp tsx node-fetch @types/node-fetch
- [x] 썸네일러 및 백필 스크립트 지원

### 5. 환경변수 설정
- [x] env.production 파일 생성
- [x] VITE_IMG_CONCURRENCY=6 설정
- [x] 기능 플래그 활성화

## 🔧 추가 개발 필요

### 1. 썸네일 생성 Edge Function
```typescript
// supabase/functions/thumbnail-generator/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  // Sharp로 320px 썸네일 생성
  // thumbnails 버킷에 저장
  // banners.thumbnail_url 자동 갱신
})
```

### 2. E2E 테스트
```javascript
// tests/banner-history.spec.ts
test('최초 로드 네트워크 요청 ≤ 35', async ({ page }) => {
  const requests = [];
  page.on('request', req => requests.push(req));
  await page.goto('/banner-history');
  expect(requests.length).toBeLessThanOrEqual(35);
});

test('총 용량 ≤ 2.5MB', async ({ page }) => {
  let totalSize = 0;
  page.on('response', res => totalSize += res.headers()['content-length'] || 0);
  await page.goto('/banner-history');
  expect(totalSize).toBeLessThanOrEqual(2.5 * 1024 * 1024);
});

test('검색→스크롤→필터 변경 플로우', async ({ page }) => {
  // 중복 호출/빈 타일 없음 확인
});
```

## 📋 배포 절차

### 1. 의존성 확인
```bash
✅ npm install sharp tsx node-fetch @types/node-fetch
```

### 2. 환경변수 설정
```bash
# .env.production 복사
cp env.production .env.production

# 실제 값으로 교체
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-actual-anon-key
SUPABASE_SERVICE_KEY=your-actual-service-key
```

### 3. DB 마이그레이션 확인
```sql
-- Supabase SQL Editor에서 실행
\i supabase/migration_004_optimize_cursor_pagination.sql
\i supabase/migration_005_fix_status_index.sql

-- 인덱스 확인
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'banners' 
AND indexname LIKE '%created%';
```

### 4. 썸네일 백필 실행
```bash
# 서비스 키 설정 후 실행
SUPABASE_SERVICE_KEY=your-key npm run backfill-thumbnails

# 진행률 모니터링
# 성공/실패 통계 확인
```

### 5. 빌드 및 배포
```bash
# 프로덕션 빌드
npm run build

# 빌드 결과 확인
ls -la dist/

# 배포 (Vercel/Netlify 등)
npm run deploy
```

## 🧪 배포 후 검증

### 1. 기능 검증
- [ ] 배너 히스토리 페이지 로딩 (< 1초)
- [ ] 무한 스크롤 동작
- [ ] 검색 기능 (300ms 디바운스)
- [ ] 썸네일 표시
- [ ] 상세 편집 모달

### 2. 성능 검증
```bash
# Lighthouse 점수
- Performance: > 90
- First Contentful Paint: < 1.5s
- Largest Contentful Paint: < 2.5s
- Cumulative Layout Shift: < 0.1

# 네트워크 확인
- 초기 요청 수: ≤ 35개
- 총 전송량: ≤ 2.5MB
- 썸네일 크기: ≤ 50KB each
```

### 3. 오류 모니터링
- [ ] Sentry 에러 로그 확인
- [ ] 콘솔 에러 없음
- [ ] 네트워크 실패 재시도 동작
- [ ] 레이아웃 시프트 < 0.1

## 🔄 롤백 계획

### 즉시 롤백 (기능 플래그)
```bash
# 환경변수 변경으로 즉시 롤백
VITE_FEATURE_BANNER_HISTORY_CURSOR=false

# 또는 런타임 변경
window.featureFlags.setFlag('bannerHistoryCursor', false)
```

### 완전 롤백 (코드 레벨)
```bash
# 이전 브랜치로 롤백
git checkout main
git revert <commit-hash>
```

## 📊 성능 모니터링

### 실시간 메트릭
- Layout Shift 감지 및 알림
- API 응답 시간 모니터링
- 썸네일 로딩 실패율
- 사용자 이탈률

### 정기 리포트
- 주간 성능 리포트
- 사용자 피드백 수집
- 네트워크 사용량 분석
- 에러율 트렌드

## ⚡ 예상 성능 개선

| 항목 | Before | After | 개선율 |
|------|--------|-------|--------|
| 초기 로딩 | 3-5초 | 0.5-1초 | 80-90% |
| 네트워크 전송량 | 5-15MB | 500KB-1MB | 90-95% |
| 메모리 사용량 | 높음 | 낮음 | 70-80% |
| 사용자 체감 | 느림 | 즉시 | 대폭 개선 |

## 🎯 성공 지표

- [ ] 페이지 로딩 시간 < 1초
- [ ] 네트워크 전송량 < 1MB
- [ ] 레이아웃 시프트 < 0.1
- [ ] 에러율 < 1%
- [ ] 사용자 만족도 > 90%
