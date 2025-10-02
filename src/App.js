import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import Dashboard from './components/Dashboard';
import BudgetRegistration from './components/BudgetRegistrationAPI';
import ContractList from './components/ContractList';
import DraftList from './components/DraftList';
import ApprovalLine from './components/ApprovalLine';
import TeamManagement from './components/TeamManagement';
import ProposalForm from './components/ProposalForm';
import Statistics from './components/Statistics';
import EditorTest from './components/EditorTest';



function App() {
  const [proposalMenuOpen, setProposalMenuOpen] = useState(false);

  return (
    <Router>
      <div className="App">
        <div className="app-container">
          {/* 좌측 사이드바 */}
          <aside className="sidebar">
            <div className="sidebar-header">
              <h1>계약 관리시스템</h1>
            </div>
            <nav className="sidebar-nav">
              <Link to="/" className="nav-link">
                <span className="nav-icon">📊</span>
                대시보드
              </Link>
              
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
                  </div>
                )}
              </div>
              
              <Link to="/approval-line" className="nav-link">
                <span className="nav-icon">📋</span>
                결재라인 참조
              </Link>
              <Link to="/statistics" className="nav-link">
                <span className="nav-icon">📈</span>
                통계 및 모니터링
              </Link>
              

              
              {/* 사업예산 메뉴 */}
              <Link to="/budget" className="nav-link">
                <span className="nav-icon">💰</span>
                사업예산
              </Link>
              
              <Link to="/team" className="nav-link">
                <span className="nav-icon">👥</span>
                팀 관리
              </Link>
              
              <Link to="/editor-test" className="nav-link">
                <span className="nav-icon">🧪</span>
                에디터 테스트
              </Link>
            </nav>
          </aside>
          
          {/* 메인 콘텐츠 영역 */}
          <main className="main-content">
                       <Routes>
             <Route path="/" element={<Dashboard />} />
             <Route path="/budget" element={<BudgetRegistration />} />
             <Route path="/contract-list" element={<ContractList />} />
             <Route path="/draft-list" element={<DraftList />} />
             <Route path="/proposal" element={<ProposalForm />} />
             <Route path="/approval-line" element={<ApprovalLine />} />
             <Route path="/statistics" element={<Statistics />} />
             
             <Route path="/team" element={<TeamManagement />} />
             <Route path="/editor-test" element={<EditorTest />} />
           </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
