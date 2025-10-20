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

const sampleProposals = [
  {
    contractType: 'purchase',
    purpose: 'IT 인프라 구축을 위한 서버 및 네트워크 장비 구매',
    basis: '2024년 IT 인프라 현대화 계획',
    budgetId: 'IT-2024-001',
    contractMethod: '일반입찰',
    accountSubject: 'IT인프라구축비',
    totalAmount: 150000000,
    status: 'submitted', // draft, submitted, approved, rejected 중 하나
    purchaseItems: [
      {
        item: '서버',
        productName: 'Dell PowerEdge R750',
        quantity: 5,
        unitPrice: 15000000,
        amount: 75000000,
        supplier: 'Dell Korea',
        requestDepartment: 'IT팀'
      },
      {
        item: '네트워크 스위치',
        productName: 'Cisco Catalyst 9300',
        quantity: 10,
        unitPrice: 3000000,
        amount: 30000000,
        supplier: 'Cisco Korea',
        requestDepartment: 'IT팀'
      },
      {
        item: '백업장비',
        productName: 'Synology DiskStation DS1821+',
        quantity: 2,
        unitPrice: 22500000,
        amount: 45000000,
        supplier: 'Synology Korea',
        requestDepartment: 'IT팀'
      }
    ]
  },
  {
    contractType: 'service',
    purpose: '웹 애플리케이션 개발 및 유지보수 서비스',
    basis: '고객 서비스 플랫폼 구축',
    budgetId: 'SW-2024-002',
    contractMethod: '제한입찰',
    accountSubject: '소프트웨어개발비',
    totalAmount: 80000000,
    status: 'submitted', // draft, submitted, approved, rejected 중 하나
    serviceItems: [
      {
        item: '웹 개발',
        personnel: 3,
        skillLevel: '시니어',
        period: 6,
        monthlyRate: 8000000,
        contractAmount: 48000000,
        supplier: 'ABC 개발사',
        creditRating: 'A'
      },
      {
        item: '유지보수',
        personnel: 2,
        skillLevel: '중급',
        period: 12,
        monthlyRate: 2666667,
        contractAmount: 32000000,
        supplier: 'ABC 개발사',
        creditRating: 'A'
      }
    ]
  },
  {
    contractType: 'change',
    purpose: '기존 서버 성능 향상을 위한 CPU 업그레이드',
    basis: '시스템 성능 개선 요구사항',
    budgetId: 'IT-2024-003',
    contractMethod: '수의계약',
    accountSubject: 'IT인프라개선비',
    totalAmount: 25000000,
    status: 'submitted', // draft, submitted, approved, rejected 중 하나
    changeReason: '기존 서버 성능 부족으로 인한 업그레이드 필요',
    purchaseItems: [
      {
        item: 'CPU',
        productName: 'Intel Xeon Gold 6338',
        quantity: 8,
        unitPrice: 3125000,
        amount: 25000000,
        supplier: 'Intel Korea',
        requestDepartment: 'IT팀'
      }
    ]
  },
  {
    contractType: 'extension',
    purpose: '클라우드 서비스 이용 기간 연장',
    basis: '기존 서비스 계속 이용 필요',
    budgetId: 'CLOUD-2024-004',
    contractMethod: '수의계약',
    accountSubject: '클라우드서비스비',
    totalAmount: 12000000,
    status: 'submitted', // draft, submitted, approved, rejected 중 하나
    extensionReason: '기존 클라우드 서비스 안정성 확보',
    serviceItems: [
      {
        item: '클라우드 서비스',
        personnel: 0,
        skillLevel: 'N/A',
        period: 12,
        monthlyRate: 1000000,
        contractAmount: 12000000,
        supplier: 'AWS Korea',
        creditRating: 'A+'
      }
    ]
  },
  {
    contractType: 'bidding',
    purpose: '사무실 리모델링 공사',
    basis: '2024년 사무실 환경 개선 계획',
    budgetId: 'FACILITY-2024-005',
    contractMethod: '일반입찰',
    accountSubject: '시설개선비',
    totalAmount: 200000000,
    status: 'submitted', // draft, submitted, approved, rejected 중 하나
    biddingType: '공사',
    qualificationRequirements: '건설업 등록, 시설공사업 등록',
    evaluationCriteria: '가격 60%, 기술력 30%, 실적 10%',
    serviceItems: [
      {
        item: '사무실 리모델링',
        personnel: 15,
        skillLevel: 'N/A',
        period: 3,
        monthlyRate: 66666667,
        contractAmount: 200000000,
        supplier: '한국건설',
        creditRating: 'A'
      }
    ]
  },
  {
    contractType: 'purchase',
    purpose: '보안 시스템 구축',
    basis: '정보보안 강화 정책',
    budgetId: 'SECURITY-2024-006',
    contractMethod: '제한입찰',
    accountSubject: '보안시스템구축비',
    totalAmount: 45000000,
    status: 'submitted', // draft, submitted, approved, rejected 중 하나
    purchaseItems: [
      {
        item: 'CCTV 시스템',
        productName: 'Hikvision DS-2CD2T47G1-L',
        quantity: 20,
        unitPrice: 150000,
        amount: 3000000,
        supplier: 'Hikvision Korea',
        requestDepartment: '보안팀'
      },
      {
        item: '출입통제 시스템',
        productName: 'Suprema BioStar 2',
        quantity: 5,
        unitPrice: 3000000,
        amount: 15000000,
        supplier: 'Suprema',
        requestDepartment: '보안팀'
      },
      {
        item: '방화벽',
        productName: 'Fortinet FortiGate 60F',
        quantity: 3,
        unitPrice: 9000000,
        amount: 27000000,
        supplier: 'Fortinet Korea',
        requestDepartment: '보안팀'
      }
    ]
  },
  {
    contractType: 'service',
    purpose: '법무 자문 서비스',
    basis: '기업 법무 관리 강화',
    budgetId: 'LEGAL-2024-007',
    contractMethod: '수의계약',
    accountSubject: '법무자문비',
    totalAmount: 30000000,
    status: 'submitted', // draft, submitted, approved, rejected 중 하나
    serviceItems: [
      {
        item: '법무 자문',
        personnel: 2,
        skillLevel: '변호사',
        period: 12,
        monthlyRate: 2500000,
        contractAmount: 30000000,
        supplier: '김앤장 법무법인',
        creditRating: 'A+'
      }
    ]
  },
  {
    contractType: 'purchase',
    purpose: '사무용품 및 장비 구매',
    basis: '신입사원 입사 준비',
    budgetId: 'OFFICE-2024-008',
    contractMethod: '수의계약',
    accountSubject: '사무용품비',
    totalAmount: 15000000,
    status: 'submitted', // draft, submitted, approved, rejected 중 하나
    purchaseItems: [
      {
        item: '노트북',
        productName: 'LG Gram 16',
        quantity: 10,
        unitPrice: 1500000,
        amount: 15000000,
        supplier: 'LG전자',
        requestDepartment: '인사팀'
      }
    ]
  },
  {
    contractType: 'change',
    purpose: '프린터 업그레이드',
    basis: '인쇄 품질 개선 요구',
    budgetId: 'OFFICE-2024-009',
    contractMethod: '수의계약',
    accountSubject: '사무용품개선비',
    totalAmount: 8000000,
    status: 'submitted', // draft, submitted, approved, rejected 중 하나
    changeReason: '기존 프린터 성능 부족으로 인한 교체',
    purchaseItems: [
      {
        item: '프린터',
        productName: 'HP LaserJet Pro M404n',
        quantity: 4,
        unitPrice: 2000000,
        amount: 8000000,
        supplier: 'HP Korea',
        requestDepartment: '총무팀'
      }
    ]
  },
  {
    contractType: 'extension',
    purpose: '인터넷 서비스 이용 기간 연장',
    basis: '기존 서비스 계속 이용',
    budgetId: 'COMM-2024-010',
    contractMethod: '수의계약',
    accountSubject: '통신비',
    totalAmount: 6000000,
    status: 'submitted', // draft, submitted, approved, rejected 중 하나
    extensionReason: '안정적인 인터넷 서비스 확보',
    serviceItems: [
      {
        item: '인터넷 서비스',
        personnel: 0,
        skillLevel: 'N/A',
        period: 12,
        monthlyRate: 500000,
        contractAmount: 6000000,
        supplier: 'KT',
        creditRating: 'A+'
      }
    ]
  },
  {
    contractType: 'bidding',
    purpose: '회의실 음향 시스템 설치',
    basis: '회의 환경 개선',
    budgetId: 'FACILITY-2024-011',
    contractMethod: '일반입찰',
    accountSubject: '시설개선비',
    totalAmount: 25000000,
    status: 'submitted', // draft, submitted, approved, rejected 중 하나
    biddingType: '설치공사',
    qualificationRequirements: '음향시스템 설치업 등록',
    evaluationCriteria: '가격 50%, 기술력 40%, 실적 10%',
    serviceItems: [
      {
        item: '음향 시스템 설치',
        personnel: 5,
        skillLevel: 'N/A',
        period: 1,
        monthlyRate: 25000000,
        contractAmount: 25000000,
        supplier: '음향시스템 전문업체',
        creditRating: 'B'
      }
    ]
  },
  {
    contractType: 'purchase',
    purpose: '모니터 교체',
    basis: '업무 효율성 향상',
    budgetId: 'OFFICE-2024-012',
    contractMethod: '수의계약',
    accountSubject: '사무용품비',
    totalAmount: 12000000,
    status: 'submitted', // draft, submitted, approved, rejected 중 하나
    purchaseItems: [
      {
        item: '모니터',
        productName: 'Samsung 27" Curved Monitor',
        quantity: 20,
        unitPrice: 600000,
        amount: 12000000,
        supplier: 'Samsung Electronics',
        requestDepartment: 'IT팀'
      }
    ]
  },
  {
    contractType: 'service',
    purpose: '회계 감사 서비스',
    basis: '2024년도 회계감사',
    budgetId: 'AUDIT-2024-013',
    contractMethod: '수의계약',
    accountSubject: '감사비',
    totalAmount: 50000000,
    status: 'submitted', // draft, submitted, approved, rejected 중 하나
    serviceItems: [
      {
        item: '회계 감사',
        personnel: 4,
        skillLevel: '공인회계사',
        period: 3,
        monthlyRate: 16666667,
        contractAmount: 50000000,
        supplier: '삼일회계법인',
        creditRating: 'A+'
      }
    ]
  },
  {
    contractType: 'purchase',
    purpose: '에어컨 설치',
    basis: '사무실 환경 개선',
    budgetId: 'FACILITY-2024-014',
    contractMethod: '수의계약',
    accountSubject: '시설개선비',
    totalAmount: 35000000,
    status: 'submitted', // draft, submitted, approved, rejected 중 하나
    purchaseItems: [
      {
        item: '에어컨',
        productName: 'LG Whisen Inverter',
        quantity: 8,
        unitPrice: 4375000,
        amount: 35000000,
        supplier: 'LG전자',
        requestDepartment: '총무팀'
      }
    ]
  },
  {
    contractType: 'change',
    purpose: '소프트웨어 라이선스 업그레이드',
    basis: '최신 버전 사용 필요',
    budgetId: 'SW-2024-015',
    contractMethod: '수의계약',
    accountSubject: '소프트웨어비',
    totalAmount: 18000000,
    status: 'submitted', // draft, submitted, approved, rejected 중 하나
    changeReason: '기존 라이선스 만료 및 기능 개선',
    purchaseItems: [
      {
        item: 'Office 365 라이선스',
        productName: 'Microsoft Office 365 Business Premium',
        quantity: 50,
        unitPrice: 360000,
        amount: 18000000,
        supplier: 'Microsoft Korea',
        requestDepartment: 'IT팀'
      }
    ]
  },
  {
    contractType: 'extension',
    purpose: '보안 서비스 이용 기간 연장',
    basis: '보안 서비스 계속 이용',
    budgetId: 'SECURITY-2024-016',
    contractMethod: '수의계약',
    accountSubject: '보안서비스비',
    totalAmount: 24000000,
    status: 'submitted', // draft, submitted, approved, rejected 중 하나
    extensionReason: '기존 보안 서비스 안정성 확보',
    serviceItems: [
      {
        item: '보안 서비스',
        personnel: 3,
        skillLevel: '보안전문가',
        period: 12,
        monthlyRate: 2000000,
        contractAmount: 24000000,
        supplier: '한국보안',
        creditRating: 'A'
      }
    ]
  },
  {
    contractType: 'bidding',
    purpose: '주차장 확장 공사',
    basis: '직원 주차 공간 확보',
    budgetId: 'FACILITY-2024-017',
    contractMethod: '일반입찰',
    accountSubject: '시설개선비',
    totalAmount: 80000000,
    status: 'submitted', // draft, submitted, approved, rejected 중 하나
    biddingType: '토목공사',
    qualificationRequirements: '토목공사업 등록',
    evaluationCriteria: '가격 70%, 기술력 20%, 실적 10%',
    serviceItems: [
      {
        item: '주차장 확장',
        personnel: 20,
        skillLevel: 'N/A',
        period: 2,
        monthlyRate: 40000000,
        contractAmount: 80000000,
        supplier: '대한건설',
        creditRating: 'A'
      }
    ]
  },
  {
    contractType: 'purchase',
    purpose: '복사기 구매',
    basis: '문서 업무 효율성 향상',
    budgetId: 'OFFICE-2024-018',
    contractMethod: '수의계약',
    accountSubject: '사무용품비',
    totalAmount: 15000000,
    status: 'submitted', // draft, submitted, approved, rejected 중 하나
    purchaseItems: [
      {
        item: '복사기',
        productName: 'Canon imageRUNNER ADVANCE C5560',
        quantity: 3,
        unitPrice: 5000000,
        amount: 15000000,
        supplier: 'Canon Korea',
        requestDepartment: '총무팀'
      }
    ]
  },
  {
    contractType: 'service',
    purpose: '마케팅 컨설팅 서비스',
    basis: '브랜드 전략 수립',
    budgetId: 'MARKETING-2024-019',
    contractMethod: '수의계약',
    accountSubject: '마케팅비',
    totalAmount: 40000000,
    status: 'submitted', // draft, submitted, approved, rejected 중 하나
    serviceItems: [
      {
        item: '마케팅 컨설팅',
        personnel: 2,
        skillLevel: '마케팅전문가',
        period: 6,
        monthlyRate: 6666667,
        contractAmount: 40000000,
        supplier: '브랜드마케팅컨설팅',
        creditRating: 'A'
      }
    ]
  },
  {
    contractType: 'purchase',
    purpose: '회의용 프로젝터 구매',
    basis: '회의 환경 개선',
    budgetId: 'OFFICE-2024-020',
    contractMethod: '수의계약',
    accountSubject: '사무용품비',
    totalAmount: 8000000,
    status: 'submitted', // draft, submitted, approved, rejected 중 하나
    purchaseItems: [
      {
        item: '프로젝터',
        productName: 'Epson EB-L610U',
        quantity: 4,
        unitPrice: 2000000,
        amount: 8000000,
        supplier: 'Epson Korea',
        requestDepartment: '총무팀'
      }
    ]
  }
];

async function createSampleProposals() {
  try {
    console.log('🔍 데이터베이스 연결 확인...');
    await sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공!');

    // 기존 품의서 데이터 삭제
    console.log('\n🗑️ 기존 품의서 데이터 삭제 중...');
    await models.PurchaseItem.destroy({ where: {} });
    await models.ServiceItem.destroy({ where: {} });
    await models.CostDepartment.destroy({ where: {} });
    await models.ApprovalLine.destroy({ where: {} });
    await models.Proposal.destroy({ where: {} });
    console.log('✅ 기존 데이터 삭제 완료!');

    console.log('\n📝 새로운 샘플 품의서 생성 중...');
    
    for (let i = 0; i < sampleProposals.length; i++) {
      const proposalData = sampleProposals[i];
      
      // 품의서 생성
      const proposal = await models.Proposal.create({
        contractType: proposalData.contractType,
        purpose: proposalData.purpose,
        basis: proposalData.basis,
        budgetId: 1, // 기본 budgetId 설정
        contractMethod: proposalData.contractMethod,
        accountSubject: proposalData.accountSubject,
        totalAmount: proposalData.totalAmount,
        changeReason: proposalData.changeReason,
        extensionReason: proposalData.extensionReason,
        status: proposalData.status,
        createdBy: '시스템관리자',
        proposalDate: new Date().toISOString().split('T')[0] // 오늘 날짜를 품의작성일로 설정
      });

      // 구매품목 생성
      if (proposalData.purchaseItems && proposalData.purchaseItems.length > 0) {
        const purchaseItems = proposalData.purchaseItems.map(item => ({
          proposalId: proposal.id,
          item: item.item,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          amount: item.amount,
          supplier: item.supplier,
          requestDepartment: item.requestDepartment,
          costAllocation: item.costAllocation || { type: 'percentage', allocations: [] }
        }));
        await models.PurchaseItem.bulkCreate(purchaseItems);
      }

      // 용역항목 생성
      if (proposalData.serviceItems && proposalData.serviceItems.length > 0) {
        const serviceItems = proposalData.serviceItems.map(item => ({
          proposalId: proposal.id,
          item: item.item,
          personnel: item.personnel,
          skillLevel: item.skillLevel,
          period: item.period,
          monthlyRate: item.monthlyRate,
          contractAmount: item.contractAmount,
          supplier: item.supplier,
          creditRating: item.creditRating
        }));
        await models.ServiceItem.bulkCreate(serviceItems);
      }

      // 비용귀속부서 생성 (샘플 데이터)
      const costDepartments = [
        {
          proposalId: proposal.id,
          department: 'IT팀',
          amount: Math.round(proposalData.totalAmount * 0.6),
          ratio: 60.00
        },
        {
          proposalId: proposal.id,
          department: '총무팀',
          amount: Math.round(proposalData.totalAmount * 0.3),
          ratio: 30.00
        },
        {
          proposalId: proposal.id,
          department: '기획팀',
          amount: Math.round(proposalData.totalAmount * 0.1),
          ratio: 10.00
        }
      ];
      await models.CostDepartment.bulkCreate(costDepartments);

      // 결재라인 생성 (기본 결재라인)
      const approvalLines = [
        {
          proposalId: proposal.id,
          step: 1,
          name: '요청부서',
          title: '담당자',
          description: '품의서 작성 및 검토',
          isConditional: false,
          isFinal: false,
          status: 'pending'
        },
        {
          proposalId: proposal.id,
          step: 2,
          name: '경영관리팀',
          title: '팀장',
          description: '예산 및 경영 효율성 검토',
          isConditional: true,
          isFinal: false,
          status: 'pending'
        },
        {
          proposalId: proposal.id,
          step: 3,
          name: '대표이사',
          title: '대표이사',
          description: '최종 승인',
          isConditional: false,
          isFinal: true,
          status: 'pending'
        }
      ];
      await models.ApprovalLine.bulkCreate(approvalLines);

      console.log(`✅ 품의서 ${i + 1} 생성 완료 (ID: ${proposal.id})`);
    }

    console.log('\n🎉 샘플 품의서 생성 완료!');
    console.log(`📊 총 ${sampleProposals.length}개의 품의서가 생성되었습니다.`);

    // 생성된 데이터 확인
    const totalProposals = await models.Proposal.count();
    const totalPurchaseItems = await models.PurchaseItem.count();
    const totalServiceItems = await models.ServiceItem.count();
    const totalApprovalLines = await models.ApprovalLine.count();
    const totalCostDepartments = await models.CostDepartment.count();

    console.log('\n📈 생성된 데이터 통계:');
    console.log(`   - 품의서: ${totalProposals}개`);
    console.log(`   - 구매품목: ${totalPurchaseItems}개`);
    console.log(`   - 용역항목: ${totalServiceItems}개`);
    console.log(`   - 결재라인: ${totalApprovalLines}개`);
    console.log(`   - 비용귀속부서: ${totalCostDepartments}개`);

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
  } finally {
    await sequelize.close();
  }
}

createSampleProposals(); 