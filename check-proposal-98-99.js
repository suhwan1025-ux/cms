const { Sequelize } = require('sequelize');
require('dotenv').config();

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

async function checkProposals() {
  try {
    await sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공!');
    console.log('');
    
    // 먼저 테이블 구조 확인
    const [columns] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'proposals' 
      ORDER BY ordinal_position;
    `);
    console.log('📋 proposals 테이블 컬럼:');
    columns.forEach(c => console.log(`  - ${c.column_name}`));
    console.log('');
    
    // 98, 99번 품의서 확인
    const [proposals] = await sequelize.query(`
      SELECT *
      FROM proposals 
      WHERE id IN (98, 99)
      ORDER BY id;
    `);
    
    console.log('🔍 98번, 99번 품의서 확인:');
    console.log('');
    
    if (proposals.length === 0) {
      console.log('❌ 98번, 99번 품의서가 데이터베이스에 없습니다.');
    } else {
      proposals.forEach(p => {
        console.log(`ID: ${p.id}`);
        console.log(`제목: ${p.title || p.project_name || '제목 없음'}`);
        console.log(`상태: ${p.status}`);
        console.log(`생성일: ${p.created_at}`);
        console.log('전체 데이터:', JSON.stringify(p, null, 2));
        console.log('');
      });
    }
    
    // 전체 품의서 개수와 최근 품의서 확인
    const [count] = await sequelize.query('SELECT COUNT(*) as count FROM proposals;');
    console.log(`📊 전체 품의서 개수: ${count[0].count}개`);
    console.log('');
    
    const [recent] = await sequelize.query(`
      SELECT id, title, project_name, status 
      FROM proposals 
      ORDER BY id DESC 
      LIMIT 10;
    `);
    
    console.log('📋 최근 품의서 10개:');
    recent.forEach(p => {
      const name = p.title || p.project_name || '제목 없음';
      console.log(`  ${p.id}. ${name} [${p.status}]`);
    });
    console.log('');
    
    // ID 범위 확인
    const [range] = await sequelize.query(`
      SELECT MIN(id) as min_id, MAX(id) as max_id 
      FROM proposals;
    `);
    console.log(`📈 품의서 ID 범위: ${range[0].min_id} ~ ${range[0].max_id}`);
    
  } catch (error) {
    console.error('❌ 오류:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkProposals();

