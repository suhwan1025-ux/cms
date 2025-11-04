import React, { useState, useEffect } from 'react';
import './PersonnelManagement.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002';

function PersonnelManagement() {
  const [personnel, setPersonnel] = useState([]);
  const [filteredPersonnel, setFilteredPersonnel] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [currentPersonnel, setCurrentPersonnel] = useState(null);
  
  // 일자별 조회 상태
  const [backupDates, setBackupDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [isBackupView, setIsBackupView] = useState(false);
  
  // 자동완성용 데이터
  const [suggestions, setSuggestions] = useState({
    divisions: [],
    departments: [],
    positions: [],
    ranks: [],
    duties: []
  });
  
  // 정렬 상태
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  
  // 재직 상태 필터
  const [employmentFilter, setEmploymentFilter] = useState('all'); // 'all', 'active', 'resigned'
  
  // 인력 증감 추이 비교 날짜 (기본값: 일주일 전)
  const [comparisonDate, setComparisonDate] = useState(() => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return weekAgo.toISOString().split('T')[0];
  });
  
  // 폼 데이터
  const [formData, setFormData] = useState({
    division: '',
    department: '',
    position: '',
    employee_number: '',
    name: '',
    rank: '',
    duties: '',
    job_function: '',
    bok_job_function: '',
    job_category: '',
    is_it_personnel: false,
    is_security_personnel: false,
    birth_date: '',
    gender: '',
    age: '',
    group_join_date: '',
    join_date: '',
    resignation_date: '',
    total_service_years: '',
    career_base_date: '',
    it_career_years: '',
    current_duty_date: '',
    current_duty_period: '',
    previous_department: '',
    major: '',
    is_it_major: false,
    it_certificate_1: '',
    it_certificate_2: '',
    it_certificate_3: '',
    it_certificate_4: '',
    notes: ''
  });

  useEffect(() => {
    fetchPersonnel();
    fetchBackupDates();
  }, []);

  useEffect(() => {
    filterPersonnel();
    
    // 자동완성 데이터 업데이트
    const divisions = [...new Set(personnel.map(p => p.division).filter(Boolean))];
    const departments = [...new Set(personnel.map(p => p.department).filter(Boolean))];
    const positions = [...new Set(personnel.map(p => p.position).filter(Boolean))];
    const ranks = [...new Set(personnel.map(p => p.rank).filter(Boolean))];
    const duties = [...new Set(personnel.map(p => p.duties).filter(Boolean))];
    
    setSuggestions({
      divisions: divisions.sort(),
      departments: departments.sort(),
      positions: positions.sort(),
      ranks: ranks.sort(),
      duties: duties.sort()
    });
  }, [searchTerm, personnel, employmentFilter, sortConfig]);

  // 인력현황 목록 조회
  const fetchPersonnel = async (date = null) => {
    try {
      const url = date 
        ? `${API_BASE_URL}/api/personnel?date=${date}`
        : `${API_BASE_URL}/api/personnel`;
      
      const response = await fetch(url);
      const data = await response.json();
      setPersonnel(data);
      setFilteredPersonnel(data);
      
      if (date) {
        setIsBackupView(true);
        setSelectedDate(date);
      } else {
        setIsBackupView(false);
        setSelectedDate('');
      }
    } catch (error) {
      console.error('인력현황 조회 오류:', error);
      alert('인력현황 조회 중 오류가 발생했습니다.');
    }
  };

  // 백업 일자 목록 조회
  const fetchBackupDates = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/personnel/backups/dates`);
      if (response.ok) {
        const dates = await response.json();
        setBackupDates(Array.isArray(dates) ? dates : []);
      } else {
        console.warn('백업 일자를 가져올 수 없습니다:', response.status);
        setBackupDates([]);
      }
    } catch (error) {
      console.error('백업 일자 조회 오류:', error);
      setBackupDates([]);
    }
  };

  // 정렬 함수
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // 검색 및 필터링
  const filterPersonnel = () => {
    let filtered = [...personnel];
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 재직 상태 필터
    if (employmentFilter === 'active') {
      // 재직중: 퇴사일 없고, 입사일이 오늘 이전
      filtered = filtered.filter(p => {
        const joinDate = p.join_date ? new Date(p.join_date) : null;
        return !p.resignation_date && joinDate && joinDate <= today;
      });
    } else if (employmentFilter === 'resigned') {
      // 퇴사자: 퇴사일이 있음
      filtered = filtered.filter(p => p.resignation_date);
    } else if (employmentFilter === 'scheduled') {
      // 입사예정자: 퇴사일 없고, 입사일이 미래
      filtered = filtered.filter(p => {
        const joinDate = p.join_date ? new Date(p.join_date) : null;
        return !p.resignation_date && joinDate && joinDate > today;
      });
    }

    // 검색 필터
    if (searchTerm.trim()) {
      filtered = filtered.filter(p => 
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.employee_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.division?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 정렬
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key] || '';
        const bValue = b[sortConfig.key] || '';
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    
    setFilteredPersonnel(filtered);
  };

  // 모달 열기
  const openModal = (mode, person = null) => {
    setModalMode(mode);
    if (mode === 'edit' && person) {
      setCurrentPersonnel(person);
      setFormData({
        division: person.division || '',
        department: person.department || '',
        position: person.position || '',
        employee_number: person.employee_number || '',
        name: person.name || '',
        rank: person.rank || '',
        duties: person.duties || '',
        job_function: person.job_function || '',
        bok_job_function: person.bok_job_function || '',
        job_category: person.job_category || '',
        is_it_personnel: person.is_it_personnel || false,
        is_security_personnel: person.is_security_personnel || false,
        birth_date: person.birth_date || '',
        gender: person.gender || '',
        age: person.age || '',
        group_join_date: person.group_join_date || '',
        join_date: person.join_date || '',
        resignation_date: person.resignation_date || '',
        total_service_years: person.total_service_years || '',
        career_base_date: person.career_base_date || '',
        it_career_years: person.it_career_years || '',
        current_duty_date: person.current_duty_date || '',
        current_duty_period: person.current_duty_period || '',
        previous_department: person.previous_department || '',
        major: person.major || '',
        is_it_major: person.is_it_major || false,
        it_certificate_1: person.it_certificate_1 || '',
        it_certificate_2: person.it_certificate_2 || '',
        it_certificate_3: person.it_certificate_3 || '',
        it_certificate_4: person.it_certificate_4 || '',
        notes: person.notes || ''
      });
    } else {
      setCurrentPersonnel(null);
      setFormData({
        division: '',
        department: '',
        position: '',
        employee_number: '',
        name: '',
        rank: '',
        duties: '',
        job_function: '',
        bok_job_function: '',
        job_category: '',
        is_it_personnel: false,
        is_security_personnel: false,
        birth_date: '',
        gender: '',
        age: '',
        group_join_date: '',
        join_date: '',
        resignation_date: '',
        total_service_years: '',
        career_base_date: '',
        it_career_years: '',
        current_duty_date: '',
        current_duty_period: '',
        previous_department: '',
        major: '',
        is_it_major: false,
        it_certificate_1: '',
        it_certificate_2: '',
        it_certificate_3: '',
        it_certificate_4: '',
        notes: ''
      });
    }
    setShowModal(true);
  };

  // 모달 닫기
  const closeModal = () => {
    setShowModal(false);
    setCurrentPersonnel(null);
  };

  // 상세보기 모달 열기
  const openDetailModal = (person) => {
    setCurrentPersonnel(person);
    setShowDetailModal(true);
  };

  // 상세보기 모달 닫기
  const closeDetailModal = () => {
    setShowDetailModal(false);
    setCurrentPersonnel(null);
  };

  // 날짜 기반 자동 계산 함수들
  const calculateAge = (birthDate) => {
    if (!birthDate) return '';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const calculateYearsDiff = (startDate) => {
    if (!startDate) return '';
    const today = new Date();
    const start = new Date(startDate);
    const diffTime = Math.abs(today - start);
    const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);
    return diffYears.toFixed(2);
  };

  // 폼 입력 핸들러
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    const updatedData = {
      ...formData,
      [name]: newValue
    };

    // 날짜 기반 자동 계산
    if (name === 'birth_date') {
      updatedData.age = calculateAge(value);
    } else if (name === 'group_join_date') {
      updatedData.total_service_years = calculateYearsDiff(value);
    } else if (name === 'career_base_date') {
      updatedData.it_career_years = calculateYearsDiff(value);
    } else if (name === 'current_duty_date') {
      updatedData.current_duty_period = calculateYearsDiff(value);
    }

    setFormData(updatedData);
  };

  // 저장 (생성/수정)
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name) {
      alert('성명을 입력해주세요.');
      return;
    }

    try {
      // 날짜 필드 처리: 빈 문자열을 null로 변환
      const processedData = { ...formData };
      const dateFields = [
        'birth_date', 'group_join_date', 'join_date', 'resignation_date',
        'career_base_date', 'current_duty_date'
      ];
      
      dateFields.forEach(field => {
        if (processedData[field] === '') {
          processedData[field] = null;
        }
      });
      
      // 숫자 필드 처리: 빈 문자열을 null로 변환
      const numberFields = [
        'age', 'total_service_years', 'it_career_years', 'current_duty_period'
      ];
      
      numberFields.forEach(field => {
        if (processedData[field] === '') {
          processedData[field] = null;
        }
      });
      
      const url = modalMode === 'create'
        ? `${API_BASE_URL}/api/personnel`
        : `${API_BASE_URL}/api/personnel/${currentPersonnel.id}`;
      
      const method = modalMode === 'create' ? 'POST' : 'PUT';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(processedData),
      });

      if (response.ok) {
        alert(modalMode === 'create' ? '등록되었습니다.' : '수정되었습니다.');
        closeModal();
        fetchPersonnel();
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('서버 응답 오류:', errorData);
        throw new Error(errorData.details || errorData.error || '저장 실패');
      }
    } catch (error) {
      console.error('저장 오류:', error);
      alert('저장 중 오류가 발생했습니다: ' + error.message);
    }
  };

  // 삭제
  const handleDelete = async (id) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/personnel/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('삭제되었습니다.');
        fetchPersonnel();
      } else {
        throw new Error('삭제 실패');
      }
    } catch (error) {
      console.error('삭제 오류:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  // 엑셀 다운로드
  const handleExcelDownload = () => {
    const url = selectedDate
      ? `${API_BASE_URL}/api/personnel/export/excel?date=${selectedDate}`
      : `${API_BASE_URL}/api/personnel/export/excel`;
    
    window.open(url, '_blank');
  };

  // 현재 데이터로 돌아가기
  const handleBackToCurrentData = () => {
    fetchPersonnel();
  };

  // 본부별/부서별 계층 구조로 인력 현황 계산
  const calculateHierarchicalStats = (targetDate = null) => {
    const divisionStats = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    personnel.forEach(person => {
      const joinDate = person.join_date ? new Date(person.join_date) : null;
      const resignDate = person.resignation_date ? new Date(person.resignation_date) : null;
      
      if (targetDate) {
        // 비교 날짜가 있는 경우: 해당 날짜 시점에 재직 중이었는지 확인
        const compareDate = new Date(targetDate);
        
        // 입사일이 비교 날짜보다 나중이면 제외
        if (!joinDate || joinDate > compareDate) {
          return;
        }
        
        // 퇴사일이 비교 날짜 이전이면 제외 (이미 퇴사한 상태)
        if (resignDate && resignDate <= compareDate) {
          return;
        }
      } else {
        // 현재 기준: 퇴사자는 제외 (재직자만)
        if (person.resignation_date) return;
        
        // 입사일이 미래인 경우도 제외 (아직 입사 전)
        if (!joinDate || joinDate > today) return;
      }
      
      const division = person.division || '미지정';
      const department = person.department || '미지정';
      
      if (!divisionStats[division]) {
        divisionStats[division] = {
          count: 0,
          departments: {}
        };
      }
      
      divisionStats[division].count++;
      
      if (!divisionStats[division].departments[department]) {
        divisionStats[division].departments[department] = 0;
      }
      divisionStats[division].departments[department]++;
    });
    
    // 정렬된 배열로 변환
    return Object.entries(divisionStats)
      .map(([divisionName, data]) => ({
        division: divisionName,
        count: data.count,
        departments: Object.entries(data.departments)
          .map(([deptName, count]) => ({
            name: deptName,
            count
          }))
          .sort((a, b) => b.count - a.count)
      }))
      .sort((a, b) => b.count - a.count);
  };

  // 입사예정자 계산
  const calculateScheduledStats = () => {
    const divisionStats = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    personnel.forEach(person => {
      const joinDate = person.join_date ? new Date(person.join_date) : null;
      
      // 입사예정자: 퇴사일 없고, 입사일이 미래
      if (person.resignation_date) return;
      if (!joinDate || joinDate <= today) return;
      
      const division = person.division || '미지정';
      const department = person.department || '미지정';
      
      if (!divisionStats[division]) {
        divisionStats[division] = {
          count: 0,
          departments: {}
        };
      }
      
      divisionStats[division].count++;
      
      if (!divisionStats[division].departments[department]) {
        divisionStats[division].departments[department] = 0;
      }
      divisionStats[division].departments[department]++;
    });
    
    // 정렬된 배열로 변환
    return Object.entries(divisionStats)
      .map(([divisionName, data]) => ({
        division: divisionName,
        count: data.count,
        departments: Object.entries(data.departments)
          .map(([deptName, count]) => ({
            name: deptName,
            count
          }))
          .sort((a, b) => b.count - a.count)
      }))
      .sort((a, b) => b.count - a.count);
  };

  // 현재 기준 인력
  const currentStats = calculateHierarchicalStats(null);
  
  // 비교 날짜 기준 인력
  const comparisonStats = calculateHierarchicalStats(comparisonDate);
  
  // 입사예정자
  const scheduledStats = calculateScheduledStats();
  
  // 증감 계산 (본부)
  const getDivisionDiff = (division) => {
    const current = currentStats.find(s => s.division === division)?.count || 0;
    const comparison = comparisonStats.find(s => s.division === division)?.count || 0;
    return current - comparison;
  };
  
  // 증감 계산 (부서)
  const getDepartmentDiff = (division, department) => {
    const currentDept = currentStats.find(s => s.division === division)
      ?.departments.find(d => d.name === department)?.count || 0;
    const comparisonDept = comparisonStats.find(s => s.division === division)
      ?.departments.find(d => d.name === department)?.count || 0;
    return currentDept - comparisonDept;
  };

  return (
    <div className="personnel-management">
      <div className="personnel-header">
        <h1>인력현황 관리</h1>
        
        <div className="header-controls">
          {/* 재직 상태 필터 */}
          <div className="employment-filter">
            <button 
              className={`filter-btn ${employmentFilter === 'all' ? 'active' : ''}`}
              onClick={() => setEmploymentFilter('all')}
            >
              전체
            </button>
            <button 
              className={`filter-btn ${employmentFilter === 'active' ? 'active' : ''}`}
              onClick={() => setEmploymentFilter('active')}
            >
              재직중
            </button>
            <button 
              className={`filter-btn ${employmentFilter === 'resigned' ? 'active' : ''}`}
              onClick={() => setEmploymentFilter('resigned')}
            >
              퇴사자
            </button>
            <button 
              className={`filter-btn ${employmentFilter === 'scheduled' ? 'active' : ''}`}
              onClick={() => setEmploymentFilter('scheduled')}
            >
              입사예정자
            </button>
          </div>

          {/* 일자별 조회 */}
          <div className="date-selector">
            <label>조회 일자:</label>
            <select
              value={selectedDate}
              onChange={(e) => {
                if (e.target.value) {
                  fetchPersonnel(e.target.value);
                } else {
                  fetchPersonnel();
                }
              }}
            >
              <option value="">현재 데이터</option>
              {backupDates.map(date => (
                <option key={date} value={date}>
                  {new Date(date).toLocaleDateString('ko-KR')}
                </option>
              ))}
            </select>
          </div>

          {/* 검색 */}
          <div className="search-box">
            <input
              type="text"
              placeholder="성명, 사번, 부서 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* 버튼 */}
          {!isBackupView && (
            <button onClick={() => openModal('create')} className="btn-primary">
              신규 등록
            </button>
          )}
          <button onClick={handleExcelDownload} className="btn-excel">
            엑셀 다운로드
          </button>
        </div>
      </div>

      {isBackupView && (
        <div className="backup-notice">
          <span>📅 {new Date(selectedDate).toLocaleDateString('ko-KR')} 백업 데이터를 조회 중입니다.</span>
          <button onClick={handleBackToCurrentData} className="btn-secondary">
            현재 데이터로 돌아가기
          </button>
        </div>
      )}

      {/* 본부별/부서별 인력 증감 추이 */}
      {!isBackupView && (
        <div className="department-stats-container">
          <div className="stats-header">
            <h2>본부별/부서별 인력 증감 추이</h2>
            <div className="comparison-date-selector">
              <label>비교 기준일:</label>
              <input
                type="date"
                value={comparisonDate}
                onChange={(e) => setComparisonDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
              <button 
                className="date-preset-btn"
                onClick={() => {
                  const date = new Date();
                  date.setDate(date.getDate() - 7);
                  setComparisonDate(date.toISOString().split('T')[0]);
                }}
              >
                일주일전
              </button>
              <button 
                className="date-preset-btn"
                onClick={() => {
                  const date = new Date();
                  date.setMonth(date.getMonth() - 1);
                  setComparisonDate(date.toISOString().split('T')[0]);
                }}
              >
                한달전
              </button>
            </div>
          </div>
          
          <div className="stats-tables">
            {/* 비교 기준일 인력 현황 */}
            <div className="stats-table-wrapper">
              <h3>📊 {new Date(comparisonDate).toLocaleDateString('ko-KR')} 기준</h3>
              <table className="stats-table hierarchical">
                <thead>
                  <tr>
                    <th>본부 / 부서</th>
                    <th>인원</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonStats.length === 0 ? (
                    <tr>
                      <td colSpan="2" style={{ textAlign: 'center' }}>데이터가 없습니다.</td>
                    </tr>
                  ) : (
                    <>
                      {comparisonStats.map((divisionData) => (
                        <React.Fragment key={divisionData.division}>
                          <tr className="division-row">
                            <td className="division-name"><strong>{divisionData.division}</strong></td>
                            <td className="count"><strong>{divisionData.count}명</strong></td>
                          </tr>
                          {divisionData.departments.map((dept) => (
                            <tr key={`${divisionData.division}-${dept.name}`} className="department-row">
                              <td className="department-name">└ {dept.name}</td>
                              <td className="count">{dept.count}명</td>
                            </tr>
                          ))}
                        </React.Fragment>
                      ))}
                      <tr className="total-row">
                        <td><strong>전체 합계</strong></td>
                        <td className="count"><strong>{comparisonStats.reduce((sum, s) => sum + s.count, 0)}명</strong></td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>

            {/* 현재 인력 현황 및 증감 */}
            <div className="stats-table-wrapper">
              <h3>📊 현재 기준 (증감 표시 및 입사예정자)</h3>
              <table className="stats-table hierarchical">
                <thead>
                  <tr>
                    <th>본부 / 부서</th>
                    <th>인원</th>
                    <th>증감</th>
                    <th>입사예정자</th>
                  </tr>
                </thead>
                <tbody>
                  {currentStats.length === 0 && scheduledStats.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center' }}>데이터가 없습니다.</td>
                    </tr>
                  ) : (
                    <>
                      {/* 모든 본부를 currentStats와 scheduledStats에서 가져오기 */}
                      {[...new Set([
                        ...currentStats.map(s => s.division), 
                        ...scheduledStats.map(s => s.division)
                      ])].sort().map((division) => {
                        const currentDivData = currentStats.find(s => s.division === division);
                        const scheduledDivData = scheduledStats.find(s => s.division === division);
                        const divDiff = getDivisionDiff(division);
                        
                        // 모든 부서를 currentStats와 scheduledStats에서 가져오기
                        const allDepartments = [
                          ...(currentDivData?.departments.map(d => d.name) || []),
                          ...(scheduledDivData?.departments.map(d => d.name) || [])
                        ];
                        const uniqueDepartments = [...new Set(allDepartments)];
                        
                        return (
                          <React.Fragment key={division}>
                            <tr className="division-row">
                              <td className="division-name"><strong>{division}</strong></td>
                              <td className="count"><strong>{currentDivData?.count || 0}명</strong></td>
                              <td className={`diff ${divDiff > 0 ? 'positive' : divDiff < 0 ? 'negative' : 'neutral'}`}>
                                <strong>{divDiff > 0 ? `+${divDiff}` : divDiff === 0 ? '-' : divDiff}</strong>
                              </td>
                              <td className="count scheduled"><strong>{scheduledDivData?.count || 0}명</strong></td>
                            </tr>
                            {uniqueDepartments.map((deptName) => {
                              const currentDept = currentDivData?.departments.find(d => d.name === deptName);
                              const scheduledDept = scheduledDivData?.departments.find(d => d.name === deptName);
                              const deptDiff = getDepartmentDiff(division, deptName);
                              
                              return (
                                <tr key={`${division}-${deptName}`} className="department-row">
                                  <td className="department-name">└ {deptName}</td>
                                  <td className="count">{currentDept?.count || 0}명</td>
                                  <td className={`diff ${deptDiff > 0 ? 'positive' : deptDiff < 0 ? 'negative' : 'neutral'}`}>
                                    {deptDiff > 0 ? `+${deptDiff}` : deptDiff === 0 ? '-' : deptDiff}
                                  </td>
                                  <td className="count scheduled">{scheduledDept?.count || 0}명</td>
                                </tr>
                              );
                            })}
                          </React.Fragment>
                        );
                      })}
                      <tr className="total-row">
                        <td><strong>전체 합계</strong></td>
                        <td className="count"><strong>{currentStats.reduce((sum, s) => sum + s.count, 0)}명</strong></td>
                        <td className={`diff ${(() => {
                          const totalDiff = currentStats.reduce((sum, s) => sum + s.count, 0) - comparisonStats.reduce((sum, s) => sum + s.count, 0);
                          return totalDiff > 0 ? 'positive' : totalDiff < 0 ? 'negative' : 'neutral';
                        })()}`}>
                          <strong>
                            {(() => {
                              const totalDiff = currentStats.reduce((sum, s) => sum + s.count, 0) - comparisonStats.reduce((sum, s) => sum + s.count, 0);
                              return totalDiff > 0 ? `+${totalDiff}` : totalDiff === 0 ? '-' : totalDiff;
                            })()}
                          </strong>
                        </td>
                        <td className="count scheduled"><strong>{scheduledStats.reduce((sum, s) => sum + s.count, 0)}명</strong></td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 인력현황 테이블 */}
      <div className="table-container">
        <table className="personnel-table">
          <thead>
            <tr>
              <th>No</th>
              <th className="sortable" onClick={() => handleSort('division')}>
                본부 {sortConfig.key === 'division' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
              </th>
              <th className="sortable" onClick={() => handleSort('department')}>
                부서 {sortConfig.key === 'department' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
              </th>
              <th className="sortable" onClick={() => handleSort('position')}>
                직책 {sortConfig.key === 'position' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
              </th>
              <th className="sortable" onClick={() => handleSort('employee_number')}>
                사번 {sortConfig.key === 'employee_number' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
              </th>
              <th className="sortable" onClick={() => handleSort('name')}>
                성명 {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
              </th>
              <th className="sortable" onClick={() => handleSort('rank')}>
                직위 {sortConfig.key === 'rank' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
              </th>
              <th className="sortable" onClick={() => handleSort('duties')}>
                담당업무 {sortConfig.key === 'duties' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
              </th>
              <th className="sortable" onClick={() => handleSort('job_function')}>
                직능 {sortConfig.key === 'job_function' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
              </th>
              <th className="sortable" onClick={() => handleSort('is_it_personnel')}>
                IT인력 {sortConfig.key === 'is_it_personnel' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
              </th>
              <th className="sortable" onClick={() => handleSort('is_security_personnel')}>
                보안인력 {sortConfig.key === 'is_security_personnel' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
              </th>
              <th className="sortable" onClick={() => handleSort('join_date')}>
                입사일 {sortConfig.key === 'join_date' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
              </th>
              <th className="sortable" onClick={() => handleSort('resignation_date')}>
                퇴사일 {sortConfig.key === 'resignation_date' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
              </th>
              <th className="sortable" onClick={() => handleSort('total_service_years')}>
                경력(년) {sortConfig.key === 'total_service_years' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
              </th>
              {!isBackupView && <th>관리</th>}
            </tr>
          </thead>
          <tbody>
            {filteredPersonnel.length === 0 ? (
              <tr>
                <td colSpan={isBackupView ? "14" : "15"} style={{ textAlign: 'center' }}>
                  데이터가 없습니다.
                </td>
              </tr>
            ) : (
              filteredPersonnel.map((person, index) => (
                <tr key={person.id} onClick={() => openDetailModal(person)} style={{ cursor: 'pointer' }} title="클릭하여 상세보기">
                  <td>{index + 1}</td>
                  <td>{person.division || '-'}</td>
                  <td>{person.department || '-'}</td>
                  <td>{person.position || '-'}</td>
                  <td>{person.employee_number || '-'}</td>
                  <td>{person.name}</td>
                  <td>{person.rank || '-'}</td>
                  <td className="duties-cell">{person.duties || '-'}</td>
                  <td>{person.job_function || '-'}</td>
                  <td>{person.is_it_personnel ? 'O' : 'X'}</td>
                  <td>{person.is_security_personnel ? 'O' : 'X'}</td>
                  <td>{person.join_date || '-'}</td>
                  <td>{person.resignation_date || '-'}</td>
                  <td>{person.total_service_years || '-'}</td>
                  {!isBackupView && (
                    <td onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => openModal('edit', person)}
                        className="btn-edit"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDelete(person.id)}
                        className="btn-delete"
                      >
                        삭제
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="personnel-summary">
        총 <strong>{filteredPersonnel.length}</strong>명
      </div>

      {/* 등록/수정 모달 */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{modalMode === 'create' ? '인력 정보 등록' : '인력 정보 수정'}</h2>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="personnel-form">
              {/* 기본 정보 */}
              <div className="form-section">
                <h3>기본 정보</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>본부</label>
                    <input
                      type="text"
                      name="division"
                      value={formData.division}
                      onChange={handleInputChange}
                      list="division-list"
                      autoComplete="off"
                    />
                    <datalist id="division-list">
                      {suggestions.divisions.map((item, index) => (
                        <option key={index} value={item} />
                      ))}
                    </datalist>
                  </div>
                  <div className="form-group">
                    <label>부서</label>
                    <input
                      type="text"
                      name="department"
                      value={formData.department}
                      onChange={handleInputChange}
                      list="department-list"
                      autoComplete="off"
                    />
                    <datalist id="department-list">
                      {suggestions.departments.map((item, index) => (
                        <option key={index} value={item} />
                      ))}
                    </datalist>
                  </div>
                  <div className="form-group">
                    <label>직책</label>
                    <input
                      type="text"
                      name="position"
                      value={formData.position}
                      onChange={handleInputChange}
                      list="position-list"
                      autoComplete="off"
                    />
                    <datalist id="position-list">
                      {suggestions.positions.map((item, index) => (
                        <option key={index} value={item} />
                      ))}
                    </datalist>
                  </div>
                  <div className="form-group">
                    <label>사번</label>
                    <input
                      type="text"
                      name="employee_number"
                      value={formData.employee_number}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>성명 <span className="required">*</span></label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>직위</label>
                    <input
                      type="text"
                      name="rank"
                      value={formData.rank}
                      onChange={handleInputChange}
                      list="rank-list"
                      autoComplete="off"
                    />
                    <datalist id="rank-list">
                      {suggestions.ranks.map((item, index) => (
                        <option key={index} value={item} />
                      ))}
                    </datalist>
                  </div>
                  <div className="form-group full-width">
                    <label>담당업무</label>
                    <div className="duties-input-wrapper">
                      <input
                        type="text"
                        name="duties"
                        value={formData.duties}
                        onChange={handleInputChange}
                        list="duties-list"
                        autoComplete="off"
                        placeholder="담당업무를 입력하세요"
                      />
                      <datalist id="duties-list">
                        {suggestions.duties.map((item, index) => (
                          <option key={index} value={item} />
                        ))}
                      </datalist>
                    </div>
                    {suggestions.duties.length > 0 && (
                      <small className="suggestion-hint" style={{ color: '#666', fontSize: '12px', marginTop: '5px', display: 'block' }}>
                        💡 기존에 입력된 담당업무가 자동으로 추천됩니다
                      </small>
                    )}
                  </div>
                </div>
              </div>

              {/* 직무 정보 */}
              <div className="form-section">
                <h3>직무 정보</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>직능</label>
                    <select
                      name="job_function"
                      value={formData.job_function}
                      onChange={handleInputChange}
                    >
                      <option value="">선택</option>
                      <option value="AP">AP</option>
                      <option value="SP">SP</option>
                      <option value="DBA">DBA</option>
                      <option value="OP">OP</option>
                      <option value="통신망운영자">통신망운영자</option>
                      <option value="행정지원요원">행정지원요원</option>
                      <option value="기타">기타</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>한국은행직능</label>
                    <select
                      name="bok_job_function"
                      value={formData.bok_job_function}
                      onChange={handleInputChange}
                    >
                      <option value="">선택</option>
                      <option value="관리자">관리자</option>
                      <option value="시스템기획및설계">시스템기획및설계</option>
                      <option value="시스템개발">시스템개발</option>
                      <option value="시스템운영">시스템운영</option>
                      <option value="정보보호관리">정보보호관리</option>
                      <option value="행정지원">행정지원</option>
                      <option value="기타">기타</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>직종구분</label>
                    <select
                      name="job_category"
                      value={formData.job_category}
                      onChange={handleInputChange}
                    >
                      <option value="">선택</option>
                      <option value="일반직">일반직</option>
                      <option value="연봉직">연봉직</option>
                      <option value="연봉제정규직">연봉제정규직</option>
                      <option value="촉탁">촉탁</option>
                      <option value="외주">외주</option>
                    </select>
                  </div>
                  <div className="form-group checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="is_it_personnel"
                        checked={formData.is_it_personnel}
                        onChange={handleInputChange}
                      />
                      <span>정보기술인력</span>
                    </label>
                  </div>
                  <div className="form-group checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="is_security_personnel"
                        checked={formData.is_security_personnel}
                        onChange={handleInputChange}
                      />
                      <span>정보보호인력</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* 개인 정보 */}
              <div className="form-section">
                <h3>개인 정보</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>생년월일</label>
                    <input
                      type="date"
                      name="birth_date"
                      value={formData.birth_date}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>성별</label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                    >
                      <option value="">선택</option>
                      <option value="남">남</option>
                      <option value="여">여</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>나이 (자동계산)</label>
                    <input
                      type="number"
                      name="age"
                      value={formData.age}
                      readOnly
                      style={{ backgroundColor: '#f0f0f0' }}
                    />
                  </div>
                </div>
              </div>

              {/* 입사 및 경력 정보 */}
              <div className="form-section">
                <h3>입사 및 경력 정보</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>그룹입사일</label>
                    <input
                      type="date"
                      name="group_join_date"
                      value={formData.group_join_date}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>입사일</label>
                    <input
                      type="date"
                      name="join_date"
                      value={formData.join_date}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>퇴사일</label>
                    <input
                      type="date"
                      name="resignation_date"
                      value={formData.resignation_date}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>총재직기간(년) (자동계산)</label>
                    <input
                      type="number"
                      step="0.01"
                      name="total_service_years"
                      value={formData.total_service_years}
                      readOnly
                      style={{ backgroundColor: '#f0f0f0' }}
                    />
                  </div>
                  <div className="form-group">
                    <label>정산경력기준일</label>
                    <input
                      type="date"
                      name="career_base_date"
                      value={formData.career_base_date}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>전산경력(년) (자동계산)</label>
                    <input
                      type="number"
                      step="0.01"
                      name="it_career_years"
                      value={formData.it_career_years}
                      readOnly
                      style={{ backgroundColor: '#f0f0f0' }}
                    />
                  </div>
                  <div className="form-group">
                    <label>현업무발령일</label>
                    <input
                      type="date"
                      name="current_duty_date"
                      value={formData.current_duty_date}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>현업무기간(년) (자동계산)</label>
                    <input
                      type="number"
                      step="0.01"
                      name="current_duty_period"
                      value={formData.current_duty_period}
                      readOnly
                      style={{ backgroundColor: '#f0f0f0' }}
                    />
                  </div>
                  <div className="form-group">
                    <label>직전소속</label>
                    <input
                      type="text"
                      name="previous_department"
                      value={formData.previous_department}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>

              {/* 학력 및 자격증 */}
              <div className="form-section">
                <h3>학력 및 자격증</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>전공</label>
                    <input
                      type="text"
                      name="major"
                      value={formData.major}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="is_it_major"
                        checked={formData.is_it_major}
                        onChange={handleInputChange}
                      />
                      <span>전산전공여부</span>
                    </label>
                  </div>
                  <div className="form-group">
                    <label>전산자격증1</label>
                    <input
                      type="text"
                      name="it_certificate_1"
                      value={formData.it_certificate_1}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>전산자격증2</label>
                    <input
                      type="text"
                      name="it_certificate_2"
                      value={formData.it_certificate_2}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>전산자격증3</label>
                    <input
                      type="text"
                      name="it_certificate_3"
                      value={formData.it_certificate_3}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>전산자격증4</label>
                    <input
                      type="text"
                      name="it_certificate_4"
                      value={formData.it_certificate_4}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>

              {/* 비고 */}
              <div className="form-section">
                <h3>비고</h3>
                <div className="form-group full-width">
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows="3"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={closeModal} className="btn-cancel">
                  취소
                </button>
                <button type="submit" className="btn-submit">
                  {modalMode === 'create' ? '등록' : '수정'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 상세보기 모달 */}
      {showDetailModal && currentPersonnel && (
        <div className="modal-overlay" onClick={closeDetailModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>인력현황 상세보기</h2>
              <button className="modal-close" onClick={closeDetailModal}>&times;</button>
            </div>
            
            <div className="personnel-form">
              {/* 기본 정보 */}
              <div className="form-section">
                <h3>기본 정보</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>본부</label>
                    <input type="text" value={currentPersonnel.division || ''} readOnly style={{ backgroundColor: '#f0f0f0' }} />
                  </div>
                  <div className="form-group">
                    <label>부서</label>
                    <input type="text" value={currentPersonnel.department || ''} readOnly style={{ backgroundColor: '#f0f0f0' }} />
                  </div>
                  <div className="form-group">
                    <label>직책</label>
                    <input type="text" value={currentPersonnel.position || ''} readOnly style={{ backgroundColor: '#f0f0f0' }} />
                  </div>
                  <div className="form-group">
                    <label>사번</label>
                    <input type="text" value={currentPersonnel.employee_number || ''} readOnly style={{ backgroundColor: '#f0f0f0' }} />
                  </div>
                  <div className="form-group">
                    <label>성명</label>
                    <input type="text" value={currentPersonnel.name || ''} readOnly style={{ backgroundColor: '#f0f0f0' }} />
                  </div>
                  <div className="form-group">
                    <label>직위</label>
                    <input type="text" value={currentPersonnel.rank || ''} readOnly style={{ backgroundColor: '#f0f0f0' }} />
                  </div>
                  <div className="form-group full-width">
                    <label>담당업무</label>
                    <textarea value={currentPersonnel.duties || ''} rows="3" readOnly style={{ backgroundColor: '#f0f0f0' }} />
                  </div>
                </div>
              </div>

              {/* 직무 정보 */}
              <div className="form-section">
                <h3>직무 정보</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>직능</label>
                    <input type="text" value={currentPersonnel.job_function || ''} readOnly style={{ backgroundColor: '#f0f0f0' }} />
                  </div>
                  <div className="form-group">
                    <label>한국은행직능</label>
                    <input type="text" value={currentPersonnel.bok_job_function || ''} readOnly style={{ backgroundColor: '#f0f0f0' }} />
                  </div>
                  <div className="form-group">
                    <label>직종구분</label>
                    <input type="text" value={currentPersonnel.job_category || ''} readOnly style={{ backgroundColor: '#f0f0f0' }} />
                  </div>
                  <div className="form-group checkbox-group">
                    <label className="checkbox-label">
                      <input type="checkbox" checked={currentPersonnel.is_it_personnel || false} disabled />
                      <span>정보기술인력</span>
                    </label>
                  </div>
                  <div className="form-group checkbox-group">
                    <label className="checkbox-label">
                      <input type="checkbox" checked={currentPersonnel.is_security_personnel || false} disabled />
                      <span>정보보호인력</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* 개인 정보 */}
              <div className="form-section">
                <h3>개인 정보</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>생년월일</label>
                    <input type="text" value={currentPersonnel.birth_date || ''} readOnly style={{ backgroundColor: '#f0f0f0' }} />
                  </div>
                  <div className="form-group">
                    <label>성별</label>
                    <input type="text" value={currentPersonnel.gender || ''} readOnly style={{ backgroundColor: '#f0f0f0' }} />
                  </div>
                  <div className="form-group">
                    <label>나이</label>
                    <input type="text" value={currentPersonnel.age || ''} readOnly style={{ backgroundColor: '#f0f0f0' }} />
                  </div>
                </div>
              </div>

              {/* 입사 및 경력 정보 */}
              <div className="form-section">
                <h3>입사 및 경력 정보</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>그룹입사일</label>
                    <input type="text" value={currentPersonnel.group_join_date || ''} readOnly style={{ backgroundColor: '#f0f0f0' }} />
                  </div>
                  <div className="form-group">
                    <label>입사일</label>
                    <input type="text" value={currentPersonnel.join_date || ''} readOnly style={{ backgroundColor: '#f0f0f0' }} />
                  </div>
                  <div className="form-group">
                    <label>퇴사일</label>
                    <input type="text" value={currentPersonnel.resignation_date || ''} readOnly style={{ backgroundColor: '#f0f0f0' }} />
                  </div>
                  <div className="form-group">
                    <label>총재직기간(년)</label>
                    <input type="text" value={currentPersonnel.total_service_years || ''} readOnly style={{ backgroundColor: '#f0f0f0' }} />
                  </div>
                  <div className="form-group">
                    <label>전산경력기준일</label>
                    <input type="text" value={currentPersonnel.career_base_date || ''} readOnly style={{ backgroundColor: '#f0f0f0' }} />
                  </div>
                  <div className="form-group">
                    <label>전산경력(년)</label>
                    <input type="text" value={currentPersonnel.it_career_years || ''} readOnly style={{ backgroundColor: '#f0f0f0' }} />
                  </div>
                  <div className="form-group">
                    <label>현업무발령일</label>
                    <input type="text" value={currentPersonnel.current_duty_date || ''} readOnly style={{ backgroundColor: '#f0f0f0' }} />
                  </div>
                  <div className="form-group">
                    <label>현업무기간(년)</label>
                    <input type="text" value={currentPersonnel.current_duty_period || ''} readOnly style={{ backgroundColor: '#f0f0f0' }} />
                  </div>
                  <div className="form-group">
                    <label>직전소속</label>
                    <input type="text" value={currentPersonnel.previous_department || ''} readOnly style={{ backgroundColor: '#f0f0f0' }} />
                  </div>
                </div>
              </div>

              {/* 학력 및 자격증 */}
              <div className="form-section">
                <h3>학력 및 자격증</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>전공</label>
                    <input type="text" value={currentPersonnel.major || ''} readOnly style={{ backgroundColor: '#f0f0f0' }} />
                  </div>
                  <div className="form-group checkbox-group">
                    <label className="checkbox-label">
                      <input type="checkbox" checked={currentPersonnel.is_it_major || false} disabled />
                      <span>전산전공여부</span>
                    </label>
                  </div>
                  <div className="form-group">
                    <label>전산자격증1</label>
                    <input type="text" value={currentPersonnel.it_certificate_1 || ''} readOnly style={{ backgroundColor: '#f0f0f0' }} />
                  </div>
                  <div className="form-group">
                    <label>전산자격증2</label>
                    <input type="text" value={currentPersonnel.it_certificate_2 || ''} readOnly style={{ backgroundColor: '#f0f0f0' }} />
                  </div>
                  <div className="form-group">
                    <label>전산자격증3</label>
                    <input type="text" value={currentPersonnel.it_certificate_3 || ''} readOnly style={{ backgroundColor: '#f0f0f0' }} />
                  </div>
                  <div className="form-group">
                    <label>전산자격증4</label>
                    <input type="text" value={currentPersonnel.it_certificate_4 || ''} readOnly style={{ backgroundColor: '#f0f0f0' }} />
                  </div>
                </div>
              </div>

              {/* 비고 */}
              <div className="form-section">
                <h3>기타</h3>
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label>비고</label>
                    <textarea value={currentPersonnel.notes || ''} rows="4" readOnly style={{ backgroundColor: '#f0f0f0' }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" onClick={closeDetailModal} className="btn-cancel">닫기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PersonnelManagement;

