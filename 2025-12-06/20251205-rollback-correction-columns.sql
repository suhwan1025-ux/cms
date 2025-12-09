-- =====================================================
-- 날짜: 2025-12-05
-- 설명: proposals 테이블 정정 관련 컬럼 롤백 (삭제)
-- 삭제 컬럼:
--   1. correction_reason (정정 사유)
--   2. original_proposal_id (원본 품의서 ID)
-- =====================================================

-- 1. 외래키 제약조건 삭제
ALTER TABLE proposals 
DROP CONSTRAINT IF EXISTS fk_proposals_original_proposal;

-- 2. 인덱스 삭제
DROP INDEX IF EXISTS idx_proposals_original_proposal_id;

-- 3. original_proposal_id 컬럼 삭제
ALTER TABLE proposals 
DROP COLUMN IF EXISTS original_proposal_id;

-- 4. correction_reason 컬럼 삭제
ALTER TABLE proposals 
DROP COLUMN IF EXISTS correction_reason;

-- 5. 결과 확인
SELECT 
    column_name, 
    data_type
FROM information_schema.columns 
WHERE table_name = 'proposals' 
AND column_name IN ('correction_reason', 'original_proposal_id');

-- 완료 메시지 (결과가 비어있어야 정상)
SELECT '✅ proposals 테이블에서 correction_reason, original_proposal_id 컬럼 삭제 완료' as result;

