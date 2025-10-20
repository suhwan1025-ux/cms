const { Sequelize } = require('sequelize');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

// 데이터베이스 연결
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: false
  }
);

// 모델 정의
const PurchaseItemCostAllocation = sequelize.define('PurchaseItemCostAllocation', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  purchaseItemId: {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: {
      model: 'purchase_items',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  department: {
    type: Sequelize.STRING,
    allowNull: false
  },
  type: {
    type: Sequelize.ENUM('percentage', 'amount'),
    allowNull: false,
    defaultValue: 'percentage'
  },
  value: {
    type: Sequelize.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  allocatedAmount: {
    type: Sequelize.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  }
}, {
  tableName: 'purchase_item_cost_allocations',
  timestamps: true
});

async function syncPurchaseCostAllocation() {
  try {
    console.log('=== 구매품목 비용분배 테이블 동기화 시작 ===');
    
    // 데이터베이스 연결 확인
    await sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공!');
    
    // 테이블 동기화
    await PurchaseItemCostAllocation.sync({ force: true });
    console.log('✅ purchase_item_cost_allocations 테이블 생성 완료!');
    
    console.log('📋 테이블 구조:');
    console.log('- id: 기본키 (자동증가)');
    console.log('- purchaseItemId: 구매품목 ID (외래키)');
    console.log('- department: 부서명');
    console.log('- type: 분배 방식 (percentage/amount)');
    console.log('- value: 분배 값');
    console.log('- allocatedAmount: 실제 분배 금액');
    console.log('- createdAt, updatedAt: 타임스탬프');
    
    console.log('\n✅ 구매품목 비용분배 테이블 동기화 완료!');
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    await sequelize.close();
  }
}

syncPurchaseCostAllocation(); 