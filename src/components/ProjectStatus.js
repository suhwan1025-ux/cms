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
  const [showBudgetListModal, setShowBudgetListModal] = useState(false);
  const [selectedProjectForBudgets, setSelectedProjectForBudgets] = useState(null);

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
        executionRate: Number(item.execution_rate) || 0,
        healthStatus: item.health_status,
        startDate: item.start_date,
        deadline: item.deadline,
        pm: item.pm,
        issues: item.issues,
        sharedFolderPath: item.shared_folder_path,
        linked_budgets: item.linked_budgets || []
      }));
      
      setProjects(convertedData);
    } catch (error) {
      console.error('프로젝트 조회 오류:', error);
      alert('프로젝트 데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 프로젝트 관련 결재완료 품의서 조회 (모든 연결된 사업예산의 품의서 취합)
  const fetchProposalsByProject = async (project) => {
    try {
      // 모든 연결된 사업예산 ID 수집
      const budgetIds = [];
      const budgetNames = {};
      
      // 단일 사업예산
      if (project.businessBudgetId) {
        budgetIds.push(project.businessBudgetId);
        // 사업예산명 조회
        try {
          const budgetResponse = await fetch(`${API_BASE_URL}/api/business-budgets/${project.businessBudgetId}`);
          if (budgetResponse.ok) {
            const budgetData = await budgetResponse.json();
            budgetNames[project.businessBudgetId] = budgetData.project_name;
          }
        } catch (err) {
          console.error('사업예산 조회 오류:', err);
        }
      }
      
      // 다중 사업예산
      if (project.linked_budgets && project.linked_budgets.length > 0) {
        project.linked_budgets.forEach(budget => {
          if (!budgetIds.includes(budget.id)) {
            budgetIds.push(budget.id);
            budgetNames[budget.id] = budget.project_name;
          }
        });
      }
      
      // 각 사업예산별로 품의서 조회
      const allProposals = [];
      for (const budgetId of budgetIds) {
        try {
          const response = await fetch(`${API_BASE_URL}/api/proposals/by-budget/${budgetId}?status=approved`);
          if (response.ok) {
            const data = await response.json();
            // 각 품의서에 사업예산명 추가
            data.forEach(proposal => {
              allProposals.push({
                ...proposal,
                budgetName: budgetNames[budgetId] || '-'
              });
            });
          }
        } catch (err) {
          console.error(`사업예산 ${budgetId} 품의서 조회 오류:`, err);
        }
      }
      
      // 결재일자 기준으로 정렬 (최신순)
      allProposals.sort((a, b) => {
        if (!a.approvalDate) return 1;
        if (!b.approvalDate) return -1;
        return new Date(b.approvalDate) - new Date(a.approvalDate);
      });
      
      setProposals(allProposals);
    } catch (error) {
      console.error('품의서 조회 오류:', error);
      setProposals([]);
    }
  };

  // 품의서 모달 열기
  const handleOpenProposalsModal = async (project) => {
    setSelectedProjectForProposals(project);
    setShowProposalsModal(true);
    await fetchProposalsByProject(project);
  };

  // 프로젝트 상세 모달 열기
  const handleShowIssueModal = (project) => {
    setSelectedProjectForIssue(project);
    setShowIssueModal(true);
  };

  // 관련예산 모달 열기
  const handleShowBudgetList = async (project) => {
    // 단일예산인 경우 사업예산 정보를 가져와서 linked_budgets 형태로 만들기
    if ((!project.linked_budgets || project.linked_budgets.length === 0) && project.businessBudgetId) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/business-budgets/${project.businessBudgetId}`);
        if (response.ok) {
          const budgetData = await response.json();
          project.linked_budgets = [{
            id: budgetData.id,
            project_name: budgetData.project_name,
            budget_amount: budgetData.budget_amount,
            executed_amount: budgetData.executed_amount
          }];
        }
      } catch (error) {
        console.error('사업예산 조회 오류:', error);
      }
    }
    
    setSelectedProjectForBudgets(project);
    setShowBudgetListModal(true);
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
      우수: filteredProjects.filter(p => p.healthStatus === '우수').length,
      양호: filteredProjects.filter(p => p.healthStatus === '양호' || !p.healthStatus).length,
      지연: filteredProjects.filter(p => p.healthStatus === '지연').length,
      미흡: filteredProjects.filter(p => p.healthStatus === '미흡').length,
      위험: filteredProjects.filter(p => p.healthStatus === '위험').length,
      심각: filteredProjects.filter(p => p.healthStatus === '심각').length
    },
    totalBudget: filteredProjects.reduce((sum, p) => sum + (Number(p.budgetAmount) || 0), 0),
    totalExecuted: filteredProjects.reduce((sum, p) => sum + (Number(p.executedAmount) || 0), 0),
    averageProgress: filteredProjects.length > 0
      ? (filteredProjects.reduce((sum, p) => sum + (Number(p.progressRate) || 0), 0) / filteredProjects.length).toFixed(1)
      : 0
  };

  // 주의 필요 프로젝트 (건강도: 지연/미흡/위험/심각)
  const attentionProjects = filteredProjects.filter(p => 
    p.healthStatus === '지연' || p.healthStatus === '미흡' || p.healthStatus === '위험' || p.healthStatus === '심각'
  ).sort((a, b) => {
    // 심각 → 위험 → 미흡 → 지연 순으로 정렬
    const order = { '심각': 1, '위험': 2, '미흡': 3, '지연': 4 };
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
                <span className="stat-item risk">🟣 위험 {attentionProjects.filter(p => p.healthStatus === '위험').length}건</span>
                <span className="stat-item warning">🟠 미흡 {attentionProjects.filter(p => p.healthStatus === '미흡').length}건</span>
                <span className="stat-item caution">🟡 지연 {attentionProjects.filter(p => p.healthStatus === '지연').length}건</span>
              </div>
              <div className="alert-list">
                {attentionProjects.slice(0, 10).map(p => {
                  const icon = p.healthStatus === '심각' ? '🔴' : 
                               p.healthStatus === '위험' ? '🟣' : 
                               p.healthStatus === '미흡' ? '🟠' : '🟡';
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
              const healthInfo = {
                '우수': { icon: '🔵', color: '#2196F3' },
                '양호': { icon: '🟢', color: '#4CAF50' },
                '지연': { icon: '🟡', color: '#FFC107' },
                '미흡': { icon: '🟠', color: '#FF9800' },
                '위험': { icon: '🟣', color: '#9C27B0' },
                '심각': { icon: '🔴', color: '#f44336' }
              };
              const info = healthInfo[health] || { icon: '⚪', color: '#999' };
              
              return count > 0 ? (
                <div key={health} className="chart-bar">
                  <div className="chart-label">
                    <span className={`health-badge health-${health}`}>{info.icon} {health}</span>
                    <span className="chart-count">{count}건 ({percentage}%)</span>
                  </div>
                  <div className="chart-progress">
                    <div 
                      className={`chart-fill health-${health}`}
                      style={{ 
                        width: `${percentage}%`,
                        backgroundColor: info.color
                      }}
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
                      <th style={{ textAlign: 'center' }}>전산운영위</th>
                      <th style={{ textAlign: 'center' }}>상태</th>
                      <th style={{ textAlign: 'center' }}>건강도</th>
                      <th style={{ textAlign: 'center' }}>추진률</th>
                      <th style={{ textAlign: 'center' }}>진척률</th>
                      <th>PM</th>
                      <th style={{ textAlign: 'center' }}>공유폴더</th>
                      <th style={{ textAlign: 'center' }}>관련예산</th>
                      <th style={{ textAlign: 'center' }}>품의서</th>
                      <th style={{ textAlign: 'center' }}>자세히보기</th>
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
                          <td style={{ textAlign: 'center' }}>
                            {project.isItCommittee ? '✅' : ''}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span className={`status-badge status-${project.status}`}>
                              {project.status}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span className={`health-badge health-${project.healthStatus}`}>
                              {project.healthStatus === '심각' ? '🔴' : 
                               project.healthStatus === '위험' ? '🟣' :
                               project.healthStatus === '미흡' ? '🟠' : 
                               project.healthStatus === '지연' ? '🟡' : 
                               project.healthStatus === '우수' ? '🔵' : '🟢'} {project.healthStatus || '양호'}
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
                          <td style={{ textAlign: 'center' }}>
                            <div className="progress-cell">
                              <div className="progress-bar-mini">
                                <div 
                                  className="progress-fill-mini" 
                                  style={{ 
                                    width: `${Number(project.executionRate) || 0}%`,
                                    backgroundColor: (Number(project.executionRate) || 0) >= 80 ? '#f44336' : (Number(project.executionRate) || 0) >= 50 ? '#ff9800' : '#4CAF50'
                                  }}
                                />
                              </div>
                              <span className="progress-text-mini">{Number(project.executionRate || 0).toFixed(1)}%</span>
                            </div>
                          </td>
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
                            {(() => {
                              const budgetCount = project.linked_budgets && project.linked_budgets.length > 0 
                                ? project.linked_budgets.length 
                                : project.businessBudgetId ? 1 : 0;
                              
                              if (budgetCount > 0) {
                                return (
                                  <button
                                    className="btn-link"
                                    onClick={() => handleShowBudgetList(project)}
                                    style={{ fontWeight: '600' }}
                                  >
                                    보기({budgetCount}개)
                                  </button>
                                );
                              } else {
                                return <span style={{ color: '#999' }}>-</span>;
                              }
                            })()}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button 
                              className="btn-link"
                              onClick={() => handleOpenProposalsModal(project)}
                            >
                              품의서
                            </button>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button 
                              className="btn-link"
                              onClick={() => handleShowIssueModal(project)}
                            >
                              상세
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
              <h2>📋 프로젝트 상세정보</h2>
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
                  <span className="info-label">상태</span>
                  <span className="info-value">
                    <span className={`status-badge status-${selectedProjectForIssue.status}`}>
                      {selectedProjectForIssue.status}
                    </span>
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">건강도</span>
                  <span className="info-value">
                    <span className={`health-badge health-${selectedProjectForIssue.healthStatus}`}>
                      {selectedProjectForIssue.healthStatus === '심각' ? '🔴' : 
                       selectedProjectForIssue.healthStatus === '위험' ? '🟣' :
                       selectedProjectForIssue.healthStatus === '미흡' ? '🟠' : 
                       selectedProjectForIssue.healthStatus === '지연' ? '🟡' :
                       selectedProjectForIssue.healthStatus === '우수' ? '🔵' : '🟢'} {selectedProjectForIssue.healthStatus || '양호'}
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
                  <span className="info-label">진척률</span>
                  <span className="info-value">
                    <div className="progress-cell">
                      <div className="progress-bar-large">
                        <div 
                          className="progress-fill-large" 
                          style={{ 
                            width: `${Number(selectedProjectForIssue.executionRate) || 0}%`,
                            backgroundColor: (Number(selectedProjectForIssue.executionRate) || 0) >= 80 ? '#f44336' : (Number(selectedProjectForIssue.executionRate) || 0) >= 50 ? '#ff9800' : '#4CAF50'
                          }}
                        />
                      </div>
                      <span className="progress-text-large">{Number(selectedProjectForIssue.executionRate || 0).toFixed(1)}%</span>
                    </div>
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">예산</span>
                  <span className="info-value">{formatCurrency(selectedProjectForIssue.budgetAmount)}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">확정집행액</span>
                  <span className="info-value">{formatCurrency(selectedProjectForIssue.executedAmount)}</span>
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
                <div className="info-row">
                  <span className="info-label">연결된 사업예산</span>
                  <span className="info-value">
                    <span style={{ 
                      display: 'inline-block',
                      padding: '4px 10px',
                      backgroundColor: '#4CAF50',
                      color: 'white',
                      borderRadius: '12px',
                      fontSize: '13px',
                      fontWeight: '600'
                    }}>
                      {(() => {
                        const budgetCount = selectedProjectForProposals.linked_budgets && selectedProjectForProposals.linked_budgets.length > 0 
                          ? selectedProjectForProposals.linked_budgets.length 
                          : selectedProjectForProposals.businessBudgetId ? 1 : 0;
                        return `${budgetCount}개`;
                      })()}
                    </span>
                  </span>
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
                          <th style={{ width: '30%' }}>사업예산</th>
                          <th style={{ width: '50%' }}>품의서명</th>
                          <th style={{ width: '20%' }}>작성자</th>
                        </tr>
                      </thead>
                      <tbody>
                        {proposals.map((proposal) => {
                          return (
                            <tr 
                              key={proposal.id}
                              onClick={() => handleProposalPreview(proposal.id)}
                              style={{ cursor: 'pointer' }}
                              className="proposal-row-clickable"
                            >
                              <td style={{ 
                                fontWeight: '600',
                                color: '#667eea',
                                fontSize: '14px'
                              }}>
                                {proposal.budgetName || '-'}
                              </td>
                              <td className="proposal-title" style={{ 
                                fontSize: '14px',
                                color: '#333'
                              }}>
                                {proposal.title}
                              </td>
                              <td style={{ 
                                textAlign: 'center',
                                fontSize: '14px',
                                color: '#666'
                              }}>
                                {proposal.createdBy || '-'}
                              </td>
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

      {/* 관련예산 목록 모달 */}
      {showBudgetListModal && selectedProjectForBudgets && (
        <div className="modal-overlay" onClick={() => setShowBudgetListModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '1000px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header" style={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              padding: '25px 30px',
              borderRadius: '8px 8px 0 0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '600', color: 'white' }}>
                    📎 관련 사업예산 목록
                  </h2>
                  <p style={{ margin: '8px 0 0 0', fontSize: '14px', opacity: 0.9, color: 'white' }}>
                    이 프로젝트에 연결된 사업예산들을 확인하세요
                  </p>
                </div>
                <button 
                  className="modal-close" 
                  onClick={() => setShowBudgetListModal(false)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    border: 'none',
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    fontSize: '20px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.3)'}
                  onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="modal-body" style={{ flex: 1, overflowY: 'auto', padding: '30px' }}>
              {/* 프로젝트 정보 카드 */}
              <div style={{ 
                marginBottom: '30px', 
                padding: '20px 25px',
                background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)',
                borderRadius: '8px',
                border: '1px solid #e0e0e0'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                  <div>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: '#333', marginBottom: '8px' }}>
                      {selectedProjectForBudgets.projectName}
                    </div>
                    <div style={{ fontSize: '13px', color: '#666', display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <span style={{ 
                        display: 'inline-block',
                        padding: '4px 10px',
                        backgroundColor: '#667eea',
                        color: 'white',
                        borderRadius: '4px',
                        fontWeight: '500',
                        fontSize: '12px'
                      }}>
                        {selectedProjectForBudgets.projectCode}
                      </span>
                      <span>📅 {selectedProjectForBudgets.budgetYear}년</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>총 예산 / 집행</div>
                    <div style={{ fontSize: '18px', fontWeight: '600', color: '#667eea' }}>
                      {formatCurrency(selectedProjectForBudgets.budgetAmount)}
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: '500', color: '#764ba2' }}>
                      {formatCurrency(selectedProjectForBudgets.executedAmount)}
                    </div>
                  </div>
                </div>
              </div>

              {selectedProjectForBudgets.linked_budgets && selectedProjectForBudgets.linked_budgets.length > 0 ? (
                <div>
                  <div style={{ 
                    fontSize: '15px', 
                    fontWeight: '600', 
                    marginBottom: '20px', 
                    color: '#333',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '6px 14px',
                      backgroundColor: '#4CAF50',
                      color: 'white',
                      borderRadius: '20px',
                      fontSize: '13px',
                      fontWeight: '600'
                    }}>
                      {selectedProjectForBudgets.linked_budgets.length}개
                    </span>
                    <span>사업예산이 연결되어 있습니다</span>
                  </div>
                  
                  <div style={{ 
                    borderRadius: '8px', 
                    overflow: 'hidden',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    border: '1px solid #e0e0e0'
                  }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ 
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: 'white'
                        }}>
                          <th style={{ width: '60px', textAlign: 'center', padding: '15px 10px', fontWeight: '600', fontSize: '14px' }}>번호</th>
                          <th style={{ textAlign: 'left', padding: '15px 20px', fontWeight: '600', fontSize: '14px' }}>사업예산명</th>
                          <th style={{ width: '140px', textAlign: 'right', padding: '15px 20px', fontWeight: '600', fontSize: '14px' }}>예산액</th>
                          <th style={{ width: '140px', textAlign: 'right', padding: '15px 20px', fontWeight: '600', fontSize: '14px' }}>집행액</th>
                          <th style={{ width: '100px', textAlign: 'center', padding: '15px 10px', fontWeight: '600', fontSize: '14px' }}>집행률</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedProjectForBudgets.linked_budgets.map((budget, index) => {
                          const executionRate = budget.budget_amount > 0
                            ? ((budget.executed_amount / budget.budget_amount) * 100).toFixed(1)
                            : 0;
                          
                          return (
                            <tr key={budget.id} style={{ 
                              backgroundColor: index % 2 === 0 ? 'white' : '#f9f9f9',
                              transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f0ff'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = index % 2 === 0 ? 'white' : '#f9f9f9'}>
                              <td style={{ textAlign: 'center', padding: '14px 10px', fontSize: '13px', color: '#666', fontWeight: '500' }}>
                                {index + 1}
                              </td>
                              <td style={{ padding: '14px 20px', fontSize: '14px', color: '#333', fontWeight: '500' }}>
                                {budget.project_name}
                              </td>
                              <td style={{ textAlign: 'right', padding: '14px 20px', fontSize: '14px', color: '#555', fontWeight: '500' }}>
                                {formatCurrency(budget.budget_amount)}
                              </td>
                              <td style={{ textAlign: 'right', padding: '14px 20px', fontSize: '14px', color: '#555', fontWeight: '500' }}>
                                {formatCurrency(budget.executed_amount)}
                              </td>
                              <td style={{ textAlign: 'center', padding: '14px 10px' }}>
                                <span style={{ 
                                  display: 'inline-block',
                                  padding: '4px 12px',
                                  borderRadius: '12px',
                                  fontSize: '13px',
                                  fontWeight: '600',
                                  backgroundColor: executionRate >= 80 ? '#ffebee' : executionRate >= 50 ? '#fff3e0' : '#e8f5e9',
                                  color: executionRate >= 80 ? '#d32f2f' : executionRate >= 50 ? '#f57c00' : '#388e3c'
                                }}>
                                  {executionRate}%
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr style={{ 
                          background: 'linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%)',
                          fontWeight: '700',
                          borderTop: '2px solid #667eea'
                        }}>
                          <td colSpan="2" style={{ textAlign: 'right', padding: '16px 20px', fontSize: '15px', color: '#333' }}>
                            💰 합계
                          </td>
                          <td style={{ textAlign: 'right', padding: '16px 20px', fontSize: '15px', color: '#667eea', fontWeight: '700' }}>
                            {formatCurrency(
                              selectedProjectForBudgets.linked_budgets.reduce((sum, b) => 
                                sum + parseFloat(b.budget_amount || 0), 0
                              )
                            )}
                          </td>
                          <td style={{ textAlign: 'right', padding: '16px 20px', fontSize: '15px', color: '#764ba2', fontWeight: '700' }}>
                            {formatCurrency(
                              selectedProjectForBudgets.linked_budgets.reduce((sum, b) => 
                                sum + parseFloat(b.executed_amount || 0), 0
                              )
                            )}
                          </td>
                          <td style={{ textAlign: 'center', padding: '16px 10px' }}>
                            {(() => {
                              const totalBudget = selectedProjectForBudgets.linked_budgets.reduce((sum, b) => 
                                sum + parseFloat(b.budget_amount || 0), 0
                              );
                              const totalExecuted = selectedProjectForBudgets.linked_budgets.reduce((sum, b) => 
                                sum + parseFloat(b.executed_amount || 0), 0
                              );
                              const totalRate = totalBudget > 0 ? ((totalExecuted / totalBudget) * 100).toFixed(1) : 0;
                              return (
                                <span style={{ 
                                  display: 'inline-block',
                                  padding: '6px 14px',
                                  borderRadius: '12px',
                                  fontSize: '14px',
                                  fontWeight: '700',
                                  backgroundColor: totalRate >= 80 ? '#d32f2f' : totalRate >= 50 ? '#f57c00' : '#388e3c',
                                  color: 'white'
                                }}>
                                  {totalRate}%
                                </span>
                              );
                            })()}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              ) : (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '60px 20px', 
                  backgroundColor: '#f9f9f9',
                  borderRadius: '8px',
                  border: '2px dashed #ddd'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '15px', opacity: 0.5 }}>📋</div>
                  <div style={{ fontSize: '18px', marginBottom: '10px', fontWeight: '600', color: '#666' }}>
                    연결된 사업예산이 없습니다
                  </div>
                  <div style={{ fontSize: '14px', color: '#999' }}>
                    단일 사업예산으로 생성된 프로젝트입니다
                  </div>
                </div>
              )}
            </div>
            
            <div className="modal-footer" style={{ 
              padding: '20px 30px',
              borderTop: '1px solid #e0e0e0',
              backgroundColor: '#fafafa'
            }}>
              <button 
                onClick={() => setShowBudgetListModal(false)}
                style={{
                  padding: '12px 30px',
                  fontSize: '14px',
                  fontWeight: '600',
                  backgroundColor: '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 4px rgba(102, 126, 234, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#5568d3';
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 4px 8px rgba(102, 126, 234, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#667eea';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 2px 4px rgba(102, 126, 234, 0.3)';
                }}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectStatus;

