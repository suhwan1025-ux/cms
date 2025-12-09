// 미리보기 HTML 생성 공통 유틸리티 (ProposalForm 로직 기반으로 개선)

import { hasChanged, renderChangedValue, renderChangedNumber, renderChangedArray } from './comparisonHelper.js';

// 통화 포맷팅 함수
export const formatCurrency = (amount) => {
  if (!amount) return '-';
  const integerAmount = Math.round(amount);
  return new Intl.NumberFormat('ko-KR').format(integerAmount) + '원';
};

// 숫자 포맷팅 함수
export const formatNumberWithComma = (number) => {
  if (!number) return '-';
  return new Intl.NumberFormat('ko-KR').format(number);
};

// 계약 유형 이름 반환
export const getContractTypeName = (contractType) => {
  const typeMap = {
    'purchase': '구매계약',
    'change': '변경계약', 
    'extension': '연장계약',
    'service': '용역계약',
    'bidding': '입찰계약',
    'freeform': '자유양식'
  };
  return typeMap[contractType] || contractType;
};

// 기술등급 한글 변환
export const getSkillLevelKorean = (skillLevel) => {
  if (!skillLevel) return '-';
  
  const skillMap = {
    'expert': '특급',
    'senior': '고급',
    'advanced': '고급',
    'intermediate': '중급',
    'junior': '초급',
    'beginner': '초급',
    // 이미 한글인 경우 그대로 반환
    '특급': '특급',
    '고급': '고급',
    '중급': '중급',
    '초급': '초급'
  };
  
  return skillMap[skillLevel.toLowerCase()] || skillLevel;
};

// 계약방법 이름 반환
export const getContractMethodName = (contractMethod) => {
  // contractMethod가 없거나 빈 문자열이면 '-' 반환
  if (!contractMethod || contractMethod.trim() === '') {
    return '-';
  }
  
  const methodMap = {
    // 기존 형식 (하위 호환성)
    'general': '일반경쟁',
    'limited': '제한경쟁',
    'designation': '지명경쟁',
    'negotiation': '수의계약',
    'emergency': '긴급계약',
    
    // 데이터베이스 실제 값 (contract_methods.value)
    'lowest_price': '최저가 계약',
    'general_competition': '경쟁계약(일반경쟁계약)',
    'limited_competition': '경쟁계약(제한경쟁계약)',
    'designated_competition': '경쟁계약(지명경쟁계약)',
    'negotiated_competition': '경쟁계약(협상에 의한 계약)',
    'private_contract': '수의계약',
    'private_contract_6_1_a': '수의계약(제6조 제1항의 가)',
    'private_contract_6_1_b': '수의계약(제6조 제1항의 나)',
    'private_contract_6_1_c': '수의계약(제6조 제1항의 다)',
    'private_contract_6_1_d': '수의계약(제6조 제1항의 라)',
    'private_contract_6_1_e': '수의계약(제6조 제1항의 마)',
    'private_contract_6_2_a': '수의계약(제6조 제2항의 가)',
    'private_contract_6_2_b': '수의계약(제6조 제2항의 나)',
    'private_contract_6_2_c': '수의계약(제6조 제2항의 다)',
    'private_contract_6_2_d': '수의계약(제6조 제2항의 라)',
    'private_contract_6_2_e': '수의계약(제6조 제2항의 마)',
    'private_contract_6_2_f': '수의계약(제6조 제2항의 바)',
    'private_contract_6_2_g': '수의계약(제6조 제2항의 사)',
    
    // 신규 계약방식 코드 (CM04~CM21) - 운영망 대응
    'CM04': '최저가 계약',
    'CM05': '경쟁계약(일반경쟁계약)',
    'CM06': '경쟁계약(제한경쟁계약)',
    'CM07': '경쟁계약(지명경쟁계약)',
    'CM08': '경쟁계약(협상에 의한 계약)',
    'CM10': '수의계약(제6조 제1항의 가)',
    'CM11': '수의계약(제6조 제1항의 나)',
    'CM12': '수의계약(제6조 제1항의 다)',
    'CM13': '수의계약(제6조 제1항의 라)',
    'CM14': '수의계약(제6조 제1항의 마)',
    'CM15': '수의계약(제6조 제2항의 가)',
    'CM16': '수의계약(제6조 제2항의 나)',
    'CM17': '수의계약(제6조 제2항의 다)',
    'CM18': '수의계약(제6조 제2항의 라)',
    'CM19': '수의계약(제6조 제2항의 마)',
    'CM20': '수의계약(제6조 제2항의 바)',
    'CM21': '수의계약(제6조 제2항의 사)',
    
    // 한글 이름으로 저장된 경우 (그대로 반환)
    '최저가 계약': '최저가 계약',
    '경쟁계약(일반경쟁계약)': '경쟁계약(일반경쟁계약)',
    '경쟁계약(제한경쟁계약)': '경쟁계약(제한경쟁계약)',
    '경쟁계약(지명경쟁계약)': '경쟁계약(지명경쟁계약)',
    '경쟁계약(협상에 의한 계약)': '경쟁계약(협상에 의한 계약)',
    '수의계약': '수의계약',
    '수의계약(제6조 제1항의 가)': '수의계약(제6조 제1항의 가)',
    '수의계약(제6조 제1항의 나)': '수의계약(제6조 제1항의 나)',
    '수의계약(제6조 제1항의 다)': '수의계약(제6조 제1항의 다)',
    '수의계약(제6조 제1항의 라)': '수의계약(제6조 제1항의 라)',
    '수의계약(제6조 제1항의 마)': '수의계약(제6조 제1항의 마)',
    '수의계약(제6조 제2항의 가)': '수의계약(제6조 제2항의 가)',
    '수의계약(제6조 제2항의 나)': '수의계약(제6조 제2항의 나)',
    '수의계약(제6조 제2항의 다)': '수의계약(제6조 제2항의 다)',
    '수의계약(제6조 제2항의 라)': '수의계약(제6조 제2항의 라)',
    '수의계약(제6조 제2항의 마)': '수의계약(제6조 제2항의 마)',
    '수의계약(제6조 제2항의 바)': '수의계약(제6조 제2항의 바)',
    '수의계약(제6조 제2항의 사)': '수의계약(제6조 제2항의 사)'
  };
  
  return methodMap[contractMethod] || contractMethod;
};

// 계약기간 포맷팅
export const getContractPeriod = (item) => {
  // 계약기간이 설정되어 있는 경우
  if (item.contractPeriodType) {
    // 직접입력인 경우
    if (item.contractPeriodType === 'custom') {
      if (item.contractStartDate && item.contractEndDate) {
        return `${item.contractStartDate} ~ ${item.contractEndDate}`;
      } else {
        return '기간 미입력';
      }
    }
    
    // 미리 정의된 기간 타입인 경우
    const periodMapping = {
      '1month': '1개월',
      '3months': '3개월', 
      '6months': '6개월',
      '1year': '1년',
      '2years': '2년',
      '3years': '3년',
      'permanent': '영구'
    };
    
    return periodMapping[item.contractPeriodType] || '1년';
  }
  
  // contractPeriodType이 없지만 날짜가 있는 경우 (서버 데이터)
  if (item.contractStartDate && item.contractEndDate) {
    const startDate = new Date(item.contractStartDate).toLocaleDateString('ko-KR');
    const endDate = new Date(item.contractEndDate).toLocaleDateString('ko-KR');
    return `${startDate} ~ ${endDate}`;
  }
  
  // 계약기간이 설정되지 않은 경우
  return '-';
};

// 계정과목 카테고리별 정보 반환
export const getAccountSubjectByCategory = (category) => {
  const accountMap = {
    '소프트웨어': {
      관: '고정자산',
      항: '기타고정자산',
      목: '무형자산',
      절: '소프트웨어'
    },
    '전산기구비품': {
      관: '고정자산',
      항: '유형자산',
      목: '전산기구비품'
    },
    '전산수선': {
      관: '고정자산',
      항: '유형자산',
      목: '전산수선비'
    },
    '전산설치': {
      관: '영업비용',
      항: '판관비',
      목: '전산운용비',
      절: '전산설치비'
    },
    '전산소모품': {
      관: '영업비용',
      항: '판관비',
      목: '전산운용비',
      절: '전산소모품비'
    },
    '전산용역': {
      관: '영업비용',
      항: '판관비',
      목: '전산운용비',
      절: '전산용역비'
    },
    '전산임차': {
      관: '영업비용',
      항: '판관비',
      목: '전산운용비',
      절: '전산임차료'
    },
    '전산회선': {
      관: '영업비용',
      항: '판관비',
      목: '전산운용비',
      절: '전산회선료'
    },
    '전신전화': {
      관: '영업비용',
      항: '판관비',
      목: '전산운용비',
      절: '전신전화료'
    },
    '증권전산운용': {
      관: '영업비용',
      항: '판관비',
      목: '전산운용비',
      절: '증권전산운용비'
    },
    '보험비': {
      관: '영업비용',
      항: '판관비',
      목: '기타판관비',
      절: '보험료'
    },
    '일반업무수수료': {
      관: '영업비용',
      항: '판관비',
      목: '기타판관비',
      절: '일반업무수수료'
    },
    '통신정보료': {
      관: '영업비용',
      항: '판관비',
      목: '기타판관비',
      절: '통신정보료'
    },
    '회비및공과금': {
      관: '영업비용',
      항: '판관비',
      목: '세금과공과금',
      절: '회비및공과금'
    },
    '전산용역비': { // 용역계약 기본값
      관: '운영비',
      항: '일반운영비',
      목: '전산용역비',
      절: null
    },
    '기타': { // 기본값
      관: '운영비',
      항: '일반운영비',
      목: '기타운영비',
      절: null
    }
  };

  return accountMap[category] || accountMap['기타'];
};

// 계정과목 그룹 정보 생성 (ProposalForm.js와 동일한 로직)
export const getAccountSubjectGroups = (data) => {
  const accountMap = new Map(); // 구분+계정과목을 키로 사용하여 품목들을 그룹화

  // 구매계약의 경우
  if (['purchase', 'change', 'extension'].includes(data.contractType) && data.purchaseItems?.length > 0) {
    data.purchaseItems.forEach(item => {
      if (item.productName && item.item) {
        const accountSubject = getAccountSubjectByCategory(item.item);

        if (accountSubject) {
          let accountInfo = `관: ${accountSubject.관} > 항: ${accountSubject.항} > 목: ${accountSubject.목}`;
          if (accountSubject.절) {
            accountInfo += ` > 절: ${accountSubject.절}`;
          }

          // 구분(item)도 키에 포함하여 다른 구분끼리는 별도로 그룹화
          const groupKey = `${item.item}|${accountInfo}`;

          // 같은 구분 + 같은 계정과목을 가진 품목들을 배열로 묶음
          if (!accountMap.has(groupKey)) {
            accountMap.set(groupKey, {
              구분: item.item,
              accountInfo: accountInfo
            });
          }
          if (!accountMap.get(groupKey).names) {
            accountMap.get(groupKey).names = [];
          }
          accountMap.get(groupKey).names.push(item.productName);
        }
      }
    });
  }

  // 용역계약의 경우
  if (data.contractType === 'service' && data.serviceItems?.length > 0) {
    data.serviceItems.forEach(item => {
      if (item.item) {
        const accountSubject = getAccountSubjectByCategory(item.item);

        if (accountSubject) {
          let accountInfo = `관: ${accountSubject.관} > 항: ${accountSubject.항} > 목: ${accountSubject.목}`;
          if (accountSubject.절) {
            accountInfo += ` > 절: ${accountSubject.절}`;
          }

          // 구분(item)도 키에 포함
          const groupKey = `${item.item}|${accountInfo}`;

          // 같은 구분 + 같은 계정과목을 가진 품목들을 배열로 묶음
          if (!accountMap.has(groupKey)) {
            accountMap.set(groupKey, {
              구분: item.item,
              accountInfo: accountInfo
            });
          }
          if (!accountMap.get(groupKey).names) {
            accountMap.get(groupKey).names = [];
          }
          accountMap.get(groupKey).names.push(item.item);
        }
      }
    });
  }

  // Map을 배열로 변환 (품목명들을 쉼표로 연결)
  const groups = [];
  accountMap.forEach((value) => {
    if (value.names && value.names.length > 0) {
      groups.push({
        names: value.names.join(', '), // 여러 품목명을 쉼표로 연결
        accountInfo: value.accountInfo
      });
    }
  });

  return groups;
};

// 품목 섹션 생성 (ProposalForm 로직 기반)
export const generateItemsSection = (data, originalData = null) => {
  console.log('=== generateItemsSection 디버깅 ===');
  
  // 서버 데이터와 클라이언트 데이터 모두 지원
  const contractType = data.contractType || data.contract_type;
  console.log('contractType:', contractType, '(원본:', data.contractType, ', 서버:', data.contract_type, ')');
  console.log('purchaseItems:', data.purchaseItems);
  console.log('serviceItems:', data.serviceItems);
  console.log('originalData:', originalData);
  
  const isCorrection = !!originalData;
  
  // 자유양식인 경우
  if (contractType === 'freeform') {
    console.log('자유양식 처리 중...');
    return `
      <div class="section-title">2. 상세 내역</div>
      <div style="border: 1px solid #ddd; padding: 15px; border-radius: 4px; min-height: 100px;">
        ${data.wysiwygContent || data.wysiwyg_content || '내용이 입력되지 않았습니다.'}
      </div>
    `;
  }

  // 용역계약인 경우
  if (contractType === 'service' && data.serviceItems?.length > 0) {
    console.log('용역계약 처리 중... 항목 수:', data.serviceItems.length);
    data.serviceItems.forEach((item, index) => {
      console.log(`용역항목 ${index + 1}:`, {
        item: item.item,
        name: item.name,
        personnel: item.personnel,
        skillLevel: item.skillLevel || item.skill_level,
        period: item.period,
        monthlyRate: item.monthlyRate || item.monthly_rate,
        unitPrice: item.unitPrice || item.unit_price,
        quantity: item.quantity,
        contractAmount: item.contractAmount || item.contract_amount,
        supplier: item.supplier,
        creditRating: item.creditRating || item.credit_rating,
        contractPeriodStart: item.contractPeriodStart || item.contract_period_start,
        contractPeriodEnd: item.contractPeriodEnd || item.contract_period_end,
        paymentMethod: item.paymentMethod || item.payment_method
      });
    });
    
    const originalServiceItems = originalData?.serviceItems || [];
    const hasItemsChanged = isCorrection && JSON.stringify(data.serviceItems) !== JSON.stringify(originalServiceItems);
    
    return `
      <div class="section-title">2. 상세 내역</div>
      <table class="items-table">
        <thead>
          <tr>
            <th style="width: 40px;">No</th>
            <th style="min-width: 120px;">용역명</th>
            <th style="width: 80px;">성명</th>
            <th style="width: 70px;">기술등급</th>
            <th style="width: 50px;">기간</th>
            <th style="width: 90px;">월단가</th>
            <th style="width: 100px;">계약금액</th>
            <th style="width: 100px;">공급업체</th>
            <th style="width: 50px;">신용등급</th>
            <th style="width: 120px;">계약기간</th>
            <th style="width: 80px;">지급방식</th>
          </tr>
        </thead>
        <tbody>
          ${data.serviceItems.map((item, index) => {
            const originalItem = originalServiceItems[index];
            const isRowChanged = isCorrection && originalItem && JSON.stringify(item) !== JSON.stringify(originalItem);
            const isNewRow = isCorrection && !originalItem;
            const rowStyle = isNewRow ? 'background-color: #e8f5e9;' : (isRowChanged ? 'background-color: #fff9c4;' : '');
            
            return `
            <tr style="${rowStyle}">
              <td style="text-align: center;">${index + 1}${isNewRow ? ' <span style="color: #4caf50;">●</span>' : ''}</td>
              <td style="text-align: center;">${originalItem ? renderChangedValue(originalItem.item, item.item) : (item.item || '-')}</td>
              <td style="text-align: center;">${originalItem ? renderChangedValue(
                originalItem.name || originalItem.personnel,
                item.name || item.personnel
              ) : (item.name || item.personnel || '-')}</td>
              <td style="text-align: center;">${originalItem ? renderChangedValue(
                getSkillLevelKorean(originalItem.skillLevel || originalItem.skill_level),
                getSkillLevelKorean(item.skillLevel || item.skill_level)
              ) : getSkillLevelKorean(item.skillLevel || item.skill_level)}</td>
              <td style="text-align: center;">${(() => {
                const period = parseFloat(item.period || 0);
                const periodText = (period % 1 === 0 ? period.toString() : period.toFixed(2)) + '개월';
                if (originalItem) {
                  const originalPeriod = parseFloat(originalItem.period || 0);
                  const originalPeriodText = (originalPeriod % 1 === 0 ? originalPeriod.toString() : originalPeriod.toFixed(2)) + '개월';
                  return renderChangedValue(originalPeriodText, periodText);
                }
                return periodText;
              })()}</td>
              <td style="text-align: right;">${originalItem ? renderChangedNumber(
                originalItem.monthlyRate || originalItem.monthly_rate || originalItem.unitPrice || originalItem.unit_price,
                item.monthlyRate || item.monthly_rate || item.unitPrice || item.unit_price,
                formatCurrency
              ) : formatCurrency(item.monthlyRate || item.monthly_rate || item.unitPrice || item.unit_price || 0)}</td>
              <td style="text-align: right;">${(() => {
                const contractAmount = item.contractAmount || item.contract_amount ||
                                     (parseFloat(item.monthlyRate || item.monthly_rate) * parseFloat(item.period)) || 
                                     (parseFloat(item.unitPrice || item.unit_price) * parseFloat(item.quantity)) || 0;
                if (originalItem) {
                  const originalAmount = originalItem.contractAmount || originalItem.contract_amount ||
                                       (parseFloat(originalItem.monthlyRate || originalItem.monthly_rate) * parseFloat(originalItem.period)) || 
                                       (parseFloat(originalItem.unitPrice || originalItem.unit_price) * parseFloat(originalItem.quantity)) || 0;
                  return renderChangedNumber(originalAmount, contractAmount, formatCurrency);
                }
                return formatCurrency(contractAmount);
              })()}</td>
              <td style="text-align: center;">${originalItem ? renderChangedValue(originalItem.supplier, item.supplier) : (item.supplier || '-')}</td>
              <td style="text-align: center;">${originalItem ? renderChangedValue(
                originalItem.creditRating || originalItem.credit_rating,
                item.creditRating || item.credit_rating
              ) : (item.creditRating || item.credit_rating || '-')}</td>
              <td style="text-align: center; font-size: 0.85em; line-height: 1.3;">${(() => {
                const contractPeriodStart = item.contractPeriodStart || item.contract_period_start;
                const contractPeriodEnd = item.contractPeriodEnd || item.contract_period_end;
                let contractPeriodText = '-';
                if (contractPeriodStart && contractPeriodEnd) {
                  const startDate = contractPeriodStart.split ? contractPeriodStart.split('T')[0] : contractPeriodStart;
                  const endDate = contractPeriodEnd.split ? contractPeriodEnd.split('T')[0] : contractPeriodEnd;
                  contractPeriodText = `${startDate}<br>~ ${endDate}`;
                } else if (contractPeriodStart) {
                  contractPeriodText = contractPeriodStart.split ? contractPeriodStart.split('T')[0] : contractPeriodStart;
                } else if (contractPeriodEnd) {
                  contractPeriodText = '~ ' + (contractPeriodEnd.split ? contractPeriodEnd.split('T')[0] : contractPeriodEnd);
                }
                return contractPeriodText;
              })()}</td>
              <td style="text-align: center;">${(() => {
                const paymentMethodMap = {
                  'monthly': '월별',
                  'quarterly': '분기별',
                  'lump': '일시'
                };
                const paymentMethod = item.paymentMethod || item.payment_method;
                return paymentMethodMap[paymentMethod] || paymentMethod || '-';
              })()}</td>
            </tr>
            `;
          }).join('')}
          
          ${(() => {
            // 삭제된 항목 표시
            if (isCorrection && originalServiceItems.length > data.serviceItems.length) {
              const deletedItems = originalServiceItems.slice(data.serviceItems.length);
              return deletedItems.map((item, index) => {
                const contractAmount = item.contractAmount || item.contract_amount ||
                                     (parseFloat(item.monthlyRate || item.monthly_rate) * parseFloat(item.period)) || 
                                     (parseFloat(item.unitPrice || item.unit_price) * parseFloat(item.quantity)) || 0;
                const period = parseFloat(item.period || 0);
                const periodText = (period % 1 === 0 ? period.toString() : period.toFixed(2)) + '개월';
                
                return `
                <tr style="background-color: #ffebee; opacity: 0.6;">
                  <td style="text-align: center;"><span style="color: #f44336;">✕</span></td>
                  <td style="text-align: center;"><span style="text-decoration: line-through; color: #999;">${item.item || '-'}</span></td>
                  <td style="text-align: center;"><span style="text-decoration: line-through; color: #999;">${item.name || item.personnel || '-'}</span></td>
                  <td style="text-align: center;"><span style="text-decoration: line-through; color: #999;">${getSkillLevelKorean(item.skillLevel || item.skill_level)}</span></td>
                  <td style="text-align: center;"><span style="text-decoration: line-through; color: #999;">${periodText}</span></td>
                  <td style="text-align: right;"><span style="text-decoration: line-through; color: #999;">${formatCurrency(item.monthlyRate || item.monthly_rate || item.unitPrice || item.unit_price || 0)}</span></td>
                  <td style="text-align: right;"><span style="text-decoration: line-through; color: #999;">${formatCurrency(contractAmount)}</span></td>
                  <td style="text-align: center;"><span style="text-decoration: line-through; color: #999;">${item.supplier || '-'}</span></td>
                  <td style="text-align: center;"><span style="text-decoration: line-through; color: #999;">${item.creditRating || item.credit_rating || '-'}</span></td>
                  <td style="text-align: center;"><span style="text-decoration: line-through; color: #999;">-</span></td>
                  <td style="text-align: center;"><span style="text-decoration: line-through; color: #999;">-</span></td>
                </tr>
                `;
              }).join('');
            }
            return '';
          })()}
        </tbody>
        <tfoot>
          <tr class="total-row">
            <td colspan="6" style="text-align: center; font-weight: bold;">합계</td>
            <td style="text-align: right; font-weight: bold;">${(() => {
              const currentTotal = data.serviceItems.reduce((sum, item) => {
                const contractAmount = item.contractAmount || item.contract_amount;
                if (contractAmount) {
                  return sum + (parseFloat(contractAmount) || 0);
                }
                
                const monthlyRate = parseFloat(item.monthlyRate || item.monthly_rate) || 0;
                const period = parseFloat(item.period) || 0;
                const unitPrice = parseFloat(item.unitPrice || item.unit_price) || 0;
                const quantity = parseFloat(item.quantity) || 0;
                
                const calculated = (monthlyRate * period) || (unitPrice * quantity) || 0;
                return sum + calculated;
              }, 0);
              
              if (isCorrection && originalServiceItems.length > 0) {
                const originalTotal = originalServiceItems.reduce((sum, item) => {
                  const contractAmount = item.contractAmount || item.contract_amount;
                  if (contractAmount) {
                    return sum + (parseFloat(contractAmount) || 0);
                  }
                  
                  const monthlyRate = parseFloat(item.monthlyRate || item.monthly_rate) || 0;
                  const period = parseFloat(item.period) || 0;
                  const unitPrice = parseFloat(item.unitPrice || item.unit_price) || 0;
                  const quantity = parseFloat(item.quantity) || 0;
                  
                  const calculated = (monthlyRate * period) || (unitPrice * quantity) || 0;
                  return sum + calculated;
                }, 0);
                
                return renderChangedNumber(originalTotal, currentTotal, formatCurrency);
              }
              
              return formatCurrency(currentTotal);
            })()}</td>
            <td colspan="4" style="text-align: center; font-weight: bold;">-</td>
          </tr>
        </tfoot>
      </table>
    `;
  }

  // 구매계약인 경우
  if (['purchase', 'change', 'extension'].includes(contractType) && data.purchaseItems?.length > 0) {
    console.log('구매계약 처리 중... 항목 수:', data.purchaseItems.length);
    data.purchaseItems.forEach((item, index) => {
      console.log(`구매항목 ${index + 1}:`, {
        item: item.item,
        productName: item.productName || item.product_name,
        contractStartDate: item.contractStartDate || item.contract_start_date,
        contractEndDate: item.contractEndDate || item.contract_end_date,
        contractPeriodType: item.contractPeriodType || item.contract_period_type,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice || item.unit_price,
        amount: item.amount,
        supplier: item.supplier
      });
    });
    
    const originalPurchaseItems = originalData?.purchaseItems || [];
    const hasItemsChanged = isCorrection && JSON.stringify(data.purchaseItems) !== JSON.stringify(originalPurchaseItems);
    
    return `
      <div class="section-title">2. 상세 내역</div>
      <table class="items-table">
        <thead>
          <tr>
            <th>번호</th>
            <th>구분</th>
            <th>품목명</th>
            <th>계약기간</th>
            <th>수량</th>
            <th>단가</th>
            <th>금액</th>
            <th>공급업체</th>
          </tr>
        </thead>
        <tbody>
          ${data.purchaseItems.map((item, index) => {
            const originalItem = originalPurchaseItems[index];
            const isRowChanged = isCorrection && originalItem && JSON.stringify(item) !== JSON.stringify(originalItem);
            const isNewRow = isCorrection && !originalItem;
            const rowStyle = isNewRow ? 'background-color: #e8f5e9;' : (isRowChanged ? 'background-color: #fff9c4;' : '');
            
            return `
            <tr style="${rowStyle}">
              <td style="text-align: center;">${index + 1}${isNewRow ? ' <span style="color: #4caf50;">●</span>' : ''}</td>
              <td style="text-align: center;">${originalItem ? renderChangedValue(originalItem.item, item.item) : (item.item || '-')}</td>
              <td style="text-align: center;">${originalItem ? renderChangedValue(
                originalItem.productName || originalItem.product_name,
                item.productName || item.product_name
              ) : (item.productName || item.product_name || '-')}</td>
              <td style="text-align: center;">${(() => {
                const itemData = {
                  ...item,
                  productName: item.productName || item.product_name,
                  contractStartDate: item.contractStartDate || item.contract_start_date,
                  contractEndDate: item.contractEndDate || item.contract_end_date,
                  contractPeriodType: item.contractPeriodType || item.contract_period_type,
                  unitPrice: item.unitPrice || item.unit_price
                };
                const currentPeriod = getContractPeriod(itemData);
                
                if (originalItem) {
                  const originalItemData = {
                    ...originalItem,
                    productName: originalItem.productName || originalItem.product_name,
                    contractStartDate: originalItem.contractStartDate || originalItem.contract_start_date,
                    contractEndDate: originalItem.contractEndDate || originalItem.contract_end_date,
                    contractPeriodType: originalItem.contractPeriodType || originalItem.contract_period_type,
                    unitPrice: originalItem.unitPrice || originalItem.unit_price
                  };
                  const originalPeriod = getContractPeriod(originalItemData);
                  return renderChangedValue(originalPeriod, currentPeriod);
                }
                return currentPeriod;
              })()}</td>
              <td style="text-align: center;">${(() => {
                const quantityText = `${item.quantity || 0}${item.unit || '개'}`;
                if (originalItem) {
                  const originalQuantityText = `${originalItem.quantity || 0}${originalItem.unit || '개'}`;
                  return renderChangedValue(originalQuantityText, quantityText);
                }
                return quantityText;
              })()}</td>
              <td style="text-align: right;">${originalItem ? renderChangedNumber(
                originalItem.unitPrice || originalItem.unit_price,
                item.unitPrice || item.unit_price,
                formatCurrency
              ) : formatCurrency(item.unitPrice || item.unit_price || 0)}</td>
              <td style="text-align: right;">${originalItem ? renderChangedNumber(
                originalItem.amount,
                item.amount,
                formatCurrency
              ) : formatCurrency(item.amount || 0)}</td>
              <td style="text-align: center;">${originalItem ? renderChangedValue(originalItem.supplier, item.supplier) : (item.supplier || '-')}</td>
            </tr>
            `;
          }).join('')}
          
          ${(() => {
            // 삭제된 항목 표시
            if (isCorrection && originalPurchaseItems.length > data.purchaseItems.length) {
              const deletedItems = originalPurchaseItems.slice(data.purchaseItems.length);
              return deletedItems.map((item, index) => {
                const itemData = {
                  ...item,
                  productName: item.productName || item.product_name,
                  contractStartDate: item.contractStartDate || item.contract_start_date,
                  contractEndDate: item.contractEndDate || item.contract_end_date,
                  contractPeriodType: item.contractPeriodType || item.contract_period_type,
                  unitPrice: item.unitPrice || item.unit_price
                };
                
                return `
                <tr style="background-color: #ffebee; opacity: 0.6;">
                  <td style="text-align: center;"><span style="color: #f44336;">✕</span></td>
                  <td style="text-align: center;"><span style="text-decoration: line-through; color: #999;">${item.item || '-'}</span></td>
                  <td style="text-align: center;"><span style="text-decoration: line-through; color: #999;">${itemData.productName || '-'}</span></td>
                  <td style="text-align: center;"><span style="text-decoration: line-through; color: #999;">${getContractPeriod(itemData)}</span></td>
                  <td style="text-align: center;"><span style="text-decoration: line-through; color: #999;">${item.quantity || 0}${item.unit || '개'}</span></td>
                  <td style="text-align: right;"><span style="text-decoration: line-through; color: #999;">${formatCurrency(itemData.unitPrice || 0)}</span></td>
                  <td style="text-align: right;"><span style="text-decoration: line-through; color: #999;">${formatCurrency(item.amount || 0)}</span></td>
                  <td style="text-align: center;"><span style="text-decoration: line-through; color: #999;">${item.supplier || '-'}</span></td>
                </tr>
                `;
              }).join('');
            }
            return '';
          })()}
        </tbody>
        <tfoot>
          <tr class="total-row">
            <td colspan="6" style="text-align: center; font-weight: bold;">합계</td>
            <td style="text-align: right; font-weight: bold;">${(() => {
              const currentTotal = data.purchaseItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
              
              if (isCorrection && originalPurchaseItems.length > 0) {
                const originalTotal = originalPurchaseItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
                return renderChangedNumber(originalTotal, currentTotal, formatCurrency);
              }
              
              return formatCurrency(currentTotal);
            })()}</td>
            <td style="text-align: center; font-weight: bold;">-</td>
          </tr>
        </tfoot>
      </table>
    `;
  }

  console.log('조건에 맞는 항목이 없어서 기본 메시지 표시');
  console.log('최종 contractType:', contractType);
  console.log('purchaseItems 길이:', data.purchaseItems?.length || 0);
  console.log('serviceItems 길이:', data.serviceItems?.length || 0);
  
  return `
    <div class="section-title">2. 상세 내역</div>
    <div style="text-align: center; padding: 40px; color: #666; border: 1px solid #ddd; border-radius: 4px;">
      상세 내역이 입력되지 않았습니다.
    </div>
  `;
};

// 비용귀속분배 섹션 생성 (ProposalForm 로직 기반)
export const generateCostAllocationSection = (data, originalData = null) => {
  const isCorrection = !!originalData;
  // 구매 품목과 용역 품목의 비용귀속 정보 확인
  // ProposalForm 구조 (costAllocation.allocations)
  const hasPurchaseAllocations = data.purchaseItems?.some(item => 
    (item.costAllocation?.allocations && item.costAllocation.allocations.length > 0) ||
    (item.costAllocations && item.costAllocations.length > 0)
  );
  const hasServiceAllocations = data.serviceItems?.some(item => 
    (item.costAllocation?.allocations && item.costAllocation.allocations.length > 0) ||
    (item.costAllocations && item.costAllocations.length > 0)
  );
  
  // 전체 품의서 레벨의 비용귀속 정보도 확인 (서버 데이터 구조)
  const hasCostDepartments = data.costDepartments && data.costDepartments.length > 0;
  
  const hasAllocations = hasPurchaseAllocations || hasServiceAllocations || hasCostDepartments;

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
  
  // 구매 품목의 분배 정보 수집
  data.purchaseItems?.forEach((item, itemIndex) => {
    // ProposalForm 구조 (costAllocation.allocations)
    let allocations = item.costAllocation?.allocations || [];
    
    // 서버 구조 (costAllocations)
    if (allocations.length === 0 && item.costAllocations) {
      allocations = item.costAllocations.map(alloc => ({
        department: alloc.department,
        type: alloc.type || 'percentage',
        value: alloc.value || alloc.ratio || 0
      }));
    }
    
    allocations.forEach(allocation => {
      const itemAmount = parseFloat(item.amount) || 0;
      const allocValue = parseFloat(allocation.value) || 0;
      
      const allocationAmount = allocation.type === 'percentage' 
        ? (itemAmount * (allocValue / 100))
        : allocValue;
      
      allAllocations.push({
        productName: item.productName || `품목 ${itemIndex + 1}`,
        classification: item.item || '-',
        department: allocation.department || '-',
        type: allocation.type === 'percentage' ? '정률 (%)' : '정액 (원)',
        value: allocation.type === 'percentage' ? allocValue + '%' : formatCurrency(allocValue),
        amount: allocationAmount
      });
    });
  });

  // 용역 품목의 분배 정보 수집
  data.serviceItems?.forEach((item, itemIndex) => {
    // ProposalForm 구조 (costAllocation.allocations)
    let allocations = item.costAllocation?.allocations || [];
    
    // 서버 구조 (costAllocations)
    if (allocations.length === 0 && item.costAllocations) {
      allocations = item.costAllocations.map(alloc => ({
        department: alloc.department,
        type: alloc.type || 'percentage',
        value: alloc.value || alloc.ratio || 0
      }));
    }
    
    allocations.forEach(allocation => {
      const contractAmount = parseFloat(item.contractAmount || item.contract_amount) || 0;
      const allocValue = parseFloat(allocation.value) || 0;
      
      const allocationAmount = allocation.type === 'percentage' 
        ? (contractAmount * (allocValue / 100))
        : allocValue;
      
      allAllocations.push({
        productName: item.item || `용역항목 ${itemIndex + 1}`,
        classification: '전산용역비',
        department: allocation.department || '-',
        type: allocation.type === 'percentage' ? '정률 (%)' : '정액 (원)',
        value: allocation.type === 'percentage' ? allocValue + '%' : formatCurrency(allocValue),
        amount: allocationAmount
      });
    });
  });

  // 전체 품의서 레벨의 비용귀속 정보 추가 (서버 데이터 구조)
  if (data.costDepartments && allAllocations.length === 0) {
    data.costDepartments.forEach((dept, index) => {
      allAllocations.push({
        productName: '전체 품의서',
        classification: '비용귀속',
        department: dept.department || '-',
        type: dept.allocationType === 'percentage' ? '정률 (%)' : '정액 (원)',
        value: dept.allocationType === 'percentage' ? (dept.ratio || 0) + '%' : formatCurrency(dept.amount || 0),
        amount: dept.amount || 0
      });
    });
  }

  if (allAllocations.length === 0) {
    return `
      <div class="section-title">3. 비용귀속분배</div>
      <div style="text-align: center; padding: 20px; color: #666; border: 1px solid #ddd; border-radius: 4px;">
        비용귀속분배 정보가 없습니다.
      </div>
    `;
  }

  // 변경 여부 확인 (간단 비교 - 개수나 전체 내용 비교)
  const hasCostDepartmentsChanged = isCorrection && originalData && 
    (data.costDepartments?.length !== originalData.costDepartments?.length ||
     JSON.stringify(data.costDepartments) !== JSON.stringify(originalData.costDepartments));

  let allocationHTML = `
    <div class="section-title">3. 비용귀속분배</div>
    <table class="items-table">
      <thead>
        <tr>
          <th>번호</th>
          <th>구분</th>
          <th>품목명</th>
          <th>귀속부서</th>
          <th>분배방식</th>
          <th>분배값</th>
          <th>분배금액</th>
        </tr>
      </thead>
      <tbody>
  `;

  // 원본 데이터의 비용귀속분배 정보 수집 (비교용)
  let originalAllocations = [];
  if (isCorrection && originalData) {
    // 원본 구매 품목의 분배 정보
    originalData.purchaseItems?.forEach((item, itemIndex) => {
      let allocations = item.costAllocation?.allocations || [];
      if (allocations.length === 0 && item.costAllocations) {
        allocations = item.costAllocations.map(alloc => ({
          department: alloc.department,
          type: alloc.type || 'percentage',
          value: alloc.value || alloc.ratio || 0
        }));
      }
      allocations.forEach(allocation => {
        const itemAmount = parseFloat(item.amount) || 0;
        const allocValue = parseFloat(allocation.value) || 0;
        const allocationAmount = allocation.type === 'percentage' 
          ? (itemAmount * (allocValue / 100))
          : allocValue;
        originalAllocations.push({
          productName: item.productName || `품목 ${itemIndex + 1}`,
          classification: item.item || '-',
          department: allocation.department || '-',
          type: allocation.type === 'percentage' ? '정률 (%)' : '정액 (원)',
          value: allocation.type === 'percentage' ? allocValue + '%' : formatCurrency(allocValue),
          amount: allocationAmount
        });
      });
    });
    
    // 원본 용역 품목의 분배 정보
    originalData.serviceItems?.forEach((item, itemIndex) => {
      let allocations = item.costAllocation?.allocations || [];
      if (allocations.length === 0 && item.costAllocations) {
        allocations = item.costAllocations.map(alloc => ({
          department: alloc.department,
          type: alloc.type || 'percentage',
          value: alloc.value || alloc.ratio || 0
        }));
      }
      allocations.forEach(allocation => {
        const contractAmount = parseFloat(item.contractAmount || item.contract_amount) || 0;
        const allocValue = parseFloat(allocation.value) || 0;
        const allocationAmount = allocation.type === 'percentage' 
          ? (contractAmount * (allocValue / 100))
          : allocValue;
        originalAllocations.push({
          productName: item.item || `용역항목 ${itemIndex + 1}`,
          classification: '전산용역비',
          department: allocation.department || '-',
          type: allocation.type === 'percentage' ? '정률 (%)' : '정액 (원)',
          value: allocation.type === 'percentage' ? allocValue + '%' : formatCurrency(allocValue),
          amount: allocationAmount
        });
      });
    });
  }

  // 모든 분배 정보를 하나의 테이블에 표시
  let totalAmount = 0;
  allAllocations.forEach((allocation, index) => {
    totalAmount += (parseFloat(allocation.amount) || 0);
    
    const originalAlloc = originalAllocations[index];
    const isRowChanged = isCorrection && originalAlloc && JSON.stringify(allocation) !== JSON.stringify(originalAlloc);
    const isNewRow = isCorrection && !originalAlloc;
    const rowStyle = isNewRow ? 'background-color: #e8f5e9;' : (isRowChanged ? 'background-color: #fff9c4;' : '');
    
    allocationHTML += `
      <tr style="${rowStyle}">
        <td style="text-align: center;">${index + 1}${isNewRow ? ' <span style="color: #4caf50;">●</span>' : ''}</td>
        <td style="text-align: center;">${originalAlloc ? renderChangedValue(originalAlloc.classification, allocation.classification) : allocation.classification}</td>
        <td style="text-align: center;">${originalAlloc ? renderChangedValue(originalAlloc.productName, allocation.productName) : allocation.productName}</td>
        <td style="text-align: center;">${originalAlloc ? renderChangedValue(originalAlloc.department, allocation.department) : allocation.department}</td>
        <td style="text-align: center;">${originalAlloc ? renderChangedValue(originalAlloc.type, allocation.type) : allocation.type}</td>
        <td style="text-align: center;">${originalAlloc ? renderChangedValue(originalAlloc.value, allocation.value) : allocation.value}</td>
        <td style="text-align: right;">${originalAlloc ? renderChangedNumber(originalAlloc.amount, allocation.amount, formatCurrency) : formatCurrency(allocation.amount)}</td>
      </tr>
    `;
  });

  // 삭제된 항목 표시
  if (isCorrection && originalAllocations.length > allAllocations.length) {
    const deletedItems = originalAllocations.slice(allAllocations.length);
    deletedItems.forEach((allocation, index) => {
      allocationHTML += `
        <tr style="background-color: #ffebee; opacity: 0.6;">
          <td style="text-align: center;"><span style="color: #f44336;">✕</span></td>
          <td style="text-align: center;"><span style="text-decoration: line-through; color: #999;">${allocation.classification}</span></td>
          <td style="text-align: center;"><span style="text-decoration: line-through; color: #999;">${allocation.productName}</span></td>
          <td style="text-align: center;"><span style="text-decoration: line-through; color: #999;">${allocation.department}</span></td>
          <td style="text-align: center;"><span style="text-decoration: line-through; color: #999;">${allocation.type}</span></td>
          <td style="text-align: center;"><span style="text-decoration: line-through; color: #999;">${allocation.value}</span></td>
          <td style="text-align: right;"><span style="text-decoration: line-through; color: #999;">${formatCurrency(allocation.amount)}</span></td>
        </tr>
      `;
    });
  }

  // 전체 합계 행
  let originalTotalAmount = 0;
  if (isCorrection && originalAllocations.length > 0) {
    originalTotalAmount = originalAllocations.reduce((sum, alloc) => sum + (parseFloat(alloc.amount) || 0), 0);
  }

  allocationHTML += `
      </tbody>
      <tfoot>
        <tr class="total-row">
          <td colspan="6" style="text-align: center; font-weight: bold;">합계</td>
          <td style="text-align: right; font-weight: bold;">${isCorrection && originalTotalAmount > 0 ? renderChangedNumber(originalTotalAmount, totalAmount, formatCurrency) : formatCurrency(totalAmount)}</td>
        </tr>
      </tfoot>
    </table>
  `;

  return allocationHTML;
};

// 계정과목 섹션 생성
export const generateAccountSubjectSection = (data, originalData = null) => {
  const isCorrection = !!originalData;
  // 용역계약의 경우 간단하게 한 줄로만 표시
  if (data.contractType === 'service' && data.serviceItems?.length > 0) {
    // 변경 여부 확인
    const hasServiceItemsChanged = isCorrection && originalData && 
      JSON.stringify(data.serviceItems) !== JSON.stringify(originalData.serviceItems);
    
    const accountInfoText = '관: 운영비 > 항: 일반운영비 > 목: 전산용역비';
    const originalAccountInfoText = originalData?.contractType === 'service' && originalData?.serviceItems?.length > 0 
      ? '관: 운영비 > 항: 일반운영비 > 목: 전산용역비' 
      : '';
    
    return `
      <div style="margin-top: 30px; page-break-inside: avoid;">
        <div class="section-title">계정과목</div>
        <div style="padding: 15px; border: 1px solid #ddd; border-radius: 4px;">
          <div style="padding: 8px 0;">
            ${isCorrection && originalAccountInfoText ? renderChangedValue(originalAccountInfoText, accountInfoText) : accountInfoText}
          </div>
        </div>
      </div>
    `;
  }
  
  // 구매계약의 경우 기존 방식 유지 (항목별로 표시)
  const accountSubjects = getAccountSubjectGroups(data);
  
  if (accountSubjects.length === 0) {
    return '';
  }

  // 원본 계정과목 그룹 (비교용)
  let originalAccountSubjects = [];
  if (isCorrection && originalData) {
    originalAccountSubjects = getAccountSubjectGroups(originalData);
  }

  // 변경 여부 확인
  const hasPurchaseItemsChanged = isCorrection && originalData && 
    JSON.stringify(data.purchaseItems) !== JSON.stringify(originalData.purchaseItems);

  return `
    <div style="margin-top: 30px; page-break-inside: avoid;">
      <div class="section-title">계정과목</div>
      <div style="padding: 15px; border: 1px solid #ddd; border-radius: 4px;">
        ${accountSubjects.map((account, index) => {
          const originalAccount = originalAccountSubjects[index];
          const isChanged = isCorrection && originalAccount && 
            (account.names !== originalAccount.names || account.accountInfo !== originalAccount.accountInfo);
          const isNew = isCorrection && !originalAccount;
          const bgColor = isNew ? '#e8f5e9' : (isChanged ? '#fff9c4' : 'transparent');
          
          return `
          <div style="margin-bottom: 10px; padding: 8px; border-bottom: 1px solid #eee; background-color: ${bgColor}; border-radius: 4px;">
            ${isNew ? '<span style="color: #4caf50; margin-right: 5px;">●</span>' : ''}
            <strong>품목:</strong> ${originalAccount ? renderChangedValue(originalAccount.names, account.names) : account.names} | 
            <strong>계정:</strong> ${originalAccount ? renderChangedValue(originalAccount.accountInfo, account.accountInfo) : account.accountInfo}
          </div>
        `;
        }).join('')}
        
        ${(() => {
          // 삭제된 항목 표시
          if (isCorrection && originalAccountSubjects.length > accountSubjects.length) {
            const deletedItems = originalAccountSubjects.slice(accountSubjects.length);
            return deletedItems.map((account, index) => `
              <div style="margin-bottom: 10px; padding: 8px; border-bottom: 1px solid #eee; background-color: #ffebee; border-radius: 4px; opacity: 0.6;">
                <span style="color: #f44336; margin-right: 5px;">✕</span>
                <strong>품목 (삭제됨):</strong> <span style="text-decoration: line-through; color: #999;">${account.names}</span> | 
                <strong>계정:</strong> <span style="text-decoration: line-through; color: #999;">${account.accountInfo}</span>
              </div>
            `).join('');
          }
          return '';
        })()}
      </div>
    </div>
  `;
};

// 요청부서 배열을 문자열로 변환
const formatDepartments = (requestDepartments) => {
  if (!requestDepartments) return '-';
  
  if (Array.isArray(requestDepartments)) {
    return requestDepartments.map(dept => 
      typeof dept === 'string' ? dept : dept.name || dept.department || dept
    ).join(', ');
  }
  
  if (typeof requestDepartments === 'string') {
    return requestDepartments;
  }
  
  return '-';
};

// 예산 정보를 문자열로 변환
const formatBudgetInfo = (budgetInfo, businessBudget, budgetName, budgetYear) => {
  const name = budgetInfo?.projectName || businessBudget?.project_name || budgetName || '';
  const year = budgetInfo?.budgetYear || businessBudget?.budget_year || budgetYear || '';
  
  if (!name && !year) return '-';
  
  if (year) {
    return `${name} (${year}년)`;
  }
  return name;
};

// 총액 계산
export const calculateTotalAmount = (data) => {
  let totalAmount = 0;
  
  // 구매 품목 총액 계산
  if (data.purchaseItems && Array.isArray(data.purchaseItems)) {
    totalAmount += data.purchaseItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  }
  
  // 용역 품목 총액 계산
  if (data.serviceItems && Array.isArray(data.serviceItems)) {
    // ProposalForm 구조 (contractAmount)
    let serviceTotal = data.serviceItems.reduce((sum, item) => sum + (parseFloat(item.contractAmount || item.contract_amount) || 0), 0);
    
    // 서버 구조 (unitPrice * quantity 또는 monthlyRate * period)
    if (serviceTotal === 0) {
      serviceTotal = data.serviceItems.reduce((sum, item) => {
        const amount = parseFloat(item.unitPrice || item.unit_price) * parseFloat(item.quantity) || 
                     parseFloat(item.monthlyRate || item.monthly_rate) * parseFloat(item.period) || 0;
        return sum + amount;
      }, 0);
    }
    
    totalAmount += serviceTotal;
  }
  
  // 전체 품의서 총액이 있는 경우 (서버 데이터)
  if (totalAmount === 0 && (data.totalAmount || data.total_amount)) {
    totalAmount = parseFloat(data.totalAmount || data.total_amount) || 0;
  }
  
  return totalAmount;
};

// 메인 미리보기 HTML 생성 함수 (ProposalForm 스타일 기반)
export const generatePreviewHTML = (data, options = {}) => {
  console.log('=== generatePreviewHTML 옵션 확인 ===');
  console.log('options:', options);
  console.log('showRecycleButton:', options.showRecycleButton);
  console.log('showStatusButton:', options.showStatusButton);
  console.log('contractId:', options.contractId);
  console.log('originalData:', options.originalData);
  
  const totalAmount = calculateTotalAmount(data);
  const currentDate = new Date().toLocaleDateString('ko-KR');
  const contractId = options.contractId || data.id;
  const originalData = options.originalData; // 원본 데이터 (정정 모드용)
  const isCorrection = !!originalData; // 정정 품의서 여부
  
  return `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>📋 품의서 미리보기 - ${data.title || data.purpose || '품의서'}</title>
      <script src="/js/html2canvas.min.js"></script>
      <style>
        body {
          font-family: 'Malgun Gothic', sans-serif;
          font-size: 12pt;
          line-height: 1.6;
          margin: 0;
          padding: 20px;
          background-color: #f5f5f5;
          font-weight: bold !important; /* 모든 폰트에 볼드 강제 */
        }
        .preview-container {
          max-width: 880px;
          margin: 0 auto;
          background: white;
          padding: 40px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          border-radius: 8px;
        }
        .info-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
          font-weight: bold; /* 테이블도 볼드 */
        }
        .info-table th, .info-table td {
          border: 1px solid #ddd;
          padding: 14px;
          white-space: pre-wrap; /* 줄바꿈 보존 */
          word-wrap: break-word; /* 긴 단어 자동 줄바꿈 */
        }
        .info-table th {
          background-color: #f8f9fa;
          font-weight: 800; /* 헤더는 더 굵게 */
          width: 150px;
          text-align: center;
        }
        .info-table td {
          text-align: left;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
          font-size: 11pt;
        }
        .items-table th, .items-table td {
          border: 1px solid #ddd;
          padding: 8px 6px;
          text-align: left;
          white-space: pre-wrap; /* 줄바꿈 보존 */
          word-wrap: break-word; /* 긴 단어 자동 줄바꿈 */
          vertical-align: middle;
        }
        .items-table th {
          background-color: #f8f9fa;
          font-weight: bold;
          text-align: center;
        }
        /* 정정 품의서 스타일 */
        .items-table tr[style*="background-color: #fff9c4"] {
          border-left: 3px solid #ff9800;
        }
        .items-table tr[style*="background-color: #e8f5e9"] {
          border-left: 3px solid #4caf50;
        }
        .total-row {
          background-color: #f8f9fa;
          font-weight: bold;
        }
        .section-title {
          font-size: 14pt;
          font-weight: bold;
          margin: 20px 0 10px 0;
          color: #333;
          border-bottom: 1px solid #ddd;
          padding-bottom: 5px;
        }
        .action-buttons {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 1000;
          display: flex;
          gap: 10px;
        }
        .action-btn {
          background: #6c757d;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 5px;
          cursor: pointer;
          font-size: 12pt;
          min-width: 100px;
          transition: all 0.3s ease;
        }
        .action-btn:hover {
          transform: translateY(-2px);
        }
        .copy-btn {
          background: #17a2b8;
        }
        .copy-btn:hover {
          background: #138496;
        }
        .recycle-btn {
          background: #28a745;
        }
        .recycle-btn:hover {
          background: #218838;
        }
        .status-btn {
          background: #667eea;
        }
        .status-btn:hover {
          background: #5a67d8;
        }
        .correction-btn {
          background: #FF5722;
        }
        .correction-btn:hover {
          background: #E64A19;
        }
        .original-btn {
          background: #9C27B0;
        }
        .original-btn:hover {
          background: #7B1FA2;
        }
        .corrected-btn {
          background: #FF9800;
        }
        .corrected-btn:hover {
          background: #F57C00;
        }
        @media print {
          .action-buttons { display: none; }
          body { 
            background: white; 
            font-weight: bold !important;
          }
          .preview-container { 
            box-shadow: none; 
            padding: 20px;
            max-width: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="action-buttons">
        ${options.showCorrectionButton ? `<button class="action-btn correction-btn" onclick="handleCorrection()">📝 정정</button>` : ''}
        ${options.showRecycleButton ? `<button class="action-btn recycle-btn" onclick="handleRecycle()">♻️ 재활용</button>` : ''}
        ${options.showStatusButton ? `<button class="action-btn status-btn" onclick="handleStatusChange()">🔄 상태변경</button>` : ''}
        ${options.originalProposalId ? `<button class="action-btn original-btn" onclick="handleViewOriginal()">📄 원본 품의서 보기</button>` : ''}
        ${options.correctedProposalId ? `<button class="action-btn corrected-btn" onclick="handleViewCorrected()">📝 정정 품의서 보기</button>` : ''}
        <button class="action-btn copy-btn" onclick="copyToClipboard()">📋 이미지 복사</button>
        <button class="action-btn copy-btn" onclick="copyHTMLToClipboard()" style="background: #17a2b8;">💾 HTML 복사</button>
      </div>
      
      <div class="preview-container">
        <div class="section-title">1. 기본 정보</div>
        <table class="info-table">
          <tbody>
            <tr>
              <th>목적</th>
              <td>${isCorrection ? renderChangedValue(originalData.purpose, data.purpose) : (data.purpose || '-')}</td>
            </tr>
            <tr>
              <th>계약 근거</th>
              <td>${isCorrection ? renderChangedValue(originalData.basis, data.basis) : (data.basis || '-')}</td>
            </tr>
            <tr>
              <th>사업 예산</th>
              <td>${isCorrection ? (() => {
                const currentBudget = formatBudgetInfo(data.budgetInfo, data.businessBudget, data.budgetName, data.budgetYear);
                const originalBudget = formatBudgetInfo(originalData.budgetInfo, originalData.businessBudget, originalData.budgetName, originalData.budgetYear);
                return renderChangedValue(originalBudget, currentBudget);
              })() : formatBudgetInfo(data.budgetInfo, data.businessBudget, data.budgetName, data.budgetYear)}</td>
            </tr>
            <tr>
              <th>요청부서</th>
              <td>${isCorrection ? (() => {
                const currentDepts = formatDepartments(data.requestDepartments);
                const originalDepts = formatDepartments(originalData.requestDepartments);
                return renderChangedValue(originalDepts, currentDepts);
              })() : formatDepartments(data.requestDepartments)}</td>
            </tr>
            <tr>
              <th>계약 방식</th>
              <td>${isCorrection ? (() => {
                const currentMethod = getContractMethodName(data.contractMethod || data.contract_method);
                const originalMethod = getContractMethodName(originalData.contractMethod || originalData.contract_method);
                const currentDescription = data.contractMethodDescription || data.contract_method_description || '';
                const originalDescription = originalData.contractMethodDescription || originalData.contract_method_description || '';
                
                let html = `<div style="font-weight: 600;">${renderChangedValue(originalMethod, currentMethod)}</div>`;
                
                // 설명이 있으면 표시 (변경 여부와 관계없이)
                if (currentDescription || originalDescription) {
                  if (currentDescription !== originalDescription) {
                    html += `<div style="font-size: 0.85em; color: #666; line-height: 1.3; margin-top: 2px;">${renderChangedValue(originalDescription, currentDescription)}</div>`;
                  } else if (currentDescription) {
                    html += `<div style="font-size: 0.85em; color: #666; line-height: 1.3; margin-top: 2px;">${currentDescription}</div>`;
                  }
                }
                
                return html;
              })() : `<div style="font-weight: 600; margin-bottom: 2px;">${getContractMethodName(data.contractMethod || data.contract_method)}</div>${data.contractMethodDescription || data.contract_method_description ? `<div style="font-size: 0.85em; color: #666; line-height: 1.3; margin-top: 2px;">${data.contractMethodDescription || data.contract_method_description}</div>` : ''}`}</td>
            </tr>
            ${data.contractType !== 'freeform' ? `
            <tr>
              <th>총 계약금액</th>
              <td>${isCorrection ? (() => {
                const originalTotal = calculateTotalAmount(originalData);
                return `<span style="font-weight: bold;">${renderChangedNumber(originalTotal, totalAmount, formatCurrency)}</span> (VAT 포함)`;
              })() : `<span style="font-weight: bold;">${formatCurrency(totalAmount)}</span> (VAT 포함)`}</td>
            </tr>
            ` : ''}
            ${(data.other && data.other.trim()) || (isCorrection && originalData?.other && originalData.other.trim()) ? `
            <tr>
              <th>기타</th>
              <td>${isCorrection ? renderChangedValue(originalData.other, data.other) : data.other}</td>
            </tr>
            ` : ''}
            ${(data.correctionReason || data.correction_reason) ? `
            <tr>
              <th style="background-color: #fff9f9; color: #d32f2f; font-weight: bold;">정정 사유</th>
              <td style="background-color: #fff9f9; color: #d32f2f; font-weight: bold; white-space: pre-wrap;">${data.correctionReason || data.correction_reason}</td>
            </tr>
            ` : ''}
          </tbody>
        </table>
        
        ${generateItemsSection(data, originalData)}
        
        ${generateCostAllocationSection(data, originalData)}
        ${generateAccountSubjectSection(data, originalData)}
      </div>

      <script>
        async function copyToClipboard() {
          try {
            // 버튼들을 임시로 숨김
            const buttons = document.querySelector('.action-buttons');
            buttons.style.display = 'none';
            
            // 캡처할 컨테이너 선택
            const container = document.querySelector('.preview-container');
            
            // 캡처 실행 (컨테이너만)
            const canvas = await html2canvas(container, {
              useCORS: true,
              allowTaint: true,
              scale: 2, // 고화질을 위해 2배 스케일
              scrollX: 0,
              scrollY: -window.scrollY,
              backgroundColor: '#ffffff'
            });
            
            // 버튼들을 다시 표시
            buttons.style.display = 'flex';
            
            // Canvas를 Blob으로 변환하여 클립보드에 복사
            canvas.toBlob(async (blob) => {
              try {
                // 클립보드 API를 사용하여 이미지 복사
                const item = new ClipboardItem({ 'image/png': blob });
                await navigator.clipboard.write([item]);
                alert('이미지가 클립보드에 복사되었습니다!');
              } catch (clipboardError) {
                console.error('클립보드 복사 실패:', clipboardError);
                // 클립보드 API가 지원되지 않는 경우 대안 제공
                alert('클립보드 복사를 지원하지 않는 브라우저입니다.\\n\\n대신 이미지를 다운로드합니다.');
                
                // 대안: 이미지 다운로드
                const link = document.createElement('a');
                link.download = '품의서_미리보기_' + new Date().toISOString().slice(0,10) + '.png';
                link.href = canvas.toDataURL('image/png');
                link.click();
              }
            }, 'image/png');
          } catch (error) {
            console.error('이미지 생성 중 오류 발생:', error);
            alert('이미지 생성 중 오류가 발생했습니다: ' + error.message);
            
            // 오류 발생 시에도 버튼들을 다시 표시
            const buttons = document.querySelector('.action-buttons');
            if (buttons) buttons.style.display = 'flex';
          }
        }

        // HTML 코드 복사 함수
        async function copyHTMLToClipboard() {
          try {
            // preview-container의 HTML 가져오기
            const container = document.querySelector('.preview-container');
            const styles = document.querySelector('style').outerHTML;
            
            // 전체 HTML 구성 (스타일 포함)
            const fullHTML = \`<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>품의서 미리보기</title>
  \${styles}
</head>
<body>
  \${container.outerHTML}
</body>
</html>\`;
            
            // 클립보드에 복사
            await navigator.clipboard.writeText(fullHTML);
            alert('HTML 코드가 클립보드에 복사되었습니다!');
          } catch (error) {
            console.error('HTML 복사 실패:', error);
            alert('HTML 복사에 실패했습니다: ' + error.message);
          }
        }

        // 정정 버튼 클릭 함수
        function handleCorrection() {
          if (window.opener && window.opener.handleCorrectProposal) {
            const contractId = '${contractId || ''}';
            if (contractId) {
              if (confirm('이 품의서를 정정하시겠습니까?\\n정정 모드로 이동합니다.')) {
                window.opener.handleCorrectProposal({ id: contractId });
                window.close();
              }
            } else {
              alert('품의서 ID를 찾을 수 없습니다.');
            }
          } else {
            alert('정정 기능을 사용할 수 없습니다. 품의서 목록에서 다시 시도해주세요.');
          }
        }

        // 재활용 버튼 클릭 함수
        function handleRecycle() {
          if (window.opener && window.opener.handleRecycleProposal) {
            const contractId = '${contractId || ''}';
            if (contractId) {
              if (confirm('이 품의서를 재활용하시겠습니까?\\n새 품의서 작성 화면으로 이동합니다.')) {
                window.opener.handleRecycleProposal({ id: contractId });
                window.close();
              }
            } else {
              alert('품의서 ID를 찾을 수 없습니다.');
            }
          } else {
            alert('재활용 기능을 사용할 수 없습니다. 품의서 목록에서 다시 시도해주세요.');
          }
        }

        // 상태변경 버튼 클릭 함수
        function handleStatusChange() {
          if (window.opener && window.opener.handleChangeStatus) {
            const contractId = '${contractId || ''}';
            if (contractId) {
              window.opener.handleChangeStatus({ id: contractId });
              window.close();
            } else {
              alert('품의서 ID를 찾을 수 없습니다.');
            }
          } else {
            alert('상태변경 기능을 사용할 수 없습니다. 품의서 목록에서 다시 시도해주세요.');
          }
        }

        // 원본 품의서 보기 버튼 클릭 함수
        function handleViewOriginal() {
          if (window.opener && window.opener.handleViewProposal) {
            const originalId = '${options.originalProposalId || ''}';
            if (originalId) {
              window.opener.handleViewProposal({ id: originalId });
              window.close();
            } else {
              alert('원본 품의서 ID를 찾을 수 없습니다.');
            }
          } else {
            alert('원본 품의서 보기 기능을 사용할 수 없습니다. 품의서 목록에서 다시 시도해주세요.');
          }
        }

        // 정정 품의서 보기 버튼 클릭 함수
        function handleViewCorrected() {
          if (window.opener && window.opener.handleViewProposal) {
            const correctedId = '${options.correctedProposalId || ''}';
            if (correctedId) {
              window.opener.handleViewProposal({ id: correctedId });
              window.close();
            } else {
              alert('정정 품의서 ID를 찾을 수 없습니다.');
            }
          } else {
            alert('정정 품의서 보기 기능을 사용할 수 없습니다. 품의서 목록에서 다시 시도해주세요.');
          }
        }
      </script>
    </body>
    </html>
  `;
}; 