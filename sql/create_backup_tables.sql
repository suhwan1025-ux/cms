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
    title VARCHAR(255),
    type VARCHAR(50),
    department VARCHAR(100),
    requester VARCHAR(100),
    request_date DATE,
    amount DECIMAL(15, 2),
    budget_id INTEGER,
    supplier_id INTEGER,
    contract_type VARCHAR(50),
    description TEXT,
    status VARCHAR(50),
    approval_status VARCHAR(50),
    content TEXT,
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
    contract_number VARCHAR(100),
    contract_name VARCHAR(255),
    supplier_id INTEGER,
    contract_type VARCHAR(50),
    contract_amount DECIMAL(15, 2),
    start_date DATE,
    end_date DATE,
    status VARCHAR(50),
    department VARCHAR(100),
    manager VARCHAR(100),
    description TEXT,
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
    approver_name VARCHAR(100),
    approver_position VARCHAR(100),
    approval_order INTEGER,
    status VARCHAR(50),
    approved_at TIMESTAMP,
    comments TEXT,
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
    action VARCHAR(100),
    actor VARCHAR(100),
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
    item_name VARCHAR(255),
    specification TEXT,
    quantity INTEGER,
    unit_price DECIMAL(15, 2),
    total_price DECIMAL(15, 2),
    notes TEXT,
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
    department_name VARCHAR(100),
    amount DECIMAL(15, 2),
    percentage DECIMAL(5, 2),
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
    name VARCHAR(255),
    code VARCHAR(100),
    is_active BOOLEAN,
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
    name VARCHAR(255),
    category VARCHAR(100),
    description TEXT,
    unit_price DECIMAL(15, 2),
    supplier_id INTEGER,
    is_active BOOLEAN,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    PRIMARY KEY (backup_id, backup_date)
);

CREATE INDEX IF NOT EXISTS idx_service_items_backup_date ON service_items_backup(backup_date);

-- 백업 테이블 생성 완료 메시지
DO $$
BEGIN
    RAISE NOTICE '====================================';
    RAISE NOTICE '백업 테이블 생성이 완료되었습니다.';
    RAISE NOTICE '총 14개 테이블의 백업 테이블 생성됨';
    RAISE NOTICE '====================================';
END $$;

