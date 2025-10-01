const express = require('express');
const cors = require('cors');
const { Sequelize } = require('sequelize');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// 미들웨어 설정
app.use(cors());
app.use(express.json());

// 정적 파일 제공
app.use(express.static('public'));
app.use(express.static('.'));

// 사업예산 집행금액 동기화 함수
async function updateBudgetExecutionAmount() {
  try {
    // 결재완료된 품의서들의 총 계약금액 조회
    const approvedProposals = await sequelize.query(`
      SELECT 
        p.id as proposal_id,
        p.total_amount as totalAmount,
        p.budget_id as budget_id,
        COALESCE(SUM(cd.amount), 0) as total_dept_amount
      FROM proposals p
      LEFT JOIN cost_departments cd ON p.id = cd.proposal_id
      WHERE p.status = 'approved'
      GROUP BY p.id, p.total_amount, p.budget_id
    `);

    const proposalData = approvedProposals[0] || [];
    
    // 사업예산별로 집행금액 계산
    const budgetExecutions = {};
    
    proposalData.forEach(proposal => {
      if (proposal.budget_id) {
        if (!budgetExecutions[proposal.budget_id]) {
          budgetExecutions[proposal.budget_id] = 0;
        }
        // 비용귀속부서 금액이 품의서 총액과 일치하는지 검증
        // 일치하지 않으면 품의서 총액을 사용 (중복 계산 방지)
        let amount;
        if (proposal.total_dept_amount > 0 && Math.abs(proposal.total_dept_amount - proposal.totalAmount) < 100) {
          // 금액이 거의 일치하면 비용귀속부서 금액 사용
          amount = proposal.total_dept_amount;
        } else {
          // 금액이 다르면 품의서 총액 사용 (중복 계산 방지)
          amount = proposal.totalAmount;
        }
        budgetExecutions[proposal.budget_id] += parseFloat(amount || 0);
      }
    });

    // 각 사업예산의 집행금액 업데이트
    for (const [budgetId, executedAmount] of Object.entries(budgetExecutions)) {
      await sequelize.query(`
        UPDATE business_budgets 
        SET executed_amount = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, {
        replacements: [executedAmount, budgetId]
      });
    }

    console.log('사업예산 집행금액 동기화 완료:', budgetExecutions);
  } catch (error) {
    console.error('사업예산 집행금액 동기화 실패:', error);
  }
}

// 데이터베이스 연결
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

// 모델 로드
const models = require('./src/models');

// API 라우트

// 1. 부서 목록 조회
app.get('/api/departments', async (req, res) => {
  try {
    const departments = await models.Department.findAll({
      where: { isActive: true },
      order: [['name', 'ASC']]
    });
    res.json(departments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. 공급업체 목록 조회
app.get('/api/suppliers', async (req, res) => {
  try {
    const suppliers = await models.Supplier.findAll({
      where: { isActive: true },
      order: [['name', 'ASC']]
    });
    res.json(suppliers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. 예산 목록 조회
app.get('/api/budgets', async (req, res) => {
  try {
    const budgets = await models.Budget.findAll({
      where: { isActive: true },
      order: [['name', 'ASC']]
    });
    res.json(budgets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3-1. 사업예산 통계 데이터 조회
app.get('/api/budget-statistics', async (req, res) => {
  try {
    // 결재완료된 품의서와 관련 사업예산 정보를 함께 조회
    const proposalBudgetData = await sequelize.query(`
      SELECT 
        p.id as proposal_id,
        p.total_amount as "totalAmount",
        p.contract_type as "contractType",
        p.created_at as "proposalCreatedAt",
        p.budget_id as "budgetName",
        bb.id as budget_id,
        bb.project_name as "projectName",
        bb.initiator_department as "initiatorDepartment",
        bb.executor_department as "executorDepartment",
        bb.budget_type as "budgetType",
        bb.budget_category as "budgetCategory",
        bb.budget_amount as "budgetAmount"
      FROM proposals p
      LEFT JOIN business_budgets bb ON p.budget_id = bb.id
      WHERE p.status = 'approved'
    `);

    // 모든 사업예산 데이터 가져오기
    const allBudgetData = await sequelize.query(`
      SELECT 
        id,
        project_name as "projectName",
        initiator_department as "initiatorDepartment",
        executor_department as "executorDepartment",
        budget_type as "budgetType",
        budget_category as "budgetCategory",
        budget_amount as "budgetAmount",
        start_date as "startDate",
        end_date as "endDate",
        is_essential as "isEssential",
        project_purpose as "projectPurpose",
        budget_year as "budgetYear",
        status,
        created_by as "createdBy",
        created_at as "createdAt"
      FROM business_budgets 
      ORDER BY created_at DESC
    `);

    const proposalBudgets = proposalBudgetData[0] || [];
    const allBudgets = allBudgetData[0] || [];

    // 사업예산별 실제 집행금액 계산
    const budgetExecutions = {};
    proposalBudgets.forEach(item => {
      if (item.budget_id && item.totalAmount) {
        if (!budgetExecutions[item.budget_id]) {
          budgetExecutions[item.budget_id] = 0;
        }
        budgetExecutions[item.budget_id] += parseFloat(item.totalAmount || 0);
      }
    });
    
    console.log('=== 사업예산 집행금액 계산 디버깅 ===');
    console.log('proposalBudgets:', proposalBudgets);
    console.log('budgetExecutions:', budgetExecutions);
    console.log('allBudgets 샘플:', allBudgets.slice(0, 2));

    // 각 사업예산에 실제 집행금액 추가
    const budgetsWithExecution = allBudgets.map(budget => ({
      ...budget,
      executedAmount: budgetExecutions[budget.id] || 0,
      remainingAmount: parseFloat(budget.budgetAmount || 0) - (budgetExecutions[budget.id] || 0),
      executionRate: parseFloat(budget.budgetAmount || 0) > 0 
        ? Math.round(((budgetExecutions[budget.id] || 0) / parseFloat(budget.budgetAmount || 0)) * 100) 
        : 0
    }));

    // 전체 통계 계산
    const totalBudgets = allBudgets.length;
    const totalBudgetAmount = allBudgets.reduce((sum, budget) => sum + parseFloat(budget.budgetAmount || 0), 0);
    const totalExecutedAmount = Object.values(budgetExecutions).reduce((sum, amount) => sum + amount, 0);
    const totalRemainingAmount = totalBudgetAmount - totalExecutedAmount;

    // 예산 유형별 통계 (실제 집행금액 반영)
    const budgetByType = {};
    budgetsWithExecution.forEach(budget => {
      const type = budget.budgetType;
      if (!budgetByType[type]) {
        budgetByType[type] = { type, totalAmount: 0, executedAmount: 0, count: 0 };
      }
      budgetByType[type].totalAmount += parseFloat(budget.budgetAmount || 0);
      budgetByType[type].executedAmount += budget.executedAmount;
      budgetByType[type].count += 1;
    });

    // 부서별 통계 (실제 집행금액 반영)
    const budgetByDepartment = {};
    budgetsWithExecution.forEach(budget => {
      const dept = budget.executorDepartment;
      if (!budgetByDepartment[dept]) {
        budgetByDepartment[dept] = { department: dept, totalAmount: 0, executedAmount: 0, count: 0 };
      }
      budgetByDepartment[dept].totalAmount += parseFloat(budget.budgetAmount || 0);
      budgetByDepartment[dept].executedAmount += budget.executedAmount;
      budgetByDepartment[dept].count += 1;
    });

    // 년도별 통계 (실제 집행금액 반영)
    const budgetByYear = {};
    budgetsWithExecution.forEach(budget => {
      const year = budget.budgetYear;
      if (!budgetByYear[year]) {
        budgetByYear[year] = { year, totalAmount: 0, executedAmount: 0, count: 0 };
      }
      budgetByYear[year].totalAmount += parseFloat(budget.budgetAmount || 0);
      budgetByYear[year].executedAmount += budget.executedAmount;
      budgetByYear[year].count += 1;
    });

    // 현재 연도 가져오기
    const currentYear = new Date().getFullYear();

    res.json({
      totalBudgets,
      totalBudgetAmount,
      executedBudgetAmount: totalExecutedAmount,
      remainingBudgetAmount: totalRemainingAmount,
      budgetByType: Object.values(budgetByType),
      budgetByDepartment: Object.values(budgetByDepartment),
      budgetByYear: Object.values(budgetByYear),
      budgetData: budgetsWithExecution,
      currentYear,
      approvedProposalsCount: proposalBudgets.length,
      totalExecutedFromProposals: totalExecutedAmount,
      budgetExecutions
    });
  } catch (error) {
    console.error('사업예산 통계 조회 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 3-2. 사업예산 목록 조회
app.get('/api/business-budgets', async (req, res) => {
  try {
    const { year, status, department, type } = req.query;
    
    let whereClause = 'WHERE 1=1';
    const replacements = [];
    
    if (year) {
      whereClause += ' AND bb.budget_year = ?';
      replacements.push(parseInt(year));
    }
    
    if (status) {
      whereClause += ' AND bb.status = ?';
      replacements.push(status);
    }
    
    if (department) {
      whereClause += ' AND (bb.initiator_department = ? OR bb.executor_department = ?)';
      replacements.push(department, department);
    }
    
    if (type) {
      whereClause += ' AND bb.budget_type = ?';
      replacements.push(type);
    }
    
    // 사업예산과 실제 품의서 집행금액을 함께 조회
    const budgets = await sequelize.query(`
      SELECT 
        bb.*,
        COALESCE(SUM(bbd.total_amount), 0) as detail_total_amount,
        COUNT(bbd.id) as detail_count,
        COALESCE(proposal_executions.executed_amount, 0) as actual_executed_amount,
        COALESCE(proposal_executions.proposal_count, 0) as executed_proposal_count
      FROM business_budgets bb
      LEFT JOIN business_budget_details bbd ON bb.id = bbd.budget_id
      LEFT JOIN (
        SELECT 
          p.budget_id as budget_id,
          SUM(p.total_amount) as executed_amount,
          COUNT(p.id) as proposal_count
        FROM proposals p
        WHERE p.status = 'approved' AND p.budget_id IS NOT NULL
        GROUP BY p.budget_id
      ) as proposal_executions ON bb.id = proposal_executions.budget_id
      ${whereClause}
      GROUP BY bb.id, proposal_executions.executed_amount, proposal_executions.proposal_count
      ORDER BY bb.created_at DESC
    `, { replacements });
    
    // 각 예산의 집행률과 잔여금액 계산
    const budgetsWithCalculations = budgets[0].map(budget => ({
      ...budget,
      executed_amount: budget.actual_executed_amount || 0,
      remaining_amount: parseFloat(budget.budget_amount || 0) - parseFloat(budget.actual_executed_amount || 0),
      execution_rate: parseFloat(budget.budget_amount || 0) > 0 
        ? Math.round((parseFloat(budget.actual_executed_amount || 0) / parseFloat(budget.budget_amount || 0)) * 100) 
        : 0
    }));
    
    res.json(budgetsWithCalculations);
  } catch (error) {
    console.error('사업예산 목록 조회 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 3-3. 사업예산 상세 조회
app.get('/api/business-budgets/:id', async (req, res) => {
  try {
    const budgetId = req.params.id;
    
    // 사업예산 기본 정보
    const budget = await sequelize.query(`
      SELECT * FROM business_budgets WHERE id = ?
    `, { replacements: [budgetId] });
    
    if (budget[0].length === 0) {
      return res.status(404).json({ error: '사업예산을 찾을 수 없습니다.' });
    }
    
    // 상세 내역
    const details = await sequelize.query(`
      SELECT * FROM business_budget_details WHERE budget_id = ? ORDER BY id
    `, { replacements: [budgetId] });
    
    // 승인 이력
    const approvals = await sequelize.query(`
      SELECT * FROM business_budget_approvals WHERE budget_id = ? ORDER BY approved_at
    `, { replacements: [budgetId] });
    
    res.json({
      budget: budget[0][0],
      details: details[0],
      approvals: approvals[0]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3-4. 사업예산 생성
app.post('/api/business-budgets', async (req, res) => {
  try {
    const budgetData = req.body;
    
    // 사업예산 생성
    const budgetResult = await sequelize.query(`
      INSERT INTO business_budgets (
        project_name, initiator_department, executor_department,
        budget_type, budget_category, budget_amount, executed_amount,
        start_date, end_date, is_essential, project_purpose, budget_year, status, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING id
    `, {
      replacements: [
        budgetData.projectName,
        budgetData.initiatorDepartment,
        budgetData.executorDepartment,
        budgetData.budgetType,
        budgetData.budgetCategory,
        budgetData.budgetAmount,
        budgetData.executedAmount || 0,
        budgetData.startDate,
        budgetData.endDate,
        budgetData.isEssential,
        budgetData.projectPurpose,
        budgetData.budgetYear,
        budgetData.status || '승인대기',
        budgetData.createdBy || '작성자'
      ]
    });
    
    const budgetId = budgetResult[0][0].id;
    
    // 상세 내역 생성
    if (budgetData.details && budgetData.details.length > 0) {
      for (const detail of budgetData.details) {
        await sequelize.query(`
          INSERT INTO business_budget_details (
            budget_id, item_name, item_description, unit_price, quantity, total_amount
          ) VALUES (?, ?, ?, ?, ?, ?)
        `, {
          replacements: [
            budgetId,
            detail.itemName,
            detail.itemDescription,
            detail.unitPrice,
            detail.quantity,
            detail.totalAmount
          ]
        });
      }
    }
    
    res.status(201).json({
      message: '사업예산이 성공적으로 생성되었습니다.',
      budgetId: budgetId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3-5. 사업예산 수정
app.put('/api/business-budgets/:id', async (req, res) => {
  try {
    const budgetId = req.params.id;
    const budgetData = req.body;
    
    // 사업예산 수정
    await sequelize.query(`
      UPDATE business_budgets SET
        project_name = ?,
        initiator_department = ?,
        executor_department = ?,
        budget_type = ?,
        budget_category = ?,
        budget_amount = ?,
        executed_amount = ?,
        start_date = ?,
        end_date = ?,
        is_essential = ?,
        project_purpose = ?,
        budget_year = ?,
        status = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, {
      replacements: [
        budgetData.projectName,
        budgetData.initiatorDepartment,
        budgetData.executorDepartment,
        budgetData.budgetType,
        budgetData.budgetCategory,
        budgetData.budgetAmount,
        budgetData.executedAmount,
        budgetData.startDate,
        budgetData.endDate,
        budgetData.isEssential,
        budgetData.projectPurpose,
        budgetData.budgetYear,
        budgetData.status,
        budgetId
      ]
    });
    
    // 기존 상세 내역 삭제
    await sequelize.query(`
      DELETE FROM business_budget_details WHERE budget_id = ?
    `, { replacements: [budgetId] });
    
    // 새로운 상세 내역 생성
    if (budgetData.details && budgetData.details.length > 0) {
      for (const detail of budgetData.details) {
        await sequelize.query(`
          INSERT INTO business_budget_details (
            budget_id, item_name, item_description, unit_price, quantity, total_amount
          ) VALUES (?, ?, ?, ?, ?, ?)
        `, {
          replacements: [
            budgetId,
            detail.itemName,
            detail.itemDescription,
            detail.unitPrice,
            detail.quantity,
            detail.totalAmount
          ]
        });
      }
    }
    
    res.json({ message: '사업예산이 성공적으로 수정되었습니다.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3-6. 사업예산 삭제
app.delete('/api/business-budgets/:id', async (req, res) => {
  try {
    const budgetId = req.params.id;
    
    // 사업예산 삭제 (CASCADE로 상세내역과 승인이력도 함께 삭제됨)
    await sequelize.query(`
      DELETE FROM business_budgets WHERE id = ?
    `, { replacements: [budgetId] });
    
    res.json({ message: '사업예산이 성공적으로 삭제되었습니다.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3-7. 사업예산 승인
app.post('/api/business-budgets/:id/approve', async (req, res) => {
  try {
    const budgetId = req.params.id;
    const { approverName, approverTitle, approvalStatus, approvalComment } = req.body;
    
    // 승인 이력 추가
    await sequelize.query(`
      INSERT INTO business_budget_approvals (
        budget_id, approver_name, approver_title, approval_status, approval_comment
      ) VALUES (?, ?, ?, ?, ?)
    `, {
      replacements: [budgetId, approverName, approverTitle, approvalStatus, approvalComment]
    });
    
    // 사업예산 상태 업데이트
    await sequelize.query(`
      UPDATE business_budgets SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `, { replacements: [approvalStatus === '승인' ? '진행중' : '반려', budgetId] });
    
    res.json({ message: '승인이 처리되었습니다.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

  // 4. 계약방식 목록 조회
  app.get('/api/contract-methods', async (req, res) => {
    try {
      const contractMethods = await sequelize.query(`
        SELECT * FROM contract_methods 
        WHERE is_active = true 
        ORDER BY id
      `);
      res.json(contractMethods[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // 5. 결재자 목록 조회
  app.get('/api/approval-approvers', async (req, res) => {
    try {
      const approvers = await sequelize.query(`
        SELECT 
          aa.*,
          array_agg(ac.condition_label) as conditions
        FROM approval_approvers aa
        LEFT JOIN approval_conditions ac ON aa.id = ac.approver_id
        WHERE aa.is_active = true
        GROUP BY aa.id
        ORDER BY aa.id
      `);
      res.json(approvers[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // 6. 결재라인 규칙 조회
  app.get('/api/approval-rules', async (req, res) => {
    try {
      const rules = await sequelize.query(`
        SELECT * FROM approval_rules 
        WHERE is_active = true 
        ORDER BY rule_type, id
      `);
      res.json(rules[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // 7. 결재라인 참고자료 조회
  app.get('/api/approval-references', async (req, res) => {
    try {
      const references = await sequelize.query(`
        SELECT * FROM approval_references 
        WHERE is_active = true 
        ORDER BY min_amount
      `);
      res.json(references[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // 8. 기존 구매 내역 조회 (추천용) - 품의서 작성완료된 정보만 (테스트 데이터 제외)
  app.get('/api/purchase-history', async (req, res) => {
    try {
      const { search, field, category } = req.query;
      let whereClause = 'WHERE p.status = \'approved\' AND p.created_by != \'테스트사용자\'';
      const replacements = [];
      
      // 구분(카테고리) 필터 추가
      if (category && category.trim()) {
        whereClause += ' AND pi.item = ?';
        replacements.push(category.trim());
        console.log('구분 필터 적용:', category.trim());
      }
      
      if (search && search.trim()) {
        const searchTerm = `%${search.trim()}%`;
        
        if (field === 'item') {
          whereClause += ' AND pi.item ILIKE ?';
          replacements.push(searchTerm);
        } else if (field === 'productName') {
          whereClause += ' AND pi.product_name ILIKE ?';
          replacements.push(searchTerm);
        } else if (field === 'supplier') {
          whereClause += ' AND pi.supplier ILIKE ?';
          replacements.push(searchTerm);
        } else {
          // 전체 검색
          whereClause += ' AND (pi.item ILIKE ? OR pi.product_name ILIKE ? OR pi.supplier ILIKE ?)';
          replacements.push(searchTerm, searchTerm, searchTerm);
        }
      }
      
      const history = await sequelize.query(`
        SELECT 
          pi.item,
          pi.product_name,
          pi.supplier,
          COUNT(*) as frequency,
          AVG(pi.unit_price) as avg_unit_price,
          MAX(p.approval_date) as last_purchase_date,
          p.contract_type,
          p.total_amount as proposal_total_amount
        FROM purchase_items pi
        INNER JOIN proposals p ON pi.proposal_id = p.id
        ${whereClause}
        GROUP BY pi.item, pi.product_name, pi.supplier, p.contract_type, p.total_amount
        ORDER BY frequency DESC, last_purchase_date DESC
        LIMIT 15
      `, { replacements });
      
      res.json(history[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

// 4. 품의서 생성
app.post('/api/proposals', async (req, res) => {
  try {
    const proposalData = req.body;
    
    // 필수 필드 검증 및 기본값 설정 (강화)
    console.log('\n🔥🔥🔥 === 서버 수신 데이터 (상세) === 🔥🔥🔥');
    console.log('전체 req.body:', JSON.stringify(proposalData, null, 2));
    console.log('contractType 값:', proposalData.contractType, '타입:', typeof proposalData.contractType);
    console.log('createdBy 값:', proposalData.createdBy, '타입:', typeof proposalData.createdBy);
    console.log('purpose 값:', proposalData.purpose, '타입:', typeof proposalData.purpose);
    console.log('budget 값:', proposalData.budget, '타입:', typeof proposalData.budget);
    console.log('accountSubject 값:', proposalData.accountSubject, '타입:', typeof proposalData.accountSubject);
    console.log('basis 값:', proposalData.basis, '타입:', typeof proposalData.basis);
    
    // contractType 검증 및 설정 (사용자 선택값 검증)
    if (!proposalData.contractType || proposalData.contractType === '' || proposalData.contractType === null || proposalData.contractType === undefined) {
      console.log('❌ contractType이 없음 - 사용자가 계약 유형을 선택해야 함');
      return res.status(400).json({ 
        error: '계약 유형을 선택해주세요. (구매계약, 용역계약, 변경계약, 연장계약, 자유양식 중 선택)' 
      });
    }
    
    // 유효한 계약 유형인지 검증
    const validContractTypes = ['purchase', 'service', 'change', 'extension', 'freeform'];
    if (!validContractTypes.includes(proposalData.contractType)) {
      console.log('❌ 유효하지 않은 계약 유형:', proposalData.contractType);
      return res.status(400).json({ 
        error: `유효하지 않은 계약 유형입니다: ${proposalData.contractType}. 허용된 값: ${validContractTypes.join(', ')}` 
      });
    }
    
    console.log('✅ 계약 유형 검증 통과:', {
      value: proposalData.contractType,
      description: {
        'purchase': '구매계약',
        'service': '용역계약',
        'change': '변경계약',
        'extension': '연장계약',
        'freeform': '자유양식'
      }[proposalData.contractType]
    });
    
    // createdBy 검증 및 설정 (사용자 정보 검증)
    if (!proposalData.createdBy || proposalData.createdBy === '' || proposalData.createdBy === null || proposalData.createdBy === undefined) {
      console.log('❌ createdBy가 없음 - 사용자 정보가 필요함');
      return res.status(400).json({ 
        error: '작성자 정보가 누락되었습니다. 로그인 상태를 확인해주세요.' 
      });
    }
    
    console.log('✅ 작성자 정보 검증 통과:', proposalData.createdBy);
    
    // purpose 검증 및 설정 (더 강력한 검증)
    if (!proposalData.purpose || proposalData.purpose === '' || proposalData.purpose === null || proposalData.purpose === undefined) {
      console.log('⚠️ purpose가 없음, 기본값 "품의서" 설정');
      proposalData.purpose = '품의서';
    }
    
    // budget 검증 및 변환 (budget_id가 필수)
    if (!proposalData.budget || proposalData.budget === null || proposalData.budget === undefined) {
      console.log('❌ budget이 없음 - 사업예산을 선택해야 함');
      return res.status(400).json({ 
        error: '사업예산을 선택해주세요.' 
      });
    }
    
    // budget을 정수로 변환
    const budgetId = parseInt(proposalData.budget);
    if (isNaN(budgetId)) {
      console.log('❌ budget이 유효하지 않은 숫자:', proposalData.budget);
      return res.status(400).json({ 
        error: '유효하지 않은 사업예산입니다. 다시 선택해주세요.' 
      });
    }
    proposalData.budget = budgetId;
    console.log('✅ budget 변환 완료:', proposalData.budget);
    
    // accountSubject 검증 (필수 필드)
    if (!proposalData.accountSubject || proposalData.accountSubject === '' || proposalData.accountSubject === null || proposalData.accountSubject === undefined) {
      console.log('❌ accountSubject가 없음 - 계정과목을 입력해야 함');
      return res.status(400).json({ 
        error: '계정과목을 입력해주세요.' 
      });
    }
    
    // basis 검증 (필수 필드)
    if (!proposalData.basis || proposalData.basis === '' || proposalData.basis === null || proposalData.basis === undefined) {
      console.log('❌ basis가 없음 - 근거를 입력해야 함');
      return res.status(400).json({ 
        error: '근거를 입력해주세요.' 
      });
    }
    
    console.log('=== 최종 설정된 데이터 ===');
    console.log('contractType:', proposalData.contractType);
    console.log('createdBy:', proposalData.createdBy);
    console.log('purpose:', proposalData.purpose);
    
    // 최종 검증
    if (!proposalData.contractType || !proposalData.createdBy || !proposalData.purpose) {
      throw new Error(`필수 필드 설정 실패: contractType=${proposalData.contractType}, createdBy=${proposalData.createdBy}, purpose=${proposalData.purpose}`);
    }
    
    // 품의서 생성 전 최종 확인
    console.log('=== 품의서 생성 시작 ===');
    console.log('생성할 데이터:', {
      contractType: proposalData.contractType,
      purpose: proposalData.purpose,
      createdBy: proposalData.createdBy,
      budgetId: proposalData.budget,
      totalAmount: proposalData.totalAmount,
      isDraft: proposalData.isDraft,
      status: proposalData.status
    });
    
    // enum 필드 처리 (빈 문자열을 null로 변환) - 일반 품의서용
    const processedPaymentMethodGeneral = proposalData.paymentMethod && proposalData.paymentMethod.trim() !== '' 
      ? proposalData.paymentMethod 
      : null;

    const processedContractMethodGeneral = proposalData.contractMethod && proposalData.contractMethod.trim() !== '' 
      ? proposalData.contractMethod 
      : null;

    console.log('🔧 일반 품의서 enum 필드 처리:', {
      originalPaymentMethod: proposalData.paymentMethod,
      processedPaymentMethodGeneral,
      originalContractMethod: proposalData.contractMethod,
      processedContractMethodGeneral
    });

    // 품의서 생성 (모든 필수 필드가 검증된 상태)
    console.log('🔥 Sequelize create 직전 데이터:');
    const createData = {
      contractType: proposalData.contractType, // camelCase 사용 (Sequelize가 자동 변환)
      title: proposalData.title || '',
      purpose: proposalData.purpose,
      basis: proposalData.basis,
      budgetId: proposalData.budget, // camelCase 사용
      contractMethod: processedContractMethodGeneral,
      accountSubject: proposalData.accountSubject, // camelCase 사용
      totalAmount: proposalData.totalAmount || 0,
      changeReason: proposalData.changeReason || '',
      extensionReason: proposalData.extensionReason || '',
      contractPeriod: proposalData.contractPeriod || '',
      contractStartDate: proposalData.contractStartDate || null,
      contractEndDate: proposalData.contractEndDate || null,
      paymentMethod: processedPaymentMethodGeneral,
      wysiwygContent: proposalData.wysiwygContent || '', // 자유양식 문서 내용 추가
      status: proposalData.isDraft ? 'draft' : 'submitted', // 요청된 상태에 따라 설정
      createdBy: proposalData.createdBy, // camelCase 사용
      isDraft: proposalData.isDraft !== undefined ? proposalData.isDraft : true // 요청된 값 또는 기본값
    };
    console.log('createData:', JSON.stringify(createData, null, 2));
    
    const proposal = await models.Proposal.create(createData);
    
    console.log('✅ 품의서 생성 성공:', {
      id: proposal.id,
      contractType: proposal.contractType,
      createdBy: proposal.createdBy,
      purpose: proposal.purpose
    });

    // 구매품목 생성 (임시저장)
    if (proposalData.purchaseItems && proposalData.purchaseItems.length > 0) {
      const purchaseItems = proposalData.purchaseItems.map(item => ({
        proposalId: proposal.id,
        item: item.item || '',
        productName: item.productName || '',
        quantity: item.quantity && item.quantity !== '' ? parseInt(item.quantity) || 0 : 0,
        unitPrice: item.unitPrice && item.unitPrice !== '' ? parseInt(item.unitPrice) || 0 : 0,
        amount: item.amount && item.amount !== '' ? parseInt(item.amount) || 0 : 0,
        supplier: item.supplier || '',
        contractPeriodType: item.contractPeriodType || 'permanent',
        contractStartDate: item.contractStartDate || null,
        contractEndDate: item.contractEndDate || null
      }));
      
      console.log('🏢 구매품목 계약기간 저장 (전체):', purchaseItems.map(item => ({
        item: item.item,
        contractPeriodType: item.contractPeriodType,
        contractStartDate: item.contractStartDate,
        contractEndDate: item.contractEndDate
      })));
      
      await models.PurchaseItem.bulkCreate(purchaseItems);
    }

    // 용역항목 생성 (임시저장)
    if (proposalData.serviceItems && proposalData.serviceItems.length > 0) {
      const serviceItems = proposalData.serviceItems.map(item => ({
        proposalId: proposal.id,
        item: item.item || '',
        personnel: item.personnel || '',
        skillLevel: item.skillLevel || '',
        period: item.period || '',
        monthlyRate: item.monthlyRate && item.monthlyRate !== '' ? parseInt(item.monthlyRate) || 0 : 0,
        contractAmount: item.contractAmount && item.contractAmount !== '' ? parseInt(item.contractAmount) || 0 : 0,
        supplier: item.supplier || '',
        creditRating: item.creditRating || ''
      }));
      await models.ServiceItem.bulkCreate(serviceItems);
    }

    // 비용귀속부서 생성 (임시저장)
    if (proposalData.costDepartments && proposalData.costDepartments.length > 0) {
      const costDepartments = proposalData.costDepartments.map(dept => ({
        proposalId: proposal.id,
        department: dept.department || '',
        amount: dept.amount && dept.amount !== '' ? parseInt(dept.amount) || 0 : 0,
        ratio: dept.ratio && dept.ratio !== '' ? parseInt(dept.ratio) || 0 : 0
      }));
      await models.CostDepartment.bulkCreate(costDepartments);
    }

    // 결재라인 생성
    if (proposalData.approvalLine && proposalData.approvalLine.length > 0) {
      const approvalLines = proposalData.approvalLine.map((line, index) => ({
        proposalId: proposal.id,
        step: index + 1,
        name: line.name,
        title: line.title,
        description: line.description,
        isConditional: line.conditional || false,
        isFinal: line.final || false,
        status: 'pending'
      }));
      await models.ApprovalLine.bulkCreate(approvalLines);
    }

    // 구매품목별 비용분배 정보 저장 (일반 API에서도 처리)
    console.log('받은 purchaseItemCostAllocations:', proposalData.purchaseItemCostAllocations);
    
    if (proposalData.purchaseItemCostAllocations && proposalData.purchaseItemCostAllocations.length > 0) {
      console.log('=== 구매품목별 비용분배 정보 저장 시작 ===');
      console.log('저장할 비용분배 정보 수:', proposalData.purchaseItemCostAllocations.length);
      
      // 구매품목 ID 매핑을 위해 생성된 구매품목들을 조회
      const createdPurchaseItems = await models.PurchaseItem.findAll({
        where: { proposalId: proposal.id },
        order: [['id', 'ASC']]
      });
      
      console.log('생성된 구매품목 수:', createdPurchaseItems.length);
      
      proposalData.purchaseItemCostAllocations.forEach(alloc => {
        console.log(`비용분배 정보: 품목인덱스=${alloc.itemIndex}, 부서=${alloc.department}, 타입=${alloc.type}, 값=${alloc.value}, 금액=${alloc.amount}`);
        console.log('  전체 alloc 객체:', JSON.stringify(alloc, null, 2));
      });
      
      const costDepartments = proposalData.purchaseItemCostAllocations.map(alloc => {
        const purchaseItem = createdPurchaseItems[alloc.itemIndex];
        return {
          proposalId: proposal.id,
          purchaseItemId: purchaseItem ? purchaseItem.id : null,
          department: alloc.department,
          allocationType: alloc.type || 'percentage',
          ratio: alloc.value || 0, // ratio 필드 사용
          amount: alloc.amount || 0
        };
      });
      
      console.log('저장할 CostDepartment 데이터:', costDepartments);
      await models.CostDepartment.bulkCreate(costDepartments);
      console.log('✅ 구매품목별 비용분배 정보 저장 완료');
    }

    // 요청부서 생성
    if (proposalData.requestDepartments && proposalData.requestDepartments.length > 0) {
      console.log('🔥 요청부서 저장:', proposalData.requestDepartments);
      
      // 유효한 요청부서만 필터링
      const validRequestDepartments = proposalData.requestDepartments
        .filter(dept => {
          const deptName = typeof dept === 'string' ? dept : dept.department || dept.name || '';
          return deptName && deptName.trim() !== '';
        })
        .map(dept => {
          const deptName = typeof dept === 'string' ? dept : dept.department || dept.name || '';
          return {
            proposalId: proposal.id,
            name: deptName.trim(), // 필드명을 name으로 수정하고 trim() 적용
            code: typeof dept === 'object' ? (dept.code || null) : null
          };
        });
      
      console.log('🔥 필터링된 요청부서 데이터:', validRequestDepartments);
      
      if (validRequestDepartments.length > 0) {
        await models.RequestDepartment.bulkCreate(validRequestDepartments);
        console.log('✅ 요청부서 저장 완료:', validRequestDepartments.length, '개');
      } else {
        console.log('⚠️ 유효한 요청부서가 없어 저장하지 않음');
      }
    }

    res.status(201).json({
      message: '품의서가 성공적으로 생성되었습니다.',
      proposalId: proposal.id
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. 품의서 목록 조회
app.get('/api/proposals', async (req, res) => {
  try {
    // budgetId 필터링 지원
    const whereClause = {};
    if (req.query.budgetId) {
      whereClause.budgetId = req.query.budgetId;
    }

    const proposals = await models.Proposal.findAll({
      where: whereClause,
      include: [
        {
          model: models.PurchaseItem,
          as: 'purchaseItems'
        },
        {
          model: models.ServiceItem,
          as: 'serviceItems'
        },
        {
          model: models.CostDepartment,
          as: 'costDepartments'
        },
        {
          model: models.ApprovalLine,
          as: 'approvalLines'
        },
        {
          model: models.RequestDepartment,
          as: 'requestDepartments'
        }
      ],
      order: [['createdAt', 'DESC']],
      attributes: { exclude: ['contract_method_id'] }
    });

    // 예산 정보와 비용분배 정보를 포함하여 응답
    const proposalsWithBudget = await Promise.all(proposals.map(async (proposal) => {
      const proposalData = proposal.toJSON();
      
      // 예산 정보 가져오기
      if (proposalData.budgetId) {
        try {
          const budgetResult = await sequelize.query(`
            SELECT project_name, budget_type, budget_category, budget_amount, budget_year
            FROM business_budgets 
            WHERE id = ?
          `, { replacements: [proposalData.budgetId] });
          
          if (budgetResult[0] && budgetResult[0].length > 0) {
            const budget = budgetResult[0][0];
            proposalData.budgetInfo = {
              projectName: budget.project_name,
              budgetType: budget.budget_type,
              budgetCategory: budget.budget_category,
              budgetAmount: budget.budget_amount,
              budgetYear: budget.budget_year
            };
          }
        } catch (error) {
          console.error('예산 정보 조회 실패:', error);
        }
      }
      
      // 각 구매품목에 비용분배 정보 추가 (목록 조회용)
      if (proposalData.purchaseItems) {
        proposalData.purchaseItems.forEach(purchaseItem => {
          // 해당 구매품목의 비용분배 정보 찾기
          const itemCostAllocations = proposalData.costDepartments.filter(dept => 
            dept.purchaseItemId === purchaseItem.id || 
            dept.purchaseItemId === null || 
            dept.purchaseItemId == null ||
            !dept.purchaseItemId
          );
          
          // costAllocations 필드 추가
          purchaseItem.costAllocations = itemCostAllocations.map(dept => ({
            department: dept.department,
            type: dept.allocationType || 'percentage',
            value: dept.ratio || 0, // ratio 필드 사용
            amount: dept.amount || 0
          }));
          
          // requestDepartments 배열로 변환
          if (purchaseItem.requestDepartment) {
            try {
              purchaseItem.requestDepartments = Array.isArray(purchaseItem.requestDepartment) 
                ? purchaseItem.requestDepartment 
                : JSON.parse(purchaseItem.requestDepartment);
            } catch (e) {
              purchaseItem.requestDepartments = [purchaseItem.requestDepartment];
            }
          } else {
            purchaseItem.requestDepartments = [];
          }
        });
      }
      
      return proposalData;
    }));

    res.json(proposalsWithBudget);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 6. 품의서 상세 조회
app.get('/api/proposals/:id', async (req, res) => {
  try {
    const proposal = await models.Proposal.findByPk(req.params.id, {
      include: [
        {
          model: models.PurchaseItem,
          as: 'purchaseItems'
        },
        {
          model: models.ServiceItem,
          as: 'serviceItems'
        },
        {
          model: models.CostDepartment,
          as: 'costDepartments'
        },
        {
          model: models.ApprovalLine,
          as: 'approvalLines'
        },
        {
          model: models.RequestDepartment,
          as: 'requestDepartments'
        }
      ]
    });
    
    if (!proposal) {
      return res.status(404).json({ error: '품의서를 찾을 수 없습니다.' });
    }

    // 구매품목별 비용분배 정보 추가
    const proposalData = proposal.toJSON();
    
    // 예산 정보 가져오기
    if (proposalData.budgetId) {
      try {
        const budgetResult = await sequelize.query(`
          SELECT project_name, budget_type, budget_category, budget_amount, budget_year
          FROM business_budgets 
          WHERE id = ?
        `, { replacements: [proposalData.budgetId] });
        
        if (budgetResult[0] && budgetResult[0].length > 0) {
          const budget = budgetResult[0][0];
          proposalData.budgetInfo = {
            projectName: budget.project_name,
            budgetType: budget.budget_type,
            budgetCategory: budget.budget_category,
            budgetAmount: budget.budget_amount,
            budgetYear: budget.budget_year
          };
        }
      } catch (error) {
        console.error('예산 정보 조회 실패:', error);
      }
    }
    
    // 각 구매품목에 비용분배 정보와 요청부서 정보 추가
    if (proposalData.purchaseItems) {
      proposalData.purchaseItems.forEach(purchaseItem => {
        // 해당 구매품목의 비용분배 정보 찾기 (구매품목별 또는 품의서 전체)
        const itemCostAllocations = proposalData.costDepartments.filter(dept => 
          dept.purchaseItemId === purchaseItem.id || 
          dept.purchaseItemId === null || 
          dept.purchaseItemId == null ||
          !dept.purchaseItemId
        );
        
        console.log(`구매품목 "${purchaseItem.item}" (ID: ${purchaseItem.id}) 비용분배 찾기:`, itemCostAllocations.length, '개');
        console.log('  - 전체 costDepartments:', proposalData.costDepartments.length, '개');
        console.log('  - 필터링된 itemCostAllocations:', itemCostAllocations);
        proposalData.costDepartments.forEach((dept, index) => {
          console.log(`    costDepartment ${index + 1}: purchaseItemId=${dept.purchaseItemId}, department=${dept.department}`);
        });
        
        // costAllocations 필드 추가
        purchaseItem.costAllocations = itemCostAllocations.map(dept => ({
          department: dept.department,
          type: dept.allocationType || 'percentage',
          value: dept.ratio || 0, // ratio 필드 사용
          amount: dept.amount || 0
        }));
        
        // requestDepartments 배열로 변환 (JSON 배열 지원)
        if (purchaseItem.requestDepartment) {
          try {
            // JSON 배열로 저장된 경우
            purchaseItem.requestDepartments = Array.isArray(purchaseItem.requestDepartment) 
              ? purchaseItem.requestDepartment 
              : JSON.parse(purchaseItem.requestDepartment);
          } catch (e) {
            // 기존 단일 문자열 데이터 호환성
            purchaseItem.requestDepartments = [purchaseItem.requestDepartment];
          }
        } else {
          purchaseItem.requestDepartments = [];
        }
        
        console.log(`구매품목 "${purchaseItem.item}" 요청부서 (전체):`, purchaseItem.requestDepartments);
      });
    }
    
    res.json(proposalData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 6-1. 품의서 업데이트
app.put('/api/proposals/:id', async (req, res) => {
  try {
    const proposalData = req.body;
    console.log('=== 품의서 수정 요청 ===');
    console.log('수정할 데이터:', {
      proposalId: req.params.id,
      isDraft: proposalData.isDraft,
      status: proposalData.status,
      purpose: proposalData.purpose
    });
    
    const proposal = await models.Proposal.findByPk(req.params.id);
    
    if (!proposal) {
      return res.status(404).json({ error: '품의서를 찾을 수 없습니다.' });
    }
    
    // budgetId 검증 및 변환
    let budgetId = null;
    if (proposalData.budget) {
      if (typeof proposalData.budget === 'string') {
        budgetId = parseInt(proposalData.budget);
        if (isNaN(budgetId)) {
          return res.status(400).json({ 
            error: '유효하지 않은 예산 정보입니다. 예산을 다시 선택해주세요.' 
          });
        }
      } else {
        budgetId = proposalData.budget;
      }
    }

    console.log('🔄 품의서 업데이트:', {
      id: req.params.id,
      contractType: proposalData.contractType,
      budgetId: budgetId,
      createdBy: proposalData.createdBy || '사용자1'
    });

    // enum 필드 처리 (빈 문자열을 null로 변환)
    const processedPaymentMethod = proposalData.paymentMethod && proposalData.paymentMethod.trim() !== '' 
      ? proposalData.paymentMethod 
      : (proposal.paymentMethod || null);

    const processedContractMethod = proposalData.contractMethod && proposalData.contractMethod.trim() !== '' 
      ? proposalData.contractMethod 
      : (proposal.contractMethod || null);

    console.log('🔧 enum 필드 처리:', {
      originalPaymentMethod: proposalData.paymentMethod,
      processedPaymentMethod,
      originalContractMethod: proposalData.contractMethod,
      processedContractMethod
    });

    // 품의서 기본 정보 업데이트
    await proposal.update({
      contractType: proposalData.contractType || proposal.contractType,
      title: proposalData.title !== undefined ? proposalData.title : proposal.title,
      purpose: proposalData.purpose || proposal.purpose,
      basis: proposalData.basis || proposal.basis,
      budgetId: budgetId || proposal.budgetId,
      contractMethod: processedContractMethod,
      accountSubject: proposalData.accountSubject || proposal.accountSubject,
      totalAmount: proposalData.totalAmount || proposal.totalAmount || 0,
      changeReason: proposalData.changeReason || proposal.changeReason,
      extensionReason: proposalData.extensionReason || proposal.extensionReason,
      contractPeriod: proposalData.contractPeriod || proposal.contractPeriod,
        contractStartDate: proposalData.contractStartDate || proposal.contractStartDate || null,
        contractEndDate: proposalData.contractEndDate || proposal.contractEndDate || null,
      paymentMethod: processedPaymentMethod,
      wysiwygContent: proposalData.wysiwygContent || proposal.wysiwygContent || '', // 자유양식 문서 내용 추가
      createdBy: proposalData.createdBy || proposal.createdBy || '사용자1',
      status: proposalData.isDraft ? 'draft' : 'submitted',
      isDraft: proposalData.isDraft !== undefined ? proposalData.isDraft : false
    });

    // 트랜잭션 시작
    const transaction = await sequelize.transaction();
    
    try {
      // 기존 관련 데이터 삭제 (외래키 제약조건을 고려한 순서)
      console.log('🗑️ 기존 관련 데이터 삭제 시작...');
      
      // 1. 먼저 참조하는 테이블들 삭제
      await models.CostDepartment.destroy({ where: { proposalId: proposal.id }, transaction });
      console.log('✅ CostDepartment 삭제 완료');
      
      await models.RequestDepartment.destroy({ where: { proposalId: proposal.id }, transaction });
      console.log('✅ RequestDepartment 삭제 완료');
      
      await models.ApprovalLine.destroy({ where: { proposalId: proposal.id }, transaction });
      console.log('✅ ApprovalLine 삭제 완료');
      
      // 2. 그 다음 참조되는 테이블들 삭제
      await models.PurchaseItem.destroy({ where: { proposalId: proposal.id }, transaction });
      console.log('✅ PurchaseItem 삭제 완료');
      
      await models.ServiceItem.destroy({ where: { proposalId: proposal.id }, transaction });
      console.log('✅ ServiceItem 삭제 완료');
      
      console.log('🗑️ 모든 관련 데이터 삭제 완료');
      
      // 새 데이터 생성
      if (proposalData.costDepartments && proposalData.costDepartments.length > 0) {
        const costDepartments = proposalData.costDepartments.map(dept => ({
          proposalId: proposal.id,
          department: dept.department || '',
          amount: dept.amount && dept.amount !== '' ? parseInt(dept.amount) || 0 : 0,
          ratio: dept.ratio && dept.ratio !== '' ? parseInt(dept.ratio) || 0 : 0
        }));
        await models.CostDepartment.bulkCreate(costDepartments, { transaction });
        console.log('✅ CostDepartment 생성 완료');
      }

      if (proposalData.purchaseItems && proposalData.purchaseItems.length > 0) {
        const purchaseItems = proposalData.purchaseItems.map(item => ({
          proposalId: proposal.id,
          item: item.item || '',
          productName: item.productName || '',
          quantity: item.quantity && item.quantity !== '' ? parseInt(item.quantity) || 0 : 0,
          unitPrice: item.unitPrice && item.unitPrice !== '' ? parseInt(item.unitPrice) || 0 : 0,
          amount: item.amount && item.amount !== '' ? parseInt(item.amount) || 0 : 0,
          supplier: item.supplier || '',
          contractPeriodType: item.contractPeriodType || 'permanent',
          contractStartDate: item.contractStartDate || null,
        contractEndDate: item.contractEndDate || null
        }));
        await models.PurchaseItem.bulkCreate(purchaseItems, { transaction });
        console.log('✅ PurchaseItem 생성 완료');
      }

      if (proposalData.serviceItems && proposalData.serviceItems.length > 0) {
        const serviceItems = proposalData.serviceItems.map(item => ({
          proposalId: proposal.id,
          item: item.item || '',
          personnel: item.personnel || '',
          skillLevel: item.skillLevel || '',
          period: item.period || '',
          monthlyRate: item.monthlyRate && item.monthlyRate !== '' ? parseInt(item.monthlyRate) || 0 : 0,
          contractAmount: item.contractAmount && item.contractAmount !== '' ? parseInt(item.contractAmount) || 0 : 0,
          supplier: item.supplier || '',
          creditRating: item.creditRating || ''
        }));
        await models.ServiceItem.bulkCreate(serviceItems, { transaction });
        console.log('✅ ServiceItem 생성 완료');
      }

      if (proposalData.approvalLine && proposalData.approvalLine.length > 0) {
        const approvalLines = proposalData.approvalLine.map((line, index) => ({
          proposalId: proposal.id,
          step: index + 1,
          name: line.name,
          title: line.title,
          description: line.description,
          isConditional: line.conditional || false,
          isFinal: line.final || false,
          status: 'pending'
        }));
        await models.ApprovalLine.bulkCreate(approvalLines, { transaction });
        console.log('✅ ApprovalLine 생성 완료');
      }

      // 구매품목별 비용분배 정보 저장 (PUT API에서도 처리)
      console.log('받은 purchaseItemCostAllocations:', proposalData.purchaseItemCostAllocations);
      
      if (proposalData.purchaseItemCostAllocations && proposalData.purchaseItemCostAllocations.length > 0) {
        console.log('=== 구매품목별 비용분배 정보 저장 시작 (PUT) ===');
        console.log('저장할 비용분배 정보 수:', proposalData.purchaseItemCostAllocations.length);
        
        // 구매품목 ID 매핑을 위해 생성된 구매품목들을 조회
        const createdPurchaseItems = await models.PurchaseItem.findAll({
          where: { proposalId: proposal.id },
          order: [['id', 'ASC']],
          transaction
        });
        
        console.log('생성된 구매품목 수:', createdPurchaseItems.length);
        
        proposalData.purchaseItemCostAllocations.forEach(alloc => {
          console.log(`비용분배 정보: 품목인덱스=${alloc.itemIndex}, 부서=${alloc.department}, 타입=${alloc.type}, 값=${alloc.value}, 금액=${alloc.amount}`);
          console.log('  전체 alloc 객체:', JSON.stringify(alloc, null, 2));
        });
        
        const costDepartments = proposalData.purchaseItemCostAllocations.map(alloc => {
          const purchaseItem = createdPurchaseItems[alloc.itemIndex];
          return {
            proposalId: proposal.id,
            purchaseItemId: purchaseItem ? purchaseItem.id : null,
            department: alloc.department,
            allocationType: alloc.type || 'percentage',
            ratio: alloc.value || 0, // ratio 필드 사용
            amount: alloc.amount || 0
          };
        });
        
        console.log('저장할 CostDepartment 데이터:', costDepartments);
        await models.CostDepartment.bulkCreate(costDepartments, { transaction });
        console.log('✅ 구매품목별 비용분배 정보 저장 완료 (PUT)');
      }

      // 요청부서 생성
      if (proposalData.requestDepartments && proposalData.requestDepartments.length > 0) {
        console.log('🔥 요청부서 저장:', proposalData.requestDepartments);
        
        // 유효한 요청부서만 필터링
        const validRequestDepartments = proposalData.requestDepartments
          .filter(dept => {
            const deptName = typeof dept === 'string' ? dept : dept.department || dept.name || '';
            return deptName && deptName.trim() !== '';
          })
          .map(dept => {
            const deptName = typeof dept === 'string' ? dept : dept.department || dept.name || '';
            return {
              proposalId: proposal.id,
              name: deptName.trim(),
              code: typeof dept === 'object' ? (dept.code || null) : null
            };
          });
        
        console.log('🔥 필터링된 요청부서 데이터:', validRequestDepartments);
        
        if (validRequestDepartments.length > 0) {
          await models.RequestDepartment.bulkCreate(validRequestDepartments, { transaction });
          console.log('✅ 요청부서 저장 완료:', validRequestDepartments.length, '개');
        } else {
          console.log('⚠️ 유효한 요청부서가 없어 저장하지 않음');
        }
      }

      // 트랜잭션 커밋
      await transaction.commit();
      console.log('✅ 데이터 생성 완료');
      
    } catch (error) {
      // 트랜잭션 롤백
      await transaction.rollback();
      console.error('❌ 데이터 생성 실패:', error);
      throw error;
    }

    console.log('✅ 품의서 업데이트 완료:', {
      proposalId: proposal.id,
      status: proposal.status,
      isDraft: proposal.isDraft
    });

    res.json({
      message: '품의서가 성공적으로 업데이트되었습니다.',
      proposalId: proposal.id
    });
  } catch (error) {
    console.error('❌ 품의서 업데이트 실패:', {
      proposalId: req.params.id,
      error: error.message,
      stack: error.stack,
      requestBody: req.body
    });

    // 구체적인 에러 메시지 제공
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ 
        error: '입력 데이터 검증 실패',
        details: error.errors.map(e => e.message)
      });
    }
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ 
        error: '이미 존재하는 품의서입니다.',
        details: error.errors.map(e => e.message)
      });
    }
    
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({ 
        error: '참조하는 데이터가 존재하지 않습니다. 예산이나 부서 정보를 확인해주세요.',
        details: error.message 
      });
    }
    
    res.status(500).json({ 
      error: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
      details: error.message 
    });
  }
});

// 7. 품의서 상태 업데이트
app.patch('/api/proposals/:id/status', async (req, res) => {
  try {
    const { status, statusDate, changeReason, changedBy = '시스템관리자' } = req.body;
    const proposal = await models.Proposal.findByPk(req.params.id);
    
    if (!proposal) {
      return res.status(404).json({ error: '품의서를 찾을 수 없습니다.' });
    }
    
    const previousStatus = proposal.status;
    
    // 상태값을 enum 값으로 변환
    const statusMapping = {
      '품의서 작성': 'draft',
      '검토중': 'submitted',
      '승인됨': 'approved',
      '반려': 'rejected',
      '결재완료': 'approved',
      '예가산정': 'submitted',
      '입찰실시': 'submitted',
      '보고 품의': 'submitted',
      '계약체결': 'approved',
      '계약완료': 'approved',
      '승인대기': 'submitted'
    };
    
    const dbStatus = statusMapping[status] || 'submitted';
    
    // 상태 업데이트 (isDraft도 함께 업데이트)
    const updateData = { status: dbStatus };
    
    // 검토중, 승인됨 등의 상태로 변경되면 isDraft를 false로 설정
    if (dbStatus !== 'draft') {
      updateData.isDraft = false;
    }
    
    await proposal.update(updateData);
    
    // 상태에 따라 특정 날짜 필드 업데이트
    if (status === '결재완료' && statusDate) {
      await proposal.update({ approvalDate: statusDate });
    }
    
    // 결재완료 시 사업예산 집행금액 동기화
    if (status === '결재완료' && dbStatus === 'approved') {
      await updateBudgetExecutionAmount();
    }
    
    // 히스토리 저장
    await models.ProposalHistory.create({
      proposalId: proposal.id,
      previousStatus,
      newStatus: status,
      changedBy,
      changeReason
    });
    
    res.json({ 
      message: '상태가 업데이트되었습니다.', 
      status,
      historyId: proposal.id
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 7-1. 품의서 히스토리 조회
app.get('/api/proposals/:id/history', async (req, res) => {
  try {
    const histories = await models.ProposalHistory.findAll({
      where: { proposalId: req.params.id },
      order: [['createdAt', 'DESC']]
    });
    
    res.json(histories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 7-2. 결재완료일 업데이트
app.patch('/api/proposals/:id/approval-date', async (req, res) => {
  try {
    const { approvalDate } = req.body;
    const proposal = await models.Proposal.findByPk(req.params.id);
    
    if (!proposal) {
      return res.status(404).json({ error: '품의서를 찾을 수 없습니다.' });
    }
    
    // 결재완료일 업데이트
    await proposal.update({ approvalDate });
    
    res.json({ 
      message: '결재완료일이 업데이트되었습니다.', 
      approvalDate 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 8. 임시저장
app.post('/api/proposals/draft', async (req, res) => {
  try {
    const proposalData = req.body;
    console.log('=== 임시저장 요청 받음 ===');
    console.log('받은 데이터:', JSON.stringify(proposalData, null, 2));
    
    // 편집 모드인지 확인 (proposalId가 있으면 편집 모드)
    const isEditMode = proposalData.proposalId && proposalData.proposalId > 0;
    let proposal;
    
    if (isEditMode) {
      console.log('=== 편집 모드 - 기존 품의서 업데이트 ===');
      console.log('업데이트할 품의서 ID:', proposalData.proposalId);
      
      // 트랜잭션 시작
      const transaction = await models.sequelize.transaction();
      
      try {
        // 기존 품의서 조회
        proposal = await models.Proposal.findByPk(proposalData.proposalId, { transaction });
        if (!proposal) {
          await transaction.rollback();
          return res.status(404).json({ error: '수정할 품의서를 찾을 수 없습니다.' });
        }
      
      // budgetId 안전하게 처리 (편집 모드에서는 기존 값 유지 가능)
      let budgetId = proposal.budgetId; // 기존 값으로 초기화
      
      if (proposalData.budget) {
        const budgetNum = parseInt(proposalData.budget);
        if (!isNaN(budgetNum) && budgetNum > 0) {
          budgetId = budgetNum;
          console.log('✅ 임시저장 - budget 업데이트:', budgetId);
        } else {
          console.log('⚠️ 임시저장 - budget이 유효하지 않은 숫자, 기존 값 유지:', proposalData.budget, '→', budgetId);
        }
      } else {
        console.log('⚠️ 임시저장 - budget이 없음, 기존 값 유지:', budgetId);
      }
      
      // 임시저장에서는 budgetId 검증 제거 (null이어도 허용)
      console.log('📝 임시저장 - budgetId 상태:', budgetId);
      
      // enum 필드 처리 (빈 문자열을 null로 변환) - 임시저장용
      const processedPaymentMethodDraft = proposalData.paymentMethod && proposalData.paymentMethod.trim() !== '' 
        ? proposalData.paymentMethod 
        : (proposal.paymentMethod || null);

      const processedContractMethodDraft = proposalData.contractMethod && proposalData.contractMethod.trim() !== '' 
        ? proposalData.contractMethod 
        : (proposal.contractMethod || null);

      console.log('🔧 임시저장 enum 필드 처리:', {
        originalPaymentMethod: proposalData.paymentMethod,
        processedPaymentMethodDraft,
        originalContractMethod: proposalData.contractMethod,
        processedContractMethodDraft
      });

      // 기존 품의서 업데이트 (기존 값 유지 우선)
      await proposal.update({
        contractType: proposalData.contractType || proposal.contractType || 'purchase',
        title: proposalData.title || proposal.title || '', // 제목 필드 추가
        purpose: proposalData.purpose || proposal.purpose || '',
        basis: proposalData.basis || proposal.basis || '',
        budgetId: budgetId,
        contractMethod: processedContractMethodDraft,
        accountSubject: proposalData.accountSubject || proposal.accountSubject || '',
        totalAmount: proposalData.totalAmount || proposal.totalAmount || 0,
        changeReason: proposalData.changeReason || proposal.changeReason || null,
        extensionReason: proposalData.extensionReason || proposal.extensionReason || null,
        contractPeriod: proposalData.contractPeriod || proposal.contractPeriod,
        contractStartDate: proposalData.contractStartDate || proposal.contractStartDate || null,
        contractEndDate: proposalData.contractEndDate || proposal.contractEndDate || null || null,
        paymentMethod: processedPaymentMethodDraft,
        wysiwygContent: proposalData.wysiwygContent || proposal.wysiwygContent || '', // 자유양식 내용 추가
        other: proposalData.other || proposal.other || '', // 기타 사항 추가
        status: proposalData.status || 'draft', // 요청된 상태 또는 기본값
        createdBy: proposalData.createdBy || proposal.createdBy || '시스템',
        proposalDate: new Date().toISOString().split('T')[0],
        isDraft: proposalData.isDraft !== undefined ? proposalData.isDraft : true // 요청된 값 또는 기본값
      }, { transaction });
      
      // 기존 관련 데이터 삭제 (외래키 제약조건을 고려한 순서)
      console.log('🗑️ 기존 관련 데이터 삭제 시작...');
      
      // 1. 먼저 참조하는 테이블들 삭제
      await models.CostDepartment.destroy({ where: { proposalId: proposal.id }, transaction });
      console.log('✅ CostDepartment 삭제 완료');
      
      await models.RequestDepartment.destroy({ where: { proposalId: proposal.id }, transaction });
      console.log('✅ RequestDepartment 삭제 완료');
      
      await models.ApprovalLine.destroy({ where: { proposalId: proposal.id }, transaction });
      console.log('✅ ApprovalLine 삭제 완료');
      
      // 2. 그 다음 참조되는 테이블들 삭제
      await models.PurchaseItem.destroy({ where: { proposalId: proposal.id }, transaction });
      console.log('✅ PurchaseItem 삭제 완료');
      
      await models.ServiceItem.destroy({ where: { proposalId: proposal.id }, transaction });
      console.log('✅ ServiceItem 삭제 완료');
      
      console.log('🗑️ 모든 관련 데이터 삭제 완료');
      
      // 트랜잭션 커밋
      await transaction.commit();
      console.log('✅ 기존 품의서 업데이트 완료');
      
    } catch (error) {
      // 트랜잭션 롤백
      await transaction.rollback();
      console.error('❌ 편집 모드 업데이트 실패:', error);
      throw error;
    }
    } else {
      console.log('=== 새 품의서 생성 ===');
      
      // budgetId 안전하게 처리 (임시저장에서는 검증 제거)
      let budgetId = null;
      if (proposalData.budget) {
        const budgetNum = parseInt(proposalData.budget);
        if (!isNaN(budgetNum) && budgetNum > 0) {
          budgetId = budgetNum;
          console.log('✅ 임시저장 - budget 설정:', budgetId);
        } else {
          console.log('⚠️ 임시저장 - budget이 유효하지 않은 숫자, null로 설정:', proposalData.budget);
        }
      } else {
        console.log('📝 임시저장 - budget이 없음, null로 설정');
      }

      // enum 필드 처리 (빈 문자열을 null로 변환) - 새 품의서용
      const processedPaymentMethodNew = proposalData.paymentMethod && proposalData.paymentMethod.trim() !== '' 
        ? proposalData.paymentMethod 
        : null;

      const processedContractMethodNew = proposalData.contractMethod && proposalData.contractMethod.trim() !== '' 
        ? proposalData.contractMethod 
        : null;

      console.log('🔧 새 품의서 enum 필드 처리:', {
        originalPaymentMethod: proposalData.paymentMethod,
        processedPaymentMethodNew,
        originalContractMethod: proposalData.contractMethod,
        processedContractMethodNew
      });

      // 새 품의서 생성
      proposal = await models.Proposal.create({
        contractType: proposalData.contractType || 'purchase',
        title: proposalData.title || '', // 제목 필드 추가
        purpose: proposalData.purpose || '',
        basis: proposalData.basis || '',
        budgetId: budgetId,
        contractMethod: processedContractMethodNew,
        accountSubject: proposalData.accountSubject || '',
        totalAmount: proposalData.totalAmount || 0,
        changeReason: proposalData.changeReason || null,
        extensionReason: proposalData.extensionReason || null,
        contractPeriod: proposalData.contractPeriod || null,
      contractStartDate: proposalData.contractStartDate || null,
      contractEndDate: proposalData.contractEndDate || null,
        paymentMethod: processedPaymentMethodNew,
        wysiwygContent: proposalData.wysiwygContent || '', // 자유양식 내용 추가
        other: proposalData.other || '', // 기타 사항 추가
        status: proposalData.status || 'draft', // 요청된 상태 또는 기본값
        createdBy: proposalData.createdBy || '시스템', // 작성자 필드 추가
        proposalDate: new Date().toISOString().split('T')[0], // 오늘 날짜로 설정
        isDraft: proposalData.isDraft !== undefined ? proposalData.isDraft : true // 요청된 값 또는 기본값
      });
    }

    // 구매품목 생성 (임시저장)
    if (proposalData.purchaseItems && proposalData.purchaseItems.length > 0) {
      const purchaseItems = proposalData.purchaseItems.map(item => ({
        proposalId: proposal.id,
        item: item.item || '',
        productName: item.productName || '',
        quantity: item.quantity && item.quantity !== '' ? parseInt(item.quantity) || 0 : 0,
        unitPrice: item.unitPrice && item.unitPrice !== '' ? parseInt(item.unitPrice) || 0 : 0,
        amount: item.amount && item.amount !== '' ? parseInt(item.amount) || 0 : 0,
        supplier: item.supplier || '',
        contractPeriodType: item.contractPeriodType || 'permanent',
        contractStartDate: item.contractStartDate || null,
        contractEndDate: item.contractEndDate || null
      }));
      
      console.log('🏢 구매품목 계약기간 저장 (전체):', purchaseItems.map(item => ({
        item: item.item,
        contractPeriodType: item.contractPeriodType,
        contractStartDate: item.contractStartDate,
        contractEndDate: item.contractEndDate
      })));
      
      await models.PurchaseItem.bulkCreate(purchaseItems);
    }

    // 용역항목 생성 (임시저장)
    if (proposalData.serviceItems && proposalData.serviceItems.length > 0) {
      const serviceItems = proposalData.serviceItems.map(item => ({
        proposalId: proposal.id,
        item: item.item || '',
        personnel: item.personnel || '',
        name: item.name || '', // 성명 필드 추가
        skillLevel: item.skillLevel || '',
        period: item.period || '',
        monthlyRate: item.monthlyRate && item.monthlyRate !== '' ? parseInt(item.monthlyRate) || 0 : 0,
        contractAmount: item.contractAmount && item.contractAmount !== '' ? parseInt(item.contractAmount) || 0 : 0,
        supplier: item.supplier || '',
        creditRating: item.creditRating || ''
      }));
      await models.ServiceItem.bulkCreate(serviceItems);
    }

    // 비용귀속부서 생성 (임시저장)
    if (proposalData.costDepartments && proposalData.costDepartments.length > 0) {
      const costDepartments = proposalData.costDepartments.map(dept => ({
        proposalId: proposal.id,
        department: dept.department || '',
        amount: dept.amount && dept.amount !== '' ? parseInt(dept.amount) || 0 : 0,
        ratio: dept.ratio && dept.ratio !== '' ? parseInt(dept.ratio) || 0 : 0
      }));
      await models.CostDepartment.bulkCreate(costDepartments);
    }

    // 구매품목별 비용분배 정보 저장
    console.log('=== 구매품목별 비용분배 정보 처리 ===');
    console.log('받은 purchaseItemCostAllocations:', proposalData.purchaseItemCostAllocations);
    
    if (proposalData.purchaseItemCostAllocations && proposalData.purchaseItemCostAllocations.length > 0) {
      // 기존 구매품목 정보 가져오기
      const purchaseItems = await models.PurchaseItem.findAll({
        where: { proposalId: proposal.id },
        order: [['id', 'ASC']]
      });
      
      console.log('저장된 구매품목:', purchaseItems.map(item => ({ id: item.id, item: item.item })));
      
      // 각 구매품목의 비용분배 정보를 costDepartments에 추가
      const additionalCostDepartments = [];
      
      proposalData.purchaseItemCostAllocations.forEach(alloc => {
        const purchaseItem = purchaseItems[alloc.itemIndex];
        if (purchaseItem) {
          console.log(`구매품목 "${purchaseItem.item}" (ID: ${purchaseItem.id}) 비용분배:`, alloc);
          
          // 비용분배 정보를 costDepartments에 추가
          additionalCostDepartments.push({
            proposalId: proposal.id,
            department: alloc.department,
            amount: alloc.type === 'percentage' ? (purchaseItem.amount * (alloc.value / 100)) : alloc.value,
            ratio: alloc.value,
            purchaseItemId: purchaseItem.id,
            allocationType: alloc.type
          });
        }
      });
      
      if (additionalCostDepartments.length > 0) {
        console.log('추가할 비용귀속부서 데이터:', additionalCostDepartments);
        await models.CostDepartment.bulkCreate(additionalCostDepartments);
      }
    }

    // 요청부서 생성
    console.log('=== 요청부서 데이터 처리 ===');
    console.log('받은 requestDepartments:', proposalData.requestDepartments);
    
    if (proposalData.requestDepartments && proposalData.requestDepartments.length > 0) {
      const requestDepartments = proposalData.requestDepartments
        .filter(dept => {
          // null이나 undefined가 아닌 유효한 데이터만 필터링
          const deptName = typeof dept === 'string' ? dept : dept.name || dept;
          return deptName && deptName.trim() !== '';
        })
        .map(dept => {
          const deptName = typeof dept === 'string' ? dept : dept.name || dept;
          return {
            proposalId: proposal.id,
            name: deptName.trim(),
            code: typeof dept === 'string' ? null : (dept.code || null)
          };
        })
        .filter(dept => {
          // 최종 검증: name이 유효한지 확인
          return dept.name && dept.name.trim() !== '';
        });
      
      if (requestDepartments.length > 0) {
        console.log('저장할 요청부서 데이터:', requestDepartments);
        await models.RequestDepartment.bulkCreate(requestDepartments);
      }
    }

    // 결재라인 생성
    if (proposalData.approvalLine && proposalData.approvalLine.length > 0) {
      const approvalLines = proposalData.approvalLine.map((line, index) => ({
        proposalId: proposal.id,
        step: index + 1,
        name: line.name,
        title: line.title,
        description: line.description,
        isConditional: line.conditional || false,
        isFinal: line.final || false,
        status: 'pending'
      }));
      await models.ApprovalLine.bulkCreate(approvalLines);
    }

    // 임시저장 후 사업예산 집행금액 동기화 (결재완료 상태인 경우에만)
    if (proposal.status === 'approved') {
      await updateBudgetExecutionAmount();
    }

    res.status(201).json({
      message: '품의서가 임시저장되었습니다.',
      proposalId: proposal.id
    });
  } catch (error) {
    console.error('=== 임시저장 오류 상세 ===');
    console.error('오류 이름:', error.name);
    console.error('오류 메시지:', error.message);
    console.error('오류 스택:', error.stack);
    
    // 데이터베이스 오류인지 확인
    if (error.name === 'SequelizeValidationError') {
      console.error('검증 오류:', error.errors);
      return res.status(400).json({ 
        error: '입력 데이터가 올바르지 않습니다. 필수 필드를 확인해주세요.',
        details: error.errors.map(e => e.message)
      });
    }
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      console.error('중복 제약 오류:', error.errors);
      return res.status(409).json({ 
        error: '이미 존재하는 품의서입니다.',
        details: error.errors.map(e => e.message)
      });
    }
    
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      console.error('외래키 제약 오류:', error.message);
      console.error('참조 테이블:', error.table);
      console.error('참조 필드:', error.fields);
      return res.status(400).json({ 
        error: '참조하는 데이터가 존재하지 않습니다. 예산이나 부서 정보를 확인해주세요.',
        details: error.message 
      });
    }
    
    console.error('기타 오류:', error);
    res.status(500).json({ 
      error: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
      details: error.message 
    });
  }
});

// 8-1. 사업예산 집행금액 수동 동기화
app.post('/api/sync-budget-execution', async (req, res) => {
  try {
    await updateBudgetExecutionAmount();
    res.json({ message: '사업예산 집행금액이 성공적으로 동기화되었습니다.' });
  } catch (error) {
    console.error('수동 동기화 실패:', error);
    res.status(500).json({ error: '동기화 중 오류가 발생했습니다.' });
  }
});

// 8-2. 품의서-사업예산 매칭 상태 확인 (디버깅용)
app.get('/api/debug/proposal-budget-mapping', async (req, res) => {
  try {
    // 1. 결재완료된 품의서 조회
    const approvedProposals = await sequelize.query(`
      SELECT 
        id,
        purpose,
        budget_id,
        total_amount,
        status
      FROM proposals 
      WHERE status = 'approved'
      ORDER BY created_at DESC
      LIMIT 10
    `);

    // 2. 사업예산 목록 조회
    const budgets = await sequelize.query(`
      SELECT 
        id,
        project_name,
        budget_amount,
        executed_amount
      FROM business_budgets 
      ORDER BY created_at DESC
      LIMIT 10
    `);

    // 3. 매칭 상태 확인
    const matchingQuery = await sequelize.query(`
      SELECT 
        p.id as proposal_id,
        p.purpose,
        p.budget_id as proposal_budget,
        p.total_amount,
        bb.id as budget_id,
        bb.project_name as budget_project_name,
        bb.budget_amount
      FROM proposals p
      LEFT JOIN business_budgets bb ON p.budget_id = bb.id
      WHERE p.status = 'approved'
      ORDER BY p.created_at DESC
    `);

    // 4. 실제 집행금액 계산
    const executionQuery = await sequelize.query(`
      SELECT 
        p.budget_id as budget_id,
        COUNT(p.id) as proposal_count,
        SUM(p.total_amount) as total_executed
      FROM proposals p
      INNER JOIN business_budgets bb ON p.budget_id = bb.id
      WHERE p.status = 'approved'
      GROUP BY p.budget_id
      ORDER BY total_executed DESC
    `);

    res.json({
      approvedProposals: approvedProposals[0],
      budgets: budgets[0],
      matching: matchingQuery[0],
      executions: executionQuery[0]
    });
  } catch (error) {
    console.error('디버깅 조회 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 9. 품의서 삭제
app.delete('/api/proposals/:id', async (req, res) => {
  try {
    const proposalId = req.params.id;
    const force = req.query.force === 'true'; // 강제 삭제 여부
    
    console.log('=== 품의서 삭제 요청 ===');
    console.log('삭제할 품의서 ID:', proposalId);
    console.log('강제 삭제 여부:', force);

    // 품의서 존재 여부 확인
    const proposal = await models.Proposal.findByPk(proposalId);
    if (!proposal) {
      return res.status(404).json({ 
        error: '삭제할 품의서를 찾을 수 없습니다.' 
      });
    }

    // 트랜잭션 시작
    const transaction = await sequelize.transaction();
    
    try {
      // 관련 데이터 삭제 (외래키 제약조건을 고려한 순서)
      console.log('🗑️ 관련 데이터 삭제 시작...');
      
      // 1. 먼저 참조하는 테이블들 삭제
      await models.CostDepartment.destroy({ 
        where: { proposalId: proposalId }, 
        transaction 
      });
      console.log('✅ CostDepartment 삭제 완료');
      
      await models.RequestDepartment.destroy({ 
        where: { proposalId: proposalId }, 
        transaction 
      });
      console.log('✅ RequestDepartment 삭제 완료');
      
      await models.ApprovalLine.destroy({ 
        where: { proposalId: proposalId }, 
        transaction 
      });
      console.log('✅ ApprovalLine 삭제 완료');
      
      // 2. 그 다음 참조되는 테이블들 삭제
      await models.PurchaseItem.destroy({ 
        where: { proposalId: proposalId }, 
        transaction 
      });
      console.log('✅ PurchaseItem 삭제 완료');
      
      await models.ServiceItem.destroy({ 
        where: { proposalId: proposalId }, 
        transaction 
      });
      console.log('✅ ServiceItem 삭제 완료');
      
      // 3. 마지막으로 품의서 삭제
      await proposal.destroy({ transaction });
      console.log('✅ 품의서 삭제 완료');
      
      // 트랜잭션 커밋
      await transaction.commit();
      console.log('✅ 모든 삭제 작업 완료');
      
    } catch (error) {
      // 트랜잭션 롤백
      await transaction.rollback();
      console.error('❌ 삭제 작업 실패:', error);
      throw error;
    }

    console.log('✅ 품의서 삭제 완료:', proposalId);
    res.json({ 
      message: '품의서가 성공적으로 삭제되었습니다.',
      deletedId: proposalId
    });
      } catch (error) {
      console.error('=== 품의서 삭제 오류 ===');
      console.error('오류 이름:', error.name);
      console.error('오류 메시지:', error.message);
      console.error('오류 스택:', error.stack);
      
      // 구체적인 에러 메시지 제공
      if (error.name === 'SequelizeForeignKeyConstraintError') {
        return res.status(400).json({
          error: '관련 데이터가 있어서 삭제할 수 없습니다. 강제 삭제를 원하시면 ?force=true를 추가해주세요.',
          details: error.message,
          suggestion: '강제 삭제: DELETE /api/proposals/' + proposalId + '?force=true'
        });
      }
      
      if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({
          error: '삭제할 수 없는 상태의 품의서입니다.',
          details: error.errors.map(e => e.message)
        });
      }
      
      res.status(500).json({ 
        error: '품의서 삭제 중 오류가 발생했습니다.',
        details: error.message 
      });
    }
});

// 마이그레이션 엔드포인트 추가
app.post('/api/migrate-contract-period', async (req, res) => {
  try {
    console.log('🔄 계약기간 필드 마이그레이션 시작...');

    // 트랜잭션 시작
    const transaction = await sequelize.transaction();

    try {
      // 1. 새로운 컬럼 추가 (이미 존재할 수 있으므로 에러 무시)
      try {
        await sequelize.query(`
          ALTER TABLE purchase_items 
          ADD COLUMN contract_period_type VARCHAR(50) DEFAULT 'permanent'
        `, { transaction });
        console.log('✅ contract_period_type 컬럼 추가 완료');
      } catch (e) {
        console.log('ℹ️ contract_period_type 컬럼이 이미 존재하거나 추가할 수 없음');
      }

      try {
        await sequelize.query(`
          ALTER TABLE purchase_items 
          ADD COLUMN custom_contract_period TEXT
        `, { transaction });
        console.log('✅ custom_contract_period 컬럼 추가 완료');
      } catch (e) {
        console.log('ℹ️ custom_contract_period 컬럼이 이미 존재하거나 추가할 수 없음');
      }

      // 2. 기존 데이터를 새로운 구조로 변환
      console.log('🔄 기존 데이터 변환 중...');
      
      const updateResult = await sequelize.query(`
        UPDATE purchase_items 
        SET contract_period_type = 'permanent', 
            custom_contract_period = NULL
        WHERE contract_period_type IS NULL OR contract_period_type = ''
      `, { transaction });

      console.log('✅ 데이터 업데이트 완료:', updateResult[0]);

      await transaction.commit();
      console.log('✅ 계약기간 필드 마이그레이션 완료!');

      // 마이그레이션 결과 확인
      const result = await sequelize.query(`
        SELECT id, item, contract_period_type, custom_contract_period 
        FROM purchase_items 
        LIMIT 10
      `);

      res.json({
        success: true,
        message: '계약기간 필드 마이그레이션이 완료되었습니다.',
        sampleData: result[0]
      });

    } catch (error) {
      await transaction.rollback();
      throw error;
    }

  } catch (error) {
    console.error('❌ 마이그레이션 실패:', error);
    res.status(500).json({
      success: false,
      message: '마이그레이션 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 데이터베이스 스키마 자동 업데이트 함수
async function updateDatabaseSchema() {
  try {
    console.log('🔄 데이터베이스 스키마 확인 중...');
    
    // PostgreSQL용 컬럼 정보 확인
    const [results] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'purchase_items'
    `);
    const columns = results.map(col => col.column_name);
    
    console.log('📋 현재 컬럼:', columns);
    
    // contract_period_type 컬럼이 없으면 추가
    if (!columns.includes('contract_period_type')) {
      console.log('➕ contract_period_type 컬럼 추가 중...');
      await sequelize.query(`ALTER TABLE purchase_items ADD COLUMN contract_period_type VARCHAR(50) DEFAULT 'permanent'`);
      console.log('✅ contract_period_type 컬럼 추가 완료');
    }
    
    // contract_start_date 컬럼이 없으면 추가
    if (!columns.includes('contract_start_date')) {
      console.log('➕ contract_start_date 컬럼 추가 중...');
      await sequelize.query(`ALTER TABLE purchase_items ADD COLUMN contract_start_date DATE`);
      console.log('✅ contract_start_date 컬럼 추가 완료');
    }
    
    // contract_end_date 컬럼이 없으면 추가
    if (!columns.includes('contract_end_date')) {
      console.log('➕ contract_end_date 컬럼 추가 중...');
      await sequelize.query(`ALTER TABLE purchase_items ADD COLUMN contract_end_date DATE`);
      console.log('✅ contract_end_date 컬럼 추가 완료');
    }
    
    // contract_start_date 컬럼을 proposals 테이블에도 추가
    const [proposalsResults] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'proposals'
    `);
    const proposalsColumns = proposalsResults.map(col => col.column_name);
    
    if (!proposalsColumns.includes('contract_start_date')) {
      console.log('➕ proposals 테이블에 contract_start_date 컬럼 추가 중...');
      await sequelize.query(`ALTER TABLE proposals ADD COLUMN contract_start_date DATE`);
      console.log('✅ proposals contract_start_date 컬럼 추가 완료');
    }
    
    if (!proposalsColumns.includes('contract_end_date')) {
      console.log('➕ proposals 테이블에 contract_end_date 컬럼 추가 중...');
      await sequelize.query(`ALTER TABLE proposals ADD COLUMN contract_end_date DATE`);
      console.log('✅ proposals contract_end_date 컬럼 추가 완료');
    }

    // 기존 데이터 업데이트
    await sequelize.query(`UPDATE purchase_items SET contract_period_type = 'permanent' WHERE contract_period_type IS NULL`);
    console.log('✅ 기존 데이터 업데이트 완료');
    
  } catch (error) {
    console.error('⚠️ 스키마 업데이트 중 오류 (무시하고 계속):', error.message);
  }
}

// AI 어시스턴스 API 엔드포인트들
// 통계 요약 API
app.get('/api/statistics/summary', async (req, res) => {
  try {
    console.log('통계 요약 API 호출됨');
    
    // 품의서 통계 - 더 안전한 쿼리
    const [proposalStats] = await sequelize.query(`
      SELECT 
        COUNT(*) as total_proposals,
        SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft_count,
        SUM(CASE WHEN status = 'submitted' THEN 1 ELSE 0 END) as submitted_count,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_count,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_count,
        SUM(CASE WHEN contract_type = 'purchase' THEN 1 ELSE 0 END) as purchase_count,
        SUM(CASE WHEN contract_type = 'service' THEN 1 ELSE 0 END) as service_count,
        SUM(CASE WHEN contract_type = 'change' THEN 1 ELSE 0 END) as change_count,
        SUM(CASE WHEN contract_type = 'extension' THEN 1 ELSE 0 END) as extension_count,
        SUM(CASE WHEN contract_type = 'bidding' THEN 1 ELSE 0 END) as bidding_count,
        COALESCE(SUM(CASE WHEN total_amount IS NOT NULL THEN CAST(total_amount AS NUMERIC) ELSE 0 END), 0) as total_contract_amount
      FROM proposals
    `);

    console.log('품의서 통계 조회 완료:', proposalStats[0]);

    // 최근 활동 - 더 간단한 쿼리
    let recentActivity = [];
    try {
      const [activityResults] = await sequelize.query(`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as count
        FROM proposals 
        WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY DATE(created_at)
        ORDER BY DATE(created_at) DESC
        LIMIT 7
      `);
      recentActivity = activityResults;
    } catch (activityError) {
      console.log('최근 활동 조회 실패, 빈 배열로 대체:', activityError.message);
    }

    // 예산 통계 - 테이블 존재 여부 확인
    let budgetStats = [{ total_budgets: 0, total_budget_amount: 0, total_executed_amount: 0 }];
    try {
      const [budgetResults] = await sequelize.query(`
        SELECT 
          COUNT(*) as total_budgets,
          COALESCE(SUM(CASE WHEN total_amount IS NOT NULL THEN CAST(total_amount AS NUMERIC) ELSE 0 END), 0) as total_budget_amount,
          COALESCE(SUM(CASE WHEN executed_amount IS NOT NULL THEN CAST(executed_amount AS NUMERIC) ELSE 0 END), 0) as total_executed_amount
        FROM business_budgets
        WHERE is_active = true OR is_active IS NULL
      `);
      budgetStats = budgetResults;
    } catch (budgetError) {
      console.log('예산 통계 조회 실패, 기본값 사용:', budgetError.message);
    }

    const result = {
      proposals: proposalStats[0] || {
        total_proposals: 0,
        draft_count: 0,
        submitted_count: 0,
        approved_count: 0,
        rejected_count: 0,
        purchase_count: 0,
        service_count: 0,
        change_count: 0,
        extension_count: 0,
        bidding_count: 0,
        total_contract_amount: 0
      },
      recentActivity: recentActivity || [],
      budgets: budgetStats[0] || {
        total_budgets: 0,
        total_budget_amount: 0,
        total_executed_amount: 0
      }
    };

    console.log('통계 요약 응답:', result);
    res.json(result);
  } catch (error) {
    console.error('통계 요약 조회 실패:', error);
    res.status(500).json({ 
      error: '통계 데이터 조회에 실패했습니다.',
      details: error.message,
      proposals: {
        total_proposals: 0,
        draft_count: 0,
        submitted_count: 0,
        approved_count: 0,
        rejected_count: 0,
        purchase_count: 0,
        service_count: 0,
        change_count: 0,
        extension_count: 0,
        bidding_count: 0,
        total_contract_amount: 0
      },
      recentActivity: [],
      budgets: {
        total_budgets: 0,
        total_budget_amount: 0,
        total_executed_amount: 0
      }
    });
  }
});

// AI 검색 API
app.post('/api/ai/search', async (req, res) => {
  try {
    const { query, filters = {} } = req.body;
    
    let whereClause = '1=1';
    let replacements = [];
    
    // 텍스트 검색
    if (query && query.trim()) {
      const searchTerms = query.trim().split(' ').filter(term => term.length > 0);
      const searchConditions = searchTerms.map(() => 
        '(purpose ILIKE ? OR basis ILIKE ? OR account_subject ILIKE ?)'
      ).join(' AND ');
      
      whereClause += ` AND (${searchConditions})`;
      searchTerms.forEach(term => {
        const likePattern = `%${term}%`;
        replacements.push(likePattern, likePattern, likePattern);
      });
    }
    
    // 필터 적용
    if (filters.contractType) {
      whereClause += ' AND contract_type = ?';
      replacements.push(filters.contractType);
    }
    
    if (filters.status) {
      whereClause += ' AND status = ?';
      replacements.push(filters.status);
    }
    
    if (filters.minAmount) {
      whereClause += ' AND CAST(total_amount AS DECIMAL) >= ?';
      replacements.push(filters.minAmount);
    }
    
    if (filters.maxAmount) {
      whereClause += ' AND CAST(total_amount AS DECIMAL) <= ?';
      replacements.push(filters.maxAmount);
    }

    const [results] = await sequelize.query(`
      SELECT 
        id,
        contract_type,
        purpose,
        basis,
        total_amount,
        status,
        account_subject,
        created_at,
        updated_at
      FROM proposals 
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT 50
    `, { replacements });

    res.json({
      results: results || [],
      total: results?.length || 0
    });
  } catch (error) {
    console.error('AI 검색 실패:', error);
    res.status(500).json({ error: '검색에 실패했습니다.' });
  }
});

// AI 요약 API
app.get('/api/ai/summary/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { limit = 10 } = req.query;

    let results = [];
    
    switch (type) {
      case 'recent':
        const [recentProposals] = await sequelize.query(`
          SELECT 
            id,
            contract_type,
            purpose,
            total_amount,
            status,
            created_at
          FROM proposals 
          ORDER BY created_at DESC
          LIMIT ?
        `, { replacements: [parseInt(limit)] });
        results = recentProposals;
        break;
        
      case 'pending':
        const [pendingProposals] = await sequelize.query(`
          SELECT 
            id,
            contract_type,
            purpose,
            total_amount,
            status,
            created_at
          FROM proposals 
          WHERE status IN ('draft', 'submitted')
          ORDER BY created_at DESC
          LIMIT ?
        `, { replacements: [parseInt(limit)] });
        results = pendingProposals;
        break;
        
      case 'high-value':
        const [highValueProposals] = await sequelize.query(`
          SELECT 
            id,
            contract_type,
            purpose,
            total_amount,
            status,
            created_at
          FROM proposals 
          WHERE CAST(total_amount AS DECIMAL) > 1000000
          ORDER BY CAST(total_amount AS DECIMAL) DESC
          LIMIT ?
        `, { replacements: [parseInt(limit)] });
        results = highValueProposals;
        break;
        
      default:
        return res.status(400).json({ error: '지원하지 않는 요약 타입입니다.' });
    }

    res.json({
      type,
      results: results || [],
      total: results?.length || 0
    });
  } catch (error) {
    console.error('AI 요약 실패:', error);
    res.status(500).json({ error: '요약 생성에 실패했습니다.' });
  }
});

// 품목별 분석 API
app.get('/api/ai/item-analysis', async (req, res) => {
  try {
    console.log('품목별 분석 API 호출됨');
    
    // 구매 품목 분석
    const [purchaseItems] = await sequelize.query(`
      SELECT 
        pi.item,
        pi.product_name,
        COUNT(*) as purchase_count,
        SUM(pi.quantity) as total_quantity,
        SUM(CAST(pi.amount AS NUMERIC)) as total_amount,
        AVG(CAST(pi.unit_price AS NUMERIC)) as avg_unit_price,
        pi.supplier,
        COUNT(DISTINCT pi.supplier) as supplier_count
      FROM purchase_items pi
      JOIN proposals p ON pi.proposal_id = p.id
      WHERE p.status = 'approved'
      GROUP BY pi.item, pi.product_name, pi.supplier
      ORDER BY purchase_count DESC, total_amount DESC
      LIMIT 50
    `);

    // 용역 항목 분석
    const [serviceItems] = await sequelize.query(`
      SELECT 
        si.service_type,
        si.service_content,
        COUNT(*) as service_count,
        SUM(CAST(si.amount AS NUMERIC)) as total_amount,
        si.supplier
      FROM service_items si
      JOIN proposals p ON si.proposal_id = p.id
      WHERE p.status = 'approved'
      GROUP BY si.service_type, si.service_content, si.supplier
      ORDER BY service_count DESC, total_amount DESC
      LIMIT 50
    `);

    // 계정과목별 분석
    const [accountAnalysis] = await sequelize.query(`
      SELECT 
        account_subject,
        COUNT(*) as usage_count,
        SUM(CAST(total_amount AS NUMERIC)) as total_amount
      FROM proposals
      WHERE status = 'approved'
      GROUP BY account_subject
      ORDER BY usage_count DESC, total_amount DESC
      LIMIT 20
    `);

    // 공급업체별 분석
    const [supplierAnalysis] = await sequelize.query(`
      SELECT 
        supplier,
        COUNT(*) as contract_count,
        SUM(CAST(amount AS NUMERIC)) as total_amount
      FROM (
        SELECT supplier, amount FROM purchase_items pi 
        JOIN proposals p ON pi.proposal_id = p.id 
        WHERE p.status = 'approved'
        UNION ALL
        SELECT supplier, amount FROM service_items si 
        JOIN proposals p ON si.proposal_id = p.id 
        WHERE p.status = 'approved'
      ) combined
      GROUP BY supplier
      ORDER BY contract_count DESC, total_amount DESC
      LIMIT 20
    `);

    res.json({
      purchaseItems: purchaseItems || [],
      serviceItems: serviceItems || [],
      accountAnalysis: accountAnalysis || [],
      supplierAnalysis: supplierAnalysis || []
    });

  } catch (error) {
    console.error('품목별 분석 실패:', error);
    res.status(500).json({ 
      error: '품목 분석 중 오류가 발생했습니다.',
      details: error.message,
      purchaseItems: [],
      serviceItems: [],
      accountAnalysis: [],
      supplierAnalysis: []
    });
  }
});

// 서버 시작
app.listen(PORT, '0.0.0.0', async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공!');
    
    // 스키마 자동 업데이트
    await updateDatabaseSchema();
    
    console.log(`🚀 API 서버가 포트 ${PORT}에서 실행 중입니다.`);
    console.log(`🌐 로컬 접근: http://localhost:${PORT}/api`);
    console.log(`🌐 네트워크 접근: http://[본인IP]:${PORT}/api`);
    console.log('💡 다른 기기에서 접근하려면 방화벽에서 포트 3001을 허용해주세요.');
  } catch (error) {
    console.error('❌ 데이터베이스 연결 실패:', error.message);
  }
}); 