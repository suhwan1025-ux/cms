const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');
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

async function importContractMethodsFromBackup() {
  try {
    console.log('========================================');
    console.log('📥 계약방식 데이터 Import 시작');
    console.log('========================================');
    console.log('');
    
    // 연결 테스트
    await sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공!');
    console.log('');
    
    // 백업 파일 읽기
    const backupFilePath = path.join(__dirname, 'db_data_backup', 'data-export-2025-10-10T05-54-38-850Z.json');
    
    if (!fs.existsSync(backupFilePath)) {
      console.log('❌ 백업 파일을 찾을 수 없습니다:', backupFilePath);
      return;
    }
    
    console.log('📂 백업 파일 읽기 중...');
    console.log(`   ${backupFilePath}`);
    const backupData = JSON.parse(fs.readFileSync(backupFilePath, 'utf8'));
    
    if (!backupData.contract_methods || backupData.contract_methods.length === 0) {
      console.log('❌ 백업 파일에 contract_methods 데이터가 없습니다.');
      return;
    }
    
    const contractMethods = backupData.contract_methods;
    console.log(`✅ ${contractMethods.length}개의 계약방식 데이터를 읽었습니다.`);
    console.log('');
    
    // 현재 데이터 확인
    const [existingData] = await sequelize.query('SELECT * FROM contract_methods ORDER BY id;');
    console.log(`📊 현재 등록된 계약방식: ${existingData.length}개`);
    
    if (existingData.length > 0) {
      console.log('');
      console.log('현재 데이터:');
      existingData.forEach(method => {
        console.log(`  - ${method.name} (${method.value}) [${method.is_active ? '활성' : '비활성'}]`);
      });
    }
    
    console.log('');
    console.log('🗑️  기존 데이터를 삭제하고 백업 데이터로 교체합니다...');
    console.log('');
    
    // 트랜잭션 시작
    const transaction = await sequelize.transaction();
    
    try {
      // 기존 데이터 삭제
      await sequelize.query('DELETE FROM contract_methods;', { transaction });
      console.log('✅ 기존 데이터 삭제 완료');
      
      // 시퀀스 리셋
      await sequelize.query('ALTER SEQUENCE contract_methods_id_seq RESTART WITH 1;', { transaction });
      
      console.log('');
      console.log('📥 백업 데이터 Import 중...');
      console.log('');
      
      // 데이터 삽입
      let imported = 0;
      let skipped = 0;
      for (const method of contractMethods) {
        try {
          // code 값 생성 (없는 경우)
          let code = method.code;
          if (!code) {
            // value를 기반으로 code 생성
            code = `CM${String(method.id || imported + 1).padStart(2, '0')}`;
          }
          
          await sequelize.query(`
            INSERT INTO contract_methods (
              code, value, name, basis, is_active, description, created_at, updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          `, {
            bind: [
              code,
              method.value,
              method.name,
              method.regulation, // regulation을 basis로 매핑
              method.is_active !== undefined ? method.is_active : true,
              method.description,
              method.created_at || new Date(),
              method.updated_at || new Date()
            ],
            transaction
          });
          
          console.log(`  ✅ ${method.name} (${method.value}) [${method.is_active ? '활성' : '비활성'}]`);
          imported++;
          
        } catch (error) {
          console.log(`  ⚠️  ${method.name} 건너뜀: ${error.message.split('\n')[0]}`);
          skipped++;
        }
      }
      
      // 트랜잭션 커밋
      await transaction.commit();
      
      console.log('');
      console.log('========================================');
      console.log('✅ Import 완료!');
      console.log('========================================');
      console.log(`📊 총 ${imported}개의 계약방식이 Import되었습니다.`);
      if (skipped > 0) {
        console.log(`⚠️  ${skipped}개는 건너뛰었습니다.`);
      }
      console.log('');
      
      // 최종 데이터 확인
      const [finalData] = await sequelize.query(`
        SELECT id, code, value, name, basis, is_active 
        FROM contract_methods 
        ORDER BY id;
      `);
      
      console.log('📋 Import된 계약방식 목록:');
      console.log('');
      
      const activeCount = finalData.filter(m => m.is_active).length;
      const inactiveCount = finalData.filter(m => !m.is_active).length;
      
      finalData.forEach(method => {
        const status = method.is_active ? '🟢 활성' : '⚪ 비활성';
        console.log(`  ${method.id}. ${method.name} (${method.value}) ${status}`);
        if (method.basis) {
          console.log(`      근거: ${method.basis.substring(0, 60)}${method.basis.length > 60 ? '...' : ''}`);
        }
      });
      
      console.log('');
      console.log(`📊 활성: ${activeCount}개 | 비활성: ${inactiveCount}개`);
      console.log('');
      
    } catch (error) {
      // 트랜잭션 롤백
      await transaction.rollback();
      throw error;
    }
    
  } catch (error) {
    console.error('❌ Import 실패:', error.message);
    console.error(error);
  } finally {
    await sequelize.close();
  }
}

// 실행
if (require.main === module) {
  importContractMethodsFromBackup();
}

module.exports = { importContractMethodsFromBackup };

