-- Personnel 테이블 생성
CREATE TABLE IF NOT EXISTS personnel (
    id SERIAL PRIMARY KEY,
    
    -- 기본 정보
    division VARCHAR(100),
    department VARCHAR(100),
    position VARCHAR(100),
    employee_number VARCHAR(50) UNIQUE,
    name VARCHAR(100) NOT NULL,
    rank VARCHAR(50),
    duties TEXT,
    job_function VARCHAR(100),
    bok_job_function VARCHAR(100),
    job_category VARCHAR(100),
    is_it_personnel BOOLEAN DEFAULT FALSE,
    is_security_personnel BOOLEAN DEFAULT FALSE,
    
    -- 개인 정보
    birth_date DATE,
    gender VARCHAR(10),
    age INTEGER,
    
    -- 입사 및 경력 정보
    group_join_date DATE,
    join_date DATE,
    resignation_date DATE,
    total_service_years DECIMAL(5, 2),
    career_base_date DATE,
    it_career_years DECIMAL(5, 2),
    current_duty_date DATE,
    current_duty_period DECIMAL(5, 2),
    previous_department VARCHAR(100),
    
    -- 학력 및 자격증
    major VARCHAR(100),
    is_it_major BOOLEAN DEFAULT FALSE,
    it_certificate_1 VARCHAR(100),
    it_certificate_2 VARCHAR(100),
    it_certificate_3 VARCHAR(100),
    it_certificate_4 VARCHAR(100),
    
    -- 기타
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE personnel IS '인력현황';
COMMENT ON COLUMN personnel.division IS '본부';
COMMENT ON COLUMN personnel.department IS '부서';
COMMENT ON COLUMN personnel.position IS '직책';
COMMENT ON COLUMN personnel.employee_number IS '사번';
COMMENT ON COLUMN personnel.name IS '성명';
COMMENT ON COLUMN personnel.rank IS '직위';
COMMENT ON COLUMN personnel.duties IS '담당업무';
COMMENT ON COLUMN personnel.job_function IS '직능';
COMMENT ON COLUMN personnel.bok_job_function IS '한국은행직능';
COMMENT ON COLUMN personnel.job_category IS '직종구분';
COMMENT ON COLUMN personnel.is_it_personnel IS '정보기술인력 여부';
COMMENT ON COLUMN personnel.is_security_personnel IS '정보보호인력 여부';
COMMENT ON COLUMN personnel.birth_date IS '생년월일';
COMMENT ON COLUMN personnel.gender IS '성별';
COMMENT ON COLUMN personnel.age IS '나이';
COMMENT ON COLUMN personnel.group_join_date IS '그룹입사일';
COMMENT ON COLUMN personnel.join_date IS '입사일';
COMMENT ON COLUMN personnel.resignation_date IS '퇴사일';
COMMENT ON COLUMN personnel.total_service_years IS '총재직기간(년)';
COMMENT ON COLUMN personnel.career_base_date IS '정산경력기준일';
COMMENT ON COLUMN personnel.it_career_years IS '전산경력(년)';
COMMENT ON COLUMN personnel.current_duty_date IS '현업무발령일';
COMMENT ON COLUMN personnel.current_duty_period IS '현업무기간(년)';
COMMENT ON COLUMN personnel.previous_department IS '직전소속';
COMMENT ON COLUMN personnel.major IS '전공';
COMMENT ON COLUMN personnel.is_it_major IS '전산전공여부';
COMMENT ON COLUMN personnel.it_certificate_1 IS '전산자격증1';
COMMENT ON COLUMN personnel.it_certificate_2 IS '전산자격증2';
COMMENT ON COLUMN personnel.it_certificate_3 IS '전산자격증3';
COMMENT ON COLUMN personnel.it_certificate_4 IS '전산자격증4';
COMMENT ON COLUMN personnel.is_active IS '활성화 여부';
COMMENT ON COLUMN personnel.notes IS '비고';

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_personnel_name ON personnel(name);
CREATE INDEX IF NOT EXISTS idx_personnel_department ON personnel(department);
CREATE INDEX IF NOT EXISTS idx_personnel_is_active ON personnel(is_active);

