import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './PersonnelManagement.css';
import { getApiUrl } from '../config/api';

const API_BASE_URL = getApiUrl();

function PersonnelManagement() {
  const navigate = useNavigate();
  const [personnel, setPersonnel] = useState([]);
  const [filteredPersonnel, setFilteredPersonnel] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [currentPersonnel, setCurrentPersonnel] = useState(null);
  
  // 일자별 조회 상태
  const [selectedDate, setSelectedDate] = useState('');
  const [isBackupView, setIsBackupView] = useState(false);
  
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
  
  // 엑셀 업로드 상태
  const [isUploading, setIsUploading] = useState(false);

  // DB 동기화 상태
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncResult, setSyncResult] = useState(null); // { added: [], deleted: [] }

  useEffect(() => {
    fetchPersonnel();
  }, []);

  useEffect(() => {
    filterPersonnel();
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
  
  // 엑셀 템플릿 다운로드
  const handleDownloadTemplate = () => {
    // 엑셀 템플릿 데이터 (샘플 1개 포함)
    const templateData = [
      {
        '본부': '예시본부',
        '부서': '예시부서',
        '직책': '팀장',
        '사번': 'EMP001',
        '성명': '홍길동',
        '직위': '부장',
        '담당업무': '인사관리',
        '직능': 'IT',
        '한국은행직능': 'IT전문가',
        '직종구분': '정규직',
        '정보기술인력': 'O',
        '정보보호인력': 'X',
        '생년월일': '1980-01-01',
        '성별': '남',
        '나이': '44',
        '그룹입사일': '2000-01-01',
        '입사일': '2010-01-01',
        '퇴사일': '',
        '총재직기간(년)': '14',
        '정산경력기준일': '2010-01-01',
        '전산경력': '10',
        '현업무발령일': '2020-01-01',
        '현업무기간': '4',
        '직전소속': '이전부서',
        '전공': '컴퓨터공학',
        '전산전공여부': 'O',
        '전산자격증1': '정보처리기사',
        '전산자격증2': '정보보안기사',
        '전산자격증3': '',
        '전산자격증4': '',
        '비고': '예시 데이터입니다. 이 행을 삭제하고 실제 데이터를 입력하세요.'
      }
    ];
    
    // xlsx 라이브러리 동적 import
    import('xlsx').then((XLSX) => {
      const worksheet = XLSX.utils.json_to_sheet(templateData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, '인력현황');
      
      // 파일 다운로드
      XLSX.writeFile(workbook, '인력현황_업로드_템플릿.xlsx');
    }).catch(error => {
      console.error('xlsx 로드 오류:', error);
      alert('템플릿 다운로드 중 오류가 발생했습니다.');
    });
  };
  
  // 엑셀 업로드 핸들러
  const handleExcelUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    // 파일 확장자 검증
    const allowedExtensions = ['.xlsx', '.xls'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!allowedExtensions.includes(fileExtension)) {
      alert('엑셀 파일(.xlsx, .xls)만 업로드 가능합니다.');
      event.target.value = '';
      return;
    }
    
    // 파일 크기 검증 (10MB 제한)
    if (file.size > 10 * 1024 * 1024) {
      alert('파일 크기는 10MB 이하여야 합니다.');
      event.target.value = '';
      return;
    }
    
    // 확인 메시지
    if (!window.confirm(`${file.name} 파일을 업로드하시겠습니까?\n\n엑셀 파일의 데이터가 DB에 등록됩니다.`)) {
      event.target.value = '';
      return;
    }
    
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`${API_BASE_URL}/api/personnel/import/excel`, {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (response.ok) {
        alert(`✅ ${result.message}`);
        // 목록 새로고침
        await fetchPersonnel();
      } else {
        throw new Error(result.error || result.details || '업로드 실패');
      }
    } catch (error) {
      console.error('엑셀 업로드 오류:', error);
      alert(`❌ 엑셀 업로드 중 오류가 발생했습니다.\n\n${error.message}`);
    } finally {
      setIsUploading(false);
      // 파일 input 초기화
      event.target.value = '';
    }
  };

  // DB 동기화 체크 핸들러
  const handleSyncCheck = async () => {
    setShowSyncModal(true);
    setSyncLoading(true);
    setSyncResult(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/personnel/sync-check`);
      const data = await response.json();
      
      if (response.ok) {
        setSyncResult(data);
      } else {
        throw new Error(data.error || '동기화 체크 실패');
      }
    } catch (error) {
      console.error('동기화 체크 오류:', error);
      alert(`동기화 체크 중 오류가 발생했습니다: ${error.message}`);
      setShowSyncModal(false);
    } finally {
      setSyncLoading(false);
    }
  };

  // 날짜 선택 핸들러
  const handleDateChange = (e) => {
    const date = e.target.value;
    setSelectedDate(date);
    if (date) {
      fetchPersonnel(date);
      setIsBackupView(true);
    } else {
      fetchPersonnel();
      setIsBackupView(false);
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
            <input
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              max={new Date().toISOString().split('T')[0]}
              placeholder="날짜를 선택하세요"
              style={{
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            />
            {selectedDate && (
              <button
                onClick={() => {
                  setSelectedDate('');
                  fetchPersonnel();
                  setIsBackupView(false);
                }}
                style={{
                  marginLeft: '8px',
                  padding: '8px 12px',
                  background: '#f0f0f0',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                초기화
              </button>
            )}
            
            {/* DB 조회 버튼 */}
            <button
              onClick={handleSyncCheck}
              style={{
                marginLeft: '12px',
                padding: '8px 12px',
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>🔄</span> DB 조회
            </button>
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
            <>
              <button onClick={() => navigate('/personnel/register')} className="btn-primary">
                신규 등록
              </button>
              <button 
                onClick={handleDownloadTemplate} 
                className="btn-template"
                style={{
                  backgroundColor: '#17a2b8',
                  color: 'white',
                  padding: '10px 20px',
                  borderRadius: '4px',
                  border: 'none',
                  fontWeight: '500',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                📋 템플릿 다운로드
              </button>
              <label 
                htmlFor="excel-upload" 
                className="btn-excel-upload"
                style={{
                  backgroundColor: isUploading ? '#ccc' : '#28a745',
                  cursor: isUploading ? 'not-allowed' : 'pointer',
                  opacity: isUploading ? 0.6 : 1,
                  display: 'inline-block',
                  padding: '10px 20px',
                  borderRadius: '4px',
                  color: 'white',
                  fontWeight: '500',
                  fontSize: '14px',
                  border: 'none'
                }}
              >
                {isUploading ? '⏳ 업로드 중...' : '📤 엑셀 업로드'}
              </label>
              <input
                id="excel-upload"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleExcelUpload}
                disabled={isUploading}
                style={{ display: 'none' }}
              />
            </>
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
                        onClick={() => navigate('/personnel/register', { state: { person } })}
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

