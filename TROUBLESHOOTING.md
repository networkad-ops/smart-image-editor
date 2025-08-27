# 🔧 문제 해결 가이드 (Troubleshooting)

## 🚨 일반적인 문제 해결

### 1. 빌드 실패

**증상**: `npm run build` 실행 시 에러 발생

**원인 & 해결책**:
```bash
# TypeScript 컴파일 에러
npm run build
# → 타입 에러 수정 후 재시도

# 메모리 부족
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build

# 의존성 문제
rm -rf node_modules package-lock.json
npm install
npm run build
```

### 2. 개발 서버 실행 안됨

**증상**: `npm run dev` 실행 시 포트 에러

```bash
# 포트 이미 사용 중
lsof -ti:3000 | xargs kill -9  # 3000번 포트 프로세스 종료
npm run dev

# 또는 다른 포트 사용
npm run dev -- --port 3001
```

### 3. 환경변수 로드 안됨

**증상**: Supabase 연결 실패, 기능 동작 안함

```bash
# .env 파일 확인
ls -la .env*
cat .env

# 환경변수 형식 확인 (VITE_ 접두어 필요)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# 브라우저에서 확인
console.log(import.meta.env.VITE_SUPABASE_URL)
```

## 🗄️ 데이터베이스 문제

### 1. Supabase 연결 실패

**증상**: "Failed to fetch" 에러

```typescript
// 연결 상태 확인
const checkConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('banners')
      .select('count(*)')
      .limit(1);
    
    if (error) throw error;
    console.log('✅ Supabase 연결 성공');
  } catch (error) {
    console.error('❌ Supabase 연결 실패:', error);
  }
};
```

**해결책**:
- Supabase URL/Key 확인
- 네트워크 연결 확인
- CORS 설정 확인
- RLS (Row Level Security) 정책 확인

### 2. 쿼리 성능 문제

**증상**: 배너 목록 로딩이 느림

```sql
-- 인덱스 확인
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'banners';

-- 쿼리 실행 계획 확인
EXPLAIN ANALYZE 
SELECT id, title, thumbnail_url, canvas_width, canvas_height, created_at 
FROM banners 
ORDER BY created_at DESC, id DESC 
LIMIT 30;
```

**해결책**:
```sql
-- 필수 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_banners_created_id 
ON banners (created_at DESC, id DESC);

-- 통계 업데이트
ANALYZE banners;
```

### 3. 마이그레이션 실패

**증상**: SQL 마이그레이션 실행 시 에러

```sql
-- 현재 스키마 확인
\d banners

-- 인덱스 존재 확인
SELECT indexname FROM pg_indexes WHERE tablename = 'banners';

-- 컬럼 존재 확인
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'banners';
```

## 🖼️ 이미지 관련 문제

### 1. 썸네일이 표시되지 않음

**증상**: 스켈레톤만 표시되고 이미지 로드 안됨

```typescript
// 네트워크 탭에서 이미지 요청 확인
// 콘솔에서 에러 메시지 확인

// 이미지 URL 직접 확인
const testImageLoad = (url: string) => {
  const img = new Image();
  img.onload = () => console.log('✅ 이미지 로드 성공:', url);
  img.onerror = () => console.error('❌ 이미지 로드 실패:', url);
  img.src = url;
};
```

**해결책**:
- Supabase Storage 권한 확인
- 이미지 URL 유효성 확인
- CORS 설정 확인
- 네트워크 연결 확인

### 2. 이미지 크기가 너무 큼

**증상**: 페이지 로딩이 느리고 네트워크 사용량 높음

```typescript
// 이미지 크기 확인
const checkImageSize = async (url: string) => {
  const response = await fetch(url);
  const size = response.headers.get('content-length');
  console.log(`이미지 크기: ${(parseInt(size || '0') / 1024).toFixed(2)}KB`);
};

// 썸네일 우선 사용
const imageUrl = banner.thumbnail_url || banner.background_image_url;
```

**해결책**:
- 썸네일 백필 스크립트 실행
- 이미지 최적화 (WebP, 적절한 크기)
- CDN 사용

### 3. 백필 스크립트 실패

**증상**: `npm run backfill-thumbnails` 실행 시 에러

```bash
# 서비스 키 확인
echo $SUPABASE_SERVICE_KEY

# Sharp 설치 확인
npm list sharp

# 권한 확인
node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://your-project.supabase.co',
  process.env.SUPABASE_SERVICE_KEY
);
console.log('Supabase 클라이언트 생성 성공');
"
```

## 🎭 프론트엔드 문제

### 1. 무한 스크롤이 동작하지 않음

**증상**: 추가 배너가 로드되지 않음

```typescript
// IntersectionObserver 지원 확인
if (!('IntersectionObserver' in window)) {
  console.error('IntersectionObserver not supported');
}

// 센티널 요소 확인
const sentinelElement = document.querySelector('[data-sentinel]');
console.log('센티널 요소:', sentinelElement);

// 무한 스크롤 상태 확인
console.log('hasMore:', hasMore, 'loadingMore:', loadingMore);
```

**해결책**:
- 브라우저 호환성 확인
- 센티널 요소 위치 확인
- 스크롤 영역 높이 확인

### 2. 검색이 동작하지 않음

**증상**: 검색어 입력해도 결과 변경 안됨

```typescript
// 디바운스 동작 확인
useEffect(() => {
  console.log('검색어 변경:', searchTerm);
  console.log('디바운스된 검색어:', debouncedSearchTerm);
}, [searchTerm, debouncedSearchTerm]);

// 서버 요청 확인
console.log('필터:', { search_term: debouncedSearchTerm });
```

### 3. 레이아웃 시프트 발생

**증상**: 페이지 로딩 중 요소들이 움직임

```typescript
// CLS 점수 확인
import { layoutShiftMonitor } from './utils/layoutShiftObserver';
console.log('현재 CLS:', layoutShiftMonitor.getCumulativeScore());

// 이미지 aspect ratio 확인
const banner = { canvas_width: 1920, canvas_height: 1080 };
console.log('Aspect ratio:', `${banner.canvas_width}/${banner.canvas_height}`);
```

## 🚀 성능 문제

### 1. 페이지 로딩이 느림

**증상**: 첫 페이지 로드에 3초 이상 소요

```bash
# Lighthouse 성능 측정
npm run build
npx serve -s dist
# Chrome DevTools > Lighthouse 실행

# 번들 분석
npm install -g webpack-bundle-analyzer
npx vite-bundle-analyzer
```

**해결책**:
- 코드 스플리팅 적용
- 이미지 최적화
- 불필요한 의존성 제거
- CDN 사용

### 2. 메모리 사용량 증가

**증상**: 장시간 사용 시 브라우저 느려짐

```typescript
// 메모리 사용량 모니터링
const checkMemory = () => {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    console.log('메모리 사용량:', {
      used: Math.round(memory.usedJSHeapSize / 1048576) + ' MB',
      total: Math.round(memory.totalJSHeapSize / 1048576) + ' MB',
      limit: Math.round(memory.jsHeapSizeLimit / 1048576) + ' MB'
    });
  }
};

// AbortController 정리 확인
console.log('활성 AbortController:', abortControllersRef.current.size);
```

**해결책**:
- AbortController 정리
- 이벤트 리스너 해제
- 메모리 리크 확인

## 🔧 서버/배포 문제

### 1. Docker 빌드 실패

**증상**: `docker build` 실행 시 에러

```bash
# 단계별 빌드 확인
docker build --no-cache -t smart-image-editor .

# 특정 단계까지만 빌드
docker build --target builder -t smart-editor-builder .

# 빌드 로그 상세 확인
docker build --progress=plain -t smart-image-editor .
```

### 2. Nginx 설정 문제

**증상**: SPA 라우팅이 동작하지 않음 (404 에러)

```nginx
# nginx.conf 확인
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    # SPA 라우팅 지원 (중요!)
    location / {
        try_files $uri $uri/ /index.html;
    }
}

# 설정 테스트
nginx -t

# 설정 다시 로드
nginx -s reload
```

### 3. 환경변수 주입 안됨

**증상**: 컨테이너에서 환경변수 사용 불가

```bash
# 컨테이너 환경변수 확인
docker exec container_name env | grep VITE

# 빌드 시 환경변수 주입
docker build --build-arg VITE_SUPABASE_URL=https://your-project.supabase.co .

# 런타임 환경변수 주입
docker run -e VITE_SUPABASE_URL=https://your-project.supabase.co smart-image-editor
```

## 📊 모니터링 & 로그

### 1. 로그가 기록되지 않음

```bash
# PM2 로그 확인
pm2 logs smart-image-editor

# 로그 파일 권한 확인
ls -la logs/
sudo chown -R $USER:$USER logs/

# Systemd 로그 확인
journalctl -u smart-editor -f
```

### 2. 성능 메트릭 수집 안됨

```typescript
// 성능 API 지원 확인
if ('performance' in window) {
  console.log('Performance API 지원됨');
} else {
  console.warn('Performance API 미지원');
}

// Sentry 연결 확인
if (window.Sentry) {
  console.log('Sentry 연결됨');
} else {
  console.warn('Sentry 미연결');
}
```

## 🆘 긴급 상황 대응

### 1. 서비스 중단 시

```bash
# 1. 즉시 롤백 (기능 플래그)
# 환경변수 변경
VITE_FEATURE_BANNER_HISTORY_CURSOR=false

# 2. 이전 버전으로 롤백
git checkout main
docker build -t smart-image-editor .
docker stop smart-editor
docker run -d --name smart-editor -p 80:80 smart-image-editor

# 3. 로드밸런서에서 트래픽 차단 (있는 경우)
```

### 2. 데이터베이스 문제 시

```sql
-- 읽기 전용 모드 확인
SHOW default_transaction_read_only;

-- 연결 수 확인
SELECT count(*) FROM pg_stat_activity;

-- 느린 쿼리 확인
SELECT query, state, query_start 
FROM pg_stat_activity 
WHERE state != 'idle' 
ORDER BY query_start;
```

### 3. 대용량 트래픽 대응

```bash
# nginx 연결 제한
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req zone=api burst=20 nodelay;

# 정적 파일 캐싱 강화
location /assets/ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# CDN 활성화 (Cloudflare 등)
```

## 📞 지원 연락처

- **긴급 상황**: [운영팀 연락처]
- **기술 문의**: [개발팀 연락처]  
- **인프라 문의**: [DevOps팀 연락처]

## 📚 추가 자료

- [Supabase 문서](https://supabase.com/docs)
- [React 문서](https://react.dev)
- [Vite 문서](https://vitejs.dev)
- [Docker 문서](https://docs.docker.com)
