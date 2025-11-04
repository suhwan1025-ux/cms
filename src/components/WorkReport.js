import React, { useState, useEffect } from 'react';
import { getApiUrl } from '../config/api';
import './WorkReport.css';

const API_BASE_URL = getApiUrl();

const WorkReport = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [periodType, setPeriodType] = useState('week'); // week, month, quarter
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // 현재 날짜 기준으로 기본 기간 설정
  useEffect(() => {
    const today = new Date();
    setEndDate(today.toISOString().split('T')[0]);
    
    // 기본값: 이번 주
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);
    setStartDate(weekAgo.toISOString().split('T')[0]);
  }, []);

  // 기간 유형 변경 시 날짜 자동 설정
  const handlePeriodChange = (type) => {
    setPeriodType(type);
    const today = new Date();
    const end = today.toISOString().split('T')[0];
    let start;

    switch (type) {
      case 'week':
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 7);
        start = weekAgo.toISOString().split('T')[0];
        break;
      case 'month':
        const monthAgo = new Date(today);
        monthAgo.setMonth(today.getMonth() - 1);
        start = monthAgo.toISOString().split('T')[0];
        break;
      case 'quarter':
        const quarterAgo = new Date(today);
        quarterAgo.setMonth(today.getMonth() - 3);
        start = quarterAgo.toISOString().split('T')[0];
        break;
      default:
        start = end;
    }

    setStartDate(start);
    setEndDate(end);
  };

  // 보고서 조회
  const fetchReport = async () => {
    if (!startDate || !endDate) {
      alert('시작일과 종료일을 선택해주세요.');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/api/work-reports?period=${periodType}&startDate=${startDate}&endDate=${endDate}`
      );
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('서버 응답 오류:', response.status, errorData);
        throw new Error(errorData.error || `서버 오류 (${response.status})`);
      }

      const data = await response.json();
      console.log('보고서 데이터:', data);
      setReportData(data);
    } catch (error) {
      console.error('보고서 조회 오류:', error);
      alert(`보고서 조회에 실패했습니다.\n${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 금액 포맷
  const formatAmount = (amount) => {
    return new Intl.NumberFormat('ko-KR').format(Math.round(amount || 0));
  };

  // 계약 유형 한글명
  const getContractTypeName = (type, contractMethod) => {
    const types = {
      'purchase': '구매계약',
      'service': '용역계약',
      'change': '변경계약',
      'extension': '연장계약',
      'bidding': '입찰계약',
      'freeform': '자유양식'
    };
    
    // 자유양식일 때 contractMethod에 템플릿 이름(한글)이 있으면 표시
    if (type === 'freeform' && contractMethod && 
        /[가-힣]/.test(contractMethod) && 
        !contractMethod.includes('_')) {
      return contractMethod;
    }
    
    return types[type] || type;
  };

  // 보고서 출력
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="work-report">
      <div className="report-header no-print">
        <h2>📊 업무보고서</h2>
        <p>결재완료된 품의서를 바탕으로 계약현황 및 사업예산 현황을 요약합니다.</p>
      </div>

      {/* 필터 영역 */}
      <div className="report-filters no-print">
        <div className="filter-section">
          <h3>기간 선택</h3>
          <div className="period-buttons">
            <button
              className={periodType === 'week' ? 'active' : ''}
              onClick={() => handlePeriodChange('week')}
            >
              주간
            </button>
            <button
              className={periodType === 'month' ? 'active' : ''}
              onClick={() => handlePeriodChange('month')}
            >
              월간
            </button>
            <button
              className={periodType === 'quarter' ? 'active' : ''}
              onClick={() => handlePeriodChange('quarter')}
            >
              분기
            </button>
          </div>
        </div>

        <div className="filter-section">
          <h3>날짜 범위</h3>
          <div className="date-inputs">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <span>~</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <div className="filter-actions">
          <button className="btn-search" onClick={fetchReport}>
            🔍 조회
          </button>
          {reportData && (
            <button className="btn-print" onClick={handlePrint}>
              🖨️ 출력
            </button>
          )}
        </div>
      </div>

      {/* 로딩 */}
      {loading && (
        <div className="loading">
          <p>보고서를 생성하고 있습니다...</p>
        </div>
      )}

      {/* 보고서 내용 */}
      {reportData && !loading && (
        <div className="report-content">
          {/* 보고서 헤더 */}
          <div className="report-title">
            <h1>업무 보고서</h1>
            <p className="report-period">
              기간: {reportData.startDate} ~ {reportData.endDate}
              ({periodType === 'week' ? '주간' : periodType === 'month' ? '월간' : '분기'} 보고서)
            </p>
            <p className="report-date">작성일: {new Date().toLocaleDateString('ko-KR')}</p>
          </div>

          {/* 요약 */}
          <div className="report-section">
            <h2>📋 요약</h2>
            <div className="summary-cards">
              <div className="summary-card">
                <div className="card-label">총 계약 건수</div>
                <div className="card-value">{reportData.summary.totalCount} 건</div>
              </div>
              <div className="summary-card">
                <div className="card-label">총 계약 금액</div>
                <div className="card-value">{formatAmount(reportData.summary.totalAmount)} 원</div>
              </div>
              <div className="summary-card">
                <div className="card-label">평균 계약 금액</div>
                <div className="card-value">{formatAmount(reportData.summary.avgAmount)} 원</div>
              </div>
            </div>
          </div>

          {/* 계약 유형별 현황 */}
          <div className="report-section">
            <h2>📊 계약 유형별 현황</h2>
            <table className="report-table">
              <thead>
                <tr>
                  <th>계약 유형</th>
                  <th>건수</th>
                  <th>금액</th>
                  <th>비율</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(reportData.contractTypeStats).map(([type, stats]) => (
                  <tr key={type}>
                    <td>{getContractTypeName(type, stats.contractMethod)}</td>
                    <td>{stats.count} 건</td>
                    <td>{formatAmount(stats.amount)} 원</td>
                    <td>
                      {((stats.amount / reportData.summary.totalAmount) * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th>합계</th>
                  <th>{reportData.summary.totalCount} 건</th>
                  <th>{formatAmount(reportData.summary.totalAmount)} 원</th>
                  <th>100%</th>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* 월별 현황 */}
          {Object.keys(reportData.monthlyStats).length > 0 && (
            <div className="report-section">
              <h2>📅 월별 결재 완료 품의 현황</h2>
              <table className="report-table">
                <thead>
                  <tr>
                    <th>월</th>
                    <th>건수</th>
                    <th>금액</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(reportData.monthlyStats)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([month, stats]) => (
                      <tr key={month}>
                        <td>{month}</td>
                        <td>{stats.count} 건</td>
                        <td>{formatAmount(stats.amount)} 원</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 예산별 집행 현황 */}
          {reportData.budgetStats && Object.keys(reportData.budgetStats).length > 0 && (
            <div className="report-section">
              <h2>💰 예산별 집행 현황 (조회기간 내 사용된 예산만 표시)</h2>
              <table className="report-table">
                <thead>
                  <tr>
                    <th>사업명</th>
                    <th>예산액</th>
                    <th>확정집행액<br/>(조회기간)</th>
                    <th>확정집행액<br/>(누적)</th>
                    <th>집행률 증감<br/>(조회기간)</th>
                    <th>집행률<br/>(누적기준)</th>
                    <th>잔액</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(reportData.budgetStats)
                    .sort(([, a], [, b]) => b.executionAmount - a.executionAmount)
                    .map(([budgetName, stats]) => (
                      <tr key={budgetName}>
                        <td>{budgetName}</td>
                        <td>{formatAmount(stats.budgetAmount)} 원</td>
                        <td>{formatAmount(stats.executionAmount)} 원</td>
                        <td style={{ color: '#0066cc', fontWeight: '600' }}>
                          {formatAmount(stats.confirmedExecutionAmount || 0)} 원
                        </td>
                        <td>
                          <span style={{ 
                            color: stats.executionRateChange > 0 ? '#dc3545' : '#666',
                            fontWeight: stats.executionRateChange > 0 ? '600' : 'normal'
                          }}>
                            {stats.executionRateChange > 0 ? '+' : ''}{stats.executionRateChange?.toFixed(1)}%
                          </span>
                        </td>
                        <td>
                          <span style={{ 
                            color: stats.executionRate > 90 ? '#dc3545' : 
                                   stats.executionRate > 70 ? '#ffc107' : '#28a745',
                            fontWeight: 'bold'
                          }}>
                            {stats.executionRate?.toFixed(1)}%
                          </span>
                        </td>
                        <td>{formatAmount(stats.budgetAmount - stats.confirmedExecutionAmount)} 원</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 부서별 비용귀속 현황 */}
          {Object.keys(reportData.departmentStats).length > 0 && (
            <div className="report-section">
              <h2>🏢 부서별 비용귀속 현황</h2>
              <table className="report-table">
                <thead>
                  <tr>
                    <th>부서</th>
                    <th>건수</th>
                    <th>금액</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(reportData.departmentStats)
                    .sort(([, a], [, b]) => b.amount - a.amount)
                    .map(([dept, stats]) => (
                      <tr key={dept}>
                        <td>{dept}</td>
                        <td>{stats.count} 건</td>
                        <td>{formatAmount(stats.amount)} 원</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 인력현황 증감 */}
          {reportData.personnelStats && reportData.personnelStats.current.total > 0 && (
            <div className="report-section">
              <h2>👥 인력현황 증감</h2>
              
              {/* 전체 인력 증감 요약 */}
              <div className="personnel-summary">
                <div className="personnel-summary-item">
                  <div className="label">기준시점 인원</div>
                  <div className="value">{reportData.personnelStats.previous.total} 명</div>
                </div>
                <div className="personnel-summary-item">
                  <div className="label">현재 인원</div>
                  <div className="value">{reportData.personnelStats.current.total} 명</div>
                </div>
                <div className="personnel-summary-item">
                  <div className="label">증감</div>
                  <div className={`value ${reportData.personnelStats.changes.total > 0 ? 'increase' : reportData.personnelStats.changes.total < 0 ? 'decrease' : ''}`}>
                    {reportData.personnelStats.changes.total > 0 ? '+' : ''}{reportData.personnelStats.changes.total} 명
                  </div>
                </div>
              </div>

              {/* 부서별 인력 증감 */}
              {Object.keys(reportData.personnelStats.current.byDepartment).length > 0 && (
                <div style={{ marginTop: '30px' }}>
                  <h3>부서별 인력 증감</h3>
                  <table className="report-table">
                    <thead>
                      <tr>
                        <th>부서</th>
                        <th>기준시점</th>
                        <th>현재</th>
                        <th>증감</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(reportData.personnelStats.current.byDepartment)
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([dept]) => {
                          const current = reportData.personnelStats.current.byDepartment[dept] || 0;
                          const previous = reportData.personnelStats.previous.byDepartment[dept] || 0;
                          const change = reportData.personnelStats.changes.byDepartment[dept] || 0;
                          
                          return (
                            <tr key={dept}>
                              <td>{dept}</td>
                              <td>{previous} 명</td>
                              <td>{current} 명</td>
                              <td style={{ 
                                color: change > 0 ? '#28a745' : change < 0 ? '#dc3545' : '#666',
                                fontWeight: change !== 0 ? '600' : 'normal'
                              }}>
                                {change > 0 ? '+' : ''}{change} 명
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                    <tfoot>
                      <tr>
                        <th>합계</th>
                        <th>{reportData.personnelStats.previous.total} 명</th>
                        <th>{reportData.personnelStats.current.total} 명</th>
                        <th style={{ 
                          color: reportData.personnelStats.changes.total > 0 ? '#28a745' : 
                                 reportData.personnelStats.changes.total < 0 ? '#dc3545' : '#666',
                          fontWeight: 'bold'
                        }}>
                          {reportData.personnelStats.changes.total > 0 ? '+' : ''}{reportData.personnelStats.changes.total} 명
                        </th>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}

              {/* 외주인력 증감 */}
              {reportData.personnelStats.external && reportData.personnelStats.external.current.total > 0 && (
                <div style={{ marginTop: '30px' }}>
                  <h3>외주인력 증감</h3>
                  
                  {/* 외주인력 전체 요약 */}
                  <div className="personnel-summary" style={{ marginBottom: '20px' }}>
                    <div className="personnel-summary-item">
                      <div className="label">기준시점 외주인원</div>
                      <div className="value">{reportData.personnelStats.external.previous.total} 명</div>
                    </div>
                    <div className="personnel-summary-item">
                      <div className="label">현재 외주인원</div>
                      <div className="value">{reportData.personnelStats.external.current.total} 명</div>
                    </div>
                    <div className="personnel-summary-item">
                      <div className="label">증감</div>
                      <div className={`value ${reportData.personnelStats.external.changes.total > 0 ? 'increase' : reportData.personnelStats.external.changes.total < 0 ? 'decrease' : ''}`}>
                        {reportData.personnelStats.external.changes.total > 0 ? '+' : ''}{reportData.personnelStats.external.changes.total} 명
                      </div>
                    </div>
                  </div>

                  {/* 신규 투입 인력 */}
                  {reportData.personnelStats.external.newPersonnel && reportData.personnelStats.external.newPersonnel.length > 0 && (
                    <div style={{ marginBottom: '30px' }}>
                      <h4 style={{ color: '#28a745', marginBottom: '15px' }}>✅ 신규 투입 인력 ({reportData.personnelStats.external.newPersonnel.length}명)</h4>
                      <table className="report-table">
                        <thead>
                          <tr>
                            <th>성명</th>
                            <th>업무</th>
                            <th>협업팀</th>
                            <th>계약시작일</th>
                            <th>계약종료일</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.personnelStats.external.newPersonnel.map((person, index) => (
                            <tr key={person.id || index}>
                              <td>{person.name}</td>
                              <td>{person.item}</td>
                              <td>{person.requestDepartments}</td>
                              <td>
                                {person.contractPeriodStart 
                                  ? new Date(person.contractPeriodStart).toLocaleDateString('ko-KR')
                                  : '-'
                                }
                              </td>
                              <td>
                                {person.contractPeriodEnd 
                                  ? new Date(person.contractPeriodEnd).toLocaleDateString('ko-KR')
                                  : '진행중'
                                }
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* 계약 종료 인력 */}
                  {reportData.personnelStats.external.endedPersonnel && reportData.personnelStats.external.endedPersonnel.length > 0 && (
                    <div>
                      <h4 style={{ color: '#dc3545', marginBottom: '15px' }}>❌ 계약 종료 인력 ({reportData.personnelStats.external.endedPersonnel.length}명)</h4>
                      <table className="report-table">
                        <thead>
                          <tr>
                            <th>성명</th>
                            <th>업무</th>
                            <th>협업팀</th>
                            <th>계약시작일</th>
                            <th>계약종료일</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.personnelStats.external.endedPersonnel.map((person, index) => (
                            <tr key={person.id || index}>
                              <td>{person.name}</td>
                              <td>{person.item}</td>
                              <td>{person.requestDepartments}</td>
                              <td>
                                {person.contractPeriodStart 
                                  ? new Date(person.contractPeriodStart).toLocaleDateString('ko-KR')
                                  : '-'
                                }
                              </td>
                              <td>
                                {person.contractPeriodEnd 
                                  ? new Date(person.contractPeriodEnd).toLocaleDateString('ko-KR')
                                  : '-'
                                }
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* 증감이 없는 경우 */}
                  {(!reportData.personnelStats.external.newPersonnel || reportData.personnelStats.external.newPersonnel.length === 0) &&
                   (!reportData.personnelStats.external.endedPersonnel || reportData.personnelStats.external.endedPersonnel.length === 0) && (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                      외주인력 증감이 없습니다.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 상세 목록 */}
          <div className="report-section">
            <h2>📝 상세 계약 목록</h2>
            <table className="report-table detailed-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>제목</th>
                  <th>계약유형</th>
                  <th>금액</th>
                  <th>사업예산</th>
                  <th>요청부서</th>
                  <th>작성자</th>
                  <th>작성일</th>
                  <th>결재일</th>
                </tr>
              </thead>
              <tbody>
                {reportData.proposals.map((proposal, index) => (
                  <tr key={proposal.id}>
                    <td>{index + 1}</td>
                    <td>{proposal.title || '제목없음'}</td>
                    <td>{getContractTypeName(proposal.contractType, proposal.contractMethod)}</td>
                    <td>{formatAmount(proposal.totalAmount)} 원</td>
                    <td>{proposal.budgetName}</td>
                    <td>{proposal.requestDepartments.join(', ') || '-'}</td>
                    <td>{proposal.createdBy || '-'}</td>
                    <td>{new Date(proposal.createdAt).toLocaleDateString('ko-KR')}</td>
                    <td>
                      {proposal.approvalDate 
                        ? new Date(proposal.approvalDate).toLocaleDateString('ko-KR')
                        : '-'
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 데이터 없음 */}
      {reportData && !loading && reportData.summary.totalCount === 0 && (
        <div className="no-data">
          <p>선택한 기간에 결재완료된 품의서가 없습니다.</p>
        </div>
      )}
    </div>
  );
};

export default WorkReport;

