import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getApiUrl } from '../config/api';
import { generatePreviewHTML } from '../utils/previewGenerator';
import './BudgetProposalsView.css';

const API_BASE_URL = getApiUrl();

const BudgetProposalsView = () => {
  const [searchParams] = useSearchParams();
  const budgetId = searchParams.get('budgetId');
  const budgetName = searchParams.get('budgetName');
  
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  useEffect(() => {
    if (budgetId) {
      fetchProposals();
    }
  }, [budgetId]);

  const fetchProposals = async () => {
    setLoading(true);
    try {
      console.log('품의서 조회 API 호출:', `${API_BASE_URL}/api/proposals?budgetId=${budgetId}&status=approved`);
      const response = await fetch(`${API_BASE_URL}/api/proposals?budgetId=${budgetId}&status=approved`);
      
      if (response.ok) {
        const data = await response.json();
        const proposalsList = Array.isArray(data) ? data : (data.proposals || []);
        console.log('품의서 리스트:', proposalsList);
        setProposals(proposalsList);
      } else {
        console.error('품의서 조회 실패');
      }
    } catch (error) {
      console.error('품의서 조회 오류:', error);
    } finally {
      setLoading(false);
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

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return ' ⇅';
    }
    return sortConfig.direction === 'asc' ? ' ↑' : ' ↓';
  };

  const getSortedProposals = () => {
    if (!sortConfig.key) return proposals;

    return [...proposals].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue === bValue) return 0;

      // 숫자 비교
      if (sortConfig.key === 'totalAmount') {
        const aNum = parseFloat(aValue) || 0;
        const bNum = parseFloat(bValue) || 0;
        return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum;
      }

      // 날짜 비교
      if (sortConfig.key === 'createdAt' || sortConfig.key === 'approvalDate') {
        const aDate = new Date(aValue || 0);
        const bDate = new Date(bValue || 0);
        return sortConfig.direction === 'asc' ? aDate - bDate : bDate - aDate;
      }

      // 문자열 비교
      const aStr = String(aValue || '').toLowerCase();
      const bStr = String(bValue || '').toLowerCase();
      if (sortConfig.direction === 'asc') {
        return aStr.localeCompare(bStr);
      }
      return bStr.localeCompare(aStr);
    });
  };

  // 품의서 미리보기
  const handleProposalPreview = (proposal) => {
    try {
      const previewHTML = generatePreviewHTML(proposal);
      const previewWindow = window.open('', '_blank', 'width=1200,height=800');
      if (previewWindow) {
        previewWindow.document.write(previewHTML);
        previewWindow.document.close();
      }
    } catch (error) {
      console.error('미리보기 생성 오류:', error);
      alert('미리보기를 생성할 수 없습니다.');
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('ko-KR').format(value);
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      'draft': '임시저장',
      'submitted': '결재대기',
      'approved': '결재완료',
      'rejected': '반려',
      'cancelled': '취소'
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status) => {
    const colorMap = {
      'draft': '#6c757d',
      'submitted': '#007bff',
      'approved': '#28a745',
      'rejected': '#dc3545',
      'cancelled': '#6c757d'
    };
    return colorMap[status] || '#6c757d';
  };

  const getContractType = (proposal) => {
    if (proposal.contractType === 'purchase') return '구매계약';
    if (proposal.contractType === 'service') return '용역계약';
    if (proposal.contractType === 'change') return '변경계약';
    if (proposal.contractType === 'extension') return '연장계약';
    if (proposal.contractType === 'bidding') return '입찰계약';
    if (proposal.contractType === 'freeform') {
      if (proposal.contractMethod && 
          /[가-힣]/.test(proposal.contractMethod) && 
          !proposal.contractMethod.includes('_')) {
        return proposal.contractMethod;
      }
      return '기타';
    }
    return '기타';
  };

  return (
    <div className="budget-proposals-view">
      <div className="header">
        <div className="header-content">
          <h1>📋 품의서 조회</h1>
          <h2>{decodeURIComponent(budgetName || '사업예산')}</h2>
        </div>
        <button 
          className="btn-close-window" 
          onClick={() => window.close()}
          title="창 닫기"
        >
          ✕
        </button>
      </div>

      <div className="content">
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>품의서를 불러오는 중...</p>
          </div>
        ) : proposals.length === 0 ? (
          <div className="no-data">
            <span className="icon">📭</span>
            <p>해당 사업예산과 연결된 품의서가 없습니다.</p>
          </div>
        ) : (
          <>
            <div className="summary">
              <span className="count">총 {proposals.length}건</span>
            </div>
            <div className="table-container">
              <table className="proposals-table">
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}>번호</th>
                    <th 
                      style={{ cursor: 'pointer', minWidth: '250px' }}
                      onClick={() => handleSort('title')}
                    >
                      품의서명{getSortIcon('title')}
                    </th>
                    <th 
                      style={{ cursor: 'pointer', width: '120px' }}
                      onClick={() => handleSort('contractType')}
                    >
                      계약유형{getSortIcon('contractType')}
                    </th>
                    <th 
                      style={{ cursor: 'pointer', width: '150px', textAlign: 'right' }}
                      onClick={() => handleSort('totalAmount')}
                    >
                      계약금액{getSortIcon('totalAmount')}
                    </th>
                    <th 
                      style={{ cursor: 'pointer', width: '100px' }}
                      onClick={() => handleSort('status')}
                    >
                      상태{getSortIcon('status')}
                    </th>
                    <th 
                      style={{ cursor: 'pointer', width: '120px' }}
                      onClick={() => handleSort('createdBy')}
                    >
                      작성자{getSortIcon('createdBy')}
                    </th>
                    <th 
                      style={{ cursor: 'pointer', width: '120px' }}
                      onClick={() => handleSort('createdAt')}
                    >
                      작성일{getSortIcon('createdAt')}
                    </th>
                    <th 
                      style={{ cursor: 'pointer', width: '120px' }}
                      onClick={() => handleSort('approvalDate')}
                    >
                      결재일{getSortIcon('approvalDate')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {getSortedProposals().map((proposal, index) => (
                    <tr 
                      key={proposal.id}
                      onClick={() => handleProposalPreview(proposal)}
                      className="proposal-row"
                    >
                      <td style={{ textAlign: 'center' }}>{index + 1}</td>
                      <td className="title-cell">{proposal.title}</td>
                      <td style={{ textAlign: 'center' }}>{getContractType(proposal)}</td>
                      <td className="amount-cell">{formatCurrency(parseFloat(proposal.totalAmount) || 0)}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span 
                          className="status-badge"
                          style={{
                            backgroundColor: getStatusColor(proposal.status) + '20',
                            color: getStatusColor(proposal.status)
                          }}
                        >
                          {getStatusLabel(proposal.status)}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>{proposal.createdBy || '-'}</td>
                      <td style={{ textAlign: 'center' }}>{new Date(proposal.createdAt).toLocaleDateString('ko-KR')}</td>
                      <td style={{ textAlign: 'center' }}>
                        {proposal.approvalDate ? new Date(proposal.approvalDate).toLocaleDateString('ko-KR') : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BudgetProposalsView;

