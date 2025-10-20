const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

// 현재 데이터베이스 연결
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

// 내보낼 테이블 목록 (순서 중요 - 외래키 관계 고려)
const EXPORT_TABLES = [
  'departments',
  'budgets', 
  'suppliers',
  'contract_methods',
  'business_budgets',           // 사업예산 추가
  'business_budget_details',    // 사업예산 상세 추가
  'business_budget_approvals',  // 사업예산 승인 추가
  'proposals',
  'request_departments',
  'cost_departments',
  'purchase_items',
  'service_items',
  'contracts',
  'approval_lines',
  'approval_approvers',
  'approval_conditions',
  'approval_references',
  'approval_rules',
  'proposal_histories'
];

async function exportCurrentData() {
  try {
    console.log('🔄 현재 데이터베이스 데이터 내보내기 시작...');
    
    // 연결 테스트
    await sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공!');
    
    const exportData = {};
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // 각 테이블 데이터 내보내기
    for (const tableName of EXPORT_TABLES) {
      try {
        console.log(`📋 ${tableName} 테이블 내보내는 중...`);
        
        // 테이블 존재 확인
        const [tableExists] = await sequelize.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = '${tableName}'
          );
        `);
        
        if (!tableExists[0].exists) {
          console.log(`⏭️  ${tableName} 테이블이 존재하지 않습니다. 건너뜁니다.`);
          continue;
        }
        
        // 데이터 조회
        const [results] = await sequelize.query(`SELECT * FROM ${tableName} ORDER BY id`);
        exportData[tableName] = results;
        
        console.log(`✅ ${tableName}: ${results.length}개 데이터 내보냄`);
        
      } catch (error) {
        console.log(`❌ ${tableName} 내보내기 실패: ${error.message}`);
        exportData[tableName] = [];
      }
    }
    
    // JSON 파일로 저장
    const exportFileName = `data-export-${timestamp}.json`;
    const exportPath = path.join(__dirname, exportFileName);
    
    fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2), 'utf8');
    
    console.log('='.repeat(50));
    console.log('✅ 데이터 내보내기 완료!');
    console.log(`📁 파일 위치: ${exportFileName}`);
    console.log('='.repeat(50));
    
    // 요약 정보 출력
    let totalRecords = 0;
    for (const [tableName, data] of Object.entries(exportData)) {
      if (data.length > 0) {
        console.log(`📊 ${tableName}: ${data.length}개`);
        totalRecords += data.length;
      }
    }
    console.log(`📊 총 레코드 수: ${totalRecords}개`);
    
    return exportFileName;
    
  } catch (error) {
    console.error('❌ 데이터 내보내기 실패:', error.message);
    return null;
  } finally {
    await sequelize.close();
  }
}

// 실행
if (require.main === module) {
  exportCurrentData();
}

module.exports = { exportCurrentData }; 