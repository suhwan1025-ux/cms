-- 사업목적 테이블 생성
CREATE TABLE IF NOT EXISTS project_purposes (
  id SERIAL PRIMARY KEY,
  code VARCHAR(10) NOT NULL,
  description TEXT NOT NULL,
  year INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(code, year)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_project_purposes_year ON project_purposes(year);
CREATE INDEX IF NOT EXISTS idx_project_purposes_code ON project_purposes(code);

-- 테이블 설명 추가
COMMENT ON TABLE project_purposes IS '사업목적 관리 테이블';
COMMENT ON COLUMN project_purposes.id IS '사업목적 ID';
COMMENT ON COLUMN project_purposes.code IS '사업목적 코드 (예: A, B, C)';
COMMENT ON COLUMN project_purposes.description IS '사업목적 설명 (예: 동결 및 감소)';
COMMENT ON COLUMN project_purposes.year IS '적용 연도';
COMMENT ON COLUMN project_purposes.created_at IS '생성일시';
COMMENT ON COLUMN project_purposes.updated_at IS '수정일시';

-- 기본 데이터 삽입 (2025년도)
INSERT INTO project_purposes (code, description, year) VALUES 
  ('A', '동결 및 감소', 2025),
  ('B', '유상전환', 2025),
  ('C', '전략과제', 2025),
  ('D', '물가상승인상', 2025),
  ('E', '사용량증가', 2025),
  ('F', '해지', 2025)
ON CONFLICT (code, year) DO NOTHING;

-- 2024년도 기본 데이터
INSERT INTO project_purposes (code, description, year) VALUES 
  ('A', '동결 및 감소', 2024),
  ('B', '유상전환', 2024),
  ('C', '전략과제', 2024),
  ('D', '물가상승인상', 2024),
  ('E', '사용량증가', 2024),
  ('F', '해지', 2024)
ON CONFLICT (code, year) DO NOTHING;

SELECT 'project_purposes 테이블 생성 완료' AS message;

