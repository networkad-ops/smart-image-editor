-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create teams table (담당사업팀)
CREATE TABLE IF NOT EXISTS teams (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6', -- 팀 색상 (hex)
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
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
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create banners table (배너)
CREATE TABLE IF NOT EXISTS banners (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    banner_type VARCHAR(50) NOT NULL CHECK (banner_type IN ('basic-no-logo', 'basic-with-logo', 'splash', 'event')),
    device_type VARCHAR(20) NOT NULL CHECK (device_type IN ('pc', 'mobile')),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'review', 'approved', 'rejected', 'completed')),
    image_url TEXT NOT NULL,
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
    image_url TEXT NOT NULL,
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
CREATE INDEX IF NOT EXISTS idx_teams_user_id ON teams(user_id);
CREATE INDEX IF NOT EXISTS idx_teams_created_at ON teams(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_projects_team_id ON projects(team_id);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_priority ON projects(priority);
CREATE INDEX IF NOT EXISTS idx_projects_deadline ON projects(deadline);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_banners_project_id ON banners(project_id);
CREATE INDEX IF NOT EXISTS idx_banners_status ON banners(status);
CREATE INDEX IF NOT EXISTS idx_banners_banner_type ON banners(banner_type);
CREATE INDEX IF NOT EXISTS idx_banners_device_type ON banners(device_type);
CREATE INDEX IF NOT EXISTS idx_banners_created_at ON banners(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_banners_tags ON banners USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_banner_history_banner_id ON banner_history(banner_id);
CREATE INDEX IF NOT EXISTS idx_banner_history_version ON banner_history(banner_id, version);

CREATE INDEX IF NOT EXISTS idx_banner_comments_banner_id ON banner_comments(banner_id);
CREATE INDEX IF NOT EXISTS idx_banner_comments_user_id ON banner_comments(user_id);

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES 
    ('banner-images', 'banner-images', true),
    ('logos', 'logos', true),
    ('thumbnails', 'thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- Set up Row Level Security (RLS)
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE banner_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE banner_comments ENABLE ROW LEVEL SECURITY;

-- Create policies for teams
CREATE POLICY "Users can view their own teams" ON teams
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create teams" ON teams
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own teams" ON teams
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own teams" ON teams
    FOR DELETE USING (auth.uid() = user_id);

-- Create policies for projects
CREATE POLICY "Users can view projects of their teams" ON projects
    FOR SELECT USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM teams 
            WHERE teams.id = projects.team_id 
            AND teams.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create projects" ON projects
    FOR INSERT WITH CHECK (
        auth.uid() = user_id OR
        (team_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM teams 
            WHERE teams.id = projects.team_id 
            AND teams.user_id = auth.uid()
        ))
    );

CREATE POLICY "Users can update projects of their teams" ON projects
    FOR UPDATE USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM teams 
            WHERE teams.id = projects.team_id 
            AND teams.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete projects of their teams" ON projects
    FOR DELETE USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM teams 
            WHERE teams.id = projects.team_id 
            AND teams.user_id = auth.uid()
        )
    );

-- Create policies for banners
CREATE POLICY "Users can view banners of their projects" ON banners
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects p
            LEFT JOIN teams t ON p.team_id = t.id
            WHERE p.id = banners.project_id 
            AND (p.user_id = auth.uid() OR t.user_id = auth.uid())
        )
    );

CREATE POLICY "Users can create banners for their projects" ON banners
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects p
            LEFT JOIN teams t ON p.team_id = t.id
            WHERE p.id = banners.project_id 
            AND (p.user_id = auth.uid() OR t.user_id = auth.uid())
        )
    );

CREATE POLICY "Users can update banners of their projects" ON banners
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM projects p
            LEFT JOIN teams t ON p.team_id = t.id
            WHERE p.id = banners.project_id 
            AND (p.user_id = auth.uid() OR t.user_id = auth.uid())
        )
    );

CREATE POLICY "Users can delete banners of their projects" ON banners
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM projects p
            LEFT JOIN teams t ON p.team_id = t.id
            WHERE p.id = banners.project_id 
            AND (p.user_id = auth.uid() OR t.user_id = auth.uid())
        )
    );

-- Create policies for banner_history
CREATE POLICY "Users can view banner history of their projects" ON banner_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM banners b
            JOIN projects p ON b.project_id = p.id
            LEFT JOIN teams t ON p.team_id = t.id
            WHERE b.id = banner_history.banner_id 
            AND (p.user_id = auth.uid() OR t.user_id = auth.uid())
        )
    );

CREATE POLICY "Users can create banner history for their projects" ON banner_history
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM banners b
            JOIN projects p ON b.project_id = p.id
            LEFT JOIN teams t ON p.team_id = t.id
            WHERE b.id = banner_history.banner_id 
            AND (p.user_id = auth.uid() OR t.user_id = auth.uid())
        )
    );

-- Create policies for banner_comments
CREATE POLICY "Users can view comments on banners of their projects" ON banner_comments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM banners b
            JOIN projects p ON b.project_id = p.id
            LEFT JOIN teams t ON p.team_id = t.id
            WHERE b.id = banner_comments.banner_id 
            AND (p.user_id = auth.uid() OR t.user_id = auth.uid())
        )
    );

CREATE POLICY "Users can create comments on banners of their projects" ON banner_comments
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM banners b
            JOIN projects p ON b.project_id = p.id
            LEFT JOIN teams t ON p.team_id = t.id
            WHERE b.id = banner_comments.banner_id 
            AND (p.user_id = auth.uid() OR t.user_id = auth.uid())
        )
    );

CREATE POLICY "Users can update their own comments" ON banner_comments
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON banner_comments
    FOR DELETE USING (auth.uid() = user_id);

-- Storage policies
CREATE POLICY "Anyone can view banner images" ON storage.objects
    FOR SELECT USING (bucket_id IN ('banner-images', 'logos', 'thumbnails'));

CREATE POLICY "Authenticated users can upload files" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id IN ('banner-images', 'logos', 'thumbnails') AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their files" ON storage.objects
    FOR UPDATE USING (bucket_id IN ('banner-images', 'logos', 'thumbnails') AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their files" ON storage.objects
    FOR DELETE USING (bucket_id IN ('banner-images', 'logos', 'thumbnails') AND auth.role() = 'authenticated');

-- Create functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create function to automatically create banner history
CREATE OR REPLACE FUNCTION create_banner_history()
RETURNS TRIGGER AS $$
BEGIN
    -- 업데이트 시에만 히스토리 생성
    IF TG_OP = 'UPDATE' AND (
        OLD.title != NEW.title OR 
        OLD.image_url != NEW.image_url OR 
        OLD.logo_url != NEW.logo_url OR 
        OLD.text_elements != NEW.text_elements
    ) THEN
        INSERT INTO banner_history (
            banner_id, version, title, image_url, logo_url, text_elements, notes
        ) VALUES (
            OLD.id, OLD.version, OLD.title, OLD.image_url, OLD.logo_url, OLD.text_elements, 
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
CREATE TRIGGER update_teams_updated_at 
    BEFORE UPDATE ON teams 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at 
    BEFORE UPDATE ON projects 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_banners_updated_at 
    BEFORE UPDATE ON banners 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_banner_comments_updated_at 
    BEFORE UPDATE ON banner_comments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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