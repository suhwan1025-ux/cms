-- 사업예산 관리 테이블 스키마 업데이트
-- 새로운 컬럼 추가

-- 1. 사업구분 (기존 budget_type과 별도로 추가)
ALTER TABLE business_budgets 
ADD COLUMN IF NOT EXISTS business_division VARCHAR(100);

-- 2. 집행대기
ALTER TABLE business_budgets 
ADD COLUMN IF NOT EXISTS pending_amount NUMERIC(15,2) DEFAULT 0;

-- 3. 확정집행액
ALTER TABLE business_budgets 
ADD COLUMN IF NOT EXISTS confirmed_execution_amount NUMERIC(15,2) DEFAULT 0;

-- 4. 집행률 (백분율, 예: 95.50%)
ALTER TABLE business_budgets 
ADD COLUMN IF NOT EXISTS execution_rate NUMERIC(5,2) DEFAULT 0;

-- 5. 미집행액
ALTER TABLE business_budgets 
ADD COLUMN IF NOT EXISTS unexecuted_amount NUMERIC(15,2) DEFAULT 0;

-- 6. 추가예산
ALTER TABLE business_budgets 
ADD COLUMN IF NOT EXISTS additional_budget NUMERIC(15,2) DEFAULT 0;

-- 7. 사업 보류/취소 사유
ALTER TABLE business_budgets 
ADD COLUMN IF NOT EXISTS hold_cancel_reason TEXT;

-- 8. 비고
ALTER TABLE business_budgets 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- 9. 정보기술부문계획서 보고 여부
ALTER TABLE business_budgets 
ADD COLUMN IF NOT EXISTS it_plan_reported BOOLEAN DEFAULT false;

-- 10. is_active 컬럼 추가 (활성화 여부)
ALTER TABLE business_budgets 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 기본값 업데이트
UPDATE business_budgets 
SET 
  pending_amount = 0,
  confirmed_execution_amount = 0,
  execution_rate = 0,
  unexecuted_amount = budget_amount - COALESCE(executed_amount, 0),
  additional_budget = 0,
  it_plan_reported = false,
  is_active = true
WHERE pending_amount IS NULL 
   OR confirmed_execution_amount IS NULL 
   OR execution_rate IS NULL 
   OR unexecuted_amount IS NULL 
   OR additional_budget IS NULL 
   OR it_plan_reported IS NULL
   OR is_active IS NULL;

-- 집행률 계산 및 업데이트
UPDATE business_budgets 
SET execution_rate = CASE 
  WHEN budget_amount > 0 THEN 
    ROUND((COALESCE(executed_amount, 0) / budget_amount * 100)::numeric, 2)
  ELSE 0 
END
WHERE budget_amount IS NOT NULL;

-- 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_business_budgets_year ON business_budgets(budget_year);
CREATE INDEX IF NOT EXISTS idx_business_budgets_status ON business_budgets(status);
CREATE INDEX IF NOT EXISTS idx_business_budgets_division ON business_budgets(business_division);
CREATE INDEX IF NOT EXISTS idx_business_budgets_active ON business_budgets(is_active);

-- 코멘트 추가
COMMENT ON COLUMN business_budgets.business_division IS '사업구분';
COMMENT ON COLUMN business_budgets.pending_amount IS '집행대기 금액';
COMMENT ON COLUMN business_budgets.confirmed_execution_amount IS '확정집행액';
COMMENT ON COLUMN business_budgets.execution_rate IS '집행률 (%)';
COMMENT ON COLUMN business_budgets.unexecuted_amount IS '미집행액';
COMMENT ON COLUMN business_budgets.additional_budget IS '추가예산';
COMMENT ON COLUMN business_budgets.hold_cancel_reason IS '사업 보류/취소 사유';
COMMENT ON COLUMN business_budgets.notes IS '비고';
COMMENT ON COLUMN business_budgets.it_plan_reported IS '정보기술부문계획서 보고 여부';
COMMENT ON COLUMN business_budgets.is_active IS '활성화 여부';

