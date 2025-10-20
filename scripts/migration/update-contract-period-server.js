const fs = require('fs');

console.log('🔄 서버에서 계약기간 필드 업데이트 시작...');

let serverContent = fs.readFileSync('server.js', 'utf8');

// contractPeriod를 새로운 날짜 필드들로 교체
serverContent = serverContent.replace(
  /contractPeriod: proposalData\.contractPeriod \|\| ''/g,
  'contractPeriod: proposalData.contractPeriod || \'\',\n      contractStartDate: proposalData.contractStartDate || null,\n      contractEndDate: proposalData.contractEndDate || null'
);

serverContent = serverContent.replace(
  /contractPeriod: proposalData\.contractPeriod \|\| proposal\.contractPeriod/g,
  'contractPeriod: proposalData.contractPeriod || proposal.contractPeriod,\n        contractStartDate: proposalData.contractStartDate || proposal.contractStartDate || null,\n        contractEndDate: proposalData.contractEndDate || proposal.contractEndDate || null'
);

serverContent = serverContent.replace(
  /contractPeriod: proposalData\.contractPeriod \|\| null/g,
  'contractPeriod: proposalData.contractPeriod || null,\n      contractStartDate: proposalData.contractStartDate || null,\n      contractEndDate: proposalData.contractEndDate || null'
);

// 파일 저장
fs.writeFileSync('server.js', serverContent, 'utf8');

console.log('✅ 서버 계약기간 필드 업데이트 완료!');
console.log('🔍 변경된 내용:');
console.log('  - contractPeriod에 contractStartDate, contractEndDate 필드 추가'); 