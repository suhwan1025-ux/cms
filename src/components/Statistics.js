import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// API 베이스 URL 동적 설정
const getApiBaseUrl = () => {
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return `http://${window.location.hostname}:3001`;
  }
  return 'http://localhost:3001';
};

const API_BASE_URL = getApiBaseUrl();

const Statistics = () => {
  const [proposalStats, setProposalStats] = useState({
    totalProposals: 0,
    totalAmount: 0,
    averageAmount: 0,
    departmentStats: [],
    contractTypeStats: [],
    statusStats: [],
    monthlyStats: []
  });

  const [budgetStats, setBudgetStats] = useState({
    totalBudgets: 0,
    totalBudgetAmount: 0,
    executedBudgetAmount: 0,
    remainingBudgetAmount: 0,
    budgetByType: [],
    budgetByDepartment: [],
    budgetByYear: [],
    budgetData: [],
    approvedProposalsCount: 0 // 결재완료된 품의서 건수 추가
  });

  const [selectedPeriod, setSelectedPeriod] = useState('current');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');
  const [loading, setLoading] = useState(true);
  
  // 다중 정렬 상태 추가
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'asc'
  });

  // 팝업 관련 상태 추가
  const [showProposalPopup, setShowProposalPopup] = useState(false);
  const [selectedBudgetProposals, setSelectedBudgetProposals] = useState([]);
  const [selectedBudgetInfo, setSelectedBudgetInfo] = useState(null);
  const [popupLoading, setPopupLoading] = useState(false);

  useEffect(() => {
    fetchStatisticsData();
  }, []);

  // 다중 정렬 함수
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // 정렬된 데이터 반환 함수
  const getSortedData = (data) => {
    if (!sortConfig.key) return data;
    
    return [...data].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];
      
      // 숫자 필드 처리
      if (['budgetAmount', 'executedAmount', 'executionRate'].includes(sortConfig.key)) {
        aValue = parseFloat(aValue || 0);
        bValue = parseFloat(bValue || 0);
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

  const fetchStatisticsData = async () => {
    try {
      setLoading(true);
      
      // 품의서 데이터와 사업예산 데이터를 병렬로 가져오기
      const [proposalsRes, budgetStatsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/proposals`),
        fetch(`${API_BASE_URL}/api/budget-statistics`)
      ]);
      
      const proposals = await proposalsRes.json();
      const budgetStatsData = await budgetStatsRes.json();
      
      // 디버깅: 예산 통계 데이터 확인
      console.log('=== 예산 통계 데이터 디버깅 ===');
      console.log('budgetStatsData:', budgetStatsData);
      console.log('budgetData 샘플:', budgetStatsData.budgetData?.slice(0, 2));
      
      // 결재완료된 품의서만 필터링
      const approvedProposals = proposals.filter(proposal => proposal.status === 'approved');
      
      // 품의서 통계 계산 (결재완료된 건만)
      const totalProposals = approvedProposals.length;
      const totalAmount = approvedProposals.reduce((sum, p) => sum + parseFloat(p.totalAmount || 0), 0);
      const averageAmount = totalProposals > 0 ? totalAmount / totalProposals : 0;
      
      // 부서별 통계 (비용귀속부서 기준) - 결재완료된 건만
      const departmentData = {};
      approvedProposals.forEach(proposal => {
        if (proposal.costDepartments) {
          proposal.costDepartments.forEach(dept => {
            if (!departmentData[dept.department]) {
              departmentData[dept.department] = { 
                department: dept.department, 
                count: 0, 
                amount: 0
              };
            }
            departmentData[dept.department].count += 1;
            departmentData[dept.department].amount += parseFloat(dept.amount || 0);
          });
        }
      });
      
      // 계약 유형별 통계 (결재완료된 건만)
      const contractTypeData = approvedProposals.reduce((acc, proposal) => {
        const type = proposal.contractType;
        if (!acc[type]) {
          acc[type] = { 
            type, 
            count: 0, 
            amount: 0
          };
        }
        acc[type].count += 1;
        acc[type].amount += parseFloat(proposal.totalAmount || 0);
        
        return acc;
      }, {});
      
      // 상태별 통계 (전체 품의서 기준으로 상태별 분포 표시)
      const statusData = proposals.reduce((acc, proposal) => {
        const status = proposal.status;
        if (!acc[status]) {
          acc[status] = { status, count: 0, amount: 0 };
        }
        acc[status].count += 1;
        acc[status].amount += parseFloat(proposal.totalAmount || 0);
        return acc;
      }, {});
      
      // 월별 통계 (결재완료된 건만, 작성일 기준)
      const monthlyData = approvedProposals.reduce((acc, proposal) => {
        const date = new Date(proposal.createdAt);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!acc[monthKey]) {
          acc[monthKey] = { month: monthKey, count: 0, amount: 0 };
        }
        acc[monthKey].count += 1;
        acc[monthKey].amount += parseFloat(proposal.totalAmount || 0);
        return acc;
      }, {});
      
      setProposalStats({
        totalProposals,
        totalAmount,
        averageAmount,
        departmentStats: Object.values(departmentData),
        contractTypeStats: Object.values(contractTypeData),
        statusStats: Object.values(statusData),
        monthlyStats: Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month))
      });
      
      // 사업예산 통계 설정
      setBudgetStats(budgetStatsData);
      setBudgetStats(prev => ({ ...prev, approvedProposalsCount: approvedProposals.length }));
      
      // 현재 연도를 기본값으로 설정
      if (budgetStatsData.currentYear) {
        setSelectedYear(budgetStatsData.currentYear.toString());
      }
      
    } catch (error) {
      console.error('통계 데이터 로드 실패:', error);
      alert('데이터 로드에 실패했습니다. 서버가 실행 중인지 확인해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    // 소수점 제거하고 정수로 변환
    const integerAmount = Math.round(amount);
    return new Intl.NumberFormat('ko-KR').format(integerAmount) + '원';
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('ko-KR').format(num);
  };

  // 사업예산 클릭 시 해당 품의서 목록을 가져오는 함수
  const handleBudgetClick = async (budget) => {
    try {
      setPopupLoading(true);
      setSelectedBudgetInfo(budget);
      setShowProposalPopup(true);
      
      // 해당 사업예산의 품의서 목록 가져오기
      const response = await fetch(`${API_BASE_URL}/api/proposals?budgetId=${budget.id}`);
      const allProposals = await response.json();
      
      // 승인된 품의서만 필터링
      const approvedProposals = allProposals.filter(proposal => 
        proposal.status === 'approved' && proposal.budgetId === budget.id
      );
      
      setSelectedBudgetProposals(approvedProposals);
    } catch (error) {
      console.error('품의서 데이터 로드 실패:', error);
      alert('품의서 데이터를 불러오는데 실패했습니다.');
    } finally {
      setPopupLoading(false);
    }
  };

  // 팝업 닫기
  const closeProposalPopup = () => {
    setShowProposalPopup(false);
    setSelectedBudgetProposals([]);
    setSelectedBudgetInfo(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return '#28a745';
      case 'submitted': return '#007bff';
      case 'draft': return '#ffc107';
      case 'rejected': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'approved': return '승인';
      case 'submitted': return '제출';
      case 'draft': return '작성중';
      case 'rejected': return '반려';
      default: return status;
    }
  };

  const getContractTypeText = (type) => {
    switch (type) {
      case 'purchase': return '구매 계약';
      case 'change': return '변경 계약';
      case 'extension': return '연장 계약';
      case 'service': return '용역 계약';
      case 'bidding': return '입찰 계약';
      default: return type;
    }
  };

  // 월별 결재완료 품의서 그래프 데이터 생성
  const getMonthlyChartData = () => {
    const monthlyData = proposalStats.monthlyStats || [];
    
    // 최근 12개월 데이터만 사용
    const recentData = monthlyData.slice(-12);
    
    const labels = recentData.map(item => {
      const [year, month] = item.month.split('-');
      return `${year}년 ${month}월`;
    });
    
    const counts = recentData.map(item => item.count);
    const amounts = recentData.map(item => item.amount / 1000000); // 백만원 단위로 변환
    
    return {
      labels,
      datasets: [
        {
          label: '결재완료 건수',
          data: counts,
          borderColor: '#007bff',
          backgroundColor: 'rgba(0, 123, 255, 0.1)',
          yAxisID: 'y',
          tension: 0.4
        },
        {
          label: '결재완료 금액 (백만원)',
          data: amounts,
          borderColor: '#28a745',
          backgroundColor: 'rgba(40, 167, 69, 0.1)',
          yAxisID: 'y1',
          tension: 0.4
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    stacked: false,
    plugins: {
      title: {
        display: true,
        text: '월별 결재완료 품의서 현황'
      },
      legend: {
        display: true,
        position: 'top',
      }
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: '건수'
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: '금액 (백만원)'
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  const filteredDepartmentStats = selectedDepartment === 'all' 
    ? proposalStats.departmentStats 
    : proposalStats.departmentStats.filter(item => item.department === selectedDepartment);

  const filteredMonthlyStats = selectedPeriod === 'current' 
    ? proposalStats.monthlyStats.slice(-6) 
    : proposalStats.monthlyStats;

  if (loading) {
    return (
      <div className="loading">
        <h2>통계 데이터를 불러오는 중...</h2>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="statistics">
      <h1>통계 및 모니터링</h1>
      
      {/* 품의서 전체 통계 */}
      <div className="proposal-overview-stats">
        <h2>결재완료 품의서 통계</h2>
        <p className="stats-description">결재완료된 품의서만 집계한 통계입니다.</p>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">{formatNumber(proposalStats.totalProposals)}</div>
            <div className="stat-label">결재완료 품의서 건수</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{formatCurrency(proposalStats.totalAmount)}</div>
            <div className="stat-label">결재완료 총 계약 금액</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{formatCurrency(proposalStats.averageAmount)}</div>
            <div className="stat-label">결재완료 평균 계약 금액</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{proposalStats.departmentStats.length}</div>
            <div className="stat-label">관련 부서 수</div>
          </div>
        </div>
      </div>

      {/* 사업예산 통계 */}
      <div className="budget-overview-stats">
        <h2>사업예산 집행 현황 (결재완료 기준)</h2>
        <p className="stats-description">결재완료된 품의서만 집행금액에 반영된 통계입니다.</p>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">{formatNumber(budgetStats.totalBudgets)}</div>
            <div className="stat-label">총 사업예산 건수</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{formatCurrency(budgetStats.totalBudgetAmount)}</div>
            <div className="stat-label">총 사업예산 금액</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{formatCurrency(budgetStats.executedBudgetAmount)}</div>
            <div className="stat-label">결재완료 집행 금액</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{formatCurrency(budgetStats.remainingBudgetAmount)}</div>
            <div className="stat-label">잔여 예산 금액</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{Math.round((budgetStats.executedBudgetAmount / budgetStats.totalBudgetAmount) * 100)}%</div>
            <div className="stat-label">예산 집행률</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{Math.round((budgetStats.remainingBudgetAmount / budgetStats.totalBudgetAmount) * 100)}%</div>
            <div className="stat-label">예산 잔여률</div>
          </div>
        </div>
      </div>

      {/* 월별 결재완료 품의서 현황 그래프 */}
      <div className="monthly-chart-section">
        <h2>월별 결재완료 품의서 현황</h2>
        <p className="stats-description">최근 12개월간의 결재완료 품의서 건수와 금액을 표시합니다.</p>
        <div className="chart-container" style={{ height: '400px', marginBottom: '2rem' }}>
          <Line data={getMonthlyChartData()} options={chartOptions} />
        </div>
      </div>

      {/* 계약 유형별 통계 */}
      <div className="contract-type-stats">
        <h2>계약 유형별 결재완료 품의서 현황</h2>
        <p className="stats-description">결재완료된 품의서만 집계한 계약 유형별 통계입니다.</p>
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>계약 유형</th>
                <th>결재완료 건수</th>
                <th>총 금액</th>
                <th>평균 금액</th>
              </tr>
            </thead>
            <tbody>
              {proposalStats.contractTypeStats.map(type => (
                <tr key={type.type}>
                  <td>
                    <span className="contract-type-badge">
                      {getContractTypeText(type.type)}
                    </span>
                  </td>
                  <td>{formatNumber(type.count)}건</td>
                  <td className="amount-cell">{formatCurrency(type.amount)}</td>
                  <td className="amount-cell">{formatCurrency(type.count > 0 ? type.amount / type.count : 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 부서별 통계 */}
      <div className="department-stats">
        <h2>부서별 결재완료 품의서 현황</h2>
        <p className="stats-description">결재완료된 품의서만 집계한 부서별 통계입니다.</p>
        
        {/* 부서 필터 */}
        <div className="section-filter">
          <div className="filter-group">
            <label>부서:</label>
            <select value={selectedDepartment} onChange={(e) => setSelectedDepartment(e.target.value)}>
              <option value="all">전체 부서</option>
              {proposalStats.departmentStats.map(dept => (
                <option key={dept.department} value={dept.department}>{dept.department}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>부서</th>
                <th>결재완료 건수</th>
                <th>총 금액</th>
                <th>평균 금액</th>
                <th>비율</th>
              </tr>
            </thead>
            <tbody>
              {filteredDepartmentStats.map(dept => (
                <tr key={dept.department}>
                  <td>{dept.department}</td>
                  <td>{formatNumber(dept.count)}건</td>
                  <td>{formatCurrency(dept.amount)}</td>
                  <td>{formatCurrency(dept.count > 0 ? dept.amount / dept.count : 0)}</td>
                  <td>{Math.round((dept.amount / proposalStats.totalAmount) * 100)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 월별 통계 */}
      <div className="monthly-stats">
        <h2>월별 결재완료 품의서 현황</h2>
        <p className="stats-description">결재완료된 품의서만 집계한 월별 통계입니다.</p>
        
        {/* 기간 필터 */}
        <div className="section-filter">
          <div className="filter-group">
            <label>기간:</label>
            <select value={selectedPeriod} onChange={(e) => setSelectedPeriod(e.target.value)}>
              <option value="current">현재 년도</option>
              <option value="last">전년도</option>
              <option value="all">전체 기간</option>
            </select>
          </div>
        </div>
      </div>

      {/* 상태별 통계 */}
      <div className="status-stats">
        <h2>전체 품의서 상태별 분포</h2>
        <p className="stats-description">전체 품의서의 상태별 분포를 보여줍니다.</p>
        <div className="status-grid">
          {proposalStats.statusStats.map(status => (
            <div key={status.status} className="status-card">
              <div className="status-header">
                <span 
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(status.status) }}
                >
                  {getStatusText(status.status)}
                </span>
                <div className="status-count">{status.count}건</div>
              </div>
              <div className="status-amount">{formatCurrency(status.amount)}</div>
              <div className="status-percentage">
                {Math.round((status.count / proposalStats.totalProposals) * 100)}% 
                ({Math.round((status.amount / proposalStats.totalAmount) * 100)}%)
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 사업예산별 상세 통계 */}
      <div className="budget-detailed-stats">
        <h2>사업예산별 비용 집행 현황</h2>
        <p className="stats-description">결재완료된 품의서만 집행금액에 반영됩니다.</p>
        
        {/* 예산년도 필터 */}
        <div className="section-filter">
          <div className="filter-group">
            <label>예산년도:</label>
            <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
              <option value="all">전체 년도</option>
              {budgetStats.budgetByYear.map(year => (
                <option key={year.year} value={year.year}>{year.year}년</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th onClick={() => handleSort('projectName')} className="sortable">
                  사업명
                  {sortConfig.key === 'projectName' && (
                    <span className="sort-indicator">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th onClick={() => handleSort('initiatorDepartment')} className="sortable">
                  발의부서
                  {sortConfig.key === 'initiatorDepartment' && (
                    <span className="sort-indicator">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th onClick={() => handleSort('executorDepartment')} className="sortable">
                  추진부서
                  {sortConfig.key === 'executorDepartment' && (
                    <span className="sort-indicator">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th onClick={() => handleSort('budgetType')} className="sortable">
                  예산유형
                  {sortConfig.key === 'budgetType' && (
                    <span className="sort-indicator">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th onClick={() => handleSort('budgetCategory')} className="sortable">
                  세부분류
                  {sortConfig.key === 'budgetCategory' && (
                    <span className="sort-indicator">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th onClick={() => handleSort('budgetAmount')} className="sortable">
                  예산금액
                  {sortConfig.key === 'budgetAmount' && (
                    <span className="sort-indicator">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th onClick={() => handleSort('executedAmount')} className="sortable">
                  집행금액
                  {sortConfig.key === 'executedAmount' && (
                    <span className="sort-indicator">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th onClick={() => handleSort('executionRate')} className="sortable">
                  집행률
                  {sortConfig.key === 'executionRate' && (
                    <span className="sort-indicator">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th>사업기간</th>
                <th onClick={() => handleSort('isEssential')} className="sortable">
                  필수사업
                  {sortConfig.key === 'isEssential' && (
                    <span className="sort-indicator">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th onClick={() => handleSort('projectPurpose')} className="sortable">
                  사업목적
                  {sortConfig.key === 'projectPurpose' && (
                    <span className="sort-indicator">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th onClick={() => handleSort('budgetYear')} className="sortable">
                  예산년도
                  {sortConfig.key === 'budgetYear' && (
                    <span className="sort-indicator">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th onClick={() => handleSort('status')} className="sortable">
                  상태
                  {sortConfig.key === 'status' && (
                    <span className="sort-indicator">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
              </tr>
            </thead>
            <tbody>
              {getSortedData((budgetStats.budgetData || [])
                .filter(budget => selectedYear === 'all' || budget.budgetYear === parseInt(selectedYear)))
                .map(budget => (
                <tr key={budget.id} 
                    className="budget-row clickable" 
                    onClick={() => handleBudgetClick(budget)}
                    title="클릭하여 해당 사업예산의 품의서 목록을 확인하세요">
                  <td>{budget.projectName}</td>
                  <td>{budget.initiatorDepartment}</td>
                  <td>{budget.executorDepartment}</td>
                  <td>
                    <span className="budget-type-badge" style={{ 
                      backgroundColor: budget.budgetType === '자본예산' ? '#6f42c1' : '#fd7e14' 
                    }}>
                      {budget.budgetType}
                    </span>
                  </td>
                  <td>{budget.budgetCategory}</td>
                  <td className="amount-cell">{formatCurrency(budget.budgetAmount)}</td>
                  <td className="amount-cell">{formatCurrency(budget.executedAmount)}</td>
                  <td>
                    <div className="progress-bar small">
                      <div 
                        className="progress-fill" 
                        style={{ 
                          width: `${budget.executionRate}%`,
                          backgroundColor: budget.executionRate > 80 ? '#28a745' : 
                                           budget.executionRate > 50 ? '#ffc107' : '#dc3545'
                        }}
                      ></div>
                    </div>
                    <span>{Math.round(budget.executionRate)}%</span>
                  </td>
                  <td>{budget.startDate} ~ {budget.endDate}</td>
                  <td>
                    <span className={`essential-badge ${budget.isEssential ? 'essential' : 'non-essential'}`}>
                      {budget.isEssential ? '필수' : '선택'}
                    </span>
                  </td>
                  <td>
                    <span className="purpose-badge">
                      {budget.projectPurpose === 'A' ? '동결 및 감소' :
                       budget.projectPurpose === 'B' ? '유상전환' :
                       budget.projectPurpose === 'C' ? '전략과제' :
                       budget.projectPurpose === 'D' ? '물가상승인상' :
                       budget.projectPurpose === 'E' ? '사용량증가' :
                       budget.projectPurpose === 'F' ? '해지' : budget.projectPurpose}
                    </span>
                  </td>
                  <td>
                    <span className="year-badge">{budget.budgetYear}년</span>
                  </td>
                  <td>
                    <span className="status-badge" style={{ backgroundColor: getStatusColor(budget.status) }}>
                      {budget.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 품의서 목록 팝업 */}
      {showProposalPopup && (
        <div className="popup-overlay" onClick={closeProposalPopup}>
          <div className="popup-content" onClick={(e) => e.stopPropagation()}>
            <div className="popup-header">
              <h3>사업예산 집행 품의서 목록</h3>
              <button className="close-button" onClick={closeProposalPopup}>×</button>
            </div>
            
            {selectedBudgetInfo && (
              <div className="budget-info">
                <div className="budget-info-grid">
                  <div className="budget-info-item">
                    <strong>사업명:</strong> {selectedBudgetInfo.projectName}
                  </div>
                  <div className="budget-info-item">
                    <strong>발의부서:</strong> {selectedBudgetInfo.initiatorDepartment}
                  </div>
                  <div className="budget-info-item">
                    <strong>추진부서:</strong> {selectedBudgetInfo.executorDepartment}
                  </div>
                  <div className="budget-info-item">
                    <strong>예산년도:</strong> {selectedBudgetInfo.budgetYear}년
                  </div>
                  <div className="budget-info-item">
                    <strong>예산금액:</strong> {formatCurrency(selectedBudgetInfo.budgetAmount)}
                  </div>
                  <div className="budget-info-item">
                    <strong>집행금액:</strong> {formatCurrency(selectedBudgetInfo.executedAmount)}
                  </div>
                  <div className="budget-info-item">
                    <strong>집행률:</strong> {Math.round(selectedBudgetInfo.executionRate)}%
                  </div>
                  <div className="budget-info-item">
                    <strong>예산유형:</strong> {selectedBudgetInfo.budgetType}
                  </div>
                </div>
              </div>
            )}
            
            <div className="popup-body">
              {popupLoading ? (
                <div className="popup-loading">
                  <div className="spinner"></div>
                  <p>품의서 목록을 불러오는 중...</p>
                </div>
              ) : (
                <>
                  <div className="proposals-summary">
                    <p><strong>총 {selectedBudgetProposals.length}건</strong>의 승인된 품의서가 이 사업예산을 집행했습니다.</p>
                  </div>
                  
                  {selectedBudgetProposals.length > 0 ? (
                    <div className="table-responsive">
                      <table className="table popup-table">
                        <thead>
                          <tr>
                            <th>품의서 제목</th>
                            <th>계약유형</th>
                            <th>계약금액</th>
                            <th>작성자</th>
                            <th>작성일</th>
                            <th>승인일</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedBudgetProposals.map(proposal => (
                            <tr key={proposal.id}>
                              <td className="proposal-title">{proposal.purpose}</td>
                              <td>
                                <span className="contract-type-badge">
                                  {getContractTypeText(proposal.contractType)}
                                </span>
                              </td>
                              <td className="amount-cell">{formatCurrency(proposal.totalAmount)}</td>
                              <td>{proposal.createdBy}</td>
                              <td>{new Date(proposal.createdAt).toLocaleDateString('ko-KR')}</td>
                              <td>{proposal.approvalDate ? new Date(proposal.approvalDate).toLocaleDateString('ko-KR') : '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="no-proposals">
                      <p>이 사업예산을 집행한 승인된 품의서가 없습니다.</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx="true">{`
        .statistics {
          max-width: 1200px;
          margin: 0 auto;
        }

        .section-filter {
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
          padding: 0.75rem;
          background: #f8f9fa;
          border-radius: 6px;
          border: 1px solid #e9ecef;
        }

        .filter-group {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .filter-group label {
          font-weight: 500;
          color: #495057;
          font-size: 0.9rem;
        }

        .filter-group select {
          padding: 0.5rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          background: white;
          font-size: 0.9rem;
        }

        .overview-stats,
        .budget-overview-stats,
        .contract-type-stats,
        .department-stats,
        .monthly-stats,
        .status-stats,
        .budget-detailed-stats {
          background: white;
          padding: 1.5rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .stat-card {
          text-align: center;
          padding: 1.5rem;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .stat-number {
          font-size: 1.5rem;
          font-weight: bold;
          color: #667eea;
          margin-bottom: 0.5rem;
        }

        .stat-label {
          color: #666;
          font-size: 0.9rem;
        }

        .progress-bar {
          width: 100%;
          height: 8px;
          background: #e9ecef;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 0.25rem;
        }

        .progress-bar.small {
          height: 6px;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #667eea, #764ba2);
          transition: width 0.3s ease;
        }

        .chart-container {
          overflow-x: auto;
        }

        .chart {
          display: flex;
          align-items: end;
          gap: 1rem;
          height: 250px;
          padding: 1rem 0;
        }

        .chart-bar {
          display: flex;
          flex-direction: column;
          align-items: center;
          min-width: 80px;
        }

        .bar-label {
          font-size: 0.8rem;
          color: #666;
          margin-bottom: 0.5rem;
        }

        .bar-container {
          width: 40px;
          height: 200px;
          background: #f8f9fa;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 0.5rem;
        }

        .bar-fill {
          width: 100%;
          transition: height 0.3s ease;
        }

        .bar-value {
          font-size: 0.8rem;
          color: #333;
          text-align: center;
        }

        .bar-count {
          font-size: 0.7rem;
          color: #666;
        }

        .status-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem;
        }

        .status-card {
          padding: 1rem;
          border: 1px solid #eee;
          border-radius: 8px;
          text-align: center;
        }

        .status-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .status-badge {
          color: white;
          padding: 0.25rem 0.5rem;
          border-radius: 3px;
          font-size: 0.8rem;
        }

        .status-count {
          font-weight: bold;
          color: #333;
        }

        .status-amount {
          font-size: 1.2rem;
          font-weight: bold;
          color: #667eea;
          margin-bottom: 0.5rem;
        }

        .status-percentage {
          font-size: 0.9rem;
          color: #666;
        }

        /* 품의서 관련 스타일 */
        .contract-type-badge {
          background: #e9ecef;
          color: #495057;
          padding: 0.25rem 0.5rem;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .status-count.draft {
          color: #ffc107;
          font-weight: 600;
        }

        .status-count.submitted {
          color: #007bff;
          font-weight: 600;
        }

        .status-count.approved {
          color: #28a745;
          font-weight: 600;
        }

        .status-count.rejected {
          color: #dc3545;
          font-weight: 600;
        }

        /* 사업예산 관련 스타일 */
        .budget-type-badge {
          padding: 0.25rem 0.5rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 500;
          color: white;
          text-align: center;
          display: inline-block;
        }

        .essential-badge {
          padding: 0.25rem 0.5rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 500;
          text-align: center;
          display: inline-block;
        }

        .essential-badge.essential {
          background-color: #dc3545;
          color: white;
        }

        .essential-badge.non-essential {
          background-color: #6c757d;
          color: white;
        }

        .purpose-badge {
          padding: 0.25rem 0.5rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 500;
          background-color: #e9ecef;
          color: #495057;
          text-align: center;
          display: inline-block;
        }

        .year-badge {
          padding: 0.25rem 0.5rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 500;
          background-color: #007bff;
          color: white;
          text-align: center;
          display: inline-block;
        }

        .amount-cell {
          font-weight: 600;
          color: #333;
        }

        /* 클릭 가능한 행 스타일 */
        .budget-row.clickable {
          cursor: pointer;
          transition: background-color 0.2s ease;
        }

        .budget-row.clickable:hover {
          background-color: #f8f9fa;
        }

        /* 팝업 스타일 */
        .popup-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .popup-content {
          background: white;
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
          max-width: 1200px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          position: relative;
        }

        .popup-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem 2rem;
          border-bottom: 1px solid #e9ecef;
          background: #f8f9fa;
          border-radius: 12px 12px 0 0;
        }

        .popup-header h3 {
          margin: 0;
          color: #333;
          font-size: 1.25rem;
        }

        .close-button {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #666;
          padding: 0;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: background-color 0.2s ease;
        }

        .close-button:hover {
          background-color: #e9ecef;
          color: #333;
        }

        .budget-info {
          padding: 1.5rem 2rem;
          background: #f8f9fa;
          border-bottom: 1px solid #e9ecef;
        }

        .budget-info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem;
        }

        .budget-info-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9rem;
        }

        .budget-info-item strong {
          color: #495057;
          min-width: 80px;
        }

        .popup-body {
          padding: 1.5rem 2rem;
        }

        .popup-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem;
        }

        .popup-loading .spinner {
          width: 40px;
          height: 40px;
          margin-bottom: 1rem;
        }

        .proposals-summary {
          margin-bottom: 1.5rem;
          padding: 1rem;
          background: #e3f2fd;
          border-radius: 6px;
          border-left: 4px solid #2196f3;
        }

        .proposals-summary p {
          margin: 0;
          color: #1565c0;
        }

        .popup-table {
          font-size: 0.9rem;
        }

        .popup-table th {
          background: #f8f9fa;
          font-weight: 600;
          color: #495057;
          border-bottom: 2px solid #dee2e6;
        }

        .popup-table td {
          vertical-align: middle;
        }

        .proposal-title {
          max-width: 300px;
          word-wrap: break-word;
          font-weight: 500;
          color: #333;
        }

        .no-proposals {
          text-align: center;
          padding: 3rem;
          color: #666;
        }

        .no-proposals p {
          margin: 0;
          font-size: 1.1rem;
        }

        /* 정렬 관련 스타일 */
        .sortable {
          cursor: pointer;
          user-select: none;
          position: relative;
          transition: background-color 0.2s ease;
        }

        .sortable:hover {
          background-color: #f8f9fa;
        }

        .sort-indicator {
          margin-left: 0.5rem;
          font-size: 0.8rem;
          color: #667eea;
        }

        .loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          text-align: center;
        }

        .spinner {
          width: 50px;
          height: 50px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-top: 1rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .section-filter {
            flex-direction: column;
            gap: 0.75rem;
          }
          
          .stats-grid {
            grid-template-columns: 1fr;
          }
          
          .chart {
            gap: 0.5rem;
          }
          
          .chart-bar {
            min-width: 60px;
          }
          
          .status-grid {
            grid-template-columns: 1fr;
          }

          /* 팝업 반응형 */
          .popup-overlay {
            padding: 10px;
          }

          .popup-content {
            max-height: 95vh;
          }

          .popup-header {
            padding: 1rem 1.5rem;
          }

          .popup-header h3 {
            font-size: 1.1rem;
          }

          .budget-info {
            padding: 1rem 1.5rem;
          }

          .budget-info-grid {
            grid-template-columns: 1fr;
            gap: 0.75rem;
          }

          .popup-body {
            padding: 1rem 1.5rem;
          }

          .popup-table {
            font-size: 0.8rem;
          }

          .proposal-title {
            max-width: 200px;
          }

          /* 테이블 반응형 */
          .table-responsive {
            overflow-x: auto;
          }

          .popup-table th,
          .popup-table td {
            padding: 0.5rem 0.25rem;
            white-space: nowrap;
          }
        }
      `}</style>
    </div>
  );
};

export default Statistics; 