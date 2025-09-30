const fs = require('fs');

const htmlContent = `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>편집 모드 테스트</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .test-section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .data-display { background: #f5f5f5; padding: 10px; margin: 10px 0; border-radius: 3px; }
        button { padding: 10px 20px; margin: 5px; background: #007bff; color: white; border: none; border-radius: 3px; cursor: pointer; }
        button:hover { background: #0056b3; }
    </style>
</head>
<body>
    <h1>편집 모드 테스트</h1>
    
    <div class="test-section">
        <h2>1. 임시저장 데이터 조회</h2>
        <button onclick="fetchDraftData()">데이터 조회</button>
        <div id="draftData" class="data-display"></div>
    </div>
    
    <div class="test-section">
        <h2>2. 편집 모드 데이터 구조</h2>
        <button onclick="createEditData()">편집 데이터 생성</button>
        <div id="editData" class="data-display"></div>
    </div>
    
    <div class="test-section">
        <h2>3. localStorage 저장</h2>
        <button onclick="saveToLocalStorage()">localStorage에 저장</button>
        <button onclick="loadFromLocalStorage()">localStorage에서 불러오기</button>
        <div id="localStorageData" class="data-display"></div>
    </div>
    
    <div class="test-section">
        <h2>4. 편집 모드 시뮬레이션</h2>
        <button onclick="simulateEditMode()">편집 모드 시뮬레이션</button>
        <div id="editModeData" class="data-display"></div>
    </div>

    <script>
        let draftData = null;
        let editData = null;

        async function fetchDraftData() {
            try {
                const response = await fetch('http://localhost:3001/api/proposals/67');
                draftData = await response.json();
                
                document.getElementById('draftData').innerHTML = 
                    '<h3>조회된 데이터:</h3>' +
                    '<pre>' + JSON.stringify(draftData, null, 2) + '</pre>';
            } catch (error) {
                document.getElementById('draftData').innerHTML = 
                    '<p style="color: red;">오류: ' + error.message + '</p>';
            }
        }

        function createEditData() {
            if (!draftData) {
                alert('먼저 데이터를 조회해주세요.');
                return;
            }

            editData = {
                id: draftData.id,
                contractType: draftData.contractType,
                purpose: draftData.purpose,
                basis: draftData.basis,
                budget: draftData.budgetId,
                contractMethod: draftData.contractMethod,
                accountSubject: draftData.accountSubject,
                totalAmount: draftData.totalAmount,
                createdBy: draftData.createdBy,
                purchaseItems: draftData.purchaseItems || [],
                serviceItems: draftData.serviceItems || [],
                costDepartments: draftData.costDepartments || [],
                requestDepartments: draftData.requestDepartments || [],
                approvalLines: draftData.approvalLines || []
            };

            document.getElementById('editData').innerHTML = 
                '<h3>편집 데이터:</h3>' +
                '<pre>' + JSON.stringify(editData, null, 2) + '</pre>';
        }

        function saveToLocalStorage() {
            if (!editData) {
                alert('먼저 편집 데이터를 생성해주세요.');
                return;
            }

            const localStorageData = {
                ...editData,
                contractType: editData.contractType === 'purchase' ? '구매계약' : 
                             editData.contractType === 'service' ? '용역계약' : 
                             editData.contractType === 'change' ? '변경계약' : 
                             editData.contractType === 'extension' ? '연장계약' : 
                             editData.contractType === 'bidding' ? '입찰계약' : editData.contractType
            };

            localStorage.setItem('editingDraft', JSON.stringify(localStorageData));
            
            document.getElementById('localStorageData').innerHTML = 
                '<h3>localStorage에 저장됨:</h3>' +
                '<pre>' + JSON.stringify(localStorageData, null, 2) + '</pre>';
        }

        function loadFromLocalStorage() {
            const storedData = localStorage.getItem('editingDraft');
            if (storedData) {
                const parsedData = JSON.parse(storedData);
                document.getElementById('localStorageData').innerHTML = 
                    '<h3>localStorage에서 불러온 데이터:</h3>' +
                    '<pre>' + JSON.stringify(parsedData, null, 2) + '</pre>';
            } else {
                document.getElementById('localStorageData').innerHTML = 
                    '<p style="color: orange;">localStorage에 데이터가 없습니다.</p>';
            }
        }

        function simulateEditMode() {
            const storedData = localStorage.getItem('editingDraft');
            if (!storedData) {
                alert('먼저 localStorage에 데이터를 저장해주세요.');
                return;
            }

            const draftData = JSON.parse(storedData);
            
            // ProposalForm.js에서 사용하는 구조로 변환
            const formData = {
                purpose: draftData.purpose || '',
                basis: draftData.basis || '',
                budget: draftData.budget || '',
                contractMethod: draftData.contractMethod || '',
                accountSubject: draftData.accountSubject || '',
                costDepartments: (draftData.costDepartments || []).map(dept => ({
                    department: dept.department || '',
                    amount: dept.amount || 0,
                    ratio: dept.ratio || 0
                })),
                requestDepartments: (draftData.requestDepartments || []).map(dept => 
                    typeof dept === 'string' ? dept : dept.name || dept
                ),
                purchaseItems: (draftData.purchaseItems || []).map(item => ({
                    item: item.item || '',
                    productName: item.productName || '',
                    quantity: item.quantity || 0,
                    unitPrice: item.unitPrice || 0,
                    amount: item.amount || 0,
                    supplier: item.supplier || '',
                    requestDepartment: item.requestDepartment || ''
                })),
                serviceItems: (draftData.serviceItems || []).map(item => ({
                    item: item.item || '',
                    personnel: item.personnel || '',
                    skillLevel: item.skillLevel || '',
                    period: item.period || '',
                    monthlyRate: item.monthlyRate || 0,
                    contractAmount: item.contractAmount || 0,
                    supplier: item.supplier || '',
                    creditRating: item.creditRating || ''
                }))
            };

            document.getElementById('editModeData').innerHTML = 
                '<h3>편집 모드에서 사용할 데이터:</h3>' +
                '<h4>계정과목: ' + formData.accountSubject + '</h4>' +
                '<h4>요청부서: ' + JSON.stringify(formData.requestDepartments) + '</h4>' +
                '<h4>비용귀속부서: ' + JSON.stringify(formData.costDepartments) + '</h4>' +
                '<h4>구매품목: ' + JSON.stringify(formData.purchaseItems) + '</h4>' +
                '<h4>용역품목: ' + JSON.stringify(formData.serviceItems) + '</h4>' +
                '<pre>' + JSON.stringify(formData, null, 2) + '</pre>';
        }
    </script>
</body>
</html>
`;

fs.writeFileSync('./test-edit-browser.html', htmlContent, 'utf8');
console.log('✅ test-edit-browser.html 파일이 생성되었습니다.');
console.log('📝 브라우저에서 http://localhost:3001/test-edit-browser.html 을 열어서 테스트하세요.'); 