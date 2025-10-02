import React, { useState, useEffect } from 'react';
import { getApiUrl } from '../config/api';

// API 베이스 URL 설정
const API_BASE_URL = getApiUrl();

const ApprovalLine = () => {
  const [approvers, setApprovers] = useState([]);
  const [rules, setRules] = useState([]);
  const [references, setReferences] = useState([]);
  const [loading, setLoading] = useState(true);

  // API 데이터 로드
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [approversRes, rulesRes, referencesRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/approval-approvers`),
          fetch(`${API_BASE_URL}/api/approval-rules`),
          fetch(`${API_BASE_URL}/api/approval-references`)
        ]);

        const approversData = await approversRes.json();
        const rulesData = await rulesRes.json();
        const referencesData = await referencesRes.json();

        setApprovers(approversData);
        setRules(rulesData);
        setReferences(referencesData);
      } catch (error) {
        console.error('데이터 로드 실패:', error);
        alert('데이터 로드에 실패했습니다. 서버가 실행 중인지 확인해주세요.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);



  if (loading) {
    return (
      <div className="loading">
        <h2>데이터를 불러오는 중...</h2>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="approval-line">
      <h1>결재라인 참조</h1>

      {/* 결재자 정보 */}
      <div className="approver-info">
        <h2>결재자 정보</h2>
        <div className="approver-grid">
          {approvers.map((approver) => (
            <div key={approver.id} className="approver-card">
              <div className="approver-header">
                <h3>{approver.name}</h3>
                <div className="approver-title">{approver.title}</div>
              </div>
              <div className="approver-body">
                <div className="approver-department">
                  <strong>소속:</strong> {approver.department}
                </div>
                <div className="approver-description">
                  <strong>역할:</strong> {approver.description}
                </div>
                <div className="approver-conditions">
                  <strong>포함 조건:</strong>
                  <ul>
                    {approver.conditions && approver.conditions.length > 0 ? (
                      approver.conditions.map((condition, index) => (
                        <li key={index}>{condition}</li>
                      ))
                    ) : (
                      <li>모든 경우</li>
                    )}
                  </ul>
                </div>
                {approver.basis && (
                  <div className="approver-basis">
                    <strong>근거:</strong> {approver.basis}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 결재라인 규칙 */}
      <div className="approval-rules">
        <h2>결재라인 규칙</h2>
        <div className="rules-grid">
          {rules.map((rule) => (
            <div key={rule.id} className="rule-card">
              <h3>{rule.rule_name}</h3>
              <ul>
                {JSON.parse(rule.rule_content).map((content, index) => (
                  <li key={index}><strong>{content.split(':')[0]}:</strong> {content.split(':')[1]}</li>
                ))}
              </ul>
              <div className="rule-basis">
                <strong>근거:</strong> {rule.basis}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 결재라인 참고자료 테이블 */}
      <div className="approval-reference-table">
        <h2>결재라인 참고자료</h2>
        <div className="table-responsive">
          <table className="reference-table">
            <thead>
              <tr>
                <th>계약금액</th>
                <th>결재라인 포함 인원 (검토/협의)</th>
                <th>전결권자 (최종승인)</th>
              </tr>
            </thead>
            <tbody>
              {references.map((ref) => (
                <tr key={ref.id}>
                  <td>{ref.amount_range}</td>
                  <td>{ref.included_approvers}</td>
                  <td>{ref.final_approver}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .approval-line {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }



        .approver-info {
          background: white;
          padding: 2rem;
          border-radius: 12px;
          margin-bottom: 2rem;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          border: 1px solid rgba(0,0,0,0.05);
        }

        .approver-info h2 {
          margin-top: 0;
          color: #333;
          margin-bottom: 1.5rem;
        }

        .approver-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .approver-card {
          border: 2px solid #e1e5e9;
          border-radius: 12px;
          padding: 1.5rem;
          background: #fafbfc;
          transition: all 0.3s ease;
        }

        .approver-card:hover {
          border-color: #667eea;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(102, 126, 234, 0.2);
        }

        .approver-header {
          margin-bottom: 1rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #e1e5e9;
        }

        .approver-header h3 {
          margin: 0 0 0.5rem 0;
          color: #333;
        }

        .approver-title {
          color: #667eea;
          font-weight: 600;
          font-size: 0.9rem;
        }

        .approver-body {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .approver-department,
        .approver-description {
          font-size: 0.9rem;
          line-height: 1.4;
        }

        .approver-conditions ul {
          margin: 0.5rem 0 0 0;
          padding-left: 1.5rem;
        }

        .approver-conditions li {
          font-size: 0.85rem;
          margin-bottom: 0.25rem;
          color: #666;
        }

        .approver-basis {
          font-size: 0.8rem;
          color: #888;
          font-style: italic;
          margin-top: 0.5rem;
          padding-top: 0.5rem;
          border-top: 1px solid #e1e5e9;
        }

        .approval-rules {
          background: white;
          padding: 2rem;
          border-radius: 12px;
          margin-bottom: 2rem;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          border: 1px solid rgba(0,0,0,0.05);
        }

        .approval-rules h2 {
          margin-top: 0;
          color: #333;
          margin-bottom: 1.5rem;
        }

        .rules-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .rule-card {
          border: 2px solid #e1e5e9;
          border-radius: 12px;
          padding: 1.5rem;
          background: #fafbfc;
        }

        .rule-card h3 {
          margin-top: 0;
          color: #333;
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .rule-card ul {
          margin: 0;
          padding-left: 1.5rem;
        }

        .rule-card li {
          margin-bottom: 0.5rem;
          line-height: 1.4;
          font-size: 0.9rem;
        }

        .rule-card strong {
          color: #333;
        }

        .rule-basis {
          font-size: 0.8rem;
          color: #888;
          font-style: italic;
          margin-top: 1rem;
          padding-top: 0.75rem;
          border-top: 1px solid #e1e5e9;
        }

        .approval-reference-table {
          background: white;
          padding: 2rem;
          border-radius: 12px;
          margin-top: 2rem;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          border: 1px solid rgba(0,0,0,0.05);
        }

        .approval-reference-table h2 {
          margin-top: 0;
          color: #333;
          margin-bottom: 1.5rem;
        }

        .reference-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 1rem;
        }

        .reference-table th,
        .reference-table td {
          padding: 1rem;
          text-align: left;
          border: 1px solid #e1e5e9;
        }

        .reference-table th {
          background: #f8f9fa;
          font-weight: 600;
          color: #333;
        }

        .reference-table td {
          vertical-align: top;
          line-height: 1.6;
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
          .approver-grid,
          .rules-grid {
            grid-template-columns: 1fr;
          }

          .reference-table {
            font-size: 0.8rem;
          }

          .reference-table th,
          .reference-table td {
            padding: 0.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default ApprovalLine; 