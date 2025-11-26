import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { generatePreviewHTML } from '../utils/previewGenerator';
import { getApiUrl } from '../config/api';
import { getStatusLabel } from '../utils/statusHelper';
import { getCurrentUser } from '../utils/userHelper';
import * as XLSX from 'xlsx';

// API 베이스 URL 설정
const API_BASE_URL = getApiUrl();

const ContractList = () => {
  const location = useLocation();
  const [contracts, setContracts] = useState([]);
  const [filteredContracts, setFilteredContracts] = useState([]);
  const [displayedContracts, setDisplayedContracts] = useState([]); // 화면에 표시할 계약 목록
  const [selectedContract, setSelectedContract] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [loading, setLoading] = useState(true);
  const [contractMethodsMap, setContractMethodsMap] = useState({}); // 계약방식 매핑
  
  // 무한 스크롤 관련 상태
  const [page, setPage] = useState(0);
  const [displayPage, setDisplayPage] = useState(0); // 표시 페이지 (필터링 시 사용)
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);  // 전체 품의서 개수
  const ITEMS_PER_PAGE = 20;
  
  // 상태 업데이트 관련 상태
  const [showStatusUpdate, setShowStatusUpdate] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusDate, setStatusDate] = useState('');
  const [changeReason, setChangeReason] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  
  // 히스토리 관련 상태
  const [statusHistory, setStatusHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  // 재활용 기능을 위한 navigate 추가
  const navigate = useNavigate();

  // 계약방식 목록 가져오기
  const fetchContractMethods = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/contract-methods`);
      if (response.ok) {
        const methods = await response.json();
        // value를 키로, name을 값으로 하는 매핑 객체 생성
        const map = {};
        methods.forEach(method => {
          map[method.value] = method.name;
        });
        setContractMethodsMap(map);
        console.log('✅ 계약방식 매핑 로드 완료:', map);
      }
    } catch (error) {
      console.error('계약방식 로드 오류:', error);
    }
  };

  // 초기화
  useEffect(() => {
    fetchContractMethods();
  }, []);

  // 전역 메시지 리스너 제거됨 (직접 함수 호출 방식 사용)
  
  // 전역 함수 노출은 각 함수 정의 직후에 수행됨
  
  // 컴포넌트 언마운트 시 전역 함수 정리
  useEffect(() => {
    return () => {
      delete window.handleRecycleProposal;
      delete window.handleEditProposal;
      delete window.setSelectedContract;
      delete window.openStatusUpdate;
    };
  }, []);

  // 미리보기 생성 함수 (사용되지 않음 - 공통 유틸리티 사용)
  const generatePreviewHTML_OLD = (contract) => {
    const formatCurrency = (amount) => {
      if (!amount) return '0';
      return new Intl.NumberFormat('ko-KR').format(amount) + '원';
    };

    const getContractTypeName = (type) => {
      const typeMapping = {
        '구매계약': '구매계약',
        '용역계약': '용역계약',
        '변경계약': '변경계약',
        '입찰계약': '입찰계약'
      };
      return typeMapping[type] || type;
    };

    // 계약방식 한글 변환 (DB 기반 + Fallback)
    const getContractMethodText = (method) => {
      if (!method) return '-';
      
      // 이미 한글이면 그대로 반환
      if (/[가-힣]/.test(method) && !method.includes('_')) {
        return method;
      }
      
      // 1순위: DB에서 가져온 매핑 사용
      if (contractMethodsMap[method]) {
        return contractMethodsMap[method];
      }
      
      // 2순위: Fallback 매핑 (구버전 코드)
      const fallbackMap = {
        // 구버전 영문 코드 - 수의계약 제6조 제1항
        'private_contract_6_1_a': '수의계약(제6조 제1항의 가)',
        'private_contract_6_1_b': '수의계약(제6조 제1항의 나)',
        'private_contract_6_1_c': '수의계약(제6조 제1항의 다)',
        'private_contract_6_1_d': '수의계약(제6조 제1항의 라)',
        'private_contract_6_1_e': '수의계약(제6조 제1항의 마)',
        
        // 구버전 영문 코드 - 수의계약 제6조 제2항
        'private_contract_6_2_a': '수의계약(제6조 제2항의 가)',
        'private_contract_6_2_b': '수의계약(제6조 제2항의 나)',
        'private_contract_6_2_c': '수의계약(제6조 제2항의 다)',
        'private_contract_6_2_d': '수의계약(제6조 제2항의 라)',
        'private_contract_6_2_e': '수의계약(제6조 제2항의 마)',
        'private_contract_6_2_f': '수의계약(제6조 제2항의 바)',
        'private_contract_6_2_g': '수의계약(제6조 제2항의 사)',
        
        // 구버전 영문 코드 (일반)
        'private_contract': '수의계약',
        'general_competition': '경쟁계약(일반경쟁계약)',
        'limited_competition': '경쟁계약(제한경쟁계약)',
        'designated_competition': '경쟁계약(지명경쟁계약)',
        'negotiated_competition': '경쟁계약(협상에 의한 계약)',
        'lowest_price': '최저가 계약',
        'lowest': '최저가 계약',
        'bidding': '입찰',
        'competition': '경쟁입찰'
      };
      
      return fallbackMap[method] || method;
    };

    // HTML 문자열 생성
    let html = '<!DOCTYPE html><html lang="ko"><head>';
    html += '<meta charset="UTF-8">';
    html += '<meta name="viewport" content="width=device-width, initial-scale=1.0">';
    html += '<title>📋 품의서 미리보기 - ' + (contract.title || '품의서') + '</title>';
    // CDN 제거: 폐쇄망 대비 로컬 파일 사용 (필요시 활성화)
    // html += '<script src="/js/html2canvas.min.js"></script>';
    html += '<style>';
    html += 'body { font-family: "Malgun Gothic", sans-serif; line-height: 1.6; margin: 0; padding: 20px; background-color: #f5f5f5; }';
    html += '.preview-container { max-width: 1200px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }';
    html += '.action-buttons { position: fixed; top: 20px; right: 20px; z-index: 1000; display: flex; gap: 10px; }';
    html += '.action-btn { background: #6c757d; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-size: 14px; min-width: 100px; transition: all 0.3s ease; }';
    html += '.action-btn:hover { transform: translateY(-2px); }';
    html += '.recycle-btn { background: #28a745; } .recycle-btn:hover { background: #218838; }';
    html += '.status-btn { background: #667eea; } .status-btn:hover { background: #5a67d8; }';
    html += '.copy-btn { background: #17a2b8; } .copy-btn:hover { background: #138496; }';
    html += '.section-title { font-size: 18px; font-weight: bold; margin: 30px 0 15px 0; padding-bottom: 10px; border-bottom: 2px solid #333; }';
    html += '.info-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }';
    html += '.info-table th, .info-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }';
    html += '.info-table th { background-color: #f8f9fa; font-weight: bold; width: 150px; }';
    html += '.details-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }';
    html += '.details-table th, .details-table td { border: 1px solid #ddd; padding: 8px; text-align: center; }';
    html += '.details-table th { background-color: #f8f9fa; font-weight: bold; }';
    html += '.total-row { background-color: #f8f9fa; font-weight: bold; }';
    html += '</style></head><body>';
    
    html += '<div class="action-buttons">';
    
    // 결재완료된 품의서만 재활용 버튼 표시
    if (contract.status === 'approved') {
      html += '<button class="action-btn recycle-btn" onclick="handleRecycle()">♻️ 재활용</button>';
    }
    html += '<button class="action-btn status-btn" onclick="handleStatusUpdate()">🔄 상태변경</button>';
    html += '<button class="action-btn copy-btn" onclick="copyToClipboard()">📋 복사</button>';
    html += '</div>';
    
    html += '<div class="preview-container">';
    html += '<div class="section-title">품의서 미리보기</div>';
    html += '<table class="info-table"><tbody>';
    html += '<tr><th>계약명</th><td>' + (contract.title || '-') + '</td></tr>';
    html += '<tr><th>계약 유형</th><td>' + getContractTypeName(contract.type) + '</td></tr>';
    html += '<tr><th>계약 방식</th><td>' + getContractMethodText(contract.contractMethod) + '</td></tr>';
    html += '<tr><th>사업 목적</th><td>' + (contract.purpose || '-') + '</td></tr>';
    html += '<tr><th>근거</th><td>' + (contract.basis || '-') + '</td></tr>';
    html += '<tr><th>예산</th><td>' + (contract.budget || '-') + '</td></tr>';
    html += '<tr><th>담당부서</th><td>' + (contract.department || '-') + '</td></tr>';
    html += '<tr><th>총 계약금액</th><td style="font-weight: bold; color: #007bff;">' + formatCurrency(contract.amount) + '</td></tr>';
    html += '<tr><th>계약업체</th><td>' + (contract.contractor || '-') + '</td></tr>';
    html += '<tr><th>작성자</th><td>' + (contract.author || '-') + '</td></tr>';
              const getStatusColorInline = (status) => {
       switch (status) {
         case 'approved': return '#28a745';  // 결재완료: 초록색
         case 'pending':
         case 'submitted': return '#007bff';   // 결재대기: 파란색
         case 'draft': return '#6c757d';     // 작성중: 회색
         default: return '#6c757d';
       }
     };

     const formatDateInline = (dateString) => {
       if (!dateString) return '-';
       const date = new Date(dateString);
       return date.toLocaleDateString('ko-KR', {
         year: 'numeric',
         month: '2-digit',
         day: '2-digit'
       }).replace(/\./g, '.');
     };
     
     const getStatusLabelInline = (status) => {
       const labels = {
         'draft': '작성중',
         'pending': '결재대기',
         'submitted': '결재대기',
         'approved': '결재완료'
       };
       return labels[status] || status;
     };
     
     html += '<tr><th>상태</th><td><span style="padding: 4px 12px; border-radius: 12px; color: white; background-color: ' + getStatusColorInline(contract.status) + ';">' + getStatusLabelInline(contract.status) + '</span></td></tr>';
     html += '<tr><th>등록일</th><td>' + formatDateInline(contract.createdAt) + '</td></tr>';
    html += '</tbody></table>';
    
    // 구매/용역 상세 내역이 있다면 표시
    if (contract.items && contract.items.length > 0) {
      html += '<div class="section-title">' + (contract.type === '용역계약' ? '용역 상세 내역' : '구매 상세 내역') + '</div>';
      html += '<table class="details-table"><thead><tr>';
      
      if (contract.type === '용역계약') {
        html += '<th>번호</th><th>용역 항목</th><th>성명</th><th>기술등급</th><th>기간(월)</th><th>월단가</th><th>계약금액</th><th>공급업체</th>';
      } else {
        html += '<th>번호</th><th>구매품목</th><th>제품명</th><th>수량</th><th>단가</th><th>금액</th><th>공급업체</th>';
      }
      
      html += '</tr></thead><tbody>';
      
      contract.items.forEach((item, index) => {
        html += '<tr>';
        html += '<td>' + (index + 1) + '</td>';
        
        if (contract.type === '용역계약') {
          html += '<td>' + (item.item || '-') + '</td>';
          html += '<td>' + (item.name || item.personnel || '-') + '</td>';
          html += '<td>' + (item.techLevel || '-') + '</td>';
          html += '<td>' + (item.duration || 0) + '</td>';
          html += '<td>' + formatCurrency(item.monthlyPrice || 0) + '</td>';
          html += '<td style="font-weight: bold;">' + formatCurrency((item.monthlyPrice || 0) * (item.duration || 0)) + '</td>';
          html += '<td>' + (item.supplier || '-') + '</td>';
        } else {
          html += '<td>' + (item.item || '-') + '</td>';
          html += '<td>' + (item.productName || '-') + '</td>';
          html += '<td>' + (item.quantity || 0) + '</td>';
          html += '<td>' + formatCurrency(item.unitPrice || 0) + '</td>';
          html += '<td style="font-weight: bold;">' + formatCurrency(item.amount || 0) + '</td>';
          html += '<td>' + (item.supplier || '-') + '</td>';
        }
        
        html += '</tr>';
      });
      
      html += '</tbody></table>';
    }
    
    html += '</div>';
    
    html += '<script>';
    html += 'function handleRecycle() { if (confirm("이 품의서를 재활용하여 새로운 품의서를 작성하시겠습니까?")) { window.parent.postMessage({type: "recycle", contractId: "' + contract.id + '"}, "*"); } }';
    html += 'function handleStatusUpdate() { window.parent.postMessage({type: "statusUpdate", contractId: "' + contract.id + '"}, "*"); }';
    html += 'async function copyToClipboard() { try { const buttons = document.querySelector(".action-buttons"); buttons.style.display = "none"; const canvas = await html2canvas(document.body, { useCORS: true, allowTaint: true, scale: 2, backgroundColor: "#ffffff" }); buttons.style.display = "flex"; canvas.toBlob(async (blob) => { try { const item = new ClipboardItem({ "image/png": blob }); await navigator.clipboard.write([item]); alert("이미지가 클립보드에 복사되었습니다!"); } catch (error) { alert("클립보드 복사를 지원하지 않는 브라우저입니다."); } }, "image/png"); } catch (error) { alert("이미지 생성 중 오류가 발생했습니다."); } }';
    html += '</script></body></html>';
    
    return html;
  };
  
  // 다중조건 필터 상태
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    department: 'all',
    authorInput: '', // 작성자 직접 입력
    dateRange: '최근 1년', // 기본값: 최근 1년
    approvalDateRange: 'all', // 결재완료일 필터
    amountRange: 'all',
    keyword: ''
  });

  // 다중정렬 상태
  const [sortConfigs, setSortConfigs] = useState([]);

  // 컬럼 리사이징 관련 상태
  const [columnWidths, setColumnWidths] = useState(() => {
    const saved = localStorage.getItem('proposalTableColumnWidths');
    return saved ? JSON.parse(saved) : {
      순번: 60,
      품의서번호: 100,
      계약명: 300,
      요청부서: 120,
      계약금액: 150,
      계약유형: 120,
      상태: 100,
      계약기간: 200,
      등록일: 120,
      결재완료일: 120,
      작성자: 100
    };
  });
  const [resizingColumn, setResizingColumn] = useState(null);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);

  // 필터 옵션들
  const statusOptions = ['전체', '결재대기', '결재완료'];
  const typeOptions = ['전체', '구매계약', '용역계약', '변경계약', '입찰계약'];
  const departmentOptions = ['전체', 'IT팀', '총무팀', '기획팀', '영업팀', '재무팀', '법무팀'];
  const dateRangeOptions = ['전체', '최근 1개월', '최근 3개월', '최근 6개월', '최근 1년'];
  const amountRangeOptions = ['전체', '1천만원 미만', '1천만원~5천만원', '5천만원~1억원', '1억원 이상'];

  // 상태 변경 옵션들
  const statusChangeOptions = [
    '결재완료'
  ];

  // 품의서 목록 조회 함수 (초기 로드용)
  const fetchProposals = async (reset = false, loadAll = false) => {
    const currentPage = reset ? 0 : page;
    const offset = currentPage * ITEMS_PER_PAGE;
    
    console.log('📥 fetchProposals 호출:', { reset, loadAll, currentPage });
    
    try {
      if (reset) {
        setLoading(true);
        setPage(0);
      } else {
        setLoadingMore(true);
      }
      
      // 필터가 활성화되어 있거나 loadAll이 true면 모든 데이터 로드, 아니면 페이지네이션
      let apiUrl;
      const queryParams = ['isDraft=false'];
      
      // 등록일 필터 추가
      if (filters.dateRange !== 'all') {
        let monthsAgo = 0;
        switch (filters.dateRange) {
          case '최근 1개월': monthsAgo = 1; break;
          case '최근 3개월': monthsAgo = 3; break;
          case '최근 6개월': monthsAgo = 6; break;
          case '최근 1년': monthsAgo = 12; break;
        }
        if (monthsAgo > 0) {
          queryParams.push(`createdWithinMonths=${monthsAgo}`);
        }
      }
      
      // 결재완료일 필터 추가
      if (filters.approvalDateRange !== 'all') {
        let monthsAgo = 0;
        switch (filters.approvalDateRange) {
          case '최근 1개월': monthsAgo = 1; break;
          case '최근 3개월': monthsAgo = 3; break;
          case '최근 6개월': monthsAgo = 6; break;
          case '최근 1년': monthsAgo = 12; break;
        }
        if (monthsAgo > 0) {
          queryParams.push(`approvedWithinMonths=${monthsAgo}`);
        }
      }
      
      // 페이지네이션 파라미터
      if (!loadAll && !hasActiveFilters()) {
        queryParams.push(`limit=${ITEMS_PER_PAGE}&offset=${offset}`);
      }
      
      apiUrl = `${API_BASE_URL}/api/proposals?${queryParams.join('&')}`;
      
      console.log('📡 API 요청:', apiUrl);
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error('API 호출 실패');
      }
      
      const data = await response.json();
      const proposals = data.proposals || data; // 페이지네이션 응답 또는 기존 응답 모두 지원
      const hasMoreData = data.hasMore !== undefined ? data.hasMore : false;
      const total = data.total || proposals.length; // 전체 개수
      
      console.log(`✅ API 응답: ${proposals.length}개의 품의서 로드`);
      
      // 전체 개수 업데이트 (첫 로드 시에만)
      if (reset || currentPage === 0) {
        setTotalCount(total);
      }
      
      // 백엔드에서 이미 승인완료된 품의서만 조회하므로 프론트에서는 필터링 불필요
      const filteredProposals = proposals;
      
      // 상태별 개수 확인 (디버깅용)
      const statusCount = proposals.reduce((acc, p) => {
        acc[p.status] = (acc[p.status] || 0) + 1;
        return acc;
      }, {});
      console.log('📊 상태별 개수 (DB):', statusCount);
      
      // localStorage에서 새로 작성된 품의서 확인
      const newProposal = localStorage.getItem('newProposal');
      let formattedProposals = [];
      
      if (newProposal) {
        try {
          const newProposalData = JSON.parse(newProposal);
          console.log('새로 작성된 품의서 발견:', newProposalData);
          
          // 새로 작성된 품의서를 목록 맨 앞에 추가
          formattedProposals.push({
            ...newProposalData,
            isNew: true // 새로 작성된 품의서 표시용
          });
          
          // localStorage에서 제거
          localStorage.removeItem('newProposal');
        } catch (error) {
          console.error('새로 작성된 품의서 파싱 오류:', error);
        }
      }
      
      // API 데이터를 화면에 맞는 형태로 변환하여 추가
      const apiFormattedProposals = filteredProposals.map(proposal => ({
          id: proposal.id,
          title: proposal.title || '품의서',
          department: proposal.requestDepartments?.[0] ? 
            (typeof proposal.requestDepartments[0] === 'string' ? 
              proposal.requestDepartments[0] : 
              proposal.requestDepartments[0].name || proposal.requestDepartments[0]
            ) : '미지정',
          contractor: proposal.purchaseItems?.[0]?.supplier || proposal.serviceItems?.[0]?.supplier || '미지정',
          author: proposal.createdBy || '작성자', // 실제 작성자명 표시
          amount: proposal.totalAmount || 0,
          // 상태는 영어 코드로 유지 (표시만 한글로 변환)
          status: proposal.status === 'submitted' ? 'pending' : proposal.status,
          startDate: proposal.createdAt ? new Date(proposal.createdAt).toISOString().split('T')[0] : '',
          endDate: proposal.contractPeriod || '',
          type: proposal.contractType === 'purchase' ? '구매계약' :
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
          budget: proposal.budgetInfo?.projectName || proposal.budgetId || proposal.operatingBudgetId || '',
          contractMethod: proposal.contractMethod || '',
          accountSubject: proposal.accountSubject || '',
          contractPeriod: proposal.contractPeriod || '',
          paymentMethod: proposal.paymentMethod || '',
          requestDepartments: (proposal.requestDepartments || []).map(dept => 
            typeof dept === 'string' ? dept : dept.name || dept
          ),
          approvalLine: proposal.approvalLines?.map(line => `${line.approver} → `).join('') || '',
          createdAt: proposal.createdAt ? new Date(proposal.createdAt).toISOString().split('T')[0] : '',
          updatedAt: proposal.updatedAt ? new Date(proposal.updatedAt).toISOString().split('T')[0] : '',
          approvalDate: proposal.approvalDate ? new Date(proposal.approvalDate).toISOString().split('T')[0] : null,
          items: proposal.purchaseItems?.map(item => ({
            item: item.item,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            supplier: item.supplier,
            // 비용분배 정보 포함
            costAllocations: item.costAllocations || []
          })) || proposal.serviceItems?.map(item => ({
            item: item.item,
            personnel: item.personnel,
            techLevel: item.skillLevel,
            duration: item.period,
            monthlyPrice: item.monthlyRate,
            supplier: item.supplier
          })) || [],
          costDepartments: proposal.costDepartments?.map(dept => ({
            department: dept.department,
            percentage: dept.ratio,
            amount: dept.amount
          })) || []
        }));
        
        // 새로 작성된 품의서와 API 데이터 합치기
        formattedProposals = [...formattedProposals, ...apiFormattedProposals];
        
        // 상태별 개수 확인 (변환 후)
        const formattedStatusCount = formattedProposals.reduce((acc, p) => {
          acc[p.status] = (acc[p.status] || 0) + 1;
          return acc;
        }, {});
        console.log('📊 상태별 개수 (변환 후):', formattedStatusCount);
        
        // reset이면 새로 설정, 아니면 기존에 추가
        if (reset || currentPage === 0) {
          console.log(`🔄 상태 리셋: ${formattedProposals.length}개의 품의서로 교체`);
          setContracts(formattedProposals);
          setFilteredContracts(formattedProposals);
        } else {
          console.log(`➕ 기존 목록에 ${formattedProposals.length}개 추가`);
          setContracts(prev => [...prev, ...formattedProposals]);
          setFilteredContracts(prev => [...prev, ...formattedProposals]);
        }
        
        // 전체 로드 모드에서는 더 이상 로드할 데이터가 없음
        if (loadAll || hasActiveFilters()) {
          setHasMore(false);
        } else {
          setHasMore(hasMoreData);
          setPage(currentPage + 1);
        }
      } catch (error) {
        console.error('품의서 데이터 로드 실패:', error);
        if (reset || currentPage === 0) {
          alert('품의서 데이터 로드에 실패했습니다. 서버가 실행 중인지 확인해주세요.');
          // 에러 시 빈 배열로 설정
          setContracts([]);
          setFilteredContracts([]);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    };

  useEffect(() => {
    fetchProposals(true);
  }, []);

  // 무한 스크롤 핸들러
  const handleScroll = () => {
    const scrollableDiv = document.querySelector('.table-responsive');
    if (!scrollableDiv) return;
    
    const { scrollTop, scrollHeight, clientHeight } = scrollableDiv;
    
    // 스크롤이 하단에 가까워지면 (90% 이상 스크롤)
    if (scrollTop + clientHeight >= scrollHeight * 0.9 && !loading) {
      if (hasActiveFilters()) {
        // 필터가 활성화된 경우: 클라이언트에서 더 많은 항목 표시
        const nextEndIndex = (displayPage + 2) * ITEMS_PER_PAGE;
        if (nextEndIndex <= filteredContracts.length && !loadingMore) {
          setLoadingMore(true);
          setTimeout(() => {
            setDisplayPage(prev => prev + 1);
            setLoadingMore(false);
          }, 300); // 약간의 딜레이로 로딩 효과
        }
      } else {
        // 필터가 없는 경우: 서버에서 다음 20개 가져오기
        if (hasMore && !loadingMore) {
          fetchProposals(false);
        }
      }
    }
  };

  // 스크롤 이벤트 리스너 등록
  useEffect(() => {
    const scrollableDiv = document.querySelector('.table-responsive');
    if (scrollableDiv) {
      scrollableDiv.addEventListener('scroll', handleScroll);
      return () => scrollableDiv.removeEventListener('scroll', handleScroll);
    }
  }, [hasMore, loadingMore, loading, page]);

  // 네비게이션 상태 확인 (새로 작성된 품의서 처리)
  useEffect(() => {
    if (location.state?.refreshList) {
      console.log('품의서 목록 새로고침 요청');
      fetchProposals(true);
      
      if (location.state.message) {
        alert(location.state.message);
      }
      
      // 상태 초기화
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // 새로 작성된 품의서 강조 효과 제거 (5초 후)
  useEffect(() => {
    const timer = setTimeout(() => {
      setContracts(prevContracts => 
        prevContracts.map(contract => ({ ...contract, isNew: false }))
      );
      setFilteredContracts(prevContracts => 
        prevContracts.map(contract => ({ ...contract, isNew: false }))
      );
    }, 5000);

    return () => clearTimeout(timer);
  }, [contracts]);

  // 날짜 필터가 활성화되어 있는지 확인하는 함수 (서버 조회용)
  const hasActiveFilters = () => {
    return filters.dateRange !== 'all' ||
           filters.approvalDateRange !== 'all';
  };

  // 필터 적용 함수
  const applyFilters = React.useCallback(() => {
    let filtered = [...contracts];

    // 키워드 검색
    if (filters.keyword) {
      filtered = filtered.filter(contract => 
        contract.title.toLowerCase().includes(filters.keyword.toLowerCase()) ||
        contract.contractor.toLowerCase().includes(filters.keyword.toLowerCase()) ||
        contract.purpose.toLowerCase().includes(filters.keyword.toLowerCase()) ||
        (contract.author && contract.author.toLowerCase().includes(filters.keyword.toLowerCase()))
      );
    }

    // 상태 필터
    if (filters.status !== 'all') {
      filtered = filtered.filter(contract => contract.status === filters.status);
    }

    // 계약 유형 필터
    if (filters.type !== 'all') {
      filtered = filtered.filter(contract => contract.type === filters.type);
    }

    // 부서 필터
    if (filters.department !== 'all') {
      filtered = filtered.filter(contract => contract.department === filters.department);
    }

    // 작성자 필터 (직접 입력 - 부분 일치, 최소 2글자 이상)
    if (filters.authorInput && filters.authorInput.trim().length >= 2) {
      filtered = filtered.filter(contract => 
        contract.author && contract.author.toLowerCase().includes(filters.authorInput.toLowerCase())
      );
    }

    // 등록일 및 결재완료일 필터는 서버에서 처리되므로 클라이언트에서는 제거

    // 금액 범위 필터
    if (filters.amountRange !== 'all') {
      switch (filters.amountRange) {
        case '1천만원 미만':
          filtered = filtered.filter(contract => contract.amount < 10000000);
          break;
        case '1천만원~5천만원':
          filtered = filtered.filter(contract => contract.amount >= 10000000 && contract.amount < 50000000);
          break;
        case '5천만원~1억원':
          filtered = filtered.filter(contract => contract.amount >= 50000000 && contract.amount < 100000000);
          break;
        case '1억원 이상':
          filtered = filtered.filter(contract => contract.amount >= 100000000);
          break;
      }
    }

    // 정렬 적용
    const sortedData = getSortedData(filtered);
    setFilteredContracts(sortedData);
  }, [contracts, filters, sortConfigs]);

  // 날짜 필터 변경 시에만 서버 재조회 (나머지는 캐싱된 데이터에서 클라이언트 필터링)
  useEffect(() => {
    // 날짜 필터만 서버에서 처리 (DB 레벨 필터링으로 효율적)
    const hasDateFilters = filters.dateRange !== 'all' ||
                           filters.approvalDateRange !== 'all';
    
    if (hasDateFilters) {
      // 날짜 필터가 있으면 전체 데이터를 로드 (해당 기간 내)
      fetchProposals(true, true);
    } else {
      // 날짜 필터가 없으면 페이지네이션 모드로 초기 로드
      fetchProposals(true, false);
    }
  }, [filters.dateRange, filters.approvalDateRange]); // 날짜 필터만 의존성에 포함

  // 필터 변경 시 자동 적용
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // filteredContracts가 변경될 때 displayedContracts 업데이트 (20개씩)
  useEffect(() => {
    if (hasActiveFilters()) {
      // 필터가 활성화된 경우: filteredContracts의 처음 20개만 표시
      setDisplayedContracts(filteredContracts.slice(0, ITEMS_PER_PAGE));
      setDisplayPage(0);
    } else {
      // 필터가 없는 경우: filteredContracts 전체 표시 (서버에서 이미 20개씩 가져옴)
      setDisplayedContracts(filteredContracts);
    }
  }, [filteredContracts]);

  // displayPage 변경 시 더 많은 항목 표시
  useEffect(() => {
    if (hasActiveFilters() && displayPage > 0) {
      const endIndex = (displayPage + 1) * ITEMS_PER_PAGE;
      setDisplayedContracts(filteredContracts.slice(0, endIndex));
    }
  }, [displayPage]);

  // 리사이저 공통 스타일
  const resizerStyle = {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: '10px',
    cursor: 'col-resize',
    userSelect: 'none',
    zIndex: 999,
    backgroundColor: 'transparent'
  };

  // 컬럼 리사이징 핸들러
  const handleMouseDown = (e, columnName) => {
    setResizingColumn(columnName);
    setStartX(e.clientX);
    setStartWidth(columnWidths[columnName]);
    e.preventDefault();
  };

  const handleMouseMove = useCallback((e) => {
    if (!resizingColumn) return;
    
    const diff = e.clientX - startX;
    const newWidth = Math.max(50, startWidth + diff); // 최소 너비 50px
    
    setColumnWidths(prev => ({
      ...prev,
      [resizingColumn]: newWidth
    }));
  }, [resizingColumn, startX, startWidth]);

  const handleMouseUp = useCallback(() => {
    if (resizingColumn) {
      // localStorage에 저장
      setColumnWidths(prev => {
        localStorage.setItem('proposalTableColumnWidths', JSON.stringify(prev));
        return prev;
      });
      setResizingColumn(null);
    }
  }, [resizingColumn]);

  // 전역 마우스 이벤트 리스너
  useEffect(() => {
    if (resizingColumn) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [resizingColumn, handleMouseMove, handleMouseUp]);

  // 컬럼 너비 초기화
  const resetColumnWidths = () => {
    const defaultWidths = {
      순번: 60,
      품의서번호: 100,
      계약명: 300,
      요청부서: 120,
      계약금액: 150,
      계약유형: 120,
      상태: 100,
      계약기간: 200,
      등록일: 120,
      결재완료일: 120,
      작성자: 100
    };
    setColumnWidths(defaultWidths);
    localStorage.removeItem('proposalTableColumnWidths');
  };

  // 필터 초기화
  const resetFilters = () => {
    setFilters({
      status: 'all',
      type: 'all',
      department: 'all',
      authorInput: '',
      dateRange: '최근 1년', // 기본값: 최근 1년
      approvalDateRange: 'all', // 결재완료일 필터
      amountRange: 'all',
      keyword: ''
    });
    setSortConfigs([]);
  };

  // 엑셀 다운로드 함수
  const handleExcelDownload = async () => {
    try {
      // 화면에 표시된 필터링된 데이터를 그대로 사용
      const dataToExport = filteredContracts;
      
      console.log(`📊 화면에 표시된 ${dataToExport.length}건의 데이터를 엑셀로 변환합니다.`);
      console.log('현재 필터:', {
        keyword: filters.keyword || '없음',
        status: filters.status,
        type: filters.type,
        department: filters.department,
        authorInput: filters.authorInput || '없음',
        dateRange: filters.dateRange,
        approvalDateRange: filters.approvalDateRange,
        amountRange: filters.amountRange
      });
      
      // 엑셀 형식으로 변환
      const excelData = dataToExport.map((contract, index) => ({
        '번호': index + 1,
        '품의서번호': contract.id || '-',
        '품의서명': contract.title || '-',
        '계약유형': contract.type || contract.contractType || '-',
        '요청부서': Array.isArray(contract.requestDepartments) && contract.requestDepartments.length > 0
          ? contract.requestDepartments.join(', ')
          : (contract.department || '-'),
        '계약업체': contract.contractor || '-',
        '계약금액': contract.amount || 0,
        '작성자': contract.author || '-',
        '상태': contract.status || '-',
        '계약기간': contract.contractPeriod || contract.endDate || '-',
        '계약방법': contract.contractMethod || '-',
        '작성일': contract.createdAt ? new Date(contract.createdAt).toLocaleDateString('ko-KR') : '-',
        '수정일': contract.updatedAt ? new Date(contract.updatedAt).toLocaleDateString('ko-KR') : '-',
        '목적': contract.purpose || '-',
        '근거': contract.basis || '-'
      }));

      // 워크시트 생성
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      
      // 컬럼 너비 설정
      const columnWidths = [
        { wch: 8 },  // 번호
        { wch: 12 }, // 품의서번호
        { wch: 30 }, // 품의서명
        { wch: 12 }, // 계약유형
        { wch: 15 }, // 요청부서
        { wch: 20 }, // 계약업체
        { wch: 15 }, // 계약금액
        { wch: 12 }, // 작성자
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
      XLSX.utils.book_append_sheet(workbook, worksheet, '품의서 목록');

      // 파일명 생성 (날짜 포함)
      const today = new Date();
      const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
      const filename = `품의서_목록_${dateStr}.xlsx`;

      // 엑셀 파일 다운로드
      XLSX.writeFile(workbook, filename);
      
      alert(`${dataToExport.length}건의 품의서 데이터를 엑셀로 다운로드했습니다.`);
    } catch (error) {
      console.error('엑셀 다운로드 실패:', error);
      alert('엑셀 다운로드에 실패했습니다: ' + error.message);
    }
  };

  // 다중정렬 함수
  const handleSort = (key) => {
    console.log('정렬 클릭:', key); // 디버깅용
    setSortConfigs(prevConfigs => {
      const existingIndex = prevConfigs.findIndex(config => config.key === key);
      
      if (existingIndex >= 0) {
        // 이미 정렬 중인 컬럼인 경우
        const existingConfig = prevConfigs[existingIndex];
        if (existingConfig.direction === 'asc') {
          // 오름차순 → 내림차순
          const newConfigs = [...prevConfigs];
          newConfigs[existingIndex] = { ...existingConfig, direction: 'desc' };
          console.log('내림차순으로 변경:', newConfigs); // 디버깅용
          return newConfigs;
        } else {
          // 내림차순 → 정렬 제거
          const newConfigs = prevConfigs.filter((_, index) => index !== existingIndex);
          console.log('정렬 제거:', newConfigs); // 디버깅용
          return newConfigs;
        }
      } else {
        // 새로운 정렬 추가 (최대 3개까지)
        if (prevConfigs.length >= 3) {
          // 가장 오래된 정렬 제거
          const newConfigs = prevConfigs.slice(1);
          const finalConfigs = [...newConfigs, { key, direction: 'asc' }];
          console.log('새 정렬 추가 (기존 제거):', finalConfigs); // 디버깅용
          return finalConfigs;
        } else {
          const newConfigs = [...prevConfigs, { key, direction: 'asc' }];
          console.log('새 정렬 추가:', newConfigs); // 디버깅용
          return newConfigs;
        }
      }
    });
  };

  // 정렬 우선순위 가져오기
  const getSortPriority = (key) => {
    const index = sortConfigs.findIndex(config => config.key === key);
    return index >= 0 ? index + 1 : null;
  };

  // 정렬 방향 가져오기
  const getSortDirection = (key) => {
    const config = sortConfigs.find(config => config.key === key);
    return config ? config.direction : null;
  };

  // 다중정렬된 데이터 생성
  const getSortedData = React.useCallback((data) => {
    console.log('정렬 설정:', sortConfigs); // 디버깅용
    if (sortConfigs.length === 0) {
      console.log('정렬 없음, 원본 데이터 반환'); // 디버깅용
      return data;
    }

    const sortedData = [...data].sort((a, b) => {
      for (const sortConfig of sortConfigs) {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // 숫자 필드 처리
        if (sortConfig.key === 'amount' || sortConfig.key === 'id') {
          aValue = Number(aValue || 0);
          bValue = Number(bValue || 0);
        }
        // 날짜 필드 처리
        else if (sortConfig.key === 'createdAt' || sortConfig.key === 'startDate' || sortConfig.key === 'endDate' || sortConfig.key === 'approvalDate') {
          aValue = new Date(aValue || '1900-01-01');
          bValue = new Date(bValue || '1900-01-01');
        }
        // 문자열 필드 처리
        else {
          aValue = String(aValue || '').toLowerCase();
          bValue = String(bValue || '').toLowerCase();
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
      }
      return 0;
    });

    console.log('정렬된 데이터:', sortedData.slice(0, 3)); // 디버깅용 (처음 3개만)
    return sortedData;
  }, [sortConfigs]);

  const formatCurrency = (amount) => {
    // 소수점 제거하고 정수로 변환
    const integerAmount = Math.round(amount);
    return new Intl.NumberFormat('ko-KR').format(integerAmount) + '원';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\./g, '.');
  };

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\./g, '.');
  };

  const getStatusColor = (status) => {
    // 상태별 색상 매핑
    switch (status) {
      case 'pending':
      case 'submitted': 
        return '#007bff';   // 결재대기: 파란색
      case 'approved': 
        return '#28a745';  // 결재완료: 초록색
      case 'draft': 
        return '#6c757d';     // 작성중: 회색
      default: 
        return '#6c757d';
    }
  };

  const getStatusDisplay = (status) => {
    // 상태를 한글로 변환하여 표시
    return getStatusLabel(status);
  };

  // 미리보기 열기 (리스트 클릭 시)
  const handleRowClick = async (contract) => {
    console.log('🔍 선택된 품의서:', contract);
    try {
      // 현재 로그인한 사용자 정보 가져오기
      const currentUser = await getCurrentUser();
      
      // 서버에서 원본 데이터 조회 (더 상세한 정보를 위해)
      const response = await fetch(`${API_BASE_URL}/api/proposals/${contract.id}`);
      if (response.ok) {
        const originalData = await response.json();
        
        // 🔍 예산 정보 디버깅
        console.log('=== 품의서 상세 조회 예산 정보 ===');
        console.log('budgetId:', originalData.budgetId);
        console.log('operatingBudgetId:', originalData.operatingBudgetId);
        console.log('budgetInfo:', originalData.budgetInfo);
        
        // 원본 데이터와 리스트 데이터를 합쳐서 더 완전한 정보 제공
        const enhancedContract = {
          ...contract,
          ...originalData,
          // 리스트의 포맷된 데이터 유지
          title: contract.title,
          type: contract.type,
          department: contract.department,
          contractor: contract.contractor,
          author: contract.author,
          amount: contract.amount,
          status: contract.status
        };

        // 공통 유틸리티에 맞는 데이터 구조로 변환
        const previewData = {
          title: enhancedContract.title,
          contractType: originalData.contractType || originalData.contract_type || enhancedContract.contractType || enhancedContract.type,
          purpose: enhancedContract.purpose,
          basis: enhancedContract.basis,
          budget: enhancedContract.budgetInfo?.projectName || enhancedContract.budget, // budgetInfo 우선 사용
          budgetInfo: enhancedContract.budgetInfo, // 서버에서 가져온 예산 정보 추가
          contractMethod: originalData.contractMethod || originalData.contract_method || enhancedContract.contractMethod,
          contractMethodDescription: originalData.contract_method_description || enhancedContract.contract_method_description, // 계약방식 설명 추가
          requestDepartments: enhancedContract.requestDepartments && enhancedContract.requestDepartments.length > 0
            ? enhancedContract.requestDepartments.map(d => d.department || d.name || d)
            : (enhancedContract.department ? [enhancedContract.department] : []),
          totalAmount: enhancedContract.amount,
          other: enhancedContract.other,
          purchaseItems: enhancedContract.purchaseItems || [],
          serviceItems: enhancedContract.serviceItems || [],
          costDepartments: enhancedContract.costDepartments || [],
          wysiwygContent: enhancedContract.wysiwygContent || enhancedContract.wysiwyg_content || '' // 자유양식 컨텐츠 추가
        };
        
        console.log('=== ContractList 미리보기 데이터 ===');
        console.log('서버에서 가져온 originalData:', originalData);
        console.log('원본 contract:', enhancedContract);
        console.log('변환된 데이터:', previewData);
        console.log('contractType:', previewData.contractType);
        console.log('wysiwygContent 길이:', previewData.wysiwygContent?.length || 0);
        console.log('contractMethod:', previewData.contractMethod);
        
        // 재활용 버튼 표시 조건 확인
        console.log('=== 재활용 버튼 조건 확인 ===');
        console.log('enhancedContract.status:', enhancedContract.status);
        
        const showRecycleButton = enhancedContract.status === '결재완료' || 
                                 enhancedContract.status === '계약완료' || 
                                 enhancedContract.status === '완료' || 
                                 enhancedContract.status === 'completed' || 
                                 enhancedContract.status === '계약체결' || 
                                 enhancedContract.status === '승인됨';
        
        console.log('showRecycleButton:', showRecycleButton);
        
        const previewHTML = generatePreviewHTML(previewData);
        const previewWindow = window.open('', '_blank', 'width=1200,height=800');
        previewWindow.document.write(previewHTML);
        previewWindow.document.close();
        
        // 미리보기 창이 로드된 후 재활용 버튼 추가
        previewWindow.addEventListener('load', () => {
          const actionButtons = previewWindow.document.querySelector('.action-buttons');
          if (actionButtons) {
            // 재활용 버튼 추가
            const recycleBtn = previewWindow.document.createElement('button');
            recycleBtn.className = 'action-btn recycle-btn';
            recycleBtn.innerHTML = '♻️ 재활용';
            recycleBtn.style.background = '#28a745';
            recycleBtn.style.color = 'white';
            recycleBtn.style.border = 'none';
            recycleBtn.style.padding = '10px 20px';
            recycleBtn.style.borderRadius = '5px';
            recycleBtn.style.cursor = 'pointer';
            recycleBtn.style.fontSize = '14px';
            recycleBtn.style.minWidth = '100px';
            recycleBtn.style.marginRight = '10px';
            
            recycleBtn.onclick = () => {
              if (previewWindow.confirm('이 품의서를 재활용하여 새로운 품의서를 작성하시겠습니까?')) {
                // 부모 창의 함수 호출
                window.handleRecycleProposal(enhancedContract);
                previewWindow.close();
              }
            };
            
            // 수정 버튼 추가 (결재대기 상태만)
            const isWaitingApproval = enhancedContract.status === 'pending' || 
                                     enhancedContract.status === 'draft';
            
            if (isWaitingApproval) {
              const editBtn = previewWindow.document.createElement('button');
              editBtn.className = 'action-btn edit-btn';
              editBtn.innerHTML = '✏️ 수정';
              editBtn.style.background = '#FF9800';
              editBtn.style.color = 'white';
              editBtn.style.border = 'none';
              editBtn.style.padding = '10px 20px';
              editBtn.style.borderRadius = '5px';
              editBtn.style.cursor = 'pointer';
              editBtn.style.fontSize = '14px';
              editBtn.style.minWidth = '100px';
              editBtn.style.marginRight = '10px';
              
              editBtn.onclick = () => {
                if (previewWindow.confirm('이 품의서를 수정하시겠습니까?')) {
                  // 부모 창의 함수 호출
                  window.handleEditProposal(enhancedContract);
                  previewWindow.close();
                }
              };
              
              actionButtons.insertBefore(editBtn, actionButtons.firstChild);
            }
            
            // 상태변경 버튼 추가 (작성자만 가능)
            const isAuthor = currentUser && (
              enhancedContract.createdBy === currentUser.name || 
              enhancedContract.author === currentUser.name
            );
            
            console.log('=== 상태변경 버튼 권한 확인 ===');
            console.log('현재 사용자:', currentUser?.name);
            console.log('품의서 작성자(createdBy):', enhancedContract.createdBy);
            console.log('품의서 작성자(author):', enhancedContract.author);
            console.log('작성자 여부:', isAuthor);
            
            if (isAuthor) {
              const statusBtn = previewWindow.document.createElement('button');
              statusBtn.className = 'action-btn status-btn';
              statusBtn.innerHTML = '🔄 상태변경';
              statusBtn.style.background = '#667eea';
              statusBtn.style.color = 'white';
              statusBtn.style.border = 'none';
              statusBtn.style.padding = '10px 20px';
              statusBtn.style.borderRadius = '5px';
              statusBtn.style.cursor = 'pointer';
              statusBtn.style.fontSize = '14px';
              statusBtn.style.minWidth = '100px';
              statusBtn.style.marginRight = '10px';
              
              statusBtn.onclick = () => {
                // 부모 창의 함수 호출 - contract 직접 전달
                window.openStatusUpdate(enhancedContract);
                previewWindow.close();
              };
              
              // 복사 버튼 앞에 추가
              const copyBtn = actionButtons.querySelector('.copy-btn');
              actionButtons.insertBefore(statusBtn, copyBtn);
            }
            
            // 복사 버튼 앞에 재활용 버튼 추가
            const copyBtn = actionButtons.querySelector('.copy-btn');
            actionButtons.insertBefore(recycleBtn, copyBtn);
          }
        });

        // 메시지 리스너는 더 이상 필요하지 않음 (직접 함수 호출 방식 사용)

      } else {
        // 서버 데이터를 가져올 수 없으면 기본 데이터로 미리보기
        const previewData = {
          contractType: contract.contractType || contract.type,
          purpose: contract.purpose,
          basis: contract.basis,
          budget: contract.budgetInfo?.projectName || contract.budget, // budgetInfo 우선 사용
          budgetInfo: contract.budgetInfo, // 예산 정보 추가 (있는 경우)
          contractMethod: contract.contractMethod,
          requestDepartments: contract.department ? [contract.department] : [],
          totalAmount: contract.amount,
          other: contract.other,
          purchaseItems: [],
          serviceItems: [],
          costDepartments: []
        };
        
        console.log('=== ContractList 기본 미리보기 데이터 ===');
        console.log('원본 contract:', contract);
        console.log('변환된 데이터:', previewData);
        
        // 재활용 버튼 표시 조건 확인
        console.log('=== 기본 재활용 버튼 조건 확인 ===');
        console.log('contract.status:', contract.status);
        
        const showRecycleButton = contract.status === '결재완료' || 
                                 contract.status === '계약완료' || 
                                 contract.status === '완료' || 
                                 contract.status === 'completed' || 
                                 contract.status === '계약체결' || 
                                 contract.status === '승인됨';
        
        console.log('showRecycleButton:', showRecycleButton);
        
        const previewHTML = generatePreviewHTML(previewData);
        const previewWindow = window.open('', '_blank', 'width=1200,height=800');
        previewWindow.document.write(previewHTML);
        previewWindow.document.close();
        
        // 미리보기 창이 로드된 후 재활용 버튼 추가
        previewWindow.addEventListener('load', () => {
          const actionButtons = previewWindow.document.querySelector('.action-buttons');
          if (actionButtons) {
            // 재활용 버튼 추가
            const recycleBtn = previewWindow.document.createElement('button');
            recycleBtn.className = 'action-btn recycle-btn';
            recycleBtn.innerHTML = '♻️ 재활용';
            recycleBtn.style.background = '#28a745';
            recycleBtn.style.color = 'white';
            recycleBtn.style.border = 'none';
            recycleBtn.style.padding = '10px 20px';
            recycleBtn.style.borderRadius = '5px';
            recycleBtn.style.cursor = 'pointer';
            recycleBtn.style.fontSize = '14px';
            recycleBtn.style.minWidth = '100px';
            recycleBtn.style.marginRight = '10px';
            
            recycleBtn.onclick = () => {
              if (previewWindow.confirm('이 품의서를 재활용하여 새로운 품의서를 작성하시겠습니까?')) {
                // 부모 창의 함수 호출 - contract 전달 (기본 데이터)
                window.handleRecycleProposal(contract);
                previewWindow.close();
              }
            };
            
            // 수정 버튼 추가 (결재대기 또는 작성중 상태만) - 기본 데이터
            const isWaitingApproval2 = contract.status === 'pending' || 
                                      contract.status === 'draft';
            
            if (isWaitingApproval2) {
              const editBtn = previewWindow.document.createElement('button');
              editBtn.className = 'action-btn edit-btn';
              editBtn.innerHTML = '✏️ 수정';
              editBtn.style.background = '#FF9800';
              editBtn.style.color = 'white';
              editBtn.style.border = 'none';
              editBtn.style.padding = '10px 20px';
              editBtn.style.borderRadius = '5px';
              editBtn.style.cursor = 'pointer';
              editBtn.style.fontSize = '14px';
              editBtn.style.minWidth = '100px';
              editBtn.style.marginRight = '10px';
              
              editBtn.onclick = () => {
                if (previewWindow.confirm('이 품의서를 수정하시겠습니까?')) {
                  // 부모 창의 함수 호출
                  window.handleEditProposal(contract);
                  previewWindow.close();
                }
              };
              
              actionButtons.insertBefore(editBtn, actionButtons.firstChild);
            }
            
            // 상태변경 버튼 추가 (작성자만 가능)
            const isAuthor2 = currentUser && (
              contract.createdBy === currentUser.name || 
              contract.author === currentUser.name
            );
            
            console.log('=== 상태변경 버튼 권한 확인 (기본) ===');
            console.log('현재 사용자:', currentUser?.name);
            console.log('품의서 작성자(createdBy):', contract.createdBy);
            console.log('품의서 작성자(author):', contract.author);
            console.log('작성자 여부:', isAuthor2);
            
            if (isAuthor2) {
              const statusBtn = previewWindow.document.createElement('button');
              statusBtn.className = 'action-btn status-btn';
              statusBtn.innerHTML = '🔄 상태변경';
              statusBtn.style.background = '#667eea';
              statusBtn.style.color = 'white';
              statusBtn.style.border = 'none';
              statusBtn.style.padding = '10px 20px';
              statusBtn.style.borderRadius = '5px';
              statusBtn.style.cursor = 'pointer';
              statusBtn.style.fontSize = '14px';
              statusBtn.style.minWidth = '100px';
              statusBtn.style.marginRight = '10px';
              
              statusBtn.onclick = () => {
                // 부모 창의 함수 호출 - contract 직접 전달
                window.openStatusUpdate(contract);
                previewWindow.close();
              };
              
              // 복사 버튼 앞에 추가
              const copyBtn = actionButtons.querySelector('.copy-btn');
              actionButtons.insertBefore(statusBtn, copyBtn);
            }
            
            // 복사 버튼 앞에 재활용 버튼 추가
            const copyBtn = actionButtons.querySelector('.copy-btn');
            actionButtons.insertBefore(recycleBtn, copyBtn);
          }
        });

        // 메시지 리스너는 더 이상 필요하지 않음 (직접 함수 호출 방식 사용)
      }

    } catch (error) {
      console.error('미리보기 생성 중 오류:', error);
      alert('미리보기 생성 중 오류가 발생했습니다.');
    }
  };

  // 상세보기 닫기
  const closeDetail = () => {
    setShowDetail(false);
    setSelectedContract(null);
    setShowStatusUpdate(false);
  };

  // 품의서 재활용 함수
  const handleRecycleProposal = async (contract) => {
    try {
      console.log('품의서 재활용 시작:', contract);
      
      // 서버에서 원본 품의서 데이터 조회
              const response = await fetch(`${API_BASE_URL}/api/proposals/${contract.id}`);
      
      if (!response.ok) {
        throw new Error('품의서 데이터 조회 실패');
      }
      
      const originalData = await response.json();
      console.log('🔍 원본 품의서 데이터:', originalData);
      console.log('🔍 원본 품의서 키들:', Object.keys(originalData));
      console.log('🔍 예산 정보 확인:', {
        budgetId: originalData.budgetId,
        operatingBudgetId: originalData.operatingBudgetId,
        budget: originalData.budget,
        budgetInfo: originalData.budgetInfo
      });
      console.log('🔍 구매품목 비용분배 정보 확인:');
      if (originalData.purchaseItems) {
        originalData.purchaseItems.forEach((item, index) => {
          console.log(`  구매품목 ${index + 1} (${item.item}):`, {
            hasCostAllocations: !!item.costAllocations,
            costAllocationsCount: item.costAllocations?.length || 0,
            costAllocations: item.costAllocations
          });
        });
      }
      
      // 예산 ID 결정 (우선순위: budgetId > operatingBudgetId)
      let budgetValue = '';
      let budgetType = 'capital';
      
      if (originalData.budgetId) {
        budgetValue = originalData.budgetId;
        budgetType = 'capital';
      } else if (originalData.operatingBudgetId) {
        budgetValue = originalData.operatingBudgetId;
        budgetType = 'operating';
      } else if (originalData.budget) {
        budgetValue = originalData.budget;
        // budgetInfo가 있으면 budgetType 확인
        if (originalData.budgetInfo?.budgetType === '전산운용비') {
          budgetType = 'operating';
        }
      }
      
      console.log('🔍 재활용 예산 결정:', { budgetValue, budgetType });
      
      // 재활용용 데이터 준비 (기존 수정 기능과 동일한 방식으로 처리)
      const recycleData = {
        // 기본 정보 복사
        contractType: originalData.contractType,
        title: `[재활용] ${originalData.title || originalData.purpose || ''}`,
        purpose: `[재활용] ${originalData.purpose || ''}`,
        basis: originalData.basis || '',
        // 사업예산은 결정된 값 사용
        budget: budgetValue,
        selectedBudgetType: budgetType,
        contractMethod: originalData.contractMethod || '',
        accountSubject: originalData.accountSubject || '',
        
        // 요청부서 처리 (기존 수정 기능과 동일한 방식)
        requestDepartments: (originalData.requestDepartments || []).map(dept => 
          typeof dept === 'string' ? dept : dept.department || dept.name || dept
        ),
        
        // 구매품목의 비용분배 정보 포함 (기존 수정 기능과 동일한 방식)
        purchaseItems: (originalData.purchaseItems || []).map(item => ({
          id: Date.now() + Math.random(), // 새로운 ID 생성
          item: item.item || '',
          productName: item.productName || '',
          quantity: item.quantity || 0,
          unitPrice: item.unitPrice || 0,
          amount: item.amount || 0,
          supplier: item.supplier || '',
          requestDepartments: item.requestDepartments || [],
          // 비용분배 정보를 기존 수정 기능과 동일한 형태로 변환
          costAllocation: {
            type: 'percentage',
            allocations: (item.costAllocations || []).map(alloc => ({
              id: Date.now() + Math.random(),
              department: alloc.department || '',
              type: alloc.type || 'percentage',
              value: parseFloat(alloc.value) || 0
            }))
          }
        })),
        
        // 공급업체 정보
        suppliers: originalData.suppliers || [],
        
        // 변경/연장 계약용
        changeReason: originalData.changeReason || '',
        extensionReason: originalData.extensionReason || '',
        beforeItems: originalData.beforeItems || [],
        afterItems: originalData.afterItems || [],
        
        // 용역품목도 기존 수정 기능과 동일하게 처리
        serviceItems: (originalData.serviceItems || []).map(item => ({
          id: Date.now() + Math.random(), // 새로운 ID 생성
          item: item.item || '',
          name: item.name || '', // 성명
          personnel: item.personnel || '',
          skillLevel: item.skillLevel || '',
          period: item.period || 0,
          monthlyRate: item.monthlyRate || 0,
          contractAmount: item.contractAmount || 0,
          supplier: item.supplier || '',
          creditRating: item.creditRating || '',
          contractPeriodStart: item.contractPeriodStart ? item.contractPeriodStart.split('T')[0] : '', // 계약 시작일 (날짜 형식 변환)
          contractPeriodEnd: item.contractPeriodEnd ? item.contractPeriodEnd.split('T')[0] : '', // 계약 종료일 (날짜 형식 변환)
          paymentMethod: item.paymentMethod || '', // 비용지급방식
          // 비용분배 정보
          costAllocation: {
            type: item.costAllocation?.type || 'percentage',
            allocations: (item.costAllocation?.allocations || []).map(alloc => ({
              id: Date.now() + Math.random(),
              department: alloc.department || '',
              type: alloc.type || 'percentage',
              value: parseFloat(alloc.value) || 0
            }))
          }
        })),
        contractPeriod: originalData.contractPeriod || '',
        paymentMethod: originalData.paymentMethod || '',
        
        // 입찰 계약용
        biddingType: originalData.biddingType || '',
        qualificationRequirements: originalData.qualificationRequirements || '',
        evaluationCriteria: originalData.evaluationCriteria || '',
        priceComparison: originalData.priceComparison || [],
        
        // 새로운 품의서 설정
        id: undefined,
        status: '작성중',
        isDraft: true,
        createdAt: undefined,
        updatedAt: undefined
      };
      
      console.log('🔍 재활용 데이터:', recycleData);
      console.log('🔍 재활용 데이터 키들:', Object.keys(recycleData));
      
      // localStorage에 재활용할 품의서 정보 저장
      localStorage.setItem('recycleProposal', JSON.stringify(recycleData));
      
      // 품의서 작성 화면으로 이동
      navigate('/proposal?recycle=true');
      
      // 성공 메시지
      alert('품의서를 재활용하여 새로운 품의서 작성 화면으로 이동합니다.');
      
    } catch (error) {
      console.error('품의서 재활용 실패:', error);
      alert('품의서 재활용에 실패했습니다. 다시 시도해주세요.');
    }
  };

  // 미리보기 창에서 접근할 수 있도록 전역으로 노출
  window.handleRecycleProposal = handleRecycleProposal;

  // 품의서 수정 함수
  const handleEditProposal = async (contract) => {
    try {
      console.log('품의서 수정 시작:', contract);
      
      // 서버에서 원본 품의서 데이터 조회
      const response = await fetch(`${API_BASE_URL}/api/proposals/${contract.id}`);
      
      if (!response.ok) {
        throw new Error('품의서 데이터 조회 실패');
      }
      
      const originalData = await response.json();
      console.log('🔍 수정할 품의서 데이터:', originalData);
      
      // 수정용 데이터 준비
      const editData = {
        id: originalData.id, // 수정 모드 표시
        contractType: originalData.contractType,
        title: originalData.title,
        purpose: originalData.purpose,
        basis: originalData.basis,
        budget: originalData.budgetId || originalData.operatingBudgetId || originalData.budget,
        selectedBudgetType: originalData.operatingBudgetId ? 'operating' : 'capital',
        contractMethod: originalData.contractMethod,
        accountSubject: originalData.accountSubject,
        totalAmount: originalData.totalAmount,
        changeReason: originalData.changeReason || '',
        extensionReason: originalData.extensionReason || '',
        contractPeriod: originalData.contractPeriod || '',
        contractStartDate: originalData.contractStartDate,
        contractEndDate: originalData.contractEndDate,
        paymentMethod: originalData.paymentMethod,
        wysiwygContent: originalData.wysiwygContent || '',
        
        // 구매품목
        purchaseItems: originalData.purchaseItems?.map(item => ({
          id: item.id,
          item: item.item,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          amount: item.amount,
          supplier: item.supplier,
          contractPeriodType: item.contractPeriodType,
          contractStartDate: item.contractStartDate,
          contractEndDate: item.contractEndDate,
          // 비용분배 정보 (ProposalForm 구조에 맞게 변환)
          costAllocation: {
            type: item.costAllocation?.type || 'percentage',
            allocations: (item.costAllocation?.allocations || []).map(alloc => ({
              id: alloc.id || Date.now() + Math.random(),
              department: alloc.department || '',
              type: alloc.type || 'percentage',
              value: parseFloat(alloc.value) || 0
            }))
          }
        })) || [],
        
        // 용역항목
        serviceItems: originalData.serviceItems?.map(item => ({
          id: item.id,
          item: item.item,
          name: item.name,
          personnel: item.personnel,
          skillLevel: item.skillLevel,
          period: item.period,
          monthlyRate: item.monthlyRate,
          contractAmount: item.contractAmount,
          supplier: item.supplier,
          creditRating: item.creditRating,
          contractPeriodStart: item.contractPeriodStart ? item.contractPeriodStart.split('T')[0] : '', // 계약 시작일 (날짜 형식 변환)
          contractPeriodEnd: item.contractPeriodEnd ? item.contractPeriodEnd.split('T')[0] : '', // 계약 종료일 (날짜 형식 변환)
          paymentMethod: item.paymentMethod || '', // 비용지급방식
          // 비용분배 정보
          costAllocation: {
            type: item.costAllocation?.type || 'percentage',
            allocations: (item.costAllocation?.allocations || []).map(alloc => ({
              id: alloc.id || Date.now() + Math.random(),
              department: alloc.department || '',
              type: alloc.type || 'percentage',
              value: parseFloat(alloc.value) || 0
            }))
          }
        })) || [],
        
        // 비용귀속부서
        costDepartments: originalData.costDepartments?.map(dept => ({
          id: dept.id,
          department: dept.department,
          amount: dept.amount,
          ratio: dept.ratio
        })) || [],
        
        // 요청부서
        requestDepartments: originalData.requestDepartments?.map(dept => dept.department || dept) || [],
        
        // 기타 필드
        other: originalData.other || '',
        status: originalData.status
      };
      
      console.log('✅ 수정용 데이터 준비 완료:', editData);
      
      // ProposalForm으로 이동하면서 데이터 전달
      navigate('/proposal', { 
        state: { 
          proposal: editData,
          isEdit: true
        }
      });
      
    } catch (error) {
      console.error('품의서 수정 오류:', error);
      alert('품의서 수정에 실패했습니다. 다시 시도해주세요.');
    }
  };

  // 미리보기 창에서 접근할 수 있도록 전역으로 노출
  window.handleEditProposal = handleEditProposal;

  // 상태 업데이트 모달 열기
  const openStatusUpdate = (contract = null) => {
    const targetContract = contract || selectedContract;
    
    if (!targetContract) {
      console.error('선택된 품의서가 없습니다.');
      alert('품의서를 먼저 선택해주세요.');
      return;
    }
    
    // contract가 매개변수로 전달된 경우 selectedContract도 업데이트
    if (contract) {
      setSelectedContract(contract);
    }
    
    // 현재 상태 확인
    console.log('현재 품의서 상태:', targetContract.status);
    
    // 이미 결재완료된 경우 변경 불가
    if (targetContract.status === 'approved' || targetContract.status === '결재완료') {
      alert('이미 결재완료된 품의서는 상태를 변경할 수 없습니다.');
      return;
    }
    
    // 결재대기 상태만 결재완료로 변경 가능 (submitted 또는 '결재대기')
    if (targetContract.status !== 'pending' && targetContract.status !== 'submitted' && targetContract.status !== '결재대기') {
      alert('결재대기 상태의 품의서만 결재완료로 변경할 수 있습니다.');
      return;
    }
    
    // 결재완료로만 변경 가능하도록 자동 설정
    setNewStatus('approved');
    setStatusDate(new Date().toISOString().split('T')[0]); // 오늘 날짜를 기본값으로 설정
    setChangeReason('');
    setShowStatusUpdate(true);
  };

  // 미리보기 창에서 접근할 수 있도록 전역으로 노출
  window.openStatusUpdate = openStatusUpdate;
  window.setSelectedContract = setSelectedContract;

  // 상태 업데이트 모달 닫기
  const closeStatusUpdate = () => {
    setShowStatusUpdate(false);
    setNewStatus('');
    setStatusDate('');
    setChangeReason('');
  };

  // 상태 업데이트 실행
  const handleStatusUpdate = async () => {
    if (!statusDate) {
      alert('상태 변경 날짜를 입력해주세요.');
      return;
    }

    try {
      setUpdatingStatus(true);
      
      // 현재 로그인한 사용자 정보 가져오기 (IP 기반 자동 인식)
      const user = await getCurrentUser();
      const currentUserName = user.name;
      
      console.log('상태 업데이트 요청:', {
        id: selectedContract.id,
        status: 'approved',
        statusDate,
        changeReason,
        changedBy: currentUserName
      });
      
      const response = await fetch(`${API_BASE_URL}/api/proposals/${selectedContract.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'approved', // submitted → approved로 변경
          statusDate: statusDate,
          changeReason: changeReason,
          changedBy: currentUserName // 현재 로그인한 사용자 (IP 기반 자동 인식)
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ 서버 응답:', result);
        
        // 모달 닫기
        closeStatusUpdate();
        
        // 품의서 목록 새로고침
        console.log('🔄 품의서 목록 새로고침 시작...');
        await fetchProposals(true); // reset = true로 전체 목록 다시 로드
        console.log('✅ 품의서 목록 새로고침 완료');
        
        alert('상태가 성공적으로 업데이트되었습니다.');
      } else {
        const error = await response.json();
        alert(`상태 업데이트 실패: ${error.error}`);
      }
    } catch (error) {
      console.error('상태 업데이트 오류:', error);
      alert('상태 업데이트에 실패했습니다.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // 결재완료일 업데이트
  const handleApprovalDateUpdate = async (proposalId, currentApprovalDate) => {
    const newApprovalDate = prompt('결재완료일을 입력해주세요 (YYYY-MM-DD 형식):', currentApprovalDate || '');
    
    if (!newApprovalDate) return;
    
    // 날짜 형식 검증
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(newApprovalDate)) {
      alert('올바른 날짜 형식을 입력해주세요 (YYYY-MM-DD)');
      return;
    }
    
    try {
              const response = await fetch(`${API_BASE_URL}/api/proposals/${proposalId}/approval-date`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          approvalDate: newApprovalDate
        })
      });

      if (response.ok) {
        const result = await response.json();
        alert('결재완료일이 성공적으로 업데이트되었습니다.');
        
        // 목록에서 해당 품의서 업데이트
        setContracts(prev => 
          prev.map(contract => 
            contract.id === proposalId 
              ? { ...contract, approvalDate: newApprovalDate }
              : contract
          )
        );
        
        setFilteredContracts(prev => 
          prev.map(contract => 
            contract.id === proposalId 
              ? { ...contract, approvalDate: newApprovalDate }
              : contract
          )
        );
        
        // 선택된 품의서가 있다면 업데이트
        if (selectedContract && selectedContract.id === proposalId) {
          setSelectedContract({
            ...selectedContract,
            approvalDate: newApprovalDate
          });
        }
      } else {
        const error = await response.json();
        alert(`결재완료일 업데이트 실패: ${error.error}`);
      }
    } catch (error) {
      console.error('결재완료일 업데이트 오류:', error);
      alert('결재완료일 업데이트에 실패했습니다.');
    }
  };

  // 계약방식 한글 변환 함수 (DB 기반 + Fallback)
  const getContractMethodText = (method) => {
    if (!method) return '-';
    
    // 이미 한글이면 그대로 반환
    if (/[가-힣]/.test(method) && !method.includes('_')) {
      return method;
    }
    
    // 1순위: DB에서 가져온 매핑 사용
    if (contractMethodsMap[method]) {
      return contractMethodsMap[method];
    }
    
    // 2순위: Fallback 매핑 (구버전 코드)
    const fallbackMap = {
      // 구버전 영문 코드 - 수의계약 제6조 제1항
      'private_contract_6_1_a': '수의계약(제6조 제1항의 가)',
      'private_contract_6_1_b': '수의계약(제6조 제1항의 나)',
      'private_contract_6_1_c': '수의계약(제6조 제1항의 다)',
      'private_contract_6_1_d': '수의계약(제6조 제1항의 라)',
      'private_contract_6_1_e': '수의계약(제6조 제1항의 마)',
      
      // 구버전 영문 코드 - 수의계약 제6조 제2항
      'private_contract_6_2_a': '수의계약(제6조 제2항의 가)',
      'private_contract_6_2_b': '수의계약(제6조 제2항의 나)',
      'private_contract_6_2_c': '수의계약(제6조 제2항의 다)',
      'private_contract_6_2_d': '수의계약(제6조 제2항의 라)',
      'private_contract_6_2_e': '수의계약(제6조 제2항의 마)',
      'private_contract_6_2_f': '수의계약(제6조 제2항의 바)',
      'private_contract_6_2_g': '수의계약(제6조 제2항의 사)',
      
      // 구버전 영문 코드 (일반)
      'private_contract': '수의계약',
      'general_competition': '경쟁계약(일반경쟁계약)',
      'limited_competition': '경쟁계약(제한경쟁계약)',
      'designated_competition': '경쟁계약(지명경쟁계약)',
      'negotiated_competition': '경쟁계약(협상에 의한 계약)',
      'lowest_price': '최저가 계약',
      'lowest': '최저가 계약',
      'bidding': '입찰',
      'competition': '경쟁입찰'
    };
    
    return fallbackMap[method] || method;
  };

  if (loading) {
    return (
      <div className="loading">
        <h2>품의서 데이터를 불러오는 중...</h2>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="contract-list">
      <h1>품의서 조회</h1>
      
      {/* 안내 문구 */}
      {(filters.dateRange !== 'all' || filters.approvalDateRange !== 'all') && (
        <div style={{ 
          padding: '10px 15px', 
          marginBottom: '15px', 
          backgroundColor: '#e3f2fd', 
          border: '1px solid #2196f3',
          borderRadius: '4px',
          color: '#1976d2',
          fontSize: '0.9rem'
        }}>
          ℹ️ 현재 {filters.dateRange !== 'all' && <><strong>등록일: {filters.dateRange}</strong></>}
          {filters.dateRange !== 'all' && filters.approvalDateRange !== 'all' && ', '}
          {filters.approvalDateRange !== 'all' && <><strong>결재완료일: {filters.approvalDateRange}</strong></>}
          {' '}데이터만 조회되고 있습니다. 전체 데이터를 보려면 '전체'로 선택하세요.
        </div>
      )}
      
      {/* 다중조건 필터 섹션 */}
      <div className="filter-section">
        <div className="filter-grid">
          <div className="filter-group">
            <label>키워드 검색:</label>
            <input
              type="text"
              placeholder="계약명, 업체명, 작성자, 목적 검색..."
              value={filters.keyword}
              onChange={(e) => setFilters({...filters, keyword: e.target.value})}
            />
          </div>
          
          <div className="filter-group">
            <label>상태:</label>
            <select 
              value={filters.status} 
              onChange={(e) => setFilters({...filters, status: e.target.value})}
            >
              {statusOptions.map(option => (
                <option key={option} value={option === '전체' ? 'all' : option}>
                  {option}
                </option>
              ))}
            </select>
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
          
          <div className="filter-group">
            <label>요청부서:</label>
            <select 
              value={filters.department} 
              onChange={(e) => setFilters({...filters, department: e.target.value})}
            >
              {departmentOptions.map(option => (
                <option key={option} value={option === '전체' ? 'all' : option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          
          <div className="filter-group">
            <label>작성자:</label>
            <input
              type="text"
              placeholder="작성자명 검색 (2글자 이상)..."
              value={filters.authorInput}
              onChange={(e) => setFilters({...filters, authorInput: e.target.value})}
            />
          </div>
          
          <div className="filter-group">
            <label>등록일:</label>
            <select 
              value={filters.dateRange} 
              onChange={(e) => setFilters({...filters, dateRange: e.target.value})}
            >
              {dateRangeOptions.map(option => (
                <option key={option} value={option === '전체' ? 'all' : option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          
          <div className="filter-group">
            <label>결재완료일:</label>
            <select 
              value={filters.approvalDateRange} 
              onChange={(e) => setFilters({...filters, approvalDateRange: e.target.value})}
            >
              {dateRangeOptions.map(option => (
                <option key={option} value={option === '전체' ? 'all' : option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          
          <div className="filter-group">
            <label>계약금액:</label>
            <select 
              value={filters.amountRange} 
              onChange={(e) => setFilters({...filters, amountRange: e.target.value})}
            >
              {amountRangeOptions.map(option => (
                <option key={option} value={option === '전체' ? 'all' : option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="filter-actions">
          <div className="action-buttons-left">
            <button className="reset-btn" onClick={resetFilters}>
              🔄 필터 초기화
            </button>
            <button className="excel-download-btn" onClick={handleExcelDownload}>
              📥 엑셀 다운로드
            </button>
          </div>
          <div className="result-info">
            <span className="result-count">
              {hasActiveFilters() ? (
                <>
                  검색 결과: {filteredContracts.length}건
                  {displayedContracts.length < filteredContracts.length && ` (${displayedContracts.length}건 표시 중)`}
                </>
              ) : (
                <>
                  전체 품의서: {totalCount > 0 ? totalCount : contracts.length}건
                  {contracts.length < totalCount && ` (${contracts.length}건 로드됨)`}
                </>
              )}
            </span>
            {sortConfigs.length > 0 && (
              <span className="sort-info">
                정렬: {sortConfigs.map((config, index) => {
                  const fieldNames = {
                    id: '품의서번호',
                    title: '계약명',
                    department: '요청부서',
                    author: '작성자',
                    amount: '계약금액',
                    type: '계약유형',
                    status: '상태',
                    startDate: '계약기간',
                    createdAt: '등록일',
                    approvalDate: '결재완료일'
                  };
                  return `${fieldNames[config.key]} ${config.direction === 'asc' ? '↑' : '↓'}`;
                }).join(', ')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 품의서 목록 */}
      <div className="proposals-list-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3>품의서 목록 {hasActiveFilters() ? `(검색결과 ${filteredContracts.length}건)` : `(전체 ${totalCount > 0 ? totalCount : contracts.length}건)`}</h3>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {sortConfigs.length > 0 && (
              <button 
                onClick={resetFilters}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '500'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#5a6268'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#6c757d'}
              >
                🔄 정렬 초기화
              </button>
            )}
            <button 
              onClick={resetColumnWidths}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '500'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#5a6268'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#6c757d'}
            >
              ↔️ 컬럼 너비 초기화
            </button>
          </div>
        </div>
        <div className="table-responsive">
          <table className="proposals-list-table">
          <thead>
            <tr>
              <th style={{ width: `${columnWidths['순번']}px`, textAlign: 'center', position: 'relative' }}>
                순번
                <div 
                  style={resizerStyle}
                  onMouseDown={(e) => handleMouseDown(e, '순번')}
                />
              </th>
              <th 
                style={{ width: `${columnWidths['품의서번호']}px`, textAlign: 'center', position: 'relative' }}
                className="sortable-header"
                onClick={() => handleSort('id')}
              >
                품의서번호
                {getSortDirection('id') && (
                  <span className="sort-indicator">
                    {getSortDirection('id') === 'asc' ? ' ↑' : ' ↓'}
                    <span className="sort-priority">{getSortPriority('id')}</span>
                  </span>
                )}
                <div 
                  style={resizerStyle}
                  onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, '품의서번호'); }}
                />
              </th>
              <th 
                style={{ width: `${columnWidths['계약명']}px`, position: 'relative' }}
                className="sortable-header"
                onClick={() => handleSort('title')}
              >
                계약명
                {getSortDirection('title') && (
                  <span className="sort-indicator">
                    {getSortDirection('title') === 'asc' ? ' ↑' : ' ↓'}
                    <span className="sort-priority">{getSortPriority('title')}</span>
                  </span>
                )}
                <div 
                  style={resizerStyle}
                  onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, '계약명'); }}
                />
              </th>
              <th 
                style={{ width: `${columnWidths['요청부서']}px`, position: 'relative' }}
                className="sortable-header"
                onClick={() => handleSort('department')}
              >
                요청부서
                {getSortDirection('department') && (
                  <span className="sort-indicator">
                    {getSortDirection('department') === 'asc' ? ' ↑' : ' ↓'}
                    <span className="sort-priority">{getSortPriority('department')}</span>
                  </span>
                )}
                <div 
                  style={resizerStyle}
                  onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, '요청부서'); }}
                />
              </th>
              <th 
                style={{ width: `${columnWidths['계약금액']}px`, position: 'relative' }}
                className="sortable-header"
                onClick={() => handleSort('amount')}
              >
                계약금액
                {getSortDirection('amount') && (
                  <span className="sort-indicator">
                    {getSortDirection('amount') === 'asc' ? ' ↑' : ' ↓'}
                    <span className="sort-priority">{getSortPriority('amount')}</span>
                  </span>
                )}
                <div 
                  style={resizerStyle}
                  onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, '계약금액'); }}
                />
              </th>
              <th 
                style={{ width: `${columnWidths['계약유형']}px`, position: 'relative' }}
                className="sortable-header"
                onClick={() => handleSort('type')}
              >
                계약유형
                {getSortDirection('type') && (
                  <span className="sort-indicator">
                    {getSortDirection('type') === 'asc' ? ' ↑' : ' ↓'}
                    <span className="sort-priority">{getSortPriority('type')}</span>
                  </span>
                )}
                <div 
                  style={resizerStyle}
                  onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, '계약유형'); }}
                />
              </th>
              <th 
                style={{ width: `${columnWidths['상태']}px`, position: 'relative' }}
                className="sortable-header"
                onClick={() => handleSort('status')}
              >
                상태
                {getSortDirection('status') && (
                  <span className="sort-indicator">
                    {getSortDirection('status') === 'asc' ? ' ↑' : ' ↓'}
                    <span className="sort-priority">{getSortPriority('status')}</span>
                  </span>
                )}
                <div 
                  style={resizerStyle}
                  onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, '상태'); }}
                />
              </th>
              <th 
                style={{ width: `${columnWidths['계약기간']}px`, position: 'relative' }}
                className="sortable-header"
                onClick={() => handleSort('startDate')}
              >
                계약기간
                {getSortDirection('startDate') && (
                  <span className="sort-indicator">
                    {getSortDirection('startDate') === 'asc' ? ' ↑' : ' ↓'}
                    <span className="sort-priority">{getSortPriority('startDate')}</span>
                  </span>
                )}
                <div 
                  style={resizerStyle}
                  onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, '계약기간'); }}
                />
              </th>
              <th 
                style={{ width: `${columnWidths['등록일']}px`, position: 'relative' }}
                className="sortable-header"
                onClick={() => handleSort('createdAt')}
              >
                등록일
                {getSortDirection('createdAt') && (
                  <span className="sort-indicator">
                    {getSortDirection('createdAt') === 'asc' ? ' ↑' : ' ↓'}
                    <span className="sort-priority">{getSortPriority('createdAt')}</span>
                  </span>
                )}
                <div 
                  style={resizerStyle}
                  onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, '등록일'); }}
                />
              </th>
              <th 
                style={{ width: `${columnWidths['결재완료일']}px`, position: 'relative' }}
                className="sortable-header"
                onClick={() => handleSort('approvalDate')}
              >
                결재완료일
                {getSortDirection('approvalDate') && (
                  <span className="sort-indicator">
                    {getSortDirection('approvalDate') === 'asc' ? ' ↑' : ' ↓'}
                    <span className="sort-priority">{getSortPriority('approvalDate')}</span>
                  </span>
                )}
                <div 
                  style={resizerStyle}
                  onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, '결재완료일'); }}
                />
              </th>
              <th 
                style={{ width: `${columnWidths['작성자']}px`, position: 'relative' }}
                className="sortable-header"
                onClick={() => handleSort('author')}
              >
                작성자
                {getSortDirection('author') && (
                  <span className="sort-indicator">
                    {getSortDirection('author') === 'asc' ? ' ↑' : ' ↓'}
                    <span className="sort-priority">{getSortPriority('author')}</span>
                  </span>
                )}
                <div 
                  style={resizerStyle}
                  onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, '작성자'); }}
                />
              </th>
            </tr>
          </thead>
          <tbody>
            {displayedContracts.map((contract, index) => (
              <tr 
                key={contract.id} 
                className={`proposal-row ${contract.isNew ? 'new-proposal-row' : ''}`}
                onClick={() => handleRowClick(contract)}
              >
                <td style={{ textAlign: 'center' }}>{index + 1}</td>
                <td style={{ textAlign: 'center', fontWeight: '500' }}>{contract.id}</td>
                <td>{contract.title}</td>
                <td>
                  {contract.requestDepartments && contract.requestDepartments.length > 0
                    ? contract.requestDepartments.map(d => d.department).join(', ')
                    : (contract.department || '-')
                  }
                </td>
                <td>{formatCurrency(contract.amount)}</td>
                <td>{contract.type}</td>
                <td>
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(contract.status) }}
                  >
                    {getStatusDisplay(contract.status)}
                  </span>
                </td>
                <td>{formatDate(contract.startDate)} ~ {formatDate(contract.endDate)}</td>
                <td>{formatDate(contract.createdAt)}</td>
                <td>{contract.approvalDate ? formatDate(contract.approvalDate) : '-'}</td>
                <td>{contract.author || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* 무한 스크롤 로딩 인디케이터 */}
        {loadingMore && (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ 
              display: 'inline-block', 
              width: '40px', 
              height: '40px', 
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #3498db',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
            <p style={{ marginTop: '10px', color: '#666' }}>더 불러오는 중...</p>
          </div>
        )}
        
        {/* 필터 활성화 시: 모든 필터링 결과 표시 완료 */}
        {hasActiveFilters() && displayedContracts.length >= filteredContracts.length && filteredContracts.length > 0 && (
          <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
            모든 필터링 결과를 표시했습니다.
          </div>
        )}
        
        {/* 필터 비활성화 시: 모든 품의서 로드 완료 */}
        {!hasActiveFilters() && !hasMore && contracts.length > 0 && (
          <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
            모든 품의서를 불러왔습니다.
          </div>
        )}
        </div>
      </div>

      {/* 상세보기 모달 */}
      {showDetail && selectedContract && (
        <div className="detail-modal">
          <div className="detail-content">
            <div className="detail-header">
              <h2>품의서 상세 정보</h2>
              <div className="detail-actions">
                {selectedContract.status === 'approved' && (
                  <button onClick={() => handleRecycleProposal(selectedContract)} className="recycle-btn">
                    재활용
                  </button>
                )}
                <button onClick={openStatusUpdate} className="status-update-btn">
                  상태 변경
                </button>
                <button onClick={closeDetail} className="close-btn">
                  닫기
                </button>
              </div>
            </div>
            
            <div className="detail-body">
              <div className="detail-section">
                <h3>기본 정보</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>계약명:</label>
                    <span>{selectedContract.title}</span>
                  </div>
                  <div className="detail-item">
                    <label>계약 유형:</label>
                    <span>{selectedContract.type}</span>
                  </div>
                  <div className="detail-item">
                    <label>상태:</label>
                    <span className="status-badge" style={{ backgroundColor: getStatusColor(selectedContract.status) }}>
                      {getStatusLabel(selectedContract.status)}
                    </span>
                  </div>
                  <div className="detail-item">
                    <label>계약업체:</label>
                    <span>{selectedContract.contractor}</span>
                  </div>
                  <div className="detail-item">
                    <label>요청부서:</label>
                    <span>{selectedContract.department}</span>
                  </div>
                  <div className="detail-item">
                    <label>작성자:</label>
                    <span>{selectedContract.author || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <label>계약금액:</label>
                    <span className="amount">{formatCurrency(selectedContract.amount)}</span>
                  </div>
                  <div className="detail-item">
                    <label>계약기간:</label>
                    <span>{formatDate(selectedContract.startDate)} ~ {formatDate(selectedContract.endDate)}</span>
                  </div>
                  <div className="detail-item">
                    <label>계약방식:</label>
                    <span>{getContractMethodText(selectedContract.contractMethod)}</span>
                  </div>
                  {(selectedContract.type === '구매계약' || selectedContract.type === '변경계약' || selectedContract.type === '연장계약') && (
                    <>
                      <div className="detail-item">
                        <label>품의작성일:</label>
                        <span>{formatDateForDisplay(selectedContract.proposalDate || selectedContract.createdAt)}</span>
                      </div>
                      <div className="detail-item">
                        <label>결재완료일:</label>
                        <span>{formatDateForDisplay(selectedContract.approvalDate)}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="detail-section">
                <h3>품의 내용</h3>
                <div className="detail-grid">
                  <div className="detail-item full-width">
                    <label>목적:</label>
                    <span>{selectedContract.purpose}</span>
                  </div>
                  <div className="detail-item full-width">
                    <label>근거:</label>
                    <span>{selectedContract.basis}</span>
                  </div>
                  <div className="detail-item">
                    <label>요청부서:</label>
                    <span>{selectedContract.requestDepartments.map(dept => 
                      typeof dept === 'string' ? dept : dept.name || dept
                    ).join(', ')}</span>
                  </div>
                  <div className="detail-item">
                    <label>결재라인:</label>
                    <span>{selectedContract.approvalLine}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h3>예산 정보</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>예산:</label>
                    <span>{selectedContract.budget || '-'}</span>
                  </div>
                  {selectedContract.budgetInfo && (
                    <>
                      <div className="detail-item">
                        <label>예산유형:</label>
                        <span>{selectedContract.budgetInfo.budgetType || '-'}</span>
                      </div>
                      <div className="detail-item">
                        <label>예산연도:</label>
                        <span>{selectedContract.budgetInfo.budgetYear || '-'}</span>
                      </div>
                    </>
                  )}
                  <div className="detail-item">
                    <label>계약방법:</label>
                    <span>{selectedContract.contractMethod || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <label>계정과목:</label>
                    <span>{selectedContract.accountSubject || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <label>계약기간:</label>
                    <span>{selectedContract.contractPeriod || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <label>지급방법:</label>
                    <span>{selectedContract.paymentMethod || '-'}</span>
                  </div>
                </div>
              </div>

              {(selectedContract.type === '구매계약' || selectedContract.type === '변경계약' || selectedContract.type === '연장계약') && (
                <div className="detail-section">
                  <h3>구매 내역</h3>
                  <div className="detail-table">
                    <table>
                      <thead>
                        <tr>
                          <th>구매품목</th>
                          <th>제품명</th>
                          <th>수량</th>
                          <th>단가</th>
                          <th>금액</th>
                          <th>공급업체</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedContract.items.map((item, index) => (
                          <tr key={index}>
                            <td>{item.item}</td>
                            <td>{item.productName}</td>
                            <td>{item.quantity}</td>
                            <td>{formatCurrency(item.unitPrice)}</td>
                            <td>{formatCurrency(item.quantity * item.unitPrice)}</td>
                            <td>{item.supplier}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 비용귀속분배 정보 섹션 */}
              {(selectedContract.type === '구매계약' || selectedContract.type === '변경계약' || selectedContract.type === '연장계약') && (
                <div className="detail-section">
                  <h3>비용귀속분배 정보</h3>
                  {(() => {
                    // 구매품목별 비용분배 정보 수집
                    const costAllocations = [];
                    if (selectedContract.items && selectedContract.items.length > 0) {
                      selectedContract.items.forEach((item, itemIndex) => {
                        if (item.costAllocations && item.costAllocations.length > 0) {
                          item.costAllocations.forEach(alloc => {
                            costAllocations.push({
                              itemName: item.item,
                              productName: item.productName,
                              department: alloc.department,
                              type: alloc.type,
                              value: alloc.value,
                              amount: alloc.amount
                            });
                          });
                        }
                      });
                    }

                    if (costAllocations.length === 0) {
                      return (
                        <div className="no-data-message">
                          <p>비용귀속분배 정보가 없습니다.</p>
                        </div>
                      );
                    }

                    return (
                      <div className="detail-table">
                        <table>
                          <thead>
                            <tr>
                              <th>구매품목</th>
                              <th>제품명</th>
                              <th>귀속부서</th>
                              <th>분배방식</th>
                              <th>분배값</th>
                              <th>분배금액</th>
                            </tr>
                          </thead>
                          <tbody>
                            {costAllocations.map((alloc, index) => (
                              <tr key={index}>
                                <td>{alloc.itemName}</td>
                                <td>{alloc.productName}</td>
                                <td>{alloc.department}</td>
                                <td>{alloc.type === 'percentage' ? '비율' : '금액'}</td>
                                <td>
                                  {alloc.type === 'percentage' 
                                    ? `${alloc.value}%` 
                                    : formatCurrency(alloc.value)
                                  }
                                </td>
                                <td>{formatCurrency(alloc.amount)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  })()}
                </div>
              )}

              {selectedContract.type === '용역계약' && (
                <div className="detail-section">
                  <h3>용역 내역</h3>
                  <div className="detail-table">
                    <table>
                      <thead>
                        <tr>
                          <th>용역 항목</th>
                          <th>성명</th>
                          <th>기술등급</th>
                          <th>기간(월)</th>
                          <th>단가(월)</th>
                          <th>계약금액</th>
                          <th>공급업체</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedContract.items.map((item, index) => (
                          <tr key={index}>
                            <td>{item.item}</td>
                            <td>{item.name || item.personnel || '-'}</td>
                            <td>{item.techLevel}</td>
                            <td>{item.duration}개월</td>
                            <td>{formatCurrency(item.monthlyPrice)}</td>
                            <td>{formatCurrency(item.monthlyPrice * item.duration)}</td>
                            <td>{item.supplier}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {selectedContract.costDepartments && selectedContract.costDepartments.length > 0 && (
                <div className="detail-section">
                  <h3>비용귀속 부서 배분</h3>
                  <div className="detail-table">
                    <table>
                      <thead>
                        <tr>
                          <th>부서</th>
                          <th>배분 비율</th>
                          <th>배분 금액</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedContract.costDepartments.map((dept, index) => (
                          <tr key={index}>
                            <td>{dept.department}</td>
                            <td>{dept.percentage}%</td>
                            <td>{formatCurrency(dept.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="detail-section">
                <h3>이력 정보</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>등록일:</label>
                    <span>{formatDate(selectedContract.createdAt)}</span>
                  </div>
                  <div className="detail-item">
                    <label>수정일:</label>
                    <span>{formatDate(selectedContract.updatedAt)}</span>
                  </div>
                </div>
              </div>

              {/* 상태 변경 이력 섹션 */}
              <div className="detail-section">
                <h3>상태 변경 이력</h3>
                {statusHistory.length > 0 ? (
                  <div className="history-list">
                    {statusHistory.map((item, index) => (
                      <div key={index} className="history-item">
                        <div className="history-status">
                          <span className="previous-status">{item.previousStatus}</span>
                          <span className="arrow">→</span>
                          <span className="new-status">{item.newStatus}</span>
                        </div>
                        <div className="history-details">
                          <span className="history-date">{formatDate(item.createdAt)}</span>
                          <span className="history-user">{item.changedBy}</span>
                          {item.changeReason && (
                            <span className="history-reason">({item.changeReason})</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-history">
                    <p>상태 변경 이력이 없습니다.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 상태 업데이트 모달 */}
      {showStatusUpdate && selectedContract && (
        <div className="status-update-modal">
          <div className="modal-content">
            <h2>상태 업데이트</h2>
            <div className="modal-body">
              <div className="form-group">
                <label>현재 상태:</label>
                <span className="current-status">{getStatusDisplay(selectedContract.status)}</span>
              </div>
              <div className="form-group">
                <label>새로운 상태:</label>
                <input 
                  type="text" 
                  value="결재완료" 
                  readOnly 
                  style={{ 
                    backgroundColor: '#f0f0f0', 
                    cursor: 'not-allowed',
                    border: '1px solid #ddd',
                    padding: '8px',
                    borderRadius: '4px'
                  }}
                />
                <small style={{ color: '#666', fontSize: '0.85em', marginTop: '4px', display: 'block' }}>
                  ℹ️ 결재대기 상태는 결재완료로만 변경할 수 있습니다.
                </small>
              </div>
              <div className="form-group">
                <label>상태 변경 날짜:</label>
                <input
                  type="date"
                  value={statusDate}
                  onChange={(e) => setStatusDate(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>변경 사유:</label>
                <textarea
                  placeholder="변경 사유를 입력해주세요."
                  value={changeReason}
                  onChange={(e) => setChangeReason(e.target.value)}
                  rows="4"
                ></textarea>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={closeStatusUpdate} className="cancel-btn">취소</button>
              <button onClick={handleStatusUpdate} className="update-btn" disabled={updatingStatus}>
                {updatingStatus ? '업데이트 중...' : '상태 업데이트'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx="true">{`
        .contract-list {
          padding: 2rem;
          max-width: 1400px;
          margin: 0 auto;
        }

        .personnel-stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .personnel-stat-card {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          padding: 1.5rem 2rem;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          transition: transform 0.2s, box-shadow 0.2s;
          border-left: 4px solid;
        }

        .personnel-stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        .personnel-stat-card.active {
          border-left-color: #10b981;
          background: linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%);
        }

        .personnel-stat-card.expiring {
          border-left-color: #f59e0b;
          background: linear-gradient(135deg, #ffffff 0%, #fffbeb 100%);
        }

        .personnel-stat-card .stat-icon {
          font-size: 3rem;
          min-width: 60px;
          text-align: center;
        }

        .personnel-stat-card .stat-content {
          flex: 1;
        }

        .personnel-stat-card .stat-number {
          font-size: 2.5rem;
          font-weight: bold;
          color: #333;
          margin-bottom: 0.3rem;
          line-height: 1;
        }

        .personnel-stat-card .stat-label {
          color: #666;
          font-size: 1rem;
          font-weight: 500;
        }

        @media (max-width: 768px) {
          .personnel-stats-grid {
            grid-template-columns: 1fr;
          }

          .personnel-stat-card .stat-number {
            font-size: 2rem;
          }

          .personnel-stat-card .stat-icon {
            font-size: 2.5rem;
            min-width: 50px;
          }
        }

        .filter-section {
          background: white;
          padding: 2rem;
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

        .action-buttons-left {
          display: flex;
          gap: 1rem;
          align-items: center;
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

        .sort-info {
          font-size: 0.85rem;
          color: #6c757d;
          font-style: italic;
        }

        .proposals-list-section {
          background: white;
          border-radius: 8px;
          padding: 1.5rem;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .proposals-list-section h3 {
          font-size: 1.1rem;
          font-weight: 600;
          color: #2c3e50;
          margin: 0;
          padding-bottom: 0.5rem;
          border-bottom: 2px solid #f0f3f5;
        }

        .table-responsive {
          overflow-x: auto;
          max-height: 600px;
          overflow-y: auto;
        }

        .proposals-list-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.9rem;
          table-layout: fixed;
        }

        .proposals-list-table thead {
          background: #f8f9fa;
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .proposals-list-table th {
          padding: 0.75rem 0.5rem;
          text-align: left;
          font-weight: 600;
          color: #495057;
          border-bottom: 2px solid #dee2e6;
          white-space: nowrap;
        }

        .proposals-list-table td {
          padding: 0.75rem 0.5rem;
          border-bottom: 1px solid #dee2e6;
          color: #495057;
        }

        .proposals-list-table tbody tr {
          cursor: pointer;
        }

        .proposals-list-table tbody tr:hover {
          background: #e3f2fd;
          transition: background 0.2s;
        }

        .sortable-header {
          cursor: pointer;
          user-select: none;
          transition: background-color 0.2s;
        }

        .column-resizer {
          position: absolute;
          right: 0;
          top: 0;
          bottom: 0;
          width: 5px;
          cursor: col-resize;
          user-select: none;
          z-index: 11;
        }

        .column-resizer:hover {
          background-color: #667eea;
        }

        .column-resizer:active {
          background-color: #5568d3;
        }

        .sortable-header:hover {
          background-color: #e9ecef;
        }

        .sort-indicator {
          margin-left: 5px;
          font-weight: bold;
          color: #007bff;
        }

        .sort-priority {
          background: #007bff;
          color: white;
          border-radius: 50%;
          width: 16px;
          height: 16px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          margin-left: 3px;
          font-weight: bold;
        }

        .proposal-row {
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .proposal-row:hover {
          background-color: #e3f2fd !important;
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .proposal-row:active {
          transform: translateY(0);
        }

        .status-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          color: white;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .clickable-status {
          cursor: pointer;
        }

        /* 상세보기 모달 스타일 */
        .detail-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }

        .detail-content {
          background: white;
          border-radius: 12px;
          max-width: 1200px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }

        .detail-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 2rem 2rem 1rem 2rem;
          border-bottom: 2px solid #e1e5e9;
        }

        .detail-header h2 {
          margin: 0;
          color: #333;
          font-size: 1.8rem;
        }

        .detail-actions {
          display: flex;
          gap: 1rem;
        }

        .recycle-btn {
          background: #28a745;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .recycle-btn:hover {
          background: #218838;
          transform: translateY(-2px);
        }

        .status-update-btn {
          background: #667eea;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .status-update-btn:hover {
          background: #5a67d8;
          transform: translateY(-2px);
        }

        .close-btn {
          background: #dc3545;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          font-size: 1.2rem;
        }

        .detail-body {
          padding: 2rem;
        }

        .detail-section {
          margin-bottom: 2rem;
        }

        .detail-section h3 {
          color: #333;
          font-size: 1.3rem;
          margin-bottom: 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid #e1e5e9;
        }

        .detail-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1rem;
        }

        .detail-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          background: #f8f9fa;
          border-radius: 6px;
        }

        .detail-item.full-width {
          grid-column: 1 / -1;
          flex-direction: column;
          align-items: flex-start;
          gap: 0.5rem;
        }

        .detail-item label {
          font-weight: 600;
          color: #333;
          min-width: 100px;
        }

        .detail-item .amount {
          font-weight: 700;
          color: #667eea;
          font-size: 1.1rem;
        }

        .detail-table {
          overflow-x: auto;
        }

        .detail-table table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 1rem;
        }

        .detail-table th,
        .detail-table td {
          padding: 0.75rem;
          text-align: left;
          border-bottom: 1px solid #e1e5e9;
        }

        .detail-table th {
          background: #f8f9fa;
          font-weight: 600;
          color: #333;
        }

        .no-data-message {
          text-align: center;
          padding: 2rem;
          color: #666;
          font-style: italic;
          background: #f8f9fa;
          border-radius: 8px;
          border: 1px solid #e1e5e9;
        }

        .no-data-message p {
          margin: 0;
        }

        /* 상태 업데이트 모달 스타일 */
        .status-update-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }

        .modal-content {
          background: white;
          border-radius: 12px;
          max-width: 500px;
          width: 90%;
          padding: 2rem;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }

        .modal-content h2 {
          margin-top: 0;
          margin-bottom: 1.5rem;
          color: #333;
          font-size: 1.6rem;
          text-align: center;
        }

        .modal-body {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 2rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid #e1e5e9;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-group label {
          font-weight: 600;
          color: #333;
          font-size: 0.9rem;
          margin-bottom: 0.5rem;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          padding: 0.75rem;
          border: 2px solid #e1e5e9;
          border-radius: 8px;
          font-size: 1rem;
          transition: border-color 0.3s ease;
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #667eea;
        }

        .modal-footer {
          display: flex;
          justify-content: space-between;
          gap: 1rem;
        }

        .cancel-btn,
        .update-btn {
          flex: 1;
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .cancel-btn {
          background: #dc3545;
          color: white;
        }

        .cancel-btn:hover {
          background: #c82333;
          transform: translateY(-2px);
        }

        .update-btn {
          background: #667eea;
          color: white;
        }

        .update-btn:hover {
          background: #5a67d8;
          transform: translateY(-2px);
        }

        .update-btn:disabled {
          background: #a0aec0;
          cursor: not-allowed;
          transform: none;
        }

        .current-status {
          font-weight: 700;
          color: #667eea;
          font-size: 1.1rem;
        }

        /* 히스토리 모달 스타일 */
        .history-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }

        .history-modal .modal-content {
          background: white;
          border-radius: 12px;
          max-width: 800px;
          width: 95%;
          max-height: 80vh;
          overflow-y: auto;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .history-modal h2 {
          margin-top: 0;
          margin-bottom: 1.5rem;
          color: #333;
          font-size: 1.6rem;
          text-align: center;
        }

        .history-list {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .history-item {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 1rem;
          border: 1px solid #e1e5e9;
        }

        .history-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid #e1e5e9;
        }

        .history-date {
          font-weight: 600;
          color: #6c757d;
          font-size: 0.9rem;
        }

        .history-user {
          font-size: 0.9rem;
          color: #6c757d;
        }

        .history-details p {
          margin-bottom: 0.5rem;
          line-height: 1.5;
        }

        .history-details strong {
          font-weight: 700;
          color: #333;
        }

        .loading-spinner {
          border: 4px solid #f3f3f3;
          border-top: 4px solid #667eea;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin-top: 1rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .contract-list {
            padding: 1rem;
          }

          .filter-grid {
            grid-template-columns: 1fr;
          }

          .filter-actions {
            flex-direction: column;
            gap: 1rem;
            align-items: center;
          }

          .proposals-list-table {
            font-size: 0.8rem;
          }

          .proposals-list-table th,
          .proposals-list-table td {
            padding: 0.5rem 0.3rem;
          }

          .detail-content {
            margin: 1rem;
            max-height: 95vh;
          }

          .detail-header,
          .detail-body {
            padding: 1rem;
          }

          .detail-grid {
            grid-template-columns: 1fr;
          }
        }
        .no-history {
          text-align: center;
          padding: 2rem;
          color: #64748b;
          font-style: italic;
        }

        .history-list {
          margin-top: 1rem;
        }

        .history-item {
          padding: 0.75rem;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          margin-bottom: 0.5rem;
          background: #f8fafc;
        }

        .history-status {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .previous-status {
          color: #64748b;
          font-weight: 500;
        }

        .arrow {
          color: #64748b;
          font-weight: bold;
        }

        .new-status {
          color: #059669;
          font-weight: 600;
        }

        .history-details {
          display: flex;
          gap: 1rem;
          font-size: 0.875rem;
          color: #64748b;
        }

        .history-date {
          font-weight: 500;
        }

        .history-user {
          font-weight: 500;
        }

        .history-reason {
          font-style: italic;
        }
      `}</style>
    </div>
  );
};

export default ContractList; 

