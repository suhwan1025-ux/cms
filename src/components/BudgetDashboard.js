import React, { useState, useEffect } from 'react';
import { getApiUrl } from '../config/api';
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
    
    // 미집행액 = 예산 - 확정집행액
    const totalUnexecuted = totalBudget - totalConfirmedExecution;
    
    // 집행률 = (확정집행액 / 사업예산액) × 100
    const executionRate = totalBudget > 0 ? ((totalConfirmedExecution / totalBudget) * 100).toFixed(1) : 0;

    return {
      totalBudget,
      totalExecuted,
      totalConfirmedExecution,
      totalPending,
      totalUnexecuted,
      totalAdditional,
      executionRate,
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

  // 사업예산 클릭 시 품의서 조회
  const handleBudgetClick = async (budget) => {
    setSelectedBudget(budget);
    setShowProposalModal(true);
    setLoadingProposals(true);
    setProposals([]);

    try {
      const response = await fetch(`${API_BASE_URL}/api/proposals?budgetId=${budget.id}&status=approved`);
      if (response.ok) {
        const data = await response.json();
        setProposals(data.proposals || []);
      } else {
        console.error('품의서 조회 실패');
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
            <p className="sub-amount">{formatCurrency(stats.totalExecuted)}</p>
          </div>
        </div>

        <div className="summary-card confirmed">
          <div className="card-icon">✅</div>
          <div className="card-content">
            <h3>확정집행액</h3>
            <p className="amount">{formatBillionWon(stats.totalConfirmedExecution)}</p>
            <p className="sub-text">집행률: {stats.executionRate}%</p>
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
            <p className="sub-text">예산 - 확정집행액</p>
          </div>
        </div>

        {stats.totalAdditional > 0 && (
          <div className="summary-card additional">
            <div className="card-icon">➕</div>
            <div className="card-content">
              <h3>추가예산</h3>
              <p className="amount">{formatBillionWon(stats.totalAdditional)}</p>
              <p className="sub-amount">{formatCurrency(stats.totalAdditional)}</p>
            </div>
          </div>
        )}
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

        {/* 집행률 현황 */}
        <div className="chart-card">
          <h3>집행률 현황</h3>
          <div className="chart-content">
            <div className="execution-rate-container">
              <div className="execution-rate-circle">
                <svg viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="#e9ecef" strokeWidth="10"/>
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="45" 
                    fill="none" 
                    stroke="#28a745" 
                    strokeWidth="10"
                    strokeDasharray={`${stats.executionRate * 2.827} 282.7`}
                    strokeLinecap="round"
                    transform="rotate(-90 50 50)"
                  />
                </svg>
                <div className="execution-rate-text">
                  <div className="rate-number">{stats.executionRate}%</div>
                  <div className="rate-label">집행률</div>
                </div>
              </div>
              <div className="execution-details">
                <div className="detail-item">
                  <span className="detail-label">총 예산:</span>
                  <span className="detail-value">{formatBillionWon(stats.totalBudget)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">확정집행액:</span>
                  <span className="detail-value">{formatBillionWon(stats.totalConfirmedExecution)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">미집행:</span>
                  <span className="detail-value">{formatBillionWon(stats.totalUnexecuted)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 사업예산 목록 */}
      <div className="budget-list-section">
        <h3>{selectedYear}년 사업예산 목록 (총 {budgets.length}건)</h3>
        <div className="table-responsive">
          <table className="budget-list-table">
            <thead>
              <tr>
                <th>번호</th>
                <th>사업명</th>
                <th>예산 구분</th>
                <th>사업목적</th>
                <th>예산</th>
                <th>확정집행액</th>
                <th>집행률</th>
                <th>상태</th>
                <th>필수여부</th>
                <th>발의부서</th>
                <th>추진부서</th>
              </tr>
            </thead>
            <tbody>
              {budgets.map((budget, index) => {
                const budgetAmt = parseFloat(budget.budgetAmount) || 0;
                const confirmedAmt = parseFloat(budget.confirmedExecutionAmount) || 0;
                const rate = budgetAmt > 0 
                  ? ((confirmedAmt / budgetAmt) * 100).toFixed(1)
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
                    <td>{budget.projectName}</td>
                    <td>{budget.budgetCategory}</td>
                    <td>{purposeDisplay}</td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(budgetAmt)}</td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(confirmedAmt)}</td>
                    <td style={{ textAlign: 'right' }}>{rate}%</td>
                    <td>
                      <span className={`status-badge ${budget.status}`}>
                        {budget.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {budget.isEssential === true || budget.isEssential === '필수' ? '필수' : '선택'}
                    </td>
                    <td>{budget.initiatorDepartment}</td>
                    <td>{budget.executorDepartment}</td>
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
                      <tr key={proposal.id}>
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

