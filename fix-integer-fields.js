const fs = require('fs');

// server.js 파일을 읽어서 임시저장 부분의 정수 필드들을 수정
const serverPath = './server.js';
let serverContent = fs.readFileSync(serverPath, 'utf8');

// 임시저장 부분의 구매품목 생성 부분 수정
const purchaseItemsPattern = /\/\/ 구매품목 생성\s+if \(proposalData\.purchaseItems && proposalData\.purchaseItems\.length > 0\) \{\s+const purchaseItems = proposalData\.purchaseItems\.map\(item => \(\{\s+proposalId: proposal\.id,\s+item: item\.item,\s+productName: item\.productName,\s+quantity: item\.quantity,\s+unitPrice: item\.unitPrice,\s+amount: item\.amount,\s+supplier: item\.supplier,\s+requestDepartment: item\.requestDepartment\s+\}\)\);\s+await models\.PurchaseItem\.bulkCreate\(purchaseItems\);\s+\}/;

const purchaseItemsReplacement = `// 구매품목 생성 (임시저장)
    if (proposalData.purchaseItems && proposalData.purchaseItems.length > 0) {
      const purchaseItems = proposalData.purchaseItems.map(item => ({
        proposalId: proposal.id,
        item: item.item || '',
        productName: item.productName || '',
        quantity: item.quantity && item.quantity !== '' ? parseInt(item.quantity) || 0 : 0,
        unitPrice: item.unitPrice && item.unitPrice !== '' ? parseInt(item.unitPrice) || 0 : 0,
        amount: item.amount && item.amount !== '' ? parseInt(item.amount) || 0 : 0,
        supplier: item.supplier || '',
        requestDepartment: item.requestDepartment || ''
      }));
      await models.PurchaseItem.bulkCreate(purchaseItems);
    }`;

// 용역항목 생성 부분 수정
const serviceItemsPattern = /\/\/ 용역항목 생성\s+if \(proposalData\.serviceItems && proposalData\.serviceItems\.length > 0\) \{\s+const serviceItems = proposalData\.serviceItems\.map\(item => \(\{\s+proposalId: proposal\.id,\s+item: item\.item,\s+personnel: item\.personnel,\s+skillLevel: item\.skillLevel,\s+period: item\.period,\s+monthlyRate: item\.monthlyRate,\s+contractAmount: item\.contractAmount,\s+supplier: item\.supplier,\s+creditRating: item\.creditRating\s+\}\)\);\s+await models\.ServiceItem\.bulkCreate\(serviceItems\);\s+\}/;

const serviceItemsReplacement = `// 용역항목 생성 (임시저장)
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
    }`;

// 비용귀속부서 생성 부분 수정
const costDepartmentsPattern = /\/\/ 비용귀속부서 생성\s+if \(proposalData\.costDepartments && proposalData\.costDepartments\.length > 0\) \{\s+const costDepartments = proposalData\.costDepartments\.map\(dept => \(\{\s+proposalId: proposal\.id,\s+department: dept\.department,\s+amount: dept\.amount,\s+ratio: dept\.ratio\s+\}\)\);\s+await models\.CostDepartment\.bulkCreate\(costDepartments\);\s+\}/;

const costDepartmentsReplacement = `// 비용귀속부서 생성 (임시저장)
    if (proposalData.costDepartments && proposalData.costDepartments.length > 0) {
      const costDepartments = proposalData.costDepartments.map(dept => ({
        proposalId: proposal.id,
        department: dept.department || '',
        amount: dept.amount && dept.amount !== '' ? parseInt(dept.amount) || 0 : 0,
        ratio: dept.ratio && dept.ratio !== '' ? parseInt(dept.ratio) || 0 : 0
      }));
      await models.CostDepartment.bulkCreate(costDepartments);
    }`;

// 수정 적용
serverContent = serverContent.replace(purchaseItemsPattern, purchaseItemsReplacement);
serverContent = serverContent.replace(serviceItemsPattern, serviceItemsReplacement);
serverContent = serverContent.replace(costDepartmentsPattern, costDepartmentsReplacement);

// 수정된 파일 저장
fs.writeFileSync(serverPath, serverContent, 'utf8');

console.log('✅ server.js 파일의 정수 필드 처리가 수정되었습니다.');
console.log('📝 수정된 내용:');
console.log('- 구매품목: quantity, unitPrice, amount 필드에 빈 문자열 처리 추가');
console.log('- 용역항목: monthlyRate, contractAmount 필드에 빈 문자열 처리 추가');
console.log('- 비용귀속부서: amount, ratio 필드에 빈 문자열 처리 추가'); 