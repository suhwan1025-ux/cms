-- project_purposes 테이블에 is_fixed 컬럼 추가
ALTER TABLE project_purposes ADD COLUMN IF NOT EXISTS is_fixed BOOLEAN DEFAULT FALSE;

-- 컬럼 설명 추가
COMMENT ON COLUMN project_purposes.is_fixed IS '고정 여부 (정기구입, 정보보호 등 수정 불가 항목)';

-- 기존 데이터 업데이트: S(정기구입), Z(정보보호)를 고정으로 설정
UPDATE project_purposes SET is_fixed = TRUE WHERE code IN ('S', 'Z');

-- 2020~2030년까지 S(정기구입), Z(정보보호) 코드 자동 생성
DO $$
DECLARE
  y INTEGER;
BEGIN
  FOR y IN 2020..2030 LOOP
    -- S: 정기구입
    INSERT INTO project_purposes (code, description, year, is_fixed, created_at)
    VALUES ('S', '정기구입', y, TRUE, CURRENT_TIMESTAMP)
    ON CONFLICT (code, year) DO UPDATE SET is_fixed = TRUE, description = '정기구입';
    
    -- Z: 정보보호
    INSERT INTO project_purposes (code, description, year, is_fixed, created_at)
    VALUES ('Z', '정보보호', y, TRUE, CURRENT_TIMESTAMP)
    ON CONFLICT (code, year) DO UPDATE SET is_fixed = TRUE, description = '정보보호';
  END LOOP;
END $$;

SELECT 'S(정기구입), Z(정보보호) 코드 생성 완료 (2020-2030년)' AS message;

