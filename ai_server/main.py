"""
AI 어시스턴트 서버 - FastAPI
계약 관리 시스템과 연동하여 자연어 질의응답 제공
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
from dotenv import load_dotenv
import logging

# 로컬 모듈
from rag_engine import RAGEngine
from db_connector import DatabaseConnector

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
    title="CMS AI Assistant",
    description="계약 관리 시스템 AI 어시스턴트",
    version="1.0.0"
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 프로덕션에서는 특정 도메인으로 제한
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 전역 변수
rag_engine: Optional[RAGEngine] = None
db_connector: Optional[DatabaseConnector] = None

# 요청/응답 모델
class ChatRequest(BaseModel):
    question: str
    conversation_id: Optional[str] = None
    use_history: bool = True

class ChatResponse(BaseModel):
    answer: str
    sources: List[dict] = []
    conversation_id: str
    tokens_used: Optional[int] = None

class HealthResponse(BaseModel):
    status: str
    ollama_status: str
    db_status: str
    vector_db_status: str

# 시작 이벤트
@app.on_event("startup")
async def startup_event():
    """서버 시작 시 초기화"""
    global rag_engine, db_connector
    
    logger.info("🚀 AI 어시스턴트 서버 시작 중...")
    
    try:
        # DB 연결
        db_connector = DatabaseConnector(
            host=os.getenv("DB_HOST", "localhost"),
            port=int(os.getenv("DB_PORT", "5432")),
            database=os.getenv("DB_NAME", "cms_db"),
            user=os.getenv("DB_USER", "postgres"),
            password=os.getenv("DB_PASSWORD", "")
        )
        logger.info("✅ 데이터베이스 연결 완료")
        
        # RAG 엔진 초기화
        rag_engine = RAGEngine(
            ollama_base_url=os.getenv("OLLAMA_BASE_URL", "http://localhost:11434"),
            model_name=os.getenv("LLM_MODEL", "llama3.1:8b"),
            embedding_model=os.getenv("EMBEDDING_MODEL", "nomic-embed-text"),
            db_connector=db_connector
        )
        logger.info("✅ RAG 엔진 초기화 완료")
        
        # 벡터 DB 초기화 (최초 실행 시 데이터 인덱싱)
        await rag_engine.initialize_vector_db()
        logger.info("✅ 벡터 데이터베이스 준비 완료")
        
        logger.info("🎉 AI 어시스턴트 서버 준비 완료!")
        
    except Exception as e:
        logger.error(f"❌ 초기화 실패: {e}")
        raise

# 종료 이벤트
@app.on_event("shutdown")
async def shutdown_event():
    """서버 종료 시 정리"""
    global db_connector
    
    logger.info("🛑 AI 어시스턴트 서버 종료 중...")
    
    if db_connector:
        db_connector.close()
        logger.info("✅ 데이터베이스 연결 종료")

# 엔드포인트
@app.get("/", response_model=dict)
async def root():
    """루트 엔드포인트"""
    return {
        "message": "CMS AI Assistant API",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """헬스 체크"""
    try:
        # Ollama 상태 확인
        ollama_status = "healthy" if rag_engine and rag_engine.check_ollama() else "unhealthy"
        
        # DB 상태 확인
        db_status = "healthy" if db_connector and db_connector.check_connection() else "unhealthy"
        
        # 벡터 DB 상태 확인
        vector_db_status = "healthy" if rag_engine and rag_engine.vector_db else "unhealthy"
        
        return HealthResponse(
            status="healthy" if all([ollama_status == "healthy", db_status == "healthy"]) else "degraded",
            ollama_status=ollama_status,
            db_status=db_status,
            vector_db_status=vector_db_status
        )
    except Exception as e:
        logger.error(f"헬스 체크 오류: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    AI 어시스턴트와 대화
    
    - question: 사용자 질문
    - conversation_id: 대화 ID (선택)
    - use_history: 대화 이력 사용 여부
    """
    try:
        if not rag_engine:
            raise HTTPException(status_code=503, detail="RAG 엔진이 초기화되지 않았습니다")
        
        logger.info(f"💬 질문 수신: {request.question}")
        
        # RAG 엔진을 통해 답변 생성
        result = await rag_engine.query(
            question=request.question,
            conversation_id=request.conversation_id,
            use_history=request.use_history
        )
        
        logger.info(f"✅ 답변 생성 완료")
        
        return ChatResponse(
            answer=result["answer"],
            sources=result.get("sources", []),
            conversation_id=result.get("conversation_id", ""),
            tokens_used=result.get("tokens_used")
        )
        
    except Exception as e:
        logger.error(f"❌ 채팅 오류: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/reindex")
async def reindex_database():
    """
    데이터베이스 재인덱싱
    (새로운 데이터가 추가되었을 때 호출)
    """
    try:
        if not rag_engine:
            raise HTTPException(status_code=503, detail="RAG 엔진이 초기화되지 않았습니다")
        
        logger.info("🔄 데이터베이스 재인덱싱 시작...")
        await rag_engine.reindex_database()
        logger.info("✅ 재인덱싱 완료")
        
        return {"status": "success", "message": "데이터베이스 재인덱싱이 완료되었습니다"}
        
    except Exception as e:
        logger.error(f"❌ 재인덱싱 오류: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/stats")
async def get_stats():
    """시스템 통계"""
    try:
        if not rag_engine or not db_connector:
            raise HTTPException(status_code=503, detail="서비스가 초기화되지 않았습니다")
        
        stats = {
            "vector_db_count": rag_engine.get_vector_count(),
            "db_proposals_count": db_connector.get_proposals_count(),
            "db_budgets_count": db_connector.get_budgets_count(),
        }
        
        return stats
        
    except Exception as e:
        logger.error(f"❌ 통계 조회 오류: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )

