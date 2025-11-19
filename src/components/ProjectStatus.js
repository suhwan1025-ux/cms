import React, { useState, useEffect } from 'react';
import { getApiUrl } from '../config/api';
import './ProjectStatus.css';

const API_BASE_URL = getApiUrl();

const ProjectStatus = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState('all');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/projects`);
      if (!response.ok) throw new Error('프로젝트 데이터 조회 실패');
      
      const data = await response.json();
      
      // snake_case → camelCase 변환
      const convertedData = data.map(item => ({
        id: item.id,
        projectCode: item.project_code,
        projectName: item.project_name,
        budgetYear: item.budget_year,
        initiatorDepartment: item.initiator_department,
        executorDepartment: item.executor_department,
        budgetAmount: item.budget_amount,
        executedAmount: item.executed_amount,
        isItCommittee: item.is_it_committee,
        status: item.status,
        progressRate: item.progress_rate,
        healthStatus: item.health_status,
        startDate: item.start_date,
        deadline: item.deadline,
        pm: item.pm,
        issues: item.issues
      }));
      
      setProjects(convertedData);
    } catch (error) {
      console.error('프로젝트 조회 오류:', error);
      alert('프로젝트 데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 연도 필터
  const currentYear = new Date().getFullYear();
  const years = ['all'];
  for (let i = -3; i <= 3; i++) {
    years.push(currentYear + i);
  }

  // 필터링된 프로젝트
  const filteredProjects = selectedYear === 'all' 
    ? projects 
    : projects.filter(p => p.budgetYear === parseInt(selectedYear));

  // 통계 계산
  const stats = {
    total: filteredProjects.length,
    byStatus: {
      준비중: filteredProjects.filter(p => p.status === '준비중').length,
      진행중: filteredProjects.filter(p => p.status === '진행중').length,
      완료: filteredProjects.filter(p => p.status === '완료').length,
      중단: filteredProjects.filter(p => p.status === '중단').length
    },
    byHealth: {
      양호: filteredProjects.filter(p => p.healthStatus === '양호').length,
      지연: filteredProjects.filter(p => p.healthStatus === '지연').length,
      미흡: filteredProjects.filter(p => p.healthStatus === '미흡').length,
      심각: filteredProjects.filter(p => p.healthStatus === '심각').length
    },
    totalBudget: filteredProjects.reduce((sum, p) => sum + (Number(p.budgetAmount) || 0), 0),
    totalExecuted: filteredProjects.reduce((sum, p) => sum + (Number(p.executedAmount) || 0), 0),
    averageProgress: filteredProjects.length > 0
      ? (filteredProjects.reduce((sum, p) => sum + (Number(p.progressRate) || 0), 0) / filteredProjects.length).toFixed(1)
      : 0
  };

  // 위험 프로젝트 (건강도가 미흡 또는 심각)
  const riskProjects = filteredProjects.filter(p => 
    p.healthStatus === '미흡' || p.healthStatus === '심각'
  );

  // 지연 프로젝트 (추진률 < 50% && 진행중)
  const delayedProjects = filteredProjects.filter(p => 
    p.status === '진행중' && Number(p.progressRate) < 50
  );

  // 부서별 프로젝트 수
  const departmentStats = filteredProjects.reduce((acc, p) => {
    const dept = p.executorDepartment || '미지정';
    acc[dept] = (acc[dept] || 0) + 1;
    return acc;
  }, {});

  const formatCurrency = (amount) => {
    if (!amount) return '0백만원';
    const million = (amount / 1000000);
    return million >= 1 
      ? `${million.toLocaleString(undefined, {maximumFractionDigits: 1})}백만원`
      : `${million.toFixed(2)}백만원`;
  };

  if (loading) return <div className="project-status loading">로딩 중...</div>;

  return (
    <div className="project-status">
      <div className="page-header">
        <h1>📊 프로젝트 현황</h1>
        <p>전체 프로젝트 통계 및 위험 관리</p>
      </div>

      {/* 연도 선택 */}
      <div className="year-selector">
        <label>조회 연도:</label>
        <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
          {years.map(year => (
            <option key={year} value={year}>
              {year === 'all' ? '전체 연도' : `${year}년`}
            </option>
          ))}
        </select>
      </div>

      {/* 전체 통계 카드 */}
      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="stat-icon">📁</div>
          <div className="stat-content">
            <div className="stat-label">전체 프로젝트</div>
            <div className="stat-value">{stats.total}건</div>
          </div>
        </div>
        
        <div className="stat-card success">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <div className="stat-label">총 예산</div>
            <div className="stat-value">{formatCurrency(stats.totalBudget)}</div>
          </div>
        </div>
        
        <div className="stat-card info">
          <div className="stat-icon">💵</div>
          <div className="stat-content">
            <div className="stat-label">총 확정집행액</div>
            <div className="stat-value">{formatCurrency(stats.totalExecuted)}</div>
            <div className="stat-extra">
              {stats.totalBudget > 0 ? 
                `집행률 ${((stats.totalExecuted / stats.totalBudget) * 100).toFixed(1)}%` 
                : ''}
            </div>
          </div>
        </div>
        
        <div className="stat-card warning">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <div className="stat-label">평균 추진률</div>
            <div className="stat-value">{stats.averageProgress}%</div>
          </div>
        </div>
      </div>

      {/* 위험 알림 */}
      {(riskProjects.length > 0 || delayedProjects.length > 0) && (
        <div className="alert-section">
          <h2>⚠️ 주의 필요 프로젝트</h2>
          <div className="alert-grid">
            {riskProjects.length > 0 && (
              <div className="alert-card danger">
                <div className="alert-header">
                  <span className="alert-icon">🚨</span>
                  <h3>위험 프로젝트</h3>
                  <span className="alert-count">{riskProjects.length}건</span>
                </div>
                <div className="alert-list">
                  {riskProjects.slice(0, 5).map(p => (
                    <div key={p.id} className="alert-item">
                      <span className={`health-badge health-${p.healthStatus}`}>
                        {p.healthStatus === '심각' ? '🔴' : '🟠'} {p.healthStatus}
                      </span>
                      <span className="project-name">{p.projectName}</span>
                      <span className="project-pm">PM: {p.pm || '-'}</span>
                    </div>
                  ))}
                  {riskProjects.length > 5 && (
                    <div className="alert-more">외 {riskProjects.length - 5}건</div>
                  )}
                </div>
              </div>
            )}
            
            {delayedProjects.length > 0 && (
              <div className="alert-card warning-card">
                <div className="alert-header">
                  <span className="alert-icon">⏰</span>
                  <h3>추진 지연 프로젝트</h3>
                  <span className="alert-count">{delayedProjects.length}건</span>
                </div>
                <div className="alert-list">
                  {delayedProjects.slice(0, 5).map(p => (
                    <div key={p.id} className="alert-item">
                      <span className="progress-badge">{p.progressRate}%</span>
                      <span className="project-name">{p.projectName}</span>
                      <span className="project-pm">PM: {p.pm || '-'}</span>
                    </div>
                  ))}
                  {delayedProjects.length > 5 && (
                    <div className="alert-more">외 {delayedProjects.length - 5}건</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 상태별 통계 */}
      <div className="charts-section">
        <div className="chart-card">
          <h3>프로젝트 상태 분포</h3>
          <div className="status-chart">
            {Object.entries(stats.byStatus).map(([status, count]) => {
              const percentage = stats.total > 0 ? (count / stats.total * 100).toFixed(1) : 0;
              return count > 0 ? (
                <div key={status} className="chart-bar">
                  <div className="chart-label">
                    <span className={`status-badge status-${status}`}>{status}</span>
                    <span className="chart-count">{count}건 ({percentage}%)</span>
                  </div>
                  <div className="chart-progress">
                    <div 
                      className={`chart-fill status-${status}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              ) : null;
            })}
          </div>
        </div>

        <div className="chart-card">
          <h3>건강도 분포</h3>
          <div className="health-chart">
            {Object.entries(stats.byHealth).map(([health, count]) => {
              const percentage = stats.total > 0 ? (count / stats.total * 100).toFixed(1) : 0;
              const icon = health === '양호' ? '🟢' : health === '지연' ? '🟡' : health === '미흡' ? '🟠' : '🔴';
              return count > 0 ? (
                <div key={health} className="chart-bar">
                  <div className="chart-label">
                    <span className={`health-badge health-${health}`}>{icon} {health}</span>
                    <span className="chart-count">{count}건 ({percentage}%)</span>
                  </div>
                  <div className="chart-progress">
                    <div 
                      className={`chart-fill health-${health}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              ) : null;
            })}
          </div>
        </div>
      </div>

      {/* 부서별 현황 */}
      <div className="department-section">
        <h3>부서별 프로젝트 현황</h3>
        <div className="department-grid">
          {Object.entries(departmentStats)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([dept, count]) => (
              <div key={dept} className="department-card">
                <div className="department-name">{dept}</div>
                <div className="department-count">{count}건</div>
              </div>
            ))}
        </div>
      </div>

      {/* 빠른 통계 */}
      <div className="quick-stats">
        <div className="quick-stat">
          <span className="quick-label">전산운영위 안건</span>
          <span className="quick-value">
            {filteredProjects.filter(p => p.isItCommittee).length}건
          </span>
        </div>
        <div className="quick-stat">
          <span className="quick-label">완료율</span>
          <span className="quick-value">
            {stats.total > 0 ? ((stats.byStatus.완료 / stats.total) * 100).toFixed(1) : 0}%
          </span>
        </div>
        <div className="quick-stat">
          <span className="quick-label">위험 프로젝트 비율</span>
          <span className="quick-value danger">
            {stats.total > 0 ? ((riskProjects.length / stats.total) * 100).toFixed(1) : 0}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProjectStatus;

