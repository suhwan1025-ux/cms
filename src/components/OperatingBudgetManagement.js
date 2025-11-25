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
  }, [executions, selectedYear]);

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

    setFilteredExecutions(filtered);
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
        alert('삭제 실패');
      }
    } catch (error) {
      console.error('삭제 오류:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const handleExecutionDelete = async (id) => {
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

        {/* 집행 내역 등록/수정 폼 */}
        {showExecutionForm && (
          <div className="form-section">
            <div className="form-header">
              <h2>{isExecutionEditMode ? '집행 내역 수정' : '집행 내역 등록'}</h2>
              <button className="btn-close" onClick={resetExecutionForm}>✕</button>
            </div>

            <form onSubmit={handleExecutionSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>계정과목 <span className="required">*</span></label>
                  <select
                    name="accountSubject"
                    value={executionFormData.accountSubject}
                    onChange={handleExecutionChange}
                    required
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

        {/* 집행 내역 테이블 */}
        <div className="table-section execution-table">
          <table className="data-table">
            <thead>
              <tr>
                <th>번호</th>
                <th>계정과목</th>
                <th>번호</th>
                <th>SAP적요</th>
                <th>계약</th>
                <th>품의서명</th>
                <th>확정집행액 (원)</th>
                <th>집행액 (원)</th>
                <th>청구시기</th>
                <th>비용귀속</th>
                <th>작업</th>
              </tr>
            </thead>
            <tbody>
              {filteredExecutions.length > 0 ? (
                filteredExecutions.map((execution, index) => (
                  <tr key={execution.id}>
                    <td>{index + 1}</td>
                    <td>{execution.account_subject}</td>
                    <td>{execution.execution_number || '-'}</td>
                    <td>{execution.sap_description || '-'}</td>
                    <td>{execution.contract || '-'}</td>
                    <td>{execution.proposal_name || '-'}</td>
                    <td className="amount">{formatAmount(execution.confirmed_execution_amount)}</td>
                    <td className="amount">{formatAmount(execution.execution_amount)}</td>
                    <td>{execution.billing_period || '-'}</td>
                    <td>{execution.cost_attribution || '-'}</td>
                    <td>
                      <button
                        className="btn-edit"
                        onClick={() => handleExecutionEdit(execution)}
                      >
                        수정
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => handleExecutionDelete(execution.id)}
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="11" className="no-data">집행 내역이 없습니다.</td>
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
