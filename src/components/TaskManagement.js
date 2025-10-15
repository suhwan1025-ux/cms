import React, { useState, useEffect } from 'react';
import './TaskManagement.css';

const TaskManagement = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterPerson, setFilterPerson] = useState('');
  const [filterYear, setFilterYear] = useState('all');
  const [stats, setStats] = useState({});
  
  // 최근 5년 연도 생성
  const getRecentYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = 0; i < 5; i++) {
      years.push(currentYear - i);
    }
    return years;
  };
  
  const [formData, setFormData] = useState({
    taskName: '',
    description: '',
    sharedFolderPath: '',
    startDate: '',
    endDate: '',
    status: 'active',
    assignedPerson: '',
    priority: 'medium'
  });

  // 업무 목록 조회
  const fetchTasks = async () => {
    try {
      setLoading(true);
      let url = '/api/tasks';
      const params = new URLSearchParams();
      
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterPriority !== 'all') params.append('priority', filterPriority);
      if (filterPerson.trim() !== '') params.append('assignedPerson', filterPerson.trim());
      if (filterYear !== 'all') params.append('year', filterYear);
      
      if (params.toString()) url += `?${params.toString()}`;
      
      const response = await fetch(url);
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error('업무 목록 조회 실패:', error);
      alert('업무 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 통계 조회
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/tasks/stats/summary');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('통계 조회 실패:', error);
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchStats();
  }, [filterStatus, filterPriority, filterPerson, filterYear]);

  // 폼 초기화
  const resetForm = () => {
    setFormData({
      taskName: '',
      description: '',
      sharedFolderPath: '',
      startDate: '',
      endDate: '',
      status: 'active',
      assignedPerson: '',
      priority: 'medium'
    });
    setEditingTask(null);
  };

  // 모달 열기
  const openModal = (task = null) => {
    if (task) {
      setEditingTask(task);
      setFormData({
        taskName: task.taskName || '',
        description: task.description || '',
        sharedFolderPath: task.sharedFolderPath || '',
        startDate: task.startDate || '',
        endDate: task.endDate || '',
        status: task.status || 'active',
        assignedPerson: task.assignedPerson || '',
        priority: task.priority || 'medium'
      });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  // 모달 닫기
  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  // 입력 변경 핸들러
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 업무 저장
  const handleSave = async () => {
    try {
      // 필수 항목 검증
      const errors = [];
      
      if (!formData.taskName || formData.taskName.trim() === '') {
        errors.push('업무명');
      }
      if (!formData.assignedPerson || formData.assignedPerson.trim() === '') {
        errors.push('담당자');
      }
      if (!formData.startDate) {
        errors.push('시작일');
      }
      
      if (errors.length > 0) {
        alert(`다음 필수 항목을 입력해주세요:\n\n${errors.map(e => `• ${e}`).join('\n')}`);
        return;
      }

      const url = editingTask 
        ? `/api/tasks/${editingTask.id}`
        : '/api/tasks';
      
      const method = editingTask ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        alert(editingTask ? '업무가 수정되었습니다.' : '업무가 등록되었습니다.');
        closeModal();
        fetchTasks();
        fetchStats();
      } else {
        const errorData = await response.json().catch(() => ({ error: '알 수 없는 오류' }));
        console.error('서버 응답 오류:', response.status, errorData);
        throw new Error(errorData.error || `저장 실패 (${response.status})`);
      }
    } catch (error) {
      console.error('저장 실패:', error);
      alert(`저장에 실패했습니다.\n${error.message}`);
    }
  };

  // 업무 삭제
  const handleDelete = async (taskId) => {
    if (!window.confirm('정말 이 업무를 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert('업무가 삭제되었습니다.');
        fetchTasks();
        fetchStats();
      } else {
        throw new Error('삭제 실패');
      }
    } catch (error) {
      console.error('삭제 실패:', error);
      alert('삭제에 실패했습니다.');
    }
  };

  // 공유폴더 열기
  const openSharedFolder = (path) => {
    if (!path) {
      alert('공유폴더 경로가 설정되지 않았습니다.');
      return;
    }
    // Windows 경로를 file:// 프로토콜로 변환
    const filePath = 'file:///' + path.replace(/\\/g, '/');
    window.open(filePath, '_blank');
  };

  // 상태 한글 변환
  const getStatusText = (status) => {
    const statusMap = {
      'active': '진행중',
      'completed': '완료',
      'pending': '대기'
    };
    return statusMap[status] || status;
  };

  // 우선순위 한글 변환
  const getPriorityText = (priority) => {
    const priorityMap = {
      'high': '높음',
      'medium': '보통',
      'low': '낮음'
    };
    return priorityMap[priority] || priority;
  };

  // 상태별 배지 클래스
  const getStatusBadgeClass = (status) => {
    const classMap = {
      'active': 'badge-active',
      'completed': 'badge-completed',
      'pending': 'badge-pending'
    };
    return classMap[status] || '';
  };

  // 우선순위별 배지 클래스
  const getPriorityBadgeClass = (priority) => {
    const classMap = {
      'high': 'badge-priority-high',
      'medium': 'badge-priority-medium',
      'low': 'badge-priority-low'
    };
    return classMap[priority] || '';
  };

  return (
    <div className="task-management">
      <div className="task-header">
        <h1>📋 업무관리</h1>
        <button className="btn-primary" onClick={() => openModal()}>
          ➕ 새 업무 등록
        </button>
      </div>

      {/* 통계 카드 */}
      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-label">전체 업무</div>
          <div className="stat-value">{stats.total_count || 0}</div>
        </div>
        <div className="stat-card stat-active">
          <div className="stat-label">진행중</div>
          <div className="stat-value">{stats.active_count || 0}</div>
        </div>
        <div className="stat-card stat-completed">
          <div className="stat-label">완료</div>
          <div className="stat-value">{stats.completed_count || 0}</div>
        </div>
        <div className="stat-card stat-pending">
          <div className="stat-label">대기</div>
          <div className="stat-value">{stats.pending_count || 0}</div>
        </div>
        <div className="stat-card stat-priority">
          <div className="stat-label">높은 우선순위</div>
          <div className="stat-value">{stats.high_priority_count || 0}</div>
        </div>
      </div>

      {/* 필터 */}
      <div className="task-filters">
        <div className="filter-group">
          <label>상태:</label>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">전체</option>
            <option value="active">진행중</option>
            <option value="pending">대기</option>
            <option value="completed">완료</option>
          </select>
        </div>
        <div className="filter-group">
          <label>우선순위:</label>
          <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
            <option value="all">전체</option>
            <option value="high">높음</option>
            <option value="medium">보통</option>
            <option value="low">낮음</option>
          </select>
        </div>
        <div className="filter-group">
          <label>연도:</label>
          <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)}>
            <option value="all">전체</option>
            {getRecentYears().map(year => (
              <option key={year} value={year}>{year}년</option>
            ))}
          </select>
        </div>
        <div className="filter-group filter-group-search">
          <label>담당자:</label>
          <input
            type="text"
            value={filterPerson}
            onChange={(e) => setFilterPerson(e.target.value)}
            placeholder="담당자명으로 검색"
            className="filter-search-input"
          />
          {filterPerson && (
            <button 
              className="clear-filter-btn"
              onClick={() => setFilterPerson('')}
              title="검색 초기화"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 업무 목록 */}
      {loading ? (
        <div className="loading">로딩 중...</div>
      ) : (
        <div className="task-list">
          {tasks.length === 0 ? (
            <div className="no-data">등록된 업무가 없습니다.</div>
          ) : (
            tasks.map(task => (
              <div key={task.id} className="task-card">
                <div className="task-card-header">
                  <div className="task-title-row">
                    <h3>{task.taskName}</h3>
                    <div className="task-badges">
                      <span className={`badge ${getStatusBadgeClass(task.status)}`}>
                        {getStatusText(task.status)}
                      </span>
                      <span className={`badge ${getPriorityBadgeClass(task.priority)}`}>
                        {getPriorityText(task.priority)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="task-card-body">
                  {task.description && (
                    <p className="task-description">{task.description}</p>
                  )}
                  
                  <div className="task-info-grid">
                    <div className="info-item">
                      <span className="info-label">📁 공유폴더:</span>
                      <span className="info-value">
                        {task.sharedFolderPath ? (
                          <button 
                            className="link-button"
                            onClick={() => openSharedFolder(task.sharedFolderPath)}
                            title="폴더 열기"
                          >
                            {task.sharedFolderPath}
                          </button>
                        ) : (
                          <span className="text-muted">미설정</span>
                        )}
                      </span>
                    </div>
                    
                    <div className="info-item">
                      <span className="info-label">📅 기간:</span>
                      <span className="info-value">
                        {task.startDate && task.endDate 
                          ? `${task.startDate} ~ ${task.endDate}`
                          : task.startDate 
                            ? `${task.startDate} ~`
                            : <span className="text-muted">미설정</span>
                        }
                      </span>
                    </div>
                    
                    <div className="info-item">
                      <span className="info-label">👤 담당자:</span>
                      <span className="info-value">
                        {task.assignedPerson ? (
                          <>
                            {task.assignedPerson.split(',').map((person, idx) => (
                              <span key={idx} className="person-badge">
                                {person.trim()}
                              </span>
                            ))}
                          </>
                        ) : (
                          <span className="text-muted">미배정</span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="task-card-footer">
                  <button 
                    className="btn-secondary btn-sm"
                    onClick={() => openModal(task)}
                  >
                    ✏️ 수정
                  </button>
                  <button 
                    className="btn-danger btn-sm"
                    onClick={() => handleDelete(task.id)}
                  >
                    🗑️ 삭제
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 모달 */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingTask ? '업무 수정' : '새 업무 등록'}</h2>
              <button className="close-button" onClick={closeModal}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label>업무명 <span className="required">*</span></label>
                <input
                  type="text"
                  name="taskName"
                  value={formData.taskName}
                  onChange={handleInputChange}
                  placeholder="업무명을 입력하세요"
                  required
                />
              </div>

              <div className="form-group">
                <label>설명</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="업무 설명을 입력하세요"
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>공유폴더 위치</label>
                <input
                  type="text"
                  name="sharedFolderPath"
                  value={formData.sharedFolderPath}
                  onChange={handleInputChange}
                  placeholder="예: \\server\shared\project"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>시작일 <span className="required">*</span></label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>종료일</label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>상태</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                  >
                    <option value="active">진행중</option>
                    <option value="pending">대기</option>
                    <option value="completed">완료</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>우선순위</label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                  >
                    <option value="high">높음</option>
                    <option value="medium">보통</option>
                    <option value="low">낮음</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>담당자 <span className="required">*</span></label>
                <input
                  type="text"
                  name="assignedPerson"
                  value={formData.assignedPerson}
                  onChange={handleInputChange}
                  placeholder="여러명인 경우 쉼표(,)로 구분하세요. 예: 홍길동, 김철수, 이영희"
                  required
                />
                <small className="help-text">
                  💡 담당자가 여러명인 경우 쉼표(,)로 구분하여 입력하세요
                </small>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={closeModal}>
                취소
              </button>
              <button className="btn-primary" onClick={handleSave}>
                {editingTask ? '수정' : '등록'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskManagement;

