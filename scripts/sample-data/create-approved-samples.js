const { Sequelize } = require('sequelize');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const sequelize = new Sequelize(
  process.env.DB_NAME || 'contract_management',
  process.env.DB_USERNAME || 'postgres',
  process.env.DB_PASSWORD || 'meritz123!',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false
  }
);

// 샘플 데이터 생성 함수
async function createApprovedSamples() {
  try {
    console.log('=== 결재완료된 품의서 샘플 데이터 30개 생성 ===\n');

    // 먼저 budget_id를 가져오기 위해 budgets 테이블에서 하나 선택
    const budgetResult = await sequelize.query(`
      SELECT id FROM budgets WHERE is_active = true LIMIT 1
    `);
    
    if (budgetResult[0].length === 0) {
      console.log('❌ 활성화된 예산이 없습니다. 먼저 예산을 생성해주세요.');
      return;
    }
    
    const budgetId = budgetResult[0][0].id;

    // 다양한 계약 유형
    const contractTypes = ['purchase', 'service', 'bidding'];
    
    // 다양한 부서
    const departments = [
      'IT개발팀', '경영관리팀', '마케팅팀', '영업팀', '인사팀', 
      '재무팀', '기획팀', '품질관리팀', '연구개발팀', '고객지원팀'
    ];
    
    // 다양한 공급업체
    const suppliers = [
      '삼성전자', 'LG전자', '현대자동차', 'SK하이닉스', '포스코',
      'KT', 'SK텔레콤', 'LG유플러스', '네이버', '카카오',
      '쿠팡', '배달의민족', '토스', '당근마켓', '야놀자'
    ];
    
    // 다양한 계정과목
    const accountSubjects = [
      '전산기구비품', '소프트웨어', '서비스', '운영비', '마케팅비',
      '인건비', '연구개발비', '교육훈련비', '보험료', '임차료'
    ];

    // 샘플 데이터 배열
    const sampleProposals = [];
    
    for (let i = 1; i <= 30; i++) {
      const contractType = contractTypes[Math.floor(Math.random() * contractTypes.length)];
      const department = departments[Math.floor(Math.random() * departments.length)];
      const supplier = suppliers[Math.floor(Math.random() * suppliers.length)];
      const accountSubject = accountSubjects[Math.floor(Math.random() * accountSubjects.length)];
      
      // 금액 범위 설정 (10만원 ~ 1억원)
      const amount = Math.floor(Math.random() * 99000000) + 100000;
      
      // 날짜 설정 (최근 6개월 내)
      const randomDays = Math.floor(Math.random() * 180);
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - randomDays);
      
      const proposal = {
        contractType,
        purpose: `${department} ${getContractTypeText(contractType)} 구매`,
        basis: `${accountSubject} 구매 필요`,
        budgetId,
        contractMethod: getContractMethod(contractType),
        accountSubject,
        totalAmount: amount,
        status: 'approved',
        createdBy: `작성자 ${Math.floor(Math.random() * 10) + 1}`,
        isDraft: false,
        createdAt: createdAt.toISOString(),
        updatedAt: createdAt.toISOString(),
        department,
        supplier,
        purchaseItem: {
          item: `${getContractTypeText(contractType)} 품목 ${i}`,
          productName: `${supplier} 제품`,
          quantity: Math.floor(Math.random() * 10) + 1,
          unitPrice: Math.floor(amount / (Math.floor(Math.random() * 10) + 1)),
          amount: amount,
          supplier,
          requestDepartment: department
        }
      };
      
      sampleProposals.push(proposal);
    }

    // 데이터베이스에 삽입
    console.log('샘플 데이터 생성 중...');
    
    for (let i = 0; i < sampleProposals.length; i++) {
      const proposal = sampleProposals[i];
      
      // 품의서 생성
      const proposalResult = await sequelize.query(`
        INSERT INTO proposals (
          contract_type, purpose, basis, budget_id, contract_method, 
          account_subject, total_amount, status, created_by, is_draft,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        RETURNING id
      `, {
        replacements: [
          proposal.contractType,
          proposal.purpose,
          proposal.basis,
          proposal.budgetId,
          proposal.contractMethod,
          proposal.accountSubject,
          proposal.totalAmount,
          proposal.status,
          proposal.createdBy,
          proposal.isDraft,
          proposal.createdAt,
          proposal.updatedAt
        ]
      });
      
      const proposalId = proposalResult[0][0].id;
      
      // 비용귀속부서 생성
      await sequelize.query(`
        INSERT INTO cost_departments (
          proposal_id, department, amount, ratio
        ) VALUES (?, ?, ?, ?)
      `, {
        replacements: [
          proposalId,
          proposal.department,
          proposal.totalAmount,
          100
        ]
      });
      
      // 요청부서 생성
      await sequelize.query(`
        INSERT INTO request_departments (
          proposal_id, name, code, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?)
      `, {
        replacements: [
          proposalId,
          proposal.department,
          `DEPT${Math.floor(Math.random() * 1000)}`,
          proposal.createdAt,
          proposal.updatedAt
        ]
      });
      
      // 구매품목 생성
      const purchaseItemResult = await sequelize.query(`
        INSERT INTO purchase_items (
          proposal_id, item, product_name, quantity, unit_price, 
          amount, supplier, request_department
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        RETURNING id
      `, {
        replacements: [
          proposalId,
          proposal.purchaseItem.item,
          proposal.purchaseItem.productName,
          proposal.purchaseItem.quantity,
          proposal.purchaseItem.unitPrice,
          proposal.purchaseItem.amount,
          proposal.purchaseItem.supplier,
          proposal.purchaseItem.requestDepartment
        ]
      });
      
      const purchaseItemId = purchaseItemResult[0][0].id;
      
      // 구매품목별 비용분배 생성
      await sequelize.query(`
        INSERT INTO cost_departments (
          proposal_id, department, amount, ratio, purchase_item_id, allocation_type
        ) VALUES (?, ?, ?, ?, ?, ?)
      `, {
        replacements: [
          proposalId,
          proposal.department,
          proposal.totalAmount,
          100,
          purchaseItemId,
          'percentage'
        ]
      });
      
      console.log(`✅ 샘플 데이터 ${i + 1}/30 생성 완료: ${proposal.purpose} (${formatCurrency(proposal.totalAmount)})`);
    }

    console.log('\n=== 샘플 데이터 생성 완료 ===');
    console.log(`총 ${sampleProposals.length}개의 결재완료 품의서가 생성되었습니다.`);
    
    // 생성된 데이터 확인
    const result = await sequelize.query(`
      SELECT 
        status,
        COUNT(*) as count,
        SUM(total_amount) as total_amount
      FROM proposals 
      GROUP BY status
      ORDER BY status
    `);
    
    console.log('\n현재 품의서 상태별 현황:');
    result[0].forEach(row => {
      console.log(`  - ${row.status}: ${row.count}건 (총 ${formatCurrency(row.total_amount)}원)`);
    });

  } catch (error) {
    console.error('샘플 데이터 생성 중 오류 발생:', error);
  } finally {
    await sequelize.close();
  }
}

// 헬퍼 함수들
function getContractTypeText(type) {
  switch (type) {
    case 'purchase': return '구매';
    case 'service': return '용역';
    case 'bidding': return '입찰';
    default: return type;
  }
}

function getContractMethod(type) {
  switch (type) {
    case 'purchase': return '일반계약';
    case 'service': return '용역계약';
    case 'bidding': return '입찰계약';
    default: return '일반계약';
  }
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('ko-KR').format(amount) + '원';
}

// 스크립트 실행
createApprovedSamples(); 