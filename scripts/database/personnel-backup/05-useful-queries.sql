-- ============================================================
-- Personnel Backup 유용한 쿼리 모음
-- ============================================================
-- 목적: 백업 데이터를 활용한 다양한 분석 쿼리
-- ============================================================

-- ============================================================
-- 1. 백업 이력 조회
-- ============================================================

-- 전체 백업 이력 (최신순)
SELECT 
  backup_date,
  COUNT(*) as total_personnel,
  COUNT(DISTINCT department) as dept_count,
  COUNT(CASE WHEN is_it_personnel THEN 1 END) as it_personnel_count,
  COUNT(CASE WHEN is_security_personnel THEN 1 END) as security_personnel_count
FROM personnel_backup
GROUP BY backup_date
ORDER BY backup_date DESC;


-- ============================================================
-- 2. 특정 날짜 인력 현황
-- ============================================================

-- 2024년 1월 1일 기준 부서별 인원
SELECT 
  department,
  COUNT(*) as count,
  COUNT(CASE WHEN is_it_personnel THEN 1 END) as it_count
FROM personnel_backup
WHERE backup_date = '2024-01-01'
  AND (resignation_date IS NULL OR resignation_date > '2024-01-01')
GROUP BY department
ORDER BY count DESC;


-- ============================================================
-- 3. 기간별 인원 증감 분석
-- ============================================================

-- 월별 전체 인원 추이
SELECT 
  backup_date,
  COUNT(*) as total_count,
  COUNT(*) - LAG(COUNT(*)) OVER (ORDER BY backup_date) as change_from_prev
FROM personnel_backup
GROUP BY backup_date
ORDER BY backup_date;


-- 부서별 월별 증감 (최근 3개월)
WITH monthly_stats AS (
  SELECT 
    backup_date,
    department,
    COUNT(*) as count
  FROM personnel_backup
  WHERE backup_date >= CURRENT_DATE - INTERVAL '3 months'
  GROUP BY backup_date, department
)
SELECT 
  department,
  MAX(CASE WHEN rnk = 1 THEN backup_date END) as latest_date,
  MAX(CASE WHEN rnk = 1 THEN count END) as latest_count,
  MAX(CASE WHEN rnk = 2 THEN backup_date END) as prev_date,
  MAX(CASE WHEN rnk = 2 THEN count END) as prev_count,
  MAX(CASE WHEN rnk = 1 THEN count END) - MAX(CASE WHEN rnk = 2 THEN count END) as change
FROM (
  SELECT 
    *,
    ROW_NUMBER() OVER (PARTITION BY department ORDER BY backup_date DESC) as rnk
  FROM monthly_stats
) ranked
WHERE rnk <= 2
GROUP BY department
ORDER BY change DESC NULLS LAST;


-- ============================================================
-- 4. 특정 인원 이력 추적
-- ============================================================

-- 특정 사번의 이력 추적 (부서 이동, 직위 변경 등)
SELECT 
  backup_date,
  employee_number,
  name,
  department,
  position,
  rank,
  join_date,
  resignation_date
FROM personnel_backup
WHERE employee_number = '12345'  -- 사번 입력
ORDER BY backup_date DESC;


-- ============================================================
-- 5. 데이터 품질 체크
-- ============================================================

-- 최근 백업의 필수 컬럼 누락 확인
SELECT 
  backup_date,
  COUNT(*) as total,
  COUNT(CASE WHEN name IS NULL THEN 1 END) as missing_name,
  COUNT(CASE WHEN department IS NULL THEN 1 END) as missing_dept,
  COUNT(CASE WHEN employee_number IS NULL THEN 1 END) as missing_empno
FROM personnel_backup
WHERE backup_date = (SELECT MAX(backup_date) FROM personnel_backup)
GROUP BY backup_date;


-- 중복 데이터 확인 (같은 날짜에 같은 사번이 2개 이상)
SELECT 
  backup_date,
  employee_number,
  COUNT(*) as duplicate_count
FROM personnel_backup
WHERE employee_number IS NOT NULL
GROUP BY backup_date, employee_number
HAVING COUNT(*) > 1
ORDER BY backup_date DESC, duplicate_count DESC;


-- ============================================================
-- 6. 백업 데이터 정리
-- ============================================================

-- 1년 이전 백업 데이터 삭제
DELETE FROM personnel_backup 
WHERE backup_date < CURRENT_DATE - INTERVAL '1 year';


-- 특정 날짜 백업 삭제
DELETE FROM personnel_backup 
WHERE backup_date = '2024-01-01';


-- 중복 백업 정리 (가장 최근 레코드만 유지)
DELETE FROM personnel_backup a
USING personnel_backup b
WHERE a.backup_date = b.backup_date
  AND a.employee_number = b.employee_number
  AND a.id < b.id;


-- ============================================================
-- 7. 통계 및 분석
-- ============================================================

-- 평균 재직 기간 추이
SELECT 
  backup_date,
  AVG(total_service_years) as avg_service_years,
  AVG(it_career_years) as avg_it_career_years
FROM personnel_backup
WHERE total_service_years IS NOT NULL
GROUP BY backup_date
ORDER BY backup_date;


-- 연령대별 분포 (최근 백업)
SELECT 
  CASE 
    WHEN age < 30 THEN '20대'
    WHEN age < 40 THEN '30대'
    WHEN age < 50 THEN '40대'
    WHEN age < 60 THEN '50대'
    ELSE '60대 이상'
  END as age_group,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM personnel_backup
WHERE backup_date = (SELECT MAX(backup_date) FROM personnel_backup)
  AND age IS NOT NULL
GROUP BY age_group
ORDER BY age_group;


-- ============================================================
-- 8. 현재 vs 과거 비교
-- ============================================================

-- 현재 인력 vs 1개월 전 비교
WITH current_data AS (
  SELECT 
    department,
    COUNT(*) as current_count
  FROM personnel
  WHERE is_active = TRUE
  GROUP BY department
),
past_data AS (
  SELECT 
    department,
    COUNT(*) as past_count
  FROM personnel_backup
  WHERE backup_date = (
    SELECT MAX(backup_date) 
    FROM personnel_backup 
    WHERE backup_date < CURRENT_DATE - INTERVAL '1 month'
  )
  GROUP BY department
)
SELECT 
  COALESCE(c.department, p.department) as department,
  COALESCE(p.past_count, 0) as past_count,
  COALESCE(c.current_count, 0) as current_count,
  COALESCE(c.current_count, 0) - COALESCE(p.past_count, 0) as change,
  ROUND(
    (COALESCE(c.current_count, 0) - COALESCE(p.past_count, 0)) * 100.0 / 
    NULLIF(COALESCE(p.past_count, 1), 0), 
    2
  ) as change_rate
FROM current_data c
FULL OUTER JOIN past_data p ON c.department = p.department
ORDER BY change DESC;

