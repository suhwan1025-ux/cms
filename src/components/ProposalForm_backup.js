import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import CKEditorComponent from './CKEditorComponent';
import DocumentTemplates from './DocumentTemplates';

// API ���̽� URL ���� ����
const getApiBaseUrl = () => {
  // ���� ȣ��Ʈ�� localhost�� �ƴϸ� ���� ȣ��Ʈ�� IP�� ���
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return `http://${window.location.hostname}:3004`;
  }
  // localhost���� �����ϴ� ��� localhost ���
  return 'http://localhost:4002';
};

const API_BASE_URL = getApiBaseUrl();

const ProposalForm = () => {
  const originalNavigate = useNavigate();

  // ���ø� ���� �ڵ鷯
  const handleTemplateSelect = (template) => {
    if (template) {
      setFormData(prevData => ({
        ...prevData,
        wysiwygContent: template.content
      }));
      setSelectedTemplate(template.id);
      setShowTemplates(false);
      console.log(`? ���ø� ���õ�: ${template.name}`);
    } else {
      // ���ø� �ʱ�ȭ
      setFormData(prevData => ({
        ...prevData,
        wysiwygContent: ''
      }));
      setSelectedTemplate(null);
      setShowTemplates(false);
      console.log('??? ���ø� �ʱ�ȭ��');
    }
  };

  // ���ø� ���� �ٽ� ����
  const handleShowTemplates = () => {
    setShowTemplates(true);
  };
  const [contractType, setContractType] = useState('purchase'); // �⺻���� 'purchase'�� ����
  const [formData, setFormData] = useState({
    // ���� �׸�
    title: '',
    purpose: '',
    basis: '',
    budget: '',
    contractMethod: '',
    accountSubject: '',
    requestDepartments: [], // ���� ���� ������ ��û�μ� �迭
    
    // ����/����/���� ����
    purchaseItems: [], // N�� ����ǰ��
    suppliers: [],
    
    // ����/���� ����
    changeReason: '',
    extensionReason: '',
    beforeItems: [],
    afterItems: [],
    
    // �뿪 ����
    serviceItems: [],
    contractPeriod: '',
    contractStartDate: '',
    contractEndDate: '',
    paymentMethod: '',
    
    // ���� ����
    biddingType: '',
    qualificationRequirements: '',
    evaluationCriteria: '',
    priceComparison: [],
    
    // WYSIWYG �����Ϳ�
    wysiwygContent: ''
  });

  // API ������
  const [budgets, setBudgets] = useState([]);
  const [businessBudgets, setBusinessBudgets] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [contractMethods, setContractMethods] = useState([]);
  const [proposalId, setProposalId] = useState(null); // ǰ�Ǽ� Ű��
  
  // �ӽ����� Ȯ�� �˾� ���� ����
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);
  
  // ���ø� ���� ���� ����
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showTemplates, setShowTemplates] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [initialFormData, setInitialFormData] = useState(null);

  // �׺���̼��� �����ϴ� �Լ�
  const navigate = useCallback((to, options) => {
    if (hasUnsavedChanges && showSaveConfirm) {
      console.log('�׺���̼� ���ܵ�:', to);
      return;
    }
    console.log('�׺���̼� ����:', to);
    originalNavigate(to, options);
  }, [hasUnsavedChanges, showSaveConfirm, originalNavigate]);

  // �� ������ ���� ����
  useEffect(() => {
    if (initialFormData === null) {
      setInitialFormData(JSON.stringify(formData));
      return;
    }
    
    // �˾��� ǥ�õǾ� ������ hasUnsavedChanges�� �������� ����
    if (showSaveConfirm) {
      console.log('�˾� ǥ�� ��, hasUnsavedChanges ���� ����');
      return;
    }
    
    const currentFormData = JSON.stringify(formData);
    const hasChanges = currentFormData !== initialFormData;
    console.log('�� ������ ���� ����:', hasChanges, '����:', currentFormData.substring(0, 100), '�ʱ�:', initialFormData.substring(0, 100));
    setHasUnsavedChanges(hasChanges);
  }, [formData, initialFormData, showSaveConfirm]);

  // ��ũ Ŭ�� �� �ӽ����� Ȯ��
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
          console.log('��ũ Ŭ�� ����:', href);
          // ���¸� ���� �����Ͽ� �˾� ǥ��
          setPendingNavigation(href);
          setShowSaveConfirm(true);
          return false;
        }
      }
    }
  }, [hasUnsavedChanges]);

  // ���콺 �ٿ� �̺�Ʈ�� ó��
  const handleMouseDown = useCallback((e) => {
    if (hasUnsavedChanges) {
      const target = e.target.closest('a');
      if (target && target.href && !target.href.includes('javascript:')) {
        const href = target.getAttribute('href');
        if (href && href.startsWith('/')) {
          console.log('���콺 �ٿ� ����:', href);
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          e.returnValue = false;
          return false;
        }
      }
    }
  }, [hasUnsavedChanges]);

  // ������ �̵� �� �ӽ����� Ȯ��
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '�ۼ� ���� ������ �ֽ��ϴ�. �������� �����ðڽ��ϱ�?';
        return '�ۼ� ���� ������ �ֽ��ϴ�. �������� �����ðڽ��ϱ�?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('click', handleLinkClick, true); // ĸó �ܰ迡�� ó��
    document.addEventListener('mousedown', handleMouseDown, true); // ĸó �ܰ迡�� ó��
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('click', handleLinkClick, true);
      document.removeEventListener('mousedown', handleMouseDown, true);
    };
  }, [hasUnsavedChanges, handleLinkClick, handleMouseDown]);

  // �ӽ����� Ȯ�� �˾� ǥ��
  const showSaveConfirmation = useCallback((navigationTarget) => {
    console.log('showSaveConfirmation ȣ��:', navigationTarget, 'hasUnsavedChanges:', hasUnsavedChanges);
    
    if (hasUnsavedChanges) {
      console.log('������� ����, �˾� ǥ��');
      setPendingNavigation(navigationTarget);
      setShowSaveConfirm(true);
      // �˾��� ǥ�õ� �� hasUnsavedChanges�� ������� �ʵ��� ����
      return;
    } else {
      console.log('������� ����, �ٷ� �̵�');
      // ��������� ������ �ٷ� �̵�
      if (navigationTarget && ['purchase', 'change', 'extension', 'service', 'bidding'].includes(navigationTarget)) {
        setContractType(navigationTarget);
      } else if (navigationTarget) {
        navigate(navigationTarget);
      }
    }
  }, [hasUnsavedChanges, navigate]);

  // ��� ���� ���� (�ӽ����� Ȯ�� ����)
  const changeContractType = (newType) => {
    if (contractType === newType) return; // ���� Ÿ���̸� ����
    
    if (hasUnsavedChanges) {
      setPendingNavigation(newType);
      setShowSaveConfirm(true);
    } else {
      // ��������� ������ �ٷ� ����
      setContractType(newType);
      // �� ������ �ʱ�ȭ
      resetFormData();
    }
  };

  // �� ������ �ʱ�ȭ �Լ�
  const resetFormData = () => {
    setFormData({
      // ���� �׸�
      purpose: '',
      basis: '',
      budget: '',
      contractMethod: '',
      accountSubject: '',
      requestDepartments: [], // �� �迭�� �ʱ�ȭ
      
      // ����/����/���� ����
      purchaseItems: [], // �� �迭�� �ʱ�ȭ
      suppliers: [],
      
      // ����/���� ����
      changeReason: '',
      extensionReason: '',
      beforeItems: [],
      afterItems: [],
      
      // �뿪 ����
      serviceItems: [],
      contractPeriod: '',
      paymentMethod: '',
      
      // ���� ����
      biddingType: '',
      qualificationRequirements: '',
      evaluationCriteria: '',
      priceComparison: []
    });
    setInitialFormData(null);
    setHasUnsavedChanges(false);
  };

  // �ӽ����� �� �̵�
  const handleSaveAndNavigate = async () => {
    try {
      console.log('�ӽ����� �� �̵� ����');
      // pendingNavigation ���� �̸� ����
      const targetNavigation = pendingNavigation;
      
      // �˾� ���¸� ���� �ʱ�ȭ�Ͽ� �߰� �̺�Ʈ ����
      setShowSaveConfirm(false);
      setPendingNavigation(null);
      
      // handleDraftSave �Լ��� �ڵ� �̵��� �����ϱ� ���� ���� ���� ����
      const originalEditingProposalId = editingProposalId;
      
      // �ӽ����� ���� (�ڵ� �̵� ����)
      await handleProposalSave(true, true); // isDraft = true, preventNavigation = true
      
      console.log('�ӽ����� �Ϸ�, �̵� ó��:', targetNavigation);
      
      // hasUnsavedChanges ���� �ʱ�ȭ
      setHasUnsavedChanges(false);
      
      // ��� ���� �������� URL �̵����� Ȯ��
      if (targetNavigation && ['purchase', 'change', 'extension', 'service', 'bidding'].includes(targetNavigation)) {
        console.log('��� ���� ����:', targetNavigation);
        setContractType(targetNavigation);
        // �� ������ �ʱ�ȭ
        resetFormData();
      } else if (targetNavigation) {
        console.log('URL �̵�:', targetNavigation);
        originalNavigate(targetNavigation);
      }
    } catch (error) {
      console.error('�ӽ����� ����:', error);
      alert('�ӽ����忡 �����߽��ϴ�. �ٽ� �õ����ּ���.');
    }
  };

  // �ӽ����� ���� �̵�
  const handleNavigateWithoutSave = () => {
    console.log('�ӽ����� ���� �̵�:', pendingNavigation);
    const targetNavigation = pendingNavigation;
    
    // �˾� ���¸� ���� �ʱ�ȭ�Ͽ� �߰� �̺�Ʈ ����
    setShowSaveConfirm(false);
    setPendingNavigation(null);
    setHasUnsavedChanges(false);
    
    // ��� ���� �������� URL �̵����� Ȯ��
    if (targetNavigation && ['purchase', 'change', 'extension', 'service', 'bidding'].includes(targetNavigation)) {
      console.log('��� ���� ���� (���� ����):', targetNavigation);
      setContractType(targetNavigation);
      // �� ������ �ʱ�ȭ
      resetFormData();
    } else if (targetNavigation) {
      console.log('URL �̵� (���� ����):', targetNavigation);
      originalNavigate(targetNavigation);
    }
  };

  // �ӽ����� Ȯ�� �˾� ���
  const handleCancelNavigation = () => {
    console.log('�˾� ���');
    setShowSaveConfirm(false);
    setPendingNavigation(null);
  };

  // �� �ݾ� ���
  const calculateTotalAmount = () => {
    let total = 0;
    
    if (['purchase', 'change', 'extension'].includes(contractType)) {
      total = (formData.purchaseItems || []).reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    } else if (contractType === 'service') {
      total = (formData.serviceItems || []).reduce((sum, item) => sum + (parseFloat(item.contractAmount) || 0), 0);
    } else if (contractType === 'freeform') {
      // ��������� �ݾ��� �����Ƿ� 0 ��ȯ
      total = 0;
    }
    
    return total;
  };

  // ������� ��õ
  const getRecommendedApprovalLine = () => {
    const totalAmount = calculateTotalAmount();
    if (totalAmount === 0 && contractType !== 'freeform') return [];
    
    const line = [];
    
    // �⺻ ������� (��û�μ�)
    line.push({
      step: 1,
      name: '��û�μ�',
      title: '�����',
      description: 'ǰ�Ǽ� �ۼ� �� ����'
    });

    // �濵������ ������ �߰� (2�鸸�� �ʰ� ��)
    if (totalAmount > 2000000) {
      let managementLevel = '�����';
      if (totalAmount > 2000000 && totalAmount <= 50000000) {
        managementLevel = '�濵��������';
      } else if (totalAmount > 50000000 && totalAmount <= 300000000) {
        managementLevel = '�濵����������';
      } else if (totalAmount > 300000000) {
        managementLevel = '�濵��������';
      }
      
      line.push({
        step: line.length + 1,
        name: '�濵������',
        title: managementLevel,
        description: '���� �� �濵 ȿ���� ����',
        conditional: true
      });
    }

    // �뿪��� �� �ع������� �߰�
    if (contractType === 'service') {
      line.push({
        step: line.length + 1,
        name: '�ع�������',
        title: '�ع�������',
        description: '���� �ؼ��� ����',
        conditional: true
      });
    }

    // ������� ���� �� ���� ���� ����
    if (contractType === 'freeform') {
      line.push({
        step: line.length + 1,
        name: '�μ���',
        title: '�μ���',
        description: '���� ���� ���� �� ����'
      });
      
      line.push({
        step: line.length + 1,
        name: '�濵������',
        title: '�濵��������',
        description: '���� ��å �� ���� �ؼ� ����',
        conditional: true
      });
    }

    // IT ���ΰ����� �߰� (1õ���� �ʰ� ~ 3��� ����)
    if (totalAmount > 10000000 && totalAmount <= 300000000) {
      line.push({
        step: line.length + 1,
        name: 'IT ���ΰ�����',
        title: 'IT ���ΰ�����',
        description: 'IT �ý��� �� ���� ����',
        conditional: true
      });
    }

    // ���ݾ� 5õ���� �ʰ� �� ���纻���� �߰�
    if (totalAmount > 50000000) {
      line.push({
        step: line.length + 1,
        name: '���纻����',
        title: '���纻����',
        description: '���� �� �������� ����',
        conditional: true
      });
    }

    // ���� ������
    let finalApprover = '����';
    if (totalAmount > 10000000 && totalAmount <= 300000000) {
      finalApprover = '������';
    } else if (totalAmount > 300000000) {
      finalApprover = '��ǥ�̻�';
    }

    line.push({
      step: line.length + 1,
      name: '����������',
      title: finalApprover,
      description: '���� ����',
      final: true
    });

    return line;
  };



  // ����ǰ�� �߰� - ������ ���� (�ߺ� ȣ�� ����)
  const addPurchaseItem = useCallback(() => {
    const newPurchaseItem = {
      id: Date.now() + Math.random(),
      item: '',
      productName: '',
      quantity: 1,
      unitPrice: 0,
      amount: 0,
      supplier: '',
      contractPeriodType: '1year', // ���Ⱓ Ÿ��: '1month', '3months', '6months', '1year', '2years', '3years', 'permanent', 'custom'
      contractStartDate: '', // ��� ������
      contractEndDate: '', // ��� ������
      costAllocation: {
        type: 'percentage', // 'percentage' or 'amount'
        allocations: [] // ���ͼӺμ� �й� �迭
      }
    };
    
    setFormData(prevData => ({
      ...prevData,
      purchaseItems: [...prevData.purchaseItems, newPurchaseItem]
    }));
  }, []);

  // �뿪�׸� �߰� (�ߺ� ȣ�� ����)
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
      creditRating: ''
    };
    
    setFormData(prevData => ({
      ...prevData,
      serviceItems: [...prevData.serviceItems, newServiceItem]
    }));
  }, []);

  // ���� ��� ����
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingProposalId, setEditingProposalId] = useState(null);

  // ������� ���� �˾� ����
  const [showBudgetPopup, setShowBudgetPopup] = useState(false);
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedBudgetType, setSelectedBudgetType] = useState('');
  const [filteredBudgets, setFilteredBudgets] = useState([]);

  // ��û�μ� ���� ����
  const [showDepartmentDropdown, setShowDepartmentDropdown] = useState(false);
  const [showDepartmentSuggestions, setShowDepartmentSuggestions] = useState(false);
  const [departmentSearchTerm, setDepartmentSearchTerm] = useState('');
  const [filteredDepartments, setFilteredDepartments] = useState([]);
  


  // ���� ���� ��õ ����
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [showItemSuggestions, setShowItemSuggestions] = useState(false);
  const [showProductSuggestions, setShowProductSuggestions] = useState(false);
  const [showSupplierSuggestions, setShowSupplierSuggestions] = useState(false);
  const [currentSuggestionField, setCurrentSuggestionField] = useState(null);
  const [currentSuggestionIndex, setCurrentSuggestionIndex] = useState(null);

  // API ������ �ε� �� ���� ��� Ȯ��
  useEffect(() => {
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
        
        // API ���� �����
        console.log('=== API ���� ����� ===');
        console.log('businessBudgetsData Ÿ��:', typeof businessBudgetsData);
        console.log('businessBudgetsData:', businessBudgetsData);
        console.log('departmentsData Ÿ��:', typeof departmentsData);
        console.log('departmentsData:', departmentsData);

        // �����Ͱ� �迭���� Ȯ���ϰ� �����ϰ� ó��
        const safeBusinessBudgetsData = Array.isArray(businessBudgetsData) ? businessBudgetsData : [];
        const safeDepartmentsData = Array.isArray(departmentsData) ? departmentsData : [];
        
        setBudgets(budgetsData);
        setBusinessBudgets(safeBusinessBudgetsData);
        setDepartments(safeDepartmentsData);
        setSuppliers(suppliersData);
        setContractMethods(contractMethodsData);
        
        console.log('������� ������ �ε��:', safeBusinessBudgetsData.length, '��');
        console.log('������� ����:', safeBusinessBudgetsData.slice(0, 2));
        console.log('�μ� ������ �ε��:', safeDepartmentsData.length, '��');
        console.log('�μ� ����:', safeDepartmentsData.slice(0, 3));
        
        // �ʱ� ���͸� ����
        if (safeBusinessBudgetsData.length > 0) {
          setFilteredBudgets(safeBusinessBudgetsData);
        }

        // ���� ��� Ȯ�� - URL �Ķ���� �켱, localStorage ���
        const urlParams = new URLSearchParams(window.location.search);
        const proposalIdFromUrl = urlParams.get('id');
        const isRecycleMode = urlParams.get('recycle') === 'true';
        const editingDraft = localStorage.getItem('editingDraft');
        const recycleProposal = localStorage.getItem('recycleProposal');
        
        if (proposalIdFromUrl) {
          // URL���� ǰ�Ǽ� ID�� ������ �������� ������ ��������
          console.log('=== URL���� ǰ�Ǽ� ID �߰�, �������� ������ �ε� ===');
          await loadProposalFromServer(proposalIdFromUrl);
        } else if (isRecycleMode && recycleProposal) {
          // ��Ȱ�� ����� ���
          console.log('=== ��Ȱ�� ��� ����, ��Ȱ�� ������ �ε� ===');
          const recycleData = JSON.parse(recycleProposal);
          console.log('?? ��Ȱ�� ������:', recycleData);
          console.log('?? ��Ȱ�� ������ Ű��:', Object.keys(recycleData));
          
          // ��� ���� ����
          const contractTypeValue = recycleData.contractType || 'purchase';
          console.log('?? ������ ��� ����:', contractTypeValue);
          setContractType(contractTypeValue);
          
          // �� ������ ���� (���� ���� ��ɰ� ������ ������� ó��)
          const newFormData = {
            purpose: recycleData.purpose || '',
            basis: recycleData.basis || '',
            budget: recycleData.budget || '', // budgetId�� �̹� ó����
            contractMethod: recycleData.contractMethod || '',
            accountSubject: recycleData.accountSubject || '',
            // ��û�μ��� �̹� ���� ���� ��ɰ� �����ϰ� ó����
            requestDepartments: recycleData.requestDepartments || [],
            // ����ǰ�� �̹� ���� ���� ��ɰ� ������ ���·� ó����
            purchaseItems: recycleData.purchaseItems || [],
            suppliers: recycleData.suppliers || [],
            changeReason: recycleData.changeReason || '',
            extensionReason: recycleData.extensionReason || '',
            beforeItems: recycleData.beforeItems || [],
            afterItems: recycleData.afterItems || [],
            // �뿪ǰ�� �̹� ���� ���� ��ɰ� ������ ���·� ó����
            serviceItems: recycleData.serviceItems || [],
            contractPeriod: recycleData.contractPeriod || '',
            paymentMethod: recycleData.paymentMethod || '',
            biddingType: recycleData.biddingType || '',
            qualificationRequirements: recycleData.qualificationRequirements || '',
            evaluationCriteria: recycleData.evaluationCriteria || '',
            priceComparison: recycleData.priceComparison || []
          };
          
          console.log('?? ������ �� ������:', newFormData);
          console.log('?? ����ǰ�� ����:', newFormData.purchaseItems.length);
          console.log('?? ��û�μ� ����:', newFormData.requestDepartments.length);
          console.log('?? ����ǰ�� ���й� ����:');
          newFormData.purchaseItems.forEach((item, index) => {
            console.log(`  ����ǰ�� ${index + 1} (${item.item}):`, {
              hasCostAllocation: !!item.costAllocation,
              allocationsCount: item.costAllocation?.allocations?.length || 0,
              allocations: item.costAllocation?.allocations
            });
          });
          
          setFormData(newFormData);
          
          // ��Ȱ�� ������ ��� �Ϸ� �� localStorage���� ����
          localStorage.removeItem('recycleProposal');
          
          // ������� �������� ǥ�� (��Ȱ��� �������̹Ƿ�)
          setHasUnsavedChanges(true);
          
          console.log('? ��Ȱ�� ������ ���� �Ϸ�');
        } else if (editingDraft) {
          const draftData = JSON.parse(editingDraft);
          console.log('=== ���� ��� ������ �ε� ===');
          console.log('��ü draftData:', draftData);
          console.log('��Ÿ:', draftData.accountSubject);
          console.log('��û�μ�:', draftData.requestDepartments);

          console.log('����ǰ��:', draftData.purchaseItems);
          console.log('�뿪ǰ��:', draftData.serviceItems);
          
          // ���й� ���� �����
          if (draftData.purchaseItems && draftData.purchaseItems.length > 0) {
            console.log('=== ���й� ���� ����� ===');
            draftData.purchaseItems.forEach((item, index) => {
              console.log(`����ǰ�� ${index + 1} (${item.item}):`, {
                hasCostAllocation: !!item.costAllocation,
                costAllocationData: item.costAllocation,
                hasCostAllocations: !!item.costAllocations,
                costAllocationsData: item.costAllocations,
                // ��ü item ��ü Ȯ��
                fullItemData: item
              });
            });
          }
          
          if (draftData.purchaseItemCostAllocations) {
            console.log('purchaseItemCostAllocations:', draftData.purchaseItemCostAllocations);
          }
          
          // ��ü draftData ���� Ȯ��
          console.log('=== ��ü draftData ���� �м� ===');
          console.log('draftData Ű��:', Object.keys(draftData));
          console.log('purchaseItems Ÿ��:', typeof draftData.purchaseItems);
          console.log('purchaseItems ����:', draftData.purchaseItems ? draftData.purchaseItems.length : 'undefined');
          if (draftData.purchaseItems && draftData.purchaseItems.length > 0) {
            console.log('ù ��° purchaseItem Ű��:', Object.keys(draftData.purchaseItems[0]));
          }
          
          setIsEditMode(true);
          setEditingProposalId(draftData.id);
          setProposalId(draftData.id); // ǰ�Ǽ� Ű�� ����
          
          // �� ������ ���� - ������ ����
          setContractType(draftData.contractType === '���Ű��' ? 'purchase' :
                         draftData.contractType === '�뿪���' ? 'service' :
                         draftData.contractType === '������' ? 'change' :
                         draftData.contractType === '������' ? 'extension' :
                         draftData.contractType === '�������' ? 'freeform' : '');
          
          // ��û�μ� ������ ����ȭ (��ȭ�� ����)
          const normalizedRequestDepartments = (draftData.requestDepartments || []).map(dept => 
            typeof dept === 'string' ? dept : dept.department || dept.name || dept
          ).filter(Boolean); // �� �� ����
          
          console.log('?? ��û�μ� ����:', {
            ����: draftData.requestDepartments,
            ����ȭ: normalizedRequestDepartments
          });
          
          // ����ǰ�� ������ ����ȭ (��ȭ�� ����)
          const normalizedPurchaseItems = (draftData.purchaseItems || []).map((item, itemIndex) => {
            // �⺻ ����ǰ�� ����
            const basicItem = {
              id: item.id || Date.now() + Math.random(),
              item: item.item || '',
              productName: item.productName || '',
              quantity: parseInt(item.quantity) || 0,
              unitPrice: parseInt(item.unitPrice) || 0,
              amount: parseInt(item.amount) || 0,
              supplier: item.supplier || '',
              requestDepartments: item.requestDepartments || [], // ���� ���� ������ ��û�μ� �迭
              costAllocation: { 
                type: 'percentage',
                allocations: [] 
              }
            };
            
            console.log(`?? ����ǰ�� ${itemIndex} (${item.item}) �⺻ ����:`, basicItem);
            
            // ���й� ���� ���� - ��ȭ�� ����
            let hasAllocations = false;
            
            // 1. ����ǰ�� ���� ���Ե� ���й� ���� (�켱���� 1)
            if (item.costAllocation && item.costAllocation.allocations && item.costAllocation.allocations.length > 0) {
              console.log(`? ����ǰ�� "${item.item}" ���� ���й� ���� �߰�:`, item.costAllocation.allocations);
              basicItem.costAllocation = {
                type: item.costAllocation.type || 'percentage',
                allocations: item.costAllocation.allocations.map(alloc => ({
                  id: alloc.id || Date.now() + Math.random(),
                  department: alloc.department || '',
                  type: alloc.type || 'percentage',
                  value: parseFloat(alloc.value) || 0  // ���� Ÿ�� ����
                }))
              };
              hasAllocations = true;
            }
            
            // 2. purchaseItemCostAllocations���� ���� (�����, �켱���� 2)
            if (!hasAllocations && draftData.purchaseItemCostAllocations && draftData.purchaseItemCostAllocations.length > 0) {
              console.log(`?? purchaseItemCostAllocations���� ���� �õ�...`);
              console.log('��ü purchaseItemCostAllocations:', draftData.purchaseItemCostAllocations);
              
              // �� ��Ȯ�� ��Ī�� ���� ����
              let matchingAllocations = [];
              
              // 1����: ��Ȯ�� itemIndex ��Ī
              matchingAllocations = draftData.purchaseItemCostAllocations.filter(alloc => 
                alloc.itemIndex === itemIndex
              );
              
              // 2����: ǰ��� ��Ī (itemIndex�� ���ų� ��Ī���� ���� ���)
              if (matchingAllocations.length === 0) {
                matchingAllocations = draftData.purchaseItemCostAllocations.filter(alloc => 
                  (alloc.itemName && alloc.itemName === item.item) || 
                  (alloc.productName && alloc.productName === item.productName)
                );
              }
              
              // 3����: ǰ����� ����� ��� (�κ� ��Ī)
              if (matchingAllocations.length === 0) {
                matchingAllocations = draftData.purchaseItemCostAllocations.filter(alloc => 
                  (alloc.itemName && item.item && alloc.itemName.includes(item.item)) || 
                  (item.item && alloc.itemName && item.item.includes(alloc.itemName)) ||
                  (alloc.productName && item.productName && alloc.productName.includes(item.productName)) ||
                  (item.productName && alloc.productName && item.productName.includes(alloc.productName))
                );
              }
              
              if (matchingAllocations.length > 0) {
                console.log(`? ��Ī���� ���й� ���� ����:`, {
                  ��Ī���: matchingAllocations[0].itemIndex === itemIndex ? 'itemIndex' : 'ǰ���',
                  ��Ī���Ҵ�: matchingAllocations
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
                console.log(`? ��� ��Ī ��� ����: ${item.item} (${itemIndex})`);
              }
            }
            
            if (!hasAllocations) {
              console.log(`?? ����ǰ�� "${item.item}" ���й� ���� ���� - �⺻�� ����`);
              // �⺻ ���й� ���� ����
              basicItem.costAllocation = {
                type: 'percentage',
                allocations: []
              };
            }
            
            console.log(`?? ����ǰ�� ${itemIndex} ���� ���� ���:`, {
              �⺻����: basicItem,
              ���й�: basicItem.costAllocation,
              �Ҵ簳��: basicItem.costAllocation.allocations.length
            });
            
            return basicItem;
          });
          
          setFormData({
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
              skillLevel: item.skillLevel || '',
              period: item.period || '',
              monthlyRate: item.monthlyRate || 0,
              contractAmount: item.contractAmount || 0,
              supplier: item.supplier || '',
              creditRating: item.creditRating || ''
            })),
            contractPeriod: draftData.contractPeriod || '',
            paymentMethod: draftData.paymentMethod || '',
            biddingType: draftData.biddingType || '',
            qualificationRequirements: draftData.qualificationRequirements || '',
            evaluationCriteria: draftData.evaluationCriteria || '',
            priceComparison: draftData.priceComparison || []
          });
          
          // localStorage���� ���� ������ ����
          localStorage.removeItem('editingDraft');
          
          // ������ �� ������ Ȯ��
          console.log('=== ������ �� ������ Ȯ�� ===');
          console.log('������ contractType:', contractType);
          console.log('������ purchaseItems:', formData.purchaseItems);
          formData.purchaseItems.forEach((item, index) => {
            if (item.costAllocation && item.costAllocation.allocations) {
              console.log(`����ǰ�� ${index + 1} (${item.item}) ���й� ���� �Ϸ�:`, item.costAllocation.allocations);
            } else {
              console.log(`����ǰ�� ${index + 1} (${item.item}) ���й� ����`);
            }
          });
          
          // ������ ���� ������Ʈ�Ͽ� �������� Ʈ����
          setTimeout(() => {
            console.log('=== ���� ���� ������Ʈ ===');
            setFormData(prevData => {
              const updatedData = { ...prevData };
              console.log('������Ʈ �� formData:', updatedData);
              return updatedData;
            });
          }, 100);
          
          // ������ �����͸� ������ ���¿� ����
          setTimeout(() => {
            console.log('=== ������ ������ ���� ���� ===');
            const restoredPurchaseItems = (draftData.purchaseItems || []).map((item, itemIndex) => {
              let restoredItem = { ...item };
              
              // ���й� ���� ����
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
              
              // �׽�Ʈ��: ���й� ������ ������ �ӽ÷� ����
              if (!restoredItem.costAllocation || !restoredItem.costAllocation.allocations || restoredItem.costAllocation.allocations.length === 0) {
                console.log(`?? �׽�Ʈ�� ���й� ���� ����: ${item.item}`);
                restoredItem.costAllocation = {
                  allocations: [
                    {
                      id: Date.now() + Math.random(),
                      department: '�׽�Ʈ�μ�',
                      type: 'percentage',
                      value: 100
                    }
                  ]
                };
              }
              
              return restoredItem;
            });
            
            console.log('���� ������ purchaseItems:', restoredPurchaseItems);
            
            setFormData(prevData => ({
              ...prevData,
              purchaseItems: restoredPurchaseItems
            }));
          }, 200);
          
          // ���� ��忡�� �ʱ� ������ ���� (������� ������) - ������ ���ο� ����
          setTimeout(() => {
            console.log('=== ������ ���ο� ����: ���й� ���� ���� ===');
            
            // 1. ���� formData ���� Ȯ��
            console.log('���� formData ����:', formData);
            
            // 2. draftData���� ���й� ���� ���� - ��ȭ�� ����
            const extractedAllocations = {};
            
            // ����ǰ�񺰷� ���й� ���� ����
            (draftData.purchaseItems || []).forEach((item, itemIndex) => {
              const itemKey = item.item || `item_${itemIndex}`;
              extractedAllocations[itemKey] = [];
              
              // ���� ���Ե� ���й� ����
              if (item.costAllocation && item.costAllocation.allocations) {
                extractedAllocations[itemKey] = [...item.costAllocation.allocations];
              }
              
              // purchaseItemCostAllocations���� ��� ����
              if (draftData.purchaseItemCostAllocations) {
                const backupAllocations = draftData.purchaseItemCostAllocations.filter(alloc => 
                  alloc.itemName === item.item || alloc.productName === item.productName
                );
                
                if (backupAllocations.length > 0) {
                  extractedAllocations[itemKey] = [...extractedAllocations[itemKey], ...backupAllocations];
                }
              }
            });
            
            console.log('����� ���й� ����:', extractedAllocations);
            
            // 3. formData�� ���й� ���� ����
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
            
            console.log('������Ʈ�� purchaseItems:', updatedPurchaseItems);
            
            // 4. ���� ������Ʈ
            setFormData(prevData => ({
              ...prevData,
              purchaseItems: updatedPurchaseItems
            }));
          }, 300);
        }
      } catch (error) {
        console.error('������ �ε� ����:', error);
        alert('������ �ε忡 �����߽��ϴ�. ������ ���� ������ Ȯ�����ּ���.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // URL �Ķ���Ϳ��� ��� ���� Ȯ��
    const urlParams = new URLSearchParams(window.location.search);
    const typeParam = urlParams.get('type');
    
    if (typeParam && ['purchase', 'change', 'extension', 'service', 'bidding'].includes(typeParam)) {
      setContractType(typeParam);
    }
  }, []);

  // ���͸� ���°� ����� ������ ���͸� ����
  useEffect(() => {
    if (businessBudgets.length > 0) {
      filterBudgets();
    }
  }, [selectedYear, selectedBudgetType]);

  // �μ� �˻� ���͸�
  useEffect(() => {
    if (departments.length > 0) {
      filterDepartments();
    }
  }, [departmentSearchTerm, formData.requestDepartments]);

  const formatCurrency = (amount) => {
    // �Ҽ��� �����ϰ� ������ ��ȯ
    const integerAmount = Math.round(amount);
    return new Intl.NumberFormat('ko-KR').format(integerAmount) + '��';
  };

  // �ѱ� �ݾ� ǥ��
  const formatKoreanCurrency = (amount) => {
    if (amount === 0) return '����';
    
    const units = ['', '��', '��', '��'];
    const numbers = ['��', '��', '��', '��', '��', '��', '��', 'ĥ', '��', '��'];
    const positions = ['', '��', '��', 'õ'];
    
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
    
    return result + '��';
  };

  // ���ڿ� �޸� �߰�
  const formatNumberWithComma = (value) => {
    if (!value) return '';
    // �Ҽ��� �����ϰ� ������ ��ȯ �� �޸� �߰�
    const intValue = Math.floor(parseFloat(value) || 0);
    return intValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  // �޸� ����
  const removeComma = (value) => {
    if (!value) return 0;
    return parseInt(value.toString().replace(/,/g, '')) || 0;
  };

  // ������� ���͸�
  const filterBudgets = () => {
    if (!businessBudgets || businessBudgets.length === 0) {
      setFilteredBudgets([]);
      return;
    }
    
    let filtered = [...businessBudgets];
    
    console.log('���͸� ����:', { selectedYear, selectedBudgetType, totalBudgets: businessBudgets.length });
    
    if (selectedYear && selectedYear !== '') {
      filtered = filtered.filter(budget => budget.budget_year == selectedYear);
      console.log('���� ���͸� ��:', filtered.length);
    }
    
    if (selectedBudgetType && selectedBudgetType !== '') {
      filtered = filtered.filter(budget => budget.budget_type === selectedBudgetType);
      console.log('���� ���͸� ��:', filtered.length);
    }
    
    console.log('���� ���͸� ���:', filtered.length);
    setFilteredBudgets(filtered);
  };

  // �������� ǰ�Ǽ� ������ �ε�
  const loadProposalFromServer = async (proposalId) => {
    try {
      console.log('�������� ǰ�Ǽ� ������ �ε� ����:', proposalId);
      const response = await fetch(`${API_BASE_URL}/api/proposals/${proposalId}`);
      
      if (!response.ok) {
        throw new Error(`ǰ�Ǽ� �ε� ����: ${response.status}`);
      }
      
      const proposalData = await response.json();
      console.log('�������� �ε�� ǰ�Ǽ� ������:', proposalData);
      console.log('?? ����� - �������� ���� wysiwygContent:', proposalData.wysiwygContent);
      
      // ���� ��� ����
      setIsEditMode(true);
      setEditingProposalId(proposalId);
      setProposalId(proposalId);
      
      // ��� ���� ����
      setContractType(proposalData.contractType || 'purchase');
      
      // �� ������ ����
      setFormData({
        title: proposalData.title || '',
        purpose: proposalData.purpose || '',
        basis: proposalData.basis || '',
        budget: proposalData.budgetId || '',
        contractMethod: proposalData.contractMethod || '',
        accountSubject: proposalData.accountSubject || '',
        requestDepartments: (proposalData.requestDepartments || []).map(dept => 
          typeof dept === 'string' ? dept : dept.department || dept.name || dept
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
          skillLevel: item.skillLevel || '',
          period: item.period || '',
          monthlyRate: item.monthlyRate || 0,
          contractAmount: item.contractAmount || 0,
          supplier: item.supplier || '',
          creditRating: item.creditRating || ''
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
        wysiwygContent: proposalData.wysiwygContent || '' // ������� ���� �߰�
      });
      
      console.log('? ���� ������ ���� �Ϸ�');
      console.log('?? ����� - formData�� ������ wysiwygContent:', proposalData.wysiwygContent || '');
      
      // ��������� ��� ���ø� ���� ����
      if (proposalData.contractType === 'freeform' && proposalData.wysiwygContent) {
        setShowTemplates(false); // �����͸� �ٷ� ������
        console.log('?? ������� ǰ�Ǽ� - ���ø� ���� ȭ�� ����');
      }
      
    } catch (error) {
      console.error('�������� ǰ�Ǽ� ������ �ε� ����:', error);
      alert('ǰ�Ǽ� �����͸� �ҷ����µ� �����߽��ϴ�: ' + error.message);
    }
  };

  // ������� ���� �˾� ����
  const openBudgetPopup = () => {
    setSelectedYear('');
    setSelectedBudgetType('');
    setFilteredBudgets(businessBudgets);
    setShowBudgetPopup(true);
  };

  // ������� ����
  const selectBudget = (budget) => {
    setFormData({...formData, budget: budget.id});
    setShowBudgetPopup(false);
  };

  // ���� ��� ��������
  const getYearList = () => {
    const years = [...new Set(businessBudgets.map(budget => budget.budget_year))];
    return years.sort((a, b) => b - a);
  };

  // ���� ���� ��� ��������
  const getBudgetTypeList = () => {
    const types = [...new Set(businessBudgets.map(budget => budget.budget_type))];
    return types.sort();
  };

  // �μ� �˻� �� ���͸�
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
    
    // �̹� ���õ� �μ��� ����
    filtered = filtered.filter(dept => 
      !formData.requestDepartments.some(selectedDept => {
        const selectedName = typeof selectedDept === 'string' ? selectedDept : selectedDept.name || selectedDept;
        return selectedName === dept.name;
      })
    );
    
    setFilteredDepartments(filtered);
  };

  // ����ǰ�� �μ� �˻� �� ���͸�
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
    
    // �ش� ǰ�� �̹� ���õ� �μ��� ����
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

  // �μ� �Է� ��Ŀ�� ó��
  const handleDepartmentInputFocus = (itemIndex) => {
    setCurrentSuggestionField('department');
    setCurrentSuggestionIndex(itemIndex);
    setShowDepartmentSuggestions(true);
    filterDepartmentsForItem(departmentSearchTerm, itemIndex);
  };

  // �μ� �Է� �� ó��
  const handleDepartmentInputBlur = () => {
    setTimeout(() => {
      setShowDepartmentSuggestions(false);
    }, 200);
  };

  // �μ� ���� - ������ ���� (�ߺ� ȣ�� ����)
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

  // ���õ� �μ� ���� - ������ ���� (�ߺ� ȣ�� ����)
  const removeDepartment = useCallback((departmentName) => {
    setFormData(prevData => ({
      ...prevData,
      requestDepartments: prevData.requestDepartments.filter(dept => {
        const deptName = typeof dept === 'string' ? dept : dept.department || dept.name || dept;
        return deptName !== departmentName;
      })
    }));
  }, []);

  // ����ǰ�� ��û�μ� ���� - ������ ���� (�ߺ� ȣ�� ����)
  const selectItemDepartment = useCallback((itemIndex, department) => {
    setFormData(prevData => {
      const updated = [...prevData.purchaseItems];
      
      // requestDepartments�� ������ �� �迭�� �ʱ�ȭ
      if (!updated[itemIndex].requestDepartments) {
        updated[itemIndex].requestDepartments = [];
      }
      
      // �̹� ���õ� �μ����� Ȯ��
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
    
    // �μ� ���� �� �˻��� �ʱ�ȭ
    setDepartmentSearchTerm('');
    setShowDepartmentSuggestions(false);
  }, []);

  // ����ǰ�� ����
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

  // ����ǰ�� ��û�μ� ���� - ������ ���� (�ߺ� ȣ�� ����)
  const removeItemDepartment = useCallback((itemIndex, departmentName) => {
    setFormData(prevData => {
      const updated = [...prevData.purchaseItems];
      
      if (updated[itemIndex].requestDepartments) {
        updated[itemIndex].requestDepartments = updated[itemIndex].requestDepartments.filter(dept => {
          const deptName = typeof dept === 'string' ? dept : dept.department || dept.name || dept;
          return deptName !== departmentName;
        });
      }
      
      return {
        ...prevData,
        purchaseItems: updated
      };
    });
  }, []);

  // ����ǰ�� ���й� �߰� - ��ȭ�� ���� (�ߺ� ȣ�� �� ���� ����ġ ����)
  const addCostAllocation = useCallback((itemIndex) => {
    console.log(`?? addCostAllocation ȣ��:`, { itemIndex });
    
    // �Լ� ���� �ߺ� ������ ���� �÷���
    if (addCostAllocation.isExecuting) {
      console.log(`?? addCostAllocation �̹� ���� ��, �ߺ� ȣ�� ����`);
      return;
    }
    
    addCostAllocation.isExecuting = true;
    
    try {
      setFormData(prevData => {
        // ���� ������ ���� ���纻 ����
        const updated = JSON.parse(JSON.stringify(prevData.purchaseItems));
        
        // costAllocation�� ������ ����
        if (!updated[itemIndex].costAllocation) {
          updated[itemIndex].costAllocation = { 
            type: 'percentage',
            allocations: [] 
          };
        }
        
        // allocations�� ������ �� �迭�� �ʱ�ȭ
        if (!updated[itemIndex].costAllocation.allocations) {
          updated[itemIndex].costAllocation.allocations = [];
        }
        
        // ���ο� ���й� �߰�
        const newAllocation = {
          id: Date.now() + Math.random(),
          department: '',
          type: 'percentage',
          value: 0
        };
        
        console.log(`?? ���ο� allocation �߰�:`, newAllocation);
        console.log(`?? �߰� �� allocations ����:`, updated[itemIndex].costAllocation.allocations.length);
        
        // ���� allocations�� �� allocation �߰�
        updated[itemIndex].costAllocation.allocations.push(newAllocation);
        
        console.log(`?? �߰� �� allocations ����:`, updated[itemIndex].costAllocation.allocations.length);
        
        // ���й� ������ ���� �յ� �й� ���
        const totalAllocations = updated[itemIndex].costAllocation.allocations.length;
        const equalRatio = totalAllocations > 0 ? Math.round(100 / totalAllocations) : 0;
        
        // ��� ���й��� ������ �յ��ϰ� ����
        const equalizedAllocations = updated[itemIndex].costAllocation.allocations.map((alloc, index) => {
          // ������ �й�� ������ ������ ��� ���������� ����
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
        
        console.log(`?? ������Ʈ�� allocations:`, equalizedAllocations);
        console.log(`?? ���� purchaseItems:`, updated);
        
        return {
          ...prevData,
          purchaseItems: updated
        };
      });
    } finally {
      // ���� �Ϸ� �� �÷��� ����
      setTimeout(() => {
        addCostAllocation.isExecuting = false;
      }, 100);
    }
  }, []);

  // ����ǰ�� ���й� ���� - ������ ���� (�ߺ� ȣ�� ����)
  const removeCostAllocation = useCallback((itemIndex, allocationIndex) => {
    console.log(`?? removeCostAllocation ȣ��:`, { itemIndex, allocationIndex });
    
    setFormData(prevData => {
      const updated = [...prevData.purchaseItems];
      
      // costAllocation�� ������ ����
      if (!updated[itemIndex].costAllocation) {
        updated[itemIndex].costAllocation = { 
          type: 'percentage',
          allocations: [] 
        };
      }
      
      // allocations�� ������ �� �迭�� �ʱ�ȭ
      if (!updated[itemIndex].costAllocation.allocations) {
        updated[itemIndex].costAllocation.allocations = [];
      }
      
      // �ش� �й� ����
      const updatedAllocations = updated[itemIndex].costAllocation.allocations.filter((_, index) => index !== allocationIndex);
      
      console.log(`?? ���� �� allocations:`, updatedAllocations);
      
      // ���� �� ������ �й���� ������ �յ��ϰ� ��й�
      if (updatedAllocations.length > 0) {
        const equalRatio = Math.round(100 / updatedAllocations.length);
        const equalizedAllocations = updatedAllocations.map((alloc, index) => {
          // ������ �й�� ������ ������ ��� ���������� ����
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
        console.log(`?? �յ� �й� �� allocations:`, equalizedAllocations);
      } else {
        updated[itemIndex].costAllocation.allocations = updatedAllocations;
      }
      
      console.log(`?? ���� purchaseItems:`, updated);
      
      return {
        ...prevData,
        purchaseItems: updated
      };
    });
  }, []);

  // ����ǰ�� ���й� ������Ʈ - ������ ���� (�ߺ� ȣ�� ����)
  const updateCostAllocation = useCallback((itemIndex, allocationIndex, field, value) => {
    console.log(`?? updateCostAllocation ȣ��:`, { itemIndex, allocationIndex, field, value });
    
    setFormData(prevData => {
      const updated = [...prevData.purchaseItems];
      
      // costAllocation�� ������ ����
      if (!updated[itemIndex].costAllocation) {
        updated[itemIndex].costAllocation = { 
          type: 'percentage',
          allocations: [] 
        };
      }
      
      // allocations�� ������ �� �迭�� �ʱ�ȭ
      if (!updated[itemIndex].costAllocation.allocations) {
        updated[itemIndex].costAllocation.allocations = [];
      }
      
      // allocation�� ������ ����
      if (!updated[itemIndex].costAllocation.allocations[allocationIndex]) {
        updated[itemIndex].costAllocation.allocations[allocationIndex] = {
          id: Date.now() + Math.random(),
          department: '',
          type: 'percentage',
          value: 0
        };
      }
      
      // �� ������Ʈ
      updated[itemIndex].costAllocation.allocations[allocationIndex][field] = value;
      
      console.log(`?? ������Ʈ �� allocation:`, updated[itemIndex].costAllocation.allocations[allocationIndex]);
      
      // ������ ��� ���� 100%�� ���� �ʵ��� ����
      if (field === 'value' && updated[itemIndex].costAllocation.allocations[allocationIndex].type === 'percentage') {
        const currentAllocations = updated[itemIndex].costAllocation.allocations;
        const totalPercentage = currentAllocations.reduce((sum, alloc, idx) => {
          if (alloc.type === 'percentage' && idx !== allocationIndex) {
            return sum + (alloc.value || 0);
          }
          return sum;
        }, 0) + value;
        
        // 100%�� �Ѵ� ��� ���� �Է°��� ����
        if (totalPercentage > 100) {
          updated[itemIndex].costAllocation.allocations[allocationIndex].value = Math.max(0, 100 - totalPercentage + value);
        }
      }
      
      console.log(`?? ���� ������Ʈ�� purchaseItems:`, updated);
      
      return {
        ...prevData,
        purchaseItems: updated
      };
    });
  }, []);

  // ����ǰ�� ���й� �հ� ���
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

  // ����ǰ�� ���й� �հ踦 ������ ȯ��
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

  // ��ü ���ͼӺμ� ��� �ǽð� ���
  const calculateTotalCostAllocation = () => {
    const totalAllocation = {};
    const totalContractAmount = calculateTotalAmount();
    
    // ��� ����ǰ���� ���й� ������ �����Ͽ� �ǽð� ���
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
    
    // ��ü ���ݾ� ��� �� �μ��� ���� ���
    Object.keys(totalAllocation).forEach(department => {
      if (totalContractAmount > 0) {
        totalAllocation[department].percentage = (totalAllocation[department].amount / totalContractAmount) * 100;
      } else {
        totalAllocation[department].percentage = 0;
      }
    });
    
    return totalAllocation;
  };



  // �μ� ��Ӵٿ� ����
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

  // ���� ���� ��������
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
        console.log('���� ���� ����:', categoryFilter);
      }
      
      const url = `${API_BASE_URL}/api/purchase-history?${params.toString()}`;
      console.log('API ȣ��:', url);
      
      const response = await fetch(url);
      const data = await response.json();
      console.log('�˻� ���:', data);
      
      // ������ ǰ���� �׷�ȭ�ϰ� ��ձݾ� ���
      if (field === 'productName' || field === 'supplier') {
        const groupedData = groupAndCalculateAverage(data, field);
        setPurchaseHistory(groupedData);
      } else {
        setPurchaseHistory(data);
      }
    } catch (error) {
      console.error('���� ���� �ε� ����:', error);
    }
  };

  // ���к� �������� ���� �Լ�
  const getAccountSubjectByCategory = (category) => {
    const accountMapping = {
      '����Ʈ����': {
        ��: '�����ڻ�',
        ��: '��Ÿ�����ڻ�',
        ��: '�����ڻ�',
        ��: '����Ʈ����'
      },
      '����ⱸ��ǰ': {
        ��: '�����ڻ�',
        ��: '�����ڻ�',
        ��: '����ⱸ��ǰ'
      },
      '�������': {
        ��: '�����ڻ�',
        ��: '�����ڻ�',
        ��: '���������'
      },
      '���꼳ġ': {
        ��: '�������',
        ��: '�ǰ���',
        ��: '�������',
        ��: '���꼳ġ��'
      },
      '����Ҹ�ǰ': {
        ��: '�������',
        ��: '�ǰ���',
        ��: '�������',
        ��: '����Ҹ�ǰ��'
      },
      '����뿪': {
        ��: '�������',
        ��: '�ǰ���',
        ��: '�������',
        ��: '����뿪��'
      },
      '��������': {
        ��: '�������',
        ��: '�ǰ���',
        ��: '�������',
        ��: '����������'
      },
      '����ȸ��': {
        ��: '�������',
        ��: '�ǰ���',
        ��: '�������',
        ��: '����ȸ����'
      },
      '������ȭ': {
        ��: '�������',
        ��: '�ǰ���',
        ��: '�������',
        ��: '������ȭ��'
      },
      '����������': {
        ��: '�������',
        ��: '�ǰ���',
        ��: '�������',
        ��: '�����������'
      },
      '�����': {
        ��: '�������',
        ��: '�ǰ���',
        ��: '��Ÿ�ǰ���',
        ��: '�����'
      },
      '�Ϲݾ���������': {
        ��: '�������',
        ��: '�ǰ���',
        ��: '��Ÿ�ǰ���',
        ��: '�Ϲݾ���������'
      },
      '���������': {
        ��: '�������',
        ��: '�ǰ���',
        ��: '��Ÿ�ǰ���',
        ��: '���������'
      },
      'ȸ��װ�����': {
        ��: '�������',
        ��: '�ǰ���',
        ��: '���ݰ�������',
        ��: 'ȸ��װ�����'
      }
    };
    
    return accountMapping[category] || null;
  };

  // ������ ǰ���� �׷�ȭ�ϰ� ��ձݾ� ����ϴ� �Լ�
  const groupAndCalculateAverage = (data, field) => {
    const grouped = {};
    
    data.forEach(item => {
      let key;
      if (field === 'productName') {
        key = item.product_name;
      } else if (field === 'supplier') {
        key = item.supplier;
      } else {
        return; // �ٸ� �ʵ��� ��� �׷�ȭ���� ����
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
    
    // ��� �ܰ� ��� �� �迭�� ��ȯ
    const result = Object.values(grouped).map(item => ({
      ...item,
      avg_unit_price: item.frequency > 0 ? Math.round(item.total_amount / item.frequency) : 0,
      min_price: item.min_price === Infinity ? 0 : item.min_price,
      max_price: item.max_price === Infinity ? 0 : item.max_price
    }));
    
    // ����Ƚ�� �������� ���� (���� ��)
    result.sort((a, b) => b.frequency - a.frequency);
    
    return result;
  };

  // �ǽð� �˻� ��ٿ
  const [searchTimeout, setSearchTimeout] = useState(null);

  // �̸����� ���� ����
  const [showPreview, setShowPreview] = useState(false);
  const [popupSize, setPopupSize] = useState({ width: 99, height: 97 }); // �˾� ũ�� ���� (vw, vh ����)
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState(null);

  // �������� �ڵ鷯
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


  const debouncedSearch = (searchTerm, field, itemIndex) => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    const timeout = setTimeout(() => {
      console.log('�˻� ����:', { searchTerm, field, itemIndex });
      if (searchTerm.trim()) {
        // ���� �˻� �� �ش� ǰ���� ���� ���� ����
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
        // �˻�� ������ ��õ �����
        setShowItemSuggestions(false);
        setShowProductSuggestions(false);
        setShowSupplierSuggestions(false);
      }
    }, 300);
    
    setSearchTimeout(timeout);
  };

  // ��õ ����
  const selectSuggestion = (field, value, itemIndex) => {
    const updated = [...formData.purchaseItems];
    updated[itemIndex][field] = value;
    setFormData({...formData, purchaseItems: updated});
    
    // ��õ â �ݱ�
    setShowItemSuggestions(false);
    setShowProductSuggestions(false);
    setShowSupplierSuggestions(false);
    setCurrentSuggestionField(null);
    setCurrentSuggestionIndex(null);
  };

  // �Է� �ʵ� ��Ŀ�� �� ��õ ǥ��
  const handleInputFocus = async (field, itemIndex, searchTerm = '') => {
    setCurrentSuggestionField(field);
    setCurrentSuggestionIndex(itemIndex);
    
    // ���� �ʵ� ��Ŀ�� �� ���� ���� ����
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

  // �Է� �ʵ� �� �� ��õ �����
  const handleInputBlur = () => {
    setTimeout(() => {
      setShowItemSuggestions(false);
      setShowProductSuggestions(false);
      setShowSupplierSuggestions(false);
      setCurrentSuggestionField(null);
      setCurrentSuggestionIndex(null);
    }, 200);
  };

  // ���� ��� ������ ����ȭ �Լ�
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

  // ���� ǰ�Ǽ� ���� �Լ� (�ӽ����� + �ۼ��Ϸ�)
  const handleProposalSave = async (isDraft = true, preventNavigation = false) => {
    try {
      console.log(isDraft ? '�ӽ����� ����...' : '�ۼ��Ϸ� ���� ����...');
      
      // ������ ����
      if (isDraft) {
        // �ӽ�����: �ּ� 1�� �̻��� ���� �ִ��� Ȯ��
        const hasAnyData = formData.title?.trim() ||
                          formData.purpose?.trim() || 
                          formData.basis?.trim() || 
                          formData.budget || 
                          formData.accountSubject?.trim() ||
                          (formData.purchaseItems && formData.purchaseItems.length > 0) ||
                          (formData.serviceItems && formData.serviceItems.length > 0) ||
                          formData.wysiwygContent?.trim(); // ������� ���� �߰�
        
        if (!hasAnyData) {
          alert('������ �����Ͱ� �����ϴ�. �ּ� 1�� �̻��� �׸��� �Է����ּ���.');
          return;
        }
        console.log('? �ӽ����� �ּ� ������ Ȯ�� �Ϸ�');
        console.log('?? ����� - wysiwygContent ��:', formData.wysiwygContent);
        console.log('?? ����� - wysiwygContent ����:', formData.wysiwygContent?.length);
        console.log('?? ����� - contractType:', contractType);
      } else {
        // �ۼ��Ϸ�: �ʼ� �׸� ����
        console.log('? �ۼ��Ϸ� �ʼ� �׸� ���� ����');
        
        if (!formData.purpose?.trim()) {
          alert('ǰ�Ǽ� ������ �Է����ּ���.');
          return;
        }
        
        if (!formData.basis?.trim()) {
          alert('��� �ٰŸ� �Է����ּ���.');
          return;
        }
        
        if (!formData.budget) {
          alert('��������� �������ּ���.');
          return;
        }
        
        if (!formData.accountSubject?.trim()) {
          alert('��Ÿ ������ �Է����ּ���.');
          return;
        }
        
        // ��� ������ �ʼ� �׸� ����
        if (contractType === 'purchase' || contractType === 'change' || contractType === 'extension') {
          if (!formData.purchaseItems || formData.purchaseItems.length === 0) {
            alert('����ǰ���� �߰����ּ���.');
            return;
          }
          
          // �� ����ǰ���� �ʼ� �׸� ����
          for (let i = 0; i < formData.purchaseItems.length; i++) {
            const item = formData.purchaseItems[i];
            if (!item.item?.trim()) {
              alert(`${i + 1}��° ����ǰ���� ������ �Է����ּ���.`);
              return;
            }
            if (!item.productName?.trim()) {
              alert(`${i + 1}��° ����ǰ���� ������ �Է����ּ���.`);
              return;
            }
            if (!item.quantity || item.quantity <= 0) {
              alert(`${i + 1}��° ����ǰ���� ������ �Է����ּ���.`);
              return;
            }
            if (!item.unitPrice || item.unitPrice <= 0) {
              alert(`${i + 1}��° ����ǰ���� �ܰ��� �Է����ּ���.`);
              return;
            }
          }
        } else if (contractType === 'service') {
          if (!formData.serviceItems || formData.serviceItems.length === 0) {
            alert('�뿪ǰ���� �߰����ּ���.');
            return;
          }
          
          // �� �뿪ǰ���� �ʼ� �׸� ����
          for (let i = 0; i < formData.serviceItems.length; i++) {
            const item = formData.serviceItems[i];
            if (!item.item?.trim()) {
              alert(`${i + 1}��° �뿪ǰ���� �׸���� �Է����ּ���.`);
              return;
            }
            if (!item.personnel || item.personnel <= 0) {
              alert(`${i + 1}��° �뿪ǰ���� �ο����� �Է����ּ���.`);
              return;
            }
            if (!item.contractAmount || item.contractAmount <= 0) {
              alert(`${i + 1}��° �뿪ǰ���� ���ݾ��� �Է����ּ���.`);
              return;
            }
          }
        } else if (contractType === 'freeform') {
          if (!formData.wysiwygContent?.trim()) {
            alert('������� ���� ������ �Է����ּ���.');
            return;
          }
        }
        
        // ���ͼӺй� �ʼ� ���� (���Ű���� ���)
        if (contractType === 'purchase' || contractType === 'change' || contractType === 'extension') {
          for (let i = 0; i < formData.purchaseItems.length; i++) {
            const item = formData.purchaseItems[i];
            if (!item.costAllocation || !item.costAllocation.allocations || item.costAllocation.allocations.length === 0) {
              alert(`${i + 1}��° ����ǰ���� ���ͼӺй� ������ �Է����ּ���.`);
              return;
            }
            
            // ���й� �հ� ����
            const totalPercentage = item.costAllocation.allocations.reduce((sum, alloc) => {
              return alloc.type === 'percentage' ? sum + (alloc.value || 0) : sum;
            }, 0);
            
            if (Math.abs(totalPercentage - 100) > 0.01) {
              alert(`${i + 1}��° ����ǰ���� ���й� ���� �հ谡 100%�� �ƴմϴ�. (����: ${totalPercentage}%)`);
              return;
            }
          }
        }
        
        console.log('? �ۼ��Ϸ� �ʼ� �׸� ���� �Ϸ�');
      }
      
      // ����ǰ�� ���й� ���� ���� (��ȭ�� ����)
      const purchaseItemCostAllocations = [];
      console.log(`=== ${isDraft ? '�ӽ�����' : '�ۼ��Ϸ�'} �� ���й� ���� ���� ===`);
      console.log('��ü ����ǰ�� ��:', formData.purchaseItems.length);
      
      formData.purchaseItems.forEach((item, itemIndex) => {
        console.log(`����ǰ�� ${itemIndex + 1} (${item.item}) ���й� ����:`, {
          hasCostAllocation: !!item.costAllocation,
          costAllocationData: item.costAllocation,
          allocationsCount: item.costAllocation?.allocations?.length || 0,
          itemData: item
        });
        
        // ���й� ������ �ִ� ��쿡�� ����
        if (item.costAllocation && item.costAllocation.allocations && item.costAllocation.allocations.length > 0) {
          item.costAllocation.allocations.forEach((alloc, allocIndex) => {
            // ��ȿ�� �˻� �߰�
            if (alloc && alloc.department && (alloc.value || alloc.value === 0)) {
              const allocationData = {
                itemIndex,
                allocationIndex: allocIndex,
                department: alloc.department,
                type: alloc.type || 'percentage',
                value: alloc.value,
                amount: alloc.type === 'percentage' ? (item.amount * (alloc.value / 100)) : alloc.value,
                // �߰� �ĺ� ����
                itemName: item.item,
                productName: item.productName
              };
              purchaseItemCostAllocations.push(allocationData);
              console.log(`  �Ҵ� ${allocIndex + 1}:`, allocationData);
            } else {
              console.log(`  �Ҵ� ${allocIndex + 1} ��ȿ���� ����:`, alloc);
            }
          });
        } else {
          console.log(`  ���й� ���� ����`);
        }
      });
      
      console.log('���� ������ ���й� ����:', purchaseItemCostAllocations);

      // ����ǰ�� ���й� ������ ���� �����Ͽ� ���� (��ȭ�� ����)
      const purchaseItemsWithAllocations = formData.purchaseItems.map(item => {
        // costAllocation�� ���ų� allocations�� ������ �⺻�� ����
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
        
        // requestDepartments�� ������ �� �迭�� �ʱ�ȭ
        const requestDepartments = item.requestDepartments || [];
        
        return {
          ...item,
          costAllocation,
          requestDepartments
        };
      });

      // ��û�μ� ������ ����ȭ (���ڿ� �迭�� ��ȯ)
      const normalizedRequestDepartments = (formData.requestDepartments || []).map(dept => 
        typeof dept === 'string' ? dept : dept.department || dept.name || dept
      ).filter(Boolean); // �� �� ����

      // ��� ���� ����
      if (!contractType) {
        alert('��� ������ �������ּ���.');
        return;
      }
      
      // budget �� �����
      console.log('?? �ӽ����� �� budget �� Ȯ��:', {
        'formData.budget': formData.budget,
        'typeof formData.budget': typeof formData.budget,
        'parseInt(formData.budget)': parseInt(formData.budget),
        'isNaN(parseInt(formData.budget))': isNaN(parseInt(formData.budget))
      });

      // �� �ݾ� ���
      const totalAmount = calculateTotalAmount();
      console.log('?? �ӽ����� �� �� �ݾ�:', totalAmount);

      const proposalData = {
        contractType: contractType, // ����ڰ� ������ ��� ����
        title: formData.title || '',
        purpose: formData.purpose || 'ǰ�Ǽ�',
        basis: formData.basis || '',
        budget: formData.budget || '',
        contractMethod: formData.contractMethod || '',
        accountSubject: formData.accountSubject || '',
        totalAmount: totalAmount, // �� �ݾ� �߰�
        requestDepartments: normalizedRequestDepartments, // ����ȭ�� ��û�μ�
        purchaseItems: purchaseItemsWithAllocations, // ���й� ������ ���Ե� ����ǰ��
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
        wysiwygContent: formData.wysiwygContent || '', // ������� ���� ���� �߰�
        createdBy: '�����1', // ���������� ����
        isDraft: isDraft, // �Ű������� ���� ����
        status: isDraft ? 'draft' : 'submitted', // �ӽ�����: draft, �ۼ��Ϸ�: submitted
        purchaseItemCostAllocations // �߰��� ���� ���� (�����)
      };

      // ���� ����� ��� proposalId�� �߰����� ���� (�������� �ڵ� ����)

      console.log('������ ������ ������:', proposalData);
      console.log('?? ����� - ������ wysiwygContent:', proposalData.wysiwygContent);

      // ���� ����� ��� PUT, ���� �ۼ��� ��� POST
      let url, method;
      
      // API ���� �� ���� ��� ó��
      if (isDraft) {
        // �ӽ�����: draft API ��� (���� ���� �ű� �ۼ� ���)
        url = `${API_BASE_URL}/api/proposals/draft`;
        method = 'POST';
        
        // ���� ����� ��� proposalId ����
        if (editingProposalId) {
          proposalData.proposalId = editingProposalId;
          console.log('�ӽ����� - ���� ��� (ID ����):', editingProposalId);
        } else {
          console.log('�ӽ����� - ���� �ۼ�');
        }
      } else {
        // �ۼ��Ϸ�: �Ϲ� API ���
        if (isEditMode && editingProposalId) {
          // ���� ���: PUT ��û
          url = `${API_BASE_URL}/api/proposals/${editingProposalId}`;
          method = 'PUT';
          console.log('�ۼ��Ϸ� - ���� ��� PUT ��û:', url);
        } else {
          // �ű� �ۼ�: POST ��û
                      url = `${API_BASE_URL}/api/proposals`;
          method = 'POST';
          console.log('�ۼ��Ϸ� - �ű� �ۼ� POST ��û:', url);
        }
      }
      
      console.log('��û URL:', url);
      console.log('��û �޼���:', method);
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(proposalData)
      });

      // ���� �ؽ�Ʈ�� ���� Ȯ��
      const responseText = await response.text();
      console.log('�ӽ����� ���� �ؽ�Ʈ:', responseText);
      
      let result;
      try {
        result = JSON.parse(responseText);
        console.log('�ӽ����� ���� (JSON):', result);
      } catch (parseError) {
        console.error('JSON �Ľ� ����:', parseError);
        console.error('���� �ؽ�Ʈ:', responseText);
        alert(`���� ������ �Ľ��� �� �����ϴ�: ${responseText.substring(0, 100)}...`);
        return;
      }

      if (result.error) {
        console.log('�ӽ����� ����:', result);
        alert(`�ӽ����� ����: ${result.error}`);
        return;
      }

      // ���� �� proposalId ����
      if (result.proposalId) {
        setProposalId(result.proposalId);
        console.log('ǰ�Ǽ� ID ����:', result.proposalId);
      }

      // ���� �޽��� (preventNavigation�� true�� ��� �޽��� ǥ�� ����)
      if (!preventNavigation) {
        if (isDraft) {
          // �ӽ����� �޽���
          if (editingProposalId) {
            alert('ǰ�Ǽ��� �����Ǿ����ϴ�.');
          } else {
            alert('ǰ�Ǽ��� �ӽ�����Ǿ����ϴ�.');
          }
        } else {
          // �ۼ��Ϸ� �޽���
          const currentProposalId = result.proposalId || editingProposalId;
          const message = (isEditMode && editingProposalId)
            ? `ǰ�Ǽ��� ���������� �����Ǿ����ϴ�! (ID: ${currentProposalId})`
            : `ǰ�Ǽ��� ���������� �ۼ��Ϸ�Ǿ����ϴ�! (ID: ${currentProposalId})`;
          alert(message);
        }
      }
      
      // �׺���̼� ó��
      if (!preventNavigation) {
        if (isDraft) {
          // �ӽ�����: �ۼ����� ǰ�Ǽ� �������� �̵�
          if (!editingProposalId) {
            console.log('�ӽ����� �Ϸ� - �ۼ����� ǰ�Ǽ� �������� �̵�');
            setTimeout(() => {
              navigate('/draft-list');
            }, 1500);
          }
        } else {
          // �ۼ��Ϸ�: ǰ�Ǽ� ��ȸ �������� �̵�
          console.log('�ۼ��Ϸ� - ǰ�Ǽ� ��ȸ �������� �̵�');
          console.log('���� ����:', { isEditMode, editingProposalId, proposalId });
          
          // ���� ��� �Ϸ� �� ���� ���� �ʱ�ȭ
          if (isEditMode && editingProposalId) {
            console.log('���� ��� �Ϸ� - ���� �ʱ�ȭ');
            setIsEditMode(false);
            setEditingProposalId(null);
            setProposalId(null);
          }
          
          // ��� �̵� (�˸� �� �ٷ� �̵�)
          console.log('ǰ�Ǽ� ��ȸ ȭ������ �̵� ����...');
          console.log('?? �׺���̼� ���: /contract-list');
          setTimeout(() => {
            console.log('���� �׺���̼� ����: /contract-list');
            navigate('/contract-list', { 
              state: { 
                refreshList: true,
                message: (isEditMode && editingProposalId) ? 'ǰ�Ǽ��� ���������� �����Ǿ����ϴ�!' : 'ǰ�Ǽ��� ���������� �ۼ��Ǿ����ϴ�!'
              }
            });
            console.log('? �׺���̼� �Ϸ�: /contract-list');
          }, 500); // 500ms�� ����
        }
      }
      
    } catch (error) {
      console.error('�ӽ����� ����:', error);
      alert('�ӽ����� �� ������ �߻��߽��ϴ�.');
    }
  };

  // �̸����� �Լ�
  const handlePreview = () => {
    setShowPreview(true);
  };

  const handleClosePreview = () => {
    setShowPreview(false);
    // �˾� ũ�� �ʱ�ȭ (���û���)
    // setPopupSize({ width: 99, height: 97 });
  };

  // Ű���� ����Ű ó��
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

  // ���ڸ� �ѱ۷� ��ȯ�ϴ� �Լ�
  const numberToKorean = (number) => {
    if (!number || number === 0) return '';
    
    const units = ['', '��', '��', '��'];
    const digits = ['', '��', '��', '��', '��', '��', '��', 'ĥ', '��', '��'];
    const tens = ['', '��', '�̽�', '���', '���', '����', '����', 'ĥ��', '�Ƚ�', '����'];
    
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
          chunkStr += (thousands === 1 ? '' : digits[thousands]) + 'õ';
        }
        
        if (hundreds > 0) {
          chunkStr += (hundreds === 1 ? '' : digits[hundreds]) + '��';
        }
        
        if (remainder >= 20) {
          chunkStr += tens[Math.floor(remainder / 10)];
          if (remainder % 10 > 0) {
            chunkStr += digits[remainder % 10];
          }
        } else if (remainder >= 10) {
          chunkStr += '��';
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
    
    return result + '��';
  };

  // �̹��� ĸó �Լ�
  const handleCaptureImage = async () => {
    try {
      // ĸó�� ��� (7�� ���ͼӱ�����)
      const element = document.getElementById('capture-content');
      if (!element) {
        alert('ĸó�� ��Ҹ� ã�� �� �����ϴ�.');
        return;
      }

      // Ŭ������ ���� �õ� (���� �� �ڵ����� �ٿ�ε�� fallback)
      await captureAndSaveToClipboard(element);
      
    } catch (error) {
      console.error('�̹��� ĸó ����:', error);
      alert('�̹��� ĸó �� ������ �߻��߽��ϴ�: ' + error.message);
      
      // ��ư ���� ����
      const captureBtn = document.querySelector('.capture-btn');
      if (captureBtn) {
        captureBtn.textContent = '?? �ٽɳ��� ĸó';
        captureBtn.disabled = false;
      }
    }
  };

    // Ŭ�����忡 �����ϴ� �Լ�
  const captureAndSaveToClipboard = async (element) => {
    // ĸó �ɼ� ����
    const options = {
      scale: 2, // ���ػ� ĸó
      useCORS: true, // �ܺ� ���ҽ� ���
      backgroundColor: '#ffffff', // ���� ����
      width: element.scrollWidth,
      height: element.scrollHeight,
      scrollX: 0,
      scrollY: 0
    };

    // �ε� ǥ��
    const captureBtn = document.querySelector('.capture-btn');
    if (captureBtn) {
      captureBtn.textContent = '?? ĸó ��...';
      captureBtn.disabled = true;
    }

    try {
      // ĸó�� ��Ҹ� �ӽ÷� ǥ��
      element.style.display = 'block';
      
      // �̹��� ĸó ����
      const canvas = await html2canvas(element, options);
      
      // ĸó�� ��Ҹ� �ٽ� ����
      element.style.display = 'none';
      
      // ĵ������ �̹��� �����ͷ� ��ȯ
      const imageDataUrl = canvas.toDataURL('image/png', 1.0);
      
      // ���� ������ ��ȸ�Ͽ� �̹��� ���� �õ�
      try {
        // ������ ȯ�� Ȯ��
        if (navigator.clipboard && window.ClipboardItem) {
          try {
            // Data URL�� Blob���� ��ȯ
            const response = await fetch(imageDataUrl);
            const blob = await response.blob();
            
            const clipboardItem = new ClipboardItem({
              'image/png': blob
            });
            await navigator.clipboard.write([clipboardItem]);
            
            // ���� �� ��ư ���� ����
            if (captureBtn) {
              captureBtn.textContent = '?? Ŭ������ ����';
              captureBtn.disabled = false;
            }
            
            alert('�̹����� Ŭ�����忡 ���������� ����Ǿ����ϴ�! Ctrl+V�� �ٿ��ֱ��� �� �ֽ��ϴ�.');
            return;
          } catch (clipboardError) {
            console.log('Ŭ������ ���� ����, �ٿ�ε�� ����:', clipboardError);
            // ���� ���� �� ����ڿ��� �ȳ�
            const userChoice = window.confirm(
              'Ŭ������ ���忡 �����߽��ϴ�.\n\n' +
              '�̴� ������ ���� ��å ������ �� �ֽ��ϴ�.\n\n' +
              '"Ȯ��"�� Ŭ���ϸ� �̹����� �ٿ�ε��մϴ�.'
            );
            
            if (userChoice) {
              await captureAndDownload(element, imageDataUrl, captureBtn);
            } else {
              // ����ڰ� ����� ��� ��ư ���¸� ����
              if (captureBtn) {
                captureBtn.textContent = '?? Ŭ������ ����';
                captureBtn.disabled = false;
              }
            }
            return;
          }
        }
        
        // ClipboardItem�� �������� �ʴ� �������� �ٷ� �ٿ�ε�
        await captureAndDownload(element, imageDataUrl, captureBtn);
        
      } catch (error) {
        console.error('�̹��� ó�� ����:', error);
        // ���� fallback: �ٿ�ε�
        await captureAndDownload(element, imageDataUrl, captureBtn);
      }
    } catch (error) {
      console.error('ĸó ����:', error);
      throw error;
    }
  };

  // �ٿ�ε� �Լ�
  const captureAndDownload = async (element, imageDataUrl = null, captureBtn = null) => {
    try {
      let finalImageDataUrl = imageDataUrl;
      
      // �̹��� �����Ͱ� ���� ��� ���� ĸó
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

        // ĸó�� ��Ҹ� �ӽ÷� ǥ��
        element.style.display = 'block';
        
        const canvas = await html2canvas(element, options);
        element.style.display = 'none';
        
        finalImageDataUrl = canvas.toDataURL('image/png', 1.0);
      }

      // �ٿ�ε� ����
      const link = document.createElement('a');
      link.download = `ǰ�Ǽ�_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.png`;
      link.href = finalImageDataUrl;
      link.click();
      
      // ��ư ���� ����
      if (captureBtn) {
        captureBtn.textContent = '?? Ŭ������ ����';
        captureBtn.disabled = false;
      }
      
      alert('�̹����� �ٿ�ε�Ǿ����ϴ�!');
    } catch (error) {
      console.error('�ٿ�ε� ����:', error);
      
      // ��ư ���� ����
      if (captureBtn) {
        captureBtn.textContent = '?? Ŭ������ ����';
        captureBtn.disabled = false;
      }
      
      alert('�̹��� �ٿ�ε忡 �����߽��ϴ�. �ٽ� �õ����ּ���.');
    }
  };



  // ���ο� handleSubmit �Լ� (�ӽ����� ��� Ȱ��)
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('=== ǰ�Ǽ� �ۼ��Ϸ� ���� ===');
    console.log('isEditMode:', isEditMode);
    console.log('editingProposalId:', editingProposalId);
    console.log('proposalId:', proposalId);
    
    // �ʼ� �׸� ����
    if (!formData.purpose?.trim()) {
      alert('ǰ�Ǽ� ������ �Է����ּ���.');
      return;
    }
    
    if (!formData.basis?.trim()) {
      alert('��� �ٰŸ� �Է����ּ���.');
      return;
    }
    
    if (!formData.budget) {
      alert('��������� �������ּ���.');
      return;
    }
    
    if (!formData.accountSubject?.trim()) {
      alert('��Ÿ ������ �Է����ּ���.');
      return;
    }
    
    // ��� ������ �ʼ� �׸� ����
    if (contractType === 'purchase' || contractType === 'change' || contractType === 'extension') {
      if (!formData.purchaseItems || formData.purchaseItems.length === 0) {
        alert('����ǰ���� �߰����ּ���.');
        return;
      }
      
      // �� ����ǰ���� �ʼ� �׸� ����
      for (let i = 0; i < formData.purchaseItems.length; i++) {
        const item = formData.purchaseItems[i];
        if (!item.item?.trim()) {
          alert(`${i + 1}��° ����ǰ���� ������ �Է����ּ���.`);
          return;
        }
        if (!item.productName?.trim()) {
          alert(`${i + 1}��° ����ǰ���� ������ �Է����ּ���.`);
          return;
        }
        if (!item.quantity || item.quantity <= 0) {
          alert(`${i + 1}��° ����ǰ���� ������ �Է����ּ���.`);
          return;
        }
        if (!item.unitPrice || item.unitPrice <= 0) {
          alert(`${i + 1}��° ����ǰ���� �ܰ��� �Է����ּ���.`);
          return;
        }
      }
    } else if (contractType === 'service') {
      if (!formData.serviceItems || formData.serviceItems.length === 0) {
        alert('�뿪ǰ���� �߰����ּ���.');
        return;
      }
      
      // �� �뿪ǰ���� �ʼ� �׸� ����
      for (let i = 0; i < formData.serviceItems.length; i++) {
        const item = formData.serviceItems[i];
        if (!item.item?.trim()) {
          alert(`${i + 1}��° �뿪ǰ���� �׸���� �Է����ּ���.`);
          return;
        }
        if (!item.personnel || item.personnel <= 0) {
          alert(`${i + 1}��° �뿪ǰ���� �ο����� �Է����ּ���.`);
          return;
        }
        if (!item.contractAmount || item.contractAmount <= 0) {
          alert(`${i + 1}��° �뿪ǰ���� ���ݾ��� �Է����ּ���.`);
          return;
        }
      }
    } else if (contractType === 'freeform') {
      if (!formData.wysiwygContent?.trim()) {
        alert('������� ���� ������ �Է����ּ���.');
        return;
      }
    }
    
    try {
      console.log('? �ʼ� �׸� ���� �Ϸ�');
      
      // �ۼ��Ϸ�: ���� �Լ� ȣ�� (�޽����� �׺���̼��� ���� �Լ����� ó��)
      console.log('�ۼ��Ϸ�: ���� �Լ� ȣ��');
      await handleProposalSave(false); // isDraft = false (�ۼ��Ϸ�)
      
    } catch (error) {
      console.error('ǰ�Ǽ� �ۼ��Ϸ� ����:', error);
      
      let errorMessage = isEditMode
        ? 'ǰ�Ǽ� ���� �� ������ �߻��߽��ϴ�: '
        : 'ǰ�Ǽ� �ۼ� �� ������ �߻��߽��ϴ�: ';
      
      if (error.message) {
        errorMessage += error.message;
      } else {
        errorMessage += '�� �� ���� ������ �߻��߽��ϴ�.';
      }
      
      alert(errorMessage);
    }
  };

  const handleSubmit_OLD = async (e) => {
    e.preventDefault();
    
    console.log('handleSubmit �Լ� ����');
    console.log('isEditMode:', isEditMode);
    console.log('editingProposalId:', editingProposalId);
    
    try {
      const totalAmount = calculateTotalAmount();
      const approvalLine = getRecommendedApprovalLine();
      
      // �ʼ� �ʵ� ���� �� �⺻�� ����
      // contractType�� ����ڰ� ������ ��� ������ ��Ȯ�� ����
      if (!contractType) {
        throw new Error('��� ������ �������ּ���. (���Ű��, �뿪���, ������, ������, ������� �� ����)');
      }
      
      // �ʼ� �ʵ� ����
      if (!formData.budget) {
        throw new Error('��������� �������ּ���.');
      }
      
      if (!formData.accountSubject || formData.accountSubject.trim() === '') {
        throw new Error('��Ÿ ������ �Է����ּ���.');
      }
      
      if (!formData.basis || formData.basis.trim() === '') {
        throw new Error('�ٰŸ� �Է����ּ���.');
      }
      
      // createdBy�� ������ '�����1'�� ����
      const finalCreatedBy = '�����1';
      
      console.log('=== ������ ���� ��� ===');
      console.log('����� ���� ��� ����:', contractType);
      console.log('��� ���� ����:', {
        'purchase': '���Ű��',
        'service': '�뿪���', 
        'change': '������',
        'extension': '������',
        'freeform': '�������'
      }[contractType]);
      console.log('�ۼ���:', finalCreatedBy);
      console.log('formData.purpose:', formData.purpose);
      console.log('formData.budget:', formData.budget);
      console.log('hasPurpose:', !!formData.purpose);
      console.log('hasBudget:', !!formData.budget);
      console.log('��ü formData:', formData);
      
      // ���� ��忡�� ������ �� ������ ���� ����ȭ
      let proposalData;
      
      if (isEditMode) {
        // ���� ���: ������ ���� ����ȭ
        proposalData = {
          // �ʼ� �ʵ� (���� null�� �� �� ����)
          contractType: contractType, // ����ڰ� ������ ��� ����
          createdBy: finalCreatedBy, // �α����� ����� ����
          purpose: formData.purpose || 'ǰ�Ǽ�',
          
          // �ʼ� �ʵ�
          basis: formData.basis, // �̹� ������
          budget: formData.budget, // �̹� ������
          accountSubject: formData.accountSubject, // �̹� ������
          
          // ���� �ʵ�
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
        
        console.log('���� ��� - proposalData ���� �Ϸ�:', {
          contractType: proposalData.contractType,
          createdBy: proposalData.createdBy,
          purpose: proposalData.purpose,
          hasTotalAmount: !!proposalData.totalAmount
        });
      } else {
        // ���� �ۼ�: ������ ���ο� ��ü ����
        proposalData = {
          // �ʼ� �ʵ� (���� null�� �� �� ����)
          contractType: contractType, // ����ڰ� ������ ��� ����
          createdBy: finalCreatedBy, // �α����� ����� ����
          purpose: formData.purpose || 'ǰ�Ǽ�',
          
          // �ʼ� �ʵ�
          basis: formData.basis, // �̹� ������
          budget: formData.budget, // �̹� ������
          accountSubject: formData.accountSubject, // �̹� ������
          
          // ���� �ʵ�
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
        
        console.log('���� �ۼ� ��� - proposalData ���� �Ϸ�:', {
          contractType: proposalData.contractType,
          createdBy: proposalData.createdBy,
          purpose: proposalData.purpose,
          hasTotalAmount: !!proposalData.totalAmount
        });
      }

      console.log('proposalData:', proposalData);
      
      // ���� ������ ����
      if (!proposalData.contractType) {
        throw new Error('��� ������ �������� �ʾҽ��ϴ�.');
      }
      
      if (!proposalData.createdBy) {
        throw new Error('�ۼ��� ������ �������� �ʾҽ��ϴ�.');
      }
      
      if (!proposalData.purpose) {
        throw new Error('ǰ�Ǽ� ������ �Էµ��� �ʾҽ��ϴ�.');
      }
      
      console.log('������ ���� �Ϸ� - API ��û �غ��');
      
      // ����ǰ�� ���й� ���� ���� (handleDraftSave�� ������ ����)
      const purchaseItemCostAllocations = [];
      console.log('=== �ۼ��Ϸ� �� ���й� ���� ���� ===');
      console.log('��ü ����ǰ�� ��:', formData.purchaseItems.length);
      
      formData.purchaseItems.forEach((item, itemIndex) => {
        console.log(`����ǰ�� ${itemIndex + 1} (${item.item}) ���й� ����:`, {
          hasCostAllocation: !!item.costAllocation,
          costAllocationData: item.costAllocation,
          allocationsCount: item.costAllocation?.allocations?.length || 0
        });
        
        // ���й� ������ �ִ� ��쿡�� ����
        if (item.costAllocation && item.costAllocation.allocations && item.costAllocation.allocations.length > 0) {
          item.costAllocation.allocations.forEach((alloc, allocIndex) => {
            // ��ȿ�� �˻� �߰�
            if (alloc && alloc.department && (alloc.value || alloc.value === 0)) {
              const allocationData = {
                itemIndex,
                allocationIndex: allocIndex,
                department: alloc.department,
                type: alloc.type || 'percentage',
                value: alloc.value,
                amount: alloc.type === 'percentage' ? (item.amount * (alloc.value / 100)) : alloc.value,
                // �߰� �ĺ� ����
                itemName: item.item,
                productName: item.productName
              };
              purchaseItemCostAllocations.push(allocationData);
              console.log(`  �Ҵ� ${allocIndex + 1}:`, allocationData);
            } else {
              console.log(`  �Ҵ� ${allocIndex + 1} ��ȿ���� ����:`, alloc);
            }
          });
        } else {
          console.log(`  ���й� ���� ����`);
        }
      });
      
      console.log('���� ������ ���й� ����:', purchaseItemCostAllocations);
      
      // proposalData�� ���й� ���� �߰�
      proposalData.purchaseItemCostAllocations = purchaseItemCostAllocations;
      
      // ���� ������ Ȯ�� �� �α�
      console.log('=== ���� ���� ������ ===');
      console.log('contractType:', proposalData.contractType);
      console.log('createdBy:', proposalData.createdBy);
      console.log('purpose:', proposalData.purpose);
      console.log('��ü ������:', JSON.stringify(proposalData, null, 2));
      
      // �ʼ� �ʵ� ��Ȯ�� �� ���� ����
      if (!proposalData.contractType) {
        console.log('?? contractType ����, ���� ����');
        proposalData.contractType = 'purchase';
      }
      
      if (!proposalData.createdBy) {
        console.log('?? createdBy ����, ���� ����');
        proposalData.createdBy = '�����1';
      }
      
      if (!proposalData.purpose) {
        console.log('?? purpose ����, ���� ����');
        proposalData.purpose = 'ǰ�Ǽ�';
      }
      
      // ���� Ȯ��
      console.log('=== ���� ���� �� ���� ������ ===');
      console.log('contractType:', proposalData.contractType);
      console.log('createdBy:', proposalData.createdBy);
      console.log('purpose:', proposalData.purpose);
      
      if (!proposalData.contractType || !proposalData.createdBy || !proposalData.purpose) {
        throw new Error(`�ʼ� �ʵ� ���� ����: contractType=${proposalData.contractType}, createdBy=${proposalData.createdBy}, purpose=${proposalData.purpose}`);
      }

      // API ��û ���� ���� ������ Ȯ�� (�ʼ� �ʵ� ����)
      const finalProposalData = {
        ...proposalData
      };
      
      console.log('\n?????? === API ��û ���� ���� ������ (��) === ??????');
      console.log('��ü ������:', JSON.stringify(finalProposalData, null, 2));
      console.log('contractType:', finalProposalData.contractType, 'Ÿ��:', typeof finalProposalData.contractType);
      console.log('createdBy:', finalProposalData.createdBy, 'Ÿ��:', typeof finalProposalData.createdBy);
      console.log('purpose:', finalProposalData.purpose, 'Ÿ��:', typeof finalProposalData.purpose);
      console.log('budget:', finalProposalData.budget, 'Ÿ��:', typeof finalProposalData.budget);
      console.log('accountSubject:', finalProposalData.accountSubject, 'Ÿ��:', typeof finalProposalData.accountSubject);
      console.log('basis:', finalProposalData.basis, 'Ÿ��:', typeof finalProposalData.basis);
      
      // ���� ����
      if (!finalProposalData.contractType) {
        throw new Error('��� ������ �������� �ʾҽ��ϴ�.');
      }
      if (!finalProposalData.createdBy) {
        throw new Error('�ۼ��� ������ �������� �ʾҽ��ϴ�.');
      }
      if (!finalProposalData.purpose) {
        throw new Error('ǰ�Ǽ� ������ �������� �ʾҽ��ϴ�.');
      }

      const url = isEditMode 
        ? `${API_BASE_URL}/api/proposals/${editingProposalId}`
        : `${API_BASE_URL}/api/proposals`;
      
      const method = isEditMode ? 'PUT' : 'POST';

      console.log('��û URL:', url);
      console.log('��û �޼���:', method);

      console.log('API ��û ����:', { url, method, finalProposalData });
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(finalProposalData)
      });

      console.log('API ���� ����:', response.status, response.statusText);
      
      // ���� �ؽ�Ʈ�� ���� Ȯ��
      const responseText = await response.text();
      console.log('API ���� �ؽ�Ʈ:', responseText);
      
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON �Ľ� ����:', parseError);
        console.error('���� �ؽ�Ʈ:', responseText);
        throw new Error(`���� ������ �Ľ��� �� �����ϴ�: ${responseText.substring(0, 100)}...`);
      }
      
      if (response.ok) {
        const result = responseData;
        const proposalId = isEditMode ? editingProposalId : result.proposalId;
        
        // ���� ��忡�� ���� �� localStorage ����
        if (isEditMode) {
          try {
            localStorage.removeItem('editingDraft');
            console.log('���� ��� �Ϸ� - localStorage ������');
          } catch (localStorageError) {
            console.warn('localStorage ���� ����:', localStorageError);
          }
        }
        
        // ǰ�Ǽ� ���¸� "����Ϸ�"�� ������Ʈ
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
              ? `ǰ�Ǽ��� ���������� �����ǰ� ����Ϸ�Ǿ����ϴ�! (ID: ${proposalId})`
              : `ǰ�Ǽ��� ���������� �ۼ��ǰ� ����Ϸ�Ǿ����ϴ�! (ID: ${proposalId})`;
            alert(message);
            
            // ���� ��� �Ϸ� �� ���� ���� �ʱ�ȭ
            if (isEditMode) {
              setIsEditMode(false);
              setEditingProposalId(null);
              setProposalId(null);
            }
            
            // ���� �ۼ��� ǰ�Ǽ� ������ localStorage�� �����Ͽ� ����Ʈ���� ��� ǥ��
            const newProposalData = {
              id: proposalId,
              title: formData.purpose || 'ǰ�Ǽ�',
              department: formData.requestDepartments?.[0] || '������',
              contractor: formData.purchaseItems?.[0]?.supplier || formData.serviceItems?.[0]?.supplier || '������',
              author: '�ۼ���',
              amount: calculateTotalAmount() || 0,
              status: '����Ϸ�',
              startDate: new Date().toISOString().split('T')[0],
              endDate: formData.contractPeriod || '',
              contractType: formData.contractType === 'purchase' ? '���Ű��' :
                           formData.contractType === 'service' ? '�뿪���' :
                           formData.contractType === 'change' ? '������' :
                           formData.contractType === 'extension' ? '������' :
                           formData.contractType === 'freeform' ? '�������' : '��Ÿ',
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
            
            // ���� �ۼ��� ǰ�Ǽ� ������ localStorage�� ����
            localStorage.setItem('newProposal', JSON.stringify(newProposalData));
            
                        // �ۼ��Ϸ�� ǰ�Ǽ��� ǰ�Ǽ� ��ȸ ȭ������ �̵�
            console.log('?? �ٸ� �׺���̼� ���: /contract-list');
            navigate('/contract-list', { 
              state: { 
                refreshList: true, 
                newProposalId: proposalId, 
                message: isEditMode ? 'ǰ�Ǽ��� ���������� �����Ǿ����ϴ�!' : 'ǰ�Ǽ��� ���������� �ۼ��Ǿ����ϴ�!' 
              } 
            });
            console.log('? �ٸ� �׺���̼� �Ϸ�: /contract-list');
          } else {
            const statusError = await statusResponse.json();
            alert(`ǰ�Ǽ� �ۼ��� ���������� ���� ������Ʈ�� �����߽��ϴ�: ${statusError.error}`);
            navigate('/draft-list');
          }
        } catch (statusError) {
          console.error('���� ������Ʈ ����:', statusError);
          alert(`ǰ�Ǽ� �ۼ��� ���������� ���� ������Ʈ�� �����߽��ϴ�.`);
          navigate('/draft-list');
        }
      } else {
        const error = responseData;
        console.error('API ���� ����:', error);
        
        // ���� ��忡�� �߻��ϴ� ��ü���� ���� ó��
        let errorMessage;
        if (isEditMode) {
          if (error.error && error.error.includes('not found')) {
            errorMessage = '�����Ϸ��� ǰ�Ǽ��� ã�� �� �����ϴ�. �ٽ� �õ����ּ���.';
          } else if (error.error && error.error.includes('validation')) {
            errorMessage = '�Է� �����Ͱ� �ùٸ��� �ʽ��ϴ�. ��� �ʼ� �׸��� Ȯ�����ּ���.';
          } else {
            errorMessage = `ǰ�Ǽ� ���� ����: ${error.error || '�� �� ���� ����'}`;
          }
        } else {
          errorMessage = `ǰ�Ǽ� �ۼ� ����: ${error.error || '�� �� ���� ����'}`;
        }
        
        alert(errorMessage);
      }
    } catch (error) {
      console.error('ǰ�Ǽ� ó�� ����:', error);
      console.error('���� �� ����:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      // ����� ģȭ���� ���� �޽���
      let errorMessage = isEditMode 
        ? 'ǰ�Ǽ� ������ �����߽��ϴ�.'
        : 'ǰ�Ǽ� �ۼ��� �����߽��ϴ�.';
      
      if (error.message.includes('��� ����')) {
        errorMessage += ' ��� ������ �������ּ���.';
      } else if (error.message.includes('�ۼ���')) {
        errorMessage += ' �ۼ��� ������ �����Ǿ����ϴ�.';
      } else if (error.message.includes('����')) {
        errorMessage += ' ǰ�Ǽ� ������ �Է����ּ���.';
      } else if (error.message.includes('notNull Violation')) {
        errorMessage += ' �ʼ� ������ �����Ǿ����ϴ�. ��� �ʵ带 Ȯ�����ּ���.';
      } else if (error.message.includes('���� ������ �Ľ��� �� �����ϴ�')) {
        errorMessage += ' ���� ���� ������ �߻��߽��ϴ�.';
      } else {
        errorMessage += ' ������ ���� ������ Ȯ�����ּ���.';
      }
      
      alert(errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <h2>�����͸� �ҷ����� ��...</h2>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="proposal-form">
      <div className="proposal-header">
        <h1>{isEditMode ? 'ǰ�Ǽ� ����' : 'ǰ�Ǽ� �ۼ�'}</h1>
        {proposalId && (
          <div className="proposal-id">
            <span className="id-label">ǰ�Ǽ� ID:</span>
            <span className="id-value">{proposalId}</span>
          </div>
        )}
      </div>
      
      {/* ��� ���� ���� */}
      <div className="contract-type-selection">
        <h2>��� ���� ����</h2>
        <div className="type-buttons">
          <button
            className={`type-btn ${contractType === 'purchase' ? 'active' : ''}`}
            onClick={() => changeContractType('purchase')}
          >
            �ű� ���
          </button>
          <button
            className={`type-btn ${contractType === 'change' ? 'active' : ''}`}
            onClick={() => changeContractType('change')}
          >
            ���� ���
          </button>
          <button
            className={`type-btn ${contractType === 'extension' ? 'active' : ''}`}
            onClick={() => changeContractType('extension')}
          >
            ���� ���
          </button>
          <button
            className={`type-btn ${contractType === 'service' ? 'active' : ''}`}
            onClick={() => changeContractType('service')}
          >
            �뿪 ���
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
            ?? �������
          </button>
        </div>
      </div>

      {contractType && (
        <form onSubmit={handleSubmit}>
          {/* ���� �׸� */}
          <div className="form-section">
            <h3>���� ����</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label>����</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prevData => ({...prevData, title: e.target.value}))}
                  placeholder="ǰ�Ǽ� ������ �Է��ϼ���"
                  required
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>��� ����</label>
                <textarea
                  value={formData.purpose}
                  onChange={(e) => setFormData(prevData => ({...prevData, purpose: e.target.value}))}
                  placeholder="��� ������ �Է��ϼ���"
                  required
                  rows={3}
                  style={{ resize: 'vertical', minHeight: '70px' }}
                />
              </div>

              <div className="form-group">
                <label>�ٰ�</label>
                <textarea
                  value={formData.basis}
                  onChange={(e) => setFormData(prevData => ({...prevData, basis: e.target.value}))}
                  placeholder="��� �ٰŸ� �Է��ϼ���"
                  required
                  rows={2}
                  style={{ resize: 'vertical', minHeight: '60px' }}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>�������</label>
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
                          `${selectedBudget.project_name} (${selectedBudget.budget_year}��) - ${selectedBudget.budget_type}` :
                          '��������� �����ϼ���';
                      })() :
                      '��������� �����ϼ���'
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
                              <span>���õ� ����: {selectedBudget.project_name}</span>
                              <span>�����Ѿ�: {formatCurrency(selectedBudget.budget_amount || 0)}</span>
                              <span>���ݾ�: {formatCurrency(selectedBudget.executed_amount || 0)}</span>
                              <span>�ܿ�����: {formatCurrency(remainingAmount)}</span>
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
                <label>�����</label>
                <select
                  value={formData.contractMethod}
                  onChange={(e) => setFormData({...formData, contractMethod: e.target.value})}
                  required
                >
                  <option value="">������� �����ϼ���</option>
                  {contractMethods.map(method => (
                    <option key={method.value} value={method.value}>
                      {method.name}
                    </option>
                  ))}
                </select>
                {formData.contractMethod && (
                  <div className="regulation-info">
                    <span>�系����: {contractMethods.find(m => m.value === formData.contractMethod)?.regulation}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>��Ÿ</label>
                <textarea
                  value={formData.accountSubject || ''}
                  onChange={(e) => setFormData(prevData => ({...prevData, accountSubject: e.target.value}))}
                  placeholder="��Ÿ ������ �Է��ϼ���"
                  required
                  rows={2}
                  style={{ resize: 'vertical', minHeight: '60px' }}
                />
              </div>

              <div className="form-group">
                <label>��û�μ� (���߼��� ����)</label>
                <div className="department-selector">
                  <button 
                    type="button" 
                    className="department-select-btn"
                    onClick={openDepartmentDropdown}
                  >
                    �μ��� �����ϼ��� ({formData.requestDepartments.length}�� ���õ�)
                  </button>
                  
                  {/* ���õ� �μ� ��� */}
                  {formData.requestDepartments.length > 0 && (
                    <div className="selected-departments">
                      {formData.requestDepartments.map((dept, index) => {
                        const deptName = typeof dept === 'string' ? dept : dept.department || dept.name || dept;
                        return (
                          <div key={index} className="selected-department-tag">
                            <span>{deptName}</span>
                            <button 
                              type="button" 
                              className="remove-department-btn"
                              onClick={() => removeDepartment(deptName)}
                            >
                              ?
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

          {/* ��ະ Ưȭ �Է� */}
          {contractType === 'purchase' && (
            <div className="form-section purchase-items-section">
              <div className="section-header">
                <h3>??? �ű�ǰ��</h3>
                <button type="button" onClick={addPurchaseItem} className="add-item-btn">
                  <span className="btn-icon">+</span>
                  <span className="btn-text">�ű�ǰ�� �߰�</span>
                </button>
              </div>
              
              {/* �ű�ǰ�� ���̺� */}
              <div className="purchase-items-table-container">
                <table className="purchase-items-table">
                  <thead>
                    <tr>
                                      <th>����</th>
                <th>����</th>
                      <th>����</th>
                      <th>�ܰ�</th>
                      <th>�ݾ�</th>
                      <th>���޾�ü</th>
                      <th>���Ⱓ</th>
                      <th>�۾�</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(formData.purchaseItems || []).map((item, index) => (
                      <tr key={item.id} className="purchase-item-row">
                        {/* ���� */}
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
                              
                              // ���� ���� �� �ش� ���� ���� ��õ ���ΰ�ħ
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
                            <option value="">���� ����</option>
                            <option value="����Ʈ����">����Ʈ����</option>
                            <option value="����ⱸ��ǰ">����ⱸ��ǰ</option>
                            <option value="�������">�������</option>
                            <option value="���꼳ġ">���꼳ġ</option>
                            <option value="����Ҹ�ǰ">����Ҹ�ǰ</option>
                            <option value="����뿪">����뿪</option>
                            <option value="��������">��������</option>
                            <option value="����ȸ��">����ȸ��</option>
                            <option value="������ȭ">������ȭ</option>
                            <option value="����������">����������</option>
                            <option value="�����">�����</option>
                            <option value="�Ϲݾ���������">�Ϲݾ���������</option>
                            <option value="���������">���������</option>
                            <option value="ȸ��װ�����">ȸ��װ�����</option>
                          </select>
                        </td>
                        
                        {/* ���� */}
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
                              placeholder="����"
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
                                      ����Ƚ��: {history.frequency}ȸ | ��մܰ�: {formatCurrency(history.avg_unit_price)}
                                      {history.contract_type && (
                                        <span className="contract-type">
                                          | �������: {history.contract_type}
                                        </span>
                                      )}
                                      {history.proposal_total_amount && (
                                        <span className="proposal-amount">
                                          | ǰ�Ǽ��ݾ�: {formatCurrency(history.proposal_total_amount)}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                        
                        {/* ���� */}
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
                            placeholder="����"
                            required
                          />
                        </td>
                        
                        {/* �ܰ� */}
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
                            placeholder="�ܰ�"
                            required
                          />
                        </td>
                        
                        {/* �ݾ� */}
                        <td>
                          <input
                            type="text"
                            value={formatNumberWithComma(item.amount)}
                            readOnly
                            className="amount-field"
                          />
                        </td>
                        
                        {/* ���޾�ü */}
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
                              placeholder="���޾�ü"
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
                                      ����Ƚ��: {history.frequency}ȸ | ��մܰ�: {formatCurrency(history.avg_unit_price)}
                                      {history.contract_type && (
                                        <span className="contract-type">
                                          | �������: {history.contract_type}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                        
                        {/* ���Ⱓ */}
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
                              <option value="1month">1����</option>
                              <option value="3months">3����</option>
                              <option value="6months">6����</option>
                              <option value="1year">1��</option>
                              <option value="2years">2��</option>
                              <option value="3years">3��</option>
                              <option value="permanent">����</option>
                              <option value="custom">�����Է�</option>
                            </select>
                            
                            {item.contractPeriodType === 'custom' && (
                              <div className="contract-date-inputs">
                                <div className="date-input-group">
                                  <label className="date-label">������:</label>
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
                                  <label className="date-label">������:</label>
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
                        
                        {/* �۾� */}
                        <td>
                          <button 
                            type="button" 
                            className="remove-btn"
                            onClick={() => removePurchaseItem(index)}
                            title="ǰ�� ����"
                          >
                            X
                          </button>
                        </td>
                      </tr>
                      
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ���ͼӺμ� �й� ���� - �� ǰ�񺰷� ǥ�� */}
              <div className="cost-allocations-container">
                {(formData.purchaseItems || []).map((item, index) => (
                  <div key={`allocation-${item.id}`} className="cost-allocation-section">
                    <div className="allocation-header">
                      <h4>"{item.productName}" ���ͼӺμ� �й�</h4>
                      <button 
                        type="button" 
                        className="add-allocation-btn"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          e.nativeEvent.stopImmediatePropagation();
                          
                          // �ߺ� Ŭ�� ����
                          if (e.target.disabled) {
                            console.log(`?? �й� �߰� ��ư �̹� ��Ȱ��ȭ��`);
                            return;
                          }
                          
                          // ��ư ��Ȱ��ȭ
                          e.target.disabled = true;
                          e.target.textContent = '�߰� ��...';
                          
                          console.log(`?? �й� �߰� ��ư Ŭ��: ����ǰ�� ${index}`);
                          
                          // �񵿱�� �����Ͽ� �ߺ� ȣ�� ����
                          setTimeout(() => {
                            addCostAllocation(index);
                            
                            // ��ư ����
                            e.target.disabled = false;
                            e.target.textContent = '+ �й� �߰�';
                          }, 100);
                        }}
                      >
                        + �й� �߰�
                      </button>
                    </div>
                    
                    {/* ���й� ���� ���̺� */}
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
                              �� ǰ�� ���� ���й谡 �������� �ʾҽ��ϴ�.<br/>
                              ���� "�й� �߰�" ��ư�� Ŭ���Ͽ� �μ��� �й踦 �߰��ϼ���.
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
                                  �ͼӺμ�
                                </th>
                                <th style={{ 
                                  padding: '0.75rem', 
                                  border: '1px solid #dee2e6',
                                  textAlign: 'center',
                                  fontWeight: '600',
                                  fontSize: '0.9rem'
                                }}>
                                  �й���
                                </th>
                                <th style={{ 
                                  padding: '0.75rem', 
                                  border: '1px solid #dee2e6',
                                  textAlign: 'center',
                                  fontWeight: '600',
                                  fontSize: '0.9rem'
                                }}>
                                  �й谪
                                </th>
                                <th style={{ 
                                  padding: '0.75rem', 
                                  border: '1px solid #dee2e6',
                                  textAlign: 'right',
                                  fontWeight: '600',
                                  fontSize: '0.9rem'
                                }}>
                                  �й�ݾ�
                                </th>
                                <th style={{ 
                                  padding: '0.75rem', 
                                  border: '1px solid #dee2e6',
                                  textAlign: 'center',
                                  fontWeight: '600',
                                  fontSize: '0.9rem',
                                  width: '80px'
                                }}>
                                  �۾�
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
                                      <option value="">�μ� ����</option>
                                      {departments && departments.length > 0 ? (
                                        departments.map(dept => (
                                          <option key={dept.id} value={dept.name}>
                                            {dept.name}
                                          </option>
                                        ))
                                      ) : (
                                        <option value="" disabled>�μ� ������ �ε� ��...</option>
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
                                      <option value="percentage">���� (%)</option>
                                      <option value="fixed">���� (��)</option>
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
                                      placeholder={allocation.type === 'percentage' ? '%' : '��'}
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
                                    )}��
                                  </td>
                                  <td style={{ 
                                    padding: '0.75rem', 
                                    border: '1px solid #dee2e6',
                                    textAlign: 'center'
                                  }}>
                                    <button 
                                      type="button" 
                                      onClick={() => removeCostAllocation(index, allocIndex)}
                                      title="�й� ����"
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
                                      ����
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
                                  �հ�:
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
                                    return formatNumberWithComma(total) + '��';
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
                                        {isValid ? '? �Ϸ�' : '? Ȯ���ʿ�'}
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

              {/* �������� ���� - ���� ǥ�� */}
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
                        <h4>?? ��������</h4>
                      </div>
                      
                      <div className="account-list">
                        {itemsWithAccount.map((item, index) => {
                          const accountSubject = getAccountSubjectByCategory(item.item);
                          
                          return (
                            <div key={`account-${item.id}`} className="account-item">
                              <div className="item-name">{item.productName || item.item}</div>
                              <div className="account-path">
                                <span className="path-item">
                                  <span className="path-label">��:</span>
                                  <span className="path-value">{accountSubject.��}</span>
                                </span>
                                <span className="path-separator">&gt;</span>
                                <span className="path-item">
                                  <span className="path-label">��:</span>
                                  <span className="path-value">{accountSubject.��}</span>
                                </span>
                                <span className="path-separator">&gt;</span>
                                <span className="path-item">
                                  <span className="path-label">��:</span>
                                  <span className="path-value">{accountSubject.��}</span>
                                </span>
                                {accountSubject.�� && (
                                  <>
                                    <span className="path-separator">&gt;</span>
                                    <span className="path-item">
                                      <span className="path-label">��:</span>
                                      <span className="path-value">{accountSubject.��}</span>
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
              
              {/* �� �űԱݾ� */}
              <div className="total-amount-center">
                <h4>�� �űԱݾ�: {formatCurrency(calculateTotalAmount())}</h4>
              </div>

              {/* �ڵ� �ջ� ���� ���� */}
              {(() => {
                const totalAllocation = calculateTotalCostAllocation();
                const hasAllocations = Object.keys(totalAllocation).length > 0;
                
                if (hasAllocations) {
                  return (
                    <div className="form-section auto-summary-section">
                      <h3>�ڵ� �ջ� ����</h3>
                      <div className="auto-summary-content">
                        <div className="summary-table">
                          <div className="summary-header">
                            <div className="header-cell">�μ�</div>
                            <div className="header-cell">�� �й� �ݾ�</div>
                            <div className="header-cell">��ü ��� ����</div>
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
                            <span>�� �й� �ݾ�: {formatCurrency(Object.values(totalAllocation).reduce((sum, data) => sum + data.amount, 0))}</span>
                            <span>��ü ���: {calculateTotalAmount() > 0 ? ((Object.values(totalAllocation).reduce((sum, data) => sum + data.amount, 0) / calculateTotalAmount()) * 100).toFixed(1) : '0.0'}%</span>
                          </div>
                          <div className="summary-status">
                            {(() => {
                              const totalDistributed = Object.values(totalAllocation).reduce((sum, data) => sum + data.amount, 0);
                              const totalAmount = calculateTotalAmount();
                              const isComplete = Math.abs(totalDistributed - totalAmount) < 0.01; // 1�� ���� ���̴� �Ϸ�� ����
                              
                              console.log('?? �й� �Ϸ� ����:', {
                                totalDistributed,
                                totalAmount,
                                difference: Math.abs(totalDistributed - totalAmount),
                                isComplete
                              });
                              
                              return (
                                <span className={isComplete ? 'valid' : 'invalid'}>
                                  {isComplete ? '? 100% �й� �Ϸ�' : '? 100% �й� �̿Ϸ�'}
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
              <h3>�뿪����</h3>
              <button type="button" onClick={addServiceItem} className="add-btn">
                + �뿪�׸� �߰�
              </button>
              
              {(formData.serviceItems || []).map((item, index) => (
                <div key={item.id} className="service-item">
                  {/* ù ��° ��: �׸�, �ο���, ������, �Ⱓ, �ܰ�, ���ݾ� */}
                  <div className="form-row service-main-row">
                    <div className="form-group">
                      <label>�׸�</label>
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
                        placeholder="�뿪�׸��� �Է��ϼ���"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>����</label>
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
                        placeholder="����"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>������</label>
                      <select
                        value={item.skillLevel}
                        onChange={(e) => {
                          const updated = [...formData.serviceItems];
                          updated[index].skillLevel = e.target.value;
                          setFormData({...formData, serviceItems: updated});
                        }}
                        required
                      >
                        <option value="">��޼���</option>
                        <option value="Ư��">Ư��</option>
                        <option value="���">���</option>
                        <option value="�߱�">�߱�</option>
                        <option value="�ʱ�">�ʱ�</option>
                      </select>
                    </div>
                    <div className="form-group narrow-input">
                      <label>�Ⱓ (����)</label>
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
                        placeholder="������"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>�ܰ� (��)</label>
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
                        placeholder="�� �ܰ�"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>���ݾ�</label>
                      <input
                        type="text"
                        value={item.contractAmount ? item.contractAmount.toLocaleString() : '0'}
                        readOnly
                      />
                    </div>
                  </div>
                  
                  {/* �� ��° ��: ���޾�ü, �ſ��� */}
                  <div className="form-row service-sub-row">
                    <div className="form-group">
                      <label>���޾�ü</label>
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
                        placeholder="���޾�ü�� �Է��ϼ���"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>�ſ���</label>
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
                        placeholder="�ſ����� �Է��ϼ��� (��: A, B+, BBB ��)"
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
                        title="�뿪�׸� ����"
                      >
                        �׸� ����
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="form-row">
                <div className="form-group">
                  <label>���Ⱓ</label>
                  <div className="contract-period-dates">
                    <div className="date-input-wrapper">
                      <label className="date-sub-label">������:</label>
                      <input
                        type="date"
                        value={formData.contractStartDate || ''}
                        onChange={(e) => setFormData(prevData => ({...prevData, contractStartDate: e.target.value}))}
                        className="contract-date-input"
                        required
                      />
                    </div>
                    <div className="date-input-wrapper">
                      <label className="date-sub-label">������:</label>
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
                  <label>������޹��</label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData(prevData => ({...prevData, paymentMethod: e.target.value}))}
                    required
                  >
                    <option value="">���޹���� �����ϼ���</option>
                    <option value="monthly">���� ����</option>
                    <option value="quarterly">�б⺰ ����</option>
                    <option value="lump">�Ͻ� ����</option>
                  </select>
                </div>
              </div>
              
              <div className="total-amount">
                <h4 className="total-contract-amount">�� ���ݾ�: {formatCurrency(calculateTotalAmount())}</h4>
              </div>
            </div>
          )}

          {contractType === 'freeform' && (
            <div className="form-section">
              <h3>?? ������� ���� �ۼ�</h3>
              
              {/* ���ø� ���� ���� */}
              {showTemplates && (
                <DocumentTemplates
                  onSelectTemplate={handleTemplateSelect}
                  selectedTemplate={selectedTemplate}
                />
              )}
              
              {/* ���ø� �ٽ� ���� ��ư */}
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
                    ?? ���ø� �ٽ� ����
                  </button>
                  {selectedTemplate && (
                    <span style={{ marginLeft: '10px', color: '#666', fontSize: '14px' }}>
                      ����: {selectedTemplate === 'promotion' ? '����ǰ��' : 
                             selectedTemplate === 'bidding' ? '���� ���� ǰ��' : 
                             selectedTemplate === 'biddingResult' ? '���� ��� ���� ǰ��' : '����� ����'}
                    </span>
                  )}
                </div>
              )}
              
              {/* ������ ���� */}
              {!showTemplates && (
                <>
                  <div className="freeform-description">
                    <p>?? Ŀ���� CKEditor 5 - �ҽ� ��� ���� ���� ������!</p>
                    <p>? ǥ ����, ����, ��ũ, ��� �� ��� ����� �����մϴ�.</p>
                  </div>
                  <CKEditorComponent
                    value={formData.wysiwygContent || ''}
                    onChange={(content) => setFormData(prevData => ({...prevData, wysiwygContent: content}))}
                    placeholder="Ŀ���� CKEditor 5�� �������� ������ �ۼ��ϼ���. ǥ ����, ����, ��ũ �� ��� ����� ����� �� �ֽ��ϴ�."
                    height="500px"
                  />
                </>
              )}
            </div>
          )}

          {(contractType === 'change' || contractType === 'extension') && (
            <div className="form-section">
              <h3>{contractType === 'change' ? '���泻��' : '���峻��'}</h3>
              
              <div className="form-group">
                <label>{contractType === 'change' ? '���� ����' : '���� ����'}</label>
                <textarea
                  value={contractType === 'change' ? formData.changeReason : formData.extensionReason}
                  onChange={(e) => setFormData(prevData => ({
                    ...prevData, 
                    [contractType === 'change' ? 'changeReason' : 'extensionReason']: e.target.value
                  }))}
                  placeholder={`${contractType === 'change' ? '����' : '����'} ������ �Է��ϼ���`}
                  required
                  rows={3}
                />
              </div>
              
              <div className="comparison-section">
                <div className="before-section">
                  <h4>���� ��</h4>
                  {/* ���� �� ���� �Է� */}
                </div>
                <div className="after-section">
                  <h4>���� ��</h4>
                  {/* ���� �� ���� �Է� */}
                </div>
              </div>
            </div>
          )}

          {/* ������� ��õ - ������� ���� */}
          {calculateTotalAmount() > 0 && contractType !== 'freeform' && (
            <div className="form-section">
              <h3>?? ������� ��õ</h3>
              <div className="approval-flow">
                {getRecommendedApprovalLine().map((step, index) => (
                  <div key={index} className={`approval-step ${step.final ? 'final' : ''} ${step.conditional ? 'conditional' : ''}`}>
                    <div className="step-number">{step.step}</div>
                    <div className="step-content">
                      <div className="step-name">{step.name}</div>
                      <div className="step-title">{step.title}</div>
                      <div className="step-description">{step.description}</div>
                      {step.conditional && (
                        <div className="conditional-badge">���Ǻ�</div>
                      )}
                    </div>
                    {index < getRecommendedApprovalLine().length - 1 && (
                      <div className="step-arrow">��</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="form-actions">
            <button type="button" className="draft-btn" onClick={() => {
              console.log('�ӽ����� ��ư Ŭ����');
              handleProposalSave(true); // isDraft = true (�ӽ�����)
            }}>
              �ӽ�����
            </button>
            <button type="button" className="preview-btn" onClick={handlePreview}>
              �̸�����
            </button>
            <button type="submit" className="submit-btn" onClick={() => {
              console.log('ǰ�Ǽ� �ۼ� ��ư Ŭ����');
              console.log('���� �� ������:', formData);
              console.log('��� ����:', contractType);
            }}>
              �ۼ��Ϸ�
            </button>
          </div>
        </form>
      )}

      {/* �μ� ���� ��Ӵٿ� */}
      {showDepartmentDropdown && (
        <div className="popup-overlay" onClick={() => setShowDepartmentDropdown(false)}>
          <div className="department-popup" onClick={(e) => e.stopPropagation()}>
            <div className="popup-header">
              <h3>�μ� ����</h3>
              <button 
                className="popup-close"
                onClick={() => setShowDepartmentDropdown(false)}
              >
                ?
              </button>
            </div>
            
            <div className="department-search">
              <input
                type="text"
                placeholder="�μ����� �˻��ϼ���..."
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
                  <p>�˻� ����� �����ϴ�.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}



      {/* ������� ���� �˾� */}
      {showBudgetPopup && (
        <div className="popup-overlay" onClick={() => setShowBudgetPopup(false)}>
          <div className="budget-popup" onClick={(e) => e.stopPropagation()}>
            <div className="popup-header">
              <h3>������� ����</h3>
              <button 
                className="popup-close"
                onClick={() => setShowBudgetPopup(false)}
              >
                ?
              </button>
            </div>
            
            <div className="popup-filters">
              <div className="filter-group">
                <label>����</label>
                <select 
                  value={selectedYear} 
                  onChange={(e) => setSelectedYear(e.target.value)}
                >
                  <option value="">��ü ����</option>
                  {getYearList().map(year => (
                    <option key={year} value={year}>{year}��</option>
                  ))}
                </select>
              </div>
              
              <div className="filter-group">
                <label>���� ����</label>
                <select 
                  value={selectedBudgetType} 
                  onChange={(e) => setSelectedBudgetType(e.target.value)}
                >
                  <option value="">��ü ����</option>
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
                        <span className="budget-year">{budget.budget_year}��</span>
                      </div>
                      <div className="budget-details">
                        <span className="budget-type">{budget.budget_type}</span>
                        <span className="budget-amount">�Ѿ�: {formatCurrency(budget.budget_amount || 0)}</span>
                        <span className="budget-remaining">�ܿ�: {formatCurrency(remainingAmount)}</span>
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
                  <p>���ǿ� �´� ��������� �����ϴ�.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* �ӽ����� Ȯ�� �˾� */}
      {showSaveConfirm && pendingNavigation && (
        <div className="popup-overlay" onClick={handleCancelNavigation}>
          <div className="save-confirm-popup" onClick={(e) => e.stopPropagation()} style={{backgroundColor: '#f8f9fa', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)', maxWidth: '500px', width: '90%', maxHeight: '80vh', overflowY: 'auto'}}>
            {console.log('�˾� ������:', showSaveConfirm, pendingNavigation)}
            <div className="popup-header">
              <h3>?? �ӽ����� Ȯ��</h3>
              <button 
                className="popup-close"
                onClick={handleCancelNavigation}
              >
                ?
              </button>
            </div>
            
            <div className="save-confirm-content" style={{backgroundColor: '#f8f9fa'}}>
              <div className="confirm-message" style={{backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e1e5e9'}}>
                <p style={{backgroundColor: '#ffffff', margin: '0.5rem 0', fontSize: '1.1rem', color: '#333'}}>�ۼ� ���� ������ �ֽ��ϴ�.</p>
                <p style={{backgroundColor: '#ffffff', margin: '0.5rem 0', fontSize: '1.1rem', color: '#333'}}>�ӽ������ϰ� �̵��Ͻðڽ��ϱ�?</p>
                <p className="navigation-target" style={{backgroundColor: '#f8f9fa', fontSize: '0.9rem', color: '#666', fontStyle: 'italic', marginTop: '0.5rem', padding: '0.75rem', borderRadius: '6px', display: 'inline-block'}}>
                  �̵��� ������: {pendingNavigation && ['purchase', 'change', 'extension', 'service', 'bidding'].includes(pendingNavigation) 
                    ? `${pendingNavigation === 'purchase' ? '�ű�' : pendingNavigation === 'change' ? '����' : pendingNavigation === 'extension' ? '����' : pendingNavigation === 'service' ? '�뿪' : '����'} ���` 
                    : pendingNavigation}
                </p>
              </div>
              
              <div className="confirm-buttons">
                <button 
                  onClick={handleSaveAndNavigate}
                  className="btn btn-primary"
                >
                  ?? �ӽ����� �� �̵�
                </button>
                <button 
                  onClick={handleNavigateWithoutSave}
                  className="btn btn-secondary"
                >
                  ?? �������� �ʰ� �̵�
                </button>
                <button 
                  onClick={handleCancelNavigation}
                  className="btn btn-cancel"
                >
                  ? ���
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* �̸����� �˾� */}
      {showPreview && (
        <div className="popup-overlay" onClick={handleClosePreview}>
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
                <h3>?? ǰ�Ǽ� �̸�����</h3>
                <small style={{ color: '#666', fontSize: '0.8rem', marginLeft: '1rem' }}>
                  ũ������: �巡�� �Ǵ� ��ư Ŭ�� | ����Ű: 1(�۰�), 2(����), 3(ũ��), ESC(�ݱ�)
                </small>
              </div>
              <div className="popup-controls">
                <button 
                  className="size-control-btn"
                  onClick={() => setPopupSize({ width: 70, height: 80 })}
                  title="�۰�"
                >
                  ??
                </button>
                <button 
                  className="size-control-btn"
                  onClick={() => setPopupSize({ width: 85, height: 90 })}
                  title="����"
                >
                  ??
                </button>
                <button 
                  className="size-control-btn"
                  onClick={() => setPopupSize({ width: 99, height: 97 })}
                  title="ũ��"
                >
                  ???
                </button>
                <button 
                  className="popup-close"
                  onClick={handleClosePreview}
                >
                  ?
                </button>
              </div>
            </div>
            
            {/* �������� �ڵ� */}
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
                {/* ���� ��� */}
                <div className="document-header">
                  <div className="company-info">
                    <h1 className="company-name">[ȸ���]</h1>
                    <p className="company-address">[ȸ�� �ּ�]</p>
                    <p className="company-contact">TEL: [��ȭ��ȣ] | FAX: [�ѽ���ȣ] | EMAIL: [�̸���]</p>
                  </div>
                  <div className="document-meta">
                    <div className="document-number">
                      <span className="label">������ȣ:</span>
                      <span className="value">[�ڵ�����]</span>
                    </div>
                    <div className="document-date">
                      <span className="label">�ۼ�����:</span>
                      <span className="value">{new Date().toLocaleDateString('ko-KR')}</span>
                    </div>
                  </div>
                </div>

                {/* ���� ���� */}
                <div className="document-title">
                  <h1 className="main-title">{formData.title || 'ǰ �� ��'}</h1>
                  <div className="title-underline"></div>
                </div>

                {/* ���� ���� */}
                <div className="document-body">
                  
                  {/* ������� ���� */}
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
                  
                  {/* ��������ε� ������ ���� ��� */}
                  {contractType === 'freeform' && !formData.wysiwygContent && (
                    <div className="no-data-box">
                      <p>������� ������ �Էµ��� �ʾҽ��ϴ�.</p>
                    </div>
                  )}

                  {/* ��������� �ƴ� ��쿡�� �⺻ ���� ǥ�� */}
                  {contractType !== 'freeform' && (
                    <>
                      {/* �⺻ ���� ���̺� */}
                      <div className="info-section">
                        <h2 className="section-title">1. ��� �⺻ ����</h2>
                    <table className="info-table">
                      <tbody>
                        {formData.title && (
                          <tr>
                            <td className="label-cell">����</td>
                            <td className="value-cell" colSpan="3">{formData.title}</td>
                          </tr>
                        )}
                        <tr>
                          <td className="label-cell">��� ����</td>
                          <td className="value-cell" colSpan="3">
                            {contractType === 'purchase' ? '���Ű��' : 
                             contractType === 'service' ? '�뿪���' : 
                             contractType === 'change' ? '������' : 
                             contractType === 'extension' ? '������' : contractType === 'freeform' ? '�������' : '��Ÿ'}
                          </td>
                        </tr>
                        <tr>
                          <td className="label-cell">�����</td>
                          <td className="value-cell" colSpan="3">
                            {(() => {
                              if (!formData.contractMethod) return '���Է�';
                              
                              // value �ʵ�� ��Ī (ǰ�Ǽ� �ۼ����� value�� �����ϹǷ�)
                              let method = contractMethods.find(m => 
                                m.value === formData.contractMethod
                              );
                              
                              // value�� ��Ī���� ������ �ٸ� ��� �õ�
                              if (!method) {
                                method = contractMethods.find(m => 
                                  m.id == formData.contractMethod || 
                                  m.id === parseInt(formData.contractMethod) || 
                                  String(m.id) === String(formData.contractMethod) ||
                                  m.name === formData.contractMethod
                                );
                              }
                              
                              // "lowest" ���� Ư�� �� ó��
                              if (!method && formData.contractMethod === 'lowest') {
                                return '���������';
                              }
                              
                              return method?.name || `�̵�� ����� (${formData.contractMethod})`;
                            })()}
                          </td>
                        </tr>
                        <tr>
                          <td className="label-cell">��� ����</td>
                          <td className="value-cell" colSpan="3">{formData.purpose || '���Է�'}</td>
                        </tr>
                        <tr>
                          <td className="label-cell">��� �ٰ�</td>
                          <td className="value-cell" colSpan="3">{formData.basis || '���Է�'}</td>
                        </tr>
                        <tr>
                          <td className="label-cell">��� ����</td>
                          <td className="value-cell" colSpan="3">
                            {(() => {
                              if (!formData.budget) return '���Է�';
                              
                              // �پ��� ������� ��Ī �õ�
                              let budget = businessBudgets.find(b => 
                                b.id == formData.budget || 
                                b.id === parseInt(formData.budget) || 
                                String(b.id) === String(formData.budget)
                              );
                              
                              // ��Ī���� ������ ������Ʈ������ ���� ã��
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
                              
                              return `�̵�� ���� (${formData.budget})`;
                            })()}
                          </td>
                        </tr>
                        <tr>
                          <td className="label-cell">��Ÿ</td>
                          <td className="value-cell" colSpan="3">{formData.accountSubject || '���Է�'}</td>
                        </tr>
                        <tr>
                          <td className="label-cell">��û�μ�</td>
                          <td className="value-cell" colSpan="3">
                            {formData.requestDepartments && formData.requestDepartments.length > 0 ? 
                              formData.requestDepartments.map(dept => 
                                typeof dept === 'string' ? dept : dept.department || dept.name || dept
                              ).join(', ') : '���Է�'}
                          </td>
                        </tr>
                        {contractType === 'change' && formData.changeReason && (
                          <tr>
                            <td className="label-cell">���� ����</td>
                            <td className="value-cell" colSpan="3" style={{ whiteSpace: 'pre-wrap' }}>
                              {formData.changeReason}
                            </td>
                          </tr>
                        )}
                        {contractType === 'extension' && formData.extensionReason && (
                          <tr>
                            <td className="label-cell">���� ����</td>
                            <td className="value-cell" colSpan="3" style={{ whiteSpace: 'pre-wrap' }}>
                              {formData.extensionReason}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>



                  {/* ��� �� ���� */}
                  <div className="details-section">
                    <h2 className="section-title">2. ��� �� ����</h2>
                  {['purchase', 'change', 'extension'].includes(contractType) && formData.purchaseItems && formData.purchaseItems.length > 0 ? (
                      <div>
                        {/* ���� ǰ�� �� ���̺� */}
                        <table className="details-table">
                          <thead>
                            <tr>
                              <th style={{ width: '50px' }}>��ȣ</th>
                              <th style={{ width: '120px' }}>����</th>
                              <th style={{ width: '200px' }}>ǰ���/�԰�</th>
                              <th style={{ width: '80px' }}>����</th>
                              <th style={{ width: '120px' }}>�ܰ�</th>
                              <th style={{ width: '120px' }}>�ݾ�</th>
                              <th style={{ width: '100px' }}>������</th>
                              <th style={{ width: '150px' }}>���޾�ü</th>
                              <th style={{ width: '100px' }}>���</th>
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
                                <td className="text-center">{formatNumberWithComma(item.quantity || 0)}{item.unit || '��'}</td>
                                <td className="text-right">{formatCurrency(item.unitPrice || 0)}</td>
                                <td className="text-right amount-highlight">{formatCurrency(item.amount || 0)}</td>
                                <td className="text-center">
                                  {item.deliveryDate ? 
                                    new Date(item.deliveryDate).toLocaleDateString('ko-KR') : 
                                    '���� �� ����'
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
                                �� ���ݾ� �հ�
                              </td>
                              <td className="total-amount text-right" style={{ fontWeight: '700', fontSize: '1.1em' }}>
                                {formatCurrency(formData.purchaseItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0))}
                              </td>
                              <td colSpan="3" className="text-center" style={{ fontSize: '0.9em', color: '#666' }}>
                                (�ΰ��� ����)
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                        
                        {/* ��� ���� �� Ư�̻��� */}
                        <div style={{ marginTop: '2rem' }}>
                          <h3 style={{ 
                            fontSize: '16px', 
                            fontWeight: '600', 
                            marginBottom: '1rem',
                            color: '#333',
                            borderBottom: '2px solid #e0e0e0',
                            paddingBottom: '0.5rem'
                          }}>
                            ?? ��� ���� �� Ư�̻���
                          </h3>
                          <table className="info-table" style={{ marginTop: '1rem' }}>
                            <tbody>
                              <tr>
                                <td className="label-cell" style={{ width: '150px' }}>���Ⱓ</td>
                                <td className="value-cell">
                                  {formData.contractStartDate && formData.contractEndDate ? 
                                    `${new Date(formData.contractStartDate).toLocaleDateString('ko-KR')} ~ ${new Date(formData.contractEndDate).toLocaleDateString('ko-KR')}` :
                                    '��� ü�� �� ����'
                                  }
                                </td>
                              </tr>
                              <tr>
                                <td className="label-cell">��������</td>
                                <td className="value-cell">
                                  {formData.paymentMethod || '�˼� �Ϸ� �� 30�� �̳� ����'}
                                </td>
                              </tr>
                              <tr>
                                <td className="label-cell">��ǰ����</td>
                                <td className="value-cell">
                                  {formData.deliveryCondition || '���� ��� ��ǰ, ��ġ �� ���� �Ϸ�'}
                                </td>
                              </tr>
                              <tr>
                                <td className="label-cell">ǰ������</td>
                                <td className="value-cell">
                                  {formData.warrantyPeriod ? `��ǰ�Ϸκ��� ${formData.warrantyPeriod}����` : '������ ǥ�� �����Ⱓ ����'}
                                </td>
                              </tr>
                              <tr>
                                <td className="label-cell">�������</td>
                                <td className="value-cell">
                                  ��� ���� �� 7�� �� ���� ���� �� ���� ����
                                </td>
                              </tr>
                              {formData.specialConditions && (
                                <tr>
                                  <td className="label-cell">Ư������</td>
                                  <td className="value-cell">{formData.specialConditions}</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                  ) : contractType === 'service' && formData.serviceItems && formData.serviceItems.length > 0 ? (
                      <div>
                        {/* �뿪 ��� �� ���̺� */}
                        <table className="details-table">
                          <thead>
                            <tr>
                              <th style={{ width: '50px' }}>��ȣ</th>
                              <th style={{ width: '200px' }}>�뿪��/��������</th>
                              <th style={{ width: '100px' }}>����</th>
                              <th style={{ width: '100px' }}>������</th>
                              <th style={{ width: '80px' }}>�Ⱓ</th>
                              <th style={{ width: '120px' }}>���ܰ�</th>
                              <th style={{ width: '120px' }}>���ݾ�</th>
                              <th style={{ width: '100px' }}>�ٹ�����</th>
                              <th style={{ width: '100px' }}>���</th>
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
                                <td className="text-center">{item.period || 0}����</td>
                                <td className="text-right">{formatCurrency(item.monthlyRate || 0)}</td>
                                <td className="text-right amount-highlight">{formatCurrency(item.contractAmount || 0)}</td>
                                <td className="text-center">
                                  {item.workType || '���ֱٹ�'}
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
                                �� ���ݾ� �հ�
                              </td>
                              <td className="total-amount text-right" style={{ fontWeight: '700', fontSize: '1.1em' }}>
                                {formatCurrency(formData.serviceItems.reduce((sum, item) => sum + (parseFloat(item.contractAmount) || 0), 0))}
                              </td>
                              <td colSpan="2" className="text-center" style={{ fontSize: '0.9em', color: '#666' }}>
                                (�ΰ��� ����)
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                        
                        {/* �뿪 ��� ���� */}
                        <div style={{ marginTop: '2rem' }}>
                          <h3 style={{ 
                            fontSize: '16px', 
                            fontWeight: '600', 
                            marginBottom: '1rem',
                            color: '#333',
                            borderBottom: '2px solid #e0e0e0',
                            paddingBottom: '0.5rem'
                          }}>
                            ?? �뿪 ��� ����
                          </h3>
                          <table className="info-table" style={{ marginTop: '1rem' }}>
                            <tbody>
                              <tr>
                                <td className="label-cell" style={{ width: '150px' }}>���Ⱓ</td>
                                <td className="value-cell">
                                  {formData.contractStartDate && formData.contractEndDate ? 
                                    `${new Date(formData.contractStartDate).toLocaleDateString('ko-KR')} ~ ${new Date(formData.contractEndDate).toLocaleDateString('ko-KR')}` :
                                    formData.contractPeriod || '��� ü�� �� ����'
                                  }
                                </td>
                              </tr>
                              <tr>
                                <td className="label-cell">��������</td>
                                <td className="value-cell">
                                  {formData.paymentMethod || '�ſ� ���� ���� �Ϳ� ���� ����'}
                                </td>
                              </tr>
                              <tr>
                                <td className="label-cell">�ٹ����</td>
                                <td className="value-cell">
                                  {formData.workLocation || '����ó ���� ���'}
                                </td>
                              </tr>
                              <tr>
                                <td className="label-cell">�ٹ��ð�</td>
                                <td className="value-cell">
                                  {formData.workHours || '���� 09:00~18:00 (�� 40�ð�)'}
                                </td>
                              </tr>
                              <tr>
                                <td className="label-cell">��������</td>
                                <td className="value-cell">
                                  ����ó ������� ���ÿ� ���� ���� ����
                                </td>
                              </tr>
                              <tr>
                                <td className="label-cell">�������</td>
                                <td className="value-cell">
                                  ��� ���� �� 30�� �� ���� ���� �� ���� ����
                                </td>
                              </tr>
                              {formData.specialConditions && (
                                <tr>
                                  <td className="label-cell">Ư������</td>
                                  <td className="value-cell">{formData.specialConditions}</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                  ) : (
                      <div className="no-data-box">
                        <p>��� �� ������ �Էµ��� �ʾҽ��ϴ�.</p>
                </div>
                  )}
                </div>

                  {/* ���ͼӳ��� */}
                  <div className="details-section">
                    <h2 className="section-title">3. ���ͼӳ���</h2>
                    {(() => {
                      // ǰ�� ���ͼ� �� ǥ��
                      const hasAnyAllocations = formData.purchaseItems?.some(item => 
                        item.costAllocation?.allocations && item.costAllocation.allocations.length > 0
                      );
                      
                      if (!hasAnyAllocations) {
                        return (
                          <div className="no-data-box">
                            <p>���ͼӺμ� ��� ������ �����ϴ�.</p>
                          </div>
                        );
                      }
                      
                      return (
                        <div>
                          {/* ǰ�� �� ���� */}
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
                                  ?? {item.productName} - ���ͼ� ��
                                </h3>
                                <table className="details-table" style={{ marginBottom: '1rem' }}>
                                  <thead>
                                    <tr>
                                      <th>�ͼӺμ�</th>
                                      <th>�й���</th>
                                      <th>�й谪</th>
                                      <th>�й�ݾ�</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {allocations.map((allocation, allocIndex) => (
                                      <tr key={allocIndex}>
                                        <td className="text-center">{allocation.department}</td>
                                        <td className="text-center">
                                          {allocation.type === 'percentage' ? '���� (%)' : '���� (��)'}
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
                                      <td colSpan="3" className="text-right total-label">�Ұ�</td>
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
                          
                          {/* ��ü ���� */}
                          <div style={{ marginTop: '2rem' }}>
                            <h3 style={{ 
                              fontSize: '16px', 
                              fontWeight: '600', 
                              marginBottom: '1rem',
                              color: '#333',
                              borderBottom: '2px solid #e0e0e0',
                              paddingBottom: '0.5rem'
                            }}>
                              ?? ��ü ���ͼ� ����
                            </h3>
                            {(() => {
                              const totalAllocation = calculateTotalCostAllocation();
                              return (
                                <table className="details-table">
                                  <thead>
                                    <tr>
                                      <th>�μ���</th>
                                      <th>��бݾ�</th>
                                      <th>��к���</th>
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
                                      <td className="text-center total-label">�հ�</td>
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

                {/* ���� �ϴ� */}
                <div className="document-footer">
                  <div className="footer-line"></div>
                  <div className="footer-info">
                    <div className="creation-date">�ۼ���: {new Date().toLocaleDateString('ko-KR')}</div>
                    <div className="department-signature">
                      <span>���μ�: ________________</span>
                      <span>�����: ________________ (��)</span>
                      </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
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

        /* ������� ��ư ���� ��Ÿ�� ���� - �ְ� �켱���� */
        .type-buttons .type-btn:nth-child(5),
        .type-buttons button:nth-child(5),
        .contract-type-selection .type-buttons button:nth-child(5),
        .contract-type-selection .type-btn:nth-child(5),
        button[onclick*="freeform"],
        button:contains("�������") {
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
        button:contains("�������"):hover {
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
        button:contains("�������").active {
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

        /* �μ� ���� �˾� ��Ÿ�� */
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

        /* ���й� ��Ÿ�� */
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

        /* �ڵ� �ջ� ���� ��Ÿ�� */
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

        /* �˾� ��Ÿ�� */
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

        /* ������� ���� ��Ÿ�� */
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

        /* ������ ���� ���� ��Ÿ�� */
        .formal-document {
          font-family: 'Malgun Gothic', '���� ���', sans-serif;
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

        /* �̸����� ���� ��� �ؽ�Ʈ�� ���������� ���� */
        .formal-document td,
        .formal-document th,
        .formal-document span,
        .formal-document div {
          color: #000 !important;
        }

        /* �̸����� ���� ��� ������ ���������� ���� */
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
          border-left: 4px solid #007bff;
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

        /* �˾� ��Ʈ�� */
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

        /* �������� �ڵ� */
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

        /* �������� ���� �� */
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

        /* ���� �Է� �ʵ� (�ο���, �Ⱓ ��) */
        .narrow-input {
          max-width: 120px;
          flex-shrink: 0;
        }

        .narrow-input input {
          text-align: center;
        }

        /* ���Ⱓ ��¥ �Է� ��Ÿ�� */
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

        /* �� ���ݾ� �߾����� */
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

        /* �뿪���� �ʵ� ������ ���� */
        .service-item {
          background: #ffffff;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 20px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }

        /* ù ��° ��: �׸�, �ο���, ������, �Ⱓ, �ܰ�, ���ݾ� */
        .service-item .service-main-row {
          display: grid;
          grid-template-columns: 2fr 100px 120px 100px 150px 150px;
          gap: 12px;
          margin-bottom: 15px;
          align-items: end;
        }

        /* �� ��° ��: ���޾�ü, �ſ���, ������ư */
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

        /* �뿪�׸� ���� ��ư */
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

        /* �뿪���� ���Ⱓ ��Ÿ�� */
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

        /* �ű�ǰ�� ���� �� �� ���̾ƿ� */
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

        /* ���ͼӺμ� �й� ���� ���̾ƿ� */
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

        /* ��õ ��� ��Ÿ�� */
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
          content: '??' !important;
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
          content: '??' !important;
          margin-right: 0.5rem !important;
          font-size: 1.1rem !important;
        }

        .preview-btn {
          background: linear-gradient(135deg, #17a2b8 0%, #138496 100%) !important;
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

        .preview-btn:hover {
          background: linear-gradient(135deg, #138496 0%, #0f7a8a 100%) !important;
          transform: translateY(-2px) !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2) !important;
        }

        .preview-btn::before {
          content: '???' !important;
          margin-right: 0.5rem !important;
          font-size: 1.1rem !important;
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

        /* ǰ�Ǽ� ��� ��Ÿ�� */
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

        /* �ӽ����� Ȯ�� �˾� ��Ÿ�� */
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

        /* ����ǰ�� ��û�μ� ���� ��Ÿ�� (������ ���̾ƿ�) */
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

        /* �ű�ǰ�� ���� ��Ÿ�� */
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

        /* �÷� �ʺ� ����ȭ - �� ȿ������ ���� Ȱ�� */
        .purchase-items-table th:nth-child(1) { width: 14%; } /* ���� */
        .purchase-items-table th:nth-child(2) { width: 22%; } /* ���� */
        .purchase-items-table th:nth-child(3) { width: 7%; }  /* ���� */
        .purchase-items-table th:nth-child(4) { width: 13%; } /* �ܰ� */
        .purchase-items-table th:nth-child(5) { width: 13%; } /* �ݾ� */
        .purchase-items-table th:nth-child(6) { width: 16%; } /* ���޾�ü */
        .purchase-items-table th:nth-child(7) { width: 12%; } /* ���Ⱓ */
        .purchase-items-table th:nth-child(8) { width: 5%; }  /* �۾� */

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

        /* �ܰ�, �ݾ� �Է� �ʵ� ����ȭ */
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

        /* ��û�μ� �ʵ� ��Ÿ�� */
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

        /* ���Ⱓ ���ñ� ��Ÿ�� */
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

        /* ��ӹڽ� �߰� ���� ��Ÿ�� */
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

        /* ���ͼӺμ� �й� ��Ÿ�� */
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

        /* �������� ���� ��Ÿ�� */
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

        /* �̸����� ��� ��Ÿ�� */
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

        /* ǥ ��Ÿ�� */
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

        /* ���� ��� ��Ÿ�� */
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

        /* ���� ��� ��� ���� ��ư ��Ÿ�� */
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

