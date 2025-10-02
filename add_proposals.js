const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

// PostgreSQL 연결 설정 (서버와 동일하게)
const sequelize = new Sequelize('contract_management', 'postgres', 'meritz123!', {
  host: 'localhost',
  port: 5432,
  dialect: 'postgres',
  logging: false
});

// Proposal 모델 정의 (간단 버전)
const Proposal = sequelize.define('Proposal', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  contractType: {
    type: DataTypes.STRING,
    field: 'contract_type'
  },
  title: DataTypes.STRING,
  purpose: DataTypes.TEXT,
  basis: DataTypes.TEXT,
  budgetId: {
    type: DataTypes.INTEGER,
    field: 'budget_id'
  },
  contractMethod: {
    type: DataTypes.STRING,
    field: 'contract_method'
  },
  accountSubject: {
    type: DataTypes.STRING,
    field: 'account_subject'
  },
  totalAmount: {
    type: DataTypes.DECIMAL(15, 2),
    field: 'total_amount'
  },
  contractPeriod: {
    type: DataTypes.STRING,
    field: 'contract_period'
  },
  contractStartDate: {
    type: DataTypes.DATE,
    field: 'contract_start_date'
  },
  contractEndDate: {
    type: DataTypes.DATE,
    field: 'contract_end_date'
  },
  paymentMethod: {
    type: DataTypes.STRING,
    field: 'payment_method'
  },
  status: DataTypes.STRING,
  createdBy: {
    type: DataTypes.STRING,
    field: 'created_by'
  },
  proposalDate: {
    type: DataTypes.DATE,
    field: 'proposal_date'
  },
  approvalDate: {
    type: DataTypes.DATE,
    field: 'approval_date'
  },
  isDraft: {
    type: DataTypes.BOOLEAN,
    field: 'is_draft',
    defaultValue: false
  }
}, {
  tableName: 'proposals',
  timestamps: true,
  underscored: true
});

// 샘플 데이터 생성
const contractMethods = [
  '최저가 계약',
  '경쟁계약(일반경쟁계약)',
  '경쟁계약(제한경쟁계약)',
  '수의계약',
  '수의계약(제6조 제1항의 가)',
  '수의계약(제6조 제2항의 가)'
];

const departments = ['연구개발팀', '마케팅팀', '영업팀', '기획팀', '인사팀', '재무팀', 'IT팀'];
const suppliers = ['(주)테크솔루션', '(주)글로벌시스템', '(주)이노베이션', '(주)디지털웨이브', '(주)스마트테크', '(주)넥스트젠'];
const contractTypes = ['purchase', 'service'];

async function addProposals() {
  try {
    await sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공!');

    const proposals = [];
    const startDate = new Date('2024-01-01');
    
    for (let i = 1; i <= 30; i++) {
      const randomDays = Math.floor(Math.random() * 300);
      const proposalDate = new Date(startDate);
      proposalDate.setDate(proposalDate.getDate() + randomDays);
      
      const approvalDate = new Date(proposalDate);
      approvalDate.setDate(approvalDate.getDate() + Math.floor(Math.random() * 7) + 1);
      
      const contractStartDate = new Date(approvalDate);
      contractStartDate.setDate(contractStartDate.getDate() + Math.floor(Math.random() * 14) + 1);
      
      const contractEndDate = new Date(contractStartDate);
      contractEndDate.setMonth(contractEndDate.getMonth() + (Math.floor(Math.random() * 11) + 1));
      
      const amount = (Math.floor(Math.random() * 50000) + 10000) * 1000;
      const department = departments[Math.floor(Math.random() * departments.length)];
      const supplier = suppliers[Math.floor(Math.random() * suppliers.length)];
      const contractMethod = contractMethods[Math.floor(Math.random() * contractMethods.length)];
      const contractType = contractTypes[Math.floor(Math.random() * contractTypes.length)];
      
      proposals.push({
        contractType: contractType,
        title: `${department} ${contractType === 'purchase' ? '구매' : '용역'} 계약 ${i}`,
        purpose: `${department}의 업무 효율성 향상 및 프로젝트 수행을 위한 ${contractType === 'purchase' ? '물품 구매' : '용역 계약'}`,
        basis: '사업 추진 계획 및 예산 집행 지침에 따름',
        budgetId: Math.floor(Math.random() * 5) + 1,
        contractMethod: contractMethod,
        accountSubject: contractType === 'purchase' ? '소모품비' : '용역비',
        totalAmount: amount,
        contractPeriod: `${Math.floor((contractEndDate - contractStartDate) / (1000 * 60 * 60 * 24 * 30))}개월`,
        contractStartDate: contractStartDate,
        contractEndDate: contractEndDate,
        paymentMethod: Math.random() > 0.5 ? '선급금 30% + 잔금 70%' : '일시불',
        status: 'approved',
        createdBy: '시스템관리자',
        proposalDate: proposalDate,
        approvalDate: approvalDate,
        isDraft: false
      });
    }

    // 일괄 삽입
    const result = await Proposal.bulkCreate(proposals);
    console.log(`✅ ${result.length}개의 품의서가 추가되었습니다!`);
    
    // 추가된 품의서 ID 출력
    console.log('추가된 품의서 ID:', result.map(p => p.id).join(', '));
    
    await sequelize.close();
    console.log('✅ 데이터베이스 연결 종료');
  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

addProposals();

