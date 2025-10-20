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

// 모델 로드
const models = require('../../src/models');

// 2023-2025년 다양한 품의서 샘플 데이터
const sampleProposals = [
  // 2023년 구매계약 샘플들
  {
    contractType: 'purchase',
    purpose: '2023년 차세대 서버 인프라 구축',
    basis: '디지털 전환 가속화 및 클라우드 마이그레이션 계획',
    budgetId: 1,
    contractMethod: 'general',
    accountSubject: 'IT인프라구축비',
    totalAmount: 250000000,
    status: 'approved',
    other: '긴급 도입이 필요한 미션 크리티컬 시스템',
    createdAt: '2023-03-15',
    proposalDate: '2023-03-15',
    approvalDate: '2023-03-25',
    requestDepartments: ['IT팀', '기획팀'],
    purchaseItems: [
      {
        item: '신규',
        productName: 'HPE ProLiant DL380 Gen10 Plus',
        quantity: 8,
        unitPrice: 18000000,
        amount: 144000000,
        supplier: 'HPE Korea',
        contractPeriodType: '3years',
        costAllocation: {
          type: 'percentage',
          allocations: [
            { department: 'IT팀', type: 'percentage', value: 60 },
            { department: '기획팀', type: 'percentage', value: 40 }
          ]
        }
      },
      {
        item: '신규',
        productName: 'NetApp AFF A400',
        quantity: 2,
        unitPrice: 35000000,
        amount: 70000000,
        supplier: 'NetApp Korea',
        contractPeriodType: '3years',
        costAllocation: {
          type: 'percentage',
          allocations: [
            { department: 'IT팀', type: 'percentage', value: 100 }
          ]
        }
      },
      {
        item: '기존',
        productName: 'Cisco Nexus 9000 Series',
        quantity: 4,
        unitPrice: 9000000,
        amount: 36000000,
        supplier: 'Cisco Systems Korea',
        costAllocation: {
          type: 'percentage',
          allocations: [
            { department: 'IT팀', type: 'percentage', value: 100 }
          ]
        }
      }
    ]
  },

  // 2023년 용역계약 샘플
  {
    contractType: 'service',
    purpose: '2023년 ERP 시스템 구축 및 운영 지원',
    basis: '업무 프로세스 디지털화 및 효율성 증대',
    budgetId: 2,
    contractMethod: 'limited',
    accountSubject: 'ERP구축비',
    totalAmount: 180000000,
    status: 'approved',
    other: 'SAP 기반 ERP 시스템 구축',
    createdAt: '2023-05-10',
    proposalDate: '2023-05-10',
    approvalDate: '2023-05-20',
    requestDepartments: ['IT팀', '재무팀', '인사팀'],
    serviceItems: [
      {
        item: 'ERP 구축 컨설팅',
        name: '김시스템',
        skillLevel: 'senior',
        period: 12,
        monthlyRate: 8000000,
        contractAmount: 96000000,
        supplier: 'SAP Korea',
        creditRating: 'A',
        costAllocation: {
          type: 'percentage',
          allocations: [
            { department: 'IT팀', type: 'percentage', value: 50 },
            { department: '재무팀', type: 'percentage', value: 30 },
            { department: '인사팀', type: 'percentage', value: 20 }
          ]
        }
      },
      {
        item: 'ERP 개발',
        name: '이개발',
        skillLevel: 'senior',
        period: 10,
        monthlyRate: 5500000,
        contractAmount: 55000000,
        supplier: 'SAP Korea',
        creditRating: 'A',
        costAllocation: {
          type: 'percentage',
          allocations: [
            { department: 'IT팀', type: 'percentage', value: 70 },
            { department: '재무팀', type: 'percentage', value: 30 }
          ]
        }
      },
      {
        item: 'ERP 테스팅',
        name: '박테스트',
        skillLevel: 'middle',
        period: 6,
        monthlyRate: 4800000,
        contractAmount: 29000000,
        supplier: 'SAP Korea',
        creditRating: 'B',
        costAllocation: {
          type: 'percentage',
          allocations: [
            { department: 'IT팀', type: 'percentage', value: 100 }
          ]
        }
      }
    ]
  },

  // 2024년 구매계약 샘플
  {
    contractType: 'purchase',
    purpose: '2024년 보안 인프라 강화 프로젝트',
    basis: '사이버 보안 위협 대응 및 정보보호 체계 구축',
    budgetId: 3,
    contractMethod: 'negotiation',
    accountSubject: '정보보안비',
    totalAmount: 320000000,
    status: 'approved',
    other: '국정원 보안 가이드라인 준수 필요',
    createdAt: '2024-02-20',
    proposalDate: '2024-02-20',
    approvalDate: '2024-03-05',
    requestDepartments: ['IT팀', '보안팀'],
    purchaseItems: [
      {
        item: '신규',
        productName: 'Palo Alto PA-5250 Firewall',
        quantity: 4,
        unitPrice: 45000000,
        amount: 180000000,
        supplier: 'Palo Alto Networks Korea',
        contractPeriodType: '3years',
        costAllocation: {
          type: 'percentage',
          allocations: [
            { department: 'IT팀', type: 'percentage', value: 60 },
            { department: '보안팀', type: 'percentage', value: 40 }
          ]
        }
      },
      {
        item: '신규',
        productName: 'Splunk Enterprise Security',
        quantity: 1,
        unitPrice: 80000000,
        amount: 80000000,
        supplier: 'Splunk Korea',
        contractPeriodType: '2years',
        costAllocation: {
          type: 'percentage',
          allocations: [
            { department: '보안팀', type: 'percentage', value: 80 },
            { department: 'IT팀', type: 'percentage', value: 20 }
          ]
        }
      },
      {
        item: '소프트웨어',
        productName: 'CrowdStrike Falcon Platform',
        quantity: 500,
        unitPrice: 120000,
        amount: 60000000,
        supplier: 'CrowdStrike Korea',
        contractPeriodType: '1year',
        costAllocation: {
          type: 'percentage',
          allocations: [
            { department: '보안팀', type: 'percentage', value: 100 }
          ]
        }
      }
    ]
  },

  // 2024년 용역계약 샘플
  {
    contractType: 'service',
    purpose: '2024년 AI/ML 플랫폼 구축 및 데이터 분석 지원',
    basis: '데이터 기반 의사결정 체계 구축 및 AI 역량 강화',
    budgetId: 4,
    contractMethod: 'designation',
    accountSubject: 'AI플랫폼구축비',
    totalAmount: 420000000,
    status: 'submitted',
    other: 'GPU 클러스터 기반 딥러닝 환경 구축',
    createdAt: '2024-08-15',
    proposalDate: '2024-08-15',
    requestDepartments: ['IT팀', '데이터분석팀', '연구소'],
    serviceItems: [
      {
        item: 'AI 플랫폼 아키텍처 설계',
        name: '최아키텍트',
        skillLevel: 'senior',
        period: 8,
        monthlyRate: 12000000,
        contractAmount: 96000000,
        supplier: 'NVIDIA Korea',
        creditRating: 'A',
        costAllocation: {
          type: 'percentage',
          allocations: [
            { department: 'IT팀', type: 'percentage', value: 50 },
            { department: '데이터분석팀', type: 'percentage', value: 30 },
            { department: '연구소', type: 'percentage', value: 20 }
          ]
        }
      },
      {
        item: 'MLOps 플랫폼 구축',
        name: '정엠엘옵스',
        skillLevel: '고급',
        period: 12,
        monthlyRate: 9000000,
        contractAmount: 108000000,
        supplier: 'NVIDIA Korea',
        costAllocation: {
          type: 'percentage',
          allocations: [
            { department: '데이터분석팀', type: 'percentage', value: 60 },
            { department: 'IT팀', type: 'percentage', value: 40 }
          ]
        }
      },
      {
        item: '데이터 파이프라인 구축',
        name: '김데이터',
        skillLevel: '고급',
        period: 10,
        monthlyRate: 7500000,
        contractAmount: 75000000,
        supplier: 'NVIDIA Korea',
        costAllocation: {
          type: 'percentage',
          allocations: [
            { department: '데이터분석팀', type: 'percentage', value: 70 },
            { department: '연구소', type: 'percentage', value: 30 }
          ]
        }
      },
      {
        item: 'AI 모델 개발 지원',
        name: '이에이아이',
        skillLevel: '중급',
        period: 14,
        monthlyRate: 6000000,
        contractAmount: 84000000,
        supplier: 'NVIDIA Korea',
        costAllocation: {
          type: 'percentage',
          allocations: [
            { department: '연구소', type: 'percentage', value: 80 },
            { department: '데이터분석팀', type: 'percentage', value: 20 }
          ]
        }
      },
      {
        item: '운영 지원',
        name: '박운영',
        skillLevel: '중급',
        period: 12,
        monthlyRate: 4750000,
        contractAmount: 57000000,
        supplier: 'NVIDIA Korea',
        costAllocation: {
          type: 'percentage',
          allocations: [
            { department: 'IT팀', type: 'percentage', value: 100 }
          ]
        }
      }
    ]
  },

  // 2025년 구매계약 샘플
  {
    contractType: 'purchase',
    purpose: '2025년 클라우드 네이티브 인프라 전환',
    basis: 'Kubernetes 기반 컨테이너 플랫폼 구축 및 마이크로서비스 아키텍처 전환',
    budgetId: 5,
    contractMethod: 'general',
    accountSubject: '클라우드인프라비',
    totalAmount: 580000000,
    status: 'draft',
    other: 'Red Hat OpenShift 기반 하이브리드 클라우드 구축',
    createdAt: '2025-01-10',
    proposalDate: '2025-01-10',
    requestDepartments: ['IT팀', '개발팀', 'DevOps팀'],
    purchaseItems: [
      {
        item: '신규',
        productName: 'Red Hat OpenShift Platform Plus',
        quantity: 100,
        unitPrice: 2500000,
        amount: 250000000,
        supplier: 'Red Hat Korea',
        contractPeriodType: '3years',
        costAllocation: {
          type: 'percentage',
          allocations: [
            { department: 'IT팀', type: 'percentage', value: 40 },
            { department: '개발팀', type: 'percentage', value: 35 },
            { department: 'DevOps팀', type: 'percentage', value: 25 }
          ]
        }
      },
      {
        item: '신규',
        productName: 'VMware vSphere 8 Enterprise Plus',
        quantity: 20,
        unitPrice: 8000000,
        amount: 160000000,
        supplier: 'VMware Korea',
        contractPeriodType: '3years',
        costAllocation: {
          type: 'percentage',
          allocations: [
            { department: 'IT팀', type: 'percentage', value: 70 },
            { department: 'DevOps팀', type: 'percentage', value: 30 }
          ]
        }
      },
      {
        item: '전산기구비품',
        productName: 'Dell PowerEdge R760 Server',
        quantity: 12,
        unitPrice: 14000000,
        amount: 168000000,
        supplier: 'Dell Technologies Korea',
        contractPeriodType: '3years',
        costAllocation: {
          type: 'percentage',
          allocations: [
            { department: 'IT팀', type: 'percentage', value: 60 },
            { department: 'DevOps팀', type: 'percentage', value: 40 }
          ]
        }
      }
    ]
  },

  // 2025년 용역계약 샘플
  {
    contractType: 'service',
    purpose: '2025년 디지털 트윈 플랫폼 구축 및 IoT 통합 관리',
    basis: '스마트 팩토리 구현 및 실시간 모니터링 시스템 구축',
    budgetId: 6,
    contractMethod: 'limited',
    accountSubject: 'IoT플랫폼구축비',
    totalAmount: 680000000,
    status: 'draft',
    other: 'AWS IoT Core 기반 대규모 센서 데이터 처리',
    createdAt: '2025-02-01',
    proposalDate: '2025-02-01',
    requestDepartments: ['IT팀', '생산팀', '품질관리팀', '연구소'],
    serviceItems: [
      {
        item: 'IoT 플랫폼 아키텍처 설계',
        name: '김아이오티',
        skillLevel: 'SA',
        period: 10,
        monthlyRate: 15000000,
        contractAmount: 150000000,
        supplier: 'AWS Korea',
        costAllocation: {
          type: 'percentage',
          allocations: [
            { department: 'IT팀', type: 'percentage', value: 40 },
            { department: '생산팀', type: 'percentage', value: 30 },
            { department: '연구소', type: 'percentage', value: 30 }
          ]
        }
      },
      {
        item: '디지털 트윈 모델링',
        name: '이트윈',
        skillLevel: 'SA',
        period: 12,
        monthlyRate: 12000000,
        contractAmount: 144000000,
        supplier: 'AWS Korea',
        costAllocation: {
          type: 'percentage',
          allocations: [
            { department: '생산팀', type: 'percentage', value: 50 },
            { department: '품질관리팀', type: 'percentage', value: 30 },
            { department: '연구소', type: 'percentage', value: 20 }
          ]
        }
      },
      {
        item: 'IoT 센서 데이터 수집 시스템',
        name: '박센서',
        skillLevel: '고급',
        period: 14,
        monthlyRate: 8500000,
        contractAmount: 119000000,
        supplier: 'AWS Korea',
        costAllocation: {
          type: 'percentage',
          allocations: [
            { department: '생산팀', type: 'percentage', value: 60 },
            { department: 'IT팀', type: 'percentage', value: 40 }
          ]
        }
      },
      {
        item: '실시간 분석 대시보드',
        name: '정대시보드',
        skillLevel: '고급',
        period: 8,
        monthlyRate: 7000000,
        contractAmount: 56000000,
        supplier: 'AWS Korea',
        costAllocation: {
          type: 'percentage',
          allocations: [
            { department: '품질관리팀', type: 'percentage', value: 70 },
            { department: '생산팀', type: 'percentage', value: 30 }
          ]
        }
      },
      {
        item: '예측 분석 엔진',
        name: '최예측',
        skillLevel: '고급',
        period: 10,
        monthlyRate: 9000000,
        contractAmount: 90000000,
        supplier: 'AWS Korea',
        costAllocation: {
          type: 'percentage',
          allocations: [
            { department: '연구소', type: 'percentage', value: 60 },
            { department: '품질관리팀', type: 'percentage', value: 40 }
          ]
        }
      },
      {
        item: '시스템 통합 및 운영',
        name: '한통합',
        skillLevel: '중급',
        period: 16,
        monthlyRate: 7600000,
        contractAmount: 121000000,
        supplier: 'AWS Korea',
        costAllocation: {
          type: 'percentage',
          allocations: [
            { department: 'IT팀', type: 'percentage', value: 80 },
            { department: '생산팀', type: 'percentage', value: 20 }
          ]
        }
      }
    ]
  },

  // 변경계약 샘플
  {
    contractType: 'change',
    purpose: '2024년 ERP 시스템 기능 확장 및 모듈 추가',
    basis: '업무 프로세스 변경에 따른 시스템 기능 확장 필요',
    budgetId: 7,
    contractMethod: 'negotiation',
    accountSubject: 'ERP확장비',
    totalAmount: 120000000,
    status: 'approved',
    other: '기존 ERP 시스템 대비 30% 기능 확장',
    changeReason: '새로운 사업부 신설에 따른 회계 모듈 및 인사 모듈 확장 필요',
    createdAt: '2024-09-15',
    proposalDate: '2024-09-15',
    approvalDate: '2024-09-25',
    requestDepartments: ['IT팀', '재무팀', '인사팀', '신사업팀'],
    beforeItems: [
      {
        item: 'ERP 기본 모듈',
        productName: 'SAP ERP 6.0 기본 패키지',
        quantity: 1,
        unitPrice: 180000000,
        amount: 180000000,
        supplier: 'SAP Korea'
      }
    ],
    afterItems: [
      {
        item: 'ERP 확장 모듈',
        productName: 'SAP ERP 6.0 확장 패키지 + 신사업부 모듈',
        quantity: 1,
        unitPrice: 300000000,
        amount: 300000000,
        supplier: 'SAP Korea'
      }
    ]
  },

  // 연장계약 샘플
  {
    contractType: 'extension',
    purpose: '2024년 IT 인프라 유지보수 서비스 연장',
    basis: '안정적인 IT 서비스 운영 지속을 위한 유지보수 계약 연장',
    budgetId: 8,
    contractMethod: 'negotiation',
    accountSubject: 'IT유지보수비',
    totalAmount: 150000000,
    status: 'approved',
    other: '24시간 모니터링 및 장애 대응 서비스 포함',
    extensionReason: '기존 유지보수 계약 만료에 따른 1년 연장 (2024.12.31 → 2025.12.31)',
    createdAt: '2024-11-01',
    proposalDate: '2024-11-01',
    approvalDate: '2024-11-15',
    requestDepartments: ['IT팀'],
    beforeItems: [
      {
        item: 'IT 인프라 유지보수',
        productName: '서버/네트워크/스토리지 통합 유지보수',
        quantity: 1,
        unitPrice: 150000000,
        amount: 150000000,
        supplier: 'HPE Korea',
        period: '2023.01.01 ~ 2024.12.31'
      }
    ],
    afterItems: [
      {
        item: 'IT 인프라 유지보수 연장',
        productName: '서버/네트워크/스토리지 통합 유지보수 (연장)',
        quantity: 1,
        unitPrice: 150000000,
        amount: 150000000,
        supplier: 'HPE Korea',
        period: '2025.01.01 ~ 2025.12.31'
      }
    ]
  }
];

async function createNewSampleProposals() {
  try {
    console.log('🔍 데이터베이스 연결 확인...');
    await sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공!');

    // 기존 품의서 데이터 삭제 (외래키 제약조건 고려한 순서)
    console.log('\n🗑️ 기존 품의서 데이터 삭제 중...');
    
    try {
      // 1. 비용분배 관련 테이블 먼저 삭제 (테이블이 존재하는 경우에만)
      const tables = ['cost_allocations', 'service_cost_allocations', 'cost_departments', 'proposal_departments', 'proposal_history'];
      for (const table of tables) {
        try {
          await sequelize.query(`DELETE FROM ${table}`);
        } catch (error) {
          // 테이블이 존재하지 않으면 무시
          if (error.original?.code !== '42P01') {
            throw error;
          }
        }
      }
      
      // 2. 품목 테이블 삭제
      await models.PurchaseItem.destroy({ where: {} });
      await models.ServiceItem.destroy({ where: {} });
      
      // 3. 변경/연장 계약 품목 삭제
      try {
        await models.BeforeItem.destroy({ where: {} });
        await models.AfterItem.destroy({ where: {} });
      } catch (error) {
        // 테이블이 존재하지 않으면 무시
        if (error.name !== 'SequelizeDatabaseError') {
          throw error;
        }
      }
      
      // 4. 기타 관련 테이블 삭제
      await models.ApprovalLine.destroy({ where: {} });
      
      // 5. 마지막으로 품의서 테이블 삭제
      await models.Proposal.destroy({ where: {} });
      
      console.log('✅ 기존 데이터 삭제 완료!');
    } catch (error) {
      console.log('⚠️ 일부 데이터 삭제 중 오류 발생 (계속 진행):', error.message);
    }

    console.log('\n📝 새로운 샘플 품의서 생성 중...');
    
    for (let i = 0; i < sampleProposals.length; i++) {
      const proposalData = sampleProposals[i];
      
      console.log(`  ${i + 1}. ${proposalData.purpose}`);
      
      // 품의서 생성
      const proposal = await models.Proposal.create({
        contractType: proposalData.contractType,
        purpose: proposalData.purpose,
        basis: proposalData.basis,
        budgetId: proposalData.budgetId,
        contractMethod: proposalData.contractMethod,
        accountSubject: proposalData.accountSubject,
        totalAmount: proposalData.totalAmount,
        changeReason: proposalData.changeReason,
        extensionReason: proposalData.extensionReason,
        other: proposalData.other,
        status: proposalData.status,
        isDraft: proposalData.status === 'draft',
        createdBy: '시스템관리자',
        proposalDate: proposalData.proposalDate,
        approvalDate: proposalData.approvalDate,
        createdAt: proposalData.createdAt,
        updatedAt: proposalData.createdAt
      });

      // 요청부서는 나중에 추가 (테이블이 준비되면)

      // 구매품목 생성
      if (proposalData.purchaseItems) {
        for (const item of proposalData.purchaseItems) {
          const purchaseItem = await models.PurchaseItem.create({
            proposalId: proposal.id,
            item: item.item,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            amount: item.amount,
            supplier: item.supplier,
            contractPeriodType: item.contractPeriodType,
            contractStartDate: item.contractStartDate,
            contractEndDate: item.contractEndDate
          });

          // 비용분배 정보는 나중에 추가 (테이블이 준비되면)
        }
      }

      // 용역품목 생성
      if (proposalData.serviceItems) {
        for (const item of proposalData.serviceItems) {
          const serviceItem = await models.ServiceItem.create({
            proposalId: proposal.id,
            item: item.item,
            name: item.name,
            personnel: item.name, // personnel 필드도 추가
            skillLevel: item.skillLevel || 'middle',
            period: item.period,
            monthlyRate: item.monthlyRate,
            contractAmount: item.contractAmount,
            supplier: item.supplier,
            creditRating: item.creditRating || 'B'
          });

          // 비용분배 정보는 나중에 추가 (테이블이 준비되면)
        }
      }

      // 변경 전 품목 (변경계약용)
      if (proposalData.beforeItems) {
        for (const item of proposalData.beforeItems) {
          await models.BeforeItem.create({
            proposalId: proposal.id,
            item: item.item,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            amount: item.amount,
            supplier: item.supplier,
            period: item.period
          });
        }
      }

      // 변경 후 품목 (변경계약용)
      if (proposalData.afterItems) {
        for (const item of proposalData.afterItems) {
          await models.AfterItem.create({
            proposalId: proposal.id,
            item: item.item,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            amount: item.amount,
            supplier: item.supplier,
            period: item.period
          });
        }
      }
    }

    console.log(`\n✅ 총 ${sampleProposals.length}개의 새로운 샘플 품의서 생성 완료!`);
    
    // 생성된 품의서 통계
    const stats = await Promise.all([
      models.Proposal.count({ where: { contractType: 'purchase' } }),
      models.Proposal.count({ where: { contractType: 'service' } }),
      models.Proposal.count({ where: { contractType: 'change' } }),
      models.Proposal.count({ where: { contractType: 'extension' } }),
      models.PurchaseItem.count(),
      models.ServiceItem.count()
    ]);

    console.log('\n📊 생성된 데이터 통계:');
    console.log(`   - 구매계약: ${stats[0]}개`);
    console.log(`   - 용역계약: ${stats[1]}개`);
    console.log(`   - 변경계약: ${stats[2]}개`);
    console.log(`   - 연장계약: ${stats[3]}개`);
    console.log(`   - 구매품목: ${stats[4]}개`);
    console.log(`   - 용역항목: ${stats[5]}개`);

    console.log('\n🎉 샘플 데이터 생성이 완료되었습니다!');
    
  } catch (error) {
    console.error('❌ 샘플 데이터 생성 중 오류 발생:', error);
  } finally {
    await sequelize.close();
  }
}

// 스크립트 실행
if (require.main === module) {
  createNewSampleProposals();
}

module.exports = createNewSampleProposals; 