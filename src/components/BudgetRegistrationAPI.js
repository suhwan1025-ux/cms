import React, { useState, useEffect } from 'react';
import { getApiUrl } from '../config/api';

// API 베이스 URL 설정
const API_BASE_URL = getApiUrl();

const BudgetRegistrationAPI = () => {
  const [formData, setFormData] = useState({
    projectName: '',
    initiatorDepartment: '', // 발의부서
    executorDepartment: '', // 추진부서
    budgetType: '', // 자본예산 또는 전산운용비
    budgetCategory: '', // 세부 분류
    budgetAmount: '',
    startDate: '',
    endDate: '',
    isEssential: false, // 필수사업여부
    projectPurpose: '', // 사업목적
    budgetYear: new Date().getFullYear() // 예산년도
  });

  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingBudget, setEditingBudget] = useState(null);
  const [editForm, setEditForm] = useState({
    projectName: '',
    initiatorDepartment: '',
    executorDepartment: '',
    budgetType: '',
    budgetCategory: '',
    budgetAmount: '',
    startDate: '',
    endDate: '',
    isEssential: false,
    projectPurpose: '',
    budgetYear: new Date().getFullYear()
  });

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear()); // 현재 연도
  const [showRegistrationForm, setShowRegistrationForm] = useState(false); // 등록 폼 표시 상태

  // 다중 정렬 상태 관리
  const [sortConfigs, setSortConfigs] = useState([]);

  // 검색 가능한 드롭다운 상태
  const [initiatorSearch, setInitiatorSearch] = useState('');
  const [executorSearch, setExecutorSearch] = useState('');
  const [showInitiatorDropdown, setShowInitiatorDropdown] = useState(false);
  const [showExecutorDropdown, setShowExecutorDropdown] = useState(false);

  // 편집 모드 검색 상태
  const [editInitiatorSearch, setEditInitiatorSearch] = useState('');
  const [editExecutorSearch, setEditExecutorSearch] = useState('');
  const [showEditInitiatorDropdown, setShowEditInitiatorDropdown] = useState(false);
  const [showEditExecutorDropdown, setShowEditExecutorDropdown] = useState(false);
  


  // 예산 분류 옵션
  const budgetTypes = {
    '자본예산': ['일반사업', '보안사업', '정기성사업'],
    '전산운용비': ['증권전산운용비', '전산수선비', '전산임차료', '전산용역비', '전산회선료', '기타']
  };

  // 부서 목록 (API에서 가져올 예정)
  const [departments, setDepartments] = useState([]);

  // 사업목적 옵션
  const projectPurposes = [
    { value: 'A', label: 'A: 동결 및 감소' },
    { value: 'B', label: 'B: 유상전환' },
    { value: 'C', label: 'C: 전략과제' },
    { value: 'D', label: 'D: 물가상승인상' },
    { value: 'E', label: 'E: 사용량증가' },
    { value: 'F', label: 'F: 해지' }
  ];

  // 검색된 부서 목록 반환
  const getFilteredDepartments = (searchTerm) => {
    return departments.filter(dept => 
      dept.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // 해당 연도의 기본 날짜 설정
  const getDefaultDates = () => {
    const year = selectedYear;
    return {
      startDate: `${year}-01`,
      endDate: `${year}-12`
    };
  };

  // API에서 사업예산 데이터와 부서 데이터 로드
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // 사업예산 데이터 가져오기
        const budgetResponse = await fetch(`${API_BASE_URL}/api/budget-statistics`);
        if (budgetResponse.ok) {
          const data = await budgetResponse.json();
          // budgetData 필드에서 실제 예산 목록 가져오기
          const budgets = data.budgetData || [];
          // 선택된 연도에 따라 필터링
          const filteredData = budgets.filter(budget => 
            budget.budgetYear === selectedYear
          );
          setBudgets(filteredData);
        } else {
          setError('사업예산 데이터 로드 실패: ' + budgetResponse.statusText);
        }

        // 부서 데이터 가져오기 (한 번만 로드)
        if (departments.length === 0) {
          const departmentResponse = await fetch(`${API_BASE_URL}/api/departments`);
          if (departmentResponse.ok) {
            const departmentData = await departmentResponse.json();
            const departmentNames = departmentData.map(dept => dept.name);
            setDepartments(departmentNames);
          } else {
            console.error('부서 데이터 로드 실패:', departmentResponse.statusText);
          }
        }
      } catch (error) {
        setError('API 호출 오류: ' + error.message);
        console.error('API 호출 오류:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedYear]); // selectedYear가 변경될 때마다 데이터 다시 로드

  // 연도 변경 시 기본 날짜 설정
  useEffect(() => {
    const defaultDates = getDefaultDates();
    setFormData(prev => ({
      ...prev,
      startDate: defaultDates.startDate,
      endDate: defaultDates.endDate,
      budgetYear: selectedYear
    }));
  }, [selectedYear]);

  // 새 예산 등록
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 필수 필드 검증
    if (!formData.projectName || !formData.initiatorDepartment || !formData.executorDepartment || 
        !formData.budgetType || !formData.budgetCategory || !formData.budgetAmount || 
        !formData.startDate || !formData.endDate || formData.isEssential === '') {
      alert('모든 필수 필드를 입력해주세요.');
      return;
    }

    try {
      // 예산 금액에서 콤마 제거하고 숫자로 변환
      const submitData = {
        ...formData,
        budgetAmount: formData.budgetAmount ? parseInt(formData.budgetAmount.replace(/[^\d]/g, '')) : 0,
        budgetYear: selectedYear,
        status: '승인대기'
      };



      const response = await fetch(`${API_BASE_URL}/api/business-budgets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      if (response.ok) {
        // 폼 초기화
        resetForm();
        
        // 데이터 다시 로드
        const refreshResponse = await fetch(`${API_BASE_URL}/api/budget-statistics`);
        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          const budgets = data.budgetData || [];
          const filteredData = budgets.filter(budget => 
            budget.budgetYear === selectedYear
          );
          setBudgets(filteredData);
        }
        
        alert('예산이 성공적으로 등록되었습니다.');
      } else {
        const errorData = await response.text();
        console.error('Server error response:', errorData);
        alert('예산 등록 실패: ' + response.statusText + '\n' + errorData);
      }
    } catch (error) {
      console.error('Registration error:', error);
      alert('예산 등록 중 오류가 발생했습니다: ' + error.message);
    }
  };

  // 폼 입력 처리
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    let processedValue = value;
    
    // 예산 금액에 콤마 추가
    if (name === 'budgetAmount') {
      // 숫자와 콤마만 허용
      const numericValue = value.replace(/[^\d]/g, '');
      if (numericValue) {
        processedValue = parseInt(numericValue).toLocaleString();
      } else {
        processedValue = '';
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : 
              name === 'isEssential' ? value === 'true' : processedValue
    }));
  };

  // 발의부서 검색 및 선택
  const handleInitiatorSearch = (e) => {
    const value = e.target.value;
    setInitiatorSearch(value);
    setFormData(prev => ({ ...prev, initiatorDepartment: value }));
    setShowInitiatorDropdown(true);
  };

  const handleInitiatorSelect = (dept) => {
    setFormData(prev => ({ ...prev, initiatorDepartment: dept }));
    setInitiatorSearch(dept);
    setShowInitiatorDropdown(false);
  };

  const handleInitiatorFocus = () => {
    setShowInitiatorDropdown(true);
  };

  const handleInitiatorBlur = () => {
    setTimeout(() => setShowInitiatorDropdown(false), 200);
  };

  // 추진부서 검색 및 선택
  const handleExecutorSearch = (e) => {
    const value = e.target.value;
    setExecutorSearch(value);
    setFormData(prev => ({ ...prev, executorDepartment: value }));
    setShowExecutorDropdown(true);
  };

  const handleExecutorSelect = (dept) => {
    setFormData(prev => ({ ...prev, executorDepartment: dept }));
    setExecutorSearch(dept);
    setShowExecutorDropdown(false);
  };

  const handleExecutorFocus = () => {
    setShowExecutorDropdown(true);
  };

  const handleExecutorBlur = () => {
    setTimeout(() => setShowExecutorDropdown(false), 200);
  };

  // 폼 초기화 시 검색 상태도 초기화
  const resetForm = () => {
    const defaultDates = getDefaultDates();
    setFormData({
      projectName: '',
      initiatorDepartment: '',
      executorDepartment: '',
      budgetType: '',
      budgetCategory: '',
      budgetAmount: '',
      startDate: defaultDates.startDate,
      endDate: defaultDates.endDate,
      isEssential: false,
      projectPurpose: '',
      budgetYear: selectedYear
    });
    setInitiatorSearch('');
    setExecutorSearch('');
    setShowInitiatorDropdown(false);
    setShowExecutorDropdown(false);
  };

  // 정렬 처리
  const handleSort = (key) => {
    setSortConfigs(prev => {
      const existing = prev.find(config => config.key === key);
      if (existing) {
        return prev.map(config => 
          config.key === key 
            ? { ...config, direction: config.direction === 'asc' ? 'desc' : 'asc' }
            : config
        );
      } else {
        return [...prev, { key, direction: 'asc' }];
      }
    });
  };

  // 정렬된 데이터 반환
  const getSortedData = () => {
    let sortedData = [...budgets];
    
    sortConfigs.forEach(config => {
      sortedData.sort((a, b) => {
        let aVal = a[config.key];
        let bVal = b[config.key];
        
        if (typeof aVal === 'string') {
          aVal = aVal.toLowerCase();
          bVal = bVal.toLowerCase();
        }
        
        if (aVal < bVal) return config.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return config.direction === 'asc' ? 1 : -1;
        return 0;
      });
    });
    
    return sortedData;
  };



  // 컬럼명 반환
  const getColumnName = (key) => {
    const columnNames = {
      projectName: '사업명',
      initiatorDepartment: '발의부서',
      executorDepartment: '추진부서',
      budgetType: '예산유형',
      budgetCategory: '세부분류',
      budgetAmount: '예산금액',
      isEssential: '필수사업',
      projectPurpose: '사업목적',
      startDate: '사업기간',
      status: '상태',
      createdAt: '등록일'
    };
    return columnNames[key] || key;
  };

  // 정렬 아이콘 반환
  const getSortIcon = (key) => {
    const config = sortConfigs.find(c => c.key === key);
    if (!config) return '↕️';
    return config.direction === 'asc' ? '↑' : '↓';
  };

  // 편집 모드 시작
  const handleEdit = (budget) => {
    setEditingBudget(budget.id);
    setEditForm({
      projectName: budget.projectName,
      initiatorDepartment: budget.initiatorDepartment,
      executorDepartment: budget.executorDepartment,
      budgetType: budget.budgetType,
      budgetCategory: budget.budgetCategory,
      budgetAmount: budget.budgetAmount ? budget.budgetAmount.toLocaleString() : '',
      startDate: budget.startDate,
      endDate: budget.endDate,
      isEssential: budget.isEssential,
      projectPurpose: budget.projectPurpose,
      budgetYear: budget.budgetYear
    });
    
    // 편집 모드 검색 상태 초기화
    setEditInitiatorSearch(budget.initiatorDepartment);
    setEditExecutorSearch(budget.executorDepartment);
    setShowEditInitiatorDropdown(false);
    setShowEditExecutorDropdown(false);
  };

  // 편집 폼 입력 처리
  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    let processedValue = value;
    
    // 예산 금액에 콤마 추가
    if (name === 'budgetAmount') {
      // 숫자와 콤마만 허용
      const numericValue = value.replace(/[^\d]/g, '');
      if (numericValue) {
        processedValue = parseInt(numericValue).toLocaleString();
      } else {
        processedValue = '';
      }
    }
    
    setEditForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : 
              name === 'isEssential' ? value === 'true' : processedValue
    }));
  };

  // 편집 모드 발의부서 검색 및 선택
  const handleEditInitiatorSearch = (e) => {
    const value = e.target.value;
    setEditInitiatorSearch(value);
    setShowEditInitiatorDropdown(true);
  };

  const handleEditInitiatorSelect = (dept) => {
    setEditForm(prev => ({ ...prev, initiatorDepartment: dept }));
    setEditInitiatorSearch(dept);
    setShowEditInitiatorDropdown(false);
  };

  const handleEditInitiatorFocus = () => {
    setShowEditInitiatorDropdown(true);
  };

  const handleEditInitiatorBlur = () => {
    setTimeout(() => setShowEditInitiatorDropdown(false), 200);
  };

  // 편집 모드 추진부서 검색 및 선택
  const handleEditExecutorSearch = (e) => {
    const value = e.target.value;
    setEditExecutorSearch(value);
    setShowEditExecutorDropdown(true);
  };

  const handleEditExecutorSelect = (dept) => {
    setEditForm(prev => ({ ...prev, executorDepartment: dept }));
    setEditExecutorSearch(dept);
    setShowEditExecutorDropdown(false);
  };

  const handleEditExecutorFocus = () => {
    setShowEditExecutorDropdown(true);
  };

  const handleEditExecutorBlur = () => {
    setTimeout(() => setShowEditExecutorDropdown(false), 200);
  };

  // 편집 취소
  const handleCancelEdit = () => {
    setEditingBudget(null);
    setEditForm({
      projectName: '',
      initiatorDepartment: '',
      executorDepartment: '',
      budgetType: '',
      budgetCategory: '',
      budgetAmount: '',
      startDate: '',
      endDate: '',
      isEssential: false,
      projectPurpose: '',
      budgetYear: selectedYear
    });
  };

  // 편집 저장
  const handleSaveEdit = async (budgetId) => {
    try {
      // 예산 금액에서 콤마 제거하고 숫자로 변환
      const submitData = {
        ...editForm,
        budgetAmount: editForm.budgetAmount ? parseInt(editForm.budgetAmount.replace(/[^\d]/g, '')) : 0
      };

      const response = await fetch(`${API_BASE_URL}/api/business-budgets/${budgetId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      if (response.ok) {
        // 데이터 다시 로드
        const refreshResponse = await fetch(`${API_BASE_URL}/api/budget-statistics`);
        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          const budgets = data.budgetData || [];
          const filteredData = budgets.filter(budget => 
            budget.budgetYear === selectedYear
          );
          setBudgets(filteredData);
        }
        
        setEditingBudget(null);
        alert('예산이 성공적으로 수정되었습니다.');
      } else {
        alert('예산 수정 실패: ' + response.statusText);
      }
    } catch (error) {
      alert('예산 수정 중 오류가 발생했습니다: ' + error.message);
    }
  };

  // 삭제
  const handleDelete = async (budgetId) => {
    if (!window.confirm('정말로 이 예산을 삭제하시겠습니까?')) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/business-budgets/${budgetId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // 데이터 다시 로드
        const refreshResponse = await fetch(`${API_BASE_URL}/api/budget-statistics`);
        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          const budgets = data.budgetData || [];
          const filteredData = budgets.filter(budget => 
            budget.budgetYear === selectedYear
          );
          setBudgets(filteredData);
        }
        
        alert('예산이 성공적으로 삭제되었습니다.');
      } else {
        alert('예산 삭제 실패: ' + response.statusText);
      }
    } catch (error) {
      alert('예산 삭제 중 오류가 발생했습니다: ' + error.message);
    }
  };

  // 예산 합계 계산
  const calculateBudgetSummary = () => {
    const summary = {
      capitalBudget: {
        total: 0,
        categories: {
          '일반사업': 0,
          '보안사업': 0,
          '정기성사업': 0
        }
      },
      operationBudget: {
        total: 0,
        categories: {
          '증권전산운용비': 0,
          '전산수선비': 0,
          '전산임차료': 0,
          '전산용역비': 0,
          '전산회선료': 0,
          '기타': 0
        }
      },
      total: 0
    };

    budgets.forEach(budget => {
      const amount = parseInt(budget.budgetAmount) || 0;
      summary.total += amount;

      if (budget.budgetType === '자본예산') {
        summary.capitalBudget.total += amount;
        if (summary.capitalBudget.categories[budget.budgetCategory] !== undefined) {
          summary.capitalBudget.categories[budget.budgetCategory] += amount;
        }
      } else if (budget.budgetType === '전산운용비') {
        summary.operationBudget.total += amount;
        if (summary.operationBudget.categories[budget.budgetCategory] !== undefined) {
          summary.operationBudget.categories[budget.budgetCategory] += amount;
        }
      }
    });

    return summary;
  };

  // 상태별 색상 반환
  const getStatusColor = (status) => {
    switch (status) {
      case '승인대기': return '#ffc107';
      case '진행중': return '#007bff';
      case '완료': return '#28a745';
      case '반려': return '#dc3545';
      default: return '#6c757d';
    }
  };

  // 예산 유형별 색상 반환
  const getBudgetTypeColor = (type) => {
    switch (type) {
      case '자본예산': return '#6f42c1';
      case '전산운용비': return '#fd7e14';
      default: return '#6c757d';
    }
  };

  // 금액 포맷팅
  const formatCurrency = (amount) => {
    // 소수점 제거하고 정수로 변환
    const integerAmount = Math.round(amount);
    return new Intl.NumberFormat('ko-KR').format(integerAmount) + '원';
  };

  if (loading) {
    return (
      <div className="budget-registration">
        <h1>사업예산 관리</h1>
        <div className="loading">데이터를 불러오는 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="budget-registration">
        <h1>사업예산 관리</h1>
        <div className="error">오류: {error}</div>
      </div>
    );
  }

  const budgetSummary = calculateBudgetSummary();
  const sortedBudgets = getSortedData();

  return (
    <div className="budget-registration">
      <h1>사업예산 관리</h1>
      
      {/* 연도 선택 */}
      <div className="year-selector">
        <h2>관리 연도 선택</h2>
        <div className="year-buttons">
          <button
            className={`year-button ${selectedYear === new Date().getFullYear() ? 'active' : ''}`}
            onClick={() => setSelectedYear(new Date().getFullYear())}
          >
            {new Date().getFullYear()}년 (당해연도)
          </button>
          <button
            className={`year-button ${selectedYear === new Date().getFullYear() + 1 ? 'active' : ''}`}
            onClick={() => setSelectedYear(new Date().getFullYear() + 1)}
          >
            {new Date().getFullYear() + 1}년 (차년도)
          </button>
        </div>
      </div>
      
      {/* 새 예산 등록 섹션 */}
      <div className="new-budget-section">
        <div className="section-header">
          <h2>새 예산 등록</h2>
          <button 
            type="button" 
            className="toggle-btn"
            onClick={() => setShowRegistrationForm(!showRegistrationForm)}
          >
            {showRegistrationForm ? '접기' : '펼치기'}
          </button>
        </div>
        
        {showRegistrationForm && (
          <div className="registration-form">
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>사업명</label>
                  <input
                    type="text"
                    name="projectName"
                    value={formData.projectName}
                    onChange={handleChange}
                    placeholder="사업명을 입력하세요"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>발의부서</label>
                  <div className="searchable-dropdown">
                    <input
                      type="text"
                      value={initiatorSearch}
                      onChange={handleInitiatorSearch}
                      onFocus={handleInitiatorFocus}
                      onBlur={handleInitiatorBlur}
                      placeholder="부서명 검색 또는 선택"
                      required
                    />
                    {showInitiatorDropdown && (
                      <div className="dropdown-list">
                        {getFilteredDepartments(initiatorSearch).map((dept, index) => (
                          <div
                            key={index}
                            className="dropdown-item"
                            onClick={() => handleInitiatorSelect(dept)}
                          >
                            {dept}
                          </div>
                        ))}
                        {getFilteredDepartments(initiatorSearch).length === 0 && (
                          <div className="dropdown-item no-results">검색 결과가 없습니다</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="form-group">
                  <label>추진부서</label>
                  <div className="searchable-dropdown">
                    <input
                      type="text"
                      value={executorSearch}
                      onChange={handleExecutorSearch}
                      onFocus={handleExecutorFocus}
                      onBlur={handleExecutorBlur}
                      placeholder="부서명 검색 또는 선택"
                      required
                    />
                    {showExecutorDropdown && (
                      <div className="dropdown-list">
                        {getFilteredDepartments(executorSearch).map((dept, index) => (
                          <div
                            key={index}
                            className="dropdown-item"
                            onClick={() => handleExecutorSelect(dept)}
                          >
                            {dept}
                          </div>
                        ))}
                        {getFilteredDepartments(executorSearch).length === 0 && (
                          <div className="dropdown-item no-results">검색 결과가 없습니다</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="form-group">
                  <label>예산 유형</label>
                  <select name="budgetType" value={formData.budgetType} onChange={handleChange} required>
                    <option value="">선택</option>
                    <option value="자본예산">자본예산</option>
                    <option value="전산운용비">전산운용비</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>세부 분류</label>
                  <select name="budgetCategory" value={formData.budgetCategory} onChange={handleChange} required>
                    <option value="">선택</option>
                    {formData.budgetType && budgetTypes[formData.budgetType]?.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label>예산 금액</label>
                  <input
                    type="text"
                    name="budgetAmount"
                    value={formData.budgetAmount}
                    onChange={handleChange}
                    placeholder="예: 1,000,000"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>필수사업 여부</label>
                  <select name="isEssential" value={formData.isEssential} onChange={handleChange} required>
                    <option value="">선택</option>
                    <option value={true}>필수사업</option>
                    <option value={false}>일반사업</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>시작일</label>
                  <input
                    type="month"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>종료일</label>
                  <input
                    type="month"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>사업 목적</label>
                  <select name="projectPurpose" value={formData.projectPurpose} onChange={handleChange} required>
                    <option value="">선택</option>
                    {projectPurposes.map(purpose => (
                      <option key={purpose.value} value={purpose.value}>
                        {purpose.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">예산 등록</button>
                <button type="button" className="btn btn-secondary" onClick={resetForm}>
                  초기화
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* 예산 현황 요약 */}
      <div className="summary-section">
        <h2>예산 현황 요약</h2>
        <div className="summary-cards">
          <div className="summary-card">
            <h3>총 예산</h3>
            <div className="amount">{formatCurrency(budgetSummary.total)}</div>
            <div className="count">총 {budgets.length}개 사업</div>
          </div>
          <div className="summary-card">
            <h3>자본예산</h3>
            <div className="amount">{formatCurrency(budgetSummary.capitalBudget.total)}</div>
            <div className="breakdown">
              {Object.entries(budgetSummary.capitalBudget.categories).map(([category, amount]) => (
                <div key={category} className="category">
                  <span>{category}:</span>
                  <span>{formatCurrency(amount)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="summary-card">
            <h3>전산운용비</h3>
            <div className="amount">{formatCurrency(budgetSummary.operationBudget.total)}</div>
            <div className="breakdown">
              {Object.entries(budgetSummary.operationBudget.categories).map(([category, amount]) => (
                <div key={category} className="category">
                  <span>{category}:</span>
                  <span>{formatCurrency(amount)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 예산 목록 */}
      <div className="budget-list-section">
        <h2>등록된 예산 목록</h2>
        
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th className="sortable" onClick={() => handleSort('projectName')}>
                  사업명 {getSortIcon('projectName')}
                </th>
                <th className="sortable" onClick={() => handleSort('initiatorDepartment')}>
                  발의부서 {getSortIcon('initiatorDepartment')}
                </th>
                <th className="sortable" onClick={() => handleSort('executorDepartment')}>
                  추진부서 {getSortIcon('executorDepartment')}
                </th>
                <th className="sortable" onClick={() => handleSort('budgetType')}>
                  예산유형 {getSortIcon('budgetType')}
                </th>
                <th className="sortable" onClick={() => handleSort('budgetCategory')}>
                  세부분류 {getSortIcon('budgetCategory')}
                </th>
                <th className="sortable" onClick={() => handleSort('budgetAmount')}>
                  예산금액 {getSortIcon('budgetAmount')}
                </th>
                <th className="sortable" onClick={() => handleSort('isEssential')}>
                  필수사업 {getSortIcon('isEssential')}
                </th>
                <th className="sortable" onClick={() => handleSort('projectPurpose')}>
                  사업목적 {getSortIcon('projectPurpose')}
                </th>
                <th className="sortable" onClick={() => handleSort('startDate')}>
                  사업기간 {getSortIcon('startDate')}
                </th>
                <th className="sortable" onClick={() => handleSort('status')}>
                  상태 {getSortIcon('status')}
                </th>
                <th className="sortable" onClick={() => handleSort('createdAt')}>
                  등록일 {getSortIcon('createdAt')}
                </th>
                <th>작업</th>
              </tr>
            </thead>
            <tbody>
              {sortedBudgets.map(budget => (
                <tr key={budget.id}>
                  <td>
                    {editingBudget === budget.id ? (
                      <input
                        type="text"
                        value={editForm.projectName}
                        onChange={(e) => setEditForm({...editForm, projectName: e.target.value})}
                      />
                    ) : (
                      budget.projectName
                    )}
                  </td>
                  <td>
                    {editingBudget === budget.id ? (
                      <div className="searchable-dropdown">
                        <input
                          type="text"
                          value={editInitiatorSearch}
                          onChange={handleEditInitiatorSearch}
                          onFocus={handleEditInitiatorFocus}
                          onBlur={handleEditInitiatorBlur}
                          placeholder="부서명 검색"
                        />
                        {showEditInitiatorDropdown && (
                          <div className="dropdown-list">
                            {getFilteredDepartments(editInitiatorSearch).map((dept, index) => (
                              <div
                                key={index}
                                className="dropdown-item"
                                onClick={() => handleEditInitiatorSelect(dept)}
                              >
                                {dept}
                              </div>
                            ))}
                            {getFilteredDepartments(editInitiatorSearch).length === 0 && (
                              <div className="dropdown-item no-results">검색 결과가 없습니다</div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      budget.initiatorDepartment
                    )}
                  </td>
                  <td>
                    {editingBudget === budget.id ? (
                      <div className="searchable-dropdown">
                        <input
                          type="text"
                          value={editExecutorSearch}
                          onChange={handleEditExecutorSearch}
                          onFocus={handleEditExecutorFocus}
                          onBlur={handleEditExecutorBlur}
                          placeholder="부서명 검색"
                        />
                        {showEditExecutorDropdown && (
                          <div className="dropdown-list">
                            {getFilteredDepartments(editExecutorSearch).map((dept, index) => (
                              <div
                                key={index}
                                className="dropdown-item"
                                onClick={() => handleEditExecutorSelect(dept)}
                              >
                                {dept}
                              </div>
                            ))}
                            {getFilteredDepartments(editExecutorSearch).length === 0 && (
                              <div className="dropdown-item no-results">검색 결과가 없습니다</div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      budget.executorDepartment
                    )}
                  </td>
                  <td>
                    {editingBudget === budget.id ? (
                      <select
                        value={editForm.budgetType}
                        onChange={(e) => setEditForm({...editForm, budgetType: e.target.value})}
                      >
                        <option value="">선택</option>
                        <option value="자본예산">자본예산</option>
                        <option value="전산운용비">전산운용비</option>
                      </select>
                    ) : (
                      <span style={{color: getBudgetTypeColor(budget.budgetType)}}>
                        {budget.budgetType}
                      </span>
                    )}
                  </td>
                  <td>
                    {editingBudget === budget.id ? (
                      <select
                        value={editForm.budgetCategory}
                        onChange={(e) => setEditForm({...editForm, budgetCategory: e.target.value})}
                      >
                        <option value="">선택</option>
                        {editForm.budgetType && budgetTypes[editForm.budgetType]?.map(category => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    ) : (
                      budget.budgetCategory
                    )}
                  </td>
                  <td>
                    {editingBudget === budget.id ? (
                      <input
                        type="text"
                        name="budgetAmount"
                        value={editForm.budgetAmount}
                        onChange={handleEditChange}
                        placeholder="예산 금액"
                      />
                    ) : (
                      formatCurrency(budget.budgetAmount)
                    )}
                  </td>
                  <td>
                    {editingBudget === budget.id ? (
                      <select
                        value={editForm.isEssential}
                        onChange={(e) => setEditForm({...editForm, isEssential: e.target.value === 'true'})}
                      >
                        <option value="">선택</option>
                        <option value={true}>필수사업</option>
                        <option value={false}>일반사업</option>
                      </select>
                    ) : (
                      budget.isEssential ? '필수사업' : '일반사업'
                    )}
                  </td>
                  <td>
                    {editingBudget === budget.id ? (
                      <select
                        value={editForm.projectPurpose}
                        onChange={(e) => setEditForm({...editForm, projectPurpose: e.target.value})}
                      >
                        <option value="">선택</option>
                        {projectPurposes.map(purpose => (
                          <option key={purpose.value} value={purpose.value}>
                            {purpose.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      projectPurposes.find(p => p.value === budget.projectPurpose)?.label || budget.projectPurpose
                    )}
                  </td>
                  <td>
                    {editingBudget === budget.id ? (
                      <div className="date-inputs">
                        <input
                          type="month"
                          value={editForm.startDate}
                          onChange={(e) => setEditForm({...editForm, startDate: e.target.value})}
                        />
                        <span>~</span>
                        <input
                          type="month"
                          value={editForm.endDate}
                          onChange={(e) => setEditForm({...editForm, endDate: e.target.value})}
                        />
                      </div>
                    ) : (
                      `${budget.startDate} ~ ${budget.endDate}`
                    )}
                  </td>
                  <td>
                    <span style={{color: getStatusColor(budget.status)}}>
                      {budget.status}
                    </span>
                  </td>
                  <td>{budget.createdAt}</td>
                  <td>
                    {editingBudget === budget.id ? (
                      <div className="action-buttons">
                        <button
                          onClick={() => handleSaveEdit(budget.id)}
                          className="btn btn-success"
                          style={{ marginRight: '0.5rem' }}
                        >
                          저장
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="btn btn-secondary"
                        >
                          취소
                        </button>
                      </div>
                    ) : (
                      <div className="action-buttons">
                        <button
                          onClick={() => handleEdit(budget)}
                          className="btn btn-secondary"
                          style={{ marginRight: '0.5rem' }}
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleDelete(budget.id)}
                          className="btn btn-danger"
                        >
                          삭제
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BudgetRegistrationAPI; 