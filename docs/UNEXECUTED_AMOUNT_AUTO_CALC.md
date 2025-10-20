# 미집행액 자동 계산 가이드

## 📋 개요
미집행액(`unexecutedAmount`)은 **자동 계산 필드**로, 수동 입력이 불가능합니다.

## 🧮 계산 공식
```
미집행액 = 예산 - (기집행 + 확정집행액)
```

### 예시
- 예산: 3억원
- 기집행: 5천만원
- 확정집행액: 1억원
- **미집행액: 1.5억원** (3억 - 5천만 - 1억)

## 🔒 보호 메커니즘

### 1. 서버 자동 계산 (JOIN 방식)  ⭐ NEW
**위치**: `server.js`

#### /api/budget-statistics 엔드포인트
```sql
SELECT 
  bb.budget_amount,
  bb.executed_amount,
  COALESCE(SUM(CASE WHEN p.status = 'approved' THEN p.total_amount ELSE 0 END), 0) as confirmedExecutionAmount,
  -- 미집행액 자동 계산
  (bb.budget_amount - COALESCE(bb.executed_amount, 0) - 
   COALESCE(SUM(CASE WHEN p.status = 'approved' THEN p.total_amount ELSE 0 END), 0)) 
   as unexecutedAmountCalc
FROM business_budgets bb
LEFT JOIN proposals p ON p.budget_id = bb.id
GROUP BY bb.id
```

```javascript
// JavaScript에서 명시적 매핑
const budgetsWithExecution = allBudgets.map(budget => ({
  ...budget,
  unexecutedAmount: budget.unexecutedAmountCalc || 0  // 계산된 값 적용
}));
```

#### /api/business-budgets 엔드포인트
```sql
SELECT 
  bb.*,
  (bb.budget_amount - COALESCE(bb.executed_amount, 0) - 
   COALESCE(proposal_executions.executed_amount, 0)) as unexecuted_amount_calculated
FROM business_budgets bb
LEFT JOIN (
  SELECT budget_id, SUM(total_amount) as executed_amount
  FROM proposals
  WHERE status = 'approved'
  GROUP BY budget_id
) as proposal_executions ON bb.id = proposal_executions.budget_id
```

```javascript
// bb.*의 기존 unexecuted_amount 제거 후 계산된 값 사용
const { unexecuted_amount, ...budgetWithoutUnexecuted } = budget;
return {
  ...budgetWithoutUnexecuted,
  unexecuted_amount: budget.unexecuted_amount_calculated || 0
};
```

### 2. 프론트엔드 자동 계산 (보조)
**위치**: `src/components/BudgetRegistrationAPI.js`

#### 실시간 계산 (입력 중)
```javascript
const handleChange = (e) => {
  // 예산, 기집행, 확정집행액이 변경되면 미집행액 자동 계산
  if (['budgetAmount', 'executedAmount', 'confirmedExecutionAmount'].includes(name)) {
    const budget = parseInt(budgetAmount) || 0;
    const executed = parseInt(executedAmount) || 0;
    const confirmed = parseInt(confirmedExecutionAmount) || 0;
    
    const unexecuted = budget - executed - confirmed;
    newFormData.unexecutedAmount = unexecuted > 0 ? unexecuted.toLocaleString() : '0';
  }
};
```

#### 데이터 로드 시 계산
```javascript
const handleRowClick = (budget) => {
  // 미집행액 자동 계산
  const budgetAmt = budget.budgetAmount || 0;
  const executedAmt = budget.executedAmount || 0;
  const confirmedAmt = budget.confirmedExecutionAmount || 0;
  const unexecutedAmt = Math.max(0, budgetAmt - executedAmt - confirmedAmt);
  
  setFormData({
    ...
    unexecutedAmount: unexecutedAmt.toLocaleString(), // 자동 계산
  });
};
```

#### 읽기 전용 필드
```jsx
<input
  type="text"
  name="unexecutedAmount"
  value={formData.unexecutedAmount}
  readOnly  // ← 수정 불가
  style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
  title="미집행액 = 예산 - (기집행 + 확정집행액)"
/>
```

#### 서버 전송 제외
```javascript
const submitData = {
  budgetAmount: ...,
  executedAmount: ...,
  // unexecutedAmount는 전송하지 않음 (자동 계산)
};
```

### 2. 백엔드에서의 처리
**위치**: `server.js`

백엔드에서는 `unexecuted_amount` 컬럼을 별도로 업데이트하지 않습니다. 
필요 시 다음과 같이 조회 시 계산할 수 있습니다:

```sql
SELECT 
  id,
  project_name,
  budget_amount,
  executed_amount,
  confirmed_execution_amount,
  -- 미집행액은 계산 컬럼으로 조회
  (budget_amount - COALESCE(executed_amount, 0) - COALESCE(confirmed_execution_amount, 0)) 
    as unexecuted_amount
FROM business_budgets
```

## 🎯 사용자 경험

### 시각적 표시
- **라벨**: "미집행액 (자동 계산)"
- **배경색**: 회색 (#f5f5f5)
- **커서**: `cursor: not-allowed` (수정 불가 표시)
- **플레이스홀더**: "예산 - 기집행 - 확정집행액"
- **툴팁**: "미집행액 = 예산 - (기집행 + 확정집행액)"

### 동작 흐름
1. **등록 시**
   - 예산, 기집행, 확정집행액 입력
   - 미집행액 자동 계산 및 표시
   
2. **수정 시**
   - 기존 데이터 로드
   - 미집행액 자동 계산 및 표시
   - 예산/기집행/확정집행액 변경 시 실시간 재계산

3. **조회 시**
   - 테이블에 미집행액 표시
   - 서버에서 계산하거나 클라이언트에서 계산

## 💡 왜 자동 계산이 필요한가?

### 문제점 (수동 입력 시)
1. ❌ **계산 오류**: 사용자가 잘못된 값 입력 가능
2. ❌ **불일치**: 예산/기집행/확정집행액 변경 시 미집행액 미반영
3. ❌ **이중 관리**: 여러 필드를 동시에 관리해야 함
4. ❌ **신뢰성 저하**: 데이터 정합성 문제

### 해결 (자동 계산)
1. ✅ **항상 정확**: 계산식으로 보장
2. ✅ **실시간 업데이트**: 관련 필드 변경 시 즉시 반영
3. ✅ **간편함**: 사용자가 신경쓰지 않아도 됨
4. ✅ **신뢰성**: Single Source of Truth

## 🔍 확인 방법

### 1. 브라우저 테스트
```
http://localhost:3001/budget-registration
```

1. 사업예산 등록 폼 열기
2. 예산: 300,000,000 입력
3. 기집행: 50,000,000 입력
4. 확정집행액: 100,000,000 (자동 표시)
5. **미집행액: 150,000,000** (자동 계산 확인)
6. 미집행액 필드 클릭 → 수정 불가 확인

### 2. 실시간 계산 테스트
```
1. 예산 입력: 5억
   → 미집행액: 5억 (기집행 0, 확정집행액 0)

2. 기집행 입력: 1억
   → 미집행액: 4억 (즉시 업데이트)

3. 확정집행액: 1.5억 (품의완료 후)
   → 미집행액: 2.5억 (즉시 업데이트)
```

### 3. 음수 방지 테스트
```
예산: 1억
기집행: 5천만
확정집행액: 8천만
→ 합계가 예산 초과 (1.3억 > 1억)
→ 미집행액: 0 (음수 방지)
```

## 📊 관련 필드 비교

| 필드 | 수정 가능 | 계산 방식 | 의존성 |
|-----|---------|----------|-------|
| 예산금액 (budgetAmount) | ✅ | 사용자 입력 | - |
| 기집행 (executedAmount) | ✅ | 사용자 입력 | - |
| 집행대기 (pendingAmount) | ✅ | 사용자 입력 | - |
| 확정집행액 (confirmedExecutionAmount) | ❌ | JOIN 자동 계산 | proposals 테이블 |
| **미집행액 (unexecutedAmount)** | **❌** | **실시간 자동 계산** | **예산, 기집행, 확정집행액** |
| 추가예산 (additionalBudget) | ✅ | 사용자 입력 | - |

## 🔗 의존 관계

```
┌─────────────┐
│   예산금액   │ ─┐
└─────────────┘  │
                 │
┌─────────────┐  │  ┌─────────────┐
│   기집행액   │ ─┼─→│  미집행액    │ (자동 계산)
└─────────────┘  │  └─────────────┘
                 │
┌─────────────┐  │
│ 확정집행액   │ ─┘ (JOIN 자동 계산)
│ (품의완료)   │
└─────────────┘
```

## ⚠️ 주의사항

### 1. 초과 집행 방지
```javascript
// 현재: 음수를 0으로 표시
const unexecuted = Math.max(0, budget - executed - confirmed);

// 선택사항: 경고 표시
if (budget - executed - confirmed < 0) {
  alert('경고: 집행액이 예산을 초과했습니다!');
}
```

### 2. 서버 동기화
- 클라이언트에서만 계산하므로 서버와 불일치 가능
- 필요 시 서버에서도 계산 로직 추가 권장

### 3. 추가예산 고려
현재는 추가예산을 계산에 포함하지 않습니다.
필요 시 다음과 같이 수정:

```javascript
// Option 1: 추가예산 포함
const unexecuted = (budget + additional) - executed - confirmed;

// Option 2: 별도 표시
// 기본예산 미집행: X원
// 추가예산 미집행: Y원
```

## 🚀 향후 개선 사항

### Option 1: 서버 계산 컬럼
```sql
-- DB에 계산 컬럼(Computed Column) 추가
ALTER TABLE business_budgets 
ADD COLUMN unexecuted_amount_calculated AS 
  (budget_amount - COALESCE(executed_amount, 0) - COALESCE(confirmed_execution_amount, 0));
```

### Option 2: 집행률 표시
```javascript
// 집행률 = (기집행 + 확정집행액) / 예산 * 100
const executionRate = ((executed + confirmed) / budget * 100).toFixed(1);
```

### Option 3: 시각적 경고
```jsx
{unexecutedAmt < 0 && (
  <div className="warning">
    ⚠️ 초과집행: {Math.abs(unexecutedAmt).toLocaleString()}원
  </div>
)}
```

## 📝 변경 이력
- 2025-10-10: 미집행액 자동 계산 기능 추가
- 이유: 데이터 정합성 보장 및 사용자 편의성 향상

