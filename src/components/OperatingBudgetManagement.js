import React, { useState, useEffect } from 'react';
import { getApiUrl } from '../config/api';
import './OperatingBudgetManagement.css';

const API_BASE_URL = getApiUrl();

const OperatingBudgetManagement = () => {
  // 예산 관련 상태
  const [budgets, setBudgets] = useState([]);
  const [filteredBudgets, setFilteredBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // 집행 내역 관련 상태
  const [executions, setExecutions] = useState([]);
  const [filteredExecutions, setFilteredExecutions] = useState([]);
  const [showExecutionForm, setShowExecutionForm] = useState(false);
  const [isExecutionEditMode, setIsExecutionEditMode] = useState(false);
  const [editingExecutionId, setEditingExecutionId] = useState(null);
  const [isProposalBased, setIsProposalBased] = useState(false); // 품의서 기반 집행내역 여부
  
  // 폼 데이터
  const [formData, setFormData] = useState({
    accountSubject: '',
    budgetAmount: ''
  });

  const [executionFormData, setExecutionFormData] = useState({
    accountSubject: '',
    sapDescription: '',
    contract: '',
    proposalName: '',
    confirmedExecutionAmount: '',
    executionAmount: '',
    billingPeriod: '',
    costAttribution: ''
  });

  // 검색 필터
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // 집행 내역 필터
  const [executionFilters, setExecutionFilters] = useState({
    accountSubject: '',
    proposalName: '',
    billingPeriod: '',
    costAttribution: ''
  });
  
  // 다중정렬 상태
  const [sortConfigs, setSortConfigs] = useState([]);

  // 데이터 로드
  useEffect(() => {
    fetchBudgets();
    fetchExecutions();
  }, []);

  // 필터링
  useEffect(() => {
    applyFilters();
  }, [budgets, selectedYear]);

  useEffect(() => {
    applyExecutionFilters();
  }, [executions, selectedYear, executionFilters, sortConfigs]);

  const fetchBudgets = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/operating-budgets`);
      if (response.ok) {
        const data = await response.json();
        setBudgets(data);
      } else {
        alert('데이터 로드 실패');
      }
    } catch (error) {
      console.error('API 호출 오류:', error);
      alert('데이터 로드 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const fetchExecutions = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/operating-budget-executions`);
      if (response.ok) {
        const data = await response.json();
        setExecutions(data);
      }
    } catch (error) {
      console.error('집행 내역 조회 오류:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...budgets];

    // 연도 필터
    if (selectedYear) {
      filtered = filtered.filter(b => b.fiscal_year === selectedYear);
    }

    setFilteredBudgets(filtered);
  };

  const applyExecutionFilters = () => {
    let filtered = [...executions];

    // 연도 필터 (budget의 fiscal_year 기준)
    if (selectedYear) {
      filtered = filtered.filter(e => e.fiscal_year === selectedYear);
    }

    // 계정과목 필터
    if (executionFilters.accountSubject) {
      filtered = filtered.filter(e => 
        e.account_subject && e.account_subject.toLowerCase().includes(executionFilters.accountSubject.toLowerCase())
      );
    }

    // 품의서명 필터
    if (executionFilters.proposalName) {
      filtered = filtered.filter(e => 
        e.proposal_name && e.proposal_name.toLowerCase().includes(executionFilters.proposalName.toLowerCase())
      );
    }

    // 청구시기 필터
    if (executionFilters.billingPeriod) {
      filtered = filtered.filter(e => 
        e.billing_period && e.billing_period.toLowerCase().includes(executionFilters.billingPeriod.toLowerCase())
      );
    }

    // 비용귀속 필터
    if (executionFilters.costAttribution) {
      filtered = filtered.filter(e => 
        e.cost_attribution && e.cost_attribution.toLowerCase().includes(executionFilters.costAttribution.toLowerCase())
      );
    }

    // 다중정렬 적용
    if (sortConfigs.length > 0) {
      filtered.sort((a, b) => {
        for (let config of sortConfigs) {
          const { key, direction } = config;
          let aValue = a[key];
          let bValue = b[key];

          // null 또는 undefined 처리
          if (aValue === null || aValue === undefined) aValue = '';
          if (bValue === null || bValue === undefined) bValue = '';

          // 숫자 타입 처리
          if (key === 'confirmed_execution_amount' || key === 'execution_amount') {
            aValue = parseFloat(aValue) || 0;
            bValue = parseFloat(bValue) || 0;
          }

          // 문자열은 대소문자 구분 없이 비교
          if (typeof aValue === 'string' && typeof bValue === 'string') {
            aValue = aValue.toLowerCase();
            bValue = bValue.toLowerCase();
          }

          if (aValue < bValue) {
            return direction === 'asc' ? -1 : 1;
          }
          if (aValue > bValue) {
            return direction === 'asc' ? 1 : -1;
          }
        }
        return 0;
      });
    }

    setFilteredExecutions(filtered);
  };

  const handleExecutionFilterChange = (field, value) => {
    setExecutionFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const resetExecutionFilters = () => {
    setExecutionFilters({
      accountSubject: '',
      proposalName: '',
      billingPeriod: '',
      costAttribution: ''
    });
  };

  // 다중정렬 처리
  const handleSort = (key) => {
    setSortConfigs((prevConfigs) => {
      const existingIndex = prevConfigs.findIndex(config => config.key === key);
      
      if (existingIndex !== -1) {
        // 이미 정렬 중인 컬럼
        const newConfigs = [...prevConfigs];
        const currentDirection = newConfigs[existingIndex].direction;
        
        if (currentDirection === 'asc') {
          // asc → desc
          newConfigs[existingIndex].direction = 'desc';
        } else {
          // desc → 제거
          newConfigs.splice(existingIndex, 1);
        }
        return newConfigs;
      } else {
        // 새로운 정렬 추가
        return [...prevConfigs, { key, direction: 'asc' }];
      }
    });
  };

  const getSortIndicator = (key) => {
    const config = sortConfigs.find(c => c.key === key);
    if (!config) return null;
    
    const index = sortConfigs.findIndex(c => c.key === key);
    const arrow = config.direction === 'asc' ? '↑' : '↓';
    return sortConfigs.length > 1 ? `${arrow}${index + 1}` : arrow;
  };

  const resetSort = () => {
    setSortConfigs([]);
  };

  // 엑셀 다운로드 함수
  const handleExcelDownload = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedYear) {
        params.append('fiscalYear', selectedYear);
      }
      
      const response = await fetch(`${API_BASE_URL}/api/operating-budget-executions/export/excel?${params.toString()}`);
      
      if (!response.ok) {
        const error = await response.json();
        alert(error.error || '엑셀 다운로드 실패');
        return;
      }
      
      // Blob으로 변환
      const blob = await response.blob();
      
      // 다운로드 링크 생성
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // 파일명 추출 (Content-Disposition 헤더에서)
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `전산운용비_집행내역_${selectedYear}년_${new Date().toISOString().slice(0, 10)}.xlsx`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename\*=UTF-8''(.+)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = decodeURIComponent(filenameMatch[1]);
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      
      // 정리
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('엑셀 다운로드 완료:', filename);
    } catch (error) {
      console.error('엑셀 다운로드 오류:', error);
      alert('엑셀 다운로드 중 오류가 발생했습니다.');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'budgetAmount') {
      // 숫자만 허용하고 콤마 추가
      const numericValue = value.replace(/[^\d]/g, '');
      const formattedValue = numericValue ? parseInt(numericValue).toLocaleString('ko-KR') : '';
      setFormData(prev => ({ ...prev, [name]: formattedValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleExecutionChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'confirmedExecutionAmount' || name === 'executionAmount') {
      // 숫자만 허용하고 콤마 추가
      const numericValue = value.replace(/[^\d]/g, '');
      const formattedValue = numericValue ? parseInt(numericValue).toLocaleString('ko-KR') : '';
      setExecutionFormData(prev => ({ ...prev, [name]: formattedValue }));
    } else {
      setExecutionFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.accountSubject || !formData.budgetAmount) {
      alert('모든 필드를 입력해주세요.');
      return;
    }

    // 동일한 계정과목 중복 체크
    const duplicateBudget = budgets.find(budget => 
      budget.fiscal_year === selectedYear && 
      budget.account_subject.trim().toLowerCase() === formData.accountSubject.trim().toLowerCase() &&
      budget.id !== editingId // 수정 중인 항목은 제외
    );

    if (duplicateBudget) {
      alert(`${selectedYear}년도에 "${formData.accountSubject}" 계정과목이 이미 존재합니다.`);
      return;
    }

    try {
      const submitData = {
        accountSubject: formData.accountSubject,
        budgetAmount: parseInt(formData.budgetAmount.replace(/[^\d]/g, '')),
        fiscalYear: selectedYear
      };

      let response;
      if (isEditMode) {
        response = await fetch(`${API_BASE_URL}/api/operating-budgets/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submitData)
        });
      } else {
        response = await fetch(`${API_BASE_URL}/api/operating-budgets`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submitData)
        });
      }

      if (response.ok) {
        alert(isEditMode ? '수정되었습니다.' : '등록되었습니다.');
        resetForm();
        fetchBudgets();
      } else {
        const error = await response.text();
        alert('저장 실패: ' + error);
      }
    } catch (error) {
      console.error('저장 오류:', error);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  const handleExecutionSubmit = async (e) => {
    e.preventDefault();

    if (!executionFormData.accountSubject) {
      alert('계정과목을 선택해주세요.');
      return;
    }

    // 선택된 계정과목에 해당하는 budget_id 찾기
    const selectedBudget = budgets.find(
      b => b.account_subject === executionFormData.accountSubject && b.fiscal_year === selectedYear
    );

    if (!selectedBudget) {
      alert('해당 연도에 계정과목을 찾을 수 없습니다.');
      return;
    }

    try {
      const submitData = {
        budgetId: selectedBudget.id,
        accountSubject: executionFormData.accountSubject,
        sapDescription: executionFormData.sapDescription,
        contract: executionFormData.contract,
        proposalName: executionFormData.proposalName,
        confirmedExecutionAmount: executionFormData.confirmedExecutionAmount ? 
          parseInt(executionFormData.confirmedExecutionAmount.replace(/[^\d]/g, '')) : 0,
        executionAmount: executionFormData.executionAmount ? 
          parseInt(executionFormData.executionAmount.replace(/[^\d]/g, '')) : 0,
        billingPeriod: executionFormData.billingPeriod,
        costAttribution: executionFormData.costAttribution,
        fiscalYear: selectedYear
      };

      let response;
      if (isExecutionEditMode) {
        response = await fetch(`${API_BASE_URL}/api/operating-budget-executions/${editingExecutionId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submitData)
        });
      } else {
        response = await fetch(`${API_BASE_URL}/api/operating-budget-executions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submitData)
        });
      }

      if (response.ok) {
        alert(isExecutionEditMode ? '수정되었습니다.' : '등록되었습니다.');
        resetExecutionForm();
        fetchExecutions();
      } else {
        const error = await response.text();
        alert('저장 실패: ' + error);
      }
    } catch (error) {
      console.error('저장 오류:', error);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  const handleEdit = (budget) => {
    setFormData({
      accountSubject: budget.account_subject,
      budgetAmount: parseInt(budget.budget_amount).toLocaleString('ko-KR')
    });
    setIsEditMode(true);
    setEditingId(budget.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExecutionEdit = (execution) => {
    // 품의서 기반 여부 확인 (일부 필드만 수정 불가)
    const isFromProposal = execution.proposal_name && execution.proposal_name.trim() !== '';
    setIsProposalBased(isFromProposal);
    
    setExecutionFormData({
      accountSubject: execution.account_subject,
      sapDescription: execution.sap_description || '',
      contract: execution.contract || '',
      proposalName: execution.proposal_name || '',
      confirmedExecutionAmount: execution.confirmed_execution_amount ? 
        parseInt(execution.confirmed_execution_amount).toLocaleString('ko-KR') : '',
      executionAmount: execution.execution_amount ? 
        parseInt(execution.execution_amount).toLocaleString('ko-KR') : '',
      billingPeriod: execution.billing_period || '',
      costAttribution: execution.cost_attribution || ''
    });
    setIsExecutionEditMode(true);
    setEditingExecutionId(execution.id);
    setShowExecutionForm(true);
    window.scrollTo({ top: document.getElementById('execution-section').offsetTop, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/operating-budgets/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert('삭제되었습니다.');
        fetchBudgets();
      } else {
        const error = await response.json();
        alert(error.message || error.error || '삭제 실패');
      }
    } catch (error) {
      console.error('삭제 오류:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const handleExecutionDelete = async (id, proposalName) => {
    // 품의서 기반 집행내역은 삭제 불가
    if (proposalName && proposalName.trim() !== '') {
      alert('품의서를 통해 자동 생성된 집행내역은 삭제할 수 없습니다.');
      return;
    }
    
    if (!window.confirm('정말 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/operating-budget-executions/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert('삭제되었습니다.');
        fetchExecutions();
      } else {
        alert('삭제 실패');
      }
    } catch (error) {
      console.error('삭제 오류:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const resetForm = () => {
    setFormData({
      accountSubject: '',
      budgetAmount: ''
    });
    setIsEditMode(false);
    setEditingId(null);
    setShowForm(false);
  };

  const resetExecutionForm = () => {
    setExecutionFormData({
      accountSubject: '',
      sapDescription: '',
      contract: '',
      proposalName: '',
      confirmedExecutionAmount: '',
      executionAmount: '',
      billingPeriod: '',
      costAttribution: ''
    });
    setIsExecutionEditMode(false);
    setEditingExecutionId(null);
    setShowExecutionForm(false);
    setIsProposalBased(false);
  };

  const getYearList = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 5; i <= currentYear + 5; i++) {
      years.push(i);
    }
    return years;
  };

  const getTotalBudget = () => {
    return filteredBudgets.reduce((sum, b) => sum + (parseInt(b.budget_amount) || 0), 0);
  };

  const getTotalExecution = () => {
    return filteredExecutions.reduce((sum, e) => sum + (parseInt(e.execution_amount) || 0), 0);
  };

  const getTotalConfirmedExecution = () => {
    return filteredExecutions.reduce((sum, e) => sum + (parseInt(e.confirmed_execution_amount) || 0), 0);
  };

  const getExecutionsByAccountSubject = () => {
    const grouped = {};
    
    filteredExecutions.forEach(execution => {
      const subject = execution.account_subject;
      if (!grouped[subject]) {
        grouped[subject] = {
          accountSubject: subject,
          confirmedExecutionAmount: 0,
          executionAmount: 0,
          count: 0
        };
      }
      grouped[subject].confirmedExecutionAmount += (parseInt(execution.confirmed_execution_amount) || 0);
      grouped[subject].executionAmount += (parseInt(execution.execution_amount) || 0);
      grouped[subject].count += 1;
    });

    return Object.values(grouped).sort((a, b) => b.executionAmount - a.executionAmount);
  };

  const formatAmount = (amount) => {
    return amount ? `${parseInt(amount).toLocaleString('ko-KR')} 원` : '0 원';
  };

  if (loading) {
    return <div className="loading">데이터를 불러오는 중...</div>;
  }

  return (
    <div className="operating-budget-container">
      <h1 className="page-title">사업예산관리 (전산운용비)</h1>

      {/* 헤더 영역 */}
      <div className="header-section">
        <div className="year-selector">
          <label>회계연도</label>
          <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))}>
            {getYearList().map(year => (
              <option key={year} value={year}>{year}년</option>
            ))}
          </select>
        </div>

        <button 
          className="btn-add"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          ➕ 예산 등록
        </button>
      </div>

      {/* 예산 등록/수정 폼 */}
      {showForm && (
        <div className="form-section">
          <div className="form-header">
            <h2>{isEditMode ? '예산 수정' : '예산 등록'}</h2>
            <button className="btn-close" onClick={resetForm}>✕</button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>계정과목 <span className="required">*</span></label>
                <input
                  type="text"
                  name="accountSubject"
                  value={formData.accountSubject}
                  onChange={handleChange}
                  placeholder="예: 서버호스팅비"
                  required
                />
              </div>

              <div className="form-group">
                <label>예산 (원) <span className="required">*</span></label>
                <input
                  type="text"
                  name="budgetAmount"
                  value={formData.budgetAmount}
                  onChange={handleChange}
                  placeholder="예: 10,000,000"
                  required
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-submit">
                {isEditMode ? '수정' : '등록'}
              </button>
              <button type="button" className="btn-cancel" onClick={resetForm}>
                취소
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 예산 테이블 */}
      <div className="table-section">
        <h3 className="section-title">예산 목록</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>번호</th>
              <th>회계연도</th>
              <th>계정과목</th>
              <th>예산 (원)</th>
              <th>등록일</th>
              <th>작업</th>
            </tr>
          </thead>
          <tbody>
            {filteredBudgets.length > 0 ? (
              filteredBudgets.map((budget, index) => (
                <tr key={budget.id}>
                  <td>{index + 1}</td>
                  <td>{budget.fiscal_year}년</td>
                  <td>{budget.account_subject}</td>
                  <td className="amount">{formatAmount(budget.budget_amount)}</td>
                  <td>{new Date(budget.created_at).toLocaleDateString()}</td>
                  <td>
                    <button
                      className="btn-edit"
                      onClick={() => handleEdit(budget)}
                    >
                      수정
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => handleDelete(budget.id)}
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="no-data">데이터가 없습니다.</td>
              </tr>
            )}
          </tbody>
        </table>
        {filteredBudgets.length > 0 && (
          <div className="table-summary">
            <span className="summary-label">총 예산액:</span>
            <span className="summary-value">{formatAmount(getTotalBudget())}</span>
          </div>
        )}
      </div>

      {/* 집행 내역 섹션 */}
      <div id="execution-section" className="execution-section">
        <div className="section-header">
          <h2 className="section-title">집행 내역</h2>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              className="btn-excel"
              onClick={handleExcelDownload}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}
            >
              📥 엑셀 다운로드
            </button>
            <button 
              className="btn-add"
              onClick={() => {
                resetExecutionForm();
                setShowExecutionForm(true);
              }}
            >
              ➕ 집행 내역 등록
            </button>
          </div>
        </div>

        {/* 집행 내역 등록/수정 폼 */}
        {showExecutionForm && (
          <div className="form-section">
            <div className="form-header">
              <h2>{isExecutionEditMode ? '집행 내역 수정' : '집행 내역 등록'}</h2>
              <button className="btn-close" onClick={resetExecutionForm}>✕</button>
            </div>

            <form onSubmit={handleExecutionSubmit}>
              {isProposalBased && (
                <div style={{
                  padding: '0.75rem',
                  backgroundColor: '#fff3cd',
                  border: '1px solid #ffc107',
                  borderRadius: '4px',
                  marginBottom: '1rem',
                  fontSize: '0.9rem',
                  color: '#856404'
                }}>
                  ⚠️ 품의서 기반 집행내역: 계정과목, 확정집행액, 품의서명은 수정할 수 없습니다.
                </div>
              )}
              <div className="form-grid">
                <div className="form-group">
                  <label>계정과목 <span className="required">*</span></label>
                  <select
                    name="accountSubject"
                    value={executionFormData.accountSubject}
                    onChange={handleExecutionChange}
                    required
                    disabled={isProposalBased}
                    style={isProposalBased ? { backgroundColor: '#f0f0f0', cursor: 'not-allowed' } : {}}
                  >
                    <option value="">선택하세요</option>
                    {budgets
                      .filter(b => b.fiscal_year === selectedYear)
                      .map(budget => (
                        <option key={budget.id} value={budget.account_subject}>
                          {budget.account_subject}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>SAP적요</label>
                  <input
                    type="text"
                    name="sapDescription"
                    value={executionFormData.sapDescription}
                    onChange={handleExecutionChange}
                    placeholder="SAP적요"
                  />
                </div>

                <div className="form-group">
                  <label>계약</label>
                  <input
                    type="text"
                    name="contract"
                    value={executionFormData.contract}
                    onChange={handleExecutionChange}
                    placeholder="계약"
                  />
                </div>

                <div className="form-group">
                  <label>품의서명</label>
                  <input
                    type="text"
                    name="proposalName"
                    value={executionFormData.proposalName}
                    onChange={handleExecutionChange}
                    placeholder="품의서명"
                    disabled={isProposalBased}
                    style={isProposalBased ? { backgroundColor: '#f0f0f0', cursor: 'not-allowed' } : {}}
                  />
                </div>

                <div className="form-group">
                  <label>확정집행액 (원)</label>
                  <input
                    type="text"
                    name="confirmedExecutionAmount"
                    value={executionFormData.confirmedExecutionAmount}
                    onChange={handleExecutionChange}
                    placeholder="0"
                    disabled={isProposalBased}
                    style={isProposalBased ? { backgroundColor: '#f0f0f0', cursor: 'not-allowed' } : {}}
                  />
                </div>

                <div className="form-group">
                  <label>집행액 (원)</label>
                  <input
                    type="text"
                    name="executionAmount"
                    value={executionFormData.executionAmount}
                    onChange={handleExecutionChange}
                    placeholder="0"
                  />
                </div>

                <div className="form-group">
                  <label>청구시기</label>
                  <input
                    type="text"
                    name="billingPeriod"
                    value={executionFormData.billingPeriod}
                    onChange={handleExecutionChange}
                    placeholder="청구시기"
                  />
                </div>

                <div className="form-group">
                  <label>비용귀속</label>
                  <select
                    name="costAttribution"
                    value={executionFormData.costAttribution}
                    onChange={handleExecutionChange}
                  >
                    <option value="">선택하세요</option>
                    <option value="당팀분">당팀분</option>
                    <option value="대체분">대체분</option>
                    <option value="지급X">지급X</option>
                    <option value="취소">취소</option>
                    <option value="해지">해지</option>
                  </select>
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-submit">
                  {isExecutionEditMode ? '수정' : '등록'}
                </button>
                <button type="button" className="btn-cancel" onClick={resetExecutionForm}>
                  취소
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 집행 통계 */}
        <div className="stats-section">
          <div className="stat-card">
            <div className="stat-label">총 집행 건수</div>
            <div className="stat-value">{filteredExecutions.length}건</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">확정집행액 합계</div>
            <div className="stat-value">{formatAmount(getTotalConfirmedExecution())}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">집행액 합계</div>
            <div className="stat-value">{formatAmount(getTotalExecution())}</div>
          </div>
        </div>

        {/* 계정과목별 집행 통계 */}
        {filteredExecutions.length > 0 && (
          <div className="account-stats-section">
            <h3 className="section-subtitle">계정과목별 집행 현황</h3>
            <div className="account-stats-grid">
              {getExecutionsByAccountSubject().map((item, index) => (
                <div key={index} className="account-stat-card">
                  <div className="account-stat-header">
                    <h4 className="account-name">{item.accountSubject}</h4>
                    <span className="account-count">{item.count}건</span>
                  </div>
                  <div className="account-stat-body">
                    <div className="account-stat-item">
                      <span className="account-stat-label">확정집행액</span>
                      <span className="account-stat-amount confirmed">
                        {formatAmount(item.confirmedExecutionAmount)}
                      </span>
                    </div>
                    <div className="account-stat-item">
                      <span className="account-stat-label">집행액</span>
                      <span className="account-stat-amount execution">
                        {formatAmount(item.executionAmount)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 집행 내역 필터 */}
        <div className="filter-section" style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="계정과목 검색"
              value={executionFilters.accountSubject}
              onChange={(e) => handleExecutionFilterChange('accountSubject', e.target.value)}
              style={{
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '0.9rem',
                width: '150px'
              }}
            />
            <input
              type="text"
              placeholder="품의서명 검색"
              value={executionFilters.proposalName}
              onChange={(e) => handleExecutionFilterChange('proposalName', e.target.value)}
              style={{
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '0.9rem',
                width: '150px'
              }}
            />
            <input
              type="text"
              placeholder="청구시기 검색"
              value={executionFilters.billingPeriod}
              onChange={(e) => handleExecutionFilterChange('billingPeriod', e.target.value)}
              style={{
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '0.9rem',
                width: '150px'
              }}
            />
            <input
              type="text"
              placeholder="비용귀속 검색"
              value={executionFilters.costAttribution}
              onChange={(e) => handleExecutionFilterChange('costAttribution', e.target.value)}
              style={{
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '0.9rem',
                width: '150px'
              }}
            />
            <button
              onClick={resetExecutionFilters}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              필터 초기화
            </button>
            <button
              onClick={resetSort}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#17a2b8',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              정렬 초기화
            </button>
          </div>
          {sortConfigs.length > 0 && (
            <div style={{ 
              marginTop: '0.5rem', 
              padding: '0.5rem', 
              backgroundColor: '#e7f3ff', 
              borderRadius: '4px',
              fontSize: '0.85rem',
              color: '#0066cc'
            }}>
              현재 정렬: {sortConfigs.map((config, idx) => {
                const fieldNames = {
                  account_subject: '계정과목',
                  sap_description: 'SAP적요',
                  contract: '계약',
                  proposal_name: '품의서명',
                  confirmed_execution_amount: '확정집행액',
                  execution_amount: '집행액',
                  billing_period: '청구시기',
                  cost_attribution: '비용귀속'
                };
                return `${fieldNames[config.key]} ${config.direction === 'asc' ? '↑' : '↓'}`;
              }).join(', ')}
            </div>
          )}
        </div>

        {/* 집행 내역 테이블 */}
        <div className="table-section execution-table" style={{ maxHeight: '600px', overflowY: 'auto', position: 'relative' }}>
          <table className="data-table" style={{ position: 'relative' }}>
            <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f8f9fa', zIndex: 10 }}>
              <tr>
                <th style={{ cursor: 'default' }}>번호</th>
                <th 
                  onClick={() => handleSort('account_subject')}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                  title="클릭하여 정렬"
                >
                  계정과목 {getSortIndicator('account_subject')}
                </th>
                <th 
                  onClick={() => handleSort('sap_description')}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                  title="클릭하여 정렬"
                >
                  SAP적요 {getSortIndicator('sap_description')}
                </th>
                <th 
                  onClick={() => handleSort('contract')}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                  title="클릭하여 정렬"
                >
                  계약 {getSortIndicator('contract')}
                </th>
                <th 
                  onClick={() => handleSort('proposal_name')}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                  title="클릭하여 정렬"
                >
                  품의서명 {getSortIndicator('proposal_name')}
                </th>
                <th 
                  onClick={() => handleSort('confirmed_execution_amount')}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                  title="클릭하여 정렬"
                >
                  확정집행액 (원) {getSortIndicator('confirmed_execution_amount')}
                </th>
                <th 
                  onClick={() => handleSort('execution_amount')}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                  title="클릭하여 정렬"
                >
                  집행액 (원) {getSortIndicator('execution_amount')}
                </th>
                <th 
                  onClick={() => handleSort('billing_period')}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                  title="클릭하여 정렬"
                >
                  청구시기 {getSortIndicator('billing_period')}
                </th>
                <th 
                  onClick={() => handleSort('cost_attribution')}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                  title="클릭하여 정렬"
                >
                  비용귀속 {getSortIndicator('cost_attribution')}
                </th>
                <th style={{ cursor: 'default' }}>작업</th>
              </tr>
            </thead>
            <tbody>
              {filteredExecutions.length > 0 ? (
                filteredExecutions.map((execution, index) => (
                  <tr key={execution.id}>
                    <td>{index + 1}</td>
                    <td>{execution.account_subject}</td>
                    <td>{execution.sap_description || '-'}</td>
                    <td>{execution.contract || '-'}</td>
                    <td>
                      {execution.proposal_name ? (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          backgroundColor: '#e3f2fd',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.9em'
                        }}>
                          📄 {execution.proposal_name}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="amount">{formatAmount(execution.confirmed_execution_amount)}</td>
                    <td className="amount">{formatAmount(execution.execution_amount)}</td>
                    <td>{execution.billing_period || '-'}</td>
                    <td>{execution.cost_attribution || '-'}</td>
                    <td>
                      {execution.proposal_name && execution.proposal_name.trim() !== '' ? (
                        // 품의서 기반 집행내역: 수정 가능, 삭제 불가
                        <>
                          <button
                            className="btn-edit"
                            onClick={() => handleExecutionEdit(execution)}
                            title="일부 필드만 수정 가능합니다"
                          >
                            수정
                          </button>
                          <button
                            className="btn-delete"
                            disabled
                            style={{ 
                              opacity: 0.5, 
                              cursor: 'not-allowed',
                              backgroundColor: '#ccc'
                            }}
                            title="품의서 기반 집행내역은 삭제할 수 없습니다"
                          >
                            삭제
                          </button>
                        </>
                      ) : (
                        // 수동 등록 집행내역: 수정/삭제 모두 가능
                        <>
                          <button
                            className="btn-edit"
                            onClick={() => handleExecutionEdit(execution)}
                          >
                            수정
                          </button>
                          <button
                            className="btn-delete"
                            onClick={() => handleExecutionDelete(execution.id, execution.proposal_name)}
                          >
                            삭제
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" className="no-data">집행 내역이 없습니다.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OperatingBudgetManagement;
