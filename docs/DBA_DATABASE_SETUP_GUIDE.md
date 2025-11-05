# 📘 계약관리시스템(CMS) 데이터베이스 구축 가이드 (DBA용)

**작성일**: 2025-11-05  
**대상**: 폐쇄망 환경 DBA  
**목적**: PostgreSQL 데이터베이스 스키마 구축 및 초기 데이터 설정

---

## 📋 목차

1. [문서 개요](#문서-개요)
2. [시스템 요구사항](#시스템-요구사항)
3. [데이터베이스 기본 정보](#데이터베이스-기본-정보)
4. [PostgreSQL 설치 및 설정](#postgresql-설치-및-설정)
5. [데이터베이스 생성](#데이터베이스-생성)
6. [스키마 생성](#스키마-생성)
7. [인덱스 생성](#인덱스-생성)
8. [초기 데이터 삽입](#초기-데이터-삽입)
9. [검증 쿼리](#검증-쿼리)
10. [구축 체크리스트](#구축-체크리스트)

---

## 문서 개요

### 목적
본 문서는 폐쇄망 환경에서 계약관리시스템(CMS)의 PostgreSQL 데이터베이스를 처음부터 구축하기 위한 상세 가이드입니다.

### 특징
- ✅ 실행 가능한 SQL 스크립트 제공
- ✅ 단계별 구축 절차
- ✅ 외래키 및 인덱스 포함
- ✅ 초기 마스터 데이터 포함
- ✅ 검증 쿼리 제공

---

## 시스템 요구사항

### 하드웨어
- **CPU**: 2 Core 이상
- **메모리**: 4GB 이상 (권장: 8GB)
- **디스크**: 50GB 이상 여유 공간

### 소프트웨어
- **OS**: Windows Server 2016 이상 또는 Linux (CentOS 7+, Ubuntu 18.04+)
- **PostgreSQL**: 버전 12.x 이상 (권장: 14.x)
- **문자셋**: UTF-8

### 네트워크
- 애플리케이션 서버와 통신 가능한 포트: **5432** (기본값)

---

## 데이터베이스 기본 정보

### 데이터베이스 정보
```
데이터베이스명: contract_management
소유자: cms_admin
문자셋: UTF8
Collation: ko_KR.UTF-8 (또는 C)
```

### 사용자 정보
```
관리자 계정: cms_admin (전체 권한)
읽기 전용 계정: cms_reader (SELECT만)
```

### 연결 정보 (예시)
```
Host: localhost
Port: 5432
Database: contract_management
Username: cms_admin
Password: (설치 시 설정)
```

### 테이블 개수
총 **26개** 테이블

### 핵심 테이블
1. **proposals** - 품의서 (핵심)
2. **purchase_items** - 구매품목
3. **service_items** - 용역항목
4. **business_budgets** - 사업예산
5. **budgets** - 일반예산
6. **approval_lines** - 결재라인
7. **departments** - 부서
8. **suppliers** - 공급업체

---

## PostgreSQL 설치 및 설정

### Windows 환경 설치

```powershell
# PostgreSQL 14.x 설치 후 서비스 확인
Get-Service postgresql-x64-14

# 서비스 시작
Start-Service postgresql-x64-14
```

### Linux 환경 설치 (CentOS/RHEL)

```bash
# PostgreSQL 14 설치
sudo yum install -y postgresql14-server postgresql14-contrib

# 데이터베이스 초기화
sudo /usr/pgsql-14/bin/postgresql-14-setup initdb

# 서비스 시작 및 활성화
sudo systemctl start postgresql-14
sudo systemctl enable postgresql-14
```

### PostgreSQL 설정 파일 수정

#### 1. postgresql.conf
```bash
# 위치: /var/lib/pgsql/14/data/postgresql.conf (Linux)
#      C:\Program Files\PostgreSQL\14\data\postgresql.conf (Windows)

# 수정할 항목
listen_addresses = '*'          # 모든 IP에서 접근 허용 (필요시)
port = 5432                     # 포트 번호
max_connections = 100           # 최대 연결 수
shared_buffers = 256MB          # 공유 버퍼
effective_cache_size = 1GB      # 캐시 크기
timezone = 'Asia/Seoul'         # 시간대 설정
```

#### 2. pg_hba.conf (접근 제어)
```bash
# 위치: 동일 디렉토리

# 로컬 연결
local   all             all                                     trust
host    all             all             127.0.0.1/32            md5

# 네트워크 연결 (필요시 추가)
host    contract_management    cms_admin       192.168.0.0/16      md5
```

#### 3. 설정 적용
```bash
# PostgreSQL 재시작
sudo systemctl restart postgresql-14   # Linux
# 또는
Restart-Service postgresql-x64-14     # Windows PowerShell
```

---

## 데이터베이스 생성

### 1. PostgreSQL 접속
```bash
# postgres 사용자로 접속
sudo -u postgres psql
```

### 2. 사용자 생성
```sql
-- 관리자 계정 생성
CREATE USER cms_admin WITH PASSWORD 'YOUR_SECURE_PASSWORD_HERE';

-- 읽기 전용 계정 생성
CREATE USER cms_reader WITH PASSWORD 'YOUR_READONLY_PASSWORD_HERE';
```

### 3. 데이터베이스 생성
```sql
-- 데이터베이스 생성
CREATE DATABASE contract_management
    WITH 
    OWNER = cms_admin
    ENCODING = 'UTF8'
    LC_COLLATE = 'ko_KR.UTF-8'
    LC_CTYPE = 'ko_KR.UTF-8'
    TEMPLATE = template0;

-- 연결 제한 설정 (필요시)
ALTER DATABASE contract_management CONNECTION LIMIT -1;

-- 코멘트 추가
COMMENT ON DATABASE contract_management IS '계약관리시스템 데이터베이스';
```

### 4. 권한 부여
```sql
-- 데이터베이스 연결
\c contract_management

-- 스키마 권한
GRANT ALL PRIVILEGES ON SCHEMA public TO cms_admin;

-- 기존 테이블 권한
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO cms_admin;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO cms_reader;

-- 시퀀스 권한
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO cms_admin;

-- 향후 생성될 객체에 대한 기본 권한 설정
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
    GRANT ALL PRIVILEGES ON TABLES TO cms_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
    GRANT SELECT ON TABLES TO cms_reader;
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
    GRANT ALL PRIVILEGES ON SEQUENCES TO cms_admin;
```

---

## 스키마 생성

### 실행 방법
```bash
# SQL 파일로 저장 후 실행
psql -U cms_admin -d contract_management -f create_tables.sql
```

### 전체 테이블 생성 SQL

```sql
-- =====================================================
-- 계약관리시스템(CMS) 전체 스키마 생성 스크립트
-- 버전: 1.0
-- 생성일: 2025-11-05
-- =====================================================

-- 기존 테이블 삭제 (재생성 시에만 사용, 주의!)
-- DROP TABLE IF EXISTS proposal_histories CASCADE;
-- DROP TABLE IF EXISTS approval_lines CASCADE;
-- ... (모든 테이블)

-- =====================================================
-- 1. 마이그레이션 이력 테이블
-- =====================================================
CREATE TABLE IF NOT EXISTS "SequelizeMeta" (
    name VARCHAR(255) PRIMARY KEY
);

COMMENT ON TABLE "SequelizeMeta" IS 'Sequelize 마이그레이션 이력';

-- =====================================================
-- 2. 부서 테이블
-- =====================================================
CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    code VARCHAR(50) UNIQUE,
    parent_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
    manager VARCHAR(255),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_departments_parent ON departments(parent_id);
CREATE INDEX idx_departments_active ON departments(is_active);

COMMENT ON TABLE departments IS '부서 정보';
COMMENT ON COLUMN departments.parent_id IS '상위 부서 ID (계층 구조)';

-- =====================================================
-- 3. 공급업체 테이블
-- =====================================================
CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    business_number VARCHAR(50) UNIQUE,
    representative VARCHAR(255),
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(255),
    credit_rating VARCHAR(10),
    business_type VARCHAR(255),
    registration_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_suppliers_active ON suppliers(is_active);
CREATE INDEX idx_suppliers_name ON suppliers(name);

COMMENT ON TABLE suppliers IS '공급업체 정보';
COMMENT ON COLUMN suppliers.business_number IS '사업자등록번호';
COMMENT ON COLUMN suppliers.credit_rating IS '신용등급';

-- =====================================================
-- 4. 예산 테이블
-- =====================================================
CREATE TABLE IF NOT EXISTS budgets (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    year INTEGER NOT NULL,
    type VARCHAR(20) DEFAULT 'general' CHECK (type IN ('general', 'business')),
    total_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
    used_amount NUMERIC(15,2) DEFAULT 0,
    remaining_amount NUMERIC(15,2),
    department VARCHAR(255),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_budgets_year ON budgets(year);
CREATE INDEX idx_budgets_type ON budgets(type);
CREATE INDEX idx_budgets_active ON budgets(is_active);

COMMENT ON TABLE budgets IS '일반 예산';
COMMENT ON COLUMN budgets.type IS '예산 유형: general(일반), business(사업)';
COMMENT ON COLUMN budgets.remaining_amount IS '잔여금액 (자동계산)';

-- =====================================================
-- 5. 계약방식 테이블
-- =====================================================
CREATE TABLE IF NOT EXISTS contract_methods (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    value VARCHAR(255),
    description TEXT,
    basis TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_contract_methods_active ON contract_methods(is_active);

COMMENT ON TABLE contract_methods IS '계약방식 마스터 데이터';
COMMENT ON COLUMN contract_methods.basis IS '법적 근거';

-- =====================================================
-- 6. 사업예산 테이블
-- =====================================================
CREATE TABLE IF NOT EXISTS business_budgets (
    id SERIAL PRIMARY KEY,
    project_name VARCHAR(255) NOT NULL,
    initiator_department VARCHAR(100) NOT NULL,
    executor_department VARCHAR(100) NOT NULL,
    budget_type VARCHAR(50) NOT NULL,
    budget_category VARCHAR(100) NOT NULL,
    budget_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
    additional_budget NUMERIC(15,2) DEFAULT 0,
    executed_amount NUMERIC(15,2) DEFAULT 0,
    pending_amount NUMERIC(15,2) DEFAULT 0,
    confirmed_execution_amount NUMERIC(15,2) DEFAULT 0,
    unexecuted_amount NUMERIC(15,2) DEFAULT 0,
    start_date VARCHAR(7) NOT NULL,
    end_date VARCHAR(7) NOT NULL,
    is_essential BOOLEAN DEFAULT FALSE,
    project_purpose VARCHAR(10) NOT NULL,
    budget_year INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT '승인대기',
    created_by VARCHAR(100) DEFAULT '작성자',
    hold_cancel_reason TEXT,
    notes TEXT,
    it_plan_reported BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_business_budgets_year ON business_budgets(budget_year);
CREATE INDEX idx_business_budgets_status ON business_budgets(status);

COMMENT ON TABLE business_budgets IS '사업예산';
COMMENT ON COLUMN business_budgets.confirmed_execution_amount IS '확정집행액 (결재완료 품의서 합계)';
COMMENT ON COLUMN business_budgets.unexecuted_amount IS '미집행액 (자동계산)';

-- =====================================================
-- 7. 사업예산 상세 테이블
-- =====================================================
CREATE TABLE IF NOT EXISTS business_budget_details (
    id SERIAL PRIMARY KEY,
    budget_id INTEGER REFERENCES business_budgets(id) ON DELETE CASCADE,
    item_name VARCHAR(255) NOT NULL,
    item_description TEXT,
    unit_price NUMERIC(15,2) NOT NULL,
    quantity INTEGER NOT NULL,
    total_amount NUMERIC(15,2) NOT NULL,
    executed_amount NUMERIC(15,2) DEFAULT 0,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_business_budget_details_budget ON business_budget_details(budget_id);

COMMENT ON TABLE business_budget_details IS '사업예산 상세 항목';

-- =====================================================
-- 8. 사업예산 변경이력 테이블
-- =====================================================
CREATE TABLE IF NOT EXISTS business_budget_history (
    id SERIAL PRIMARY KEY,
    budget_id INTEGER NOT NULL REFERENCES business_budgets(id) ON DELETE CASCADE,
    change_type VARCHAR(20) NOT NULL,
    changed_field VARCHAR(100),
    old_value TEXT,
    new_value TEXT,
    changed_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    changed_by VARCHAR(100),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_business_budget_history_budget ON business_budget_history(budget_id);
CREATE INDEX idx_business_budget_history_date ON business_budget_history(changed_at);

COMMENT ON TABLE business_budget_history IS '사업예산 변경 이력';
COMMENT ON COLUMN business_budget_history.change_type IS '변경유형: created, updated, deleted';

-- =====================================================
-- 9. 사업예산 결재 테이블
-- =====================================================
CREATE TABLE IF NOT EXISTS business_budget_approvals (
    id SERIAL PRIMARY KEY,
    budget_id INTEGER REFERENCES business_budgets(id) ON DELETE CASCADE,
    approver_name VARCHAR(100) NOT NULL,
    approver_title VARCHAR(100) NOT NULL,
    approval_status VARCHAR(20) NOT NULL,
    approval_comment TEXT,
    approved_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_business_budget_approvals_budget ON business_budget_approvals(budget_id);

COMMENT ON TABLE business_budget_approvals IS '사업예산 결재';

-- =====================================================
-- 10. 품의서 테이블 (핵심)
-- =====================================================
CREATE TABLE IF NOT EXISTS proposals (
    id SERIAL PRIMARY KEY,
    contract_type VARCHAR(50) NOT NULL,
    title VARCHAR(500),
    purpose TEXT NOT NULL,
    basis TEXT NOT NULL,
    budget_id INTEGER REFERENCES business_budgets(id) ON DELETE SET NULL,
    contract_method VARCHAR(50),
    contract_method_id INTEGER REFERENCES contract_methods(id) ON DELETE SET NULL,
    account_subject VARCHAR(255),
    total_amount NUMERIC(15,2) DEFAULT 0,
    change_reason TEXT,
    extension_reason TEXT,
    contract_period VARCHAR(255),
    contract_start_date DATE,
    contract_end_date DATE,
    payment_method VARCHAR(50),
    status VARCHAR(50) DEFAULT 'draft',
    created_by VARCHAR(255),
    proposal_date DATE,
    approval_date DATE,
    is_draft BOOLEAN DEFAULT FALSE,
    wysiwyg_content TEXT,
    other TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_proposals_budget_status ON proposals(budget_id, status);
CREATE INDEX idx_proposals_status ON proposals(status);
CREATE INDEX idx_proposals_type ON proposals(contract_type);
CREATE INDEX idx_proposals_date ON proposals(proposal_date);

COMMENT ON TABLE proposals IS '품의서 (시스템 핵심 테이블)';
COMMENT ON COLUMN proposals.contract_type IS '계약유형: 구매/변경/연장/용역/입찰';
COMMENT ON COLUMN proposals.status IS '상태: draft/pending/approved/rejected';
COMMENT ON COLUMN proposals.is_draft IS '임시저장 여부';

-- =====================================================
-- 11. 구매품목 테이블
-- =====================================================
CREATE TABLE IF NOT EXISTS purchase_items (
    id SERIAL PRIMARY KEY,
    proposal_id INTEGER NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
    supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
    item VARCHAR(255) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(15,2) NOT NULL,
    amount NUMERIC(15,2) NOT NULL,
    supplier VARCHAR(255) NOT NULL,
    request_department VARCHAR(255),
    contract_period_type VARCHAR(50) DEFAULT 'permanent',
    custom_contract_period TEXT,
    contract_start_date DATE,
    contract_end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_purchase_items_proposal ON purchase_items(proposal_id);
CREATE INDEX idx_purchase_items_supplier ON purchase_items(supplier_id);

COMMENT ON TABLE purchase_items IS '구매품목';
COMMENT ON COLUMN purchase_items.contract_period_type IS '계약기간 유형: permanent/temporary';

-- =====================================================
-- 12. 용역항목 테이블
-- =====================================================
CREATE TABLE IF NOT EXISTS service_items (
    id SERIAL PRIMARY KEY,
    proposal_id INTEGER NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
    supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
    item VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    personnel INTEGER NOT NULL DEFAULT 1,
    skill_level VARCHAR(50),
    period NUMERIC(10,2) NOT NULL DEFAULT 1,
    monthly_rate NUMERIC(15,2) NOT NULL,
    contract_amount NUMERIC(15,2) NOT NULL,
    supplier VARCHAR(255) NOT NULL,
    credit_rating VARCHAR(255),
    contract_period_start TIMESTAMP WITH TIME ZONE,
    contract_period_end TIMESTAMP WITH TIME ZONE,
    payment_method VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_service_items_proposal ON service_items(proposal_id);
CREATE INDEX idx_service_items_supplier ON service_items(supplier_id);

COMMENT ON TABLE service_items IS '용역항목';
COMMENT ON COLUMN service_items.period IS '용역기간 (개월, 소수점 가능)';
COMMENT ON COLUMN service_items.personnel IS '투입인원';

-- =====================================================
-- 13. 비용귀속부서 테이블
-- =====================================================
CREATE TABLE IF NOT EXISTS cost_departments (
    id SERIAL PRIMARY KEY,
    proposal_id INTEGER NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
    department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
    department VARCHAR(255) NOT NULL,
    amount NUMERIC(15,2) NOT NULL,
    ratio NUMERIC(5,2) DEFAULT 0,
    purchase_item_id INTEGER REFERENCES purchase_items(id) ON DELETE CASCADE,
    service_item_id INTEGER REFERENCES service_items(id) ON DELETE CASCADE,
    allocation_type VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_cost_departments_proposal ON cost_departments(proposal_id);
CREATE INDEX idx_cost_departments_department ON cost_departments(department_id);
CREATE INDEX idx_cost_departments_purchase_item ON cost_departments(purchase_item_id);
CREATE INDEX idx_cost_departments_service_item ON cost_departments(service_item_id);

COMMENT ON TABLE cost_departments IS '비용귀속부서 (품의서별 비용 배분)';
COMMENT ON COLUMN cost_departments.ratio IS '배분 비율 (%)';

-- =====================================================
-- 14. 요청부서 테이블
-- =====================================================
CREATE TABLE IF NOT EXISTS request_departments (
    id SERIAL PRIMARY KEY,
    proposal_id INTEGER NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
    department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
    department VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    code VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_request_departments_proposal ON request_departments(proposal_id);
CREATE INDEX idx_request_departments_department ON request_departments(department_id);

COMMENT ON TABLE request_departments IS '요청부서';

-- =====================================================
-- 15. 결재라인 테이블
-- =====================================================
CREATE TABLE IF NOT EXISTS approval_lines (
    id SERIAL PRIMARY KEY,
    proposal_id INTEGER NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
    step INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    is_conditional BOOLEAN DEFAULT FALSE,
    is_final BOOLEAN DEFAULT FALSE,
    status VARCHAR(50) DEFAULT 'pending',
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by VARCHAR(255),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_approval_lines_proposal ON approval_lines(proposal_id);
CREATE INDEX idx_approval_lines_step ON approval_lines(proposal_id, step);
CREATE INDEX idx_approval_lines_status ON approval_lines(status);

COMMENT ON TABLE approval_lines IS '품의서 결재라인';
COMMENT ON COLUMN approval_lines.step IS '결재 순서';
COMMENT ON COLUMN approval_lines.status IS '결재상태: pending/approved/rejected';

-- =====================================================
-- 16. 결재규칙 테이블
-- =====================================================
CREATE TABLE IF NOT EXISTS approval_rules (
    id SERIAL PRIMARY KEY,
    rule_type VARCHAR(50) NOT NULL,
    rule_name VARCHAR(255) NOT NULL,
    rule_content TEXT NOT NULL,
    basis TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_approval_rules_type ON approval_rules(rule_type);
CREATE INDEX idx_approval_rules_active ON approval_rules(is_active);

COMMENT ON TABLE approval_rules IS '결재 규칙';

-- =====================================================
-- 17. 결재자 테이블
-- =====================================================
CREATE TABLE IF NOT EXISTS approval_approvers (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    department VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    basis TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_approval_approvers_active ON approval_approvers(is_active);

COMMENT ON TABLE approval_approvers IS '결재자 정보';

-- =====================================================
-- 18. 결재조건 테이블
-- =====================================================
CREATE TABLE IF NOT EXISTS approval_conditions (
    id SERIAL PRIMARY KEY,
    approver_id INTEGER NOT NULL REFERENCES approval_approvers(id) ON DELETE CASCADE,
    condition_type VARCHAR(50) NOT NULL,
    condition_value VARCHAR(255) NOT NULL,
    condition_label VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_approval_conditions_approver ON approval_conditions(approver_id);

COMMENT ON TABLE approval_conditions IS '결재조건 (금액별, 유형별)';

-- =====================================================
-- 19. 결재참조 테이블
-- =====================================================
CREATE TABLE IF NOT EXISTS approval_references (
    id SERIAL PRIMARY KEY,
    amount_range VARCHAR(255) NOT NULL,
    min_amount NUMERIC(15,2),
    max_amount NUMERIC(15,2),
    included_approvers TEXT NOT NULL,
    final_approver VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_approval_references_active ON approval_references(is_active);

COMMENT ON TABLE approval_references IS '결재 참조표';

-- =====================================================
-- 20. 계약 테이블
-- =====================================================
CREATE TABLE IF NOT EXISTS contracts (
    id SERIAL PRIMARY KEY,
    proposal_id INTEGER NOT NULL REFERENCES proposals(id) ON DELETE RESTRICT,
    contract_number VARCHAR(255) NOT NULL UNIQUE,
    contract_type VARCHAR(50) NOT NULL,
    supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
    contract_amount NUMERIC(15,2) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    payment_method VARCHAR(50),
    status VARCHAR(50) DEFAULT 'draft',
    description TEXT,
    attachments JSON,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_contracts_proposal ON contracts(proposal_id);
CREATE INDEX idx_contracts_status ON contracts(status);

COMMENT ON TABLE contracts IS '계약 정보';
COMMENT ON COLUMN contracts.contract_number IS '계약번호 (UNIQUE)';

-- =====================================================
-- 21. 품의서 변경이력 테이블
-- =====================================================
CREATE TABLE IF NOT EXISTS proposal_histories (
    id SERIAL PRIMARY KEY,
    proposal_id INTEGER NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
    changed_by VARCHAR(255) NOT NULL,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    change_type VARCHAR(50) NOT NULL,
    field_name VARCHAR(255),
    old_value TEXT,
    new_value TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_proposal_histories_proposal ON proposal_histories(proposal_id);
CREATE INDEX idx_proposal_histories_date ON proposal_histories(changed_at);

COMMENT ON TABLE proposal_histories IS '품의서 변경 이력';

-- =====================================================
-- 22. 구매품목 비용배분 테이블
-- =====================================================
CREATE TABLE IF NOT EXISTS purchase_item_cost_allocations (
    id SERIAL PRIMARY KEY,
    purchase_item_id INTEGER NOT NULL REFERENCES purchase_items(id) ON DELETE CASCADE,
    department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
    department VARCHAR(255) NOT NULL,
    amount NUMERIC(15,2) NOT NULL,
    ratio NUMERIC(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_purchase_cost_allocations_item ON purchase_item_cost_allocations(purchase_item_id);
CREATE INDEX idx_purchase_cost_allocations_dept ON purchase_item_cost_allocations(department_id);

COMMENT ON TABLE purchase_item_cost_allocations IS '구매품목별 비용 배분';

-- =====================================================
-- 23. 사업목적 테이블
-- =====================================================
CREATE TABLE IF NOT EXISTS project_purposes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(10) NOT NULL,
    description TEXT NOT NULL,
    year INTEGER NOT NULL,
    is_fixed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(code, year)
);

CREATE INDEX idx_project_purposes_code ON project_purposes(code);
CREATE INDEX idx_project_purposes_year ON project_purposes(year);

COMMENT ON TABLE project_purposes IS '사업목적 템플릿';
COMMENT ON COLUMN project_purposes.is_fixed IS '고정 사업목적 여부';

-- =====================================================
-- 24. 문서템플릿 테이블
-- =====================================================
CREATE TABLE IF NOT EXISTS document_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    content TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'general',
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    created_by VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_document_templates_active ON document_templates(is_active);
CREATE INDEX idx_document_templates_category ON document_templates(category);

COMMENT ON TABLE document_templates IS '문서 템플릿 (계약서 등)';

-- =====================================================
-- 25. 작업 테이블
-- =====================================================
CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    task_name VARCHAR(200) NOT NULL,
    description TEXT,
    shared_folder_path VARCHAR(500),
    start_date DATE,
    end_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    assigned_department VARCHAR(100),
    assigned_person VARCHAR(100),
    priority VARCHAR(10) NOT NULL DEFAULT 'medium',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_active ON tasks(is_active);

COMMENT ON TABLE tasks IS '작업 관리';

-- =====================================================
-- 26. 구매이력 테이블
-- =====================================================
CREATE TABLE IF NOT EXISTS purchase_history (
    id SERIAL PRIMARY KEY,
    proposal_id INTEGER REFERENCES proposals(id) ON DELETE SET NULL,
    supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
    purchase_date DATE,
    purchase_amount NUMERIC(15,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_purchase_history_proposal ON purchase_history(proposal_id);
CREATE INDEX idx_purchase_history_date ON purchase_history(purchase_date);

COMMENT ON TABLE purchase_history IS '구매 이력';

-- =====================================================
-- 스키마 생성 완료
-- =====================================================
```

---

## 인덱스 생성

인덱스는 위 스키마 생성 스크립트에 포함되어 있습니다. 별도로 추가할 인덱스가 있다면 아래와 같이 실행하세요:

```sql
-- 추가 복합 인덱스 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_proposals_budget_type 
    ON proposals(budget_id, contract_type, status);

CREATE INDEX IF NOT EXISTS idx_business_budgets_year_status 
    ON business_budgets(budget_year, status);

-- 전문 검색용 인덱스 (필요시)
CREATE INDEX IF NOT EXISTS idx_proposals_title_gin 
    ON proposals USING gin(to_tsvector('korean', title));
```

### 인덱스 확인 쿼리
```sql
-- 모든 인덱스 확인
SELECT 
    tablename, 
    indexname, 
    indexdef 
FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename, indexname;
```

---

## 초기 데이터 삽입

### 1. 부서 데이터
```sql
-- 부서 초기 데이터
INSERT INTO departments (name, code, parent_id, manager, is_active) VALUES
    ('경영기획본부', 'D001', NULL, '홍길동', TRUE),
    ('IT본부', 'D002', NULL, '김철수', TRUE),
    ('재무부', 'D003', NULL, '이영희', TRUE),
    ('인사부', 'D004', NULL, '박민수', TRUE),
    ('영업부', 'D005', NULL, '정수현', TRUE),
    ('개발팀', 'D002-1', 2, '최개발', TRUE);

-- 부서 수 확인
SELECT COUNT(*) FROM departments;
```

### 2. 계약방식 데이터
```sql
-- 계약방식 마스터 데이터
INSERT INTO contract_methods (code, name, value, description, basis, is_active) VALUES
    ('CM001', '일반경쟁입찰', '일반경쟁입찰', '일반경쟁입찰 방식', '국가계약법 제7조', TRUE),
    ('CM002', '제한경쟁입찰', '제한경쟁입찰', '제한경쟁입찰 방식', '국가계약법 제7조', TRUE),
    ('CM003', '지명경쟁입찰', '지명경쟁입찰', '지명경쟁입찰 방식', '국가계약법 제7조', TRUE),
    ('CM004', '수의계약', '수의계약', '수의계약 방식', '국가계약법 시행령 제26조', TRUE),
    ('CM005', '긴급수의계약', '긴급수의계약', '긴급수의계약 방식', '국가계약법 시행령 제26조', TRUE),
    ('CM006', '2단계경쟁입찰', '2단계경쟁입찰', '2단계경쟁입찰 방식', '국가계약법 제7조의2', TRUE),
    ('CM007', '협상에 의한 계약', '협상계약', '협상에 의한 계약 방식', '국가계약법 제7조의3', TRUE);

SELECT COUNT(*) FROM contract_methods;
```

### 3. 결재자 데이터
```sql
-- 결재자 기본 데이터
INSERT INTO approval_approvers (code, name, title, department, description, basis, is_active) VALUES
    ('APP001', '홍길동', '본부장', '경영기획본부', '경영기획본부 본부장', '결재규정 제3조', TRUE),
    ('APP002', '김철수', '본부장', 'IT본부', 'IT본부 본부장', '결재규정 제3조', TRUE),
    ('APP003', '이영희', '이사', '재무부', '재무부 이사', '결재규정 제4조', TRUE),
    ('APP004', '박민수', '대표이사', '경영진', '대표이사', '결재규정 제2조', TRUE);

SELECT COUNT(*) FROM approval_approvers;
```

### 4. 결재규칙 데이터
```sql
-- 결재규칙 기본 데이터
INSERT INTO approval_rules (rule_type, rule_name, rule_content, basis, is_active) VALUES
    ('amount', '1천만원 미만', '본부장 결재', '내부결재규정 제5조 제1항', TRUE),
    ('amount', '1천만원 이상 5천만원 미만', '본부장 + 재무이사 결재', '내부결재규정 제5조 제2항', TRUE),
    ('amount', '5천만원 이상', '본부장 + 재무이사 + 대표이사 결재', '내부결재규정 제5조 제3항', TRUE);

SELECT COUNT(*) FROM approval_rules;
```

### 5. 예산 데이터 (샘플)
```sql
-- 일반예산 샘플
INSERT INTO budgets (name, year, type, total_amount, used_amount, remaining_amount, department, is_active) VALUES
    ('2025년 IT 운영예산', 2025, 'general', 100000000, 0, 100000000, 'IT본부', TRUE),
    ('2025년 사무용품 예산', 2025, 'general', 50000000, 0, 50000000, '총무부', TRUE);

SELECT COUNT(*) FROM budgets;
```

### 6. 사업예산 데이터 (샘플)
```sql
-- 사업예산 샘플
INSERT INTO business_budgets (
    project_name, initiator_department, executor_department, 
    budget_type, budget_category, budget_amount, budget_year, 
    start_date, end_date, project_purpose, status
) VALUES
    ('차세대 시스템 구축', 'IT본부', 'IT본부', 'IT사업', 'IT투자', 500000000, 2025, '2025-01', '2025-12', 'I001', '승인완료'),
    ('업무 자동화 시스템', 'IT본부', 'IT본부', 'IT사업', 'IT운영', 200000000, 2025, '2025-03', '2025-12', 'I002', '승인완료');

SELECT COUNT(*) FROM business_budgets;
```

### 7. 공급업체 데이터 (샘플)
```sql
-- 공급업체 샘플
INSERT INTO suppliers (name, business_number, representative, phone, email, is_active) VALUES
    ('(주)테크솔루션', '123-45-67890', '김대표', '02-1234-5678', 'info@techsol.com', TRUE),
    ('소프트웨어코리아', '234-56-78901', '이대표', '02-2345-6789', 'contact@swkorea.com', TRUE),
    ('글로벌IT', '345-67-89012', '박대표', '02-3456-7890', 'sales@globalit.com', TRUE);

SELECT COUNT(*) FROM suppliers;
```

### 8. 사업목적 데이터 (샘플)
```sql
-- 사업목적 샘플 (2025년)
INSERT INTO project_purposes (code, description, year, is_fixed) VALUES
    ('I001', '디지털 전환 및 시스템 고도화', 2025, TRUE),
    ('I002', '업무 효율화 및 자동화', 2025, TRUE),
    ('I003', '정보보안 강화', 2025, TRUE),
    ('I004', '클라우드 인프라 구축', 2025, TRUE),
    ('I005', 'AI/빅데이터 플랫폼 구축', 2025, TRUE);

SELECT COUNT(*) FROM project_purposes;
```

---

## 검증 쿼리

### 1. 테이블 생성 확인
```sql
-- 모든 테이블 목록 확인
SELECT 
    table_name, 
    pg_size_pretty(pg_total_relation_size(quote_ident(table_name))) AS size
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- 예상 결과: 26개 테이블
```

### 2. 외래키 확인
```sql
-- 외래키 제약조건 확인
SELECT
    tc.table_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;
```

### 3. 인덱스 확인
```sql
-- 모든 인덱스 확인
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

### 4. 초기 데이터 확인
```sql
-- 각 테이블 레코드 수 확인
SELECT 'departments' AS table_name, COUNT(*) AS record_count FROM departments
UNION ALL
SELECT 'contract_methods', COUNT(*) FROM contract_methods
UNION ALL
SELECT 'approval_approvers', COUNT(*) FROM approval_approvers
UNION ALL
SELECT 'approval_rules', COUNT(*) FROM approval_rules
UNION ALL
SELECT 'budgets', COUNT(*) FROM budgets
UNION ALL
SELECT 'business_budgets', COUNT(*) FROM business_budgets
UNION ALL
SELECT 'suppliers', COUNT(*) FROM suppliers
UNION ALL
SELECT 'project_purposes', COUNT(*) FROM project_purposes
ORDER BY table_name;
```

### 5. 데이터베이스 크기 확인
```sql
-- 데이터베이스 전체 크기
SELECT 
    pg_database.datname,
    pg_size_pretty(pg_database_size(pg_database.datname)) AS size
FROM pg_database
WHERE datname = 'contract_management';
```

### 6. 연결 테스트
```sql
-- 현재 연결 정보
SELECT 
    current_database() AS database,
    current_user AS user,
    version() AS postgres_version,
    pg_postmaster_start_time() AS server_start_time;
```

---

## 구축 체크리스트

### PostgreSQL 설치 및 설정
- [ ] PostgreSQL 14.x 이상 설치
- [ ] postgresql.conf 설정 완료
- [ ] pg_hba.conf 접근 제어 설정
- [ ] PostgreSQL 서비스 시작
- [ ] 방화벽 포트(5432) 개방 (필요시)

### 데이터베이스 및 사용자 생성
- [ ] cms_admin 사용자 생성
- [ ] cms_reader 사용자 생성 (읽기 전용)
- [ ] contract_management 데이터베이스 생성
- [ ] 권한 부여 완료

### 스키마 구축
- [ ] 전체 테이블 생성 (26개)
- [ ] 인덱스 생성 확인
- [ ] 외래키 제약조건 확인
- [ ] 코멘트 확인

### 초기 데이터 삽입
- [ ] 부서 데이터 삽입
- [ ] 계약방식 데이터 삽입
- [ ] 결재자 데이터 삽입
- [ ] 결재규칙 데이터 삽입
- [ ] 예산 샘플 데이터 삽입 (선택)
- [ ] 사업예산 샘플 데이터 삽입 (선택)
- [ ] 공급업체 샘플 데이터 삽입 (선택)
- [ ] 사업목적 데이터 삽입

### 검증
- [ ] 테이블 생성 확인 (26개)
- [ ] 외래키 확인
- [ ] 인덱스 확인
- [ ] 초기 데이터 확인
- [ ] 데이터베이스 크기 확인
- [ ] 연결 테스트 (애플리케이션에서)

### 백업 설정
- [ ] pg_dump 백업 스크립트 작성
- [ ] 자동 백업 스케줄 설정
- [ ] 백업 저장소 확인

### 보안
- [ ] 관리자 비밀번호 강도 확인
- [ ] SSL 연결 설정 (필요시)
- [ ] 접근 IP 제한 설정
- [ ] 감사 로그 활성화 (필요시)

---

## 추가 참고사항

### 애플리케이션 연결 문자열
```
# PostgreSQL 연결 문자열 (Node.js)
postgresql://cms_admin:YOUR_PASSWORD@localhost:5432/contract_management

# 환경변수 설정 (.env 파일)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=contract_management
DB_USERNAME=cms_admin
DB_PASSWORD=YOUR_PASSWORD
```

### 백업 명령어
```bash
# 전체 데이터베이스 백업
pg_dump -U cms_admin -d contract_management -F c -b -v -f backup_$(date +%Y%m%d).dump

# 복원
pg_restore -U cms_admin -d contract_management -v backup_20251105.dump
```

### 유지보수 명령어
```sql
-- 테이블 통계 업데이트
ANALYZE;

-- 인덱스 재구축
REINDEX DATABASE contract_management;

-- 불필요한 공간 정리
VACUUM FULL;
```

---

## 문의사항

데이터베이스 구축 중 문제가 발생하면 다음 정보를 포함하여 문의하세요:

1. PostgreSQL 버전
2. 운영체제 및 버전
3. 에러 메시지 전체
4. 실행한 SQL 명령어
5. 현재 단계 (체크리스트 기준)

---

**문서 버전**: 1.0  
**최종 업데이트**: 2025-11-05  
**작성자**: CMS 개발팀  
**다음 업데이트 예정일**: 2025-12-05


