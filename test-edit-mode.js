const axios = require('axios');

async function testEditMode() {
  try {
    console.log('=== 편집 모드 테스트 ===');

    // 1. 기존 임시저장 데이터 조회 (ID: 66)
    console.log('1. 기존 임시저장 데이터 조회...');
    const getResponse = await axios.get('http://localhost:3001/api/proposals/66');
    const savedData = getResponse.data;
    
    console.log('조회된 데이터:', JSON.stringify(savedData, null, 2));
    
    // 2. 편집 모드에서 사용할 데이터 구조로 변환
    console.log('\n2. 편집 모드 데이터 구조 변환...');
    
    const editData = {
      id: savedData.id,
      contractType: savedData.contractType,
      purpose: savedData.purpose,
      basis: savedData.basis,
      budget: savedData.budgetId,
      contractMethod: savedData.contractMethod,
      accountSubject: savedData.accountSubject,
      totalAmount: savedData.totalAmount,
      createdBy: savedData.createdBy,
      purchaseItems: savedData.purchaseItems || [],
      serviceItems: savedData.serviceItems || [],
      costDepartments: savedData.costDepartments || [],
      requestDepartments: savedData.requestDepartments || [],
      approvalLine: savedData.approvalLines || []
    };
    
    console.log('편집 모드 데이터:', JSON.stringify(editData, null, 2));
    
    // 3. 주요 필드 확인
    console.log('\n3. 주요 필드 확인:');
    console.log('계정과목:', editData.accountSubject);
    console.log('요청부서:', editData.requestDepartments);
    console.log('비용귀속부서:', editData.costDepartments);
    console.log('구매품목:', editData.purchaseItems);
    console.log('용역품목:', editData.serviceItems);
    
    // 4. localStorage에 저장 (실제 편집 모드 시뮬레이션)
    console.log('\n4. localStorage에 저장...');
    const localStorageData = {
      ...editData,
      contractType: editData.contractType === 'purchase' ? '구매계약' : 
                   editData.contractType === 'service' ? '용역계약' : 
                   editData.contractType === 'change' ? '변경계약' : 
                   editData.contractType === 'extension' ? '연장계약' : 
                   editData.contractType === 'bidding' ? '입찰계약' : editData.contractType
    };
    
    console.log('localStorage에 저장할 데이터:', JSON.stringify(localStorageData, null, 2));
    
    // 5. 편집 모드에서 불러올 때의 데이터 구조 확인
    console.log('\n5. 편집 모드에서 불러올 때의 데이터 구조:');
    console.log('계정과목:', localStorageData.accountSubject);
    console.log('요청부서:', localStorageData.requestDepartments);
    console.log('비용귀속부서:', localStorageData.costDepartments);
    console.log('구매품목:', localStorageData.purchaseItems);
    console.log('용역품목:', localStorageData.serviceItems);

  } catch (error) {
    console.log('❌ 오류 발생:');
    if (error.response) {
      console.log('응답 상태:', error.response.status);
      console.log('오류 데이터:', error.response.data);
      console.log('오류 메시지:', error.response.data.error);
      if (error.response.data.details) {
        console.log('상세 정보:', error.response.data.details);
      }
    } else {
      console.log('네트워크 오류:', error.message);
    }
  }
}

testEditMode(); 