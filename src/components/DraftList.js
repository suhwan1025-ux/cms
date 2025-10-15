import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { generatePreviewHTML, formatNumberWithComma, formatCurrency } from '../utils/previewGenerator';
import { getApiUrl } from '../config/api';
import * as XLSX from 'xlsx';

// API 베이스 URL 설정
const API_BASE_URL = getApiUrl();

const DraftList = () => {
  const location = useLocation();
  const [drafts, setDrafts] = useState([]);
  const [filteredDrafts, setFilteredDrafts] = useState([]);

  const [selectedDrafts, setSelectedDrafts] = useState([]); // 다중선택된 품의서들
  const [selectAll, setSelectAll] = useState(false); // 전체선택 상태
  
  // 필터 상태
  const [filters, setFilters] = useState({
    type: 'all',
    keyword: ''
  });

  // 필터 옵션들
  const typeOptions = ['전체', '구매계약', '용역계약', '변경계약', '연장계약', '입찰계약'];

  // 품의서 데이터를 가져오는 함수
  const fetchDrafts = async () => {
    try {
      // 작성중인 품의서만 조회 (isDraft=true)
      const response = await fetch(`${API_BASE_URL}/api/proposals?isDraft=true`);
      
      if (!response.ok) {
        throw new Error('API 호출 실패');
      }
      
      const proposals = await response.json();
      
      // 백엔드에서 이미 작성중인 품의서만 조회하므로 프론트에서는 필터링 불필요
      const draftProposals = proposals;
      
      // API 데이터를 화면에 맞는 형태로 변환
      const formattedDrafts = draftProposals.map(proposal => ({
        id: proposal.id,
        title: proposal.title || proposal.purpose || '품의서', // title 우선, 없으면 purpose, 둘 다 없으면 '품의서'
        department: proposal.requestDepartments?.[0] ? 
          (typeof proposal.requestDepartments[0] === 'string' ? 
            proposal.requestDepartments[0] : 
            proposal.requestDepartments[0].name || proposal.requestDepartments[0]
          ) : '미지정',
        contractor: proposal.purchaseItems?.[0]?.supplier || proposal.serviceItems?.[0]?.supplier || '미지정',
        author: '작성자', // 추후 사용자 정보 추가
        amount: proposal.totalAmount || 0,
        status: proposal.isDraft ? '작성중' : '제출완료',
        startDate: proposal.createdAt ? new Date(proposal.createdAt).toISOString().split('T')[0] : '',
        endDate: proposal.contractPeriod || '',
        contractType: proposal.contractType === 'purchase' ? '구매계약' :
                     proposal.contractType === 'service' ? '용역계약' :
                     proposal.contractType === 'change' ? '변경계약' :
                     proposal.contractType === 'extension' ? '연장계약' :
                     proposal.contractType === 'bidding' ? '입찰계약' :
                     proposal.contractType === 'freeform' ? 
                       // 자유양식일 때 contractMethod에 템플릿 이름(한글)이 있으면 표시, 아니면 "기타"
                       (proposal.contractMethod && 
                        /[가-힣]/.test(proposal.contractMethod) && 
                        !proposal.contractMethod.includes('_')) ? 
                         proposal.contractMethod : '기타' : 
                     '기타',
        purpose: proposal.purpose || '',
        basis: proposal.basis || '',
        budget: proposal.budgetInfo?.projectName || proposal.budgetId || '',
        contractMethod: proposal.contractMethod || '',
        accountSubject: proposal.accountSubject || '',
        contractPeriod: proposal.contractPeriod || '',
        paymentMethod: proposal.paymentMethod || '',
        requestDepartments: proposal.requestDepartments || [],
        approvalLines: proposal.approvalLines || [],
        createdAt: proposal.createdAt ? new Date(proposal.createdAt).toISOString().split('T')[0] : '',
        updatedAt: proposal.updatedAt ? new Date(proposal.updatedAt).toISOString().split('T')[0] : '',
        purchaseItems: proposal.purchaseItems || [],
        serviceItems: proposal.serviceItems || [],
        costDepartments: proposal.costDepartments || [],
        // 화면 표시용 데이터 (기존 구조 유지)
        items: proposal.purchaseItems?.map(item => ({
          item: item.item,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          supplier: item.supplier
        })) || proposal.serviceItems?.map(item => ({
          item: item.item,
          personnel: item.personnel,
          techLevel: item.skillLevel,
          duration: item.period,
          monthlyPrice: item.monthlyRate,
          supplier: item.supplier
        })) || [],
        displayCostDepartments: proposal.costDepartments?.map(dept => ({
          department: dept.department,
          percentage: dept.ratio,
          amount: dept.amount
        })) || []
      }));
      
              // 새로 작성된 품의서가 localStorage에 있는지 확인
        const newProposal = localStorage.getItem('newProposal');
        if (newProposal) {
          try {
            const newProposalData = JSON.parse(newProposal);
            // 이미 존재하는 품의서인지 확인
            const existingIndex = formattedDrafts.findIndex(draft => draft.id === newProposalData.id);
            
            if (existingIndex === -1) {
              // 새로 작성된 품의서를 리스트 맨 위에 추가하고 강조 표시
              newProposalData.isNew = true; // 새로 작성된 품의서 표시
              formattedDrafts.unshift(newProposalData);
              console.log('새로 작성된 품의서가 리스트에 추가되었습니다:', newProposalData);
            }
            
            // localStorage에서 제거 (한 번만 표시)
            localStorage.removeItem('newProposal');
          } catch (parseError) {
            console.error('새 품의서 데이터 파싱 실패:', parseError);
            localStorage.removeItem('newProposal');
          }
        }
      
      setDrafts(formattedDrafts);
      setFilteredDrafts(formattedDrafts);
    } catch (error) {
      console.error('작성중인 품의서 데이터 로드 실패:', error);
      alert('작성중인 품의서 데이터 로드에 실패했습니다. 서버가 실행 중인지 확인해주세요.');
      // 에러 시 빈 배열로 설정
      setDrafts([]);
      setFilteredDrafts([]);
    }
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    fetchDrafts();
  }, []);

  // 페이지 포커스 시 자동 새로고침 (새로 작성된 품의서 반영)
  useEffect(() => {
    const handleFocus = () => {
      console.log('페이지 포커스됨 - 품의서 목록 새로고침');
      fetchDrafts();
    };

    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // 네비게이션 상태 확인 및 자동 새로고침
  useEffect(() => {
    if (location.state?.refreshList) {
      console.log('새로 작성된 품의서 감지 - 목록 새로고침 실행');
      
      // 성공 메시지 표시
      if (location.state.message) {
        alert(location.state.message);
      }
      
      // 목록 새로고침
      fetchDrafts();
      
      // 네비게이션 상태 초기화 (중복 실행 방지)
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // 새로 작성된 품의서 강조 표시 자동 제거 (5초 후)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDrafts(prev => prev.map(draft => ({ ...draft, isNew: false })));
      setFilteredDrafts(prev => prev.map(draft => ({ ...draft, isNew: false })));
    }, 5000);

    return () => clearTimeout(timer);
  }, [drafts.length]);

  // 필터 적용 함수
  const applyFilters = () => {
    let filtered = [...drafts];

    // 키워드 검색
    if (filters.keyword) {
      filtered = filtered.filter(draft => 
        draft.title.toLowerCase().includes(filters.keyword.toLowerCase()) ||
        (draft.contractor && draft.contractor.toLowerCase().includes(filters.keyword.toLowerCase())) ||
        (draft.purpose && draft.purpose.toLowerCase().includes(filters.keyword.toLowerCase()))
      );
    }

    // 계약 유형 필터
    if (filters.type !== 'all') {
      filtered = filtered.filter(draft => draft.contractType === filters.type);
    }

    setFilteredDrafts(filtered);
  };

  // 필터 변경 시 자동 적용
  useEffect(() => {
    applyFilters();
  }, [filters, drafts]);

  // 페이지 포커스 시 자동 새로고침 (새로 작성된 품의서 반영)
  useEffect(() => {
    const handleFocus = () => {
      // 새로 작성된 품의서가 localStorage에 있는지 확인
      const newProposal = localStorage.getItem('newProposal');
      if (newProposal) {
        console.log('페이지 포커스 감지 - 새 품의서 확인됨');
        // 데이터 새로고침
        window.location.reload();
      }
    };

    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // 필터 초기화
  const resetFilters = () => {
    setFilters({
      type: 'all',
      keyword: ''
    });
  };

  // 엑셀 다운로드 함수
  const handleExcelDownload = async () => {
    try {
      console.log('전체 데이터를 가져오는 중...');
      
      // 서버에서 전체 작성중인 품의서 데이터 가져오기
      const response = await fetch(`${API_BASE_URL}/api/proposals?isDraft=true`);
      
      if (!response.ok) {
        throw new Error('데이터 조회 실패');
      }
      
      const allDrafts = await response.json();
      
      console.log(`📥 전체 ${allDrafts.length}건의 작성중인 품의서를 가져왔습니다.`);
      
      // API 데이터를 화면과 동일한 형식으로 변환
      const formattedDrafts = allDrafts.map(proposal => ({
        id: proposal.id,
        title: proposal.title || proposal.purpose || '품의서',
        contractType: proposal.contractType === 'purchase' ? '구매계약' :
                     proposal.contractType === 'service' ? '용역계약' :
                     proposal.contractType === 'change' ? '변경계약' :
                     proposal.contractType === 'extension' ? '연장계약' :
                     proposal.contractType === 'bidding' ? '입찰계약' :
                     proposal.contractType === 'freeform' ? 
                       (proposal.contractMethod && 
                        /[가-힣]/.test(proposal.contractMethod) && 
                        !proposal.contractMethod.includes('_')) ? 
                         proposal.contractMethod : '기타' : 
                     '기타',
        department: proposal.requestDepartments?.[0] ? 
          (typeof proposal.requestDepartments[0] === 'string' ? 
            proposal.requestDepartments[0] : 
            proposal.requestDepartments[0].name || proposal.requestDepartments[0]
          ) : '미지정',
        requestDepartments: proposal.requestDepartments || [],
        contractor: proposal.purchaseItems?.[0]?.supplier || proposal.serviceItems?.[0]?.supplier || '미지정',
        amount: proposal.totalAmount || 0,
        status: proposal.isDraft ? '작성중' : '제출완료',
        contractPeriod: proposal.contractPeriod || '-',
        contractMethod: proposal.contractMethod || '-',
        createdAt: proposal.createdAt,
        updatedAt: proposal.updatedAt,
        purpose: proposal.purpose || '-',
        basis: proposal.basis || '-'
      }));
      
      // 현재 필터 조건 적용
      let dataToExport = formattedDrafts;
      
      // 키워드 필터
      if (filters.keyword) {
        dataToExport = dataToExport.filter(draft => 
          draft.title.toLowerCase().includes(filters.keyword.toLowerCase()) ||
          (draft.contractor && draft.contractor.toLowerCase().includes(filters.keyword.toLowerCase())) ||
          (draft.purpose && draft.purpose.toLowerCase().includes(filters.keyword.toLowerCase()))
        );
      }
      
      // 계약 유형 필터
      if (filters.type !== 'all') {
        dataToExport = dataToExport.filter(draft => draft.contractType === filters.type);
      }
      
      console.log(`📊 필터링 후 ${dataToExport.length}건의 데이터를 엑셀로 변환합니다.`);
      
      // 엑셀 형식으로 변환
      const excelData = dataToExport.map((draft, index) => ({
        '번호': index + 1,
        '품의서명': draft.title || '-',
        '계약유형': draft.contractType || '-',
        '요청부서': Array.isArray(draft.requestDepartments) 
          ? draft.requestDepartments.map(d => (typeof d === 'string' ? d : d.department || d.name || d)).join(', ')
          : (draft.department || '-'),
        '계약업체': draft.contractor || '-',
        '계약금액': draft.amount || 0,
        '상태': draft.status || '-',
        '계약기간': draft.contractPeriod || '-',
        '계약방법': draft.contractMethod || '-',
        '작성일': draft.createdAt ? new Date(draft.createdAt).toLocaleDateString('ko-KR') : '-',
        '수정일': draft.updatedAt ? new Date(draft.updatedAt).toLocaleDateString('ko-KR') : '-',
        '목적': draft.purpose || '-',
        '근거': draft.basis || '-'
      }));

      // 워크시트 생성
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      
      // 컬럼 너비 설정
      const columnWidths = [
        { wch: 8 },  // 번호
        { wch: 30 }, // 품의서명
        { wch: 12 }, // 계약유형
        { wch: 15 }, // 요청부서
        { wch: 20 }, // 계약업체
        { wch: 15 }, // 계약금액
        { wch: 10 }, // 상태
        { wch: 20 }, // 계약기간
        { wch: 15 }, // 계약방법
        { wch: 12 }, // 작성일
        { wch: 12 }, // 수정일
        { wch: 30 }, // 목적
        { wch: 30 }  // 근거
      ];
      worksheet['!cols'] = columnWidths;

      // 워크북 생성
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, '작성중인 품의서');

      // 파일명 생성 (날짜 포함)
      const today = new Date();
      const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
      const filename = `작성중인_품의서_${dateStr}.xlsx`;

      // 엑셀 파일 다운로드
      XLSX.writeFile(workbook, filename);
      
      alert(`${dataToExport.length}건의 품의서 데이터를 엑셀로 다운로드했습니다.`);
    } catch (error) {
      console.error('엑셀 다운로드 실패:', error);
      alert('엑셀 다운로드에 실패했습니다: ' + error.message);
    }
  };

  // 수동 새로고침
  const handleRefresh = () => {
    console.log('수동 새로고침 실행');
    fetchDrafts();
  };

  // 작성중인 품의서 삭제
  const handleDeleteDraft = async (draftId) => {
    if (window.confirm('정말로 이 작성중인 품의서를 삭제하시겠습니까?')) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/proposals/${draftId}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || '삭제 실패');
        }
        
        // 성공적으로 삭제되면 목록에서 제거
        setDrafts(prev => prev.filter(draft => draft.id !== draftId));
        setFilteredDrafts(prev => prev.filter(draft => draft.id !== draftId));
        
        alert('작성중인 품의서가 삭제되었습니다.');
      } catch (error) {
        console.error('삭제 실패:', error);
        
        if (error.message.includes('강제 삭제를 원하시면')) {
          if (window.confirm('관련 데이터가 있어서 삭제할 수 없습니다. 강제로 삭제하시겠습니까?')) {
            // 강제 삭제 시도
            try {
              const forceResponse = await fetch(`${API_BASE_URL}/api/proposals/${draftId}?force=true`, {
                method: 'DELETE',
              });
              
              if (forceResponse.ok) {
                // 성공적으로 삭제되면 목록에서 제거
                setDrafts(prev => prev.filter(draft => draft.id !== draftId));
                setFilteredDrafts(prev => prev.filter(draft => draft.id !== draftId));
                alert('작성중인 품의서가 강제 삭제되었습니다.');
              } else {
                const errorData = await forceResponse.json();
                alert(`강제 삭제도 실패했습니다: ${errorData.error || '알 수 없는 오류'}`);
              }
            } catch (forceError) {
              console.error('강제 삭제 실패:', forceError);
              alert('강제 삭제 중 오류가 발생했습니다.');
            }
          }
        } else {
          alert(`삭제에 실패했습니다: ${error.message}`);
        }
      }
    }
  };

  // 작성중인 품의서 편집 (품의서 작성 화면으로 이동)
  const handleEditDraft = (draft) => {
    // 구매품목의 비용분배 정보를 포함하여 편집 데이터 준비
    const editData = {
      ...draft,
      purchaseItems: (draft.purchaseItems || []).map(item => ({
        ...item,
        // 서버에서 costAllocations가 있으면 costAllocation으로 변환
        costAllocation: item.costAllocations ? {
          allocations: item.costAllocations.map(alloc => ({
            department: alloc.department,
            type: alloc.type,
            value: alloc.value
          }))
        } : { allocations: [] }
      }))
    };
    
    // localStorage에 편집할 품의서 정보 저장 (백업용)
    localStorage.setItem('editingDraft', JSON.stringify(editData));
    // 품의서 작성 화면으로 이동 (URL 파라미터로 ID 전달)
    window.location.href = `/proposal?id=${draft.id}`;
  };



  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case '작성중': return '#17a2b8';
      default: return '#6c757d';
    }
  };

  

  // 품목 섹션 생성
  const generateItemsSection = (draftData) => {
    let itemsHTML = '';
    
    // 구매 품목
    if (draftData.purchaseItems && draftData.purchaseItems.length > 0) {
      itemsHTML += `
        <div class="section-title">2. 품목 내역</div>
        <table class="items-table">
          <thead>
            <tr>
              <th>번호</th>
              <th>품목명</th>
              <th>구분</th>
              <th>규격</th>
              <th>수량</th>
              <th>단가</th>
              <th>금액</th>
              <th>공급업체</th>
            </tr>
          </thead>
          <tbody>
            ${draftData.purchaseItems.map((item, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${item.productName || item.item || '-'}</td>
                <td>${item.item || '-'}</td>
                <td>${item.specification || '-'}</td>
                <td>${formatNumberWithComma(item.quantity)}</td>
                <td>${formatCurrency(item.unitPrice)}</td>
                <td>${formatCurrency(item.amount)}</td>
                <td>${item.supplier || '-'}</td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td colspan="6">합계</td>
              <td>${formatCurrency(draftData.purchaseItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0))}</td>
              <td></td>
            </tr>
          </tbody>
        </table>
      `;
    }
    
    // 용역 품목
    if (draftData.serviceItems && draftData.serviceItems.length > 0) {
      const sectionTitle = draftData.purchaseItems && draftData.purchaseItems.length > 0 
        ? '용역 품목' 
        : '2. 품목 내역';
      
      itemsHTML += `
        <div class="section-title">${sectionTitle}</div>
        <table class="items-table">
          <thead>
            <tr>
              <th>번호</th>
              <th>용역명</th>
              <th>구분</th>
              <th>성명</th>
              <th>수량</th>
              <th>단가</th>
              <th>금액</th>
            </tr>
          </thead>
          <tbody>
            ${draftData.serviceItems.map((item, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${item.item || '-'}</td>
                <td>전산용역비</td>
                <td>${item.name || item.personnel || '-'}</td>
                <td>${formatNumberWithComma(item.quantity)}</td>
                <td>${formatCurrency(item.unitPrice)}</td>
                <td>${formatCurrency(parseFloat(item.unitPrice) * parseFloat(item.quantity))}</td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td colspan="6">합계</td>
              <td>${formatCurrency(draftData.serviceItems.reduce((sum, item) => sum + (parseFloat(item.unitPrice) * parseFloat(item.quantity) || 0), 0))}</td>
            </tr>
          </tbody>
        </table>
      `;
    }
    
    return itemsHTML || `
      <div class="section-title">2. 품목 내역</div>
      <div style="text-align: center; padding: 20px; color: #666; border: 1px solid #ddd; border-radius: 4px;">
        등록된 품목이 없습니다.
      </div>
    `;
  };

  // 비용귀속분배 섹션 생성
  const generateCostAllocationSection = (draftData) => {
    // 구매 품목과 용역 품목의 비용귀속 정보 확인
    const hasPurchaseAllocations = draftData.purchaseItems?.some(item => 
      item.costAllocation?.allocations && item.costAllocation.allocations.length > 0
    );
    const hasServiceAllocations = draftData.serviceItems?.some(item => 
      item.costAllocation?.allocations && item.costAllocation.allocations.length > 0
    );
    const hasAllocations = hasPurchaseAllocations || hasServiceAllocations;

    if (!hasAllocations) {
      return `
        <div class="section-title">3. 비용귀속분배</div>
        <div style="text-align: center; padding: 20px; color: #666; border: 1px solid #ddd; border-radius: 4px;">
          비용귀속분배 정보가 없습니다.
        </div>
      `;
    }

    // 모든 품목의 분배 정보를 하나의 배열로 수집
    const allAllocations = [];
    draftData.purchaseItems?.forEach((item, itemIndex) => {
      const allocations = item.costAllocation?.allocations || [];
      allocations.forEach(allocation => {
        const allocationAmount = allocation.type === 'percentage' 
          ? (item.amount * (allocation.value / 100))
          : allocation.value;
        
        allAllocations.push({
          number: allAllocations.length + 1,
          productName: item.productName || `품목 ${itemIndex + 1}`,
          classification: item.item || '-',
          department: allocation.department || '-',
          type: allocation.type === 'percentage' ? '정률 (%)' : '정액 (원)',
          value: allocation.type === 'percentage' ? allocation.value + '%' : formatCurrency(allocation.value),
          amount: allocationAmount
        });
      });
    });

    // 용역 품목의 분배 정보도 수집
    draftData.serviceItems?.forEach((item, itemIndex) => {
      const allocations = item.costAllocation?.allocations || [];
      allocations.forEach(allocation => {
        const itemAmount = parseFloat(item.unitPrice) * parseFloat(item.quantity) || 0;
        const allocationAmount = allocation.type === 'percentage' 
          ? (itemAmount * (allocation.value / 100))
          : allocation.value;
        
        allAllocations.push({
          number: allAllocations.length + 1,
          productName: item.item || `용역항목 ${itemIndex + 1}`,
          classification: '전산용역비',
          department: allocation.department || '-',
          type: allocation.type === 'percentage' ? '정률 (%)' : '정액 (원)',
          value: allocation.type === 'percentage' ? allocation.value + '%' : formatCurrency(allocation.value),
          amount: allocationAmount
        });
      });
    });

    if (allAllocations.length === 0) {
      return `
        <div class="section-title">3. 비용귀속분배</div>
        <div style="text-align: center; padding: 20px; color: #666; border: 1px solid #ddd; border-radius: 4px;">
          비용귀속분배 정보가 없습니다.
        </div>
      `;
    }

    return `
      <div class="section-title">3. 비용귀속분배</div>
      <table class="items-table">
        <thead>
          <tr>
            <th>번호</th>
            <th>품목명</th>
            <th>구분</th>
            <th>귀속부서</th>
            <th>분배방식</th>
            <th>분배값</th>
            <th>분배금액</th>
          </tr>
        </thead>
        <tbody>
          ${allAllocations.map(allocation => `
            <tr>
              <td>${allocation.number}</td>
              <td>${allocation.productName}</td>
              <td>${allocation.classification}</td>
              <td>${allocation.department}</td>
              <td>${allocation.type}</td>
              <td>${allocation.value}</td>
              <td>${formatCurrency(allocation.amount)}</td>
            </tr>
          `).join('')}
          <tr class="total-row">
            <td colspan="6">합계</td>
            <td>${formatCurrency(allAllocations.reduce((sum, allocation) => sum + allocation.amount, 0))}</td>
          </tr>
        </tbody>
      </table>
    `;
  };

  // 계정과목 섹션 생성
  const generateAccountSubjectSection = (draftData) => {
    // 계정과목 정보 생성
    const accountSubjects = getAccountSubjectGroups(draftData);
    
    if (accountSubjects.length === 0) {
      return '';
    }

    return `
      <div style="margin-top: 30px; page-break-inside: avoid;">
        <div class="section-title">계정과목</div>
        <div style="padding: 15px; border: 1px solid #ddd; border-radius: 4px;">
          ${accountSubjects.map(account => `
            <div style="margin-bottom: 10px; padding: 8px 0; border-bottom: 1px solid #eee;">
              <strong>품목:</strong> ${account.name} > ${account.accountInfo}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  };

  // 계정과목 그룹 정보 생성
  const getAccountSubjectGroups = (draftData) => {
    const accountSubjects = [];
    
    // 구매 품목의 계정과목 정보
    if (draftData.purchaseItems && Array.isArray(draftData.purchaseItems)) {
      draftData.purchaseItems.forEach(item => {
        const accountInfo = getAccountSubjectByCategory(item.item);
        if (accountInfo) {
          accountSubjects.push({
            name: item.productName || item.item || '구매품목',
            accountInfo: accountInfo
          });
        }
      });
    }

    // 용역 품목의 계정과목 정보
    if (draftData.serviceItems && Array.isArray(draftData.serviceItems)) {
      draftData.serviceItems.forEach(item => {
        const accountInfo = getAccountSubjectByCategory('전산용역비');
        if (accountInfo) {
          accountSubjects.push({
            name: item.item || '용역항목',
            accountInfo: accountInfo
          });
        }
      });
    }

    return accountSubjects;
  };

  // 계정과목 카테고리별 정보 반환
  const getAccountSubjectByCategory = (category) => {
    const accountMap = {
      '소프트웨어': '관: 고정자산 > 항: 유형자산 > 목: 전산기구비품 > 절: 전산기구비품',
      '전산기구비품': '관: 고정자산 > 항: 유형자산 > 목: 전산기구비품 > 절: 전산기구비품',
      '전산용역비': '관: 운영비 > 항: 일반운영비 > 목: 전산용역비',
      '기타': '관: 운영비 > 항: 일반운영비 > 목: 기타운영비'
    };
    
    return accountMap[category] || accountMap['기타'];
  };

  // 상세보기 열기

  const handleRowClick = async (draft) => {
    try {
      // 전체 초안 데이터 가져오기
      const response = await fetch(`${API_BASE_URL}/api/proposals/${draft.id}`);
      if (!response.ok) {
        throw new Error('초안 데이터 로드 실패');
      }
      
      const fullDraftData = await response.json();
      
      // 데이터 구조 확인을 위한 로깅
      console.log('=== DraftList 미리보기 데이터 ===');
      console.log('전체 데이터:', fullDraftData);
      console.log('contractType:', fullDraftData.contractType);
      console.log('purchaseItems:', fullDraftData.purchaseItems);
      console.log('serviceItems:', fullDraftData.serviceItems);
      console.log('costDepartments:', fullDraftData.costDepartments);
      
      if (fullDraftData.purchaseItems?.length > 0) {
        console.log('첫 번째 구매항목 상세:', fullDraftData.purchaseItems[0]);
      }
      if (fullDraftData.serviceItems?.length > 0) {
        console.log('첫 번째 용역항목 상세:', fullDraftData.serviceItems[0]);
      }
      
      // 공통 미리보기 함수 사용
      const previewHTML = generatePreviewHTML(fullDraftData);
      const previewWindow = window.open('', '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
      
      if (!previewWindow) {
        alert('팝업이 차단되었습니다. 팝업 허용 후 다시 시도해주세요.');
        return;
      }

      previewWindow.document.write(previewHTML);
      previewWindow.document.close();
      previewWindow.focus();
      
    } catch (error) {
      console.error('초안 미리보기 실패:', error);
      alert('초안 데이터를 불러오는데 실패했습니다.');
    }
  };



  // 다중선택 관련 함수들
  const handleSelectDraft = (draftId) => {
    setSelectedDrafts(prev => {
      if (prev.includes(draftId)) {
        return prev.filter(id => id !== draftId);
      } else {
        return [...prev, draftId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedDrafts([]);
      setSelectAll(false);
    } else {
      const allIds = filteredDrafts.map(draft => draft.id);
      setSelectedDrafts(allIds);
      setSelectAll(true);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedDrafts.length === 0) {
      alert('삭제할 품의서를 선택해주세요.');
      return;
    }

    const confirmMessage = `선택한 ${selectedDrafts.length}개의 작성중인 품의서를 삭제하시겠습니까?`;
    if (window.confirm(confirmMessage)) {
      try {
        let successCount = 0;
        let failCount = 0;

        for (const draftId of selectedDrafts) {
          try {
            const response = await fetch(`${API_BASE_URL}/api/proposals/${draftId}`, {
              method: 'DELETE',
            });
            
            if (response.ok) {
              successCount++;
            } else {
              const errorData = await response.json();
              console.error(`품의서 ${draftId} 삭제 실패:`, errorData.error || '알 수 없는 오류');
              
              // 강제 삭제 시도
              if (errorData.error && errorData.error.includes('강제 삭제를 원하시면')) {
                try {
                  const forceResponse = await fetch(`${API_BASE_URL}/api/proposals/${draftId}?force=true`, {
                    method: 'DELETE',
                  });
                  
                  if (forceResponse.ok) {
                    successCount++;
                    console.log(`품의서 ${draftId} 강제 삭제 성공`);
                  } else {
                    failCount++;
                  }
                } catch (forceError) {
                  console.error(`품의서 ${draftId} 강제 삭제 실패:`, forceError);
                  failCount++;
                }
              } else {
                failCount++;
              }
            }
          } catch (error) {
            console.error(`품의서 ${draftId} 삭제 실패:`, error);
            failCount++;
          }
        }

        // 성공적으로 삭제된 품의서들을 목록에서 제거
        setDrafts(prev => prev.filter(draft => !selectedDrafts.includes(draft.id)));
        setFilteredDrafts(prev => prev.filter(draft => !selectedDrafts.includes(draft.id)));
        
        // 선택 상태 초기화
        setSelectedDrafts([]);
        setSelectAll(false);

        if (failCount === 0) {
          alert(`성공적으로 ${successCount}개의 품의서가 삭제되었습니다.`);
        } else {
          alert(`삭제 완료: ${successCount}개 성공, ${failCount}개 실패`);
        }
      } catch (error) {
        console.error('다중 삭제 실패:', error);
        alert('삭제 중 오류가 발생했습니다. 다시 시도해주세요.');
      }
    }
  };

  // 필터링된 데이터가 변경될 때 전체선택 상태 업데이트
  useEffect(() => {
    if (filteredDrafts.length > 0 && selectedDrafts.length === filteredDrafts.length) {
      setSelectAll(true);
    } else {
      setSelectAll(false);
    }
  }, [filteredDrafts, selectedDrafts]);

  return (
    <div className="draft-list">
      <h1>작성중인 품의서</h1>
      
      {/* 필터 섹션 */}
      <div className="filter-section">
        <div className="filter-grid">
          <div className="filter-group">
            <label>검색:</label>
            <input
              type="text"
              placeholder="품의서명, 업체명, 목적 검색..."
              value={filters.keyword}
              onChange={(e) => setFilters({...filters, keyword: e.target.value})}
            />
          </div>
          
          <div className="filter-group">
            <label>계약 유형:</label>
            <select 
              value={filters.type} 
              onChange={(e) => setFilters({...filters, type: e.target.value})}
            >
              {typeOptions.map(option => (
                <option key={option} value={option === '전체' ? 'all' : option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="filter-actions">
          <div className="action-buttons">
            <button className="refresh-btn" onClick={handleRefresh} title="새로고침">
              🔄 새로고침
            </button>
            <button className="reset-btn" onClick={resetFilters}>
              🔄 필터 초기화
            </button>
            <button className="excel-download-btn" onClick={handleExcelDownload}>
              📥 엑셀 다운로드
            </button>
            {selectedDrafts.length > 0 && (
              <button 
                className="delete-selected-btn" 
                onClick={handleDeleteSelected}
                style={{ backgroundColor: '#dc3545', color: 'white' }}
              >
                🗑️ 선택 삭제 ({selectedDrafts.length}개)
              </button>
            )}
          </div>
          <div className="result-info">
            <span className="result-count">
              검색 결과: {filteredDrafts.length}건
              {selectedDrafts.length > 0 && (
                <span className="selected-count">
                  | 선택됨: {selectedDrafts.length}건
                </span>
              )}
            </span>
          </div>
        </div>
      </div>

      <div className="table-responsive">
        <table className="table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={handleSelectAll}
                  style={{ marginRight: '8px' }}
                />
                전체
              </th>
              <th>품의서명</th>
              <th>요청부서</th>
              <th>계약업체</th>
              <th>작성자</th>
              <th>계약금액</th>
              <th>계약유형</th>
              <th>상태</th>
              <th>작성일</th>
              <th>작업</th>
            </tr>
          </thead>
          <tbody>
            {filteredDrafts.map(draft => (
              <tr 
                key={draft.id} 
                className={`${selectedDrafts.includes(draft.id) ? 'selected-row' : ''} ${draft.isNew ? 'new-proposal-row' : ''}`}
              >
                <td>
                  <input
                    type="checkbox"
                    checked={selectedDrafts.includes(draft.id)}
                    onChange={() => handleSelectDraft(draft.id)}
                    onClick={(e) => e.stopPropagation()}
                    style={{ marginRight: '8px' }}
                  />
                </td>
                <td 
                  className="clickable-cell"
                  onClick={() => handleRowClick(draft)}
                >
                  {draft.title}
                </td>
                <td>
                  {draft.requestDepartments && draft.requestDepartments.length > 0
                    ? draft.requestDepartments.map(d => d.department).join(', ')
                    : '-'
                  }
                </td>
                <td>{draft.contractor || '-'}</td>
                <td>{draft.author || '-'}</td>
                <td>{draft.amount ? formatCurrency(draft.amount) : '-'}</td>
                <td>{draft.contractType}</td>
                <td>
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(draft.status) }}
                  >
                    {draft.status}
                  </span>
                </td>
                <td>{formatDate(draft.createdAt)}</td>
                <td>
                  <div className="action-buttons">
                    <button 
                      className="edit-btn"
                      onClick={() => handleEditDraft(draft)}
                      title="편집"
                    >
                      ✏️
                    </button>
                    <button 
                      className="delete-btn"
                      onClick={() => handleDeleteDraft(draft.id)}
                      title="삭제"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 작성중인 품의서가 없을 때 */}
      {filteredDrafts.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📝</div>
          <h3>작성중인 품의서가 없습니다</h3>
          <p>새로운 품의서를 작성하거나 기존 품의서를 임시저장해보세요.</p>
        </div>
      )}



      <style jsx="true">{`
        .draft-list {
          max-width: 1200px;
          margin: 0 auto;
          padding: 1rem;
        }

        .filter-section {
          background: white;
          padding: 1.5rem;
          border-radius: 12px;
          margin-bottom: 2rem;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          border: 1px solid rgba(0,0,0,0.05);
        }

        .filter-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .filter-group label {
          font-weight: 600;
          color: #333;
          font-size: 0.9rem;
        }

        .filter-group input,
        .filter-group select {
          padding: 0.75rem;
          border: 2px solid #e1e5e9;
          border-radius: 8px;
          font-size: 0.9rem;
          transition: border-color 0.3s ease;
        }

        .filter-group input:focus,
        .filter-group select:focus {
          outline: none;
          border-color: #667eea;
        }

        .filter-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 1rem;
          border-top: 1px solid #e1e5e9;
        }

        .action-buttons {
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .delete-selected-btn {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .delete-selected-btn:hover {
          background-color: #c82333 !important;
          transform: translateY(-1px);
        }

        .selected-count {
          color: #dc3545;
          font-weight: 600;
        }

        .selected-row {
          background-color: #f8f9fa !important;
          border-left: 4px solid #667eea;
        }

        .selected-row:hover {
          background-color: #e9ecef !important;
        }

        .reset-btn, .excel-download-btn {
          background: #6c757d;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .reset-btn:hover {
          background: #5a6268;
          transform: translateY(-2px);
        }

        .excel-download-btn {
          background: #28a745 !important;
        }

        .excel-download-btn:hover {
          background: #218838 !important;
          transform: translateY(-2px);
        }

        .result-info {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .result-count {
          font-weight: 600;
          color: #667eea;
          font-size: 1rem;
        }

        .table-responsive {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          border: 1px solid rgba(0,0,0,0.05);
        }

        .table {
          width: 100%;
          border-collapse: collapse;
        }

        .table th,
        .table td {
          padding: 1rem;
          text-align: left;
          border-bottom: 1px solid #e1e5e9;
        }

        .table th {
          background: #f8f9fa;
          font-weight: 600;
          color: #333;
          font-size: 0.9rem;
        }

        .clickable-cell {
          cursor: pointer;
          transition: background-color 0.3s ease;
        }

        .clickable-cell:hover {
          background-color: #f8f9fa;
        }

        .status-badge {
          color: white;
          padding: 0.25rem 0.5rem;
          border-radius: 3px;
          font-size: 0.8rem;
        }

        .table .action-buttons {
          display: flex;
          gap: 0.5rem;
        }

        .edit-btn,
        .delete-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.25rem;
          border-radius: 4px;
          transition: background-color 0.2s;
        }

        .edit-btn:hover {
          background-color: #e3f2fd;
        }

        .delete-btn:hover {
          background-color: #ffebee;
        }

        .empty-state {
          text-align: center;
          padding: 3rem;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .empty-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }

        .empty-state h3 {
          color: #333;
          margin-bottom: 0.5rem;
        }

        .empty-state p {
          color: #666;
        }

        .detail-modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0,0,0,0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }

        .detail-content {
          background: white;
          border-radius: 12px;
          max-width: 800px;
          width: 90%;
          max-height: 90%;
          overflow-y: auto;
        }

        .detail-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid #e1e5e9;
        }

        .detail-header h2 {
          margin: 0;
          color: #333;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #666;
        }

        .detail-body {
          padding: 1.5rem;
        }

        .detail-section {
          margin-bottom: 2rem;
        }

        .detail-section h3 {
          color: #333;
          margin-bottom: 1rem;
          border-bottom: 2px solid #667eea;
          padding-bottom: 0.5rem;
        }

        .detail-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem;
        }

        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .detail-item.full-width {
          grid-column: 1 / -1;
        }

        .detail-item label {
          font-weight: 600;
          color: #495057;
          font-size: 0.9rem;
        }

        .detail-item span {
          color: #333;
        }

        .detail-item .amount {
          font-weight: 600;
          color: #667eea;
        }

        .detail-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
          margin-top: 2rem;
          padding-top: 1rem;
          border-top: 1px solid #e1e5e9;
        }

        .edit-btn.large,
        .delete-btn.large {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .edit-btn.large {
          background: #007bff;
          color: white;
        }

        .edit-btn.large:hover {
          background: #0056b3;
        }

        .delete-btn.large {
          background: #dc3545;
          color: white;
        }

        .delete-btn.large:hover {
          background: #c82333;
        }

        @media (max-width: 768px) {
          .filter-grid {
            grid-template-columns: 1fr;
          }
          
          .filter-actions {
            flex-direction: column;
            gap: 1rem;
          }
          
          .action-buttons {
            flex-direction: column;
          }
          
          .table .action-buttons {
            flex-direction: row;
          }
          
          .detail-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default DraftList; 

