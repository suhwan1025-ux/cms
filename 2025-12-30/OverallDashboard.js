import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getApiUrl } from '../config/api';
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import './OverallDashboard.css';

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

const API_BASE_URL = getApiUrl();

function OverallDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [dashboardData, setDashboardData] = useState({
    contracts: {
      total: 0,
      approved: 0,
      pending: 0,
      rejected: 0,
      totalAmount: 0,
      byMethod: {
        lowestPrice: 0,
        competitive: 0,
        private: 0
      }
    },
    projects: {
      total: 0,
      planning: 0,
      inProgress: 0,
      completed: 0,
      paused: 0,
      healthy: 0,
      warning: 0,
      critical: 0,
      projectList: []
    },
    budgets: {
      total: 0,
      totalBudget: 0,
      totalExecuted: 0,
      executionRate: 0,
      currentYear: new Date().getFullYear()
    },
    operatingBudgets: {
      total: 0,
      totalBudget: 0,
      totalExecuted: 0,
      executionRate: 0,
      currentYear: new Date().getFullYear()
    },
    personnel: {
      internal: 0,
      internalResigned: 0,
      external: 0,
      externalActive: 0
    }
  });

  useEffect(() => {
    fetchAllData();
  }, [selectedYear]);

  const fetchAllData = async () => {
    try {
      setLoading(true);

      const [contractsRes, projectsRes, budgetsRes, operatingBudgetsRes, personnelRes, externalPersonnelRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/proposals`),
        fetch(`${API_BASE_URL}/api/projects`),
        fetch(`${API_BASE_URL}/api/business-budgets`),
        fetch(`${API_BASE_URL}/api/operating-budgets`),
        fetch(`${API_BASE_URL}/api/personnel`),
        fetch(`${API_BASE_URL}/api/external-personnel`)
      ]);

      const contracts = await contractsRes.json();
      const projects = await projectsRes.json();
      const budgets = await budgetsRes.json();
      const operatingBudgets = await operatingBudgetsRes.json();
      const personnel = await personnelRes.json();
      const externalPersonnel = await externalPersonnelRes.json();

      // 승인된 계약만 필터링 (선택한 연도)
      const approvedContracts = contracts.filter(c => {
        if (c.status !== 'approved') return false;
        
        // approvalDate 또는 approval_date 필드 확인
        const approvalDateValue = c.approvalDate || c.approval_date;
        if (!approvalDateValue) return false;
        
        const approvalDate = new Date(approvalDateValue);
        return approvalDate.getFullYear() === selectedYear;
      });
      
      // 계약 방식별 집계 (최저가, 경쟁계약, 수의계약)
      const contractMethodStats = {
        lowestPrice: 0,
        competitive: 0,
        private: 0
      };
      
      approvedContracts.forEach(proposal => {
        // contractMethod와 contract_method 모두 확인
        const method = proposal.contractMethod || proposal.contract_method || '';
        
        // 최저가 계약
        if (
          method === 'CM04' ||
          method.includes('최저가') || 
          method.includes('lowest')
        ) {
          contractMethodStats.lowestPrice++;
        }
        // 경쟁계약
        else if (
          method === 'CM05' || method === 'CM06' || method === 'CM07' || method === 'CM08' ||
          method.includes('경쟁') || 
          method.includes('입찰') ||
          method.includes('competition') ||
          method.includes('일반') || method.includes('제한') || method.includes('지명') || method.includes('협상')
        ) {
          contractMethodStats.competitive++;
        }
        // 수의계약
        else if (
          method === 'CM10' || method === 'CM11' || method === 'CM12' || method === 'CM13' || method === 'CM14' ||
          method === 'CM15' || method === 'CM16' || method === 'CM17' || method === 'CM18' || method === 'CM19' ||
          method === 'CM20' || method === 'CM21' ||
          method.includes('수의') || 
          method.includes('private')
        ) {
          contractMethodStats.private++;
        }
      });
      
      const contractStats = {
        total: contracts.length,
        approved: approvedContracts.length,  // 최근 1년 승인 건수
        pending: contracts.filter(c => c.status === 'pending').length,
        rejected: contracts.filter(c => c.status === 'rejected').length,
        totalAmount: approvedContracts.reduce((sum, c) => sum + (Number(c.total_amount) || 0), 0),
        byMethod: contractMethodStats  // 최근 1년 계약방식별 통계
      };

      // 선택한 연도의 프로젝트만 필터링
      const currentYearProjects = projects.filter(p => {
        const projectYear = p.budgetYear || p.budget_year;
        return projectYear === selectedYear;
      });
      
      const projectStats = {
        total: currentYearProjects.length,
        planning: currentYearProjects.filter(p => p.status === '계획').length,
        inProgress: currentYearProjects.filter(p => p.status === '진행중').length,
        completed: currentYearProjects.filter(p => p.status === '완료').length,
        paused: currentYearProjects.filter(p => p.status === '중단').length,
        healthy: currentYearProjects.filter(p => p.healthStatus === '양호').length,
        warning: currentYearProjects.filter(p => p.healthStatus === '주의').length,
        critical: currentYearProjects.filter(p => p.healthStatus === '위험').length,
        projectList: currentYearProjects.map(p => ({
          id: p.id,
          projectName: p.projectName || p.project_name,
          progressRate: p.progressRate || p.progress_rate || 0,
          healthStatus: p.healthStatus || p.health_status,
          issues: p.issues || '-'
        }))
      };

      // 선택한 연도의 사업예산 필터링
      const currentYearBudgets = budgets.filter(b => b.budget_year === selectedYear);
      const totalBudget = currentYearBudgets.reduce((sum, b) => sum + (Number(b.budget_amount) || 0), 0);
      const totalExecuted = currentYearBudgets.reduce((sum, b) => sum + (Number(b.executed_amount) || 0), 0);
      
      const budgetStats = {
        total: budgets.length,
        totalBudget,
        totalExecuted,
        executionRate: totalBudget > 0 ? ((totalExecuted / totalBudget) * 100).toFixed(1) : 0,
        currentYear: selectedYear
      };

      // 선택한 연도의 전산운용비 필터링 (fiscal_year 필드 사용)
      const currentYearOperatingBudgets = operatingBudgets.filter(b => {
        const fiscalYear = b.fiscal_year || b.fiscalYear;
        return fiscalYear === selectedYear;
      });
      const operatingTotalBudget = currentYearOperatingBudgets.reduce((sum, b) => sum + (Number(b.budget_amount) || 0), 0);
      const operatingTotalExecuted = currentYearOperatingBudgets.reduce((sum, b) => sum + (Number(b.executed_amount) || 0), 0);
      
      const operatingBudgetStats = {
        total: operatingBudgets.length,
        totalBudget: operatingTotalBudget,
        totalExecuted: operatingTotalExecuted,
        executionRate: operatingTotalBudget > 0 ? ((operatingTotalExecuted / operatingTotalBudget) * 100).toFixed(1) : 0,
        currentYear: selectedYear
      };
      
      // 외주인력 재직자 수 계산 (Dashboard.js와 동일한 로직 적용)
      let calculatedExternalActive = 0;
      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);

      // contracts는 이미 모든 품의서 데이터를 포함하고 있음
      contracts.forEach(proposal => {
        // 승인된 용역 계약만 대상
        if (proposal.status === 'approved' && proposal.contractType === 'service') {
          let items = proposal.serviceItems;
          
          // 문자열인 경우 파싱 시도
          if (typeof items === 'string') {
            try { items = JSON.parse(items); } catch (e) { items = []; }
          }

          if (Array.isArray(items)) {
            items.forEach(item => {
              // 날짜 파싱 헬퍼 (내부 함수)
              const parseDateForce = (val) => {
                if (!val) return null;
                if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
                if (typeof val === 'string') {
                  const match = val.match(/^(\d{4})-(\d{2})-(\d{2})/);
                  if (match) return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
                  const d = new Date(val);
                  return isNaN(d.getTime()) ? null : d;
                }
                return null;
              };

              // 시작일
              let startDate = parseDateForce(item.contractPeriodStart);
              if (!startDate) startDate = parseDateForce(proposal.approvalDate || proposal.approval_date);
              
              // 종료일
              let endDate = parseDateForce(item.contractPeriodEnd);
              
              // 기간으로 종료일 자동 계산
              if (!endDate && startDate && item.period) {
                endDate = new Date(startDate);
                const period = parseFloat(item.period) || 0;
                if (period > 0) {
                  endDate.setMonth(endDate.getMonth() + Math.floor(period));
                  const decimalPart = period - Math.floor(period);
                  if (decimalPart > 0) endDate.setDate(endDate.getDate() + Math.floor(decimalPart * 30));
                  endDate.setDate(endDate.getDate() - 1); 
                }
              }
              
              // 재직 상태 판단
              if (startDate) {
                const sDate = new Date(startDate); sDate.setHours(0, 0, 0, 0);
                // 종료일이 없으면 2099년까지로 가정 (재직중 처리)
                const eDate = endDate ? new Date(endDate) : new Date(2099, 11, 31);
                eDate.setHours(23, 59, 59, 999);

                if (todayDate >= sDate && todayDate <= eDate) {
                  calculatedExternalActive++;
                }
              }
            });
          }
        }
      });
      
      console.log('외주인력 계산 결과:', calculatedExternalActive);

      // 인력 데이터 집계
      const personnelStats = {
        internal: personnel.filter(p => !p.resignation_date).length,  // 퇴사일이 없는 경우 재직중
        internalResigned: personnel.filter(p => {
          if (!p.resignation_date) return false;
          const resignationYear = new Date(p.resignation_date).getFullYear();
          return resignationYear === selectedYear;  // 선택한 연도에 퇴사한 사람만
        }).length,
        external: calculatedExternalActive, // 계산된 값 사용
        externalActive: calculatedExternalActive // 계산된 값 사용
      };

      setDashboardData({
        contracts: contractStats,
        projects: projectStats,
        budgets: budgetStats,
        operatingBudgets: operatingBudgetStats,
        personnel: personnelStats
      });
    } catch (error) {
      console.error('대시보드 데이터 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return '0원';
    const billion = Math.floor(amount / 100000000);
    const million = Math.floor((amount % 100000000) / 1000000);
    
    if (billion > 0) {
      return million > 0 
        ? `${billion.toLocaleString()}억 ${million.toLocaleString()}백만원`
        : `${billion.toLocaleString()}억원`;
    }
    return `${million.toLocaleString()}백만원`;
  };

  // 차트 옵션
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#495057',
          font: {
            size: 11,
            weight: '500'
          },
          padding: 15
        }
      }
    }
  };

  // 계약 상태 차트 데이터
  const contractStatusData = {
    labels: ['승인', '대기', '반려'],
    datasets: [{
      data: [
        dashboardData.contracts.approved,
        dashboardData.contracts.pending,
        dashboardData.contracts.rejected
      ],
      backgroundColor: ['#2c3e50', '#7f8c8d', '#bdc3c7'],
      borderWidth: 0
    }]
  };

  // 계약 방식별 차트 데이터
  const contractMethodData = {
    labels: [
      `최저가 (${dashboardData.contracts.byMethod?.lowestPrice || 0}건)`,
      `경쟁계약 (${dashboardData.contracts.byMethod?.competitive || 0}건)`,
      `수의계약 (${dashboardData.contracts.byMethod?.private || 0}건)`
    ],
    datasets: [{
      data: [
        dashboardData.contracts.byMethod?.lowestPrice || 0,
        dashboardData.contracts.byMethod?.competitive || 0,
        dashboardData.contracts.byMethod?.private || 0
      ],
      backgroundColor: ['#2c3e50', '#6c757d', '#adb5bd'],
      borderWidth: 0
    }]
  };

  // 프로젝트 상태 차트 데이터
  const projectStatusData = {
    labels: ['계획', '진행중', '완료', '중단'],
    datasets: [{
      label: '프로젝트 수',
      data: [
        dashboardData.projects.planning,
        dashboardData.projects.inProgress,
        dashboardData.projects.completed,
        dashboardData.projects.paused
      ],
      backgroundColor: '#2c3e50',
      borderRadius: 4
    }]
  };

  // 프로젝트 건강도 차트 데이터
  const projectHealthData = {
    labels: ['양호', '주의', '위험'],
    datasets: [{
      data: [
        dashboardData.projects.healthy,
        dashboardData.projects.warning,
        dashboardData.projects.critical
      ],
      backgroundColor: ['#2c3e50', '#7f8c8d', '#bdc3c7'],
      borderWidth: 0
    }]
  };

  if (loading) {
    return (
      <div className="cockpit-dashboard">
        <div className="loading-screen">
          <div className="loading-spinner"></div>
          <p>데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="cockpit-dashboard">
      {/* 헤더 */}
      <div className="cockpit-header">
        <div className="header-content">
          <h1>ORDIN Control Center</h1>
          <div className="header-controls">
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="year-filter"
            >
              {Array.from({ length: 7 }, (_, i) => new Date().getFullYear() + 1 - i).map(year => (
                <option key={year} value={year}>{year}년</option>
              ))}
            </select>
            <div className="header-time">{new Date().toLocaleString('ko-KR')}</div>
          </div>
        </div>
      </div>

      {/* KPI 요약 - 10개 항목 */}
      <div className="kpi-section">
        <div className="kpi-card" onClick={() => navigate('/personnel')}>
          <div className="kpi-label">내부인력수</div>
          <div className="kpi-value">{dashboardData.personnel.internal}</div>
          <div className="kpi-subtitle">재직중 + 입사예정자</div>
        </div>
        <div className="kpi-card" onClick={() => navigate('/personnel')}>
          <div className="kpi-label">내부인력 퇴사자</div>
          <div className="kpi-value">{dashboardData.personnel.internalResigned}</div>
          <div className="kpi-subtitle">{selectedYear}년 퇴사</div>
        </div>
        <div className="kpi-card" onClick={() => navigate('/external-personnel')}>
          <div className="kpi-label">외주인력수</div>
          <div className="kpi-value">{dashboardData.personnel.externalActive}</div>
          <div className="kpi-subtitle">재직중</div>
        </div>
        <div className="kpi-card" onClick={() => navigate('/budget-dashboard')}>
          <div className="kpi-label">사업예산액</div>
          <div className="kpi-value-small">{formatCurrency(dashboardData.budgets.totalBudget)}</div>
          <div className="kpi-subtitle">자본예산 {selectedYear}년</div>
        </div>
        <div className="kpi-card" onClick={() => navigate('/operating-budget')}>
          <div className="kpi-label">전산운용비</div>
          <div className="kpi-value-small">{formatCurrency(dashboardData.operatingBudgets.totalBudget)}</div>
          <div className="kpi-subtitle">예산액 {selectedYear}년</div>
        </div>
        <div className="kpi-card" onClick={() => navigate('/budget-dashboard')}>
          <div className="kpi-label">확정집행액</div>
          <div className="kpi-value-small">{formatCurrency(dashboardData.budgets.totalExecuted + dashboardData.operatingBudgets.totalExecuted)}</div>
          <div className="kpi-subtitle">{selectedYear}년 자본+운용비</div>
        </div>
        <div className="kpi-card" onClick={() => navigate('/budget-dashboard')}>
          <div className="kpi-label">자본예산 집행율</div>
          <div className="kpi-value">{dashboardData.budgets.executionRate}%</div>
          <div className="kpi-subtitle">{selectedYear}년</div>
        </div>
        <div className="kpi-card" onClick={() => navigate('/operating-budget')}>
          <div className="kpi-label">운용비 집행율</div>
          <div className="kpi-value">{dashboardData.operatingBudgets.executionRate}%</div>
          <div className="kpi-subtitle">{selectedYear}년</div>
        </div>
        <div className="kpi-card" onClick={() => navigate('/project-status')}>
          <div className="kpi-label">진행중 프로젝트</div>
          <div className="kpi-value">{dashboardData.projects.inProgress}</div>
          <div className="kpi-subtitle">{selectedYear}년 프로젝트</div>
        </div>
        <div className="kpi-card" onClick={() => navigate('/project-status')}>
          <div className="kpi-label">이슈 프로젝트</div>
          <div className="kpi-value">{dashboardData.projects.warning + dashboardData.projects.critical}</div>
          <div className="kpi-subtitle">{selectedYear}년 주의+위험</div>
        </div>
        <div className="kpi-card" onClick={() => navigate('/contracts')}>
          <div className="kpi-label">승인 완료 계약</div>
          <div className="kpi-value">{dashboardData.contracts.approved}</div>
          <div className="kpi-subtitle">{selectedYear}년 승인</div>
        </div>
      </div>

      {/* 계약 방식별 분포 & 프로젝트 추진률 및 이슈 현황 */}
      <div className="combined-section">
        {/* 계약 방식별 분포 */}
        <div className="contract-type-section">
          <div className="section-header-main">
            <h2>계약 방식별 분포</h2>
            <button className="view-all-btn" onClick={() => navigate('/contracts')}>
              전체 보기 →
            </button>
          </div>
          <div className="contract-type-container">
            <div className="contract-type-chart-full">
              <Doughnut data={contractMethodData} options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: {
                      color: '#e9ecef',
                      font: {
                        size: 12,
                        weight: '600'
                      },
                      padding: 15,
                      boxWidth: 20,
                      boxHeight: 20
                    }
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        const value = context.parsed || 0;
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                        return `${percentage}% (${value}건)`;
                      }
                    }
                  }
                }
              }} />
            </div>
          </div>
        </div>

        {/* 프로젝트별 추진률 */}
        <div className="project-details-section">
          <div className="section-header-main">
            <h2>프로젝트별 추진률</h2>
            <button className="view-all-btn" onClick={() => navigate('/project-status')}>
              전체 보기 →
            </button>
          </div>
          <div className="project-chart-container">
            {dashboardData.projects.projectList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px', color: '#6c757d' }}>
                등록된 프로젝트가 없습니다.
              </div>
            ) : (
              <Bar data={{
                labels: dashboardData.projects.projectList.slice(0, 10).map(p => p.projectName),
                datasets: [{
                  label: '추진률 (%)',
                  data: dashboardData.projects.projectList.slice(0, 10).map(p => p.progressRate),
                  backgroundColor: dashboardData.projects.projectList.slice(0, 10).map(p => {
                    if (p.healthStatus === '양호') return 'rgba(76, 175, 80, 0.7)';
                    if (p.healthStatus === '주의') return 'rgba(255, 152, 0, 0.7)';
                    return 'rgba(244, 67, 54, 0.7)';
                  }),
                  borderColor: dashboardData.projects.projectList.slice(0, 10).map(p => {
                    if (p.healthStatus === '양호') return '#4CAF50';
                    if (p.healthStatus === '주의') return '#FF9800';
                    return '#F44336';
                  }),
                  borderWidth: 2,
                  borderRadius: 4
                }]
              }} options={{
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        const project = dashboardData.projects.projectList[context.dataIndex];
                        return [
                          `추진률: ${context.parsed.x}%`,
                          `건강도: ${project.healthStatus}`,
                          `이슈: ${project.issues}`
                        ];
                      }
                    },
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#ffffff',
                    bodyColor: '#e9ecef',
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: false
                  }
                },
                scales: {
                  x: {
                    beginAtZero: true,
                    max: 100,
                    grid: {
                      color: 'rgba(255, 255, 255, 0.05)'
                    },
                    ticks: {
                      color: '#adb5bd',
                      font: {
                        size: 11
                      },
                      callback: function(value) {
                        return value + '%';
                      }
                    }
                  },
                  y: {
                    grid: {
                      display: false
                    },
                    ticks: {
                      color: '#e9ecef',
                      font: {
                        size: 11,
                        weight: '500'
                      },
                      autoSkip: false
                    }
                  }
                }
              }} />
            )}
          </div>
          {dashboardData.projects.projectList.length > 10 && (
            <div className="chart-footer">
              외 {dashboardData.projects.projectList.length - 10}개 프로젝트
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default OverallDashboard;
