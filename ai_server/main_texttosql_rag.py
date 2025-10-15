"""
AI 어시스턴트 서버 - FastAPI (Text-to-SQL + RAG)
계약 관리 시스템과 연동하여 자연어 질의응답 제공
PostgreSQL + Ollama LLM (동적 SQL 생성 + RAG 최적화)
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
from sentence_transformers import SentenceTransformer
import numpy as np

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
    title="CMS AI Assistant (Text-to-SQL + RAG)",
    description="계약 관리 시스템 AI 어시스턴트 - RAG 최적화 버전",
    version="2.1.0"
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
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://172.22.32.200:11434")
LLM_MODEL = os.getenv("LLM_MODEL", "llama3.1:8b")

# DB 설정
DB_CONFIG = {
    'host': os.getenv('DB_HOST', '172.22.32.200'),
    'port': int(os.getenv('DB_PORT', 5432)),
    'database': os.getenv('DB_NAME', 'contract_management'),
    'user': os.getenv('DB_USERNAME', 'postgres'),
    'password': os.getenv('DB_PASSWORD', 'meritz123!')
}

# RAG 설정
embedder = None  # 전역 임베딩 모델
example_questions = []  # 예시 질문 리스트
example_sqls = []  # 예시 SQL 리스트
example_vectors = None  # 예시 벡터

# 요청/응답 모델
class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    answer: str
    sources: Optional[List[dict]] = []
    sql: Optional[str] = None
    selected_examples: Optional[int] = None  # RAG로 선택된 예시 개수

# 임베딩 모델 초기화
def initialize_embedder():
    """임베딩 모델 및 예시 벡터 초기화"""
    global embedder, example_questions, example_sqls, example_vectors
    
    try:
        logger.info("임베딩 모델 로딩 중...")
        
        # 로컬 캐시 경로
        from pathlib import Path
        model_path = Path.home() / ".cache" / "huggingface" / "hub" / "models--sentence-transformers--all-MiniLM-L6-v2" / "snapshots" / "main"
        
        # 로컬 모델 로드 (오프라인 모드)
        if model_path.exists():
            logger.info(f"로컬 모델 사용: {model_path}")
            embedder = SentenceTransformer(str(model_path), local_files_only=True)
        else:
            logger.info("로컬 모델 없음, 온라인에서 다운로드...")
            embedder = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
        
        # FEW_SHOT_EXAMPLES에서 질문-SQL 쌍 추출
        lines = FEW_SHOT_EXAMPLES.strip().split('\n')
        for i in range(len(lines)):
            if lines[i].startswith('질문:'):
                question = lines[i].replace('질문:', '').strip()
                if i + 1 < len(lines) and lines[i + 1].startswith('SQL:'):
                    sql = lines[i + 1].replace('SQL:', '').strip()
                    example_questions.append(question)
                    example_sqls.append(sql)
        
        # 예시들을 벡터로 변환
        if example_questions:
            logger.info(f"{len(example_questions)}개 예시를 벡터로 변환 중...")
            example_vectors = embedder.encode(example_questions)
            logger.info(f"✅ RAG 초기화 완료! {len(example_questions)}개 예시 준비됨")
        else:
            logger.warning("예시가 없습니다!")
            
    except Exception as e:
        logger.error(f"임베딩 모델 초기화 오류: {e}")
        embedder = None

# DB 연결
def get_db_connection():
    """PostgreSQL 데이터베이스 연결"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        return conn
    except Exception as e:
        logger.error(f"DB 연결 오류: {e}")
        return None

# RAG: 유사한 예시 선택
def select_relevant_examples(question: str, top_k: int = 5) -> str:
    """질문과 유사한 예시만 선택"""
    global embedder, example_questions, example_sqls, example_vectors
    
    if embedder is None or example_vectors is None:
        # RAG 실패 시 모든 예시 반환
        logger.warning("RAG 사용 불가, 전체 예시 사용")
        return FEW_SHOT_EXAMPLES
    
    try:
        # 질문을 벡터로 변환
        question_vector = embedder.encode([question])
        
        # 코사인 유사도 계산
        from sklearn.metrics.pairwise import cosine_similarity
        similarities = cosine_similarity(question_vector, example_vectors)[0]
        
        # 상위 k개 선택
        top_indices = similarities.argsort()[-top_k:][::-1]
        
        # 선택된 예시 포맷팅
        selected_examples = "# SQL 생성 예시 (관련 예시만):\n\n"
        for idx in top_indices:
            selected_examples += f"질문: {example_questions[idx]}\n"
            selected_examples += f"SQL: {example_sqls[idx]}\n\n"
        
        logger.info(f"RAG: {len(example_questions)}개 중 {top_k}개 예시 선택")
        return selected_examples
        
    except Exception as e:
        logger.error(f"RAG 선택 오류: {e}")
        return FEW_SHOT_EXAMPLES

# LLM을 사용한 SQL 생성
def generate_sql_with_llm(question: str) -> str:
    """질문으로부터 SQL을 생성 (RAG 사용)"""
    try:
        # RAG: 관련 예시만 선택 (30개 → 5개)
        relevant_examples = select_relevant_examples(question, top_k=5)
        
        prompt = f"""당신은 PostgreSQL SQL 전문가입니다.
사용자의 자연어 질문을 SQL 쿼리로 변환하세요.

{DB_SCHEMA}

{relevant_examples}

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
                "temperature": 0.1
            },
            timeout=120
        )
        
        if response.status_code == 200:
            result = response.json()
            sql = result.get("response", "").strip()
            
            # SQL 정리
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
    
    # "SQL:" 이후의 SQL만 추출
    if 'SQL:' in sql:
        sql = sql.split('SQL:')[-1].strip()
    
    # 설명 텍스트 제거
    lines = sql.split('\n')
    sql_lines = []
    for line in lines:
        line = line.strip()
        # SELECT로 시작하거나 SQL 키워드를 포함하는 줄만 유지
        if re.match(r'^\s*(SELECT|FROM|WHERE|JOIN|GROUP|ORDER|HAVING|LIMIT|AND|OR)\b', line, re.IGNORECASE):
            sql_lines.append(line)
        elif sql_lines:
            sql_lines.append(line)
    
    if sql_lines:
        sql = ' '.join(sql_lines)
    
    # Python 코드 제거
    if '=' in sql and 'SELECT' in sql:
        sql = re.sub(r'^[^=]+=\s*["\']+"', '', sql)
        sql = re.sub(r'["\']+".*$', '', sql)
    
    # 여러 줄을 한 줄로
    sql = ' '.join(sql.split())
    
    # 세미콜론
    if not sql.endswith(';'):
        sql += ';'
    
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
    
    for i, row in enumerate(results[:10], 1):
        context += f"{i}. "
        for key, value in row.items():
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
2. 데이터가 없으면 "해당 정보가 없습니다"라고 명확히 말하세요
3. 한국어로 자연스럽게 답변하세요
4. 가능한 구체적인 수치를 포함하세요
5. 필요시 인사이트나 추가 정보를 제공하세요
6. 간결하고 명확하게 답변하세요

답변:"""

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
@app.on_event("startup")
async def startup_event():
    """서버 시작 시 임베딩 모델 초기화"""
    initialize_embedder()

@app.get("/health")
async def health_check():
    """헬스 체크"""
    return {
        "status": "ok",
        "version": "2.1.0",
        "mode": "Text-to-SQL + RAG",
        "llm_model": LLM_MODEL,
        "rag_enabled": embedder is not None,
        "rag_examples": len(example_questions) if example_questions else 0
    }

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """채팅 엔드포인트 (Text-to-SQL + RAG)"""
    try:
        question = request.message
        
        logger.info(f"질문: {question}")
        
        # 1단계: 질문으로부터 SQL 생성 (RAG 적용)
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
                "data": results[:5]
            })
        
        return ChatResponse(
            answer=answer,
            sources=sources,
            sql=sql,
            selected_examples=5 if embedder else 30  # RAG 사용 시 5개, 아니면 30개
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
            "mode": "Text-to-SQL + RAG",
            "rag_enabled": embedder is not None,
            "rag_examples": len(example_questions) if example_questions else 0
        }
        
    except Exception as e:
        logger.error(f"통계 조회 오류: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

