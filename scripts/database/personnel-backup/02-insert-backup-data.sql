-- ============================================================
-- Personnel 백업 데이터 삽입 스크립트
-- ============================================================
-- 목적: 현재 personnel 테이블 데이터를 personnel_backup에 백업
-- 사용법: 매월 1일 또는 주기적으로 실행
-- ============================================================

-- 오늘 날짜로 백업 (기본)
INSERT INTO personnel_backup (
    backup_date,
    original_id,
    division,
    department,
    position,
    employee_number,
    name,
    rank,
    duties,
    job_function,
    bok_job_function,
    job_category,
    is_it_personnel,
    is_security_personnel,
    birth_date,
    gender,
    age,
    group_join_date,
    join_date,
    resignation_date,
    total_service_years,
    career_base_date,
    it_career_years,
    current_duty_date,
    current_duty_period,
    previous_department,
    major,
    is_it_major,
    it_certificate_1,
    it_certificate_2,
    it_certificate_3,
    it_certificate_4,
    is_active,
    notes,
    created_at,
    updated_at
)
SELECT
    CURRENT_DATE AS backup_date,  -- 오늘 날짜
    id AS original_id,
    division,
    department,
    position,
    employee_number,
    name,
    rank,
    duties,
    job_function,
    bok_job_function,
    job_category,
    is_it_personnel,
    is_security_personnel,
    birth_date,
    gender,
    age,
    group_join_date,
    join_date,
    resignation_date,
    total_service_years,
    career_base_date,
    it_career_years,
    current_duty_date,
    current_duty_period,
    previous_department,
    major,
    is_it_major,
    it_certificate_1,
    it_certificate_2,
    it_certificate_3,
    it_certificate_4,
    is_active,
    notes,
    created_at,
    updated_at
FROM personnel
WHERE is_active = TRUE;  -- 활성 인력만 백업

-- 백업 완료 메시지
SELECT 
    CURRENT_DATE AS backup_date,
    COUNT(*) AS backed_up_count,
    '백업 완료!' AS status
FROM personnel_backup 
WHERE backup_date = CURRENT_DATE;


-- ============================================================
-- 특정 날짜로 백업하는 경우 (예시)
-- ============================================================
/*
-- 2024년 1월 1일 기준으로 백업
INSERT INTO personnel_backup (
    backup_date,
    original_id,
    -- ... (위와 동일한 컬럼들)
)
SELECT
    '2024-01-01'::DATE AS backup_date,  -- 특정 날짜 지정
    id AS original_id,
    -- ... (위와 동일한 SELECT)
FROM personnel
WHERE is_active = TRUE
  AND (resignation_date IS NULL OR resignation_date > '2024-01-01');
*/

