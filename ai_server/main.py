"""
AI 어시스턴트 서버 - FastAPI (간소화 버전)
계약 관리 시스템과 연동하여 자연어 질의응답 제공
PostgreSQL 직접 쿼리 + Ollama LLM
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
    description="계약 관리 시스템 AI 어시스턴트 (간소화 버전)",
    version="1.0.0"
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

# 요청/응답 모델
class ChatRequest(BaseModel):
    question: str
    conversation_id: Optional[str] = None

class ChatResponse(BaseModel):
    answer: str
    sources: List[dict] = []
    conversation_id: str = ""

class HealthResponse(BaseModel):
    status: str
    ollama_status: str
    db_status: str

# DB 연결 함수
def get_db_connection():
    """PostgreSQL 연결"""
    try:
        conn = psycopg2.connect(
            host=os.getenv("DB_HOST", "localhost"),
            port=int(os.getenv("DB_PORT", "5432")),
            database=os.getenv("DB_NAME", "contract_management"),
            user=os.getenv("DB_USER", "postgres"),
            password=os.getenv("DB_PASSWORD", "meritz123!")
        )
        return conn
    except Exception as e:
        logger.error(f"DB 연결 실패: {e}")
        return None

# DB에서 관련 데이터 검색
def search_database(question: str):
    """질문과 관련된 데이터베이스 정보 검색"""
    try:
        conn = get_db_connection()
        if not conn:
            return []
        
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # 질문에서 키워드 추출 (간단한 방식)
        keywords = question.lower()
        sources = []
        
        # 상태별 품의서 집계 (상태별 키워드가 있으면 우선 처리)
        is_status_query = any(word in keywords for word in ['상태', '상태별', '현황', '대기', '승인', '임시저장', '제출'])
        
        if is_status_query:
            cursor.execute("""
                SELECT 
                    status,
                    COUNT(*) as count
                FROM proposals
                GROUP BY status
                ORDER BY count DESC
            """)
            status_stats = cursor.fetchall()
            if status_stats:
                sources.append({
                    "type": "status_statistics",
                    "data": [dict(s) for s in status_stats]
                })
        
        # 품의서 검색 (상태별 질문이 아닐 때만)
        elif any(word in keywords for word in ['품의', '계약', '제안', '승인', '결재']):
            cursor.execute("""
                SELECT id, title, purpose, status, 
                       TO_CHAR(approval_date, 'YYYY-MM-DD') as approval_date,
                       contract_method
                FROM proposals 
                ORDER BY created_at DESC 
                LIMIT 10
            """)
            proposals = cursor.fetchall()
            if proposals:
                sources.append({
                    "type": "proposals",
                    "count": len(proposals),
                    "data": [dict(p) for p in proposals]
                })
        
        # 예산 범위/최대/최소 질문 (우선 처리)
        is_range_query = any(word in keywords for word in ['최대', '최소', '가장', '범위', '평균'])
        
        if is_range_query:
            # 범위 통계
            cursor.execute("""
                SELECT 
                    MIN(budget_amount) as min_budget,
                    MAX(budget_amount) as max_budget,
                    AVG(budget_amount) as avg_budget,
                    COUNT(*) as count
                FROM business_budgets
                WHERE budget_year = EXTRACT(YEAR FROM CURRENT_DATE)
            """)
            budget_range = cursor.fetchone()
            if budget_range:
                sources.append({
                    "type": "budget_range",
                    "data": dict(budget_range)
                })
            
            # 최대/최소 예산 항목도 함께 제공
            cursor.execute("""
                SELECT project_name, budget_amount
                FROM business_budgets
                WHERE budget_year = EXTRACT(YEAR FROM CURRENT_DATE)
                  AND (budget_amount = (SELECT MIN(budget_amount) FROM business_budgets WHERE budget_year = EXTRACT(YEAR FROM CURRENT_DATE))
                    OR budget_amount = (SELECT MAX(budget_amount) FROM business_budgets WHERE budget_year = EXTRACT(YEAR FROM CURRENT_DATE)))
                ORDER BY budget_amount
            """)
            extreme_budgets = cursor.fetchall()
            if extreme_budgets:
                sources.append({
                    "type": "extreme_budgets",
                    "data": [dict(b) for b in extreme_budgets]
                })
        
        # 예산 정보 검색 (일반 질문일 때만)
        elif any(word in keywords for word in ['예산', '금액', '비용', '사업']):
            cursor.execute("""
                SELECT id, budget_year as year, project_name, budget_amount, 
                       status, initiator_department, executor_department
                FROM business_budgets
                ORDER BY budget_year DESC, created_at DESC
                LIMIT 10
            """)
            budgets = cursor.fetchall()
            if budgets:
                sources.append({
                    "type": "budgets",
                    "count": len(budgets),
                    "data": [dict(b) for b in budgets]
                })
        
        # 부서 정보 검색
        if any(word in keywords for word in ['부서', '팀', '조직']):
            cursor.execute("""
                SELECT id, name, code, manager, description
                FROM departments
                WHERE is_active = true
                ORDER BY code
                LIMIT 10
            """)
            departments = cursor.fetchall()
            if departments:
                sources.append({
                    "type": "departments",
                    "count": len(departments),
                    "data": [dict(d) for d in departments]
                })
        
        # 월별 통계 (월별, 집계 관련 질문)
        if any(word in keywords for word in ['월별', '월간', '집계', '추이']):
            cursor.execute("""
                SELECT 
                    EXTRACT(MONTH FROM created_at) as month,
                    COUNT(*) as total,
                    COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
                    COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft
                FROM proposals
                WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
                GROUP BY EXTRACT(MONTH FROM created_at)
                ORDER BY month
            """)
            monthly = cursor.fetchall()
            if monthly:
                sources.append({
                    "type": "monthly_statistics",
                    "data": [dict(m) for m in monthly]
                })
        
        # 계약 방식별 통계
        if any(word in keywords for word in ['계약방식', '계약 방식', '입찰', '수의계약', '경쟁입찰']):
            cursor.execute("""
                SELECT 
                    contract_method,
                    COUNT(*) as count
                FROM proposals
                WHERE contract_method IS NOT NULL AND contract_method != ''
                GROUP BY contract_method
                ORDER BY count DESC
            """)
            contract_methods = cursor.fetchall()
            if contract_methods:
                sources.append({
                    "type": "contract_method_statistics",
                    "data": [dict(c) for c in contract_methods]
                })
        
        # 예산 집행 통계
        if any(word in keywords for word in ['집행', '집행액', '집행률', '사용', '사용액']):
            cursor.execute("""
                SELECT 
                    COUNT(*) as total_count,
                    SUM(budget_amount) as total_budget,
                    SUM(COALESCE(executed_amount, 0)) as total_executed,
                    SUM(COALESCE(confirmed_execution_amount, 0)) as confirmed_executed,
                    SUM(COALESCE(unexecuted_amount, 0)) as unexecuted,
                    COUNT(CASE WHEN executed_amount IS NOT NULL AND executed_amount > 0 THEN 1 END) as executed_count
                FROM business_budgets
                WHERE budget_year = EXTRACT(YEAR FROM CURRENT_DATE)
            """)
            execution_stats = cursor.fetchone()
            if execution_stats:
                sources.append({
                    "type": "budget_execution",
                    "data": dict(execution_stats)
                })
        
        # 금액 범위 조건 질문 (예: N억원 이상, N만원 이하)
        amount_threshold = None
        if '억' in keywords:
            # "1억원 이상" 같은 패턴 찾기
            import re
            match = re.search(r'(\d+)\s*억', keywords)
            if match:
                amount_threshold = int(match.group(1)) * 100000000  # 억 단위
        
        if amount_threshold:
            cursor.execute("""
                SELECT 
                    COUNT(*) as count,
                    SUM(budget_amount) as total_amount,
                    MIN(budget_amount) as min_amount,
                    MAX(budget_amount) as max_amount
                FROM business_budgets
                WHERE budget_amount >= %s AND budget_year = EXTRACT(YEAR FROM CURRENT_DATE)
            """, (amount_threshold,))
            amount_range_stats = cursor.fetchone()
            if amount_range_stats:
                sources.append({
                    "type": "amount_range_statistics",
                    "data": dict(amount_range_stats),
                    "threshold": amount_threshold
                })
        
        # 구매 품목 검색
        if any(word in keywords for word in ['구매', '물품', '장비', '노트북', '컴퓨터', 'PC']):
            cursor.execute("""
                SELECT pi.id, pi.item_name, pi.quantity, pi.unit_price, 
                       pi.total_amount, p.title as proposal_title
                FROM purchase_items pi
                LEFT JOIN proposals p ON pi.proposal_id = p.id
                ORDER BY pi.created_at DESC
                LIMIT 10
            """)
            purchase_items = cursor.fetchall()
            if purchase_items:
                sources.append({
                    "type": "purchase_items",
                    "data": [dict(item) for item in purchase_items]
                })
        
        # 용역 항목 검색
        if any(word in keywords for word in ['용역', '서비스', '개발', '유지보수', '컨설팅']):
            cursor.execute("""
                SELECT si.id, si.name, si.item, si.personnel, 
                       si.period, si.contract_amount, p.title as proposal_title
                FROM service_items si
                LEFT JOIN proposals p ON si.proposal_id = p.id
                ORDER BY si.created_at DESC
                LIMIT 10
            """)
            service_items = cursor.fetchall()
            if service_items:
                sources.append({
                    "type": "service_items",
                    "data": [dict(item) for item in service_items]
                })
        
        # 공급업체 검색
        if any(word in keywords for word in ['공급업체', '업체', '납품', '벤더', '협력사']):
            cursor.execute("""
                SELECT id, name, business_number, representative, 
                       phone, email, credit_rating
                FROM suppliers
                WHERE is_active = true
                ORDER BY created_at DESC
                LIMIT 10
            """)
            suppliers = cursor.fetchall()
            if suppliers:
                sources.append({
                    "type": "suppliers",
                    "data": [dict(s) for s in suppliers]
                })
        
        # 계약 방식 상세 정보
        if '계약방식' in keywords or '입찰' in keywords:
            cursor.execute("""
                SELECT value, name, regulation, min_amount, max_amount, description
                FROM contract_methods
                WHERE is_active = true
                ORDER BY name
            """)
            contract_method_details = cursor.fetchall()
            if contract_method_details:
                sources.append({
                    "type": "contract_method_details",
                    "data": [dict(cm) for cm in contract_method_details]
                })
        
        # 프로젝트 목적 검색
        if any(word in keywords for word in ['목적', '용도', '사유', '이유']):
            cursor.execute("""
                SELECT DISTINCT code, description, year
                FROM project_purposes
                ORDER BY code
            """)
            purposes = cursor.fetchall()
            if purposes:
                sources.append({
                    "type": "project_purposes",
                    "data": [dict(p) for p in purposes]
                })
        
        # 통계 정보 (일반적인 질문)
        if any(word in keywords for word in ['총', '전체', '몇', '얼마', '통계', '현황']):
            cursor.execute("""
                SELECT 
                    (SELECT COUNT(*) FROM proposals) as total_proposals,
                    (SELECT COUNT(*) FROM proposals WHERE status = 'approved') as approved_proposals,
                    (SELECT COUNT(*) FROM business_budgets) as total_budgets,
                    (SELECT COUNT(*) FROM departments WHERE is_active = true) as total_departments,
                    (SELECT SUM(budget_amount) FROM business_budgets WHERE budget_year = EXTRACT(YEAR FROM CURRENT_DATE)) as current_year_budget
            """)
            stats = cursor.fetchone()
            if stats:
                sources.append({
                    "type": "statistics",
                    "data": dict(stats)
                })
        
        cursor.close()
        conn.close()
        
        return sources
        
    except Exception as e:
        logger.error(f"DB 검색 오류: {e}")
        return []

# Ollama로 LLM 쿼리
def query_ollama(question: str, context_data: List[dict]):
    """Ollama LLM에 질문"""
    try:
        # 컨텍스트 생성
        context = "다음은 계약 관리 시스템의 데이터입니다:\n\n"
        
        for source in context_data:
            if source["type"] == "proposals":
                context += f"📄 품의서 정보 ({source['count']}건):\n"
                for p in source["data"][:5]:  # 최대 5개만
                    context += f"  - [{p.get('id')}] {p.get('title', 'N/A')} (상태: {p.get('status', 'N/A')}, 승인일: {p.get('approval_date', 'N/A')})\n"
            
            elif source["type"] == "budgets":
                context += f"\n💰 사업예산 정보 ({source['count']}건):\n"
                for b in source["data"][:5]:
                    budget_amount = f"{int(b.get('budget_amount', 0)):,}" if b.get('budget_amount') else 'N/A'
                    context += f"  - [{b.get('year')}] {b.get('project_name', 'N/A')}: {budget_amount}원\n"
            
            elif source["type"] == "departments":
                context += f"\n🏢 부서 정보 ({source['count']}건):\n"
                for d in source["data"][:5]:
                    context += f"  - [{d.get('code', 'N/A')}] {d.get('name', 'N/A')} (담당자: {d.get('manager', 'N/A')})\n"
            
            elif source["type"] == "monthly_statistics":
                context += f"\n📅 월별 품의서/계약 통계 (올해):\n"
                for m in source["data"]:
                    month_num = int(m.get('month', 0))
                    total = m.get('total', 0)
                    approved = m.get('approved', 0)
                    draft = m.get('draft', 0)
                    context += f"  - {month_num}월: 전체 {total}건, 승인 {approved}건, 임시저장 {draft}건\n"
            
            elif source["type"] == "status_statistics":
                context += f"\n📊 품의서 상태별 통계:\n"
                for s in source["data"]:
                    status = s.get('status', 'N/A')
                    count = s.get('count', 0)
                    status_kr = {
                        'approved': '승인완료',
                        'pending': '대기중',
                        'draft': '임시저장',
                        'submitted': '제출됨',
                        'rejected': '반려'
                    }.get(status, status)
                    context += f"  - {status_kr}: {count}건\n"
            
            elif source["type"] == "budget_range":
                data = source["data"]
                context += f"\n💰 예산 범위 통계 (올해):\n"
                if data.get('min_budget'):
                    context += f"  - 최소 예산: {int(data['min_budget']):,}원\n"
                if data.get('max_budget'):
                    context += f"  - 최대 예산: {int(data['max_budget']):,}원\n"
                if data.get('avg_budget'):
                    context += f"  - 평균 예산: {int(data['avg_budget']):,}원\n"
                context += f"  - 총 건수: {data.get('count', 0)}건\n"
            
            elif source["type"] == "extreme_budgets":
                context += f"\n📌 최대/최소 예산 항목:\n"
                for b in source["data"]:
                    budget_amount = f"{int(b.get('budget_amount', 0)):,}" if b.get('budget_amount') else 'N/A'
                    context += f"  - {b.get('project_name', 'N/A')}: {budget_amount}원\n"
            
            elif source["type"] == "contract_method_statistics":
                context += f"\n📋 계약 방식별 통계:\n"
                for c in source["data"]:
                    method = c.get('contract_method', 'N/A')
                    count = c.get('count', 0)
                    context += f"  - {method}: {count}건\n"
            
            elif source["type"] == "budget_execution":
                data = source["data"]
                context += f"\n💸 예산 집행 통계 (올해):\n"
                context += f"  - 총 예산: {int(data.get('total_budget', 0)):,}원\n"
                context += f"  - 집행 금액: {int(data.get('total_executed', 0)):,}원\n"
                context += f"  - 확정 집행 금액: {int(data.get('confirmed_executed', 0)):,}원\n"
                context += f"  - 미집행 금액: {int(data.get('unexecuted', 0)):,}원\n"
                context += f"  - 집행 건수: {data.get('executed_count', 0)}건 / {data.get('total_count', 0)}건\n"
            
            elif source["type"] == "amount_range_statistics":
                data = source["data"]
                threshold = source.get('threshold', 0)
                context += f"\n💰 {int(threshold):,}원 이상 예산 통계:\n"
                context += f"  - 해당 건수: {data.get('count', 0)}건\n"
                context += f"  - 총 금액: {int(data.get('total_amount', 0)):,}원\n"
                if data.get('min_amount'):
                    context += f"  - 최소 금액: {int(data['min_amount']):,}원\n"
                if data.get('max_amount'):
                    context += f"  - 최대 금액: {int(data['max_amount']):,}원\n"
            
            elif source["type"] == "purchase_items":
                context += f"\n🛒 구매 품목 정보:\n"
                for item in source["data"][:5]:
                    item_name = item.get('item_name', 'N/A')
                    quantity = item.get('quantity', 0)
                    unit_price = f"{int(item.get('unit_price', 0)):,}" if item.get('unit_price') else 'N/A'
                    total = f"{int(item.get('total_amount', 0)):,}" if item.get('total_amount') else 'N/A'
                    context += f"  - {item_name} ({quantity}개) - 단가: {unit_price}원, 총액: {total}원\n"
            
            elif source["type"] == "service_items":
                context += f"\n🔧 용역 항목 정보:\n"
                for item in source["data"][:5]:
                    name = item.get('name', 'N/A')
                    item_desc = item.get('item', 'N/A')
                    personnel = item.get('personnel', 0)
                    period = item.get('period', 0)
                    amount = f"{int(item.get('contract_amount', 0)):,}" if item.get('contract_amount') else 'N/A'
                    context += f"  - {name} ({item_desc}) - 인원: {personnel}명, 기간: {period}개월, 금액: {amount}원\n"
            
            elif source["type"] == "suppliers":
                context += f"\n🏭 공급업체 정보:\n"
                for s in source["data"][:5]:
                    company = s.get('name', 'N/A')
                    rep = s.get('representative', 'N/A')
                    phone = s.get('phone', 'N/A')
                    rating = s.get('credit_rating', 'N/A')
                    context += f"  - {company} (대표: {rep}, 연락처: {phone}, 신용등급: {rating})\n"
            
            elif source["type"] == "contract_method_details":
                context += f"\n📋 계약 방식 상세 정보:\n"
                for cm in source["data"][:5]:
                    name = cm.get('name', 'N/A')
                    regulation = cm.get('regulation', 'N/A')
                    min_amt = f"{int(cm.get('min_amount', 0)):,}" if cm.get('min_amount') else '제한없음'
                    max_amt = f"{int(cm.get('max_amount', 0)):,}" if cm.get('max_amount') else '제한없음'
                    context += f"  - {name}: {regulation} (금액 범위: {min_amt} ~ {max_amt}원)\n"
            
            elif source["type"] == "project_purposes":
                context += f"\n🎯 프로젝트 목적 종류:\n"
                for p in source["data"][:5]:
                    code = p.get('code', 'N/A')
                    desc = p.get('description', 'N/A')
                    year = p.get('year', 'N/A')
                    context += f"  - [{code}] {desc} (연도: {year})\n"
            
            elif source["type"] == "statistics":
                stats = source["data"]
                context += f"\n📊 시스템 통계:\n"
                context += f"  - 전체 품의서: {stats.get('total_proposals', 0)}건\n"
                context += f"  - 승인된 품의서: {stats.get('approved_proposals', 0)}건\n"
                context += f"  - 사업예산: {stats.get('total_budgets', 0)}건\n"
                context += f"  - 부서: {stats.get('total_departments', 0)}개\n"
                if stats.get('current_year_budget'):
                    context += f"  - 올해 총 예산: {int(stats['current_year_budget']):,}원\n"
        
        # 프롬프트 구성
        prompt = f"""당신은 계약 관리 시스템(CMS)의 AI 어시스턴트입니다.
사용자의 질문에 대해 제공된 데이터를 기반으로 정확하고 친절하게 답변해주세요.

{context}

사용자 질문: {question}

답변 작성 시 주의사항:
1. 위 데이터에 기반하여 답변하세요
2. 데이터가 없으면 "해당 정보가 없습니다"라고 명확히 말하세요
3. 한국어로 답변하세요
4. 가능한 구체적인 수치를 포함하세요
5. 간결하고 명확하게 답변하세요

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
            return "LLM 서버 오류가 발생했습니다."
            
    except requests.exceptions.ConnectionError:
        logger.error("Ollama 서버에 연결할 수 없습니다")
        return "⚠️ Ollama 서버가 실행되지 않았습니다. 'ollama serve' 명령어로 Ollama를 먼저 실행해주세요."
    except Exception as e:
        logger.error(f"LLM 쿼리 오류: {e}")
        return f"오류가 발생했습니다: {str(e)}"

# Ollama 상태 확인
def check_ollama():
    """Ollama 서버 상태 확인"""
    try:
        response = requests.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=5)
        return response.status_code == 200
    except:
        return False

# DB 상태 확인
def check_db():
    """DB 연결 상태 확인"""
    conn = get_db_connection()
    if conn:
        conn.close()
        return True
    return False

# 시작 이벤트
@app.on_event("startup")
async def startup_event():
    """서버 시작 시 초기화"""
    global db_conn
    
    logger.info("🚀 AI 어시스턴트 서버 시작 중...")
    
    # DB 연결 테스트
    if check_db():
        logger.info("✅ 데이터베이스 연결 확인")
    else:
        logger.warning("⚠️ 데이터베이스 연결 실패")
    
    # Ollama 상태 확인
    if check_ollama():
        logger.info("✅ Ollama 서버 연결 확인")
    else:
        logger.warning("⚠️ Ollama 서버 연결 실패 - Ollama를 설치하고 'ollama serve'를 실행해주세요")
    
    logger.info("🎉 AI 어시스턴트 서버 준비 완료!")

# 엔드포인트
@app.get("/", response_model=dict)
async def root():
    """루트 엔드포인트"""
    return {
        "message": "CMS AI Assistant API (간소화 버전)",
        "version": "1.0.0",
        "status": "running",
        "description": "PostgreSQL + Ollama 기반 AI 어시스턴트"
    }

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """헬스 체크"""
    try:
        ollama_status = "healthy" if check_ollama() else "unhealthy"
        db_status = "healthy" if check_db() else "unhealthy"
        
        overall_status = "healthy" if (ollama_status == "healthy" and db_status == "healthy") else "degraded"
        
        return HealthResponse(
            status=overall_status,
            ollama_status=ollama_status,
            db_status=db_status
        )
    except Exception as e:
        logger.error(f"헬스 체크 오류: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    AI 어시스턴트와 대화
    
    - question: 사용자 질문
    """
    try:
        logger.info(f"💬 질문 수신: {request.question}")
        
        # 1. DB에서 관련 데이터 검색
        context_data = search_database(request.question)
        logger.info(f"📊 검색된 데이터 소스: {len(context_data)}개")
        
        # 2. LLM에 질문
        answer = query_ollama(request.question, context_data)
        logger.info(f"✅ 답변 생성 완료")
        
        return ChatResponse(
            answer=answer,
            sources=context_data,
            conversation_id=""
        )
        
    except Exception as e:
        logger.error(f"❌ 채팅 오류: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/reindex")
async def reindex_database():
    """
    데이터베이스 재인덱싱
    (간소화 버전에서는 필요 없음)
    """
    return {
        "status": "success",
        "message": "간소화 버전에서는 재인덱싱이 필요하지 않습니다. 실시간으로 DB를 조회합니다."
    }

@app.get("/stats")
async def get_stats():
    """시스템 통계"""
    try:
        conn = get_db_connection()
        if not conn:
            raise HTTPException(status_code=503, detail="데이터베이스에 연결할 수 없습니다")
        
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        cursor.execute("""
            SELECT 
                (SELECT COUNT(*) FROM proposals) as total_proposals,
                (SELECT COUNT(*) FROM proposals WHERE status = 'approved') as approved_proposals,
                (SELECT COUNT(*) FROM proposals WHERE status = 'draft') as draft_proposals,
                (SELECT COUNT(*) FROM business_budgets) as total_budgets,
                (SELECT COUNT(*) FROM departments WHERE is_active = true) as total_departments
        """)
        
        stats = dict(cursor.fetchone())
        
        cursor.close()
        conn.close()
        
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
