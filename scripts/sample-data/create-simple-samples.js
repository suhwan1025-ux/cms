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

async function createSimpleSamples() {
  try {
    console.log('🔍 데이터베이스 연결 확인...');
    await sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공!');

    console.log('\n🗑️ 기존 데이터 삭제 중...');
    // 안전한 순서로 삭제 (외래키 제약조건 고려)
    try {
      await sequelize.query('DELETE FROM proposal_histories');
    } catch (e) { /* 테이블이 없어도 계속 진행 */ }
    
    await sequelize.query('DELETE FROM purchase_items');
    await sequelize.query('DELETE FROM service_items');
    await sequelize.query('DELETE FROM proposals');
    console.log('✅ 기존 데이터 삭제 완료!');

    console.log('\n📝 새로운 샘플 품의서 생성 중...');

    // 1. 2023년 구매계약 - IT 인프라
    await sequelize.query(`
      INSERT INTO proposals (
        contract_type, purpose, basis, budget_id, contract_method, 
        account_subject, total_amount, status, created_by, proposal_date, 
        approval_date, is_draft, created_at, updated_at
      ) VALUES (
        'purchase', 
        '2023년 차세대 서버 인프라 구축', 
        '디지털 전환 가속화 및 클라우드 마이그레이션 계획', 
        1, 
        'general', 
        'IT인프라구축비', 
        250000000, 
        'approved', 
        '시스템관리자', 
        '2023-03-15', 
        '2023-03-25', 
        false,
        '2023-03-15', 
        '2023-03-15'
      )
    `);

    const proposal1 = await sequelize.query("SELECT currval('proposals_id_seq') as id");
    const proposalId1 = proposal1[0][0].id;

    await sequelize.query(`
      INSERT INTO purchase_items (
        proposal_id, item, product_name, quantity, unit_price, amount, 
        supplier, contract_period_type, created_at, updated_at
      ) VALUES 
        (${proposalId1}, '신규', 'HPE ProLiant DL380 Gen10 Plus', 8, 18000000, 144000000, 'HPE Korea', '3years', NOW(), NOW()),
        (${proposalId1}, '신규', 'NetApp AFF A400', 2, 35000000, 70000000, 'NetApp Korea', '3years', NOW(), NOW()),
        (${proposalId1}, '기존', 'Cisco Nexus 9000 Series', 4, 9000000, 36000000, 'Cisco Systems Korea', 'permanent', NOW(), NOW())
    `);

    // 2. 2023년 용역계약 - ERP 시스템
    await sequelize.query(`
      INSERT INTO proposals (
        contract_type, purpose, basis, budget_id, contract_method, 
        account_subject, total_amount, status, created_by, proposal_date, 
        approval_date, is_draft, other, created_at, updated_at
      ) VALUES (
        'service', 
        '2023년 ERP 시스템 구축 및 운영 지원', 
        '업무 프로세스 디지털화 및 효율성 증대', 
        2, 
        'limited', 
        'ERP구축비', 
        180000000, 
        'approved', 
        '시스템관리자', 
        '2023-05-10', 
        '2023-05-20', 
        false,
        'SAP 기반 ERP 시스템 구축',
        '2023-05-10', 
        '2023-05-10'
      )
    `);

    const proposal2 = await sequelize.query("SELECT currval('proposals_id_seq') as id");
    const proposalId2 = proposal2[0][0].id;

    await sequelize.query(`
      INSERT INTO service_items (
        proposal_id, item, name, personnel, skill_level, period, monthly_rate, 
        contract_amount, supplier, credit_rating, created_at, updated_at
      ) VALUES 
        (${proposalId2}, 'ERP 구축 컨설팅', '김시스템', '김시스템', 'senior', 12, 8000000, 96000000, 'SAP Korea', 'A', NOW(), NOW()),
        (${proposalId2}, 'ERP 개발', '이개발', '이개발', 'senior', 10, 5500000, 55000000, 'SAP Korea', 'A', NOW(), NOW()),
        (${proposalId2}, 'ERP 테스팅', '박테스트', '박테스트', 'middle', 6, 4800000, 29000000, 'SAP Korea', 'B', NOW(), NOW())
    `);

    // 3. 2024년 구매계약 - 보안 인프라
    await sequelize.query(`
      INSERT INTO proposals (
        contract_type, purpose, basis, budget_id, contract_method, 
        account_subject, total_amount, status, created_by, proposal_date, 
        approval_date, is_draft, other, created_at, updated_at
      ) VALUES (
        'purchase', 
        '2024년 보안 인프라 강화 프로젝트', 
        '사이버 보안 위협 대응 및 정보보호 체계 구축', 
        3, 
        'negotiation', 
        '정보보안비', 
        320000000, 
        'approved', 
        '시스템관리자', 
        '2024-02-20', 
        '2024-03-05', 
        false,
        '국정원 보안 가이드라인 준수 필요',
        '2024-02-20', 
        '2024-02-20'
      )
    `);

    const proposal3 = await sequelize.query("SELECT currval('proposals_id_seq') as id");
    const proposalId3 = proposal3[0][0].id;

    await sequelize.query(`
      INSERT INTO purchase_items (
        proposal_id, item, product_name, quantity, unit_price, amount, 
        supplier, contract_period_type, created_at, updated_at
      ) VALUES 
        (${proposalId3}, '신규', 'Palo Alto PA-5250 Firewall', 4, 45000000, 180000000, 'Palo Alto Networks Korea', '3years', NOW(), NOW()),
        (${proposalId3}, '신규', 'Splunk Enterprise Security', 1, 80000000, 80000000, 'Splunk Korea', '2years', NOW(), NOW()),
        (${proposalId3}, '소프트웨어', 'CrowdStrike Falcon Platform', 500, 120000, 60000000, 'CrowdStrike Korea', '1year', NOW(), NOW())
    `);

    // 4. 2024년 용역계약 - AI/ML 플랫폼
    await sequelize.query(`
      INSERT INTO proposals (
        contract_type, purpose, basis, budget_id, contract_method, 
        account_subject, total_amount, status, created_by, proposal_date, 
        is_draft, other, created_at, updated_at
      ) VALUES (
        'service', 
        '2024년 AI/ML 플랫폼 구축 및 데이터 분석 지원', 
        '데이터 기반 의사결정 체계 구축 및 AI 역량 강화', 
        4, 
        'designation', 
        'AI플랫폼구축비', 
        420000000, 
        'submitted', 
        '시스템관리자', 
        '2024-08-15', 
        false,
        'GPU 클러스터 기반 딥러닝 환경 구축',
        '2024-08-15', 
        '2024-08-15'
      )
    `);

    const proposal4 = await sequelize.query("SELECT currval('proposals_id_seq') as id");
    const proposalId4 = proposal4[0][0].id;

    await sequelize.query(`
      INSERT INTO service_items (
        proposal_id, item, name, personnel, skill_level, period, monthly_rate, 
        contract_amount, supplier, credit_rating, created_at, updated_at
      ) VALUES 
        (${proposalId4}, 'AI 플랫폼 아키텍처 설계', '최아키텍트', '최아키텍트', 'senior', 8, 12000000, 96000000, 'NVIDIA Korea', 'A', NOW(), NOW()),
        (${proposalId4}, 'MLOps 플랫폼 구축', '정엠엘옵스', '정엠엘옵스', 'senior', 12, 9000000, 108000000, 'NVIDIA Korea', 'A', NOW(), NOW()),
        (${proposalId4}, '데이터 파이프라인 구축', '김데이터', '김데이터', 'senior', 10, 7500000, 75000000, 'NVIDIA Korea', 'A', NOW(), NOW()),
        (${proposalId4}, 'AI 모델 개발 지원', '이에이아이', '이에이아이', 'middle', 14, 6000000, 84000000, 'NVIDIA Korea', 'B', NOW(), NOW()),
        (${proposalId4}, '운영 지원', '박운영', '박운영', 'middle', 12, 4750000, 57000000, 'NVIDIA Korea', 'B', NOW(), NOW())
    `);

    // 5. 2025년 구매계약 - 클라우드 네이티브
    await sequelize.query(`
      INSERT INTO proposals (
        contract_type, purpose, basis, budget_id, contract_method, 
        account_subject, total_amount, status, created_by, proposal_date, 
        is_draft, other, created_at, updated_at
      ) VALUES (
        'purchase', 
        '2025년 클라우드 네이티브 인프라 전환', 
        'Kubernetes 기반 컨테이너 플랫폼 구축 및 마이크로서비스 아키텍처 전환', 
        5, 
        'general', 
        '클라우드인프라비', 
        580000000, 
        'draft', 
        '시스템관리자', 
        '2025-01-10', 
        true,
        'Red Hat OpenShift 기반 하이브리드 클라우드 구축',
        '2025-01-10', 
        '2025-01-10'
      )
    `);

    const proposal5 = await sequelize.query("SELECT currval('proposals_id_seq') as id");
    const proposalId5 = proposal5[0][0].id;

    await sequelize.query(`
      INSERT INTO purchase_items (
        proposal_id, item, product_name, quantity, unit_price, amount, 
        supplier, contract_period_type, created_at, updated_at
      ) VALUES 
        (${proposalId5}, '신규', 'Red Hat OpenShift Platform Plus', 100, 2500000, 250000000, 'Red Hat Korea', '3years', NOW(), NOW()),
        (${proposalId5}, '신규', 'VMware vSphere 8 Enterprise Plus', 20, 8000000, 160000000, 'VMware Korea', '3years', NOW(), NOW()),
        (${proposalId5}, '전산기구비품', 'Dell PowerEdge R760 Server', 12, 14000000, 168000000, 'Dell Technologies Korea', '3years', NOW(), NOW())
    `);

    // 6. 2025년 용역계약 - IoT 플랫폼
    await sequelize.query(`
      INSERT INTO proposals (
        contract_type, purpose, basis, budget_id, contract_method, 
        account_subject, total_amount, status, created_by, proposal_date, 
        is_draft, other, created_at, updated_at
      ) VALUES (
        'service', 
        '2025년 디지털 트윈 플랫폼 구축 및 IoT 통합 관리', 
        '스마트 팩토리 구현 및 실시간 모니터링 시스템 구축', 
        6, 
        'limited', 
        'IoT플랫폼구축비', 
        680000000, 
        'draft', 
        '시스템관리자', 
        '2025-02-01', 
        true,
        'AWS IoT Core 기반 대규모 센서 데이터 처리',
        '2025-02-01', 
        '2025-02-01'
      )
    `);

    const proposal6 = await sequelize.query("SELECT currval('proposals_id_seq') as id");
    const proposalId6 = proposal6[0][0].id;

    await sequelize.query(`
      INSERT INTO service_items (
        proposal_id, item, name, personnel, skill_level, period, monthly_rate, 
        contract_amount, supplier, credit_rating, created_at, updated_at
      ) VALUES 
        (${proposalId6}, 'IoT 플랫폼 아키텍처 설계', '김아이오티', '김아이오티', 'senior', 10, 15000000, 150000000, 'AWS Korea', 'A', NOW(), NOW()),
        (${proposalId6}, '디지털 트윈 모델링', '이트윈', '이트윈', 'senior', 12, 12000000, 144000000, 'AWS Korea', 'A', NOW(), NOW()),
        (${proposalId6}, 'IoT 센서 데이터 수집 시스템', '박센서', '박센서', 'senior', 14, 8500000, 119000000, 'AWS Korea', 'A', NOW(), NOW()),
        (${proposalId6}, '실시간 분석 대시보드', '정대시보드', '정대시보드', 'senior', 8, 7000000, 56000000, 'AWS Korea', 'A', NOW(), NOW()),
        (${proposalId6}, '예측 분석 엔진', '최예측', '최예측', 'senior', 10, 9000000, 90000000, 'AWS Korea', 'A', NOW(), NOW()),
        (${proposalId6}, '시스템 통합 및 운영', '한통합', '한통합', 'middle', 16, 7600000, 121000000, 'AWS Korea', 'B', NOW(), NOW())
    `);

    console.log('\n✅ 새로운 샘플 품의서 생성 완료!');
    
    // 생성된 품의서 통계
    const stats = await Promise.all([
      sequelize.query("SELECT COUNT(*) as count FROM proposals WHERE contract_type = 'purchase'"),
      sequelize.query("SELECT COUNT(*) as count FROM proposals WHERE contract_type = 'service'"),
      sequelize.query("SELECT COUNT(*) as count FROM purchase_items"),
      sequelize.query("SELECT COUNT(*) as count FROM service_items")
    ]);

    console.log('\n📊 생성된 데이터 통계:');
    console.log(`   - 구매계약: ${stats[0][0][0].count}개`);
    console.log(`   - 용역계약: ${stats[1][0][0].count}개`);
    console.log(`   - 구매품목: ${stats[2][0][0].count}개`);
    console.log(`   - 용역항목: ${stats[3][0][0].count}개`);

    // 연도별 통계
    const yearStats = await sequelize.query(`
      SELECT 
        EXTRACT(YEAR FROM proposal_date::date) as year,
        contract_type,
        COUNT(*) as count,
        SUM(total_amount) as total_amount
      FROM proposals 
      GROUP BY EXTRACT(YEAR FROM proposal_date::date), contract_type 
      ORDER BY year, contract_type
    `);

    console.log('\n📅 연도별 통계:');
    yearStats[0].forEach(stat => {
      console.log(`   - ${stat.year}년 ${stat.contract_type}: ${stat.count}개, 총 ${parseInt(stat.total_amount).toLocaleString()}원`);
    });

    console.log('\n🎉 샘플 데이터 생성이 완료되었습니다!');
    
  } catch (error) {
    console.error('❌ 샘플 데이터 생성 중 오류 발생:', error);
  } finally {
    await sequelize.close();
  }
}

// 스크립트 실행
if (require.main === module) {
  createSimpleSamples();
}

module.exports = createSimpleSamples; 