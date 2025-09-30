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

async function checkApprovalTables() {
  try {
    console.log('🔍 결재라인 관련 테이블 확인...');
    
    await sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공!');
    
    // 1. 모든 테이블 목록 조회
    console.log('\n📋 현재 데이터베이스의 모든 테이블:');
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    tables.forEach(table => {
      console.log(`  - ${table.table_name}`);
    });
    
    // 2. 결재라인 관련 테이블 확인
    console.log('\n🔍 결재라인 관련 테이블 확인:');
    const approvalTables = ['approval_lines', 'approvallines', 'proposal_histories', 'proposalhistories'];
    
    for (const tableName of approvalTables) {
      try {
        const [exists] = await sequelize.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = '${tableName}'
          );
        `);
        
        if (exists[0].exists) {
          console.log(`✅ ${tableName} 테이블 존재`);
          
          // 데이터 개수 확인
          const [count] = await sequelize.query(`SELECT COUNT(*) as count FROM ${tableName}`);
          console.log(`   데이터 개수: ${count[0].count}개`);
          
          // 컬럼 구조 확인
          const [columns] = await sequelize.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = '${tableName}'
            ORDER BY ordinal_position
          `);
          
          console.log('   컬럼 구조:');
          columns.forEach(col => {
            console.log(`     - ${col.column_name} (${col.data_type}, ${col.is_nullable === 'YES' ? 'NULL 허용' : 'NOT NULL'})`);
          });
          
          // 샘플 데이터 확인 (최대 3개)
          if (count[0].count > 0) {
            const [samples] = await sequelize.query(`SELECT * FROM ${tableName} LIMIT 3`);
            console.log('   샘플 데이터:');
            samples.forEach((sample, index) => {
              console.log(`     ${index + 1}. ${JSON.stringify(sample, null, 2)}`);
            });
          }
          
        } else {
          console.log(`❌ ${tableName} 테이블 없음`);
        }
      } catch (error) {
        console.log(`❌ ${tableName} 확인 중 오류: ${error.message}`);
      }
    }
    
    // 3. proposals 테이블에서 결재라인 관련 컬럼 확인
    console.log('\n🔍 proposals 테이블의 결재라인 관련 컬럼:');
    try {
      const [proposalColumns] = await sequelize.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'proposals'
        AND (column_name LIKE '%approval%' OR column_name LIKE '%approver%' OR column_name LIKE '%line%')
        ORDER BY ordinal_position
      `);
      
      if (proposalColumns.length > 0) {
        proposalColumns.forEach(col => {
          console.log(`  - ${col.column_name} (${col.data_type})`);
        });
        
        // 결재라인 데이터 샘플 확인
        const [proposalSamples] = await sequelize.query(`
          SELECT id, title, status, 
                 CASE WHEN approval_line IS NOT NULL THEN LEFT(approval_line, 100) ELSE 'NULL' END as approval_line_preview
          FROM proposals 
          WHERE approval_line IS NOT NULL 
          LIMIT 5
        `);
        
        if (proposalSamples.length > 0) {
          console.log('\n📋 품의서의 결재라인 데이터 샘플:');
          proposalSamples.forEach(sample => {
            console.log(`  ID ${sample.id}: ${sample.title}`);
            console.log(`    상태: ${sample.status}`);
            console.log(`    결재라인: ${sample.approval_line_preview}...`);
          });
        }
        
      } else {
        console.log('  결재라인 관련 컬럼이 없습니다.');
      }
      
    } catch (error) {
      console.log(`❌ proposals 테이블 확인 중 오류: ${error.message}`);
    }
    
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkApprovalTables(); 