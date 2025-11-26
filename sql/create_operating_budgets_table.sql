-- 전산운용비 예산 관리 테이블 생성 (PostgreSQL)
CREATE TABLE IF NOT EXISTS operating_budgets (
  id SERIAL PRIMARY KEY,
  fiscal_year INTEGER NOT NULL,
  account_subject VARCHAR(255) NOT NULL,
  budget_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 코멘트 추가
COMMENT ON TABLE operating_budgets IS '전산운용비 예산 관리';
COMMENT ON COLUMN operating_budgets.fiscal_year IS '회계연도';
COMMENT ON COLUMN operating_budgets.account_subject IS '계정과목';
COMMENT ON COLUMN operating_budgets.budget_amount IS '예산액';
COMMENT ON COLUMN operating_budgets.created_at IS '등록일';
COMMENT ON COLUMN operating_budgets.updated_at IS '수정일';

-- 참고: 집행액(executed_amount)은 조회 시 operating_budget_executions 테이블에서 SUM으로 계산됨

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_fiscal_year ON operating_budgets(fiscal_year);
CREATE INDEX IF NOT EXISTS idx_account_subject ON operating_budgets(account_subject);

-- 트리거 생성 (updated_at 자동 업데이트)
CREATE OR REPLACE FUNCTION update_operating_budgets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_operating_budgets_updated_at
BEFORE UPDATE ON operating_budgets
FOR EACH ROW
EXECUTE FUNCTION update_operating_budgets_updated_at();

-- 샘플 데이터 (선택사항)
-- INSERT INTO operating_budgets (fiscal_year, account_subject, budget_amount) VALUES
-- (2025, '서버호스팅비', 50000000),
-- (2025, 'SW 라이센스비', 30000000),
-- (2025, '네트워크 유지보수비', 20000000),
-- (2025, '보안솔루션 이용료', 15000000);

