import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getApiUrl } from '../config/api';
import { getCurrentUser } from '../utils/userHelper';
import './ProjectManagement.css';

const API_BASE_URL = getApiUrl();

function ProjectRegister() {
  const navigate = useNavigate();
  const [budgets, setBudgets] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 폼 데이터
  const [formData, setFormData] = useState({
    projectName: '',
    budgetYear: new Date().getFullYear(),
    initiatorDepartment: '',
    executorDepartment: '',
    selectedBudgetIds: [],
    isItCommittee: false
  });
  
  // 사업예산 연도 필터
  const [budgetYearFilter, setBudgetYearFilter] = useState('all');
  
  // 사업예산명 검색 필터
  const [budgetSearchTerm, setBudgetSearchTerm] = useState('');
  
  // 제출 중 상태
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // 사업예산 목록 조회
      const budgetResponse = await fetch(`${API_BASE_URL}/api/business-budgets`);
      const budgetData = await budgetResponse.json();
      
      // snake_case를 camelCase로 변환
      const convertedBudgets = budgetData.map(item => ({
        id: item.id,
        projectName: item.project_name,
        budgetYear: item.budget_year,
        budgetAmount: item.budget_amount,
        executedAmount: item.executed_amount,
        initiatorDepartment: item.initiator_department,
        executorDepartment: item.executor_department
      }));
      
      setBudgets(convertedBudgets);
      
      // 프로젝트 목록 조회 (필터링용)
      const projectResponse = await fetch(`${API_BASE_URL}/api/projects`);
      const projectData = await projectResponse.json();
      setProjects(projectData);
    } catch (error) {
      console.error('데이터 조회 오류:', error);
      alert('데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 사업예산 선택 토글
  const handleToggleBudgetSelection = (budgetId) => {
    setFormData(prev => {
      const isSelected = prev.selectedBudgetIds.includes(budgetId);
      return {
        ...prev,
        selectedBudgetIds: isSelected
          ? prev.selectedBudgetIds.filter(id => id !== budgetId)
          : [...prev.selectedBudgetIds, budgetId]
      };
    });
  };

  // 프로젝트 등록
  const handleSubmit = async () => {
    try {
      // 입력값 검증
      if (!formData.projectName.trim()) {
        alert('프로젝트명을 입력해주세요.');
        return;
      }
      if (formData.selectedBudgetIds.length === 0) {
        alert('최소 하나 이상의 사업예산을 선택해주세요.');
        return;
      }

      const user = await getCurrentUser();
      
      setIsSubmitting(true);
      
      const response = await fetch(`${API_BASE_URL}/api/projects/manual`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          projectName: formData.projectName,
          budgetYear: formData.budgetYear,
          initiatorDepartment: formData.initiatorDepartment,
          executorDepartment: formData.executorDepartment,
          budgetIds: formData.selectedBudgetIds,
          isItCommittee: formData.isItCommittee,
          createdBy: user.name
        })
      });
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('서버에서 올바른 응답을 받지 못했습니다. 서버가 재시작되었는지 확인해주세요.');
      }
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || '프로젝트 생성 실패');
      }
      
      alert(`✅ ${result.message}`);
      navigate('/projects');
    } catch (error) {
      console.error('프로젝트 수기 등록 오류:', error);
      alert(`프로젝트 생성 중 오류가 발생했습니다.\n\n${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 연도 목록 (현재 연도 ±3년)
  const currentYear = new Date().getFullYear();
  const yearRange = [];
  for (let i = -3; i <= 3; i++) {
    yearRange.push(currentYear + i);
  }
  const years = ['all', ...yearRange];

  // 금액 포맷 함수
  const formatCurrency = (amount) => {
    if (!amount) return '0백만원';
    const million = (amount / 1000000);
    return million >= 1 
      ? `${million.toLocaleString(undefined, {maximumFractionDigits: 1})}백만원`
      : `${million.toFixed(2)}백만원`;
  };

  // 이미 프로젝트에 사용된 사업예산 필터링
  const availableBudgets = budgets.filter(budget => {
    // 연도 필터 적용
    if (budgetYearFilter !== 'all' && budget.budgetYear !== parseInt(budgetYearFilter)) {
      return false;
    }
    
    // 검색어 필터 적용
    if (budgetSearchTerm.trim()) {
      const searchLower = budgetSearchTerm.toLowerCase();
      const projectName = (budget.projectName || '').toLowerCase();
      const initiatorDept = (budget.initiatorDepartment || '').toLowerCase();
      const executorDept = (budget.executorDepartment || '').toLowerCase();
      
      if (!projectName.includes(searchLower) && 
          !initiatorDept.includes(searchLower) && 
          !executorDept.includes(searchLower)) {
        return false;
      }
    }
    
    // 이미 프로젝트에 사용된 사업예산 제외
    const isUsedInProjects = projects.some(project => {
      if (project.business_budget_id === budget.id) return true;
      if (project.linked_budgets && project.linked_budgets.some(lb => lb.id === budget.id)) return true;
      return false;
    });
    
    return !isUsedInProjects;
  });

  if (loading) {
    return (
      <div className="project-management" style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '18px', color: '#666' }}>데이터를 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="project-management">
      <div className="page-header">
        <h1>📝 프로젝트 수기 등록</h1>
        <p>새로운 프로젝트를 등록하고 관련 사업예산을 연결하세요</p>
      </div>

      <div className="form-container" style={{
        maxWidth: '900px',
        margin: '0 auto',
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <div className="form-section">
          {/* 프로젝트명 */}
          <div className="form-row">
            <div className="form-group full-width">
              <label>프로젝트명 <span style={{ color: 'red' }}>*</span></label>
              <input
                type="text"
                placeholder="프로젝트명을 입력하세요"
                value={formData.projectName}
                onChange={(e) => setFormData({...formData, projectName: e.target.value})}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>
          
          {/* 프로젝트 연도 & 전산운영위 */}
          <div className="form-row" style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>프로젝트 연도 <span style={{ color: 'red' }}>*</span></label>
              <select
                value={formData.budgetYear}
                onChange={(e) => setFormData({...formData, budgetYear: parseInt(e.target.value)})}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              >
                {yearRange.map(year => (
                  <option key={year} value={year}>{year}년</option>
                ))}
              </select>
            </div>
            
            <div className="form-group" style={{ flex: 1, display: 'flex', alignItems: 'center', paddingTop: '30px' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.isItCommittee}
                  onChange={(e) => setFormData({...formData, isItCommittee: e.target.checked})}
                  style={{ marginRight: '8px', width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '14px' }}>전산운영위 안건</span>
              </label>
            </div>
          </div>
          
          {/* 발의부서 & 추진부서 */}
          <div className="form-row" style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>발의부서</label>
              <input
                type="text"
                placeholder="발의부서를 입력하세요"
                value={formData.initiatorDepartment}
                onChange={(e) => setFormData({...formData, initiatorDepartment: e.target.value})}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>
            
            <div className="form-group" style={{ flex: 1 }}>
              <label>추진부서</label>
              <input
                type="text"
                placeholder="추진부서를 입력하세요"
                value={formData.executorDepartment}
                onChange={(e) => setFormData({...formData, executorDepartment: e.target.value})}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>
          
          {/* 관련 사업예산 선택 */}
          <div className="form-row" style={{ marginTop: '30px' }}>
            <div className="form-group full-width">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <label>관련 사업예산 선택 <span style={{ color: 'red' }}>*</span></label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label style={{ fontSize: '14px', fontWeight: '500' }}>사업예산 연도:</label>
                  <select 
                    value={budgetYearFilter} 
                    onChange={(e) => setBudgetYearFilter(e.target.value)}
                    style={{
                      padding: '6px 12px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    {years.map(year => (
                      <option key={year} value={year}>
                        {year === 'all' ? '전체 연도' : `${year}년`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* 검색창 */}
              <div style={{ marginBottom: '10px' }}>
                <input
                  type="text"
                  placeholder="🔍 사업예산명, 발의부서, 추진부서로 검색..."
                  value={budgetSearchTerm}
                  onChange={(e) => setBudgetSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 15px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              
              <div style={{ 
                maxHeight: '400px', 
                overflowY: 'auto', 
                border: '1px solid #ddd', 
                borderRadius: '4px',
                padding: '15px',
                backgroundColor: '#f9f9f9'
              }}>
                {availableBudgets.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#999', padding: '40px 20px' }}>
                    {budgetSearchTerm.trim() ? (
                      <>
                        '{budgetSearchTerm}' 검색 결과가 없습니다.<br/>
                        다른 검색어를 입력해주세요.
                      </>
                    ) : budgetYearFilter !== 'all' ? (
                      <>{budgetYearFilter}년 사용 가능한 사업예산이 없습니다.<br/>다른 연도를 선택해주세요.</>
                    ) : (
                      <>모든 사업예산이 이미 프로젝트에 등록되었습니다.</>
                    )}
                  </p>
                ) : (
                  availableBudgets.map(budget => (
                    <div 
                      key={budget.id} 
                      style={{ 
                        padding: '15px', 
                        marginBottom: '10px',
                        backgroundColor: formData.selectedBudgetIds.includes(budget.id) ? '#e8f5e9' : 'white',
                        border: formData.selectedBudgetIds.includes(budget.id) ? '2px solid #4CAF50' : '1px solid #ddd',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onClick={() => handleToggleBudgetSelection(budget.id)}
                    >
                      <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'flex-start' }}>
                        <input
                          type="checkbox"
                          checked={formData.selectedBudgetIds.includes(budget.id)}
                          onChange={() => {}}
                          style={{ marginRight: '12px', marginTop: '3px', width: '18px', height: '18px' }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '600', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px' }}>
                            <span>{budget.projectName}</span>
                            <span style={{ 
                              fontSize: '12px', 
                              color: '#fff', 
                              backgroundColor: '#2196F3', 
                              padding: '3px 8px', 
                              borderRadius: '4px'
                            }}>
                              {budget.budgetYear}년
                            </span>
                          </div>
                          <div style={{ fontSize: '13px', color: '#666', lineHeight: '1.5' }}>
                            예산: {formatCurrency(budget.budgetAmount)} | 
                            집행: {formatCurrency(budget.executedAmount)} | 
                            발의: {budget.initiatorDepartment || '-'} | 
                            추진: {budget.executorDepartment || '-'}
                          </div>
                        </div>
                      </label>
                    </div>
                  ))
                )}
              </div>
              
              <p style={{ fontSize: '13px', color: '#666', marginTop: '10px' }}>
                {(budgetYearFilter !== 'all' || budgetSearchTerm.trim()) && (
                  <span style={{ marginRight: '15px', color: '#2196F3' }}>
                    🔍 필터링된 사업예산: {availableBudgets.length}개
                    {budgetYearFilter !== 'all' && ` (${budgetYearFilter}년)`}
                    {budgetSearchTerm.trim() && ` (검색: "${budgetSearchTerm}")`}
                  </span>
                )}
                선택된 사업예산: {formData.selectedBudgetIds.length}개
                {formData.selectedBudgetIds.length > 0 && (
                  <span style={{ marginLeft: '10px', color: '#4CAF50', fontWeight: '500' }}>
                    (총 예산: {formatCurrency(
                      budgets
                        .filter(b => formData.selectedBudgetIds.includes(b.id))
                        .reduce((sum, b) => sum + (Number(b.budgetAmount) || 0), 0)
                    )})
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* 버튼 영역 */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'flex-end', 
          gap: '10px', 
          marginTop: '40px',
          paddingTop: '30px',
          borderTop: '1px solid #eee'
        }}>
          <button 
            onClick={() => navigate('/projects')}
            disabled={isSubmitting}
            style={{
              padding: '12px 30px',
              fontSize: '15px',
              fontWeight: '600',
              backgroundColor: '#f5f5f5',
              color: '#666',
              border: '1px solid #ddd',
              borderRadius: '6px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.6 : 1
            }}
          >
            취소
          </button>
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            style={{
              padding: '12px 30px',
              fontSize: '15px',
              fontWeight: '600',
              backgroundColor: isSubmitting ? '#ccc' : '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.6 : 1
            }}
          >
            {isSubmitting ? '⏳ 등록 중...' : '✅ 프로젝트 생성'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProjectRegister;

