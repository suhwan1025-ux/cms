const { Sequelize, DataTypes } = require('sequelize');
const config = require('../../config/database.js').development;

const sequelize = new Sequelize(config.database, config.username, config.password, config);

const Proposal = require('../../src/models/Proposal')(sequelize, DataTypes);
const PurchaseItem = require('../../src/models/PurchaseItem')(sequelize, DataTypes);
const ServiceItem = require('../../src/models/ServiceItem')(sequelize, DataTypes);
const Supplier = require('../../src/models/Supplier')(sequelize, DataTypes);

async function create2025_2026Samples() {
  try {
    console.log('🎯 2025년, 2026년 사업예산별 품의서 샘플 생성...');
    
    // 공급업체 조회
    const suppliers = await Supplier.findAll();
    console.log('공급업체 수:', suppliers.length);
    
    // 2025년 사업예산별 품의서 생성
    console.log('\n=== 2025년 사업예산 품의서 생성 ===');
    
    // 1. 2025년 AI 시스템 도입 (ID: 4)
    const ai2025_1 = await Proposal.create({
      contractType: 'purchase',
      purpose: '2025년 AI 시스템 도입을 위한 AI 서버 구매',
      basis: 'AI 기술 도입 계획에 따른 고성능 AI 서버 구매',
      budgetId: 4,
      contractMethod: '일괄계약',
      accountSubject: 'AI장비 구매비',
      totalAmount: 200000000,
      status: 'approved',
      createdBy: '김AI',
      proposalDate: '2025-01-15',
      approvalDate: '2025-01-20',
      contractStartDate: '2025-02-01',
      contractEndDate: '2025-12-31'
    });
    
    await PurchaseItem.bulkCreate([
      {
        proposalId: ai2025_1.id,
        item: 'AI서버',
        productName: 'NVIDIA DGX A100',
        quantity: 2,
        unitPrice: 80000000,
        supplierId: suppliers[0].id,
        supplier: suppliers[0].name,
        contractPeriodType: 'permanent',
        contractStartDate: '2025-02-01',
        contractEndDate: null
      },
      {
        proposalId: ai2025_1.id,
        item: 'GPU',
        productName: 'NVIDIA A100 GPU',
        quantity: 8,
        unitPrice: 5000000,
        supplierId: suppliers[0].id,
        supplier: suppliers[0].name,
        contractPeriodType: 'permanent',
        contractStartDate: '2025-02-01',
        contractEndDate: null
      }
    ]);
    
    console.log('✅ 2025년 AI 시스템 도입 품의서 1 생성 완료');
    
    // 2. 2025년 AI 시스템 도입 (ID: 4) - 추가 품의서
    const ai2025_2 = await Proposal.create({
      contractType: 'service',
      purpose: '2025년 AI 시스템 구축 및 운영 지원',
      basis: 'AI 시스템 구축을 위한 전문 개발팀 용역',
      budgetId: 4,
      contractMethod: '일괄계약',
      accountSubject: 'AI개발 용역비',
      totalAmount: 150000000,
      status: 'approved',
      createdBy: '이AI개발',
      proposalDate: '2025-03-01',
      approvalDate: '2025-03-05',
      contractStartDate: '2025-04-01',
      contractEndDate: '2025-12-31',
      paymentMethod: 'monthly'
    });
    
    await ServiceItem.bulkCreate([
      {
        proposalId: ai2025_2.id,
        item: 'AI개발',
        personnel: 4,
        skillLevel: 'senior',
        period: 9,
        monthlyRate: 4000000,
        supplierId: suppliers[2].id,
        supplier: suppliers[2].name,
        creditRating: 'A'
      },
      {
        proposalId: ai2025_2.id,
        item: '데이터 사이언스',
        personnel: 2,
        skillLevel: 'senior',
        period: 9,
        monthlyRate: 3500000,
        supplierId: suppliers[2].id,
        supplier: suppliers[2].name,
        creditRating: 'A'
      }
    ]);
    
    console.log('✅ 2025년 AI 시스템 도입 품의서 2 생성 완료');
    
    // 3. 2025년 클라우드 마이그레이션 (ID: 5)
    const cloud2025 = await Proposal.create({
      contractType: 'service',
      purpose: '2025년 클라우드 마이그레이션 프로젝트',
      basis: '온프레미스에서 클라우드로의 시스템 마이그레이션',
      budgetId: 5,
      contractMethod: '일괄계약',
      accountSubject: '클라우드 마이그레이션비',
      totalAmount: 300000000,
      status: 'approved',
      createdBy: '박클라우드',
      proposalDate: '2025-02-10',
      approvalDate: '2025-02-15',
      contractStartDate: '2025-03-01',
      contractEndDate: '2025-11-30',
      paymentMethod: 'monthly'
    });
    
    await ServiceItem.bulkCreate([
      {
        proposalId: cloud2025.id,
        item: '클라우드 마이그레이션',
        personnel: 6,
        skillLevel: 'senior',
        period: 9,
        monthlyRate: 5000000,
        supplierId: suppliers[2].id,
        supplier: suppliers[2].name,
        creditRating: 'A'
      },
      {
        proposalId: cloud2025.id,
        item: '클라우드 아키텍처',
        personnel: 2,
        skillLevel: 'senior',
        period: 6,
        monthlyRate: 4000000,
        supplierId: suppliers[2].id,
        supplier: suppliers[2].name,
        creditRating: 'A'
      }
    ]);
    
    console.log('✅ 2025년 클라우드 마이그레이션 품의서 생성 완료');
    
    // 4. 2025년 전산 운영비 (ID: 6)
    const operation2025 = await Proposal.create({
      contractType: 'purchase',
      purpose: '2025년 전산 운영비 - 소프트웨어 라이선스 구매',
      basis: '전산 시스템 운영을 위한 소프트웨어 라이선스 구매',
      budgetId: 6,
      contractMethod: '일괄계약',
      accountSubject: '소프트웨어 라이선스비',
      totalAmount: 80000000,
      status: 'approved',
      createdBy: '최운영',
      proposalDate: '2025-01-05',
      approvalDate: '2025-01-10',
      contractStartDate: '2025-02-01',
      contractEndDate: '2025-12-31'
    });
    
    await PurchaseItem.bulkCreate([
      {
        proposalId: operation2025.id,
        item: '소프트웨어 라이선스',
        productName: 'Microsoft Office 365',
        quantity: 100,
        unitPrice: 500000,
        supplierId: suppliers[1].id,
        supplier: suppliers[1].name,
        contractPeriodType: '1year',
        contractStartDate: '2025-02-01',
        contractEndDate: '2026-01-31'
      },
      {
        proposalId: operation2025.id,
        item: '소프트웨어 라이선스',
        productName: 'Adobe Creative Suite',
        quantity: 20,
        unitPrice: 1500000,
        supplierId: suppliers[1].id,
        supplier: suppliers[1].name,
        contractPeriodType: '1year',
        contractStartDate: '2025-02-01',
        contractEndDate: '2026-01-31'
      }
    ]);
    
    console.log('✅ 2025년 전산 운영비 품의서 생성 완료');
    
    // 5. 전산기구비품 구매 (ID: 9)
    const equipment2025 = await Proposal.create({
      contractType: 'purchase',
      purpose: '2025년 전산기구비품 구매 - 개발장비',
      basis: '개발팀 업무 효율성 향상을 위한 개발장비 구매',
      budgetId: 9,
      contractMethod: '일괄계약',
      accountSubject: '전산기구비품 구매비',
      totalAmount: 120000000,
      status: 'approved',
      createdBy: '정개발',
      proposalDate: '2025-04-01',
      approvalDate: '2025-04-05',
      contractStartDate: '2025-05-01',
      contractEndDate: '2025-12-31'
    });
    
    await PurchaseItem.bulkCreate([
      {
        proposalId: equipment2025.id,
        item: '개발장비',
        productName: 'MacBook Pro 16인치',
        quantity: 15,
        unitPrice: 3000000,
        supplierId: suppliers[0].id,
        supplier: suppliers[0].name,
        contractPeriodType: 'permanent',
        contractStartDate: '2025-05-01',
        contractEndDate: null
      },
      {
        proposalId: equipment2025.id,
        item: '모니터',
        productName: 'LG 27인치 4K 모니터',
        quantity: 30,
        unitPrice: 2500000,
        supplierId: suppliers[1].id,
        supplier: suppliers[1].name,
        contractPeriodType: 'permanent',
        contractStartDate: '2025-05-01',
        contractEndDate: null
      }
    ]);
    
    console.log('✅ 2025년 전산기구비품 구매 품의서 생성 완료');
    
    // 6. 라이선스 (ID: 11)
    const license2025 = await Proposal.create({
      contractType: 'purchase',
      purpose: '2025년 라이선스 구매 - 데이터베이스 및 개발도구',
      basis: '개발 및 운영을 위한 데이터베이스 및 개발도구 라이선스 구매',
      budgetId: 11,
      contractMethod: '일괄계약',
      accountSubject: '라이선스 구매비',
      totalAmount: 180000000,
      status: 'approved',
      createdBy: '강라이선스',
      proposalDate: '2025-03-15',
      approvalDate: '2025-03-20',
      contractStartDate: '2025-04-01',
      contractEndDate: '2025-12-31'
    });
    
    await PurchaseItem.bulkCreate([
      {
        proposalId: license2025.id,
        item: '데이터베이스 라이선스',
        productName: 'Oracle Database Enterprise',
        quantity: 1,
        unitPrice: 100000000,
        supplierId: suppliers[2].id,
        supplier: suppliers[2].name,
        contractPeriodType: '1year',
        contractStartDate: '2025-04-01',
        contractEndDate: '2026-03-31'
      },
      {
        proposalId: license2025.id,
        item: '개발도구 라이선스',
        productName: 'JetBrains IntelliJ IDEA',
        quantity: 50,
        unitPrice: 1600000,
        supplierId: suppliers[2].id,
        supplier: suppliers[2].name,
        contractPeriodType: '1year',
        contractStartDate: '2025-04-01',
        contractEndDate: '2026-03-31'
      }
    ]);
    
    console.log('✅ 2025년 라이선스 구매 품의서 생성 완료');
    
    // 2026년 사업예산별 품의서 생성
    console.log('\n=== 2026년 사업예산 품의서 생성 ===');
    
    // 1. 2026년 디지털 트랜스포메이션 (ID: 7)
    const dt2026_1 = await Proposal.create({
      contractType: 'service',
      purpose: '2026년 디지털 트랜스포메이션 - 시스템 통합',
      basis: '디지털 전환을 위한 기존 시스템 통합 및 최적화',
      budgetId: 7,
      contractMethod: '일괄계약',
      accountSubject: '시스템 통합 용역비',
      totalAmount: 400000000,
      status: 'approved',
      createdBy: '김디지털',
      proposalDate: '2026-01-10',
      approvalDate: '2026-01-15',
      contractStartDate: '2026-02-01',
      contractEndDate: '2026-12-31',
      paymentMethod: 'monthly'
    });
    
    await ServiceItem.bulkCreate([
      {
        proposalId: dt2026_1.id,
        item: '시스템 통합',
        personnel: 8,
        skillLevel: 'senior',
        period: 11,
        monthlyRate: 4000000,
        supplierId: suppliers[2].id,
        supplier: suppliers[2].name,
        creditRating: 'A'
      },
      {
        proposalId: dt2026_1.id,
        item: '프로세스 개선',
        personnel: 3,
        skillLevel: 'senior',
        period: 8,
        monthlyRate: 3500000,
        supplierId: suppliers[2].id,
        supplier: suppliers[2].name,
        creditRating: 'A'
      }
    ]);
    
    console.log('✅ 2026년 디지털 트랜스포메이션 품의서 1 생성 완료');
    
    // 2. 2026년 디지털 트랜스포메이션 (ID: 7) - 추가 품의서
    const dt2026_2 = await Proposal.create({
      contractType: 'purchase',
      purpose: '2026년 디지털 트랜스포메이션 - 신규 플랫폼 구축',
      basis: '디지털 전환을 위한 신규 플랫폼 구축 장비 구매',
      budgetId: 7,
      contractMethod: '일괄계약',
      accountSubject: '플랫폼 구축비',
      totalAmount: 350000000,
      status: 'approved',
      createdBy: '이플랫폼',
      proposalDate: '2026-02-01',
      approvalDate: '2026-02-05',
      contractStartDate: '2026-03-01',
      contractEndDate: '2026-12-31'
    });
    
    await PurchaseItem.bulkCreate([
      {
        proposalId: dt2026_2.id,
        item: '플랫폼 서버',
        productName: 'IBM Power Systems',
        quantity: 4,
        unitPrice: 60000000,
        supplierId: suppliers[2].id,
        supplier: suppliers[2].name,
        contractPeriodType: 'permanent',
        contractStartDate: '2026-03-01',
        contractEndDate: null
      },
      {
        proposalId: dt2026_2.id,
        item: '스토리지',
        productName: 'EMC VMAX',
        quantity: 2,
        unitPrice: 55000000,
        supplierId: suppliers[0].id,
        supplier: suppliers[0].name,
        contractPeriodType: 'permanent',
        contractStartDate: '2026-03-01',
        contractEndDate: null
      }
    ]);
    
    console.log('✅ 2026년 디지털 트랜스포메이션 품의서 2 생성 완료');
    
    // 3. 2026년 전산 운영비 (ID: 8)
    const operation2026 = await Proposal.create({
      contractType: 'service',
      purpose: '2026년 전산 운영비 - 시스템 모니터링 및 유지보수',
      basis: '전산 시스템 안정적 운영을 위한 모니터링 및 유지보수',
      budgetId: 8,
      contractMethod: '일괄계약',
      accountSubject: '운영 유지보수비',
      totalAmount: 100000000,
      status: 'approved',
      createdBy: '박모니터링',
      proposalDate: '2026-01-20',
      approvalDate: '2026-01-25',
      contractStartDate: '2026-02-01',
      contractEndDate: '2026-12-31',
      paymentMethod: 'monthly'
    });
    
    await ServiceItem.bulkCreate([
      {
        proposalId: operation2026.id,
        item: '시스템 모니터링',
        personnel: 3,
        skillLevel: 'senior',
        period: 11,
        monthlyRate: 2500000,
        supplierId: suppliers[2].id,
        supplier: suppliers[2].name,
        creditRating: 'A'
      },
      {
        proposalId: operation2026.id,
        item: '24/7 운영 지원',
        personnel: 2,
        skillLevel: 'middle',
        period: 11,
        monthlyRate: 2000000,
        supplierId: suppliers[2].id,
        supplier: suppliers[2].name,
        creditRating: 'A'
      }
    ]);
    
    console.log('✅ 2026년 전산 운영비 품의서 생성 완료');
    
    // 4. 전산기구비품 구매 (ID: 10)
    const equipment2026 = await Proposal.create({
      contractType: 'purchase',
      purpose: '2026년 전산기구비품 구매 - 고성능 워크스테이션',
      basis: '고성능 컴퓨팅이 필요한 업무를 위한 워크스테이션 구매',
      budgetId: 10,
      contractMethod: '일괄계약',
      accountSubject: '전산기구비품 구매비',
      totalAmount: 180000000,
      status: 'approved',
      createdBy: '최워크스테이션',
      proposalDate: '2026-03-01',
      approvalDate: '2026-03-05',
      contractStartDate: '2026-04-01',
      contractEndDate: '2026-12-31'
    });
    
    await PurchaseItem.bulkCreate([
      {
        proposalId: equipment2026.id,
        item: '워크스테이션',
        productName: 'Dell Precision 7920',
        quantity: 20,
        unitPrice: 5000000,
        supplierId: suppliers[0].id,
        supplier: suppliers[0].name,
        contractPeriodType: 'permanent',
        contractStartDate: '2026-04-01',
        contractEndDate: null
      },
      {
        proposalId: equipment2026.id,
        item: '고성능 모니터',
        productName: 'Samsung 32인치 4K 모니터',
        quantity: 20,
        unitPrice: 4000000,
        supplierId: suppliers[1].id,
        supplier: suppliers[1].name,
        contractPeriodType: 'permanent',
        contractStartDate: '2026-04-01',
        contractEndDate: null
      }
    ]);
    
    console.log('✅ 2026년 전산기구비품 구매 품의서 생성 완료');
    
    console.log('\n🎉 2025년, 2026년 사업예산별 품의서 샘플 생성 완료!');
    console.log('📊 생성된 품의서:');
    console.log('  - 2025년: 6건');
    console.log('  - 2026년: 4건');
    console.log('  - 총 10건 추가 생성');
    
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
  } finally {
    await sequelize.close();
  }
}

create2025_2026Samples();
