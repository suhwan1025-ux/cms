const fs = require('fs');
const path = require('path');

// server.js 파일 수정
const serverPath = path.join(__dirname, 'server.js');
let serverContent = fs.readFileSync(serverPath, 'utf8');

// 구매품목 조회 부분 수정
const oldInclude = `        {
          model: models.PurchaseItem,
          as: 'purchaseItems'
        },`;

const newInclude = `        {
          model: models.PurchaseItem,
          as: 'purchaseItems',
          include: [
            {
              model: models.PurchaseItemCostAllocation,
              as: 'costAllocations'
            }
          ]
        },`;

// 수정 적용
serverContent = serverContent.replace(oldInclude, newInclude);

// 파일 저장
fs.writeFileSync(serverPath, serverContent, 'utf8');

console.log('✅ server.js 파일이 수정되었습니다.');
console.log('구매품목 조회 시 비용분배 정보가 포함됩니다.');

// 수정된 부분 확인
const lines = serverContent.split('\n');
const startLine = Math.max(0, lines.findIndex(line => line.includes('model: models.PurchaseItem')) - 5);
const endLine = Math.min(lines.length, startLine + 15);

console.log('\n수정된 부분:');
for (let i = startLine; i < endLine; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
} 