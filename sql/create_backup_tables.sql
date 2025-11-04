-- =====================================================
-- 모든 테이블의 백업 테이블 생성 스크립트
-- 실행 방법: psql -U postgres -d contract_management -f create_backup_tables.sql
-- =====================================================

-- 1. departments 백업 테이블
CREATE TABLE IF NOT EXISTS departments_backup (
    backup_id SERIAL,
    backup_date DATE NOT NULL DEFAULT CURRENT_DATE,
    backup_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- 원본 테이블 컬럼
    id INTEGER,
    name VARCHAR(255),
    code VARCHAR(255),
    parent_id INTEGER,
    manager VARCHAR(255),
    description TEXT,
    is_active BOOLEAN,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    PRIMARY KEY (backup_id, backup_date)
);

CREATE INDEX IF NOT EXISTS idx_departments_backup_date ON departments_backup(backup_date);

-- 2. tasks 백업 테이블
CREATE TABLE IF NOT EXISTS tasks_backup (
    backup_id SERIAL,
    backup_date DATE NOT NULL DEFAULT CURRENT_DATE,
    backup_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- 원본 테이블 컬럼
    id INTEGER,
    task_name VARCHAR(200),
    description TEXT,
    shared_folder_path VARCHAR(500),
    start_date DATE,
    end_date DATE,
    status VARCHAR(20),
    assigned_department VARCHAR(100),
    assigned_person VARCHAR(100),
    priority VARCHAR(10),
    is_active BOOLEAN,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    PRIMARY KEY (backup_id, backup_date)
);

CREATE INDEX IF NOT EXISTS idx_tasks_backup_date ON tasks_backup(backup_date);

-- 3. budgets 백업 테이블
CREATE TABLE IF NOT EXISTS budgets_backup (
    backup_id SERIAL,
    backup_date DATE NOT NULL DEFAULT CURRENT_DATE,
    backup_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- 원본 테이블 컬럼
    id INTEGER,
    name VARCHAR(255),
    year INTEGER,
    type VARCHAR(50),
    total_amount DECIMAL(15, 2),
    used_amount DECIMAL(15, 2),
    remaining_amount DECIMAL(15, 2),
    department VARCHAR(255),
    description TEXT,
    is_active BOOLEAN,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    PRIMARY KEY (backup_id, backup_date)
);

CREATE INDEX IF NOT EXISTS idx_budgets_backup_date ON budgets_backup(backup_date);

-- 4. suppliers 백업 테이블
CREATE TABLE IF NOT EXISTS suppliers_backup (
    backup_id SERIAL,
    backup_date DATE NOT NULL DEFAULT CURRENT_DATE,
    backup_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- 원본 테이블 컬럼
    id INTEGER,
    name VARCHAR(255),
    business_number VARCHAR(255),
    representative VARCHAR(255),
    address TEXT,
    phone VARCHAR(255),
    email VARCHAR(255),
    credit_rating VARCHAR(10),
    business_type VARCHAR(255),
    registration_date TIMESTAMP,
    is_active BOOLEAN,
    notes TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    PRIMARY KEY (backup_id, backup_date)
);

CREATE INDEX IF NOT EXISTS idx_suppliers_backup_date ON suppliers_backup(backup_date);

-- 5. document_templates 백업 테이블
CREATE TABLE IF NOT EXISTS document_templates_backup (
    backup_id SERIAL,
    backup_date DATE NOT NULL DEFAULT CURRENT_DATE,
    backup_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- 원본 테이블 컬럼
    id INTEGER,
    name VARCHAR(255),
    description TEXT,
    content TEXT,
    category VARCHAR(100),
    is_active BOOLEAN,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    PRIMARY KEY (backup_id, backup_date)
);

CREATE INDEX IF NOT EXISTS idx_document_templates_backup_date ON document_templates_backup(backup_date);

-- 6. proposals 백업 테이블
CREATE TABLE IF NOT EXISTS proposals_backup (
    backup_id SERIAL,
    backup_date DATE NOT NULL DEFAULT CURRENT_DATE,
    backup_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- 원본 테이블 컬럼
    id INTEGER,
    contract_type VARCHAR(50),
    title VARCHAR(500),
    purpose TEXT,
    basis TEXT,
    budget_id INTEGER,
    contract_method VARCHAR(50),
    contract_method_id INTEGER,
    account_subject VARCHAR(255),
    total_amount DECIMAL(15, 2),
    change_reason TEXT,
    extension_reason TEXT,
    contract_period VARCHAR(255),
    contract_start_date DATE,
    contract_end_date DATE,
    payment_method VARCHAR(50),
    status VARCHAR(50),
    created_by VARCHAR(255),
    proposal_date DATE,
    approval_date DATE,
    is_draft BOOLEAN,
    wysiwyg_content TEXT,
    other TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    PRIMARY KEY (backup_id, backup_date)
);

CREATE INDEX IF NOT EXISTS idx_proposals_backup_date ON proposals_backup(backup_date);

-- 7. contracts 백업 테이블
CREATE TABLE IF NOT EXISTS contracts_backup (
    backup_id SERIAL,
    backup_date DATE NOT NULL DEFAULT CURRENT_DATE,
    backup_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- 원본 테이블 컬럼
    id INTEGER,
    proposal_id INTEGER,
    contract_number VARCHAR(255),
    contract_type VARCHAR(50),
    supplier_id INTEGER,
    contract_amount DECIMAL(15, 2),
    start_date DATE,
    end_date DATE,
    payment_method VARCHAR(50),
    status VARCHAR(50),
    description TEXT,
    attachments JSON,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    PRIMARY KEY (backup_id, backup_date)
);

CREATE INDEX IF NOT EXISTS idx_contracts_backup_date ON contracts_backup(backup_date);

-- 8. approval_lines 백업 테이블
CREATE TABLE IF NOT EXISTS approval_lines_backup (
    backup_id SERIAL,
    backup_date DATE NOT NULL DEFAULT CURRENT_DATE,
    backup_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- 원본 테이블 컬럼
    id INTEGER,
    proposal_id INTEGER,
    step INTEGER,
    name VARCHAR(255),
    title VARCHAR(255),
    description TEXT,
    is_conditional BOOLEAN,
    is_final BOOLEAN,
    status VARCHAR(50),
    approved_at TIMESTAMP,
    approved_by VARCHAR(255),
    comment TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    PRIMARY KEY (backup_id, backup_date)
);

CREATE INDEX IF NOT EXISTS idx_approval_lines_backup_date ON approval_lines_backup(backup_date);

-- 9. proposal_histories 백업 테이블
CREATE TABLE IF NOT EXISTS proposal_histories_backup (
    backup_id SERIAL,
    backup_date DATE NOT NULL DEFAULT CURRENT_DATE,
    backup_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- 원본 테이블 컬럼
    id INTEGER,
    proposal_id INTEGER,
    changed_by VARCHAR(255),
    changed_at TIMESTAMP,
    change_type VARCHAR(50),
    field_name VARCHAR(255),
    old_value TEXT,
    new_value TEXT,
    description TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    PRIMARY KEY (backup_id, backup_date)
);

CREATE INDEX IF NOT EXISTS idx_proposal_histories_backup_date ON proposal_histories_backup(backup_date);

-- 10. purchase_items 백업 테이블
CREATE TABLE IF NOT EXISTS purchase_items_backup (
    backup_id SERIAL,
    backup_date DATE NOT NULL DEFAULT CURRENT_DATE,
    backup_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- 원본 테이블 컬럼
    id INTEGER,
    proposal_id INTEGER,
    supplier_id INTEGER,
    item VARCHAR(255),
    product_name VARCHAR(255),
    quantity INTEGER,
    unit_price DECIMAL(15, 2),
    amount DECIMAL(15, 2),
    supplier VARCHAR(255),
    request_department VARCHAR(255),
    contract_period_type VARCHAR(50),
    custom_contract_period TEXT,
    contract_start_date DATE,
    contract_end_date DATE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    PRIMARY KEY (backup_id, backup_date)
);

CREATE INDEX IF NOT EXISTS idx_purchase_items_backup_date ON purchase_items_backup(backup_date);

-- 11. cost_departments 백업 테이블
CREATE TABLE IF NOT EXISTS cost_departments_backup (
    backup_id SERIAL,
    backup_date DATE NOT NULL DEFAULT CURRENT_DATE,
    backup_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- 원본 테이블 컬럼
    id INTEGER,
    proposal_id INTEGER,
    department_id INTEGER,
    department VARCHAR(255),
    amount DECIMAL(15, 2),
    ratio DECIMAL(5, 2),
    purchase_item_id INTEGER,
    allocation_type VARCHAR(50),
    service_item_id INTEGER,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    PRIMARY KEY (backup_id, backup_date)
);

CREATE INDEX IF NOT EXISTS idx_cost_departments_backup_date ON cost_departments_backup(backup_date);

-- 12. request_departments 백업 테이블
CREATE TABLE IF NOT EXISTS request_departments_backup (
    backup_id SERIAL,
    backup_date DATE NOT NULL DEFAULT CURRENT_DATE,
    backup_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- 원본 테이블 컬럼
    id INTEGER,
    proposal_id INTEGER,
    department_id INTEGER,
    department VARCHAR(255),
    name VARCHAR(255),
    code VARCHAR(255),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    PRIMARY KEY (backup_id, backup_date)
);

CREATE INDEX IF NOT EXISTS idx_request_departments_backup_date ON request_departments_backup(backup_date);

-- 13. contract_methods 백업 테이블
CREATE TABLE IF NOT EXISTS contract_methods_backup (
    backup_id SERIAL,
    backup_date DATE NOT NULL DEFAULT CURRENT_DATE,
    backup_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- 원본 테이블 컬럼
    id INTEGER,
    name VARCHAR(255),
    code VARCHAR(100),
    description TEXT,
    is_active BOOLEAN,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    PRIMARY KEY (backup_id, backup_date)
);

CREATE INDEX IF NOT EXISTS idx_contract_methods_backup_date ON contract_methods_backup(backup_date);

-- 14. service_items 백업 테이블
CREATE TABLE IF NOT EXISTS service_items_backup (
    backup_id SERIAL,
    backup_date DATE NOT NULL DEFAULT CURRENT_DATE,
    backup_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- 원본 테이블 컬럼
    id INTEGER,
    proposal_id INTEGER,
    supplier_id INTEGER,
    item VARCHAR(255),
    name VARCHAR(255),
    personnel INTEGER,
    skill_level VARCHAR(50),
    period DECIMAL(10, 2),
    monthly_rate DECIMAL(15, 2),
    contract_amount DECIMAL(15, 2),
    supplier VARCHAR(255),
    credit_rating VARCHAR(255),
    contract_period_start TIMESTAMP,
    contract_period_end TIMESTAMP,
    payment_method VARCHAR(255),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    PRIMARY KEY (backup_id, backup_date)
);

CREATE INDEX IF NOT EXISTS idx_service_items_backup_date ON service_items_backup(backup_date);

-- 15. personnel 백업 테이블
CREATE TABLE IF NOT EXISTS personnel_backup (
    backup_id SERIAL,
    backup_date DATE NOT NULL DEFAULT CURRENT_DATE,
    backup_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- 원본 테이블 컬럼
    id INTEGER,
    division VARCHAR(100),
    department VARCHAR(100),
    position VARCHAR(100),
    employee_number VARCHAR(50),
    name VARCHAR(100),
    rank VARCHAR(50),
    duties TEXT,
    job_function VARCHAR(100),
    bok_job_function VARCHAR(100),
    job_category VARCHAR(100),
    is_it_personnel BOOLEAN,
    is_security_personnel BOOLEAN,
    birth_date DATE,
    gender VARCHAR(10),
    age INTEGER,
    group_join_date DATE,
    join_date DATE,
    resignation_date DATE,
    total_service_years DECIMAL(5, 2),
    career_base_date DATE,
    it_career_years DECIMAL(5, 2),
    current_duty_date DATE,
    current_duty_period DECIMAL(5, 2),
    previous_department VARCHAR(100),
    major VARCHAR(100),
    is_it_major BOOLEAN,
    it_certificate_1 VARCHAR(100),
    it_certificate_2 VARCHAR(100),
    it_certificate_3 VARCHAR(100),
    it_certificate_4 VARCHAR(100),
    is_active BOOLEAN,
    notes TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    PRIMARY KEY (backup_id, backup_date)
);

CREATE INDEX IF NOT EXISTS idx_personnel_backup_date ON personnel_backup(backup_date);

-- 백업 테이블 생성 완료 메시지
DO $$
BEGIN
    RAISE NOTICE '====================================';
    RAISE NOTICE '백업 테이블 생성이 완료되었습니다.';
    RAISE NOTICE '총 15개 테이블의 백업 테이블 생성됨';
    RAISE NOTICE '====================================';
END $$;

