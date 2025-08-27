-- status 컬럼과 인덱스 정리
-- 실행일: 2024년

-- 1. 현재 banners 테이블에 status 컬럼이 이미 존재하는지 확인
DO $$
BEGIN
    -- status 컬럼 존재 확인
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'banners' 
        AND column_name = 'status'
    ) THEN
        RAISE NOTICE '✅ status 컬럼이 이미 존재합니다.';
    ELSE
        -- status 컬럼이 없다면 추가
        ALTER TABLE banners ADD COLUMN status VARCHAR(20) DEFAULT 'draft' NOT NULL;
        ALTER TABLE banners ADD CONSTRAINT banners_status_check 
            CHECK (status IN ('draft', 'in_progress', 'review', 'approved', 'rejected', 'completed'));
        RAISE NOTICE '✅ status 컬럼을 추가했습니다.';
    END IF;
END $$;

-- 2. status 인덱스 정리
-- 기존 인덱스 확인 후 최적화된 인덱스로 교체
DROP INDEX IF EXISTS idx_banners_status;

-- status 필터링을 위한 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_banners_status_created 
ON banners (status, created_at DESC, id DESC);

-- 3. 상태별 통계 확인 (개발용)
DO $$
DECLARE
    status_counts RECORD;
BEGIN
    RAISE NOTICE '📊 배너 상태별 통계:';
    
    FOR status_counts IN 
        SELECT status, COUNT(*) as count 
        FROM banners 
        GROUP BY status 
        ORDER BY count DESC
    LOOP
        RAISE NOTICE '   - %: %개', status_counts.status, status_counts.count;
    END LOOP;
    
    -- 전체 배너 수
    RAISE NOTICE '   📈 전체 배너 수: %개', (SELECT COUNT(*) FROM banners);
END $$;

-- 4. 기본 상태값 업데이트 (NULL 값이 있다면)
UPDATE banners 
SET status = 'completed' 
WHERE status IS NULL;

-- 5. 통계 정보 업데이트
ANALYZE banners;

-- 완료 로그
DO $$
BEGIN
    RAISE NOTICE '✅ status 컬럼과 인덱스 정리 완료';
    RAISE NOTICE '📊 생성된 인덱스:';
    RAISE NOTICE '   - idx_banners_status_created (status, created_at DESC, id DESC)';
    RAISE NOTICE '🗑️  제거된 인덱스:';
    RAISE NOTICE '   - idx_banners_status (단일 컬럼 인덱스)';
END $$;
