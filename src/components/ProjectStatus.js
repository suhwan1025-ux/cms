import React, { useState, useEffect } from 'react';
import { getApiUrl } from '../config/api';
import { generatePreviewHTML } from '../utils/previewGenerator';
import './ProjectStatus.css';

const API_BASE_URL = getApiUrl();

const ProjectStatus = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState('all');
  const [showProjectListModal, setShowProjectListModal] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [selectedProjectForIssue, setSelectedProjectForIssue] = useState(null);
  const [showProposalsModal, setShowProposalsModal] = useState(false);
  const [selectedProjectForProposals, setSelectedProjectForProposals] = useState(null);
  const [proposals, setProposals] = useState([]);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/projects`);
      if (!response.ok) throw new Error('프로젝트 데이터 조회 실패');
      
      const data = await response.json();
      
      // snake_case → camelCase 변환
      const convertedData = data.map(item => ({
        id: item.id,
        projectCode: item.project_code,
        businessBudgetId: item.business_budget_id,
        projectName: item.project_name,
        budgetYear: item.budget_year,
        initiatorDepartment: item.initiator_department,
        executorDepartment: item.executor_department,
        budgetAmount: item.budget_amount,
        executedAmount: item.executed_amount,
        isItCommittee: item.is_it_committee,
        status: item.status,
        progressRate: item.progress_rate,
        healthStatus: item.health_status,
        startDate: item.start_date,
        deadline: item.deadline,
        pm: item.pm,
        issues: item.issues,
        sharedFolderPath: item.shared_folder_path
      }));
      
      setProjects(convertedData);
    } catch (error) {
      console.error('프로젝트 조회 오류:', error);
      alert('프로젝트 데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 프로젝트 관련 결재완료 품의서 조회
  const fetchProposalsByProject = async (businessBudgetId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/proposals/by-budget/${businessBudgetId}?status=approved`);
      if (!response.ok) throw new Error('품의서 조회 실패');
      const data = await response.json();
      setProposals(data);
    } catch (error) {
      console.error('품의서 조회 오류:', error);
      setProposals([]);
    }
  };

  // 품의서 모달 열기
  const handleOpenProposalsModal = async (project) => {
    setSelectedProjectForProposals(project);
    setShowProposalsModal(true);
    await fetchProposalsByProject(project.businessBudgetId);
  };

  // 품의서 미리보기 열기
  const handleProposalPreview = async (proposalId) => {
    try {
      console.log('품의서 미리보기:', proposalId);
      
      // 상세 데이터 가져오기
      const response = await fetch(`${API_BASE_URL}/api/proposals/${proposalId}`);
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

  // 공유폴더 주소 복사
  const handleCopySharedFolder = async (path) => {
    if (!path) {
      alert('공유폴더 경로가 설정되지 않았습니다.');
      return;
    }
    
    try {
      await navigator.clipboard.writeText(path);
      alert(`✅ 공유폴더 주소가 클립보드에 복사되었습니다!\n\n${path}`);
    } catch (error) {
      console.error('클립보드 복사 실패:', error);
      // Fallback: 텍스트 영역을 이용한 복사
      const textArea = document.createElement('textarea');
      textArea.value = path;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        alert(`✅ 공유폴더 주소가 클립보드에 복사되었습니다!\n\n${path}`);
      } catch (fallbackError) {
        alert(`❌ 클립보드 복사 실패\n\n경로: ${path}\n\n수동으로 복사해주세요.`);
      }
      document.body.removeChild(textArea);
    }
  };

  // 연도 필터
  const currentYear = new Date().getFullYear();
  const years = ['all'];
  for (let i = -3; i <= 3; i++) {
    years.push(currentYear + i);
  }

  // 필터링된 프로젝트
  const filteredProjects = selectedYear === 'all' 
    ? projects 
    : projects.filter(p => p.budgetYear === parseInt(selectedYear));

  // 통계 계산
  const stats = {
    total: filteredProjects.length,
    byStatus: {
      준비중: filteredProjects.filter(p => p.status === '준비중').length,
      진행중: filteredProjects.filter(p => p.status === '진행중').length,
      완료: filteredProjects.filter(p => p.status === '완료').length,
      중단: filteredProjects.filter(p => p.status === '중단').length
    },
    byHealth: {
      양호: filteredProjects.filter(p => p.healthStatus === '양호').length,
      지연: filteredProjects.filter(p => p.healthStatus === '지연').length,
      미흡: filteredProjects.filter(p => p.healthStatus === '미흡').length,
      심각: filteredProjects.filter(p => p.healthStatus === '심각').length
    },
    totalBudget: filteredProjects.reduce((sum, p) => sum + (Number(p.budgetAmount) || 0), 0),
    totalExecuted: filteredProjects.reduce((sum, p) => sum + (Number(p.executedAmount) || 0), 0),
    averageProgress: filteredProjects.length > 0
      ? (filteredProjects.reduce((sum, p) => sum + (Number(p.progressRate) || 0), 0) / filteredProjects.length).toFixed(1)
      : 0
  };

  // 주의 필요 프로젝트 (건강도: 지연/미흡/심각)
  const attentionProjects = filteredProjects.filter(p => 
    p.healthStatus === '지연' || p.healthStatus === '미흡' || p.healthStatus === '심각'
  ).sort((a, b) => {
    // 심각 → 미흡 → 지연 순으로 정렬
    const order = { '심각': 1, '미흡': 2, '지연': 3 };
    return order[a.healthStatus] - order[b.healthStatus];
  });

  // 부서별 프로젝트 수
  const departmentStats = filteredProjects.reduce((acc, p) => {
    const dept = p.executorDepartment || '미지정';
    acc[dept] = (acc[dept] || 0) + 1;
    return acc;
  }, {});

  const formatCurrency = (amount) => {
    if (!amount) return '0백만원';
    const million = (amount / 1000000);
    return million >= 1 
      ? `${million.toLocaleString(undefined, {maximumFractionDigits: 1})}백만원`
      : `${million.toFixed(2)}백만원`;
  };

  if (loading) return <div className="project-status loading">로딩 중...</div>;

  return (
    <div className="project-status">
      <div className="page-header">
        <h1>📊 프로젝트 현황</h1>
        <p>전체 프로젝트 통계 및 위험 관리</p>
      </div>

      {/* 연도 선택 */}
      <div className="year-selector">
        <label>조회 연도:</label>
        <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
          {years.map(year => (
            <option key={year} value={year}>
              {year === 'all' ? '전체 연도' : `${year}년`}
            </option>
          ))}
        </select>
      </div>

      {/* 전체 통계 카드 */}
      <div className="stats-grid">
        <div className="stat-card primary clickable" onClick={() => setShowProjectListModal(true)}>
          <div className="stat-icon">📁</div>
          <div className="stat-content">
            <div className="stat-label">전체 프로젝트</div>
            <div className="stat-value">{stats.total}건</div>
            <div className="stat-hint">클릭하여 전체 목록 보기</div>
          </div>
        </div>
        
        <div className="stat-card success">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <div className="stat-label">총 예산</div>
            <div className="stat-value">{formatCurrency(stats.totalBudget)}</div>
          </div>
        </div>
        
        <div className="stat-card info">
          <div className="stat-icon">💵</div>
          <div className="stat-content">
            <div className="stat-label">총 확정집행액</div>
            <div className="stat-value">{formatCurrency(stats.totalExecuted)}</div>
            <div className="stat-extra">
              {stats.totalBudget > 0 ? 
                `집행률 ${((stats.totalExecuted / stats.totalBudget) * 100).toFixed(1)}%` 
                : ''}
            </div>
          </div>
        </div>
        
        <div className="stat-card warning">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <div className="stat-label">평균 추진률</div>
            <div className="stat-value">{stats.averageProgress}%</div>
          </div>
        </div>
      </div>

      {/* 주의 필요 프로젝트 알림 */}
      {attentionProjects.length > 0 && (
        <div className="alert-section">
          <h2>⚠️ 주의 필요 프로젝트</h2>
          <div className="alert-single">
            <div className="alert-card attention">
              <div className="alert-header">
                <span className="alert-icon">🚨</span>
                <h3>건강도 주의 프로젝트</h3>
                <span className="alert-count">{attentionProjects.length}건</span>
              </div>
              <div className="alert-stats">
                <span className="stat-item critical">🔴 심각 {attentionProjects.filter(p => p.healthStatus === '심각').length}건</span>
                <span className="stat-item warning">🟠 미흡 {attentionProjects.filter(p => p.healthStatus === '미흡').length}건</span>
                <span className="stat-item caution">🟡 지연 {attentionProjects.filter(p => p.healthStatus === '지연').length}건</span>
              </div>
              <div className="alert-list">
                {attentionProjects.slice(0, 10).map(p => {
                  const icon = p.healthStatus === '심각' ? '🔴' : p.healthStatus === '미흡' ? '🟠' : '🟡';
                  return (
                    <div 
                      key={p.id} 
                      className="alert-item clickable-alert" 
                      onClick={() => {
                        setSelectedProjectForIssue(p);
                        setShowIssueModal(true);
                      }}
                      title="클릭하여 이슈사항 확인"
                    >
                      <span className={`health-badge health-${p.healthStatus}`}>
                        {icon} {p.healthStatus}
                      </span>
                      <span className="project-name">{p.projectName}</span>
                      <span className="project-detail">
                        <span className="project-pm">PM: {p.pm || '-'}</span>
                        <span className="project-progress">추진률: {p.progressRate}%</span>
                      </span>
                    </div>
                  );
                })}
                {attentionProjects.length > 10 && (
                  <div className="alert-more">외 {attentionProjects.length - 10}건</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 상태별 통계 */}
      <div className="charts-section">
        <div className="chart-card">
          <h3>프로젝트 상태 분포</h3>
          <div className="status-chart">
            {Object.entries(stats.byStatus).map(([status, count]) => {
              const percentage = stats.total > 0 ? (count / stats.total * 100).toFixed(1) : 0;
              return count > 0 ? (
                <div key={status} className="chart-bar">
                  <div className="chart-label">
                    <span className={`status-badge status-${status}`}>{status}</span>
                    <span className="chart-count">{count}건 ({percentage}%)</span>
                  </div>
                  <div className="chart-progress">
                    <div 
                      className={`chart-fill status-${status}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              ) : null;
            })}
          </div>
        </div>

        <div className="chart-card">
          <h3>건강도 분포</h3>
          <div className="health-chart">
            {Object.entries(stats.byHealth).map(([health, count]) => {
              const percentage = stats.total > 0 ? (count / stats.total * 100).toFixed(1) : 0;
              const icon = health === '양호' ? '🟢' : health === '지연' ? '🟡' : health === '미흡' ? '🟠' : '🔴';
              return count > 0 ? (
                <div key={health} className="chart-bar">
                  <div className="chart-label">
                    <span className={`health-badge health-${health}`}>{icon} {health}</span>
                    <span className="chart-count">{count}건 ({percentage}%)</span>
                  </div>
                  <div className="chart-progress">
                    <div 
                      className={`chart-fill health-${health}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              ) : null;
            })}
          </div>
        </div>
      </div>

      {/* 부서별 현황 */}
      <div className="department-section">
        <h3>부서별 프로젝트 현황</h3>
        <div className="department-grid">
          {Object.entries(departmentStats)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([dept, count]) => (
              <div key={dept} className="department-card">
                <div className="department-name">{dept}</div>
                <div className="department-count">{count}건</div>
              </div>
            ))}
        </div>
      </div>

      {/* 빠른 통계 */}
      <div className="quick-stats">
        <div className="quick-stat">
          <span className="quick-label">전산운영위 안건</span>
          <span className="quick-value">
            {filteredProjects.filter(p => p.isItCommittee).length}건
          </span>
        </div>
        <div className="quick-stat">
          <span className="quick-label">완료율</span>
          <span className="quick-value">
            {stats.total > 0 ? ((stats.byStatus.완료 / stats.total) * 100).toFixed(1) : 0}%
          </span>
        </div>
        <div className="quick-stat">
          <span className="quick-label">주의 필요 프로젝트 비율</span>
          <span className="quick-value danger">
            {stats.total > 0 ? ((attentionProjects.length / stats.total) * 100).toFixed(1) : 0}%
          </span>
        </div>
      </div>

      {/* 전체 프로젝트 리스트 모달 */}
      {showProjectListModal && (
        <div className="modal-overlay" onClick={() => setShowProjectListModal(false)}>
          <div className="modal-content project-list-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📁 전체 프로젝트 목록</h2>
              <button className="modal-close" onClick={() => setShowProjectListModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="modal-info">
                <span>총 {filteredProjects.length}개 프로젝트</span>
                {selectedYear !== 'all' && <span className="filter-tag">📅 {selectedYear}년</span>}
              </div>
              
              <div className="project-table-container">
                <table className="project-table">
                  <thead>
                    <tr>
                      <th>코드</th>
                      <th>프로젝트명</th>
                      <th>연도</th>
                      <th>추진부서</th>
                      <th style={{ textAlign: 'center' }}>상태</th>
                      <th style={{ textAlign: 'center' }}>건강도</th>
                      <th style={{ textAlign: 'center' }}>추진률</th>
                      <th style={{ textAlign: 'center' }}>예산</th>
                      <th style={{ textAlign: 'center' }}>확정집행액</th>
                      <th>PM</th>
                      <th style={{ textAlign: 'center' }}>공유폴더</th>
                      <th style={{ textAlign: 'center' }}>품의서</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProjects.length === 0 ? (
                      <tr>
                        <td colSpan="12" style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                          프로젝트가 없습니다.
                        </td>
                      </tr>
                    ) : (
                      filteredProjects.map((project) => (
                        <tr key={project.id}>
                          <td className="code-cell">{project.projectCode}</td>
                          <td className="name-cell">{project.projectName}</td>
                          <td>{project.budgetYear}년</td>
                          <td>{project.executorDepartment || '-'}</td>
                          <td style={{ textAlign: 'center' }}>
                            <span className={`status-badge status-${project.status}`}>
                              {project.status}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span className={`health-badge health-${project.healthStatus}`}>
                              {project.healthStatus === '심각' ? '🔴' : 
                               project.healthStatus === '미흡' ? '🟠' : 
                               project.healthStatus === '지연' ? '🟡' : '🟢'} {project.healthStatus || '양호'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <div className="progress-cell">
                              <div className="progress-bar-mini">
                                <div 
                                  className="progress-fill-mini" 
                                  style={{ width: `${project.progressRate || 0}%` }}
                                />
                              </div>
                              <span className="progress-text-mini">{project.progressRate || 0}%</span>
                            </div>
                          </td>
                          <td className="amount-cell">{formatCurrency(project.budgetAmount)}</td>
                          <td className="amount-cell">{formatCurrency(project.executedAmount)}</td>
                          <td>{project.pm || '-'}</td>
                          <td style={{ textAlign: 'center' }}>
                            {project.sharedFolderPath ? (
                              <button 
                                className="btn-link"
                                onClick={() => handleCopySharedFolder(project.sharedFolderPath)}
                                title={project.sharedFolderPath}
                              >
                                복사
                              </button>
                            ) : (
                              <span style={{ color: '#999' }}>-</span>
                            )}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button 
                              className="btn-link"
                              onClick={() => handleOpenProposalsModal(project)}
                            >
                              품의서
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 이슈사항 모달 */}
      {showIssueModal && selectedProjectForIssue && (
        <div className="modal-overlay" onClick={() => setShowIssueModal(false)}>
          <div className="modal-content issue-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>⚠️ 프로젝트 이슈사항</h2>
              <button className="modal-close" onClick={() => setShowIssueModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              {/* 프로젝트 정보 */}
              <div className="issue-project-info">
                <div className="info-row">
                  <span className="info-label">프로젝트 코드</span>
                  <span className="info-value code">{selectedProjectForIssue.projectCode}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">프로젝트명</span>
                  <span className="info-value">{selectedProjectForIssue.projectName}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">건강도</span>
                  <span className="info-value">
                    <span className={`health-badge health-${selectedProjectForIssue.healthStatus}`}>
                      {selectedProjectForIssue.healthStatus === '심각' ? '🔴' : 
                       selectedProjectForIssue.healthStatus === '미흡' ? '🟠' : '🟡'} {selectedProjectForIssue.healthStatus}
                    </span>
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">추진률</span>
                  <span className="info-value">
                    <div className="progress-cell">
                      <div className="progress-bar-large">
                        <div 
                          className="progress-fill-large" 
                          style={{ width: `${selectedProjectForIssue.progressRate || 0}%` }}
                        />
                      </div>
                      <span className="progress-text-large">{selectedProjectForIssue.progressRate || 0}%</span>
                    </div>
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">PM</span>
                  <span className="info-value">{selectedProjectForIssue.pm || '-'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">시작일</span>
                  <span className="info-value">{selectedProjectForIssue.startDate || '-'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">완료기한</span>
                  <span className="info-value">{selectedProjectForIssue.deadline || '-'}</span>
                </div>
              </div>

              {/* 이슈사항 */}
              <div className="issue-content">
                <h3>📋 이슈사항</h3>
                {selectedProjectForIssue.issues ? (
                  <div className="issue-text">
                    {selectedProjectForIssue.issues.split('\n').map((line, index) => (
                      <p key={index}>{line || '\u00A0'}</p>
                    ))}
                  </div>
                ) : (
                  <div className="no-issue">
                    <span className="no-issue-icon">✅</span>
                    <p>현재 등록된 이슈사항이 없습니다.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 품의서 목록 모달 */}
      {showProposalsModal && selectedProjectForProposals && (
        <div className="modal-overlay" onClick={() => setShowProposalsModal(false)}>
          <div className="modal-content proposals-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📄 결재완료 품의서 목록</h2>
              <button className="modal-close" onClick={() => setShowProposalsModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              {/* 프로젝트 정보 */}
              <div className="proposals-project-info">
                <div className="info-row">
                  <span className="info-label">프로젝트</span>
                  <span className="info-value">{selectedProjectForProposals.projectName}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">프로젝트 코드</span>
                  <span className="info-value code">{selectedProjectForProposals.projectCode}</span>
                </div>
              </div>

              {/* 품의서 목록 */}
              <div className="proposals-list">
                <h3>📋 결재완료 품의서 ({proposals.length}건)</h3>
                {proposals.length === 0 ? (
                  <div className="no-proposals">
                    <span className="no-proposals-icon">📭</span>
                    <p>해당 프로젝트와 관련된 결재완료 품의서가 없습니다.</p>
                  </div>
                ) : (
                  <div className="proposals-table-container">
                    <table className="proposals-table">
                      <thead>
                        <tr>
                          <th>계약유형</th>
                          <th>제목</th>
                          <th>목적</th>
                          <th>총계약금(백만원)</th>
                          <th>결재일</th>
                          <th>작성자</th>
                        </tr>
                      </thead>
                      <tbody>
                        {proposals.map((proposal) => {
                          // 계약유형 한글 변환
                          const getContractTypeKorean = (type) => {
                            const typeMap = {
                              'purchase': '구매계약',
                              'service': '용역계약',
                              'change': '변경계약',
                              'extension': '연장계약',
                              'bidding': '입찰계약',
                              'freeform': '기타'
                            };
                            return typeMap[type] || type || '-';
                          };

                          // 백만원 단위로 변환
                          const formatMillionWon = (amount) => {
                            if (!amount) return '-';
                            const millionWon = Number(amount) / 1000000;
                            return millionWon.toLocaleString('ko-KR', {
                              minimumFractionDigits: 1,
                              maximumFractionDigits: 1
                            });
                          };

                          return (
                            <tr 
                              key={proposal.id}
                              onClick={() => handleProposalPreview(proposal.id)}
                              style={{ cursor: 'pointer' }}
                              className="proposal-row-clickable"
                            >
                              <td>
                                <span className="contract-type-badge">
                                  {getContractTypeKorean(proposal.contractType)}
                                </span>
                              </td>
                              <td className="proposal-title">{proposal.title}</td>
                              <td className="proposal-purpose">{proposal.purpose || '-'}</td>
                              <td className="amount-cell">
                                {formatMillionWon(proposal.totalAmount)}
                              </td>
                              <td>{proposal.approvalDate ? new Date(proposal.approvalDate).toLocaleDateString('ko-KR') : '-'}</td>
                              <td>{proposal.createdBy || '-'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectStatus;

