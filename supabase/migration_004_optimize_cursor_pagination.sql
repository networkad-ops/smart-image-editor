-- 커서 기반 페이지네이션 최적화를 위한 인덱스 추가
-- 실행일: 2024년

-- 1. 커서 페이지네이션 최적화용 복합 인덱스 생성
-- created_at DESC, id DESC 순서로 정렬하여 커서 쿼리 성능 향상
CREATE INDEX IF NOT EXISTS idx_banners_created_id 
ON banners (created_at DESC, id DESC);

-- 2. 기존 단일 컬럼 인덱스 제거 (중복 방지)
-- 복합 인덱스가 단일 컬럼 쿼리도 커버하므로 불필요
DROP INDEX IF EXISTS idx_banners_created_at;

-- 3. 검색 성능 향상을 위한 텍스트 검색 인덱스
-- title과 description에 대한 ILIKE 검색 최적화
CREATE INDEX IF NOT EXISTS idx_banners_title_search 
ON banners USING gin (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_banners_description_search 
ON banners USING gin (description gin_trgm_ops);

-- 4. 필터링 성능 향상을 위한 인덱스들
CREATE INDEX IF NOT EXISTS idx_banners_banner_type 
ON banners (banner_type);

CREATE INDEX IF NOT EXISTS idx_banners_device_type 
ON banners (device_type);

CREATE INDEX IF NOT EXISTS idx_banners_project_id 
ON banners (project_id);

-- 5. 복합 필터 쿼리 최적화
-- 자주 사용되는 필터 조합에 대한 복합 인덱스
CREATE INDEX IF NOT EXISTS idx_banners_type_device_created 
ON banners (banner_type, device_type, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_banners_project_created 
ON banners (project_id, created_at DESC, id DESC);

-- 6. 썸네일 URL 존재 여부 확인용 인덱스
CREATE INDEX IF NOT EXISTS idx_banners_thumbnail_exists 
ON banners (thumbnail_url) 
WHERE thumbnail_url IS NOT NULL;

-- 7. 통계 정보 업데이트
ANALYZE banners;

-- 인덱스 생성 완료 로그
DO $$
BEGIN
    RAISE NOTICE '✅ 커서 페이지네이션 최적화 인덱스 생성 완료';
    RAISE NOTICE '📊 생성된 인덱스:';
    RAISE NOTICE '   - idx_banners_created_id (created_at DESC, id DESC)';
    RAISE NOTICE '   - idx_banners_title_search (GIN)';
    RAISE NOTICE '   - idx_banners_description_search (GIN)';
    RAISE NOTICE '   - idx_banners_banner_type';
    RAISE NOTICE '   - idx_banners_device_type';
    RAISE NOTICE '   - idx_banners_project_id';
    RAISE NOTICE '   - idx_banners_type_device_created';
    RAISE NOTICE '   - idx_banners_project_created';
    RAISE NOTICE '   - idx_banners_thumbnail_exists';
    RAISE NOTICE '🗑️  제거된 인덱스:';
    RAISE NOTICE '   - idx_banners_created_at (중복으로 인한 제거)';
END $$;
