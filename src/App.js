import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import Dashboard from './components/Dashboard';
import BudgetDashboard from './components/BudgetDashboard';
import BudgetRegistration from './components/BudgetRegistrationAPI';
import BudgetHistory from './components/BudgetHistory';
import ContractList from './components/ContractList';
import DraftList from './components/DraftList';
import ApprovalLine from './components/ApprovalLine';
import ProposalForm from './components/ProposalForm';



function App() {
  const [dashboardMenuOpen, setDashboardMenuOpen] = useState(false);
  const [proposalMenuOpen, setProposalMenuOpen] = useState(false);
  const [budgetMenuOpen, setBudgetMenuOpen] = useState(false);

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
            </nav>
          </aside>
          
          {/* 메인 콘텐츠 영역 */}
          <main className="main-content">
                       <Routes>
             <Route path="/" element={<Dashboard />} />
             <Route path="/budget-dashboard" element={<BudgetDashboard />} />
             <Route path="/budget" element={<BudgetRegistration />} />
             <Route path="/budget-history" element={<BudgetHistory />} />
             <Route path="/contract-list" element={<ContractList />} />
             <Route path="/draft-list" element={<DraftList />} />
             <Route path="/proposal" element={<ProposalForm />} />
             <Route path="/approval-line" element={<ApprovalLine />} />
           </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
