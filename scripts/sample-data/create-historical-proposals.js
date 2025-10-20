const { Sequelize, DataTypes } = require('sequelize');
const config = require('../../config/database.js').development;

const sequelize = new Sequelize(config.database, config.username, config.password, config);

async function createHistoricalProposals() {
  try {
    console.log('📅 2024년 8월 ~ 2025년 9월 결재완료 품의서 생성 시작...');
    
    // 1. 사업예산 목록 확인
    console.log('\n1. 사업예산 목록 확인...');
    
    const budgets = await sequelize.query(`
      SELECT id, project_name, budget_amount, budget_year
      FROM business_budgets 
      WHERE budget_year IN (2024, 2025)
      ORDER BY budget_year, project_name
    `, { type: Sequelize.QueryTypes.SELECT });
    
    console.log(`\n총 ${budgets.length}개의 사업예산:`);
    budgets.forEach((budget, index) => {
      console.log(`${index + 1}. ${budget.project_name} (${budget.budget_year}년, ID: ${budget.id})`);
    });
    
    // 2. 공급업체 목록 가져오기
    const suppliers = await sequelize.query(`
      SELECT id, name, business_number, credit_rating
      FROM suppliers
      ORDER BY name
    `, { type: Sequelize.QueryTypes.SELECT });
    
    console.log(`\n사용 가능한 공급업체: ${suppliers.length}개`);
    
    // 3. 시간대별 품의서 생성
    console.log('\n2. 시간대별 품의서 생성...');
    
    const contractTypes = ['purchase', 'service', 'bidding'];
    const departments = ['IT개발팀', 'IT운영팀', '기획팀', '재무팀', '인사팀', '마케팅팀', '영업팀', '고객지원팀'];
    const creators = ['김과장', '이대리', '박주임', '최팀장', '정부장', '강차장', '송과장', '한대리', '조주임', '윤팀장', '임과장', '서대리'];
    
    let totalCreated = 0;
    
    // 2024년 8월부터 2025년 9월까지 월별로 품의서 생성
    const startDate = new Date(2024, 7, 1); // 2024년 8월
    const endDate = new Date(2025, 8, 30);  // 2025년 9월
    
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      
      console.log(`\n=== ${year}년 ${month}월 품의서 생성 ===`);
      
      // 해당 연도의 예산만 필터링
      const yearBudgets = budgets.filter(b => b.budget_year === year);
      
      if (yearBudgets.length === 0) {
        console.log(`${year}년 예산이 없습니다.`);
        currentDate.setMonth(currentDate.getMonth() + 1);
        continue;
      }
      
      // 월별로 2-5개의 품의서 생성
      const monthlyCount = Math.floor(Math.random() * 4) + 2; // 2-5개
      
      for (let i = 0; i < monthlyCount; i++) {
        const budget = yearBudgets[Math.floor(Math.random() * yearBudgets.length)];
        const contractType = contractTypes[Math.floor(Math.random() * contractTypes.length)];
        const creator = creators[Math.floor(Math.random() * creators.length)];
        const department = departments[Math.floor(Math.random() * departments.length)];
        const supplier = suppliers[Math.floor(Math.random() * suppliers.length)];
        
        // 해당 월의 랜덤한 날짜 생성
        const proposalDay = Math.floor(Math.random() * 28) + 1;
        const proposalDate = new Date(year, month - 1, proposalDay);
        const approvalDate = new Date(proposalDate.getTime() + (Math.floor(Math.random() * 7) + 1) * 24 * 60 * 60 * 1000);
        const contractStartDate = new Date(approvalDate.getTime() + (Math.floor(Math.random() * 30) + 1) * 24 * 60 * 60 * 1000);
        const contractEndDate = new Date(contractStartDate.getTime() + (Math.floor(Math.random() * 365) + 30) * 24 * 60 * 60 * 1000);
        
        // 품의서 데이터 생성
        const proposalData = generateHistoricalProposalData(budget, contractType, proposalDate, approvalDate, contractStartDate, contractEndDate);
        
        // 품의서 생성
        const proposalResult = await sequelize.query(`
          INSERT INTO proposals (
            contract_type, purpose, basis, budget_id, contract_method, account_subject,
            total_amount, contract_start_date, contract_end_date, status, created_by,
            proposal_date, approval_date, created_at, updated_at
          ) VALUES (
            '${contractType}',
            '${proposalData.purpose}',
            '${proposalData.basis}',
            ${budget.id},
            '${proposalData.contractMethod}',
            '${proposalData.accountSubject}',
            ${proposalData.totalAmount},
            '${proposalData.contractStartDate}',
            '${proposalData.contractEndDate}',
            'approved',
            '${creator}',
            '${proposalData.proposalDate}',
            '${proposalData.approvalDate}',
            '${proposalData.proposalDate}',
            '${proposalData.approvalDate}'
          ) RETURNING id
        `, { type: Sequelize.QueryTypes.INSERT });
        
        const proposalId = proposalResult[0][0].id;
        
        // 계약 유형에 따라 품목 생성
        if (contractType === 'purchase' || contractType === 'bidding') {
          // 구매품목 생성
          const items = proposalData.purchaseItems;
          for (const item of items) {
            await sequelize.query(`
              INSERT INTO purchase_items (
                proposal_id, item, product_name, quantity, unit_price, amount,
                supplier_id, supplier, contract_period_type, contract_start_date, contract_end_date,
                created_at, updated_at
              ) VALUES (
                ${proposalId},
                '${item.item}',
                '${item.productName}',
                ${item.quantity},
                ${item.unitPrice},
                ${item.amount},
                ${supplier.id},
                '${supplier.name}',
                '${item.contractPeriodType}',
                '${proposalData.contractStartDate}',
                '${proposalData.contractEndDate}',
                '${proposalData.proposalDate}',
                '${proposalData.approvalDate}'
              )
            `);
          }
        } else if (contractType === 'service') {
          // 용역항목 생성
          const items = proposalData.serviceItems;
          for (const item of items) {
            await sequelize.query(`
              INSERT INTO service_items (
                proposal_id, item, personnel, skill_level, period, monthly_rate,
                contract_amount, supplier_id, supplier, credit_rating,
                created_at, updated_at
              ) VALUES (
                ${proposalId},
                '${item.item}',
                ${item.personnel},
                '${item.skillLevel}',
                ${item.period},
                ${item.monthlyRate},
                ${item.contractAmount},
                ${supplier.id},
                '${supplier.name}',
                '${supplier.credit_rating}',
                '${proposalData.proposalDate}',
                '${proposalData.approvalDate}'
              )
            `);
          }
        }
        
        // 비용귀속부서 생성
        await sequelize.query(`
          INSERT INTO cost_departments (
            proposal_id, department, amount, created_at, updated_at
          ) VALUES (
            ${proposalId},
            '${department}',
            ${proposalData.totalAmount},
            '${proposalData.proposalDate}',
            '${proposalData.approvalDate}'
          )
        `);
        
        // 결재라인 생성
        await sequelize.query(`
          INSERT INTO approval_lines (
            proposal_id, step, name, title, description, is_conditional,
            created_at, updated_at
          ) VALUES (
            ${proposalId},
            1,
            '${getApproverName(department)}',
            '${getApproverTitle(department)}',
            '승인합니다.',
            false,
            '${proposalData.proposalDate}',
            '${proposalData.approvalDate}'
          )
        `);
        
        console.log(`✅ ${year}년 ${month}월: ${proposalData.purpose} (${contractType}, ${proposalData.totalAmount.toLocaleString()}원)`);
        totalCreated++;
      }
      
      // 다음 달로 이동
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    // 4. 생성 완료 후 현황 확인
    console.log(`\n3. 생성 완료 - 총 ${totalCreated}개 품의서 생성`);
    
    const finalStats = await sequelize.query(`
      SELECT 
        EXTRACT(YEAR FROM p.proposal_date) as year,
        EXTRACT(MONTH FROM p.proposal_date) as month,
        COUNT(*) as count,
        SUM(p.total_amount) as total_amount
      FROM proposals p
      WHERE p.proposal_date >= '2024-08-01' 
      AND p.proposal_date <= '2025-09-30'
      AND p.status = 'approved'
      GROUP BY EXTRACT(YEAR FROM p.proposal_date), EXTRACT(MONTH FROM p.proposal_date)
      ORDER BY year, month
    `, { type: Sequelize.QueryTypes.SELECT });
    
    console.log('\n=== 월별 결재완료 품의서 현황 ===');
    finalStats.forEach(stat => {
      console.log(`${stat.year}년 ${stat.month}월: ${stat.count}건 (${parseInt(stat.total_amount).toLocaleString()}원)`);
    });
    
    console.log('\n🎉 2024년 8월 ~ 2025년 9월 결재완료 품의서 생성 완료!');
    
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    console.error(error);
  } finally {
    await sequelize.close();
  }
}

// 시간대별 품의서 데이터 생성 함수
function generateHistoricalProposalData(budget, contractType, proposalDate, approvalDate, contractStartDate, contractEndDate) {
  const baseAmount = Math.floor(budget.budget_amount * 0.05 * (Math.random() * 0.8 + 0.2)); // 예산의 1-4%
  
  const data = {
    proposalDate: proposalDate.toISOString().split('T')[0],
    approvalDate: approvalDate.toISOString().split('T')[0],
    contractStartDate: contractStartDate.toISOString().split('T')[0],
    contractEndDate: contractEndDate.toISOString().split('T')[0],
    totalAmount: baseAmount,
    contractMethod: contractType === 'bidding' ? '일반경쟁입찰' : contractType === 'service' ? '수의계약' : '일반구매'
  };
  
  // 시기별 특성을 반영한 품의서 생성
  const month = proposalDate.getMonth() + 1;
  const year = proposalDate.getFullYear();
  
  if (budget.project_name.includes('IT 시스템') || budget.project_name.includes('AI')) {
    data.purpose = `${year}년 ${month}월 IT ${getContractTypeName(contractType)} - ${getITItemName(contractType, month)}`;
    data.basis = `${year}년 IT 시스템 ${month}월 계획에 따른 ${getContractTypeName(contractType)}`;
    data.accountSubject = contractType === 'service' ? '용역비' : '전산기구비품';
    data.purchaseItems = contractType !== 'service' ? getITPurchaseItems(baseAmount, month) : [];
    data.serviceItems = contractType === 'service' ? getITServiceItems(baseAmount, month) : [];
  } else if (budget.project_name.includes('클라우드')) {
    data.purpose = `${year}년 ${month}월 클라우드 ${getContractTypeName(contractType)} - ${getCloudItemName(contractType, month)}`;
    data.basis = `${year}년 클라우드 ${month}월 계획에 따른 ${getContractTypeName(contractType)}`;
    data.accountSubject = contractType === 'service' ? '용역비' : '전산운용비';
    data.purchaseItems = contractType !== 'service' ? getCloudPurchaseItems(baseAmount, month) : [];
    data.serviceItems = contractType === 'service' ? getCloudServiceItems(baseAmount, month) : [];
  } else if (budget.project_name.includes('보안')) {
    data.purpose = `${year}년 ${month}월 보안 ${getContractTypeName(contractType)} - ${getSecurityItemName(contractType, month)}`;
    data.basis = `${year}년 보안 시스템 ${month}월 계획에 따른 ${getContractTypeName(contractType)}`;
    data.accountSubject = contractType === 'service' ? '용역비' : '전산기구비품';
    data.purchaseItems = contractType !== 'service' ? getSecurityPurchaseItems(baseAmount, month) : [];
    data.serviceItems = contractType === 'service' ? getSecurityServiceItems(baseAmount, month) : [];
  } else {
    data.purpose = `${year}년 ${month}월 ${budget.project_name} ${getContractTypeName(contractType)}`;
    data.basis = `${year}년 ${budget.project_name} ${month}월 계획에 따른 ${getContractTypeName(contractType)}`;
    data.accountSubject = contractType === 'service' ? '용역비' : '전산운용비';
    data.purchaseItems = contractType !== 'service' ? getGeneralPurchaseItems(baseAmount, month) : [];
    data.serviceItems = contractType === 'service' ? getGeneralServiceItems(baseAmount, month) : [];
  }
  
  return data;
}

// 헬퍼 함수들
function getContractTypeName(type) {
  switch(type) {
    case 'purchase': return '구매';
    case 'service': return '용역';
    case 'bidding': return '입찰';
    default: return '계약';
  }
}

function getITItemName(type, month) {
  const seasonalItems = {
    purchase: {
      summer: ['서버 쿨링시스템', '백업 스토리지', 'UPS 시스템'],
      autumn: ['워크스테이션', '네트워크 장비', '모니터링 시스템'],
      winter: ['라이선스 갱신', '보안 장비', '개발도구'],
      spring: ['신규 서버', '네트워크 확장', '스토리지 증설']
    },
    service: {
      summer: ['시스템 점검', '성능 최적화', '보안 진단'],
      autumn: ['시스템 마이그레이션', '데이터 백업', '인프라 구축'],
      winter: ['연말 정산 시스템', '보안 강화', '시스템 업그레이드'],
      spring: ['신년도 시스템', '개발 환경 구축', '운영 최적화']
    },
    bidding: {
      summer: ['통합 모니터링 시스템', '클라우드 인프라', '보안 솔루션'],
      autumn: ['ERP 시스템', '통합 백업 솔루션', '네트워크 인프라'],
      winter: ['차세대 시스템', '통합 보안 플랫폼', '디지털 전환'],
      spring: ['AI 플랫폼', '빅데이터 시스템', '클라우드 플랫폼']
    }
  };
  
  const season = getSeason(month);
  const items = seasonalItems[type][season];
  return items[Math.floor(Math.random() * items.length)];
}

function getCloudItemName(type, month) {
  const items = {
    purchase: ['클라우드 스토리지', '하이브리드 인프라', '마이그레이션 도구', '클라우드 보안'],
    service: ['클라우드 컨설팅', '마이그레이션 지원', '클라우드 운영', '성능 최적화'],
    bidding: ['멀티클라우드 플랫폼', '클라우드 통합 관리', '하이브리드 솔루션']
  };
  return items[type][Math.floor(Math.random() * items[type].length)];
}

function getSecurityItemName(type, month) {
  const items = {
    purchase: ['방화벽', '침입탐지시스템', '보안 솔루션', 'VPN 장비'],
    service: ['보안 컨설팅', '취약점 진단', '보안 모니터링', '침해대응'],
    bidding: ['통합 보안 플랫폼', '차세대 방화벽', '보안관제시스템']
  };
  return items[type][Math.floor(Math.random() * items[type].length)];
}

function getSeason(month) {
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  if (month >= 12 || month <= 2) return 'winter';
  return 'spring';
}

// 구매품목 생성 함수들
function getITPurchaseItems(totalAmount, month) {
  const items = [
    { item: 'IT장비', productName: `${month}월 IT 장비`, quantity: 1, unitPrice: Math.floor(totalAmount * 0.6), contractPeriodType: 'permanent' },
    { item: '네트워크장비', productName: `${month}월 네트워크 장비`, quantity: 1, unitPrice: Math.floor(totalAmount * 0.4), contractPeriodType: 'permanent' }
  ];
  items.forEach(item => item.amount = item.quantity * item.unitPrice);
  return items;
}

function getCloudPurchaseItems(totalAmount, month) {
  const items = [
    { item: '클라우드서비스', productName: `${month}월 클라우드 서비스`, quantity: 1, unitPrice: totalAmount, contractPeriodType: 'yearly' }
  ];
  items.forEach(item => item.amount = item.quantity * item.unitPrice);
  return items;
}

function getSecurityPurchaseItems(totalAmount, month) {
  const items = [
    { item: '보안장비', productName: `${month}월 보안 장비`, quantity: 1, unitPrice: totalAmount, contractPeriodType: 'permanent' }
  ];
  items.forEach(item => item.amount = item.quantity * item.unitPrice);
  return items;
}

function getGeneralPurchaseItems(totalAmount, month) {
  const items = [
    { item: '일반장비', productName: `${month}월 일반 장비`, quantity: 1, unitPrice: totalAmount, contractPeriodType: 'permanent' }
  ];
  items.forEach(item => item.amount = item.quantity * item.unitPrice);
  return items;
}

// 용역항목 생성 함수들
function getITServiceItems(totalAmount, month) {
  return [
    { item: 'IT용역', personnel: 2, skillLevel: '고급', period: 3, monthlyRate: Math.floor(totalAmount / 3), contractAmount: totalAmount }
  ];
}

function getCloudServiceItems(totalAmount, month) {
  return [
    { item: '클라우드용역', personnel: 1, skillLevel: '고급', period: 2, monthlyRate: Math.floor(totalAmount / 2), contractAmount: totalAmount }
  ];
}

function getSecurityServiceItems(totalAmount, month) {
  return [
    { item: '보안용역', personnel: 1, skillLevel: '고급', period: 1, monthlyRate: totalAmount, contractAmount: totalAmount }
  ];
}

function getGeneralServiceItems(totalAmount, month) {
  return [
    { item: '일반용역', personnel: 1, skillLevel: '중급', period: 2, monthlyRate: Math.floor(totalAmount / 2), contractAmount: totalAmount }
  ];
}

function getApproverName(department) {
  const approvers = {
    'IT개발팀': '김개발팀장',
    'IT운영팀': '이운영팀장',
    '기획팀': '박기획팀장',
    '재무팀': '최재무팀장',
    '인사팀': '정인사팀장',
    '마케팅팀': '강마케팅팀장',
    '영업팀': '송영업팀장',
    '고객지원팀': '한고객팀장'
  };
  return approvers[department] || '관리자';
}

function getApproverTitle(department) {
  return department.replace('팀', '') + '팀장';
}

createHistoricalProposals(); 