# 데이터베이스 스키마 마이그레이션 문제 해결 기록

## 📅 작성일: 2025-10-01

## 🔍 문제 개요

새로운 환경에서 데이터베이스를 구축하는 과정에서 Sequelize 모델과 실제 데이터베이스 테이블 스키마 간의 불일치로 인해 500 에러가 발생했습니다.

---

## 🐛 발견된 문제들

### 1. `business_budgets` 테이블 컬럼 누락

**문제**: 서버 코드에서 사용하는 컬럼이 테이블에 없음

| 누락된 컬럼 | 해결 방법 |
|------------|----------|
| `start_date` | `create-complete-tables.js` 업데이트 후 테이블 재생성 |
| `end_date` | `create-complete-tables.js` 업데이트 후 테이블 재생성 |
| `project_purpose` | `create-complete-tables.js` 업데이트 후 테이블 재생성 |

**에러 메시지**:
```
column "start_date" does not exist
```

**해결**:
- `create-complete-tables.js`를 업데이트하여 누락된 컬럼 추가
- 기존 테이블 DROP 후 재생성

---

### 2. `approval_lines` 테이블 구조 불일치

**문제**: 테이블이 "결재라인 마스터" 구조로 생성되었으나, Sequelize 모델은 "품의서별 결재라인" 구조를 기대함

**기존 테이블 구조**:
```sql
- id
- name
- description
- is_active
- created_at
- updated_at
```

**필요한 구조**:
```sql
- id
- proposal_id (외래키) ← 누락!
- step
- name
- title
- description
- is_conditional
- is_final
- status
- approved_at
- approved_by
- comment
- created_at
- updated_at
```

**에러 메시지**:
```
column approvalLines.proposal_id does not exist
```

**해결**:
```sql
DROP TABLE approval_lines CASCADE;
CREATE TABLE approval_lines (
  id SERIAL PRIMARY KEY,
  proposal_id INTEGER NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  step INTEGER NOT NULL,
  name VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  is_conditional BOOLEAN DEFAULT false,
  is_final BOOLEAN DEFAULT false,
  status VARCHAR(50) DEFAULT 'pending',
  approved_at TIMESTAMP,
  approved_by VARCHAR(255),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### 3. Sequelize 모델 관계 설정 문제

#### 3.1 `Proposal.js` - ApprovalLine 관계 주석 처리됨

**문제**: ApprovalLine과의 관계가 주석 처리되어 있었음

**수정 전**:
```javascript
// Proposal.hasMany(models.ApprovalLine, {
//   foreignKey: 'proposalId',
//   as: 'approvalLines'
// });
```

**수정 후**:
```javascript
Proposal.hasMany(models.ApprovalLine, {
  foreignKey: 'proposalId',
  as: 'approvalLines'
});
```

**에러 메시지**:
```
ApprovalLine is not associated to Proposal!
```

---

#### 3.2 `ContractMethod.js` - Proposal과 잘못된 관계

**문제**: `contract_method` 필드는 문자열이지만, 외래키 관계로 설정됨

**수정 전**:
```javascript
ContractMethod.hasMany(models.Proposal, {
  foreignKey: 'contractMethodId',
  as: 'proposals'
});
```

**수정 후**:
```javascript
// ⚠️ proposals.contract_method는 외래키가 아닌 문자열 필드이므로 관계 설정하지 않음
// ContractMethod.hasMany(models.Proposal, {
//   foreignKey: 'contractMethodId',
//   as: 'proposals'
// });
```

**에러 메시지**:
```
column Proposal.contract_method_id does not exist
```

---

#### 3.3 `PurchaseItem.js` - Supplier와 잘못된 관계

**문제**: `purchase_items` 테이블에 `supplier_id` 외래키 없음

**수정 전**:
```javascript
PurchaseItem.belongsTo(models.Supplier, {
  foreignKey: 'supplierId',
  as: 'supplierInfo'
});
```

**수정 후**:
```javascript
// ⚠️ supplierId 외래키가 없으므로 관계 설정하지 않음
// PurchaseItem.belongsTo(models.Supplier, {
//   foreignKey: 'supplierId',
//   as: 'supplierInfo'
// });
```

**에러 메시지**:
```
column purchaseItems.supplier_id does not exist
```

---

### 4. `PurchaseItem` 모델 필드 불일치

**문제**: Sequelize 모델 필드명과 데이터베이스 컬럼명 불일치

| Sequelize 필드 | DB 컬럼 | 문제 | 해결 방법 |
|---------------|---------|------|----------|
| `item` | `item_name` | field 매핑 누락 | `field: 'item_name'` 추가 |
| `productName` | (없음) | 컬럼 자체가 DB에 없음 | `specification`으로 변경 |
| `supplierId` | (없음) | 컬럼 자체가 DB에 없음 | 필드 제거 (주석 처리) |
| `supplier` | (없음) | 컬럼 자체가 DB에 없음 | `manufacturer`로 변경 |
| - | `manufacturer` | 모델에 필드 없음 | 필드 추가 |
| - | `model_number` | 모델에 필드 없음 | `modelNumber` 필드 추가 |
| - | `delivery_location` | 모델에 필드 없음 | `deliveryLocation` 필드 추가 |
| - | `notes` | 모델에 필드 없음 | `notes` 필드 추가 |

**에러 메시지들**:
```
column purchaseItems.item does not exist
column purchaseItems.product_name does not exist
column purchaseItems.supplier_id does not exist
column purchaseItems.supplier does not exist
```

**수정 예시**:
```javascript
// 수정 전
item: {
  type: DataTypes.STRING,
  allowNull: false,
  comment: '구매품목'
},
productName: {
  type: DataTypes.STRING,
  allowNull: false,
  comment: '제품명'
},

// 수정 후
item: {
  type: DataTypes.STRING,
  allowNull: false,
  field: 'item_name',  // ← 추가
  comment: '구매품목'
},
specification: {  // ← 변경
  type: DataTypes.TEXT,
  allowNull: true,
  field: 'specification',
  comment: '사양'
},
manufacturer: {  // ← 추가
  type: DataTypes.STRING,
  allowNull: true,
  field: 'manufacturer',
  comment: '제조사'
},
```

---

## ✅ 해결 절차

### 1단계: PostgreSQL 서버 시작
```bash
# PostgreSQL 서버가 실행되지 않았을 경우
pg_ctl start -D "경로\pgdata"
```

### 2단계: 데이터베이스 생성
```bash
node create-database.js
```

### 3단계: 완전한 테이블 생성
```bash
cd cms
node create-complete-tables.js
```

### 4단계: 잘못 생성된 테이블 수정
```sql
-- approval_lines 테이블 재생성
DROP TABLE IF EXISTS approval_lines CASCADE;
CREATE TABLE approval_lines (...);
```

### 5단계: Sequelize 모델 수정
- `Proposal.js`: ApprovalLine 관계 활성화
- `ContractMethod.js`: Proposal 관계 제거
- `PurchaseItem.js`: 
  - Supplier 관계 제거
  - 필드 매핑 추가
  - 누락된 필드 추가

### 6단계: 백엔드 서버 재시작
```bash
# 모델 파일 수정 시 반드시 재시작 필요!
Ctrl + C
node server.js
```

---

## 🎯 근본 원인

### 1. 스키마 정의의 이원화
- **테이블 생성 스크립트** (`create-complete-tables.js`): 실제 DB 구조
- **Sequelize 모델** (`src/models/*.js`): 애플리케이션 코드에서 사용하는 구조
- 두 가지가 **동기화되지 않음**

### 2. Field 매핑 누락
- JavaScript는 **camelCase** 사용
- PostgreSQL은 **snake_case** 사용
- Sequelize `field` 옵션으로 매핑 필요하나 누락됨

### 3. 개발 중 변경사항 미반영
- 개발 과정에서 모델 수정 → 테이블 스크립트 미업데이트
- 테이블 스크립트 수정 → 모델 미업데이트

---

## 💡 향후 개선 방안

### 1. 단일 소스 원칙 (Single Source of Truth)
```javascript
// Sequelize sync 사용 권장
await sequelize.sync({ force: true }); // 개발 환경에서만
```

### 2. 마이그레이션 시스템 도입
```bash
# Sequelize CLI 마이그레이션
npx sequelize-cli migration:create --name add-start-date-to-business-budgets
```

### 3. 스키마 검증 스크립트
```javascript
// 정기적으로 모델과 DB 스키마 비교
const validateSchema = async () => {
  // 모델 정의와 실제 테이블 구조 비교
  // 불일치 발견 시 경고
};
```

### 4. 새로운 환경 구축 가이드 문서화
- `WORKSTATION_SETUP_GUIDE.md` 업데이트
- 단계별 명확한 지침 제공

---

## 📝 교훈

1. **모델 파일 수정 후 반드시 서버 재시작**
2. **스키마 변경 시 관련 파일 모두 업데이트**
3. **field 매핑 필수 확인** (camelCase ↔ snake_case)
4. **관계 설정 시 실제 외래키 존재 여부 확인**
5. **에러 메시지를 정확히 읽고 근본 원인 파악**

---

## 🔗 관련 파일

- `D:\CMS\cms\create-complete-tables.js` - 테이블 생성 스크립트
- `D:\CMS\src\models\Proposal.js` - 품의서 모델
- `D:\CMS\src\models\ApprovalLine.js` - 결재라인 모델
- `D:\CMS\src\models\PurchaseItem.js` - 구매품목 모델
- `D:\CMS\src\models\ContractMethod.js` - 계약방식 모델
- `D:\CMS\server.js` - 백엔드 서버

