-- 1. 계약금액별 합의라인 테이블 생성
CREATE TABLE IF NOT EXISTS approval_amount_agreement (
  id SERIAL PRIMARY KEY,
  min_amount BIGINT NOT NULL,
  max_amount BIGINT NOT NULL,
  approver VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. 계약금액별 전결라인 테이블 생성
CREATE TABLE IF NOT EXISTS approval_amount_decision (
  id SERIAL PRIMARY KEY,
  min_amount BIGINT NOT NULL,
  max_amount BIGINT NOT NULL,
  decision_maker VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. 계약유형별 합의라인 테이블 생성
CREATE TABLE IF NOT EXISTS approval_type_agreement (
  id SERIAL PRIMARY KEY,
  contract_type VARCHAR(255) NOT NULL,
  approver VARCHAR(255) NOT NULL,
  basis TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- (선택사항) 테이블 코멘트 추가 (PostgreSQL)
COMMENT ON TABLE approval_amount_agreement IS '계약금액별 합의라인 정보';
COMMENT ON COLUMN approval_amount_agreement.min_amount IS '최소 금액';
COMMENT ON COLUMN approval_amount_agreement.max_amount IS '최대 금액 (0이면 무제한)';
COMMENT ON COLUMN approval_amount_agreement.approver IS '합의자 명칭';

COMMENT ON TABLE approval_amount_decision IS '계약금액별 전결라인 정보';
COMMENT ON COLUMN approval_amount_decision.min_amount IS '최소 금액';
COMMENT ON COLUMN approval_amount_decision.max_amount IS '최대 금액 (0이면 무제한)';
COMMENT ON COLUMN approval_amount_decision.decision_maker IS '전결권자 명칭';

COMMENT ON TABLE approval_type_agreement IS '계약유형별 합의라인 정보';
COMMENT ON COLUMN approval_type_agreement.contract_type IS '계약 유형 (예: 용역계약, 구매계약 등)';
COMMENT ON COLUMN approval_type_agreement.approver IS '합의자 명칭';
COMMENT ON COLUMN approval_type_agreement.basis IS '근거 규정';

