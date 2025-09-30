const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'meritz123!',
  database: process.env.DB_NAME || 'contract_management',
  logging: false
});

async function createTestProposals() {
  try {
    console.log('📝 테스트용 품의서 생성 중...');
    
    // 1. 구매 계약 품의서
    const purchaseProposal = await sequelize.query(`
      INSERT INTO proposals (
        contract_type, purpose, basis, budget_id, contract_method, 
        account_subject, total_amount, status, created_by, created_at, updated_at
      ) VALUES (
        'purchase', 
        'IT 인프라 구축을 위한 서버 및 네트워크 장비 구매', 
        '2024년 IT 인프라 구축 계획에 따른 장비 구매', 
        1, 
        'direct', 
        'IT인프라비용', 
        15000000, 
        'draft', 
        '김철수', 
        NOW(), 
        NOW()
      ) RETURNING id
    `);
    
    const purchaseProposalId = purchaseProposal[0][0].id;
    console.log(`✅ 구매 계약 품의서 생성 완료 (ID: ${purchaseProposalId})`);
    
    // 구매품목 추가
    await sequelize.query(`
      INSERT INTO purchase_items (
        proposal_id, item, product_name, quantity, unit_price, amount, supplier, request_department, created_at, updated_at
      ) VALUES 
        (${purchaseProposalId}, '서버', 'Dell PowerEdge R750', 2, 5000000, 10000000, 'Dell Korea', 'IT팀', NOW(), NOW()),
        (${purchaseProposalId}, '네트워크 스위치', 'Cisco Catalyst 9300', 3, 1500000, 4500000, 'Cisco Korea', 'IT팀', NOW(), NOW()),
        (${purchaseProposalId}, '백업장비', 'Synology DS1821+', 1, 500000, 500000, 'Synology Korea', 'IT팀', NOW(), NOW())
    `);
    
    // 비용귀속부서 배분
    await sequelize.query(`
      INSERT INTO cost_departments (
        proposal_id, department, amount, ratio, created_at, updated_at
      ) VALUES 
        (${purchaseProposalId}, 'IT팀', 10000000, 66.7, NOW(), NOW()),
        (${purchaseProposalId}, '경영관리팀', 3000000, 20.0, NOW(), NOW()),
        (${purchaseProposalId}, '개발팀', 2000000, 13.3, NOW(), NOW())
    `);
    
    // 2. 용역 계약 품의서
    const serviceProposal = await sequelize.query(`
      INSERT INTO proposals (
        contract_type, purpose, basis, budget_id, contract_method, 
        account_subject, total_amount, contract_period, payment_method, status, created_by, created_at, updated_at
      ) VALUES (
        'service', 
        '웹 애플리케이션 개발 용역', 
        '고객 포털 시스템 구축 프로젝트', 
        3, 
        'bidding', 
        '개발비용', 
        50000000, 
        '2024.03.01 ~ 2024.08.31', 
        'monthly', 
        'submitted', 
        '이영희', 
        NOW(), 
        NOW()
      ) RETURNING id
    `);
    
    const serviceProposalId = serviceProposal[0][0].id;
    console.log(`✅ 용역 계약 품의서 생성 완료 (ID: ${serviceProposalId})`);
    
    // 용역항목 추가
    await sequelize.query(`
      INSERT INTO service_items (
        proposal_id, item, personnel, skill_level, period, monthly_rate, contract_amount, supplier, credit_rating, created_at, updated_at
      ) VALUES 
        (${serviceProposalId}, '프론트엔드 개발', 2, 'senior', 6, 4000000, 48000000, 'ABC소프트웨어', 'A', NOW(), NOW()),
        (${serviceProposalId}, '백엔드 개발', 1, 'senior', 6, 3500000, 21000000, 'ABC소프트웨어', 'A', NOW(), NOW()),
        (${serviceProposalId}, 'UI/UX 디자인', 1, 'middle', 3, 2500000, 7500000, 'ABC소프트웨어', 'A', NOW(), NOW())
    `);
    
    // 비용귀속부서 배분
    await sequelize.query(`
      INSERT INTO cost_departments (
        proposal_id, department, amount, ratio, created_at, updated_at
      ) VALUES 
        (${serviceProposalId}, '개발팀', 35000000, 70.0, NOW(), NOW()),
        (${serviceProposalId}, '기획팀', 10000000, 20.0, NOW(), NOW()),
        (${serviceProposalId}, '경영관리팀', 5000000, 10.0, NOW(), NOW())
    `);
    
    // 3. 변경 계약 품의서
    const changeProposal = await sequelize.query(`
      INSERT INTO proposals (
        contract_type, purpose, basis, budget_id, contract_method, 
        account_subject, total_amount, change_reason, status, created_by, created_at, updated_at
      ) VALUES (
        'change', 
        '기존 서버 사양 변경', 
        '성능 요구사항 변경에 따른 서버 사양 업그레이드', 
        1, 
        'direct', 
        'IT인프라비용', 
        8000000, 
        '기존 서버의 CPU 및 메모리 사양이 업무 요구사항을 충족하지 못하여 고사양 모델로 변경', 
        'approved', 
        '박민수', 
        NOW(), 
        NOW()
      ) RETURNING id
    `);
    
    const changeProposalId = changeProposal[0][0].id;
    console.log(`✅ 변경 계약 품의서 생성 완료 (ID: ${changeProposalId})`);
    
    // 구매품목 추가
    await sequelize.query(`
      INSERT INTO purchase_items (
        proposal_id, item, product_name, quantity, unit_price, amount, supplier, request_department, created_at, updated_at
      ) VALUES 
        (${changeProposalId}, '서버 CPU 업그레이드', 'Intel Xeon Gold 6338', 2, 3000000, 6000000, 'Dell Korea', 'IT팀', NOW(), NOW()),
        (${changeProposalId}, '메모리 증설', 'DDR4 64GB ECC', 4, 500000, 2000000, 'Dell Korea', 'IT팀', NOW(), NOW())
    `);
    
    // 비용귀속부서 배분
    await sequelize.query(`
      INSERT INTO cost_departments (
        proposal_id, department, amount, ratio, created_at, updated_at
      ) VALUES 
        (${changeProposalId}, 'IT팀', 8000000, 100.0, NOW(), NOW())
    `);
    
    // 4. 연장 계약 품의서
    const extensionProposal = await sequelize.query(`
      INSERT INTO proposals (
        contract_type, purpose, basis, budget_id, contract_method, 
        account_subject, total_amount, extension_reason, status, created_by, created_at, updated_at
      ) VALUES (
        'extension', 
        '클라우드 서비스 계약 연장', 
        'AWS 클라우드 인프라 서비스 계약 연장', 
        2, 
        'direct', 
        '운영비용', 
        12000000, 
        '기존 서비스의 안정적 운영과 비용 효율성을 고려하여 1년간 연장', 
        'draft', 
        '최지영', 
        NOW(), 
        NOW()
      ) RETURNING id
    `);
    
    const extensionProposalId = extensionProposal[0][0].id;
    console.log(`✅ 연장 계약 품의서 생성 완료 (ID: ${extensionProposalId})`);
    
    // 구매품목 추가
    await sequelize.query(`
      INSERT INTO purchase_items (
        proposal_id, item, product_name, quantity, unit_price, amount, supplier, request_department, created_at, updated_at
      ) VALUES 
        (${extensionProposalId}, 'AWS EC2 인스턴스', 't3.xlarge', 12, 800000, 9600000, 'Amazon Web Services', 'IT팀', NOW(), NOW()),
        (${extensionProposalId}, 'AWS RDS 데이터베이스', 'db.t3.large', 12, 200000, 2400000, 'Amazon Web Services', 'IT팀', NOW(), NOW())
    `);
    
    // 비용귀속부서 배분
    await sequelize.query(`
      INSERT INTO cost_departments (
        proposal_id, department, amount, ratio, created_at, updated_at
      ) VALUES 
        (${extensionProposalId}, 'IT팀', 7200000, 60.0, NOW(), NOW()),
        (${extensionProposalId}, '개발팀', 3600000, 30.0, NOW(), NOW()),
        (${extensionProposalId}, '경영관리팀', 1200000, 10.0, NOW(), NOW())
    `);
    
    // 5. 입찰 계약 품의서
    const biddingProposal = await sequelize.query(`
      INSERT INTO proposals (
        contract_type, purpose, basis, budget_id, contract_method, 
        account_subject, total_amount, status, created_by, created_at, updated_at
      ) VALUES (
        'bidding', 
        '사무실 리모델링 공사', 
        '사무실 환경 개선을 위한 리모델링 공사', 
        2, 
        'bidding', 
        '운영비용', 
        80000000, 
        'draft', 
        '정수진', 
        NOW(), 
        NOW()
      ) RETURNING id
    `);
    
    const biddingProposalId = biddingProposal[0][0].id;
    console.log(`✅ 입찰 계약 품의서 생성 완료 (ID: ${biddingProposalId})`);
    
    // 비용귀속부서 배분
    await sequelize.query(`
      INSERT INTO cost_departments (
        proposal_id, department, amount, ratio, created_at, updated_at
      ) VALUES 
        (${biddingProposalId}, '경영관리팀', 40000000, 50.0, NOW(), NOW()),
        (${biddingProposalId}, 'IT팀', 20000000, 25.0, NOW(), NOW()),
        (${biddingProposalId}, '개발팀', 12000000, 15.0, NOW(), NOW()),
        (${biddingProposalId}, '기획팀', 8000000, 10.0, NOW(), NOW())
    `);
    
    console.log('\n🎉 테스트용 품의서 생성 완료!');
    console.log('📊 생성된 품의서:');
    console.log(`  - 구매 계약: ${purchaseProposalId} (1,500만원) - draft`);
    console.log(`  - 용역 계약: ${serviceProposalId} (5,000만원) - submitted`);
    console.log(`  - 변경 계약: ${changeProposalId} (800만원) - approved`);
    console.log(`  - 연장 계약: ${extensionProposalId} (1,200만원) - draft`);
    console.log(`  - 입찰 계약: ${biddingProposalId} (8,000만원) - draft`);
    
  } catch (error) {
    console.error('❌ 테스트 품의서 생성 실패:', error.message);
  } finally {
    await sequelize.close();
  }
}

createTestProposals(); 