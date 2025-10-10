import React, { useState, useEffect } from 'react';
import { getApiUrl } from '../config/api';
import { generatePreviewHTML } from '../utils/previewGenerator';
import './BudgetDashboard.css';

const API_BASE_URL = getApiUrl();

const BudgetDashboard = () => {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [loadingProposals, setLoadingProposals] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

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

  // 사업예산 클릭 시 품의서 조회
  const handleBudgetClick = async (budget) => {
    console.log('예산 클릭:', budget);
    setSelectedBudget(budget);
    setShowProposalModal(true);
    setLoadingProposals(true);
    setProposals([]);

    try {
      console.log('품의서 조회 API 호출:', `${API_BASE_URL}/api/proposals?budgetId=${budget.id}&status=approved`);
      const response = await fetch(`${API_BASE_URL}/api/proposals?budgetId=${budget.id}&status=approved`);
      console.log('API 응답 상태:', response.status, response.ok);
      
      if (response.ok) {
        const data = await response.json();
        console.log('API 응답 데이터:', data);
        // 서버가 배열을 직접 반환하는지 또는 객체로 감싸서 반환하는지 확인
        const proposalsList = Array.isArray(data) ? data : (data.proposals || []);
        console.log('품의서 리스트:', proposalsList);
        setProposals(proposalsList);
      } else {
        console.error('품의서 조회 실패, 상태 코드:', response.status);
        const errorText = await response.text();
        console.error('오류 응답:', errorText);
      }
    } catch (error) {
      console.error('품의서 조회 오류:', error);
    } finally {
      setLoadingProposals(false);
    }
  };

  // 모달 닫기
  const handleCloseModal = () => {
    setShowProposalModal(false);
    setSelectedBudget(null);
    setProposals([]);
  };

  // 품의서 미리보기 열기
  const handleProposalPreview = async (proposal) => {
    try {
      console.log('품의서 미리보기:', proposal);
      
      // 상세 데이터 가져오기
      const response = await fetch(`${API_BASE_URL}/api/proposals/${proposal.id}`);
      if (!response.ok) {
        throw new Error('품의서 상세 조회 실패');
      }
      
      const fullProposalData = await response.json();
      console.log('품의서 상세 데이터:', fullProposalData);
      
      // 미리보기 HTML 생성
      const previewHTML = generatePreviewHTML(fullProposalData);
      const previewWindow = window.open('', '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
      
      if (!previewWindow) {
        alert('팝업이 차단되었습니다. 팝업 허용 후 다시 시도해주세요.');
        return;
      }

      previewWindow.document.write(previewHTML);
      previewWindow.document.close();
      previewWindow.focus();
      
    } catch (error) {
      console.error('품의서 미리보기 오류:', error);
      alert('품의서 미리보기를 여는 중 오류가 발생했습니다.');
    }
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

        <div className="summary-card executed">
          <div className="card-icon">💵</div>
          <div className="card-content">
            <h3>기 집행</h3>
            <p className="amount">{formatBillionWon(stats.totalExecuted)}</p>
            <p className="sub-text">집행률: {stats.executedRate}%</p>
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
            <p className="amount" style={{ color: stats.totalBudgetExcess > 0 ? '#dc3545' : '#2c3e50' }}>
              {formatBillionWon(stats.totalBudgetExcess)}
            </p>
            <p className="sub-amount" style={{ color: stats.totalBudgetExcess > 0 ? '#dc3545' : '#6c757d' }}>
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
        </div>
        <div className="table-responsive">
          <table className="budget-list-table">
            <thead>
              <tr>
                <th style={{ textAlign: 'center' }}>번호</th>
                <th 
                  style={{ cursor: 'pointer', textAlign: 'center' }} 
                  onClick={() => handleSort('projectName')}
                >
                  사업명{getSortIcon('projectName')}
                </th>
                <th 
                  style={{ cursor: 'pointer', textAlign: 'center' }} 
                  onClick={() => handleSort('budgetCategory')}
                >
                  예산 구분{getSortIcon('budgetCategory')}
                </th>
                <th style={{ textAlign: 'center' }}>사업목적</th>
                <th 
                  style={{ cursor: 'pointer', textAlign: 'center' }} 
                  onClick={() => handleSort('budgetAmount')}
                >
                  예산{getSortIcon('budgetAmount')}
                </th>
                <th 
                  style={{ cursor: 'pointer', textAlign: 'center' }} 
                  onClick={() => handleSort('additionalBudget')}
                >
                  추가예산{getSortIcon('additionalBudget')}
                </th>
                <th 
                  style={{ cursor: 'pointer', textAlign: 'center' }} 
                  onClick={() => handleSort('executedAmount')}
                >
                  기집행액{getSortIcon('executedAmount')}
                </th>
                <th 
                  style={{ cursor: 'pointer', textAlign: 'center' }} 
                  onClick={() => handleSort('confirmedExecutionAmount')}
                >
                  확정집행액{getSortIcon('confirmedExecutionAmount')}
                </th>
                <th 
                  style={{ cursor: 'pointer', textAlign: 'center' }} 
                  onClick={() => handleSort('executionRate')}
                >
                  집행률{getSortIcon('executionRate')}
                </th>
                <th 
                  style={{ cursor: 'pointer', textAlign: 'center' }} 
                  onClick={() => handleSort('status')}
                >
                  상태{getSortIcon('status')}
                </th>
                <th 
                  style={{ cursor: 'pointer', textAlign: 'center' }} 
                  onClick={() => handleSort('isEssential')}
                >
                  필수여부{getSortIcon('isEssential')}
                </th>
                <th 
                  style={{ cursor: 'pointer', textAlign: 'center' }} 
                  onClick={() => handleSort('initiatorDepartment')}
                >
                  발의부서{getSortIcon('initiatorDepartment')}
                </th>
                <th 
                  style={{ cursor: 'pointer', textAlign: 'center' }} 
                  onClick={() => handleSort('executorDepartment')}
                >
                  추진부서{getSortIcon('executorDepartment')}
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
                
                return (
                  <tr 
                    key={budget.id || index}
                    onClick={() => handleBudgetClick(budget)}
                    style={{ cursor: 'pointer' }}
                    className="budget-row"
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

      {/* 품의서 조회 모달 */}
      {showProposalModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>품의서 조회 - {selectedBudget?.projectName}</h3>
              <button className="close-button" onClick={handleCloseModal}>✕</button>
            </div>
            <div className="modal-body">
              {loadingProposals ? (
                <div className="loading">품의서를 불러오는 중...</div>
              ) : proposals.length === 0 ? (
                <div className="no-data">결재완료된 품의서가 없습니다.</div>
              ) : (
                <table className="proposals-table">
                  <thead>
                    <tr>
                      <th>번호</th>
                      <th>품의서명</th>
                      <th>계약방식</th>
                      <th>계약금액</th>
                      <th>작성자</th>
                      <th>작성일</th>
                      <th>결재일</th>
                    </tr>
                  </thead>
                  <tbody>
                    {proposals.map((proposal, index) => (
                      <tr 
                        key={proposal.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleProposalPreview(proposal);
                        }}
                        style={{ cursor: 'pointer' }}
                        className="proposal-row"
                      >
                        <td style={{ textAlign: 'center' }}>{index + 1}</td>
                        <td>{proposal.title}</td>
                        <td>{proposal.contractMethod}</td>
                        <td style={{ textAlign: 'right' }}>{formatCurrency(parseFloat(proposal.totalAmount) || 0)}</td>
                        <td>{proposal.requesterName}</td>
                        <td>{new Date(proposal.createdAt).toLocaleDateString()}</td>
                        <td>{proposal.approvedAt ? new Date(proposal.approvedAt).toLocaleDateString() : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-close" onClick={handleCloseModal}>닫기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetDashboard;

