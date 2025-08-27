# 🚀 Smart Image Editor 운영 가이드

## 📋 실행 환경

### 언어/프레임워크 버전 확인

```bash
# Node.js 버전 확인
node --version
# v18.17.0 이상 권장

# npm 버전 확인
npm --version
# 9.0.0 이상 권장

# 프로젝트 의존성 확인
cat package.json | grep -A 20 '"dependencies"'

# 현재 설치된 패키지 확인
npm list --depth=0
```

### 필요한 라이브러리 목록

**운영 의존성 (package.json)**
```json
{
  "dependencies": {
    "@headlessui/react": "^1.7.17",
    "@heroicons/react": "^2.0.18", 
    "@supabase/supabase-js": "^2.50.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "tailwindcss": "^3.3.0"
  },
  "devDependencies": {
    "sharp": "^0.33.0",
    "tsx": "^4.7.0",
    "node-fetch": "^3.3.2",
    "vite": "^5.0.0",
    "typescript": "^5.0.0"
  }
}
```

**시스템 요구사항**
```bash
# 최소 사양
CPU: 2 cores
RAM: 4GB
Storage: 10GB
Node.js: >= 18.17.0
npm: >= 9.0.0

# 권장 사양
CPU: 4 cores
RAM: 8GB
Storage: 20GB
```

## 🚀 배포 & 실행

### 로컬 개발 실행
```bash
# 의존성 설치
npm install

# 환경변수 설정
cp env.example .env
# .env 파일 편집하여 실제 값 입력

# 개발 서버 실행
npm run dev
# → http://localhost:3000

# 프로덕션 빌드
npm run build

# 빌드 결과 미리보기
npm run preview
```

### 프로덕션 서버 실행
```bash
# 1. 프로덕션 빌드
npm run build

# 2. 정적 파일 서버 실행 (예: serve)
npx serve -s dist -l 3000

# 또는 nginx/apache로 dist 폴더 서빙
```

### Dockerfile 작성 예시

**Dockerfile**
```dockerfile
# Multi-stage build for production
FROM node:18-alpine AS builder

# 작업 디렉토리 설정
WORKDIR /app

# package files 복사
COPY package*.json ./

# 의존성 설치 (production + dev for build)
RUN npm ci

# 소스 코드 복사
COPY . .

# 환경변수 파일 복사 (빌드 시에만 필요)
COPY env.production .env.production

# 프로덕션 빌드
RUN npm run build

# Production stage
FROM nginx:alpine

# 빌드된 파일을 nginx로 복사
COPY --from=builder /app/dist /usr/share/nginx/html

# nginx 설정 파일 복사 (SPA 라우팅 지원)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 포트 노출
EXPOSE 80

# nginx 실행
CMD ["nginx", "-g", "daemon off;"]
```

**nginx.conf (SPA 라우팅 지원)**
```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # SPA 라우팅 지원
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 정적 파일 캐싱
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # 압축 설정
    gzip on;
    gzip_types text/css application/javascript application/json;
}
```

**Docker 실행 명령어**
```bash
# 이미지 빌드
docker build -t smart-image-editor .

# 컨테이너 실행
docker run -d \
  --name smart-editor \
  -p 80:80 \
  --restart unless-stopped \
  smart-image-editor

# 컨테이너 로그 확인
docker logs smart-editor -f
```

### 서버에서 백그라운드 실행 & 자동 재시작

**PM2 사용 (Node.js 앱용)**
```bash
# PM2 전역 설치
npm install -g pm2

# PM2 설정 파일 생성
# ecosystem.config.js
module.exports = {
  apps: [{
    name: 'smart-image-editor',
    script: 'npx serve -s dist -l 3000',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};

# PM2로 실행
pm2 start ecosystem.config.js

# 시스템 재시작 시 자동 실행 설정
pm2 startup
pm2 save
```

**Systemd 사용 (Linux)**
```bash
# /etc/systemd/system/smart-editor.service
[Unit]
Description=Smart Image Editor
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/smart-editor
ExecStart=/usr/bin/node /usr/bin/serve -s dist -l 3000
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target

# 서비스 등록 및 실행
sudo systemctl enable smart-editor
sudo systemctl start smart-editor
sudo systemctl status smart-editor
```

## 🔐 환경변수 & 보안

### .env 파일 관리

**환경별 파일 구성**
```bash
.env.example        # 템플릿 (공개)
.env.local          # 로컬 개발용
.env.staging        # 스테이징용
.env.production     # 프로덕션용 (비공개)
```

**환경변수 로드 우선순위**
```bash
1. .env.production (프로덕션)
2. .env.local (로컬)
3. .env (기본값)
4. .env.example (템플릿)
```

### API 키·비밀번호 안전 관리

**방법 1: 서버 환경변수**
```bash
# 서버에서 직접 설정
export VITE_SUPABASE_URL="https://your-project.supabase.co"
export VITE_SUPABASE_ANON_KEY="your-anon-key"
export SUPABASE_SERVICE_KEY="your-service-key"

# Docker 환경변수
docker run -d \
  -e VITE_SUPABASE_URL="https://your-project.supabase.co" \
  -e VITE_SUPABASE_ANON_KEY="your-anon-key" \
  smart-image-editor
```

**방법 2: Docker Secrets**
```bash
# secrets.txt 파일 생성
echo "your-service-key" | docker secret create supabase_service_key -

# docker-compose.yml에서 사용
version: '3.8'
services:
  app:
    image: smart-image-editor
    secrets:
      - supabase_service_key
    environment:
      - SUPABASE_SERVICE_KEY_FILE=/run/secrets/supabase_service_key

secrets:
  supabase_service_key:
    external: true
```

**방법 3: HashiCorp Vault / AWS Secrets Manager**
```bash
# AWS CLI로 시크릿 생성
aws secretsmanager create-secret \
  --name "smart-editor/supabase" \
  --secret-string '{"service_key":"your-key","anon_key":"your-anon-key"}'

# 앱에서 시크릿 조회
aws secretsmanager get-secret-value \
  --secret-id "smart-editor/supabase" \
  --query SecretString --output text
```

## 📊 로그 관리

### 실행 로그 파일 저장

**PM2 로그 설정**
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'smart-image-editor',
    script: 'serve',
    args: '-s dist -l 3000',
    
    // 로그 설정
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    
    // 로그 로테이션
    log_date_format: 'YYYY-MM-DD HH:mm Z',
    merge_logs: true,
    
    // 로그 파일 크기 제한
    max_memory_restart: '1G'
  }]
};
```

**Nginx 액세스 로그**
```nginx
# nginx.conf
server {
    # 액세스 로그
    access_log /var/log/nginx/smart-editor.access.log combined;
    error_log /var/log/nginx/smart-editor.error.log warn;
    
    # 로그 포맷 커스터마이징
    log_format detailed '$remote_addr - $remote_user [$time_local] '
                       '"$request" $status $body_bytes_sent '
                       '"$http_referer" "$http_user_agent" '
                       '$request_time $upstream_response_time';
    
    access_log /var/log/nginx/smart-editor.detailed.log detailed;
}
```

### stdout/stderr 로그 분리

**Docker 로그 분리**
```bash
# 컨테이너 실행 시 로그 드라이버 설정
docker run -d \
  --log-driver=json-file \
  --log-opt max-size=10m \
  --log-opt max-file=3 \
  smart-image-editor

# 로그 확인
docker logs smart-editor 2>/dev/null          # stdout만
docker logs smart-editor 1>/dev/null          # stderr만
docker logs smart-editor > out.log 2> err.log # 분리 저장
```

**Systemd 로그 분리**
```bash
# /etc/systemd/system/smart-editor.service
[Service]
StandardOutput=file:/var/log/smart-editor/stdout.log
StandardError=file:/var/log/smart-editor/stderr.log

# journalctl로 로그 확인
journalctl -u smart-editor -f                # 실시간
journalctl -u smart-editor --since today     # 오늘 로그
journalctl -u smart-editor -p err            # 에러만
```

**로그 로테이션 설정**
```bash
# /etc/logrotate.d/smart-editor
/var/log/smart-editor/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    copytruncate
    postrotate
        systemctl reload smart-editor
    endscript
}
```

## ✅ 최종 점검

### 서버 배포 전 체크리스트

**코드 품질 체크**
- [ ] TypeScript 컴파일 에러 없음 (`npm run build`)
- [ ] ESLint 경고 해결 (`npm run lint`)
- [ ] 테스트 통과 (`npm test`)
- [ ] 보안 취약점 검사 (`npm audit`)

**환경 설정 체크**
- [ ] 프로덕션 환경변수 설정 완료
- [ ] API 키 및 시크릿 안전하게 설정
- [ ] 도메인 및 CORS 설정 확인
- [ ] SSL 인증서 설정 (HTTPS)

**성능 체크**
- [ ] Lighthouse 성능 점수 > 90
- [ ] 번들 크기 최적화 확인
- [ ] 이미지 최적화 적용
- [ ] CDN 설정 (선택사항)

**모니터링 설정**
- [ ] 로그 수집 설정
- [ ] 에러 모니터링 (Sentry 등)
- [ ] 업타임 모니터링
- [ ] 알림 설정 (Slack, 이메일)

**백업 및 복구**
- [ ] 데이터베이스 백업 설정
- [ ] 배포 롤백 계획 수립
- [ ] 재해 복구 계획

### 개발자 친화적 문서화

**README.md 구조**
```markdown
# Smart Image Editor

## 🚀 빠른 시작
- 설치 방법
- 실행 방법
- 기본 사용법

## 📁 프로젝트 구조
- 디렉토리 설명
- 주요 파일 역할

## 🛠 개발 가이드
- 로컬 개발 환경 설정
- 코드 스타일 가이드
- 커밋 컨벤션

## 🚀 배포 가이드
- 환경별 배포 방법
- 환경변수 설정
- 트러블슈팅

## 📚 API 문서
- 주요 함수/컴포넌트 설명
- 타입 정의
- 예제 코드
```

**코드 문서화**
```typescript
/**
 * 배너 히스토리 페이지 컴포넌트
 * 커서 기반 페이지네이션으로 성능 최적화
 * 
 * @param onBannerEdit - 배너 편집 콜백
 * @param onBack - 뒤로가기 콜백
 * @param onGoHome - 홈 이동 콜백
 * 
 * @example
 * ```tsx
 * <BannerHistory
 *   onBannerEdit={(banner) => setSelectedBanner(banner)}
 *   onBack={() => navigate(-1)}
 *   onGoHome={() => navigate('/')}
 * />
 * ```
 */
export const BannerHistory: React.FC<BannerHistoryProps> = ({
  onBannerEdit,
  onBack,
  onGoHome
}) => {
  // 구현...
};
```

**운영 문서**
- `OPERATIONS_GUIDE.md` (이 문서)
- `DEPLOYMENT_CHECKLIST.md` (배포 체크리스트)
- `TROUBLESHOOTING.md` (문제 해결 가이드)
- `PERFORMANCE_GUIDE.md` (성능 최적화 가이드)

**변경 이력 관리**
```markdown
# CHANGELOG.md

## [2.0.0] - 2024-01-XX
### 추가
- 커서 기반 페이지네이션
- 썸네일 최적화 시스템
- 레이아웃 시프트 모니터링

### 변경
- 배너 히스토리 UI 그리드로 변경
- 성능 개선 (로딩 시간 80% 단축)

### 수정
- 이미지 4배 크기 버그 수정
```

이제 프로덕션 환경에서 안정적으로 운영할 수 있는 모든 가이드가 준비되었습니다! 🚀
