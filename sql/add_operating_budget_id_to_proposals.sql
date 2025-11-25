-- proposals 테이블에 operating_budget_id 컬럼 추가
-- 전산운용비 예산과의 연결을 위한 별도 외래키

-- 1. 컬럼 추가
ALTER TABLE proposals 
ADD COLUMN IF NOT EXISTS operating_budget_id INTEGER;

-- 2. 외래키 제약 조건 추가
ALTER TABLE proposals
ADD CONSTRAINT fk_proposals_operating_budgets 
FOREIGN KEY (operating_budget_id) 
REFERENCES operating_budgets(id) 
ON DELETE SET NULL;

-- 3. 인덱스 추가 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_proposals_operating_budget_id 
ON proposals(operating_budget_id);

-- 4. 컬럼 설명 추가
COMMENT ON COLUMN proposals.operating_budget_id IS '전산운용비 예산 ID';

-- 확인
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'proposals' 
AND column_name IN ('budget_id', 'operating_budget_id')
ORDER BY column_name;

