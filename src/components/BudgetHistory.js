import React, { useState, useEffect } from 'react';
import { getApiUrl } from '../config/api';
import './BudgetHistory.css';

const API_BASE_URL = getApiUrl();

const BudgetHistory = () => {
  const [histories, setHistories] = useState([]);
  const [filteredHistories, setFilteredHistories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 필터 상태
  const [filters, setFilters] = useState({
    budgetYear: new Date().getFullYear(),
    projectName: '',
    changeType: '',
    changedBy: '',
    startDate: '',
    endDate: ''
  });

  // 변경 유형 옵션
  const changeTypes = [
    { value: 'CREATE', label: '신규 등록' },
    { value: 'UPDATE', label: '수정' },
    { value: 'DELETE', label: '삭제' }
  ];

  // 필드명 한글 매핑
  const fieldNameMap = {
    projectName: '사업명',
    budgetYear: '사업연도',
    initiatorDepartment: '발의부서',
    executorDepartment: '추진부서',
    budgetCategory: '예산 구분',
    budgetAmount: '예산',
    startDate: '사업 시작월',
    endDate: '사업 종료월',
    isEssential: '필수사업여부',
    projectPurpose: '사업목적',
    status: '상태',
    executedAmount: '기 집행',
    pendingAmount: '집행대기',
    confirmedExecutionAmount: '확정집행액',
    unexecutedAmount: '미집행액',
    additionalBudget: '추가예산',
    holdCancelReason: '사업 보류/취소 사유',
    notes: '비고',
    itPlanReported: 'IT계획서 보고여부'
  };

  // 데이터 로드
  useEffect(() => {
    fetchHistories();
  }, []);

  // 필터 적용
  useEffect(() => {
    applyFilters();
  }, [histories, filters]);

  const fetchHistories = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/budget-history`);
      if (response.ok) {
        const data = await response.json();
        setHistories(data);
      } else {
        setError('변경이력 데이터 로드 실패');
      }
    } catch (error) {
      setError('API 호출 오류: ' + error.message);
      console.error('API 호출 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = histories.filter(history => {
      // 사업연도 필터
      if (filters.budgetYear && history.budgetYear !== filters.budgetYear) {
        return false;
      }

      // 사업명 필터
      if (filters.projectName && !history.projectName?.toLowerCase().includes(filters.projectName.toLowerCase())) {
        return false;
      }

      // 변경 유형 필터
      if (filters.changeType && history.changeType !== filters.changeType) {
        return false;
      }

      // 변경자 필터
      if (filters.changedBy && !history.changedBy?.toLowerCase().includes(filters.changedBy.toLowerCase())) {
        return false;
      }

      // 시작 날짜 필터
      if (filters.startDate && new Date(history.changedAt) < new Date(filters.startDate)) {
        return false;
      }

      // 종료 날짜 필터
      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999);
        if (new Date(history.changedAt) > endDate) {
          return false;
        }
      }

      return true;
    });

    setFilteredHistories(filtered);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      budgetYear: new Date().getFullYear(),
      projectName: '',
      changeType: '',
      changedBy: '',
      startDate: '',
      endDate: ''
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFieldName = (field) => {
    return fieldNameMap[field] || field;
  };

  const getChangeTypeLabel = (type) => {
    const found = changeTypes.find(t => t.value === type);
    return found ? found.label : type;
  };

  const formatValue = (value) => {
    if (value === null || value === undefined || value === '') return '-';
    
    // Boolean 값 처리
    if (value === true || value === 'true') return '필수';
    if (value === false || value === 'false') return '선택';
    
    // 숫자 값 (금액) 처리 - 소숫점 제거
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      // 소숫점 제거하고 정수로 변환
      const intValue = Math.floor(numValue);
      // 0 이상의 숫자인 경우 금액으로 포맷
      if (intValue >= 0 && value.toString().match(/^\d+(\.\d+)?$/)) {
        return intValue.toLocaleString() + '원';
      }
    }
    
    return value;
  };

  if (loading) {
    return <div className="loading">변경이력을 불러오는 중...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="budget-history-container">
      <h1 className="page-title">사업예산관리 변경이력</h1>

      {/* 필터 영역 */}
      <div className="filter-section">
        <h2 className="section-title">🔍 조회 조건</h2>
        <div className="filter-grid">
          <div className="filter-item">
            <label>사업연도</label>
            <select name="budgetYear" value={filters.budgetYear} onChange={handleFilterChange}>
              <option value="">전체</option>
              {(() => {
                const currentYear = new Date().getFullYear();
                const startYear = currentYear - 5;
                const endYear = currentYear + 5;
                const years = [];
                for (let year = startYear; year <= endYear; year++) {
                  years.push(year);
                }
                return years.map(year => (
                  <option key={year} value={year}>{year}년</option>
                ));
              })()}
            </select>
          </div>

          <div className="filter-item">
            <label>사업명</label>
            <input
              type="text"
              name="projectName"
              value={filters.projectName}
              onChange={handleFilterChange}
              placeholder="사업명 검색"
            />
          </div>

          <div className="filter-item">
            <label>변경 유형</label>
            <select name="changeType" value={filters.changeType} onChange={handleFilterChange}>
              <option value="">전체</option>
              {changeTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          <div className="filter-item">
            <label>변경자</label>
            <input
              type="text"
              name="changedBy"
              value={filters.changedBy}
              onChange={handleFilterChange}
              placeholder="변경자 검색"
            />
          </div>

          <div className="filter-item">
            <label>시작 날짜</label>
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
            />
          </div>

          <div className="filter-item">
            <label>종료 날짜</label>
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
            />
          </div>
        </div>

        <div className="filter-actions">
          <button onClick={handleResetFilters} className="btn-reset">
            🔄 필터 초기화
          </button>
        </div>
      </div>

      {/* 결과 카운트 */}
      <div className="result-count">
        검색 결과: <strong>{filteredHistories.length}</strong>건
      </div>

      {/* 변경이력 테이블 */}
      <div className="history-table-container">
        <table className="history-table">
          <thead>
            <tr>
              <th>번호</th>
              <th>사업연도</th>
              <th>사업명</th>
              <th>변경 유형</th>
              <th>변경 항목</th>
              <th>변경 전</th>
              <th>변경 후</th>
              <th>변경일시</th>
              <th>변경자</th>
            </tr>
          </thead>
          <tbody>
            {filteredHistories.length === 0 ? (
              <tr>
                <td colSpan="9" className="no-data">
                  변경이력이 없습니다.
                </td>
              </tr>
            ) : (
              filteredHistories.map((history, index) => (
                <tr key={history.id}>
                  <td>{filteredHistories.length - index}</td>
                  <td>{history.budgetYear || '-'}</td>
                  <td>{history.projectName || '-'}</td>
                  <td>
                    <span className={`change-type-badge ${history.changeType?.toLowerCase()}`}>
                      {getChangeTypeLabel(history.changeType)}
                    </span>
                  </td>
                  <td>{getFieldName(history.changedField)}</td>
                  <td className="value-cell">{formatValue(history.oldValue)}</td>
                  <td className="value-cell">{formatValue(history.newValue)}</td>
                  <td>{formatDate(history.changedAt)}</td>
                  <td>{history.changedBy || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BudgetHistory;

