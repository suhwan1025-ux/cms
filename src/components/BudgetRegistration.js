import React, { useState, useEffect } from 'react';
import { getApiUrl } from '../config/api';
import { getCurrentUserName } from '../utils/userHelper';

// API 베이스 URL 설정
const API_BASE_URL = getApiUrl();


const BudgetRegistration = ({ year = 2024 }) => {
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

  // 다중 정렬 상태 관리
  const [sortConfigs, setSortConfigs] = useState([]);
  
  // 부서 검색 상태
  const [departmentSearch, setDepartmentSearch] = useState({
    initiator: '',
    executor: ''
  });
  
  // 부서 드롭다운 표시 상태
  const [showDepartmentDropdown, setShowDepartmentDropdown] = useState({
    initiator: false,
    executor: false
  });
  
  // 편집 모드 부서 드롭다운 표시 상태
  const [showEditDepartmentDropdown, setShowEditDepartmentDropdown] = useState({
    initiator: false,
    executor: false
  });

  // 예산 분류 옵션
  const budgetTypes = {
    '자본예산': ['일반사업', '보안사업', '정기성사업'],
    '전산운용비': ['증권전산운용비', '전산수선비', '전산임차료', '전산용역비', '전산회선료', '기타']
  };

  // 부서 목록 (API에서 로드)
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



  // API에서 부서 목록 로드
  const fetchDepartments = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/departments`);
      if (response.ok) {
        const data = await response.json();
        // 부서명만 추출하여 배열로 변환
        const departmentNames = data.map(dept => dept.deptName || dept.name || dept);
        setDepartments(departmentNames);
        console.log('✅ 부서 목록 로드 완료:', departmentNames.length, '개');
      } else {
        console.error('부서 목록 로드 실패:', response.statusText);
      }
    } catch (error) {
      console.error('부서 목록 API 호출 오류:', error);
    }
  };

  // API에서 사업예산 데이터 로드
  const fetchBudgets = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/budget-statistics`);
      if (response.ok) {
        const data = await response.json();
        // 년도별 필터링
        const filteredData = data.filter(budget => 
          year === 'all' || budget.budgetYear === year
        );
        setBudgets(filteredData);
      } else {
        console.error('사업예산 데이터 로드 실패:', response.statusText);
      }
    } catch (error) {
      console.error('API 호출 오류:', error);
    }
  };

  useEffect(() => {
    fetchDepartments(); // 부서 목록 로드
    fetchBudgets();
  }, [year]);

  // 사업예산 집행금액 동기화 함수
  const syncBudgetExecution = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/sync-budget-execution`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        alert(result.message);
        // 동기화 후 데이터 새로고침
        await fetchBudgets();
      } else {
        const error = await response.json();
        alert(`동기화 실패: ${error.error}`);
      }
    } catch (error) {
      console.error('동기화 오류:', error);
      alert('동기화 중 오류가 발생했습니다.');
    }
  };

  // 샘플 데이터 (API 연결 전까지 사용)
  const sampleBudgets = [
      {
        id: 2,
        projectName: '보안 시스템 구축',
        initiatorDepartment: 'IT팀',
        executorDepartment: '보안팀',
        budgetType: '자본예산',
        budgetCategory: '보안사업',
        budgetAmount: 80000000,
        startDate: '2024-02',
        endDate: '2024-12',
        isEssential: true,
        projectPurpose: 'A',
        budgetYear: 2024,
        status: '승인대기',
        createdAt: '2024-01-20'
      },
      {
        id: 3,
        projectName: '전산 시스템 유지보수',
        initiatorDepartment: 'IT팀',
        executorDepartment: 'IT팀',
        budgetType: '전산운용비',
        budgetCategory: '전산수선비',
        budgetAmount: 15000000,
        startDate: '2024-03',
        endDate: '2024-08',
        isEssential: false,
        projectPurpose: 'E',
        budgetYear: 2024,
        status: '완료',
        createdAt: '2024-01-05'
      },
      {
        id: 4,
        projectName: '클라우드 서버 임대',
        initiatorDepartment: 'IT팀',
        executorDepartment: 'IT팀',
        budgetType: '전산운용비',
        budgetCategory: '전산임차료',
        budgetAmount: 25000000,
        startDate: '2024-01',
        endDate: '2024-12',
        isEssential: false,
        projectPurpose: 'D',
        budgetYear: 2024,
        status: '진행중',
        createdAt: '2024-01-15'
      },
      {
        id: 5,
        projectName: '증권 거래 시스템 업그레이드',
        initiatorDepartment: '증권팀',
        executorDepartment: 'IT개발팀',
        budgetType: '전산운용비',
        budgetCategory: '증권전산운용비',
        budgetAmount: 250000000,
        startDate: '2024-02',
        endDate: '2024-06',
        isEssential: true,
        projectPurpose: 'C',
        budgetYear: 2024,
        status: '승인',
        createdAt: '2024-01-25'
      },
      {
        id: 6,
        projectName: '사무실 전산 장비 임대',
        initiatorDepartment: '총무팀',
        executorDepartment: 'IT운영팀',
        budgetType: '전산운용비',
        budgetCategory: '전산임차료',
        budgetAmount: 80000000,
        startDate: '2024-01',
        endDate: '2024-12',
        isEssential: false,
        projectPurpose: 'D',
        budgetYear: 2024,
        status: '승인',
        createdAt: '2024-01-08'
      },
      {
        id: 7,
        projectName: '데이터베이스 최적화 용역',
        initiatorDepartment: 'IT기획팀',
        executorDepartment: 'IT개발팀',
        budgetType: '전산운용비',
        budgetCategory: '전산용역비',
        budgetAmount: 120000000,
        startDate: '2024-04',
        endDate: '2024-09',
        isEssential: false,
        projectPurpose: 'C',
        budgetYear: 2024,
        status: '검토중',
        createdAt: '2024-02-15'
      },
      {
        id: 8,
        projectName: '고속 인터넷 회선 구축',
        initiatorDepartment: 'IT기획팀',
        executorDepartment: 'IT운영팀',
        budgetType: '전산운용비',
        budgetCategory: '전산회선료',
        budgetAmount: 60000000,
        startDate: '2024-03',
        endDate: '2024-12',
        isEssential: true,
        projectPurpose: 'C',
        budgetYear: 2024,
        status: '승인',
        createdAt: '2024-02-20'
      },
      {
        id: 9,
        projectName: '정기 시스템 점검 및 업데이트',
        initiatorDepartment: 'IT운영팀',
        executorDepartment: 'IT운영팀',
        budgetType: '자본예산',
        budgetCategory: '정기성사업',
        budgetAmount: 180000000,
        startDate: '2024-01',
        endDate: '2024-12',
        isEssential: true,
        projectPurpose: 'E',
        budgetYear: 2024,
        status: '승인',
        createdAt: '2024-01-01'
      },
      {
        id: 10,
        projectName: '클라우드 서비스 구축',
        initiatorDepartment: 'IT기획팀',
        executorDepartment: 'IT개발팀',
        budgetType: '자본예산',
        budgetCategory: '일반사업',
        budgetAmount: 400000000,
        startDate: '2024-05',
        endDate: '2024-11',
        isEssential: false,
        projectPurpose: 'C',
        budgetYear: 2024,
        status: '검토중',
        createdAt: '2024-03-10'
      },
      {
        id: 11,
        projectName: '전산 관련 기타 비용',
        initiatorDepartment: 'IT운영팀',
        executorDepartment: 'IT운영팀',
        budgetType: '전산운용비',
        budgetCategory: '기타',
        budgetAmount: 45000000,
        startDate: '2024-01',
        endDate: '2024-12',
        isEssential: false,
        projectPurpose: 'E',
        budgetYear: 2024,
        status: '승인',
        createdAt: '2024-01-12'
      },
      {
        id: 12,
        projectName: '백업 시스템 구축',
        initiatorDepartment: '보안팀',
        executorDepartment: 'IT개발팀',
        budgetType: '자본예산',
        budgetCategory: '보안사업',
        budgetAmount: 220000000,
        startDate: '2024-06',
        endDate: '2024-10',
        isEssential: true,
        projectPurpose: 'A',
        budgetYear: 2024,
        status: '검토중',
        createdAt: '2024-04-05'
      },
      {
        id: 13,
        projectName: '모바일 앱 개발',
        initiatorDepartment: '마케팅팀',
        executorDepartment: 'IT개발팀',
        budgetType: '자본예산',
        budgetCategory: '일반사업',
        budgetAmount: 350000000,
        startDate: '2024-07',
        endDate: '2024-12',
        isEssential: false,
        projectPurpose: 'C',
        budgetYear: 2024,
        status: '승인',
        createdAt: '2024-05-15'
      },
      {
        id: 14,
        projectName: '네트워크 보안 강화',
        initiatorDepartment: '보안팀',
        executorDepartment: '보안팀',
        budgetType: '자본예산',
        budgetCategory: '보안사업',
        budgetAmount: 280000000,
        startDate: '2024-04',
        endDate: '2024-08',
        isEssential: true,
        projectPurpose: 'A',
        budgetYear: 2024,
        status: '승인',
        createdAt: '2024-03-20'
      },
      {
        id: 15,
        projectName: '분기별 시스템 점검',
        initiatorDepartment: 'IT운영팀',
        executorDepartment: 'IT운영팀',
        budgetType: '자본예산',
        budgetCategory: '정기성사업',
        budgetAmount: 90000000,
        startDate: '2024-01',
        endDate: '2024-12',
        isEssential: true,
        projectPurpose: 'E',
        budgetYear: 2024,
        status: '승인',
        createdAt: '2024-01-03'
      },
      {
        id: 16,
        projectName: 'AI 분석 시스템 도입',
        initiatorDepartment: '데이터팀',
        executorDepartment: 'IT개발팀',
        budgetType: '자본예산',
        budgetCategory: '일반사업',
        budgetAmount: 600000000,
        startDate: '2024-08',
        endDate: '2024-12',
        isEssential: false,
        projectPurpose: 'C',
        budgetYear: 2024,
        status: '검토중',
        createdAt: '2024-06-10'
      },
      {
        id: 17,
        projectName: '통합 모니터링 시스템',
        initiatorDepartment: 'IT운영팀',
        executorDepartment: 'IT개발팀',
        budgetType: '자본예산',
        budgetCategory: '일반사업',
        budgetAmount: 150000000,
        startDate: '2024-03',
        endDate: '2024-07',
        isEssential: true,
        projectPurpose: 'C',
        budgetYear: 2024,
        status: '진행중',
        createdAt: '2024-02-28'
      },
      {
        id: 18,
        projectName: '소프트웨어 라이선스 구매',
        initiatorDepartment: 'IT기획팀',
        executorDepartment: 'IT운영팀',
        budgetType: '전산운용비',
        budgetCategory: '기타',
        budgetAmount: 75000000,
        startDate: '2024-01',
        endDate: '2024-12',
        isEssential: false,
        projectPurpose: 'D',
        budgetYear: 2024,
        status: '승인',
        createdAt: '2024-01-18'
      },
      {
        id: 19,
        projectName: '재해 복구 시스템 구축',
        initiatorDepartment: '보안팀',
        executorDepartment: 'IT개발팀',
        budgetType: '자본예산',
        budgetCategory: '보안사업',
        budgetAmount: 320000000,
        startDate: '2024-09',
        endDate: '2024-12',
        isEssential: true,
        projectPurpose: 'A',
        budgetYear: 2024,
        status: '검토중',
        createdAt: '2024-07-05'
      },
      {
        id: 20,
        projectName: '사용자 교육 프로그램',
        initiatorDepartment: '인사팀',
        executorDepartment: 'IT운영팀',
        budgetType: '전산운용비',
        budgetCategory: '전산용역비',
        budgetAmount: 30000000,
        startDate: '2024-02',
        endDate: '2024-11',
        isEssential: false,
        projectPurpose: 'C',
        budgetYear: 2024,
        status: '진행중',
        createdAt: '2024-01-30'
      },
      // 전년도 데이터
      {
        id: 21,
        projectName: '2023년 시스템 구축',
        initiatorDepartment: 'IT팀',
        executorDepartment: 'IT팀',
        budgetType: '자본예산',
        budgetCategory: '일반사업',
        budgetAmount: 300000000,
        startDate: '2023-01',
        endDate: '2023-12',
        isEssential: true,
        projectPurpose: 'C',
        budgetYear: 2023,
        status: '완료',
        createdAt: '2023-01-15'
      },
      {
        id: 22,
        projectName: '2023년 보안 강화',
        initiatorDepartment: '보안팀',
        executorDepartment: '보안팀',
        budgetType: '자본예산',
        budgetCategory: '보안사업',
        budgetAmount: 150000000,
        startDate: '2023-03',
        endDate: '2023-08',
        isEssential: true,
        projectPurpose: 'A',
        budgetYear: 2023,
        status: '완료',
        createdAt: '2023-02-20'
      },
      {
        id: 23,
        projectName: '2023년 전산 운영비',
        initiatorDepartment: 'IT운영팀',
        executorDepartment: 'IT운영팀',
        budgetType: '전산운용비',
        budgetCategory: '전산수선비',
        budgetAmount: 80000000,
        startDate: '2023-01',
        endDate: '2023-12',
        isEssential: false,
        projectPurpose: 'E',
        budgetYear: 2023,
        status: '완료',
        createdAt: '2023-01-10'
      },
      // 차년도 데이터
      {
        id: 24,
        projectName: '2025년 AI 시스템 도입',
        initiatorDepartment: '데이터팀',
        executorDepartment: 'IT개발팀',
        budgetType: '자본예산',
        budgetCategory: '일반사업',
        budgetAmount: 800000000,
        startDate: '2025-01',
        endDate: '2025-12',
        isEssential: false,
        projectPurpose: 'C',
        budgetYear: 2025,
        status: '검토중',
        createdAt: '2024-12-01'
      },
      {
        id: 25,
        projectName: '2025년 클라우드 마이그레이션',
        initiatorDepartment: 'IT기획팀',
        executorDepartment: 'IT개발팀',
        budgetType: '자본예산',
        budgetCategory: '일반사업',
        budgetAmount: 500000000,
        startDate: '2025-03',
        endDate: '2025-11',
        isEssential: true,
        projectPurpose: 'C',
        budgetYear: 2025,
        status: '승인대기',
        createdAt: '2024-11-15'
      },
      {
        id: 26,
        projectName: '2025년 전산 운영비',
        initiatorDepartment: 'IT운영팀',
        executorDepartment: 'IT운영팀',
        budgetType: '전산운용비',
        budgetCategory: '전산수선비',
        budgetAmount: 120000000,
        startDate: '2025-01',
        endDate: '2025-12',
        isEssential: false,
        projectPurpose: 'D',
        budgetYear: 2025,
        status: '검토중',
        createdAt: '2024-12-10'
      }
    ];
    } else if (year === 2025) {
      initialData = [
        {
          id: 1,
          projectName: '2025년 AI 시스템 도입',
          initiatorDepartment: '데이터팀',
          executorDepartment: 'IT개발팀',
          budgetType: '자본예산',
          budgetCategory: '일반사업',
          budgetAmount: 800000000,
          startDate: '2025-01',
          endDate: '2025-12',
          isEssential: false,
          projectPurpose: 'C',
          status: '검토중',
          createdAt: '2024-12-01'
        },
        {
          id: 2,
          projectName: '2025년 클라우드 마이그레이션',
          initiatorDepartment: 'IT기획팀',
          executorDepartment: 'IT개발팀',
          budgetType: '자본예산',
          budgetCategory: '일반사업',
          budgetAmount: 500000000,
          startDate: '2025-03',
          endDate: '2025-11',
          isEssential: true,
          projectPurpose: 'C',
          status: '승인대기',
          createdAt: '2024-11-15'
        },
        {
          id: 3,
          projectName: '2025년 전산 운영비',
          initiatorDepartment: 'IT운영팀',
          executorDepartment: 'IT운영팀',
          budgetType: '전산운용비',
          budgetCategory: '전산수선비',
          budgetAmount: 120000000,
          startDate: '2025-01',
          endDate: '2025-12',
          isEssential: false,
          projectPurpose: 'D',
          status: '검토중',
          createdAt: '2024-12-10'
        }
      ];
    } else if (year === 2026) {
      initialData = [
        {
          id: 1,
          projectName: '2026년 차세대 시스템 구축',
          initiatorDepartment: 'IT기획팀',
          executorDepartment: 'IT개발팀',
          budgetType: '자본예산',
          budgetCategory: '일반사업',
          budgetAmount: 1000000000,
          startDate: '2026-01',
          endDate: '2026-12',
          isEssential: true,
          projectPurpose: 'C',
          status: '검토중',
          createdAt: '2025-12-01'
        },
        {
          id: 2,
          projectName: '2026년 보안 시스템 강화',
          initiatorDepartment: '보안팀',
          executorDepartment: '보안팀',
          budgetType: '자본예산',
          budgetCategory: '보안사업',
          budgetAmount: 300000000,
          startDate: '2026-02',
          endDate: '2026-08',
          isEssential: true,
          projectPurpose: 'A',
          status: '검토중',
          createdAt: '2025-11-20'
        },
        {
          id: 3,
          projectName: '2026년 전산 운영비',
          initiatorDepartment: 'IT운영팀',
          executorDepartment: 'IT운영팀',
          budgetType: '전산운용비',
          budgetCategory: '전산수선비',
          budgetAmount: 150000000,
          startDate: '2026-01',
          endDate: '2026-12',
          isEssential: false,
          projectPurpose: 'D',
          status: '검토중',
          createdAt: '2025-12-15'
        }
      ];
    }
    
    setBudgets(initialData);
  }, [year]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // 현재 로그인한 사용자 정보 가져오기
      const currentUser = getCurrentUserName();
      
      // API 호출하여 서버에 저장
      const response = await fetch(`${API_BASE_URL}/api/business-budgets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          budgetYear: year,
          createdBy: currentUser // 작성자 정보 추가
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '예산 등록 실패');
      }
      
      const result = await response.json();
      
      // 폼 초기화
      setFormData({
        projectName: '',
        initiatorDepartment: '',
        executorDepartment: '',
        budgetType: '',
        budgetCategory: '',
        budgetAmount: '',
        startDate: '',
        endDate: '',
        isEssential: false,
        projectPurpose: ''
      });
      
      alert('예산이 등록되었습니다.');
      
      // 목록 새로고침
      fetchBudgets();
    } catch (error) {
      console.error('예산 등록 실패:', error);
      alert(`예산 등록에 실패했습니다: ${error.message}`);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });

    // 예산 유형이 변경되면 세부 분류 초기화
    if (name === 'budgetType') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        budgetCategory: ''
      }));
    }
  };

  // 정렬 함수
  const handleSort = (key) => {
    setSortConfigs(prevConfigs => {
      const existingIndex = prevConfigs.findIndex(config => config.key === key);
      let newConfigs = [...prevConfigs];
      
      if (existingIndex >= 0) {
        // 이미 정렬된 컬럼인 경우 방향 변경 또는 제거
        const currentDirection = newConfigs[existingIndex].direction;
        if (currentDirection === 'asc') {
          newConfigs[existingIndex] = { key, direction: 'desc' };
        } else if (currentDirection === 'desc') {
          // desc에서 다시 클릭하면 정렬 제거
          newConfigs.splice(existingIndex, 1);
        }
      } else {
        // 새로운 컬럼 정렬 추가
        newConfigs.push({ key, direction: 'asc' });
      }
      
      return newConfigs;
    });
  };

  // 정렬된 데이터 반환
  const getSortedData = () => {
    if (sortConfigs.length === 0) return budgets;

    return [...budgets].sort((a, b) => {
      // 다중 정렬: 각 정렬 조건을 순서대로 적용
      for (const sortConfig of sortConfigs) {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // 숫자 필드 처리
        if (sortConfig.key === 'budgetAmount') {
          aValue = parseInt(aValue) || 0;
          bValue = parseInt(bValue) || 0;
        }

        // 날짜 필드 처리
        if (sortConfig.key === 'startDate' || sortConfig.key === 'endDate' || sortConfig.key === 'createdAt') {
          aValue = new Date(aValue);
          bValue = new Date(bValue);
        }

        // 불린 필드 처리
        if (sortConfig.key === 'isEssential') {
          aValue = aValue ? 1 : 0;
          bValue = bValue ? 1 : 0;
        }

        // 문자열 필드 처리
        if (typeof aValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        // 값이 같으면 다음 정렬 조건으로
      }
      return 0;
    });
  };

  // 부서 검색 결과 반환
  const getFilteredDepartments = (type) => {
    const searchTerm = departmentSearch[type].toLowerCase();
    return departments.filter(dept => 
      dept.toLowerCase().includes(searchTerm)
    );
  };

  // 부서 선택 처리
  const handleDepartmentSelect = (type, department) => {
    setFormData(prev => ({
      ...prev,
      [type === 'initiator' ? 'initiatorDepartment' : 'executorDepartment']: department
    }));
    setDepartmentSearch(prev => ({
      ...prev,
      [type]: ''
    }));
    setShowDepartmentDropdown(prev => ({
      ...prev,
      [type]: false
    }));
  };

  // 부서 검색 입력 처리
  const handleDepartmentSearch = (type, value) => {
    setDepartmentSearch(prev => ({
      ...prev,
      [type]: value
    }));
    setFormData(prev => ({
      ...prev,
      [type === 'initiator' ? 'initiatorDepartment' : 'executorDepartment']: value
    }));
    setShowDepartmentDropdown(prev => ({
      ...prev,
      [type]: true
    }));
  };

  // 부서 입력 필드 포커스 처리
  const handleDepartmentFocus = (type) => {
    setShowDepartmentDropdown(prev => ({
      ...prev,
      [type]: true
    }));
  };

  // 부서 입력 필드 블러 처리
  const handleDepartmentBlur = (type) => {
    setTimeout(() => {
      setShowDepartmentDropdown(prev => ({
        ...prev,
        [type]: false
      }));
    }, 200);
  };

  // 편집 모드 부서 선택 처리
  const handleEditDepartmentSelect = (type, department) => {
    setEditForm(prev => ({
      ...prev,
      [type === 'initiator' ? 'initiatorDepartment' : 'executorDepartment']: department
    }));
    setShowEditDepartmentDropdown(prev => ({
      ...prev,
      [type]: false
    }));
  };

  // 편집 모드 부서 검색 입력 처리
  const handleEditDepartmentSearch = (type, value) => {
    setEditForm(prev => ({
      ...prev,
      [type === 'initiator' ? 'initiatorDepartment' : 'executorDepartment']: value
    }));
    setShowEditDepartmentDropdown(prev => ({
      ...prev,
      [type]: true
    }));
  };

  // 편집 모드 부서 입력 필드 포커스 처리
  const handleEditDepartmentFocus = (type) => {
    setShowEditDepartmentDropdown(prev => ({
      ...prev,
      [type]: true
    }));
  };

  // 편집 모드 부서 입력 필드 블러 처리
  const handleEditDepartmentBlur = (type) => {
    setTimeout(() => {
      setShowEditDepartmentDropdown(prev => ({
        ...prev,
        [type]: false
      }));
    }, 200);
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
      budgetYear: '예산년도',
      startDate: '사업기간',
      status: '상태',
      createdAt: '등록일'
    };
    return columnNames[key] || key;
  };

  // 정렬 아이콘 반환
  const getSortIcon = (key) => {
    const sortConfig = sortConfigs.find(config => config.key === key);
    if (!sortConfig) {
      return '↕️';
    }
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  // 예산 수정 시작
  const handleEdit = (budget) => {
    setEditingBudget(budget.id);
    setEditForm({
      projectName: budget.projectName,
      initiatorDepartment: budget.initiatorDepartment,
      executorDepartment: budget.executorDepartment,
      budgetType: budget.budgetType,
      budgetCategory: budget.budgetCategory,
      budgetAmount: budget.budgetAmount,
      startDate: budget.startDate,
      endDate: budget.endDate,
      isEssential: budget.isEssential,
      projectPurpose: budget.projectPurpose
    });
  };

  // 예산 수정 취소
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
      projectPurpose: ''
    });
  };

  // 예산 수정 저장
  const handleSaveEdit = async (budgetId) => {
    if (editForm.projectName.trim()) {
      try {
        // 현재 로그인한 사용자 정보 가져오기
        const currentUser = getCurrentUserName();
        
        // API 호출하여 서버에 저장
        const response = await fetch(`${API_BASE_URL}/api/business-budgets/${budgetId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...editForm,
            changedBy: currentUser // 변경자 정보 추가
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || '예산 수정 실패');
        }
        
        // 로컬 상태 업데이트
        setBudgets(budgets.map(budget => 
          budget.id === budgetId 
            ? { ...budget, ...editForm, budgetYear: year }
            : budget
        ));
        
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
          projectPurpose: ''
        });
        
        alert('예산이 수정되었습니다.');
        
        // 목록 새로고침
        fetchBudgets();
      } catch (error) {
        console.error('예산 수정 실패:', error);
        alert(`예산 수정에 실패했습니다: ${error.message}`);
      }
    }
  };

  // 예산 삭제
  const handleDelete = async (budgetId) => {
    if (window.confirm('정말로 이 예산을 삭제하시겠습니까?')) {
      try {
        // 현재 로그인한 사용자 정보 가져오기
        const currentUser = getCurrentUserName();
        
        // API 호출하여 서버에서 삭제
        const response = await fetch(`${API_BASE_URL}/api/business-budgets/${budgetId}?deletedBy=${encodeURIComponent(currentUser)}`, {
          method: 'DELETE'
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || '예산 삭제 실패');
        }
        
        // 로컬 상태 업데이트
        setBudgets(budgets.filter(budget => budget.id !== budgetId));
        
        alert('예산이 삭제되었습니다.');
        
        // 목록 새로고침
        fetchBudgets();
      } catch (error) {
        console.error('예산 삭제 실패:', error);
        alert(`예산 삭제에 실패했습니다: ${error.message}`);
      }
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

  const budgetSummary = calculateBudgetSummary();
  const sortedBudgets = getSortedData();

  return (
    <div className="budget-registration">
      <h1>{year}년 사업예산 관리</h1>
      
      {/* 예산 등록 폼 */}
      <div className="registration-section">
        <h2>새 예산 등록</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>사업명</label>
            <input
              type="text"
              name="projectName"
              value={formData.projectName}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>발의부서</label>
              <div className="search-dropdown">
                <input
                  type="text"
                  value={formData.initiatorDepartment}
                  onChange={(e) => handleDepartmentSearch('initiator', e.target.value)}
                  onFocus={() => handleDepartmentFocus('initiator')}
                  onBlur={() => handleDepartmentBlur('initiator')}
                  placeholder="부서명을 입력하거나 선택하세요"
                  required
                />
                {showDepartmentDropdown.initiator && (
                  <div className="dropdown-list">
                    {getFilteredDepartments('initiator').map((dept, index) => (
                      <div
                        key={index}
                        className="dropdown-item"
                        onClick={() => handleDepartmentSelect('initiator', dept)}
                      >
                        {dept}
                      </div>
                    ))}
                    {getFilteredDepartments('initiator').length === 0 && (
                      <div className="dropdown-item no-results">검색 결과가 없습니다</div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="form-group">
              <label>추진부서</label>
              <div className="search-dropdown">
                <input
                  type="text"
                  value={formData.executorDepartment}
                  onChange={(e) => handleDepartmentSearch('executor', e.target.value)}
                  onFocus={() => handleDepartmentFocus('executor')}
                  onBlur={() => handleDepartmentBlur('executor')}
                  placeholder="부서명을 입력하거나 선택하세요"
                  required
                />
                {showDepartmentDropdown.executor && (
                  <div className="dropdown-list">
                    {getFilteredDepartments('executor').map((dept, index) => (
                      <div
                        key={index}
                        className="dropdown-item"
                        onClick={() => handleDepartmentSelect('executor', dept)}
                      >
                        {dept}
                      </div>
                    ))}
                    {getFilteredDepartments('executor').length === 0 && (
                      <div className="dropdown-item no-results">검색 결과가 없습니다</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>예산 유형</label>
              <select name="budgetType" value={formData.budgetType} onChange={handleChange} required>
                <option value="">예산 유형 선택</option>
                <option value="자본예산">자본예산</option>
                <option value="전산운용비">전산운용비</option>
              </select>
            </div>
            <div className="form-group">
              <label>세부 분류</label>
              <select name="budgetCategory" value={formData.budgetCategory} onChange={handleChange} required>
                <option value="">세부 분류 선택</option>
                {formData.budgetType && budgetTypes[formData.budgetType]?.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>예산 금액</label>
              <input
                type="number"
                name="budgetAmount"
                value={formData.budgetAmount}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="isEssential"
                  checked={formData.isEssential}
                  onChange={handleChange}
                />
                <span className="checkmark"></span>
                필수사업 여부
              </label>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>사업기간</label>
              <div className="date-inputs">
                <input
                  type="month"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  required
                />
                <span>~</span>
                <input
                  type="month"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label>사업목적</label>
              <select name="projectPurpose" value={formData.projectPurpose} onChange={handleChange} required>
                <option value="">사업목적 선택</option>
                {projectPurposes.map(purpose => (
                  <option key={purpose.value} value={purpose.value}>
                    {purpose.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button type="submit" className="submit-btn">예산 등록</button>
        </form>
      </div>

      {/* 등록된 예산 리스트 */}
      <div className="budgets-list">
        <h2>{year}년 등록된 예산 목록</h2>
        

        
        {/* 정렬 상태 표시 */}
        {sortConfigs.length > 0 && (
          <div className="sort-status">
            <span className="sort-label">정렬 조건:</span>
            {sortConfigs.map((config, index) => (
              <span key={config.key} className="sort-badge">
                {getColumnName(config.key)} {config.direction === 'asc' ? '↑' : '↓'}
                <button 
                  className="remove-sort" 
                  onClick={() => handleSort(config.key)}
                  title="정렬 제거"
                >
                  ×
                </button>
                {index < sortConfigs.length - 1 && <span className="sort-separator">, </span>}
              </span>
            ))}
            <button 
              className="clear-all-sorts" 
              onClick={() => setSortConfigs([])}
              title="모든 정렬 제거"
            >
              모든 정렬 제거
            </button>
          </div>
        )}
        
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
                  {editingBudget === budget.id ? (
                    // 편집 모드
                    <>
                      <td>
                        <input
                          type="text"
                          value={editForm.projectName}
                          onChange={(e) => setEditForm({...editForm, projectName: e.target.value})}
                          className="table-input"
                          required
                        />
                      </td>
                      <td>
                        <div className="search-dropdown table-dropdown">
                          <input
                            type="text"
                            value={editForm.initiatorDepartment}
                            onChange={(e) => handleEditDepartmentSearch('initiator', e.target.value)}
                            onFocus={() => handleEditDepartmentFocus('initiator')}
                            onBlur={() => handleEditDepartmentBlur('initiator')}
                            className="table-input"
                            placeholder="부서명 입력"
                            required
                          />
                          {showEditDepartmentDropdown.initiator && (
                            <div className="dropdown-list table-dropdown-list">
                              {departments.filter(dept => 
                                dept.toLowerCase().includes(editForm.initiatorDepartment.toLowerCase())
                              ).map((dept, index) => (
                                <div
                                  key={index}
                                  className="dropdown-item"
                                  onClick={() => handleEditDepartmentSelect('initiator', dept)}
                                >
                                  {dept}
                                </div>
                              ))}
                              {departments.filter(dept => 
                                dept.toLowerCase().includes(editForm.initiatorDepartment.toLowerCase())
                              ).length === 0 && (
                                <div className="dropdown-item no-results">검색 결과가 없습니다</div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="search-dropdown table-dropdown">
                          <input
                            type="text"
                            value={editForm.executorDepartment}
                            onChange={(e) => handleEditDepartmentSearch('executor', e.target.value)}
                            onFocus={() => handleEditDepartmentFocus('executor')}
                            onBlur={() => handleEditDepartmentBlur('executor')}
                            className="table-input"
                            placeholder="부서명 입력"
                            required
                          />
                          {showEditDepartmentDropdown.executor && (
                            <div className="dropdown-list table-dropdown-list">
                              {departments.filter(dept => 
                                dept.toLowerCase().includes(editForm.executorDepartment.toLowerCase())
                              ).map((dept, index) => (
                                <div
                                  key={index}
                                  className="dropdown-item"
                                  onClick={() => handleEditDepartmentSelect('executor', dept)}
                                >
                                  {dept}
                                </div>
                              ))}
                              {departments.filter(dept => 
                                dept.toLowerCase().includes(editForm.executorDepartment.toLowerCase())
                              ).length === 0 && (
                                <div className="dropdown-item no-results">검색 결과가 없습니다</div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <select 
                          value={editForm.budgetType} 
                          onChange={(e) => {
                            setEditForm({
                              ...editForm, 
                              budgetType: e.target.value,
                              budgetCategory: ''
                            });
                          }}
                          className="table-select"
                          required
                        >
                          <option value="">예산 유형 선택</option>
                          <option value="자본예산">자본예산</option>
                          <option value="전산운용비">전산운용비</option>
                        </select>
                      </td>
                      <td>
                        <select 
                          value={editForm.budgetCategory} 
                          onChange={(e) => setEditForm({...editForm, budgetCategory: e.target.value})}
                          className="table-select"
                          required
                        >
                          <option value="">세부 분류 선택</option>
                          {editForm.budgetType && budgetTypes[editForm.budgetType]?.map(category => (
                            <option key={category} value={category}>{category}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          type="number"
                          value={editForm.budgetAmount}
                          onChange={(e) => setEditForm({...editForm, budgetAmount: e.target.value})}
                          className="table-input"
                          required
                        />
                      </td>
                      <td>
                        <input
                          type="checkbox"
                          checked={editForm.isEssential}
                          onChange={(e) => setEditForm({...editForm, isEssential: e.target.checked})}
                          className="table-checkbox"
                        />
                      </td>
                      <td>
                        <select 
                          value={editForm.projectPurpose} 
                          onChange={(e) => setEditForm({...editForm, projectPurpose: e.target.value})}
                          className="table-select"
                          required
                        >
                          <option value="">선택</option>
                          {projectPurposes.map(purpose => (
                            <option key={purpose.value} value={purpose.value}>
                              {purpose.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <div className="date-inputs">
                          <input
                            type="month"
                            value={editForm.startDate}
                            onChange={(e) => setEditForm({...editForm, startDate: e.target.value})}
                            className="table-input date-input"
                            required
                          />
                          <span>~</span>
                          <input
                            type="month"
                            value={editForm.endDate}
                            onChange={(e) => setEditForm({...editForm, endDate: e.target.value})}
                            className="table-input date-input"
                            required
                          />
                        </div>
                      </td>
                      <td>
                        <span 
                          className="status-badge"
                          style={{ backgroundColor: getStatusColor(budget.status) }}
                        >
                          {budget.status}
                        </span>
                      </td>
                      <td>{budget.createdAt}</td>
                      <td>
                        <div className="table-actions">
                          <button 
                            type="button" 
                            className="save-btn"
                            onClick={() => handleSaveEdit(budget.id)}
                          >
                            저장
                          </button>
                          <button 
                            type="button" 
                            className="cancel-btn"
                            onClick={handleCancelEdit}
                          >
                            취소
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    // 보기 모드
                    <>
                      <td>{budget.projectName}</td>
                      <td>{budget.initiatorDepartment}</td>
                      <td>{budget.executorDepartment}</td>
                      <td>
                        <span 
                          className="budget-type-badge"
                          style={{ backgroundColor: getBudgetTypeColor(budget.budgetType) }}
                        >
                          {budget.budgetType}
                        </span>
                      </td>
                      <td>{budget.budgetCategory}</td>
                      <td className="amount-cell">{formatCurrency(budget.budgetAmount)}</td>
                      <td>
                        <span className={`essential-badge ${budget.isEssential ? 'essential' : 'non-essential'}`}>
                          {budget.isEssential ? '필수' : '선택'}
                        </span>
                      </td>
                                                   <td>
                               <span className="purpose-badge">
                                 {projectPurposes.find(p => p.value === budget.projectPurpose)?.label || budget.projectPurpose}
                               </span>
                             </td>
                             <td>{budget.startDate} ~ {budget.endDate}</td>
                      <td>
                        <span 
                          className="status-badge"
                          style={{ backgroundColor: getStatusColor(budget.status) }}
                        >
                          {budget.status}
                        </span>
                      </td>
                      <td>{budget.createdAt}</td>
                      <td>
                        <div className="table-actions">
                          <button 
                            type="button" 
                            className="edit-btn"
                            onClick={() => handleEdit(budget)}
                          >
                            수정
                          </button>
                          <button 
                            type="button" 
                            className="delete-btn"
                            onClick={() => handleDelete(budget.id)}
                          >
                            삭제
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 예산 합계 섹션 */}
        <div className="budget-summary">
          <h3>예산 합계</h3>
          <div className="summary-grid">
            <div className="summary-card capital">
              <h4>자본예산</h4>
              <div className="total-amount">{formatCurrency(budgetSummary.capitalBudget.total)}</div>
              <div className="category-breakdown">
                {Object.entries(budgetSummary.capitalBudget.categories).map(([category, amount]) => (
                  amount > 0 && (
                    <div key={category} className="category-item">
                      <span className="category-name">{category}</span>
                      <span className="category-amount">{formatCurrency(amount)}</span>
                    </div>
                  )
                ))}
              </div>
            </div>
            
            <div className="summary-card operation">
              <h4>전산운용비</h4>
              <div className="total-amount">{formatCurrency(budgetSummary.operationBudget.total)}</div>
              <div className="category-breakdown">
                {Object.entries(budgetSummary.operationBudget.categories).map(([category, amount]) => (
                  amount > 0 && (
                    <div key={category} className="category-item">
                      <span className="category-name">{category}</span>
                      <span className="category-amount">{formatCurrency(amount)}</span>
                    </div>
                  )
                ))}
              </div>
            </div>
            
            <div className="summary-card total">
              <h4>총 예산</h4>
              <div className="total-amount grand-total">{formatCurrency(budgetSummary.total)}</div>
            </div>
          </div>
        </div>
      </div>

      <style jsx="true">{`
        .budget-registration {
          max-width: 1600px;
          margin: 0 auto;
          padding: 0 1rem;
        }

        .registration-section {
          background: white;
          padding: 1.5rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          border: 1px solid #e1e5e9;
        }

        .registration-section h2 {
          margin-bottom: 1rem;
          color: #333;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .budgets-list h2 {
          margin-bottom: 1rem;
          color: #333;
          font-size: 1.25rem;
          font-weight: 600;
        }

        /* 정렬 상태 표시 */
        .sort-status {
          background: #f8f9fa;
          padding: 0.75rem;
          border-radius: 6px;
          margin-bottom: 1rem;
          border: 1px solid #e1e5e9;
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .sort-label {
          font-weight: 600;
          color: #333;
          font-size: 0.875rem;
        }

        .sort-badge {
          background: #007bff;
          color: white;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .remove-sort {
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: bold;
          padding: 0;
          width: 16px;
          height: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: background-color 0.2s ease;
        }

        .remove-sort:hover {
          background-color: rgba(255, 255, 255, 0.2);
        }

        .sort-separator {
          color: #6c757d;
          font-weight: normal;
        }

        .clear-all-sorts {
          background: #6c757d;
          color: white;
          border: none;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }

        .clear-all-sorts:hover {
          background: #5a6268;
        }

        /* 년도 필터 스타일 */
        .year-filter {
          background: #f8f9fa;
          padding: 0.75rem;
          border-radius: 6px;
          margin-bottom: 1rem;
          border: 1px solid #e1e5e9;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .year-filter label {
          font-weight: 600;
          color: #333;
          font-size: 0.875rem;
        }

        .year-select {
          padding: 0.375rem 0.75rem;
          border: 1px solid #ced4da;
          border-radius: 4px;
          font-size: 0.875rem;
          background: white;
          cursor: pointer;
        }

        .year-select:focus {
          outline: none;
          border-color: #007bff;
          box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
        }

        /* 검색 드롭다운 스타일 */
        .search-dropdown {
          position: relative;
          width: 100%;
        }

        .search-dropdown input {
          width: 100%;
          padding: 0.375rem;
          border: 1px solid #ced4da;
          border-radius: 4px;
          font-size: 0.875rem;
          transition: border-color 0.2s ease;
          background: white;
        }

        .search-dropdown input:focus {
          outline: none;
          border-color: #007bff;
          box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
        }

        .dropdown-list {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: white;
          border: 1px solid #ced4da;
          border-top: none;
          border-radius: 0 0 4px 4px;
          max-height: 200px;
          overflow-y: auto;
          z-index: 1000;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .table-dropdown-list {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: white;
          border: 1px solid #ced4da;
          border-top: none;
          border-radius: 0 0 4px 4px;
          max-height: 150px;
          overflow-y: auto;
          z-index: 1001;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .dropdown-item {
          padding: 0.5rem;
          cursor: pointer;
          font-size: 0.875rem;
          border-bottom: 1px solid #f8f9fa;
          transition: background-color 0.2s ease;
        }

        .dropdown-item:hover {
          background-color: #f8f9fa;
        }

        .dropdown-item:last-child {
          border-bottom: none;
        }

        .dropdown-item.no-results {
          color: #6c757d;
          font-style: italic;
          cursor: default;
        }

        .dropdown-item.no-results:hover {
          background-color: transparent;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          font-weight: 500;
          color: #333;
        }

        .checkbox-label input[type="checkbox"] {
          width: 16px;
          height: 16px;
          cursor: pointer;
        }

        .table-responsive {
          overflow-x: auto;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          margin-bottom: 1.5rem;
          border: 1px solid #e1e5e9;
        }

        .table {
          width: 100%;
          border-collapse: collapse;
          background: white;
          border-radius: 8px;
          overflow: hidden;
          font-size: 0.875rem;
        }

        .table th,
        .table td {
          padding: 0.75rem;
          text-align: left;
          border-bottom: 1px solid #e1e5e9;
          vertical-align: middle;
          line-height: 1.4;
        }

        .table th {
          background: #f8f9fa;
          color: #333;
          font-weight: 600;
          font-size: 0.875rem;
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .sortable {
          cursor: pointer;
          user-select: none;
          transition: background-color 0.2s ease;
        }

        .sortable:hover {
          background-color: #e9ecef;
        }

        .table tr {
          transition: background-color 0.2s ease;
        }

        .table tr:hover {
          background-color: #f8f9fa;
        }

        .table tr:last-child td {
          border-bottom: none;
        }

        .table tr:nth-child(even) {
          background-color: #fafbfc;
        }

        .table tr:nth-child(even):hover {
          background-color: #f8f9fa;
        }

        .amount-cell {
          font-weight: 600;
          color: #28a745;
          font-size: 0.875rem;
        }

        .status-badge, .budget-type-badge {
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          color: white;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .essential-badge {
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .essential-badge.essential {
          background-color: #dc3545;
          color: white;
        }

        .essential-badge.non-essential {
          background-color: #6c757d;
          color: white;
        }

        .purpose-badge {
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 500;
          background-color: #17a2b8;
          color: white;
        }

        .year-badge {
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 500;
          background-color: #6f42c1;
          color: white;
        }

        .table-actions {
          display: flex;
          gap: 0.25rem;
          justify-content: center;
        }

        .edit-btn, .delete-btn, .save-btn, .cancel-btn {
          padding: 0.375rem 0.75rem;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.75rem;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .edit-btn {
          background: #007bff;
          color: white;
        }

        .edit-btn:hover {
          background: #0056b3;
        }

        .delete-btn {
          background: #dc3545;
          color: white;
        }

        .delete-btn:hover {
          background: #c82333;
        }

        .save-btn {
          background: #28a745;
          color: white;
        }

        .save-btn:hover {
          background: #218838;
        }

        .cancel-btn {
          background: #6c757d;
          color: white;
        }

        .cancel-btn:hover {
          background: #5a6268;
        }

        .table-input, .table-select {
          width: 100%;
          padding: 0.375rem;
          border: 1px solid #ced4da;
          border-radius: 4px;
          font-size: 0.875rem;
          transition: border-color 0.2s ease;
          background: white;
        }

        .table-input:focus, .table-select:focus {
          outline: none;
          border-color: #007bff;
          box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
        }

        .table-checkbox {
          width: 16px;
          height: 16px;
          cursor: pointer;
        }

        .date-inputs {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .date-inputs span {
          color: #6c757d;
          font-size: 0.875rem;
        }

        .date-input {
          width: 120px;
        }

        /* 예산 합계 섹션 */
        .budget-summary {
          background: white;
          padding: 1.5rem;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          border: 1px solid #e1e5e9;
        }

        .budget-summary h3 {
          margin-bottom: 1rem;
          color: #333;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .summary-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 1rem;
        }

        .summary-card {
          padding: 1rem;
          border-radius: 6px;
          border: 1px solid #e1e5e9;
          background: #f8f9fa;
        }

        .summary-card.capital {
          border-left: 4px solid #6f42c1;
        }

        .summary-card.operation {
          border-left: 4px solid #fd7e14;
        }

        .summary-card.total {
          border-left: 4px solid #28a745;
        }

        .summary-card h4 {
          margin: 0 0 0.75rem 0;
          color: #333;
          font-size: 1rem;
          font-weight: 600;
        }

        .total-amount {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 0.75rem;
          text-align: center;
        }

        .summary-card.capital .total-amount {
          color: #6f42c1;
        }

        .summary-card.operation .total-amount {
          color: #fd7e14;
        }

        .summary-card.total .total-amount {
          color: #28a745;
        }

        .grand-total {
          font-size: 1.75rem;
        }

        .category-breakdown {
          border-top: 1px solid #dee2e6;
          padding-top: 0.75rem;
        }

        .category-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
          font-size: 0.875rem;
          padding: 0.25rem 0;
        }

        .category-name {
          color: #6c757d;
        }

        .category-amount {
          font-weight: 600;
          color: #333;
        }

        @media (max-width: 768px) {
          .budget-registration {
            padding: 0 0.5rem;
          }

          .table-responsive {
            font-size: 0.8rem;
          }
          
          .table th,
          .table td {
            padding: 0.5rem 0.25rem;
          }
          
          .table-actions {
            flex-direction: column;
            gap: 0.25rem;
          }
          
          .edit-btn, .delete-btn, .save-btn, .cancel-btn {
            padding: 0.25rem 0.5rem;
            font-size: 0.7rem;
          }
          
          .date-inputs {
            flex-direction: column;
            gap: 0.25rem;
          }
          
          .date-input {
            width: 100%;
          }

          .summary-grid {
            grid-template-columns: 1fr;
            gap: 0.75rem;
          }

          .total-amount {
            font-size: 1.25rem;
          }

          .grand-total {
            font-size: 1.5rem;
          }

          .budget-summary {
            padding: 1rem;
          }

          .summary-card {
            padding: 0.75rem;
          }
        }
      `}</style>
    </div>
  );
};

export default BudgetRegistration; 