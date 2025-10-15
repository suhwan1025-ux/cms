import React, { useState, useEffect } from 'react';
import { getApiUrl } from '../config/api';

// API 베이스 URL 설정
const API_BASE_URL = getApiUrl();

const ApprovalLine = () => {
  const [approvers, setApprovers] = useState([]);
  const [rules, setRules] = useState([]);
  const [references, setReferences] = useState([]);
  const [loading, setLoading] = useState(true);

  // 편집 모드 상태
  const [editingApprover, setEditingApprover] = useState(null);
  const [editingRule, setEditingRule] = useState(null);
  const [editingReference, setEditingReference] = useState(null);

  // 추가 모드 상태
  const [showAddApprover, setShowAddApprover] = useState(false);
  const [showAddRule, setShowAddRule] = useState(false);
  const [showAddReference, setShowAddReference] = useState(false);

  // 폼 데이터
  const [approverForm, setApproverForm] = useState({
    name: '',
    title: '',
    department: '',
    description: '',
    conditions: [],
    basis: ''
  });

  const [ruleForm, setRuleForm] = useState({
    rule_name: '',
    rule_content: [],
    basis: ''
  });

  const [referenceForm, setReferenceForm] = useState({
    amount_range: '',
    included_approvers: '',
    final_approver: ''
  });

  // API 데이터 로드
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

  useEffect(() => {
    fetchData();
  }, []);

  // === 결재자 관리 ===
  const handleAddApprover = () => {
    setApproverForm({
      name: '',
      title: '',
      department: '',
      description: '',
      conditions: [],
      basis: ''
    });
    setEditingApprover(null);
    setShowAddApprover(true);
  };

  const handleEditApprover = (approver) => {
    setApproverForm({
      name: approver.name || '',
      title: approver.title || '',
      department: approver.department || '',
      description: approver.description || '',
      conditions: approver.conditions || [],
      basis: approver.basis || ''
    });
    setEditingApprover(approver);
    setShowAddApprover(true);
  };

  const handleSaveApprover = async () => {
    try {
      const method = editingApprover ? 'PUT' : 'POST';
      const url = editingApprover 
        ? `${API_BASE_URL}/api/approval-approvers/${editingApprover.id}`
        : `${API_BASE_URL}/api/approval-approvers`;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(approverForm)
      });

      if (response.ok) {
        alert(editingApprover ? '결재자 정보가 수정되었습니다.' : '결재자가 추가되었습니다.');
        setShowAddApprover(false);
        fetchData();
      } else {
        throw new Error('저장 실패');
      }
    } catch (error) {
      console.error('결재자 저장 실패:', error);
      alert('결재자 저장에 실패했습니다.');
    }
  };

  const handleDeleteApprover = async (id) => {
    if (!window.confirm('정말로 이 결재자를 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/approval-approvers/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert('결재자가 삭제되었습니다.');
        fetchData();
      } else {
        throw new Error('삭제 실패');
      }
    } catch (error) {
      console.error('결재자 삭제 실패:', error);
      alert('결재자 삭제에 실패했습니다.');
    }
  };

  // === 규칙 관리 ===
  const handleAddRule = () => {
    setRuleForm({
      rule_name: '',
      rule_content: [],
      basis: ''
    });
    setEditingRule(null);
    setShowAddRule(true);
  };

  const handleEditRule = (rule) => {
    setRuleForm({
      rule_name: rule.rule_name || '',
      rule_content: JSON.parse(rule.rule_content || '[]'),
      basis: rule.basis || ''
    });
    setEditingRule(rule);
    setShowAddRule(true);
  };

  const handleSaveRule = async () => {
    try {
      const method = editingRule ? 'PUT' : 'POST';
      const url = editingRule 
        ? `${API_BASE_URL}/api/approval-rules/${editingRule.id}`
        : `${API_BASE_URL}/api/approval-rules`;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...ruleForm,
          rule_content: JSON.stringify(ruleForm.rule_content)
        })
      });

      if (response.ok) {
        alert(editingRule ? '규칙이 수정되었습니다.' : '규칙이 추가되었습니다.');
        setShowAddRule(false);
        fetchData();
      } else {
        throw new Error('저장 실패');
      }
    } catch (error) {
      console.error('규칙 저장 실패:', error);
      alert('규칙 저장에 실패했습니다.');
    }
  };

  const handleDeleteRule = async (id) => {
    if (!window.confirm('정말로 이 규칙을 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/approval-rules/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert('규칙이 삭제되었습니다.');
        fetchData();
      } else {
        throw new Error('삭제 실패');
      }
    } catch (error) {
      console.error('규칙 삭제 실패:', error);
      alert('규칙 삭제에 실패했습니다.');
    }
  };

  // === 참고자료 관리 ===
  const handleAddReference = () => {
    setReferenceForm({
      amount_range: '',
      included_approvers: '',
      final_approver: ''
    });
    setEditingReference(null);
    setShowAddReference(true);
  };

  const handleEditReference = (reference) => {
    setReferenceForm({
      amount_range: reference.amount_range || '',
      included_approvers: reference.included_approvers || '',
      final_approver: reference.final_approver || ''
    });
    setEditingReference(reference);
    setShowAddReference(true);
  };

  const handleSaveReference = async () => {
    try {
      const method = editingReference ? 'PUT' : 'POST';
      const url = editingReference 
        ? `${API_BASE_URL}/api/approval-references/${editingReference.id}`
        : `${API_BASE_URL}/api/approval-references`;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(referenceForm)
      });

      if (response.ok) {
        alert(editingReference ? '참고자료가 수정되었습니다.' : '참고자료가 추가되었습니다.');
        setShowAddReference(false);
        fetchData();
      } else {
        throw new Error('저장 실패');
      }
    } catch (error) {
      console.error('참고자료 저장 실패:', error);
      alert('참고자료 저장에 실패했습니다.');
    }
  };

  const handleDeleteReference = async (id) => {
    if (!window.confirm('정말로 이 참고자료를 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/approval-references/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert('참고자료가 삭제되었습니다.');
        fetchData();
      } else {
        throw new Error('삭제 실패');
      }
    } catch (error) {
      console.error('참고자료 삭제 실패:', error);
      alert('참고자료 삭제에 실패했습니다.');
    }
  };

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
        <div className="section-header">
          <h2>결재자 정보</h2>
          <button className="add-btn" onClick={handleAddApprover}>
            ➕ 결재자 추가
          </button>
        </div>
        <div className="approver-grid">
          {approvers.map((approver) => (
            <div key={approver.id} className="approver-card">
              <div className="card-actions">
                <button 
                  className="edit-btn-small"
                  onClick={() => handleEditApprover(approver)}
                  title="수정"
                >
                  ✏️
                </button>
                <button 
                  className="delete-btn-small"
                  onClick={() => handleDeleteApprover(approver.id)}
                  title="삭제"
                >
                  🗑️
                </button>
              </div>
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
        <div className="section-header">
          <h2>결재라인 규칙</h2>
          <button className="add-btn" onClick={handleAddRule}>
            ➕ 규칙 추가
          </button>
        </div>
        <div className="rules-grid">
          {rules.map((rule) => (
            <div key={rule.id} className="rule-card">
              <div className="card-actions">
                <button 
                  className="edit-btn-small"
                  onClick={() => handleEditRule(rule)}
                  title="수정"
                >
                  ✏️
                </button>
                <button 
                  className="delete-btn-small"
                  onClick={() => handleDeleteRule(rule.id)}
                  title="삭제"
                >
                  🗑️
                </button>
              </div>
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
        <div className="section-header">
          <h2>결재라인 참고자료</h2>
          <button className="add-btn" onClick={handleAddReference}>
            ➕ 참고자료 추가
          </button>
        </div>
        <div className="table-responsive">
          <table className="reference-table">
            <thead>
              <tr>
                <th>계약금액</th>
                <th>결재라인 포함 인원 (검토/협의)</th>
                <th>전결권자 (최종승인)</th>
                <th>작업</th>
              </tr>
            </thead>
            <tbody>
              {references.map((ref) => (
                <tr key={ref.id}>
                  <td>{ref.amount_range}</td>
                  <td>{ref.included_approvers}</td>
                  <td>{ref.final_approver}</td>
                  <td>
                    <div className="table-actions">
                      <button 
                        className="edit-btn-small"
                        onClick={() => handleEditReference(ref)}
                        title="수정"
                      >
                        ✏️
                      </button>
                      <button 
                        className="delete-btn-small"
                        onClick={() => handleDeleteReference(ref.id)}
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
      </div>

      {/* 결재자 추가/수정 모달 */}
      {showAddApprover && (
        <div className="modal-overlay" onClick={() => setShowAddApprover(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{editingApprover ? '결재자 수정' : '결재자 추가'}</h3>
            <div className="form-group">
              <label>이름</label>
              <input
                type="text"
                value={approverForm.name}
                onChange={(e) => setApproverForm({...approverForm, name: e.target.value})}
                placeholder="이름을 입력하세요"
              />
            </div>
            <div className="form-group">
              <label>직책</label>
              <input
                type="text"
                value={approverForm.title}
                onChange={(e) => setApproverForm({...approverForm, title: e.target.value})}
                placeholder="직책을 입력하세요"
              />
            </div>
            <div className="form-group">
              <label>부서</label>
              <input
                type="text"
                value={approverForm.department}
                onChange={(e) => setApproverForm({...approverForm, department: e.target.value})}
                placeholder="부서를 입력하세요"
              />
            </div>
            <div className="form-group">
              <label>역할</label>
              <input
                type="text"
                value={approverForm.description}
                onChange={(e) => setApproverForm({...approverForm, description: e.target.value})}
                placeholder="역할을 입력하세요"
              />
            </div>
            <div className="form-group">
              <label>포함 조건 (쉼표로 구분)</label>
              <input
                type="text"
                value={approverForm.conditions.join(', ')}
                onChange={(e) => setApproverForm({...approverForm, conditions: e.target.value.split(',').map(c => c.trim())})}
                placeholder="조건1, 조건2, 조건3"
              />
            </div>
            <div className="form-group">
              <label>근거</label>
              <textarea
                value={approverForm.basis}
                onChange={(e) => setApproverForm({...approverForm, basis: e.target.value})}
                placeholder="근거를 입력하세요"
                rows="3"
              />
            </div>
            <div className="modal-actions">
              <button className="save-btn" onClick={handleSaveApprover}>저장</button>
              <button className="cancel-btn" onClick={() => setShowAddApprover(false)}>취소</button>
            </div>
          </div>
        </div>
      )}

      {/* 규칙 추가/수정 모달 */}
      {showAddRule && (
        <div className="modal-overlay" onClick={() => setShowAddRule(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{editingRule ? '규칙 수정' : '규칙 추가'}</h3>
            <div className="form-group">
              <label>규칙 이름</label>
              <input
                type="text"
                value={ruleForm.rule_name}
                onChange={(e) => setRuleForm({...ruleForm, rule_name: e.target.value})}
                placeholder="규칙 이름을 입력하세요"
              />
            </div>
            <div className="form-group">
              <label>규칙 내용 (한 줄에 하나씩, 형식: 항목:내용)</label>
              <textarea
                value={ruleForm.rule_content.join('\n')}
                onChange={(e) => setRuleForm({...ruleForm, rule_content: e.target.value.split('\n').filter(line => line.trim())})}
                placeholder="예시:&#10;단계1:검토&#10;단계2:협의&#10;단계3:승인"
                rows="5"
              />
            </div>
            <div className="form-group">
              <label>근거</label>
              <textarea
                value={ruleForm.basis}
                onChange={(e) => setRuleForm({...ruleForm, basis: e.target.value})}
                placeholder="근거를 입력하세요"
                rows="3"
              />
            </div>
            <div className="modal-actions">
              <button className="save-btn" onClick={handleSaveRule}>저장</button>
              <button className="cancel-btn" onClick={() => setShowAddRule(false)}>취소</button>
            </div>
          </div>
        </div>
      )}

      {/* 참고자료 추가/수정 모달 */}
      {showAddReference && (
        <div className="modal-overlay" onClick={() => setShowAddReference(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{editingReference ? '참고자료 수정' : '참고자료 추가'}</h3>
            <div className="form-group">
              <label>계약금액</label>
              <input
                type="text"
                value={referenceForm.amount_range}
                onChange={(e) => setReferenceForm({...referenceForm, amount_range: e.target.value})}
                placeholder="예: 5,000만원 미만"
              />
            </div>
            <div className="form-group">
              <label>결재라인 포함 인원 (검토/협의)</label>
              <textarea
                value={referenceForm.included_approvers}
                onChange={(e) => setReferenceForm({...referenceForm, included_approvers: e.target.value})}
                placeholder="결재라인에 포함될 인원을 입력하세요"
                rows="3"
              />
            </div>
            <div className="form-group">
              <label>전결권자 (최종승인)</label>
              <input
                type="text"
                value={referenceForm.final_approver}
                onChange={(e) => setReferenceForm({...referenceForm, final_approver: e.target.value})}
                placeholder="전결권자를 입력하세요"
              />
            </div>
            <div className="modal-actions">
              <button className="save-btn" onClick={handleSaveReference}>저장</button>
              <button className="cancel-btn" onClick={() => setShowAddReference(false)}>취소</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .approval-line {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .section-header h2 {
          margin: 0;
          color: #333;
        }

        .add-btn {
          background: #28a745;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.9rem;
          transition: all 0.3s ease;
        }

        .add-btn:hover {
          background: #218838;
          transform: translateY(-2px);
        }

        .card-actions {
          position: absolute;
          top: 1rem;
          right: 1rem;
          display: flex;
          gap: 0.5rem;
        }

        .edit-btn-small,
        .delete-btn-small {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 1.2rem;
          padding: 0.25rem;
          border-radius: 4px;
          transition: all 0.2s ease;
        }

        .edit-btn-small:hover {
          background: #e3f2fd;
        }

        .delete-btn-small:hover {
          background: #ffebee;
        }

        .table-actions {
          display: flex;
          gap: 0.5rem;
          justify-content: center;
        }

        .approver-info,
        .approval-rules,
        .approval-reference-table {
          background: white;
          padding: 2rem;
          border-radius: 12px;
          margin-bottom: 2rem;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          border: 1px solid rgba(0,0,0,0.05);
        }

        .approver-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .approver-card,
        .rule-card {
          position: relative;
          border: 2px solid #e1e5e9;
          border-radius: 12px;
          padding: 1.5rem;
          background: #fafbfc;
          transition: all 0.3s ease;
        }

        .approver-card:hover,
        .rule-card:hover {
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

        .approver-basis,
        .rule-basis {
          font-size: 0.8rem;
          color: #888;
          font-style: italic;
          margin-top: 0.5rem;
          padding-top: 0.5rem;
          border-top: 1px solid #e1e5e9;
        }

        .rules-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
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

        /* 모달 스타일 */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          padding: 2rem;
          border-radius: 12px;
          width: 90%;
          max-width: 600px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }

        .modal-content h3 {
          margin-top: 0;
          color: #333;
          margin-bottom: 1.5rem;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: #333;
        }

        .form-group input,
        .form-group textarea {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 0.9rem;
          box-sizing: border-box;
        }

        .form-group input:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #667eea;
        }

        .modal-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
          margin-top: 2rem;
        }

        .save-btn,
        .cancel-btn {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.9rem;
          transition: all 0.3s ease;
        }

        .save-btn {
          background: #667eea;
          color: white;
        }

        .save-btn:hover {
          background: #5a67d8;
        }

        .cancel-btn {
          background: #6c757d;
          color: white;
        }

        .cancel-btn:hover {
          background: #5a6268;
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

          .section-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }

          .add-btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default ApprovalLine;
