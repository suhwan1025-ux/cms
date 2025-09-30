import React, { useState, useEffect } from 'react';

const BiddingContract = () => {
  const [formData, setFormData] = useState({
    // 기본 정보
    projectName: '',
    projectDescription: '',
    estimatedBudget: '',
    contractPeriod: '',
    
    // 비용귀속 부서 배분
    costDepartments: [],
    
    // 요청부서 (다중 선택)
    requestDepartments: [],
    
    // 계약방식
    contractMethod: '',
    contractBasis: '',
    
    // 입찰 관련
    biddingType: '',
    qualificationRequirements: '',
    evaluationCriteria: '',
    
    // 예산 산정
    budgetBreakdown: {
      labor: 0,
      materials: 0,
      equipment: 0,
      overhead: 0,
      profit: 0
    }
  });

  const [departments] = useState([
    'IT팀', '총무팀', '기획팀', '영업팀', '마케팅팀', '인사팀', '재무팀', '법무팀'
  ]);

  const [contractMethods] = useState([
    { 
      name: '수의계약', 
      basis: '사내규정 제1조 - 수의계약 규정',
      description: '경쟁입찰을 하지 않고 특정 업체와 계약을 체결하는 방식'
    },
    { 
      name: '입찰계약', 
      basis: '사내규정 제2조 - 입찰계약 규정',
      description: '공개입찰을 통해 최적의 업체를 선정하는 방식'
    },
    { 
      name: '최저가계약', 
      basis: '사내규정 제3조 - 최저가계약 규정',
      description: '최저가를 제시한 업체와 계약을 체결하는 방식'
    }
  ]);

  const [biddingTypes] = useState([
    '공개입찰',
    '지명입찰',
    '제한입찰',
    '단계별입찰'
  ]);

  const [totalBudget, setTotalBudget] = useState(0);

  // 총 예산 계산
  useEffect(() => {
    const total = Object.values(formData.budgetBreakdown).reduce((sum, value) => sum + value, 0);
    setTotalBudget(total);
  }, [formData.budgetBreakdown]);

  // 비용귀속 부서 배분 처리
  const handleCostDepartmentAdd = () => {
    setFormData({
      ...formData,
      costDepartments: [...formData.costDepartments, {
        id: Date.now(),
        department: '',
        percentage: 0,
        amount: 0
      }]
    });
  };

  const handleCostDepartmentChange = (index, field, value) => {
    const newCostDepartments = [...formData.costDepartments];
    newCostDepartments[index] = { ...newCostDepartments[index], [field]: value };
    
    // 금액 자동 계산
    if (field === 'percentage') {
      newCostDepartments[index].amount = Math.round((totalBudget * value) / 100);
    }
    
    setFormData({ ...formData, costDepartments: newCostDepartments });
  };

  const handleCostDepartmentRemove = (index) => {
    const newCostDepartments = formData.costDepartments.filter((_, i) => i !== index);
    setFormData({ ...formData, costDepartments: newCostDepartments });
  };

  // 예산 세부 항목 변경
  const handleBudgetChange = (field, value) => {
    setFormData({
      ...formData,
      budgetBreakdown: {
        ...formData.budgetBreakdown,
        [field]: parseInt(value) || 0
      }
    });
  };

  // 비용귀속 부서 배분 검증
  const validateCostDistribution = () => {
    const totalPercentage = formData.costDepartments.reduce((sum, dept) => sum + dept.percentage, 0);
    return totalPercentage === 100;
  };

  // 결재라인 안내
  const getApprovalLine = (amount) => {
    if (amount <= 10000000) return '팀장 → 부서장';
    if (amount <= 50000000) return '팀장 → 부서장 → 이사';
    if (amount <= 200000000) return '팀장 → 부서장 → 이사 → 대표이사';
    return '팀장 → 부서장 → 이사 → 대표이사 → 이사회';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateCostDistribution()) {
      alert('비용귀속 부서 배분이 100%가 되어야 합니다.');
      return;
    }
    
    console.log('입찰 계약 작성:', formData);
    alert('입찰 계약이 작성되었습니다.');
  };

  const formatCurrency = (amount) => {
    // 소수점 제거하고 정수로 변환
    const integerAmount = Math.round(amount);
    return new Intl.NumberFormat('ko-KR').format(integerAmount) + '원';
  };

  return (
    <div className="bidding-contract">
      <h1>입찰 계약 자동 작성</h1>
      
      <form onSubmit={handleSubmit}>
        {/* 기본 정보 */}
        <div className="form-section">
          <h3>기본 정보</h3>
          
          <div className="form-group">
            <label>사업명</label>
            <input
              type="text"
              value={formData.projectName}
              onChange={(e) => setFormData({...formData, projectName: e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <label>사업 설명</label>
            <textarea
              value={formData.projectDescription}
              onChange={(e) => setFormData({...formData, projectDescription: e.target.value})}
              required
              rows="4"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>예상 계약금액</label>
              <input
                type="number"
                value={formData.estimatedBudget}
                onChange={(e) => setFormData({...formData, estimatedBudget: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>계약기간</label>
              <input
                type="text"
                value={formData.contractPeriod}
                onChange={(e) => setFormData({...formData, contractPeriod: e.target.value})}
                placeholder="예: 6개월"
                required
              />
            </div>
          </div>
        </div>

        {/* 요청부서 다중 선택 */}
        <div className="form-section">
          <h3>요청부서 (다중 선택 가능)</h3>
          <div className="checkbox-group">
            {departments.map(dept => (
              <label key={dept} className="checkbox-item">
                <input
                  type="checkbox"
                  checked={formData.requestDepartments.includes(dept)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFormData({
                        ...formData, 
                        requestDepartments: [...formData.requestDepartments, dept]
                      });
                    } else {
                      setFormData({
                        ...formData, 
                        requestDepartments: formData.requestDepartments.filter(d => d !== dept)
                      });
                    }
                  }}
                />
                {dept}
              </label>
            ))}
          </div>
        </div>

        {/* 계약방식 선택 */}
        <div className="form-section">
          <h3>계약방식 선택</h3>
          <div className="contract-methods">
            {contractMethods.map(method => (
              <div key={method.name} className="method-card">
                <label className="method-radio">
                  <input
                    type="radio"
                    name="contractMethod"
                    value={method.name}
                    checked={formData.contractMethod === method.name}
                    onChange={(e) => {
                      const selectedMethod = contractMethods.find(m => m.name === e.target.value);
                      setFormData({
                        ...formData, 
                        contractMethod: e.target.value,
                        contractBasis: selectedMethod.basis
                      });
                    }}
                  />
                  <div className="method-info">
                    <h4>{method.name}</h4>
                    <p>{method.description}</p>
                    <small>근거: {method.basis}</small>
                  </div>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* 예산 세부 항목 */}
        <div className="form-section">
          <h3>예산 세부 항목</h3>
          <div className="budget-breakdown">
            <div className="form-row">
              <div className="form-group">
                <label>인건비</label>
                <input
                  type="number"
                  value={formData.budgetBreakdown.labor}
                  onChange={(e) => handleBudgetChange('labor', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>재료비</label>
                <input
                  type="number"
                  value={formData.budgetBreakdown.materials}
                  onChange={(e) => handleBudgetChange('materials', e.target.value)}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>장비비</label>
                <input
                  type="number"
                  value={formData.budgetBreakdown.equipment}
                  onChange={(e) => handleBudgetChange('equipment', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>간접비</label>
                <input
                  type="number"
                  value={formData.budgetBreakdown.overhead}
                  onChange={(e) => handleBudgetChange('overhead', e.target.value)}
                />
              </div>
            </div>
            <div className="form-group">
              <label>이윤</label>
              <input
                type="number"
                value={formData.budgetBreakdown.profit}
                onChange={(e) => handleBudgetChange('profit', e.target.value)}
              />
            </div>
            <div className="total-budget">
              <strong>총 예산: {formatCurrency(totalBudget)}</strong>
            </div>
          </div>
        </div>

        {/* 비용귀속 부서 배분 */}
        <div className="form-section">
          <h3>비용귀속 부서 배분</h3>
          <p className="section-description">
            총 예산을 부서별로 배분하세요. 배분 비율의 합계가 100%가 되어야 합니다.
          </p>
          
          {formData.costDepartments.map((dept, index) => (
            <div key={dept.id} className="cost-department-row">
              <div className="form-row">
                <div className="form-group">
                  <label>부서</label>
                  <select
                    value={dept.department}
                    onChange={(e) => handleCostDepartmentChange(index, 'department', e.target.value)}
                    required
                  >
                    <option value="">부서 선택</option>
                    {departments.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>배분 비율 (%)</label>
                  <input
                    type="number"
                    value={dept.percentage}
                    onChange={(e) => handleCostDepartmentChange(index, 'percentage', parseInt(e.target.value))}
                    min="0"
                    max="100"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>배분 금액</label>
                  <input
                    type="text"
                    value={formatCurrency(dept.amount)}
                    readOnly
                    className="readonly"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleCostDepartmentRemove(index)}
                  className="remove-btn"
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
          
          <button type="button" onClick={handleCostDepartmentAdd} className="add-btn">
            + 부서 배분 추가
          </button>
          
          <div className="distribution-validation">
            <span>총 배분 비율: {formData.costDepartments.reduce((sum, dept) => sum + dept.percentage, 0)}%</span>
            {validateCostDistribution() ? (
              <span className="valid">✓ 배분 완료</span>
            ) : (
              <span className="invalid">⚠ 배분 비율이 100%가 되어야 합니다</span>
            )}
          </div>
        </div>

        {/* 입찰 관련 정보 */}
        <div className="form-section">
          <h3>입찰 관련 정보</h3>
          
          <div className="form-group">
            <label>입찰 유형</label>
            <select
              value={formData.biddingType}
              onChange={(e) => setFormData({...formData, biddingType: e.target.value})}
              required
            >
              <option value="">입찰 유형 선택</option>
              {biddingTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>자격 요건</label>
            <textarea
              value={formData.qualificationRequirements}
              onChange={(e) => setFormData({...formData, qualificationRequirements: e.target.value})}
              rows="3"
              placeholder="입찰 참가 자격 요건을 입력하세요"
            />
          </div>

          <div className="form-group">
            <label>평가 기준</label>
            <textarea
              value={formData.evaluationCriteria}
              onChange={(e) => setFormData({...formData, evaluationCriteria: e.target.value})}
              rows="3"
              placeholder="입찰 평가 기준을 입력하세요"
            />
          </div>
        </div>

        {/* 자동 계산 결과 */}
        <div className="calculation-results">
          <h3>자동 계산 결과</h3>
          <div className="result-grid">
            <div className="result-item">
              <span>총 예산:</span>
              <strong>{formatCurrency(totalBudget)}</strong>
            </div>
            <div className="result-item">
              <span>결재라인:</span>
              <strong>{getApprovalLine(totalBudget)}</strong>
            </div>
            <div className="result-item">
              <span>계약방식:</span>
              <strong>{formData.contractMethod || '-'}</strong>
            </div>
            <div className="result-item">
              <span>요청부서:</span>
              <strong>{formData.requestDepartments.length}개 부서</strong>
            </div>
          </div>
        </div>

        <button type="submit" className="submit-btn">입찰 계약 작성</button>
      </form>

      <style jsx="true">{`
        .bidding-contract {
          max-width: 1000px;
          margin: 0 auto;
        }

        .form-section {
          background: white;
          padding: 1.5rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .section-description {
          color: #666;
          font-size: 0.9rem;
          margin-bottom: 1rem;
        }

        .checkbox-group {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 0.5rem;
        }

        .checkbox-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
        }

        .contract-methods {
          display: grid;
          gap: 1rem;
        }

        .method-card {
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 1rem;
        }

        .method-radio {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          cursor: pointer;
        }

        .method-radio input[type="radio"] {
          margin-top: 0.25rem;
        }

        .method-info h4 {
          margin: 0 0 0.5rem 0;
          color: #333;
        }

        .method-info p {
          margin: 0 0 0.5rem 0;
          color: #666;
        }

        .method-info small {
          color: #999;
        }

        .budget-breakdown {
          background: #f8f9fa;
          padding: 1rem;
          border-radius: 5px;
        }

        .total-budget {
          text-align: center;
          padding: 1rem;
          background: white;
          border-radius: 5px;
          margin-top: 1rem;
          font-size: 1.2rem;
        }

        .cost-department-row {
          border: 1px solid #eee;
          padding: 1rem;
          border-radius: 5px;
          margin-bottom: 1rem;
        }

        .remove-btn {
          background: #dc3545;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
          align-self: end;
        }

        .add-btn {
          background: #28a745;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
          margin-top: 1rem;
        }

        .distribution-validation {
          margin-top: 1rem;
          padding: 1rem;
          background: #f8f9fa;
          border-radius: 5px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .valid {
          color: #28a745;
          font-weight: 500;
        }

        .invalid {
          color: #dc3545;
          font-weight: 500;
        }

        .readonly {
          background-color: #f8f9fa;
          color: #666;
        }

        .calculation-results {
          background: #f8f9fa;
          padding: 1.5rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
        }

        .result-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem;
        }

        .result-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem;
          background: white;
          border-radius: 5px;
        }

        @media (max-width: 768px) {
          .checkbox-group {
            grid-template-columns: 1fr;
          }
          
          .result-grid {
            grid-template-columns: 1fr;
          }
          
          .distribution-validation {
            flex-direction: column;
            gap: 0.5rem;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
};

export default BiddingContract; 