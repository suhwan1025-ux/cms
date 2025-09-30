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

async function checkApprovalReferenceData() {
  try {
    console.log('🔍 결재라인 참조 데이터 상세 확인...');
    
    await sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공!');
    
    // 결재 관련 모든 테이블들
    const approvalTables = [
      'approval_lines',
      'approval_approvers', 
      'approval_conditions',
      'approval_references',
      'approval_rules',
      'proposal_histories'
    ];
    
    console.log('\n📋 결재 관련 모든 테이블 데이터 확인:');
    console.log('='.repeat(60));
    
    for (const tableName of approvalTables) {
      try {
        console.log(`\n🔍 ${tableName.toUpperCase()} 테이블:`);
        
        // 테이블 존재 확인
        const [exists] = await sequelize.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = '${tableName}'
          );
        `);
        
        if (!exists[0].exists) {
          console.log(`❌ ${tableName} 테이블이 존재하지 않습니다.`);
          continue;
        }
        
        // 데이터 개수 확인
        const [count] = await sequelize.query(`SELECT COUNT(*) as count FROM ${tableName}`);
        console.log(`📊 데이터 개수: ${count[0].count}개`);
        
        if (count[0].count === 0) {
          console.log(`ℹ️  ${tableName} 테이블에 데이터가 없습니다.`);
          continue;
        }
        
        // 컬럼 구조 확인
        const [columns] = await sequelize.query(`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_name = '${tableName}'
          ORDER BY ordinal_position
        `);
        
        console.log('📋 컬럼 구조:');
        columns.forEach(col => {
          console.log(`   - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'NULL 허용' : 'NOT NULL'})`);
        });
        
        // 전체 데이터 확인 (최대 10개)
        const [allData] = await sequelize.query(`SELECT * FROM ${tableName} ORDER BY id LIMIT 10`);
        
        console.log(`📄 데이터 샘플 (최대 10개):`);
        allData.forEach((data, index) => {
          console.log(`   ${index + 1}. ${JSON.stringify(data, null, 4)}`);
        });
        
        // 특별한 분석
        if (tableName === 'approval_lines') {
          console.log('\n🔍 approval_lines 상세 분석:');
          
          // 품의서별 결재라인 개수
          const [proposalStats] = await sequelize.query(`
            SELECT proposal_id, COUNT(*) as line_count, 
                   STRING_AGG(name || '(' || title || ')', ' → ' ORDER BY step) as approval_flow
            FROM approval_lines 
            GROUP BY proposal_id 
            ORDER BY proposal_id
            LIMIT 5
          `);
          
          console.log('   품의서별 결재라인:');
          proposalStats.forEach(stat => {
            console.log(`     품의서 ${stat.proposal_id}: ${stat.line_count}단계`);
            console.log(`       결재흐름: ${stat.approval_flow}`);
          });
          
          // 결재 상태별 통계
          const [statusStats] = await sequelize.query(`
            SELECT status, COUNT(*) as count
            FROM approval_lines 
            GROUP BY status
            ORDER BY count DESC
          `);
          
          console.log('   결재 상태별 통계:');
          statusStats.forEach(stat => {
            console.log(`     ${stat.status || 'NULL'}: ${stat.count}개`);
          });
        }
        
        if (tableName === 'approval_references') {
          console.log('\n🔍 approval_references 상세 분석:');
          
          // 참조 유형별 통계
          const [refStats] = await sequelize.query(`
            SELECT reference_type, COUNT(*) as count
            FROM approval_references 
            GROUP BY reference_type
            ORDER BY count DESC
          `);
          
          console.log('   참조 유형별 통계:');
          refStats.forEach(stat => {
            console.log(`     ${stat.reference_type}: ${stat.count}개`);
          });
        }
        
        if (tableName === 'approval_rules') {
          console.log('\n🔍 approval_rules 상세 분석:');
          
          // 규칙 유형별 통계
          const [ruleStats] = await sequelize.query(`
            SELECT rule_type, is_active, COUNT(*) as count
            FROM approval_rules 
            GROUP BY rule_type, is_active
            ORDER BY rule_type, is_active
          `);
          
          console.log('   규칙 유형별 통계:');
          ruleStats.forEach(stat => {
            console.log(`     ${stat.rule_type} (${stat.is_active ? '활성' : '비활성'}): ${stat.count}개`);
          });
        }
        
      } catch (error) {
        console.log(`❌ ${tableName} 확인 중 오류: ${error.message}`);
      }
    }
    
    // 결재 관련 테이블들 간의 관계 확인
    console.log('\n🔗 결재 테이블 간 관계 분석:');
    console.log('='.repeat(60));
    
    try {
      // approval_lines와 proposals 관계
      const [lineProposalRelation] = await sequelize.query(`
        SELECT 
          p.id as proposal_id,
          p.title,
          p.status as proposal_status,
          COUNT(al.id) as approval_line_count,
          COUNT(CASE WHEN al.status = 'approved' THEN 1 END) as approved_count,
          COUNT(CASE WHEN al.status = 'pending' THEN 1 END) as pending_count
        FROM proposals p
        LEFT JOIN approval_lines al ON p.id = al.proposal_id
        GROUP BY p.id, p.title, p.status
        HAVING COUNT(al.id) > 0
        ORDER BY p.id
        LIMIT 10
      `);
      
      console.log('📊 품의서-결재라인 관계:');
      lineProposalRelation.forEach(rel => {
        console.log(`   품의서 ${rel.proposal_id}: "${rel.title}"`);
        console.log(`     상태: ${rel.proposal_status}`);
        console.log(`     결재라인: ${rel.approval_line_count}개 (승인: ${rel.approved_count}, 대기: ${rel.pending_count})`);
      });
      
    } catch (error) {
      console.log(`❌ 관계 분석 중 오류: ${error.message}`);
    }
    
    console.log('\n✅ 결재라인 참조 데이터 확인 완료!');
    
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkApprovalReferenceData(); 