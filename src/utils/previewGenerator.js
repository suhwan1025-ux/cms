// 미리보기 HTML 생성 공통 유틸리티 (ProposalForm 로직 기반으로 개선)

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
      항: '유형자산',
      목: '전산기구비품',
      절: '전산기구비품'
    },
    '전산기구비품': {
      관: '고정자산',
      항: '유형자산',
      목: '전산기구비품',
      절: '전산기구비품'
    },
    '전산용역비': {
      관: '운영비',
      항: '일반운영비',
      목: '전산용역비',
      절: null
    },
    '기타': {
      관: '운영비',
      항: '일반운영비',
      목: '기타운영비',
      절: null
    }
  };
  
  return accountMap[category] || accountMap['기타'];
};

// 계정과목 그룹 정보 생성
export const getAccountSubjectGroups = (data) => {
  const groups = [];
  
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
          
          groups.push({
            name: item.productName,
            accountInfo: accountInfo
          });
        }
      }
    });
  }

  // 용역계약의 경우
  if (data.contractType === 'service' && data.serviceItems?.length > 0) {
    data.serviceItems.forEach(item => {
      if (item.item) {
        const accountSubject = getAccountSubjectByCategory('전산용역비');
        
        if (accountSubject) {
          let accountInfo = `관: ${accountSubject.관} > 항: ${accountSubject.항} > 목: ${accountSubject.목}`;
          if (accountSubject.절) {
            accountInfo += ` > 절: ${accountSubject.절}`;
          }
          
          groups.push({
            name: item.item,
            accountInfo: accountInfo
          });
        }
      }
    });
  }

  return groups;
};

// 품목 섹션 생성 (ProposalForm 로직 기반)
export const generateItemsSection = (data) => {
  console.log('=== generateItemsSection 디버깅 ===');
  
  // 서버 데이터와 클라이언트 데이터 모두 지원
  const contractType = data.contractType || data.contract_type;
  console.log('contractType:', contractType, '(원본:', data.contractType, ', 서버:', data.contract_type, ')');
  console.log('purchaseItems:', data.purchaseItems);
  console.log('serviceItems:', data.serviceItems);
  
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
            // ProposalForm 구조와 서버 구조 모두 지원
            const contractAmount = item.contractAmount || item.contract_amount ||
                                 (parseFloat(item.monthlyRate || item.monthly_rate) * parseFloat(item.period)) || 
                                 (parseFloat(item.unitPrice || item.unit_price) * parseFloat(item.quantity)) || 0;
            
            const paymentMethodMap = {
              'monthly': '월별',
              'quarterly': '분기별',
              'lump': '일시'
            };
            const paymentMethod = item.paymentMethod || item.payment_method;
            const paymentMethodText = paymentMethodMap[paymentMethod] || paymentMethod || '-';
            
            const contractPeriodStart = item.contractPeriodStart || item.contract_period_start;
            const contractPeriodEnd = item.contractPeriodEnd || item.contract_period_end;
            
            // 계약기간 포맷팅 (시작일 ~ 종료일)
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
            
            const skillLevel = item.skillLevel || item.skill_level;
            
            // 기간 포맷팅 (소수점 있으면 표시, 없으면 정수로 표시)
            const period = parseFloat(item.period || 0);
            const periodText = period % 1 === 0 ? period.toString() : period.toFixed(2);
            
            return `
            <tr>
              <td style="text-align: center;">${index + 1}</td>
              <td style="text-align: center;">${item.item || '-'}</td>
              <td style="text-align: center;">${item.name || item.personnel || '-'}</td>
              <td style="text-align: center;">${getSkillLevelKorean(skillLevel)}</td>
              <td style="text-align: center;">${periodText}개월</td>
              <td style="text-align: right;">${formatCurrency(item.monthlyRate || item.monthly_rate || item.unitPrice || item.unit_price || 0)}</td>
              <td style="text-align: right; font-weight: bold;">${formatCurrency(contractAmount)}</td>
              <td style="text-align: center;">${item.supplier || '-'}</td>
              <td style="text-align: center;">${item.creditRating || item.credit_rating || '-'}</td>
              <td style="text-align: center; font-size: 0.85em; line-height: 1.3;">${contractPeriodText}</td>
              <td style="text-align: center;">${paymentMethodText}</td>
            </tr>
            `;
          }).join('')}
        </tbody>
        <tfoot>
          <tr class="total-row">
            <td colspan="6" style="text-align: center; font-weight: bold;">합계</td>
            <td style="text-align: right; font-weight: bold;">${formatCurrency(data.serviceItems.reduce((sum, item) => {
              const contractAmount = item.contractAmount || item.contract_amount ||
                                   (parseFloat(item.monthlyRate || item.monthly_rate) * parseFloat(item.period)) || 
                                   (parseFloat(item.unitPrice || item.unit_price) * parseFloat(item.quantity)) || 0;
              return sum + contractAmount;
            }, 0))}</td>
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
            // 서버 데이터 필드명도 지원
            const itemData = {
              ...item,
              productName: item.productName || item.product_name,
              contractStartDate: item.contractStartDate || item.contract_start_date,
              contractEndDate: item.contractEndDate || item.contract_end_date,
              contractPeriodType: item.contractPeriodType || item.contract_period_type,
              unitPrice: item.unitPrice || item.unit_price
            };
            
            return `
            <tr>
              <td>${index + 1}</td>
              <td>${item.item || '-'}</td>
              <td>${itemData.productName || '-'}</td>
              <td>${getContractPeriod(itemData)}</td>
              <td>${item.quantity || 0}${item.unit || '개'}</td>
              <td>${formatCurrency(itemData.unitPrice || 0)}</td>
              <td style="font-weight: bold;">${formatCurrency(item.amount || 0)}</td>
              <td>${item.supplier || '-'}</td>
            </tr>
            `;
          }).join('')}
        </tbody>
        <tfoot>
          <tr class="total-row">
            <td colspan="6" style="text-align: center; font-weight: bold;">합계</td>
            <td style="text-align: right; font-weight: bold;">${formatCurrency(data.purchaseItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0))}</td>
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
export const generateCostAllocationSection = (data) => {
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
      const allocationAmount = allocation.type === 'percentage' 
        ? (item.amount * (allocation.value / 100))
        : allocation.value;
      
      allAllocations.push({
        productName: item.productName || `품목 ${itemIndex + 1}`,
        classification: item.item || '-',
        department: allocation.department || '-',
        type: allocation.type === 'percentage' ? '정률 (%)' : '정액 (원)',
        value: allocation.type === 'percentage' ? allocation.value + '%' : formatCurrency(allocation.value),
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
      const allocationAmount = allocation.type === 'percentage' 
        ? (item.contractAmount * (allocation.value / 100))
        : allocation.value;
      
      allAllocations.push({
        productName: item.item || `용역항목 ${itemIndex + 1}`,
        classification: '전산용역비',
        department: allocation.department || '-',
        type: allocation.type === 'percentage' ? '정률 (%)' : '정액 (원)',
        value: allocation.type === 'percentage' ? allocation.value + '%' : formatCurrency(allocation.value),
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

  // 모든 분배 정보를 하나의 테이블에 표시
  let totalAmount = 0;
  allAllocations.forEach((allocation, index) => {
    totalAmount += allocation.amount;
    allocationHTML += `
      <tr>
        <td style="text-align: center;">${index + 1}</td>
        <td style="text-align: center;">${allocation.classification}</td>
        <td style="text-align: center;">${allocation.productName}</td>
        <td style="text-align: center;">${allocation.department}</td>
        <td style="text-align: center;">${allocation.type}</td>
        <td style="text-align: center;">${allocation.value}</td>
        <td style="text-align: right; font-weight: bold;">${formatCurrency(allocation.amount)}</td>
      </tr>
    `;
  });

  // 전체 합계 행
  allocationHTML += `
      </tbody>
      <tfoot>
        <tr class="total-row">
          <td colspan="6" style="text-align: center; font-weight: bold;">합계</td>
          <td style="text-align: right; font-weight: bold;">${formatCurrency(totalAmount)}</td>
        </tr>
      </tfoot>
    </table>
  `;

  return allocationHTML;
};

// 계정과목 섹션 생성
export const generateAccountSubjectSection = (data) => {
  // 용역계약의 경우 간단하게 한 줄로만 표시
  if (data.contractType === 'service' && data.serviceItems?.length > 0) {
    return `
      <div style="margin-top: 30px; page-break-inside: avoid;">
        <div class="section-title">계정과목</div>
        <div style="padding: 15px; border: 1px solid #ddd; border-radius: 4px;">
          <div style="padding: 8px 0;">
            관: 운영비 > 항: 일반운영비 > 목: 전산용역비
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
  
  const totalAmount = calculateTotalAmount(data);
  const currentDate = new Date().toLocaleDateString('ko-KR');
  const contractId = options.contractId || data.id;
  
  return `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>📋 품의서 미리보기 - ${data.title || data.purpose || '품의서'}</title>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
      <style>
        body {
          font-family: 'Malgun Gothic', sans-serif;
          font-size: 10pt;
          line-height: 1.6;
          margin: 0;
          padding: 20px;
          background-color: #f5f5f5;
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
        }
        .info-table th, .info-table td {
          border: 1px solid #ddd;
          padding: 12px;
          text-align: left;
          white-space: pre-wrap; /* 줄바꿈 보존 */
          word-wrap: break-word; /* 긴 단어 자동 줄바꿈 */
        }
        .info-table th {
          background-color: #f8f9fa;
          font-weight: bold;
          width: 150px;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
          font-size: 9pt;
        }
        .items-table th, .items-table td {
          border: 1px solid #ddd;
          padding: 6px 4px;
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
        .total-row {
          background-color: #f8f9fa;
          font-weight: bold;
        }
        .section-title {
          font-size: 12pt;
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
          font-size: 10pt;
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
        @media print {
          .action-buttons { display: none; }
          body { background: white; }
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
        <button class="action-btn copy-btn" onclick="copyToClipboard()">📋 복사</button>
      </div>
      
      <div class="preview-container">
        <div class="section-title">1. 기본 정보</div>
        <table class="info-table">
          <tbody>
            <tr>
              <th>사업 목적</th>
              <td>${data.purpose || '-'}</td>
            </tr>
            <tr>
              <th>계약 근거</th>
              <td>${data.basis || '-'}</td>
            </tr>
            <tr>
              <th>사업 예산</th>
              <td>${(() => {
                // 사업예산 이름 (budgetInfo 우선)
                const budgetName = data.budgetInfo?.projectName || 
                                  data.businessBudget?.project_name || 
                                  data.budgetName || 
                                  data.budget_name || 
                                  (typeof data.budget === 'string' ? data.budget : '') || '';
                
                // 사업예산 연도 (budgetInfo 우선)
                const budgetYear = data.budgetInfo?.budgetYear || 
                                  data.businessBudget?.budget_year || 
                                  data.budgetYear || 
                                  data.budget_year || '';
                
                if (!budgetName && !budgetYear) return '-';
                
                // 연도가 있으면 함께 표시
                if (budgetYear) {
                  return `${budgetName} (${budgetYear}년)`;
                }
                
                return budgetName;
              })()}</td>
            </tr>
            <tr>
              <th>요청부서</th>
              <td>${(() => {
                // ProposalForm 구조 (배열)
                if (data.requestDepartments && Array.isArray(data.requestDepartments)) {
                  return data.requestDepartments.map(dept => 
                    typeof dept === 'string' ? dept : dept.name || dept.department || dept
                  ).join(', ');
                }
                // 서버 구조 (관계 테이블)
                if (data.requestDepartments && data.requestDepartments.length > 0) {
                  return data.requestDepartments.map(dept => dept.department || dept.name || dept).join(', ');
                }
                // 단일 문자열
                if (typeof data.requestDepartments === 'string') {
                  return data.requestDepartments;
                }
                return '-';
              })()}</td>
            </tr>
            <tr>
              <th>계약 방식</th>
              <td><div style="font-weight: 600; margin-bottom: 2px;">${getContractMethodName(data.contractMethod || data.contract_method)}</div>${data.contractMethodDescription || data.contract_method_description ? `<div style="font-size: 0.85em; color: #666; line-height: 1.3; margin-top: 2px;">${data.contractMethodDescription || data.contract_method_description}</div>` : ''}</td>
            </tr>
            ${data.contractType !== 'freeform' ? `
            <tr>
              <th>총 계약금액</th>
              <td style="font-weight: bold;">${formatCurrency(totalAmount)} (VAT 포함)</td>
            </tr>
            ` : ''}
            ${data.other && data.other.trim() ? `
            <tr>
              <th>기타</th>
              <td>${data.other}</td>
            </tr>
            ` : ''}
          </tbody>
        </table>
        
        ${generateItemsSection(data)}
        
        ${generateCostAllocationSection(data)}
        ${generateAccountSubjectSection(data)}
      </div>

      <script>
        async function copyToClipboard() {
          try {
            // 버튼들을 임시로 숨김
            const buttons = document.querySelector('.action-buttons');
            buttons.style.display = 'none';
            
            // 캡처 실행
            const canvas = await html2canvas(document.body, {
              useCORS: true,
              allowTaint: true,
              scale: 2, // 고화질을 위해 2배 스케일
              scrollX: 0,
              scrollY: 0,
              width: window.innerWidth,
              height: document.body.scrollHeight,
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
      </script>
    </body>
    </html>
  `;
}; 