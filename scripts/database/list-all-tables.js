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

async function listAllTables() {
  try {
    console.log('🔍 데이터베이스 연결 확인...');
    await sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공!\n');
    
    // 모든 테이블 조회
    const [tables] = await sequelize.query(`
      SELECT 
        table_name,
        (SELECT COUNT(*) FROM information_schema.columns 
         WHERE table_name = t.table_name AND table_schema = 'public') as column_count
      FROM information_schema.tables t
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    
    console.log('📊 데이터베이스의 모든 테이블:\n');
    console.log(`총 ${tables.length}개 테이블 발견\n`);
    
    // 테이블 목록 출력
    const tableNames = [];
    tables.forEach((table, index) => {
      console.log(`${(index + 1).toString().padStart(2)}. ${table.table_name.padEnd(40)} (${table.column_count}개 컬럼)`);
      tableNames.push(table.table_name);
    });
    
    // 각 테이블의 레코드 수 확인
    console.log('\n' + '='.repeat(70));
    console.log('📋 각 테이블의 레코드 수:\n');
    
    for (const tableName of tableNames) {
      try {
        const [result] = await sequelize.query(`SELECT COUNT(*) as count FROM ${tableName}`);
        const count = result[0].count;
        console.log(`   ${tableName.padEnd(40)} : ${count}개`);
      } catch (error) {
        console.log(`   ${tableName.padEnd(40)} : 조회 실패`);
      }
    }
    
    // JavaScript 배열 형태로 출력 (복사해서 사용 가능)
    console.log('\n' + '='.repeat(70));
    console.log('📝 JavaScript 배열 형태 (복사해서 사용):\n');
    console.log('const ALL_TABLES = [');
    tableNames.forEach(name => {
      console.log(`  '${name}',`);
    });
    console.log('];\n');
    
    return tableNames;
    
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
  } finally {
    await sequelize.close();
  }
}

if (require.main === module) {
  listAllTables();
}

module.exports = { listAllTables }; 