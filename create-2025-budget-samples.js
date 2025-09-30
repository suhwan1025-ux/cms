const { Sequelize, DataTypes } = require('sequelize');
const config = require('./config/database.js').development;

const sequelize = new Sequelize(config.database, config.username, config.password, config);

async function create2025BudgetSamples() {
  try {
    console.log('🎯 2025년 사업예산별 품의서 샘플 생성 시작...');
    
    // 1. 2025년 사업예산 목록 확인
    console.log('\n1. 2025년 사업예산 목록 확인...');
    
    const budgets2025 = await sequelize.query(`
      SELECT id, project_name, budget_amount, executed_amount, budget_type, budget_category
      FROM business_budgets 
      WHERE budget_year = 2025
      ORDER BY project_name
    `, { type: Sequelize.QueryTypes.SELECT });
    
    console.log(`\n총 ${budgets2025.length}개의 2025년 사업예산:`);
    budgets2025.forEach((budget, index) => {
      console.log(`${index + 1}. ${budget.project_name} (ID: ${budget.id})`);
      console.log(`   예산: ${parseInt(budget.budget_amount).toLocaleString()}원`);
      console.log(`   집행: ${parseInt(budget.executed_amount).toLocaleString()}원`);
      console.log(`   유형: ${budget.budget_type} - ${budget.budget_category}`);
      console.log('');
    });
    
    // 2. 공급업체 목록 가져오기
    const suppliers = await sequelize.query(`
      SELECT id, name, business_number, credit_rating
      FROM suppliers
      ORDER BY name
    `, { type: Sequelize.QueryTypes.SELECT });
    
    console.log(`\n사용 가능한 공급업체: ${suppliers.length}개`);
    
    // 3. 각 사업예산별로 품의서 생성
    console.log('\n2. 사업예산별 품의서 샘플 생성...');
    
    const contractTypes = ['purchase', 'service', 'bidding'];
    const departments = ['IT개발팀', 'IT운영팀', '기획팀', '재무팀', '인사팀', '마케팅팀'];
    const creators = ['김개발', '이운영', '박기획', '최재무', '정인사', '강마케팅', '송IT', '한시스템', '조보안', '윤관리'];
    
    let totalCreated = 0;
    
    for (const budget of budgets2025) {
      console.log(`\n=== ${budget.project_name} 품의서 생성 ===`);
      
      // 각 예산별로 3-5개의 품의서 생성
      const proposalCount = Math.floor(Math.random() * 3) + 3; // 3-5개
      
      for (let i = 0; i < proposalCount; i++) {
        const contractType = contractTypes[Math.floor(Math.random() * contractTypes.length)];
        const creator = creators[Math.floor(Math.random() * creators.length)];
        const department = departments[Math.floor(Math.random() * departments.length)];
        const supplier = suppliers[Math.floor(Math.random() * suppliers.length)];
        
        // 예산에 맞는 품의서 제목과 내용 생성
        const proposalData = generateProposalData(budget, contractType, i + 1);
        
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
            NOW(),
            NOW()
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
                NOW(),
                NOW()
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
                NOW(),
                NOW()
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
            NOW(),
            NOW()
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
            NOW(),
            NOW()
          )
        `);
        
        console.log(`✅ 생성: ${proposalData.purpose} (${contractType}, ${proposalData.totalAmount.toLocaleString()}원)`);
        totalCreated++;
      }
    }
    
    // 4. 생성 완료 후 현황 확인
    console.log(`\n3. 생성 완료 - 총 ${totalCreated}개 품의서 생성`);
    
    const finalStats = await sequelize.query(`
      SELECT 
        bb.project_name,
        COUNT(p.id) as proposal_count,
        SUM(CASE WHEN p.status = 'approved' THEN p.total_amount ELSE 0 END) as total_amount
      FROM business_budgets bb
      LEFT JOIN proposals p ON bb.id = p.budget_id
      WHERE bb.budget_year = 2025
      GROUP BY bb.id, bb.project_name
      ORDER BY bb.project_name
    `, { type: Sequelize.QueryTypes.SELECT });
    
    console.log('\n=== 2025년 사업예산별 품의서 현황 ===');
    finalStats.forEach(stat => {
      console.log(`${stat.project_name}: ${stat.proposal_count}건 (${parseInt(stat.total_amount || 0).toLocaleString()}원)`);
    });
    
    console.log('\n🎉 2025년 사업예산별 품의서 샘플 생성 완료!');
    
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    console.error(error);
  } finally {
    await sequelize.close();
  }
}

// 예산별 품의서 데이터 생성 함수
function generateProposalData(budget, contractType, index) {
  const today = new Date();
  const proposalDate = new Date(2025, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
  const approvalDate = new Date(proposalDate.getTime() + (Math.floor(Math.random() * 7) + 1) * 24 * 60 * 60 * 1000);
  const contractStartDate = new Date(approvalDate.getTime() + (Math.floor(Math.random() * 30) + 1) * 24 * 60 * 60 * 1000);
  const contractEndDate = new Date(contractStartDate.getTime() + (Math.floor(Math.random() * 365) + 30) * 24 * 60 * 60 * 1000);
  
  const baseAmount = Math.floor(budget.budget_amount * 0.1 * (Math.random() * 0.8 + 0.2)); // 예산의 2-10%
  
  const data = {
    proposalDate: proposalDate.toISOString().split('T')[0],
    approvalDate: approvalDate.toISOString().split('T')[0],
    contractStartDate: contractStartDate.toISOString().split('T')[0],
    contractEndDate: contractEndDate.toISOString().split('T')[0],
    totalAmount: baseAmount,
    contractMethod: contractType === 'bidding' ? '일반경쟁입찰' : contractType === 'service' ? '수의계약' : '일반구매'
  };
  
  // 예산 유형별 품의서 생성
  if (budget.project_name.includes('AI 시스템')) {
    data.purpose = `AI ${getContractTypeName(contractType)} ${index}차 - ${getAIItemName(contractType)}`;
    data.basis = 'AI 시스템 도입 계획에 따른 ' + getContractTypeName(contractType);
    data.accountSubject = contractType === 'service' ? '용역비' : '전산기구비품';
    data.purchaseItems = contractType !== 'service' ? getAIPurchaseItems(baseAmount) : [];
    data.serviceItems = contractType === 'service' ? getAIServiceItems(baseAmount) : [];
  } else if (budget.project_name.includes('클라우드')) {
    data.purpose = `클라우드 ${getContractTypeName(contractType)} ${index}차 - ${getCloudItemName(contractType)}`;
    data.basis = '클라우드 마이그레이션 계획에 따른 ' + getContractTypeName(contractType);
    data.accountSubject = contractType === 'service' ? '용역비' : '전산운용비';
    data.purchaseItems = contractType !== 'service' ? getCloudPurchaseItems(baseAmount) : [];
    data.serviceItems = contractType === 'service' ? getCloudServiceItems(baseAmount) : [];
  } else if (budget.project_name.includes('전산 운영비')) {
    data.purpose = `전산 운영 ${getContractTypeName(contractType)} ${index}차 - ${getOpsItemName(contractType)}`;
    data.basis = '전산 시스템 운영 계획에 따른 ' + getContractTypeName(contractType);
    data.accountSubject = contractType === 'service' ? '전산수선비' : '전산운용비';
    data.purchaseItems = contractType !== 'service' ? getOpsPurchaseItems(baseAmount) : [];
    data.serviceItems = contractType === 'service' ? getOpsServiceItems(baseAmount) : [];
  } else if (budget.project_name.includes('전산기구비품')) {
    data.purpose = `전산기구비품 ${getContractTypeName(contractType)} ${index}차 - ${getEquipItemName(contractType)}`;
    data.basis = '전산기구비품 구매 계획에 따른 ' + getContractTypeName(contractType);
    data.accountSubject = '전산기구비품';
    data.purchaseItems = contractType !== 'service' ? getEquipPurchaseItems(baseAmount) : [];
    data.serviceItems = contractType === 'service' ? getEquipServiceItems(baseAmount) : [];
  } else if (budget.project_name.includes('라이선스')) {
    data.purpose = `소프트웨어 라이선스 ${getContractTypeName(contractType)} ${index}차 - ${getLicenseItemName(contractType)}`;
    data.basis = '소프트웨어 라이선스 구매 계획에 따른 ' + getContractTypeName(contractType);
    data.accountSubject = '전산운용비';
    data.purchaseItems = contractType !== 'service' ? getLicensePurchaseItems(baseAmount) : [];
    data.serviceItems = contractType === 'service' ? getLicenseServiceItems(baseAmount) : [];
  } else {
    data.purpose = `${budget.project_name} ${getContractTypeName(contractType)} ${index}차`;
    data.basis = `${budget.project_name} 계획에 따른 ${getContractTypeName(contractType)}`;
    data.accountSubject = contractType === 'service' ? '용역비' : '전산기구비품';
    data.purchaseItems = contractType !== 'service' ? getGeneralPurchaseItems(baseAmount) : [];
    data.serviceItems = contractType === 'service' ? getGeneralServiceItems(baseAmount) : [];
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

function getAIItemName(type) {
  const items = {
    purchase: ['AI 서버', 'GPU 카드', 'AI 워크스테이션', '딥러닝 장비'],
    service: ['AI 모델 개발', 'AI 시스템 구축', 'AI 컨설팅', '머신러닝 서비스'],
    bidding: ['AI 플랫폼 구축', 'AI 인프라 설치', 'AI 솔루션 도입']
  };
  return items[type][Math.floor(Math.random() * items[type].length)];
}

function getCloudItemName(type) {
  const items = {
    purchase: ['클라우드 장비', '네트워크 장비', '스토리지', '보안장비'],
    service: ['클라우드 마이그레이션', '클라우드 운영', '클라우드 컨설팅', '클라우드 관리'],
    bidding: ['클라우드 플랫폼 구축', '하이브리드 클라우드', '클라우드 인프라']
  };
  return items[type][Math.floor(Math.random() * items[type].length)];
}

function getOpsItemName(type) {
  const items = {
    purchase: ['서버 유지보수', '네트워크 장비', '모니터링 도구', '백업 장비'],
    service: ['시스템 운영', '모니터링 서비스', '유지보수 서비스', '기술지원'],
    bidding: ['운영 플랫폼', '모니터링 시스템', '통합 운영센터']
  };
  return items[type][Math.floor(Math.random() * items[type].length)];
}

function getEquipItemName(type) {
  const items = {
    purchase: ['서버', '워크스테이션', '노트북', '네트워크 스위치'],
    service: ['장비 설치', '장비 구성', '장비 운영', '기술지원'],
    bidding: ['서버 인프라', '네트워크 인프라', '통합 장비']
  };
  return items[type][Math.floor(Math.random() * items[type].length)];
}

function getLicenseItemName(type) {
  const items = {
    purchase: ['데이터베이스 라이선스', '개발도구', '운영체제', '보안 소프트웨어'],
    service: ['라이선스 관리', '소프트웨어 지원', '기술지원', '컨설팅'],
    bidding: ['통합 라이선스', '엔터프라이즈 라이선스']
  };
  return items[type][Math.floor(Math.random() * items[type].length)];
}

// 구매품목 생성 함수들
function getAIPurchaseItems(totalAmount) {
  const items = [
    { item: 'AI서버', productName: 'NVIDIA DGX A100', quantity: 1, unitPrice: Math.floor(totalAmount * 0.6), contractPeriodType: 'permanent' },
    { item: 'GPU카드', productName: 'NVIDIA RTX 4090', quantity: 2, unitPrice: Math.floor(totalAmount * 0.2), contractPeriodType: 'permanent' }
  ];
  items.forEach(item => item.amount = item.quantity * item.unitPrice);
  return items;
}

function getCloudPurchaseItems(totalAmount) {
  const items = [
    { item: '클라우드스토리지', productName: 'AWS S3', quantity: 1, unitPrice: Math.floor(totalAmount * 0.4), contractPeriodType: 'yearly' },
    { item: '네트워크장비', productName: 'Cisco Catalyst', quantity: 1, unitPrice: Math.floor(totalAmount * 0.6), contractPeriodType: 'permanent' }
  ];
  items.forEach(item => item.amount = item.quantity * item.unitPrice);
  return items;
}

function getOpsPurchaseItems(totalAmount) {
  const items = [
    { item: '모니터링도구', productName: 'Zabbix Enterprise', quantity: 1, unitPrice: Math.floor(totalAmount * 0.5), contractPeriodType: 'yearly' },
    { item: '백업장비', productName: 'Dell PowerVault', quantity: 1, unitPrice: Math.floor(totalAmount * 0.5), contractPeriodType: 'permanent' }
  ];
  items.forEach(item => item.amount = item.quantity * item.unitPrice);
  return items;
}

function getEquipPurchaseItems(totalAmount) {
  const items = [
    { item: '워크스테이션', productName: 'Dell Precision', quantity: 3, unitPrice: Math.floor(totalAmount * 0.3), contractPeriodType: 'permanent' },
    { item: '서버', productName: 'HP ProLiant', quantity: 1, unitPrice: Math.floor(totalAmount * 0.7), contractPeriodType: 'permanent' }
  ];
  items.forEach(item => item.amount = item.quantity * item.unitPrice);
  return items;
}

function getLicensePurchaseItems(totalAmount) {
  const items = [
    { item: 'DB라이선스', productName: 'Oracle Database', quantity: 1, unitPrice: Math.floor(totalAmount * 0.6), contractPeriodType: 'yearly' },
    { item: '개발도구', productName: 'Visual Studio Enterprise', quantity: 5, unitPrice: Math.floor(totalAmount * 0.08), contractPeriodType: 'yearly' }
  ];
  items.forEach(item => item.amount = item.quantity * item.unitPrice);
  return items;
}

function getGeneralPurchaseItems(totalAmount) {
  const items = [
    { item: '일반장비', productName: '범용 장비', quantity: 1, unitPrice: totalAmount, contractPeriodType: 'permanent' }
  ];
  items.forEach(item => item.amount = item.quantity * item.unitPrice);
  return items;
}

// 용역항목 생성 함수들
function getAIServiceItems(totalAmount) {
  return [
    { item: 'AI개발', personnel: 3, skillLevel: '고급', period: 6, monthlyRate: Math.floor(totalAmount / 6), contractAmount: totalAmount }
  ];
}

function getCloudServiceItems(totalAmount) {
  return [
    { item: '클라우드마이그레이션', personnel: 2, skillLevel: '고급', period: 4, monthlyRate: Math.floor(totalAmount / 4), contractAmount: totalAmount }
  ];
}

function getOpsServiceItems(totalAmount) {
  return [
    { item: '시스템운영', personnel: 2, skillLevel: '중급', period: 12, monthlyRate: Math.floor(totalAmount / 12), contractAmount: totalAmount }
  ];
}

function getEquipServiceItems(totalAmount) {
  return [
    { item: '장비설치', personnel: 1, skillLevel: '중급', period: 2, monthlyRate: Math.floor(totalAmount / 2), contractAmount: totalAmount }
  ];
}

function getLicenseServiceItems(totalAmount) {
  return [
    { item: '라이선스관리', personnel: 1, skillLevel: '중급', period: 12, monthlyRate: Math.floor(totalAmount / 12), contractAmount: totalAmount }
  ];
}

function getGeneralServiceItems(totalAmount) {
  return [
    { item: '일반용역', personnel: 1, skillLevel: '중급', period: 3, monthlyRate: Math.floor(totalAmount / 3), contractAmount: totalAmount }
  ];
}

function getApproverName(department) {
  const approvers = {
    'IT개발팀': '김개발팀장',
    'IT운영팀': '이운영팀장',
    '기획팀': '박기획팀장',
    '재무팀': '최재무팀장',
    '인사팀': '정인사팀장',
    '마케팅팀': '강마케팅팀장'
  };
  return approvers[department] || '관리자';
}

function getApproverTitle(department) {
  return department.replace('팀', '') + '팀장';
}

create2025BudgetSamples();
