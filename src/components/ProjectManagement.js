import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getApiUrl } from '../config/api';
import { getCurrentUser } from '../utils/userHelper';
import './ProjectManagement.css';

const API_BASE_URL = getApiUrl();

const ProjectManagement = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [yearFilter, setYearFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [healthFilter, setHealthFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // 일괄 삭제를 위한 체크박스 상태
  const [selectedProjectIds, setSelectedProjectIds] = useState([]);
  
  // 사업예산 전용 필터
  const [budgetYearFilter, setBudgetYearFilter] = useState('all');
  const [budgetSearchTerm, setBudgetSearchTerm] = useState('');

  // 관련예산 모달
  const [showBudgetListModal, setShowBudgetListModal] = useState(false);
  const [selectedProjectForBudgets, setSelectedProjectForBudgets] = useState(null);
  const [isEditingBudgets, setIsEditingBudgets] = useState(false);
  const [selectedBudgetsToAdd, setSelectedBudgetsToAdd] = useState([]);
  const [budgetAddSearchTerm, setBudgetAddSearchTerm] = useState(''); // 사업예산 추가 검색어

  // 편집 폼 데이터
  const [editForm, setEditForm] = useState({
    projectName: '',
    isItCommittee: false,
    status: '진행중',
    progressRate: 0,
    executionRate: 0,
    healthStatus: '양호',
    startDate: '',
    deadline: '',
    pm: '',
    issues: '',
    sharedFolderPath: ''
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
      console.log('   샘플 데이터 (원본):', data.slice(0, 1));
      
      // 연결된 사업예산 정보 확인
      data.forEach(project => {
        if (project.linked_budgets && project.linked_budgets.length > 0) {
          console.log(`   📎 프로젝트 "${project.project_name}" - 연결된 사업예산: ${project.linked_budgets.length}개`);
        }
      });
      
      // DB의 snake_case를 camelCase로 변환
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
        createdBy: item.created_by,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        linked_budgets: item.linked_budgets || [] // 연결된 사업예산 목록
      }));
      
      console.log('   ✅ 변환된 데이터:', convertedData.slice(0, 1));
      
      setProjects(convertedData);
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
      console.log('📊 프로젝트 생성 시작...');
      console.log(`   사업예산 ID: ${budgetId}`);
      
      const user = await getCurrentUser();
      console.log(`   사용자: ${user.name}`);
      
      const requestUrl = `${API_BASE_URL}/api/projects/from-budget/${budgetId}`;
      console.log(`   API URL: ${requestUrl}`);
      
      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          createdBy: user.name
        })
      });
      
      console.log(`   응답 상태: ${response.status} ${response.statusText}`);
      
      const result = await response.json();
      console.log('   응답 데이터:', result);
      
      if (!response.ok) {
        throw new Error(result.error || '프로젝트 생성 실패');
      }
      
      alert(`✅ ${result.message}`);
      fetchProjects();
      fetchBudgets(); // 사업예산 목록도 새로고침 (프로젝트로 등록된 항목 제외하기 위해)
    } catch (error) {
      console.error('❌ 프로젝트 생성 오류:', error);
      console.error('   에러 타입:', error.name);
      console.error('   에러 메시지:', error.message);
      console.error('   전체 에러:', error);
      alert(`프로젝트 생성 중 오류가 발생했습니다.\n\n${error.message}\n\n브라우저 콘솔(F12)에서 상세 로그를 확인하세요.`);
    }
  };

  // 프로젝트 편집 모달 열기
  const handleEditProject = (project) => {
    setSelectedProject(project);
    setEditForm({
      projectName: project.projectName || '',
      isItCommittee: project.isItCommittee || false,
      status: project.status || '진행중',
      progressRate: project.progressRate || 0,
      executionRate: Number(project.executionRate) || 0,
      healthStatus: project.healthStatus || '양호',
      startDate: project.startDate || '',
      deadline: project.deadline || '',
      pm: project.pm || '',
      issues: project.issues || '',
      sharedFolderPath: project.sharedFolderPath || ''
    });
    setShowEditModal(true);
  };

  // 프로젝트 수정 저장
  const handleSaveProject = async () => {
    try {
      // 프로젝트명 검증
      if (!editForm.projectName || !editForm.projectName.trim()) {
        alert('프로젝트명을 입력해주세요.');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/projects/${selectedProject.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          project_name: editForm.projectName,
          is_it_committee: editForm.isItCommittee,
          status: editForm.status,
          progress_rate: editForm.progressRate,
          execution_rate: editForm.executionRate,
          health_status: editForm.healthStatus,
          start_date: editForm.startDate || null,
          deadline: editForm.deadline || null,
          pm: editForm.pm,
          issues: editForm.issues,
          shared_folder_path: editForm.sharedFolderPath
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
  
  // 전체 선택/해제
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allIds = filteredProjects.map(p => p.id);
      setSelectedProjectIds(allIds);
    } else {
      setSelectedProjectIds([]);
    }
  };
  
  // 개별 선택/해제
  const handleSelectProject = (projectId) => {
    setSelectedProjectIds(prev => {
      if (prev.includes(projectId)) {
        return prev.filter(id => id !== projectId);
      } else {
        return [...prev, projectId];
      }
    });
  };
  
  // 일괄 삭제
  const handleBulkDelete = async () => {
    if (selectedProjectIds.length === 0) {
      alert('삭제할 프로젝트를 선택해주세요.');
      return;
    }
    
    if (!window.confirm(`선택한 ${selectedProjectIds.length}개의 프로젝트를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`)) {
      return;
    }
    
    try {
      let successCount = 0;
      let failCount = 0;
      
      for (const projectId of selectedProjectIds) {
        try {
          const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}`, {
            method: 'DELETE'
          });
          
          if (response.ok) {
            successCount++;
          } else {
            failCount++;
          }
        } catch (error) {
          failCount++;
        }
      }
      
      setSelectedProjectIds([]);
      alert(`✅ 삭제 완료!\n\n성공: ${successCount}개\n실패: ${failCount}개`);
      fetchProjects();
    } catch (error) {
      console.error('일괄 삭제 오류:', error);
      alert(`일괄 삭제 중 오류가 발생했습니다.\n\n${error.message}`);
    }
  };


  // 관련예산 모달 열기
  const handleShowBudgetList = (project) => {
    // 단일예산인 경우 (linked_budgets가 없고 businessBudgetId만 있는 경우)
    // budgets 배열에서 해당 사업예산을 찾아서 linked_budgets 형태로 만들어줌
    if ((!project.linked_budgets || project.linked_budgets.length === 0) && project.businessBudgetId) {
      const relatedBudget = budgets.find(b => b.id === project.businessBudgetId);
      if (relatedBudget) {
        project.linked_budgets = [{
          id: relatedBudget.id,
          project_name: relatedBudget.projectName,
          budget_amount: relatedBudget.budgetAmount,
          executed_amount: relatedBudget.executedAmount
        }];
      }
    }
    
    setSelectedProjectForBudgets(project);
    setIsEditingBudgets(false);
    setSelectedBudgetsToAdd([]);
    setBudgetAddSearchTerm('');
    setShowBudgetListModal(true);
  };

  // 관련예산 모달 닫기
  const handleCloseBudgetListModal = () => {
    setShowBudgetListModal(false);
    setIsEditingBudgets(false);
    setSelectedBudgetsToAdd([]);
    setBudgetAddSearchTerm('');
  };

  // 사업예산 추가
  const handleAddBudgetsToProject = async () => {
    if (selectedBudgetsToAdd.length === 0) {
      alert('추가할 사업예산을 선택해주세요.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/projects/${selectedProjectForBudgets.id}/budgets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          budgetIds: selectedBudgetsToAdd
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '사업예산 추가 실패');
      }

      alert(`✅ ${result.message}`);
      setSelectedBudgetsToAdd([]);
      setIsEditingBudgets(false);
      
      // 프로젝트 목록 새로고침
      await fetchProjects();
      
      // 해당 프로젝트의 최신 정보를 다시 가져오기
      const projectResponse = await fetch(`${API_BASE_URL}/api/projects/${selectedProjectForBudgets.id}`);
      if (projectResponse.ok) {
        const projectData = await projectResponse.json();
        
        // snake_case를 camelCase로 변환
        const convertedProject = {
          id: projectData.id,
          projectCode: projectData.project_code,
          businessBudgetId: projectData.business_budget_id,
          projectName: projectData.project_name,
          budgetYear: projectData.budget_year,
          initiatorDepartment: projectData.initiator_department,
          executorDepartment: projectData.executor_department,
          budgetAmount: projectData.budget_amount,
          executedAmount: projectData.executed_amount,
          isItCommittee: projectData.is_it_committee,
          status: projectData.status,
          progressRate: projectData.progress_rate,
          executionRate: Number(projectData.execution_rate) || 0,
          healthStatus: projectData.health_status,
          startDate: projectData.start_date,
          deadline: projectData.deadline,
          pm: projectData.pm,
          issues: projectData.issues,
          sharedFolderPath: projectData.shared_folder_path,
          createdBy: projectData.created_by,
          createdAt: projectData.created_at,
          updatedAt: projectData.updated_at,
          linked_budgets: projectData.linked_budgets || []
        };
        
        setSelectedProjectForBudgets(convertedProject);
        console.log('✅ 모달 데이터 갱신 완료:', convertedProject);
      }
    } catch (error) {
      console.error('사업예산 추가 오류:', error);
      alert(`사업예산 추가 중 오류가 발생했습니다.\n\n${error.message}`);
    }
  };

  // 사업예산 삭제
  const handleRemoveBudgetFromProject = async (budgetId) => {
    if (!window.confirm('이 사업예산을 프로젝트에서 제거하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/projects/${selectedProjectForBudgets.id}/budgets/${budgetId}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '사업예산 삭제 실패');
      }

      alert(`✅ ${result.message}`);
      
      // 프로젝트 목록 새로고침
      await fetchProjects();
      
      // 해당 프로젝트의 최신 정보를 다시 가져오기
      const projectResponse = await fetch(`${API_BASE_URL}/api/projects/${selectedProjectForBudgets.id}`);
      if (projectResponse.ok) {
        const projectData = await projectResponse.json();
        
        // snake_case를 camelCase로 변환
        const convertedProject = {
          id: projectData.id,
          projectCode: projectData.project_code,
          businessBudgetId: projectData.business_budget_id,
          projectName: projectData.project_name,
          budgetYear: projectData.budget_year,
          initiatorDepartment: projectData.initiator_department,
          executorDepartment: projectData.executor_department,
          budgetAmount: projectData.budget_amount,
          executedAmount: projectData.executed_amount,
          isItCommittee: projectData.is_it_committee,
          status: projectData.status,
          progressRate: projectData.progress_rate,
          executionRate: Number(projectData.execution_rate) || 0,
          healthStatus: projectData.health_status,
          startDate: projectData.start_date,
          deadline: projectData.deadline,
          pm: projectData.pm,
          issues: projectData.issues,
          sharedFolderPath: projectData.shared_folder_path,
          createdBy: projectData.created_by,
          createdAt: projectData.created_at,
          updatedAt: projectData.updated_at,
          linked_budgets: projectData.linked_budgets || []
        };
        
        setSelectedProjectForBudgets(convertedProject);
        console.log('✅ 모달 데이터 갱신 완료:', convertedProject);
      }
    } catch (error) {
      console.error('사업예산 삭제 오류:', error);
      alert(`사업예산 삭제 중 오류가 발생했습니다.\n\n${error.message}`);
    }
  };


  // 필터링된 프로젝트 목록
  const filteredProjects = projects.filter(project => {
    if (yearFilter !== 'all' && project.budgetYear !== parseInt(yearFilter)) {
      return false;
    }
    if (statusFilter !== 'all' && project.status !== statusFilter) {
      return false;
    }
    if (healthFilter !== 'all' && project.healthStatus !== healthFilter) {
      return false;
    }
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        (project.projectName && project.projectName.toLowerCase().includes(search)) ||
        (project.projectCode && project.projectCode.toLowerCase().includes(search)) ||
        (project.pm && project.pm.toLowerCase().includes(search))
      );
    }
    return true;
  });

  // 연도 목록 (현재 연도 ±3년)
  const currentYear = new Date().getFullYear();
  const yearRange = [];
  for (let i = -3; i <= 3; i++) {
    yearRange.push(currentYear + i);
  }
  const years = ['all', ...yearRange];

  // 금액 포맷 함수 (통계 계산 전에 정의)
  const formatCurrency = (amount) => {
    if (!amount) return '0백만원';
    const million = (amount / 1000000);
    return million >= 1 
      ? `${million.toLocaleString(undefined, {maximumFractionDigits: 1})}백만원`
      : `${million.toFixed(2)}백만원`;
  };

  // 통계
  const totalProjects = filteredProjects.length;
  const totalBudget = filteredProjects.reduce((sum, p) => {
    const amount = Number(p.budgetAmount) || 0;
    console.log('📊 예산 집계:', p.projectName, '→', amount, `(타입: ${typeof p.budgetAmount})`);
    return sum + amount;
  }, 0);
  const totalExecuted = filteredProjects.reduce((sum, p) => {
    const amount = Number(p.executedAmount) || 0;
    console.log('💰 집행액 집계:', p.projectName, '→', amount, `(타입: ${typeof p.executedAmount})`);
    return sum + amount;
  }, 0);
  const averageProgress = totalProjects > 0 
    ? (filteredProjects.reduce((sum, p) => sum + (Number(p.progressRate) || 0), 0) / totalProjects).toFixed(1) 
    : 0;
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 [통계] 집계 결과');
  console.log(`   총 프로젝트: ${totalProjects}건`);
  console.log(`   총 예산: ${totalBudget}원 → ${formatCurrency(totalBudget)}`);
  console.log(`   총 확정집행액: ${totalExecuted}원 → ${formatCurrency(totalExecuted)}`);
  console.log(`   평균 추진률: ${averageProgress}%`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  if (loading) return <div className="project-management loading">로딩 중...</div>;

  // 프로젝트로 등록되지 않은 사업예산 목록 (독립적인 연도 필터 적용)
  const unregisteredBudgets = budgets.filter(budget => {
    // 1:1 관계로 이미 등록된 항목 제외 (business_budget_id)
    if (projects.some(project => project.businessBudgetId === budget.id)) {
      return false;
    }
    
    // 다대다 관계로 이미 등록된 항목 제외 (project_budgets 테이블)
    if (projects.some(project => 
      project.linked_budgets && project.linked_budgets.some(lb => lb.id === budget.id)
    )) {
      return false;
    }
    
    // 사업예산 전용 연도 필터 적용
    if (budgetYearFilter !== 'all' && budget.budgetYear !== parseInt(budgetYearFilter)) {
      return false;
    }
    // 사업예산 전용 검색어 필터 적용
    if (budgetSearchTerm) {
      const search = budgetSearchTerm.toLowerCase();
      return (
        (budget.projectName && budget.projectName.toLowerCase().includes(search)) ||
        (budget.initiatorDepartment && budget.initiatorDepartment.toLowerCase().includes(search)) ||
        (budget.executorDepartment && budget.executorDepartment.toLowerCase().includes(search))
      );
    }
    return true;
  });

  return (
    <div className="project-management">
      <div className="page-header">
        <h1>프로젝트 관리</h1>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p>사업예산 기반 프로젝트 관리 시스템</p>
          <button 
            className="btn-add-manual-project"
            onClick={() => navigate('/projects/register')}
          >
            ➕ 프로젝트 수기 등록
          </button>
        </div>
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
          <div className="stat-label">총 확정집행액</div>
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
        <div className="filter-group">
          <label>건강도</label>
          <select value={healthFilter} onChange={(e) => setHealthFilter(e.target.value)}>
            <option value="all">전체 건강도</option>
            <option value="우수">🔵 우수</option>
            <option value="양호">🟢 양호</option>
            <option value="지연">🟡 지연</option>
            <option value="미흡">🟠 미흡</option>
            <option value="위험">🟣 위험</option>
            <option value="심각">🔴 심각</option>
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
        {selectedProjectIds.length > 0 && (
          <button 
            onClick={handleBulkDelete}
            className="btn-bulk-delete"
            style={{
              backgroundColor: '#f44336',
              color: 'white',
              padding: '10px 20px',
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px'
            }}
          >
            🗑️ 선택 삭제 ({selectedProjectIds.length})
          </button>
        )}
      </div>

      {/* 프로젝트 테이블 */}
      <div className="table-container">
        <table className="project-table">
          <thead>
            <tr>
              <th style={{ width: '40px' }}>
                <input
                  type="checkbox"
                  checked={filteredProjects.length > 0 && selectedProjectIds.length === filteredProjects.length}
                  onChange={handleSelectAll}
                  style={{ cursor: 'pointer' }}
                />
              </th>
              <th style={{ width: '100px' }}>관리</th>
              <th>프로젝트 코드</th>
              <th>프로젝트명</th>
              <th>발의부서</th>
              <th>추진부서</th>
              <th>관련예산</th>
              <th>전산운영위</th>
              <th>상태</th>
              <th>건강도</th>
              <th>추진률</th>
              <th>진척률</th>
              <th>시작일</th>
              <th>완료기한</th>
              <th>PM</th>
            </tr>
          </thead>
          <tbody>
            {filteredProjects.length === 0 ? (
              <tr>
                <td colSpan="16" style={{ textAlign: 'center', padding: '40px' }}>
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
                return (
                  <tr key={project.id}>
                    <td style={{ textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={selectedProjectIds.includes(project.id)}
                        onChange={() => handleSelectProject(project.id)}
                        style={{ cursor: 'pointer' }}
                      />
                    </td>
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
                    <td className="project-code">{project.projectCode}</td>
                    <td className="project-name">{project.projectName}</td>
                    <td>{project.initiatorDepartment || '-'}</td>
                    <td>{project.executorDepartment || '-'}</td>
                    <td style={{ textAlign: 'center' }}>
                      {(() => {
                        console.log(`프로젝트 "${project.projectName}" - linked_budgets:`, project.linked_budgets, 'businessBudgetId:', project.businessBudgetId);
                        
                        const budgetCount = project.linked_budgets && project.linked_budgets.length > 0 
                          ? project.linked_budgets.length 
                          : project.businessBudgetId ? 1 : 0;
                        
                        if (budgetCount > 0) {
                          return (
                            <button
                              onClick={() => handleShowBudgetList(project)}
                              style={{
                                padding: '6px 12px',
                                fontSize: '12px',
                                backgroundColor: '#2196F3',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontWeight: '600',
                                transition: 'background 0.2s'
                              }}
                              onMouseEnter={(e) => e.target.style.backgroundColor = '#1976D2'}
                              onMouseLeave={(e) => e.target.style.backgroundColor = '#2196F3'}
                            >
                              보기({budgetCount}개)
                            </button>
                          );
                        } else {
                          return '-';
                        }
                      })()}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {project.isItCommittee ? '✅' : ''}
                    </td>
                    <td>
                      <span className={`status-badge status-${project.status}`}>
                        {project.status}
                      </span>
                    </td>
                    <td>
                      <span className={`health-badge health-${project.healthStatus}`}>
                        {project.healthStatus || '양호'}
                      </span>
                    </td>
                    <td>
                      <div className="progress-cell">
                        <div className="progress-bar">
                          <div 
                            className="progress-fill" 
                            style={{ 
                              width: `${Math.min(project.progressRate || 0, 100)}%`,
                              backgroundColor: '#4CAF50'
                            }}
                          />
                        </div>
                        <span className="progress-text">{project.progressRate || 0}%</span>
                      </div>
                    </td>
                    <td>
                      <div className="progress-cell">
                        <div className="progress-bar">
                          <div 
                            className="progress-fill" 
                            style={{ 
                              width: `${Math.min(Number(project.executionRate) || 0, 100)}%`,
                              backgroundColor: (Number(project.executionRate) || 0) >= 80 ? '#f44336' : (Number(project.executionRate) || 0) >= 50 ? '#ff9800' : '#4CAF50'
                            }}
                          />
                        </div>
                        <span className="progress-text">{Number(project.executionRate || 0).toFixed(1)}%</span>
                      </div>
                    </td>
                    <td>{project.startDate || '-'}</td>
                    <td>{project.deadline || '-'}</td>
                    <td>{project.pm || '-'}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 사업예산 → 프로젝트 추가 섹션 (항상 표시) */}
      {budgets.length > 0 && (
        <div className="budget-selection-section">
          <div className="section-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
              <div>
                <h2>사업예산에서 프로젝트 추가</h2>
                <p style={{ marginTop: '8px', marginBottom: '0' }}>
                  아래 사업예산 중 프로젝트로 관리할 항목을 추가하세요
                </p>
              </div>
              
              {/* 사업예산 전용 필터 */}
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label style={{ fontSize: '14px', fontWeight: '500', whiteSpace: 'nowrap' }}>연도</label>
                  <select 
                    value={budgetYearFilter} 
                    onChange={(e) => setBudgetYearFilter(e.target.value)}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px',
                      cursor: 'pointer',
                      minWidth: '120px'
                    }}
                  >
                    {years.map(year => (
                      <option key={year} value={year}>
                        {year === 'all' ? '전체 연도' : `${year}년`}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="사업예산 검색..."
                    value={budgetSearchTerm}
                    onChange={(e) => setBudgetSearchTerm(e.target.value)}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px',
                      minWidth: '200px'
                    }}
                  />
                  {budgetSearchTerm && (
                    <button
                      onClick={() => setBudgetSearchTerm('')}
                      style={{
                        padding: '6px 10px',
                        background: '#f0f0f0',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            {/* 필터 상태 표시 */}
            {(budgetYearFilter !== 'all' || budgetSearchTerm) && (
              <p style={{ fontSize: '13px', color: '#666', marginTop: '10px' }}>
                {budgetYearFilter !== 'all' && (
                  <span style={{ color: '#4CAF50', marginRight: '15px' }}>
                    📅 {budgetYearFilter}년 필터 적용 중
                  </span>
                )}
                {budgetSearchTerm && (
                  <span style={{ color: '#2196F3' }}>
                    🔍 '{budgetSearchTerm}' 검색 중 ({unregisteredBudgets.length}건)
                  </span>
                )}
              </p>
            )}
          </div>
          <div className="budget-table-container">
            <table className="budget-table">
              <thead>
                <tr>
                  <th>사업예산명</th>
                  <th>연도</th>
                  <th>예산</th>
                  <th>확정집행액</th>
                  <th>발의부서</th>
                  <th>추진부서</th>
                  <th>프로젝트 추가</th>
                </tr>
              </thead>
              <tbody>
                {unregisteredBudgets.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                      {budgetYearFilter !== 'all' || budgetSearchTerm ? (
                        <div>
                          <div style={{ fontSize: '16px', marginBottom: '10px' }}>
                            🔍 검색 조건에 맞는 사업예산이 없습니다.
                          </div>
                          <div style={{ fontSize: '14px' }}>
                            다른 연도를 선택하거나 검색어를 변경해보세요.
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div style={{ fontSize: '16px', marginBottom: '10px' }}>
                            📋 프로젝트로 추가 가능한 사업예산이 없습니다.
                          </div>
                          <div style={{ fontSize: '14px' }}>
                            모든 사업예산이 이미 프로젝트로 등록되었습니다.
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                ) : (
                  unregisteredBudgets.map((budget) => (
                    <tr key={budget.id}>
                      <td className="project-name">{budget.projectName}</td>
                      <td>{budget.budgetYear}년</td>
                      <td className="amount">{formatCurrency(budget.budgetAmount)}</td>
                      <td className="amount">{formatCurrency(budget.executedAmount)}</td>
                      <td>{budget.initiatorDepartment || '-'}</td>
                      <td>{budget.executorDepartment || '-'}</td>
                      <td style={{ textAlign: 'center' }}>
                        <button 
                          className="btn-add-project"
                          onClick={() => handleAddProjectFromBudget(budget.id)}
                        >
                          프로젝트로 추가
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 관련예산 목록 모달 */}
      {showBudgetListModal && selectedProjectForBudgets && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '1000px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
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
                  onClick={handleCloseBudgetListModal}
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

              {/* 사업예산 추가 섹션 */}
              {isEditingBudgets && (
                <div style={{
                  marginBottom: '30px',
                  padding: '20px',
                  background: '#f0f7ff',
                  border: '2px dashed #667eea',
                  borderRadius: '8px'
                }}>
                  <div style={{ marginBottom: '15px', fontSize: '16px', fontWeight: '600', color: '#333' }}>
                    ➕ 사업예산 추가
                  </div>
                  
                  {/* 검색창 */}
                  <div style={{ marginBottom: '12px' }}>
                    <input
                      type="text"
                      placeholder="🔍 사업예산명으로 검색..."
                      value={budgetAddSearchTerm}
                      onChange={(e) => setBudgetAddSearchTerm(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 15px',
                        border: '2px solid #667eea',
                        borderRadius: '6px',
                        fontSize: '14px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <select
                      multiple
                      value={selectedBudgetsToAdd}
                      onChange={(e) => {
                        const selected = Array.from(e.target.selectedOptions, option => parseInt(option.value));
                        setSelectedBudgetsToAdd(selected);
                      }}
                      style={{
                        flex: 1,
                        minHeight: '150px',
                        padding: '10px',
                        border: '2px solid #667eea',
                        borderRadius: '6px',
                        fontSize: '13px'
                      }}
                    >
                      {budgets
                        .filter(b => {
                          // 현재 프로젝트에 이미 연결된 사업예산 제외
                          if (selectedProjectForBudgets.linked_budgets?.some(lb => lb.id === b.id)) {
                            return false;
                          }
                          
                          // 다른 프로젝트에 이미 연결된 사업예산 제외
                          if (projects.some(project => 
                            project.id !== selectedProjectForBudgets.id && (
                              project.businessBudgetId === b.id ||
                              (project.linked_budgets && project.linked_budgets.some(lb => lb.id === b.id))
                            )
                          )) {
                            return false;
                          }
                          
                          // 검색어 필터링
                          if (budgetAddSearchTerm.trim()) {
                            const searchLower = budgetAddSearchTerm.toLowerCase();
                            const projectName = (b.projectName || '').toLowerCase();
                            const budgetYear = String(b.budgetYear || '');
                            
                            return projectName.includes(searchLower) || budgetYear.includes(searchLower);
                          }
                          
                          return true;
                        })
                        .map(budget => (
                          <option key={budget.id} value={budget.id}>
                            [{budget.budgetYear}년] {budget.projectName} - {formatCurrency(budget.budgetAmount)}
                          </option>
                        ))}
                    </select>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <button
                        onClick={handleAddBudgetsToProject}
                        disabled={selectedBudgetsToAdd.length === 0}
                        style={{
                          padding: '10px 20px',
                          backgroundColor: selectedBudgetsToAdd.length === 0 ? '#ccc' : '#4CAF50',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: selectedBudgetsToAdd.length === 0 ? 'not-allowed' : 'pointer',
                          fontSize: '13px',
                          fontWeight: '600',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        추가하기
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingBudgets(false);
                          setSelectedBudgetsToAdd([]);
                          setBudgetAddSearchTerm('');
                        }}
                        style={{
                          padding: '10px 20px',
                          backgroundColor: '#f5f5f5',
                          color: '#666',
                          border: '1px solid #ddd',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: '600',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        취소
                      </button>
                    </div>
                  </div>
                  <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
                    💡 Ctrl 키를 누른 채로 클릭하여 여러 개를 선택할 수 있습니다
                  </div>
                </div>
              )}

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
                          <th style={{ width: '80px', textAlign: 'center', padding: '15px 10px', fontWeight: '600', fontSize: '14px' }}>관리</th>
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
                              <td style={{ textAlign: 'center', padding: '14px 10px' }}>
                                <button
                                  onClick={() => handleRemoveBudgetFromProject(budget.id)}
                                  style={{
                                    padding: '5px 12px',
                                    fontSize: '12px',
                                    backgroundColor: '#f44336',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                    transition: 'background 0.2s'
                                  }}
                                  onMouseEnter={(e) => e.target.style.backgroundColor = '#d32f2f'}
                                  onMouseLeave={(e) => e.target.style.backgroundColor = '#f44336'}
                                >
                                  삭제
                                </button>
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
                          <td></td>
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
              backgroundColor: '#fafafa',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <button 
                onClick={() => setIsEditingBudgets(!isEditingBudgets)}
                style={{
                  padding: '12px 24px',
                  fontSize: '14px',
                  fontWeight: '600',
                  backgroundColor: isEditingBudgets ? '#f5f5f5' : '#4CAF50',
                  color: isEditingBudgets ? '#666' : 'white',
                  border: isEditingBudgets ? '1px solid #ddd' : 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {isEditingBudgets ? '취소' : '➕ 사업예산 추가'}
              </button>
              
              <button 
                onClick={handleCloseBudgetListModal}
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


      {/* 프로젝트 편집 모달 */}
      {showEditModal && selectedProject && (
        <div className="modal-overlay">
          <div className="modal-content modal-edit">
            <div className="modal-header">
              <h2>프로젝트 수정</h2>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-section">
                <div className="form-row">
                  <div className="form-group full-width">
                    <label>프로젝트 코드</label>
                    <input type="text" value={selectedProject.projectCode} disabled />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group full-width">
                    <label>프로젝트명 <span style={{ color: 'red' }}>*</span></label>
                    <input 
                      type="text" 
                      value={editForm.projectName}
                      onChange={(e) => setEditForm({...editForm, projectName: e.target.value})}
                      placeholder="프로젝트명을 입력하세요"
                    />
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
                    <label>건강도</label>
                    <select 
                      value={editForm.healthStatus}
                      onChange={(e) => setEditForm({...editForm, healthStatus: e.target.value})}
                    >
                      <option value="우수">우수</option>
                      <option value="양호">양호</option>
                      <option value="지연">지연</option>
                      <option value="미흡">미흡</option>
                      <option value="위험">위험</option>
                      <option value="심각">심각</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
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
                  <div className="form-group">
                    <label>진척률 (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={editForm.executionRate}
                      onChange={(e) => setEditForm({...editForm, executionRate: parseFloat(e.target.value) || 0})}
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
                    <label>공유폴더 주소</label>
                    <input
                      type="text"
                      placeholder="\\\\server\\share\\folder 형식으로 입력"
                      value={editForm.sharedFolderPath}
                      onChange={(e) => setEditForm({...editForm, sharedFolderPath: e.target.value})}
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
