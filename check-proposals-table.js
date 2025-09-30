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

async function checkProposalsTable() {
  try {
    console.log('🔍 proposals 테이블 구조 확인 중...');
    
    // 테이블 구조 확인
    const [columns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'proposals' 
      ORDER BY ordinal_position
    `);
    
    console.log('📋 proposals 테이블 구조:');
    columns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}) ${col.column_default ? `DEFAULT: ${col.column_default}` : ''}`);
    });
    
    // 외래키 제약조건 확인
    const [foreignKeys] = await sequelize.query(`
      SELECT 
        tc.constraint_name, 
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name='proposals';
    `);
    
    console.log('\n🔗 외래키 제약조건:');
    if (foreignKeys.length === 0) {
      console.log('  - 외래키 제약조건 없음');
    } else {
      foreignKeys.forEach(fk => {
        console.log(`  - ${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
      });
    }
    
    // 테이블 데이터 확인
    const [data] = await sequelize.query(`
      SELECT COUNT(*) as count FROM proposals
    `);
    
    console.log(`\n📊 테이블 데이터: ${data[0].count}개 행`);
    
  } catch (error) {
    console.error('❌ 테이블 확인 실패:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkProposalsTable(); 