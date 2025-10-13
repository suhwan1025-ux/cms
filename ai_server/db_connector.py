"""
데이터베이스 커넥터
PostgreSQL 데이터베이스와 연동하여 계약 관리 시스템 데이터 조회
"""

import psycopg2
from psycopg2.extras import RealDictCursor
from typing import List, Dict, Optional
import logging

logger = logging.getLogger(__name__)

class DatabaseConnector:
    """PostgreSQL 데이터베이스 연결 및 쿼리 관리"""
    
    def __init__(self, host: str, port: int, database: str, user: str, password: str):
        """
        데이터베이스 연결 초기화
        
        Args:
            host: DB 호스트
            port: DB 포트
            database: 데이터베이스 이름
            user: 사용자명
            password: 비밀번호
        """
        self.connection_params = {
            "host": host,
            "port": port,
            "database": database,
            "user": user,
            "password": password
        }
        self.conn = None
        self.connect()
    
    def connect(self):
        """데이터베이스 연결"""
        try:
            self.conn = psycopg2.connect(**self.connection_params)
            logger.info("✅ PostgreSQL 연결 성공")
        except Exception as e:
            logger.error(f"❌ PostgreSQL 연결 실패: {e}")
            raise
    
    def check_connection(self) -> bool:
        """연결 상태 확인"""
        try:
            if not self.conn or self.conn.closed:
                self.connect()
            
            cursor = self.conn.cursor()
            cursor.execute("SELECT 1")
            cursor.close()
            return True
        except:
            return False
    
    def close(self):
        """연결 종료"""
        if self.conn:
            self.conn.close()
            logger.info("PostgreSQL 연결 종료")
    
    def execute_query(self, query: str, params: Optional[tuple] = None) -> List[Dict]:
        """
        쿼리 실행 및 결과 반환
        
        Args:
            query: SQL 쿼리
            params: 쿼리 파라미터
            
        Returns:
            쿼리 결과 (dict 리스트)
        """
        try:
            if not self.check_connection():
                self.connect()
            
            cursor = self.conn.cursor(cursor_factory=RealDictCursor)
            cursor.execute(query, params)
            results = cursor.fetchall()
            cursor.close()
            
            # RealDictRow를 일반 dict로 변환
            return [dict(row) for row in results]
            
        except Exception as e:
            logger.error(f"쿼리 실행 오류: {e}")
            logger.error(f"쿼리: {query}")
            raise
    
    # === 품의서 관련 쿼리 ===
    
    def get_all_proposals(self, limit: Optional[int] = None) -> List[Dict]:
        """모든 품의서 조회"""
        query = """
            SELECT 
                id, title, purpose, "contractType", "totalAmount",
                status, "approvalDate", "createdAt", "createdBy",
                "contractMethod", basis, budget
            FROM proposals
            WHERE "isDraft" = false
            ORDER BY "createdAt" DESC
        """
        if limit:
            query += f" LIMIT {limit}"
        
        return self.execute_query(query)
    
    def get_approved_proposals(self, year: Optional[int] = None) -> List[Dict]:
        """결재완료 품의서 조회"""
        query = """
            SELECT 
                id, title, purpose, "contractType", "totalAmount",
                "approvalDate", "createdAt", "createdBy", "contractMethod"
            FROM proposals
            WHERE status = 'approved'
        """
        if year:
            query += f" AND EXTRACT(YEAR FROM \"approvalDate\") = {year}"
        
        query += " ORDER BY \"approvalDate\" DESC"
        
        return self.execute_query(query)
    
    def get_proposals_by_type(self, contract_type: str) -> List[Dict]:
        """계약 유형별 품의서 조회"""
        query = """
            SELECT 
                id, title, purpose, "totalAmount", status,
                "approvalDate", "createdAt"
            FROM proposals
            WHERE "contractType" = %s AND "isDraft" = false
            ORDER BY "createdAt" DESC
        """
        return self.execute_query(query, (contract_type,))
    
    def get_proposal_by_id(self, proposal_id: int) -> Optional[Dict]:
        """특정 품의서 상세 조회"""
        query = """
            SELECT *
            FROM proposals
            WHERE id = %s
        """
        results = self.execute_query(query, (proposal_id,))
        return results[0] if results else None
    
    def get_proposals_count(self) -> int:
        """품의서 총 개수"""
        query = 'SELECT COUNT(*) as count FROM proposals WHERE "isDraft" = false'
        result = self.execute_query(query)
        return result[0]['count'] if result else 0
    
    # === 사업예산 관련 쿼리 ===
    
    def get_all_budgets(self, year: Optional[int] = None) -> List[Dict]:
        """모든 사업예산 조회"""
        query = """
            SELECT 
                id, year, "projectName", "budgetAmount",
                "executedAmount", "remainingAmount", status,
                department, "createdAt"
            FROM business_budgets
        """
        if year:
            query += f" WHERE year = {year}"
        
        query += " ORDER BY year DESC, \"createdAt\" DESC"
        
        return self.execute_query(query)
    
    def get_budget_by_project(self, project_name: str, year: Optional[int] = None) -> List[Dict]:
        """사업명으로 예산 조회"""
        query = """
            SELECT *
            FROM business_budgets
            WHERE "projectName" LIKE %s
        """
        params = [f"%{project_name}%"]
        
        if year:
            query += " AND year = %s"
            params.append(year)
        
        return self.execute_query(query, tuple(params))
    
    def get_budgets_count(self) -> int:
        """사업예산 총 개수"""
        query = "SELECT COUNT(*) as count FROM business_budgets"
        result = self.execute_query(query)
        return result[0]['count'] if result else 0
    
    # === 외주인력 관련 쿼리 ===
    
    def get_service_contracts(self) -> List[Dict]:
        """용역계약 조회 (외주인력 포함)"""
        query = """
            SELECT 
                p.id, p.title, p.purpose, p."totalAmount",
                p."approvalDate", p.status
            FROM proposals p
            WHERE p."contractType" = 'service'
                AND p.status = 'approved'
            ORDER BY p."approvalDate" DESC
        """
        return self.execute_query(query)
    
    # === 통계 쿼리 ===
    
    def get_monthly_stats(self, year: int) -> List[Dict]:
        """월별 통계"""
        query = """
            SELECT 
                EXTRACT(MONTH FROM "approvalDate") as month,
                COUNT(*) as count,
                SUM("totalAmount") as total_amount
            FROM proposals
            WHERE EXTRACT(YEAR FROM "approvalDate") = %s
                AND status = 'approved'
            GROUP BY EXTRACT(MONTH FROM "approvalDate")
            ORDER BY month
        """
        return self.execute_query(query, (year,))
    
    def get_contract_type_stats(self) -> List[Dict]:
        """계약 유형별 통계"""
        query = """
            SELECT 
                "contractType",
                COUNT(*) as count,
                SUM("totalAmount") as total_amount
            FROM proposals
            WHERE status = 'approved'
            GROUP BY "contractType"
            ORDER BY count DESC
        """
        return self.execute_query(query)
    
    def search_proposals(self, keyword: str) -> List[Dict]:
        """키워드로 품의서 검색"""
        query = """
            SELECT 
                id, title, purpose, "contractType", "totalAmount",
                status, "approvalDate", "createdAt"
            FROM proposals
            WHERE (
                title ILIKE %s 
                OR purpose ILIKE %s
            ) AND "isDraft" = false
            ORDER BY "createdAt" DESC
            LIMIT 20
        """
        search_term = f"%{keyword}%"
        return self.execute_query(query, (search_term, search_term))

