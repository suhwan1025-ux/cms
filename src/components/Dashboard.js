import React, { useState, useEffect } from 'react';

// API 베이스 URL 동적 설정
const getApiBaseUrl = () => {
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return `http://${window.location.hostname}:3001`;
  }
  return 'http://localhost:3001';
};

const API_BASE_URL = getApiBaseUrl();

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalProposals: 0,
    draftProposals: 0,
    submittedProposals: 0,
    approvedProposals: 0,
    rejectedProposals: 0,
    totalAmount: 0,
    averageAmount: 0
  });

  const [recentProposals, setRecentProposals] = useState([]);
  const [contractTypeStats, setContractTypeStats] = useState([]);
  const [departmentStats, setDepartmentStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({ key: 'count', direction: 'desc' });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // 품의서 데이터 가져오기
      const response = await fetch(`${API_BASE_URL}/api/proposals`);
      const proposalsData = await response.json();
      
      // API 응답이 배열인지 확인
      const proposals = Array.isArray(proposalsData) ? proposalsData : [];
      console.log('대시보드 proposals 데이터:', proposals);
      
      // 결재완료된 품의서만 필터링
      const approvedProposals = proposals.filter(p => p.status === 'approved');
      
      // 통계 계산 (결재완료된 건만)
      const totalProposals = approvedProposals.length;
      const draftProposals = proposals.filter(p => p.status === 'draft').length;
      const submittedProposals = proposals.filter(p => p.status === 'submitted').length;
      const approvedCount = approvedProposals.length;
      const rejectedProposals = proposals.filter(p => p.status === 'rejected').length;
      
      const totalAmount = approvedProposals.reduce((sum, p) => sum + parseFloat(p.totalAmount || 0), 0);
      const averageAmount = totalProposals > 0 ? totalAmount / totalProposals : 0;
      
      // 계약 유형별 통계 (결재완료된 건만)
      const contractTypeData = approvedProposals.reduce((acc, proposal) => {
        const type = proposal.contractType;
        if (!acc[type]) {
          acc[type] = { type, count: 0, amount: 0 };
        }
        acc[type].count += 1;
        acc[type].amount += parseFloat(proposal.totalAmount || 0);
        return acc;
      }, {});
      
      // 부서별 통계 (비용귀속부서 기준, 결재완료된 건만)
      const departmentData = {};
      approvedProposals.forEach(proposal => {
        if (proposal.costDepartments) {
          proposal.costDepartments.forEach(dept => {
            if (!departmentData[dept.department]) {
              departmentData[dept.department] = { department: dept.department, count: 0, amount: 0 };
            }
            departmentData[dept.department].count += 1;
            departmentData[dept.department].amount += parseFloat(dept.amount || 0);
          });
        }
      });
      
      setStats({
        totalProposals,
        draftProposals,
        submittedProposals,
        approvedProposals: approvedCount,
        rejectedProposals,
        totalAmount,
        averageAmount
      });
      
      setRecentProposals(approvedProposals.slice(0, 5)); // 최근 5개 (결재완료된 것만)
      setContractTypeStats(Object.values(contractTypeData));
      setDepartmentStats(Object.values(departmentData));
      
    } catch (error) {
      console.error('대시보드 데이터 로드 실패:', error);
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

  // 정렬 함수
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // 정렬된 부서 통계
  const sortedDepartmentStats = [...departmentStats].sort((a, b) => {
    if (sortConfig.direction === 'asc') {
      return a[sortConfig.key] - b[sortConfig.key];
    } else {
      return b[sortConfig.key] - a[sortConfig.key];
    }
  });

  // 정렬 아이콘
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return '↕️';
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  if (loading) {
    return (
      <div className="loading">
        <h2>대시보드 데이터를 불러오는 중...</h2>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <h1>대시보드</h1>
      
      {/* 통계 카드 */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">{stats.totalProposals}</div>
          <div className="stat-label">결재완료 품의서 건수</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.draftProposals}</div>
          <div className="stat-label">작성중</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.submittedProposals}</div>
          <div className="stat-label">제출됨</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.approvedProposals}</div>
          <div className="stat-label">승인됨</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.rejectedProposals}</div>
          <div className="stat-label">반려됨</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{formatCurrency(stats.totalAmount)}</div>
          <div className="stat-label">결재완료 총 계약금액</div>
        </div>
      </div>

      {/* 계약 유형별 통계 */}
      <div className="card">
        <h2>계약 유형별 결재완료 현황</h2>
        <p className="stats-description">결재완료된 품의서만 집계한 계약 유형별 통계입니다.</p>
        <div className="contract-type-grid">
          {contractTypeStats.map(type => (
            <div key={type.type} className="contract-type-card">
              <div className="type-header">
                <h4>{getContractTypeText(type.type)}</h4>
                <span className="type-count">{type.count}건</span>
              </div>
              <div className="type-amount">{formatCurrency(type.amount)}</div>
              <div className="type-percentage">
                {Math.round((type.count / stats.totalProposals) * 100)}% 
                ({Math.round((type.amount / stats.totalAmount) * 100)}%)
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 부서별 통계 */}
      <div className="card department-stats">
        <h2>부서별 결재완료 품의서 현황</h2>
        <p className="stats-description">결재완료된 품의서만 집계한 부서별 통계입니다.</p>
        <div className="table-responsive">
          <table className="table department-table">
            <thead>
              <tr>
                <th className="department-col sortable" onClick={() => handleSort('department')}>
                  부서 {getSortIcon('department')}
                </th>
                <th className="count-col sortable" onClick={() => handleSort('count')}>
                  결재완료 건수 {getSortIcon('count')}
                </th>
                <th className="amount-col sortable" onClick={() => handleSort('amount')}>
                  총 금액 {getSortIcon('amount')}
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedDepartmentStats.map(dept => (
                <tr key={dept.department}>
                  <td className="department-col">{dept.department}</td>
                  <td className="count-col">{dept.count}건</td>
                  <td className="amount-col">{formatCurrency(dept.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 최근 품의서 현황 */}
      <div className="card">
        <h2>최근 결재완료 품의서</h2>
        <p className="stats-description">최근 결재완료된 품의서 5건을 표시합니다.</p>
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>품의서 제목</th>
                <th>계약 유형</th>
                <th>계약금액</th>
                <th>상태</th>
                <th>작성자</th>
                <th>작성일</th>
              </tr>
            </thead>
            <tbody>
              {recentProposals.length > 0 ? (
                recentProposals.map(proposal => (
                  <tr key={proposal.id}>
                    <td>{proposal.purpose}</td>
                    <td>
                      <span className="contract-type-badge">
                        {getContractTypeText(proposal.contractType)}
                      </span>
                    </td>
                    <td>{formatCurrency(proposal.totalAmount)}</td>
                    <td>
                      <span 
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(proposal.status) }}
                      >
                        {getStatusText(proposal.status)}
                      </span>
                    </td>
                    <td>{proposal.createdBy}</td>
                    <td>{new Date(proposal.createdAt).toLocaleDateString('ko-KR')}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', color: '#666', fontStyle: 'italic' }}>
                    결재완료된 품의서가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 품의서 상태 분포 */}
      <div className="card">
        <h2>품의서 상태 분포</h2>
        <div className="status-distribution">
          <div className="status-item">
            <div className="status-bar">
              <div 
                className="status-fill draft"
                style={{ width: `${(stats.draftProposals / stats.totalProposals) * 100}%` }}
              ></div>
            </div>
            <div className="status-info">
              <span className="status-label">작성중</span>
              <span className="status-count">{stats.draftProposals}건</span>
              <span className="status-percentage">{Math.round((stats.draftProposals / stats.totalProposals) * 100)}%</span>
            </div>
          </div>
          <div className="status-item">
            <div className="status-bar">
              <div 
                className="status-fill submitted"
                style={{ width: `${(stats.submittedProposals / stats.totalProposals) * 100}%` }}
              ></div>
            </div>
            <div className="status-info">
              <span className="status-label">제출됨</span>
              <span className="status-count">{stats.submittedProposals}건</span>
              <span className="status-percentage">{Math.round((stats.submittedProposals / stats.totalProposals) * 100)}%</span>
            </div>
          </div>
          <div className="status-item">
            <div className="status-bar">
              <div 
                className="status-fill approved"
                style={{ width: `${(stats.approvedProposals / stats.totalProposals) * 100}%` }}
              ></div>
            </div>
            <div className="status-info">
              <span className="status-label">승인됨</span>
              <span className="status-count">{stats.approvedProposals}건</span>
              <span className="status-percentage">{Math.round((stats.approvedProposals / stats.totalProposals) * 100)}%</span>
            </div>
          </div>
          <div className="status-item">
            <div className="status-bar">
              <div 
                className="status-fill rejected"
                style={{ width: `${(stats.rejectedProposals / stats.totalProposals) * 100}%` }}
              ></div>
            </div>
            <div className="status-info">
              <span className="status-label">반려됨</span>
              <span className="status-count">{stats.rejectedProposals}건</span>
              <span className="status-percentage">{Math.round((stats.rejectedProposals / stats.totalProposals) * 100)}%</span>
            </div>
          </div>
        </div>
      </div>

      <style jsx="true">{`
        .dashboard h1 {
          margin-bottom: 2rem;
          color: #333;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .stat-card {
          text-align: center;
          padding: 1.5rem;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .stat-number {
          font-size: 1.8rem;
          font-weight: bold;
          color: #667eea;
          margin-bottom: 0.5rem;
        }

        .stat-label {
          color: #666;
          font-size: 0.9rem;
        }

        .card {
          background: white;
          padding: 1.5rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .card h2 {
          margin-bottom: 1rem;
          color: #333;
        }

        .contract-type-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem;
        }

        .contract-type-card {
          padding: 1rem;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          background: #f8f9fa;
        }

        .type-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .type-header h4 {
          margin: 0;
          color: #333;
        }

        .type-count {
          background: #667eea;
          color: white;
          padding: 0.25rem 0.5rem;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .type-amount {
          font-size: 1.2rem;
          font-weight: bold;
          color: #667eea;
          margin-bottom: 0.5rem;
        }

        .type-percentage {
          font-size: 0.9rem;
          color: #666;
        }

        .table-responsive {
          overflow-x: auto;
        }

        .table {
          width: 100%;
          border-collapse: collapse;
        }

        .table th,
        .table td {
          padding: 0.75rem;
          text-align: left;
          border-bottom: 1px solid #e9ecef;
        }

        .table th {
          background: #f8f9fa;
          font-weight: 600;
          color: #333;
        }

        .status-badge {
          color: white;
          padding: 0.25rem 0.5rem;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .contract-type-badge {
          background: #e9ecef;
          color: #495057;
          padding: 0.25rem 0.5rem;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 500;
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

        .status-distribution {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .status-item {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .status-bar {
          width: 200px;
          height: 20px;
          background: #e9ecef;
          border-radius: 10px;
          overflow: hidden;
        }

        .status-fill {
          height: 100%;
          transition: width 0.3s ease;
        }

        .status-fill.draft {
          background: #ffc107;
        }

        .status-fill.submitted {
          background: #007bff;
        }

        .status-fill.approved {
          background: #28a745;
        }

        .status-fill.rejected {
          background: #dc3545;
        }

        .status-info {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex: 1;
        }

        .status-label {
          font-weight: 500;
          color: #333;
          min-width: 60px;
        }

        .status-count {
          font-weight: bold;
          color: #667eea;
          min-width: 50px;
        }

        .status-percentage {
          color: #666;
          font-size: 0.9rem;
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

        /* 부서별 통계 테이블 스타일 */
        .department-table {
          table-layout: fixed;
        }

        .department-col {
          width: 40%;
          text-align: center;
        }

        .count-col {
          width: 25%;
          text-align: center;
        }

        .amount-col {
          width: 35%;
          text-align: center;
        }

        .sortable {
          cursor: pointer;
          user-select: none;
          transition: background-color 0.2s ease;
        }

        .sortable:hover {
          background-color: #f8f9fa;
        }

        td.department-col {
          font-weight: 500;
          text-align: center;
        }

        td.count-col {
          text-align: center;
          font-weight: 600;
          color: #667eea;
        }

        td.amount-col {
          text-align: center;
          font-weight: 600;
          color: #28a745;
        }

        th.department-col,
        th.count-col,
        th.amount-col {
          text-align: center;
        }

        @media (max-width: 768px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }
          
          .contract-type-grid {
            grid-template-columns: 1fr;
          }
          
          .status-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }
          
          .status-bar {
            width: 100%;
          }
          
          .status-info {
            width: 100%;
            justify-content: space-between;
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard; 