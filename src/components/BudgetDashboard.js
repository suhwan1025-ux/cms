import React, { useState, useEffect, useCallback } from 'react';
import { getApiUrl } from '../config/api';
import './BudgetDashboard.css';

const API_BASE_URL = getApiUrl();

const BudgetDashboard = () => {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // 컬럼 리사이징 관련 상태
  const [columnWidths, setColumnWidths] = useState(() => {
    const saved = localStorage.getItem('budgetTableColumnWidths');
    return saved ? JSON.parse(saved) : {
      번호: 60,
      사업명: 200,
      예산구분: 100,
      사업목적: 150,
      예산: 150,
      추가예산: 120,
      기집행액: 150,
      확정집행액: 150,
      집행률: 80,
      상태: 100,
      필수여부: 100,
      발의부서: 120,
      추진부서: 120
    };
  });
  const [resizingColumn, setResizingColumn] = useState(null);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);

  // 데이터 로드
  useEffect(() => {
    fetchBudgetData();
  }, [selectedYear]);

  const fetchBudgetData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/budget-statistics`);
      if (response.ok) {
        const data = await response.json();
        const budgets = data.budgetData || [];
        const filteredData = budgets.filter(budget => budget.budgetYear === selectedYear);
        setBudgets(filteredData);
      } else {
        setError('데이터 로드 실패');
      }
    } catch (error) {
      setError('API 호출 오류: ' + error.message);
      console.error('API 호출 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  // 통계 계산 (정확한 공식 적용)
  const calculateStatistics = () => {
    // 명시적으로 숫자로 변환
    const totalBudget = budgets.reduce((sum, b) => sum + (parseFloat(b.budgetAmount) || 0), 0);
    const totalExecuted = budgets.reduce((sum, b) => sum + (parseFloat(b.executedAmount) || 0), 0);
    const totalConfirmedExecution = budgets.reduce((sum, b) => sum + (parseFloat(b.confirmedExecutionAmount) || 0), 0);
    const totalAdditional = budgets.reduce((sum, b) => sum + (parseFloat(b.additionalBudget) || 0), 0);
    
    // 정확한 계산 공식 적용
    // 집행대기액 = 확정집행액 - 기집행액
    const totalPending = totalConfirmedExecution - totalExecuted;
    
    // 미집행액 = (예산 + 추가예산) - 기집행액
    const totalUnexecuted = (totalBudget + totalAdditional) - totalExecuted;
    
    // 확정집행액 기준 집행률 = (확정집행액 / 사업예산액) × 100
    const executionRate = totalBudget > 0 ? ((totalConfirmedExecution / totalBudget) * 100).toFixed(1) : 0;
    
    // 기집행 집행률 = (기집행 / (예산 + 추가예산)) × 100
    const totalBudgetWithAdditional = totalBudget + totalAdditional;
    const executedRate = totalBudgetWithAdditional > 0 ? ((totalExecuted / totalBudgetWithAdditional) * 100).toFixed(1) : 0;
    
    // 예산초과액 = 각 사업별 예산초과액의 합계
    // 각 사업마다: 기집행액 > (예산 + 추가예산) 일 경우 초과분 계산 후 합산
    const totalBudgetExcess = budgets.reduce((sum, b) => {
      const budgetAmt = parseFloat(b.budgetAmount) || 0;
      const additionalAmt = parseFloat(b.additionalBudget) || 0;
      const executedAmt = parseFloat(b.executedAmount) || 0;
      const totalBudgetForProject = budgetAmt + additionalAmt;
      const excess = executedAmt > totalBudgetForProject ? executedAmt - totalBudgetForProject : 0;
      return sum + excess;
    }, 0);

    return {
      totalBudget,
      totalExecuted,
      totalConfirmedExecution,
      totalPending,
      totalUnexecuted,
      totalAdditional,
      totalBudgetExcess,  // 예산초과액 추가
      executionRate,
      executedRate,  // 기집행 집행률 추가
      totalProjects: budgets.length
    };
  };

  // 예산 구분별 통계 (확정집행액 기준)
  const getBudgetCategoryStats = () => {
    const categoryMap = {};
    budgets.forEach(budget => {
      const category = budget.budgetCategory || '미분류';
      if (!categoryMap[category]) {
        categoryMap[category] = {
          count: 0,
          totalBudget: 0,
          totalConfirmedExecution: 0
        };
      }
      categoryMap[category].count++;
      categoryMap[category].totalBudget += parseFloat(budget.budgetAmount) || 0;
      categoryMap[category].totalConfirmedExecution += parseFloat(budget.confirmedExecutionAmount) || 0;
    });
    return categoryMap;
  };

  // 상태별 통계
  const getStatusStats = () => {
    const statusMap = {};
    budgets.forEach(budget => {
      const status = budget.status || '대기';
      if (!statusMap[status]) {
        statusMap[status] = 0;
      }
      statusMap[status]++;
    });
    return statusMap;
  };

  // 필수사업여부별 통계
  const getEssentialStats = () => {
    const essential = budgets.filter(b => b.isEssential === true || b.isEssential === '필수').length;
    const optional = budgets.length - essential;
    return { essential, optional };
  };

  // 사업목적별 통계 (확정집행액 기준, 코드와 설명 표시)
  const getProjectPurposeStats = () => {
    const purposeMap = {};
    budgets.forEach(budget => {
      // 코드와 설명을 함께 표시
      const purposeCode = budget.projectPurposeCode || budget.projectPurpose || '미정';
      const purposeDesc = budget.projectPurposeDescription || '';
      const purposeDisplay = purposeDesc ? `${purposeCode} - ${purposeDesc}` : purposeCode;
      
      if (!purposeMap[purposeDisplay]) {
        purposeMap[purposeDisplay] = {
          count: 0,
          totalBudget: 0,
          totalConfirmedExecution: 0
        };
      }
      purposeMap[purposeDisplay].count++;
      purposeMap[purposeDisplay].totalBudget += parseFloat(budget.budgetAmount) || 0;
      purposeMap[purposeDisplay].totalConfirmedExecution += parseFloat(budget.confirmedExecutionAmount) || 0;
    });
    return purposeMap;
  };

  // 금액 포맷
  const formatCurrency = (amount) => {
    return Math.floor(amount).toLocaleString() + '원';
  };

  // 억원 단위로 변환
  const formatBillionWon = (amount) => {
    return (amount / 100000000).toFixed(1) + '억원';
  };

  // 리사이저 공통 스타일
  const resizerStyle = {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: '10px',
    cursor: 'col-resize',
    userSelect: 'none',
    zIndex: 999,
    backgroundColor: 'transparent'
  };

  // 컬럼 리사이징 핸들러
  const handleMouseDown = (e, columnName) => {
    setResizingColumn(columnName);
    setStartX(e.clientX);
    setStartWidth(columnWidths[columnName]);
    e.preventDefault();
  };

  const handleMouseMove = useCallback((e) => {
    if (!resizingColumn) return;
    
    const diff = e.clientX - startX;
    const newWidth = Math.max(50, startWidth + diff); // 최소 너비 50px
    
    setColumnWidths(prev => ({
      ...prev,
      [resizingColumn]: newWidth
    }));
  }, [resizingColumn, startX, startWidth]);

  const handleMouseUp = useCallback(() => {
    if (resizingColumn) {
      // localStorage에 저장
      setColumnWidths(prev => {
        localStorage.setItem('budgetTableColumnWidths', JSON.stringify(prev));
        return prev;
      });
      setResizingColumn(null);
    }
  }, [resizingColumn]);

  // 전역 마우스 이벤트 리스너
  useEffect(() => {
    if (resizingColumn) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [resizingColumn, handleMouseMove, handleMouseUp]);

  // 정렬 함수
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // 정렬 초기화
  const handleResetSort = () => {
    setSortConfig({ key: null, direction: 'asc' });
  };

  // 컬럼 너비 초기화
  const resetColumnWidths = () => {
    const defaultWidths = {
      번호: 60,
      사업명: 200,
      예산구분: 100,
      사업목적: 150,
      예산: 150,
      추가예산: 120,
      기집행액: 150,
      확정집행액: 150,
      집행률: 80,
      상태: 100,
      필수여부: 100,
      발의부서: 120,
      추진부서: 120
    };
    setColumnWidths(defaultWidths);
    localStorage.removeItem('budgetTableColumnWidths');
  };

  // 정렬 아이콘 표시
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return ' ↕️';
    }
    return sortConfig.direction === 'asc' ? ' ↑' : ' ↓';
  };

  // 정렬된 예산 목록
  const getSortedBudgets = () => {
    if (!sortConfig.key) return budgets;

    return [...budgets].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // 집행률 계산 (실시간)
      if (sortConfig.key === 'executionRate') {
        const aBudget = parseFloat(a.budgetAmount) || 0;
        const aAdditional = parseFloat(a.additionalBudget) || 0;
        const aExecuted = parseFloat(a.executedAmount) || 0;
        const aTotalBudget = aBudget + aAdditional;
        aValue = aTotalBudget > 0 ? (aExecuted / aTotalBudget) * 100 : 0;

        const bBudget = parseFloat(b.budgetAmount) || 0;
        const bAdditional = parseFloat(b.additionalBudget) || 0;
        const bExecuted = parseFloat(b.executedAmount) || 0;
        const bTotalBudget = bBudget + bAdditional;
        bValue = bTotalBudget > 0 ? (bExecuted / bTotalBudget) * 100 : 0;
      }
      // 숫자 타입 처리
      else if (sortConfig.key === 'budgetAmount' || 
          sortConfig.key === 'additionalBudget' || 
          sortConfig.key === 'executedAmount' || 
          sortConfig.key === 'confirmedExecutionAmount') {
        aValue = parseFloat(aValue) || 0;
        bValue = parseFloat(bValue) || 0;
      }
      // 문자열 타입 처리
      else if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  // 사업예산 클릭 시 품의서 조회 (새 창으로 열기)
  const handleBudgetClick = (budget) => {
    console.log('예산 클릭:', budget);
    
    // URL 파라미터 생성
    const params = new URLSearchParams({
      budgetId: budget.id,
      budgetName: encodeURIComponent(budget.projectName || '사업예산')
    });
    
    // 새 창 열기
    const width = 1400;
    const height = 800;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;
    
    const url = `${window.location.origin}/budget-proposals?${params.toString()}`;
    window.open(
      url,
      '_blank',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );
  };

  if (loading) {
    return (
      <div className="budget-dashboard">
        <h1>사업예산현황</h1>
        <div className="loading">데이터를 불러오는 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="budget-dashboard">
        <h1>사업예산현황</h1>
        <div className="error">오류: {error}</div>
      </div>
    );
  }

  const stats = calculateStatistics();
  const categoryStats = getBudgetCategoryStats();
  const statusStats = getStatusStats();
  const essentialStats = getEssentialStats();
  const purposeStats = getProjectPurposeStats();

  return (
    <div className="budget-dashboard">
      <div className="dashboard-header">
        <h1>사업예산현황</h1>
        <div className="year-selector">
          <label>조회 연도:</label>
          <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))}>
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
      </div>

      {/* 전체 요약 */}
      <div className="summary-cards">
        <div className="summary-card total">
          <div className="card-icon">💰</div>
          <div className="card-content">
            <h3>총 예산</h3>
            <p className="amount">{formatBillionWon(stats.totalBudget)}</p>
            <p className="sub-amount">{formatCurrency(stats.totalBudget)}</p>
          </div>
        </div>

        <div className="summary-card confirmed">
          <div className="card-icon">✅</div>
          <div className="card-content">
            <h3>확정집행액</h3>
            <p className="amount">{formatBillionWon(stats.totalConfirmedExecution)}</p>
            <p className="sub-text">확정집행률: {stats.executionRate}%</p>
          </div>
        </div>

        <div className="summary-card executed">
          <div className="card-icon">💵</div>
          <div className="card-content">
            <h3>기 집행</h3>
            <p className="amount">{formatBillionWon(stats.totalExecuted)}</p>
            <p className="sub-text">집행률: {stats.executedRate}%</p>
          </div>
        </div>

        <div className="summary-card pending">
          <div className="card-icon">⏳</div>
          <div className="card-content">
            <h3>집행대기</h3>
            <p className="amount">{formatBillionWon(stats.totalPending)}</p>
            <p className="sub-amount">{formatCurrency(stats.totalPending)}</p>
            <p className="sub-text">확정집행액 - 기집행</p>
          </div>
        </div>

        <div className="summary-card unexecuted">
          <div className="card-icon">📊</div>
          <div className="card-content">
            <h3>미집행액</h3>
            <p className="amount">{formatBillionWon(stats.totalUnexecuted)}</p>
            <p className="sub-amount">{formatCurrency(stats.totalUnexecuted)}</p>
            <p className="sub-text">(예산 + 추가예산) - 기집행</p>
          </div>
        </div>

        <div className="summary-card additional">
          <div className="card-icon">➕</div>
          <div className="card-content">
            <h3>추가예산</h3>
            <p className="amount">{formatBillionWon(stats.totalAdditional)}</p>
            <p className="sub-amount">{formatCurrency(stats.totalAdditional)}</p>
          </div>
        </div>

        <div className="summary-card excess">
          <div className="card-icon">⚠️</div>
          <div className="card-content">
            <h3>예산초과액</h3>
            <p className="amount">
              {formatBillionWon(stats.totalBudgetExcess)}
            </p>
            <p className="sub-amount">
              {formatCurrency(stats.totalBudgetExcess)}
            </p>
            <p className="sub-text">기집행 - (예산 + 추가예산)</p>
          </div>
        </div>
      </div>

      {/* 차트 영역 */}
      <div className="charts-container">
        {/* 예산 구분별 통계 */}
        <div className="chart-card">
          <h3>예산 구분별 현황</h3>
          <div className="chart-content">
            <table className="stats-table">
              <thead>
                <tr>
                  <th>예산 구분</th>
                  <th>사업 수</th>
                  <th>총 예산</th>
                  <th>확정집행액</th>
                  <th>집행률</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(categoryStats).map(([category, data]) => (
                  <tr key={category}>
                    <td>{category}</td>
                    <td>{data.count}건</td>
                    <td>{formatBillionWon(data.totalBudget)}</td>
                    <td>{formatBillionWon(data.totalConfirmedExecution)}</td>
                    <td>
                      {data.totalBudget > 0 
                        ? ((data.totalConfirmedExecution / data.totalBudget) * 100).toFixed(1)
                        : 0}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 사업목적별 통계 - 세로 막대 그래프 */}
        <div className="chart-card purpose-chart-card">
          <h3>사업목적별 현황</h3>
          <div className="chart-content">
            <div className="purpose-chart-vertical">
              {Object.entries(purposeStats).map(([purpose, data]) => {
                const budgetAmt = data.totalBudget;
                const confirmedAmt = data.totalConfirmedExecution;
                const maxBudget = Math.max(...Object.values(purposeStats).map(d => d.totalBudget));
                const budgetHeightPercent = maxBudget > 0 ? (budgetAmt / maxBudget) * 100 : 0;
                const executionRate = budgetAmt > 0 
                  ? ((confirmedAmt / budgetAmt) * 100).toFixed(1)
                  : 0;
                
                return (
                  <div key={purpose} className="purpose-bar-item">
                    {/* 세로 막대 */}
                    <div className="bar-chart-wrapper">
                      <div className="bar-stack">
                        <div 
                          className="vertical-bar total-bar"
                          style={{ height: `${budgetHeightPercent}%` }}
                          title={`예산: ${formatBillionWon(budgetAmt)}`}
                        >
                          <div 
                            className="vertical-bar execution-bar"
                            style={{ height: `${executionRate}%` }}
                            title={`확정집행액: ${formatBillionWon(confirmedAmt)} (${executionRate}%)`}
                          />
                        </div>
                      </div>
                      {/* 값 표시 */}
                      <div className="bar-values">
                        <span className="value-amount">{formatBillionWon(budgetAmt)}</span>
                        <span className="value-rate">{executionRate}%</span>
                      </div>
                    </div>
                    
                    {/* 하단 라벨 */}
                    <div className="bar-label-left">
                      <div className="label-name" title={purpose}>{purpose}</div>
                      <div className="label-count">{data.count}건</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="chart-legend">
              <div className="legend-item">
                <span className="legend-color total-legend"></span>
                <span>총 예산</span>
              </div>
              <div className="legend-item">
                <span className="legend-color execution-legend"></span>
                <span>확정집행액</span>
              </div>
            </div>
          </div>
        </div>

        {/* 상태별 통계 */}
        <div className="chart-card">
          <h3>상태별 현황</h3>
          <div className="chart-content">
            <div className="status-grid">
              {Object.entries(statusStats).map(([status, count]) => (
                <div key={status} className={`status-item status-${status}`}>
                  <div className="status-label">{status}</div>
                  <div className="status-count">{count}건</div>
                  <div className="status-percent">
                    {((count / stats.totalProjects) * 100).toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 사업예산 목록 */}
      <div className="budget-list-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3>{selectedYear}년 사업예산 목록 (총 {budgets.length}건)</h3>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {sortConfig.key && (
              <button 
                onClick={handleResetSort}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '500'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#5a6268'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#6c757d'}
              >
                🔄 정렬 초기화
              </button>
            )}
            <button 
              onClick={resetColumnWidths}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '500'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#5a6268'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#6c757d'}
            >
              ↔️ 컬럼 너비 초기화
            </button>
          </div>
        </div>
        <div className="table-responsive">
          <table className="budget-list-table">
            <thead>
              <tr>
                <th style={{ width: `${columnWidths['번호']}px`, textAlign: 'center', position: 'relative' }}>
                  번호
                  <div 
                    style={resizerStyle}
                    onMouseDown={(e) => handleMouseDown(e, '번호')}
                  />
                </th>
                <th 
                  style={{ width: `${columnWidths['사업명']}px`, cursor: 'pointer', textAlign: 'center', position: 'relative' }} 
                  onClick={() => handleSort('projectName')}
                >
                  사업명{getSortIcon('projectName')}
                  <div 
                    style={resizerStyle}
                    onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, '사업명'); }}
                  />
                </th>
                <th 
                  style={{ width: `${columnWidths['예산구분']}px`, cursor: 'pointer', textAlign: 'center', position: 'relative' }} 
                  onClick={() => handleSort('budgetCategory')}
                >
                  예산 구분{getSortIcon('budgetCategory')}
                  <div 
                    style={resizerStyle}
                    onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, '예산구분'); }}
                  />
                </th>
                <th 
                  style={{ width: `${columnWidths['사업목적']}px`, cursor: 'pointer', textAlign: 'center', position: 'relative' }} 
                  onClick={() => handleSort('projectPurposeCode')}
                >
                  사업목적{getSortIcon('projectPurposeCode')}
                  <div 
                    style={resizerStyle}
                    onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, '사업목적'); }}
                  />
                </th>
                <th 
                  style={{ width: `${columnWidths['예산']}px`, cursor: 'pointer', textAlign: 'center', position: 'relative' }} 
                  onClick={() => handleSort('budgetAmount')}
                >
                  예산{getSortIcon('budgetAmount')}
                  <div 
                    style={resizerStyle}
                    onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, '예산'); }}
                  />
                </th>
                <th 
                  style={{ width: `${columnWidths['추가예산']}px`, cursor: 'pointer', textAlign: 'center', position: 'relative' }} 
                  onClick={() => handleSort('additionalBudget')}
                >
                  추가예산{getSortIcon('additionalBudget')}
                  <div 
                    style={resizerStyle}
                    onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, '추가예산'); }}
                  />
                </th>
                <th 
                  style={{ width: `${columnWidths['기집행액']}px`, cursor: 'pointer', textAlign: 'center', position: 'relative' }} 
                  onClick={() => handleSort('executedAmount')}
                >
                  기집행액{getSortIcon('executedAmount')}
                  <div 
                    style={resizerStyle}
                    onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, '기집행액'); }}
                  />
                </th>
                <th 
                  style={{ width: `${columnWidths['확정집행액']}px`, cursor: 'pointer', textAlign: 'center', position: 'relative' }} 
                  onClick={() => handleSort('confirmedExecutionAmount')}
                >
                  확정집행액{getSortIcon('confirmedExecutionAmount')}
                  <div 
                    style={resizerStyle}
                    onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, '확정집행액'); }}
                  />
                </th>
                <th 
                  style={{ width: `${columnWidths['집행률']}px`, cursor: 'pointer', textAlign: 'center', position: 'relative' }} 
                  onClick={() => handleSort('executionRate')}
                >
                  집행률{getSortIcon('executionRate')}
                  <div 
                    style={resizerStyle}
                    onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, '집행률'); }}
                  />
                </th>
                <th 
                  style={{ width: `${columnWidths['상태']}px`, cursor: 'pointer', textAlign: 'center', position: 'relative' }} 
                  onClick={() => handleSort('status')}
                >
                  상태{getSortIcon('status')}
                  <div 
                    style={resizerStyle}
                    onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, '상태'); }}
                  />
                </th>
                <th 
                  style={{ width: `${columnWidths['필수여부']}px`, cursor: 'pointer', textAlign: 'center', position: 'relative' }} 
                  onClick={() => handleSort('isEssential')}
                >
                  필수여부{getSortIcon('isEssential')}
                  <div 
                    style={resizerStyle}
                    onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, '필수여부'); }}
                  />
                </th>
                <th 
                  style={{ width: `${columnWidths['발의부서']}px`, cursor: 'pointer', textAlign: 'center', position: 'relative' }} 
                  onClick={() => handleSort('initiatorDepartment')}
                >
                  발의부서{getSortIcon('initiatorDepartment')}
                  <div 
                    style={resizerStyle}
                    onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, '발의부서'); }}
                  />
                </th>
                <th 
                  style={{ width: `${columnWidths['추진부서']}px`, cursor: 'pointer', textAlign: 'center', position: 'relative' }} 
                  onClick={() => handleSort('executorDepartment')}
                >
                  추진부서{getSortIcon('executorDepartment')}
                  <div 
                    style={resizerStyle}
                    onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, '추진부서'); }}
                  />
                </th>
              </tr>
            </thead>
            <tbody>
              {getSortedBudgets().map((budget, index) => {
                const budgetAmt = parseFloat(budget.budgetAmount) || 0;
                const additionalAmt = parseFloat(budget.additionalBudget) || 0;
                const executedAmt = parseFloat(budget.executedAmount) || 0;
                const confirmedAmt = parseFloat(budget.confirmedExecutionAmount) || 0;
                const totalBudget = budgetAmt + additionalAmt;
                const rate = totalBudget > 0 
                  ? ((executedAmt / totalBudget) * 100).toFixed(1)
                  : 0;
                const purposeCode = budget.projectPurposeCode || budget.projectPurpose || '-';
                const purposeDesc = budget.projectPurposeDescription || '';
                const purposeDisplay = purposeDesc ? `${purposeCode} - ${purposeDesc}` : purposeCode;
                
                // 예산 초과 여부 체크 (기집행액 또는 확정집행액이 예산+추가예산을 초과)
                const isOverBudget = executedAmt > totalBudget || confirmedAmt > totalBudget;
                
                return (
                  <tr 
                    key={budget.id || index}
                    onClick={() => handleBudgetClick(budget)}
                    className={`budget-row ${isOverBudget ? 'over-budget' : ''}`}
                  >
                    <td style={{ textAlign: 'center' }}>{index + 1}</td>
                    <td style={{ textAlign: 'center' }}>{budget.projectName}</td>
                    <td style={{ textAlign: 'center' }}>{budget.budgetCategory}</td>
                    <td style={{ textAlign: 'center' }}>{purposeDisplay}</td>
                    <td style={{ textAlign: 'center' }}>{formatCurrency(budgetAmt)}</td>
                    <td style={{ textAlign: 'center' }}>{formatCurrency(additionalAmt)}</td>
                    <td style={{ textAlign: 'center' }}>{formatCurrency(executedAmt)}</td>
                    <td style={{ textAlign: 'center' }}>{formatCurrency(confirmedAmt)}</td>
                    <td style={{ textAlign: 'center' }}>{rate}%</td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`status-badge ${budget.status}`}>
                        {budget.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {budget.isEssential === true || budget.isEssential === '필수' ? '필수' : '선택'}
                    </td>
                    <td style={{ textAlign: 'center' }}>{budget.initiatorDepartment}</td>
                    <td style={{ textAlign: 'center' }}>{budget.executorDepartment}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BudgetDashboard;

