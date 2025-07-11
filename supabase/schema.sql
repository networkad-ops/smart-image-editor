-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create teams table (담당사업팀)
CREATE TABLE IF NOT EXISTS teams (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6', -- 팀 색상 (hex)
    user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create projects table (프로젝트/담당자)
CREATE TABLE IF NOT EXISTS projects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    manager_name VARCHAR(100), -- 담당자명
    manager_email VARCHAR(255), -- 담당자 이메일
    manager_phone VARCHAR(20), -- 담당자 전화번호
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'on_hold', 'cancelled')),
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    deadline DATE, -- 프로젝트 마감일
    user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create banners table (배너)
CREATE TABLE IF NOT EXISTS banners (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    banner_type VARCHAR(50) NOT NULL CHECK (banner_type IN ('basic-no-logo', 'basic-with-logo', 'event', 'interactive', 'fullscreen', 'airline')),
    device_type VARCHAR(20) NOT NULL CHECK (device_type IN ('pc', 'mobile')),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'review', 'approved', 'rejected', 'completed')),
    background_image_url TEXT,
    logo_url TEXT,
    text_elements JSONB NOT NULL DEFAULT '[]',
    canvas_width INTEGER NOT NULL,
    canvas_height INTEGER NOT NULL,
    version INTEGER DEFAULT 1, -- 배너 버전
    tags TEXT[], -- 태그 배열
    notes TEXT, -- 작업 노트
    approved_by VARCHAR(100), -- 승인자
    approved_at TIMESTAMP WITH TIME ZONE, -- 승인 시간
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create banner_history table (배너 버전 히스토리)
CREATE TABLE IF NOT EXISTS banner_history (
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

-- Create banner_comments table (배너 댓글/피드백)
CREATE TABLE IF NOT EXISTS banner_comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    banner_id UUID REFERENCES banners(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    x_position INTEGER, -- 댓글 위치 (선택사항)
    y_position INTEGER, -- 댓글 위치 (선택사항)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create comprehensive indexes for better performance
CREATE INDEX IF NOT EXISTS idx_teams_created_at ON teams(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_team_id ON projects(team_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_banners_project_id ON banners(project_id);
CREATE INDEX IF NOT EXISTS idx_banners_status ON banners(status);
CREATE INDEX IF NOT EXISTS idx_banners_created_at ON banners(created_at DESC);

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES 
    ('banner-images', 'banner-images', true),
    ('logos', 'logos', true),
    ('thumbnails', 'thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- Functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers
CREATE TRIGGER update_teams_updated_at 
    BEFORE UPDATE ON teams 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at 
    BEFORE UPDATE ON projects 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_banners_updated_at 
    BEFORE UPDATE ON banners 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS 완전 비활성화 (인증 없이 접근 가능)
ALTER TABLE teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE banners DISABLE ROW LEVEL SECURITY;

-- Storage 정책 (공개 접근 허용)
CREATE POLICY "Public Access" ON storage.objects FOR ALL USING (true);
CREATE POLICY "Public Upload" ON storage.objects FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update" ON storage.objects FOR UPDATE USING (true);
CREATE POLICY "Public Delete" ON storage.objects FOR DELETE USING (true);

-- Create functions
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

-- Create function to get project statistics
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

-- Create triggers
CREATE TRIGGER create_banner_history_trigger
    BEFORE UPDATE ON banners
    FOR EACH ROW EXECUTE FUNCTION create_banner_history();

-- Create views for easier querying
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

-- 임시 공개 정책 추가 (개발/테스트용)
CREATE POLICY "Allow anonymous access to teams" ON teams
    FOR ALL USING (true);

CREATE POLICY "Allow anonymous access to projects" ON projects
    FOR ALL USING (true);

CREATE POLICY "Allow anonymous access to banners" ON banners
    FOR ALL USING (true);

CREATE POLICY "Allow anonymous access to banner_history" ON banner_history
    FOR ALL USING (true);

CREATE POLICY "Allow anonymous access to banner_comments" ON banner_comments
    FOR ALL USING (true);

-- Storage 정책도 공개로 설정
CREATE POLICY "Allow public access to banner-images" ON storage.objects
    FOR ALL USING (bucket_id = 'banner-images');

CREATE POLICY "Allow public access to logos" ON storage.objects
    FOR ALL USING (bucket_id = 'logos');

CREATE POLICY "Allow public access to thumbnails" ON storage.objects
    FOR ALL USING (bucket_id = 'thumbnails'); 