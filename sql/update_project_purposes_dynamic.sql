-- 현재 연도 기준 과거 5년, 미래 5년에 대해 S(정기구입), Z(정보보호) 코드 자동 생성
DO $$
DECLARE
  current_year INTEGER;
  start_year INTEGER;
  end_year INTEGER;
  y INTEGER;
BEGIN
  -- 현재 연도 가져오기
  current_year := EXTRACT(YEAR FROM CURRENT_DATE);
  start_year := current_year - 5;
  end_year := current_year + 5;
  
  -- 과거 5년 ~ 미래 5년까지 반복
  FOR y IN start_year..end_year LOOP
    -- S: 정기구입
    INSERT INTO project_purposes (code, description, year, is_fixed, created_at)
    VALUES ('S', '정기구입', y, TRUE, CURRENT_TIMESTAMP)
    ON CONFLICT (code, year) DO UPDATE SET is_fixed = TRUE, description = '정기구입';
    
    -- Z: 정보보호
    INSERT INTO project_purposes (code, description, year, is_fixed, created_at)
    VALUES ('Z', '정보보호', y, TRUE, CURRENT_TIMESTAMP)
    ON CONFLICT (code, year) DO UPDATE SET is_fixed = TRUE, description = '정보보호';
  END LOOP;
  
  RAISE NOTICE 'S(정기구입), Z(정보보호) 코드 생성 완료: % ~ %년', start_year, end_year;
END $$;

SELECT 'S(정기구입), Z(정보보호) 동적 생성 완료' AS message;

