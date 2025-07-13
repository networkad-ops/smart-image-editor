-- Migration: Update banner URLs structure
-- 기존 데이터를 보존하면서 새로운 필드 추가

-- 1. 새로운 컬럼들 추가
ALTER TABLE banners 
ADD COLUMN IF NOT EXISTS background_image_url TEXT,
ADD COLUMN IF NOT EXISTS final_banner_url TEXT,
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
ADD COLUMN IF NOT EXISTS logo_urls TEXT[]; -- 다중 로고 URLs 추가

-- 2. 기존 데이터 마이그레이션
-- image_url의 데이터를 background_image_url로 복사
UPDATE banners 
SET background_image_url = image_url 
WHERE background_image_url IS NULL;

-- 3. background_image_url을 NOT NULL로 변경
ALTER TABLE banners 
ALTER COLUMN background_image_url SET NOT NULL;

-- 4. 기존 image_url 컬럼 제거 (선택사항 - 나중에 실행)
-- ALTER TABLE banners DROP COLUMN image_url;

-- 5. banner_history 테이블도 동일하게 업데이트
ALTER TABLE banner_history 
ADD COLUMN IF NOT EXISTS background_image_url TEXT,
ADD COLUMN IF NOT EXISTS final_banner_url TEXT,
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
ADD COLUMN IF NOT EXISTS logo_urls TEXT[]; -- 다중 로고 URLs 추가

-- 기존 히스토리 데이터 마이그레이션
UPDATE banner_history 
SET background_image_url = image_url 
WHERE background_image_url IS NULL;

-- 6. 히스토리 함수 업데이트
CREATE OR REPLACE FUNCTION create_banner_history()
RETURNS TRIGGER AS $$
BEGIN
    -- 업데이트 시에만 히스토리 생성
    IF TG_OP = 'UPDATE' AND (
        OLD.title != NEW.title OR 
        OLD.background_image_url != NEW.background_image_url OR 
        OLD.final_banner_url != NEW.final_banner_url OR
        OLD.logo_url != NEW.logo_url OR 
        OLD.logo_urls != NEW.logo_urls OR -- 다중 로고 비교 추가
        OLD.text_elements != NEW.text_elements
    ) THEN
        INSERT INTO banner_history (
            banner_id, version, title, background_image_url, final_banner_url, 
            logo_url, logo_urls, text_elements, notes
        ) VALUES (
            OLD.id, OLD.version, OLD.title, OLD.background_image_url, OLD.final_banner_url,
            OLD.logo_url, OLD.logo_urls, OLD.text_elements, 
            'Auto-saved version ' || OLD.version
        );
        
        -- 새 버전 번호 증가
        NEW.version = OLD.version + 1;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 7. 새로운 storage bucket 정책 (필요시)
INSERT INTO storage.buckets (id, name, public) 
VALUES 
    ('final-banners', 'final-banners', true)
ON CONFLICT (id) DO NOTHING;

-- Comment: 
-- 이 마이그레이션은 기존 데이터를 보존합니다
-- image_url -> background_image_url로 데이터 이동
-- 새로운 필드들: final_banner_url, thumbnail_url, logo_urls 추가
-- 기존 image_url 컬럼은 일단 유지 (나중에 삭제 가능) 