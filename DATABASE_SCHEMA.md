# 🗄️ Smart Image Editor - Database Schema

## 📋 **데이터베이스 개요**
- **데이터베이스**: PostgreSQL (Supabase)
- **인증**: Supabase Auth (현재 비활성화 - 개발용)
- **스토리지**: Supabase Storage (공개 버킷)
- **언어**: SQL + PL/pgSQL

---

## 🏗️ **테이블 구조**

### 1. **teams** (담당 사업팀)
```sql
CREATE TABLE teams (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6',  -- 팀 색상 (hex)
    user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. **projects** (프로젝트/담당자)
```sql
CREATE TABLE projects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    manager_name VARCHAR(100),           -- 담당자명
    manager_email VARCHAR(255),          -- 담당자 이메일
    manager_phone VARCHAR(20),           -- 담당자 전화번호
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'on_hold', 'cancelled')),
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    deadline DATE,                       -- 프로젝트 마감일
    user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3. **banners** ⭐ (메인 배너 테이블)
```sql
CREATE TABLE banners (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    banner_type VARCHAR(50) NOT NULL,    -- 제약 조건 없음 (유연한 타입)
    device_type VARCHAR(20) NOT NULL CHECK (device_type IN ('pc', 'mobile')),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'review', 'approved', 'rejected', 'completed')),
    
    -- 이미지 URLs
    background_image_url TEXT NOT NULL, -- 배경 이미지
    logo_url TEXT,                      -- 단일 로고
    logo_urls TEXT[],                   -- 다중 로고 (항공팀용)
    final_banner_url TEXT,              -- 최종 완성 배너
    thumbnail_url TEXT,                 -- 썸네일 (320x320)
    
    -- 캔버스 & 텍스트
    text_elements JSONB NOT NULL DEFAULT '[]',  -- 텍스트 요소들
    canvas_width INTEGER NOT NULL,
    canvas_height INTEGER NOT NULL,
    
    -- 메타데이터
    version INTEGER DEFAULT 1,          -- 배너 버전
    tags TEXT[],                        -- 태그 배열
    notes TEXT,                         -- 작업 노트
    approved_by VARCHAR(100),           -- 승인자
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 4. **banner_history** (배너 버전 히스토리)
```sql
CREATE TABLE banner_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    banner_id UUID REFERENCES banners(id) ON DELETE CASCADE NOT NULL,
    version INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    background_image_url TEXT,
    logo_url TEXT,
    text_elements JSONB NOT NULL DEFAULT '[]',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 5. **banner_comments** (배너 댓글/피드백)
```sql
CREATE TABLE banner_comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    banner_id UUID REFERENCES banners(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    x_position INTEGER,                 -- 댓글 위치 (선택사항)
    y_position INTEGER,                 -- 댓글 위치 (선택사항)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 📁 **Storage Buckets**

```sql
-- 이미지 저장용 버킷들
INSERT INTO storage.buckets (id, name, public) VALUES 
    ('banner-images', 'banner-images', true),    -- 배경 이미지
    ('logos', 'logos', true),                    -- 로고 이미지
    ('thumbnails', 'thumbnails', true),          -- 썸네일 (320x320)
    ('final-banners', 'final-banners', true);    -- 최종 완성 배너
```

---

## 🚀 **성능 최적화 인덱스**

### **커서 페이지네이션 최적화**
```sql
-- 메인 커서 인덱스 (최신순 정렬)
CREATE INDEX idx_banners_created_id ON banners (created_at DESC, id DESC);

-- 검색 최적화 (GIN 인덱스)
CREATE INDEX idx_banners_title_search ON banners USING gin (title gin_trgm_ops);
CREATE INDEX idx_banners_description_search ON banners USING gin (description gin_trgm_ops);

-- 필터링 최적화
CREATE INDEX idx_banners_banner_type ON banners (banner_type);
CREATE INDEX idx_banners_device_type ON banners (device_type);
CREATE INDEX idx_banners_status_created_id ON banners (status, created_at DESC, id DESC);

-- 복합 필터 최적화
CREATE INDEX idx_banners_type_device_created ON banners (banner_type, device_type, created_at DESC, id DESC);
CREATE INDEX idx_banners_project_created ON banners (project_id, created_at DESC, id DESC);

-- 썸네일 존재 여부 확인
CREATE INDEX idx_banners_thumbnail_exists ON banners (thumbnail_url) WHERE thumbnail_url IS NOT NULL;
```

---

## 🔧 **핵심 함수들**

### **배너 히스토리 자동 생성**
```sql
CREATE OR REPLACE FUNCTION create_banner_history()
RETURNS TRIGGER AS $$
BEGIN
    -- 업데이트 시에만 히스토리 생성
    IF TG_OP = 'UPDATE' AND (
        OLD.title != NEW.title OR 
        OLD.background_image_url != NEW.background_image_url OR 
        OLD.logo_url != NEW.logo_url OR 
        OLD.text_elements != NEW.text_elements
    ) THEN
        INSERT INTO banner_history (
            banner_id, version, title, background_image_url, logo_url, text_elements, notes
        ) VALUES (
            OLD.id, OLD.version, OLD.title, OLD.background_image_url, OLD.logo_url, OLD.text_elements, 
            'Auto-saved version ' || OLD.version
        );
        
        -- 새 버전 번호 증가
        NEW.version = OLD.version + 1;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 생성
CREATE TRIGGER create_banner_history_trigger
    BEFORE UPDATE ON banners
    FOR EACH ROW EXECUTE FUNCTION create_banner_history();
```

### **프로젝트 통계 함수**
```sql
CREATE OR REPLACE FUNCTION get_project_stats(project_uuid UUID)
RETURNS TABLE (
    total_banners INTEGER,
    draft_banners INTEGER,
    completed_banners INTEGER,
    in_progress_banners INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_banners,
        COUNT(*) FILTER (WHERE status = 'draft')::INTEGER as draft_banners,
        COUNT(*) FILTER (WHERE status = 'completed')::INTEGER as completed_banners,
        COUNT(*) FILTER (WHERE status = 'in_progress')::INTEGER as in_progress_banners
    FROM banners 
    WHERE project_id = project_uuid;
END;
$$ language 'plpgsql';
```

---

## 📊 **편의 뷰**

### **프로젝트 개요 뷰**
```sql
CREATE OR REPLACE VIEW project_overview AS
SELECT 
    p.id,
    p.name,
    p.description,
    p.manager_name,
    p.manager_email,
    p.status,
    p.priority,
    p.deadline,
    p.created_at,
    p.updated_at,
    t.name as team_name,
    t.color as team_color,
    COUNT(b.id) as total_banners,
    COUNT(b.id) FILTER (WHERE b.status = 'completed') as completed_banners,
    COUNT(b.id) FILTER (WHERE b.status = 'draft') as draft_banners,
    COUNT(b.id) FILTER (WHERE b.status = 'in_progress') as in_progress_banners
FROM projects p
LEFT JOIN teams t ON p.team_id = t.id
LEFT JOIN banners b ON p.id = b.project_id
GROUP BY p.id, p.name, p.description, p.manager_name, p.manager_email, 
         p.status, p.priority, p.deadline, p.created_at, p.updated_at,
         t.name, t.color;
```

### **배너 개요 뷰**
```sql
CREATE OR REPLACE VIEW banner_overview AS
SELECT 
    b.id,
    b.title,
    b.description,
    b.banner_type,
    b.device_type,
    b.status,
    b.version,
    b.tags,
    b.approved_by,
    b.approved_at,
    b.created_at,
    b.updated_at,
    p.name as project_name,
    p.manager_name,
    t.name as team_name,
    t.color as team_color,
    COUNT(bc.id) as comment_count
FROM banners b
JOIN projects p ON b.project_id = p.id
LEFT JOIN teams t ON p.team_id = t.id
LEFT JOIN banner_comments bc ON b.id = bc.banner_id
GROUP BY b.id, b.title, b.description, b.banner_type, b.device_type, 
         b.status, b.version, b.tags, b.approved_by, b.approved_at,
         b.created_at, b.updated_at, p.name, p.manager_name, t.name, t.color;
```

---

## 🔐 **보안 설정 (현재: 개발용 공개 설정)**

```sql
-- RLS 비활성화 (개발/테스트용)
ALTER TABLE teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE banners DISABLE ROW LEVEL SECURITY;
ALTER TABLE banner_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE banner_comments DISABLE ROW LEVEL SECURITY;

-- 공개 접근 정책
CREATE POLICY "Allow anonymous access" ON teams FOR ALL USING (true);
CREATE POLICY "Allow anonymous access" ON projects FOR ALL USING (true);
CREATE POLICY "Allow anonymous access" ON banners FOR ALL USING (true);
CREATE POLICY "Allow anonymous access" ON banner_history FOR ALL USING (true);
CREATE POLICY "Allow anonymous access" ON banner_comments FOR ALL USING (true);

-- Storage 공개 정책
CREATE POLICY "Allow public access" ON storage.objects FOR ALL USING (true);
```

---

## 📈 **API 엔드포인트 구조**

### **배너 목록 (커서 페이지네이션)**
```typescript
// GET /rest/v1/banners?select=id,title,thumbnail_url,canvas_width,canvas_height,created_at
// &order=created_at.desc,id.desc&limit=30

interface BannerListItem {
  id: string;
  title: string;
  thumbnail_url: string | null;
  canvas_width: number;
  canvas_height: number;
  created_at: string;
}

interface BannerListResponse {
  items: BannerListItem[];
  nextCursor?: {
    created_at: string;
    id: string;
  };
}
```

### **배너 상세 정보**
```typescript
// GET /rest/v1/banners?select=*,projects(*,teams(*)),banner_comments(*)&eq.id={bannerId}

interface BannerDetail {
  id: string;
  title: string;
  description: string;
  banner_type: string;
  device_type: 'pc' | 'mobile';
  status: string;
  background_image_url: string;
  logo_url?: string;
  logo_urls?: string[];
  final_banner_url?: string;
  thumbnail_url?: string;
  text_elements: TextElement[];
  canvas_width: number;
  canvas_height: number;
  version: number;
  tags: string[];
  notes?: string;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
  projects: {
    name: string;
    manager_name?: string;
    teams?: {
      name: string;
      color: string;
    };
  };
  banner_comments: Comment[];
}
```

---

## 🛠️ **마이그레이션 파일들**

1. **`schema.sql`**: 초기 스키마 생성
2. **`migration_002_update_banner_urls.sql`**: URL 구조 업데이트
3. **`migration_003_remove_banner_type_constraint.sql`**: banner_type 제약 해제
4. **`migration_004_optimize_cursor_pagination.sql`**: 성능 최적화 인덱스
5. **`migration_005_fix_status_index.sql`**: status 인덱스 정리

---

## 📦 **연동 시 필요한 환경변수**

```bash
# Supabase 설정
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# 성능 설정
VITE_IMG_CONCURRENCY=6                    # 동시 이미지 로딩 수
VITE_FEATURE_BANNER_HISTORY_CURSOR=true   # 커서 페이지네이션 활성화
```

---

## 🚀 **배포 시 체크리스트**

1. **데이터베이스 설정**
   - [ ] 스키마 생성 (`schema.sql`)
   - [ ] 마이그레이션 실행 (002 → 005)
   - [ ] 인덱스 생성 확인
   - [ ] Storage 버킷 생성

2. **성능 최적화**
   - [ ] 썸네일 백필 스크립트 실행
   - [ ] 통계 정보 업데이트 (`ANALYZE`)
   - [ ] 인덱스 사용률 확인

3. **보안 설정** (프로덕션용)
   - [ ] RLS 활성화
   - [ ] 적절한 정책 설정
   - [ ] API 키 보안 강화

---

**📞 문의사항이나 추가 정보가 필요하시면 언제든 연락주세요!**
