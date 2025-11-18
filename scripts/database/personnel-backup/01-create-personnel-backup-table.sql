-- ============================================================
-- Personnel Backup 테이블 생성 스크립트
-- ============================================================
-- 목적: 내부인력 현황의 주기적 백업을 위한 테이블
-- 사용: 대시보드 기간별 인원 증감 분석
-- ============================================================

-- 테이블 생성
CREATE TABLE IF NOT EXISTS personnel_backup (
    id SERIAL PRIMARY KEY,
    
    -- 백업 정보
    backup_date DATE NOT NULL COMMENT '백업 일자',
    original_id INTEGER NOT NULL COMMENT '원본 personnel 테이블의 id',
    
    -- 기본 정보
    division VARCHAR(100) COMMENT '본부',
    department VARCHAR(100) COMMENT '부서',
    position VARCHAR(100) COMMENT '직책',
    employee_number VARCHAR(50) COMMENT '사번',
    name VARCHAR(100) NOT NULL COMMENT '성명',
    rank VARCHAR(50) COMMENT '직위',
    duties TEXT COMMENT '담당업무',
    job_function VARCHAR(100) COMMENT '직능',
    bok_job_function VARCHAR(100) COMMENT '한국은행직능',
    job_category VARCHAR(100) COMMENT '직종구분',
    is_it_personnel BOOLEAN DEFAULT FALSE COMMENT '정보기술인력 여부',
    is_security_personnel BOOLEAN DEFAULT FALSE COMMENT '정보보호인력 여부',
    
    -- 개인 정보
    birth_date DATE COMMENT '생년월일',
    gender VARCHAR(10) COMMENT '성별',
    age INTEGER COMMENT '나이',
    
    -- 입사 및 경력 정보
    group_join_date DATE COMMENT '그룹입사일',
    join_date DATE COMMENT '입사일',
    resignation_date DATE COMMENT '퇴사일',
    total_service_years NUMERIC(5, 2) COMMENT '총재직기간(년)',
    career_base_date DATE COMMENT '정산경력기준일',
    it_career_years NUMERIC(5, 2) COMMENT '전산경력(년)',
    current_duty_date DATE COMMENT '현업무발령일',
    current_duty_period NUMERIC(5, 2) COMMENT '현업무기간(년)',
    previous_department VARCHAR(100) COMMENT '직전소속',
    
    -- 학력 및 자격증
    major VARCHAR(100) COMMENT '전공',
    is_it_major BOOLEAN DEFAULT FALSE COMMENT '전산전공여부',
    it_certificate_1 VARCHAR(100) COMMENT '전산자격증1',
    it_certificate_2 VARCHAR(100) COMMENT '전산자격증2',
    it_certificate_3 VARCHAR(100) COMMENT '전산자격증3',
    it_certificate_4 VARCHAR(100) COMMENT '전산자격증4',
    
    -- 기타
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT '활성화 여부',
    notes TEXT COMMENT '비고',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_personnel_backup_date ON personnel_backup(backup_date);
CREATE INDEX IF NOT EXISTS idx_personnel_backup_original_id ON personnel_backup(original_id);
CREATE INDEX IF NOT EXISTS idx_personnel_backup_department ON personnel_backup(department);
CREATE INDEX IF NOT EXISTS idx_personnel_backup_employee_number ON personnel_backup(employee_number);

-- 복합 인덱스 (백업일자 + 퇴사일 조회용)
CREATE INDEX IF NOT EXISTS idx_personnel_backup_date_resignation 
ON personnel_backup(backup_date, resignation_date);

-- 테이블 코멘트
COMMENT ON TABLE personnel_backup IS '내부인력 현황 백업 테이블 - 기간별 인원 증감 분석용';

-- 생성 완료 메시지
SELECT 'personnel_backup 테이블 생성 완료!' AS result;

