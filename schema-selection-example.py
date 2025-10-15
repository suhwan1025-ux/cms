"""
Text-to-SQL: 스마트 스키마 선택
"""

# 각 테이블의 스키마 정의
TABLE_SCHEMAS = {
    'proposals': """
테이블: proposals (품의서)
컬럼:
  - id: INTEGER PRIMARY KEY
  - title: VARCHAR(255) - 제목
  - status: VARCHAR(50) - 상태 (draft, approved, pending, rejected)
  - budget_amount: NUMERIC - 예산금액
  - approval_date: DATE - 승인일
  - contract_method: VARCHAR(100) - 계약방식
  - created_at: TIMESTAMP
""",
    
    'business_budgets': """
테이블: business_budgets (사업예산)
컬럼:
  - id: INTEGER PRIMARY KEY
  - project_name: VARCHAR(255) - 프로젝트명
  - budget_amount: NUMERIC - 예산액
  - executed_amount: NUMERIC - 집행액
  - budget_year: INTEGER - 연도
  - status: VARCHAR(50)
  - created_at: TIMESTAMP
""",
    
    'departments': """
테이블: departments (부서)
컬럼:
  - id: INTEGER PRIMARY KEY
  - name: VARCHAR(100) - 부서명
  - code: VARCHAR(50) - 부서코드
  - manager: VARCHAR(100) - 담당자
  - is_active: BOOLEAN
""",
    
    'purchase_items': """
테이블: purchase_items (구매품목)
컬럼:
  - id: INTEGER PRIMARY KEY
  - item_name: VARCHAR(255) - 품목명
  - quantity: INTEGER - 수량
  - unit_price: NUMERIC - 단가
  - total_amount: NUMERIC - 총액
  - proposal_id: INTEGER REFERENCES proposals(id)
""",
    
    'service_items': """
테이블: service_items (용역)
컬럼:
  - id: INTEGER PRIMARY KEY
  - name: VARCHAR(255) - 용역명
  - personnel: INTEGER - 인원
  - period: INTEGER - 기간(개월)
  - contract_amount: NUMERIC - 계약금액
  - proposal_id: INTEGER REFERENCES proposals(id)
""",
    
    'suppliers': """
테이블: suppliers (공급업체)
컬럼:
  - id: INTEGER PRIMARY KEY
  - name: VARCHAR(255) - 업체명
  - business_number: VARCHAR(50) - 사업자번호
  - representative: VARCHAR(100) - 대표자
  - is_active: BOOLEAN
""",
}

# 키워드 매핑
KEYWORD_TO_TABLES = {
    '품의': ['proposals'],
    '계약': ['proposals', 'contract_methods'],
    '승인': ['proposals'],
    '예산': ['business_budgets', 'proposals'],
    '사업': ['business_budgets'],
    '집행': ['business_budgets'],
    '부서': ['departments'],
    '팀': ['departments'],
    '구매': ['purchase_items', 'proposals'],
    '물품': ['purchase_items'],
    '장비': ['purchase_items'],
    '용역': ['service_items', 'proposals'],
    '서비스': ['service_items'],
    '개발': ['service_items'],
    '공급업체': ['suppliers'],
    '업체': ['suppliers'],
    '협력사': ['suppliers'],
}

def select_relevant_tables(question: str) -> list:
    """질문에서 관련 테이블 선택"""
    keywords = question.lower()
    selected_tables = set()
    
    # 키워드 매칭
    for keyword, tables in KEYWORD_TO_TABLES.items():
        if keyword in keywords:
            selected_tables.update(tables)
    
    # 기본 테이블 (통계 등)
    if not selected_tables:
        selected_tables.add('proposals')
    
    return list(selected_tables)

def build_prompt(question: str, method: str = 'selective') -> str:
    """프롬프트 생성"""
    
    if method == 'full':
        # 방법 1: 모든 스키마 포함
        schema = '\n\n'.join(TABLE_SCHEMAS.values())
        
    elif method == 'selective':
        # 방법 2: 관련 스키마만 포함
        relevant_tables = select_relevant_tables(question)
        schema = '\n\n'.join([TABLE_SCHEMAS.get(t, '') for t in relevant_tables])
    
    prompt = f"""당신은 PostgreSQL 전문가입니다.
다음 스키마를 참고하여 사용자 질문을 SQL로 변환하세요.

{schema}

규칙:
- SELECT 문만 생성
- PostgreSQL 문법 사용
- SQL만 출력 (설명 없이)

질문: {question}
SQL:"""
    
    return prompt

# 테스트
if __name__ == "__main__":
    test_questions = [
        "승인된 품의서는 몇 건?",
        "올해 사업예산 총액은?",
        "IT부서의 담당자는?",
        "노트북 구매 내역은?",
        "용역 서비스는 몇 건?",
    ]
    
    print("="*80)
    print("방법 비교: 전체 vs 선택적 스키마")
    print("="*80)
    
    for question in test_questions:
        print(f"\n질문: {question}")
        print("-"*80)
        
        # 방법 1: 전체 스키마
        full_prompt = build_prompt(question, 'full')
        full_tokens = len(full_prompt.split())
        
        # 방법 2: 선택적 스키마
        selective_prompt = build_prompt(question, 'selective')
        selective_tokens = len(selective_prompt.split())
        
        # 결과
        print(f"전체 스키마: ~{full_tokens} 토큰")
        print(f"선택적 스키마: ~{selective_tokens} 토큰")
        print(f"절약: {100 - (selective_tokens/full_tokens*100):.1f}%")
        
        # 선택된 테이블
        tables = select_relevant_tables(question)
        print(f"선택된 테이블: {', '.join(tables)}")

