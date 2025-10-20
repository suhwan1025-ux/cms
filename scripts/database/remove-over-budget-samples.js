const { Sequelize, DataTypes } = require('sequelize');
const config = require('../../config/database.js').development;

const sequelize = new Sequelize(config.database, config.username, config.password, config);

async function removeOverBudgetSamples() {
  try {
    console.log('🧹 2024년 예산 초과 품의서 삭제...');
    
    // 1. 2024년 예산 초과 사업 확인
    console.log('1. 2024년 예산 초과 사업 확인 중...');
    
    const overBudgetProjects = await sequelize.query(\
      SELECT 
        bb.id,
        bb.project_name,
        bb.budget_amount,
        bb.executed_amount,
        (bb.executed_amount - bb.budget_amount) as over_amount
      FROM business_budgets bb 
      WHERE bb.budget_year = 2024 
      AND bb.executed_amount > bb.budget_amount
    \, { type: Sequelize.QueryTypes.SELECT });
    
    if (overBudgetProjects.length === 0) {
      console.log('✅ 예산 초과 사업이 없습니다.');
      
      // 2. 대신 고액 품의서들을 확인하고 일부 삭제
      console.log('\\n2. 2024년 고액 품의서 확인 중...');
      
      const highAmountProposals = await sequelize.query(\
        SELECT 
          p.id,
          p.purpose,
          p.total_amount,
          bb.project_name,
          bb.budget_amount
        FROM proposals p 
        JOIN business_budgets bb ON p.budget_id = bb.id 
        WHERE bb.budget_year = 2024 
        AND p.status = 'approved'
        ORDER BY p.total_amount DESC 
        LIMIT 5
      \, { type: Sequelize.QueryTypes.SELECT });
      
      console.log('\\n=== 2024년 고액 품의서 TOP 5 ===');
      highAmountProposals.forEach((row, index) => {
        console.log(\\. \\);
        console.log(\   금액: \원\);
        console.log(\   사업: \\);
        console.log(\   예산: \원\);
        console.log(\   품의서ID: \\);
        console.log('');
      });
      
      // 3. 상위 2개 고액 품의서 삭제
      if (highAmountProposals.length >= 2) {
        const proposalsToDelete = highAmountProposals.slice(0, 2);
        
        console.log('\\n3. 상위 2개 고액 품의서 삭제 중...');
        
        for (const proposal of proposalsToDelete) {
          console.log(\삭제 중: \ (\원)\);
          
          // 관련 구매품목 삭제
          await sequelize.query(\
            DELETE FROM purchase_items 
            WHERE proposal_id = \
          \);
          
          // 관련 용역항목 삭제
          await sequelize.query(\
            DELETE FROM service_items 
            WHERE proposal_id = \
          \);
          
          // 품의서 삭제
          await sequelize.query(\
            DELETE FROM proposals 
            WHERE id = \
          \);
          
          console.log(\✅ 삭제 완료: \\);
        }
        
        console.log('\\n🎉 2024년 고액 품의서 2건 삭제 완료!');
      }
      
    } else {
      console.log('\\n=== 예산 초과 사업 발견 ===');
      overBudgetProjects.forEach(project => {
        console.log(\사업명: \\);
        console.log(\예산: \원\);
        console.log(\집행: \원\);
        console.log(\초과: \원\);
        console.log(\예산ID: \\);
        console.log('');
      });
      
      // 예산 초과 사업의 품의서들 삭제
      for (const project of overBudgetProjects) {
        console.log(\\\n\ 사업의 품의서들 삭제 중...\);
        
        const proposals = await sequelize.query(\
          SELECT id, purpose, total_amount
          FROM proposals 
          WHERE budget_id = \ 
          AND status = 'approved'
        \, { type: Sequelize.QueryTypes.SELECT });
        
        for (const proposal of proposals) {
          console.log(\삭제 중: \ (\원)\);
          
          // 관련 구매품목 삭제
          await sequelize.query(\
            DELETE FROM purchase_items 
            WHERE proposal_id = \
          \);
          
          // 관련 용역항목 삭제
          await sequelize.query(\
            DELETE FROM service_items 
            WHERE proposal_id = \
          \);
          
          // 품의서 삭제
          await sequelize.query(\
            DELETE FROM proposals 
            WHERE id = \
          \);
          
          console.log(\✅ 삭제 완료: \\);
        }
      }
      
      console.log('\\n🎉 예산 초과 품의서 삭제 완료!');
    }
    
    // 4. 삭제 후 현황 확인
    console.log('\\n4. 삭제 후 현황 확인...');
    
    const remainingProposals = await sequelize.query(\
      SELECT COUNT(*) as count
      FROM proposals p 
      JOIN business_budgets bb ON p.budget_id = bb.id 
      WHERE bb.budget_year = 2024 
      AND p.status = 'approved'
    \, { type: Sequelize.QueryTypes.SELECT });
    
    console.log(\✅ 2024년 남은 품의서: \건\);
    
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
  } finally {
    await sequelize.close();
  }
}

removeOverBudgetSamples();
