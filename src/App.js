import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import './App.css';
import { getApiUrl } from './config/api';
import Dashboard from './components/Dashboard';
import ProjectStatus from './components/ProjectStatus';
import BudgetDashboard from './components/BudgetDashboard';
import BudgetProposalsView from './components/BudgetProposalsView';
import BudgetRegistration from './components/BudgetRegistrationAPI';
import BudgetHistory from './components/BudgetHistory';
import ContractList from './components/ContractList';
import DraftList from './components/DraftList';
import ApprovalLine from './components/ApprovalLine';
import ProposalForm from './components/ProposalForm';
import AIAssistant from './components/AIAssistant';
import AIAssistantPage from './components/AIAssistantPage';
import TaskManagement from './components/TaskManagement';
import TemplateManagement from './components/TemplateManagement';
import WorkReport from './components/WorkReport';
import PersonnelManagement from './components/PersonnelManagement';
import ExternalPersonnelManagement from './components/ExternalPersonnelManagement';
import ProjectManagement from './components/ProjectManagement';

const API_BASE_URL = getApiUrl();

// 레이아웃 컴포넌트 (사이드바 표시 여부 제어)
function AppLayout({ children }) {
  const location = useLocation();
  const [dashboardMenuOpen, setDashboardMenuOpen] = useState(false);
  const [proposalMenuOpen, setProposalMenuOpen] = useState(false);
  const [budgetMenuOpen, setBudgetMenuOpen] = useState(false);
  const [taskMenuOpen, setTaskMenuOpen] = useState(false);
  const [personnelMenuOpen, setPersonnelMenuOpen] = useState(false);

  // 사이드바를 표시하지 않을 경로 목록
  const noSidebarRoutes = ['/budget-proposals'];
  const showSidebar = !noSidebarRoutes.includes(location.pathname);

  return (
    <div className={`app-container ${!showSidebar ? 'no-sidebar' : ''}`}>
      {/* 좌측 사이드바 */}
      {showSidebar && (
        <aside className="sidebar">
          <div className="sidebar-header">
            <img src="/logo.svg" alt="Logo" className="sidebar-logo" />
            <h1>계약 관리시스템</h1>
          </div>
          <nav className="sidebar-nav">
            {/* 대시보드 드롭다운 메뉴 */}
            <div className="nav-dropdown">
              <button 
                className="nav-link dropdown-toggle"
                onClick={() => setDashboardMenuOpen(!dashboardMenuOpen)}
              >
                <span className="nav-icon">📊</span>
                대시보드
                <span className="dropdown-arrow">{dashboardMenuOpen ? '▼' : '▶'}</span>
              </button>
              {dashboardMenuOpen && (
                <div className="dropdown-menu">
                  <Link to="/" className="dropdown-item">
                    계약현황
                  </Link>
                  <Link to="/project-status" className="dropdown-item">
                    프로젝트 현황
                  </Link>
                  <Link to="/budget-dashboard" className="dropdown-item">
                    사업예산현황
                  </Link>
                </div>
              )}
            </div>
            
            {/* 품의서 관리 드롭다운 메뉴 */}
            <div className="nav-dropdown">
              <button 
                className="nav-link dropdown-toggle"
                onClick={() => setProposalMenuOpen(!proposalMenuOpen)}
              >
                <span className="nav-icon">📄</span>
                품의서
                <span className="dropdown-arrow">{proposalMenuOpen ? '▼' : '▶'}</span>
              </button>
              {proposalMenuOpen && (
                <div className="dropdown-menu">
                  <Link to="/contract-list" className="dropdown-item">
                    품의서 조회
                  </Link>
                  <Link to="/draft-list" className="dropdown-item">
                    작성중인 품의서
                  </Link>
                  <Link to="/proposal?new=true" className="dropdown-item">
                    품의서 작성
                  </Link>
                  <Link to="/templates" className="dropdown-item">
                    템플릿 관리
                  </Link>
                </div>
              )}
            </div>
            
            <Link to="/approval-line" className="nav-link">
              <span className="nav-icon">📋</span>
              결재라인 참조
            </Link>
            
            {/* 사업예산 드롭다운 메뉴 */}
            <div className="nav-dropdown">
              <button 
                className="nav-link dropdown-toggle"
                onClick={() => setBudgetMenuOpen(!budgetMenuOpen)}
              >
                <span className="nav-icon">💰</span>
                사업예산
                <span className="dropdown-arrow">{budgetMenuOpen ? '▼' : '▶'}</span>
              </button>
              {budgetMenuOpen && (
                <div className="dropdown-menu">
                  <Link to="/budget" className="dropdown-item">
                    사업예산관리(자본예산)
                  </Link>
                  <Link to="/budget-history" className="dropdown-item">
                    사업예산관리 변경이력
                  </Link>
                </div>
              )}
            </div>

            <Link to="/tasks" className="nav-link">
              <span className="nav-icon">📋</span>
              업무관리
            </Link>
            
            {/* 인력관리 드롭다운 메뉴 */}
            <div className="nav-dropdown">
              <button 
                className="nav-link dropdown-toggle"
                onClick={() => setPersonnelMenuOpen(!personnelMenuOpen)}
              >
                <span className="nav-icon">👥</span>
                인력관리
                <span className="dropdown-arrow">{personnelMenuOpen ? '▼' : '▶'}</span>
              </button>
              {personnelMenuOpen && (
                <div className="dropdown-menu">
                  <Link to="/personnel" className="dropdown-item">
                    내부인력
                  </Link>
                  <Link to="/external-personnel" className="dropdown-item">
                    외주인력
                  </Link>
                </div>
              )}
            </div>
            
            <Link to="/work-report" className="nav-link">
              <span className="nav-icon">📊</span>
              업무보고
            </Link>

            <Link to="/project-management" className="nav-link">
              <span className="nav-icon">📁</span>
              프로젝트관리
            </Link>

            <Link to="/ai-assistant" className="nav-link">
              <span className="nav-icon">🤖</span>
              AI 어시스턴트
            </Link>
          </nav>
        </aside>
      )}
      
      {/* 메인 콘텐츠 영역 */}
      <main className={`main-content ${!showSidebar ? 'fullscreen' : ''}`}>
        {children}
      </main>
    </div>
  );
}

function App() {

  // 앱 초기화 시 접속 로그 기록 (사용자 추적)
  useEffect(() => {
    const logAccess = async () => {
      try {
        console.log('🔔 시스템 접속 - 사용자 인식 시도 중...');
        
        const response = await fetch(`${API_BASE_URL}/api/access-log`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const userData = await response.json();
          console.log('✅ 접속 로그 기록 완료:', userData);
          console.log(`   👤 사용자: ${userData.name}`);
          console.log(`   📍 IP: ${userData.clientIP}`);
          console.log(`   ⏰ 시간: ${userData.accessTime}`);
        } else {
          console.warn('⚠️  접속 로그 기록 실패 (응답 오류)');
        }
      } catch (error) {
        console.error('❌ 접속 로그 기록 실패:', error);
      }
    };
    
    // 페이지 로드 시 1회만 실행
    logAccess();
  }, []);

  return (
    <Router>
      <div className="App">
        <AppLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/project-status" element={<ProjectStatus />} />
            <Route path="/budget-dashboard" element={<BudgetDashboard />} />
            <Route path="/budget-proposals" element={<BudgetProposalsView />} />
            <Route path="/budget" element={<BudgetRegistration />} />
            <Route path="/budget-history" element={<BudgetHistory />} />
            <Route path="/contract-list" element={<ContractList />} />
            <Route path="/draft-list" element={<DraftList />} />
            <Route path="/proposal" element={<ProposalForm />} />
            <Route path="/approval-line" element={<ApprovalLine />} />
            <Route path="/tasks" element={<TaskManagement />} />
            <Route path="/templates" element={<TemplateManagement />} />
            <Route path="/personnel" element={<PersonnelManagement />} />
            <Route path="/external-personnel" element={<ExternalPersonnelManagement />} />
            <Route path="/work-report" element={<WorkReport />} />
            <Route path="/project-management" element={<ProjectManagement />} />
            <Route path="/ai-assistant" element={<AIAssistantPage />} />
          </Routes>
        </AppLayout>
        
        {/* AI 어시스턴트 플로팅 버튼 */}
        <AIAssistant />
      </div>
    </Router>
  );
}

export default App;
