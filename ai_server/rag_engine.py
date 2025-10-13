"""
RAG (Retrieval-Augmented Generation) 엔진
벡터 검색과 LLM을 결합하여 자연어 질의응답 제공
"""

import requests
import json
import chromadb
from chromadb.config import Settings
from typing import List, Dict, Optional
import logging
import hashlib
from datetime import datetime
import os

logger = logging.getLogger(__name__)

class RAGEngine:
    """RAG 시스템 엔진"""
    
    def __init__(
        self,
        ollama_base_url: str,
        model_name: str,
        embedding_model: str,
        db_connector
    ):
        """
        RAG 엔진 초기화
        
        Args:
            ollama_base_url: Ollama API URL
            model_name: 사용할 LLM 모델명
            embedding_model: 임베딩 모델명
            db_connector: 데이터베이스 커넥터
        """
        self.ollama_base_url = ollama_base_url
        self.model_name = model_name
        self.embedding_model = embedding_model
        self.db_connector = db_connector
        
        # ChromaDB 클라이언트 초기화
        self.chroma_client = chromadb.Client(Settings(
            chroma_db_impl="duckdb+parquet",
            persist_directory="./chroma_db"
        ))
        
        # 컬렉션 생성 또는 가져오기
        self.collection = None
        
        # 대화 이력 저장
        self.conversation_history = {}
    
    def check_ollama(self) -> bool:
        """Ollama 서버 연결 확인"""
        try:
            response = requests.get(f"{self.ollama_base_url}/api/tags", timeout=5)
            return response.status_code == 200
        except:
            return False
    
    async def initialize_vector_db(self):
        """벡터 데이터베이스 초기화"""
        try:
            # 컬렉션 생성 또는 가져오기
            self.collection = self.chroma_client.get_or_create_collection(
                name="cms_contracts",
                metadata={"description": "계약 관리 시스템 데이터"}
            )
            
            # 컬렉션이 비어있으면 데이터 인덱싱
            if self.collection.count() == 0:
                logger.info("벡터 DB가 비어있습니다. 데이터 인덱싱을 시작합니다...")
                await self.reindex_database()
            else:
                logger.info(f"✅ 벡터 DB 로드 완료 ({self.collection.count()}개 문서)")
                
        except Exception as e:
            logger.error(f"벡터 DB 초기화 오류: {e}")
            raise
    
    async def reindex_database(self):
        """데이터베이스 전체 재인덱싱"""
        try:
            logger.info("🔄 데이터 인덱싱 시작...")
            
            # 기존 컬렉션 삭제 및 재생성
            try:
                self.chroma_client.delete_collection("cms_contracts")
            except:
                pass
            
            self.collection = self.chroma_client.create_collection(
                name="cms_contracts",
                metadata={"description": "계약 관리 시스템 데이터"}
            )
            
            # 품의서 데이터 인덱싱
            proposals = self.db_connector.get_all_proposals()
            logger.info(f"품의서 {len(proposals)}개 인덱싱 중...")
            
            documents = []
            metadatas = []
            ids = []
            
            for proposal in proposals:
                # 문서 텍스트 생성
                doc_text = self._create_proposal_document(proposal)
                
                # 메타데이터 생성
                metadata = {
                    "type": "proposal",
                    "id": str(proposal.get("id")),
                    "title": proposal.get("title", ""),
                    "contractType": proposal.get("contractType", ""),
                    "status": proposal.get("status", ""),
                    "totalAmount": float(proposal.get("totalAmount", 0)),
                    "approvalDate": str(proposal.get("approvalDate", "")),
                }
                
                documents.append(doc_text)
                metadatas.append(metadata)
                ids.append(f"proposal_{proposal['id']}")
            
            # 사업예산 데이터 인덱싱
            budgets = self.db_connector.get_all_budgets()
            logger.info(f"사업예산 {len(budgets)}개 인덱싱 중...")
            
            for budget in budgets:
                doc_text = self._create_budget_document(budget)
                
                metadata = {
                    "type": "budget",
                    "id": str(budget.get("id")),
                    "year": int(budget.get("year", 0)),
                    "projectName": budget.get("projectName", ""),
                    "budgetAmount": float(budget.get("budgetAmount", 0)),
                    "status": budget.get("status", ""),
                }
                
                documents.append(doc_text)
                metadatas.append(metadata)
                ids.append(f"budget_{budget['id']}")
            
            # 벡터 DB에 추가 (배치 처리)
            batch_size = 50
            for i in range(0, len(documents), batch_size):
                batch_docs = documents[i:i+batch_size]
                batch_metas = metadatas[i:i+batch_size]
                batch_ids = ids[i:i+batch_size]
                
                # Ollama를 통해 임베딩 생성
                embeddings = self._get_embeddings(batch_docs)
                
                self.collection.add(
                    documents=batch_docs,
                    metadatas=batch_metas,
                    ids=batch_ids,
                    embeddings=embeddings
                )
                
                logger.info(f"  진행률: {min(i+batch_size, len(documents))}/{len(documents)}")
            
            logger.info(f"✅ 인덱싱 완료! 총 {len(documents)}개 문서")
            
        except Exception as e:
            logger.error(f"재인덱싱 오류: {e}")
            raise
    
    def _create_proposal_document(self, proposal: Dict) -> str:
        """품의서 데이터를 텍스트 문서로 변환"""
        parts = []
        
        parts.append(f"[품의서 ID: {proposal.get('id')}]")
        parts.append(f"제목: {proposal.get('title', 'N/A')}")
        parts.append(f"목적: {proposal.get('purpose', 'N/A')}")
        parts.append(f"계약유형: {self._translate_contract_type(proposal.get('contractType', ''))}")
        parts.append(f"계약금액: {proposal.get('totalAmount', 0):,}원")
        parts.append(f"상태: {self._translate_status(proposal.get('status', ''))}")
        
        if proposal.get('approvalDate'):
            parts.append(f"결재일: {proposal.get('approvalDate')}")
        
        if proposal.get('contractMethod'):
            parts.append(f"계약방법: {proposal.get('contractMethod')}")
        
        if proposal.get('createdBy'):
            parts.append(f"작성자: {proposal.get('createdBy')}")
        
        return "\n".join(parts)
    
    def _create_budget_document(self, budget: Dict) -> str:
        """사업예산 데이터를 텍스트 문서로 변환"""
        parts = []
        
        parts.append(f"[사업예산 ID: {budget.get('id')}]")
        parts.append(f"연도: {budget.get('year')}년")
        parts.append(f"사업명: {budget.get('projectName', 'N/A')}")
        parts.append(f"예산금액: {budget.get('budgetAmount', 0):,}원")
        parts.append(f"집행금액: {budget.get('executedAmount', 0):,}원")
        parts.append(f"잔액: {budget.get('remainingAmount', 0):,}원")
        parts.append(f"상태: {budget.get('status', 'N/A')}")
        
        if budget.get('department'):
            parts.append(f"담당부서: {budget.get('department')}")
        
        return "\n".join(parts)
    
    def _translate_contract_type(self, contract_type: str) -> str:
        """계약 유형 한글 변환"""
        mapping = {
            "purchase": "구매계약",
            "service": "용역계약",
            "change": "변경계약",
            "extension": "연장계약",
            "bid": "입찰계약"
        }
        return mapping.get(contract_type, contract_type)
    
    def _translate_status(self, status: str) -> str:
        """상태 한글 변환"""
        mapping = {
            "draft": "작성중",
            "submitted": "제출됨",
            "approved": "결재완료",
            "rejected": "반려됨"
        }
        return mapping.get(status, status)
    
    def _get_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Ollama를 통해 텍스트 임베딩 생성"""
        try:
            embeddings = []
            
            for text in texts:
                response = requests.post(
                    f"{self.ollama_base_url}/api/embeddings",
                    json={
                        "model": self.embedding_model,
                        "prompt": text
                    },
                    timeout=30
                )
                
                if response.status_code == 200:
                    embedding = response.json()["embedding"]
                    embeddings.append(embedding)
                else:
                    logger.error(f"임베딩 생성 실패: {response.status_code}")
                    # 실패 시 제로 벡터 사용
                    embeddings.append([0.0] * 768)  # 기본 차원
            
            return embeddings
            
        except Exception as e:
            logger.error(f"임베딩 생성 오류: {e}")
            raise
    
    async def query(
        self,
        question: str,
        conversation_id: Optional[str] = None,
        use_history: bool = True
    ) -> Dict:
        """
        사용자 질문에 대한 답변 생성
        
        Args:
            question: 사용자 질문
            conversation_id: 대화 ID
            use_history: 대화 이력 사용 여부
            
        Returns:
            답변 딕셔너리
        """
        try:
            # 대화 ID 생성
            if not conversation_id:
                conversation_id = self._generate_conversation_id()
            
            # 1. 벡터 검색으로 관련 문서 찾기
            logger.info(f"🔍 벡터 검색 시작: {question}")
            relevant_docs = self._search_similar_documents(question, top_k=5)
            
            # 2. 컨텍스트 생성
            context = self._create_context(relevant_docs)
            
            # 3. 프롬프트 생성
            prompt = self._create_prompt(question, context, conversation_id, use_history)
            
            # 4. LLM에 질문
            logger.info("🤖 LLM 답변 생성 중...")
            answer = self._generate_answer(prompt)
            
            # 5. 대화 이력 저장
            if use_history:
                self._save_conversation(conversation_id, question, answer)
            
            return {
                "answer": answer,
                "sources": relevant_docs,
                "conversation_id": conversation_id
            }
            
        except Exception as e:
            logger.error(f"쿼리 처리 오류: {e}")
            return {
                "answer": f"죄송합니다. 질문을 처리하는 중 오류가 발생했습니다: {str(e)}",
                "sources": [],
                "conversation_id": conversation_id or ""
            }
    
    def _search_similar_documents(self, query: str, top_k: int = 5) -> List[Dict]:
        """벡터 검색으로 유사 문서 찾기"""
        try:
            # 쿼리 임베딩 생성
            query_embedding = self._get_embeddings([query])[0]
            
            # 벡터 검색
            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=top_k
            )
            
            documents = []
            if results and results['documents']:
                for i, doc in enumerate(results['documents'][0]):
                    metadata = results['metadatas'][0][i] if results['metadatas'] else {}
                    documents.append({
                        "content": doc,
                        "metadata": metadata,
                        "distance": results['distances'][0][i] if results['distances'] else 0
                    })
            
            logger.info(f"  검색 결과: {len(documents)}개 문서 발견")
            return documents
            
        except Exception as e:
            logger.error(f"벡터 검색 오류: {e}")
            return []
    
    def _create_context(self, documents: List[Dict]) -> str:
        """검색된 문서들로 컨텍스트 생성"""
        if not documents:
            return "관련 데이터를 찾을 수 없습니다."
        
        context_parts = ["다음은 관련된 계약 관리 시스템 데이터입니다:\n"]
        
        for i, doc in enumerate(documents, 1):
            context_parts.append(f"\n[문서 {i}]")
            context_parts.append(doc["content"])
            context_parts.append("")
        
        return "\n".join(context_parts)
    
    def _create_prompt(
        self,
        question: str,
        context: str,
        conversation_id: str,
        use_history: bool
    ) -> str:
        """LLM 프롬프트 생성"""
        system_prompt = """당신은 계약 관리 시스템(CMS)의 AI 어시스턴트입니다. 
사용자의 질문에 대해 제공된 데이터를 기반으로 정확하고 친절하게 답변해주세요.

답변 시 다음 사항을 지켜주세요:
1. 제공된 컨텍스트 데이터를 기반으로 답변하세요
2. 데이터에 없는 내용은 추측하지 말고 "해당 정보가 없습니다"라고 답하세요
3. 금액은 천 단위 구분 기호를 사용하여 가독성 있게 표시하세요
4. 구체적인 데이터(ID, 제목, 금액 등)를 포함하여 답변하세요
5. 한국어로 답변하세요
6. 가능한 한 간결하고 명확하게 답변하세요
"""
        
        # 대화 이력 추가
        history_text = ""
        if use_history and conversation_id in self.conversation_history:
            history = self.conversation_history[conversation_id][-3:]  # 최근 3개만
            if history:
                history_text = "\n\n이전 대화:\n"
                for h in history:
                    history_text += f"Q: {h['question']}\nA: {h['answer']}\n"
        
        prompt = f"""{system_prompt}

{context}
{history_text}

사용자 질문: {question}

답변:"""
        
        return prompt
    
    def _generate_answer(self, prompt: str) -> str:
        """Ollama LLM으로 답변 생성"""
        try:
            response = requests.post(
                f"{self.ollama_base_url}/api/generate",
                json={
                    "model": self.model_name,
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": 0.3,  # 낮은 온도로 일관성 있는 답변
                        "top_p": 0.9,
                        "top_k": 40
                    }
                },
                timeout=60
            )
            
            if response.status_code == 200:
                result = response.json()
                answer = result.get("response", "").strip()
                logger.info("✅ 답변 생성 완료")
                return answer
            else:
                logger.error(f"LLM 답변 생성 실패: {response.status_code}")
                return "죄송합니다. 답변을 생성할 수 없습니다."
                
        except Exception as e:
            logger.error(f"LLM 호출 오류: {e}")
            return f"답변 생성 중 오류가 발생했습니다: {str(e)}"
    
    def _generate_conversation_id(self) -> str:
        """대화 ID 생성"""
        timestamp = datetime.now().isoformat()
        return hashlib.md5(timestamp.encode()).hexdigest()[:16]
    
    def _save_conversation(self, conversation_id: str, question: str, answer: str):
        """대화 이력 저장"""
        if conversation_id not in self.conversation_history:
            self.conversation_history[conversation_id] = []
        
        self.conversation_history[conversation_id].append({
            "question": question,
            "answer": answer,
            "timestamp": datetime.now().isoformat()
        })
        
        # 메모리 관리: 최대 10개 대화만 유지
        if len(self.conversation_history[conversation_id]) > 10:
            self.conversation_history[conversation_id] = self.conversation_history[conversation_id][-10:]
    
    def get_vector_count(self) -> int:
        """벡터 DB 문서 개수"""
        return self.collection.count() if self.collection else 0

