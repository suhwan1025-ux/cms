import React, { useState, useEffect } from 'react';
import './ExternalPersonnelManagement.css';
import { getApiUrl } from '../config/api';

const API_BASE_URL = getApiUrl();

function ExternalPersonnelManagement() {
  const [personnel, setPersonnel] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [contractFilter, setContractFilter] = useState('all'); // 'all', 'active', 'ended', 'scheduled'
  
  // 인력 증감 추이 비교 날짜
  const [comparisonDate, setComparisonDate] = useState(() => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return weekAgo.toISOString().split('T')[0];
  });

  // 수정 모달 상태
  const [showModal, setShowModal] = useState(false);
  const [currentPerson, setCurrentPerson] = useState(null);
  const [formData, setFormData] = useState({
    employee_number: '',
    rank: '',
    work_type: '',
    is_onsite: true,
    work_load: ''
  });

  // 외주인력 데이터 조회
  const fetchPersonnel = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/external-personnel`);
      if (response.ok) {
        const data = await response.json();
        setPersonnel(data);
      } else {
        console.error('Failed to fetch external personnel');
      }
    } catch (error) {
      console.error('Error fetching external personnel:', error);
    }
  };

  useEffect(() => {
    fetchPersonnel();
  }, []);

  // 정렬 처리
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

    // 계약 상태 필터
    if (contractFilter === 'active') {
      // 재직중: 계약 시작일 ≤ 오늘 ≤ 계약 종료일
      filtered = filtered.filter(p => {
        const startDate = p.contract_start_date ? new Date(p.contract_start_date) : null;
        const endDate = p.contract_end_date ? new Date(p.contract_end_date) : null;
        return startDate && endDate && startDate <= today && today <= endDate;
      });
    } else if (contractFilter === 'ended') {
      // 종료: 계약 종료일 < 오늘
      filtered = filtered.filter(p => {
        const endDate = p.contract_end_date ? new Date(p.contract_end_date) : null;
        return endDate && endDate < today;
      });
    } else if (contractFilter === 'scheduled') {
      // 예정: 계약 시작일 > 오늘
      filtered = filtered.filter(p => {
        const startDate = p.contract_start_date ? new Date(p.contract_start_date) : null;
        return startDate && startDate > today;
      });
    }

    // 검색 필터
    if (searchTerm.trim()) {
      filtered = filtered.filter(p => 
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.employee_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.work_type?.toLowerCase().includes(searchTerm.toLowerCase())
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

    return filtered;
  };

  const filteredPersonnel = filterPersonnel();

  // 본부별/부서별 계층 구조로 인력 현황 계산
  const calculateHierarchicalStats = (targetDate = null) => {
    const departmentStats = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    personnel.forEach(person => {
      const startDate = person.contract_start_date ? new Date(person.contract_start_date) : null;
      const endDate = person.contract_end_date ? new Date(person.contract_end_date) : null;
      
      if (targetDate) {
        // 비교 날짜가 있는 경우: 해당 날짜 시점에 재직 중이었는지 확인
        const compareDate = new Date(targetDate);
        
        // 계약 시작일이 비교 날짜보다 나중이면 제외
        if (!startDate || startDate > compareDate) {
          return;
        }
        
        // 계약 종료일이 비교 날짜 이전이면 제외 (이미 종료한 상태)
        if (endDate && endDate < compareDate) {
          return;
        }
      } else {
        // 현재 기준: 계약 종료된 사람 제외 (재직자만)
        if (endDate && endDate < today) return;
        
        // 계약 시작일이 미래인 경우도 제외 (아직 시작 전)
        if (!startDate || startDate > today) return;
      }
      
      const department = person.department || '미지정';
      
      if (!departmentStats[department]) {
        departmentStats[department] = 0;
      }
      
      departmentStats[department]++;
    });
    
    // 정렬된 배열로 변환
    return Object.entries(departmentStats)
      .map(([dept, count]) => ({
        department: dept,
        count
      }))
      .sort((a, b) => b.count - a.count);
  };

  // 계약 예정자 계산
  const calculateScheduledStats = () => {
    const departmentStats = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    personnel.forEach(person => {
      const startDate = person.contract_start_date ? new Date(person.contract_start_date) : null;
      const endDate = person.contract_end_date ? new Date(person.contract_end_date) : null;
      
      // 계약예정자: 종료일 없거나 미래이고, 시작일이 미래
      if (endDate && endDate < today) return;
      if (!startDate || startDate <= today) return;
      
      const department = person.department || '미지정';
      
      if (!departmentStats[department]) {
        departmentStats[department] = 0;
      }
      
      departmentStats[department]++;
    });
    
    // 정렬된 배열로 변환
    return Object.entries(departmentStats)
      .map(([dept, count]) => ({
        department: dept,
        count
      }))
      .sort((a, b) => b.count - a.count);
  };

  // 현재 기준 인력
  const currentStats = calculateHierarchicalStats(null);
  
  // 비교 날짜 기준 인력
  const comparisonStats = calculateHierarchicalStats(comparisonDate);
  
  // 계약예정자
  const scheduledStats = calculateScheduledStats();
  
  // 증감 계산 (부서)
  const getDepartmentDiff = (department) => {
    const current = currentStats.find(s => s.department === department)?.count || 0;
    const comparison = comparisonStats.find(s => s.department === department)?.count || 0;
    return current - comparison;
  };

  // 기술등급 표시
  const getSkillLevelKorean = (level) => {
    const map = {
      'senior': '고급',
      'middle': '중급',
      'junior': '초급'
    };
    return map[level] || level;
  };

  // 엑셀 다운로드
  const handleExcelDownload = () => {
    alert('엑셀 다운로드 기능은 추후 구현 예정입니다.');
  };

  // 모달 열기
  const openModal = (person) => {
    setCurrentPerson(person);
    setFormData({
      employee_number: person.employee_number || '',
      rank: person.rank || '',
      work_type: person.work_type || '',
      is_onsite: person.is_onsite !== null ? person.is_onsite : true,
      work_load: person.work_load || ''
    });
    setShowModal(true);
  };

  // 모달 닫기
  const closeModal = () => {
    setShowModal(false);
    setCurrentPerson(null);
    setFormData({
      employee_number: '',
      rank: '',
      work_type: '',
      is_onsite: true,
      work_load: ''
    });
  };

  // 입력 변경 처리
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // 저장 처리
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`${API_BASE_URL}/api/external-personnel/${currentPerson.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert('수정되었습니다.');
        closeModal();
        fetchPersonnel(); // 목록 새로고침
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || '저장 실패');
      }
    } catch (error) {
      console.error('저장 오류:', error);
      alert(`저장 오류: ${error.message}`);
    }
  };

  return (
    <div className="external-personnel-management">
      <div className="personnel-header">
        <h1>외주인력 관리</h1>
        
        <div className="header-controls">
          {/* 계약 상태 필터 */}
          <div className="contract-filter">
            <button 
              className={`filter-btn ${contractFilter === 'all' ? 'active' : ''}`}
              onClick={() => setContractFilter('all')}
            >
              전체
            </button>
            <button 
              className={`filter-btn ${contractFilter === 'active' ? 'active' : ''}`}
              onClick={() => setContractFilter('active')}
            >
              계약중
            </button>
            <button 
              className={`filter-btn ${contractFilter === 'ended' ? 'active' : ''}`}
              onClick={() => setContractFilter('ended')}
            >
              종료
            </button>
            <button 
              className={`filter-btn ${contractFilter === 'scheduled' ? 'active' : ''}`}
              onClick={() => setContractFilter('scheduled')}
            >
              계약예정
            </button>
          </div>

          {/* 검색 */}
          <div className="search-box">
            <input
              type="text"
              placeholder="성명, 사번, 부서, 업무유형 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* 엑셀 다운로드 */}
          <button onClick={handleExcelDownload} className="btn-excel">
            📊 엑셀 다운로드
          </button>
        </div>
      </div>

      {/* 부서별 인력 증감 추이 */}
      <div className="department-stats-container">
        <div className="stats-header">
          <h2>부서별 인력 증감 추이</h2>
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
            <table className="stats-table">
              <thead>
                <tr>
                  <th>부서</th>
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
                    {comparisonStats.map((stat) => (
                      <tr key={stat.department}>
                        <td>{stat.department}</td>
                        <td className="count">{stat.count}명</td>
                      </tr>
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
            <h3>📊 현재 기준 (증감 표시 및 계약예정자)</h3>
            <table className="stats-table">
              <thead>
                <tr>
                  <th>부서</th>
                  <th>인원</th>
                  <th>증감</th>
                  <th>계약예정자</th>
                </tr>
              </thead>
              <tbody>
                {currentStats.length === 0 && scheduledStats.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center' }}>데이터가 없습니다.</td>
                  </tr>
                ) : (
                  <>
                    {[...new Set([
                      ...currentStats.map(s => s.department), 
                      ...scheduledStats.map(s => s.department)
                    ])].sort().map((department) => {
                      const currentDept = currentStats.find(s => s.department === department);
                      const scheduledDept = scheduledStats.find(s => s.department === department);
                      const diff = getDepartmentDiff(department);
                      
                      return (
                        <tr key={department}>
                          <td>{department}</td>
                          <td className="count">{currentDept?.count || 0}명</td>
                          <td className={`diff ${diff > 0 ? 'positive' : diff < 0 ? 'negative' : 'neutral'}`}>
                            {diff > 0 ? `+${diff}` : diff === 0 ? '-' : diff}
                          </td>
                          <td className="count scheduled">{scheduledDept?.count || 0}명</td>
                        </tr>
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

      {/* 외주인력 목록 테이블 */}
      <div className="personnel-list">
        <table className="personnel-table">
          <thead>
            <tr>
              <th>No</th>
              <th className="sortable" onClick={() => handleSort('employee_number')}>
                사번 {sortConfig.key === 'employee_number' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
              </th>
              <th className="sortable" onClick={() => handleSort('name')}>
                성명 {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
              </th>
              <th className="sortable" onClick={() => handleSort('rank')}>
                직위 {sortConfig.key === 'rank' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
              </th>
              <th className="sortable" onClick={() => handleSort('item')}>
                업무 {sortConfig.key === 'item' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
              </th>
              <th className="sortable" onClick={() => handleSort('contract_start_date')}>
                계약시작일 {sortConfig.key === 'contract_start_date' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
              </th>
              <th className="sortable" onClick={() => handleSort('contract_end_date')}>
                계약종료일 {sortConfig.key === 'contract_end_date' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
              </th>
              <th className="sortable" onClick={() => handleSort('skill_level')}>
                기술등급 {sortConfig.key === 'skill_level' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
              </th>
              <th className="sortable" onClick={() => handleSort('department')}>
                협업팀 {sortConfig.key === 'department' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
              </th>
              <th className="sortable" onClick={() => handleSort('work_type')}>
                업무유형 {sortConfig.key === 'work_type' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
              </th>
              <th className="sortable" onClick={() => handleSort('is_onsite')}>
                상주여부 {sortConfig.key === 'is_onsite' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
              </th>
              <th className="sortable" onClick={() => handleSort('work_load')}>
                업무척도확인 {sortConfig.key === 'work_load' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
              </th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {filteredPersonnel.length === 0 ? (
              <tr>
                <td colSpan="13" style={{ textAlign: 'center' }}>
                  데이터가 없습니다.
                </td>
              </tr>
            ) : (
              filteredPersonnel.map((person, index) => (
                <tr key={person.id}>
                  <td>{index + 1}</td>
                  <td>{person.employee_number || '-'}</td>
                  <td>{person.name || '-'}</td>
                  <td>{person.rank || '-'}</td>
                  <td className="duties-cell">{person.item || '-'}</td>
                  <td>{person.contract_start_date || '-'}</td>
                  <td>{person.contract_end_date || '-'}</td>
                  <td>{getSkillLevelKorean(person.skill_level)}</td>
                  <td>{person.department || '-'}</td>
                  <td>{person.work_type || '-'}</td>
                  <td>{person.is_onsite ? 'O' : 'X'}</td>
                  <td>{person.work_load || '-'}</td>
                  <td>
                    <button
                      onClick={() => openModal(person)}
                      className="btn-edit"
                    >
                      수정
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="personnel-summary">
        총 <strong>{filteredPersonnel.length}</strong>명
      </div>

      {/* 수정 모달 */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>외주인력 관리 정보 수정</h2>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-section">
                  <h3>기본 정보 (읽기 전용)</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label>성명</label>
                      <input type="text" value={currentPerson?.name || '-'} readOnly />
                    </div>
                    <div className="form-group">
                      <label>업무</label>
                      <input type="text" value={currentPerson?.item || '-'} readOnly />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>기술등급</label>
                      <input type="text" value={getSkillLevelKorean(currentPerson?.skill_level)} readOnly />
                    </div>
                    <div className="form-group">
                      <label>협업팀</label>
                      <input type="text" value={currentPerson?.department || '-'} readOnly />
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h3>관리 정보 (수정 가능)</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label>사번</label>
                      <input
                        type="text"
                        name="employee_number"
                        value={formData.employee_number}
                        onChange={handleInputChange}
                        placeholder="사번 입력"
                      />
                    </div>
                    <div className="form-group">
                      <label>직위</label>
                      <input
                        type="text"
                        name="rank"
                        value={formData.rank}
                        onChange={handleInputChange}
                        placeholder="직위 입력"
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>업무유형</label>
                      <select
                        name="work_type"
                        value={formData.work_type}
                        onChange={handleInputChange}
                      >
                        <option value="">선택</option>
                        <option value="개발">개발</option>
                        <option value="운영">운영</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>업무척도확인</label>
                      <input
                        type="text"
                        name="work_load"
                        value={formData.work_load}
                        onChange={handleInputChange}
                        placeholder="업무척도확인 입력"
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>
                        <input
                          type="checkbox"
                          name="is_onsite"
                          checked={formData.is_onsite}
                          onChange={handleInputChange}
                        />
                        상주여부
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="modal-footer">
                <button type="button" onClick={closeModal} className="btn-secondary">
                  취소
                </button>
                <button type="submit" className="btn-primary">
                  저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ExternalPersonnelManagement;

