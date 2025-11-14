# DB 스키마 검증 보고서

## 검증 일시
2025-11-05

## 검증 범위
- Sequelize 모델 파일 (src/models/) vs DBA 설치 스크립트 (sql/dba_setup/02_create_tables.sql)
- 테이블 구조, 컬럼 정의, 데이터 타입, 제약조건 일치 여부

---

## 1. ✅ proposals (품의서) - 완벽하게 일치

### Sequelize 모델 (Proposal.js)
- 모든 컬럼이 DBA 스크립트와 일치
- 특이사항: `title` 컬럼이 모델에서는 `allowNull: false`이지만 DBA 스크립트에서는 `NULL 허용` → **수정 필요**

### DBA 스크립트 문제점
```sql
title VARCHAR(500),  -- NULL 허용됨
```

### 권장사항
**DBA 스크립트 수정**: `title`을 `NOT NULL`로 변경
```sql
title VARCHAR(500) NOT NULL,
```

---

## 2. ✅ purchase_items (구매품목) - 거의 일치

### Sequelize 모델 (PurchaseItem.js)
- 모든 필수 컬럼 존재
- `request_department` 컬럼: 모델에서는 `TEXT`, 스크립트에서는 `VARCHAR(255)` → **타입 차이**

### 차이점
| 컬럼명 | 모델 타입 | DBA 스크립트 타입 | 조치 |
|--------|-----------|-------------------|------|
| request_department | TEXT | VARCHAR(255) | 모델을 VARCHAR(255)로 수정 권장 |

### 모델에 없는 필드
- `custom_contract_period` - 스크립트에 있지만 모델에 없음 → **모델 추가 필요**

---

## 3. ✅ service_items (용역항목) - 일치

### 검증 결과
- 모든 주요 컬럼 일치
- 데이터 타입 일치
- 제약조건 일치

### 특이사항
- 모델: `skillLevel` ENUM('senior', 'middle', 'junior')
- 스크립트: `skill_level VARCHAR(50)` → **타입 차이**

---

## 4. ⚠️ purchase_item_cost_allocations (구매품목 비용배분) - 컬럼명 불일치

### 심각한 문제 발견

#### Sequelize 모델 (PurchaseItemCostAllocation.js)
```javascript
{
  purchaseItemId: DataTypes.INTEGER,
  department: DataTypes.STRING,
  type: DataTypes.ENUM('percentage', 'amount'),
  value: DataTypes.DECIMAL(10, 2),
  allocatedAmount: DataTypes.DECIMAL(10, 2)
}
```

#### DBA 스크립트
```sql
CREATE TABLE purchase_item_cost_allocations (
    id SERIAL PRIMARY KEY,
    purchase_item_id INTEGER NOT NULL,
    department_id INTEGER,
    department VARCHAR(255) NOT NULL,
    amount NUMERIC(15,2) NOT NULL,
    ratio NUMERIC(5,2) DEFAULT 0
);
```

### 문제점
1. **모델에는 있지만 스크립트에 없는 컬럼**:
   - `type` (percentage/amount 구분)
   - `value` (배분값)
   - `allocatedAmount` (배분금액)

2. **스크립트에는 있지만 모델에 없는 컬럼**:
   - `department_id`
   - `amount`
   - `ratio`

### 조치사항
**DBA 스크립트 수정 필요** - 모델 기준으로 스크립트 재작성
```sql
CREATE TABLE IF NOT EXISTS purchase_item_cost_allocations (
    id SERIAL PRIMARY KEY,
    purchase_item_id INTEGER NOT NULL,
    department VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'percentage',
    value NUMERIC(10,2) NOT NULL DEFAULT 0,
    allocated_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 5. ✅ cost_departments (비용귀속부서) - 일치

### 검증 결과
- 모든 컬럼 일치
- 데이터 타입 일치
- `purchase_item_id`, `service_item_id` 컬럼으로 품목별 비용분배 지원

---

## 6. ✅ request_departments (요청부서) - 일치

### 차이점
- 모델에 없는 컬럼: `name`, `code` → 스크립트에서 제거 가능 (실제 사용 안 함)

---

## 7. ✅ approval_lines (결재라인) - 일치

### 검증 결과
- 모든 컬럼 완벽하게 일치
- ENUM 타입도 일치

---

## 8. ✅ departments (부서) - 일치

### 검증 결과
- 모든 컬럼 일치
- 계층 구조 지원 (parent_id)

---

## 9. ✅ suppliers (공급업체) - 일치

### 차이점
- 모델: `creditRating` ENUM('A', 'B', 'C', 'D')
- 스크립트: `credit_rating VARCHAR(10)` → **ENUM으로 변경 권장**

---

## 10. ✅ budgets (예산) - 일치

### 차이점
- 모델: `type` ENUM('general', 'business')
- 스크립트: `type VARCHAR(20)` → **CHECK 제약조건 있음** ✅

---

## 11. ✅ contract_methods (계약방식) - 거의 일치

### 차이점
| 컬럼명 | 모델 | DBA 스크립트 | 조치 |
|--------|------|--------------|------|
| value | ✅ | ✅ | 일치 |
| name | ✅ | ✅ | 일치 |
| regulation | ✅ | ❌ (basis) | 스크립트: `regulation` → `basis` |
| description | ✅ | ✅ | 일치 |
| minAmount | ✅ | ❌ | 스크립트에 추가 필요 |
| maxAmount | ✅ | ❌ | 스크립트에 추가 필요 |

---

## 12. ✅ contracts (계약) - 일치

### 차이점
- 모델: `contractType`, `status`, `paymentMethod`는 ENUM
- 스크립트: VARCHAR(50) → **스크립트를 ENUM으로 변경 권장**

---

## 13. ✅ proposal_histories (품의서 변경이력) - 일치

### 검증 결과
- 모든 컬럼 일치

---

## 14. ✅ document_templates (문서템플릿) - 일치

### 검증 결과
- 모든 컬럼 일치

---

## 15. ✅ tasks (작업) - 일치

### 검증 결과
- 모든 컬럼 일치

---

## 16. ⚠️ personnel (인력) - 테이블 누락

### 문제
**DBA 스크립트에 personnel 테이블이 없음!**

### 모델 존재 여부
- ✅ `src/models/Personnel.js` 존재
- ❌ `sql/dba_setup/02_create_tables.sql`에 없음

### 조치사항
**DBA 스크립트에 personnel 테이블 추가 필요**

---

## 17. ⚠️ external_personnel_info (외주인력 정보) - 테이블 누락

### 문제
**DBA 스크립트에 external_personnel_info 테이블이 없음!**

### 모델 존재 여부
- ✅ `src/models/ExternalPersonnelInfo.js` 존재
- ❌ `sql/dba_setup/02_create_tables.sql`에 없음

### 조치사항
**DBA 스크립트에 external_personnel_info 테이블 추가 필요**

---

## 18. ⚠️ business_budgets (사업예산) - 모델 누락

### 문제
**Sequelize 모델이 없음!**

### DBA 스크립트 존재 여부
- ❌ `src/models/` 폴더에 없음
- ✅ `sql/dba_setup/02_create_tables.sql`에 있음

### 조치사항
- 사업예산 기능이 필요하면 모델 생성 필요
- 불필요하면 스크립트에서 제거

---

## 19. ⚠️ 기타 테이블들 - 모델 누락

다음 테이블들은 DBA 스크립트에는 있지만 Sequelize 모델이 없음:

1. **business_budget_details** (사업예산 상세)
2. **business_budget_history** (사업예산 변경이력)
3. **business_budget_approvals** (사업예산 결재)
4. **approval_rules** (결재규칙)
5. **approval_approvers** (결재자)
6. **approval_conditions** (결재조건)
7. **approval_references** (결재참조)
8. **purchase_history** (구매이력)
9. **project_purposes** (사업목적)

---

## 종합 문제점 요약

### 🔴 Critical (심각) - 즉시 수정 필요

1. **purchase_item_cost_allocations 테이블 구조 불일치**
   - 모델과 스크립트의 컬럼 구조가 완전히 다름
   - 모델 기준으로 스크립트 수정 필요

2. **personnel 테이블 누락**
   - 모델은 있지만 DBA 스크립트에 없음
   - 스크립트에 추가 필요

3. **external_personnel_info 테이블 누락**
   - 모델은 있지만 DBA 스크립트에 없음
   - 스크립트에 추가 필요

### 🟡 Warning (경고) - 검토 필요

4. **contract_methods 테이블 컬럼 불일치**
   - `basis` vs `regulation` 컬럼명 차이
   - `minAmount`, `maxAmount` 컬럼 누락

5. **proposals.title 컬럼 NULL 허용 여부**
   - 모델: NOT NULL
   - 스크립트: NULL 허용

6. **사업예산 관련 테이블 (9개)**
   - 스크립트에는 있지만 모델 없음
   - 사용하지 않으면 스크립트에서 제거 권장

### 🟢 Info (정보) - 개선 권장

7. **ENUM vs VARCHAR 불일치**
   - 여러 테이블에서 모델은 ENUM, 스크립트는 VARCHAR
   - 일관성을 위해 ENUM으로 통일 권장

8. **데이터 타입 차이**
   - `request_department`: TEXT vs VARCHAR(255)
   - `skill_level`: ENUM vs VARCHAR(50)

---

## 권장 조치사항

### 1순위 (즉시)
1. ✅ `purchase_item_cost_allocations` 테이블 스크립트 수정
2. ✅ `personnel` 테이블 스크립트 추가
3. ✅ `external_personnel_info` 테이블 스크립트 추가

### 2순위 (긴급)
4. ✅ `proposals.title` NOT NULL 제약조건 추가
5. ✅ `contract_methods` 테이블 수정 (컬럼명 및 누락 컬럼 추가)

### 3순위 (개선)
6. 사업예산 관련 테이블 사용 여부 확인 후 조치
7. ENUM 타입 통일
8. 데이터 타입 통일

---

## 결론

**현재 DBA 스크립트는 실제 Sequelize 모델과 여러 불일치가 있어 그대로 사용 시 애플리케이션 오류 발생 가능**

즉시 수정이 필요한 critical 항목들을 먼저 수정한 후 DBA에게 전달해야 합니다.


