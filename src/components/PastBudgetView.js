import React, { useState, useEffect } from 'react';
import { getApiUrl } from '../config/api';

// API 베이스 URL 설정
const API_BASE_URL = getApiUrl();

const PastBudgetView = () => {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);
  const [availableYears, setAvailableYears] = useState([]);

  // 다중 정렬 상태 관리
  const [sortConfigs, setSortConfigs] = useState([]);

  // API에서 사업예산 데이터 로드
  useEffect(() => {
    const fetchBudgets = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/api/budget-statistics`);
        if (response.ok) {
          const data = await response.json();
          const budgets = data.budgetData || [];
          
          // 사용 가능한 연도 추출 (모든 연도)
          const years = [...new Set(budgets.map(budget => budget.budgetYear))]
            .sort((a, b) => b - a); // 최신 연도부터 정렬
          
          setAvailableYears(years);
          
          // 첫 로드 시 최신 연도를 기본으로 설정
          if (selectedYear === null && years.length > 0) {
            setSelectedYear(years[0]);
          }
          
          // 선택된 연도의 데이터 필터링
          if (selectedYear !== null) {
            const filteredData = budgets.filter(budget => budget.budgetYear === parseInt(selectedYear));
            setBudgets(filteredData);
          }
        } else {
          setError('사업예산 데이터 로드 실패: ' + response.statusText);
        }
      } catch (error) {
        setError('API 호출 오류: ' + error.message);
        console.error('API 호출 오류:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBudgets();
  }, [selectedYear]);

  // 정렬 처리
  const handleSort = (key) => {
    setSortConfigs(prev => {
      const existing = prev.find(config => config.key === key);
      if (existing) {
        return prev.map(config => 
          config.key === key 
            ? { ...config, direction: config.direction === 'asc' ? 'desc' : 'asc' }
            : config
        );
      } else {
        return [...prev, { key, direction: 'asc' }];
      }
    });
  };

  // 정렬된 데이터 반환
  const getSortedData = () => {
    let sortedData = [...budgets];
    
    sortConfigs.forEach(config => {
      sortedData.sort((a, b) => {
        let aVal = a[config.key];
        let bVal = b[config.key];
        
        if (typeof aVal === 'string') {
          aVal = aVal.toLowerCase();
          bVal = bVal.toLowerCase();
        }
        
        if (aVal < bVal) return config.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return config.direction === 'asc' ? 1 : -1;
        return 0;
      });
    });
    
    return sortedData;
  };

  // 예산 합계 계산
  const calculateBudgetSummary = () => {
    const summary = {
      capitalBudget: {
        total: 0,
        categories: {
          '일반사업': 0,
          '보안사업': 0,
          '정기성사업': 0
        }
      },
      operationBudget: {
        total: 0,
        categories: {
          '증권전산운용비': 0,
          '전산수선비': 0,
          '전산임차료': 0,
          '전산용역비': 0,
          '전산회선료': 0,
          '기타': 0
        }
      },
      total: 0
    };

    budgets.forEach(budget => {
      const amount = parseInt(budget.budgetAmount) || 0;
      summary.total += amount;

      if (budget.budgetType === '자본예산') {
        summary.capitalBudget.total += amount;
        if (summary.capitalBudget.categories[budget.budgetCategory] !== undefined) {
          summary.capitalBudget.categories[budget.budgetCategory] += amount;
        }
      } else if (budget.budgetType === '전산운용비') {
        summary.operationBudget.total += amount;
        if (summary.operationBudget.categories[budget.budgetCategory] !== undefined) {
          summary.operationBudget.categories[budget.budgetCategory] += amount;
        }
      }
    });

    return summary;
  };

  // 상태별 색상 반환
  const getStatusColor = (status) => {
    switch (status) {
      case '승인대기': return '#ffc107';
      case '진행중': return '#007bff';
      case '완료': return '#28a745';
      case '반려': return '#dc3545';
      default: return '#6c757d';
    }
  };

  // 예산 유형별 색상 반환
  const getBudgetTypeColor = (type) => {
    switch (type) {
      case '자본예산': return '#6f42c1';
      case '전산운용비': return '#fd7e14';
      default: return '#6c757d';
    }
  };

  // 금액 포맷팅
  const formatCurrency = (amount) => {
    // 소수점 제거하고 정수로 변환
    const integerAmount = Math.round(amount);
    return new Intl.NumberFormat('ko-KR').format(integerAmount) + '원';
  };

  // 정렬 아이콘 반환
  const getSortIcon = (key) => {
    const config = sortConfigs.find(c => c.key === key);
    if (!config) return '↕️';
    return config.direction === 'asc' ? '↑' : '↓';
  };

  if (loading) {
    return (
      <div className="past-budget-view">
        <h1>사업예산 조회</h1>
        <div className="loading">데이터를 불러오는 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="past-budget-view">
        <h1>사업예산 조회</h1>
        <div className="error">오류: {error}</div>
      </div>
    );
  }

  const budgetSummary = calculateBudgetSummary();
  const sortedBudgets = getSortedData();

  return (
    <div className="past-budget-view">
      <h1>사업예산 조회</h1>
      
      {/* 연도 선택 */}
      <div className="year-selector">
        <h2>조회 연도 선택</h2>
        <div className="year-buttons">
          {availableYears.map(year => (
            <button
              key={year}
              className={`year-button ${selectedYear === year ? 'active' : ''}`}
              onClick={() => setSelectedYear(year)}
            >
              {year}년
            </button>
          ))}
        </div>
        {availableYears.length === 0 && (
          <div className="no-data">조회 가능한 데이터가 없습니다.</div>
        )}
      </div>

      {availableYears.length > 0 && selectedYear !== null && (
        <>
          {/* 예산 현황 요약 */}
          <div className="summary-section">
            <h2>{selectedYear}년 예산 현황 요약</h2>
            <div className="summary-cards">
              <div className="summary-card">
                <h3>총 예산</h3>
                <div className="amount">{formatCurrency(budgetSummary.total)}</div>
                <div className="count">총 {budgets.length}개 사업</div>
              </div>
              <div className="summary-card">
                <h3>자본예산</h3>
                <div className="amount">{formatCurrency(budgetSummary.capitalBudget.total)}</div>
                <div className="breakdown">
                  {Object.entries(budgetSummary.capitalBudget.categories).map(([category, amount]) => (
                    <div key={category} className="category">
                      <span>{category}:</span>
                      <span>{formatCurrency(amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="summary-card">
                <h3>전산운용비</h3>
                <div className="amount">{formatCurrency(budgetSummary.operationBudget.total)}</div>
                <div className="breakdown">
                  {Object.entries(budgetSummary.operationBudget.categories).map(([category, amount]) => (
                    <div key={category} className="category">
                      <span>{category}:</span>
                      <span>{formatCurrency(amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 예산 목록 */}
          <div className="budget-list-section">
            <h2>{selectedYear}년 등록된 예산 목록</h2>
            
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th className="sortable" onClick={() => handleSort('projectName')}>
                      사업명 {getSortIcon('projectName')}
                    </th>
                    <th className="sortable" onClick={() => handleSort('initiatorDepartment')}>
                      발의부서 {getSortIcon('initiatorDepartment')}
                    </th>
                    <th className="sortable" onClick={() => handleSort('executorDepartment')}>
                      추진부서 {getSortIcon('executorDepartment')}
                    </th>
                    <th className="sortable" onClick={() => handleSort('budgetType')}>
                      예산유형 {getSortIcon('budgetType')}
                    </th>
                    <th className="sortable" onClick={() => handleSort('budgetCategory')}>
                      세부분류 {getSortIcon('budgetCategory')}
                    </th>
                    <th className="sortable" onClick={() => handleSort('budgetAmount')}>
                      예산금액 {getSortIcon('budgetAmount')}
                    </th>
                    <th className="sortable" onClick={() => handleSort('isEssential')}>
                      필수사업 {getSortIcon('isEssential')}
                    </th>
                    <th className="sortable" onClick={() => handleSort('projectPurpose')}>
                      사업목적 {getSortIcon('projectPurpose')}
                    </th>
                    <th className="sortable" onClick={() => handleSort('startDate')}>
                      사업기간 {getSortIcon('startDate')}
                    </th>
                    <th className="sortable" onClick={() => handleSort('status')}>
                      상태 {getSortIcon('status')}
                    </th>
                    <th className="sortable" onClick={() => handleSort('createdAt')}>
                      등록일 {getSortIcon('createdAt')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedBudgets.map(budget => (
                    <tr key={budget.id}>
                      <td>{budget.projectName}</td>
                      <td>{budget.initiatorDepartment}</td>
                      <td>{budget.executorDepartment}</td>
                      <td>
                        <span style={{color: getBudgetTypeColor(budget.budgetType)}}>
                          {budget.budgetType}
                        </span>
                      </td>
                      <td>{budget.budgetCategory}</td>
                      <td>{formatCurrency(budget.budgetAmount)}</td>
                      <td>{budget.isEssential ? '예' : '아니오'}</td>
                      <td>{budget.projectPurpose}</td>
                      <td>{`${budget.startDate} ~ ${budget.endDate}`}</td>
                      <td>
                        <span style={{color: getStatusColor(budget.status)}}>
                          {budget.status}
                        </span>
                      </td>
                      <td>{budget.createdAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {sortedBudgets.length === 0 && (
              <div className="no-data">
                {selectedYear}년도에 등록된 예산이 없습니다.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default PastBudgetView; 