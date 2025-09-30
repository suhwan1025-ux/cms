import React, { useState, useEffect } from 'react';
import './AIAssistant.css';

const AIAssistant = () => {
  const [messages, setMessages] = useState([
    {
      type: 'assistant',
      content: '안녕하세요! 계약관리시스템 AI 어시스턴트입니다. 품의서 검색, 요약, 현황 파악 등을 도와드릴 수 있습니다.',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [proposalData, setProposalData] = useState([]);
  const [statistics, setStatistics] = useState({});

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadProposalData();
    loadStatistics();
  }, []);

  // 품의서 데이터 로드
  const loadProposalData = async () => {
    try {
      const response = await fetch('/api/proposals');
      if (response.ok) {
        const data = await response.json();
        setProposalData(data);
      }
    } catch (error) {
      console.error('품의서 데이터 로드 실패:', error);
    }
  };

  // 통계 데이터 로드
  const loadStatistics = async () => {
    try {
      console.log('통계 데이터 로드 시작');
      const response = await fetch('/api/statistics/summary');
      console.log('응답 상태:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('통계 데이터 로드 성공:', data);
        setStatistics(data);
      } else {
        console.error('응답 오류:', response.status, response.statusText);
        const errorData = await response.json();
        console.error('오류 데이터:', errorData);
        // 오류가 있어도 기본 데이터 설정
        setStatistics(errorData);
      }
    } catch (error) {
      console.error('통계 데이터 로드 실패:', error);
      // 기본값 설정
      setStatistics({
        proposals: {
          total_proposals: 0,
          draft_count: 0,
          submitted_count: 0,
          approved_count: 0,
          rejected_count: 0,
          purchase_count: 0,
          service_count: 0,
          change_count: 0,
          extension_count: 0,
          bidding_count: 0,
          total_contract_amount: 0
        },
        recentActivity: [],
        budgets: {
          total_budgets: 0,
          total_budget_amount: 0,
          total_executed_amount: 0
        }
      });
    }
  };

  // 메시지 전송
  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await processUserQuery(inputMessage);
      const assistantMessage = {
        type: 'assistant',
        content: response,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage = {
        type: 'assistant',
        content: '죄송합니다. 처리 중 오류가 발생했습니다. 다시 시도해 주세요.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }

    setInputMessage('');
    setIsLoading(false);
  };

  // 사용자 쿼리 처리 (로컬 AI 로직)
  const processUserQuery = async (query) => {
    const lowerQuery = query.toLowerCase();

    // 품의서 검색
    if (lowerQuery.includes('검색') || lowerQuery.includes('찾아') || lowerQuery.includes('조회')) {
      return await searchProposals(query);
    }

    // 현황 파악
    if (lowerQuery.includes('현황') || lowerQuery.includes('상태') || lowerQuery.includes('통계')) {
      return await getStatusSummary();
    }

    // 요약 요청
    if (lowerQuery.includes('요약') || lowerQuery.includes('정리')) {
      return await getSummary(query);
    }

    // 도움말
    if (lowerQuery.includes('도움') || lowerQuery.includes('help') || lowerQuery.includes('기능')) {
      return getHelpMessage();
    }

    // 기본 응답
    return await generateGeneralResponse(query);
  };

  // 품의서 검색
  const searchProposals = async (query) => {
    try {
      const searchTerms = extractSearchTerms(query);
      const searchQuery = searchTerms.join(' ');
      
      const response = await fetch('/api/ai/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchQuery,
          filters: extractFilters(query)
        }),
      });

      if (!response.ok) {
        throw new Error('검색 요청 실패');
      }

      const data = await response.json();
      const results = data.results || [];

      if (results.length === 0) {
        return '검색 조건에 맞는 품의서를 찾을 수 없습니다.';
      }

      let responseText = `검색 결과 ${results.length}건의 품의서를 찾았습니다:\n\n`;
      results.slice(0, 5).forEach((proposal, index) => {
        responseText += `${index + 1}. ${proposal.purpose}\n`;
        responseText += `   - 계약유형: ${getContractTypeText(proposal.contract_type)}\n`;
        responseText += `   - 총액: ${formatCurrency(proposal.total_amount)}\n`;
        responseText += `   - 상태: ${getStatusText(proposal.status)}\n`;
        responseText += `   - 작성일: ${formatDate(proposal.created_at)}\n\n`;
      });

      if (results.length > 5) {
        responseText += `... 외 ${results.length - 5}건 더`;
      }

      return responseText;
    } catch (error) {
      console.error('검색 실패:', error);
      return '검색 중 오류가 발생했습니다. 다시 시도해 주세요.';
    }
  };

  // 현황 요약
  const getStatusSummary = async () => {
    try {
      console.log('현황 요약 요청 시작');
      const response = await fetch('/api/statistics/summary');
      console.log('현황 요약 응답 상태:', response.status);
      
      let data;
      if (response.ok) {
        data = await response.json();
      } else {
        // 오류 응답이라도 데이터가 있을 수 있음
        data = await response.json();
        console.log('오류 응답이지만 데이터 사용:', data);
      }

      const proposals = data.proposals || {};
      const budgets = data.budgets || {};

      let responseText = '📊 계약관리시스템 현황 요약\n\n';
      responseText += `총 품의서 수: ${proposals.total_proposals || 0}건\n\n`;
      
      responseText += '📋 상태별 현황:\n';
      responseText += `- 작성중: ${proposals.draft_count || 0}건\n`;
      responseText += `- 제출됨: ${proposals.submitted_count || 0}건\n`;
      responseText += `- 승인됨: ${proposals.approved_count || 0}건\n`;
      responseText += `- 반려됨: ${proposals.rejected_count || 0}건\n`;

      responseText += `\n💰 총 계약금액: ${formatCurrency(proposals.total_contract_amount || 0)}\n\n`;
      
      responseText += '📄 계약유형별 현황:\n';
      responseText += `- 구매: ${proposals.purchase_count || 0}건\n`;
      responseText += `- 용역: ${proposals.service_count || 0}건\n`;
      responseText += `- 변경: ${proposals.change_count || 0}건\n`;
      responseText += `- 연장: ${proposals.extension_count || 0}건\n`;
      responseText += `- 입찰: ${proposals.bidding_count || 0}건\n`;

      if (budgets && (budgets.total_budgets > 0 || budgets.total_budget_amount > 0)) {
        responseText += `\n📊 예산 현황:\n`;
        responseText += `- 총 예산: ${formatCurrency(budgets.total_budget_amount || 0)}\n`;
        responseText += `- 집행액: ${formatCurrency(budgets.total_executed_amount || 0)}\n`;
        const executionRate = budgets.total_budget_amount > 0 
          ? ((budgets.total_executed_amount / budgets.total_budget_amount) * 100).toFixed(1)
          : 0;
        responseText += `- 집행률: ${executionRate}%`;
      }

      // 데이터가 모두 0인 경우 안내 메시지 추가
      if (proposals.total_proposals === 0) {
        responseText += `\n\n💡 현재 등록된 품의서가 없습니다.\n`;
        responseText += `품의서를 작성하신 후 다시 확인해 주세요.`;
      }

      return responseText;
    } catch (error) {
      console.error('현황 요약 실패:', error);
      return `현황 데이터를 가져오는 중 오류가 발생했습니다.\n\n오류 정보: ${error.message}\n\n서버가 실행 중인지 확인해 주세요.`;
    }
  };

  // 요약 생성
  const getSummary = async (query) => {
    try {
      let summaryType = 'recent';
      
      // 쿼리에서 요약 타입 추출
      if (query.includes('대기') || query.includes('미결') || query.includes('처리중')) {
        summaryType = 'pending';
      } else if (query.includes('고액') || query.includes('큰 금액') || query.includes('100만')) {
        summaryType = 'high-value';
      }

      const response = await fetch(`/api/ai/summary/${summaryType}?limit=10`);
      if (!response.ok) {
        throw new Error('요약 데이터 요청 실패');
      }

      const data = await response.json();
      const results = data.results || [];

      let responseText = '';
      switch (summaryType) {
        case 'pending':
          responseText = '📝 처리 대기 중인 품의서 요약 (최대 10건)\n\n';
          break;
        case 'high-value':
          responseText = '📝 고액 계약 품의서 요약 (100만원 이상, 최대 10건)\n\n';
          break;
        default:
          responseText = '📝 최근 품의서 요약 (최근 10건)\n\n';
      }
      
      if (results.length === 0) {
        responseText += '해당하는 품의서가 없습니다.';
        return responseText;
      }

      results.forEach((proposal, index) => {
        responseText += `${index + 1}. ${proposal.purpose}\n`;
        responseText += `   계약유형: ${getContractTypeText(proposal.contract_type)} | `;
        responseText += `금액: ${formatCurrency(proposal.total_amount)} | `;
        responseText += `상태: ${getStatusText(proposal.status)}\n\n`;
      });

      return responseText;
    } catch (error) {
      console.error('요약 생성 실패:', error);
      return '요약 데이터를 가져오는 중 오류가 발생했습니다. 다시 시도해 주세요.';
    }
  };

  // 도움말 메시지
  const getHelpMessage = () => {
    return `🤖 AI 어시스턴트 사용 가능한 기능:\n\n
🔍 품의서 검색:
- "구매 품의서 검색해줘"
- "소프트웨어 관련 품의서 찾아줘"
- "100만원 이상 계약 검색"
- "승인된 용역 계약 찾아줘"

📊 현황 파악:
- "전체 현황 알려줘"
- "품의서 상태 현황"
- "계약유형별 통계"

📝 요약:
- "최근 품의서 요약해줘"
- "처리 대기 중인 품의서 요약"
- "고액 계약 요약해줘"

📈 고급 분석:
- "분석해줘" - 승인률, 계약 패턴 분석
- "추천해줘" - 프로세스 개선 제안
- "비교해줘" - 현재 상태 비교 분석

💡 팁: 구체적인 키워드를 포함해서 질문하시면 더 정확한 답변을 받을 수 있습니다.`;
  };

  // 일반 응답 생성
  const generateGeneralResponse = async (query) => {
    // 패턴 기반 응답 생성
    if (query.includes('분석') || query.includes('추세') || query.includes('트렌드')) {
      return await getAnalysis();
    }
    
    if (query.includes('추천') || query.includes('제안')) {
      return await getRecommendations();
    }
    
    if (query.includes('비교') || query.includes('대비')) {
      return await getComparison();
    }

    const responses = [
      '더 구체적인 질문을 해주시면 도움을 드릴 수 있습니다.',
      '품의서 검색, 현황 파악, 요약 기능을 사용해보세요.',
      '"도움말"을 입력하시면 사용 가능한 기능을 확인할 수 있습니다.',
      '예시: "구매 품의서 검색", "전체 현황", "최근 요약", "분석", "추천" 등'
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  // 분석 기능
  const getAnalysis = async () => {
    try {
      const response = await fetch('/api/statistics/summary');
      if (!response.ok) throw new Error('분석 데이터 요청 실패');

      const data = await response.json();
      const { proposals } = data;

      let analysisText = '📈 계약 관리 분석 리포트\n\n';
      
      const totalProposals = proposals.total_proposals || 0;
      const approvedRate = totalProposals > 0 
        ? ((proposals.approved_count / totalProposals) * 100).toFixed(1)
        : 0;

      analysisText += `🎯 승인률 분석: ${approvedRate}%\n`;
      analysisText += `💰 평균 계약금액: ${formatCurrency((proposals.total_contract_amount || 0) / Math.max(totalProposals, 1))}\n`;
      analysisText += `📊 주요 계약유형: 구매(${proposals.purchase_count || 0}건), 용역(${proposals.service_count || 0}건)\n\n`;
      
      if (approvedRate > 80) {
        analysisText += `✅ 평가: 우수한 승인률을 보이고 있습니다.`;
      } else if (approvedRate > 60) {
        analysisText += `⚠️ 평가: 양호한 승인률이나 개선 여지가 있습니다.`;
      } else {
        analysisText += `🔴 평가: 승인률 개선이 필요합니다.`;
      }

      return analysisText;
    } catch (error) {
      console.error('분석 실패:', error);
      return '분석 데이터를 생성하는 중 오류가 발생했습니다.';
    }
  };

  // 추천 기능
  const getRecommendations = async () => {
    try {
      const response = await fetch('/api/statistics/summary');
      if (!response.ok) throw new Error('추천 데이터 요청 실패');

      const data = await response.json();
      const { proposals } = data;

      let recommendText = '💡 AI 추천 사항\n\n';
      
      const totalProposals = proposals.total_proposals || 0;
      const rejectionRate = totalProposals > 0 
        ? ((proposals.rejected_count / totalProposals) * 100)
        : 0;

      recommendText += `📋 프로세스 개선 추천:\n`;
      
      if (rejectionRate > 20) {
        recommendText += `- 반려율 개선: 품의서 작성 가이드라인 검토 필요\n`;
      }
      
      if (proposals.draft_count > proposals.submitted_count) {
        recommendText += `- 작성 지원: 미완료 품의서 작성 완료 독려\n`;
      }
      
      recommendText += `- 정기 모니터링을 통한 효율성 개선\n`;
      recommendText += `- 자주 사용되는 계약 유형 템플릿 활용\n`;
      recommendText += `- 결재라인 최적화를 통한 처리시간 단축`;

      return recommendText;
    } catch (error) {
      console.error('추천 생성 실패:', error);
      return '추천 사항을 생성하는 중 오류가 발생했습니다.';
    }
  };

  // 비교 분석
  const getComparison = async () => {
    try {
      const response = await fetch('/api/statistics/summary');
      if (!response.ok) throw new Error('비교 데이터 요청 실패');

      const data = await response.json();
      const { proposals } = data;
      
      let comparisonText = '📊 현재 상태 비교 분석\n\n';
      
      comparisonText += `📈 처리 현황:\n`;
      comparisonText += `- 완료: ${proposals.approved_count || 0}건\n`;
      comparisonText += `- 대기: ${(proposals.draft_count || 0) + (proposals.submitted_count || 0)}건\n`;
      comparisonText += `- 반려: ${proposals.rejected_count || 0}건\n\n`;
      
      comparisonText += `💼 계약 유형 분포:\n`;
      comparisonText += `- 구매: ${proposals.purchase_count || 0}건\n`;
      comparisonText += `- 용역: ${proposals.service_count || 0}건\n`;
      comparisonText += `- 기타: ${(proposals.change_count || 0) + (proposals.extension_count || 0) + (proposals.bidding_count || 0)}건\n\n`;
      
      comparisonText += `📌 향후 개선점:\n`;
      comparisonText += `- 월별/분기별 트렌드 분석 데이터 축적 필요\n`;
      comparisonText += `- 정기적인 성과 지표 모니터링 권장`;

      return comparisonText;
    } catch (error) {
      console.error('비교 분석 실패:', error);
      return '비교 분석을 수행하는 중 오류가 발생했습니다.';
    }
  };

  // 유틸리티 함수들
  const extractSearchTerms = (query) => {
    // 간단한 키워드 추출 로직
    const terms = query.replace(/[검색해줘|찾아줘|조회해줘]/g, '').trim().split(' ');
    return terms.filter(term => term.length > 1);
  };

  const extractFilters = (query) => {
    const filters = {};
    
    // 계약 유형 필터
    if (query.includes('구매')) filters.contractType = 'purchase';
    if (query.includes('용역')) filters.contractType = 'service';
    if (query.includes('변경')) filters.contractType = 'change';
    if (query.includes('연장')) filters.contractType = 'extension';
    if (query.includes('입찰')) filters.contractType = 'bidding';
    
    // 상태 필터
    if (query.includes('작성중') || query.includes('초안')) filters.status = 'draft';
    if (query.includes('제출') || query.includes('신청')) filters.status = 'submitted';
    if (query.includes('승인') || query.includes('완료')) filters.status = 'approved';
    if (query.includes('반려') || query.includes('거부')) filters.status = 'rejected';
    
    // 금액 필터
    const amountMatch = query.match(/(\d+)만원?\s*(이상|이하|초과|미만)/);
    if (amountMatch) {
      const amount = parseInt(amountMatch[1]) * 10000;
      if (amountMatch[2] === '이상' || amountMatch[2] === '초과') {
        filters.minAmount = amount;
      } else if (amountMatch[2] === '이하' || amountMatch[2] === '미만') {
        filters.maxAmount = amount;
      }
    }
    
    return filters;
  };

  const getContractTypeText = (type) => {
    const types = {
      purchase: '구매',
      change: '변경',
      extension: '연장',
      service: '용역',
      bidding: '입찰'
    };
    return types[type] || type;
  };

  const getStatusText = (status) => {
    const statuses = {
      draft: '작성중',
      submitted: '제출됨',
      approved: '승인됨',
      rejected: '반려됨'
    };
    return statuses[status] || status;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  // 빠른 질문 버튼 클릭
  const handleQuickQuestion = (question) => {
    setInputMessage(question);
  };

  return (
    <div className="ai-assistant-container">
      <div className="ai-header">
        <div className="ai-title">
          <span className="ai-icon">🤖</span>
          <h2>AI 어시스턴트</h2>
        </div>
        <div className="ai-subtitle">
          품의서 검색, 요약, 현황 파악을 도와드립니다
        </div>
      </div>

      <div className="chat-container">
        <div className="messages-container">
          {messages.map((message, index) => (
            <div key={index} className={`message ${message.type}`}>
              <div className="message-content">
                <pre>{message.content}</pre>
              </div>
              <div className="message-time">
                {message.timestamp.toLocaleTimeString('ko-KR', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="message assistant">
              <div className="message-content loading">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                처리 중입니다...
              </div>
            </div>
          )}
        </div>

        <div className="quick-questions">
          <div className="quick-questions-title">빠른 질문:</div>
          <div className="quick-buttons">
            <button 
              className="quick-btn"
              onClick={() => handleQuickQuestion('전체 현황 알려줘')}
            >
              📊 전체 현황
            </button>
            <button 
              className="quick-btn"
              onClick={() => handleQuickQuestion('최근 품의서 요약해줘')}
            >
              📝 최근 요약
            </button>
            <button 
              className="quick-btn"
              onClick={() => handleQuickQuestion('구매 품의서 검색해줘')}
            >
              🔍 구매 검색
            </button>
            <button 
              className="quick-btn"
              onClick={() => handleQuickQuestion('분석해줘')}
            >
              📈 분석
            </button>
            <button 
              className="quick-btn"
              onClick={() => handleQuickQuestion('추천해줘')}
            >
              💡 추천
            </button>
            <button 
              className="quick-btn"
              onClick={() => handleQuickQuestion('도움말')}
            >
              ❓ 도움말
            </button>
          </div>
        </div>

        <div className="input-container">
          <div className="input-wrapper">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="질문을 입력하세요... (예: 구매 품의서 검색해줘)"
              disabled={isLoading}
            />
            <button 
              className="send-btn"
              onClick={handleSendMessage}
              disabled={isLoading || !inputMessage.trim()}
            >
              전송
            </button>
          </div>
        </div>
      </div>

      <div className="ai-info">
        <div className="info-section">
          <h4>🔒 폐쇄망 AI 어시스턴트</h4>
          <ul>
            <li><strong>로컬 처리:</strong> 모든 데이터는 로컬에서 처리됩니다</li>
            <li><strong>실시간 검색:</strong> 품의서 데이터베이스를 실시간으로 검색</li>
            <li><strong>지능형 요약:</strong> 키워드 기반 스마트 요약 제공</li>
            <li><strong>현황 분석:</strong> 계약 현황을 자동으로 분석하여 제공</li>
          </ul>
        </div>
        <div className="info-section">
          <h4>💡 사용 팁</h4>
          <ul>
            <li>구체적인 키워드를 포함해서 질문하세요</li>
            <li>"검색", "현황", "요약" 키워드를 활용하세요</li>
            <li>계약유형, 금액, 기간 등으로 세부 검색 가능</li>
            <li>빠른 질문 버튼을 활용해보세요</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant; 