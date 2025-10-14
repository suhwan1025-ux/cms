"""
AI 어시스턴트 서버 - FastAPI (Text-to-SQL 버전)
계약 관리 시스템과 연동하여 자연어 질의응답 제공
PostgreSQL + Ollama LLM (동적 SQL 생성)
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
from dotenv import load_dotenv
import logging
import psycopg2
from psycopg2.extras import RealDictCursor
import requests
import json
import re

# 스키마 정보 import
from db_schema import DB_SCHEMA, FEW_SHOT_EXAMPLES

# 환경 변수 로드
load_dotenv()

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# FastAPI 앱 생성
app = FastAPI(
    title="CMS AI Assistant (Text-to-SQL)",
    description="계약 관리 시스템 AI 어시스턴트 - 동적 SQL 생성 버전",
    version="2.0.0"
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 전역 변수
db_conn = None
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
LLM_MODEL = os.getenv("LLM_MODEL", "llama3.1:8b")

# DB 설정
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': int(os.getenv('DB_PORT', 5432)),
    'database': os.getenv('DB_NAME', 'contract_management'),
    'user': os.getenv('DB_USERNAME', 'postgres'),
    'password': os.getenv('DB_PASSWORD', 'meritz123!')
}

# 요청/응답 모델
class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    answer: str
    sources: Optional[List[dict]] = []
    sql: Optional[str] = None  # 생성된 SQL도 함께 반환

# DB 연결
def get_db_connection():
    """PostgreSQL 데이터베이스 연결"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        return conn
    except Exception as e:
        logger.error(f"DB 연결 오류: {e}")
        return None

# LLM을 사용한 SQL 생성
def generate_sql_with_llm(question: str) -> str:
    """질문으로부터 SQL을 생성"""
    try:
        prompt = f"""당신은 PostgreSQL SQL 전문가입니다.
사용자의 자연어 질문을 SQL 쿼리로 변환하세요.

{DB_SCHEMA}

{FEW_SHOT_EXAMPLES}

중요 규칙:
1. SELECT 쿼리만 생성하세요 (INSERT, UPDATE, DELETE 금지)
2. SQL injection 방지를 위해 안전한 쿼리만 생성
3. LIMIT 절을 적절히 사용 (기본값: 10)
4. 날짜 필터는 적절한 함수 사용 (EXTRACT, DATE_TRUNC 등)
5. 금액 비교는 numeric 타입 컬럼 사용
6. SQL만 출력하고 설명은 하지 마세요
7. 백틱(```)이나 'sql' 태그 없이 순수 SQL만 출력

사용자 질문: {question}

SQL:"""

        # Ollama API 호출
        response = requests.post(
            f"{OLLAMA_BASE_URL}/api/generate",
            json={
                "model": LLM_MODEL,
                "prompt": prompt,
                "stream": False,
                "temperature": 0.1  # 더 정확한 SQL을 위해 낮은 temperature
            },
            timeout=120  # 타임아웃 증가 (60초 → 120초)
        )
        
        if response.status_code == 200:
            result = response.json()
            sql = result.get("response", "").strip()
            
            # SQL 정리 (불필요한 텍스트 제거)
            sql = clean_sql(sql)
            
            logger.info(f"생성된 SQL: {sql}")
            return sql
        else:
            logger.error(f"Ollama API 오류: {response.status_code}")
            return None
            
    except requests.exceptions.ConnectionError:
        logger.error("Ollama 서버에 연결할 수 없습니다")
        return None
    except Exception as e:
        logger.error(f"SQL 생성 오류: {e}")
        return None

def clean_sql(sql: str) -> str:
    """생성된 SQL 정리"""
    # 백틱 제거
    sql = re.sub(r'```sql\s*', '', sql)
    sql = re.sub(r'```\s*', '', sql)
    
    # 앞뒤 공백 제거
    sql = sql.strip()
    
    # "SQL:" 이후의 SQL만 추출 (프롬프트 형식 제거)
    if 'SQL:' in sql:
        sql = sql.split('SQL:')[-1].strip()
    
    # 설명 텍스트 제거 (한글/영어)
    # "질문에 대한...", "위의 SQL...", "이 쿼리는..." 같은 패턴 제거
    lines = sql.split('\n')
    sql_lines = []
    for line in lines:
        line = line.strip()
        # SELECT로 시작하거나 SQL 키워드를 포함하는 줄만 유지
        if re.match(r'^\s*(SELECT|FROM|WHERE|JOIN|GROUP|ORDER|HAVING|LIMIT|AND|OR)\b', line, re.IGNORECASE):
            sql_lines.append(line)
        elif sql_lines:  # 이미 SQL이 시작된 후의 줄들
            sql_lines.append(line)
    
    if sql_lines:
        sql = ' '.join(sql_lines)
    
    # Python 코드 제거 (변수 할당 등)
    if '=' in sql and 'SELECT' in sql:
        # "변수 = """ SQL """ 패턴 제거
        sql = re.sub(r'^[^=]+=\s*["\']+"', '', sql)
        sql = re.sub(r'["\']+".*$', '', sql)
    
    # 여러 줄을 한 줄로
    sql = ' '.join(sql.split())
    
    # 세미콜론으로 끝나지 않으면 추가
    if not sql.endswith(';'):
        sql += ';'
    
    # 중복 세미콜론 제거
    sql = re.sub(r';+', ';', sql)
    
    return sql

def validate_sql(sql: str) -> bool:
    """SQL 안전성 검증"""
    sql_lower = sql.lower()
    
    # 위험한 키워드 체크 (단어 경계 포함)
    dangerous_keywords = [
        r'\bdrop\b', r'\bdelete\b', r'\btruncate\b', r'\binsert\b', r'\bupdate\b',
        r'\balter\b', r'\bcreate\b', r'\bgrant\b', r'\brevoke\b', r'\bexec\b'
    ]
    
    for pattern in dangerous_keywords:
        if re.search(pattern, sql_lower):
            keyword = pattern.replace(r'\b', '')
            logger.warning(f"위험한 SQL 키워드 감지: {keyword}")
            return False
    
    # SELECT로 시작하는지 확인
    if not sql_lower.strip().startswith('select'):
        logger.warning("SELECT 쿼리가 아님")
        return False
    
    return True

def execute_sql(sql: str) -> List[dict]:
    """SQL 실행 및 결과 반환"""
    try:
        conn = get_db_connection()
        if not conn:
            return []
        
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute(sql)
        results = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return [dict(row) for row in results]
        
    except Exception as e:
        logger.error(f"SQL 실행 오류: {e}")
        return []

def format_results_for_llm(results: List[dict], question: str) -> str:
    """쿼리 결과를 LLM용 텍스트로 포맷팅"""
    if not results:
        return "조회된 데이터가 없습니다."
    
    context = f"데이터베이스 조회 결과 ({len(results)}건):\n\n"
    
    # 결과 포맷팅 (최대 10개)
    for i, row in enumerate(results[:10], 1):
        context += f"{i}. "
        for key, value in row.items():
            # 값 포맷팅
            if value is None:
                formatted_value = "N/A"
            elif isinstance(value, (int, float)):
                if 'amount' in key or 'price' in key or 'budget' in key:
                    formatted_value = f"{int(value):,}원"
                else:
                    formatted_value = f"{value:,}" if isinstance(value, int) else f"{value:.2f}"
            else:
                formatted_value = str(value)
            
            context += f"{key}: {formatted_value}, "
        context += "\n"
    
    if len(results) > 10:
        context += f"\n... 외 {len(results) - 10}건 더 있음\n"
    
    return context

def generate_answer_with_llm(question: str, data_context: str, sql: str) -> str:
    """데이터를 기반으로 자연스러운 답변 생성"""
    try:
        prompt = f"""당신은 계약 관리 시스템(CMS)의 AI 어시스턴트입니다.
사용자의 질문에 대해 데이터베이스 조회 결과를 기반으로 정확하고 친절하게 답변해주세요.

{data_context}

사용자 질문: {question}

답변 작성 시 주의사항:
1. 위 데이터를 기반으로 정확하게 답변하세요
2. 구체적인 숫자와 통계를 포함하세요
3. 한국어로 자연스럽게 답변하세요
4. 데이터가 없으면 "해당 정보가 없습니다"라고 말하세요
5. 가능하면 인사이트나 추가 정보를 제공하세요
6. 간결하고 명확하게 답변하세요

답변:"""

        # Ollama API 호출
        response = requests.post(
            f"{OLLAMA_BASE_URL}/api/generate",
            json={
                "model": LLM_MODEL,
                "prompt": prompt,
                "stream": False
            },
            timeout=60
        )
        
        if response.status_code == 200:
            result = response.json()
            return result.get("response", "답변을 생성할 수 없습니다.")
        else:
            logger.error(f"Ollama API 오류: {response.status_code}")
            return "답변 생성 중 오류가 발생했습니다."
            
    except Exception as e:
        logger.error(f"답변 생성 오류: {e}")
        return f"오류가 발생했습니다: {str(e)}"

# API 엔드포인트
@app.get("/health")
async def health_check():
    """헬스 체크"""
    return {
        "status": "ok",
        "version": "2.0.0",
        "mode": "Text-to-SQL",
        "llm_model": LLM_MODEL
    }

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """채팅 엔드포인트 (Text-to-SQL)"""
    try:
        question = request.message
        
        logger.info(f"질문: {question}")
        
        # 1단계: 질문으로부터 SQL 생성
        sql = generate_sql_with_llm(question)
        
        if not sql:
            return ChatResponse(
                answer="⚠️ SQL 쿼리를 생성할 수 없습니다. Ollama 서버를 확인해주세요.",
                sources=[],
                sql=None
            )
        
        # 2단계: SQL 안전성 검증
        if not validate_sql(sql):
            return ChatResponse(
                answer="⚠️ 안전하지 않은 SQL 쿼리입니다. SELECT 쿼리만 허용됩니다.",
                sources=[],
                sql=sql
            )
        
        # 3단계: SQL 실행
        results = execute_sql(sql)
        
        # 4단계: 결과를 텍스트로 포맷팅
        data_context = format_results_for_llm(results, question)
        
        # 5단계: 자연스러운 답변 생성
        answer = generate_answer_with_llm(question, data_context, sql)
        
        # 6단계: 응답 구성
        sources = []
        if results:
            sources.append({
                "type": "database_query",
                "count": len(results),
                "data": results[:5]  # 최대 5개만 포함
            })
        
        return ChatResponse(
            answer=answer,
            sources=sources,
            sql=sql  # 디버깅용으로 생성된 SQL도 반환
        )
        
    except Exception as e:
        logger.error(f"채팅 처리 오류: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/stats")
async def get_stats():
    """시스템 통계"""
    try:
        conn = get_db_connection()
        if not conn:
            raise HTTPException(status_code=500, detail="DB 연결 실패")
        
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # 기본 통계
        cursor.execute("SELECT COUNT(*) as count FROM proposals")
        total_proposals = cursor.fetchone()['count']
        
        cursor.execute("SELECT COUNT(*) as count FROM proposals WHERE status = 'approved'")
        approved_proposals = cursor.fetchone()['count']
        
        cursor.execute("SELECT COUNT(*) as count FROM business_budgets")
        total_budgets = cursor.fetchone()['count']
        
        cursor.execute("SELECT COUNT(*) as count FROM departments WHERE is_active = true")
        total_departments = cursor.fetchone()['count']
        
        cursor.execute("SELECT SUM(budget_amount) as total FROM business_budgets WHERE budget_year = EXTRACT(YEAR FROM CURRENT_DATE)")
        current_year_budget = cursor.fetchone()['total'] or 0
        
        cursor.close()
        conn.close()
        
        return {
            "total_proposals": total_proposals,
            "approved_proposals": approved_proposals,
            "total_budgets": total_budgets,
            "total_departments": total_departments,
            "current_year_budget": float(current_year_budget),
            "mode": "Text-to-SQL"
        }
        
    except Exception as e:
        logger.error(f"통계 조회 오류: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

