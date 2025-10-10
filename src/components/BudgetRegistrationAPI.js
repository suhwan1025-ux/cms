import React, { useState, useEffect } from 'react';
import { getApiUrl } from '../config/api';
import './BudgetRegistrationAPI.css';

// API 베이스 URL 설정
const API_BASE_URL = getApiUrl();

const BudgetRegistrationAPI = () => {
  const [formData, setFormData] = useState({
    projectName: '',
    initiatorDepartment: '', // 발의부서
    executorDepartment: '', // 추진부서
    budgetType: '자본예산', // 자본예산 고정
    budgetCategory: '', // 세부 분류 (이연예산, 계획예산, 추가예산)
    budgetAmount: '',
    startDate: '',
    endDate: '',
    isEssential: '', // 필수사업여부 (필수/선택)
    projectPurpose: '', // 사업목적
    budgetYear: new Date().getFullYear(), // 예산년도
    status: '대기', // 상태
    executedAmount: '', // 기 집행
    pendingAmount: '', // 집행대기
    confirmedExecutionAmount: '', // 확정집행액
    unexecutedAmount: '', // 미집행액
    additionalBudget: '', // 추가예산
    holdCancelReason: '', // 보류/취소 사유
    notes: '', // 비고
    itPlanReported: false // IT계획서 보고여부
  });

  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingBudget, setEditingBudget] = useState(null);
  const [editForm, setEditForm] = useState({
    projectName: '',
    initiatorDepartment: '',
    executorDepartment: '',
    budgetType: '자본예산',
    budgetCategory: '',
    budgetAmount: '',
    startDate: '',
    endDate: '',
    isEssential: '',
    projectPurpose: '',
    budgetYear: new Date().getFullYear()
  });

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear()); // 현재 연도
  const [showRegistrationForm, setShowRegistrationForm] = useState(false); // 등록 폼 표시 상태
  const [isEditMode, setIsEditMode] = useState(false); // 수정 모드 여부
  const [editingBudgetId, setEditingBudgetId] = useState(null); // 수정 중인 예산 ID

  // 조회 필터 상태
  const [searchFilters, setSearchFilters] = useState({
    budgetYear: new Date().getFullYear(),
    projectName: '',
    budgetCategory: '',
    status: '',
    initiatorDepartment: '',
    executorDepartment: '',
    isEssential: '',
    projectPurpose: '',
    itPlanReported: ''
  });

  const [filteredBudgets, setFilteredBudgets] = useState([]);

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
  
  // 사업목적 팝업 상태
  const [showPurposeModal, setShowPurposeModal] = useState(false);
  const [projectPurposes, setProjectPurposes] = useState([]);
  const [modalYear, setModalYear] = useState(selectedYear); // 팝업 내에서 사용하는 연도
  const [newPurpose, setNewPurpose] = useState({ code: '', description: '', year: selectedYear });
  const [editingPurpose, setEditingPurpose] = useState(null);

  // 예산 분류 옵션 (자본예산 고정)
  const budgetCategories = ['이연예산', '계획예산', '추가예산'];

  // 부서 목록 (API에서 가져올 예정)
  const [departments, setDepartments] = useState([]);

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
        // 사업예산 데이터 가져오기 (모든 연도)
        const budgetResponse = await fetch(`${API_BASE_URL}/api/budget-statistics`);
        if (budgetResponse.ok) {
          const data = await budgetResponse.json();
          // budgetData 필드에서 실제 예산 목록 가져오기
          const budgets = data.budgetData || [];
          // 모든 데이터를 로드 (필터링은 나중에)
          setBudgets(budgets);
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

        // 사업목적은 팝업을 열 때 로드됨
      } catch (error) {
        setError('API 호출 오류: ' + error.message);
        console.error('API 호출 오류:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []); // 최초 1회만 로드

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

  // 필터 적용
  useEffect(() => {
    let filtered = budgets.filter(budget => {
      // 사업연도 필터
      if (searchFilters.budgetYear && budget.budgetYear !== parseInt(searchFilters.budgetYear)) {
        return false;
      }
      // 사업명 검색
      if (searchFilters.projectName && !budget.projectName.toLowerCase().includes(searchFilters.projectName.toLowerCase())) {
        return false;
      }
      // 예산 구분 필터
      if (searchFilters.budgetCategory && budget.budgetCategory !== searchFilters.budgetCategory) {
        return false;
      }
      // 상태 필터
      if (searchFilters.status && budget.status !== searchFilters.status) {
        return false;
      }
      // 발의부서 필터
      if (searchFilters.initiatorDepartment && budget.initiatorDepartment !== searchFilters.initiatorDepartment) {
        return false;
      }
      // 추진부서 필터
      if (searchFilters.executorDepartment && budget.executorDepartment !== searchFilters.executorDepartment) {
        return false;
      }
      // 필수사업여부 필터
      if (searchFilters.isEssential !== '') {
        const budgetEssentialStr = budget.isEssential === true || budget.isEssential === '필수' ? '필수' : '선택';
        if (budgetEssentialStr !== searchFilters.isEssential) {
          return false;
        }
      }
      // 사업목적 필터
      if (searchFilters.projectPurpose && budget.projectPurpose !== searchFilters.projectPurpose) {
        return false;
      }
      // IT 보고여부 필터
      if (searchFilters.itPlanReported !== '') {
        const expectedValue = searchFilters.itPlanReported === 'true';
        const actualValue = budget.itPlanReported === true || budget.itPlanReported === 'true';
        if (actualValue !== expectedValue) {
          return false;
        }
      }
      return true;
    });
    setFilteredBudgets(filtered);
  }, [budgets, searchFilters]);

  // 필터 초기화
  const handleResetFilters = () => {
    setSearchFilters({
      budgetYear: new Date().getFullYear(),
      projectName: '',
      budgetCategory: '',
      status: '',
      initiatorDepartment: '',
      executorDepartment: '',
      isEssential: '',
      projectPurpose: '',
      itPlanReported: ''
    });
  };

  // 예산 등록 또는 수정
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 필수 필드 검증
    if (!formData.projectName || !formData.initiatorDepartment || !formData.executorDepartment || 
        !formData.budgetCategory || !formData.budgetAmount || 
        !formData.startDate || !formData.endDate || formData.isEssential === '') {
      alert('모든 필수 필드를 입력해주세요.');
      return;
    }

    try {
      // 모든 금액 필드에서 콤마 제거하고 숫자로 변환, isEssential을 boolean으로 변환
      const submitData = {
        ...formData,
        budgetAmount: formData.budgetAmount ? parseInt(formData.budgetAmount.replace(/[^\d]/g, '')) : 0,
        executedAmount: formData.executedAmount ? parseInt(formData.executedAmount.replace(/[^\d]/g, '')) : 0,
        pendingAmount: formData.pendingAmount ? parseInt(formData.pendingAmount.replace(/[^\d]/g, '')) : 0,
        // confirmedExecutionAmount는 품의서와 JOIN으로 자동 계산되므로 전송하지 않음
        // unexecutedAmount는 자동 계산되므로 전송하지 않음 (예산 - 기집행 - 확정집행액)
        additionalBudget: formData.additionalBudget ? parseInt(formData.additionalBudget.replace(/[^\d]/g, '')) : 0,
        isEssential: formData.isEssential === '필수' ? true : false
      };

      let response;
      if (isEditMode && editingBudgetId) {
        // 수정 모드: budgetYear 제외 (수정 불가)
        delete submitData.budgetYear;
        response = await fetch(`${API_BASE_URL}/api/business-budgets/${editingBudgetId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(submitData),
        });
      } else {
        // 등록 모드
        submitData.budgetYear = selectedYear;
        submitData.status = '대기';
        response = await fetch(`${API_BASE_URL}/api/business-budgets`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(submitData),
        });
      }

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
        
        alert(isEditMode ? '예산이 성공적으로 수정되었습니다.' : '예산이 성공적으로 등록되었습니다.');
      } else {
        const errorData = await response.text();
        console.error('Server error response:', errorData);
        alert((isEditMode ? '예산 수정 실패: ' : '예산 등록 실패: ') + response.statusText + '\n' + errorData);
      }
    } catch (error) {
      console.error('Submit error:', error);
      alert((isEditMode ? '예산 수정 중 ' : '예산 등록 중 ') + '오류가 발생했습니다: ' + error.message);
    }
  };

  // 폼 입력 처리
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    let processedValue = value;
    
    // 금액 관련 필드에 콤마 추가
    const amountFields = ['budgetAmount', 'executedAmount', 'pendingAmount', 'additionalBudget'];
    // confirmedExecutionAmount, unexecutedAmount는 읽기 전용이므로 제외
    if (amountFields.includes(name)) {
      // 숫자와 콤마만 허용
      const numericValue = value.replace(/[^\d]/g, '');
      if (numericValue) {
        processedValue = parseInt(numericValue).toLocaleString();
      } else {
        processedValue = '';
      }
    }
    
    setFormData(prev => {
      const newFormData = {
        ...prev,
        [name]: type === 'checkbox' ? checked : processedValue
      };
      
      // 예산, 기집행, 확정집행액이 변경되면 미집행액 자동 계산
      if (['budgetAmount', 'executedAmount', 'confirmedExecutionAmount'].includes(name)) {
        const budget = parseInt((name === 'budgetAmount' ? processedValue : newFormData.budgetAmount || '0').replace(/[^\d]/g, '')) || 0;
        const executed = parseInt((name === 'executedAmount' ? processedValue : newFormData.executedAmount || '0').replace(/[^\d]/g, '')) || 0;
        const confirmed = parseInt((name === 'confirmedExecutionAmount' ? processedValue : newFormData.confirmedExecutionAmount || '0').replace(/[^\d]/g, '')) || 0;
        
        const unexecuted = budget - executed - confirmed;
        newFormData.unexecutedAmount = unexecuted > 0 ? unexecuted.toLocaleString() : '0';
      }
      
      return newFormData;
    });
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
      budgetType: '자본예산',
      budgetCategory: '',
      budgetAmount: '',
      startDate: defaultDates.startDate,
      endDate: defaultDates.endDate,
      isEssential: '',
      projectPurpose: '',
      budgetYear: selectedYear,
      status: '대기',
      executedAmount: '',
      pendingAmount: '',
      confirmedExecutionAmount: '',
      unexecutedAmount: '',
      additionalBudget: '',
      holdCancelReason: '',
      notes: '',
      itPlanReported: false
    });
    setInitiatorSearch('');
    setExecutorSearch('');
    setShowInitiatorDropdown(false);
    setShowExecutorDropdown(false);
    setIsEditMode(false);
    setEditingBudgetId(null);
  };

  // 테이블 행 클릭 시 데이터 로드 (수정 모드로 전환)
  const handleRowClick = (budget) => {
    // 미집행액 자동 계산: 예산 - (기집행 + 확정집행액)
    const budgetAmt = budget.budgetAmount || 0;
    const executedAmt = budget.executedAmount || 0;
    const confirmedAmt = budget.confirmedExecutionAmount || 0;
    const unexecutedAmt = Math.max(0, budgetAmt - executedAmt - confirmedAmt);
    
    setFormData({
      projectName: budget.projectName,
      initiatorDepartment: budget.initiatorDepartment,
      executorDepartment: budget.executorDepartment,
      budgetType: '자본예산',
      budgetCategory: budget.budgetCategory,
      budgetAmount: budget.budgetAmount ? budget.budgetAmount.toLocaleString() : '',
      startDate: budget.startDate,
      endDate: budget.endDate,
      isEssential: budget.isEssential === true || budget.isEssential === '필수' ? '필수' : '선택',
      projectPurpose: budget.projectPurpose,
      budgetYear: budget.budgetYear, // 표시용으로만 사용 (수정 불가)
      status: budget.status || '대기',
      executedAmount: budget.executedAmount ? budget.executedAmount.toLocaleString() : '',
      pendingAmount: budget.pendingAmount ? budget.pendingAmount.toLocaleString() : '',
      confirmedExecutionAmount: budget.confirmedExecutionAmount ? budget.confirmedExecutionAmount.toLocaleString() : '',
      unexecutedAmount: unexecutedAmt.toLocaleString(), // 자동 계산
      additionalBudget: budget.additionalBudget ? budget.additionalBudget.toLocaleString() : '',
      holdCancelReason: budget.holdCancelReason || '',
      notes: budget.notes || '',
      itPlanReported: budget.itPlanReported || false
    });
    
    setInitiatorSearch(budget.initiatorDepartment);
    setExecutorSearch(budget.executorDepartment);
    setIsEditMode(true);
    setEditingBudgetId(budget.id);
    setShowRegistrationForm(true);
    
    // 폼이 있는 위치로 스크롤
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 사업목적 팝업 열기
  const handleOpenPurposeModal = async () => {
    setModalYear(selectedYear);
    setShowPurposeModal(true);
    // 현재 선택된 연도의 사업목적 로드
    await loadProjectPurposes(selectedYear);
  };

  // 사업목적 팝업 닫기
  const handleClosePurposeModal = () => {
    setShowPurposeModal(false);
    setEditingPurpose(null);
    setModalYear(selectedYear);
    setNewPurpose({ code: '', description: '', year: selectedYear });
  };

  // 사업목적 로드 함수
  const loadProjectPurposes = async (year) => {
    try {
      const purposeResponse = await fetch(`${API_BASE_URL}/api/project-purposes?year=${year}`);
      if (purposeResponse.ok) {
        const purposeData = await purposeResponse.json();
        // DB의 is_fixed를 isFixed로 변환
        const convertedData = purposeData.map(p => ({
          ...p,
          isFixed: p.is_fixed
        }));
        setProjectPurposes(convertedData);
      } else {
        console.error('사업목적 데이터 로드 실패:', purposeResponse.statusText);
      }
    } catch (error) {
      console.error('사업목적 로드 중 오류:', error);
    }
  };

  // 팝업 내 연도 변경 처리
  const handleModalYearChange = async (year) => {
    setModalYear(year);
    setNewPurpose({ code: '', description: '', year: year });
    await loadProjectPurposes(year);
  };

  // 사업목적 선택
  const handleSelectPurpose = (purpose) => {
    setFormData(prev => ({ ...prev, projectPurpose: purpose.code }));
    handleClosePurposeModal();
  };

  // 새 사업목적 추가
  const handleAddPurpose = async () => {
    if (!newPurpose.code || !newPurpose.description) {
      alert('코드와 설명을 모두 입력해주세요.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/project-purposes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPurpose)
      });

      if (response.ok) {
        // 사업목적 목록 다시 로드 (현재 팝업의 연도 기준)
        await loadProjectPurposes(modalYear);
        setNewPurpose({ code: '', description: '', year: modalYear });
        alert('사업목적이 추가되었습니다.');
      } else {
        alert('사업목적 추가 실패');
      }
    } catch (error) {
      alert('사업목적 추가 중 오류 발생: ' + error.message);
    }
  };

  // 사업목적 수정
  const handleUpdatePurpose = async () => {
    if (!editingPurpose) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/project-purposes/${editingPurpose.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingPurpose)
      });

      if (response.ok) {
        // 사업목적 목록 다시 로드 (현재 팝업의 연도 기준)
        await loadProjectPurposes(modalYear);
        setEditingPurpose(null);
        alert('사업목적이 수정되었습니다.');
      } else {
        const errorData = await response.json();
        alert(errorData.error || '사업목적 수정 실패');
      }
    } catch (error) {
      alert('사업목적 수정 중 오류 발생: ' + error.message);
    }
  };

  // 사업목적 삭제
  const handleDeletePurpose = async (id) => {
    if (!window.confirm('이 사업목적을 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/project-purposes/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        // 사업목적 목록 다시 로드 (현재 팝업의 연도 기준)
        await loadProjectPurposes(modalYear);
        alert('사업목적이 삭제되었습니다.');
      } else {
        const errorData = await response.json();
        alert(errorData.error || '사업목적 삭제 실패');
      }
    } catch (error) {
      alert('사업목적 삭제 중 오류 발생: ' + error.message);
    }
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
      
      {/* 새 예산 등록 섹션 */}
      <div className="new-budget-section">
        <div className="section-header">
          <h2>{isEditMode ? '예산 수정' : '새 예산 등록'}</h2>
          <div>
            {isEditMode && (
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={resetForm}
                style={{ marginRight: '10px' }}
              >
                수정 취소
              </button>
            )}
            <button 
              type="button" 
              className="toggle-btn"
              onClick={() => setShowRegistrationForm(!showRegistrationForm)}
            >
              {showRegistrationForm ? '접기' : '펼치기'}
            </button>
          </div>
        </div>
        
        {showRegistrationForm && (
          <div className="registration-form">
            <form onSubmit={handleSubmit}>
              {/* 섹션 2열 그리드 */}
              <div className="form-sections-grid">
                {/* 기본 정보 섹션 */}
                <div className="form-section">
                  <h3 className="section-title">📋 기본 정보</h3>
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label>사업명 <span className="required">*</span></label>
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
                    <label>발의부서 <span className="required">*</span></label>
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
                    <label>추진부서 <span className="required">*</span></label>
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
                    <label>사업연도 {isEditMode && '(수정 불가)'}</label>
                    <input
                      type="number"
                      name="budgetYear"
                      value={formData.budgetYear}
                      onChange={handleChange}
                      disabled={isEditMode}
                      style={{ backgroundColor: isEditMode ? '#e9ecef' : 'white', cursor: isEditMode ? 'not-allowed' : 'text' }}
                      required
                    />
                  </div>
                </div>
                </div>

                {/* 예산 정보 섹션 */}
                <div className="form-section">
                  <h3 className="section-title">💰 예산 정보</h3>
                <input type="hidden" name="budgetType" value="자본예산" />
                <div className="form-grid">
                  <div className="form-group">
                    <label>예산 구분 <span className="required">*</span></label>
                    <select name="budgetCategory" value={formData.budgetCategory} onChange={handleChange} required>
                      <option value="">선택</option>
                      {budgetCategories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>예산 금액 <span className="required">*</span></label>
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
                    <label>추가예산</label>
                    <input
                      type="text"
                      name="additionalBudget"
                      value={formData.additionalBudget}
                      onChange={handleChange}
                      placeholder="예: 1,000,000"
                    />
                  </div>
                </div>
                </div>

                {/* 사업 기간 및 분류 섹션 */}
                <div className="form-section">
                  <h3 className="section-title">📅 사업 기간 및 분류</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>시작일 <span className="required">*</span></label>
                    <input
                      type="month"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>종료일 <span className="required">*</span></label>
                    <input
                      type="month"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>필수사업 여부 <span className="required">*</span></label>
                    <select name="isEssential" value={formData.isEssential} onChange={handleChange} required>
                      <option value="">선택</option>
                      <option value="필수">필수</option>
                      <option value="선택">선택</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>사업 목적 <span className="required">*</span></label>
                    <input
                      type="text"
                      name="projectPurpose"
                      value={formData.projectPurpose}
                      onClick={handleOpenPurposeModal}
                      placeholder="클릭하여 사업목적 선택"
                      readOnly
                      required
                      style={{ cursor: 'pointer' }}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>상태 <span className="required">*</span></label>
                    <select name="status" value={formData.status} onChange={handleChange} required>
                      <option value="대기">대기</option>
                      <option value="완료(지연)">완료(지연)</option>
                      <option value="완료(적기)">완료(적기)</option>
                      <option value="진행중">진행중</option>
                    </select>
                  </div>
                </div>
                </div>

                {/* 집행 현황 섹션 */}
                <div className="form-section">
                  <h3 className="section-title">📊 집행 현황</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>기 집행</label>
                    <input
                      type="text"
                      name="executedAmount"
                      value={formData.executedAmount}
                      onChange={handleChange}
                      placeholder="예: 1,000,000"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>집행대기</label>
                    <input
                      type="text"
                      name="pendingAmount"
                      value={formData.pendingAmount}
                      onChange={handleChange}
                      placeholder="예: 1,000,000"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>확정집행액 <span style={{ fontSize: '0.8em', color: '#666' }}>(자동 계산)</span></label>
                    <input
                      type="text"
                      name="confirmedExecutionAmount"
                      value={formData.confirmedExecutionAmount}
                      onChange={handleChange}
                      placeholder="품의완료 시 자동 계산됨"
                      readOnly
                      style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                      title="확정집행액은 결재완료된 품의서 금액의 합계로 자동 계산됩니다"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>미집행액 <span style={{ fontSize: '0.8em', color: '#666' }}>(자동 계산)</span></label>
                    <input
                      type="text"
                      name="unexecutedAmount"
                      value={formData.unexecutedAmount}
                      onChange={handleChange}
                      placeholder="예산 - 기집행 - 확정집행액"
                      readOnly
                      style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                      title="미집행액 = 예산 - (기집행 + 확정집행액)"
                    />
                  </div>
                </div>
                </div>

                {/* 추가 정보 섹션 */}
                <div className="form-section">
                <h3 className="section-title">📝 추가 정보</h3>
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label>보류/취소 사유</label>
                    <textarea
                      name="holdCancelReason"
                      value={formData.holdCancelReason}
                      onChange={handleChange}
                      rows="3"
                      placeholder="보류 또는 취소 사유를 입력하세요"
                    />
                  </div>
                  
                  <div className="form-group full-width">
                    <label>비고</label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      rows="3"
                      placeholder="추가 메모나 비고사항을 입력하세요"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center' }}>
                      <input
                        type="checkbox"
                        name="itPlanReported"
                        checked={formData.itPlanReported}
                        onChange={handleChange}
                        style={{ width: 'auto', marginRight: '10px' }}
                      />
                      정보기술부문계획서 보고 완료
                    </label>
                  </div>
                </div>
                </div>
              </div>
              
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  {isEditMode ? '예산 수정' : '예산 등록'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={resetForm}>
                  {isEditMode ? '취소' : '초기화'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* 사업예산 조회 */}
      <div className="budget-search-section" style={{ marginTop: '3rem' }}>
        <h2>사업예산 조회</h2>
        
        {/* 필터 섹션 */}
        <div className="filter-section" style={{ 
          background: '#f8f9fa', 
          padding: '1.5rem', 
          borderRadius: '8px', 
          marginBottom: '2rem' 
        }}>
          <div className="filter-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '0.8rem',
            marginBottom: '1rem'
          }}>
            {/* 사업연도 */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: 'bold', fontSize: '0.85rem' }}>사업연도</label>
              <select
                value={searchFilters.budgetYear}
                onChange={(e) => setSearchFilters({...searchFilters, budgetYear: parseInt(e.target.value)})}
                style={{ width: '100%', padding: '0.4rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.85rem' }}
              >
                <option value="">전체</option>
                {(() => {
                  const currentYear = new Date().getFullYear();
                  const startYear = currentYear - 5;
                  const endYear = currentYear + 5;
                  const years = [];
                  for (let year = startYear; year <= endYear; year++) {
                    years.push(year);
                  }
                  return years.map(year => (
                    <option key={year} value={year}>{year}년</option>
                  ));
                })()}
              </select>
            </div>

            {/* 사업명 */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: 'bold', fontSize: '0.85rem' }}>사업명</label>
              <input
                type="text"
                value={searchFilters.projectName}
                onChange={(e) => setSearchFilters({...searchFilters, projectName: e.target.value})}
                placeholder="사업명 검색"
                style={{ width: '100%', padding: '0.4rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.85rem' }}
              />
            </div>

            {/* 예산 구분 */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: 'bold', fontSize: '0.85rem' }}>예산 구분</label>
              <select
                value={searchFilters.budgetCategory}
                onChange={(e) => setSearchFilters({...searchFilters, budgetCategory: e.target.value})}
                style={{ width: '100%', padding: '0.4rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.85rem' }}
              >
                <option value="">전체</option>
                {budgetCategories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            {/* 상태 */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: 'bold', fontSize: '0.85rem' }}>상태</label>
              <select
                value={searchFilters.status}
                onChange={(e) => setSearchFilters({...searchFilters, status: e.target.value})}
                style={{ width: '100%', padding: '0.4rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.85rem' }}
              >
                <option value="">전체</option>
                <option value="대기">대기</option>
                <option value="완료(지연)">완료(지연)</option>
                <option value="완료(적기)">완료(적기)</option>
                <option value="진행중">진행중</option>
              </select>
            </div>

            {/* 발의부서 */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: 'bold', fontSize: '0.85rem' }}>발의부서</label>
              <select
                value={searchFilters.initiatorDepartment}
                onChange={(e) => setSearchFilters({...searchFilters, initiatorDepartment: e.target.value})}
                style={{ width: '100%', padding: '0.4rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.85rem' }}
              >
                <option value="">전체</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            {/* 추진부서 */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: 'bold', fontSize: '0.85rem' }}>추진부서</label>
              <select
                value={searchFilters.executorDepartment}
                onChange={(e) => setSearchFilters({...searchFilters, executorDepartment: e.target.value})}
                style={{ width: '100%', padding: '0.4rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.85rem' }}
              >
                <option value="">전체</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            {/* 필수사업여부 */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: 'bold', fontSize: '0.85rem' }}>필수사업</label>
              <select
                value={searchFilters.isEssential}
                onChange={(e) => setSearchFilters({...searchFilters, isEssential: e.target.value})}
                style={{ width: '100%', padding: '0.4rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.85rem' }}
              >
                <option value="">전체</option>
                <option value="필수">필수</option>
                <option value="선택">선택</option>
              </select>
            </div>

            {/* 사업목적 */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: 'bold', fontSize: '0.85rem' }}>사업목적</label>
              <select
                value={searchFilters.projectPurpose}
                onChange={(e) => setSearchFilters({...searchFilters, projectPurpose: e.target.value})}
                style={{ width: '100%', padding: '0.4rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.85rem' }}
              >
                <option value="">전체</option>
                {(() => {
                  // budgets 데이터에서 사용중인 projectPurpose 값들을 추출
                  const purposes = [...new Set(budgets.map(b => b.projectPurpose).filter(p => p))];
                  return purposes.sort().map(purpose => (
                    <option key={purpose} value={purpose}>{purpose}</option>
                  ));
                })()}
              </select>
            </div>

            {/* IT 보고여부 */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: 'bold', fontSize: '0.85rem' }}>IT계획서</label>
              <select
                value={searchFilters.itPlanReported}
                onChange={(e) => setSearchFilters({...searchFilters, itPlanReported: e.target.value})}
                style={{ width: '100%', padding: '0.4rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.85rem' }}
              >
                <option value="">전체</option>
                <option value="true">보고완료</option>
                <option value="false">미보고</option>
              </select>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <button
              onClick={handleResetFilters}
              style={{
                padding: '0.4rem 1rem',
                background: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.85rem'
              }}
            >
              필터 초기화
            </button>
          </div>
        </div>

        {/* 조회 결과 */}
        <div style={{ marginBottom: '1rem' }}>
          <strong>조회 결과: {filteredBudgets.length}건</strong>
        </div>

        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>번호</th>
                <th className="sortable" onClick={() => handleSort('budgetYear')}>
                  사업연도 {getSortIcon('budgetYear')}
                </th>
                <th className="sortable" onClick={() => handleSort('projectName')}>
                  사업명 {getSortIcon('projectName')}
                </th>
                <th className="sortable" onClick={() => handleSort('initiatorDepartment')}>
                  발의부서 {getSortIcon('initiatorDepartment')}
                </th>
                <th className="sortable" onClick={() => handleSort('executorDepartment')}>
                  추진부서 {getSortIcon('executorDepartment')}
                </th>
                <th className="sortable" onClick={() => handleSort('budgetCategory')}>
                  예산 구분 {getSortIcon('budgetCategory')}
                </th>
                <th>사업 시작월</th>
                <th>사업 종료월</th>
                <th className="sortable" onClick={() => handleSort('budgetAmount')}>
                  예산 {getSortIcon('budgetAmount')}
                </th>
                <th>기 집행</th>
                <th>집행대기</th>
                <th>확정집행액</th>
                <th>집행률</th>
                <th>미집행액</th>
                <th>추가예산</th>
                <th className="sortable" onClick={() => handleSort('status')}>
                  상태 {getSortIcon('status')}
                </th>
                <th>필수사업</th>
                <th>사업목적</th>
                <th>IT계획서</th>
                <th className="sortable" onClick={() => handleSort('createdAt')}>
                  등록일 {getSortIcon('createdAt')}
                </th>
                <th>등록자</th>
              </tr>
            </thead>
            <tbody>
              {sortedBudgets.filter(budget => filteredBudgets.find(f => f.id === budget.id)).map((budget, index) => (
                <tr 
                  key={budget.id}
                  onClick={() => handleRowClick(budget)}
                  style={{ 
                    cursor: 'pointer',
                    backgroundColor: editingBudgetId === budget.id ? '#fff3cd' : 'transparent'
                  }}
                  className="budget-row"
                >
                  <td>{index + 1}</td>
                  <td>{budget.budgetYear}</td>
                  <td>{budget.projectName}</td>
                  <td>{budget.initiatorDepartment}</td>
                  <td>{budget.executorDepartment}</td>
                  <td>{budget.budgetCategory}</td>
                  <td>{budget.startDate}</td>
                  <td>{budget.endDate}</td>
                  <td style={{ textAlign: 'right' }}>{formatCurrency(budget.budgetAmount)}</td>
                  <td style={{ textAlign: 'right' }}>{formatCurrency(budget.executedAmount || 0)}</td>
                  <td style={{ textAlign: 'right' }}>{formatCurrency(budget.pendingAmount || 0)}</td>
                  <td style={{ textAlign: 'right' }}>{formatCurrency(budget.confirmedExecutionAmount || 0)}</td>
                  <td style={{ textAlign: 'right' }}>{budget.executionRate || 0}%</td>
                  <td style={{ textAlign: 'right' }}>{formatCurrency(budget.unexecutedAmount || 0)}</td>
                  <td style={{ textAlign: 'right' }}>{formatCurrency(budget.additionalBudget || 0)}</td>
                  <td>
                    <span style={{ color: getStatusColor(budget.status) }}>
                      {budget.status}
                    </span>
                  </td>
                  <td>{budget.isEssential === true || budget.isEssential === '필수' ? '필수' : budget.isEssential === false || budget.isEssential === '선택' ? '선택' : '-'}</td>
                  <td>{budget.projectPurpose || '-'}</td>
                  <td>{budget.itPlanReported ? '보고완료' : '미보고'}</td>
                  <td>{budget.createdAt ? new Date(budget.createdAt).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' }).replace(/\./g, '-').replace(/\s/g, '') : '-'}</td>
                  <td>{budget.createdBy || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 사업목적 관리 팝업 */}
      {showPurposeModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '2rem',
            maxWidth: '800px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            {/* 헤더: 제목과 연도 선택 */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '1.5rem',
              paddingBottom: '1rem',
              borderBottom: '2px solid #e9ecef'
            }}>
              <h2 style={{ margin: 0 }}>사업목적 관리</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <label style={{ fontWeight: 'bold', color: '#495057' }}>조회 연도:</label>
                <select 
                  value={modalYear} 
                  onChange={(e) => handleModalYearChange(parseInt(e.target.value))}
                  style={{
                    padding: '0.5rem 1rem',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    color: '#495057',
                    cursor: 'pointer',
                    backgroundColor: 'white'
                  }}
                >
                  {(() => {
                    const currentYear = new Date().getFullYear();
                    const startYear = currentYear - 5; // 과거 5년
                    const endYear = currentYear + 5; // 미래 5년
                    const years = [];
                    for (let year = startYear; year <= endYear; year++) {
                      years.push(year);
                    }
                    return years.map(year => (
                      <option key={year} value={year}>{year}년</option>
                    ));
                  })()}
                </select>
              </div>
            </div>
            
            {/* 새 사업목적 추가 */}
            <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
              <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>새 사업목적 추가</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 100px', gap: '0.5rem', alignItems: 'end' }}>
                <input
                  type="text"
                  placeholder="코드 (예: A)"
                  value={newPurpose.code}
                  onChange={(e) => setNewPurpose({...newPurpose, code: e.target.value})}
                  style={{ padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                />
                <input
                  type="text"
                  placeholder="설명 (예: 동결 및 감소)"
                  value={newPurpose.description}
                  onChange={(e) => setNewPurpose({...newPurpose, description: e.target.value})}
                  style={{ padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                />
                <button
                  onClick={handleAddPurpose}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  추가
                </button>
              </div>
            </div>

            {/* 사업목적 목록 */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>사업목적 목록</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th style={{ padding: '0.75rem', border: '1px solid #dee2e6', textAlign: 'left' }}>코드</th>
                    <th style={{ padding: '0.75rem', border: '1px solid #dee2e6', textAlign: 'left' }}>설명</th>
                    <th style={{ padding: '0.75rem', border: '1px solid #dee2e6', textAlign: 'left' }}>연도</th>
                    <th style={{ padding: '0.75rem', border: '1px solid #dee2e6', textAlign: 'center' }}>작업</th>
                  </tr>
                </thead>
                <tbody>
                  {projectPurposes.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ padding: '1rem', textAlign: 'center', color: '#6c757d' }}>
                        등록된 사업목적이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    projectPurposes.map(purpose => (
                      <tr key={purpose.id} style={{ cursor: 'pointer' }}>
                        <td 
                          style={{ padding: '0.75rem', border: '1px solid #dee2e6' }}
                          onClick={() => handleSelectPurpose(purpose)}
                        >
                          {editingPurpose && editingPurpose.id === purpose.id ? (
                            <input
                              type="text"
                              value={editingPurpose.code}
                              onChange={(e) => setEditingPurpose({...editingPurpose, code: e.target.value})}
                              onClick={(e) => e.stopPropagation()}
                              style={{ width: '100%', padding: '0.25rem', border: '1px solid #ddd', borderRadius: '4px' }}
                            />
                          ) : (
                            purpose.code
                          )}
                        </td>
                        <td 
                          style={{ padding: '0.75rem', border: '1px solid #dee2e6' }}
                          onClick={() => handleSelectPurpose(purpose)}
                        >
                          {editingPurpose && editingPurpose.id === purpose.id ? (
                            <input
                              type="text"
                              value={editingPurpose.description}
                              onChange={(e) => setEditingPurpose({...editingPurpose, description: e.target.value})}
                              onClick={(e) => e.stopPropagation()}
                              style={{ width: '100%', padding: '0.25rem', border: '1px solid #ddd', borderRadius: '4px' }}
                            />
                          ) : (
                            purpose.description
                          )}
                        </td>
                        <td 
                          style={{ padding: '0.75rem', border: '1px solid #dee2e6' }}
                          onClick={() => handleSelectPurpose(purpose)}
                        >
                          {purpose.year}
                        </td>
                        <td style={{ padding: '0.75rem', border: '1px solid #dee2e6', textAlign: 'center' }}>
                          {purpose.isFixed ? (
                            // 고정 코드 (S: 정기구입, Z: 정보보호)는 선택만 가능
                            <>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleSelectPurpose(purpose); }}
                                style={{
                                  padding: '0.25rem 0.5rem',
                                  marginRight: '0.25rem',
                                  backgroundColor: '#007bff',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '0.8rem'
                                }}
                              >
                                선택
                              </button>
                              <span style={{ fontSize: '0.75rem', color: '#6c757d' }}>
                                (수정불가)
                              </span>
                            </>
                          ) : editingPurpose && editingPurpose.id === purpose.id ? (
                            <>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleUpdatePurpose(); }}
                                style={{
                                  padding: '0.25rem 0.5rem',
                                  marginRight: '0.25rem',
                                  backgroundColor: '#28a745',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '0.8rem'
                                }}
                              >
                                저장
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); setEditingPurpose(null); }}
                                style={{
                                  padding: '0.25rem 0.5rem',
                                  backgroundColor: '#6c757d',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '0.8rem'
                                }}
                              >
                                취소
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleSelectPurpose(purpose); }}
                                style={{
                                  padding: '0.25rem 0.5rem',
                                  marginRight: '0.25rem',
                                  backgroundColor: '#007bff',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '0.8rem'
                                }}
                              >
                                선택
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); setEditingPurpose({...purpose}); }}
                                style={{
                                  padding: '0.25rem 0.5rem',
                                  marginRight: '0.25rem',
                                  backgroundColor: '#ffc107',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '0.8rem'
                                }}
                              >
                                수정
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeletePurpose(purpose.id); }}
                                style={{
                                  padding: '0.25rem 0.5rem',
                                  backgroundColor: '#dc3545',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '0.8rem'
                                }}
                              >
                                삭제
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* 닫기 버튼 */}
            <div style={{ textAlign: 'right' }}>
              <button
                onClick={handleClosePurposeModal}
                style={{
                  padding: '0.5rem 1.5rem',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
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

export default BudgetRegistrationAPI; 