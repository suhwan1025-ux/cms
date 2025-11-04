-- 사업예산 변경이력 테이블 생성
CREATE TABLE IF NOT EXISTS business_budget_history (
  id SERIAL PRIMARY KEY,
  budget_id INTEGER NOT NULL REFERENCES business_budgets(id) ON DELETE CASCADE,
  change_type VARCHAR(20) NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE'
  changed_field VARCHAR(100), -- 변경된 필드명
  old_value TEXT, -- 이전 값
  new_value TEXT, -- 새로운 값
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  changed_by VARCHAR(100), -- 변경자
  change_description TEXT -- 변경 설명
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_budget_history_budget_id ON business_budget_history(budget_id);
CREATE INDEX IF NOT EXISTS idx_budget_history_changed_at ON business_budget_history(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_budget_history_changed_by ON business_budget_history(changed_by);

-- 테이블 설명 추가
COMMENT ON TABLE business_budget_history IS '사업예산 변경이력 테이블';
COMMENT ON COLUMN business_budget_history.id IS '이력 ID';
COMMENT ON COLUMN business_budget_history.budget_id IS '사업예산 ID';
COMMENT ON COLUMN business_budget_history.change_type IS '변경 유형 (CREATE/UPDATE/DELETE)';
COMMENT ON COLUMN business_budget_history.changed_field IS '변경된 필드명';
COMMENT ON COLUMN business_budget_history.old_value IS '이전 값';
COMMENT ON COLUMN business_budget_history.new_value IS '새로운 값';
COMMENT ON COLUMN business_budget_history.changed_at IS '변경 일시';
COMMENT ON COLUMN business_budget_history.changed_by IS '변경자';
COMMENT ON COLUMN business_budget_history.change_description IS '변경 설명';

SELECT 'business_budget_history 테이블 생성 완료' AS message;

