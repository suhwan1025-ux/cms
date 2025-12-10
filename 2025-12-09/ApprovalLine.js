import React, { useState, useEffect } from 'react';
import { getApiUrl } from '../config/api';

// API 베이스 URL 설정
const API_BASE_URL = getApiUrl();

const ApprovalLine = () => {
  // === 상태 관리 ===
  const [amountAgreements, setAmountAgreements] = useState([]);
  const [amountDecisions, setAmountDecisions] = useState([]);
  const [typeAgreements, setTypeAgreements] = useState([]);
  const [loading, setLoading] = useState(true);

  // 모달 상태
  const [showAmountAgreementModal, setShowAmountAgreementModal] = useState(false);
  const [showAmountDecisionModal, setShowAmountDecisionModal] = useState(false);
  const [showTypeAgreementModal, setShowTypeAgreementModal] = useState(false);

  // 편집 대상 (null이면 추가 모드)
  const [editingItem, setEditingItem] = useState(null);

  // 폼 데이터
  const [amountAgreementForm, setAmountAgreementForm] = useState({ min_amount: '', max_amount: '', approver: '' });
  const [amountDecisionForm, setAmountDecisionForm] = useState({ min_amount: '', max_amount: '', decision_maker: '' });
  const [typeAgreementForm, setTypeAgreementForm] = useState({ contract_type: '', approver: '', basis: '' });

  // === 데이터 로드 ===
  const fetchData = async () => {
    try {
      setLoading(true);
      const [amountAgreementsRes, amountDecisionsRes, typeAgreementsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/approval-amount-agreement`),
        fetch(`${API_BASE_URL}/api/approval-amount-decision`),
        fetch(`${API_BASE_URL}/api/approval-type-agreement`)
      ]);

      setAmountAgreements(await amountAgreementsRes.json());
      setAmountDecisions(await amountDecisionsRes.json());
      setTypeAgreements(await typeAgreementsRes.json());
    } catch (error) {
      console.error('데이터 로드 실패:', error);
      alert('데이터 로드에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // === 유틸리티 함수 ===
  const formatAmount = (amount) => {
    if (amount === null || amount === undefined) return '';
    // 큰 숫자는 '억', '만' 단위로 변환
    const num = Number(amount);
    if (num >= 100000000) {
      const eok = Math.floor(num / 100000000);
      const man = Math.floor((num % 100000000) / 10000);
      return `${eok}억${man > 0 ? ` ${man}만` : ''}원`;
    } else if (num >= 10000) {
      return `${num / 10000}만원`;
    }
    return num.toLocaleString() + '원';
  };

  // === 1. 계약금액별 합의라인 핸들러 ===
  const handleAddAmountAgreement = () => {
    setEditingItem(null);
    setAmountAgreementForm({ min_amount: '0', max_amount: '0', approver: '' });
    setShowAmountAgreementModal(true);
  };

  const handleEditAmountAgreement = (item) => {
    setEditingItem(item);
    setAmountAgreementForm({
      min_amount: item.min_amount,
      max_amount: item.max_amount,
      approver: item.approver
    });
    setShowAmountAgreementModal(true);
  };

  const handleSaveAmountAgreement = async () => {
    try {
      const method = editingItem ? 'PUT' : 'POST';
      const url = editingItem 
        ? `${API_BASE_URL}/api/approval-amount-agreement/${editingItem.id}`
        : `${API_BASE_URL}/api/approval-amount-agreement`;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...amountAgreementForm,
          max_amount: amountAgreementForm.max_amount === '' ? 0 : amountAgreementForm.max_amount
        })
      });

      if (response.ok) {
        alert('저장되었습니다.');
        setShowAmountAgreementModal(false);
        fetchData();
      } else {
        throw new Error('저장 실패');
      }
    } catch (error) {
      console.error('저장 오류:', error);
      alert('저장에 실패했습니다.');
    }
  };

  const handleDeleteAmountAgreement = async (id) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    try {
      await fetch(`${API_BASE_URL}/api/approval-amount-agreement/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (error) {
      console.error('삭제 오류:', error);
      alert('삭제에 실패했습니다.');
    }
  };

  // === 2. 계약금액별 전결라인 핸들러 ===
  const handleAddAmountDecision = () => {
    setEditingItem(null);
    setAmountDecisionForm({ min_amount: '0', max_amount: '0', decision_maker: '' });
    setShowAmountDecisionModal(true);
  };

  const handleEditAmountDecision = (item) => {
    setEditingItem(item);
    setAmountDecisionForm({
      min_amount: item.min_amount,
      max_amount: item.max_amount,
      decision_maker: item.decision_maker
    });
    setShowAmountDecisionModal(true);
  };

  const handleSaveAmountDecision = async () => {
    try {
      const method = editingItem ? 'PUT' : 'POST';
      const url = editingItem 
        ? `${API_BASE_URL}/api/approval-amount-decision/${editingItem.id}`
        : `${API_BASE_URL}/api/approval-amount-decision`;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(amountDecisionForm)
      });

      if (response.ok) {
        alert('저장되었습니다.');
        setShowAmountDecisionModal(false);
        fetchData();
      } else {
        throw new Error('저장 실패');
      }
    } catch (error) {
      console.error('저장 오류:', error);
      alert('저장에 실패했습니다.');
    }
  };

  const handleDeleteAmountDecision = async (id) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    try {
      await fetch(`${API_BASE_URL}/api/approval-amount-decision/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (error) {
      console.error('삭제 오류:', error);
      alert('삭제에 실패했습니다.');
    }
  };

  // === 3. 계약유형별 합의라인 핸들러 ===
  const handleAddTypeAgreement = () => {
    setEditingItem(null);
    setTypeAgreementForm({ contract_type: '', approver: '', basis: '' });
    setShowTypeAgreementModal(true);
  };

  const handleEditTypeAgreement = (item) => {
    setEditingItem(item);
    setTypeAgreementForm({
      contract_type: item.contract_type,
      approver: item.approver,
      basis: item.basis || ''
    });
    setShowTypeAgreementModal(true);
  };

  const handleSaveTypeAgreement = async () => {
    try {
      const method = editingItem ? 'PUT' : 'POST';
      const url = editingItem 
        ? `${API_BASE_URL}/api/approval-type-agreement/${editingItem.id}`
        : `${API_BASE_URL}/api/approval-type-agreement`;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(typeAgreementForm)
      });

      if (response.ok) {
        alert('저장되었습니다.');
        setShowTypeAgreementModal(false);
        fetchData();
      } else {
        throw new Error('저장 실패');
      }
    } catch (error) {
      console.error('저장 오류:', error);
      alert('저장에 실패했습니다.');
    }
  };

  const handleDeleteTypeAgreement = async (id) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    try {
      await fetch(`${API_BASE_URL}/api/approval-type-agreement/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (error) {
      console.error('삭제 오류:', error);
      alert('삭제에 실패했습니다.');
    }
  };

  // === 4. 통합 결재라인 참고표 로직 ===
  const getCombinedAmountRules = () => {
    if (amountAgreements.length === 0 && amountDecisions.length === 0) return [];

    // 1. 모든 경계값 수집
    const boundaries = new Set([0]);
    amountAgreements.forEach(a => {
      boundaries.add(Number(a.min_amount));
      // max_amount가 0이거나 매우 큰 수면 무한대로 취급 -> 경계값에 포함 안 함
      if (a.max_amount && a.max_amount < 999999999999 && Number(a.max_amount) !== 0) {
        boundaries.add(Number(a.max_amount));
      }
    });
    amountDecisions.forEach(d => {
      boundaries.add(Number(d.min_amount));
      if (d.max_amount && d.max_amount < 999999999999 && Number(d.max_amount) !== 0) {
        boundaries.add(Number(d.max_amount));
      }
    });

    const sortedBoundaries = Array.from(boundaries).sort((a, b) => a - b);
    
    // 2. 구간 생성 및 매핑
    const intervals = [];
    for (let i = 0; i < sortedBoundaries.length; i++) {
      const start = sortedBoundaries[i];
      const end = sortedBoundaries[i+1]; // undefined면 무제한
      
      // 대표값으로 매칭 (구간의 시작점 + 1원)
      // "초과" 기준이므로 start 값보다 커야 해당 구간에 속함.
      const checkVal = start + 1;

      // 합의자 찾기 (중복 포함)
      // 예: 1000만 초과 시 A, 5000만 초과 시 B가 있을 때, 
      // 6000만 원 구간에서는 A(1000만 초과 조건 만족)와 B(5000만 초과 조건 만족)가 모두 나와야 함.
      const agrs = amountAgreements.filter(a => {
        const min = Number(a.min_amount);
        const max = (a.max_amount && a.max_amount < 999999999999 && Number(a.max_amount) !== 0) ? Number(a.max_amount) : Infinity;
        
        // 조건: min < checkVal <= max
        // (min_amount "초과" 조건이므로 checkVal은 min보다 커야 함)
        return checkVal > min && checkVal <= max; 
      });

      // 전결권자 찾기 (보통 구간당 1명)
      const dec = amountDecisions.find(d => {
        const min = Number(d.min_amount);
        const max = (d.max_amount && d.max_amount < 999999999999 && Number(d.max_amount) !== 0) ? Number(d.max_amount) : Infinity;
        // 전결권자도 min < checkVal <= max
        return checkVal > min && checkVal <= max;
      });
      
      // 합의자 목록 정렬 (금액 순 또는 등록 순?) -> min_amount 순으로 정렬되어 있다고 가정하거나 정렬 수행
      agrs.sort((a, b) => Number(a.min_amount) - Number(b.min_amount));
      
      const approverStr = agrs.length > 0 ? agrs.map(a => a.approver).join(', ') : '-';
      const decisionMakerStr = dec ? dec.decision_maker : '-';

      intervals.push({
        start,
        end: end || null,
        approver: approverStr,
        decision_maker: decisionMakerStr
      });
    }
    
    // 3. 인접 구간 병합 (전결권자와 합의자가 같으면)
    const merged = [];
    if (intervals.length > 0) {
      let current = intervals[0];
      for (let i = 1; i < intervals.length; i++) {
        const next = intervals[i];
        if (current.approver === next.approver && current.decision_maker === next.decision_maker) {
          // 병합
          current.end = next.end;
        } else {
          merged.push(current);
          current = next;
        }
      }
      merged.push(current);
    }

    return merged;
  };

  const combinedRules = getCombinedAmountRules();

  if (loading) return <div className="loading">데이터 로딩 중...</div>;

  return (
    <div className="approval-line-container">
      <h1>결재라인 관리</h1>

      {/* 1. 계약금액별 합의라인 */}
      <section className="approval-section">
        <div className="section-header">
          <h2>계약금액별 합의라인</h2>
          <button className="add-btn" onClick={handleAddAmountAgreement}>➕ 추가</button>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>계약금액 초과</th>
                <th>계약금액 이하</th>
                <th>합의자</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {amountAgreements.map(item => (
                <tr key={item.id}>
                  <td>{formatAmount(item.min_amount)}</td>
                  <td>{(item.max_amount === '0' || item.max_amount === 0 || item.max_amount >= 999999999999) ? '제한없음' : formatAmount(item.max_amount)}</td>
                  <td>{item.approver}</td>
                  <td>
                    <button className="edit-btn" onClick={() => handleEditAmountAgreement(item)}>수정</button>
                    <button className="delete-btn" onClick={() => handleDeleteAmountAgreement(item.id)}>삭제</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 2. 계약금액별 전결라인 */}
      <section className="approval-section">
        <div className="section-header">
          <h2>계약금액별 전결라인</h2>
          <button className="add-btn" onClick={handleAddAmountDecision}>➕ 추가</button>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>계약금액 초과</th>
                <th>계약금액 이하</th>
                <th>전결권자</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {amountDecisions.map(item => (
                <tr key={item.id}>
                  <td>{formatAmount(item.min_amount)}</td>
                  <td>{item.max_amount >= 999999999999 ? '제한없음' : formatAmount(item.max_amount)}</td>
                  <td><span className="decision-maker-badge">{item.decision_maker}</span></td>
                  <td>
                    <button className="edit-btn" onClick={() => handleEditAmountDecision(item)}>수정</button>
                    <button className="delete-btn" onClick={() => handleDeleteAmountDecision(item.id)}>삭제</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 3. 계약유형별 합의라인 */}
      <section className="approval-section">
        <div className="section-header">
          <h2>계약유형별 합의라인</h2>
          <button className="add-btn" onClick={handleAddTypeAgreement}>➕ 추가</button>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>계약유형</th>
                <th>합의자</th>
                <th>근거</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {typeAgreements.map(item => (
                <tr key={item.id}>
                  <td>{item.contract_type}</td>
                  <td>{item.approver}</td>
                  <td>{item.basis}</td>
                  <td>
                    <button className="edit-btn" onClick={() => handleEditTypeAgreement(item)}>수정</button>
                    <button className="delete-btn" onClick={() => handleDeleteTypeAgreement(item.id)}>삭제</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 4. 결재라인 참고표 (종합) */}
      <section className="approval-section" style={{ border: '2px solid #2196F3', backgroundColor: '#e3f2fd' }}>
        <div className="section-header" style={{ borderBottomColor: '#bbdefb' }}>
          <h2 style={{ color: '#1565c0' }}>📋 결재라인 참고표 (종합 가이드)</h2>
        </div>
        
        <div className="reference-content">
          <div className="reference-group">
            <h3 style={{ marginTop: 0, color: '#333', fontSize: '1.1rem' }}>1. 금액별 전결 및 합의 기준</h3>
            <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '10px' }}>
              계약 금액에 따라 아래와 같이 전결권자와 합의 부서가 결정됩니다.
            </p>
            <div className="table-wrapper" style={{ boxShadow: 'none', border: '1px solid #bbdefb' }}>
              <table>
                <thead>
                  <tr>
                    <th style={{ backgroundColor: '#bbdefb', color: '#0d47a1' }}>계약금액 구간</th>
                    <th style={{ backgroundColor: '#bbdefb', color: '#0d47a1' }}>전결권자</th>
                    <th style={{ backgroundColor: '#bbdefb', color: '#0d47a1' }}>필수 합의</th>
                  </tr>
                </thead>
                <tbody>
                  {combinedRules.length > 0 ? (
                    combinedRules.map((rule, idx) => (
                      <tr key={idx} style={{ backgroundColor: 'white' }}>
                        <td>
                          {formatAmount(rule.start)} {rule.end ? `초과 ~ ${formatAmount(rule.end)} 이하` : '초과 (무제한)'}
                          {rule.start === 0 && !rule.end && ' (모든 금액)'}
                        </td>
                        <td>
                          {rule.decision_maker !== '-' ? (
                            <span className="decision-maker-badge" style={{ backgroundColor: '#e8eaf6', color: '#3f51b5' }}>
                              {rule.decision_maker}
                            </span>
                          ) : (
                            <span style={{ color: '#999' }}>-</span>
                          )}
                        </td>
                        <td>
                          {rule.approver !== '-' ? (
                            <span style={{ fontWeight: 'bold', color: '#e65100' }}>{rule.approver}</span>
                          ) : (
                            <span style={{ color: '#999' }}>-</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" style={{ textAlign: 'center', padding: '20px' }}>등록된 기준이 없습니다.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="reference-group" style={{ marginTop: '2rem' }}>
            <h3 style={{ color: '#333', fontSize: '1.1rem' }}>2. 계약 유형별 추가 합의</h3>
            <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '10px' }}>
              아래 계약 유형에 해당할 경우, 금액 기준 합의 외에 <strong>추가 합의</strong>가 필요합니다.
            </p>
            <div className="table-wrapper" style={{ boxShadow: 'none', border: '1px solid #bbdefb' }}>
              <table>
                <thead>
                  <tr>
                    <th style={{ backgroundColor: '#bbdefb', color: '#0d47a1' }}>계약 유형</th>
                    <th style={{ backgroundColor: '#bbdefb', color: '#0d47a1' }}>추가 합의 부서</th>
                    <th style={{ backgroundColor: '#bbdefb', color: '#0d47a1' }}>근거 및 비고</th>
                  </tr>
                </thead>
                <tbody>
                  {typeAgreements.length > 0 ? (
                    typeAgreements.map((item, idx) => (
                      <tr key={idx} style={{ backgroundColor: 'white' }}>
                        <td style={{ fontWeight: 'bold' }}>{item.contract_type}</td>
                        <td style={{ color: '#d32f2f', fontWeight: 'bold' }}>{item.approver}</td>
                        <td>{item.basis || '-'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" style={{ textAlign: 'center', padding: '20px' }}>등록된 유형별 합의 기준이 없습니다.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* === 모달 컴포넌트들 === */}
      
      {/* 1. 계약금액별 합의라인 모달 */}
      {showAmountAgreementModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{editingItem ? '계약금액별 합의라인 수정' : '계약금액별 합의라인 추가'}</h3>
            <div className="form-group">
              <label>최소 금액 (원)</label>
              <input type="number" value={amountAgreementForm.min_amount} onChange={e => setAmountAgreementForm({...amountAgreementForm, min_amount: e.target.value})} />
            </div>
            <div className="form-group">
              <label>최대 금액 (원, 0 입력시 무제한)</label>
              <input type="number" value={amountAgreementForm.max_amount} onChange={e => setAmountAgreementForm({...amountAgreementForm, max_amount: e.target.value})} />
            </div>
            <div className="form-group">
              <label>합의자</label>
              <input type="text" value={amountAgreementForm.approver} onChange={e => setAmountAgreementForm({...amountAgreementForm, approver: e.target.value})} placeholder="예: 재무팀장" />
            </div>
            <div className="modal-actions">
              <button onClick={handleSaveAmountAgreement}>저장</button>
              <button onClick={() => setShowAmountAgreementModal(false)} className="cancel">취소</button>
            </div>
          </div>
        </div>
      )}

      {/* 2. 계약금액별 전결라인 모달 */}
      {showAmountDecisionModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{editingItem ? '계약금액별 전결라인 수정' : '계약금액별 전결라인 추가'}</h3>
            <div className="form-group">
              <label>최소 금액 (원)</label>
              <input type="number" value={amountDecisionForm.min_amount} onChange={e => setAmountDecisionForm({...amountDecisionForm, min_amount: e.target.value})} />
            </div>
            <div className="form-group">
              <label>최대 금액 (원, 0 입력시 무제한)</label>
              <input type="number" value={amountDecisionForm.max_amount} onChange={e => setAmountDecisionForm({...amountDecisionForm, max_amount: e.target.value})} />
            </div>
            <div className="form-group">
              <label>전결권자</label>
              <input type="text" value={amountDecisionForm.decision_maker} onChange={e => setAmountDecisionForm({...amountDecisionForm, decision_maker: e.target.value})} placeholder="예: 본부장" />
            </div>
            <div className="modal-actions">
              <button onClick={handleSaveAmountDecision}>저장</button>
              <button onClick={() => setShowAmountDecisionModal(false)} className="cancel">취소</button>
            </div>
          </div>
        </div>
      )}

      {/* 3. 계약유형별 합의라인 모달 */}
      {showTypeAgreementModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{editingItem ? '계약유형별 합의라인 수정' : '계약유형별 합의라인 추가'}</h3>
            <div className="form-group">
              <label>계약유형</label>
              <input type="text" value={typeAgreementForm.contract_type} onChange={e => setTypeAgreementForm({...typeAgreementForm, contract_type: e.target.value})} placeholder="예: 용역계약" />
            </div>
            <div className="form-group">
              <label>합의자</label>
              <input type="text" value={typeAgreementForm.approver} onChange={e => setTypeAgreementForm({...typeAgreementForm, approver: e.target.value})} placeholder="예: 법무팀장" />
            </div>
            <div className="form-group">
              <label>근거</label>
              <input type="text" value={typeAgreementForm.basis} onChange={e => setTypeAgreementForm({...typeAgreementForm, basis: e.target.value})} />
            </div>
            <div className="modal-actions">
              <button onClick={handleSaveTypeAgreement}>저장</button>
              <button onClick={() => setShowTypeAgreementModal(false)} className="cancel">취소</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .approval-line-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
          font-family: 'Malgun Gothic', sans-serif;
        }
        
        .approval-section {
          background: white;
          border-radius: 8px;
          padding: 1.5rem;
          margin-bottom: 2rem;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          border-bottom: 2px solid #f0f0f0;
          padding-bottom: 0.5rem;
        }

        .section-header h2 {
          margin: 0;
          font-size: 1.2rem;
          color: #333;
        }

        .add-btn {
          background-color: #4CAF50;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-weight: bold;
        }

        .add-btn:hover {
          background-color: #45a049;
        }

        .table-wrapper {
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 0.5rem;
        }

        th, td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }

        th {
          background-color: #f8f9fa;
          font-weight: bold;
          color: #555;
        }

        tr:hover {
          background-color: #f5f5f5;
        }

        .decision-maker-badge {
          background-color: #e3f2fd;
          color: #1976d2;
          padding: 4px 8px;
          border-radius: 12px;
          font-weight: bold;
          font-size: 0.9em;
        }

        .edit-btn, .delete-btn {
          padding: 4px 8px;
          margin-right: 4px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.85em;
        }

        .edit-btn {
          background-color: #2196F3;
          color: white;
        }

        .delete-btn {
          background-color: #f44336;
          color: white;
        }

        /* 모달 스타일 */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0,0,0,0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          padding: 2rem;
          border-radius: 8px;
          width: 400px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }

        .form-group {
          margin-bottom: 1rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: bold;
          color: #555;
        }

        .form-group input {
          width: 100%;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          box-sizing: border-box;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 1.5rem;
        }

        .modal-actions button {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: bold;
          background-color: #2196F3;
          color: white;
        }

        .modal-actions button.cancel {
          background-color: #9e9e9e;
        }
      `}</style>
    </div>
  );
};

export default ApprovalLine;
