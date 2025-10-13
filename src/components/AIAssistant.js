import React, { useState, useEffect, useRef } from 'react';
import { getApiUrl } from '../config/api';

const API_BASE_URL = getApiUrl();

const AIAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [aiStatus, setAiStatus] = useState('checking');
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
  }, [isOpen]);

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

  // 예시 질문
  const exampleQuestions = [
    '2025년 IT팀 예산 현황은?',
    '최근 1개월 결재완료된 용역계약 목록 보여줘',
    '외주인력 중 종료 예정인 사람은?',
    '입찰 진행 중인 사업은?'
  ];

  const handleExampleClick = (question) => {
    setInputText(question);
    inputRef.current?.focus();
  };

  return (
    <>
      {/* AI 어시스턴트 버튼 (플로팅) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="ai-assistant-button"
          title="AI 어시스턴트"
        >
          <span className="ai-icon">🤖</span>
          <span className="ai-pulse"></span>
        </button>
      )}

      {/* AI 채팅 창 */}
      {isOpen && (
        <div className="ai-assistant-container">
          {/* 헤더 */}
          <div className="ai-header">
            <div className="ai-header-left">
              <span className="ai-icon">🤖</span>
              <div>
                <h3>AI 어시스턴트</h3>
                <span className={`ai-status ai-status-${aiStatus}`}>
                  {aiStatus === 'ready' && '● 준비됨'}
                  {aiStatus === 'checking' && '○ 확인 중...'}
                  {aiStatus === 'unavailable' && '○ 사용 불가'}
                </span>
              </div>
            </div>
            <div className="ai-header-actions">
              {messages.length > 0 && (
                <button onClick={handleClearChat} className="ai-clear-btn" title="대화 초기화">
                  🗑️
                </button>
              )}
              <button onClick={() => setIsOpen(false)} className="ai-close-btn" title="닫기">
                ✕
              </button>
            </div>
          </div>

          {/* 메시지 영역 */}
          <div className="ai-messages">
            {messages.length === 0 ? (
              <div className="ai-welcome">
                <div className="ai-welcome-icon">🤖</div>
                <h4>안녕하세요! 계약 관리 시스템 AI 어시스턴트입니다.</h4>
                <p>품의서, 계약서, 예산 등에 대해 궁금한 것을 물어보세요.</p>
                
                <div className="ai-examples">
                  <p className="ai-examples-title">💡 예시 질문:</p>
                  {exampleQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => handleExampleClick(question)}
                      className="ai-example-btn"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((message, index) => (
                  <div key={index} className={`ai-message ai-message-${message.role}`}>
                    <div className="ai-message-avatar">
                      {message.role === 'user' ? '👤' : message.role === 'error' ? '⚠️' : '🤖'}
                    </div>
                    <div className="ai-message-content">
                      <div className="ai-message-text">
                        {message.content}
                      </div>
                      {message.sources && message.sources.length > 0 && (
                        <div className="ai-message-sources">
                          <details>
                            <summary>📚 참조 데이터 ({message.sources.length}개)</summary>
                            <ul>
                              {message.sources.map((source, idx) => (
                                <li key={idx}>
                                  <strong>{source.metadata?.type === 'proposal' ? '품의서' : '사업예산'}</strong>
                                  : {source.metadata?.title || source.metadata?.projectName || 'N/A'}
                                </li>
                              ))}
                            </ul>
                          </details>
                        </div>
                      )}
                      <div className="ai-message-time">
                        {new Date(message.timestamp).toLocaleTimeString('ko-KR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="ai-message ai-message-assistant">
                    <div className="ai-message-avatar">🤖</div>
                    <div className="ai-message-content">
                      <div className="ai-typing">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* 입력 영역 */}
          <div className="ai-input-container">
            {aiStatus === 'unavailable' && (
              <div className="ai-status-warning">
                ⚠️ AI 서버가 실행되지 않았습니다. AI 서버를 시작한 후 사용해주세요.
              </div>
            )}
            <div className="ai-input-wrapper">
              <textarea
                ref={inputRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={aiStatus === 'ready' ? "질문을 입력하세요... (Shift+Enter: 줄바꿈)" : "AI 서버를 시작해주세요"}
                className="ai-input"
                disabled={isLoading || aiStatus !== 'ready'}
                rows="1"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputText.trim() || isLoading || aiStatus !== 'ready'}
                className="ai-send-btn"
                title="전송"
              >
                {isLoading ? '⏳' : '📤'}
              </button>
            </div>
            <div className="ai-input-hint">
              Shift + Enter로 줄바꿈, Enter로 전송
            </div>
          </div>
        </div>
      )}

      <style jsx="true">{`
        /* 플로팅 버튼 */
        .ai-assistant-button {
          position: fixed;
          bottom: 30px;
          right: 30px;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .ai-assistant-button:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
        }

        .ai-icon {
          font-size: 28px;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
        }

        .ai-pulse {
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: inherit;
          animation: pulse 2s infinite;
          z-index: -1;
        }

        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }

        /* 채팅 컨테이너 */
        .ai-assistant-container {
          position: fixed;
          bottom: 30px;
          right: 30px;
          width: 450px;
          height: 650px;
          background: white;
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
          display: flex;
          flex-direction: column;
          z-index: 1000;
          overflow: hidden;
        }

        /* 헤더 */
        .ai-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 1rem 1.25rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .ai-header-left {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .ai-header h3 {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .ai-status {
          font-size: 0.75rem;
          opacity: 0.9;
        }

        .ai-status-ready {
          color: #10b981;
        }

        .ai-status-checking {
          color: #fbbf24;
        }

        .ai-status-unavailable {
          color: #ef4444;
        }

        .ai-header-actions {
          display: flex;
          gap: 0.5rem;
        }

        .ai-clear-btn,
        .ai-close-btn {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 16px;
          transition: all 0.2s;
        }

        .ai-clear-btn:hover,
        .ai-close-btn:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        /* 메시지 영역 */
        .ai-messages {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
          background: #f8f9fa;
        }

        .ai-welcome {
          text-align: center;
          padding: 2rem 1rem;
        }

        .ai-welcome-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }

        .ai-welcome h4 {
          margin: 0 0 0.5rem 0;
          color: #333;
          font-size: 1.1rem;
        }

        .ai-welcome p {
          color: #666;
          margin: 0 0 2rem 0;
        }

        .ai-examples {
          text-align: left;
        }

        .ai-examples-title {
          font-weight: 600;
          color: #667eea;
          margin-bottom: 0.75rem;
        }

        .ai-example-btn {
          display: block;
          width: 100%;
          text-align: left;
          padding: 0.75rem 1rem;
          margin-bottom: 0.5rem;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          cursor: pointer;
          color: #333;
          font-size: 0.9rem;
          transition: all 0.2s;
        }

        .ai-example-btn:hover {
          background: #f8f9fa;
          border-color: #667eea;
          transform: translateX(4px);
        }

        /* 메시지 */
        .ai-message {
          display: flex;
          gap: 0.75rem;
          margin-bottom: 1rem;
          animation: messageSlideIn 0.3s ease;
        }

        @keyframes messageSlideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .ai-message-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          flex-shrink: 0;
          background: white;
        }

        .ai-message-content {
          flex: 1;
          min-width: 0;
        }

        .ai-message-text {
          background: white;
          padding: 0.75rem 1rem;
          border-radius: 12px;
          color: #333;
          line-height: 1.5;
          word-wrap: break-word;
          white-space: pre-wrap;
        }

        .ai-message-user .ai-message-text {
          background: #667eea;
          color: white;
        }

        .ai-message-error .ai-message-text {
          background: #fee2e2;
          color: #991b1b;
          border: 1px solid #fecaca;
        }

        .ai-message-sources {
          margin-top: 0.5rem;
          font-size: 0.85rem;
        }

        .ai-message-sources details {
          background: #f8f9fa;
          padding: 0.5rem;
          border-radius: 6px;
        }

        .ai-message-sources summary {
          cursor: pointer;
          color: #667eea;
          font-weight: 500;
        }

        .ai-message-sources ul {
          margin: 0.5rem 0 0 0;
          padding-left: 1.5rem;
        }

        .ai-message-sources li {
          margin: 0.25rem 0;
          color: #666;
        }

        .ai-message-time {
          font-size: 0.7rem;
          color: #999;
          margin-top: 0.25rem;
        }

        /* 타이핑 인디케이터 */
        .ai-typing {
          display: flex;
          gap: 4px;
          padding: 1rem;
        }

        .ai-typing span {
          width: 8px;
          height: 8px;
          background: #667eea;
          border-radius: 50%;
          animation: typing 1.4s infinite;
        }

        .ai-typing span:nth-child(2) {
          animation-delay: 0.2s;
        }

        .ai-typing span:nth-child(3) {
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

        /* 입력 영역 */
        .ai-input-container {
          border-top: 1px solid #e2e8f0;
          padding: 1rem;
          background: white;
        }

        .ai-status-warning {
          background: #fef3c7;
          color: #92400e;
          padding: 0.75rem;
          border-radius: 8px;
          font-size: 0.85rem;
          margin-bottom: 0.75rem;
          text-align: center;
        }

        .ai-input-wrapper {
          display: flex;
          gap: 0.5rem;
          align-items: flex-end;
        }

        .ai-input {
          flex: 1;
          padding: 0.75rem;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 0.9rem;
          resize: none;
          max-height: 100px;
          font-family: inherit;
        }

        .ai-input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .ai-input:disabled {
          background: #f8f9fa;
          cursor: not-allowed;
        }

        .ai-send-btn {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          border: none;
          background: #667eea;
          color: white;
          cursor: pointer;
          font-size: 18px;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .ai-send-btn:hover:not(:disabled) {
          background: #5a67d8;
          transform: translateY(-2px);
        }

        .ai-send-btn:disabled {
          background: #cbd5e0;
          cursor: not-allowed;
        }

        .ai-input-hint {
          font-size: 0.7rem;
          color: #999;
          margin-top: 0.5rem;
          text-align: center;
        }

        /* 스크롤바 스타일 */
        .ai-messages::-webkit-scrollbar {
          width: 6px;
        }

        .ai-messages::-webkit-scrollbar-track {
          background: #f1f1f1;
        }

        .ai-messages::-webkit-scrollbar-thumb {
          background: #cbd5e0;
          border-radius: 3px;
        }

        .ai-messages::-webkit-scrollbar-thumb:hover {
          background: #a0aec0;
        }

        /* 반응형 */
        @media (max-width: 768px) {
          .ai-assistant-container {
            width: calc(100vw - 20px);
            height: calc(100vh - 20px);
            bottom: 10px;
            right: 10px;
          }

          .ai-assistant-button {
            bottom: 20px;
            right: 20px;
          }
        }
      `}</style>
    </>
  );
};

export default AIAssistant;
