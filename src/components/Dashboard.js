import React, { useState, useEffect } from 'react';
import { getApiUrl } from '../config/api';
import { generatePreviewHTML } from '../utils/previewGenerator';
import * as XLSX from 'xlsx';

// API 베이스 URL 설정
const API_BASE_URL = getApiUrl();

const Dashboard = () => {
  const [stats, setStats] = useState({
    approvedProposals: 0,
    draftProposals: 0
  });

  const [recentProposals, setRecentProposals] = useState([]);
  const [allApprovedProposals, setAllApprovedProposals] = useState([]); // 모든 결재완료 품의서
  const [businessBudgets, setBusinessBudgets] = useState([]); // 사업예산 목록
  const [monthlyStats, setMonthlyStats] = useState([]);
  const [outsourcingPersonnel, setOutsourcingPersonnel] = useState([]);
  const [monthlyPersonnelCost, setMonthlyPersonnelCost] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  
  // 일반계약 팝업 관련 상태
  const [showContractPopup, setShowContractPopup] = useState(false);
  const [selectedContracts, setSelectedContracts] = useState([]);
  const [selectedProjectInfo, setSelectedProjectInfo] = useState({});

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // 사업예산 데이터 가져오기
      const budgetResponse = await fetch(`${API_BASE_URL}/api/business-budgets`);
      const budgetData = await budgetResponse.json();
      const budgets = Array.isArray(budgetData) ? budgetData : (budgetData.budgets || []);
      console.log('사업예산 데이터:', budgets);
      setBusinessBudgets(budgets);
      
      // 품의서 데이터 가져오기
      const response = await fetch(`${API_BASE_URL}/api/proposals`);
      const proposalsData = await response.json();
      
      // API 응답이 배열인지 확인
      const proposals = Array.isArray(proposalsData) ? proposalsData : [];
      console.log('대시보드 proposals 데이터:', proposals);
      
      // 결재완료된 품의서만 필터링
      const approvedProposals = proposals.filter(p => p.status === 'approved');
      const draftProposals = proposals.filter(p => p.status === 'draft' || p.isDraft === true);
      
      // 월별 통계 계산 (결재완료일 기준)
      const monthlyData = {};
      approvedProposals.forEach(proposal => {
        if (proposal.approvalDate) {
          const date = new Date(proposal.approvalDate);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          
          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { month: monthKey, count: 0, amount: 0 };
          }
          monthlyData[monthKey].count += 1;
          monthlyData[monthKey].amount += parseFloat(proposal.totalAmount || 0);
        }
      });
      
      // 월별 데이터 정렬 (최근 12개월)
      const sortedMonths = Object.values(monthlyData)
        .sort((a, b) => a.month.localeCompare(b.month))
        .slice(-12); // 최근 12개월만
      
      // 외주인력 현황 수집 (용역계약 + 결재완료)
      const today = new Date();
      const personnelList = [];
      approvedProposals.forEach(proposal => {
        if (proposal.contractType === 'service' && proposal.serviceItems) {
          proposal.serviceItems.forEach(item => {
            // 시작일과 종료일 계산
            const startDate = proposal.approvalDate ? new Date(proposal.approvalDate) : null;
            let endDate = null;
            if (startDate && item.period) {
              endDate = new Date(startDate);
              endDate.setMonth(endDate.getMonth() + parseInt(item.period));
            }
            
            // 재직 상태 판단 (시작전, 재직중, 종료)
            let workStatus = 'unknown';
            if (startDate && endDate) {
              if (today < startDate) {
                workStatus = 'notStarted'; // 시작전
              } else if (today >= startDate && today <= endDate) {
                workStatus = 'working'; // 재직중
              } else {
                workStatus = 'ended'; // 종료
              }
            }
            const isCurrentlyWorking = workStatus === 'working';
            
            personnelList.push({
              proposalId: proposal.id,
              proposalTitle: proposal.title || proposal.purpose,
              name: item.name || '-',
              skillLevel: item.skillLevel || '-',
              department: proposal.requestDepartments && proposal.requestDepartments.length > 0
                ? (typeof proposal.requestDepartments[0] === 'string' 
                    ? proposal.requestDepartments[0] 
                    : proposal.requestDepartments[0].department || proposal.requestDepartments[0].name || '-')
                : '-',
              purpose: proposal.purpose || '-',
              period: item.period || 0,
              monthlyRate: item.monthlyRate || 0,
              startDate: startDate,
              endDate: endDate,
              supplier: item.supplier || '-',
              isCurrentlyWorking: isCurrentlyWorking,
              workStatus: workStatus
            });
          });
        }
      });
      
      // 월별 외주 인력 지출 계산 - 각 월에 재직중인 인력 기준으로 계산
      const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 6, 1);
      const sixMonthsLater = new Date(today.getFullYear(), today.getMonth() + 6, 1);
      
      // 6개월 전부터 6개월 후까지 모든 월을 순회하면서 계산
      const sortedCosts = [];
      let current = new Date(sixMonthsAgo);
      
      while (current <= sixMonthsLater) {
        const monthKey = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
        const monthStart = new Date(current.getFullYear(), current.getMonth(), 1);
        const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0); // 해당 월의 마지막 날
        
        let monthlyCost = 0;
        let personnelCount = 0;
        
        // 해당 월에 재직중인 모든 인력을 찾아서 합산
        personnelList.forEach(person => {
          if (person.startDate && person.endDate && person.monthlyRate) {
            const personStart = new Date(person.startDate);
            const personEnd = new Date(person.endDate);
            
            // 해당 월에 재직중인지 확인 (계약 기간이 해당 월과 겹치는지)
            const isWorkingThisMonth = personStart <= monthEnd && personEnd >= monthStart;
            
            if (isWorkingThisMonth) {
              const monthlyRate = parseFloat(person.monthlyRate);
              
              // 유효한 숫자인지 확인
              if (!isNaN(monthlyRate) && monthlyRate > 0) {
                monthlyCost += monthlyRate;
                personnelCount += 1; // 각 계약을 독립적인 인력으로 카운트
              } else {
                console.warn('⚠️ 유효하지 않은 월 단가:', person.name, person.monthlyRate);
              }
            }
          }
        });
        
        sortedCosts.push({
          month: monthKey,
          cost: monthlyCost,
          count: personnelCount
        });
        
        current.setMonth(current.getMonth() + 1);
      }
      
      console.log('📅 표시 기간:', {
        시작: sixMonthsAgo.toLocaleDateString('ko-KR'),
        종료: sixMonthsLater.toLocaleDateString('ko-KR'),
        총월수: sortedCosts.length,
        데이터있는월: sortedCosts.filter(m => m.cost > 0 || m.count > 0).length
      });
      
      setStats({
        approvedProposals: approvedProposals.length,
        draftProposals: draftProposals.length
      });
      
      // 모든 결재완료 품의서 저장
      setAllApprovedProposals(approvedProposals);
      
      // 최근 결재완료 순서로 정렬 (결재일 기준 내림차순)
      const sortedByApprovalDate = [...approvedProposals].sort((a, b) => {
        const dateA = a.approvalDate ? new Date(a.approvalDate) : new Date(0);
        const dateB = b.approvalDate ? new Date(b.approvalDate) : new Date(0);
        return dateB - dateA; // 내림차순 (최근 것이 먼저)
      });
      setRecentProposals(sortedByApprovalDate.slice(0, 5)); // 최근 5개
      setMonthlyStats(sortedMonths);
      setOutsourcingPersonnel(personnelList);
      setMonthlyPersonnelCost(sortedCosts);
      
    } catch (error) {
      console.error('대시보드 데이터 로드 실패:', error);
      alert('데이터 로드에 실패했습니다. 서버가 실행 중인지 확인해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    // 소수점 제거하고 정수로 변환
    const integerAmount = Math.round(amount);
    return new Intl.NumberFormat('ko-KR').format(integerAmount) + '원';
  };

  // 정렬 함수
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // 정렬 초기화
  const resetSort = () => {
    setSortConfig({ key: null, direction: 'asc' });
  };

  // 재직중인 외주인력만 필터링
  const getActivePersonnel = () => {
    return outsourcingPersonnel.filter(p => p.isCurrentlyWorking);
  };

  // 정렬된 외주인력 데이터 (전체)
  const getSortedPersonnel = () => {
    // 전체 외주인력을 대상으로 정렬
    const allPersonnel = outsourcingPersonnel;
    if (!sortConfig.key) return allPersonnel;

    const sorted = [...allPersonnel].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // 날짜 처리
      if (sortConfig.key === 'startDate' || sortConfig.key === 'endDate') {
        aValue = aValue ? new Date(aValue).getTime() : 0;
        bValue = bValue ? new Date(bValue).getTime() : 0;
      }
      
      // 숫자 처리
      if (sortConfig.key === 'period' || sortConfig.key === 'monthlyRate') {
        aValue = parseFloat(aValue) || 0;
        bValue = parseFloat(bValue) || 0;
      }

      // 불린 처리
      if (sortConfig.key === 'isCurrentlyWorking') {
        aValue = aValue ? 1 : 0;
        bValue = bValue ? 1 : 0;
      }
      
      // 재직 상태 처리 (시작전 < 재직중 < 종료 순서로 정렬)
      if (sortConfig.key === 'workStatus') {
        const statusOrder = { 'notStarted': 1, 'working': 2, 'ended': 3, 'unknown': 4 };
        aValue = statusOrder[aValue] || 4;
        bValue = statusOrder[bValue] || 4;
      }

      // 문자열 처리
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = (bValue || '').toLowerCase();
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  };

  // 기술등급별 색상 반환
  const getSkillLevelColor = (skillLevel) => {
    const level = (skillLevel || '').toLowerCase();
    if (level.includes('특급') || level.includes('expert') || level.includes('senior')) {
      return {
        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        color: 'white',
        shadow: 'rgba(240, 147, 251, 0.4)'
      };
    }
    if (level.includes('고급') || level.includes('advanced')) {
      return {
        background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        color: 'white',
        shadow: 'rgba(79, 172, 254, 0.4)'
      };
    }
    if (level.includes('중급') || level.includes('intermediate')) {
      return {
        background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
        color: 'white',
        shadow: 'rgba(67, 233, 123, 0.4)'
      };
    }
    if (level.includes('초급') || level.includes('junior') || level.includes('beginner')) {
      return {
        background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        color: 'white',
        shadow: 'rgba(250, 112, 154, 0.4)'
      };
    }
    // 기본
    return {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      shadow: 'rgba(102, 126, 234, 0.3)'
    };
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return '#28a745';
      case 'submitted': return '#007bff';
      case 'draft': return '#ffc107';
      case 'rejected': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'approved': return '승인';
      case 'submitted': return '제출';
      case 'draft': return '작성중';
      case 'rejected': return '반려';
      default: return status;
    }
  };

  const getContractTypeText = (type) => {
    switch (type) {
      case 'purchase': return '구매 계약';
      case 'change': return '변경 계약';
      case 'extension': return '연장 계약';
      case 'service': return '용역 계약';
      case 'bidding': return '입찰 계약';
      case 'freeform': return '자유양식';
      default: return type;
    }
  };

  // 월 표시 형식
  const formatMonth = (monthKey) => {
    const [year, month] = monthKey.split('-');
    return `${parseInt(month)}월`;
  };

  // 엑셀 다운로드 함수
  const handleExcelDownload = () => {
    const sortedData = getSortedPersonnel();
    
    // 엑셀용 데이터 변환
    const excelData = sortedData.map((person, index) => ({
      '순번': index + 1,
      '성명': person.name,
      '기술등급': person.skillLevel,
      '요청부서': person.department,
      '사업목적': person.purpose,
      '계약기간(개월)': person.period,
      '월단가(원)': person.monthlyRate,
      '시작일': person.startDate ? person.startDate.toLocaleDateString('ko-KR') : '-',
      '종료일': person.endDate ? person.endDate.toLocaleDateString('ko-KR') : '-',
      '공급업체': person.supplier,
      '재직여부': person.workStatus === 'working' ? '재직중' : 
                  person.workStatus === 'notStarted' ? '시작전' : '종료'
    }));

    // 워크북 생성
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '외주인력현황');

    // 열 너비 자동 조정
    const columnWidths = [
      { wch: 8 },   // 순번
      { wch: 12 },  // 성명
      { wch: 12 },  // 기술등급
      { wch: 15 },  // 요청부서
      { wch: 25 },  // 사업목적
      { wch: 15 },  // 계약기간
      { wch: 15 },  // 월단가
      { wch: 15 },  // 시작일
      { wch: 15 },  // 종료일
      { wch: 20 },  // 공급업체
      { wch: 12 }   // 재직여부
    ];
    worksheet['!cols'] = columnWidths;

    // 파일명에 현재 날짜 포함
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const filename = `외주인력현황_${dateStr}.xlsx`;

    // 파일 다운로드
    XLSX.writeFile(workbook, filename);
  };

  // 일반계약 팝업 열기
  const handleOpenContractPopup = (contracts, projectInfo) => {
    setSelectedContracts(contracts);
    setSelectedProjectInfo(projectInfo);
    setShowContractPopup(true);
  };

  // 일반계약 팝업 닫기
  const handleCloseContractPopup = () => {
    setShowContractPopup(false);
    setSelectedContracts([]);
    setSelectedProjectInfo({});
  };

  // 외주인력 행 클릭 핸들러 (품의서 미리보기)
  const handlePersonnelClick = async (proposalId) => {
    console.log('🔍 선택된 품의서 ID:', proposalId);
    try {
      // 서버에서 품의서 데이터 조회
      const response = await fetch(`${API_BASE_URL}/api/proposals/${proposalId}`);
      if (response.ok) {
        const originalData = await response.json();
        
        // 미리보기에 필요한 데이터 구조로 변환
        const previewData = {
          title: originalData.title,
          contractType: originalData.contractType,
          purpose: originalData.purpose,
          basis: originalData.basis,
          budget: originalData.budget,
          budgetInfo: originalData.budgetInfo,
          contractMethod: originalData.contractMethod,
          requestDepartments: originalData.requestDepartments 
            ? originalData.requestDepartments.map(d => d.department || d.name || d)
            : [],
          totalAmount: originalData.totalAmount,
          other: originalData.other,
          purchaseItems: originalData.purchaseItems || [],
          serviceItems: originalData.serviceItems || [],
          costDepartments: originalData.costDepartments || [],
          wysiwygContent: originalData.wysiwygContent || originalData.wysiwyg_content || '',
          approvalDate: originalData.approvalDate,
          createdAt: originalData.createdAt,
          createdBy: originalData.createdBy,
          status: originalData.status
        };
        
        console.log('📄 품의서 미리보기 데이터:', previewData);
        
        // 미리보기 HTML 생성 및 새 창 열기
        const previewHTML = generatePreviewHTML(previewData);
        const previewWindow = window.open('', '_blank', 'width=1200,height=800');
        previewWindow.document.write(previewHTML);
        previewWindow.document.close();
      } else {
        console.error('품의서 조회 실패:', response.status);
        alert('품의서 정보를 불러올 수 없습니다.');
      }
    } catch (error) {
      console.error('품의서 미리보기 오류:', error);
      alert('품의서 미리보기 중 오류가 발생했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <h2>대시보드 데이터를 불러오는 중...</h2>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <h1>계약현황 대시보드</h1>
      
      {/* 통계 카드 */}
      <div className="stats-grid">
        <div className="stat-card approved">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-number">{stats.approvedProposals}</div>
            <div className="stat-label">결재완료 품의서</div>
          </div>
        </div>
        <div className="stat-card draft">
          <div className="stat-icon">📝</div>
          <div className="stat-content">
            <div className="stat-number">{stats.draftProposals}</div>
            <div className="stat-label">작성중</div>
          </div>
        </div>
        <div className="stat-card personnel-active">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <div className="stat-number">
              {outsourcingPersonnel.filter(p => p.isCurrentlyWorking).length}
            </div>
            <div className="stat-label">외주인력 (재직중)</div>
          </div>
        </div>
        <div className="stat-card personnel-expiring">
          <div className="stat-icon">⚠️</div>
          <div className="stat-content">
            <div className="stat-number">
              {(() => {
                const oneMonthLater = new Date();
                oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
                return outsourcingPersonnel.filter(p => 
                  p.isCurrentlyWorking && p.endDate && p.endDate <= oneMonthLater
                ).length;
              })()}
            </div>
            <div className="stat-label">외주인력 (만료 1개월 전)</div>
          </div>
        </div>
      </div>

      {/* 최근 품의서 현황 */}
      <div className="card">
        <h2>최근 결재완료 품의서</h2>
        <p className="stats-description">최근 결재완료된 품의서 5건을 표시합니다.</p>
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>품의서 제목</th>
                <th>계약 유형</th>
                <th>계약금액</th>
                <th>결재완료일</th>
                <th>작성자</th>
              </tr>
            </thead>
            <tbody>
              {recentProposals.length > 0 ? (
                recentProposals.map(proposal => (
                  <tr key={proposal.id}>
                    <td>{proposal.title || proposal.purpose}</td>
                    <td>
                      <span className="contract-type-badge">
                        {getContractTypeText(proposal.contractType)}
                      </span>
                    </td>
                    <td className="amount-cell">{formatCurrency(proposal.totalAmount)}</td>
                    <td>{proposal.approvalDate ? new Date(proposal.approvalDate).toLocaleDateString('ko-KR') : '-'}</td>
                    <td>{proposal.createdBy || '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', color: '#666', fontStyle: 'italic' }}>
                    결재완료된 품의서가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 그래프 그리드 - 월별 결재완료와 외주인력 지출 나란히 */}
      <div className="charts-grid">
        {/* 월별 결재완료 통계 그래프 */}
        <div className="card">
        <h2>월별 결재완료 품의서 현황</h2>
        <p className="stats-description">최근 12개월간 결재완료된 품의서의 건수와 금액을 보여줍니다.</p>
        {monthlyStats.length > 0 ? (
          <div className="line-chart-container">
            <svg className="line-chart" viewBox="0 0 1000 500" preserveAspectRatio="xMidYMid meet">
              {/* 정의: 그라데이션 및 필터 */}
              <defs>
                {/* 금액 그라데이션 */}
                <linearGradient id="amountGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.05" />
                </linearGradient>
                
                {/* 건수 그라데이션 */}
                <linearGradient id="countGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
                </linearGradient>
                
                {/* 그림자 효과 */}
                <filter id="shadow">
                  <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
                  <feOffset dx="0" dy="2" result="offsetblur"/>
                  <feComponentTransfer>
                    <feFuncA type="linear" slope="0.2"/>
                  </feComponentTransfer>
                  <feMerge>
                    <feMergeNode/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              
              {/* 그리드 라인 */}
              {[0, 1, 2, 3, 4, 5].map(i => (
                <line
                  key={`grid-${i}`}
                  x1="50"
                  y1={50 + i * 70}
                  x2="950"
                  y2={50 + i * 70}
                  stroke="#e5e7eb"
                  strokeWidth="1"
                  strokeDasharray="5,5"
                  opacity="0.5"
                />
              ))}
              
              {/* Y축 레이블 (금액) - 왼쪽 */}
              <text x="25" y="35" fontSize="20" fill="#10b981" fontWeight="600" textAnchor="middle">
                금액
              </text>
              
              {/* Y축 레이블 (건수) - 오른쪽 */}
              <text x="975" y="35" fontSize="20" fill="#3b82f6" fontWeight="600" textAnchor="middle">
                건수
              </text>
              
              {/* X축 레이블 */}
              <text x="500" y="480" fontSize="20" fill="#666" fontWeight="600" textAnchor="middle">
                월
              </text>
              
              {(() => {
                const maxAmount = Math.max(...monthlyStats.map(m => m.amount));
                const maxCount = Math.max(...monthlyStats.map(m => m.count));
                const chartWidth = 900;
                const chartHeight = 350;
                const stepX = chartWidth / (monthlyStats.length - 1 || 1);
                
                // 금액 선 경로 생성
                const amountPath = monthlyStats.map((month, index) => {
                  const x = 50 + index * stepX;
                  const y = 400 - (month.amount / maxAmount) * chartHeight;
                  return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
                }).join(' ');
                
                // 금액 영역 경로 생성 (area fill)
                const amountAreaPath = `${amountPath} L ${50 + (monthlyStats.length - 1) * stepX} 400 L 50 400 Z`;
                
                // 건수 선 경로 생성
                const countPath = monthlyStats.map((month, index) => {
                  const x = 50 + index * stepX;
                  const y = 400 - (month.count / maxCount) * chartHeight;
                  return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
                }).join(' ');
                
                // 건수 영역 경로 생성 (area fill)
                const countAreaPath = `${countPath} L ${50 + (monthlyStats.length - 1) * stepX} 400 L 50 400 Z`;
                
                return (
                  <>
                    {/* Y축 눈금 값 (금액 - 왼쪽) */}
                    {[0, 1, 2, 3, 4, 5].map(i => {
                      const value = (maxAmount / 5) * (5 - i);
                      const y = 50 + i * 70;
                      return (
                        <text
                          key={`amount-tick-${i}`}
                          x="45"
                          y={y + 4}
                          fontSize="18"
                          fill="#10b981"
                          textAnchor="end"
                          fontWeight="500"
                        >
                          {Math.round(value / 1000000)}
                        </text>
                      );
                    })}
                    
                    {/* Y축 눈금 값 (건수 - 오른쪽) */}
                    {[0, 1, 2, 3, 4, 5].map(i => {
                      const value = Math.round((maxCount / 5) * (5 - i));
                      const y = 50 + i * 70;
                      return (
                        <text
                          key={`count-tick-${i}`}
                          x="955"
                          y={y + 4}
                          fontSize="18"
                          fill="#3b82f6"
                          textAnchor="start"
                          fontWeight="500"
                        >
                          {value}
                        </text>
                      );
                    })}
                  
                    {/* 금액 영역 채우기 */}
                    <path
                      d={amountAreaPath}
                      fill="url(#amountGradient)"
                      opacity="0.6"
                    />
                    
                    {/* 건수 영역 채우기 */}
                    <path
                      d={countAreaPath}
                      fill="url(#countGradient)"
                      opacity="0.6"
                    />
                    
                    {/* 금액 선 (초록색) */}
                    <path
                      d={amountPath}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      filter="url(#shadow)"
                    />
                    
                    {/* 건수 선 (파란색) */}
                    <path
                      d={countPath}
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      filter="url(#shadow)"
                    />
                    
                    {/* 금액 데이터 포인트 */}
                    {monthlyStats.map((month, index) => {
                      const x = 50 + index * stepX;
                      const y = 400 - (month.amount / maxAmount) * chartHeight;
                      return (
                        <g key={`amount-point-${index}`} className="data-point">
                          <circle
                            cx={x}
                            cy={y}
                            r="6"
                            fill="#10b981"
                            stroke="white"
                            strokeWidth="3"
                            style={{
                              filter: 'drop-shadow(0 2px 4px rgba(16, 185, 129, 0.3))',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                          />
                          <title>{formatCurrency(month.amount)}</title>
                        </g>
                      );
                    })}
                    
                    {/* 건수 데이터 포인트 */}
                    {monthlyStats.map((month, index) => {
                      const x = 50 + index * stepX;
                      const y = 400 - (month.count / maxCount) * chartHeight;
                      return (
                        <g key={`count-point-${index}`} className="data-point">
                          <circle
                            cx={x}
                            cy={y}
                            r="6"
                            fill="#3b82f6"
                            stroke="white"
                            strokeWidth="3"
                            style={{
                              filter: 'drop-shadow(0 2px 4px rgba(59, 130, 246, 0.3))',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                          />
                          <title>{month.count}건</title>
                        </g>
                      );
                    })}
                    
                    {/* X축 레이블 (월) */}
                    {monthlyStats.map((month, index) => {
                      const x = 50 + index * stepX;
                      return (
                        <text
                          key={`label-${index}`}
                          x={x}
                          y="450"
                          fontSize="19"
                          fill="#666"
                          textAnchor="middle"
                        >
                          {formatMonth(month.month)}
                        </text>
                      );
                    })}
                  </>
                );
              })()}
            </svg>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
            월별 데이터가 없습니다.
          </div>
        )}
        <div className="chart-legend">
          <div className="legend-item">
            <span className="legend-color count-color"></span>
            <span>결재건수 (건)</span>
          </div>
          <div className="legend-item">
            <span className="legend-color amount-color"></span>
            <span>계약금액 (백만원)</span>
          </div>
        </div>
      </div>

      {/* 월별 외주 인력 지출 현황 */}
      <div className="card">
        <h2>월별 외주 인력 지출 현황</h2>
        <p className="stats-description">과거 6개월부터 향후 6개월까지 외주 인력의 월별 지출 금액과 인원 수를 보여줍니다.</p>
        {monthlyPersonnelCost.length > 0 && monthlyPersonnelCost.some(m => (m.cost && m.cost > 0) || (m.count && m.count > 0)) ? (
          <div className="line-chart-container">
            <svg className="line-chart" viewBox="0 0 1000 500" preserveAspectRatio="xMidYMid meet">
              <defs>
                <linearGradient id="personnelCostGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.05" />
                </linearGradient>
                <linearGradient id="personnelCountGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.05" />
                </linearGradient>
                <filter id="shadow">
                  <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
                  <feOffset dx="0" dy="2" result="offsetblur"/>
                  <feComponentTransfer>
                    <feFuncA type="linear" slope="0.2"/>
                  </feComponentTransfer>
                  <feMerge>
                    <feMergeNode/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              
              {[0, 1, 2, 3, 4, 5].map(i => (
                <line
                  key={`grid-${i}`}
                  x1="50"
                  y1={50 + i * 70}
                  x2="950"
                  y2={50 + i * 70}
                  stroke="#e5e7eb"
                  strokeWidth="1"
                  strokeDasharray="5,5"
                  opacity="0.5"
                />
              ))}
              
              <text x="25" y="35" fontSize="20" fill="#f59e0b" fontWeight="600" textAnchor="middle">
                금액
              </text>
              <text x="975" y="35" fontSize="20" fill="#8b5cf6" fontWeight="600" textAnchor="middle">
                인원
              </text>
              <text x="500" y="480" fontSize="20" fill="#666" fontWeight="600" textAnchor="middle">
                월
              </text>
              
              {(() => {
                // 실제 데이터의 최대값 계산
                const actualMaxCost = Math.max(...monthlyPersonnelCost.map(m => m.cost || 0));
                const actualMaxCount = Math.max(...monthlyPersonnelCost.map(m => m.count || 0));
                
                // 데이터가 없으면 기본값 사용 (하지만 이 경우 그래프가 렌더링되지 않아야 함)
                const maxCost = actualMaxCost > 0 ? actualMaxCost : 1;
                const maxCount = actualMaxCount > 0 ? actualMaxCount : 1;
                
                const chartWidth = 900;
                const chartHeight = 350;
                const stepX = chartWidth / (monthlyPersonnelCost.length - 1 || 1);
                
                console.log('📊 그래프 데이터:', {
                  데이터포인트: monthlyPersonnelCost.length,
                  실제최대금액: actualMaxCost.toLocaleString() + '원',
                  실제최대인원: actualMaxCount + '명',
                  사용최대금액: maxCost.toLocaleString() + '원',
                  사용최대인원: maxCount + '명',
                  월별데이터: monthlyPersonnelCost
                });
                
                const costPath = monthlyPersonnelCost.map((month, index) => {
                  const x = 50 + index * stepX;
                  const ratio = month.cost && maxCost > 0 ? month.cost / maxCost : 0;
                  const y = 400 - ratio * chartHeight;
                  // NaN이나 Infinity 체크
                  const safeY = isNaN(y) || !isFinite(y) ? 400 : y;
                  return `${index === 0 ? 'M' : 'L'} ${x} ${safeY}`;
                }).join(' ');
                
                const costAreaPath = `${costPath} L ${50 + (monthlyPersonnelCost.length - 1) * stepX} 400 L 50 400 Z`;
                
                const countPath = monthlyPersonnelCost.map((month, index) => {
                  const x = 50 + index * stepX;
                  const ratio = month.count && maxCount > 0 ? month.count / maxCount : 0;
                  const y = 400 - ratio * chartHeight;
                  // NaN이나 Infinity 체크
                  const safeY = isNaN(y) || !isFinite(y) ? 400 : y;
                  return `${index === 0 ? 'M' : 'L'} ${x} ${safeY}`;
                }).join(' ');
                
                const countAreaPath = `${countPath} L ${50 + (monthlyPersonnelCost.length - 1) * stepX} 400 L 50 400 Z`;
                
                return (
                  <>
                    {[0, 1, 2, 3, 4, 5].map(i => {
                      const value = (maxCost / 5) * (5 - i);
                      const y = 50 + i * 70;
                      let displayValue, unit;
                      
                      // 값이 유효하지 않으면 0으로 표시
                      if (!value || isNaN(value) || value <= 0) {
                        displayValue = '0';
                        unit = '';
                      } else if (maxCost >= 100000000) {
                        // 1억 이상: 억 단위
                        displayValue = (value / 100000000).toFixed(1);
                        unit = '억';
                      } else if (maxCost >= 10000000) {
                        // 1천만 이상: 천만 단위
                        displayValue = Math.round(value / 10000000);
                        unit = '천만';
                      } else if (maxCost >= 1000000) {
                        // 100만 이상: 백만 단위
                        displayValue = Math.round(value / 1000000);
                        unit = '백만';
                      } else {
                        // 그 이하: 만 단위
                        displayValue = Math.round(value / 10000);
                        unit = '만';
                      }
                      
                      return (
                        <text
                          key={`cost-tick-${i}`}
                          x="45"
                          y={y + 4}
                          fontSize="18"
                          fill="#f59e0b"
                          textAnchor="end"
                          fontWeight="500"
                        >
                          {displayValue}{unit}
                        </text>
                      );
                    })}
                    
                    {[0, 1, 2, 3, 4, 5].map(i => {
                      const value = Math.round((maxCount / 5) * (5 - i));
                      const displayValue = isNaN(value) ? 0 : value;
                      const y = 50 + i * 70;
                      return (
                        <text
                          key={`count-tick-${i}`}
                          x="955"
                          y={y + 4}
                          fontSize="18"
                          fill="#8b5cf6"
                          textAnchor="start"
                          fontWeight="500"
                        >
                          {displayValue}명
                        </text>
                      );
                    })}
                  
                    <path d={costAreaPath} fill="url(#personnelCostGradient)" opacity="0.6"/>
                    <path d={countAreaPath} fill="url(#personnelCountGradient)" opacity="0.6"/>
                    <path d={costPath} fill="none" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" filter="url(#shadow)"/>
                    <path d={countPath} fill="none" stroke="#8b5cf6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" filter="url(#shadow)"/>
                    
                    {monthlyPersonnelCost.map((month, index) => {
                      const x = 50 + index * stepX;
                      const ratio = month.cost && maxCost > 0 ? month.cost / maxCost : 0;
                      const y = 400 - ratio * chartHeight;
                      
                      // y 좌표가 유효하지 않으면 건너뛰기
                      if (isNaN(y) || !isFinite(y)) return null;
                      
                      return (
                        <g key={`cost-point-${index}`} className="data-point">
                          <circle cx={x} cy={y} r="6" fill="#f59e0b" stroke="white" strokeWidth="3" style={{ filter: 'drop-shadow(0 2px 4px rgba(245, 158, 11, 0.3))', cursor: 'pointer' }}/>
                          <title>{formatCurrency(month.cost || 0)}</title>
                        </g>
                      );
                    })}
                    
                    {monthlyPersonnelCost.map((month, index) => {
                      const x = 50 + index * stepX;
                      const ratio = month.count && maxCount > 0 ? month.count / maxCount : 0;
                      const y = 400 - ratio * chartHeight;
                      
                      // y 좌표가 유효하지 않으면 건너뛰기
                      if (isNaN(y) || !isFinite(y)) return null;
                      
                      return (
                        <g key={`count-point-${index}`} className="data-point">
                          <circle cx={x} cy={y} r="6" fill="#8b5cf6" stroke="white" strokeWidth="3" style={{ filter: 'drop-shadow(0 2px 4px rgba(139, 92, 246, 0.3))', cursor: 'pointer' }}/>
                          <title>{month.count || 0}명</title>
                        </g>
                      );
                    })}
                    
                    {monthlyPersonnelCost.map((month, index) => {
                      const x = 50 + index * stepX;
                      const today = new Date();
                      const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
                      const isCurrentMonth = month.month === currentMonthKey;
                      
                      return (
                        <g key={`label-${index}`}>
                          {/* 현재 월 표시 세로선 */}
                          {isCurrentMonth && (
                            <>
                              <line
                                x1={x}
                                y1="50"
                                x2={x}
                                y2="400"
                                stroke="#f59e0b"
                                strokeWidth="2"
                                strokeDasharray="5,5"
                                opacity="0.5"
                              />
                              <text
                                x={x}
                                y="40"
                                fontSize="18"
                                fill="#f59e0b"
                                fontWeight="bold"
                                textAnchor="middle"
                              >
                                ▼ 현재
                              </text>
                            </>
                          )}
                          <text 
                            x={x} 
                            y="450" 
                            fontSize="19" 
                            fill={isCurrentMonth ? "#f59e0b" : "#666"}
                            fontWeight={isCurrentMonth ? "bold" : "normal"}
                            textAnchor="middle"
                          >
                            {formatMonth(month.month)}
                          </text>
                        </g>
                      );
                    })}
                  </>
                );
              })()}
            </svg>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
            월별 외주 인력 데이터가 없습니다.
          </div>
        )}
        <div className="chart-legend">
          <div className="legend-item">
            <span className="legend-color personnel-count-color"></span>
            <span>외주 인원 (명)</span>
          </div>
          <div className="legend-item">
            <span className="legend-color personnel-cost-color"></span>
            <span>지출 금액 (원)</span>
          </div>
        </div>
      </div>
      </div>

      {/* 사업별 계약 진행 현황 */}
      <div className="card">
        <h2>사업별 계약 진행 현황</h2>
        <p className="stats-description">각 사업의 품의서 작성 및 결재 진행 상황을 확인할 수 있습니다.</p>
        <div className="table-responsive">
          <table className="contract-progress-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                <th rowSpan="2" style={{ border: '1px solid #dee2e6', padding: '12px', textAlign: 'center', fontWeight: '600', minWidth: '200px' }}>
                  사업명
                </th>
                <th rowSpan="2" style={{ border: '1px solid #dee2e6', padding: '12px', textAlign: 'center', fontWeight: '600', minWidth: '100px', backgroundColor: '#fce4ec' }}>
                  상태
                </th>
                <th colSpan="3" style={{ border: '1px solid #dee2e6', padding: '12px', textAlign: 'center', fontWeight: '600', backgroundColor: '#e3f2fd' }}>
                  추진품의서
                </th>
                <th colSpan="3" style={{ border: '1px solid #dee2e6', padding: '12px', textAlign: 'center', fontWeight: '600', backgroundColor: '#fff3e0' }}>
                  입찰실시 품의서
                </th>
                <th colSpan="3" style={{ border: '1px solid #dee2e6', padding: '12px', textAlign: 'center', fontWeight: '600', backgroundColor: '#f3e5f5' }}>
                  입찰결과보고 품의
                </th>
                <th rowSpan="2" style={{ border: '1px solid #dee2e6', padding: '12px', textAlign: 'center', fontWeight: '600', backgroundColor: '#e8f5e9', minWidth: '250px' }}>
                  구매/용역/변경/연장 계약
                </th>
              </tr>
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                <th style={{ border: '1px solid #dee2e6', padding: '8px', textAlign: 'center', fontSize: '0.85rem', backgroundColor: '#e3f2fd' }}>작성여부</th>
                <th style={{ border: '1px solid #dee2e6', padding: '8px', textAlign: 'center', fontSize: '0.85rem', backgroundColor: '#e3f2fd' }}>작성일자</th>
                <th style={{ border: '1px solid #dee2e6', padding: '8px', textAlign: 'center', fontSize: '0.85rem', backgroundColor: '#e3f2fd' }}>결재일자</th>
                <th style={{ border: '1px solid #dee2e6', padding: '8px', textAlign: 'center', fontSize: '0.85rem', backgroundColor: '#fff3e0' }}>작성여부</th>
                <th style={{ border: '1px solid #dee2e6', padding: '8px', textAlign: 'center', fontSize: '0.85rem', backgroundColor: '#fff3e0' }}>작성일자</th>
                <th style={{ border: '1px solid #dee2e6', padding: '8px', textAlign: 'center', fontSize: '0.85rem', backgroundColor: '#fff3e0' }}>결재일자</th>
                <th style={{ border: '1px solid #dee2e6', padding: '8px', textAlign: 'center', fontSize: '0.85rem', backgroundColor: '#f3e5f5' }}>작성여부</th>
                <th style={{ border: '1px solid #dee2e6', padding: '8px', textAlign: 'center', fontSize: '0.85rem', backgroundColor: '#f3e5f5' }}>작성일자</th>
                <th style={{ border: '1px solid #dee2e6', padding: '8px', textAlign: 'center', fontSize: '0.85rem', backgroundColor: '#f3e5f5' }}>결재일자</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                console.log('📊 사업예산 목록:', businessBudgets.length);
                console.log('📊 전체 결재완료 품의서 수:', allApprovedProposals.length);
                
                // 사업예산이 없는 경우 메시지 표시
                if (businessBudgets.length === 0) {
                  return (
                    <tr>
                      <td colSpan="12" style={{ border: '1px solid #dee2e6', padding: '2rem', textAlign: 'center', color: '#666' }}>
                        등록된 사업예산이 없습니다.
                      </td>
                    </tr>
                  );
                }
                
                // 계약 유형 한글명 반환 함수
                const getContractTypeName = (type) => {
                  switch(type) {
                    case 'purchase': return '구매';
                    case 'service': return '용역';
                    case 'change': return '변경';
                    case 'extension': return '연장';
                    default: return type;
                  }
                };
                
                // 사업예산을 연도순, 사업명순으로 정렬
                const sortedBudgets = [...businessBudgets].sort((a, b) => {
                  if (a.budget_year !== b.budget_year) {
                    return b.budget_year - a.budget_year; // 연도 내림차순
                  }
                  return (a.project_name || '').localeCompare(b.project_name || ''); // 사업명 오름차순
                });
                
                // 각 사업예산별로 관련 품의서 찾기
                return sortedBudgets.map((budget) => {
                  const budgetId = budget.id;
                  const budgetYear = budget.budget_year;
                  const projectName = budget.project_name;
                  const budgetAmount = budget.budget_amount || budget.budgetAmount || 0;
                  const budgetStatus = budget.status || '미지정';
                  
                  // 해당 사업예산에 연결된 품의서들 찾기
                  const relatedProposals = allApprovedProposals.filter(p => p.budgetId === budgetId);
                  
                  console.log(`📋 ${projectName} (${budgetYear}년) - 예산: ${budgetAmount}원 - 연결된 품의서: ${relatedProposals.length}건`);
                  
                  // 품의서 분류
                  let 추진품의서 = null;
                  let 입찰실시품의서 = null;
                  let 입찰결과보고품의 = null;
                  const 일반계약목록 = [];
                  
                  relatedProposals.forEach(proposal => {
                    const contractMethod = proposal.contractMethod || '';
                    const contractType = proposal.contractType;
                    
                    // 추진품의 템플릿 사용
                    if (contractMethod.includes('추진품의')) {
                      추진품의서 = proposal;
                    } 
                    // 입찰실시 품의서 템플릿 사용
                    else if (contractMethod.includes('입찰 실시') || contractMethod.includes('입찰실시')) {
                      입찰실시품의서 = proposal;
                    }
                    // 입찰결과보고 품의 템플릿 사용
                    else if (contractMethod.includes('입찰결과') || contractMethod.includes('입찰 결과') || contractMethod.includes('결과보고') || contractMethod.includes('결과 보고')) {
                      입찰결과보고품의 = proposal;
                    }
                    
                    // 구매/용역/변경/연장 계약 (일반 계약)
                    if (['purchase', 'service', 'change', 'extension'].includes(contractType)) {
                      일반계약목록.push({
                        id: proposal.id,
                        type: contractType,
                        title: proposal.title,
                        totalAmount: proposal.totalAmount,
                        createdAt: proposal.createdAt,
                        approvalDate: proposal.approvalDate
                      });
                    }
                  });
                  
                  // 상태별 색상
                  const getStatusColor = (status) => {
                    switch(status) {
                      case '진행중': return { bg: '#e8f5e9', text: '#2e7d32' };
                      case '완료': return { bg: '#e3f2fd', text: '#1565c0' };
                      case '보류': return { bg: '#fff3e0', text: '#e65100' };
                      case '취소': return { bg: '#ffebee', text: '#c62828' };
                      default: return { bg: '#f5f5f5', text: '#757575' };
                    }
                  };
                  
                  const statusColor = getStatusColor(budgetStatus);
                  
                  return (
                    <tr key={budget.id}>
                      <td style={{ border: '1px solid #dee2e6', padding: '12px', fontWeight: '500' }}>
                        <div style={{ marginBottom: '4px' }}>
                          <span style={{ 
                            display: 'inline-block',
                            padding: '2px 8px',
                            backgroundColor: '#667eea',
                            color: 'white',
                            borderRadius: '4px',
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            marginRight: '8px'
                          }}>
                            {budgetYear}년
                          </span>
                          {projectName}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '4px' }}>
                          예산: {budgetAmount ? new Intl.NumberFormat('ko-KR').format(budgetAmount) : '0'}원
                        </div>
                      </td>
                      
                      {/* 상태 */}
                      <td style={{ border: '1px solid #dee2e6', padding: '8px', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 12px',
                          backgroundColor: statusColor.bg,
                          color: statusColor.text,
                          borderRadius: '12px',
                          fontSize: '0.85rem',
                          fontWeight: '600'
                        }}>
                          {budgetStatus}
                        </span>
                      </td>
                      
                      {/* 추진품의서 */}
                      <td style={{ border: '1px solid #dee2e6', padding: '8px', textAlign: 'center' }}>
                        {추진품의서 ? (
                          <span style={{ color: '#10b981', fontWeight: '600', fontSize: '1.2rem' }}>✓</span>
                        ) : (
                          <span style={{ color: '#e5e7eb', fontSize: '1.2rem' }}>-</span>
                        )}
                      </td>
                      <td style={{ border: '1px solid #dee2e6', padding: '8px', textAlign: 'center', fontSize: '0.85rem' }}>
                        {추진품의서?.createdAt ? new Date(추진품의서.createdAt).toLocaleDateString('ko-KR') : '-'}
                      </td>
                      <td style={{ border: '1px solid #dee2e6', padding: '8px', textAlign: 'center', fontSize: '0.85rem' }}>
                        {추진품의서?.approvalDate ? new Date(추진품의서.approvalDate).toLocaleDateString('ko-KR') : '-'}
                      </td>
                      
                      {/* 입찰실시 품의서 */}
                      <td style={{ border: '1px solid #dee2e6', padding: '8px', textAlign: 'center' }}>
                        {입찰실시품의서 ? (
                          <span style={{ color: '#10b981', fontWeight: '600', fontSize: '1.2rem' }}>✓</span>
                        ) : (
                          <span style={{ color: '#e5e7eb', fontSize: '1.2rem' }}>-</span>
                        )}
                      </td>
                      <td style={{ border: '1px solid #dee2e6', padding: '8px', textAlign: 'center', fontSize: '0.85rem' }}>
                        {입찰실시품의서?.createdAt ? new Date(입찰실시품의서.createdAt).toLocaleDateString('ko-KR') : '-'}
                      </td>
                      <td style={{ border: '1px solid #dee2e6', padding: '8px', textAlign: 'center', fontSize: '0.85rem' }}>
                        {입찰실시품의서?.approvalDate ? new Date(입찰실시품의서.approvalDate).toLocaleDateString('ko-KR') : '-'}
                      </td>
                      
                      {/* 입찰결과보고 품의 */}
                      <td style={{ border: '1px solid #dee2e6', padding: '8px', textAlign: 'center' }}>
                        {입찰결과보고품의 ? (
                          <span style={{ color: '#10b981', fontWeight: '600', fontSize: '1.2rem' }}>✓</span>
                        ) : (
                          <span style={{ color: '#e5e7eb', fontSize: '1.2rem' }}>-</span>
                        )}
                      </td>
                      <td style={{ border: '1px solid #dee2e6', padding: '8px', textAlign: 'center', fontSize: '0.85rem' }}>
                        {입찰결과보고품의?.createdAt ? new Date(입찰결과보고품의.createdAt).toLocaleDateString('ko-KR') : '-'}
                      </td>
                      <td style={{ border: '1px solid #dee2e6', padding: '8px', textAlign: 'center', fontSize: '0.85rem' }}>
                        {입찰결과보고품의?.approvalDate ? new Date(입찰결과보고품의.approvalDate).toLocaleDateString('ko-KR') : '-'}
                      </td>
                      
                      {/* 구매/용역/변경/연장 계약 요약 */}
                      <td style={{ border: '1px solid #dee2e6', padding: '12px', backgroundColor: '#f9fbe7', textAlign: 'center' }}>
                        {일반계약목록.length > 0 ? (
                          <div 
                            onClick={() => handleOpenContractPopup(일반계약목록, {
                              year: budgetYear,
                              projectName: projectName,
                              budgetAmount: budgetAmount
                            })}
                            style={{
                              cursor: 'pointer',
                              padding: '8px',
                              borderRadius: '6px',
                              transition: 'all 0.2s',
                              backgroundColor: '#fff'
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.backgroundColor = '#e8f5e9';
                              e.currentTarget.style.transform = 'scale(1.02)';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.backgroundColor = '#fff';
                              e.currentTarget.style.transform = 'scale(1)';
                            }}
                          >
                            <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#4CAF50', marginBottom: '4px' }}>
                              {일반계약목록.length}건
                            </div>
                            <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#333' }}>
                              {new Intl.NumberFormat('ko-KR').format(
                                일반계약목록.reduce((sum, c) => sum + (c.totalAmount || 0), 0)
                              )}원
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '4px' }}>
                              📋 클릭하여 상세보기
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: '#999' }}>-</span>
                        )}
                      </td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
      </div>

      {/* 일반계약 상세 팝업 */}
      {showContractPopup && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
          }}
          onClick={handleCloseContractPopup}
        >
          <div 
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '800px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto',
              boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0, color: '#333', fontSize: '1.5rem' }}>
                  일반 계약 상세 목록
                </h3>
                <p style={{ margin: '8px 0 0 0', color: '#666', fontSize: '0.9rem' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    backgroundColor: '#667eea',
                    color: 'white',
                    borderRadius: '4px',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    marginRight: '8px'
                  }}>
                    {selectedProjectInfo.year}년
                  </span>
                  {selectedProjectInfo.projectName}
                </p>
              </div>
              <button
                onClick={handleCloseContractPopup}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#999',
                  padding: '4px 8px'
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              {selectedContracts.map((contract, idx) => (
                <div 
                  key={contract.id}
                  style={{
                    padding: '16px',
                    marginBottom: '12px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                    border: '1px solid #e0e0e0'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 12px',
                      backgroundColor: contract.type === 'purchase' ? '#2196F3' :
                                      contract.type === 'service' ? '#4CAF50' :
                                      contract.type === 'change' ? '#FF9800' : '#9C27B0',
                      color: 'white',
                      borderRadius: '4px',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      minWidth: '50px',
                      textAlign: 'center'
                    }}>
                      {(() => {
                        switch(contract.type) {
                          case 'purchase': return '구매';
                          case 'service': return '용역';
                          case 'change': return '변경';
                          case 'extension': return '연장';
                          default: return contract.type;
                        }
                      })()}
                    </span>
                    <span style={{ fontSize: '1.1rem', fontWeight: '600', color: '#333', flex: 1 }}>
                      {contract.title || '품의서'}
                    </span>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.9rem' }}>
                    <div style={{ color: '#666' }}>
                      <strong style={{ color: '#333' }}>계약금액:</strong> {new Intl.NumberFormat('ko-KR').format(contract.totalAmount || 0)}원
                    </div>
                    <div style={{ color: '#666' }}>
                      <strong style={{ color: '#333' }}>작성일:</strong> {contract.createdAt ? new Date(contract.createdAt).toLocaleDateString('ko-KR') : '-'}
                    </div>
                    <div style={{ color: '#666' }}>
                      <strong style={{ color: '#333' }}>결재일:</strong> {contract.approvalDate ? new Date(contract.approvalDate).toLocaleDateString('ko-KR') : '-'}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{
              borderTop: '2px solid #4CAF50',
              paddingTop: '16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#4CAF50' }}>
                총 {selectedContracts.length}건
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#333' }}>
                합계: {new Intl.NumberFormat('ko-KR').format(
                  selectedContracts.reduce((sum, c) => sum + (c.totalAmount || 0), 0)
                )}원
              </div>
            </div>

            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <button
                onClick={handleCloseContractPopup}
                style={{
                  padding: '10px 24px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '500'
                }}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 외주인력 현황 */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h2 style={{ marginBottom: '0.5rem' }}>외주인력 현황</h2>
            <p className="stats-description">
              전체 외주인력 현황을 표시합니다. 
              (전체 {outsourcingPersonnel.length}명 / 재직중 {getActivePersonnel().length}명 / 종료 {outsourcingPersonnel.length - getActivePersonnel().length}명)
            </p>
            <p className="stats-description" style={{ marginTop: '0.5rem', fontSize: '1rem', fontWeight: '600', color: '#667eea' }}>
              💰 재직중 인력 월 단가 합계: {formatCurrency(
                getActivePersonnel().reduce((sum, person) => sum + parseFloat(person.monthlyRate || 0), 0)
              )}/월
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button 
              onClick={handleExcelDownload}
              className="excel-download-btn"
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '500',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#059669'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#10b981'}
            >
              📊 엑셀 다운로드
            </button>
            {sortConfig.key && (
              <button 
                onClick={resetSort}
                className="reset-sort-btn"
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#5a6268'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#6c757d'}
              >
                🔄 정렬 초기화
              </button>
            )}
          </div>
        </div>
        <div className="table-responsive-personnel">
          <table className="outsourcing-table">
            <thead>
              <tr>
                <th style={{ width: '60px', textAlign: 'center' }}>순번</th>
                <th 
                  onClick={() => handleSort('name')}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                  className="sortable-header"
                >
                  성명 {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                </th>
                <th 
                  onClick={() => handleSort('skillLevel')}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                  className="sortable-header"
                >
                  기술등급 {sortConfig.key === 'skillLevel' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                </th>
                <th 
                  onClick={() => handleSort('department')}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                  className="sortable-header"
                >
                  요청부서 {sortConfig.key === 'department' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                </th>
                <th 
                  onClick={() => handleSort('purpose')}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                  className="sortable-header"
                >
                  사업목적 {sortConfig.key === 'purpose' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                </th>
                <th 
                  onClick={() => handleSort('period')}
                  style={{ textAlign: 'center', cursor: 'pointer', userSelect: 'none' }}
                  className="sortable-header"
                >
                  계약기간 {sortConfig.key === 'period' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                </th>
                <th 
                  onClick={() => handleSort('monthlyRate')}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                  className="sortable-header"
                >
                  월 단가 {sortConfig.key === 'monthlyRate' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                </th>
                <th 
                  onClick={() => handleSort('startDate')}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                  className="sortable-header"
                >
                  시작일 {sortConfig.key === 'startDate' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                </th>
                <th 
                  onClick={() => handleSort('endDate')}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                  className="sortable-header"
                >
                  종료일 {sortConfig.key === 'endDate' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                </th>
                <th 
                  onClick={() => handleSort('supplier')}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                  className="sortable-header"
                >
                  공급업체 {sortConfig.key === 'supplier' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                </th>
                <th 
                  onClick={() => handleSort('workStatus')}
                  style={{ textAlign: 'center', cursor: 'pointer', userSelect: 'none' }}
                  className="sortable-header"
                >
                  재직여부 {sortConfig.key === 'workStatus' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                </th>
              </tr>
            </thead>
            <tbody>
              {getSortedPersonnel().length > 0 ? (
                getSortedPersonnel().map((person, index) => {
                  const skillColor = getSkillLevelColor(person.skillLevel);
                  return (
                    <tr 
                      key={index}
                      onClick={() => handlePersonnelClick(person.proposalId)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td style={{ textAlign: 'center' }}>{index + 1}</td>
                      <td>
                        <span style={{ fontWeight: 600, color: '#333' }}>
                          {person.name}
                        </span>
                      </td>
                      <td>
                        <span 
                          className="skill-badge"
                          style={{
                            background: skillColor.background,
                            color: skillColor.color,
                            boxShadow: `0 2px 4px ${skillColor.shadow}`
                          }}
                        >
                          {person.skillLevel}
                        </span>
                      </td>
                      <td>{person.department}</td>
                      <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {person.purpose}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ fontWeight: 500 }}>
                          {person.period}개월
                        </span>
                      </td>
                      <td className="amount-cell">{formatCurrency(person.monthlyRate)}/월</td>
                      <td>{person.startDate ? person.startDate.toLocaleDateString('ko-KR') : '-'}</td>
                      <td>{person.endDate ? person.endDate.toLocaleDateString('ko-KR') : '-'}</td>
                      <td>{person.supplier}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={
                          person.workStatus === 'working' ? "status-active" : 
                          person.workStatus === 'notStarted' ? "status-pending" : 
                          "status-inactive"
                        }>
                          {person.workStatus === 'working' ? '재직중' : 
                           person.workStatus === 'notStarted' ? '시작전' : 
                           '종료'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="11" style={{ textAlign: 'center', color: '#666', fontStyle: 'italic' }}>
                    외주인력이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style jsx="true">{`
        .dashboard h1 {
          margin-bottom: 2rem;
          color: #333;
          font-size: 2rem;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .charts-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .stat-card {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          padding: 0.8rem 1rem;
          background: white;
          border-radius: 8px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.1);
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .stat-card:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 6px rgba(0,0,0,0.15);
        }

        .stat-card.approved {
          border-left: 3px solid #28a745;
        }

        .stat-card.draft {
          border-left: 3px solid #ffc107;
        }

        .stat-card.personnel-active {
          border-left: 3px solid #10b981;
          background: linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%);
        }

        .stat-card.personnel-expiring {
          border-left: 3px solid #f59e0b;
          background: linear-gradient(135deg, #ffffff 0%, #fffbeb 100%);
        }

        .stat-icon {
          font-size: 1.8rem;
          min-width: 40px;
          text-align: center;
        }

        .stat-content {
          flex: 1;
        }

        .stat-number {
          font-size: 1.5rem;
          font-weight: bold;
          color: #333;
          margin-bottom: 0.2rem;
          line-height: 1;
        }

        .stat-label {
          color: #666;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .card {
          background: white;
          padding: 1rem 1.5rem;
          border-radius: 12px;
          margin-bottom: 2rem;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .card h2 {
          margin-bottom: 0.5rem;
          color: #333;
          font-size: 1.5rem;
        }

        .stats-description {
          color: #666;
          font-size: 0.9rem;
          margin-bottom: 0.75rem;
        }

        .monthly-chart {
          display: flex;
          justify-content: space-around;
          align-items: flex-end;
          height: 350px;
          padding: 1rem;
          background: #f8f9fa;
          border-radius: 8px;
          margin-bottom: 1rem;
          overflow-x: auto;
        }

        .month-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          min-width: 100px;
          flex: 1;
          max-width: 150px;
        }

        .bars-wrapper {
          display: flex;
          gap: 8px;
          align-items: flex-end;
          height: 280px;
          margin-bottom: 0.5rem;
        }

        .bar-group {
          display: flex;
          flex-direction: column;
          align-items: center;
          height: 100%;
        }

        .bar {
          width: 35px;
          border-radius: 4px 4px 0 0;
          transition: all 0.3s ease;
          position: relative;
          min-height: 30px;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding-top: 8px;
        }

        .count-bar {
          background: linear-gradient(180deg, #4a90e2 0%, #357abd 100%);
          box-shadow: 0 2px 4px rgba(74, 144, 226, 0.3);
        }

        .amount-bar {
          background: linear-gradient(180deg, #5cb85c 0%, #449d44 100%);
          box-shadow: 0 2px 4px rgba(92, 184, 92, 0.3);
        }

        .bar:hover {
          opacity: 0.9;
          transform: scaleY(1.03);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }

        .bar-value {
          font-size: 0.75rem;
          font-weight: 700;
          color: white;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        }

        .bar-label {
          margin-top: 4px;
          font-size: 0.7rem;
          color: #666;
          font-weight: 500;
        }

        .month-label {
          margin-top: 0.5rem;
          font-size: 0.8rem;
          color: #333;
          text-align: center;
          white-space: nowrap;
          font-weight: 600;
        }

        .chart-legend {
          display: flex;
          justify-content: center;
          gap: 2rem;
          padding-top: 1rem;
          border-top: 1px solid #e9ecef;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9rem;
          color: #666;
          font-weight: 500;
        }

        .legend-color {
          width: 20px;
          height: 12px;
          border-radius: 2px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
        }

        .amount-color {
          background: linear-gradient(90deg, #10b981 0%, #059669 100%);
        }

        .count-color {
          background: linear-gradient(90deg, #3b82f6 0%, #2563eb 100%);
        }

        .personnel-cost-color {
          background: linear-gradient(90deg, #f59e0b 0%, #d97706 100%);
        }

        .personnel-count-color {
          background: linear-gradient(90deg, #8b5cf6 0%, #7c3aed 100%);
        }
        
        .line-chart-container {
          background: linear-gradient(to bottom, #f8fafc 0%, #ffffff 100%);
          padding: 0.5rem;
          border-radius: 12px;
          box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.05);
        }
        
        .line-chart {
          width: 100%;
          height: auto;
        }
        
        .line-chart .data-point circle:hover {
          r: 8;
          stroke-width: 4;
        }

        .table-responsive {
          overflow-x: auto;
        }

        .table {
          width: 100%;
          border-collapse: collapse;
        }

        .table th,
        .table td {
          padding: 1rem;
          text-align: left;
          border-bottom: 1px solid #e9ecef;
        }

        .table th {
          background: #f8f9fa;
          font-weight: 600;
          color: #333;
          font-size: 0.9rem;
        }

        .table tbody tr:hover {
          background: #f8f9fa;
        }

        .table-responsive-personnel {
          overflow-x: auto;
          max-height: 600px;
          overflow-y: auto;
          border-radius: 8px;
        }

        .outsourcing-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.9rem;
        }

        .outsourcing-table thead {
          background: #f8f9fa;
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .outsourcing-table thead th {
          background: #f8f9fa;
          padding: 0.75rem 1rem;
          text-align: left;
          font-weight: 600;
          color: #495057;
          border-bottom: 2px solid #dee2e6;
          white-space: nowrap;
        }

        .outsourcing-table tbody td {
          padding: 0.75rem 1rem;
          border-bottom: 1px solid #e9ecef;
          color: #495057;
        }

        .outsourcing-table tbody tr {
          transition: background-color 0.2s, transform 0.1s;
          cursor: pointer;
        }

        .outsourcing-table tbody tr:hover {
          background: #e3f2fd;
          transform: scale(1.002);
        }

        .outsourcing-table tbody tr:active {
          background: #bbdefb;
        }

        .sortable-header {
          cursor: pointer;
          user-select: none;
          transition: background-color 0.2s;
          position: relative;
          padding-right: 1.5rem;
        }

        .sortable-header:hover {
          background-color: #e2e6ea !important;
        }

        .sortable-header:active {
          background-color: #dae0e5 !important;
        }

        .contract-type-badge {
          background: #e9ecef;
          color: #495057;
          padding: 0.35rem 0.75rem;
          border-radius: 12px;
          font-size: 0.85rem;
          font-weight: 500;
          display: inline-block;
        }

        .skill-badge {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 0.35rem 0.75rem;
          border-radius: 12px;
          font-size: 0.85rem;
          font-weight: 600;
          display: inline-block;
          box-shadow: 0 2px 4px rgba(102, 126, 234, 0.3);
        }

        .status-active {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          padding: 0.35rem 0.75rem;
          border-radius: 12px;
          font-size: 0.85rem;
          font-weight: 600;
          display: inline-block;
          box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);
        }

        .status-pending {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: white;
          padding: 0.35rem 0.75rem;
          border-radius: 12px;
          font-size: 0.85rem;
          font-weight: 600;
          display: inline-block;
          box-shadow: 0 2px 4px rgba(245, 158, 11, 0.3);
        }

        .status-inactive {
          background: #e9ecef;
          color: #6c757d;
          padding: 0.35rem 0.75rem;
          border-radius: 12px;
          font-size: 0.85rem;
          font-weight: 600;
          display: inline-block;
        }

        .amount-cell {
          font-weight: 600;
          color: #667eea;
        }

        .loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          text-align: center;
        }

        .spinner {
          width: 50px;
          height: 50px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-top: 1rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .charts-grid {
            grid-template-columns: 1fr;
          }
          
          .dashboard h1 {
            font-size: 1.5rem;
          }

          .monthly-chart {
            height: 300px;
            padding: 0.5rem;
          }

          .bars-wrapper {
            height: 220px;
            gap: 5px;
          }

          .bar {
            width: 28px;
          }

          .month-item {
            min-width: 80px;
          }

          .month-label {
            font-size: 0.7rem;
          }

          .bar-value {
            font-size: 0.7rem;
          }

          .bar-label {
            font-size: 0.65rem;
          }

          .table th,
          .table td {
            padding: 0.5rem;
            font-size: 0.85rem;
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard; 