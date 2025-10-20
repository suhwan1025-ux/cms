# 📊 데이터베이스 스키마 문서

계약관리시스템(CMS)의 데이터베이스 스키마 상세 문서입니다.

## 📋 목차

- [개요](#개요)
- [ER 다이어그램 개념](#er-다이어그램-개념)
- [테이블 목록](#테이블-목록)
- [테이블 상세](#테이블-상세)
  - [핵심 테이블](#핵심-테이블)
  - [예산 관련 테이블](#예산-관련-테이블)
  - [결재 관련 테이블](#결재-관련-테이블)
  - [기준 정보 테이블](#기준-정보-테이블)

---

## 개요

### 데이터베이스 정보
- **DBMS**: PostgreSQL 12.x 이상
- **문자셋**: UTF-8
- **총 테이블 수**: 26개
- **주요 기능**: 품의서 관리, 예산 관리, 결재 프로세스, 계약 관리

### 네이밍 규칙
- **테이블명**: snake_case (예: `business_budgets`)
- **컬럼명**: camelCase → snake_case 변환 (Sequelize underscored 옵션 사용)
- **외래키**: `{참조테이블}_id` 형식

---

## ER 다이어그램 개념

```
┌─────────────┐
│  Proposals  │ (품의서) - 시스템의 핵심 테이블
└──────┬──────┘
       │
       ├─────→ PurchaseItems (구매품목)
       ├─────→ ServiceItems (용역항목)
       ├─────→ CostDepartments (비용귀속부서)
       ├─────→ RequestDepartments (요청부서)
       ├─────→ ApprovalLines (결재라인)
       └─────→ Budget (예산)
```

---

## 테이블 목록

| # | 테이블명 | 설명 | 레코드 수 (예시) |
|---|---------|------|-----------------|
| 1 | `proposals` | 품의서 정보 | 135 |
| 2 | `purchase_items` | 구매품목 | 94 |
| 3 | `service_items` | 용역항목 | 61 |
| 4 | `cost_departments` | 비용귀속부서 | 198 |
| 5 | `request_departments` | 요청부서 | 208 |
| 6 | `budgets` | 예산 | 3 |
| 7 | `business_budgets` | 사업예산 | 11 |
| 8 | `business_budget_details` | 사업예산 상세 | 0 |
| 9 | `business_budget_history` | 사업예산 변경이력 | 2 |
| 10 | `business_budget_approvals` | 사업예산 결재 | 0 |
| 11 | `approval_lines` | 결재라인 | 0 |
| 12 | `approval_rules` | 결재규칙 | 3 |
| 13 | `approval_conditions` | 결재조건 | 4 |
| 14 | `approval_approvers` | 결재자 | 4 |
| 15 | `approval_references` | 결재참조자 | 4 |
| 16 | `departments` | 부서 | 6 |
| 17 | `suppliers` | 공급업체 | 3 |
| 18 | `contract_methods` | 계약방식 | 21 |
| 19 | `contracts` | 계약 | 0 |
| 20 | `project_purposes` | 사업목적 | 34 |
| 21 | `document_templates` | 문서템플릿 | 4 |
| 22 | `tasks` | 작업 | 7 |
| 23 | `proposal_histories` | 품의서 변경이력 | 28 |
| 24 | `purchase_history` | 구매이력 | 0 |
| 25 | `purchase_item_cost_allocations` | 구매품목 비용배분 | 0 |
| 26 | `SequelizeMeta` | 마이그레이션 이력 | - |

---

## 테이블 상세

### 핵심 테이블

#### 1. `proposals` (품의서)
**설명**: 시스템의 핵심 테이블. 모든 계약 품의서 정보를 관리

**주요 컬럼**:
| 컬럼명 | 타입 | Null | 기본값 | 설명 |
|--------|------|------|--------|------|
| `id` | INTEGER | NO | AUTO | 품의서 ID (PK) |
| `contract_type` | VARCHAR(50) | YES | NULL | 계약 유형 (구매/변경/연장/용역/입찰) |
| `title` | VARCHAR(255) | NO | - | 품의서 제목 |
| `purpose` | TEXT | YES | NULL | 사업 목적 |
| `basis` | TEXT | YES | NULL | 계약 근거 |
| `budget_id` | INTEGER | YES | NULL | 사업예산 ID (FK) |
| `contract_method` | VARCHAR | YES | NULL | 계약방식 |
| `account_subject` | VARCHAR | YES | NULL | 계정과목 |
| `total_amount` | DECIMAL(15,2) | YES | 0 | 총 계약금액 |
| `change_reason` | TEXT | YES | NULL | 변경사유 (변경계약용) |
| `status` | VARCHAR(50) | YES | 'draft' | 상태 (draft/pending/approved/rejected) |
| `approval_date` | DATE | YES | NULL | 결재일 |
| `created_at` | TIMESTAMP | NO | NOW | 생성일시 |
| `updated_at` | TIMESTAMP | NO | NOW | 수정일시 |

**관계**:
- `hasMany` → `PurchaseItems` (구매품목)
- `hasMany` → `ServiceItems` (용역항목)
- `hasMany` → `CostDepartments` (비용귀속부서)
- `hasMany` → `ApprovalLines` (결재라인)
- `hasMany` → `RequestDepartments` (요청부서)
- `belongsTo` → `Budget` (예산)

**인덱스**:
- PRIMARY KEY (`id`)
- INDEX (`budget_id`)
- INDEX (`status`)
- INDEX (`contract_type`)

---

#### 2. `purchase_items` (구매품목)
**설명**: 구매 계약 품의서의 품목 정보

**주요 컬럼**:
| 컬럼명 | 타입 | Null | 기본값 | 설명 |
|--------|------|------|--------|------|
| `id` | INTEGER | NO | AUTO | 품목 ID (PK) |
| `proposal_id` | INTEGER | NO | - | 품의서 ID (FK) |
| `item_name` | VARCHAR | NO | - | 품목명 |
| `specification` | TEXT | YES | NULL | 규격/사양 |
| `quantity` | DECIMAL(10,2) | NO | 1 | 수량 |
| `unit` | VARCHAR(50) | YES | NULL | 단위 |
| `unit_price` | DECIMAL(15,2) | NO | 0 | 단가 |
| `total_price` | DECIMAL(15,2) | NO | 0 | 총액 |
| `supplier_id` | INTEGER | YES | NULL | 공급업체 ID (FK) |
| `delivery_date` | DATE | YES | NULL | 납기일 |
| `note` | TEXT | YES | NULL | 비고 |
| `created_at` | TIMESTAMP | NO | NOW | 생성일시 |
| `updated_at` | TIMESTAMP | NO | NOW | 수정일시 |

**관계**:
- `belongsTo` → `Proposal` (품의서)
- `belongsTo` → `Supplier` (공급업체)
- `hasMany` → `PurchaseItemCostAllocation` (비용배분)

**인덱스**:
- PRIMARY KEY (`id`)
- INDEX (`proposal_id`)
- INDEX (`supplier_id`)

---

#### 3. `service_items` (용역항목)
**설명**: 용역 계약 품의서의 용역 항목 정보

**주요 컬럼**:
| 컬럼명 | 타입 | Null | 기본값 | 설명 |
|--------|------|------|--------|------|
| `id` | INTEGER | NO | AUTO | 항목 ID (PK) |
| `proposal_id` | INTEGER | NO | - | 품의서 ID (FK) |
| `service_name` | VARCHAR | NO | - | 용역명 |
| `service_content` | TEXT | YES | NULL | 용역 내용 |
| `service_period_start` | DATE | YES | NULL | 용역 시작일 |
| `service_period_end` | DATE | YES | NULL | 용역 종료일 |
| `service_period_months` | DECIMAL(5,2) | YES | NULL | 용역 기간(개월) |
| `personnel_count` | INTEGER | YES | 0 | 투입인원 |
| `unit_price` | DECIMAL(15,2) | NO | 0 | 단가 (MM당) |
| `total_amount` | DECIMAL(15,2) | NO | 0 | 총액 |
| `supplier_id` | INTEGER | YES | NULL | 공급업체 ID (FK) |
| `note` | TEXT | YES | NULL | 비고 |
| `created_at` | TIMESTAMP | NO | NOW | 생성일시 |
| `updated_at` | TIMESTAMP | NO | NOW | 수정일시 |

**관계**:
- `belongsTo` → `Proposal` (품의서)
- `belongsTo` → `Supplier` (공급업체)

**특징**:
- 소수점 기간 지원 (예: 2.5개월)
- 자동 총액 계산 (unit_price × service_period_months × personnel_count)

---

#### 4. `cost_departments` (비용귀속부서)
**설명**: 품의서의 비용을 귀속시킬 부서 정보

**주요 컬럼**:
| 컬럼명 | 타입 | Null | 기본값 | 설명 |
|--------|------|------|--------|------|
| `id` | INTEGER | NO | AUTO | ID (PK) |
| `proposal_id` | INTEGER | NO | - | 품의서 ID (FK) |
| `department_id` | INTEGER | YES | NULL | 부서 ID (FK) |
| `department_name` | VARCHAR | NO | - | 부서명 |
| `allocation_amount` | DECIMAL(15,2) | NO | 0 | 배분금액 |
| `allocation_ratio` | DECIMAL(5,2) | YES | NULL | 배분비율(%) |
| `note` | TEXT | YES | NULL | 비고 |
| `created_at` | TIMESTAMP | NO | NOW | 생성일시 |
| `updated_at` | TIMESTAMP | NO | NOW | 수정일시 |

**관계**:
- `belongsTo` → `Proposal` (품의서)
- `belongsTo` → `Department` (부서)

---

#### 5. `request_departments` (요청부서)
**설명**: 품의서를 요청한 부서 정보

**주요 컬럼**:
| 컬럼명 | 타입 | Null | 기본값 | 설명 |
|--------|------|------|--------|------|
| `id` | INTEGER | NO | AUTO | ID (PK) |
| `proposal_id` | INTEGER | NO | - | 품의서 ID (FK) |
| `department_name` | VARCHAR | NO | - | 부서명 |
| `requester_name` | VARCHAR | YES | NULL | 요청자명 |
| `contact` | VARCHAR | YES | NULL | 연락처 |
| `created_at` | TIMESTAMP | NO | NOW | 생성일시 |
| `updated_at` | TIMESTAMP | NO | NOW | 수정일시 |

**관계**:
- `belongsTo` → `Proposal` (품의서)

---

### 예산 관련 테이블

#### 6. `budgets` (예산)
**설명**: 일반 예산 및 사업예산 통합 관리

**주요 컬럼**:
| 컬럼명 | 타입 | Null | 기본값 | 설명 |
|--------|------|------|--------|------|
| `id` | INTEGER | NO | AUTO | 예산 ID (PK) |
| `name` | VARCHAR | NO | - | 예산명 |
| `year` | INTEGER | NO | - | 예산년도 |
| `type` | ENUM | NO | 'general' | 예산 유형 (general/business) |
| `total_amount` | DECIMAL(15,2) | NO | 0 | 총 예산금액 |
| `used_amount` | DECIMAL(15,2) | NO | 0 | 사용된 금액 |
| `remaining_amount` | DECIMAL(15,2) | NO | 0 | 잔여 금액 (자동계산) |
| `department` | VARCHAR | NO | - | 관리부서 |
| `description` | TEXT | YES | NULL | 예산 설명 |
| `is_active` | BOOLEAN | NO | TRUE | 활성화 여부 |
| `created_at` | TIMESTAMP | NO | NOW | 생성일시 |
| `updated_at` | TIMESTAMP | NO | NOW | 수정일시 |

**관계**:
- `hasMany` → `Proposal` (품의서)

**훅(Hooks)**:
- `beforeSave`: 잔여금액 자동 계산 (`total_amount - used_amount`)

---

#### 7. `business_budgets` (사업예산)
**설명**: 사업별 예산 관리

**주요 컬럼**:
| 컬럼명 | 타입 | Null | 기본값 | 설명 |
|--------|------|------|--------|------|
| `id` | INTEGER | NO | AUTO | 사업예산 ID (PK) |
| `project_name` | VARCHAR | NO | - | 사업명 |
| `initiator_department` | VARCHAR | NO | - | 발의부서 |
| `executor_department` | VARCHAR | YES | NULL | 집행부서 |
| `budget_category` | VARCHAR | NO | - | 예산구분 (IT/사업/투자 등) |
| `budget_amount` | DECIMAL(15,2) | NO | 0 | 예산금액 |
| `additional_budget` | DECIMAL(15,2) | YES | 0 | 추가예산 |
| `executed_amount` | DECIMAL(15,2) | YES | 0 | 기집행액 |
| `pending_amount` | DECIMAL(15,2) | YES | 0 | 집행예정액 |
| `confirmed_execution_amount` | DECIMAL(15,2) | YES | 0 | 확정집행액 (결재완료 품의서 합계) |
| `unexecuted_amount` | DECIMAL(15,2) | YES | 0 | 미집행액 (자동계산) |
| `over_budget_amount` | DECIMAL(15,2) | YES | 0 | 예산초과액 (자동계산) |
| `budget_year` | INTEGER | NO | - | 예산년도 |
| `status` | VARCHAR(50) | YES | 'active' | 상태 |
| `note` | TEXT | YES | NULL | 비고 |
| `created_at` | TIMESTAMP | NO | NOW | 생성일시 |
| `updated_at` | TIMESTAMP | NO | NOW | 수정일시 |

**특징**:
- 확정집행액은 결재완료된 품의서의 총액을 JOIN으로 실시간 계산
- 미집행액 = (예산 + 추가예산) - 기집행액
- 예산초과액 = 기집행액 > (예산 + 추가예산) ? 초과분 : 0

---

#### 8. `business_budget_history` (사업예산 변경이력)
**설명**: 사업예산 변경 이력 추적 (KST 시간대 적용)

**주요 컬럼**:
| 컬럼명 | 타입 | Null | 기본값 | 설명 |
|--------|------|------|--------|------|
| `id` | INTEGER | NO | AUTO | 이력 ID (PK) |
| `business_budget_id` | INTEGER | NO | - | 사업예산 ID (FK) |
| `changed_at` | TIMESTAMP | NO | NOW | 변경일시 (KST) |
| `changed_by` | VARCHAR | YES | NULL | 변경자 |
| `change_type` | VARCHAR(50) | NO | - | 변경유형 (created/updated/deleted) |
| `changed_fields` | JSONB | YES | NULL | 변경된 필드 목록 |
| `old_values` | JSONB | YES | NULL | 변경 전 값 |
| `new_values` | JSONB | YES | NULL | 변경 후 값 |
| `note` | TEXT | YES | NULL | 변경사유 |

**특징**:
- 실제 변경된 항목만 기록 (값 비교 로직 적용)
- KST(한국 시간대) 적용
- JSONB 타입으로 유연한 데이터 저장

---

### 결재 관련 테이블

#### 9. `approval_lines` (결재라인)
**설명**: 품의서의 결재 라인 정보

**주요 컬럼**:
| 컬럼명 | 타입 | Null | 기본값 | 설명 |
|--------|------|------|--------|------|
| `id` | INTEGER | NO | AUTO | 결재라인 ID (PK) |
| `proposal_id` | INTEGER | NO | - | 품의서 ID (FK) |
| `order` | INTEGER | NO | - | 결재 순서 |
| `approver_name` | VARCHAR | NO | - | 결재자명 |
| `approver_position` | VARCHAR | YES | NULL | 결재자 직위 |
| `status` | VARCHAR(50) | YES | 'pending' | 결재상태 (pending/approved/rejected) |
| `approved_at` | TIMESTAMP | YES | NULL | 결재일시 |
| `comment` | TEXT | YES | NULL | 결재 의견 |
| `created_at` | TIMESTAMP | NO | NOW | 생성일시 |
| `updated_at` | TIMESTAMP | NO | NOW | 수정일시 |

**관계**:
- `belongsTo` → `Proposal` (품의서)

---

#### 10. `approval_rules` (결재규칙)
**설명**: 금액/유형별 결재 규칙

**주요 컬럼**:
| 컬럼명 | 타입 | Null | 기본값 | 설명 |
|--------|------|------|--------|------|
| `id` | INTEGER | NO | AUTO | 규칙 ID (PK) |
| `name` | VARCHAR | NO | - | 규칙명 |
| `description` | TEXT | YES | NULL | 규칙 설명 |
| `is_active` | BOOLEAN | NO | TRUE | 활성화 여부 |
| `priority` | INTEGER | YES | 0 | 우선순위 |
| `created_at` | TIMESTAMP | NO | NOW | 생성일시 |
| `updated_at` | TIMESTAMP | NO | NOW | 수정일시 |

**관계**:
- `hasMany` → `ApprovalConditions` (결재조건)

---

### 기준 정보 테이블

#### 11. `departments` (부서)
**설명**: 조직의 부서 정보

**주요 컬럼**:
| 컬럼명 | 타입 | Null | 기본값 | 설명 |
|--------|------|------|--------|------|
| `id` | INTEGER | NO | AUTO | 부서 ID (PK) |
| `name` | VARCHAR | NO | - | 부서명 (UNIQUE) |
| `code` | VARCHAR | YES | NULL | 부서코드 (UNIQUE) |
| `parent_id` | INTEGER | YES | NULL | 상위부서 ID (FK, 자기참조) |
| `manager` | VARCHAR | YES | NULL | 부서장 |
| `description` | TEXT | YES | NULL | 부서 설명 |
| `is_active` | BOOLEAN | NO | TRUE | 활성화 여부 |
| `created_at` | TIMESTAMP | NO | NOW | 생성일시 |
| `updated_at` | TIMESTAMP | NO | NOW | 수정일시 |

**관계**:
- `hasMany` → `CostDepartment` (비용귀속부서)
- 자기참조: `parent_id` → `departments.id`

---

#### 12. `suppliers` (공급업체)
**설명**: 계약 공급업체 정보

**주요 컬럼**:
| 컬럼명 | 타입 | Null | 기본값 | 설명 |
|--------|------|------|--------|------|
| `id` | INTEGER | NO | AUTO | 공급업체 ID (PK) |
| `name` | VARCHAR | NO | - | 업체명 (UNIQUE) |
| `business_number` | VARCHAR(12) | YES | NULL | 사업자번호 |
| `representative` | VARCHAR | YES | NULL | 대표자명 |
| `address` | TEXT | YES | NULL | 주소 |
| `phone` | VARCHAR | YES | NULL | 전화번호 |
| `email` | VARCHAR | YES | NULL | 이메일 |
| `contact_person` | VARCHAR | YES | NULL | 담당자 |
| `contact_phone` | VARCHAR | YES | NULL | 담당자 연락처 |
| `bank_name` | VARCHAR | YES | NULL | 은행명 |
| `account_number` | VARCHAR | YES | NULL | 계좌번호 |
| `is_active` | BOOLEAN | NO | TRUE | 활성화 여부 |
| `created_at` | TIMESTAMP | NO | NOW | 생성일시 |
| `updated_at` | TIMESTAMP | NO | NOW | 수정일시 |

**관계**:
- `hasMany` → `PurchaseItem` (구매품목)
- `hasMany` → `ServiceItem` (용역항목)

---

#### 13. `contract_methods` (계약방식)
**설명**: 계약 방식 마스터 데이터

**주요 컬럼**:
| 컬럼명 | 타입 | Null | 기본값 | 설명 |
|--------|------|------|--------|------|
| `id` | INTEGER | NO | AUTO | ID (PK) |
| `name` | VARCHAR | NO | - | 계약방식명 (UNIQUE) |
| `code` | VARCHAR | YES | NULL | 계약방식 코드 |
| `description` | TEXT | YES | NULL | 설명 |
| `contract_type` | VARCHAR(50) | YES | NULL | 계약유형 (구매/용역 등) |
| `is_active` | BOOLEAN | NO | TRUE | 활성화 여부 |
| `created_at` | TIMESTAMP | NO | NOW | 생성일시 |
| `updated_at` | TIMESTAMP | NO | NOW | 수정일시 |

**예시 데이터**:
- 일반경쟁입찰
- 제한경쟁입찰
- 지명경쟁입찰
- 수의계약
- 긴급수의계약

---

#### 14. `project_purposes` (사업목적)
**설명**: 사업 목적 템플릿

**주요 컬럼**:
| 컬럼명 | 타입 | Null | 기본값 | 설명 |
|--------|------|------|--------|------|
| `id` | INTEGER | NO | AUTO | ID (PK) |
| `name` | VARCHAR | NO | - | 사업목적명 |
| `description` | TEXT | YES | NULL | 상세 설명 |
| `category` | VARCHAR | YES | NULL | 카테고리 |
| `is_active` | BOOLEAN | NO | TRUE | 활성화 여부 |
| `created_at` | TIMESTAMP | NO | NOW | 생성일시 |
| `updated_at` | TIMESTAMP | NO | NOW | 수정일시 |

---

#### 15. `document_templates` (문서템플릿)
**설명**: 계약서 등 문서 템플릿

**주요 컬럼**:
| 컬럼명 | 타입 | Null | 기본값 | 설명 |
|--------|------|------|--------|------|
| `id` | INTEGER | NO | AUTO | 템플릿 ID (PK) |
| `name` | VARCHAR | NO | - | 템플릿명 |
| `type` | VARCHAR(50) | NO | - | 문서유형 (contract/proposal 등) |
| `content` | TEXT | NO | - | 템플릿 내용 (HTML) |
| `description` | TEXT | YES | NULL | 설명 |
| `is_active` | BOOLEAN | NO | TRUE | 활성화 여부 |
| `created_at` | TIMESTAMP | NO | NOW | 생성일시 |
| `updated_at` | TIMESTAMP | NO | NOW | 수정일시 |

**특징**:
- CKEditor로 WYSIWYG 편집 지원
- HTML 형식으로 저장
- 변수 치환 기능 지원 (예: `{{proposalTitle}}`)

---

### 이력 관리 테이블

#### 16. `proposal_histories` (품의서 변경이력)
**설명**: 품의서 변경 이력 추적

**주요 컬럼**:
| 컬럼명 | 타입 | Null | 기본값 | 설명 |
|--------|------|------|--------|------|
| `id` | INTEGER | NO | AUTO | 이력 ID (PK) |
| `proposal_id` | INTEGER | NO | - | 품의서 ID (FK) |
| `changed_at` | TIMESTAMP | NO | NOW | 변경일시 |
| `changed_by` | VARCHAR | YES | NULL | 변경자 |
| `change_type` | VARCHAR(50) | NO | - | 변경유형 |
| `changed_field` | VARCHAR | YES | NULL | 변경필드 |
| `old_value` | TEXT | YES | NULL | 변경 전 값 |
| `new_value` | TEXT | YES | NULL | 변경 후 값 |
| `note` | TEXT | YES | NULL | 비고 |
| `created_at` | TIMESTAMP | NO | NOW | 생성일시 |
| `updated_at` | TIMESTAMP | NO | NOW | 수정일시 |

---

## 📊 통계 및 성능

### 인덱스 전략
1. **Primary Key**: 모든 테이블의 `id` 컬럼
2. **Foreign Key**: 관계가 있는 모든 외래키에 인덱스 적용
3. **검색 최적화**: 
   - `proposals.status`, `proposals.contract_type`
   - `budgets.year`, `budgets.type`
   - `business_budgets.budget_year`

### 데이터 무결성
- **외래키 제약조건**: CASCADE 삭제 방지 (기본 RESTRICT)
- **NOT NULL 제약**: 필수 필드에 적용
- **UNIQUE 제약**: 중복 방지 필요 필드에 적용
- **CHECK 제약**: ENUM 타입으로 값 제한

---

## 🔄 주요 비즈니스 로직

### 1. 예산 집행액 계산
```sql
-- 사업예산의 확정집행액은 결재완료된 품의서 총액을 실시간 계산
SELECT 
  bb.*,
  COALESCE(SUM(CASE WHEN p.status = 'approved' THEN p.total_amount ELSE 0 END), 0) as confirmed_execution_amount
FROM business_budgets bb
LEFT JOIN proposals p ON bb.id = p.budget_id
GROUP BY bb.id
```

### 2. 미집행액 자동 계산
```
미집행액 = (예산금액 + 추가예산) - 기집행액
```

### 3. 예산초과액 판단
```
예산초과액 = 기집행액 > (예산금액 + 추가예산) ? (기집행액 - 예산금액 - 추가예산) : 0
```

---

## 📝 마이그레이션 이력

마이그레이션 파일은 `migrations/` 폴더에서 관리합니다.

### 실행 방법
```bash
# 마이그레이션 실행
npx sequelize-cli db:migrate

# 마이그레이션 롤백
npx sequelize-cli db:migrate:undo

# 마이그레이션 상태 확인
npx sequelize-cli db:migrate:status
```

---

## 🔧 유지보수 가이드

### 스키마 변경 시 절차
1. Sequelize 모델 수정 (`src/models/`)
2. 마이그레이션 파일 생성 (`migrations/`)
3. 개발 DB에서 테스트
4. `scripts/database/sync-db.js` 실행
5. 변경사항 검증
6. 문서 업데이트 (본 문서)

### 데이터 백업
```bash
# 정기 백업 (PowerShell)
.\scripts\backup\auto_backup.ps1

# 수동 백업
node scripts/database/export-current-data.js
```

---

## 📚 참고 문서

- [프로젝트 구조](./PROJECT_STRUCTURE.md)
- [마이그레이션 가이드](./MIGRATION_GUIDE.md)
- [배포 가이드](./DEPLOYMENT_GUIDE.md)
- Sequelize 공식 문서: https://sequelize.org/

---

**최종 업데이트**: 2025-10-20  
**작성자**: AI Assistant  
**버전**: 1.0

