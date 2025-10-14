import React, { useState, useEffect, useRef } from 'react';
import { getApiUrl } from '../config/api';

const API_BASE_URL = getApiUrl();

const AIAssistantPage = () => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [aiStatus, setAiStatus] = useState('checking');
  const [stats, setStats] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // 자동 스크롤
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // AI 서버 상태 확인
  useEffect(() => {
    checkAIStatus();
    loadStats();
  }, []);

  const checkAIStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/health`, { timeout: 5000 });
      const data = await response.json();
      
      if (data.status === 'healthy' || data.status === 'degraded') {
        setAiStatus('ready');
      } else {
        setAiStatus('unavailable');
      }
    } catch (error) {
      console.error('AI 상태 확인 실패:', error);
      setAiStatus('unavailable');
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/stats`);
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('통계 로드 실패:', error);
    }
  };

  // 메시지 전송
  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage = inputText.trim();
    setInputText('');

    // 사용자 메시지 추가
    const newUserMessage = {
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, newUserMessage]);

    // 로딩 시작
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: userMessage,
          conversation_id: conversationId,
          use_history: true
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '알 수 없는 오류가 발생했습니다.');
      }

      const data = await response.json();

      // 대화 ID 저장
      if (data.conversation_id && !conversationId) {
        setConversationId(data.conversation_id);
      }

      // AI 응답 추가
      const aiMessage = {
        role: 'assistant',
        content: data.answer,
        sources: data.sources || [],
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      console.error('AI 채팅 오류:', error);
      
      // 에러 메시지 추가
      const errorMessage = {
        role: 'error',
        content: error.message || 'AI 서버와 통신 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  // Enter 키 처리
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 대화 초기화
  const handleClearChat = () => {
    if (window.confirm('대화 내역을 모두 삭제하시겠습니까?')) {
      setMessages([]);
      setConversationId(null);
    }
  };

  // 데이터 재인덱싱
  const handleReindex = async () => {
    if (!window.confirm('데이터베이스를 재인덱싱하시겠습니까? 시간이 다소 걸릴 수 있습니다.')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/reindex`, {
        method: 'POST'
      });
      
      if (response.ok) {
        alert('재인덱싱이 완료되었습니다.');
        loadStats();
      } else {
        throw new Error('재인덱싱 실패');
      }
    } catch (error) {
      alert('재인덱싱 중 오류가 발생했습니다: ' + error.message);
    }
  };

  // 예시 질문
  const exampleQuestions = [
    '2025년 IT팀 예산 현황은?',
    '최근 1개월 결재완료된 용역계약 목록 보여줘',
    '외주인력 중 종료 예정인 사람은?',
    '입찰 진행 중인 사업은?',
    '예산이 가장 많이 남은 사업은?',
    '올해 월별 계약 건수는?'
  ];

  const handleExampleClick = (question) => {
    setInputText(question);
    inputRef.current?.focus();
  };

  return (
    <div className="ai-assistant-page">
      <div className="page-header">
        <div className="header-left">
          <h1>🤖 AI 어시스턴트</h1>
          <p className="page-description">
            계약 관리 시스템 데이터를 자연어로 질문하고 답변을 받으세요
          </p>
        </div>
        <div className="header-right">
          <div className={`status-indicator status-${aiStatus}`}>
            <span className="status-dot"></span>
            <span className="status-text">
              {aiStatus === 'ready' && 'AI 준비됨'}
              {aiStatus === 'checking' && '확인 중...'}
              {aiStatus === 'unavailable' && '사용 불가'}
            </span>
          </div>
          {stats && (
            <div className="stats-badge">
              📚 {stats.vector_db_count}개 문서 인덱싱됨
            </div>
          )}
          <button onClick={handleReindex} className="reindex-btn" title="데이터 재인덱싱">
            🔄 재인덱싱
          </button>
        </div>
      </div>

      <div className="ai-container">
        <div className="ai-sidebar">
          <div className="sidebar-section">
            <h3>💡 예시 질문</h3>
            <div className="example-questions">
              {exampleQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleExampleClick(question)}
                  className="example-question-btn"
                >
                  <span className="question-icon">❓</span>
                  {question}
                </button>
              ))}
            </div>
          </div>

          {stats && (
            <div className="sidebar-section">
              <h3>📊 시스템 정보</h3>
              <div className="info-items">
                <div className="info-item">
                  <span className="info-label">전체 품의서:</span>
                  <span className="info-value">{stats.total_proposals || 0}건</span>
                </div>
                <div className="info-item">
                  <span className="info-label">승인된 품의서:</span>
                  <span className="info-value">{stats.approved_proposals || 0}건</span>
                </div>
                <div className="info-item">
                  <span className="info-label">사업예산:</span>
                  <span className="info-value">{stats.total_budgets || 0}건</span>
                </div>
                <div className="info-item">
                  <span className="info-label">부서:</span>
                  <span className="info-value">{stats.total_departments || 0}개</span>
                </div>
              </div>
            </div>
          )}

          <div className="sidebar-section">
            <h3>ℹ️ 사용 팁</h3>
            <ul className="tips-list">
              <li>구체적으로 질문할수록 정확한 답변을 받을 수 있습니다</li>
              <li>연도, 부서, 금액 등 조건을 명시하세요</li>
              <li>이전 대화 맥락을 기억하므로 연속 질문 가능합니다</li>
              <li>Shift+Enter로 줄바꿈, Enter로 전송</li>
            </ul>
          </div>
        </div>

        <div className="ai-chat-area">
          {/* 메시지 영역 */}
          <div className="ai-messages">
            {messages.length === 0 ? (
              <div className="ai-welcome">
                <div className="welcome-icon">🤖</div>
                <h2>안녕하세요! AI 어시스턴트입니다</h2>
                <p>품의서, 계약서, 예산 등에 대해 궁금한 것을 자유롭게 물어보세요.</p>
                <p className="welcome-hint">왼쪽의 예시 질문을 클릭하거나 직접 입력하세요.</p>
              </div>
            ) : (
              <>
                {messages.map((message, index) => (
                  <div key={index} className={`message message-${message.role}`}>
                    <div className="message-avatar">
                      {message.role === 'user' ? '👤' : message.role === 'error' ? '⚠️' : '🤖'}
                    </div>
                    <div className="message-content">
                      <div className="message-bubble">
                        {message.content}
                      </div>
                      {message.sources && message.sources.length > 0 && (
                        <div className="message-sources">
                          <details>
                            <summary>📚 참조 데이터 ({message.sources.length}개)</summary>
                            <ul>
                              {message.sources.map((source, idx) => {
                                const typeLabels = {
                                  'proposals': '품의서',
                                  'budgets': '사업예산',
                                  'departments': '부서',
                                  'purchase_items': '구매품목',
                                  'service_items': '용역',
                                  'suppliers': '공급업체',
                                  'contract_method_statistics': '계약방식 통계',
                                  'contract_method_details': '계약방식 상세',
                                  'project_purposes': '프로젝트 목적',
                                  'monthly_statistics': '월별 통계',
                                  'status_statistics': '상태별 통계',
                                  'budget_execution': '예산집행',
                                  'budget_range': '예산범위',
                                  'amount_range_statistics': '금액범위 통계',
                                  'extreme_budgets': '최대최소 예산',
                                  'statistics': '시스템 통계'
                                };
                                
                                const typeLabel = typeLabels[source.type] || source.type;
                                const count = Array.isArray(source.data) ? source.data.length : 1;
                                
                                return (
                                  <li key={idx}>
                                    <strong>{typeLabel}</strong>
                                    : {count}건
                                  </li>
                                );
                              })}
                            </ul>
                          </details>
                        </div>
                      )}
                      <div className="message-time">
                        {new Date(message.timestamp).toLocaleTimeString('ko-KR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="message message-assistant">
                    <div className="message-avatar">🤖</div>
                    <div className="message-content">
                      <div className="message-bubble">
                        <div className="typing-indicator">
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* 입력 영역 */}
          <div className="ai-input-area">
            {messages.length > 0 && (
              <button onClick={handleClearChat} className="clear-chat-btn">
                🗑️ 대화 초기화
              </button>
            )}
            {aiStatus === 'unavailable' && (
              <div className="status-warning">
                ⚠️ AI 서버가 실행되지 않았습니다. ai_server 폴더에서 python main.py를 실행해주세요.
              </div>
            )}
            <div className="input-wrapper">
              <textarea
                ref={inputRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={aiStatus === 'ready' ? "질문을 입력하세요... (Shift+Enter: 줄바꿈, Enter: 전송)" : "AI 서버를 시작해주세요"}
                className="message-input"
                disabled={isLoading || aiStatus !== 'ready'}
                rows="3"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputText.trim() || isLoading || aiStatus !== 'ready'}
                className="send-btn"
              >
                {isLoading ? '⏳ 처리중...' : '📤 전송'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx="true">{`
        .ai-assistant-page {
          padding: 2rem;
          max-width: 1800px;
          margin: 0 auto;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
          padding-bottom: 1.5rem;
          border-bottom: 2px solid #e2e8f0;
        }

        .header-left h1 {
          margin: 0 0 0.5rem 0;
          color: #1a202c;
          font-size: 2rem;
        }

        .page-description {
          color: #718096;
          margin: 0;
        }

        .header-right {
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .status-indicator {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 500;
        }

        .status-ready {
          background: #d1fae5;
          color: #065f46;
        }

        .status-checking {
          background: #fef3c7;
          color: #92400e;
        }

        .status-unavailable {
          background: #fee2e2;
          color: #991b1b;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: currentColor;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .stats-badge {
          background: #f3f4f6;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          font-size: 0.9rem;
          color: #4b5563;
        }

        .reindex-btn {
          background: #667eea;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 500;
          transition: all 0.2s;
        }

        .reindex-btn:hover {
          background: #5a67d8;
          transform: translateY(-2px);
        }

        .ai-container {
          display: grid;
          grid-template-columns: 350px 1fr;
          gap: 2rem;
          height: calc(100vh - 250px);
        }

        .ai-sidebar {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          overflow-y: auto;
        }

        .sidebar-section {
          margin-bottom: 2rem;
        }

        .sidebar-section:last-child {
          margin-bottom: 0;
        }

        .sidebar-section h3 {
          margin: 0 0 1rem 0;
          font-size: 1rem;
          color: #1a202c;
        }

        .example-questions {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .example-question-btn {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          background: #f7fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          cursor: pointer;
          text-align: left;
          transition: all 0.2s;
          font-size: 0.9rem;
          color: #2d3748;
        }

        .example-question-btn:hover {
          background: #edf2f7;
          border-color: #667eea;
          transform: translateX(4px);
        }

        .question-icon {
          font-size: 1.2rem;
          flex-shrink: 0;
        }

        .info-items {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .info-item {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem;
          background: #f7fafc;
          border-radius: 6px;
        }

        .info-label {
          color: #718096;
          font-size: 0.9rem;
        }

        .info-value {
          font-weight: 600;
          color: #2d3748;
        }

        .tips-list {
          margin: 0;
          padding-left: 1.5rem;
          color: #4b5563;
          font-size: 0.85rem;
          line-height: 1.6;
        }

        .tips-list li {
          margin-bottom: 0.5rem;
        }

        .ai-chat-area {
          background: white;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .ai-messages {
          flex: 1;
          overflow-y: auto;
          padding: 2rem;
          background: #f9fafb;
        }

        .ai-welcome {
          text-align: center;
          padding: 4rem 2rem;
        }

        .welcome-icon {
          font-size: 5rem;
          margin-bottom: 1.5rem;
        }

        .ai-welcome h2 {
          margin: 0 0 1rem 0;
          color: #1a202c;
          font-size: 1.5rem;
        }

        .ai-welcome p {
          color: #718096;
          margin: 0.5rem 0;
        }

        .welcome-hint {
          margin-top: 1.5rem !important;
          color: #667eea !important;
          font-weight: 500;
        }

        .message {
          display: flex;
          gap: 1rem;
          margin-bottom: 1.5rem;
          animation: messageSlide 0.3s ease;
        }

        @keyframes messageSlide {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .message-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          flex-shrink: 0;
          background: white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .message-content {
          flex: 1;
          min-width: 0;
        }

        .message-bubble {
          background: white;
          padding: 1rem 1.25rem;
          border-radius: 12px;
          color: #2d3748;
          line-height: 1.6;
          word-wrap: break-word;
          white-space: pre-wrap;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .message-user .message-bubble {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .message-error .message-bubble {
          background: #fee2e2;
          color: #991b1b;
          border: 1px solid #fecaca;
        }

        .message-sources {
          margin-top: 0.75rem;
          font-size: 0.85rem;
        }

        .message-sources details {
          background: #f3f4f6;
          padding: 0.75rem;
          border-radius: 8px;
          cursor: pointer;
        }

        .message-sources summary {
          color: #667eea;
          font-weight: 600;
        }

        .message-sources ul {
          margin: 0.75rem 0 0 0;
          padding-left: 1.5rem;
        }

        .message-sources li {
          margin: 0.5rem 0;
          color: #4b5563;
        }

        .message-time {
          font-size: 0.75rem;
          color: #9ca3af;
          margin-top: 0.5rem;
        }

        .typing-indicator {
          display: flex;
          gap: 4px;
        }

        .typing-indicator span {
          width: 8px;
          height: 8px;
          background: #667eea;
          border-radius: 50%;
          animation: typing 1.4s infinite;
        }

        .typing-indicator span:nth-child(2) {
          animation-delay: 0.2s;
        }

        .typing-indicator span:nth-child(3) {
          animation-delay: 0.4s;
        }

        @keyframes typing {
          0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.5;
          }
          30% {
            transform: translateY(-10px);
            opacity: 1;
          }
        }

        .ai-input-area {
          border-top: 1px solid #e2e8f0;
          padding: 1.5rem;
          background: white;
        }

        .clear-chat-btn {
          background: #f3f4f6;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.85rem;
          color: #6b7280;
          margin-bottom: 1rem;
          transition: all 0.2s;
        }

        .clear-chat-btn:hover {
          background: #e5e7eb;
        }

        .status-warning {
          background: #fef3c7;
          color: #92400e;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1rem;
          font-size: 0.9rem;
          text-align: center;
        }

        .input-wrapper {
          display: flex;
          gap: 1rem;
          align-items: flex-end;
        }

        .message-input {
          flex: 1;
          padding: 1rem;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 1rem;
          resize: none;
          font-family: inherit;
          transition: border-color 0.2s;
        }

        .message-input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .message-input:disabled {
          background: #f9fafb;
          cursor: not-allowed;
        }

        .send-btn {
          padding: 1rem 2rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 1rem;
          font-weight: 600;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .send-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .send-btn:disabled {
          background: #cbd5e0;
          cursor: not-allowed;
        }

        /* 스크롤바 */
        .ai-messages::-webkit-scrollbar,
        .ai-sidebar::-webkit-scrollbar {
          width: 8px;
        }

        .ai-messages::-webkit-scrollbar-track,
        .ai-sidebar::-webkit-scrollbar-track {
          background: #f1f1f1;
        }

        .ai-messages::-webkit-scrollbar-thumb,
        .ai-sidebar::-webkit-scrollbar-thumb {
          background: #cbd5e0;
          border-radius: 4px;
        }

        .ai-messages::-webkit-scrollbar-thumb:hover,
        .ai-sidebar::-webkit-scrollbar-thumb:hover {
          background: #a0aec0;
        }

        /* 반응형 */
        @media (max-width: 1200px) {
          .ai-container {
            grid-template-columns: 1fr;
          }

          .ai-sidebar {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default AIAssistantPage;

