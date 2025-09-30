const { Sequelize } = require('sequelize');

// 데이터베이스 연결
const sequelize = new Sequelize(
  'contract_management',
  'postgres',
  'meritz123!',
  {
    host: 'localhost',
    port: 5432,
    dialect: 'postgres',
    logging: false
  }
);

async function checkTableStructure() {
  try {
    console.log('=== proposals 테이블 구조 확인 ===\n');

    // 테이블 구조 조회
    const tableInfo = await sequelize.query(`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'proposals' 
      ORDER BY ordinal_position
    `);

    console.log('테이블 구조:');
    tableInfo[0].forEach(column => {
      console.log(`  - ${column.column_name}: ${column.data_type} (${column.is_nullable === 'YES' ? 'NULL 허용' : 'NOT NULL'}) ${column.column_default ? `기본값: ${column.column_default}` : ''}`);
    });

    // 기존 데이터 샘플 확인
    console.log('\n기존 데이터 샘플:');
    const sampleData = await sequelize.query(`
      SELECT * FROM proposals LIMIT 1
    `);

    if (sampleData[0].length > 0) {
      const sample = sampleData[0][0];
      Object.keys(sample).forEach(key => {
        console.log(`  - ${key}: ${sample[key]}`);
      });
    }

  } catch (error) {
    console.error('❌ 테이블 구조 확인 중 오류 발생:', error);
  } finally {
    await sequelize.close();
  }
}

// 실행
checkTableStructure(); 