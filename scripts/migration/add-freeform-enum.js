const { Pool } = require('pg');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'contract_management',
  password: process.env.DB_PASSWORD || 'your_password',
  port: process.env.DB_PORT || 5432,
});

async function addFreeformEnum() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 데이터베이스 연결 확인 중...');
    
    // 1. 현재 enum 값들 확인
    console.log('\n📋 현재 contract_type enum 값들 확인...');
    const enumQuery = `
      SELECT enumlabel 
      FROM pg_enum 
      WHERE enumtypid = (
        SELECT oid FROM pg_type WHERE typname = 'enum_proposals_contract_type'
      )
      ORDER BY enumsortorder;
    `;
    
    const enumResult = await client.query(enumQuery);
    console.log('현재 enum 값들:', enumResult.rows.map(row => row.enumlabel));
    
    // 2. freeform이 이미 있는지 확인
    const hasFreeform = enumResult.rows.some(row => row.enumlabel === 'freeform');
    
    if (hasFreeform) {
      console.log('✅ freeform 값이 이미 존재합니다.');
    } else {
      console.log('\n🔄 freeform 값을 enum에 추가 중...');
      
      // 3. freeform 값 추가
      await client.query(`
        ALTER TYPE enum_proposals_contract_type ADD VALUE 'freeform';
      `);
      
      console.log('✅ freeform 값이 성공적으로 추가되었습니다.');
    }
    
    // 4. 업데이트된 enum 값들 확인
    console.log('\n📋 업데이트된 contract_type enum 값들 확인...');
    const updatedEnumResult = await client.query(enumQuery);
    console.log('업데이트된 enum 값들:', updatedEnumResult.rows.map(row => row.enumlabel));
    
    console.log('\n✅ enum 업데이트 완료!');
    
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    console.error('상세 오류:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// 스크립트 실행
if (require.main === module) {
  addFreeformEnum()
    .then(() => {
      console.log('\n🎉 스크립트 실행 완료!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 스크립트 실행 중 오류:', error);
      process.exit(1);
    });
} 