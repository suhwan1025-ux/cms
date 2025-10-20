# 확정집행액 필드 보호 가이드

## 📋 개요
확정집행액(`confirmedExecutionAmount`)은 **읽기 전용 필드**로, 품의서와 JOIN으로 실시간 계산됩니다.

## 🔒 보호 메커니즘

### 1. 프론트엔드 보호
**위치**: `src/components/BudgetRegistrationAPI.js`

#### 입력 필드 읽기 전용 처리
```jsx
<input
  type="text"
  name="confirmedExecutionAmount"
  value={formData.confirmedExecutionAmount}
  readOnly  // ← 읽기 전용
  style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
  title="확정집행액은 결재완료된 품의서 금액의 합계로 자동 계산됩니다"
/>
```

#### 서버 전송 시 제외
```javascript
const submitData = {
  ...formData,
  budgetAmount: ...,
  executedAmount: ...,
  // confirmedExecutionAmount는 전송하지 않음 (자동 계산)
  unexecutedAmount: ...,
};
```

#### 입력 처리에서 제외
```javascript
// confirmedExecutionAmount는 amountFields에서 제외
const amountFields = ['budgetAmount', 'executedAmount', 'pendingAmount', 'unexecutedAmount', 'additionalBudget'];
```

### 2. 백엔드 보호
**위치**: `server.js`

#### 생성 시 (POST /api/business-budgets)
```sql
INSERT INTO business_budgets (
  project_name, initiator_department, executor_department,
  budget_category, budget_amount, executed_amount,
  -- confirmed_execution_amount는 포함하지 않음
  start_date, end_date, is_essential, project_purpose, budget_year, status, created_by
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
```

#### 수정 시 (PUT /api/business-budgets/:id)
```javascript
// confirmed_execution_amount는 fieldMapping에 포함되지 않음
const fieldMapping = {
  projectName: 'project_name',
  executedAmount: 'executed_amount',
  // confirmedExecutionAmount 없음
};
```

## 🎯 사용자 경험

### 시각적 표시
- **라벨**: "확정집행액 (자동 계산)"
- **배경색**: 회색 (#f5f5f5)
- **커서**: `cursor: not-allowed` (수정 불가 표시)
- **플레이스홀더**: "품의완료 시 자동 계산됨"
- **툴팁**: "확정집행액은 결재완료된 품의서 금액의 합계로 자동 계산됩니다"

### 동작
1. 사용자가 사업예산 등록/수정 시 확정집행액 필드는 비활성화
2. 마우스를 올리면 툴팁으로 자동 계산됨을 알림
3. 서버로 전송 시 해당 값은 무시됨
4. API 조회 시 JOIN으로 계산된 최신 값이 표시됨

## 💡 왜 보호해야 하는가?

### 문제점 (보호하지 않을 경우)
1. ❌ **데이터 불일치**: 사용자가 임의의 값 입력 가능
2. ❌ **계산 오류**: 실제 품의 금액과 다른 값 저장
3. ❌ **혼란**: 자동 계산 vs 수동 입력의 모순
4. ❌ **신뢰도 저하**: 시스템 데이터를 신뢰할 수 없음

### 해결 (보호 후)
1. ✅ **항상 정확**: JOIN으로 실시간 계산된 값만 표시
2. ✅ **수정 불가**: 사용자가 임의로 변경할 수 없음
3. ✅ **명확성**: "자동 계산" 표시로 혼란 방지
4. ✅ **신뢰성**: Single Source of Truth 보장

## 🔍 확인 방법

### 1. 브라우저에서 확인
```
http://localhost:3001/budget-registration
```

1. 사업예산 등록 폼 열기
2. "확정집행액 (자동 계산)" 필드 확인
3. 필드를 클릭해도 입력되지 않음
4. 회색 배경으로 표시됨

### 2. 개발자 도구에서 확인
```javascript
// 네트워크 탭에서 POST/PUT 요청 확인
// confirmedExecutionAmount가 포함되지 않음을 확인
```

### 3. 데이터베이스에서 확인
```sql
-- confirmed_execution_amount 컬럼은 존재하지만
-- 사용자 입력으로 업데이트되지 않음
SELECT id, project_name, confirmed_execution_amount 
FROM business_budgets;
```

## 📊 관련 필드 비교

| 필드 | 수정 가능 | 계산 방식 |
|-----|---------|----------|
| 예산금액 (budgetAmount) | ✅ | 사용자 입력 |
| 기집행 (executedAmount) | ✅ | 사용자 입력 |
| 집행대기 (pendingAmount) | ✅ | 사용자 입력 |
| **확정집행액 (confirmedExecutionAmount)** | **❌** | **JOIN 자동 계산** |
| 미집행액 (unexecutedAmount) | ✅ | 사용자 입력 |
| 추가예산 (additionalBudget) | ✅ | 사용자 입력 |

## 🚀 향후 개선 사항

### Option 1: 완전히 숨기기
```jsx
// 확정집행액을 폼에서 아예 제거하고 조회 테이블에서만 표시
// 장점: 혼란 최소화
// 단점: 편집 시 현재 값을 볼 수 없음
```

### Option 2: 계산 로직 표시
```jsx
// 확정집행액 = 품의완료 건수 및 총액 표시
<div>
  확정집행액: 1.5억원
  <small>(품의완료 3건)</small>
</div>
```

### Option 3: 실시간 업데이트
```jsx
// WebSocket으로 품의 완료 시 실시간 업데이트
// 사용자가 즉시 변경을 확인 가능
```

## 📝 변경 이력
- 2025-10-10: 확정집행액 필드를 읽기 전용으로 변경
- 이유: JOIN 방식 도입으로 자동 계산되므로 수동 입력 방지

