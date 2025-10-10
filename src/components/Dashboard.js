import React, { useState, useEffect } from 'react';
import { getApiUrl } from '../config/api';

// API 베이스 URL 설정
const API_BASE_URL = getApiUrl();

const Dashboard = () => {
  const [stats, setStats] = useState({
    approvedProposals: 0,
    draftProposals: 0
  });

  const [recentProposals, setRecentProposals] = useState([]);
  const [monthlyStats, setMonthlyStats] = useState([]);
  const [loading, setLoading] = useState(true);

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
      const draftProposals = proposals.filter(p => p.status === 'draft' || p.isDraft === true);
      
      // 월별 통계 계산 (결재완료일 기준)
      const monthlyData = {};
      approvedProposals.forEach(proposal => {
        if (proposal.approvalDate) {
          const date = new Date(proposal.approvalDate);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          
          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { month: monthKey, count: 0, amount: 0 };
          }
          monthlyData[monthKey].count += 1;
          monthlyData[monthKey].amount += parseFloat(proposal.totalAmount || 0);
        }
      });
      
      // 월별 데이터 정렬 (최근 12개월)
      const sortedMonths = Object.values(monthlyData)
        .sort((a, b) => a.month.localeCompare(b.month))
        .slice(-12); // 최근 12개월만
      
      setStats({
        approvedProposals: approvedProposals.length,
        draftProposals: draftProposals.length
      });
      
      setRecentProposals(approvedProposals.slice(0, 10)); // 최근 10개
      setMonthlyStats(sortedMonths);
      
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
      case 'freeform': return '자유양식';
      default: return type;
    }
  };

  // 월 표시 형식
  const formatMonth = (monthKey) => {
    const [year, month] = monthKey.split('-');
    return `${year}년 ${parseInt(month)}월`;
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
      <h1>계약현황 대시보드</h1>
      
      {/* 통계 카드 */}
      <div className="stats-grid">
        <div className="stat-card approved">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-number">{stats.approvedProposals}</div>
            <div className="stat-label">결재완료 품의서</div>
          </div>
        </div>
        <div className="stat-card draft">
          <div className="stat-icon">📝</div>
          <div className="stat-content">
            <div className="stat-number">{stats.draftProposals}</div>
            <div className="stat-label">작성중</div>
          </div>
        </div>
      </div>

      {/* 월별 결재완료 통계 그래프 */}
      <div className="card">
        <h2>월별 결재완료 품의서 현황</h2>
        <p className="stats-description">최근 12개월간 결재완료된 품의서의 건수와 금액을 보여줍니다.</p>
        {monthlyStats.length > 0 ? (
          <div className="monthly-chart">
            {monthlyStats.map(month => {
              const maxAmount = Math.max(...monthlyStats.map(m => m.amount));
              const maxCount = Math.max(...monthlyStats.map(m => m.count));
              const amountHeight = maxAmount > 0 ? (month.amount / maxAmount) * 100 : 0;
              const countHeight = maxCount > 0 ? (month.count / maxCount) * 100 : 0;
              
              return (
                <div key={month.month} className="month-item">
                  <div className="bar-container">
                    <div 
                      className="bar amount-bar" 
                      style={{ height: `${amountHeight}%` }}
                      title={`${formatCurrency(month.amount)}`}
                    >
                      <span className="bar-value">{formatCurrency(month.amount)}</span>
                    </div>
                  </div>
                  <div className="bar-container">
                    <div 
                      className="bar count-bar" 
                      style={{ height: `${countHeight}%` }}
                      title={`${month.count}건`}
                    >
                      <span className="bar-value">{month.count}건</span>
                    </div>
                  </div>
                  <div className="month-label">{formatMonth(month.month)}</div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
            월별 데이터가 없습니다.
          </div>
        )}
        <div className="chart-legend">
          <div className="legend-item">
            <span className="legend-color amount-color"></span>
            <span>계약금액</span>
          </div>
          <div className="legend-item">
            <span className="legend-color count-color"></span>
            <span>결재건수</span>
          </div>
        </div>
      </div>

      {/* 최근 품의서 현황 */}
      <div className="card">
        <h2>최근 결재완료 품의서</h2>
        <p className="stats-description">최근 결재완료된 품의서 10건을 표시합니다.</p>
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>품의서 제목</th>
                <th>계약 유형</th>
                <th>계약금액</th>
                <th>결재완료일</th>
                <th>작성자</th>
              </tr>
            </thead>
            <tbody>
              {recentProposals.length > 0 ? (
                recentProposals.map(proposal => (
                  <tr key={proposal.id}>
                    <td>{proposal.title || proposal.purpose}</td>
                    <td>
                      <span className="contract-type-badge">
                        {getContractTypeText(proposal.contractType)}
                      </span>
                    </td>
                    <td className="amount-cell">{formatCurrency(proposal.totalAmount)}</td>
                    <td>{proposal.approvalDate ? new Date(proposal.approvalDate).toLocaleDateString('ko-KR') : '-'}</td>
                    <td>{proposal.createdBy || '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', color: '#666', fontStyle: 'italic' }}>
                    결재완료된 품의서가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style jsx="true">{`
        .dashboard h1 {
          margin-bottom: 2rem;
          color: #333;
          font-size: 2rem;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .stat-card {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          padding: 2rem;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        .stat-card.approved {
          border-left: 4px solid #28a745;
        }

        .stat-card.draft {
          border-left: 4px solid #ffc107;
        }

        .stat-icon {
          font-size: 3rem;
          min-width: 60px;
          text-align: center;
        }

        .stat-content {
          flex: 1;
        }

        .stat-number {
          font-size: 2.5rem;
          font-weight: bold;
          color: #333;
          margin-bottom: 0.5rem;
        }

        .stat-label {
          color: #666;
          font-size: 1rem;
          font-weight: 500;
        }

        .card {
          background: white;
          padding: 2rem;
          border-radius: 12px;
          margin-bottom: 2rem;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .card h2 {
          margin-bottom: 0.5rem;
          color: #333;
          font-size: 1.5rem;
        }

        .stats-description {
          color: #666;
          font-size: 0.9rem;
          margin-bottom: 1.5rem;
        }

        .monthly-chart {
          display: flex;
          justify-content: space-around;
          align-items: flex-end;
          height: 350px;
          padding: 1rem;
          background: #f8f9fa;
          border-radius: 8px;
          margin-bottom: 1rem;
          overflow-x: auto;
        }

        .month-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          min-width: 80px;
          flex: 1;
          max-width: 120px;
        }

        .bar-container {
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          height: 250px;
          width: 30px;
          margin: 0 5px;
        }

        .bar {
          width: 100%;
          border-radius: 4px 4px 0 0;
          transition: all 0.3s ease;
          position: relative;
          min-height: 20px;
        }

        .amount-bar {
          background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
        }

        .count-bar {
          background: linear-gradient(180deg, #28a745 0%, #20c997 100%);
        }

        .bar:hover {
          opacity: 0.8;
          transform: scaleY(1.05);
        }

        .bar-value {
          position: absolute;
          top: -25px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 0.7rem;
          font-weight: 600;
          color: #333;
          white-space: nowrap;
          display: none;
        }

        .bar:hover .bar-value {
          display: block;
        }

        .month-label {
          margin-top: 0.5rem;
          font-size: 0.75rem;
          color: #666;
          text-align: center;
          white-space: nowrap;
          font-weight: 500;
        }

        .chart-legend {
          display: flex;
          justify-content: center;
          gap: 2rem;
          padding-top: 1rem;
          border-top: 1px solid #e9ecef;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9rem;
          color: #666;
        }

        .legend-color {
          width: 20px;
          height: 12px;
          border-radius: 2px;
        }

        .amount-color {
          background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
        }

        .count-color {
          background: linear-gradient(90deg, #28a745 0%, #20c997 100%);
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
          padding: 1rem;
          text-align: left;
          border-bottom: 1px solid #e9ecef;
        }

        .table th {
          background: #f8f9fa;
          font-weight: 600;
          color: #333;
          font-size: 0.9rem;
        }

        .table tbody tr:hover {
          background: #f8f9fa;
        }

        .contract-type-badge {
          background: #e9ecef;
          color: #495057;
          padding: 0.35rem 0.75rem;
          border-radius: 12px;
          font-size: 0.85rem;
          font-weight: 500;
          display: inline-block;
        }

        .amount-cell {
          font-weight: 600;
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
          .stats-grid {
            grid-template-columns: 1fr;
          }

          .dashboard h1 {
            font-size: 1.5rem;
          }

          .monthly-chart {
            height: 300px;
            padding: 0.5rem;
          }

          .bar-container {
            height: 200px;
            width: 25px;
          }

          .month-label {
            font-size: 0.7rem;
          }

          .table th,
          .table td {
            padding: 0.5rem;
            font-size: 0.85rem;
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard; 