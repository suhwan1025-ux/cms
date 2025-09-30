import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import CKEditorComponent from './CKEditorComponent';
import DocumentTemplates from './DocumentTemplates';
import { generatePreviewHTML } from '../utils/previewGenerator';

// API 베이스 URL 동적 설정
const getApiBaseUrl = () => {
  // 현재 호스트가 localhost가 아니면 현재 호스트의 IP를 사용
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return `http://${window.location.hostname}:3001`;
  }
  // localhost에서 접근하는 경우 localhost 사용
  return 'http://localhost:3001';
};

const API_BASE_URL = getApiBaseUrl();

const ProposalForm = () => {
  const originalNavigate = useNavigate();

  // 템플릿 선택 핸들러
  const handleTemplateSelect = (template) => {
    if (template) {
      setFormData(prevData => ({
        ...prevData,
        wysiwygContent: template.content
      }));
      setSelectedTemplate(template.id);
      setShowTemplates(false);
      console.log(`✅ 템플릿 선택됨: ${template.name}`);
    } else {
      // 템플릿 초기화
      setFormData(prevData => ({
        ...prevData,
        wysiwygContent: ''
      }));
      setSelectedTemplate(null);
      setShowTemplates(false);
      console.log('🗑️ 템플릿 초기화됨');
    }
  };

  // 템플릿 선택 다시 보기
  const handleShowTemplates = () => {
    setShowTemplates(true);
  };
  const [contractType, setContractType] = useState('purchase'); // 기본값을 'purchase'로 설정
  const [formData, setFormData] = useState({
    // 공통 항목
    title: '',
    purpose: '',
    basis: '',
    budget: '',
    contractMethod: '',
    accountSubject: '',
    other: '', // 기타 사항
    requestDepartments: [], // 다중 선택 가능한 요청부서 배열
    
    // 구매/변경/연장 계약용
    purchaseItems: [], // N개 구매품목
    suppliers: [],
    
    // 변경/연장 계약용
    changeReason: '',
    extensionReason: '',
    beforeItems: [],
    afterItems: [],
    
    // 용역 계약용
    serviceItems: [],
    contractPeriod: '',
    contractStartDate: '',
    contractEndDate: '',
    paymentMethod: '',
    
    // 입찰 계약용
    biddingType: '',
    qualificationRequirements: '',
    evaluationCriteria: '',
    priceComparison: [],
    
    // WYSIWYG 에디터용
    wysiwygContent: ''
  });

  // API 데이터
  const [budgets, setBudgets] = useState([]);
  const [businessBudgets, setBusinessBudgets] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [contractMethods, setContractMethods] = useState([]);
  const [proposalId, setProposalId] = useState(null); // 품의서 키값
  
  // 임시저장 확인 팝업 관련 상태
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);
  
  // 템플릿 선택 관련 상태
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showTemplates, setShowTemplates] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [initialFormData, setInitialFormData] = useState(null);

  // 네비게이션을 제어하는 함수
  const navigate = useCallback((to, options) => {
    if (hasUnsavedChanges && showSaveConfirm) {
      console.log('네비게이션 차단됨:', to);
      return;
    }
    console.log('네비게이션 실행:', to);
    originalNavigate(to, options);
  }, [hasUnsavedChanges, showSaveConfirm, originalNavigate]);

  // 폼 데이터 변경 감지
  useEffect(() => {
    if (initialFormData === null) {
      setInitialFormData(JSON.stringify(formData));
      return;
    }
    
    // 팝업이 표시되어 있으면 hasUnsavedChanges를 변경하지 않음
    if (showSaveConfirm) {
      console.log('팝업 표시 중, hasUnsavedChanges 변경 방지');
      return;
    }
    
    const currentFormData = JSON.stringify(formData);
    const hasChanges = currentFormData !== initialFormData;
    
    if (hasChanges !== hasUnsavedChanges) {
      console.log('📝 폼 데이터 변경 감지:', hasChanges);
      console.log('  - 현재 데이터 길이:', currentFormData.length);
      console.log('  - 초기 데이터 길이:', initialFormData ? initialFormData.length : 'null');
      setHasUnsavedChanges(hasChanges);
    }
  }, [formData, initialFormData, showSaveConfirm]);

  // 링크 클릭 시 임시저장 확인
  const handleLinkClick = useCallback((e) => {
    if (hasUnsavedChanges) {
      const target = e.target.closest('a');
      if (target && target.href && !target.href.includes('javascript:')) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        e.returnValue = false;
        const href = target.getAttribute('href');
        if (href && href.startsWith('/')) {
          console.log('링크 클릭 감지:', href);
          // 상태를 직접 설정하여 팝업 표시
          setPendingNavigation(href);
          setShowSaveConfirm(true);
          return false;
        }
      }
    }
  }, [hasUnsavedChanges]);

  // 마우스 다운 이벤트도 처리
  const handleMouseDown = useCallback((e) => {
    if (hasUnsavedChanges) {
      const target = e.target.closest('a');
      if (target && target.href && !target.href.includes('javascript:')) {
        const href = target.getAttribute('href');
        if (href && href.startsWith('/')) {
          console.log('마우스 다운 감지:', href);
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          e.returnValue = false;
          return false;
        }
      }
    }
  }, [hasUnsavedChanges]);

  // 페이지 이동 시 임시저장 확인
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '작성 중인 내용이 있습니다. 페이지를 떠나시겠습니까?';
        return '작성 중인 내용이 있습니다. 페이지를 떠나시겠습니까?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('click', handleLinkClick, true); // 캡처 단계에서 처리
    document.addEventListener('mousedown', handleMouseDown, true); // 캡처 단계에서 처리
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('click', handleLinkClick, true);
      document.removeEventListener('mousedown', handleMouseDown, true);
    };
  }, [hasUnsavedChanges, handleLinkClick, handleMouseDown]);

  // 임시저장 확인 팝업 표시
  const showSaveConfirmation = useCallback((navigationTarget) => {
    console.log('showSaveConfirmation 호출:', navigationTarget, 'hasUnsavedChanges:', hasUnsavedChanges);
    
    if (hasUnsavedChanges) {
      console.log('변경사항 있음, 팝업 표시');
      setPendingNavigation(navigationTarget);
      setShowSaveConfirm(true);
      // 팝업이 표시된 후 hasUnsavedChanges가 변경되지 않도록 방지
      return;
    } else {
      console.log('변경사항 없음, 바로 이동');
      // 변경사항이 없으면 바로 이동
      if (navigationTarget && ['purchase', 'change', 'extension', 'service', 'bidding'].includes(navigationTarget)) {
        setContractType(navigationTarget);
      } else if (navigationTarget) {
        navigate(navigationTarget);
      }
    }
  }, [hasUnsavedChanges, navigate]);

  // 계약 유형 변경 (임시저장 확인 포함)
  const changeContractType = (newType) => {
    if (contractType === newType) return; // 같은 타입이면 무시
    
    if (hasUnsavedChanges) {
      setPendingNavigation(newType);
      setShowSaveConfirm(true);
    } else {
      // 변경사항이 없으면 바로 변경
      setContractType(newType);
      // 폼 데이터 초기화
      resetFormData();
    }
  };

  // 폼 데이터 초기화 함수
  const resetFormData = () => {
    setFormData({
      // 공통 항목
      title: '', // 제목 필드 추가
      purpose: '',
      basis: '',
      budget: '',
      contractMethod: '',
      accountSubject: '',
      requestDepartments: [], // 빈 배열로 초기화
      
      // 구매/변경/연장 계약용
      purchaseItems: [], // 빈 배열로 초기화
      suppliers: [],
      
      // 변경/연장 계약용
      changeReason: '',
      extensionReason: '',
      beforeItems: [],
      afterItems: [],
      
      // 용역 계약용
      serviceItems: [],
      contractPeriod: '',
      paymentMethod: '',
      
      // 입찰 계약용
      biddingType: '',
      qualificationRequirements: '',
      evaluationCriteria: '',
      priceComparison: [],
      
      // 기타 항목
      other: '' // 기타 사항 필드 추가
    });
    setInitialFormData(null);
    setHasUnsavedChanges(false);
    
    // 편집모드 상태 초기화 (새로운 품의서 작성 모드로 전환)
    setIsEditMode(false);
    setEditingProposalId(null);
    setProposalId(null);
    
    console.log('폼 데이터 초기화 완료 - 편집모드 해제됨');
  };

  // 임시저장 후 이동
  const handleSaveAndNavigate = async () => {
    try {
      console.log('임시저장 후 이동 시작');
      // pendingNavigation 값을 미리 저장
      const targetNavigation = pendingNavigation;
      
      // 팝업 상태를 먼저 초기화하여 추가 이벤트 방지
      setShowSaveConfirm(false);
      setPendingNavigation(null);
      
      // handleDraftSave 함수의 자동 이동을 방지하기 위해 편집 모드로 설정
      const originalEditingProposalId = editingProposalId;
      
      // 임시저장 실행 (자동 이동 방지)
      await handleProposalSave(true, true); // isDraft = true, preventNavigation = true
      
      console.log('임시저장 완료, 이동 처리:', targetNavigation);
      
      // hasUnsavedChanges 상태 초기화
      setHasUnsavedChanges(false);
      
      // 계약 유형 변경인지 URL 이동인지 확인
      if (targetNavigation && ['purchase', 'change', 'extension', 'service', 'bidding'].includes(targetNavigation)) {
        console.log('계약 유형 변경:', targetNavigation);
        setContractType(targetNavigation);
        // 폼 데이터 초기화
        resetFormData();
      } else if (targetNavigation) {
        console.log('URL 이동:', targetNavigation);
        originalNavigate(targetNavigation);
      }
    } catch (error) {
      console.error('임시저장 실패:', error);
      alert('임시저장에 실패했습니다. 다시 시도해주세요.');
    }
  };

  // 임시저장 없이 이동
  const handleNavigateWithoutSave = () => {
    console.log('임시저장 없이 이동:', pendingNavigation);
    const targetNavigation = pendingNavigation;
    
    // 팝업 상태를 먼저 초기화하여 추가 이벤트 방지
    setShowSaveConfirm(false);
    setPendingNavigation(null);
    setHasUnsavedChanges(false);
    
    // 계약 유형 변경인지 URL 이동인지 확인
    if (targetNavigation && ['purchase', 'change', 'extension', 'service', 'bidding'].includes(targetNavigation)) {
      console.log('계약 유형 변경 (저장 없이):', targetNavigation);
      setContractType(targetNavigation);
      // 폼 데이터 초기화
      resetFormData();
    } else if (targetNavigation) {
      console.log('URL 이동 (저장 없이):', targetNavigation);
      originalNavigate(targetNavigation);
    }
  };

  // 임시저장 확인 팝업 취소
  const handleCancelNavigation = () => {
    console.log('팝업 취소');
    setShowSaveConfirm(false);
    setPendingNavigation(null);
  };

  // 총 금액 계산
  const calculateTotalAmount = () => {
    let total = 0;
    
    if (['purchase', 'change', 'extension'].includes(contractType)) {
      total = (formData.purchaseItems || []).reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    } else if (contractType === 'service') {
      total = (formData.serviceItems || []).reduce((sum, item) => sum + (parseFloat(item.contractAmount) || 0), 0);
    } else if (contractType === 'freeform') {
      // 자유양식의 경우 contractAmount 사용
      total = parseFloat(formData.contractAmount) || 0;
    }
    
    return total;
  };

  // 결재라인 추천
  const getRecommendedApprovalLine = () => {
    const totalAmount = calculateTotalAmount();
    if (totalAmount === 0 && contractType !== 'freeform') return [];
    
    const line = [];
    
    // 기본 결재라인 (요청부서)
    line.push({
      step: 1,
      name: '요청부서',
      title: '담당자',
      description: '품의서 작성 및 검토'
    });

    // 경영관리팀 결재자 추가 (2백만원 초과 시)
    if (totalAmount > 2000000) {
      let managementLevel = '담당자';
      if (totalAmount > 2000000 && totalAmount <= 50000000) {
        managementLevel = '경영관리팀장';
      } else if (totalAmount > 50000000 && totalAmount <= 300000000) {
        managementLevel = '경영지원본부장';
      } else if (totalAmount > 300000000) {
        managementLevel = '경영지원실장';
      }
      
      line.push({
        step: line.length + 1,
        name: '경영관리팀',
        title: managementLevel,
        description: '예산 및 경영 효율성 검토',
        conditional: true
      });
    }

    // 용역계약 시 준법감시인 추가
    if (contractType === 'service') {
      line.push({
        step: line.length + 1,
        name: '준법감시인',
        title: '준법감시인',
        description: '법적 준수성 검토',
        conditional: true
      });
    }

    // 자유양식 문서 시 문서 승인 라인
    if (contractType === 'freeform') {
      line.push({
        step: line.length + 1,
        name: '부서장',
        title: '부서장',
        description: '문서 내용 검토 및 승인'
      });
      
      line.push({
        step: line.length + 1,
        name: '경영관리팀',
        title: '경영관리팀장',
        description: '문서 정책 및 규정 준수 검토',
        conditional: true
      });
    }

    // IT 내부감사인 추가 (1천만원 초과 ~ 3억원 이하)
    if (totalAmount > 10000000 && totalAmount <= 300000000) {
      line.push({
        step: line.length + 1,
        name: 'IT 내부감사인',
        title: 'IT 내부감시인',
        description: 'IT 시스템 및 보안 검토',
        conditional: true
      });
    }

    // 계약금액 5천만원 초과 시 감사본부장 추가
    if (totalAmount > 50000000) {
      line.push({
        step: line.length + 1,
        name: '감사본부장',
        title: '감사본부장',
        description: '감사 및 내부통제 검토',
        conditional: true
      });
    }

    // 최종 결재자
    let finalApprover = '팀장';
    if (totalAmount > 10000000 && totalAmount <= 300000000) {
      finalApprover = '본부장';
    } else if (totalAmount > 300000000) {
      finalApprover = '대표이사';
    }

    line.push({
      step: line.length + 1,
      name: '최종결재자',
      title: finalApprover,
      description: '최종 승인',
      final: true
    });

    return line;
  };



  // 구매품목 추가 - 개선된 구조 (중복 호출 방지)
  const addPurchaseItem = useCallback(() => {
    const newPurchaseItem = {
      id: Date.now() + Math.random(),
      item: '',
      productName: '',
      quantity: 1,
      unitPrice: 0,
      amount: 0,
      supplier: '',
      contractPeriodType: '1year', // 계약기간 타입: '1month', '3months', '6months', '1year', '2years', '3years', 'permanent', 'custom'
      contractStartDate: '', // 계약 시작일
      contractEndDate: '', // 계약 종료일
      costAllocation: {
        type: 'percentage', // 'percentage' or 'amount'
        allocations: [] // 비용귀속부서 분배 배열
      }
    };
    
    setFormData(prevData => ({
      ...prevData,
      purchaseItems: [...prevData.purchaseItems, newPurchaseItem]
    }));
  }, []);

  // 용역항목 추가 (중복 호출 방지)
  const addServiceItem = useCallback(() => {
    const newServiceItem = {
      id: Date.now() + Math.random(),
      item: '',
      name: '',
      skillLevel: '',
      period: 1,
      monthlyRate: 0,
      contractAmount: 0,
      supplier: '',
      creditRating: '',
      costAllocation: {
        allocations: []
      }
    };
    
    setFormData(prevData => ({
      ...prevData,
      serviceItems: [...prevData.serviceItems, newServiceItem]
    }));
  }, []);

  // 편집 모드 상태
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingProposalId, setEditingProposalId] = useState(null);

  // 사업예산 선택 팝업 상태
  const [showBudgetPopup, setShowBudgetPopup] = useState(false);
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedBudgetType, setSelectedBudgetType] = useState('');
  const [filteredBudgets, setFilteredBudgets] = useState([]);

  // 요청부서 선택 상태
  const [showDepartmentDropdown, setShowDepartmentDropdown] = useState(false);
  const [showDepartmentSuggestions, setShowDepartmentSuggestions] = useState(false);
  const [departmentSearchTerm, setDepartmentSearchTerm] = useState('');
  const [filteredDepartments, setFilteredDepartments] = useState([]);
  


  // 구매 내역 추천 상태
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [showItemSuggestions, setShowItemSuggestions] = useState(false);
  const [showProductSuggestions, setShowProductSuggestions] = useState(false);
  const [showSupplierSuggestions, setShowSupplierSuggestions] = useState(false);
  const [currentSuggestionField, setCurrentSuggestionField] = useState(null);
  const [currentSuggestionIndex, setCurrentSuggestionIndex] = useState(null);

  // API 데이터 로드 및 편집 모드 확인
  useEffect(() => {
    // 컴포넌트 마운트 시 편집모드 상태 초기화 (다른 화면에서 돌아온 경우 대비)
    console.log('ProposalForm 마운트 - 편집모드 상태 초기화');
    setIsEditMode(false);
    setEditingProposalId(null);
    setProposalId(null);
    setHasUnsavedChanges(false);
    setInitialFormData(null);

    const fetchData = async () => {
      try {
        setLoading(true);
        const [budgetsRes, businessBudgetsRes, departmentsRes, suppliersRes, contractMethodsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/budgets`),
          fetch(`${API_BASE_URL}/api/business-budgets`),
          fetch(`${API_BASE_URL}/api/departments`),
          fetch(`${API_BASE_URL}/api/suppliers`),
          fetch(`${API_BASE_URL}/api/contract-methods`)
        ]);

        const budgetsData = await budgetsRes.json();
        const businessBudgetsData = await businessBudgetsRes.json();
        const departmentsData = await departmentsRes.json();
        const suppliersData = await suppliersRes.json();
        const contractMethodsData = await contractMethodsRes.json();
        
        // API 응답 디버깅
        console.log('=== API 응답 디버깅 ===');
        console.log('businessBudgetsData 타입:', typeof businessBudgetsData);
        console.log('businessBudgetsData:', businessBudgetsData);
        console.log('departmentsData 타입:', typeof departmentsData);
        console.log('departmentsData:', departmentsData);

        // 데이터가 배열인지 확인하고 안전하게 처리
        const safeBusinessBudgetsData = Array.isArray(businessBudgetsData) ? businessBudgetsData : [];
        const safeDepartmentsData = Array.isArray(departmentsData) ? departmentsData : [];
        
        setBudgets(budgetsData);
        setBusinessBudgets(safeBusinessBudgetsData);
        setDepartments(safeDepartmentsData);
        setSuppliers(suppliersData);
        setContractMethods(contractMethodsData);
        
        console.log('사업예산 데이터 로드됨:', safeBusinessBudgetsData.length, '개');
        console.log('사업예산 샘플:', safeBusinessBudgetsData.slice(0, 2));
        console.log('부서 데이터 로드됨:', safeDepartmentsData.length, '개');
        console.log('부서 샘플:', safeDepartmentsData.slice(0, 3));
        
        // 초기 필터링 설정
        if (safeBusinessBudgetsData.length > 0) {
          setFilteredBudgets(safeBusinessBudgetsData);
        }

        // 편집 모드 확인 - URL 파라미터 우선, localStorage 백업
        const urlParams = new URLSearchParams(window.location.search);
        const proposalIdFromUrl = urlParams.get('id');
        const isRecycleMode = urlParams.get('recycle') === 'true';
        const isNewMode = urlParams.get('new') === 'true'; // 신규 작성 모드 강제
        const editingDraft = localStorage.getItem('editingDraft');
        const recycleProposal = localStorage.getItem('recycleProposal');
        
        if (isNewMode) {
          // 신규 작성 모드 강제 - 모든 임시 데이터 정리
          console.log('=== 신규 작성 모드 강제 - 모든 임시 데이터 정리 ===');
          localStorage.removeItem('editingDraft');
          localStorage.removeItem('recycleProposal');
          localStorage.removeItem('draftProposalId');
          
          // 폼 데이터 초기화
          resetFormData();
          
          // URL에서 new 파라미터 제거 (깔끔한 URL 유지)
          const newUrl = window.location.pathname;
          window.history.replaceState({}, '', newUrl);
          
          console.log('신규 작성 모드로 초기화 완료');
        } else if (proposalIdFromUrl) {
          // URL에서 품의서 ID가 있으면 서버에서 데이터 가져오기
          console.log('=== URL에서 품의서 ID 발견, 서버에서 데이터 로드 ===');
          await loadProposalFromServer(proposalIdFromUrl);
        } else if (isRecycleMode && recycleProposal) {
          // 재활용 모드인 경우
          console.log('=== 재활용 모드 감지, 재활용 데이터 로드 ===');
          const recycleData = JSON.parse(recycleProposal);
          console.log('🔍 재활용 데이터:', recycleData);
          console.log('🔍 재활용 데이터 키들:', Object.keys(recycleData));
          
          // 계약 유형 설정
          const contractTypeValue = recycleData.contractType || 'purchase';
          console.log('🔍 설정할 계약 유형:', contractTypeValue);
          setContractType(contractTypeValue);
          
          // 폼 데이터 설정 (기존 수정 기능과 동일한 방식으로 처리)
          const newFormData = {
            title: recycleData.title || '',
            purpose: recycleData.purpose || '',
            basis: recycleData.basis || '',
            budget: recycleData.budget || '', // budgetId가 이미 처리됨
            contractMethod: recycleData.contractMethod || '',
            accountSubject: recycleData.accountSubject || '',
            // 요청부서는 이미 기존 수정 기능과 동일하게 처리됨
            requestDepartments: recycleData.requestDepartments || [],
            // 구매품목도 이미 기존 수정 기능과 동일한 형태로 처리됨
            purchaseItems: recycleData.purchaseItems || [],
            suppliers: recycleData.suppliers || [],
            changeReason: recycleData.changeReason || '',
            extensionReason: recycleData.extensionReason || '',
            beforeItems: recycleData.beforeItems || [],
            afterItems: recycleData.afterItems || [],
            // 용역품목도 이미 기존 수정 기능과 동일한 형태로 처리됨
            serviceItems: recycleData.serviceItems || [],
            contractPeriod: recycleData.contractPeriod || '',
            paymentMethod: recycleData.paymentMethod || '',
            biddingType: recycleData.biddingType || '',
            qualificationRequirements: recycleData.qualificationRequirements || '',
            evaluationCriteria: recycleData.evaluationCriteria || '',
            priceComparison: recycleData.priceComparison || []
          };
          
          console.log('🔍 설정할 폼 데이터:', newFormData);
          console.log('🔍 구매품목 개수:', newFormData.purchaseItems.length);
          console.log('🔍 요청부서 개수:', newFormData.requestDepartments.length);
          console.log('🔍 구매품목별 비용분배 정보:');
          newFormData.purchaseItems.forEach((item, index) => {
            console.log(`  구매품목 ${index + 1} (${item.item}):`, {
              hasCostAllocation: !!item.costAllocation,
              allocationsCount: item.costAllocation?.allocations?.length || 0,
              allocations: item.costAllocation?.allocations
            });
          });
          
          setFormData(newFormData);
          
          // 재활용 데이터 사용 완료 후 localStorage에서 제거
          localStorage.removeItem('recycleProposal');
          
          // 변경사항 있음으로 표시 (재활용된 데이터이므로)
          setHasUnsavedChanges(true);
          
          console.log('✅ 재활용 데이터 복원 완료');
          console.log('복원된 제목:', newFormData.title);
          console.log('복원된 목적:', newFormData.purpose);
        } else if (editingDraft) {
          const draftData = JSON.parse(editingDraft);
          console.log('=== 편집 모드 데이터 로드 ===');
          console.log('전체 draftData:', draftData);
          console.log('기타:', draftData.accountSubject);
          console.log('요청부서:', draftData.requestDepartments);

          console.log('구매품목:', draftData.purchaseItems);
          console.log('용역품목:', draftData.serviceItems);
          
          // 비용분배 정보 디버깅
          if (draftData.purchaseItems && draftData.purchaseItems.length > 0) {
            console.log('=== 비용분배 정보 디버깅 ===');
            draftData.purchaseItems.forEach((item, index) => {
              console.log(`구매품목 ${index + 1} (${item.item}):`, {
                hasCostAllocation: !!item.costAllocation,
                costAllocationData: item.costAllocation,
                hasCostAllocations: !!item.costAllocations,
                costAllocationsData: item.costAllocations,
                // 전체 item 객체 확인
                fullItemData: item
              });
            });
          }
          
          if (draftData.purchaseItemCostAllocations) {
            console.log('purchaseItemCostAllocations:', draftData.purchaseItemCostAllocations);
          }
          
          // 전체 draftData 구조 확인
          console.log('=== 전체 draftData 구조 분석 ===');
          console.log('draftData 키들:', Object.keys(draftData));
          console.log('purchaseItems 타입:', typeof draftData.purchaseItems);
          console.log('purchaseItems 길이:', draftData.purchaseItems ? draftData.purchaseItems.length : 'undefined');
          if (draftData.purchaseItems && draftData.purchaseItems.length > 0) {
            console.log('첫 번째 purchaseItem 키들:', Object.keys(draftData.purchaseItems[0]));
          }
          
          setIsEditMode(true);
          setEditingProposalId(draftData.id);
          setProposalId(draftData.id); // 품의서 키값 설정
          
          // 폼 데이터 설정 - 개선된 구조
          setContractType(draftData.contractType === '구매계약' ? 'purchase' :
                         draftData.contractType === '용역계약' ? 'service' :
                         draftData.contractType === '변경계약' ? 'change' :
                         draftData.contractType === '연장계약' ? 'extension' :
                         draftData.contractType === '자유양식' ? 'freeform' : '');
          
          // 요청부서 데이터 정규화 (강화된 구조)
          const normalizedRequestDepartments = (draftData.requestDepartments || []).map(dept => 
            typeof dept === 'string' ? dept : dept.name || dept
          ).filter(Boolean); // 빈 값 제거
          
          console.log('📋 요청부서 복원:', {
            원본: draftData.requestDepartments,
            정규화: normalizedRequestDepartments
          });
          
          // 구매품목 데이터 정규화 (강화된 구조)
          const normalizedPurchaseItems = (draftData.purchaseItems || []).map((item, itemIndex) => {
            // 기본 구매품목 정보
            const basicItem = {
              id: item.id || Date.now() + Math.random(),
              item: item.item || '',
              productName: item.productName || '',
              quantity: parseInt(item.quantity) || 0,
              unitPrice: parseInt(item.unitPrice) || 0,
              amount: parseInt(item.amount) || 0,
              supplier: item.supplier || '',
              requestDepartments: item.requestDepartments || [], // 다중 선택 가능한 요청부서 배열
              costAllocation: { 
                type: 'percentage',
                allocations: [] 
              }
            };
            
            console.log(`📦 구매품목 ${itemIndex} (${item.item}) 기본 복원:`, basicItem);
            
            // 비용분배 정보 복원 - 강화된 로직
            let hasAllocations = false;
            
            // 1. 구매품목에 직접 포함된 비용분배 정보 (우선순위 1)
            if (item.costAllocation && item.costAllocation.allocations && item.costAllocation.allocations.length > 0) {
              console.log(`✅ 구매품목 "${item.item}" 직접 비용분배 정보 발견:`, item.costAllocation.allocations);
              basicItem.costAllocation = {
                type: item.costAllocation.type || 'percentage',
                allocations: item.costAllocation.allocations.map(alloc => ({
                  id: alloc.id || Date.now() + Math.random(),
                  department: alloc.department || '',
                  type: alloc.type || 'percentage',
                  value: parseFloat(alloc.value) || 0  // 숫자 타입 보장
                }))
              };
              hasAllocations = true;
            }
            
            // 2. purchaseItemCostAllocations에서 복원 (백업용, 우선순위 2)
            if (!hasAllocations && draftData.purchaseItemCostAllocations && draftData.purchaseItemCostAllocations.length > 0) {
              console.log(`🔍 purchaseItemCostAllocations에서 복원 시도...`);
              console.log('전체 purchaseItemCostAllocations:', draftData.purchaseItemCostAllocations);
              
              // 더 정확한 매칭을 위한 로직
              let matchingAllocations = [];
              
              // 1순위: 정확한 itemIndex 매칭
              matchingAllocations = draftData.purchaseItemCostAllocations.filter(alloc => 
                alloc.itemIndex === itemIndex
              );
              
              // 2순위: 품목명 매칭 (itemIndex가 없거나 매칭되지 않은 경우)
              if (matchingAllocations.length === 0) {
                matchingAllocations = draftData.purchaseItemCostAllocations.filter(alloc => 
                  (alloc.itemName && alloc.itemName === item.item) || 
                  (alloc.productName && alloc.productName === item.productName)
                );
              }
              
              // 3순위: 품목명이 비슷한 경우 (부분 매칭)
              if (matchingAllocations.length === 0) {
                matchingAllocations = draftData.purchaseItemCostAllocations.filter(alloc => 
                  (alloc.itemName && item.item && alloc.itemName.includes(item.item)) || 
                  (item.item && alloc.itemName && item.item.includes(alloc.itemName)) ||
                  (alloc.productName && item.productName && alloc.productName.includes(item.productName)) ||
                  (item.productName && alloc.productName && item.productName.includes(alloc.productName))
                );
              }
              
              if (matchingAllocations.length > 0) {
                console.log(`✅ 매칭으로 비용분배 정보 복원:`, {
                  매칭방법: matchingAllocations[0].itemIndex === itemIndex ? 'itemIndex' : '품목명',
                  매칭된할당: matchingAllocations
                });
                
                basicItem.costAllocation = {
                  type: 'percentage',
                  allocations: matchingAllocations.map(alloc => ({
                    id: alloc.id || Date.now() + Math.random(),
                    department: alloc.department || '',
                    type: alloc.type || 'percentage',
                    value: alloc.value || 0
                  }))
                };
                hasAllocations = true;
              } else {
                console.log(`❌ 모든 매칭 방법 실패: ${item.item} (${itemIndex})`);
              }
            }
            
            if (!hasAllocations) {
              console.log(`⚠️ 구매품목 "${item.item}" 비용분배 정보 없음 - 기본값 생성`);
              // 기본 비용분배 정보 생성
              basicItem.costAllocation = {
                type: 'percentage',
                allocations: []
              };
            }
            
            console.log(`📦 구매품목 ${itemIndex} 최종 복원 결과:`, {
              기본정보: basicItem,
              비용분배: basicItem.costAllocation,
              할당개수: basicItem.costAllocation.allocations.length
            });
            
            return basicItem;
          });
          
          setFormData({
            title: draftData.title || '', // 제목 필드 추가
            purpose: draftData.purpose || '',
            basis: draftData.basis || '',
            budget: draftData.budget || '',
            contractMethod: draftData.contractMethod || '',
            accountSubject: draftData.accountSubject || '',
            requestDepartments: normalizedRequestDepartments,
            purchaseItems: normalizedPurchaseItems,
            suppliers: draftData.suppliers || [],
            changeReason: draftData.changeReason || '',
            extensionReason: draftData.extensionReason || '',
            beforeItems: draftData.beforeItems || [],
            afterItems: draftData.afterItems || [],
            serviceItems: (draftData.serviceItems || []).map(item => ({
              item: item.item || '',
              personnel: item.personnel || '',
              name: item.name || '', // 성명 필드 추가
              skillLevel: item.skillLevel || '',
              period: item.period || '',
              monthlyRate: item.monthlyRate || 0,
              contractAmount: item.contractAmount || 0,
              supplier: item.supplier || '',
              creditRating: item.creditRating || '',
              costAllocation: {
                allocations: (item.costAllocation?.allocations || []).map(alloc => ({
                  department: alloc.department || '',
                  type: alloc.type || 'percentage',
                  value: alloc.value || 0
                }))
              }
            })),
            contractPeriod: draftData.contractPeriod || '',
            paymentMethod: draftData.paymentMethod || '',
            biddingType: draftData.biddingType || '',
            qualificationRequirements: draftData.qualificationRequirements || '',
            evaluationCriteria: draftData.evaluationCriteria || '',
            priceComparison: draftData.priceComparison || [],
            other: draftData.other || '' // 기타 사항 추가
          });
          
          // localStorage에서 편집 데이터 제거
          localStorage.removeItem('editingDraft');
          
          // 임시저장 데이터 복원 후 초기 데이터로 설정 (변경사항 초기화)
          setTimeout(() => {
            setInitialFormData(JSON.stringify({
              title: draftData.title || '',
              purpose: draftData.purpose || '',
              basis: draftData.basis || '',
              budget: draftData.budget || '',
              contractMethod: draftData.contractMethod || '',
              accountSubject: draftData.accountSubject || '',
              other: draftData.other || '',
              purchaseItems: draftData.purchaseItems || [],
              serviceItems: draftData.serviceItems || [],
              // ... 기타 필드들
            }));
            setHasUnsavedChanges(false);
            console.log('✅ 임시저장 데이터 복원 완료 - 변경사항 초기화');
          }, 100);
          
          // 복원된 폼 데이터 확인
          console.log('=== 복원된 폼 데이터 확인 ===');
          console.log('복원된 contractType:', contractType);
          console.log('복원된 purchaseItems:', formData.purchaseItems);
          formData.purchaseItems.forEach((item, index) => {
            if (item.costAllocation && item.costAllocation.allocations) {
              console.log(`구매품목 ${index + 1} (${item.item}) 비용분배 복원 완료:`, item.costAllocation.allocations);
            } else {
              console.log(`구매품목 ${index + 1} (${item.item}) 비용분배 없음`);
            }
          });
          
          // 강제로 상태 업데이트하여 리렌더링 트리거
          setTimeout(() => {
            console.log('=== 강제 상태 업데이트 ===');
            setFormData(prevData => {
              const updatedData = { ...prevData };
              console.log('업데이트 전 formData:', updatedData);
              return updatedData;
            });
          }, 100);
          
          // 복원된 데이터를 강제로 상태에 적용
          setTimeout(() => {
            console.log('=== 복원된 데이터 강제 적용 ===');
            const restoredPurchaseItems = (draftData.purchaseItems || []).map((item, itemIndex) => {
              let restoredItem = { ...item };
              
              // 비용분배 정보 복원
              if (item.costAllocation && item.costAllocation.allocations && item.costAllocation.allocations.length > 0) {
                restoredItem.costAllocation = { ...item.costAllocation };
              } else if (draftData.purchaseItemCostAllocations && draftData.purchaseItemCostAllocations.length > 0) {
                const matchingAllocations = draftData.purchaseItemCostAllocations.filter(alloc => 
                  alloc.itemName === item.item || alloc.productName === item.productName
                );
                
                if (matchingAllocations.length > 0) {
                  restoredItem.costAllocation = {
                    allocations: matchingAllocations.map(alloc => ({
                      id: alloc.id || Date.now() + Math.random(),
                      department: alloc.department || '',
                      type: alloc.type || 'percentage',
                      value: alloc.value || 0
                    }))
                  };
                }
              }
              
              // 테스트용: 비용분배 정보가 없으면 임시로 생성
              if (!restoredItem.costAllocation || !restoredItem.costAllocation.allocations || restoredItem.costAllocation.allocations.length === 0) {
                console.log(`🧪 테스트용 비용분배 정보 생성: ${item.item}`);
                restoredItem.costAllocation = {
                  allocations: [
                    {
                      id: Date.now() + Math.random(),
                      department: '테스트부서',
                      type: 'percentage',
                      value: 100
                    }
                  ]
                };
              }
              
              return restoredItem;
            });
            
            console.log('강제 적용할 purchaseItems:', restoredPurchaseItems);
            
            setFormData(prevData => ({
              ...prevData,
              purchaseItems: restoredPurchaseItems
            }));
          }, 200);
          
          // 편집 모드에서 초기 데이터 설정 (변경사항 감지용) - 완전히 새로운 접근
          setTimeout(() => {
            console.log('=== 완전히 새로운 접근: 비용분배 정보 복원 ===');
            
            // 1. 현재 formData 상태 확인
            console.log('현재 formData 상태:', formData);
            
            // 2. draftData에서 비용분배 정보 추출 - 강화된 로직
            const extractedAllocations = {};
            
            // 구매품목별로 비용분배 정보 매핑
            (draftData.purchaseItems || []).forEach((item, itemIndex) => {
              const itemKey = item.item || `item_${itemIndex}`;
              extractedAllocations[itemKey] = [];
              
              // 직접 포함된 비용분배 정보
              if (item.costAllocation && item.costAllocation.allocations) {
                extractedAllocations[itemKey] = [...item.costAllocation.allocations];
              }
              
              // purchaseItemCostAllocations에서 백업 복원
              if (draftData.purchaseItemCostAllocations) {
                const backupAllocations = draftData.purchaseItemCostAllocations.filter(alloc => 
                  alloc.itemName === item.item || alloc.productName === item.productName
                );
                
                if (backupAllocations.length > 0) {
                  extractedAllocations[itemKey] = [...extractedAllocations[itemKey], ...backupAllocations];
                }
              }
            });
            
            console.log('추출된 비용분배 정보:', extractedAllocations);
            
            // 3. formData에 비용분배 정보 적용
            const updatedPurchaseItems = formData.purchaseItems.map((item, itemIndex) => {
              const itemKey = item.item || `item_${itemIndex}`;
              const allocations = extractedAllocations[itemKey] || [];
              
              return {
                ...item,
                costAllocation: {
                  type: 'percentage',
                  allocations: allocations.map(alloc => ({
                    id: alloc.id || Date.now() + Math.random(),
                    department: alloc.department || '',
                    type: alloc.type || 'percentage',
                    value: alloc.value || 0
                  }))
                }
              };
            });
            
            console.log('업데이트된 purchaseItems:', updatedPurchaseItems);
            
            // 4. 상태 업데이트
            setFormData(prevData => ({
              ...prevData,
              purchaseItems: updatedPurchaseItems
            }));
          }, 300);
        }
      } catch (error) {
        console.error('데이터 로드 실패:', error);
        alert('데이터 로드에 실패했습니다. 서버가 실행 중인지 확인해주세요.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // URL 파라미터에서 계약 유형 확인
    const urlParams = new URLSearchParams(window.location.search);
    const typeParam = urlParams.get('type');
    
    if (typeParam && ['purchase', 'change', 'extension', 'service', 'bidding'].includes(typeParam)) {
      setContractType(typeParam);
    }

    // 컴포넌트 언마운트 시 편집모드 상태 초기화
    return () => {
      console.log('ProposalForm 언마운트 - 편집모드 상태 초기화');
      setIsEditMode(false);
      setEditingProposalId(null);
      setProposalId(null);
      setHasUnsavedChanges(false);
      setInitialFormData(null);
    };
  }, []);

  // 필터링 상태가 변경될 때마다 필터링 실행
  useEffect(() => {
    if (businessBudgets.length > 0) {
      filterBudgets();
    }
  }, [selectedYear, selectedBudgetType]);

  // 컴포넌트 언마운트 시 편집모드 상태 초기화
  useEffect(() => {
    return () => {
      console.log('ProposalForm 언마운트 - 편집모드 상태 초기화');
      setIsEditMode(false);
      setEditingProposalId(null);
      setProposalId(null);
      setHasUnsavedChanges(false);
      setInitialFormData(null);
    };
  }, []);

  // 부서 검색 필터링
  useEffect(() => {
    if (departments.length > 0) {
      filterDepartments();
    }
  }, [departmentSearchTerm, formData.requestDepartments]);

  const formatCurrency = (amount) => {
    // 소수점 제거하고 정수로 변환
    const integerAmount = Math.round(amount);
    return new Intl.NumberFormat('ko-KR').format(integerAmount) + '원';
  };

  // 한글 금액 표시
  const formatKoreanCurrency = (amount) => {
    if (amount === 0) return '영원';
    
    const units = ['', '만', '억', '조'];
    const numbers = ['영', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'];
    const positions = ['', '십', '백', '천'];
    
    let result = '';
    let num = amount;
    let unitIndex = 0;
    
    while (num > 0) {
      let section = num % 10000;
      let sectionStr = '';
      
      if (section > 0) {
        let temp = section;
        let posIndex = 0;
        
        while (temp > 0) {
          const digit = temp % 10;
          if (digit > 0) {
            if (posIndex === 0) {
              sectionStr = numbers[digit] + sectionStr;
            } else {
              sectionStr = numbers[digit] + positions[posIndex] + sectionStr;
            }
          }
          temp = Math.floor(temp / 10);
          posIndex++;
        }
        
        if (unitIndex > 0) {
          sectionStr += units[unitIndex];
        }
        result = sectionStr + result;
      }
      
      num = Math.floor(num / 10000);
      unitIndex++;
    }
    
    return result + '원';
  };

  // 숫자에 콤마 추가
  const formatNumberWithComma = (value) => {
    if (!value) return '';
    // 소수점 제거하고 정수로 변환 후 콤마 추가
    const intValue = Math.floor(parseFloat(value) || 0);
    return intValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  // 콤마 제거
  const removeComma = (value) => {
    if (!value) return 0;
    return parseInt(value.toString().replace(/,/g, '')) || 0;
  };

  // 사업예산 필터링
  const filterBudgets = () => {
    if (!businessBudgets || businessBudgets.length === 0) {
      setFilteredBudgets([]);
      return;
    }
    
    let filtered = [...businessBudgets];
    
    console.log('필터링 시작:', { selectedYear, selectedBudgetType, totalBudgets: businessBudgets.length });
    
    if (selectedYear && selectedYear !== '') {
      filtered = filtered.filter(budget => budget.budget_year == selectedYear);
      console.log('연도 필터링 후:', filtered.length);
    }
    
    if (selectedBudgetType && selectedBudgetType !== '') {
      filtered = filtered.filter(budget => budget.budget_type === selectedBudgetType);
      console.log('유형 필터링 후:', filtered.length);
    }
    
    console.log('최종 필터링 결과:', filtered.length);
    setFilteredBudgets(filtered);
  };

  // 서버에서 품의서 데이터 로드
  const loadProposalFromServer = async (proposalId) => {
    try {
      console.log('서버에서 품의서 데이터 로드 시작:', proposalId);
      const response = await fetch(`${API_BASE_URL}/api/proposals/${proposalId}`);
      
      if (!response.ok) {
        throw new Error(`품의서 로드 실패: ${response.status}`);
      }
      
      const proposalData = await response.json();
      console.log('서버에서 로드된 품의서 데이터:', proposalData);
      console.log('🔍 디버깅 - 서버에서 받은 wysiwygContent:', proposalData.wysiwygContent);
      
      // 편집 모드 설정
      setIsEditMode(true);
      setEditingProposalId(proposalId);
      setProposalId(proposalId);
      
      // 계약 유형 설정
      setContractType(proposalData.contractType || 'purchase');
      
      // 폼 데이터 설정
      setFormData({
        title: proposalData.title || '',
        purpose: proposalData.purpose || '',
        basis: proposalData.basis || '',
        budget: proposalData.budgetId || '',
        contractMethod: proposalData.contractMethod || '',
        accountSubject: proposalData.accountSubject || '',
        requestDepartments: (proposalData.requestDepartments || []).map(dept => 
          typeof dept === 'string' ? dept : dept.name || dept
        ),
        purchaseItems: (proposalData.purchaseItems || []).map(item => ({
          id: item.id || Date.now() + Math.random(),
          item: item.item || '',
          productName: item.productName || '',
          quantity: item.quantity || 0,
          unitPrice: item.unitPrice || 0,
          amount: item.amount || 0,
          supplier: item.supplier || '',
          contractPeriodType: item.contractPeriodType || 'permanent',
          contractStartDate: item.contractStartDate || '',
          contractEndDate: item.contractEndDate || '',
          costAllocation: {
            type: 'percentage',
            allocations: (item.costAllocations || []).map(alloc => ({
              id: Date.now() + Math.random(),
              department: alloc.department || '',
              type: alloc.type || 'percentage',
              value: alloc.value || 0
            }))
          }
        })),
        serviceItems: (proposalData.serviceItems || []).map(item => ({
          item: item.item || '',
          personnel: item.personnel || '',
          name: item.name || '',
          skillLevel: item.skillLevel || '',
          period: item.period || '',
          monthlyRate: item.monthlyRate || 0,
          contractAmount: item.contractAmount || 0,
          supplier: item.supplier || '',
          creditRating: item.creditRating || '',
          costAllocation: {
            allocations: (item.costAllocation?.allocations || []).map(alloc => ({
              department: alloc.department || '',
              type: alloc.type || 'percentage',
              value: alloc.value || 0
            }))
          }
        })),
        suppliers: proposalData.suppliers || [],
        changeReason: proposalData.changeReason || '',
        extensionReason: proposalData.extensionReason || '',
        beforeItems: proposalData.beforeItems || [],
        afterItems: proposalData.afterItems || [],
        contractPeriod: proposalData.contractPeriod || '',
        paymentMethod: proposalData.paymentMethod || '',
        biddingType: proposalData.biddingType || '',
        qualificationRequirements: proposalData.qualificationRequirements || '',
        evaluationCriteria: proposalData.evaluationCriteria || '',
        priceComparison: proposalData.priceComparison || [],
        wysiwygContent: proposalData.wysiwygContent || '', // 자유양식 내용 추가
        other: proposalData.other || '' // 기타 사항 추가
      });
      
      console.log('✅ 서버 데이터 복원 완료');
      console.log('🔍 디버깅 - formData에 설정된 wysiwygContent:', proposalData.wysiwygContent || '');
      
      // 서버 데이터 로드 후 초기 데이터로 설정 (변경사항 초기화)
      setTimeout(() => {
        setInitialFormData(JSON.stringify({
          title: proposalData.title || '',
          purpose: proposalData.purpose || '',
          basis: proposalData.basis || '',
          budget: proposalData.budgetId || '',
          contractMethod: proposalData.contractMethod || '',
          accountSubject: proposalData.accountSubject || '',
          other: proposalData.other || '',
          // ... 기타 필드들은 formData와 동일하게 설정
        }));
        setHasUnsavedChanges(false);
        console.log('✅ 서버 데이터 로드 완료 - 변경사항 초기화');
      }, 100);
      
      // 자유양식인 경우 템플릿 상태 설정
      if (proposalData.contractType === 'freeform' && proposalData.wysiwygContent) {
        setShowTemplates(false); // 에디터를 바로 보여줌
        console.log('🔍 자유양식 품의서 - 템플릿 선택 화면 숨김');
      }
      
    } catch (error) {
      console.error('서버에서 품의서 데이터 로드 실패:', error);
      alert('품의서 데이터를 불러오는데 실패했습니다: ' + error.message);
    }
  };

  // 사업예산 선택 팝업 열기
  const openBudgetPopup = () => {
    setSelectedYear('');
    setSelectedBudgetType('');
    setFilteredBudgets(businessBudgets);
    setShowBudgetPopup(true);
  };

  // 사업예산 선택
  const selectBudget = (budget) => {
    setFormData({...formData, budget: budget.id});
    setShowBudgetPopup(false);
  };

  // 연도 목록 가져오기
  const getYearList = () => {
    const years = [...new Set(businessBudgets.map(budget => budget.budget_year))];
    return years.sort((a, b) => b - a);
  };

  // 예산 유형 목록 가져오기
  const getBudgetTypeList = () => {
    const types = [...new Set(businessBudgets.map(budget => budget.budget_type))];
    return types.sort();
  };

  // 부서 검색 및 필터링
  const filterDepartments = () => {
    if (!departments || departments.length === 0) {
      setFilteredDepartments([]);
      return;
    }
    
    let filtered = departments;
    
    if (departmentSearchTerm) {
      filtered = filtered.filter(dept => 
        dept.name.toLowerCase().includes(departmentSearchTerm.toLowerCase()) ||
        (dept.description && dept.description.toLowerCase().includes(departmentSearchTerm.toLowerCase()))
      );
    }
    
    // 이미 선택된 부서는 제외
    filtered = filtered.filter(dept => 
      !formData.requestDepartments.some(selectedDept => {
        const selectedName = typeof selectedDept === 'string' ? selectedDept : selectedDept.name || selectedDept;
        return selectedName === dept.name;
      })
    );
    
    setFilteredDepartments(filtered);
  };

  // 구매품목별 부서 검색 및 필터링
  const filterDepartmentsForItem = (searchTerm, itemIndex) => {
    if (!departments || departments.length === 0) {
      setFilteredDepartments([]);
      return;
    }
    
    let filtered = departments;
    
    if (searchTerm) {
      filtered = filtered.filter(dept => 
        dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (dept.description && dept.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // 해당 품목에 이미 선택된 부서는 제외
    const currentItem = formData.purchaseItems[itemIndex];
    if (currentItem && currentItem.requestDepartments) {
      filtered = filtered.filter(dept => 
        !currentItem.requestDepartments.some(selectedDept => {
          const selectedName = typeof selectedDept === 'string' ? selectedDept : selectedDept.name || selectedDept;
          return selectedName === dept.name;
        })
      );
    }
    
    setFilteredDepartments(filtered);
  };

  // 부서 입력 포커스 처리
  const handleDepartmentInputFocus = (itemIndex) => {
    setCurrentSuggestionField('department');
    setCurrentSuggestionIndex(itemIndex);
    setShowDepartmentSuggestions(true);
    filterDepartmentsForItem(departmentSearchTerm, itemIndex);
  };

  // 부서 입력 블러 처리
  const handleDepartmentInputBlur = () => {
    setTimeout(() => {
      setShowDepartmentSuggestions(false);
    }, 200);
  };

  // 부서 선택 - 개선된 구조 (중복 호출 방지)
  const selectDepartment = useCallback((department) => {
    setFormData(prevData => {
      const isAlreadySelected = prevData.requestDepartments.some(selectedDept => {
        const selectedName = typeof selectedDept === 'string' ? selectedDept : selectedDept.name || selectedDept;
        return selectedName === department.name;
      });
      
      if (!isAlreadySelected) {
        return {
          ...prevData,
          requestDepartments: [...prevData.requestDepartments, department.name]
        };
      }
      return prevData;
    });
    
    setDepartmentSearchTerm('');
    setShowDepartmentDropdown(false);
  }, []);

  // 선택된 부서 제거 - 개선된 구조 (중복 호출 방지)
  const removeDepartment = useCallback((departmentName) => {
    setFormData(prevData => ({
      ...prevData,
      requestDepartments: prevData.requestDepartments.filter(dept => {
        const deptName = typeof dept === 'string' ? dept : dept.name || dept;
        return deptName !== departmentName;
      })
    }));
  }, []);

  // 구매품목별 요청부서 선택 - 개선된 구조 (중복 호출 방지)
  const selectItemDepartment = useCallback((itemIndex, department) => {
    setFormData(prevData => {
      const updated = [...prevData.purchaseItems];
      
      // requestDepartments가 없으면 빈 배열로 초기화
      if (!updated[itemIndex].requestDepartments) {
        updated[itemIndex].requestDepartments = [];
      }
      
      // 이미 선택된 부서인지 확인
      const isAlreadySelected = updated[itemIndex].requestDepartments.some(selectedDept => {
        const selectedName = typeof selectedDept === 'string' ? selectedDept : selectedDept.name || selectedDept;
        return selectedName === department;
      });
      
      if (!isAlreadySelected) {
        updated[itemIndex].requestDepartments = [...updated[itemIndex].requestDepartments, department];
      }
      
      return {
        ...prevData,
        purchaseItems: updated
      };
    });
    
    // 부서 선택 후 검색어 초기화
    setDepartmentSearchTerm('');
    setShowDepartmentSuggestions(false);
  }, []);

  // 구매품목 제거
  const removePurchaseItem = useCallback((itemIndex) => {
    setFormData(prevData => {
      const updated = [...prevData.purchaseItems];
      updated.splice(itemIndex, 1);
      return {
        ...prevData,
        purchaseItems: updated
      };
    });
  }, []);

  // 구매품목별 요청부서 제거 - 개선된 구조 (중복 호출 방지)
  const removeItemDepartment = useCallback((itemIndex, departmentName) => {
    setFormData(prevData => {
      const updated = [...prevData.purchaseItems];
      
      if (updated[itemIndex].requestDepartments) {
        updated[itemIndex].requestDepartments = updated[itemIndex].requestDepartments.filter(dept => {
          const deptName = typeof dept === 'string' ? dept : dept.name || dept;
          return deptName !== departmentName;
        });
      }
      
      return {
        ...prevData,
        purchaseItems: updated
      };
    });
  }, []);

  // 구매품목 비용분배 추가 - 강화된 구조 (중복 호출 및 상태 불일치 방지)
  const addCostAllocation = useCallback((itemIndex) => {
    console.log(`🚨 addCostAllocation 호출:`, { itemIndex });
    
    // 함수 실행 중복 방지를 위한 플래그
    if (addCostAllocation.isExecuting) {
      console.log(`🚨 addCostAllocation 이미 실행 중, 중복 호출 차단`);
      return;
    }
    
    addCostAllocation.isExecuting = true;
    
    try {
      setFormData(prevData => {
        // 현재 상태의 깊은 복사본 생성
        const updated = JSON.parse(JSON.stringify(prevData.purchaseItems));
        
        // costAllocation이 없으면 생성
        if (!updated[itemIndex].costAllocation) {
          updated[itemIndex].costAllocation = { 
            type: 'percentage',
            allocations: [] 
          };
        }
        
        // allocations가 없으면 빈 배열로 초기화
        if (!updated[itemIndex].costAllocation.allocations) {
          updated[itemIndex].costAllocation.allocations = [];
        }
        
        // 새로운 비용분배 추가
        const newAllocation = {
          id: Date.now() + Math.random(),
          department: '',
          type: 'percentage',
          value: 0
        };
        
        console.log(`🚨 새로운 allocation 추가:`, newAllocation);
        console.log(`🚨 추가 전 allocations 개수:`, updated[itemIndex].costAllocation.allocations.length);
        
        // 기존 allocations에 새 allocation 추가
        updated[itemIndex].costAllocation.allocations.push(newAllocation);
        
        console.log(`🚨 추가 후 allocations 개수:`, updated[itemIndex].costAllocation.allocations.length);
        
        // 비용분배 개수에 따라 균등 분배 계산
        const totalAllocations = updated[itemIndex].costAllocation.allocations.length;
        const equalRatio = totalAllocations > 0 ? Math.round(100 / totalAllocations) : 0;
        
        // 모든 비용분배의 비율을 균등하게 설정
        const equalizedAllocations = updated[itemIndex].costAllocation.allocations.map((alloc, index) => {
          // 마지막 분배는 나머지 비율을 모두 가져가도록 설정
          if (index === totalAllocations - 1) {
            const remainingRatio = 100 - (equalRatio * (totalAllocations - 1));
            return {
              ...alloc,
              value: remainingRatio
            };
          } else {
            return {
              ...alloc,
              value: equalRatio
            };
          }
        });
        
        updated[itemIndex].costAllocation.allocations = equalizedAllocations;
        
        console.log(`🚨 업데이트된 allocations:`, equalizedAllocations);
        console.log(`🚨 최종 purchaseItems:`, updated);
        
        return {
          ...prevData,
          purchaseItems: updated
        };
      });
    } finally {
      // 실행 완료 후 플래그 해제
      setTimeout(() => {
        addCostAllocation.isExecuting = false;
      }, 100);
    }
  }, []);

  // 용역계약 비용분배 추가
  const addServiceCostAllocation = useCallback((itemIndex) => {
    console.log(`🚨 addServiceCostAllocation 호출:`, { itemIndex });
    
    // 함수 실행 중복 방지를 위한 플래그
    if (addServiceCostAllocation.isExecuting) {
      console.log(`🚨 addServiceCostAllocation 이미 실행 중, 중복 호출 차단`);
      return;
    }
    
    addServiceCostAllocation.isExecuting = true;
    
    try {
      setFormData(prevData => {
        // 현재 상태의 깊은 복사본 생성
        const updated = JSON.parse(JSON.stringify(prevData.serviceItems));
        
        // costAllocation이 없으면 생성
        if (!updated[itemIndex].costAllocation) {
          updated[itemIndex].costAllocation = { 
            type: 'percentage',
            allocations: [] 
          };
        }
        
        // allocations가 없으면 빈 배열로 초기화
        if (!updated[itemIndex].costAllocation.allocations) {
          updated[itemIndex].costAllocation.allocations = [];
        }
        
        // 새로운 비용분배 추가
        const newAllocation = {
          id: Date.now() + Math.random(),
          department: '',
          type: 'percentage',
          value: 0
        };
        
        console.log(`🚨 새로운 allocation 추가:`, newAllocation);
        console.log(`🚨 추가 전 allocations 개수:`, updated[itemIndex].costAllocation.allocations.length);
        
        // 기존 allocations에 새 allocation 추가
        updated[itemIndex].costAllocation.allocations.push(newAllocation);
        
        console.log(`🚨 추가 후 allocations 개수:`, updated[itemIndex].costAllocation.allocations.length);
        
        // 비용분배 개수에 따라 균등 분배 계산
        const totalAllocations = updated[itemIndex].costAllocation.allocations.length;
        const equalRatio = totalAllocations > 0 ? Math.round(100 / totalAllocations) : 0;
        
        // 모든 비용분배의 비율을 균등하게 설정
        const equalizedAllocations = updated[itemIndex].costAllocation.allocations.map((alloc, index) => {
          // 마지막 분배는 나머지 비율을 모두 가져가도록 설정
          if (index === totalAllocations - 1) {
            const remainingRatio = 100 - (equalRatio * (totalAllocations - 1));
            return {
              ...alloc,
              value: remainingRatio
            };
          } else {
            return {
              ...alloc,
              value: equalRatio
            };
          }
        });
        
        updated[itemIndex].costAllocation.allocations = equalizedAllocations;
        
        console.log(`🚨 업데이트된 allocations:`, equalizedAllocations);
        console.log(`🚨 최종 serviceItems:`, updated);
        
        return {
          ...prevData,
          serviceItems: updated
        };
      });
    } finally {
      // 실행 완료 후 플래그 해제
      setTimeout(() => {
        addServiceCostAllocation.isExecuting = false;
      }, 100);
    }
  }, []);

  // 구매품목 비용분배 제거 - 개선된 구조 (중복 호출 방지)
  const removeCostAllocation = useCallback((itemIndex, allocationIndex) => {
    console.log(`🚨 removeCostAllocation 호출:`, { itemIndex, allocationIndex });
    
    setFormData(prevData => {
      const updated = [...prevData.purchaseItems];
      
      // costAllocation이 없으면 생성
      if (!updated[itemIndex].costAllocation) {
        updated[itemIndex].costAllocation = { 
          type: 'percentage',
          allocations: [] 
        };
      }
      
      // allocations가 없으면 빈 배열로 초기화
      if (!updated[itemIndex].costAllocation.allocations) {
        updated[itemIndex].costAllocation.allocations = [];
      }
      
      // 해당 분배 제거
      const updatedAllocations = updated[itemIndex].costAllocation.allocations.filter((_, index) => index !== allocationIndex);
      
      console.log(`🚨 제거 후 allocations:`, updatedAllocations);
      
      // 삭제 후 나머지 분배들의 비율을 균등하게 재분배
      if (updatedAllocations.length > 0) {
        const equalRatio = Math.round(100 / updatedAllocations.length);
        const equalizedAllocations = updatedAllocations.map((alloc, index) => {
          // 마지막 분배는 나머지 비율을 모두 가져가도록 설정
          if (index === updatedAllocations.length - 1) {
            const remainingRatio = 100 - (equalRatio * (updatedAllocations.length - 1));
            return {
              ...alloc,
              value: remainingRatio
            };
          } else {
            return {
              ...alloc,
              value: equalRatio
            };
          }
        });
        
        updated[itemIndex].costAllocation.allocations = equalizedAllocations;
        console.log(`🚨 균등 분배 후 allocations:`, equalizedAllocations);
      } else {
        updated[itemIndex].costAllocation.allocations = updatedAllocations;
      }
      
      console.log(`🚨 최종 purchaseItems:`, updated);
      
      return {
        ...prevData,
        purchaseItems: updated
      };
    });
  }, []);

  // 구매품목 비용분배 업데이트 - 개선된 구조 (중복 호출 방지)
  const updateCostAllocation = useCallback((itemIndex, allocationIndex, field, value) => {
    console.log(`🚨 updateCostAllocation 호출:`, { itemIndex, allocationIndex, field, value });
    
    setFormData(prevData => {
      const updated = [...prevData.purchaseItems];
      
      // costAllocation이 없으면 생성
      if (!updated[itemIndex].costAllocation) {
        updated[itemIndex].costAllocation = { 
          type: 'percentage',
          allocations: [] 
        };
      }
      
      // allocations가 없으면 빈 배열로 초기화
      if (!updated[itemIndex].costAllocation.allocations) {
        updated[itemIndex].costAllocation.allocations = [];
      }
      
      // allocation이 없으면 생성
      if (!updated[itemIndex].costAllocation.allocations[allocationIndex]) {
        updated[itemIndex].costAllocation.allocations[allocationIndex] = {
          id: Date.now() + Math.random(),
          department: '',
          type: 'percentage',
          value: 0
        };
      }
      
      // 값 업데이트
      updated[itemIndex].costAllocation.allocations[allocationIndex][field] = value;
      
      console.log(`🚨 업데이트 후 allocation:`, updated[itemIndex].costAllocation.allocations[allocationIndex]);
      
      // 정률인 경우 합이 100%를 넘지 않도록 조정
      if (field === 'value' && updated[itemIndex].costAllocation.allocations[allocationIndex].type === 'percentage') {
        const currentAllocations = updated[itemIndex].costAllocation.allocations;
        const totalPercentage = currentAllocations.reduce((sum, alloc, idx) => {
          if (alloc.type === 'percentage' && idx !== allocationIndex) {
            return sum + (alloc.value || 0);
          }
          return sum;
        }, 0) + value;
        
        // 100%를 넘는 경우 현재 입력값을 조정
        if (totalPercentage > 100) {
          updated[itemIndex].costAllocation.allocations[allocationIndex].value = Math.max(0, 100 - totalPercentage + value);
        }
      }
      
      console.log(`🚨 최종 업데이트된 purchaseItems:`, updated);
      
      return {
        ...prevData,
        purchaseItems: updated
      };
    });
  }, []);

  // 구매품목별 비용분배 합계 계산
  const calculateItemAllocationTotal = (item) => {
    const total = (item.costAllocation?.allocations ?? []).reduce((sum, alloc) => {
      if (alloc.type === 'percentage') {
        return sum + (alloc.value || 0);
      } else {
        return sum + (alloc.value || 0);
      }
    }, 0);
    
    return total;
  };

  // 구매품목별 비용분배 합계를 정률로 환산
  const calculateItemAllocationTotalAsPercentage = (item) => {
    if (!item.amount || item.amount <= 0) return 0;
    
    const totalAmount = (item.costAllocation?.allocations ?? []).reduce((sum, alloc) => {
      if (alloc.type === 'percentage') {
        return sum + (item.amount * (alloc.value / 100));
      } else {
        return sum + (alloc.value || 0);
      }
    }, 0);
    
    return totalAmount > 0 ? Math.round((totalAmount / item.amount) * 100 * 100) / 100 : 0;
  };

  // 전체 비용귀속부서 배분 실시간 계산
  const calculateTotalCostAllocation = () => {
    const totalAllocation = {};
    const totalContractAmount = calculateTotalAmount();
    
    // 모든 구매품목의 비용분배 정보를 수집하여 실시간 계산
    formData.purchaseItems.forEach((item, index) => {
      if (item.costAllocation?.allocations) {
        item.costAllocation.allocations.forEach(alloc => {
          if (!totalAllocation[alloc.department]) {
            totalAllocation[alloc.department] = {
              amount: 0
            };
          }
          
          if (alloc.type === 'percentage') {
            const itemAmount = parseFloat(item.amount) || 0;
            const allocValue = parseFloat(alloc.value) || 0;
            const amount = (itemAmount * (allocValue / 100));
            totalAllocation[alloc.department].amount += amount;
          } else {
            const allocValue = parseFloat(alloc.value) || 0;
            totalAllocation[alloc.department].amount += allocValue;
          }
        });
      }
    });
    
    // 전체 계약금액 대비 각 부서별 비율 계산
    Object.keys(totalAllocation).forEach(department => {
      if (totalContractAmount > 0) {
        totalAllocation[department].percentage = (totalAllocation[department].amount / totalContractAmount) * 100;
      } else {
        totalAllocation[department].percentage = 0;
      }
    });
    
    return totalAllocation;
  };



  // 부서 드롭다운 열기
  const openDepartmentDropdown = () => {
    setDepartmentSearchTerm('');
    setFilteredDepartments(departments.filter(dept => 
      !formData.requestDepartments.some(selectedDept => {
        const selectedName = typeof selectedDept === 'string' ? selectedDept : selectedDept.name || selectedDept;
        return selectedName === dept.name;
      })
    ));
    setShowDepartmentDropdown(true);
  };

  // 구매 내역 가져오기
  const fetchPurchaseHistory = async (searchTerm = '', field = '', categoryFilter = null) => {
    try {
      const params = new URLSearchParams();
      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim());
      }
      if (field) {
        params.append('field', field);
      }
      if (categoryFilter) {
        params.append('category', categoryFilter);
        console.log('구분 필터 적용:', categoryFilter);
      }
      
      const url = `${API_BASE_URL}/api/purchase-history?${params.toString()}`;
      console.log('API 호출:', url);
      
      const response = await fetch(url);
      const data = await response.json();
      console.log('검색 결과:', data);
      
      // 동일한 품목을 그룹화하고 평균금액 계산
      if (field === 'productName' || field === 'supplier') {
        const groupedData = groupAndCalculateAverage(data, field);
        setPurchaseHistory(groupedData);
      } else {
        setPurchaseHistory(data);
      }
    } catch (error) {
      console.error('구매 내역 로드 실패:', error);
    }
  };

  // 구분별 계정과목 매핑 함수
  const getAccountSubjectByCategory = (category) => {
    const accountMapping = {
      '소프트웨어': {
        관: '고정자산',
        항: '기타고정자산',
        목: '무형자산',
        절: '소프트웨어'
      },
      '전산기구비품': {
        관: '고정자산',
        항: '유형자산',
        목: '전산기구비품'
      },
      '전산수선': {
        관: '고정자산',
        항: '유형자산',
        목: '전산수선비'
      },
      '전산설치': {
        관: '영업비용',
        항: '판관비',
        목: '전산운용비',
        절: '전산설치비'
      },
      '전산소모품': {
        관: '영업비용',
        항: '판관비',
        목: '전산운용비',
        절: '전산소모품비'
      },
      '전산용역': {
        관: '영업비용',
        항: '판관비',
        목: '전산운용비',
        절: '전산용역비'
      },
      '전산임차': {
        관: '영업비용',
        항: '판관비',
        목: '전산운용비',
        절: '전산임차료'
      },
      '전산회선': {
        관: '영업비용',
        항: '판관비',
        목: '전산운용비',
        절: '전산회선료'
      },
      '전신전화': {
        관: '영업비용',
        항: '판관비',
        목: '전산운용비',
        절: '전신전화료'
      },
      '증권전산운용': {
        관: '영업비용',
        항: '판관비',
        목: '전산운용비',
        절: '증권전산운용비'
      },
      '보험비': {
        관: '영업비용',
        항: '판관비',
        목: '기타판관비',
        절: '보험료'
      },
      '일반업무수수료': {
        관: '영업비용',
        항: '판관비',
        목: '기타판관비',
        절: '일반업무수수료'
      },
      '통신정보료': {
        관: '영업비용',
        항: '판관비',
        목: '기타판관비',
        절: '통신정보료'
      },
      '회비및공과금': {
        관: '영업비용',
        항: '판관비',
        목: '세금과공과금',
        절: '회비및공과금'
      }
    };
    
    return accountMapping[category] || null;
  };

  // 동일한 품목을 그룹화하고 평균금액 계산하는 함수
  const groupAndCalculateAverage = (data, field) => {
    const grouped = {};
    
    data.forEach(item => {
      let key;
      if (field === 'productName') {
        key = item.product_name;
      } else if (field === 'supplier') {
        key = item.supplier;
      } else {
        return; // 다른 필드인 경우 그룹화하지 않음
      }
      
      if (!grouped[key]) {
        grouped[key] = {
          [field === 'productName' ? 'product_name' : 'supplier']: key,
          item: item.item,
          frequency: 0,
          total_amount: 0,
          avg_unit_price: 0,
          min_price: Infinity,
          max_price: Infinity
        };
      }
      
      grouped[key].frequency += item.frequency || 1;
      grouped[key].total_amount += (item.avg_unit_price || 0) * (item.frequency || 1);
      
      const currentPrice = item.avg_unit_price || 0;
      if (currentPrice < grouped[key].min_price) {
        grouped[key].min_price = currentPrice;
      }
      if (currentPrice > grouped[key].max_price) {
        grouped[key].max_price = currentPrice;
      }
    });
    
    // 평균 단가 계산 및 배열로 변환
    const result = Object.values(grouped).map(item => ({
      ...item,
      avg_unit_price: item.frequency > 0 ? Math.round(item.total_amount / item.frequency) : 0,
      min_price: item.min_price === Infinity ? 0 : item.min_price,
      max_price: item.max_price === Infinity ? 0 : item.max_price
    }));
    
    // 구매횟수 기준으로 정렬 (높은 순)
    result.sort((a, b) => b.frequency - a.frequency);
    
    return result;
  };

  // 실시간 검색 디바운스
  const [searchTimeout, setSearchTimeout] = useState(null);

  // 미리보기 관련 상태 (제거됨 - ESLint 오류 방지용)
  const showPreview = false; // 항상 false로 고정
  const popupSize = { width: 99, height: 97 }; // 사용되지 않음
  const setPopupSize = () => {}; // 사용되지 않음
  const isResizing = false; // 사용되지 않음
  const handleResizeStart = () => {}; // 사용되지 않음
  const handleClosePreview = () => {}; // 사용되지 않음

  // 리사이즈 핸들러 (제거됨)
  /*
  const handleResizeStart = (e, direction) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeDirection(direction);
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = popupSize.width;
    const startHeight = popupSize.height;
    
    const handleMouseMove = (moveEvent) => {
      const deltaX = ((moveEvent.clientX - startX) / window.innerWidth) * 100;
      const deltaY = ((moveEvent.clientY - startY) / window.innerHeight) * 100;
      
      let newWidth = startWidth;
      let newHeight = startHeight;
      
      if (direction === 'right' || direction === 'corner') {
        newWidth = Math.max(50, Math.min(100, startWidth + deltaX));
      }
      
      if (direction === 'bottom' || direction === 'corner') {
        newHeight = Math.max(40, Math.min(100, startHeight + deltaY));
      }
      
      setPopupSize({ width: newWidth, height: newHeight });
    };
    
    const handleMouseUp = () => {
      setIsResizing(false);
      setResizeDirection(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  */


  const debouncedSearch = (searchTerm, field, itemIndex) => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    const timeout = setTimeout(() => {
      console.log('검색 실행:', { searchTerm, field, itemIndex });
      if (searchTerm.trim()) {
        // 내역 검색 시 해당 품목의 구분 정보 전달
        let categoryFilter = null;
        if (field === 'productName' && formData.purchaseItems[itemIndex]?.item) {
          categoryFilter = formData.purchaseItems[itemIndex].item;
        }
        
        fetchPurchaseHistory(searchTerm, field, categoryFilter);
        setCurrentSuggestionField(field);
        setCurrentSuggestionIndex(itemIndex);
        
        if (field === 'item') setShowItemSuggestions(true);
        else if (field === 'productName') setShowProductSuggestions(true);
        else if (field === 'supplier') setShowSupplierSuggestions(true);
      } else {
        // 검색어가 없으면 추천 숨기기
        setShowItemSuggestions(false);
        setShowProductSuggestions(false);
        setShowSupplierSuggestions(false);
      }
    }, 300);
    
    setSearchTimeout(timeout);
  };

  // 추천 선택
  const selectSuggestion = (field, value, itemIndex) => {
    const updated = [...formData.purchaseItems];
    updated[itemIndex][field] = value;
    setFormData({...formData, purchaseItems: updated});
    
    // 추천 창 닫기
    setShowItemSuggestions(false);
    setShowProductSuggestions(false);
    setShowSupplierSuggestions(false);
    setCurrentSuggestionField(null);
    setCurrentSuggestionIndex(null);
  };

  // 입력 필드 포커스 시 추천 표시
  const handleInputFocus = async (field, itemIndex, searchTerm = '') => {
    setCurrentSuggestionField(field);
    setCurrentSuggestionIndex(itemIndex);
    
    // 내역 필드 포커스 시 구분 정보 전달
    let categoryFilter = null;
    if (field === 'productName' && formData.purchaseItems[itemIndex]?.item) {
      categoryFilter = formData.purchaseItems[itemIndex].item;
    }
    
    if (searchTerm && searchTerm.trim()) {
      await fetchPurchaseHistory(searchTerm, field, categoryFilter);
    } else {
      await fetchPurchaseHistory('', field, categoryFilter);
    }
    
    if (field === 'item') setShowItemSuggestions(true);
    else if (field === 'productName') setShowProductSuggestions(true);
    else if (field === 'supplier') setShowSupplierSuggestions(true);
  };

  // 입력 필드 블러 시 추천 숨기기
  const handleInputBlur = () => {
    setTimeout(() => {
      setShowItemSuggestions(false);
      setShowProductSuggestions(false);
      setShowSupplierSuggestions(false);
      setCurrentSuggestionField(null);
      setCurrentSuggestionIndex(null);
    }, 200);
  };

  // 편집 모드 데이터 정규화 함수
  const normalizeEditModeData = (formData, totalAmount, approvalLine) => {
    const normalizedPurchaseItems = [];
    
    for (let i = 0; i < formData.purchaseItems.length; i++) {
      const item = formData.purchaseItems[i];
      const normalizedItem = { ...item };
      normalizedItem.costAllocation = item.costAllocation || { type: 'percentage', allocations: [] };
      normalizedItem.requestDepartments = item.requestDepartments || [];
      normalizedPurchaseItems.push(normalizedItem);
    }
    
    return {
      contractType,
      purpose: formData.purpose,
      basis: formData.basis,
      budget: formData.budget,
      contractMethod: formData.contractMethod,
      accountSubject: formData.accountSubject,
      requestDepartments: formData.requestDepartments || [],
      purchaseItems: normalizedPurchaseItems,
      serviceItems: formData.serviceItems || [],
      suppliers: formData.suppliers || [],
      changeReason: formData.changeReason || '',
      extensionReason: formData.extensionReason || '',
      beforeItems: formData.beforeItems || [],
      afterItems: formData.afterItems || [],
      contractPeriod: formData.contractPeriod || '',
      paymentMethod: formData.paymentMethod || '',
      biddingType: formData.biddingType || '',
      qualificationRequirements: formData.qualificationRequirements || '',
      evaluationCriteria: formData.evaluationCriteria || '',
      priceComparison: formData.priceComparison || [],
      totalAmount,
      approvalLine,
      isDraft: false
    };
  };

  // 통합 품의서 저장 함수 (임시저장 + 작성완료)
  const handleProposalSave = async (isDraft = true, preventNavigation = false) => {
    try {
      console.log(isDraft ? '임시저장 시작...' : '작성완료 저장 시작...');
      
      // 데이터 검증
      if (isDraft) {
        // 임시저장: 최소 1개 이상의 값이 있는지 확인
        const hasAnyData = formData.title?.trim() ||
                          formData.purpose?.trim() || 
                          formData.basis?.trim() || 
                          formData.budget || 
                          (formData.purchaseItems && formData.purchaseItems.length > 0) ||
                          (formData.serviceItems && formData.serviceItems.length > 0) ||
                          formData.wysiwygContent?.trim(); // 자유양식 내용 추가
        
        if (!hasAnyData) {
          alert('저장할 데이터가 없습니다. 최소 1개 이상의 항목을 입력해주세요.');
          return;
        }
        console.log('✅ 임시저장 최소 데이터 확인 완료');
        console.log('🔍 디버깅 - wysiwygContent 값:', formData.wysiwygContent);
        console.log('🔍 디버깅 - wysiwygContent 길이:', formData.wysiwygContent?.length);
        console.log('🔍 디버깅 - contractType:', contractType);
      } else {
        // 작성완료: 필수 항목 검증
        console.log('✅ 작성완료 필수 항목 검증 시작');
        
        if (!formData.purpose?.trim()) {
          alert('품의서 목적을 입력해주세요.');
          return;
        }
        
        if (!formData.basis?.trim()) {
          alert('계약 근거를 입력해주세요.');
          return;
        }
        
        if (!formData.budget) {
          alert('사업예산을 선택해주세요.');
          return;
        }
        

        
        // 계약 유형별 필수 항목 검증
        if (contractType === 'purchase' || contractType === 'change' || contractType === 'extension') {
          if (!formData.purchaseItems || formData.purchaseItems.length === 0) {
            alert('구매품목을 추가해주세요.');
            return;
          }
          
          // 각 구매품목의 필수 항목 검증
          for (let i = 0; i < formData.purchaseItems.length; i++) {
            const item = formData.purchaseItems[i];
            if (!item.item?.trim()) {
              alert(`${i + 1}번째 구매품목의 구분을 입력해주세요.`);
              return;
            }
            if (!item.productName?.trim()) {
              alert(`${i + 1}번째 구매품목의 내역을 입력해주세요.`);
              return;
            }
            if (!item.quantity || item.quantity <= 0) {
              alert(`${i + 1}번째 구매품목의 수량을 입력해주세요.`);
              return;
            }
            if (!item.unitPrice || item.unitPrice <= 0) {
              alert(`${i + 1}번째 구매품목의 단가를 입력해주세요.`);
              return;
            }
          }
        } else if (contractType === 'service') {
          if (!formData.serviceItems || formData.serviceItems.length === 0) {
            alert('용역품목을 추가해주세요.');
            return;
          }
          
          // 각 용역품목의 필수 항목 검증
          for (let i = 0; i < formData.serviceItems.length; i++) {
            const item = formData.serviceItems[i];
            if (!item.item?.trim()) {
              alert(`${i + 1}번째 용역품목의 항목명을 입력해주세요.`);
              return;
            }
            if (!item.personnel || item.personnel <= 0) {
              alert(`${i + 1}번째 용역품목의 인원수를 입력해주세요.`);
              return;
            }
            if (!item.contractAmount || item.contractAmount <= 0) {
              alert(`${i + 1}번째 용역품목의 계약금액을 입력해주세요.`);
              return;
            }
          }
        } else if (contractType === 'freeform') {
          if (!formData.wysiwygContent?.trim()) {
            alert('자유양식 문서 내용을 입력해주세요.');
            return;
          }
        }
        
        // 비용귀속분배 필수 검증 (구매계약의 경우)
        if (contractType === 'purchase' || contractType === 'change' || contractType === 'extension') {
          for (let i = 0; i < formData.purchaseItems.length; i++) {
            const item = formData.purchaseItems[i];
            if (!item.costAllocation || !item.costAllocation.allocations || item.costAllocation.allocations.length === 0) {
              alert(`${i + 1}번째 구매품목의 비용귀속분배 정보를 입력해주세요.`);
              return;
            }
            
            // 비용분배 합계 검증
            const totalPercentage = item.costAllocation.allocations.reduce((sum, alloc) => {
              return alloc.type === 'percentage' ? sum + (alloc.value || 0) : sum;
            }, 0);
            
            if (Math.abs(totalPercentage - 100) > 0.01) {
              alert(`${i + 1}번째 구매품목의 비용분배 비율 합계가 100%가 아닙니다. (현재: ${totalPercentage}%)`);
              return;
            }
          }
        }
        
        console.log('✅ 작성완료 필수 항목 검증 완료');
      }
      
      // 구매품목별 비용분배 정보 수집 (강화된 로직)
      const purchaseItemCostAllocations = [];
      console.log(`=== ${isDraft ? '임시저장' : '작성완료'} 시 비용분배 정보 수집 ===`);
      console.log('전체 구매품목 수:', formData.purchaseItems.length);
      
      formData.purchaseItems.forEach((item, itemIndex) => {
        console.log(`구매품목 ${itemIndex + 1} (${item.item}) 비용분배 정보:`, {
          hasCostAllocation: !!item.costAllocation,
          costAllocationData: item.costAllocation,
          allocationsCount: item.costAllocation?.allocations?.length || 0,
          itemData: item
        });
        
        // 비용분배 정보가 있는 경우에만 수집
        if (item.costAllocation && item.costAllocation.allocations && item.costAllocation.allocations.length > 0) {
          item.costAllocation.allocations.forEach((alloc, allocIndex) => {
            // 유효성 검사 추가
            if (alloc && alloc.department && (alloc.value || alloc.value === 0)) {
              const allocationData = {
                itemIndex,
                allocationIndex: allocIndex,
                department: alloc.department,
                type: alloc.type || 'percentage',
                value: alloc.value,
                amount: alloc.type === 'percentage' ? (item.amount * (alloc.value / 100)) : alloc.value,
                // 추가 식별 정보
                itemName: item.item,
                productName: item.productName
              };
              purchaseItemCostAllocations.push(allocationData);
              console.log(`  할당 ${allocIndex + 1}:`, allocationData);
            } else {
              console.log(`  할당 ${allocIndex + 1} 유효하지 않음:`, alloc);
            }
          });
        } else {
          console.log(`  비용분배 정보 없음`);
        }
      });
      
      console.log('최종 수집된 비용분배 정보:', purchaseItemCostAllocations);

      // 구매품목에 비용분배 정보를 직접 포함하여 저장 (강화된 구조)
      const purchaseItemsWithAllocations = formData.purchaseItems.map(item => {
        // costAllocation이 없거나 allocations가 없으면 기본값 생성
        const costAllocation = item.costAllocation && item.costAllocation.allocations 
          ? {
              type: item.costAllocation.type || 'percentage',
              allocations: item.costAllocation.allocations.map(alloc => ({
                id: alloc.id || Date.now() + Math.random(),
                department: alloc.department || '',
                type: alloc.type || 'percentage',
                value: alloc.value || 0
              }))
            }
          : { type: 'percentage', allocations: [] };
        
        // requestDepartments가 없으면 빈 배열로 초기화
        const requestDepartments = item.requestDepartments || [];
        
        return {
          ...item,
          costAllocation,
          requestDepartments
        };
      });

      // 요청부서 데이터 정규화 (문자열 배열로 변환)
      const normalizedRequestDepartments = (formData.requestDepartments || []).map(dept => 
        typeof dept === 'string' ? dept : dept.name || dept
      ).filter(Boolean); // 빈 값 제거

      // 계약 유형 검증
      if (!contractType) {
        alert('계약 유형을 선택해주세요.');
        return;
      }
      
      // budget 값 디버깅
      console.log('🔍 임시저장 시 budget 값 확인:', {
        'formData.budget': formData.budget,
        'typeof formData.budget': typeof formData.budget,
        'parseInt(formData.budget)': parseInt(formData.budget),
        'isNaN(parseInt(formData.budget))': isNaN(parseInt(formData.budget))
      });

      // 총 금액 계산
      const totalAmount = calculateTotalAmount();
      console.log('🔍 임시저장 시 총 금액:', totalAmount);

      // 계정과목 자동 생성 (구매품목 기반)
      const autoAccountSubject = (() => {
        if (formData.purchaseItems && formData.purchaseItems.length > 0) {
          const accountSubjects = formData.purchaseItems
            .map(item => {
              const accountSubject = getAccountSubjectByCategory(item.item);
              if (accountSubject) {
                return `${accountSubject.관}-${accountSubject.항}-${accountSubject.목}${accountSubject.절 ? `-${accountSubject.절}` : ''}`;
              }
              return null;
            })
            .filter(Boolean);
          
          if (accountSubjects.length > 0) {
            return [...new Set(accountSubjects)].join(', '); // 중복 제거 후 결합
          }
        }
        return '일반관리비'; // 기본값
      })();

      const proposalData = {
        contractType: contractType, // 사용자가 선택한 계약 유형
        title: formData.title || formData.purpose || '품의서',
        purpose: formData.purpose || '',
        basis: formData.basis || '',
        budget: formData.budget || '',
        contractMethod: formData.contractMethod || '',
        accountSubject: autoAccountSubject,
        totalAmount: totalAmount, // 총 금액 추가
        requestDepartments: normalizedRequestDepartments, // 정규화된 요청부서
        purchaseItems: purchaseItemsWithAllocations, // 비용분배 정보가 포함된 구매품목
        serviceItems: formData.serviceItems || [],
        suppliers: formData.suppliers || [],
        changeReason: formData.changeReason || '',
        extensionReason: formData.extensionReason || '',
        beforeItems: formData.beforeItems || [],
        afterItems: formData.afterItems || [],
        contractPeriod: formData.contractPeriod || '',
        paymentMethod: formData.paymentMethod || '',
        biddingType: formData.biddingType || '',
        qualificationRequirements: formData.qualificationRequirements || '',
        evaluationCriteria: formData.evaluationCriteria || '',
        priceComparison: formData.priceComparison || [],
        wysiwygContent: formData.wysiwygContent || '', // 자유양식 문서 내용 추가
        other: formData.other || '', // 기타 사항 추가
        createdBy: '사용자1', // 고정값으로 설정
        isDraft: isDraft, // 매개변수에 따라 설정
        status: isDraft ? 'draft' : 'submitted', // 임시저장: draft, 작성완료: submitted
        purchaseItemCostAllocations // 추가로 별도 저장 (백업용)
      };

      // 편집 모드인 경우 proposalId는 추가하지 않음 (서버에서 자동 생성)

      console.log('서버로 전송할 데이터:', proposalData);
      console.log('🔍 디버깅 - 전송할 wysiwygContent:', proposalData.wysiwygContent);

      // 편집 모드인 경우 PUT, 새로 작성인 경우 POST
      let url, method;
      
      // API 선택 및 편집 모드 처리
      if (isDraft) {
        // 임시저장: draft API 사용 (편집 모드와 신규 작성 모두)
        url = `${API_BASE_URL}/api/proposals/draft`;
        method = 'POST';
        
        // 편집 모드인 경우 proposalId 포함
        if (editingProposalId) {
          proposalData.proposalId = editingProposalId;
          console.log('임시저장 - 편집 모드 (ID 포함):', editingProposalId);
        } else {
          console.log('임시저장 - 새로 작성');
        }
      } else {
        // 작성완료: 일반 API 사용
        if (isEditMode && editingProposalId) {
          // 편집 모드: PUT 요청
          url = `${API_BASE_URL}/api/proposals/${editingProposalId}`;
          method = 'PUT';
          console.log('작성완료 - 편집 모드 PUT 요청:', url);
        } else {
          // 신규 작성: POST 요청
                      url = `${API_BASE_URL}/api/proposals`;
          method = 'POST';
          console.log('작성완료 - 신규 작성 POST 요청:', url);
        }
      }
      
      console.log('요청 URL:', url);
      console.log('요청 메서드:', method);
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(proposalData)
      });

      // 응답 텍스트를 먼저 확인
      const responseText = await response.text();
      console.log('임시저장 응답 텍스트:', responseText);
      
      let result;
      try {
        result = JSON.parse(responseText);
        console.log('임시저장 응답 (JSON):', result);
      } catch (parseError) {
        console.error('JSON 파싱 오류:', parseError);
        console.error('응답 텍스트:', responseText);
        alert(`서버 응답을 파싱할 수 없습니다: ${responseText.substring(0, 100)}...`);
        return;
      }

      if (result.error) {
        console.log('임시저장 실패:', result);
        alert(`임시저장 실패: ${result.error}`);
        return;
      }

      // 성공 시 proposalId 설정
      if (result.proposalId) {
        setProposalId(result.proposalId);
        console.log('품의서 ID 설정:', result.proposalId);
      }

      // 성공 메시지 (preventNavigation이 true인 경우 메시지 표시 안함)
      if (!preventNavigation) {
        if (isDraft) {
          // 임시저장 메시지
          if (editingProposalId) {
            alert('품의서가 수정되었습니다.');
          } else {
            alert('품의서가 임시저장되었습니다.');
          }
          
          // 임시저장 성공 후 변경사항 초기화
          setInitialFormData(JSON.stringify(formData));
          setHasUnsavedChanges(false);
          console.log('✅ 임시저장 완료 - 변경사항 초기화');
        } else {
          // 작성완료 메시지
          const currentProposalId = result.proposalId || editingProposalId;
          const message = (isEditMode && editingProposalId)
            ? `품의서가 성공적으로 수정되었습니다! (ID: ${currentProposalId})`
            : `품의서가 성공적으로 작성완료되었습니다! (ID: ${currentProposalId})`;
          alert(message);
        }
      }
      
      // 네비게이션 처리
      if (!preventNavigation) {
        if (isDraft) {
          // 임시저장: 작성중인 품의서 페이지로 이동
          if (!editingProposalId) {
            console.log('임시저장 완료 - 작성중인 품의서 페이지로 이동');
            setTimeout(() => {
              navigate('/draft-list');
            }, 1500);
          }
        } else {
          // 작성완료: 품의서 조회 페이지로 이동
          console.log('작성완료 - 품의서 조회 페이지로 이동');
          console.log('현재 상태:', { isEditMode, editingProposalId, proposalId });
          
          // 편집 모드 완료 후 편집 상태 초기화
          if (isEditMode && editingProposalId) {
            console.log('편집 모드 완료 - 상태 초기화');
            setIsEditMode(false);
            setEditingProposalId(null);
            setProposalId(null);
          }
          
          // 즉시 이동 (알림 후 바로 이동)
          console.log('품의서 조회 화면으로 이동 시작...');
          console.log('🚀 네비게이션 경로: /contract-list');
          setTimeout(() => {
            console.log('실제 네비게이션 실행: /contract-list');
            navigate('/contract-list', { 
              state: { 
                refreshList: true,
                message: (isEditMode && editingProposalId) ? '품의서가 성공적으로 수정되었습니다!' : '품의서가 성공적으로 작성되었습니다!'
              }
            });
            console.log('✅ 네비게이션 완료: /contract-list');
          }, 500); // 500ms로 단축
        }
      }
      
    } catch (error) {
      console.error('임시저장 실패:', error);
      alert('임시저장 중 오류가 발생했습니다.');
    }
  };

  // 새로운 미리보기 기능 - 새 탭에서 열기
  const handlePreview = () => {
    // 새 탭에서 미리보기 열기
    const previewWindow = window.open('', '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
    
    if (!previewWindow) {
      alert('팝업이 차단되었습니다. 팝업 허용 후 다시 시도해주세요.');
      return;
    }

    // 공통 미리보기 함수 사용 (utils/previewGenerator.js)
    // contractType을 포함한 완전한 데이터 구성
    const completeData = {
      ...formData,
      contractType: contractType
    };
    
    // ProposalForm 미리보기 데이터 디버깅
    console.log('=== ProposalForm 미리보기 데이터 ===');
    console.log('contractType:', contractType);
    console.log('formData.purchaseItems:', formData.purchaseItems);
    console.log('formData.serviceItems:', formData.serviceItems);
    console.log('완전한 데이터:', completeData);
    
    const previewHTML = generatePreviewHTML(completeData);
    
    // 새 탭에 HTML 작성
    previewWindow.document.write(previewHTML);
    previewWindow.document.close();
    previewWindow.focus();
  };

  // 미리보기 HTML 생성 함수는 공통 유틸리티(utils/previewGenerator.js)를 사용

  // 계정과목용 품목 목록 생성
  const getItemsForAccountSubject = () => {
    let items = [];
    
    if (['purchase', 'change', 'extension'].includes(contractType) && formData.purchaseItems?.length > 0) {
      items = formData.purchaseItems
        .map(item => item.productName || item.item)
        .filter(item => item && item.trim())
        .join(', ');
    } else if (contractType === 'service' && formData.serviceItems?.length > 0) {
      items = formData.serviceItems
        .map(item => item.item)
        .filter(item => item && item.trim())
        .join(', ');
    } else if (contractType === 'freeform') {
      items = '자유양식 계약';
    }
    
    return items || '-';
  };

  // 계정과목 그룹 생성 (품의서 계정과목 섹션 값 참조)
  const getAccountSubjectGroups = () => {
    const groups = [];
    
    // 구매계약의 경우
    if (['purchase', 'change', 'extension'].includes(contractType) && formData.purchaseItems?.length > 0) {
      formData.purchaseItems.forEach(item => {
        if (item.productName && item.item) {
          const accountSubject = getAccountSubjectByCategory(item.item);
          
          if (accountSubject) {
            let accountInfo = `관: ${accountSubject.관} > 항: ${accountSubject.항} > 목: ${accountSubject.목}`;
            if (accountSubject.절) {
              accountInfo += ` > 절: ${accountSubject.절}`;
            }
            
            groups.push({
              name: item.productName,
              accountInfo: accountInfo
            });
          }
        }
      });
    }
    
    // 용역계약의 경우
    else if (contractType === 'service' && formData.serviceItems?.length > 0) {
      formData.serviceItems.forEach(item => {
        if (item.item) {
          const accountSubject = getAccountSubjectByCategory(item.item);
          
          if (accountSubject) {
            let accountInfo = `관: ${accountSubject.관} > 항: ${accountSubject.항} > 목: ${accountSubject.목}`;
            if (accountSubject.절) {
              accountInfo += ` > 절: ${accountSubject.절}`;
            }
            
            groups.push({
              name: item.item,
              accountInfo: accountInfo
            });
          }
        }
      });
    }
    
    // 자유양식의 경우 - 계정과목 정보 없음
    // (자유양식은 계정과목이 정해지지 않음)
    
    return groups;
  };

  // 계정과목 정보 섹션 생성
  const generateAccountSubjectSection = () => {
    // 계정과목별 품목 그룹핑
    const accountSubjects = getAccountSubjectGroups();
    
    if (accountSubjects.length === 0) {
      return '';
    }

    return `
      <div style="margin-top: 30px; page-break-inside: avoid;">
        <div class="section-title">계정과목</div>
        <div style="padding: 15px; border: 1px solid #ddd; border-radius: 4px;">
          ${accountSubjects.map(account => `
            <div style="margin-bottom: 10px; padding: 8px 0; border-bottom: 1px solid #eee;">
              <strong>품목:</strong> ${account.name} > ${account.accountInfo}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  };

  // 계약기간 반환
  const getContractPeriod = (item) => {
    console.log('=== 계약기간 확인 ===');
    console.log('품목:', item.productName);
    console.log('구분:', item.item);
    console.log('계약기간타입:', item.contractPeriodType);
    console.log('시작일:', item.contractStartDate);
    console.log('종료일:', item.contractEndDate);
    
    // 계약기간이 설정되어 있는 경우
    if (item.contractPeriodType) {
      // 직접입력인 경우
      if (item.contractPeriodType === 'custom') {
        if (item.contractStartDate && item.contractEndDate) {
          const result = `${item.contractStartDate} ~ ${item.contractEndDate}`;
          console.log('직접입력 결과:', result);
          return result;
        } else {
          console.log('직접입력이지만 날짜 미입력');
          return '기간 미입력';
        }
      }
      
      // 미리 정의된 기간 타입인 경우
      const periodMapping = {
        '1month': '1개월',
        '3months': '3개월', 
        '6months': '6개월',
        '1year': '1년',
        '2years': '2년',
        '3years': '3년',
        'permanent': '영구'
      };
      
      const result = periodMapping[item.contractPeriodType] || '1년';
      console.log('미리정의된 기간 결과:', result);
      return result;
    }
    
    // 계약기간이 설정되지 않은 경우
    console.log('계약기간 미설정이므로 - 반환');
    return '-';
  };

  // 계약 유형 이름 반환
  const getContractTypeName = () => {
    const types = {
      'purchase': '구매계약',
      'service': '용역계약', 
      'change': '변경계약',
      'extension': '연장계약',
      'freeform': '자유양식'
    };
    return types[contractType] || '기타';
  };

  // 비용귀속분배 섹션 생성
  const generateCostAllocationSection = () => {
    // 구매 품목과 용역 품목의 비용귀속 정보 확인
    const hasPurchaseAllocations = formData.purchaseItems?.some(item => 
      item.costAllocation?.allocations && item.costAllocation.allocations.length > 0
    );
    const hasServiceAllocations = formData.serviceItems?.some(item => 
      item.costAllocation?.allocations && item.costAllocation.allocations.length > 0
    );
    const hasAllocations = hasPurchaseAllocations || hasServiceAllocations;

    if (!hasAllocations) {
      return `
        <div class="section-title">3. 비용귀속분배</div>
        <div style="text-align: center; padding: 20px; color: #666; border: 1px solid #ddd; border-radius: 4px;">
          비용귀속분배 정보가 없습니다.
        </div>
      `;
    }

    // 모든 품목의 분배 정보를 하나의 배열로 수집
    const allAllocations = [];
    formData.purchaseItems?.forEach((item, itemIndex) => {
      const allocations = item.costAllocation?.allocations || [];
      allocations.forEach(allocation => {
        const allocationAmount = allocation.type === 'percentage' 
          ? (item.amount * (allocation.value / 100))
          : allocation.value;
        const percentage = item.amount > 0 ? (allocationAmount / item.amount * 100).toFixed(1) : 0;
        
        allAllocations.push({
          productName: item.productName || `품목 ${itemIndex + 1}`,
          classification: item.item || '-',
          department: allocation.department || '-',
          type: allocation.type === 'percentage' ? '정률 (%)' : '정액 (원)',
          value: allocation.type === 'percentage' ? allocation.value + '%' : formatCurrency(allocation.value),
          amount: allocationAmount,
          percentage: percentage
        });
      });
    });

    // 용역 품목의 분배 정보도 수집
    formData.serviceItems?.forEach((item, itemIndex) => {
      const allocations = item.costAllocation?.allocations || [];
      allocations.forEach(allocation => {
        const allocationAmount = allocation.type === 'percentage' 
          ? (item.contractAmount * (allocation.value / 100))
          : allocation.value;
        const percentage = item.contractAmount > 0 ? (allocationAmount / item.contractAmount * 100).toFixed(1) : 0;
        
        allAllocations.push({
          productName: item.item || `용역항목 ${itemIndex + 1}`,
          classification: '전산용역비',
          department: allocation.department || '-',
          type: allocation.type === 'percentage' ? '정률 (%)' : '정액 (원)',
          value: allocation.type === 'percentage' ? allocation.value + '%' : formatCurrency(allocation.value),
          amount: allocationAmount,
          percentage: percentage
        });
      });
    });

    let allocationHTML = `
      <div class="section-title">3. 비용귀속분배</div>
      <table class="details-table">
        <thead>
          <tr>
            <th>번호</th>
            <th>구분</th>
            <th>품목명</th>
            <th>귀속부서</th>
            <th>분배방식</th>
            <th>분배값</th>
            <th>분배금액</th>
          </tr>
        </thead>
        <tbody>
    `;

    // 모든 분배 정보를 하나의 테이블에 표시
    let totalAmount = 0;
    allAllocations.forEach((allocation, index) => {
      totalAmount += allocation.amount;
      allocationHTML += `
        <tr>
          <td>${index + 1}</td>
          <td>${allocation.classification}</td>
          <td>${allocation.productName}</td>
          <td>${allocation.department}</td>
          <td>${allocation.type}</td>
          <td>${allocation.value}</td>
          <td style="font-weight: bold;">${formatCurrency(allocation.amount)}</td>
        </tr>
      `;
    });

    // 전체 합계 행
    allocationHTML += `
        </tbody>
        <tfoot>
          <tr class="total-row">
            <td colspan="6">합계</td>
            <td style="font-weight: bold;">${formatCurrency(totalAmount)}</td>
          </tr>
        </tfoot>
      </table>
    `;

    return allocationHTML;
  };

  // 미리보기용 비용귀속 계산
  const calculateTotalCostAllocationForPreview = () => {
    const totalAllocation = {};
    
    formData.purchaseItems?.forEach(item => {
      const allocations = item.costAllocation?.allocations || [];
      
      allocations.forEach(allocation => {
        const department = allocation.department;
        const allocationAmount = allocation.type === 'percentage' 
          ? (item.amount * (allocation.value / 100))
          : allocation.value;
        
        if (!totalAllocation[department]) {
          totalAllocation[department] = { amount: 0, percentage: 0 };
        }
        
        totalAllocation[department].amount += allocationAmount;
      });
    });

    // 비율 계산
    const totalAmount = Object.values(totalAllocation).reduce((sum, alloc) => sum + alloc.amount, 0);
    Object.keys(totalAllocation).forEach(department => {
      if (totalAmount > 0) {
        totalAllocation[department].percentage = (totalAllocation[department].amount / totalAmount) * 100;
      }
    });

    return totalAllocation;
  };

  // 계약 방식 이름 반환
  const getContractMethodName = () => {
    if (!formData.contractMethod) return '-';
    
    const method = contractMethods.find(m => 
      m.value === formData.contractMethod || 
      m.id == formData.contractMethod ||
      m.name === formData.contractMethod
    );
    
    return method?.name || `미등록 계약방식 (${formData.contractMethod})`;
  };

  // 예산 이름 반환
  const getBudgetName = () => {
    if (!formData.budget) return '-';
    
    const budget = businessBudgets.find(b => 
      b.id == formData.budget || 
      b.project_name === formData.budget ||
      b.projectName === formData.budget ||
      b.name === formData.budget
    );
    
    if (budget) {
      const projectName = budget.project_name || budget.projectName || budget.name;
      const budgetAmount = budget.budget_amount || budget.budgetAmount || 0;
      return `${projectName} (${formatCurrency(budgetAmount)})`;
    }
    
    return `미등록 예산 (${formData.budget})`;
  };

  // 부서 이름들 반환
  const getDepartmentNames = () => {
    if (!formData.requestDepartments || formData.requestDepartments.length === 0) {
      return '-';
    }
    
    return formData.requestDepartments.map(dept => 
      typeof dept === 'string' ? dept : dept.name || dept
    ).join(', ');
  };

  // 품목/용역 섹션 생성
  const generateItemsSection = () => {
    if (contractType === 'freeform') {
      return `
        <div class="section-title">2. 자유양식 내용</div>
        <div style="border: 1px solid #ddd; padding: 15px; border-radius: 4px; min-height: 100px;">
          ${formData.wysiwygContent || '내용이 입력되지 않았습니다.'}
        </div>
      `;
    }

    if (contractType === 'service' && formData.serviceItems?.length > 0) {
      return `
        <div class="section-title">2. 용역 상세 내역</div>
        <table class="details-table">
          <thead>
            <tr>
              <th>번호</th>
              <th>용역명</th>
              <th>성명</th>
              <th>기술등급</th>
              <th>기간(개월)</th>
              <th>월단가</th>
              <th>계약금액</th>
              <th>공급업체</th>
            </tr>
          </thead>
          <tbody>
            ${formData.serviceItems.map((item, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${item.item || '-'}</td>
                <td>${item.name || item.personnel || '-'}</td>
                <td>${item.skillLevel || '-'}</td>
                <td>${item.period || 0}</td>
                <td>${formatCurrency(item.monthlyRate || 0)}</td>
                <td style="font-weight: bold;">${formatCurrency(item.contractAmount || 0)}</td>
                <td>${item.supplier || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr class="total-row">
              <td colspan="6">합계</td>
              <td>${formatCurrency(formData.serviceItems.reduce((sum, item) => sum + (parseFloat(item.contractAmount) || 0), 0))}</td>
              <td>-</td>
            </tr>
          </tfoot>
        </table>
      `;
    }

    if (['purchase', 'change', 'extension'].includes(contractType) && formData.purchaseItems?.length > 0) {
      return `
        <div class="section-title">2. 구매 상세 내역</div>
        <table class="details-table">
          <thead>
            <tr>
              <th>번호</th>
              <th>구분</th>
              <th>품목명</th>
              <th>계약기간</th>
              <th>수량</th>
              <th>단가</th>
              <th>금액</th>
              <th>공급업체</th>
            </tr>
          </thead>
          <tbody>
            ${formData.purchaseItems.map((item, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${item.item || '-'}</td>
                <td>${item.productName || '-'}</td>
                <td>${getContractPeriod(item)}</td>
                <td>${item.quantity || 0}${item.unit || '개'}</td>
                <td>${formatCurrency(item.unitPrice || 0)}</td>
                <td style="font-weight: bold;">${formatCurrency(item.amount || 0)}</td>
                <td>${item.supplier || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr class="total-row">
              <td colspan="6">합계</td>
              <td>${formatCurrency(formData.purchaseItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0))}</td>
              <td>-</td>
            </tr>
          </tfoot>
        </table>
      `;
    }

    return `
      <div class="section-title">2. 상세 내역</div>
      <div style="text-align: center; padding: 40px; color: #666; border: 1px solid #ddd; border-radius: 4px;">
        상세 내역이 입력되지 않았습니다.
      </div>
    `;
  };

  // 키보드 단축키 처리 (제거됨)
  /*
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (showPreview) {
        if (e.key === 'Escape') {
          handleClosePreview();
        } else if (e.key === '1') {
          setPopupSize({ width: 70, height: 80 });
        } else if (e.key === '2') {
          setPopupSize({ width: 85, height: 90 });
        } else if (e.key === '3') {
          setPopupSize({ width: 99, height: 97 });
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showPreview]);
  */

  // 숫자를 한글로 변환하는 함수
  const numberToKorean = (number) => {
    if (!number || number === 0) return '';
    
    const units = ['', '만', '억', '조'];
    const digits = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'];
    const tens = ['', '십', '이십', '삼십', '사십', '오십', '육십', '칠십', '팔십', '구십'];
    
    let result = '';
    let unitIndex = 0;
    
    while (number > 0) {
      const chunk = number % 10000;
      if (chunk > 0) {
        let chunkStr = '';
        
        const thousands = Math.floor(chunk / 1000);
        const hundreds = Math.floor((chunk % 1000) / 100);
        const remainder = chunk % 100;
        
        if (thousands > 0) {
          chunkStr += (thousands === 1 ? '' : digits[thousands]) + '천';
        }
        
        if (hundreds > 0) {
          chunkStr += (hundreds === 1 ? '' : digits[hundreds]) + '백';
        }
        
        if (remainder >= 20) {
          chunkStr += tens[Math.floor(remainder / 10)];
          if (remainder % 10 > 0) {
            chunkStr += digits[remainder % 10];
          }
        } else if (remainder >= 10) {
          chunkStr += '십';
          if (remainder % 10 > 0) {
            chunkStr += digits[remainder % 10];
          }
        } else if (remainder > 0) {
          chunkStr += digits[remainder];
        }
        
        result = chunkStr + units[unitIndex] + result;
      }
      
      number = Math.floor(number / 10000);
      unitIndex++;
    }
    
    return result + '원';
  };

  // 이미지 캡처 함수
  const handleCaptureImage = async () => {
    try {
      // 캡처용 요소 (7번 비용귀속까지만)
      const element = document.getElementById('capture-content');
      if (!element) {
        alert('캡처할 요소를 찾을 수 없습니다.');
        return;
      }

      // 클립보드 저장 시도 (실패 시 자동으로 다운로드로 fallback)
      await captureAndSaveToClipboard(element);
      
    } catch (error) {
      console.error('이미지 캡처 오류:', error);
      alert('이미지 캡처 중 오류가 발생했습니다: ' + error.message);
      
      // 버튼 상태 복원
      const captureBtn = document.querySelector('.capture-btn');
      if (captureBtn) {
        captureBtn.textContent = '📸 핵심내용 캡처';
        captureBtn.disabled = false;
      }
    }
  };

    // 클립보드에 저장하는 함수
  const captureAndSaveToClipboard = async (element) => {
    // 캡처 옵션 설정
    const options = {
      scale: 2, // 고해상도 캡처
      useCORS: true, // 외부 리소스 허용
      backgroundColor: '#ffffff', // 배경색 설정
      width: element.scrollWidth,
      height: element.scrollHeight,
      scrollX: 0,
      scrollY: 0
    };

    // 로딩 표시
    const captureBtn = document.querySelector('.capture-btn');
    if (captureBtn) {
      captureBtn.textContent = '📸 캡처 중...';
      captureBtn.disabled = true;
    }

    try {
      // 캡처용 요소를 임시로 표시
      element.style.display = 'block';
      
      // 이미지 캡처 실행
      const canvas = await html2canvas(element, options);
      
      // 캡처용 요소를 다시 숨김
      element.style.display = 'none';
      
      // 캔버스를 이미지 데이터로 변환
      const imageDataUrl = canvas.toDataURL('image/png', 1.0);
      
      // 권한 문제를 우회하여 이미지 복사 시도
      try {
        // 브라우저 환경 확인
        if (navigator.clipboard && window.ClipboardItem) {
          try {
            // Data URL을 Blob으로 변환
            const response = await fetch(imageDataUrl);
            const blob = await response.blob();
            
            const clipboardItem = new ClipboardItem({
              'image/png': blob
            });
            await navigator.clipboard.write([clipboardItem]);
            
            // 성공 시 버튼 상태 복원
            if (captureBtn) {
              captureBtn.textContent = '📸 클립보드 저장';
              captureBtn.disabled = false;
            }
            
            alert('이미지가 클립보드에 성공적으로 저장되었습니다! Ctrl+V로 붙여넣기할 수 있습니다.');
            return;
          } catch (clipboardError) {
            console.log('클립보드 저장 실패, 다운로드로 진행:', clipboardError);
            // 권한 문제 시 사용자에게 안내
            const userChoice = window.confirm(
              '클립보드 저장에 실패했습니다.\n\n' +
              '이는 브라우저 보안 정책 때문일 수 있습니다.\n\n' +
              '"확인"을 클릭하면 이미지를 다운로드합니다.'
            );
            
            if (userChoice) {
              await captureAndDownload(element, imageDataUrl, captureBtn);
            } else {
              // 사용자가 취소한 경우 버튼 상태만 복원
              if (captureBtn) {
                captureBtn.textContent = '📸 클립보드 저장';
                captureBtn.disabled = false;
              }
            }
            return;
          }
        }
        
        // ClipboardItem을 지원하지 않는 브라우저는 바로 다운로드
        await captureAndDownload(element, imageDataUrl, captureBtn);
        
      } catch (error) {
        console.error('이미지 처리 오류:', error);
        // 최종 fallback: 다운로드
        await captureAndDownload(element, imageDataUrl, captureBtn);
      }
    } catch (error) {
      console.error('캡처 오류:', error);
      throw error;
    }
  };

  // 다운로드 함수
  const captureAndDownload = async (element, imageDataUrl = null, captureBtn = null) => {
    try {
      let finalImageDataUrl = imageDataUrl;
      
      // 이미지 데이터가 없는 경우 새로 캡처
      if (!finalImageDataUrl) {
        const options = {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          width: element.scrollWidth,
          height: element.scrollHeight,
          scrollX: 0,
          scrollY: 0
        };

        // 캡처용 요소를 임시로 표시
        element.style.display = 'block';
        
        const canvas = await html2canvas(element, options);
        element.style.display = 'none';
        
        finalImageDataUrl = canvas.toDataURL('image/png', 1.0);
      }

      // 다운로드 실행
      const link = document.createElement('a');
      link.download = `품의서_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.png`;
      link.href = finalImageDataUrl;
      link.click();
      
      // 버튼 상태 복원
      if (captureBtn) {
        captureBtn.textContent = '📸 클립보드 저장';
        captureBtn.disabled = false;
      }
      
      alert('이미지가 다운로드되었습니다!');
    } catch (error) {
      console.error('다운로드 오류:', error);
      
      // 버튼 상태 복원
      if (captureBtn) {
        captureBtn.textContent = '📸 클립보드 저장';
        captureBtn.disabled = false;
      }
      
      alert('이미지 다운로드에 실패했습니다. 다시 시도해주세요.');
    }
  };



  // 작성완료 함수 (handleProposalSave 통합 사용)
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('=== 품의서 작성완료 시작 ===');
    console.log('isEditMode:', isEditMode);
    console.log('editingProposalId:', editingProposalId);
    console.log('proposalId:', proposalId);
    
    try {
      // 작성완료: 통합 함수 호출 (유효성 검사 포함)
      console.log('작성완료: 통합 함수 호출');
      await handleProposalSave(false); // isDraft = false (작성완료)
      
    } catch (error) {
      console.error('품의서 작성완료 오류:', error);
      
      let errorMessage = isEditMode
        ? '품의서 수정 중 오류가 발생했습니다: '
        : '품의서 작성 중 오류가 발생했습니다: ';
      
      if (error.message) {
        errorMessage += error.message;
      } else {
        errorMessage += '알 수 없는 오류가 발생했습니다.';
      }
      
      alert(errorMessage);
    }
  };

  const handleSubmit_OLD = async (e) => {
    e.preventDefault();
    
    console.log('handleSubmit 함수 시작');
    console.log('isEditMode:', isEditMode);
    console.log('editingProposalId:', editingProposalId);
    
    try {
      const totalAmount = calculateTotalAmount();
      const approvalLine = getRecommendedApprovalLine();
      
      // 필수 필드 검증 및 기본값 설정
      // contractType은 사용자가 선택한 계약 유형을 정확히 저장
      if (!contractType) {
        throw new Error('계약 유형을 선택해주세요. (구매계약, 용역계약, 변경계약, 연장계약, 자유양식 중 선택)');
      }
      
      // 필수 필드 검증
      if (!formData.budget) {
        throw new Error('사업예산을 선택해주세요.');
      }
      

      
      if (!formData.basis || formData.basis.trim() === '') {
        throw new Error('근거를 입력해주세요.');
      }
      
      // createdBy는 고정값 '사용자1'로 설정
      const finalCreatedBy = '사용자1';
      
      console.log('=== 데이터 검증 결과 ===');
      console.log('사용자 선택 계약 유형:', contractType);
      console.log('계약 유형 매핑:', {
        'purchase': '구매계약',
        'service': '용역계약', 
        'change': '변경계약',
        'extension': '연장계약',
        'freeform': '자유양식'
      }[contractType]);
      console.log('작성자:', finalCreatedBy);
      console.log('formData.purpose:', formData.purpose);
      console.log('formData.budget:', formData.budget);
      console.log('hasPurpose:', !!formData.purpose);
      console.log('hasBudget:', !!formData.budget);
      console.log('전체 formData:', formData);
      
      // 편집 모드에서 저장할 때 데이터 구조 정규화
      let proposalData;
      
      if (isEditMode) {
        // 편집 모드: 데이터 구조 정규화
        proposalData = {
          // 필수 필드 (절대 null이 될 수 없음)
          contractType: contractType, // 사용자가 선택한 계약 유형
          createdBy: finalCreatedBy, // 로그인한 사용자 정보
          purpose: formData.purpose || '품의서',
          
          // 필수 필드
          basis: formData.basis, // 이미 검증됨
          budget: formData.budget, // 이미 검증됨
          accountSubject: formData.accountSubject, // 이미 검증됨
          
          // 선택 필드
          contractMethod: formData.contractMethod || '',
          requestDepartments: formData.requestDepartments || [],
          purchaseItems: formData.purchaseItems.map(item => ({
            ...item,
            costAllocation: item.costAllocation || { type: 'percentage', allocations: [] },
            requestDepartments: item.requestDepartments || []
          })),
          serviceItems: formData.serviceItems || [],
          suppliers: formData.suppliers || [],
          changeReason: formData.changeReason || '',
          extensionReason: formData.extensionReason || '',
          beforeItems: formData.beforeItems || [],
          afterItems: formData.afterItems || [],
          contractPeriod: formData.contractPeriod || '',
          paymentMethod: formData.paymentMethod || '',
          biddingType: formData.biddingType || '',
          qualificationRequirements: formData.qualificationRequirements || '',
          evaluationCriteria: formData.evaluationCriteria || '',
          priceComparison: formData.priceComparison || [],
          totalAmount: totalAmount || 0,
          approvalLine: approvalLine || [],
          isDraft: false
        };
        
        console.log('편집 모드 - proposalData 구성 완료:', {
          contractType: proposalData.contractType,
          createdBy: proposalData.createdBy,
          purpose: proposalData.purpose,
          hasTotalAmount: !!proposalData.totalAmount
        });
      } else {
        // 새로 작성: 완전히 새로운 객체 생성
        proposalData = {
          // 필수 필드 (절대 null이 될 수 없음)
          contractType: contractType, // 사용자가 선택한 계약 유형
          createdBy: finalCreatedBy, // 로그인한 사용자 정보
          purpose: formData.purpose || '품의서',
          
          // 필수 필드
          basis: formData.basis, // 이미 검증됨
          budget: formData.budget, // 이미 검증됨
          accountSubject: formData.accountSubject, // 이미 검증됨
          
          // 선택 필드
          contractMethod: formData.contractMethod || '',
          requestDepartments: formData.requestDepartments || [],
          purchaseItems: formData.purchaseItems.map(item => ({
            ...item,
            costAllocation: item.costAllocation || { type: 'percentage', allocations: [] },
            requestDepartments: item.requestDepartments || []
          })),
          serviceItems: formData.serviceItems || [],
          suppliers: formData.suppliers || [],
          changeReason: formData.changeReason || '',
          extensionReason: formData.extensionReason || '',
          beforeItems: formData.beforeItems || [],
          afterItems: formData.afterItems || [],
          contractPeriod: formData.contractPeriod || '',
          paymentMethod: formData.paymentMethod || '',
          biddingType: formData.biddingType || '',
          qualificationRequirements: formData.qualificationRequirements || '',
          evaluationCriteria: formData.evaluationCriteria || '',
          priceComparison: formData.priceComparison || [],
          totalAmount: totalAmount || 0,
          approvalLine: approvalLine || [],
          isDraft: false
        };
        
        console.log('새로 작성 모드 - proposalData 구성 완료:', {
          contractType: proposalData.contractType,
          createdBy: proposalData.createdBy,
          purpose: proposalData.purpose,
          hasTotalAmount: !!proposalData.totalAmount
        });
      }

      console.log('proposalData:', proposalData);
      
      // 최종 데이터 검증
      if (!proposalData.contractType) {
        throw new Error('계약 유형이 설정되지 않았습니다.');
      }
      
      if (!proposalData.createdBy) {
        throw new Error('작성자 정보가 설정되지 않았습니다.');
      }
      
      if (!proposalData.purpose) {
        throw new Error('품의서 목적이 입력되지 않았습니다.');
      }
      
      console.log('데이터 검증 완료 - API 요청 준비됨');
      
      // 구매품목별 비용분배 정보 수집 (handleDraftSave와 동일한 로직)
      const purchaseItemCostAllocations = [];
      console.log('=== 작성완료 시 비용분배 정보 수집 ===');
      console.log('전체 구매품목 수:', formData.purchaseItems.length);
      
      formData.purchaseItems.forEach((item, itemIndex) => {
        console.log(`구매품목 ${itemIndex + 1} (${item.item}) 비용분배 정보:`, {
          hasCostAllocation: !!item.costAllocation,
          costAllocationData: item.costAllocation,
          allocationsCount: item.costAllocation?.allocations?.length || 0
        });
        
        // 비용분배 정보가 있는 경우에만 수집
        if (item.costAllocation && item.costAllocation.allocations && item.costAllocation.allocations.length > 0) {
          item.costAllocation.allocations.forEach((alloc, allocIndex) => {
            // 유효성 검사 추가
            if (alloc && alloc.department && (alloc.value || alloc.value === 0)) {
              const allocationData = {
                itemIndex,
                allocationIndex: allocIndex,
                department: alloc.department,
                type: alloc.type || 'percentage',
                value: alloc.value,
                amount: alloc.type === 'percentage' ? (item.amount * (alloc.value / 100)) : alloc.value,
                // 추가 식별 정보
                itemName: item.item,
                productName: item.productName
              };
              purchaseItemCostAllocations.push(allocationData);
              console.log(`  할당 ${allocIndex + 1}:`, allocationData);
            } else {
              console.log(`  할당 ${allocIndex + 1} 유효하지 않음:`, alloc);
            }
          });
        } else {
          console.log(`  비용분배 정보 없음`);
        }
      });
      
      console.log('최종 수집된 비용분배 정보:', purchaseItemCostAllocations);
      
      // proposalData에 비용분배 정보 추가
      proposalData.purchaseItemCostAllocations = purchaseItemCostAllocations;
      
      // 최종 데이터 확인 및 로깅
      console.log('=== 최종 전송 데이터 ===');
      console.log('contractType:', proposalData.contractType);
      console.log('createdBy:', proposalData.createdBy);
      console.log('purpose:', proposalData.purpose);
      console.log('전체 데이터:', JSON.stringify(proposalData, null, 2));
      
      // 필수 필드 재확인 및 강제 설정
      if (!proposalData.contractType) {
        console.log('⚠️ contractType 누락, 강제 설정');
        proposalData.contractType = 'purchase';
      }
      
      if (!proposalData.createdBy) {
        console.log('⚠️ createdBy 누락, 강제 설정');
        proposalData.createdBy = '사용자1';
      }
      
      if (!proposalData.purpose) {
        console.log('⚠️ purpose 누락, 강제 설정');
        proposalData.purpose = '품의서';
      }
      
      // 최종 확인
      console.log('=== 강제 설정 후 최종 데이터 ===');
      console.log('contractType:', proposalData.contractType);
      console.log('createdBy:', proposalData.createdBy);
      console.log('purpose:', proposalData.purpose);
      
      if (!proposalData.contractType || !proposalData.createdBy || !proposalData.purpose) {
        throw new Error(`필수 필드 설정 실패: contractType=${proposalData.contractType}, createdBy=${proposalData.createdBy}, purpose=${proposalData.purpose}`);
      }

      // API 요청 직전 최종 데이터 확인 (필수 필드 검증)
      const finalProposalData = {
        ...proposalData
      };
      
      console.log('\n🚀🚀🚀 === API 요청 직전 최종 데이터 (상세) === 🚀🚀🚀');
      console.log('전체 데이터:', JSON.stringify(finalProposalData, null, 2));
      console.log('contractType:', finalProposalData.contractType, '타입:', typeof finalProposalData.contractType);
      console.log('createdBy:', finalProposalData.createdBy, '타입:', typeof finalProposalData.createdBy);
      console.log('purpose:', finalProposalData.purpose, '타입:', typeof finalProposalData.purpose);
      console.log('budget:', finalProposalData.budget, '타입:', typeof finalProposalData.budget);
      console.log('accountSubject:', finalProposalData.accountSubject, '타입:', typeof finalProposalData.accountSubject);
      console.log('basis:', finalProposalData.basis, '타입:', typeof finalProposalData.basis);
      
      // 최종 검증
      if (!finalProposalData.contractType) {
        throw new Error('계약 유형이 설정되지 않았습니다.');
      }
      if (!finalProposalData.createdBy) {
        throw new Error('작성자 정보가 설정되지 않았습니다.');
      }
      if (!finalProposalData.purpose) {
        throw new Error('품의서 목적이 설정되지 않았습니다.');
      }

      const url = isEditMode 
        ? `${API_BASE_URL}/api/proposals/${editingProposalId}`
        : `${API_BASE_URL}/api/proposals`;
      
      const method = isEditMode ? 'PUT' : 'POST';

      console.log('요청 URL:', url);
      console.log('요청 메서드:', method);

      console.log('API 요청 시작:', { url, method, finalProposalData });
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(finalProposalData)
      });

      console.log('API 응답 상태:', response.status, response.statusText);
      
      // 응답 텍스트를 먼저 확인
      const responseText = await response.text();
      console.log('API 응답 텍스트:', responseText);
      
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON 파싱 오류:', parseError);
        console.error('응답 텍스트:', responseText);
        throw new Error(`서버 응답을 파싱할 수 없습니다: ${responseText.substring(0, 100)}...`);
      }
      
      if (response.ok) {
        const result = responseData;
        const proposalId = isEditMode ? editingProposalId : result.proposalId;
        
        // 편집 모드에서 성공 시 localStorage 정리
        if (isEditMode) {
          try {
            localStorage.removeItem('editingDraft');
            console.log('편집 모드 완료 - localStorage 정리됨');
          } catch (localStorageError) {
            console.warn('localStorage 정리 실패:', localStorageError);
          }
        }
        
        // 품의서 상태를 "제출완료"로 업데이트
        try {
          const statusResponse = await fetch(`${API_BASE_URL}/api/proposals/${proposalId}/status`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: 'submitted' })
          });

          if (statusResponse.ok) {
            const message = isEditMode 
              ? `품의서가 성공적으로 수정되고 제출완료되었습니다! (ID: ${proposalId})`
              : `품의서가 성공적으로 작성되고 제출완료되었습니다! (ID: ${proposalId})`;
            alert(message);
            
            // 편집 모드 완료 후 편집 상태 초기화
            if (isEditMode) {
              setIsEditMode(false);
              setEditingProposalId(null);
              setProposalId(null);
            }
            
            // 새로 작성된 품의서 정보를 localStorage에 저장하여 리스트에서 즉시 표시
            const newProposalData = {
              id: proposalId,
              title: formData.purpose || '품의서',
              department: formData.requestDepartments?.[0] || '미지정',
              contractor: formData.purchaseItems?.[0]?.supplier || formData.serviceItems?.[0]?.supplier || '미지정',
              author: '작성자',
              amount: calculateTotalAmount() || 0,
              status: '제출완료',
              startDate: new Date().toISOString().split('T')[0],
              endDate: formData.contractPeriod || '',
              contractType: formData.contractType === 'purchase' ? '구매계약' :
                           formData.contractType === 'service' ? '용역계약' :
                           formData.contractType === 'change' ? '변경계약' :
                           formData.contractType === 'extension' ? '연장계약' :
                           formData.contractType === 'freeform' ? '자유양식' : '기타',
              purpose: formData.purpose || '',
              basis: formData.basis || '',
              budget: formData.budgetInfo?.projectName || formData.budgetId || '',
              contractMethod: formData.contractMethod || '',
              accountSubject: formData.accountSubject || '',
              contractPeriod: formData.contractPeriod || '',
              paymentMethod: formData.paymentMethod || '',
              requestDepartments: formData.requestDepartments || [],
              approvalLines: formData.approvalLines || [],
              createdAt: new Date().toISOString().split('T')[0],
              updatedAt: new Date().toISOString().split('T')[0],
              purchaseItems: formData.purchaseItems || [],
              serviceItems: formData.serviceItems || [],
              costDepartments: formData.costDepartments || [],
              items: formData.purchaseItems?.map(item => ({
                item: item.item,
                productName: item.productName,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                supplier: item.supplier
              })) || formData.serviceItems?.map(item => ({
                item: item.item,
                personnel: item.personnel,
                techLevel: item.skillLevel,
                duration: item.period,
                monthlyPrice: item.monthlyRate,
                supplier: item.supplier
              })) || [],
              displayCostDepartments: formData.costDepartments?.map(dept => ({
                department: dept.department,
                percentage: dept.ratio,
                amount: dept.amount
              })) || []
            };
            
            // 새로 작성된 품의서 정보를 localStorage에 저장
            localStorage.setItem('newProposal', JSON.stringify(newProposalData));
            
                        // 작성완료된 품의서는 품의서 조회 화면으로 이동
            console.log('🚀 다른 네비게이션 경로: /contract-list');
            navigate('/contract-list', { 
              state: { 
                refreshList: true, 
                newProposalId: proposalId, 
                message: isEditMode ? '품의서가 성공적으로 수정되었습니다!' : '품의서가 성공적으로 작성되었습니다!' 
              } 
            });
            console.log('✅ 다른 네비게이션 완료: /contract-list');
          } else {
            const statusError = await statusResponse.json();
            alert(`품의서 작성은 성공했지만 상태 업데이트에 실패했습니다: ${statusError.error}`);
            navigate('/draft-list');
          }
        } catch (statusError) {
          console.error('상태 업데이트 실패:', statusError);
          alert(`품의서 작성은 성공했지만 상태 업데이트에 실패했습니다.`);
          navigate('/draft-list');
        }
      } else {
        const error = responseData;
        console.error('API 오류 응답:', error);
        
        // 편집 모드에서 발생하는 구체적인 오류 처리
        let errorMessage;
        if (isEditMode) {
          if (error.error && error.error.includes('not found')) {
            errorMessage = '편집하려는 품의서를 찾을 수 없습니다. 다시 시도해주세요.';
          } else if (error.error && error.error.includes('validation')) {
            errorMessage = '입력 데이터가 올바르지 않습니다. 모든 필수 항목을 확인해주세요.';
          } else {
            errorMessage = `품의서 수정 실패: ${error.error || '알 수 없는 오류'}`;
          }
        } else {
          errorMessage = `품의서 작성 실패: ${error.error || '알 수 없는 오류'}`;
        }
        
        alert(errorMessage);
      }
    } catch (error) {
      console.error('품의서 처리 실패:', error);
      console.error('오류 상세 정보:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      // 사용자 친화적인 에러 메시지
      let errorMessage = isEditMode 
        ? '품의서 수정에 실패했습니다.'
        : '품의서 작성에 실패했습니다.';
      
      if (error.message.includes('계약 유형')) {
        errorMessage += ' 계약 유형을 선택해주세요.';
      } else if (error.message.includes('작성자')) {
        errorMessage += ' 작성자 정보가 누락되었습니다.';
      } else if (error.message.includes('목적')) {
        errorMessage += ' 품의서 목적을 입력해주세요.';
      } else if (error.message.includes('notNull Violation')) {
        errorMessage += ' 필수 정보가 누락되었습니다. 모든 필드를 확인해주세요.';
      } else if (error.message.includes('서버 응답을 파싱할 수 없습니다')) {
        errorMessage += ' 서버 응답 오류가 발생했습니다.';
      } else {
        errorMessage += ' 서버가 실행 중인지 확인해주세요.';
      }
      
      alert(errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <h2>데이터를 불러오는 중...</h2>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="proposal-form">
      <div className="proposal-header">
        <h1>{isEditMode ? '품의서 수정' : '품의서 작성'}</h1>
        {proposalId && (
          <div className="proposal-id">
            <span className="id-label">품의서 ID:</span>
            <span className="id-value">{proposalId}</span>
          </div>
        )}
      </div>
      
      {/* 계약 유형 선택 */}
      <div className="contract-type-selection">
        <h2>계약 유형 선택</h2>
        <div className="type-buttons">
          <button
            className={`type-btn ${contractType === 'purchase' ? 'active' : ''}`}
            onClick={() => changeContractType('purchase')}
          >
            신규 계약
          </button>
          <button
            className={`type-btn ${contractType === 'change' ? 'active' : ''}`}
            onClick={() => changeContractType('change')}
          >
            변경 계약
          </button>
          <button
            className={`type-btn ${contractType === 'extension' ? 'active' : ''}`}
            onClick={() => changeContractType('extension')}
          >
            연장 계약
          </button>
          <button
            className={`type-btn ${contractType === 'service' ? 'active' : ''}`}
            onClick={() => changeContractType('service')}
          >
            용역 계약
          </button>

          <button
            className={`type-btn ${contractType === 'freeform' ? 'active' : ''}`}
            onClick={() => changeContractType('freeform')}
            style={{
              border: contractType === 'freeform' ? '2px solid #3b82f6' : '2px solid #e1e5e9',
              backgroundColor: contractType === 'freeform' ? '#3b82f6' : 'white',
              color: contractType === 'freeform' ? 'white' : '#333'
            }}
          >
            📝 자유양식
          </button>
        </div>
      </div>

      {contractType && (
        <form onSubmit={handleSubmit}>
          {/* 공통 항목 */}
          <div className="form-section">
            <h3>공통 정보</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label>제목</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prevData => ({...prevData, title: e.target.value}))}
                  placeholder="품의서 제목을 입력하세요"
                  required
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>사업 목적</label>
                <textarea
                  value={formData.purpose}
                  onChange={(e) => setFormData(prevData => ({...prevData, purpose: e.target.value}))}
                  placeholder="사업 목적을 입력하세요"
                  required
                  rows={3}
                  style={{ resize: 'vertical', minHeight: '70px' }}
                />
              </div>

              <div className="form-group">
                <label>근거</label>
                <textarea
                  value={formData.basis}
                  onChange={(e) => setFormData(prevData => ({...prevData, basis: e.target.value}))}
                  placeholder="계약 근거를 입력하세요"
                  required
                  rows={2}
                  style={{ resize: 'vertical', minHeight: '60px' }}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>사업예산</label>
                <div className="budget-selector">
                  <button 
                    type="button" 
                    className="budget-select-btn"
                    onClick={openBudgetPopup}
                  >
                    {formData.budget ? 
                      (() => {
                        const selectedBudget = businessBudgets.find(b => b.id === formData.budget);
                        return selectedBudget ? 
                          `${selectedBudget.project_name} (${selectedBudget.budget_year}년) - ${selectedBudget.budget_type}` :
                          '사업예산을 선택하세요';
                      })() :
                      '사업예산을 선택하세요'
                    }
                  </button>
                  {formData.budget && (
                    <div className="budget-info">
                      {(() => {
                        const selectedBudget = businessBudgets.find(b => b.id === formData.budget);
                        if (selectedBudget) {
                          const remainingAmount = (selectedBudget.budget_amount || 0) - (selectedBudget.executed_amount || 0);
                          return (
                            <>
                              <span>선택된 예산: {selectedBudget.project_name}</span>
                              <span>예산총액: {formatCurrency(selectedBudget.budget_amount || 0)}</span>
                              <span>사용금액: {formatCurrency(selectedBudget.executed_amount || 0)}</span>
                              <span>잔여예산: {formatCurrency(remainingAmount)}</span>
                            </>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>계약방식</label>
                <select
                  value={formData.contractMethod}
                  onChange={(e) => setFormData({...formData, contractMethod: e.target.value})}
                  required
                >
                  <option value="">계약방식을 선택하세요</option>
                  {contractMethods.map(method => (
                    <option key={method.value} value={method.value}>
                      {method.name}
                    </option>
                  ))}
                </select>
                {formData.contractMethod && (
                  <div className="regulation-info">
                    <span>사내규정: {contractMethods.find(m => m.value === formData.contractMethod)?.regulation}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>기타</label>
                <textarea
                  value={formData.other || ''}
                  onChange={(e) => setFormData(prevData => ({...prevData, other: e.target.value}))}
                  placeholder="기타 사항을 입력하세요"
                  rows={2}
                  style={{ resize: 'vertical', minHeight: '60px' }}
                />
              </div>

              <div className="form-group">
                <label>요청부서 (다중선택 가능)</label>
                <div className="department-selector">
                  <button 
                    type="button" 
                    className="department-select-btn"
                    onClick={openDepartmentDropdown}
                  >
                    부서를 선택하세요 ({formData.requestDepartments.length}개 선택됨)
                  </button>
                  
                  {/* 선택된 부서 목록 */}
                  {formData.requestDepartments.length > 0 && (
                    <div className="selected-departments">
                      {formData.requestDepartments.map((dept, index) => {
                        const deptName = typeof dept === 'string' ? dept : dept.name || dept;
                        return (
                          <div key={index} className="selected-department-tag">
                            <span>{deptName}</span>
                            <button 
                              type="button" 
                              className="remove-department-btn"
                              onClick={() => removeDepartment(deptName)}
                            >
                              ✕
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 계약별 특화 입력 */}
          {contractType === 'purchase' && (
            <div className="form-section purchase-items-section">
              <div className="section-header">
                <h3>🛍️ 신규품목</h3>
                <button type="button" onClick={addPurchaseItem} className="add-item-btn">
                  <span className="btn-icon">+</span>
                  <span className="btn-text">신규품목 추가</span>
                </button>
              </div>
              
              {/* 신규품목 테이블 */}
              <div className="purchase-items-table-container">
                <table className="purchase-items-table">
                  <thead>
                    <tr>
                                      <th>구분</th>
                <th>내역</th>
                      <th>수량</th>
                      <th>단가</th>
                      <th>금액</th>
                      <th>공급업체</th>
                      <th>계약기간</th>
                      <th>작업</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(formData.purchaseItems || []).map((item, index) => (
                      <tr key={item.id} className="purchase-item-row">
                        {/* 구분 */}
                        <td>
                          <select
                            value={item.item || ''}
                            onChange={(e) => {
                              setFormData(prevData => {
                                const updated = [...prevData.purchaseItems];
                                updated[index].item = e.target.value;
                                return {
                                  ...prevData,
                                  purchaseItems: updated
                                };
                              });
                              
                              // 구분 변경 시 해당 행의 내역 추천 새로고침
                              if (currentSuggestionField === 'productName' && currentSuggestionIndex === index) {
                                const currentProductName = formData.purchaseItems[index]?.productName || '';
                                if (currentProductName.trim()) {
                                  setTimeout(() => {
                                    fetchPurchaseHistory(currentProductName, 'productName', e.target.value);
                                  }, 100);
                                }
                              }
                            }}
                            required
                            style={{
                              width: '100%',
                              padding: '6px 8px',
                              border: '1px solid #d1d5db',
                              borderRadius: '4px',
                              fontSize: '13px',
                              backgroundColor: 'white'
                            }}
                          >
                            <option value="">구분 선택</option>
                            <option value="소프트웨어">소프트웨어</option>
                            <option value="전산기구비품">전산기구비품</option>
                            <option value="전산수선">전산수선</option>
                            <option value="전산설치">전산설치</option>
                            <option value="전산소모품">전산소모품</option>
                            <option value="전산용역">전산용역</option>
                            <option value="전산임차">전산임차</option>
                            <option value="전산회선">전산회선</option>
                            <option value="전신전화">전신전화</option>
                            <option value="증권전산운용">증권전산운용</option>
                            <option value="보험비">보험비</option>
                            <option value="일반업무수수료">일반업무수수료</option>
                            <option value="통신정보료">통신정보료</option>
                            <option value="회비및공과금">회비및공과금</option>
                          </select>
                        </td>
                        
                        {/* 내역 */}
                        <td>
                          <div className="input-with-suggestions">
                            <input
                              type="text"
                              value={item.productName}
                              onChange={(e) => {
                                setFormData(prevData => {
                                  const updated = [...prevData.purchaseItems];
                                  updated[index].productName = e.target.value;
                                  return {
                                    ...prevData,
                                    purchaseItems: updated
                                  };
                                });
                                debouncedSearch(e.target.value, 'productName', index);
                              }}
                              onFocus={() => handleInputFocus('productName', index, item.productName)}
                              onBlur={handleInputBlur}
                              placeholder="내역"
                              required
                            />
                            {showProductSuggestions && currentSuggestionField === 'productName' && currentSuggestionIndex === index && purchaseHistory.length > 0 && (
                              <div className="suggestions-dropdown">
                                {purchaseHistory.map((history, idx) => (
                                  <div 
                                    key={idx} 
                                    className="suggestion-item"
                                    onClick={() => selectSuggestion('productName', history.product_name, index)}
                                  >
                                    <div className="suggestion-main">{history.product_name}</div>
                                    <div className="suggestion-details">
                                      구매횟수: {history.frequency}회 | 평균단가: {formatCurrency(history.avg_unit_price)}
                                      {history.contract_type && (
                                        <span className="contract-type">
                                          | 계약유형: {history.contract_type}
                                        </span>
                                      )}
                                      {history.proposal_total_amount && (
                                        <span className="proposal-amount">
                                          | 품의서금액: {formatCurrency(history.proposal_total_amount)}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                        
                        {/* 수량 */}
                        <td>
                          <input
                            type="number"
                            className="quantity-input"
                            value={item.quantity}
                            onChange={(e) => {
                              setFormData(prevData => {
                                const updated = [...prevData.purchaseItems];
                                updated[index].quantity = Number(e.target.value);
                                updated[index].amount = updated[index].quantity * updated[index].unitPrice;
                                return {
                                  ...prevData,
                                  purchaseItems: updated
                                };
                              });
                            }}
                            placeholder="수량"
                            required
                          />
                        </td>
                        
                        {/* 단가 */}
                        <td>
                          <input
                            type="text"
                            value={formatNumberWithComma(item.unitPrice)}
                            onChange={(e) => {
                              setFormData(prevData => {
                                const updated = [...prevData.purchaseItems];
                                const unitPrice = removeComma(e.target.value);
                                updated[index].unitPrice = unitPrice;
                                updated[index].amount = updated[index].quantity * unitPrice;
                                return {
                                  ...prevData,
                                  purchaseItems: updated
                                };
                              });
                            }}
                            placeholder="단가"
                            required
                          />
                        </td>
                        
                        {/* 금액 */}
                        <td>
                          <input
                            type="text"
                            value={formatNumberWithComma(item.amount)}
                            readOnly
                            className="amount-field"
                          />
                        </td>
                        
                        {/* 공급업체 */}
                        <td>
                          <div className="input-with-suggestions">
                            <input
                              type="text"
                              value={item.supplier}
                              onChange={(e) => {
                                setFormData(prevData => {
                                  const updated = [...prevData.purchaseItems];
                                  updated[index].supplier = e.target.value;
                                  return {
                                    ...prevData,
                                    purchaseItems: updated
                                  };
                                });
                                debouncedSearch(e.target.value, 'supplier', index);
                              }}
                              onFocus={() => handleInputFocus('supplier', index, item.supplier)}
                              onBlur={handleInputBlur}
                              placeholder="공급업체"
                              required
                            />
                            {showSupplierSuggestions && currentSuggestionField === 'supplier' && currentSuggestionIndex === index && purchaseHistory.length > 0 && (
                              <div className="suggestions-dropdown">
                                {purchaseHistory.map((history, idx) => (
                                  <div 
                                    key={idx} 
                                    className="suggestion-item"
                                    onClick={() => selectSuggestion('supplier', history.supplier, index)}
                                  >
                                    <div className="suggestion-main">{history.supplier}</div>
                                    <div className="suggestion-details">
                                      구매횟수: {history.frequency}회 | 평균단가: {formatCurrency(history.avg_unit_price)}
                                      {history.contract_type && (
                                        <span className="contract-type">
                                          | 계약유형: {history.contract_type}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                        
                        {/* 계약기간 */}
                        <td>
                          <div className="contract-period-selector">
                            <select
                              value={item.contractPeriodType || '1year'}
                              onChange={(e) => {
                                const newType = e.target.value;
                                setFormData(prevData => {
                                  const updated = [...prevData.purchaseItems];
                                  updated[index].contractPeriodType = newType;
                                  if (newType !== 'custom') {
                                    updated[index].contractStartDate = '';
                                    updated[index].contractEndDate = '';
                                  }
                                  return {
                                    ...prevData,
                                    purchaseItems: updated
                                  };
                                });
                              }}
                              className="contract-period-select"
                            >
                              <option value="1month">1개월</option>
                              <option value="3months">3개월</option>
                              <option value="6months">6개월</option>
                              <option value="1year">1년</option>
                              <option value="2years">2년</option>
                              <option value="3years">3년</option>
                              <option value="permanent">영구</option>
                              <option value="custom">직접입력</option>
                            </select>
                            
                            {item.contractPeriodType === 'custom' && (
                              <div className="contract-date-inputs">
                                <div className="date-input-group">
                                  <label className="date-label">시작일:</label>
                                  <input
                                    type="date"
                                    value={item.contractStartDate || ''}
                                    onChange={(e) => {
                                      setFormData(prevData => {
                                        const updated = [...prevData.purchaseItems];
                                        updated[index].contractStartDate = e.target.value;
                                        return {
                                          ...prevData,
                                          purchaseItems: updated
                                        };
                                      });
                                    }}
                                    className="contract-date-input"
                                  />
                                </div>
                                <div className="date-input-group">
                                  <label className="date-label">종료일:</label>
                                  <input
                                    type="date"
                                    value={item.contractEndDate || ''}
                                    onChange={(e) => {
                                      setFormData(prevData => {
                                        const updated = [...prevData.purchaseItems];
                                        updated[index].contractEndDate = e.target.value;
                                        return {
                                          ...prevData,
                                          purchaseItems: updated
                                        };
                                      });
                                    }}
                                    className="contract-date-input"
                                    min={item.contractStartDate || undefined}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                        
                        {/* 작업 */}
                        <td>
                          <button 
                            type="button" 
                            className="remove-btn"
                            onClick={() => removePurchaseItem(index)}
                            title="품목 제거"
                          >
                            X
                          </button>
                        </td>
                      </tr>
                      
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 비용귀속부서 분배 섹션 - 각 품목별로 표시 */}
              <div className="cost-allocations-container">
                {(formData.purchaseItems || []).map((item, index) => (
                  <div key={`allocation-${item.id}`} className="cost-allocation-section">
                    <div className="allocation-header">
                      <h4>"{item.productName}" 비용귀속부서 분배</h4>
                      <button 
                        type="button" 
                        className="add-allocation-btn"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          e.nativeEvent.stopImmediatePropagation();
                          
                          // 중복 클릭 방지
                          if (e.target.disabled) {
                            console.log(`🚨 분배 추가 버튼 이미 비활성화됨`);
                            return;
                          }
                          
                          // 버튼 비활성화
                          e.target.disabled = true;
                          e.target.textContent = '추가 중...';
                          
                          console.log(`🚨 분배 추가 버튼 클릭: 구매품목 ${index}`);
                          
                          // 비동기로 실행하여 중복 호출 방지
                          setTimeout(() => {
                            addCostAllocation(index);
                            
                            // 버튼 복원
                            e.target.disabled = false;
                            e.target.textContent = '+ 분배 추가';
                          }, 100);
                        }}
                      >
                        + 분배 추가
                      </button>
                    </div>
                    
                    {/* 비용분배 통합 테이블 */}
                    {(() => {
                      const allocations = item.costAllocation?.allocations || [];
                      
                      if (allocations.length === 0) {
                        return (
                          <div className="allocation-item">
                            <div style={{ 
                              textAlign: 'center', 
                              color: '#666', 
                              padding: '2rem',
                              fontStyle: 'italic'
                            }}>
                              이 품목에 대한 비용분배가 설정되지 않았습니다.<br/>
                              위의 "분배 추가" 버튼을 클릭하여 부서별 분배를 추가하세요.
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div className="allocation-item">
                          <table style={{ 
                            width: '100%', 
                            borderCollapse: 'collapse',
                            marginTop: '1rem'
                          }}>
                            <thead>
                              <tr style={{ backgroundColor: '#f8f9fa' }}>
                                <th style={{ 
                                  padding: '0.75rem', 
                                  border: '1px solid #dee2e6',
                                  textAlign: 'left',
                                  fontWeight: '600',
                                  fontSize: '0.9rem'
                                }}>
                                  귀속부서
                                </th>
                                <th style={{ 
                                  padding: '0.75rem', 
                                  border: '1px solid #dee2e6',
                                  textAlign: 'center',
                                  fontWeight: '600',
                                  fontSize: '0.9rem'
                                }}>
                                  분배방식
                                </th>
                                <th style={{ 
                                  padding: '0.75rem', 
                                  border: '1px solid #dee2e6',
                                  textAlign: 'center',
                                  fontWeight: '600',
                                  fontSize: '0.9rem'
                                }}>
                                  분배값
                                </th>
                                <th style={{ 
                                  padding: '0.75rem', 
                                  border: '1px solid #dee2e6',
                                  textAlign: 'right',
                                  fontWeight: '600',
                                  fontSize: '0.9rem'
                                }}>
                                  분배금액
                                </th>
                                <th style={{ 
                                  padding: '0.75rem', 
                                  border: '1px solid #dee2e6',
                                  textAlign: 'center',
                                  fontWeight: '600',
                                  fontSize: '0.9rem',
                                  width: '80px'
                                }}>
                                  작업
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {allocations.map((allocation, allocIndex) => (
                                <tr key={allocation.id} style={{ 
                                  borderBottom: '1px solid #dee2e6',
                                  '&:hover': { backgroundColor: '#f8f9fa' }
                                }}>
                                  <td style={{ 
                                    padding: '0.75rem', 
                                    border: '1px solid #dee2e6'
                                  }}>
                                    <select
                                      value={allocation.department || ''}
                                      onChange={(e) => updateCostAllocation(index, allocIndex, 'department', e.target.value)}
                                      required
                                      style={{ 
                                        width: '100%',
                                        padding: '0.5rem',
                                        border: '1px solid #ced4da',
                                        borderRadius: '4px',
                                        fontSize: '0.9rem'
                                      }}
                                    >
                                      <option value="">부서 선택</option>
                                      {departments && departments.length > 0 ? (
                                        departments.map(dept => (
                                          <option key={dept.id} value={dept.name}>
                                            {dept.name}
                                          </option>
                                        ))
                                      ) : (
                                        <option value="" disabled>부서 데이터 로딩 중...</option>
                                      )}
                                    </select>
                                  </td>
                                  <td style={{ 
                                    padding: '0.75rem', 
                                    border: '1px solid #dee2e6',
                                    textAlign: 'center'
                                  }}>
                                    <select
                                      value={allocation.type || 'percentage'}
                                      onChange={(e) => updateCostAllocation(index, allocIndex, 'type', e.target.value)}
                                      required
                                      style={{ 
                                        width: '100%',
                                        padding: '0.5rem',
                                        border: '1px solid #ced4da',
                                        borderRadius: '4px',
                                        fontSize: '0.9rem'
                                      }}
                                    >
                                      <option value="percentage">정률 (%)</option>
                                      <option value="fixed">정액 (원)</option>
                                    </select>
                                  </td>
                                  <td style={{ 
                                    padding: '0.75rem', 
                                    border: '1px solid #dee2e6',
                                    textAlign: 'center'
                                  }}>
                                    <input
                                      type="number"
                                      value={allocation.value || 0}
                                      onChange={(e) => updateCostAllocation(index, allocIndex, 'value', Number(e.target.value))}
                                      placeholder={allocation.type === 'percentage' ? '%' : '원'}
                                      required
                                      style={{ 
                                        width: '100%',
                                        padding: '0.5rem',
                                        border: '1px solid #ced4da',
                                        borderRadius: '4px',
                                        fontSize: '0.9rem',
                                        textAlign: 'center'
                                      }}
                                    />
                                  </td>
                                  <td style={{ 
                                    padding: '0.75rem', 
                                    border: '1px solid #dee2e6',
                                    textAlign: 'right',
                                    fontWeight: '600',
                                    color: '#28a745'
                                  }}>
                                    {formatNumberWithComma(
                                      allocation.type === 'percentage' 
                                        ? (item.amount * (allocation.value / 100))
                                        : allocation.value
                                    )}원
                                  </td>
                                  <td style={{ 
                                    padding: '0.75rem', 
                                    border: '1px solid #dee2e6',
                                    textAlign: 'center'
                                  }}>
                                    <button 
                                      type="button" 
                                      onClick={() => removeCostAllocation(index, allocIndex)}
                                      title="분배 제거"
                                      style={{
                                        background: '#dc3545',
                                        color: 'white',
                                        border: 'none',
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '0.8rem',
                                        fontWeight: '600'
                                      }}
                                    >
                                      삭제
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr style={{ backgroundColor: '#e9ecef', fontWeight: '600' }}>
                                <td colSpan="3" style={{ 
                                  padding: '0.75rem', 
                                  border: '1px solid #dee2e6',
                                  textAlign: 'right'
                                }}>
                                  합계:
                                </td>
                                <td style={{ 
                                  padding: '0.75rem', 
                                  border: '1px solid #dee2e6',
                                  textAlign: 'right',
                                  fontWeight: '700',
                                  color: '#dc3545'
                                }}>
                                  {(() => {
                                    const total = allocations.reduce((sum, allocation) => {
                                      return sum + (allocation.type === 'percentage' 
                                        ? (item.amount * (allocation.value / 100))
                                        : allocation.value);
                                    }, 0);
                                    return formatNumberWithComma(total) + '원';
                                  })()}
                                </td>
                                <td style={{ 
                                  padding: '0.75rem', 
                                  border: '1px solid #dee2e6',
                                  textAlign: 'center'
                                }}>
                                  {(() => {
                                    const totalPercentage = allocations
                                      .filter(a => a.type === 'percentage')
                                      .reduce((sum, a) => sum + (a.value || 0), 0);
                                    const totalFixed = allocations
                                      .filter(a => a.type === 'fixed')
                                      .reduce((sum, a) => sum + (a.value || 0), 0);
                                    
                                    const isValid = (totalPercentage === 100 && totalFixed === 0) || 
                                                   (totalFixed === item.amount && totalPercentage === 0);
                                    
                                    return (
                                      <span style={{ 
                                        color: isValid ? '#28a745' : '#ffc107',
                                        fontSize: '0.8rem'
                                      }}>
                                        {isValid ? '✓ 완료' : '⚠ 확인필요'}
                                      </span>
                                    );
                                  })()}
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      );
                    })()}
                  </div>
                ))}
              </div>

              {/* 계정과목 섹션 - 통합 표시 */}
              {(() => {
                const itemsWithAccount = (formData.purchaseItems || []).filter(item => {
                  const accountSubject = getAccountSubjectByCategory(item.item);
                  return accountSubject && item.item;
                });
                
                if (itemsWithAccount.length === 0) {
                  return null;
                }
                
                return (
                  <div className="account-subjects-container">
                    <div className="account-subject-section">
                      <div className="account-header">
                        <h4>📊 계정과목</h4>
                      </div>
                      
                      <div className="account-list">
                        {itemsWithAccount.map((item, index) => {
                          const accountSubject = getAccountSubjectByCategory(item.item);
                          
                          return (
                            <div key={`account-${item.id}`} className="account-item">
                              <div className="item-name">{item.productName || item.item}</div>
                              <div className="account-path">
                                <span className="path-item">
                                  <span className="path-label">관:</span>
                                  <span className="path-value">{accountSubject.관}</span>
                                </span>
                                <span className="path-separator">&gt;</span>
                                <span className="path-item">
                                  <span className="path-label">항:</span>
                                  <span className="path-value">{accountSubject.항}</span>
                                </span>
                                <span className="path-separator">&gt;</span>
                                <span className="path-item">
                                  <span className="path-label">목:</span>
                                  <span className="path-value">{accountSubject.목}</span>
                                </span>
                                {accountSubject.절 && (
                                  <>
                                    <span className="path-separator">&gt;</span>
                                    <span className="path-item">
                                      <span className="path-label">절:</span>
                                      <span className="path-value">{accountSubject.절}</span>
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })()}
              
              {/* 총 신규금액 */}
              <div className="total-amount-center">
                <h4>총 신규금액: {formatCurrency(calculateTotalAmount())}</h4>
              </div>

              {/* 자동 합산 내역 섹션 */}
              {(() => {
                const totalAllocation = calculateTotalCostAllocation();
                const hasAllocations = Object.keys(totalAllocation).length > 0;
                
                if (hasAllocations) {
                  return (
                    <div className="form-section auto-summary-section">
                      <h3>자동 합산 내역</h3>
                      <div className="auto-summary-content">
                        <div className="summary-table">
                          <div className="summary-header">
                            <div className="header-cell">부서</div>
                            <div className="header-cell">총 분배 금액</div>
                            <div className="header-cell">전체 대비 비율</div>
                          </div>
                          {Object.entries(totalAllocation).map(([department, data]) => (
                            <div key={department} className="summary-row">
                              <div className="summary-cell department-name">{department}</div>
                              <div className="summary-cell amount">{formatCurrency(data.amount)}</div>
                              <div className="summary-cell percentage">
                                {calculateTotalAmount() > 0 ? ((data.amount / calculateTotalAmount()) * 100).toFixed(1) : '0.0'}%
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="summary-footer">
                          <div className="summary-total">
                            <span>총 분배 금액: {formatCurrency(Object.values(totalAllocation).reduce((sum, data) => sum + data.amount, 0))}</span>
                            <span>전체 대비: {calculateTotalAmount() > 0 ? ((Object.values(totalAllocation).reduce((sum, data) => sum + data.amount, 0) / calculateTotalAmount()) * 100).toFixed(1) : '0.0'}%</span>
                          </div>
                          <div className="summary-status">
                            {(() => {
                              const totalDistributed = Object.values(totalAllocation).reduce((sum, data) => sum + data.amount, 0);
                              const totalAmount = calculateTotalAmount();
                              const isComplete = Math.abs(totalDistributed - totalAmount) < 0.01; // 1원 이하 차이는 완료로 간주
                              
                              console.log('🔍 분배 완료 검증:', {
                                totalDistributed,
                                totalAmount,
                                difference: Math.abs(totalDistributed - totalAmount),
                                isComplete
                              });
                              
                              return (
                                <span className={isComplete ? 'valid' : 'invalid'}>
                                  {isComplete ? '✓ 100% 분배 완료' : '✗ 100% 분배 미완료'}
                                </span>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          )}

          {contractType === 'service' && (
            <div className="form-section">
              <h3>용역내역</h3>
              <button type="button" onClick={addServiceItem} className="add-btn">
                + 용역항목 추가
              </button>
              
              {(formData.serviceItems || []).map((item, index) => (
                <div key={item.id} className="service-item">
                  {/* 첫 번째 행: 항목, 인원수, 기술등급, 기간, 단가, 계약금액 */}
                  <div className="form-row service-main-row">
                    <div className="form-group">
                      <label>항목</label>
                      <input
                        type="text"
                        value={item.item}
                        onChange={(e) => {
                          setFormData(prevData => {
                            const updated = [...prevData.serviceItems];
                            updated[index].item = e.target.value;
                            return {
                              ...prevData,
                              serviceItems: updated
                            };
                          });
                        }}
                        placeholder="용역항목을 입력하세요"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>성명</label>
                      <input
                        type="text"
                        value={item.name || ''}
                        onChange={(e) => {
                          setFormData(prevData => {
                            const updated = [...prevData.serviceItems];
                            updated[index].name = e.target.value;
                            return {
                              ...prevData,
                              serviceItems: updated
                            };
                          });
                        }}
                        placeholder="성명"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>기술등급</label>
                      <select
                        value={item.skillLevel}
                        onChange={(e) => {
                          const updated = [...formData.serviceItems];
                          updated[index].skillLevel = e.target.value;
                          setFormData({...formData, serviceItems: updated});
                        }}
                        required
                      >
                        <option value="">등급선택</option>
                        <option value="특급">특급</option>
                        <option value="고급">고급</option>
                        <option value="중급">중급</option>
                        <option value="초급">초급</option>
                      </select>
                    </div>
                    <div className="form-group narrow-input">
                      <label>기간 (개월)</label>
                      <input
                        type="number"
                        value={item.period}
                        onChange={(e) => {
                          setFormData(prevData => {
                            const updated = [...prevData.serviceItems];
                            updated[index].period = Number(e.target.value);
                            updated[index].contractAmount = updated[index].period * updated[index].monthlyRate;
                            return {
                              ...prevData,
                              serviceItems: updated
                            };
                          });
                        }}
                        placeholder="개월수"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>단가 (월)</label>
                      <input
                        type="text"
                        value={item.monthlyRate ? item.monthlyRate.toLocaleString() : ''}
                        onChange={(e) => {
                          const numericValue = e.target.value.replace(/,/g, '');
                          if (/^\d*$/.test(numericValue)) {
                            setFormData(prevData => {
                              const updated = [...prevData.serviceItems];
                              updated[index].monthlyRate = Number(numericValue);
                              updated[index].contractAmount = updated[index].period * updated[index].monthlyRate;
                              return {
                                ...prevData,
                                serviceItems: updated
                              };
                            });
                          }
                        }}
                        placeholder="월 단가"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>계약금액</label>
                      <input
                        type="text"
                        value={item.contractAmount ? item.contractAmount.toLocaleString() : '0'}
                        readOnly
                      />
                    </div>
                  </div>
                  
                  {/* 두 번째 행: 공급업체, 신용등급 */}
                  <div className="form-row service-sub-row">
                    <div className="form-group">
                      <label>공급업체</label>
                      <input
                        type="text"
                        value={item.supplier}
                        onChange={(e) => {
                          setFormData(prevData => {
                            const updated = [...prevData.serviceItems];
                            updated[index].supplier = e.target.value;
                            return {
                              ...prevData,
                              serviceItems: updated
                            };
                          });
                        }}
                        placeholder="공급업체를 입력하세요"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>신용등급</label>
                      <input
                        type="text"
                        value={item.creditRating}
                        onChange={(e) => {
                          setFormData(prevData => {
                            const updated = [...prevData.serviceItems];
                            updated[index].creditRating = e.target.value;
                            return {
                              ...prevData,
                              serviceItems: updated
                            };
                          });
                        }}
                        placeholder="신용등급을 입력하세요 (예: A, B+, BBB 등)"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <button 
                        type="button" 
                        className="remove-service-btn"
                        onClick={() => {
                          setFormData(prevData => ({
                            ...prevData,
                            serviceItems: prevData.serviceItems.filter((_, i) => i !== index)
                          }));
                        }}
                        title="용역항목 제거"
                      >
                        항목 삭제
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="form-row">
                <div className="form-group">
                  <label>계약기간</label>
                  <div className="contract-period-dates">
                    <div className="date-input-wrapper">
                      <label className="date-sub-label">시작일:</label>
                      <input
                        type="date"
                        value={formData.contractStartDate || ''}
                        onChange={(e) => setFormData(prevData => ({...prevData, contractStartDate: e.target.value}))}
                        className="contract-date-input"
                        required
                      />
                    </div>
                    <div className="date-input-wrapper">
                      <label className="date-sub-label">종료일:</label>
                      <input
                        type="date"
                        value={formData.contractEndDate || ''}
                        onChange={(e) => setFormData(prevData => ({...prevData, contractEndDate: e.target.value}))}
                        className="contract-date-input"
                        min={formData.contractStartDate || undefined}
                        required
                      />
                    </div>
                  </div>
                </div>
                <div className="form-group">
                  <label>비용지급방식</label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData(prevData => ({...prevData, paymentMethod: e.target.value}))}
                    required
                  >
                    <option value="">지급방식을 선택하세요</option>
                    <option value="monthly">월별 지급</option>
                    <option value="quarterly">분기별 지급</option>
                    <option value="lump">일시 지급</option>
                  </select>
                </div>
              </div>
              
              <div className="total-amount">
                <h4 className="total-contract-amount">총 계약금액: {formatCurrency(calculateTotalAmount())}</h4>
              </div>

              {/* 비용귀속분배 섹션 */}
              <div className="cost-allocations-container">
                {(formData.serviceItems || []).map((item, index) => (
                  <div key={`allocation-${item.id}`} className="cost-allocation-section">
                    <div className="allocation-header">
                      <h4>"{item.name || `용역항목 ${index + 1}`}" 비용귀속부서 분배</h4>
                      <button 
                        type="button" 
                        className="add-allocation-btn"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          e.nativeEvent.stopImmediatePropagation();
                          
                          // 중복 클릭 방지
                          if (e.target.disabled) {
                            return;
                          }
                          
                          // 버튼 비활성화
                          e.target.disabled = true;
                          
                          e.target.textContent = '추가 중...';
                          
                          console.log(`🚨 용역 분배 추가 버튼 클릭: 용역항목 ${index}`);
                          
                          // 비동기로 실행하여 중복 호출 방지
                          setTimeout(() => {
                            setFormData(prevData => {
                              // 현재 상태의 깊은 복사본 생성
                              const updated = JSON.parse(JSON.stringify(prevData.serviceItems));
                              
                              // costAllocation이 없으면 생성
                              if (!updated[index].costAllocation) {
                                updated[index].costAllocation = { 
                                  type: 'percentage',
                                  allocations: [] 
                                };
                              }
                              
                              // allocations가 없으면 빈 배열로 초기화
                              if (!updated[index].costAllocation.allocations) {
                                updated[index].costAllocation.allocations = [];
                              }
                              
                              // 새로운 비용분배 추가
                              const newAllocation = {
                                id: Date.now() + Math.random(),
                                department: '',
                                type: 'percentage',
                                value: 0
                              };
                              
                              // 기존 allocations에 새 allocation 추가
                              updated[index].costAllocation.allocations.push(newAllocation);
                              
                              // 비용분배 개수에 따라 균등 분배 계산
                              const totalAllocations = updated[index].costAllocation.allocations.length;
                              const equalRatio = totalAllocations > 0 ? Math.round(100 / totalAllocations) : 0;
                              
                              // 모든 비용분배의 비율을 균등하게 설정
                              const equalizedAllocations = updated[index].costAllocation.allocations.map((alloc, allocIndex) => {
                                // 마지막 분배는 나머지 비율을 모두 가져가도록 설정
                                if (allocIndex === totalAllocations - 1) {
                                  const remainingRatio = 100 - (equalRatio * (totalAllocations - 1));
                                  return {
                                    ...alloc,
                                    value: remainingRatio
                                  };
                                } else {
                                  return {
                                    ...alloc,
                                    value: equalRatio
                                  };
                                }
                              });
                              
                              updated[index].costAllocation.allocations = equalizedAllocations;
                              
                              console.log(`🚨 용역 업데이트된 allocations:`, equalizedAllocations);
                              
                              return {
                                ...prevData,
                                serviceItems: updated
                              };
                            });
                            
                            // 버튼 복원
                            e.target.disabled = false;
                            e.target.textContent = '+ 분배 추가';
                          }, 100);
                        }}
                      >
                        + 분배 추가
                      </button>
                    </div>
                    
                    {item.costAllocation?.allocations && item.costAllocation.allocations.length > 0 ? (
                      <>
                        <table style={{
                          width: '100%',
                          borderCollapse: 'collapse',
                          marginTop: '1rem',
                          border: '1px solid #dee2e6'
                        }}>
                          <thead>
                            <tr style={{ backgroundColor: '#f8f9fa' }}>
                              <th style={{ 
                                padding: '0.75rem', 
                                border: '1px solid #dee2e6',
                                textAlign: 'left',
                                fontWeight: '600'
                              }}>귀속부서</th>
                              <th style={{ 
                                padding: '0.75rem', 
                                border: '1px solid #dee2e6',
                                textAlign: 'center',
                                fontWeight: '600'
                              }}>분배방식</th>
                              <th style={{ 
                                padding: '0.75rem', 
                                border: '1px solid #dee2e6',
                                textAlign: 'center',
                                fontWeight: '600'
                              }}>분배값</th>
                              <th style={{ 
                                padding: '0.75rem', 
                                border: '1px solid #dee2e6',
                                textAlign: 'right',
                                fontWeight: '600'
                              }}>분배금액</th>
                              <th style={{ 
                                padding: '0.75rem', 
                                border: '1px solid #dee2e6',
                                textAlign: 'center',
                                fontWeight: '600'
                              }}>작업</th>
                            </tr>
                          </thead>
                          <tbody>
                            {item.costAllocation.allocations.map((allocation, allocIndex) => (
                              <tr key={allocIndex} style={{
                                '&:hover': { backgroundColor: '#f8f9fa' }
                              }}>
                                <td style={{ 
                                  padding: '0.75rem', 
                                  border: '1px solid #dee2e6'
                                }}>
                                  <select
                                    value={allocation.department || ''}
                                    onChange={(e) => {
                                      const updatedItems = [...formData.serviceItems];
                                      updatedItems[index].costAllocation.allocations[allocIndex].department = e.target.value;
                                      setFormData({...formData, serviceItems: updatedItems});
                                    }}
                                    required
                                    style={{ 
                                      width: '100%',
                                      padding: '0.5rem',
                                      border: '1px solid #ced4da',
                                      borderRadius: '4px',
                                      fontSize: '0.9rem'
                                    }}
                                  >
                                    <option value="">부서 선택</option>
                                    {departments && departments.length > 0 ? (
                                      departments.map(dept => (
                                        <option key={dept.id} value={dept.name}>
                                          {dept.name}
                                        </option>
                                      ))
                                    ) : (
                                      <option value="" disabled>부서 데이터 로딩 중...</option>
                                    )}
                                  </select>
                                </td>
                                <td style={{ 
                                  padding: '0.75rem', 
                                  border: '1px solid #dee2e6',
                                  textAlign: 'center'
                                }}>
                                  <select
                                    value={allocation.type || 'percentage'}
                                    onChange={(e) => {
                                      const updatedItems = [...formData.serviceItems];
                                      updatedItems[index].costAllocation.allocations[allocIndex].type = e.target.value;
                                      setFormData({...formData, serviceItems: updatedItems});
                                    }}
                                    required
                                    style={{ 
                                      width: '100%',
                                      padding: '0.5rem',
                                      border: '1px solid #ced4da',
                                      borderRadius: '4px',
                                      fontSize: '0.9rem'
                                    }}
                                  >
                                    <option value="percentage">정률 (%)</option>
                                    <option value="fixed">정액 (원)</option>
                                  </select>
                                </td>
                                <td style={{ 
                                  padding: '0.75rem', 
                                  border: '1px solid #dee2e6',
                                  textAlign: 'center'
                                }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <input
                                      type="number"
                                      min="0"
                                      max={allocation.type === 'percentage' ? 100 : item.contractAmount}
                                      value={allocation.value || ''}
                                      onChange={(e) => {
                                        const updatedItems = [...formData.serviceItems];
                                        updatedItems[index].costAllocation.allocations[allocIndex].value = parseFloat(e.target.value) || 0;
                                        setFormData({...formData, serviceItems: updatedItems});
                                      }}
                                      placeholder={allocation.type === 'percentage' ? '0-100' : '금액 입력'}
                                      required
                                      style={{ 
                                        flex: 1,
                                        padding: '0.5rem',
                                        border: '1px solid #ced4da',
                                        borderRadius: '4px',
                                        fontSize: '0.9rem'
                                      }}
                                    />
                                    <span style={{ 
                                      fontSize: '0.9rem',
                                      color: '#6c757d',
                                      minWidth: '20px'
                                    }}>
                                      {allocation.type === 'percentage' ? '%' : '원'}
                                    </span>
                                  </div>
                                </td>
                                <td style={{ 
                                  padding: '0.75rem', 
                                  border: '1px solid #dee2e6',
                                  textAlign: 'right',
                                  fontWeight: '600',
                                  color: '#28a745'
                                }}>
                                  {formatNumberWithComma(
                                    allocation.type === 'percentage' 
                                      ? (item.contractAmount * (allocation.value / 100))
                                      : allocation.value
                                  )}원
                                </td>
                                <td style={{ 
                                  padding: '0.75rem', 
                                  border: '1px solid #dee2e6',
                                  textAlign: 'center'
                                }}>
                                  <button 
                                    type="button" 
                                    onClick={() => {
                                      const updatedItems = [...formData.serviceItems];
                                      updatedItems[index].costAllocation.allocations = 
                                        updatedItems[index].costAllocation.allocations.filter((_, i) => i !== allocIndex);
                                      setFormData({...formData, serviceItems: updatedItems});
                                    }}
                                    title="분배 제거"
                                    style={{
                                      background: '#dc3545',
                                      color: 'white',
                                      border: 'none',
                                      padding: '0.25rem 0.5rem',
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      fontSize: '0.8rem'
                                    }}
                                  >
                                    삭제
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr style={{ backgroundColor: '#f8f9fa', fontWeight: '600' }}>
                              <td colSpan="3" style={{ 
                                padding: '0.75rem', 
                                border: '1px solid #dee2e6',
                                textAlign: 'right'
                              }}>
                                소계:
                              </td>
                              <td style={{ 
                                padding: '0.75rem', 
                                border: '1px solid #dee2e6',
                                textAlign: 'right',
                                color: '#dc3545'
                              }}>
                                {formatNumberWithComma(
                                  item.costAllocation.allocations.reduce((sum, alloc) => {
                                    const amount = alloc.type === 'percentage' 
                                      ? (item.contractAmount * (alloc.value / 100))
                                      : alloc.value;
                                    return sum + amount;
                                  }, 0)
                                )}원
                              </td>
                              <td style={{ 
                                padding: '0.75rem', 
                                border: '1px solid #dee2e6',
                                textAlign: 'center'
                              }}>
                                {(() => {
                                  const totalAllocated = item.costAllocation.allocations.reduce((sum, alloc) => {
                                    const amount = alloc.type === 'percentage' 
                                      ? (item.contractAmount * (alloc.value / 100))
                                      : alloc.value;
                                    return sum + amount;
                                  }, 0);
                                  const isValid = Math.abs(totalAllocated - item.contractAmount) < 1;
                                  return (
                                    <span style={{
                                      color: isValid ? '#28a745' : '#ffc107',
                                      fontSize: '1.2rem',
                                      fontWeight: 'bold'
                                    }}>
                                      {isValid ? '✓' : '⚠'}
                                    </span>
                                  );
                                })()}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                        
                        <div style={{
                          marginTop: '1rem',
                          padding: '0.75rem',
                          backgroundColor: '#f8f9fa',
                          borderRadius: '6px',
                          fontSize: '0.9rem',
                          color: '#6c757d'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>총 계약금액: <strong>{formatNumberWithComma(item.contractAmount)}원</strong></span>
                            <span>
                              분배 합계: <strong style={{
                                color: (() => {
                                  const totalAllocated = item.costAllocation.allocations.reduce((sum, alloc) => {
                                    const amount = alloc.type === 'percentage' 
                                      ? (item.contractAmount * (alloc.value / 100))
                                      : alloc.value;
                                    return sum + amount;
                                  }, 0);
                                  const isValid = Math.abs(totalAllocated - item.contractAmount) < 1;
                                  return isValid ? '#28a745' : '#dc3545';
                                })()
                              }}>
                                {formatNumberWithComma(
                                  item.costAllocation.allocations.reduce((sum, alloc) => {
                                    const amount = alloc.type === 'percentage' 
                                      ? (item.contractAmount * (alloc.value / 100))
                                      : alloc.value;
                                    return sum + amount;
                                  }, 0)
                                )}원
                              </strong>
                            </span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div style={{
                        textAlign: 'center',
                        padding: '2rem',
                        color: '#6c757d',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '6px',
                        marginTop: '1rem'
                      }}>
                        이 항목에 대한 비용분배가 설정되지 않았습니다.
                      </div>
                    )}
                  </div>
                ))}
                
                {(!formData.serviceItems || formData.serviceItems.length === 0) && (
                  <div style={{
                    textAlign: 'center',
                    padding: '3rem',
                    color: '#6c757d',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '6px',
                    fontSize: '1.1rem'
                  }}>
                    용역항목을 먼저 추가해주세요.
                  </div>
                )}
              </div>
            </div>
          )}

          {contractType === 'freeform' && (
            <div className="form-section">
              <h3>📝 자유양식 문서 작성</h3>
              
              {/* 템플릿 선택 영역 */}
              {showTemplates && (
                <DocumentTemplates
                  onSelectTemplate={handleTemplateSelect}
                  selectedTemplate={selectedTemplate}
                />
              )}
              
              {/* 템플릿 다시 선택 버튼 */}
              {!showTemplates && (
                <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                  <button 
                    type="button"
                    onClick={handleShowTemplates}
                    style={{
                      background: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    📋 템플릿 다시 선택
                  </button>
                  {selectedTemplate && (
                    <span style={{ marginLeft: '10px', color: '#666', fontSize: '14px' }}>
                      현재: {selectedTemplate === 'promotion' ? '추진품의' : 
                             selectedTemplate === 'bidding' ? '입찰 실행 품의' : 
                             selectedTemplate === 'biddingResult' ? '입찰 결과 보고 품의' : '사용자 정의'}
                    </span>
                  )}
                </div>
              )}
              
              {/* 에디터 영역 */}
              {!showTemplates && (
                <>
                  <div className="freeform-description">
                    <p>🚀 커스텀 CKEditor 5 - 소스 기반 전문 문서 편집기!</p>
                    <p>✨ 표 편집, 서식, 링크, 목록 등 모든 기능을 지원합니다.</p>
                  </div>
                  <CKEditorComponent
                    value={formData.wysiwygContent || ''}
                    onChange={(content) => setFormData(prevData => ({...prevData, wysiwygContent: content}))}
                    placeholder="커스텀 CKEditor 5로 전문적인 문서를 작성하세요. 표 편집, 서식, 링크 등 모든 기능을 사용할 수 있습니다."
                    height="500px"
                  />
                </>
              )}
            </div>
          )}

          {(contractType === 'change' || contractType === 'extension') && (
            <div className="form-section">
              <h3>{contractType === 'change' ? '변경내역' : '연장내역'}</h3>
              
              <div className="form-group">
                <label>{contractType === 'change' ? '변경 사유' : '연장 사유'}</label>
                <textarea
                  value={contractType === 'change' ? formData.changeReason : formData.extensionReason}
                  onChange={(e) => setFormData(prevData => ({
                    ...prevData, 
                    [contractType === 'change' ? 'changeReason' : 'extensionReason']: e.target.value
                  }))}
                  placeholder={`${contractType === 'change' ? '변경' : '연장'} 사유를 입력하세요`}
                  required
                  rows={3}
                />
              </div>
              
              <div className="comparison-section">
                <div className="before-section">
                  <h4>변경 전</h4>
                  {/* 변경 전 내역 입력 */}
                </div>
                <div className="after-section">
                  <h4>변경 후</h4>
                  {/* 변경 후 내역 입력 */}
                </div>
              </div>
            </div>
          )}

          {/* 결재라인 추천 - 자유양식 제외 */}
          {calculateTotalAmount() > 0 && contractType !== 'freeform' && (
            <div className="form-section">
              <h3>📋 결재라인 추천</h3>
              <div className="approval-flow">
                {getRecommendedApprovalLine().map((step, index) => (
                  <div key={index} className={`approval-step ${step.final ? 'final' : ''} ${step.conditional ? 'conditional' : ''}`}>
                    <div className="step-number">{step.step}</div>
                    <div className="step-content">
                      <div className="step-name">{step.name}</div>
                      <div className="step-title">{step.title}</div>
                      <div className="step-description">{step.description}</div>
                      {step.conditional && (
                        <div className="conditional-badge">조건부</div>
                      )}
                    </div>
                    {index < getRecommendedApprovalLine().length - 1 && (
                      <div className="step-arrow">→</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="form-actions">
            <button type="button" className="draft-btn" onClick={() => {
              console.log('임시저장 버튼 클릭됨');
              handleProposalSave(true); // isDraft = true (임시저장)
            }}>
              임시저장
            </button>
            <button type="button" className="preview-btn" onClick={handlePreview}>
              미리보기
            </button>
            <button type="submit" className="submit-btn" onClick={() => {
              console.log('품의서 작성 버튼 클릭됨');
              console.log('현재 폼 데이터:', formData);
              console.log('계약 유형:', contractType);
            }}>
              작성완료
            </button>
          </div>
        </form>
      )}

      {/* 부서 선택 드롭다운 */}
      {showDepartmentDropdown && (
        <div className="popup-overlay" onClick={() => setShowDepartmentDropdown(false)}>
          <div className="department-popup" onClick={(e) => e.stopPropagation()}>
            <div className="popup-header">
              <h3>부서 선택</h3>
              <button 
                className="popup-close"
                onClick={() => setShowDepartmentDropdown(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="department-search">
              <input
                type="text"
                placeholder="부서명을 검색하세요..."
                value={departmentSearchTerm}
                onChange={(e) => setDepartmentSearchTerm(e.target.value)}
                autoFocus
              />
            </div>
            
            <div className="department-list">
              {filteredDepartments.length > 0 ? (
                filteredDepartments.map(dept => (
                  <div 
                    key={dept.id} 
                    className="department-item"
                    onClick={() => selectDepartment(dept)}
                  >
                    <div className="department-name">{dept.name}</div>
                    {dept.description && (
                      <div className="department-description">{dept.description}</div>
                    )}
                  </div>
                ))
              ) : (
                <div className="no-results">
                  <p>검색 결과가 없습니다.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}



      {/* 사업예산 선택 팝업 */}
      {showBudgetPopup && (
        <div className="popup-overlay" onClick={() => setShowBudgetPopup(false)}>
          <div className="budget-popup" onClick={(e) => e.stopPropagation()}>
            <div className="popup-header">
              <h3>사업예산 선택</h3>
              <button 
                className="popup-close"
                onClick={() => setShowBudgetPopup(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="popup-filters">
              <div className="filter-group">
                <label>연도</label>
                <select 
                  value={selectedYear} 
                  onChange={(e) => setSelectedYear(e.target.value)}
                >
                  <option value="">전체 연도</option>
                  {getYearList().map(year => (
                    <option key={year} value={year}>{year}년</option>
                  ))}
                </select>
              </div>
              
              <div className="filter-group">
                <label>예산 유형</label>
                <select 
                  value={selectedBudgetType} 
                  onChange={(e) => setSelectedBudgetType(e.target.value)}
                >
                  <option value="">전체 유형</option>
                  {getBudgetTypeList().map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="budget-list">
              {filteredBudgets.length > 0 ? (
                filteredBudgets.map(budget => {
                  const remainingAmount = (budget.budget_amount || 0) - (budget.executed_amount || 0);
                  return (
                    <div 
                      key={budget.id} 
                      className="budget-item"
                      onClick={() => selectBudget(budget)}
                    >
                      <div className="budget-header">
                        <h4>{budget.project_name}</h4>
                        <span className="budget-year">{budget.budget_year}년</span>
                      </div>
                      <div className="budget-details">
                        <span className="budget-type">{budget.budget_type}</span>
                        <span className="budget-amount">총액: {formatCurrency(budget.budget_amount || 0)}</span>
                        <span className="budget-remaining">잔여: {formatCurrency(remainingAmount)}</span>
                      </div>
                      <div className="budget-progress">
                        <div 
                          className="progress-bar"
                          style={{
                            width: `${budget.budget_amount > 0 ? (budget.executed_amount / budget.budget_amount) * 100 : 0}%`
                          }}
                        ></div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="no-results">
                  <p>조건에 맞는 사업예산이 없습니다.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 임시저장 확인 팝업 */}
      {showSaveConfirm && pendingNavigation && (
        <div className="popup-overlay" onClick={handleCancelNavigation}>
          <div className="save-confirm-popup" onClick={(e) => e.stopPropagation()} style={{backgroundColor: '#f8f9fa', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)', maxWidth: '500px', width: '90%', maxHeight: '80vh', overflowY: 'auto'}}>
            {console.log('팝업 렌더링:', showSaveConfirm, pendingNavigation)}
            <div className="popup-header">
              <h3>📝 임시저장 확인</h3>
              <button 
                className="popup-close"
                onClick={handleCancelNavigation}
              >
                ✕
              </button>
            </div>
            
            <div className="save-confirm-content" style={{backgroundColor: '#f8f9fa'}}>
              <div className="confirm-message" style={{backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e1e5e9'}}>
                <p style={{backgroundColor: '#ffffff', margin: '0.5rem 0', fontSize: '1.1rem', color: '#333'}}>작성 중인 내용이 있습니다.</p>
                <p style={{backgroundColor: '#ffffff', margin: '0.5rem 0', fontSize: '1.1rem', color: '#333'}}>임시저장하고 이동하시겠습니까?</p>
                <p className="navigation-target" style={{backgroundColor: '#f8f9fa', fontSize: '0.9rem', color: '#666', fontStyle: 'italic', marginTop: '0.5rem', padding: '0.75rem', borderRadius: '6px', display: 'inline-block'}}>
                  이동할 페이지: {pendingNavigation && ['purchase', 'change', 'extension', 'service', 'bidding'].includes(pendingNavigation) 
                    ? `${pendingNavigation === 'purchase' ? '신규' : pendingNavigation === 'change' ? '변경' : pendingNavigation === 'extension' ? '연장' : pendingNavigation === 'service' ? '용역' : '입찰'} 계약` 
                    : pendingNavigation}
                </p>
              </div>
              
              <div className="confirm-buttons">
                <button 
                  onClick={handleSaveAndNavigate}
                  className="btn btn-primary"
                >
                  💾 임시저장 후 이동
                </button>
                <button 
                  onClick={handleNavigateWithoutSave}
                  className="btn btn-secondary"
                >
                  🚫 저장하지 않고 이동
                </button>
                <button 
                  onClick={handleCancelNavigation}
                  className="btn btn-cancel"
                >
                  ❌ 취소
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 미리보기 팝업 완전 제거됨 */}
      {false && (
        <div className="popup-overlay">
          <div 
            className={`preview-popup resizable-popup ${isResizing ? 'resizing' : ''}`}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: `${popupSize.width}vw`,
              height: `${popupSize.height}vh`,
              maxWidth: 'none',
              maxHeight: 'none'
            }}
          >
            <div className="popup-header">
              <div className="header-left">
                <h3>📋 품의서 미리보기</h3>
                <small style={{ color: '#666', fontSize: '0.8rem', marginLeft: '1rem' }}>
                  크기조절: 드래그 또는 버튼 클릭 | 단축키: 1(작게), 2(보통), 3(크게), ESC(닫기)
                </small>
              </div>
              <div className="popup-controls">
                <button 
                  className="size-control-btn"
                  onClick={() => setPopupSize({ width: 70, height: 80 })}
                  title="작게"
                >
                  📱
                </button>
                <button 
                  className="size-control-btn"
                  onClick={() => setPopupSize({ width: 85, height: 90 })}
                  title="보통"
                >
                  💻
                </button>
                <button 
                  className="size-control-btn"
                  onClick={() => setPopupSize({ width: 99, height: 97 })}
                  title="크게"
                >
                  🖥️
                </button>
                <button 
                  className="popup-close"
                  onClick={handleClosePreview}
                >
                  ✕
                </button>
              </div>
            </div>
            
            {/* 리사이즈 핸들 */}
            <div className="resize-handles">
              <div 
                className="resize-handle resize-handle-right"
                onMouseDown={(e) => handleResizeStart(e, 'right')}
              ></div>
              <div 
                className="resize-handle resize-handle-bottom"
                onMouseDown={(e) => handleResizeStart(e, 'bottom')}
              ></div>
              <div 
                className="resize-handle resize-handle-corner"
                onMouseDown={(e) => handleResizeStart(e, 'corner')}
              ></div>
            </div>
            
            <div 
              className="preview-content"
              style={{
                maxHeight: `calc(${popupSize.height}vh - 80px)`
              }}
            >
              <div className="formal-document">
                {/* 문서 헤더 */}
                <div className="document-header">
                  <div className="company-info">
                    <h1 className="company-name">[회사명]</h1>
                    <p className="company-address">[회사 주소]</p>
                    <p className="company-contact">TEL: [전화번호] | FAX: [팩스번호] | EMAIL: [이메일]</p>
                  </div>
                  <div className="document-meta">
                    <div className="document-number">
                      <span className="label">문서번호:</span>
                      <span className="value">[자동생성]</span>
                    </div>
                    <div className="document-date">
                      <span className="label">작성일자:</span>
                      <span className="value">{new Date().toLocaleDateString('ko-KR')}</span>
                    </div>
                  </div>
                </div>

                {/* 문서 제목 */}
                <div className="document-title">
                  <h1 className="main-title">{formData.title || '품 의 서'}</h1>
                  <div className="title-underline"></div>
                </div>

                {/* 문서 본문 */}
                <div className="document-body">
                  
                  {/* 자유양식 내용 */}
                  {contractType === 'freeform' && formData.wysiwygContent && (
                    <div className="freeform-content">
                      <div 
                        dangerouslySetInnerHTML={{ 
                          __html: formData.wysiwygContent 
                        }}
                        style={{
                          lineHeight: '1.8',
                          fontSize: '15px',
                          color: '#333',
                          padding: '1rem',
                          border: '1px solid #e0e0e0',
                          borderRadius: '8px',
                          backgroundColor: '#fdfdfd',
                          minHeight: '200px'
                        }}
                      />
                    </div>
                  )}
                  
                  {/* 자유양식인데 내용이 없는 경우 */}
                  {contractType === 'freeform' && !formData.wysiwygContent && (
                    <div className="no-data-box">
                      <p>자유양식 내용이 입력되지 않았습니다.</p>
                    </div>
                  )}

                  {/* 자유양식이 아닌 경우에만 기본 정보 표시 */}
                  {contractType !== 'freeform' && (
                    <>
                      {/* 기본 정보 테이블 */}
                      <div className="info-section">
                        <h2 className="section-title">1. 계약 기본 정보</h2>
                    <table className="info-table">
                      <tbody>
                        {formData.title && (
                          <tr>
                            <td className="label-cell">제목</td>
                            <td className="value-cell" colSpan="3">{formData.title}</td>
                          </tr>
                        )}
                        <tr>
                          <td className="label-cell">계약 유형</td>
                          <td className="value-cell" colSpan="3">
                            {contractType === 'purchase' ? '구매계약' : 
                             contractType === 'service' ? '용역계약' : 
                             contractType === 'change' ? '변경계약' : 
                             contractType === 'extension' ? '연장계약' : contractType === 'freeform' ? '자유양식' : '기타'}
                          </td>
                        </tr>
                        <tr>
                          <td className="label-cell">계약방식</td>
                          <td className="value-cell" colSpan="3">
                            {(() => {
                              if (!formData.contractMethod) return '미입력';
                              
                              // value 필드로 매칭 (품의서 작성에서 value를 저장하므로)
                              let method = contractMethods.find(m => 
                                m.value === formData.contractMethod
                              );
                              
                              // value로 매칭되지 않으면 다른 방식 시도
                              if (!method) {
                                method = contractMethods.find(m => 
                                  m.id == formData.contractMethod || 
                                  m.id === parseInt(formData.contractMethod) || 
                                  String(m.id) === String(formData.contractMethod) ||
                                  m.name === formData.contractMethod
                                );
                              }
                              
                              // "lowest" 같은 특수 값 처리
                              if (!method && formData.contractMethod === 'lowest') {
                                return '최저가계약';
                              }
                              
                              return method?.name || `미등록 계약방식 (${formData.contractMethod})`;
                            })()}
                          </td>
                        </tr>
                        <tr>
                          <td className="label-cell">사업 목적</td>
                          <td className="value-cell" colSpan="3">{formData.purpose || '미입력'}</td>
                        </tr>
                        <tr>
                          <td className="label-cell">계약 근거</td>
                          <td className="value-cell" colSpan="3">{formData.basis || '미입력'}</td>
                        </tr>
                        <tr>
                          <td className="label-cell">사업 예산</td>
                          <td className="value-cell" colSpan="3">
                            {(() => {
                              if (!formData.budget) return '-';
                              
                              // 다양한 방식으로 매칭 시도
                              let budget = businessBudgets.find(b => 
                                b.id == formData.budget || 
                                b.id === parseInt(formData.budget) || 
                                String(b.id) === String(formData.budget)
                              );
                              
                              // 매칭되지 않으면 프로젝트명으로 직접 찾기
                              if (!budget) {
                                budget = businessBudgets.find(b => 
                                  b.project_name === formData.budget ||
                                  b.projectName === formData.budget ||
                                  b.name === formData.budget
                                );
                              }
                              
                              if (budget) {
                                const projectName = budget.project_name || budget.projectName || budget.name;
                                const budgetAmount = budget.budget_amount || budget.budgetAmount || 0;
                                return `${projectName} (${formatCurrency(budgetAmount)})`;
                              }
                              
                              return `미등록 예산 (${formData.budget})`;
                            })()}
                          </td>
                        </tr>
                        {formData.other && formData.other.trim() && (
                        <tr>
                          <td className="label-cell">기타</td>
                          <td className="value-cell" colSpan="3">{formData.other}</td>
                        </tr>
                        )}
                        <tr>
                          <td className="label-cell">요청부서</td>
                          <td className="value-cell" colSpan="3">
                            {formData.requestDepartments && formData.requestDepartments.length > 0 ? 
                              formData.requestDepartments.map(dept => 
                                typeof dept === 'string' ? dept : dept.name || dept
                              ).join(', ') : '미입력'}
                          </td>
                        </tr>
                        {contractType === 'change' && formData.changeReason && (
                          <tr>
                            <td className="label-cell">변경 사유</td>
                            <td className="value-cell" colSpan="3" style={{ whiteSpace: 'pre-wrap' }}>
                              {formData.changeReason}
                            </td>
                          </tr>
                        )}
                        {contractType === 'extension' && formData.extensionReason && (
                          <tr>
                            <td className="label-cell">연장 사유</td>
                            <td className="value-cell" colSpan="3" style={{ whiteSpace: 'pre-wrap' }}>
                              {formData.extensionReason}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>



                  {/* 계약 상세 내역 */}
                  <div className="details-section">
                    <h2 className="section-title">2. 계약 상세 내역</h2>
                  {['purchase', 'change', 'extension'].includes(contractType) && formData.purchaseItems && formData.purchaseItems.length > 0 ? (
                      <div>
                        {/* 구매 품목 상세 테이블 */}
                        <table className="details-table">
                          <thead>
                            <tr>
                              <th style={{ width: '50px' }}>번호</th>
                              <th style={{ width: '120px' }}>구분</th>
                              <th style={{ width: '200px' }}>품목명/규격</th>
                              <th style={{ width: '80px' }}>수량</th>
                              <th style={{ width: '120px' }}>단가</th>
                              <th style={{ width: '120px' }}>금액</th>
                              <th style={{ width: '100px' }}>납기일</th>
                              <th style={{ width: '150px' }}>공급업체</th>
                              <th style={{ width: '100px' }}>비고</th>
                            </tr>
                          </thead>
                          <tbody>
                            {formData.purchaseItems.map((item, index) => (
                              <tr key={index}>
                                <td className="text-center">{index + 1}</td>
                                <td className="text-center">{item.item || '-'}</td>
                                <td>
                                  <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                                    {item.productName || '-'}
                                  </div>
                                  {item.specification && (
                                    <div style={{ fontSize: '0.9em', color: '#666' }}>
                                      {item.specification}
                                    </div>
                                  )}
                                </td>
                                <td className="text-center">{formatNumberWithComma(item.quantity || 0)}{item.unit || '개'}</td>
                                <td className="text-right">{formatCurrency(item.unitPrice || 0)}</td>
                                <td className="text-right amount-highlight">{formatCurrency(item.amount || 0)}</td>
                                <td className="text-center">
                                  {item.deliveryDate ? 
                                    new Date(item.deliveryDate).toLocaleDateString('ko-KR') : 
                                    '협의 후 결정'
                                  }
                                </td>
                                <td className="text-center">
                                  <div style={{ fontWeight: '600' }}>{item.supplier || '-'}</div>
                                  {item.supplierContact && (
                                    <div style={{ fontSize: '0.8em', color: '#666' }}>
                                      {item.supplierContact}
                                    </div>
                                  )}
                                </td>
                                <td className="text-center" style={{ fontSize: '0.9em' }}>
                                  {item.notes || '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="total-row">
                              <td colSpan="5" className="total-label text-right" style={{ fontWeight: '700' }}>
                                총 계약금액 합계
                              </td>
                              <td className="total-amount text-right" style={{ fontWeight: '700', fontSize: '1.1em' }}>
                                {formatCurrency(formData.purchaseItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0))}
                              </td>
                              <td colSpan="3" className="text-center" style={{ fontSize: '0.9em', color: '#666' }}>
                                (부가세 별도)
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                        
                        {/* 계약 조건 및 특이사항 */}
                        <div style={{ marginTop: '2rem' }}>
                          <h3 style={{ 
                            fontSize: '16px', 
                            fontWeight: '600', 
                            marginBottom: '1rem',
                            color: '#333',
                            borderBottom: '2px solid #e0e0e0',
                            paddingBottom: '0.5rem'
                          }}>
                            📋 계약 조건 및 특이사항
                          </h3>
                          <table className="info-table" style={{ marginTop: '1rem' }}>
                            <tbody>
                              <tr>
                                <td className="label-cell" style={{ width: '150px' }}>계약기간</td>
                                <td className="value-cell">
                                  {formData.contractStartDate && formData.contractEndDate ? 
                                    `${new Date(formData.contractStartDate).toLocaleDateString('ko-KR')} ~ ${new Date(formData.contractEndDate).toLocaleDateString('ko-KR')}` :
                                    '계약 체결 후 협의'
                                  }
                                </td>
                              </tr>
                              <tr>
                                <td className="label-cell">지급조건</td>
                                <td className="value-cell">
                                  {formData.paymentMethod || '검수 완료 후 30일 이내 지급'}
                                </td>
                              </tr>
                              <tr>
                                <td className="label-cell">납품조건</td>
                                <td className="value-cell">
                                  {formData.deliveryCondition || '지정 장소 납품, 설치 및 시험 완료'}
                                </td>
                              </tr>
                              <tr>
                                <td className="label-cell">품질보증</td>
                                <td className="value-cell">
                                  {formData.warrantyPeriod ? `납품일로부터 ${formData.warrantyPeriod}개월` : '제조사 표준 보증기간 적용'}
                                </td>
                              </tr>
                              <tr>
                                <td className="label-cell">계약해지</td>
                                <td className="value-cell">
                                  계약 위반 시 7일 전 서면 통지 후 해지 가능
                                </td>
                              </tr>
                              {formData.specialConditions && (
                                <tr>
                                  <td className="label-cell">특별조건</td>
                                  <td className="value-cell">{formData.specialConditions}</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                  ) : contractType === 'service' && formData.serviceItems && formData.serviceItems.length > 0 ? (
                      <div>
                        {/* 용역 계약 상세 테이블 */}
                        <table className="details-table">
                          <thead>
                            <tr>
                              <th style={{ width: '50px' }}>번호</th>
                              <th style={{ width: '200px' }}>용역명/업무내용</th>
                              <th style={{ width: '100px' }}>성명</th>
                              <th style={{ width: '100px' }}>기술등급</th>
                              <th style={{ width: '80px' }}>기간</th>
                              <th style={{ width: '120px' }}>월단가</th>
                              <th style={{ width: '120px' }}>계약금액</th>
                              <th style={{ width: '100px' }}>근무형태</th>
                              <th style={{ width: '100px' }}>비고</th>
                            </tr>
                          </thead>
                          <tbody>
                            {formData.serviceItems.map((item, index) => (
                              <tr key={index}>
                                <td className="text-center">{index + 1}</td>
                                <td>
                                  <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                                    {item.item || '-'}
                                  </div>
                                  {item.workDescription && (
                                    <div style={{ fontSize: '0.9em', color: '#666' }}>
                                      {item.workDescription}
                                    </div>
                                  )}
                                </td>
                                <td className="text-center" style={{ fontWeight: '600' }}>
                                  {item.name || item.personnel || '-'}
                                </td>
                                <td className="text-center">
                                  {item.skillLevel || item.techLevel || '-'}
                                </td>
                                <td className="text-center">{item.period || 0}개월</td>
                                <td className="text-right">{formatCurrency(item.monthlyRate || 0)}</td>
                                <td className="text-right amount-highlight">{formatCurrency(item.contractAmount || 0)}</td>
                                <td className="text-center">
                                  {item.workType || '상주근무'}
                                </td>
                                <td className="text-center" style={{ fontSize: '0.9em' }}>
                                  {item.notes || '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="total-row">
                              <td colSpan="6" className="total-label text-right" style={{ fontWeight: '700' }}>
                                총 계약금액 합계
                              </td>
                              <td className="total-amount text-right" style={{ fontWeight: '700', fontSize: '1.1em' }}>
                                {formatCurrency(formData.serviceItems.reduce((sum, item) => sum + (parseFloat(item.contractAmount) || 0), 0))}
                              </td>
                              <td colSpan="2" className="text-center" style={{ fontSize: '0.9em', color: '#666' }}>
                                (부가세 별도)
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                        
                        {/* 용역 계약 조건 */}
                        <div style={{ marginTop: '2rem' }}>
                          <h3 style={{ 
                            fontSize: '16px', 
                            fontWeight: '600', 
                            marginBottom: '1rem',
                            color: '#333',
                            borderBottom: '2px solid #e0e0e0',
                            paddingBottom: '0.5rem'
                          }}>
                            🤝 용역 계약 조건
                          </h3>
                          <table className="info-table" style={{ marginTop: '1rem' }}>
                            <tbody>
                              <tr>
                                <td className="label-cell" style={{ width: '150px' }}>계약기간</td>
                                <td className="value-cell">
                                  {formData.contractStartDate && formData.contractEndDate ? 
                                    `${new Date(formData.contractStartDate).toLocaleDateString('ko-KR')} ~ ${new Date(formData.contractEndDate).toLocaleDateString('ko-KR')}` :
                                    formData.contractPeriod || '계약 체결 후 협의'
                                  }
                                </td>
                              </tr>
                              <tr>
                                <td className="label-cell">지급조건</td>
                                <td className="value-cell">
                                  {formData.paymentMethod || '매월 말일 기준 익월 말일 지급'}
                                </td>
                              </tr>
                              <tr>
                                <td className="label-cell">근무장소</td>
                                <td className="value-cell">
                                  {formData.workLocation || '발주처 지정 장소'}
                                </td>
                              </tr>
                              <tr>
                                <td className="label-cell">근무시간</td>
                                <td className="value-cell">
                                  {formData.workHours || '평일 09:00~18:00 (주 40시간)'}
                                </td>
                              </tr>
                              <tr>
                                <td className="label-cell">업무관리</td>
                                <td className="value-cell">
                                  발주처 담당자의 지시에 따라 업무 수행
                                </td>
                              </tr>
                              <tr>
                                <td className="label-cell">계약해지</td>
                                <td className="value-cell">
                                  계약 위반 시 30일 전 서면 통지 후 해지 가능
                                </td>
                              </tr>
                              {formData.specialConditions && (
                                <tr>
                                  <td className="label-cell">특별조건</td>
                                  <td className="value-cell">{formData.specialConditions}</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                  ) : (
                      <div className="no-data-box">
                        <p>계약 상세 내역이 입력되지 않았습니다.</p>
                </div>
                  )}
                </div>

                  {/* 비용귀속내용 */}
                  <div className="details-section">
                    <h2 className="section-title">3. 비용귀속내용</h2>
                    {(() => {
                      // 품목별 비용귀속 상세 표시
                      const hasAnyAllocations = formData.purchaseItems?.some(item => 
                        item.costAllocation?.allocations && item.costAllocation.allocations.length > 0
                      );
                      
                      if (!hasAnyAllocations) {
                        return (
                          <div className="no-data-box">
                            <p>비용귀속부서 배분 내역이 없습니다.</p>
                          </div>
                        );
                      }
                      
                      return (
                        <div>
                          {/* 품목별 상세 내역 */}
                          {formData.purchaseItems?.map((item, itemIndex) => {
                            const allocations = item.costAllocation?.allocations || [];
                            if (allocations.length === 0) return null;
                            
                            return (
                              <div key={itemIndex} style={{ marginBottom: '2rem' }}>
                                <h3 style={{ 
                                  fontSize: '16px', 
                                  fontWeight: '600', 
                                  marginBottom: '1rem',
                                  color: '#333',
                                  borderBottom: '2px solid #e0e0e0',
                                  paddingBottom: '0.5rem'
                                }}>
                                  {item.productName} - 비용귀속 상세
                                </h3>
                                <table className="details-table" style={{ marginBottom: '1rem' }}>
                                  <thead>
                                    <tr>
                                      <th>귀속부서</th>
                                      <th>분배방식</th>
                                      <th>분배값</th>
                                      <th>분배금액</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {allocations.map((allocation, allocIndex) => (
                                      <tr key={allocIndex}>
                                        <td className="text-center">{allocation.department}</td>
                                        <td className="text-center">
                                          {allocation.type === 'percentage' ? '정률 (%)' : '정액 (원)'}
                                        </td>
                                        <td className="text-center">
                                          {allocation.type === 'percentage' 
                                            ? `${allocation.value}%` 
                                            : formatCurrency(allocation.value)}
                                        </td>
                                        <td className="text-right amount-highlight">
                                          {formatCurrency(
                                            allocation.type === 'percentage'
                                              ? (item.amount * (allocation.value / 100))
                                              : allocation.value
                                          )}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                  <tfoot>
                                    <tr className="total-row">
                                      <td colSpan="3" className="text-right total-label">소계</td>
                                      <td className="text-right total-amount">
                                        {formatCurrency(
                                          allocations.reduce((sum, allocation) => {
                                            return sum + (allocation.type === 'percentage'
                                              ? (item.amount * (allocation.value / 100))
                                              : allocation.value);
                                          }, 0)
                                        )}
                                      </td>
                                    </tr>
                                  </tfoot>
                                </table>
                              </div>
                            );
                          })}
                          
                          {/* 전체 집계 */}
                          <div style={{ marginTop: '2rem' }}>
                            <h3 style={{ 
                              fontSize: '16px', 
                              fontWeight: '600', 
                              marginBottom: '1rem',
                              color: '#333',
                              borderBottom: '2px solid #e0e0e0',
                              paddingBottom: '0.5rem'
                            }}>
                              📊 전체 비용귀속 집계
                            </h3>
                            {(() => {
                              const totalAllocation = calculateTotalCostAllocation();
                              return (
                                <table className="details-table">
                                  <thead>
                                    <tr>
                                      <th>부서명</th>
                                      <th>배분금액</th>
                                      <th>배분비율</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {Object.entries(totalAllocation).map(([department, allocation]) => (
                                      <tr key={department}>
                                        <td className="text-center">{department}</td>
                                        <td className="text-center amount-highlight">{formatCurrency(allocation.amount)}</td>
                                        <td className="text-center">{allocation.percentage.toFixed(1)}%</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                  <tfoot>
                                    <tr className="total-row">
                                      <td className="text-center total-label">합계</td>
                                      <td className="text-center total-amount">
                                        {formatCurrency(Object.values(totalAllocation).reduce((sum, alloc) => sum + alloc.amount, 0))}
                                      </td>
                                      <td className="text-center">
                                        {Object.values(totalAllocation).reduce((sum, alloc) => sum + alloc.percentage, 0).toFixed(1)}%
                                      </td>
                                    </tr>
                                  </tfoot>
                                </table>
                              );
                            })()}
                          </div>
                        </div>
                      );
                    })()}
                        </div>
                      </>
                    )}

                </div>

                {/* 문서 하단 */}
                <div className="document-footer">
                  <div className="footer-line"></div>
                  <div className="footer-info">
                    <div className="creation-date">작성일: {new Date().toLocaleDateString('ko-KR')}</div>
                    <div className="department-signature">
                      <span>담당부서: ________________</span>
                      <span>담당자: ________________ (인)</span>
                      </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx="true">{`
        .proposal-form {
          max-width: 1400px;
          margin: 0 auto;
          padding: 2rem;
        }

        .contract-type-selection {
          background: white;
          padding: 2rem;
          border-radius: 12px;
          margin-bottom: 2rem;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .type-buttons {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-top: 1rem;
        }

        .type-btn {
          padding: 1rem;
          border: 2px solid #e1e5e9;
          border-radius: 8px;
          background: white !important;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s ease;
          color: #333 !important;
        }

        .type-btn:hover {
          border-color: #3b82f6 !important;
          background: white !important;
          color: #333 !important;
          transform: translateY(-2px);
        }

        .type-btn.active {
          border-color: #3b82f6 !important;
          background: #3b82f6 !important;
          color: white !important;
        }

        /* 자유양식 버튼 강제 스타일 통일 - 최고 우선순위 */
        .type-buttons .type-btn:nth-child(5),
        .type-buttons button:nth-child(5),
        .contract-type-selection .type-buttons button:nth-child(5),
        .contract-type-selection .type-btn:nth-child(5),
        button[onclick*="freeform"],
        button:contains("자유양식") {
          border: 2px solid #e1e5e9 !important;
          border-top: 2px solid #e1e5e9 !important;
          border-right: 2px solid #e1e5e9 !important;
          border-bottom: 2px solid #e1e5e9 !important;
          border-left: 2px solid #e1e5e9 !important;
          border-color: #e1e5e9 !important;
          background: white !important;
          background-color: white !important;
          color: #333 !important;
          outline: none !important;
          box-shadow: none !important;
        }

        .type-buttons .type-btn:nth-child(5):hover,
        .type-buttons button:nth-child(5):hover,
        .contract-type-selection .type-buttons button:nth-child(5):hover,
        .contract-type-selection .type-btn:nth-child(5):hover,
        button[onclick*="freeform"]:hover,
        button:contains("자유양식"):hover {
          border: 2px solid #3b82f6 !important;
          border-top: 2px solid #3b82f6 !important;
          border-right: 2px solid #3b82f6 !important;
          border-bottom: 2px solid #3b82f6 !important;
          border-left: 2px solid #3b82f6 !important;
          border-color: #3b82f6 !important;
          background: white !important;
          background-color: white !important;
          color: #333 !important;
          outline: none !important;
        }

        .type-buttons .type-btn:nth-child(5).active,
        .type-buttons button:nth-child(5).active,
        .contract-type-selection .type-buttons button:nth-child(5).active,
        .contract-type-selection .type-btn:nth-child(5).active,
        button[onclick*="freeform"].active,
        button:contains("자유양식").active {
          border: 2px solid #3b82f6 !important;
          border-top: 2px solid #3b82f6 !important;
          border-right: 2px solid #3b82f6 !important;
          border-bottom: 2px solid #3b82f6 !important;
          border-left: 2px solid #3b82f6 !important;
          border-color: #3b82f6 !important;
          background: #3b82f6 !important;
          background-color: #3b82f6 !important;
          color: white !important;
          outline: none !important;
        }

        .form-section {
          background: white;
          padding: 1.5rem;
          border-radius: 12px;
          margin-bottom: 1.5rem;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .form-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem;
          margin-bottom: 0.75rem;
        }

        .form-group {
          margin-bottom: 0.75rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: #333;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid #e1e5e9;
          border-radius: 8px;
          font-size: 1rem;
          transition: border-color 0.3s ease;
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #667eea;
        }

        .form-group textarea {
          resize: vertical;
          min-height: 80px;
          font-family: inherit;
          line-height: 1.5;
        }

        .budget-info,
        .regulation-info {
          margin-top: 0.5rem;
          padding: 0.75rem;
          background: #f8f9fa;
          border-radius: 6px;
          font-size: 0.9rem;
          color: #666;
          border-left: 4px solid #667eea;
        }

        .budget-info span {
          display: block;
          margin-bottom: 0.25rem;
        }

        .budget-info span:last-child {
          margin-bottom: 0;
          font-weight: 600;
          color: #28a745;
        }

        .department-info {
          margin-top: 0.5rem;
          padding: 0.5rem;
          background: #f8f9fa;
          border-radius: 4px;
          font-size: 0.9rem;
          color: #666;
          border-left: 3px solid #28a745;
        }

        .department-info span {
          display: block;
          margin-bottom: 0.25rem;
        }

        .department-info span:last-child {
          margin-bottom: 0;
          font-weight: 600;
          color: #28a745;
        }

        .department-selector {
          position: relative;
        }

        .department-select-btn {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid #e1e5e9;
          border-radius: 8px;
          background: white;
          text-align: left;
          cursor: pointer;
          font-size: 1rem;
          transition: border-color 0.3s ease;
        }

        .department-select-btn:hover {
          border-color: #667eea;
        }

        .selected-departments {
          margin-top: 0.5rem;
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .selected-department-tag {
          display: flex;
          align-items: center;
          background: #10b981;
          color: white;
          padding: 0.25rem 0.5rem;
          border-radius: 16px;
          font-size: 0.9rem;
          font-weight: 600;
        }

        .remove-department-btn {
          background: none;
          border: none;
          color: white;
          margin-left: 0.5rem;
          cursor: pointer;
          font-size: 0.8rem;
          padding: 0;
          width: 16px;
          height: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: background-color 0.3s ease;
        }

        .remove-department-btn:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        /* 부서 선택 팝업 스타일 */
        .department-popup {
          background: white;
          border-radius: 12px;
          width: 90%;
          max-width: 500px;
          max-height: 60vh;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }

        .department-search {
          padding: 1rem;
          border-bottom: 1px solid #e1e5e9;
        }

        .department-search input {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid #e1e5e9;
          border-radius: 8px;
          font-size: 1rem;
          transition: border-color 0.3s ease;
        }

        .department-search input:focus {
          outline: none;
          border-color: #667eea;
        }

        .department-list {
          max-height: 300px;
          overflow-y: auto;
          padding: 0.5rem;
        }

        .department-item {
          padding: 0.75rem;
          border: 1px solid #e1e5e9;
          border-radius: 6px;
          margin-bottom: 0.25rem;
          cursor: pointer;
          transition: all 0.3s ease;
          background: white;
        }

        .department-item:hover {
          border-color: #667eea;
          background: #f8f9fa;
        }

        .department-name {
          font-weight: 600;
          color: #333;
          margin-bottom: 0.25rem;
        }

        .department-description {
          font-size: 0.9rem;
          color: #666;
        }

        /* 비용분배 스타일 */
        .cost-allocation-section {
          margin-top: 1rem;
          padding: 1rem;
          background: #f8f9fa;
          border-radius: 8px;
          border: 1px solid #e1e5e9;
        }

        .allocation-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .allocation-header h4 {
          margin: 0;
          color: #333;
          font-size: 1rem;
        }

        .add-allocation-btn {
          background: #28a745;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 600;
        }

        .allocation-item {
          background: white;
          padding: 1rem;
          border-radius: 6px;
          margin-bottom: 0.5rem;
          border: 1px solid #e1e5e9;
        }

        .remove-allocation-btn {
          background: #ef4444;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 600;
        }

        .allocation-summary {
          margin-top: 1rem;
          padding: 1rem;
          background: white;
          border-radius: 6px;
          border: 1px solid #e1e5e9;
        }

        .allocation-totals {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5rem;
          font-weight: 600;
        }

        .allocation-status {
          display: flex;
          justify-content: space-between;
          gap: 1rem;
        }

        .allocation-status .valid {
          color: #28a745;
          font-weight: 600;
        }

        .allocation-status .invalid {
          color: #dc3545;
          font-weight: 600;
        }

        .allocation-summary {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          background: #e3f2fd;
          border-radius: 6px;
          margin-top: 0.5rem;
        }

        /* 자동 합산 내역 스타일 */
        .auto-summary-section {
          margin-top: 2rem;
          background: #f8f9fa;
          border: 1px solid #e1e5e9;
          border-radius: 8px;
        }

        .auto-summary-content {
          padding: 1rem;
        }

        .summary-table {
          background: white;
          border-radius: 6px;
          overflow: hidden;
          border: 1px solid #e1e5e9;
          margin-bottom: 1rem;
        }

        .summary-header {
          display: grid;
          grid-template-columns: 2fr 2fr 1fr;
          background: #3b82f6;
          color: white;
          font-weight: 600;
        }

        .header-cell {
          padding: 0.75rem;
          text-align: center;
        }

        .summary-row {
          display: grid;
          grid-template-columns: 2fr 2fr 1fr;
          border-bottom: 1px solid #e1e5e9;
        }

        .summary-row:last-child {
          border-bottom: none;
        }

        .summary-cell {
          padding: 0.75rem;
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .summary-cell.department-name {
          font-weight: 600;
          color: #333;
          justify-content: flex-start;
        }

        .summary-cell.amount {
          font-weight: 600;
          color: #28a745;
        }

        .summary-cell.percentage {
          font-weight: 600;
          color: #667eea;
        }

        .summary-footer {
          background: white;
          padding: 1rem;
          border-radius: 6px;
          border: 1px solid #e1e5e9;
        }

        .summary-total {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5rem;
          font-weight: 600;
          font-size: 1.1rem;
        }

        .summary-status {
          text-align: center;
        }

        .summary-status .valid {
          color: #28a745;
          font-weight: 600;
        }

        .summary-status .invalid {
          color: #dc3545;
          font-weight: 600;
        }

        .auto-allocation-item {
          background: #f8f9fa;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 0.5rem;
          border: 1px solid #e1e5e9;
        }

        .no-allocation {
          text-align: center;
          padding: 2rem;
          color: #666;
          background: #f8f9fa;
          border-radius: 8px;
          border: 2px dashed #e1e5e9;
        }

        .budget-selector {
          position: relative;
        }

        .budget-select-btn {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid #e1e5e9;
          border-radius: 8px;
          background: white;
          text-align: left;
          cursor: pointer;
          font-size: 1rem;
          transition: border-color 0.3s ease;
        }

        .budget-select-btn:hover {
          border-color: #667eea;
        }

        .budget-select-btn:focus {
          outline: none;
          border-color: #667eea;
        }

        /* 팝업 스타일 */
        .popup-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .budget-popup {
          background: white;
          border-radius: 12px;
          width: 90%;
          max-width: 800px;
          max-height: 80vh;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }

        .preview-popup {
          background: white;
          border-radius: 8px;
          width: 99%;
          max-width: 1600px;
          max-height: 97vh;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
          border: 1px solid #e0e0e0;
        }

        /* 자유양식 설명 스타일 */
        .freeform-description {
          background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
          padding: 20px;
          border-radius: 12px;
          margin-bottom: 20px;
          border-left: 5px solid #2196f3;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .freeform-description p {
          margin: 8px 0;
          font-size: 16px;
          color: #1976d2;
          font-weight: 500;
        }

        .freeform-description p:first-child {
          font-size: 18px;
          font-weight: 600;
          color: #0d47a1;
        }

        /* 포멀한 워드 문서 스타일 */
        .formal-document {
          font-family: 'Malgun Gothic', '맑은 고딕', sans-serif;
          line-height: 1.8;
          color: #000 !important;
          background: white;
          padding: 50px;
          max-width: 280mm;
          min-height: 297mm;
          margin: 0 auto;
          box-shadow: 0 0 20px rgba(0,0,0,0.1);
          page-break-inside: avoid;
        }

        /* 미리보기 내부 모든 텍스트를 검은색으로 강제 */
        .formal-document td,
        .formal-document th,
        .formal-document span,
        .formal-document div {
          color: #000 !important;
        }

        /* 미리보기 내부 모든 색상을 검은색으로 강제 */
        .formal-document * {
          color: #000 !important;
        }

        .document-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #000;
        }

        .company-info .company-name {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 5px;
        }

        .company-info .company-address,
        .company-info .company-contact {
          font-size: 12px;
          margin: 2px 0;
        }

        .document-meta {
          text-align: right;
          font-size: 12px;
        }

        .document-meta .label {
          font-weight: bold;
          margin-right: 5px;
        }

        .document-title {
          text-align: center;
          margin: 40px 0;
        }

        .main-title {
          font-size: 28px;
          font-weight: bold;
          letter-spacing: 8px;
          margin: 0;
        }

        .title-underline {
          width: 200px;
          height: 3px;
          background: #000;
          margin: 15px auto;
        }

        .document-body {
          margin-top: 30px;
        }

        .section-title {
          font-size: 18px;
          font-weight: bold;
          margin: 30px 0 15px 0;
          padding-bottom: 5px;
          border-bottom: 1px solid #000;
          color: #000;
        }

        .info-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
          font-size: 14px;
        }

        .info-table td {
          border: 1px solid #000;
          padding: 8px 12px;
          vertical-align: top;
        }

        .label-cell {
          background: #f5f5f5;
          font-weight: bold;
          width: 20%;
          text-align: center;
          color: #000;
        }

        .value-cell {
          width: 30%;
        }

        .total-amount-box {
          text-align: center;
          border: 2px solid #000;
          padding: 15px;
          margin: 15px 0;
          background: white;
          max-width: 400px;
          margin-left: auto;
          margin-right: auto;
        }

        .amount-label {
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 10px;
          color: #000;
        }

        .amount-value {
          font-size: 20px;
          font-weight: bold;
          color: #000;
          margin-bottom: 5px;
        }

        .amount-korean {
          font-size: 14px;
          color: #000;
        }

        .details-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
          font-size: 12px;
        }

        .details-table th,
        .details-table td {
          border: 1px solid #000;
          padding: 8px;
          text-align: left;
        }

        .details-table th {
          background: #f5f5f5;
          font-weight: bold;
          text-align: center;
          color: #000;
        }

        .details-table .text-center {
          text-align: center;
        }

        .details-table .text-right {
          text-align: right;
        }

        .amount-highlight {
          font-weight: bold;
          color: #000 !important;
        }

        .total-row {
          background: white;
          font-weight: bold;
          border-top: 2px solid #000;
        }

        .total-label {
          text-align: center;
          color: #000;
          font-weight: bold;
        }

        .total-amount {
          text-align: center;
          font-weight: bold;
          color: #000;
        }

        .no-data-box {
          text-align: center;
          padding: 30px;
          border: 1px solid #000;
          background: white;
          color: #000;
        }

        .basis-content {
          border: 1px solid #000;
          padding: 15px;
          min-height: 80px;
          background: white;
          font-size: 14px;
        }

        .approval-line {
          display: flex;
          justify-content: space-around;
          margin: 20px 0;
        }

        .approval-step {
          text-align: center;
          flex: 1;
        }

        .step-title {
          font-size: 14px;
          font-weight: bold;
          margin-bottom: 10px;
        }

        .step-box {
          border: 1px solid #000;
          width: 80px;
          height: 60px;
          margin: 0 auto 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .signature-area {
          font-size: 12px;
        }

        .step-date {
          font-size: 11px;
        }

        .document-footer {
          margin-top: 50px;
        }

        .footer-line {
          border-top: 1px solid #000;
          margin-bottom: 20px;
        }

        .footer-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;
        }

        .department-signature {
          display: flex;
          gap: 30px;
        }

        .company-info {
          flex: 1;
        }

        .company-name {
          font-size: 1.8rem;
          font-weight: 700;
          color: #2c3e50;
          margin: 0 0 0.5rem 0;
          letter-spacing: -0.5px;
        }

        .company-address {
          font-size: 0.95rem;
          color: #6c757d;
          margin: 0 0 0.25rem 0;
        }

        .company-contact {
          font-size: 0.9rem;
          color: #6c757d;
          margin: 0;
          font-weight: 500;
        }

        .document-title {
          text-align: center;
          flex: 1;
        }

        .main-title {
          font-size: 2.5rem;
          font-weight: 800;
          color: #1a252f;
          margin: 0 0 1rem 0;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
        }

        .document-number,
        .document-date {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 0.5rem;
          margin: 0.5rem 0;
        }

        .document-number .label,
        .document-date .label {
          font-weight: 600;
          color: #495057;
          font-size: 0.9rem;
        }

        .document-number .value,
        .document-date .value {
          font-weight: 500;
          color: #6c757d;
          font-size: 0.9rem;
        }

        .document-body {
          padding: 2rem;
        }

        .formal-section {
          margin-bottom: 2.5rem;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          overflow: hidden;
        }

        .section-title {
          background: linear-gradient(135deg, #495057 0%, #6c757d 100%);
          color: white;
          padding: 1rem 1.5rem;
          margin: 0;
          font-size: 1.2rem;
          font-weight: 600;
          letter-spacing: 0.5px;
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1rem;
          padding: 1.5rem;
          background: #f8f9fa;
        }

        .info-item {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .info-label {
          font-weight: 600;
          color: #495057;
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .info-value {
          font-size: 1rem;
          color: #2c3e50;
          padding: 0.5rem;
          background: white;
          border-radius: 4px;
          border-left: 4px solid #dee2e6;
          min-height: 2.5rem;
          display: flex;
          align-items: center;
        }

        .amount-summary {
          padding: 1.5rem;
          background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
        }

        .total-amount-display {
          text-align: center;
          padding: 2rem;
          background: white;
          border-radius: 8px;
          border: 2px solid #2196f3;
          box-shadow: 0 4px 12px rgba(33, 150, 243, 0.2);
        }

        .amount-label {
          display: block;
          font-size: 1.1rem;
          font-weight: 600;
          color: #1976d2;
          margin-bottom: 1rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .amount-value {
          display: block;
          font-size: 2.5rem;
          font-weight: 800;
          color: #1565c0;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
        }

        .no-data {
          text-align: center;
          padding: 2rem;
          color: #6c757d;
          font-style: italic;
          background: #f8f9fa;
          border-radius: 4px;
          margin: 1rem 0;
        }

        .preview-content {
          padding: 1.5rem;
          max-height: calc(97vh - 80px);
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: #cbd5e0 #f7fafc;
        }
        
        .preview-content::-webkit-scrollbar {
          width: 8px;
        }
        
        .preview-content::-webkit-scrollbar-track {
          background: #f7fafc;
          border-radius: 4px;
        }
        
        .preview-content::-webkit-scrollbar-thumb {
          background: #cbd5e0;
          border-radius: 4px;
        }
        
        .preview-content::-webkit-scrollbar-thumb:hover {
          background: #a0aec0;
        }

        /* 팝업 컨트롤 */
        .popup-controls {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .size-control-btn {
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          padding: 0.5rem;
          border-radius: 4px;
          cursor: pointer;
          font-size: 1rem;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
        }

        .size-control-btn:hover {
          background: #e9ecef;
          border-color: #adb5bd;
          transform: scale(1.05);
        }

        /* 리사이즈 핸들 */
        .resize-handles {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
        }

        .resize-handle {
          position: absolute;
          pointer-events: all;
          background: transparent;
          z-index: 1000;
        }

        .resize-handle-right {
          top: 0;
          right: 0;
          width: 10px;
          height: 100%;
          cursor: ew-resize;
        }

        .resize-handle-bottom {
          bottom: 0;
          left: 0;
          width: 100%;
          height: 10px;
          cursor: ns-resize;
        }

        .resize-handle-corner {
          bottom: 0;
          right: 0;
          width: 20px;
          height: 20px;
          cursor: nw-resize;
          background: linear-gradient(-45deg, transparent 0%, transparent 40%, #999 40%, #999 60%, transparent 60%);
        }

        .resize-handle-corner:hover {
          background: linear-gradient(-45deg, transparent 0%, transparent 40%, #666 40%, #666 60%, transparent 60%);
        }

        /* 리사이즈 중일 때 */
        .resizable-popup.resizing {
          user-select: none;
        }

        .resizable-popup.resizing * {
          user-select: none;
          pointer-events: none;
        }

        .resizable-popup.resizing .resize-handle {
          pointer-events: all;
        }

        .preview-section {
          margin-bottom: 2rem;
          padding: 1rem;
          border: 1px solid #e1e5e9;
          border-radius: 8px;
          background: #f8f9fa;
        }

        .preview-section h4 {
          margin: 0 0 0.5rem 0;
          color: #333;
          font-size: 1.1rem;
          font-weight: 600;
          border-bottom: 2px solid #667eea;
          padding-bottom: 0.5rem;
        }

        .preview-section p {
          margin: 0.5rem 0;
          color: #555;
          line-height: 1.5;
        }

        .preview-items {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .preview-item {
          background: white;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 1rem;
        }

        .item-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid #e1e5e9;
        }

        .item-number {
          background: #3b82f6;
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .item-details p {
          margin: 0.25rem 0;
          font-size: 0.9rem;
        }

        .total-amount-preview {
          font-size: 1.5rem;
          font-weight: 700;
          color: #28a745;
          text-align: center;
          padding: 1rem;
          background: #d4edda;
          border-radius: 8px;
          margin: 1rem 0;
        }

        .preview-approval-line {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .preview-step {
          display: flex;
          align-items: center;
          gap: 1rem;
          background: white;
          padding: 1rem;
          border-radius: 8px;
          border: 1px solid #e1e5e9;
        }

        .preview-step .step-number {
          background: #667eea;
          color: white;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 0.9rem;
        }

        .preview-step .step-info {
          flex: 1;
        }

        .preview-step .step-info p {
          margin: 0.25rem 0;
          font-size: 0.9rem;
        }

        .preview-step .step-description {
          color: #666;
          font-size: 0.8rem;
          font-style: italic;
        }

        .popup-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem 2rem;
          border-bottom: 2px solid #e1e5e9;
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          border-radius: 8px 8px 0 0;
        }

        .header-left {
          display: flex;
          align-items: center;
          flex: 1;
        }

        .popup-header h3 {
          margin: 0;
          color: #2d3748;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .popup-close {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #666;
          padding: 0.5rem;
          border-radius: 4px;
          transition: background-color 0.3s ease;
        }

        .popup-close:hover {
          background: #e1e5e9;
        }

        .popup-filters {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          padding: 1.5rem;
          border-bottom: 1px solid #e1e5e9;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
        }

        .filter-group label {
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: #333;
        }

        .filter-group select {
          padding: 0.5rem;
          border: 1px solid #e1e5e9;
          border-radius: 4px;
          font-size: 0.9rem;
        }

        .budget-list {
          max-height: 400px;
          overflow-y: auto;
          padding: 1rem;
        }

        .budget-item {
          padding: 1rem;
          border: 1px solid #e1e5e9;
          border-radius: 8px;
          margin-bottom: 0.5rem;
          cursor: pointer;
          transition: all 0.3s ease;
          background: white;
        }

        .budget-item:hover {
          border-color: #667eea;
          background: #f8f9fa;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .budget-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .budget-header h4 {
          margin: 0;
          color: #333;
          font-size: 1rem;
        }

        .budget-year {
          background: #667eea;
          color: white;
          padding: 0.25rem 0.5rem;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .budget-details {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
          font-size: 0.9rem;
        }

        .budget-type {
          color: #666;
        }

        .budget-amount {
          color: #333;
          font-weight: 600;
        }

        .budget-remaining {
          color: #28a745;
          font-weight: 600;
        }

        .budget-progress {
          height: 4px;
          background: #e1e5e9;
          border-radius: 2px;
          overflow: hidden;
        }

        .progress-bar {
          height: 100%;
          background: #667eea;
          transition: width 0.3s ease;
        }

        .no-results {
          text-align: center;
          padding: 2rem;
          color: #666;
        }

        @media (max-width: 768px) {
          .popup-filters {
            grid-template-columns: 1fr;
          }
          
          .budget-details {
            grid-template-columns: 1fr;
            gap: 0.25rem;
          }
        }

        .recommendation {
          margin-top: 0.5rem;
          color: #667eea;
          font-size: 0.9rem;
          font-weight: 600;
        }

        .add-btn {
          background: #28a745;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          margin-bottom: 1rem;
          font-weight: 600;
        }

        .purchase-item,
        .service-item,
        .cost-department-item {
          background: #f8f9fa;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1rem;
          border: 1px solid #e1e5e9;
        }

        .purchase-item-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid #e1e5e9;
        }

        .purchase-item-header h4 {
          margin: 0;
          color: #333;
          font-size: 1rem;
        }

        .remove-item-btn {
          background: #dc3545;
          color: white;
          border: none;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .purchase-item-content {
          padding: 0;
        }

        .form-row.compact {
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 0.75rem;
          margin-bottom: 0.75rem;
        }

        .form-row.compact .form-group {
          margin-bottom: 0.5rem;
        }

        .form-row.compact .form-group label {
          font-size: 0.9rem;
          margin-bottom: 0.25rem;
        }

        .form-row.compact .form-group input,
        .form-row.compact .form-group select {
          padding: 0.5rem;
          font-size: 0.9rem;
        }

        .amount-field {
          background: #e9ecef;
          font-weight: 600;
          color: #495057;
        }

        /* 좁은 입력 필드 (인원수, 기간 등) */
        .narrow-input {
          max-width: 120px;
          flex-shrink: 0;
        }

        .narrow-input input {
          text-align: center;
        }

        /* 계약기간 날짜 입력 스타일 */
        .contract-period-dates {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .date-input-wrapper {
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .date-sub-label {
          font-size: 12px;
          color: #6b7280;
          font-weight: 500;
          white-space: nowrap;
        }

        .contract-date-input {
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          color: #374151;
          background: white;
          height: 40px;
          min-width: 140px;
        }

        .contract-date-input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        /* 총 계약금액 중앙정렬 */
        .total-contract-amount {
          text-align: center;
          font-size: 18px;
          font-weight: bold;
          color: #1f2937;
          margin: 20px 0;
          padding: 15px;
          background: #f3f4f6;
          border-radius: 8px;
          border: 2px solid #e5e7eb;
        }

        /* 용역내역 필드 가독성 개선 */
        .service-item {
          background: #ffffff;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 20px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }

        /* 첫 번째 행: 항목, 인원수, 기술등급, 기간, 단가, 계약금액 */
        .service-item .service-main-row {
          display: grid;
          grid-template-columns: 2fr 100px 120px 100px 150px 150px;
          gap: 12px;
          margin-bottom: 15px;
          align-items: end;
        }

        /* 두 번째 행: 공급업체, 신용등급, 삭제버튼 */
        .service-item .service-sub-row {
          display: grid;
          grid-template-columns: 2fr 1fr 120px;
          gap: 12px;
          margin-bottom: 10px;
          align-items: end;
        }

        .service-item .form-group {
          margin-bottom: 0;
        }

        .service-item .form-group label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 6px;
        }

        .service-item .form-group input,
        .service-item .form-group select {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          background: white;
        }

        .service-item .form-group input:focus,
        .service-item .form-group select:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .service-item .form-group input[readonly] {
          background: #f9fafb;
          color: #6b7280;
          font-weight: 600;
        }

        /* 용역항목 삭제 버튼 */
        .remove-service-btn {
          background: #ef4444;
          color: white;
          border: none;
          padding: 10px 15px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          height: fit-content;
        }

        .remove-service-btn:hover {
          background: #dc2626;
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(239, 68, 68, 0.3);
        }

        .remove-service-btn:active {
          transform: translateY(0);
          box-shadow: 0 2px 4px rgba(239, 68, 68, 0.3);
        }

        /* 용역내역 계약기간 스타일 */
        .service-contract-period {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .service-date-wrapper {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .service-date-label {
          font-size: 11px;
          color: #6b7280;
          font-weight: 500;
          white-space: nowrap;
        }

        .service-date-input {
          padding: 6px 8px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-size: 12px;
          color: #374151;
          background: white;
          height: 32px;
          min-width: 120px;
        }

        .service-date-input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
        }

        /* 신규품목 내역 한 줄 레이아웃 */
        .purchase-item-single-line {
          grid-template-columns: 2fr 2fr 1fr 1.5fr 1.5fr 2fr 1.5fr;
          gap: 0.75rem;
          margin-bottom: 1rem;
          align-items: end;
        }

        .purchase-item-single-line .form-group {
          margin-bottom: 0;
        }

        .purchase-item-single-line .compact-field {
          min-width: 100px;
        }

        .purchase-item-single-line .compact-field input {
          padding: 0.5rem;
          font-size: 0.9rem;
          height: 38px;
        }

        .purchase-item-single-line .compact-field label {
          font-size: 0.9rem;
          margin-bottom: 0.25rem;
        }

        .purchase-item-single-line input,
        .purchase-item-single-line select {
          height: 38px;
          box-sizing: border-box;
        }

        .purchase-item-single-line select {
          font-size: 0.9rem;
        }

        .purchase-item-single-line .korean-amount {
          font-size: 0.75rem;
          margin-top: 0.25rem;
        }

        /* 비용귀속부서 분배 섹션 레이아웃 */
        .allocation-row {
          display: flex;
          gap: 0.75rem;
          align-items: end;
        }

        .allocation-row .compact-field {
          min-width: 100px;
        }

        .allocation-row .compact-field input,
        .allocation-row .compact-field select {
          padding: 0.5rem;
          font-size: 0.9rem;
          height: 38px;
        }

        .allocation-row .compact-field label {
          font-size: 0.9rem;
          margin-bottom: 0.25rem;
        }

        .allocation-row input,
        .allocation-row select {
          height: 38px;
          box-sizing: border-box;
        }

        .allocation-row select {
          font-size: 0.9rem;
        }

        .allocation-row .remove-allocation-btn {
          margin-top: 0;
          height: 38px;
          align-self: center;
          margin-left: auto;
          min-width: 60px;
        }



        .korean-amount {
          margin-top: 0.25rem;
          font-size: 0.8rem;
          color: #666;
          font-style: italic;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .section-header h3 {
          margin: 0;
        }

        /* 추천 기능 스타일 */
        .input-with-suggestions {
          position: relative;
        }

        .suggestions-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: white;
          border: 1px solid #e1e5e9;
          border-radius: 6px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          z-index: 9999;
          max-height: 200px;
          overflow-y: auto;
          overflow-x: visible;
          margin-top: 2px;
        }

        .suggestion-item {
          padding: 0.75rem;
          cursor: pointer;
          border-bottom: 1px solid #f1f3f4;
          transition: background-color 0.2s ease;
        }

        .suggestion-item:hover {
          background: #f8f9fa;
        }

        .suggestion-item:last-child {
          border-bottom: none;
        }

        .suggestion-main {
          font-weight: 600;
          color: #333;
          margin-bottom: 0.25rem;
        }

        .suggestion-details {
          font-size: 0.8rem;
          color: #666;
        }

        .price-range {
          color: #28a745;
          font-weight: 600;
        }

        .total-verification {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          background: #e3f2fd;
          border-radius: 8px;
          margin-top: 1rem;
        }

        .total-verification .valid {
          color: #28a745;
          font-weight: 600;
        }

        .total-verification .invalid {
          color: #dc3545;
          font-weight: 600;
        }

        .total-amount {
          text-align: center;
          padding: 1rem;
          background: #d4edda;
          border-radius: 8px;
          margin-top: 1rem;
        }

        .total-amount h4 {
          margin: 0;
          color: #155724;
          font-size: 1.2rem;
        }

        .total-amount-center {
          text-align: center;
          padding: 1rem;
          background: #d4edda;
          border-radius: 8px;
          margin: 1rem 0;
          border: 2px solid #c3e6cb;
        }

        .total-amount-center h4 {
          margin: 0;
          color: #155724;
          font-size: 1.3rem;
          font-weight: bold;
        }

        .approval-flow {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
          justify-content: center;
          margin-bottom: 1.5rem;
        }

        .approval-step {
          display: flex;
          align-items: center;
          gap: 1rem;
          background: #f8f9fa;
          padding: 1.5rem;
          border-radius: 12px;
          border: 2px solid #e1e5e9;
          min-width: 200px;
          position: relative;
        }

        .approval-step.conditional {
          border-color: #ffc107;
          background: #fff3cd;
        }

        .approval-step.final {
          border-color: #28a745;
          background: #d4edda;
        }

        .step-number {
          background: #667eea;
          color: white;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 1.1rem;
        }

        .step-content {
          flex: 1;
        }

        .step-name {
          font-weight: 600;
          color: #333;
          font-size: 1rem;
          margin-bottom: 0.25rem;
        }

        .step-title {
          color: #666;
          font-size: 0.9rem;
          margin-bottom: 0.5rem;
        }

        .step-description {
          color: #888;
          font-size: 0.8rem;
          line-height: 1.4;
        }

        .conditional-badge {
          position: absolute;
          top: -8px;
          right: -8px;
          background: #f59e0b;
          color: #333;
          padding: 0.25rem 0.5rem;
          border-radius: 12px;
          font-size: 0.7rem;
          font-weight: 600;
        }

        .step-arrow {
          color: #667eea;
          font-size: 1.5rem;
          font-weight: bold;
        }

        .form-actions {
          display: flex !important;
          flex-direction: row !important;
          justify-content: center !important;
          align-items: center !important;
          gap: 1rem !important;
          margin-top: 2rem !important;
          padding: 1.5rem !important;
          background: #f8f9fa !important;
          border-radius: 12px !important;
          border: 1px solid #e1e5e9 !important;
        }

        .submit-btn {
          background: #3b82f6 !important;
          color: white !important;
          border: none !important;
          padding: 0.75rem 1.5rem !important;
          border-radius: 6px !important;
          font-size: 1rem !important;
          font-weight: 600 !important;
          cursor: pointer !important;
          transition: all 0.3s ease !important;
          min-width: 120px !important;
          width: auto !important;
          height: 44px !important;
          line-height: 1.2 !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          vertical-align: middle !important;
          margin: 0 !important;
        }

        .submit-btn:hover {
          background: #2563eb !important;
          transform: translateY(-1px) !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15) !important;
        }

        .draft-btn {
          background: linear-gradient(135deg, #6c757d 0%, #495057 100%) !important;
          color: white !important;
          border: none !important;
          padding: 0.75rem 1.5rem !important;
          border-radius: 8px !important;
          font-size: 1rem !important;
          font-weight: 600 !important;
          cursor: pointer !important;
          transition: all 0.3s ease !important;
          min-width: 140px !important;
          width: auto !important;
          height: 48px !important;
          line-height: 1.2 !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          vertical-align: middle !important;
          margin: 0 !important;
          position: relative !important;
          overflow: hidden !important;
        }

        .draft-btn:hover {
          background: linear-gradient(135deg, #5a6268 0%, #343a40 100%) !important;
          transform: translateY(-2px) !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2) !important;
        }

        .draft-btn:disabled {
          background: #adb5bd !important;
          cursor: not-allowed !important;
          transform: none !important;
          box-shadow: none !important;
        }

        .draft-btn::before {
          content: '💾' !important;
          margin-right: 0.5rem !important;
          font-size: 1.1rem !important;
        }
        
        .debug-btn {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%) !important;
          color: #212529 !important;
          border: none !important;
          padding: 0.75rem 1.5rem !important;
          border-radius: 8px !important;
          font-size: 1rem !important;
          font-weight: 600 !important;
          cursor: pointer !important;
          transition: all 0.3s ease !important;
          min-width: 140px !important;
          width: auto !important;
          height: 48px !important;
          line-height: 1.2 !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          vertical-align: middle !important;
          margin: 0 0 0 0.5rem !important;
          position: relative !important;
          overflow: hidden !important;
        }
        
        .debug-btn:hover {
          background: linear-gradient(135deg, #e0a800 0%, #c69500 100%) !important;
          transform: translateY(-2px) !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2) !important;
        }
        
        .debug-btn::before {
          content: '🐛' !important;
          margin-right: 0.5rem !important;
          font-size: 1.1rem !important;
        }

        .preview-btn {
          background: linear-gradient(135deg, #17a2b8 0%, #138496 100%);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          min-width: 140px;
          height: 48px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin: 0 8px;
          box-shadow: 0 2px 4px rgba(23, 162, 184, 0.3);
        }

        .preview-btn:hover {
          background: linear-gradient(135deg, #138496 0%, #0f7a8a 100%);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(23, 162, 184, 0.4);
        }

        .loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          text-align: center;
        }

        .spinner {
          width: 50px;
          height: 50px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-top: 1rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .type-buttons {
            grid-template-columns: 1fr;
          }
          
          .form-row {
            grid-template-columns: 1fr;
          }
          
          .approval-flow {
            flex-direction: column;
            gap: 0.5rem;
          }

          .approval-step {
            width: 100%;
            min-width: auto;
            padding: 1rem;
          }

          .step-arrow {
            transform: rotate(90deg);
            margin: 0.5rem 0;
          }

          .form-actions {
            flex-direction: column;
            align-items: center;
            gap: 1rem;
          }

          .draft-btn,
          .preview-btn,
          .submit-btn {
            width: 100%;
            max-width: 300px;
          }

          .total-verification {
            flex-direction: column;
            gap: 0.5rem;
          }
          }

                  .preview-popup {
          width: 98%;
          max-height: 95vh;
          background: white;
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          overflow: hidden;
        }

        .popup-header {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white;
          padding: 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid rgba(255,255,255,0.2);
        }

        .popup-header h3 {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 700;
        }

        .popup-close {
          background: rgba(255,255,255,0.2);
          border: none;
          color: white;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 1.2rem;
          transition: all 0.3s ease;
        }

        .popup-close:hover {
          background: rgba(255,255,255,0.3);
          transform: scale(1.1);
        }

        .preview-content {
          padding: 2rem;
          max-height: 70vh;
          overflow-y: auto;
          background: #f8f9fa;
        }

        .preview-section {
          background: white;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          border-left: 4px solid #667eea;
        }

        .preview-section h4 {
          margin: 0 0 1rem 0;
          color: #333;
          font-size: 1.2rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .preview-value {
          font-size: 1.1rem;
          color: #555;
          line-height: 1.6;
          margin: 0;
          padding: 0.75rem;
          background: #f8f9fa;
          border-radius: 8px;
          border-left: 3px solid #28a745;
        }

        .total-section {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          border-left: 4px solid #fff;
        }

        .total-section h4 {
          color: white;
        }

        .total-amount-preview {
          font-size: 1.5rem;
          font-weight: 700;
          color: white;
          text-align: center;
          margin: 0;
          padding: 1rem;
          background: rgba(255,255,255,0.2);
          border-radius: 8px;
        }

        .preview-items {
          display: grid;
          gap: 1rem;
        }

        .preview-item {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 1rem;
          border: 1px solid #e1e5e9;
        }

        .item-header {
          margin-bottom: 1rem;
        }

        .item-number {
          background: #667eea;
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-weight: 600;
          font-size: 0.9rem;
        }

        .item-details p {
          margin: 0.5rem 0;
          color: #555;
          line-height: 1.5;
        }

        .item-details strong {
          color: #333;
          font-weight: 600;
        }

        .preview-approval-line {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .preview-step {
          display: flex;
          align-items: center;
          gap: 1rem;
          background: #f8f9fa;
          padding: 1rem;
          border-radius: 8px;
          border: 1px solid #e1e5e9;
        }

        .preview-step .step-number {
          background: #667eea;
          color: white;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1.1rem;
          flex-shrink: 0;
        }

        .preview-step .step-info {
          flex: 1;
        }

        .preview-step .step-info p {
          margin: 0.25rem 0;
          color: #555;
        }

        .preview-step .step-info strong {
          color: #333;
          font-weight: 600;
        }

        .preview-step .step-description {
          font-size: 0.9rem;
          color: #666;
          font-style: italic;
        }

        .preview-step {
          flex-direction: column;
          text-align: center;
        }

        .preview-step .step-number {
          margin-bottom: 0.5rem;
        }

        /* 품의서 헤더 스타일 */
        .proposal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid #667eea;
        }

        .proposal-header h1 {
          margin: 0;
          color: #333;
          font-size: 2rem;
          font-weight: 700;
        }

        .proposal-id {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: #667eea;
          color: white;
          padding: 0.75rem 1.5rem;
          border-radius: 25px;
          font-weight: 600;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }

        .proposal-id .id-label {
          font-size: 0.9rem;
          opacity: 0.9;
        }

        .proposal-id .id-value {
          font-size: 1.1rem;
          font-weight: 700;
          background: rgba(255, 255, 255, 0.2);
          padding: 0.25rem 0.75rem;
          border-radius: 15px;
          min-width: 60px;
          text-align: center;
        }

        /* 임시저장 확인 팝업 스타일 */
        .save-confirm-popup {
          background: #f8f9fa !important;
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
          max-width: 500px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
          animation: slideIn 0.3s ease-out;
          position: relative;
          z-index: 1001;
        }

        .save-confirm-content {
          padding: 2rem;
          background: #f8f9fa !important;
          position: relative;
          z-index: 1;
        }

        .confirm-message {
          text-align: center;
          margin-bottom: 2rem;
          background: #ffffff !important;
          padding: 1.5rem;
          border-radius: 8px;
          border: 1px solid #e1e5e9;
          position: relative;
          z-index: 1;
        }

        .confirm-message p {
          margin: 0.5rem 0;
          font-size: 1.1rem;
          color: #333;
          background: #ffffff;
          padding: 0.25rem 0;
        }

        .confirm-message p:first-child {
          font-weight: 600;
          color: #667eea;
        }

        .navigation-target {
          font-size: 0.9rem;
          color: #666;
          font-style: italic;
          margin-top: 0.5rem;
          padding: 0.75rem;
          background: #f8f9fa !important;
          border-radius: 6px;
          border-left: 3px solid #667eea;
          display: inline-block;
          position: relative;
          z-index: 1;
        }

        .confirm-buttons {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .confirm-buttons .btn {
          padding: 1rem 1.5rem;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          text-align: center;
        }

        .confirm-buttons .btn-primary {
          background: #3b82f6;
          color: white;
        }

        .confirm-buttons .btn-primary:hover {
          background: #2563eb;
          transform: translateY(-2px);
        }

        .confirm-buttons .btn-secondary {
          background: #6b7280;
          color: white;
        }

        .confirm-buttons .btn-secondary:hover {
          background: #4b5563;
          transform: translateY(-2px);
        }

        .confirm-buttons .btn-cancel {
          background: #ef4444;
          color: white;
        }

        .confirm-buttons .btn-cancel:hover {
          background: #dc2626;
          transform: translateY(-2px);
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 768px) {
          .proposal-header {
            flex-direction: column;
            gap: 1rem;
            text-align: center;
          }

          .proposal-header h1 {
            font-size: 1.5rem;
          }

          .proposal-id {
            font-size: 0.9rem;
            padding: 0.5rem 1rem;
          }
        }

        /* 구매품목별 요청부서 선택 스타일 (개선된 레이아웃) */
        .item-department-selector {
          position: relative;
        }

        .department-select-container {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 0.5rem;
        }

        .department-select {
          flex: 1;
          padding: 0.75rem;
          border: 2px solid #e1e5e9;
          border-radius: 8px;
          background: white;
          font-size: 1rem;
          transition: border-color 0.3s ease;
        }

        .department-select:focus {
          outline: none;
          border-color: #667eea;
        }

        .selected-count {
          padding: 0.5rem 0.75rem;
          background: #f8f9fa;
          border: 1px solid #e1e5e9;
          border-radius: 6px;
          font-size: 0.9rem;
          color: #666;
          white-space: nowrap;
        }

        .selected-item-departments-compact {
          display: flex;
          flex-wrap: wrap;
          gap: 0.25rem;
          margin-top: 0.25rem;
        }

        .selected-item-department-compact {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.25rem 0.5rem;
          background: #e3f2fd;
          color: #1976d2;
          border: 1px solid #bbdefb;
          border-radius: 4px;
          font-size: 0.8rem;
          max-width: 200px;
        }

        .dept-name {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .remove-dept-btn {
          background: none;
          border: none;
          color: #1976d2;
          cursor: pointer;
          font-size: 1rem;
          padding: 0;
          width: 16px;
          height: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .remove-dept-btn:hover {
          background: #bbdefb;
          color: #1565c0;
        }

        /* 신규품목 섹션 스타일 */
        .purchase-items-section {
          background: white;
          border-radius: 16px;
          padding: 2rem;
          margin: 2rem 0;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          width: 100%;
          max-width: 1400px;
        }

        .purchase-items-section .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .purchase-items-section .section-header h3 {
          color: #333;
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0;
          text-shadow: none;
        }

        .add-item-btn {
          background: #3b82f6;
          color: white;
          border: none;
          padding: 10px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: background-color 0.2s ease;
          box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
        }

        .add-item-btn:hover {
          background: #2563eb;
        }

        .add-item-btn .btn-icon {
          font-size: 16px;
          font-weight: bold;
        }

        .purchase-items-table-container {
          position: relative;
          overflow: visible;
        }

        .purchase-items-table {
          width: 100%;
          border-collapse: collapse;
          border-spacing: 0;
          background: white;
          border-radius: 8px;
          overflow: visible;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          border: 1px solid #e2e8f0;
          font-size: 14px;
        }

        .purchase-items-table th {
          background: #f8f9fa;
          color: #374151;
          padding: 12px 8px;
          text-align: center;
          font-weight: 600;
          font-size: 13px;
          border-bottom: 1px solid #e5e7eb;
          position: relative;
          white-space: nowrap;
        }

        .purchase-items-table th:first-child {
          border-top-left-radius: 8px;
        }

        .purchase-items-table th:last-child {
          border-top-right-radius: 8px;
        }

        /* 컬럼 너비 최적화 - 더 효율적인 공간 활용 */
        .purchase-items-table th:nth-child(1) { width: 14%; } /* 구분 */
        .purchase-items-table th:nth-child(2) { width: 22%; } /* 내역 */
        .purchase-items-table th:nth-child(3) { width: 7%; }  /* 수량 */
        .purchase-items-table th:nth-child(4) { width: 13%; } /* 단가 */
        .purchase-items-table th:nth-child(5) { width: 13%; } /* 금액 */
        .purchase-items-table th:nth-child(6) { width: 16%; } /* 공급업체 */
        .purchase-items-table th:nth-child(7) { width: 12%; } /* 계약기간 */
        .purchase-items-table th:nth-child(8) { width: 5%; }  /* 작업 */

        .purchase-items-table td:nth-child(1) { width: 14%; }
        .purchase-items-table td:nth-child(2) { width: 22%; }
        .purchase-items-table td:nth-child(3) { width: 7%; }
        .purchase-items-table td:nth-child(4) { width: 13%; }
        .purchase-items-table td:nth-child(5) { width: 13%; }
        .purchase-items-table td:nth-child(6) { width: 16%; }
        .purchase-items-table td:nth-child(7) { width: 12%; }
        .purchase-items-table td:nth-child(8) { width: 5%; }



        .purchase-items-table td {
          padding: 8px 6px;
          border-bottom: 1px solid #e2e8f0;
          vertical-align: middle;
          font-size: 13px;
          transition: background-color 0.2s ease;
        }

        .purchase-items-table tr {
          border-bottom: 1px solid #f1f5f9;
        }

        .purchase-items-table tbody tr:hover {
          background-color: #f8fafc;
        }

        .purchase-items-table tbody tr:nth-child(even) {
          background-color: #fafbfc;
        }

        .purchase-items-table tbody tr:nth-child(even):hover {
          background-color: #f1f5f9;
        }

        .purchase-items-table tr:last-child td:first-child {
          border-bottom-left-radius: 8px;
        }

        .purchase-items-table tr:last-child td:last-child {
          border-bottom-right-radius: 8px;
        }

        .purchase-items-table input {
          width: 100%;
          padding: 6px 8px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-size: 13px;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
          background: white;
          color: #374151;
          line-height: 1.4;
        }

        .purchase-items-table .quantity-input {
          width: 60px;
          text-align: center;
          padding: 6px 4px;
        }

        /* 단가, 금액 입력 필드 최적화 */
        .purchase-items-table td:nth-child(4) input,
        .purchase-items-table td:nth-child(5) input {
          width: 100%;
          text-align: right;
        }

        .purchase-items-table input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
        }

        .purchase-items-table input::placeholder {
          color: #94a3b8;
          font-style: italic;
        }

        .purchase-items-table .amount-field {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          font-weight: 700;
          text-align: right;
          border: none;
          cursor: default;
        }

        .purchase-items-table .amount-field:focus {
          box-shadow: none;
          transform: none;
        }

        .purchase-items-table .remove-btn {
          background: #ef4444;
          color: white;
          border: none;
          padding: 4px 8px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 500;
          transition: background-color 0.2s ease;
          min-width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .purchase-items-table .remove-btn:hover {
          background: #dc2626;
        }

        .purchase-items-table .remove-btn:active {
          background: #b91c1c;
        }

        .purchase-items-table .input-with-suggestions {
          position: relative;
        }

        .purchase-items-table .suggestions-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: white;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
          z-index: 10000;
          max-height: 200px;
          overflow-y: auto;
          overflow-x: visible;
          margin-top: 2px;
        }

        .purchase-items-table .suggestion-item {
          padding: 8px 12px;
          cursor: pointer;
          border-bottom: 1px solid #f1f3f4;
          transition: background-color 0.2s ease;
          font-size: 13px;
        }

        .purchase-items-table .suggestion-item:hover {
          background: #f8f9fa;
        }

        .purchase-items-table .suggestion-item:last-child {
          border-bottom: none;
        }

        .purchase-items-table .suggestion-main {
          font-weight: 600;
          color: #374151;
          margin-bottom: 4px;
          font-size: 13px;
        }

        .purchase-items-table .suggestion-details {
          font-size: 11px;
          color: #6b7280;
        }

        .purchase-items-table .price-range {
          color: #28a745;
          font-weight: 600;
        }

        /* 요청부서 필드 스타일 */
        .purchase-items-table .department-field {
          position: relative;
        }

        .purchase-items-table .department-selector {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .purchase-items-table .department-select {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          border: none;
          padding: 0.75rem 1rem;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.3s ease;
          box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
        }

        .purchase-items-table .department-select:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
        }

        .purchase-items-table .dropdown-arrow {
          font-size: 0.8rem;
          transition: transform 0.3s ease;
        }

        .purchase-items-table .selected-count {
          font-size: 0.8rem;
          color: #6b7280;
          font-weight: 500;
        }

        .purchase-items-table .department-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          z-index: 1000;
          max-height: 200px;
          overflow-y: auto;
          margin-top: 0.25rem;
        }

        .purchase-items-table .department-option {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem;
          cursor: pointer;
          border-bottom: 1px solid #f3f4f6;
          transition: background-color 0.2s ease;
        }

        .purchase-items-table .department-option:hover {
          background: #f9fafb;
        }

        .purchase-items-table .department-option:last-child {
          border-bottom: none;
        }

        .purchase-items-table .department-option input[type="checkbox"] {
          margin: 0;
        }

        .purchase-items-table .department-input {
          width: 100%;
          padding: 0.875rem;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 0.95rem;
          transition: all 0.3s ease;
          background: #fafbfc;
          color: #1e293b;
        }

        .purchase-items-table .department-input:focus {
          outline: none;
          border-color: #667eea;
          background: white;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        /* 계약기간 선택기 스타일 */
        .contract-period-selector {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .contract-period-select {
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          background: white;
          font-size: 13px;
          color: #374151;
          cursor: pointer;
        }

        .contract-period-select:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .contract-date-inputs {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 8px;
        }

        .date-input-group {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .date-label {
          font-size: 11px;
          color: #6b7280;
          font-weight: 500;
          min-width: 40px;
        }

        .contract-date-input {
          flex: 1;
          padding: 4px 8px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-size: 11px;
          color: #374151;
          background: #f9fafb;
        }

        .contract-date-input:focus {
          outline: none;
          border-color: #667eea;
          background: white;
          box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
        }

        .contract-date-input::-webkit-calendar-picker-indicator {
          cursor: pointer;
          filter: opacity(0.7);
        }

        .contract-date-input::-webkit-calendar-picker-indicator:hover {
          filter: opacity(1);
        }

        .suggestion-item.add-new {
          background: #f0f9ff;
          border-left: 3px solid #3b82f6;
        }

        .suggestion-item.add-new:hover {
          background: #e0f2fe;
        }

        /* 드롭박스 추가 정보 스타일 */
        .suggestion-details .contract-type {
          color: #7c3aed;
          font-weight: 500;
        }

        .suggestion-details .proposal-amount {
          color: #059669;
          font-weight: 500;
        }

        .suggestion-details .price-range {
          color: #dc2626;
          font-weight: 500;
        }

        /* 비용귀속부서 분배 스타일 */
        .cost-allocations-container {
          margin-top: 2rem;
        }

        .cost-allocation-section {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .allocation-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .allocation-header h4 {
          color: #1e293b;
          font-size: 1.1rem;
          font-weight: 600;
          margin: 0;
        }

        .add-allocation-btn {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 600;
          transition: all 0.3s ease;
          box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
        }

        .add-allocation-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
        }

        .allocation-item {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 1rem;
        }

        .allocation-row {
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .allocation-field {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          flex: 1;
        }

        .allocation-field label {
          font-size: 0.9rem;
          font-weight: 600;
          color: #374151;
        }

        .allocation-field select,
        .allocation-field input {
          padding: 0.5rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 0.9rem;
        }

        .remove-allocation-btn {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.8rem;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .remove-allocation-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);
        }

        /* 계정과목 섹션 스타일 */
        .account-subjects-container {
          margin-top: 1.5rem;
        }

        .account-subject-section {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 1rem;
        }

        .account-header {
          margin-bottom: 1rem;
        }

        .account-header h4 {
          color: #1e293b;
          font-size: 1rem;
          font-weight: 600;
          margin: 0;
        }

        .account-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .account-item {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 0.75rem;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .item-name {
          font-weight: 600;
          color: #374151;
          font-size: 0.9rem;
          min-width: 120px;
          flex-shrink: 0;
        }

        .account-path {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.4rem;
          font-size: 0.85rem;
          flex: 1;
        }

        .path-item {
          display: flex;
          align-items: center;
          gap: 0.2rem;
        }

        .path-label {
          font-weight: 600;
          color: #64748b;
          font-size: 0.75rem;
        }

        .path-value {
          color: #374151;
          font-weight: 500;
          background: #f1f5f9;
          padding: 0.15rem 0.4rem;
          border-radius: 3px;
          font-size: 0.8rem;
        }

        .path-separator {
          color: #94a3b8;
          font-weight: 500;
          font-size: 0.8rem;
          margin: 0 0.1rem;
        }

        /* 미리보기 모달 스타일 */
        .popup-actions {
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .copy-btn {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .copy-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);
        }

        .capture-btn {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .capture-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(16, 185, 129, 0.4);
        }

        .capture-btn:disabled {
          background: #9ca3af;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .preview-report {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }

        .report-title {
          text-align: center;
          color: #1e293b;
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 2rem;
          border-bottom: 3px solid #3b82f6;
          padding-bottom: 1rem;
        }

        .report-section {
          margin-bottom: 2rem;
          padding: 1.5rem;
          background: #f8fafc;
          border-radius: 8px;
          border-left: 4px solid #3b82f6;
        }

        .report-section h3 {
          color: #1e293b;
          font-size: 1.2rem;
          font-weight: 600;
          margin-bottom: 1rem;
          margin-top: 0;
        }

        .report-content {
          color: #374151;
          font-size: 1rem;
          line-height: 1.6;
          margin: 0;
        }

        .report-items {
          margin-top: 1rem;
        }

        .report-item {
          background: white;
          padding: 1rem;
          border-radius: 6px;
          margin-bottom: 1rem;
          border: 1px solid #e2e8f0;
        }

        .report-item p {
          margin: 0.5rem 0;
          color: #374151;
        }

        .item-divider {
          border: none;
          border-top: 1px solid #e2e8f0;
          margin: 1rem 0;
        }

        .step-divider {
          border: none;
          border-top: 1px solid #e2e8f0;
          margin: 1rem 0;
        }

        .report-approval-line {
          margin-top: 1rem;
        }

        .report-step {
          background: white;
          padding: 1rem;
          border-radius: 6px;
          margin-bottom: 1rem;
          border: 1px solid #e2e8f0;
        }

        .report-footer {
          margin-top: 3rem;
          padding: 2rem;
          background: #1e293b;
          color: white;
          border-radius: 8px;
          text-align: center;
        }

        .report-date {
          font-size: 1rem;
          margin-bottom: 0.5rem;
        }

        .report-total {
          font-size: 1.2rem;
          font-weight: 600;
          color: #10b981;
        }

        /* 표 스타일 */
        .report-table-container {
          overflow-x: auto;
          margin-top: 1rem;
        }

        .report-table {
          width: 100%;
          border-collapse: collapse;
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .report-table th {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
          padding: 1rem 0.75rem;
          text-align: left;
          font-weight: 600;
          font-size: 0.9rem;
          border: none;
        }

        .report-table th:first-child {
          text-align: center;
        }

        .report-table th:nth-child(4),
        .report-table th:nth-child(5),
        .report-table th:nth-child(6) {
          text-align: center;
        }

        .report-table td {
          padding: 0.75rem;
          border-bottom: 1px solid #e2e8f0;
          font-size: 0.9rem;
          color: #374151;
        }

        .report-table tbody tr:hover {
          background: #f8fafc;
        }

        .item-number {
          text-align: center;
          font-weight: 600;
          color: #3b82f6;
          background: #eff6ff;
          border-radius: 4px;
          padding: 0.25rem 0.5rem;
          min-width: 30px;
        }

        .text-center {
          text-align: center;
        }

        .text-right {
          text-align: right;
        }

        .amount-cell {
          font-weight: 600;
          color: #059669;
        }

        .total-row {
          background: #f1f5f9;
          font-weight: 600;
        }

        .total-label {
          text-align: right;
          color: #1e293b;
          font-size: 1rem;
        }

        .total-amount {
          text-align: right;
          color: #059669;
          font-size: 1.1rem;
          font-weight: 700;
        }

        .report-table tfoot td {
          border-bottom: none;
          padding: 1rem 0.75rem;
        }

        /* 자유 양식 스타일 */
        .editor-help {
          background: #f8f9fa;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          padding: 1.5rem;
          margin-top: 1rem;
        }

        .editor-help h4 {
          color: #495057;
          margin: 0 0 1rem 0;
          font-size: 1.1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .editor-help ul {
          margin: 0;
          padding-left: 1.5rem;
          color: #6c757d;
        }

        .editor-help li {
          margin-bottom: 0.5rem;
          line-height: 1.5;
        }

        /* 자유 양식 계약 유형 버튼 스타일 */
        .type-buttons button:last-child {
          background: linear-gradient(135deg, #17a2b8 0%, #138496 100%);
          border-color: #17a2b8;
        }

        .type-buttons button:last-child:hover {
          background: linear-gradient(135deg, #138496 0%, #117a8b 100%);
          border-color: #138496;
          transform: translateY(-2px);
        }

        .type-buttons button:last-child.active {
          background: linear-gradient(135deg, #138496 0%, #117a8b 100%);
          border-color: #117a8b;
          box-shadow: 0 8px 25px rgba(19, 132, 150, 0.4);
        }
      `}</style>
    </div>
  );
};

export default ProposalForm; 