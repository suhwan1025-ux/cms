# 🏗️ 프로덕션 빌드 검증 가이드

**작성일**: 2025-11-05  
**목적**: 폐쇄망 이관 전 빌드 검증

---

## 📋 빌드 전 체크리스트

### 1. 의존성 확인
```powershell
# package.json 확인
cat package.json | Select-String "dependencies"

# node_modules 설치 확인
Test-Path node_modules
```

### 2. 환경 변수 설정
```powershell
# .env 파일 확인 (없으면 env.example 복사)
if (!(Test-Path .env)) {
    Copy-Item env.example .env
    Write-Host ".env 파일을 생성했습니다. 내용을 확인하세요."
}

# .env 내용 확인
cat .env
```

---

## 🏗️ 빌드 실행

### 개발 빌드 (테스트용)
```powershell
# 일반 빌드
npm run build

# 소스맵 없이 빌드
$env:GENERATE_SOURCEMAP="false"
npm run build
```

### 프로덕션 빌드 (배포용)
```powershell
# 프로덕션 빌드
npm run build:prod

# 빌드 결과 확인
dir build
```

---

## ✅ 빌드 결과 검증

### 1. 파일 구조 확인
```powershell
# build 폴더 구조 출력
tree build /F

# 예상 구조:
# build/
# ├── asset-manifest.json
# ├── favicon.ico
# ├── index.html
# ├── manifest.json
# ├── robots.txt
# └── static/
#     ├── css/
#     │   ├── main.xxxxxx.css
#     │   └── main.xxxxxx.css.map (소스맵 제외 시 없음)
#     └── js/
#         ├── main.xxxxxx.js
#         ├── main.xxxxxx.js.map (소스맵 제외 시 없음)
#         └── *.chunk.js
```

### 2. 필수 파일 확인
```powershell
# 필수 파일 존재 여부 확인
$requiredFiles = @(
    "build/index.html",
    "build/asset-manifest.json",
    "build/static/js/*.js",
    "build/static/css/*.css",
    "public/js/html2canvas.min.js"
)

foreach ($file in $requiredFiles) {
    $exists = Test-Path $file
    Write-Host "$file : $exists"
}
```

### 3. 파일 크기 확인
```powershell
# JS 파일 크기 확인
Get-ChildItem build/static/js -Filter *.js | 
    Select-Object Name, @{N='Size(KB)';E={[math]::Round($_.Length/1KB,2)}} | 
    Sort-Object 'Size(KB)' -Descending

# CSS 파일 크기 확인
Get-ChildItem build/static/css -Filter *.css | 
    Select-Object Name, @{N='Size(KB)';E={[math]::Round($_.Length/1KB,2)}}

# 총 빌드 크기
$totalSize = (Get-ChildItem build -Recurse | Measure-Object Length -Sum).Sum / 1MB
Write-Host "총 빌드 크기: $([math]::Round($totalSize, 2)) MB"
```

**예상 크기:**
- 전체 build 폴더: 5-10MB
- main.js: 500KB - 1MB
- main.css: 50-100KB

---

## 🧪 빌드 테스트

### 1. 로컬 서버로 테스트
```powershell
# 빌드된 파일 서빙
npm run start:prod

# 또는 간단한 HTTP 서버로 테스트
npx serve -s build -p 3001
```

### 2. 브라우저 테스트
```
1. 브라우저 열기: http://localhost:3001
2. 개발자 도구 열기 (F12)
3. Console 탭에서 오류 확인
4. Network 탭에서 리소스 로딩 확인
```

### 3. 기능 테스트 체크리스트
```
✅ 페이지 로딩 확인
✅ CSS 스타일 적용 확인
✅ JavaScript 동작 확인
✅ 이미지 로딩 확인
✅ API 연결 테스트 (백엔드 실행 필요)
✅ 라우팅 테스트 (페이지 이동)
✅ CKEditor 로딩 확인
✅ html2canvas 기능 확인
```

---

## 🔍 빌드 검증 스크립트

### 자동 검증 스크립트 작성
```powershell
# verify-build.ps1 생성
@'
Write-Host "===== 빌드 검증 스크립트 =====" -ForegroundColor Green

# 1. build 폴더 존재 확인
if (!(Test-Path build)) {
    Write-Host "❌ build 폴더가 없습니다!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ build 폴더 존재" -ForegroundColor Green

# 2. index.html 확인
if (!(Test-Path build/index.html)) {
    Write-Host "❌ index.html이 없습니다!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ index.html 존재" -ForegroundColor Green

# 3. static 폴더 확인
if (!(Test-Path build/static)) {
    Write-Host "❌ static 폴더가 없습니다!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ static 폴더 존재" -ForegroundColor Green

# 4. JS 파일 확인
$jsFiles = Get-ChildItem build/static/js -Filter *.js -ErrorAction SilentlyContinue
if ($jsFiles.Count -eq 0) {
    Write-Host "❌ JS 파일이 없습니다!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ JS 파일 존재 ($($jsFiles.Count)개)" -ForegroundColor Green

# 5. CSS 파일 확인
$cssFiles = Get-ChildItem build/static/css -Filter *.css -ErrorAction SilentlyContinue
if ($cssFiles.Count -eq 0) {
    Write-Host "❌ CSS 파일이 없습니다!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ CSS 파일 존재 ($($cssFiles.Count)개)" -ForegroundColor Green

# 6. html2canvas 확인
if (!(Test-Path public/js/html2canvas.min.js)) {
    Write-Host "⚠️  html2canvas.min.js가 없습니다!" -ForegroundColor Yellow
} else {
    Write-Host "✅ html2canvas.min.js 존재" -ForegroundColor Green
}

# 7. 총 크기 확인
$totalSize = (Get-ChildItem build -Recurse | Measure-Object Length -Sum).Sum / 1MB
Write-Host "📊 총 빌드 크기: $([math]::Round($totalSize, 2)) MB" -ForegroundColor Cyan

Write-Host "`n===== 빌드 검증 완료 =====" -ForegroundColor Green
'@ | Out-File verify-build.ps1 -Encoding UTF8

# 실행
powershell -ExecutionPolicy Bypass -File verify-build.ps1
```

---

## ⚠️ 일반적인 빌드 오류 및 해결

### 오류 1: "Out of memory"
```powershell
# 해결: Node.js 메모리 증가
$env:NODE_OPTIONS="--max-old-space-size=4096"
npm run build:prod
```

### 오류 2: "Module not found"
```powershell
# 해결: node_modules 재설치
Remove-Item node_modules -Recurse -Force
npm install --legacy-peer-deps
```

### 오류 3: CKEditor 빌드 오류
```powershell
# 이미 해결됨 (craco.config.js 설정 완료)
# 확인만 하면 됨
cat craco.config.js
```

### 오류 4: "Failed to compile"
```powershell
# 해결: 린트 오류 확인 및 수정
npm run build 2>&1 | Select-String "error"

# 또는 린트 무시하고 빌드 (비권장)
$env:DISABLE_ESLINT_PLUGIN="true"
npm run build
```

---

## 📦 빌드 최적화 팁

### 1. 소스맵 제거 (용량 감소)
```ini
# .env
GENERATE_SOURCEMAP=false
```
**효과**: 빌드 크기 약 30-40% 감소

### 2. 코드 스플리팅 확인
```javascript
// build/asset-manifest.json 확인
cat build/asset-manifest.json | Select-String "chunk"
```
**목표**: 여러 개의 chunk 파일로 분할됨

### 3. Gzip 압축 테스트
```powershell
# Gzip 압축 크기 예측
$jsFile = (Get-ChildItem build/static/js/main*.js)[0]
$originalSize = $jsFile.Length / 1KB
Compress-Archive $jsFile.FullName test.zip -Force
$compressedSize = (Get-Item test.zip).Length / 1KB
Remove-Item test.zip

Write-Host "원본: $([math]::Round($originalSize, 2)) KB"
Write-Host "압축: $([math]::Round($compressedSize, 2)) KB"
Write-Host "압축률: $([math]::Round(($compressedSize/$originalSize)*100, 2))%"
```

---

## ✅ 최종 확인 체크리스트

```
빌드 과정:
✅ npm run build:prod 성공
✅ 오류 없음
✅ 경고 메시지 확인

빌드 결과:
✅ build/ 폴더 생성
✅ index.html 존재
✅ static/js/*.js 존재
✅ static/css/*.css 존재
✅ asset-manifest.json 존재

파일 확인:
✅ html2canvas.min.js 존재
✅ favicon.ico 존재
✅ manifest.json 존재

크기 확인:
✅ 총 빌드 크기 < 15MB
✅ main.js < 2MB
✅ main.css < 200KB

기능 테스트:
✅ 로컬 서버로 테스트 완료
✅ 브라우저 Console 오류 없음
✅ 모든 페이지 로딩 정상
✅ API 연결 정상
```

---

## 🚀 빌드 후 다음 단계

### 1. 빌드 파일 백업
```powershell
# 빌드 결과 백업
$backupName = "build_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
Copy-Item build $backupName -Recurse
Compress-Archive $backupName "$backupName.zip"
Remove-Item $backupName -Recurse
```

### 2. 프로덕션 서버 배포 준비
```
빌드 완료 후:
1. build/ 폴더는 폐쇄망 이관 시 제외
2. 폐쇄망에서 다시 빌드 실행
3. 또는 빌드된 파일도 함께 이관 가능
```

### 3. 성능 측정
```
Chrome DevTools:
1. Lighthouse 실행 (F12 → Lighthouse)
2. Performance 측정
3. 최적화 제안 확인
```

---

## 📞 문제 발생 시

### 빌드가 안 될 때
1. `node_modules` 삭제 후 재설치
2. Node.js 버전 확인 (v18 이상)
3. 메모리 부족 시 `NODE_OPTIONS` 설정

### 빌드는 되지만 실행이 안 될 때
1. 브라우저 Console 확인
2. Network 탭에서 404 오류 확인
3. `public/` 폴더 파일 누락 확인

---

**작성일**: 2025-11-05  
**버전**: 1.0

