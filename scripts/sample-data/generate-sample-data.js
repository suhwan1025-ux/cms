const { Sequelize, DataTypes } = require("sequelize");
const config = require('../../config/database.js").development;

const sequelize = new Sequelize(config.database, config.username, config.password, config);

const Budget = require('../../src/models/Budget")(sequelize, DataTypes);
const Supplier = require('../../src/models/Supplier")(sequelize, DataTypes);
const Proposal = require('../../src/models/Proposal")(sequelize, DataTypes);
const PurchaseItem = require('../../src/models/PurchaseItem")(sequelize, DataTypes);
const ServiceItem = require('../../src/models/ServiceItem")(sequelize, DataTypes);

async function generateSampleData() {
  try {
    console.log("🔄 샘플 데이터 생성 시작...");

    // 예산 데이터 생성
    const budgets = await Budget.bulkCreate([
      {
        name: "2024년 IT인프라 구축 예산",
        year: 2024,
        type: "business",
        totalAmount: 500000000,
        usedAmount: 0,
        department: "IT기획팀",
        description: "서버, 네트워크 장비 구축"
      },
      {
        name: "2024년 사무용품 구매 예산",
        year: 2024,
        type: "general",
        totalAmount: 50000000,
        usedAmount: 0,
        department: "총무팀",
        description: "사무용품, 가구 구매"
      }
    ]);

    // 공급업체 데이터 생성
    const suppliers = await Supplier.bulkCreate([
      {
        name: "삼성전자",
        businessNumber: "123-45-67890",
        representative: "김삼성",
        address: "서울시 강남구",
        phone: "02-1234-5678",
        email: "contact@samsung.com",
        creditRating: "A",
        businessType: "전자제품 제조업"
      },
      {
        name: "LG전자",
        businessNumber: "234-56-78901",
        representative: "이엘지",
        address: "서울시 영등포구",
        phone: "02-2345-6789",
        email: "contact@lg.com",
        creditRating: "A",
        businessType: "전자제품 제조업"
      }
    ]);

    // 품의서 샘플 생성
    const itProposal = await Proposal.create({
      contractType: "purchase",
      purpose: "2024년 신규 서버 구축을 위한 IT장비 구매",
      basis: "IT인프라 구축 계획에 따른 서버 구매",
      budgetId: budgets[0].id,
      contractMethod: "일괄계약",
      accountSubject: "IT장비 구매비",
      totalAmount: 150000000,
      status: "approved",
      createdBy: "김개발",
      proposalDate: "2024-01-15",
      approvalDate: "2024-01-20",
      contractStartDate: "2024-02-01",
      contractEndDate: "2024-12-31"
    });

    await PurchaseItem.bulkCreate([
      {
        proposalId: itProposal.id,
        item: "서버",
        productName: "Dell PowerEdge R750 서버",
        quantity: 5,
        unitPrice: 15000000,
        supplierId: suppliers[0].id,
        supplier: "삼성전자",
        contractPeriodType: "1year",
        contractStartDate: "2024-02-01",
        contractEndDate: "2025-01-31"
      }
    ]);

    console.log("✅ 샘플 데이터 생성 완료!");
    console.log("📊 생성된 데이터:");
    console.log("  - 예산: " + budgets.length + "개");
    console.log("  - 공급업체: " + suppliers.length + "개");
    console.log("  - 품의서: 1개");

  } catch (error) {
    console.error("❌ 샘플 데이터 생성 중 오류 발생:", error);
  } finally {
    await sequelize.close();
  }
}

generateSampleData();
