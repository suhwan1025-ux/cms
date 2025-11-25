-- 전산운용비 집행 내역 테이블
CREATE TABLE IF NOT EXISTS operating_budget_executions (
  id SERIAL PRIMARY KEY,
  budget_id INTEGER REFERENCES operating_budgets(id) ON DELETE CASCADE,
  account_subject VARCHAR(255) NOT NULL,
  execution_number VARCHAR(100),
  sap_description TEXT,
  contract VARCHAR(255),
  proposal_name VARCHAR(255),
  confirmed_execution_amount BIGINT DEFAULT 0,
  execution_amount BIGINT DEFAULT 0,
  billing_period VARCHAR(100),
  cost_attribution VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE operating_budget_executions IS '전산운용비 집행 내역 테이블';
COMMENT ON COLUMN operating_budget_executions.id IS '고유 ID';
COMMENT ON COLUMN operating_budget_executions.budget_id IS '예산 ID (operating_budgets 참조)';
COMMENT ON COLUMN operating_budget_executions.account_subject IS '계정과목';
COMMENT ON COLUMN operating_budget_executions.execution_number IS '번호';
COMMENT ON COLUMN operating_budget_executions.sap_description IS 'SAP적요';
COMMENT ON COLUMN operating_budget_executions.contract IS '계약';
COMMENT ON COLUMN operating_budget_executions.proposal_name IS '품의서명';
COMMENT ON COLUMN operating_budget_executions.confirmed_execution_amount IS '확정집행액';
COMMENT ON COLUMN operating_budget_executions.execution_amount IS '집행액';
COMMENT ON COLUMN operating_budget_executions.billing_period IS '청구시기';
COMMENT ON COLUMN operating_budget_executions.cost_attribution IS '비용귀속';
COMMENT ON COLUMN operating_budget_executions.created_at IS '생성일시';
COMMENT ON COLUMN operating_budget_executions.updated_at IS '수정일시';

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_operating_budget_executions_budget_id ON operating_budget_executions(budget_id);
CREATE INDEX IF NOT EXISTS idx_operating_budget_executions_account_subject ON operating_budget_executions(account_subject);

