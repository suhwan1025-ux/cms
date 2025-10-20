"""
Text-to-SQL 예시 구현
방법 1: 프롬프트에 스키마 포함
"""

import requests
import psycopg2
from psycopg2.extras import RealDictCursor

# 데이터베이스 스키마 정의
DB_SCHEMA = """
데이터베이스 스키마:

1. proposals (품의서)
   - id: INTEGER PRIMARY KEY
   - title: VARCHAR(255) - 품의서 제목
   - purpose: TEXT - 목적
   - status: VARCHAR(50) - 상태 (draft, pending, approved, rejected)
   - budget_amount: NUMERIC - 예산 금액
   - approval_date: DATE - 승인일
   - contract_method: VARCHAR(100) - 계약 방식
   - created_at: TIMESTAMP - 작성일시

2. business_budgets (사업예산)
   - id: INTEGER PRIMARY KEY
   - project_name: VARCHAR(255) - 프로젝트명
   - budget_amount: NUMERIC - 예산액
   - executed_amount: NUMERIC - 집행액
   - budget_year: INTEGER - 연도
   - status: VARCHAR(50) - 상태
   - created_at: TIMESTAMP

3. departments (부서)
   - id: INTEGER PRIMARY KEY
   - name: VARCHAR(100) - 부서명
   - code: VARCHAR(50) - 부서코드
   - manager: VARCHAR(100) - 담당자
   - is_active: BOOLEAN

4. purchase_items (구매품목)
   - id: INTEGER PRIMARY KEY
   - item_name: VARCHAR(255) - 품목명
   - quantity: INTEGER - 수량
   - unit_price: NUMERIC - 단가
   - total_amount: NUMERIC - 총액
   - proposal_id: INTEGER - 품의서 ID (외래키)

5. service_items (용역)
   - id: INTEGER PRIMARY KEY
   - name: VARCHAR(255) - 용역명
   - personnel: INTEGER - 인원
   - period: INTEGER - 기간(개월)
   - contract_amount: NUMERIC - 계약금액
   - proposal_id: INTEGER

6. suppliers (공급업체)
   - id: INTEGER PRIMARY KEY
   - name: VARCHAR(255) - 업체명
   - business_number: VARCHAR(50) - 사업자번호
   - representative: VARCHAR(100) - 대표자
   - is_active: BOOLEAN
"""

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL = "llama3.1:8b"

def generate_sql(question: str) -> str:
    """자연어 질문을 SQL로 변환"""
    
    prompt = f"""당신은 PostgreSQL 전문가입니다.
사용자의 자연어 질문을 SQL 쿼리로 변환하세요.

{DB_SCHEMA}

중요 규칙:
1. SELECT 문만 생성하세요 (INSERT, UPDATE, DELETE 금지)
2. PostgreSQL 문법을 사용하세요
3. SQL 쿼리만 출력하세요 (설명 없이)
4. 세미콜론으로 끝내세요
5. 안전한 쿼리만 생성하세요

예시:
질문: "전체 품의서는 몇 건인가요?"
SQL: SELECT COUNT(*) as count FROM proposals;

질문: "올해 승인된 품의서는?"
SQL: SELECT COUNT(*) FROM proposals WHERE status='approved' AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE);

질문: "IT부서의 예산 총액은?"
SQL: SELECT SUM(budget_amount) FROM business_budgets WHERE initiator_department LIKE '%IT%';

이제 다음 질문을 SQL로 변환하세요:
질문: {question}
SQL:"""

    try:
        response = requests.post(
            OLLAMA_URL,
            json={
                "model": MODEL,
                "prompt": prompt,
                "stream": False,
                "temperature": 0.1  # 낮은 temperature = 더 정확한 출력
            },
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            sql = result.get("response", "").strip()
            
            # SQL 추출 (설명 제거)
            if "SELECT" in sql.upper():
                sql_lines = sql.split('\n')
                for line in sql_lines:
                    if line.strip().upper().startswith('SELECT'):
                        sql = line.strip()
                        break
            
            return sql
        else:
            return None
            
    except Exception as e:
        print(f"SQL 생성 오류: {e}")
        return None

def validate_sql(sql: str) -> bool:
    """SQL 안전성 검증"""
    sql_upper = sql.upper()
    
    # 위험한 키워드 차단
    dangerous_keywords = ['DROP', 'DELETE', 'INSERT', 'UPDATE', 'ALTER', 'CREATE', 'TRUNCATE']
    for keyword in dangerous_keywords:
        if keyword in sql_upper:
            return False
    
    # SELECT로 시작하는지 확인
    if not sql_upper.strip().startswith('SELECT'):
        return False
    
    return True

def execute_safe_sql(sql: str, db_config: dict):
    """검증된 SQL 실행"""
    
    # 1단계: SQL 검증
    if not validate_sql(sql):
        return {"error": "안전하지 않은 SQL입니다"}
    
    # 2단계: SQL 실행
    try:
        conn = psycopg2.connect(**db_config)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        cursor.execute(sql)
        results = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return {
            "success": True,
            "sql": sql,
            "results": [dict(r) for r in results]
        }
        
    except Exception as e:
        return {
            "error": f"SQL 실행 오류: {e}",
            "sql": sql
        }

# 사용 예시
if __name__ == "__main__":
    questions = [
        "전체 품의서는 몇 건인가요?",
        "2025년 승인된 품의서는 몇 건?",
        "예산이 1억원 이상인 프로젝트는?",
        "IT개발팀의 품의서 수는?",
    ]
    
    for question in questions:
        print(f"\n{'='*60}")
        print(f"질문: {question}")
        print('='*60)
        
        sql = generate_sql(question)
        print(f"생성된 SQL: {sql}")
        
        if sql and validate_sql(sql):
            print("✅ SQL 검증 통과")
        else:
            print("❌ SQL 검증 실패")

