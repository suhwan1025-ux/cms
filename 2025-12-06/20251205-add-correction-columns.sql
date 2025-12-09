-- =====================================================
-- 날짜: 2025-12-05
-- 설명: proposals 테이블에 정정 관련 컬럼 추가
-- 추가 컬럼: 
--   1. correction_reason (정정 사유)
--   2. original_proposal_id (원본 품의서 ID)
-- =====================================================

-- 1. correction_reason 컬럼 추가
ALTER TABLE proposals 
ADD COLUMN IF NOT EXISTS correction_reason TEXT NULL;

COMMENT ON COLUMN proposals.correction_reason IS '정정 사유';

-- 2. original_proposal_id 컬럼 추가
ALTER TABLE proposals 
ADD COLUMN IF NOT EXISTS original_proposal_id INTEGER NULL;

-- 3. 외래키 제약조건 추가
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_proposals_original_proposal'
    ) THEN
        ALTER TABLE proposals 
        ADD CONSTRAINT fk_proposals_original_proposal 
        FOREIGN KEY (original_proposal_id) 
        REFERENCES proposals(id) 
        ON DELETE SET NULL 
        ON UPDATE CASCADE;
    END IF;
END $$;

COMMENT ON COLUMN proposals.original_proposal_id IS '원본 품의서 ID (정정된 경우)';

-- 4. 인덱스 추가 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_proposals_original_proposal_id 
ON proposals(original_proposal_id);

-- 5. 결과 확인
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'proposals' 
AND column_name IN ('correction_reason', 'original_proposal_id')
ORDER BY column_name;

-- 완료 메시지
SELECT '✅ proposals 테이블에 correction_reason, original_proposal_id 컬럼 추가 완료' as result;

