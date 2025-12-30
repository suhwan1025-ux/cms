import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './PersonnelRegister.css';
import { getApiUrl } from '../config/api';

const API_BASE_URL = getApiUrl();

function PersonnelRegister() {
  const navigate = useNavigate();
  const location = useLocation();
  const editPersonnel = location.state?.person; // 수정 모드일 경우 전달받은 인력 데이터
  const isEditMode = !!editPersonnel;

  const [suggestions, setSuggestions] = useState({
    divisions: [],
    departments: [],
    positions: [],
    ranks: [],
    duties: []
  });

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

  // 수정 모드일 경우 데이터 로드
  useEffect(() => {
    if (editPersonnel) {
      setFormData({
        division: editPersonnel.division || '',
        department: editPersonnel.department || '',
        position: editPersonnel.position || '',
        employee_number: editPersonnel.employee_number || '',
        name: editPersonnel.name || '',
        rank: editPersonnel.rank || '',
        duties: editPersonnel.duties || '',
        job_function: editPersonnel.job_function || '',
        bok_job_function: editPersonnel.bok_job_function || '',
        job_category: editPersonnel.job_category || '',
        is_it_personnel: editPersonnel.is_it_personnel || false,
        is_security_personnel: editPersonnel.is_security_personnel || false,
        birth_date: editPersonnel.birth_date || '',
        gender: editPersonnel.gender || '',
        age: editPersonnel.age || '',
        group_join_date: editPersonnel.group_join_date || '',
        join_date: editPersonnel.join_date || '',
        resignation_date: editPersonnel.resignation_date || '',
        total_service_years: editPersonnel.total_service_years || '',
        career_base_date: editPersonnel.career_base_date || '',
        it_career_years: editPersonnel.it_career_years || '',
        current_duty_date: editPersonnel.current_duty_date || '',
        current_duty_period: editPersonnel.current_duty_period || '',
        previous_department: editPersonnel.previous_department || '',
        major: editPersonnel.major || '',
        is_it_major: editPersonnel.is_it_major || false,
        it_certificate_1: editPersonnel.it_certificate_1 || '',
        it_certificate_2: editPersonnel.it_certificate_2 || '',
        it_certificate_3: editPersonnel.it_certificate_3 || '',
        it_certificate_4: editPersonnel.it_certificate_4 || '',
        notes: editPersonnel.notes || ''
      });
    }
  }, [editPersonnel]);

  // 자동완성 데이터 가져오기
  useEffect(() => {
    fetchSuggestions();
  }, []);

  const fetchSuggestions = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/personnel`);
      const personnel = await response.json();
      
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
    } catch (error) {
      console.error('자동완성 데이터 조회 오류:', error);
    }
  };

    // 날짜 기반 자동 계산 함수들
  // (서버에서 조회 시 자동 계산하므로 클라이언트 자동 계산 제거)
  
  // 폼 입력 핸들러
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    const updatedData = {
      ...formData,
      [name]: newValue
    };

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

      const url = isEditMode 
        ? `${API_BASE_URL}/api/personnel/${editPersonnel.id}`
        : `${API_BASE_URL}/api/personnel`;
      
      const method = isEditMode ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(processedData),
      });

      if (response.ok) {
        alert(isEditMode ? '인력정보가 수정되었습니다.' : '인력정보가 등록되었습니다.');
        navigate('/personnel'); // 인력관리 페이지로 이동
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('서버 응답 오류:', errorData);
        alert(`${isEditMode ? '수정' : '등록'} 실패: ${errorData.error || errorData.details || '알 수 없는 오류'}`);
      }
    } catch (error) {
      console.error(`인력정보 ${isEditMode ? '수정' : '등록'} 오류:`, error);
      alert(`${isEditMode ? '수정' : '등록'} 중 오류가 발생했습니다: ${error.message}`);
    }
  };

  // 취소
  const handleCancel = () => {
    if (window.confirm('작성중인 내용이 저장되지 않습니다. 돌아가시겠습니까?')) {
      navigate('/personnel');
    }
  };

  return (
    <div className="personnel-register">
      <div className="page-header">
        <h1>{isEditMode ? '인력 정보 수정' : '인력 정보 등록'}</h1>
        <button onClick={handleCancel} className="btn-back">
          ← 돌아가기
        </button>
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
                placeholder="자동 조회됨"
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
                placeholder="자동 조회됨"
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
                placeholder="자동 조회됨"
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
                placeholder="자동 조회됨"
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
              placeholder="추가 정보나 비고사항을 입력하세요"
            />
          </div>
        </div>

        <div className="form-footer">
          <button type="button" onClick={handleCancel} className="btn-cancel">
            취소
          </button>
          <button type="submit" className="btn-submit">
            {isEditMode ? '수정' : '등록'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default PersonnelRegister;

