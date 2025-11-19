import React, { useState, useEffect } from 'react';
import { getApiUrl } from '../config/api';
import { getCurrentUser } from '../utils/userHelper';
import './ProjectManagement.css';

const API_BASE_URL = getApiUrl();

const ProjectManagement = () => {
  const [projects, setProjects] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [yearFilter, setYearFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // 편집 폼 데이터
  const [editForm, setEditForm] = useState({
    isItCommittee: false,
    status: '진행중',
    progressRate: 0,
    startDate: '',
    deadline: '',
    pm: '',
    issues: ''
  });

  useEffect(() => {
    fetchProjects();
    fetchBudgets();
  }, []);

  // 프로젝트 목록 조회
  const fetchProjects = async () => {
    try {
      setLoading(true);
      console.log('📊 프로젝트 목록 조회 시작...');
      
      const response = await fetch(`${API_BASE_URL}/api/projects`);
      
      if (!response.ok) {
        throw new Error(`프로젝트 목록 조회 실패 (${response.status})`);
      }
      
      const data = await response.json();
      console.log('   ✅ 프로젝트 수신:', data.length, '개');
      
      setProjects(data);
    } catch (error) {
      console.error('❌ 프로젝트 조회 오류:', error);
      alert(`프로젝트 데이터를 불러오는 중 오류가 발생했습니다.\n\n${error.message}`);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  // 사업예산 목록 조회
  const fetchBudgets = async () => {
    try {
      console.log('📊 사업예산 목록 조회 시작...');
      
      const response = await fetch(`${API_BASE_URL}/api/business-budgets`);
      
      if (!response.ok) {
        throw new Error(`사업예산 목록 조회 실패 (${response.status})`);
      }
      
      const data = await response.json();
      console.log('   ✅ 사업예산 수신:', data.length, '개');
      
      // snake_case를 camelCase로 변환
      const convertedData = data.map(item => ({
        id: item.id,
        projectName: item.project_name,
        budgetYear: item.budget_year,
        budgetAmount: item.budget_amount,
        executedAmount: item.executed_amount,
        initiatorDepartment: item.initiator_department,
        executorDepartment: item.executor_department,
        startDate: item.start_date,
        endDate: item.end_date
      }));
      
      setBudgets(convertedData);
    } catch (error) {
      console.error('❌ 사업예산 조회 오류:', error);
    }
  };

  // 사업예산을 프로젝트로 추가
  const handleAddProjectFromBudget = async (budgetId) => {
    try {
      const user = await getCurrentUser();
      
      const response = await fetch(`${API_BASE_URL}/api/projects/from-budget/${budgetId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          createdBy: user.name
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || '프로젝트 생성 실패');
      }
      
      alert(`✅ ${result.message}`);
      setShowBudgetModal(false);
      fetchProjects();
    } catch (error) {
      console.error('프로젝트 생성 오류:', error);
      alert(`프로젝트 생성 중 오류가 발생했습니다.\n\n${error.message}`);
    }
  };

  // 프로젝트 편집 모달 열기
  const handleEditProject = (project) => {
    setSelectedProject(project);
    setEditForm({
      isItCommittee: project.is_it_committee || false,
      status: project.status || '진행중',
      progressRate: project.progress_rate || 0,
      startDate: project.start_date || '',
      deadline: project.deadline || '',
      pm: project.pm || '',
      issues: project.issues || ''
    });
    setShowEditModal(true);
  };

  // 프로젝트 수정 저장
  const handleSaveProject = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/projects/${selectedProject.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          is_it_committee: editForm.isItCommittee,
          status: editForm.status,
          progress_rate: editForm.progressRate,
          start_date: editForm.startDate || null,
          deadline: editForm.deadline || null,
          pm: editForm.pm,
          issues: editForm.issues
        })
      });
      
      if (!response.ok) {
        throw new Error('프로젝트 수정 실패');
      }
      
      alert('✅ 프로젝트가 수정되었습니다!');
      setShowEditModal(false);
      fetchProjects();
    } catch (error) {
      console.error('프로젝트 수정 오류:', error);
      alert(`프로젝트 수정 중 오류가 발생했습니다.\n\n${error.message}`);
    }
  };

  // 프로젝트 삭제
  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('정말 이 프로젝트를 삭제하시겠습니까?')) {
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('프로젝트 삭제 실패');
      }
      
      alert('✅ 프로젝트가 삭제되었습니다!');
      fetchProjects();
    } catch (error) {
      console.error('프로젝트 삭제 오류:', error);
      alert(`프로젝트 삭제 중 오류가 발생했습니다.\n\n${error.message}`);
    }
  };

  // 필터링된 프로젝트 목록
  const filteredProjects = projects.filter(project => {
    if (yearFilter !== 'all' && project.budget_year !== parseInt(yearFilter)) {
      return false;
    }
    if (statusFilter !== 'all' && project.status !== statusFilter) {
      return false;
    }
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        (project.project_name && project.project_name.toLowerCase().includes(search)) ||
        (project.project_code && project.project_code.toLowerCase().includes(search)) ||
        (project.pm && project.pm.toLowerCase().includes(search))
      );
    }
    return true;
  });

  // 연도 목록
  const years = ['all', ...new Set(projects.map(p => p.budget_year))].filter(Boolean);

  // 통계
  const totalProjects = filteredProjects.length;
  const totalBudget = filteredProjects.reduce((sum, p) => sum + (p.budget_amount || 0), 0);
  const totalExecuted = filteredProjects.reduce((sum, p) => sum + (p.executed_amount || 0), 0);
  const averageProgress = totalProjects > 0 
    ? (filteredProjects.reduce((sum, p) => sum + (p.progress_rate || 0), 0) / totalProjects).toFixed(1) 
    : 0;

  const formatCurrency = (amount) => {
    return amount ? `${(amount / 10000).toLocaleString()}만원` : '0원';
  };

  if (loading) return <div className="project-management loading">로딩 중...</div>;

  return (
    <div className="project-management">
      <div className="page-header">
        <h1>프로젝트 관리</h1>
        <p>사업예산 기반 프로젝트 관리 시스템</p>
      </div>

      {/* 통계 카드 */}
      <div className="statistics">
        <div className="stat-card">
          <div className="stat-label">총 프로젝트 수</div>
          <div className="stat-value">{totalProjects}건</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">총 예산</div>
          <div className="stat-value">{formatCurrency(totalBudget)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">총 집행액</div>
          <div className="stat-value">{formatCurrency(totalExecuted)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">평균 추진률</div>
          <div className="stat-value">{averageProgress}%</div>
        </div>
      </div>

      {/* 필터 및 검색 */}
      <div className="filter-section">
        <div className="filter-group">
          <label>연도</label>
          <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)}>
            {years.map(year => (
              <option key={year} value={year}>
                {year === 'all' ? '전체 연도' : `${year}년`}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>상태</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">전체 상태</option>
            <option value="준비중">준비중</option>
            <option value="진행중">진행중</option>
            <option value="완료">완료</option>
            <option value="중단">중단</option>
          </select>
        </div>
        <div className="search-box">
          <input
            type="text"
            placeholder="프로젝트명, 코드, PM 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="btn-add" onClick={() => setShowBudgetModal(true)}>
          + 프로젝트 추가
        </button>
      </div>

      {/* 프로젝트 테이블 */}
      <div className="table-container">
        <table className="project-table">
          <thead>
            <tr>
              <th>프로젝트 코드</th>
              <th>프로젝트명</th>
              <th>연도</th>
              <th>예산</th>
              <th>집행액</th>
              <th>전산운영위</th>
              <th>상태</th>
              <th>추진률</th>
              <th>시작일</th>
              <th>완료기한</th>
              <th>PM</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {filteredProjects.length === 0 ? (
              <tr>
                <td colSpan="12" style={{ textAlign: 'center', padding: '40px' }}>
                  {loading ? '데이터를 불러오는 중...' : (
                    <div>
                      <div style={{ fontSize: '16px', marginBottom: '10px' }}>
                        📋 등록된 프로젝트가 없습니다.
                      </div>
                      <div style={{ fontSize: '14px', color: '#666' }}>
                        사업예산에서 프로젝트를 추가해주세요.
                      </div>
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              filteredProjects.map((project) => {
                const executionRate = project.budget_amount > 0
                  ? ((project.executed_amount / project.budget_amount) * 100).toFixed(1)
                  : 0;

                return (
                  <tr key={project.id}>
                    <td className="project-code">{project.project_code}</td>
                    <td className="project-name">{project.project_name}</td>
                    <td>{project.budget_year}년</td>
                    <td className="amount">{formatCurrency(project.budget_amount)}</td>
                    <td className="amount">{formatCurrency(project.executed_amount)}</td>
                    <td style={{ textAlign: 'center' }}>
                      {project.is_it_committee ? '✅' : ''}
                    </td>
                    <td>
                      <span className={`status-badge status-${project.status}`}>
                        {project.status}
                      </span>
                    </td>
                    <td>
                      <div className="progress-cell">
                        <div className="progress-bar">
                          <div 
                            className="progress-fill" 
                            style={{ 
                              width: `${Math.min(project.progress_rate || 0, 100)}%`,
                              backgroundColor: '#4CAF50'
                            }}
                          />
                        </div>
                        <span className="progress-text">{project.progress_rate || 0}%</span>
                      </div>
                    </td>
                    <td>{project.start_date || '-'}</td>
                    <td>{project.deadline || '-'}</td>
                    <td>{project.pm || '-'}</td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="btn-edit"
                          onClick={() => handleEditProject(project)}
                        >
                          수정
                        </button>
                        <button 
                          className="btn-delete"
                          onClick={() => handleDeleteProject(project.id)}
                        >
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 사업예산 선택 모달 */}
      {showBudgetModal && (
        <div className="modal-overlay" onClick={() => setShowBudgetModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>사업예산에서 프로젝트 추가</h2>
              <button className="modal-close" onClick={() => setShowBudgetModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="budget-list">
                {budgets.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                    등록된 사업예산이 없습니다.
                  </div>
                ) : (
                  budgets.map((budget) => (
                    <div key={budget.id} className="budget-item">
                      <div className="budget-info">
                        <div className="budget-name">{budget.projectName}</div>
                        <div className="budget-details">
                          {budget.budgetYear}년 | {formatCurrency(budget.budgetAmount)} | {budget.initiatorDepartment}
                        </div>
                      </div>
                      <button 
                        className="btn-select"
                        onClick={() => handleAddProjectFromBudget(budget.id)}
                      >
                        선택
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 프로젝트 편집 모달 */}
      {showEditModal && selectedProject && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content modal-edit" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>프로젝트 수정</h2>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-section">
                <div className="form-row">
                  <div className="form-group full-width">
                    <label>프로젝트 코드</label>
                    <input type="text" value={selectedProject.project_code} disabled />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group full-width">
                    <label>프로젝트명</label>
                    <input type="text" value={selectedProject.project_name} disabled />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>
                      <input
                        type="checkbox"
                        checked={editForm.isItCommittee}
                        onChange={(e) => setEditForm({...editForm, isItCommittee: e.target.checked})}
                      />
                      전산 운영위 안건
                    </label>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>상태</label>
                    <select 
                      value={editForm.status}
                      onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                    >
                      <option value="준비중">준비중</option>
                      <option value="진행중">진행중</option>
                      <option value="완료">완료</option>
                      <option value="중단">중단</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>추진률 (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={editForm.progressRate}
                      onChange={(e) => setEditForm({...editForm, progressRate: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>시작일</label>
                    <input
                      type="date"
                      value={editForm.startDate}
                      onChange={(e) => setEditForm({...editForm, startDate: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>완료기한</label>
                    <input
                      type="date"
                      value={editForm.deadline}
                      onChange={(e) => setEditForm({...editForm, deadline: e.target.value})}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group full-width">
                    <label>PM (프로젝트 매니저)</label>
                    <input
                      type="text"
                      placeholder="담당 PM 이름"
                      value={editForm.pm}
                      onChange={(e) => setEditForm({...editForm, pm: e.target.value})}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group full-width">
                    <label>이슈사항</label>
                    <textarea
                      rows="4"
                      placeholder="프로젝트 이슈 및 특이사항을 입력하세요"
                      value={editForm.issues}
                      onChange={(e) => setEditForm({...editForm, issues: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowEditModal(false)}>
                취소
              </button>
              <button className="btn-save" onClick={handleSaveProject}>
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectManagement;
