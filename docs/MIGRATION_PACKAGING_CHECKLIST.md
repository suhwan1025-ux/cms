# 📦 이관 패키징 체크리스트

**작성일**: 2025-11-05  
**목적**: 폐쇄망 이관을 위한 패키징 작업 순서

---

## 🎯 패키징 전 최종 점검

### 1. Git 상태 확인
```powershell
# 미커밋 파일 확인
git status

# 최신 커밋 상태로 정리
git add .
git commit -m "폐쇄망 이관 준비 완료"
```

### 2. 파일 정리 확인

#### ✅ 제거 완료된 항목
- [x] `ai_server/` 폴더 (AI 기능 제외)
- [x] `build/` 폴더 (재빌드 필요)
- [x] `db_data_backup/` 폴더
- [x] `logs/backup/` 폴더
- [x] `scripts/debug/` 폴더
- [x] `scripts/test/` 폴더
- [x] 백업 파일들 (`*_backup.js`)
- [x] 테스트 파일들 (`*.test.js`)

#### ⚠️ 포함하지 않을 항목
- [ ] `node_modules/` (별도 패키징)
- [ ] `.env` (보안상 제외, .env.example만 포함)
- [ ] `.git/` (선택사항 - 용량 절감)

---

## 📦 패키징 순서

### Step 1: 소스코드 압축

```powershell
# PowerShell에서 실행
cd D:\CMS_NEW

# 제외 항목 설정
$exclude = @('node_modules', 'build', '.git', 'logs', '.env')

# 압축 생성
Get-ChildItem -Path . -Recurse | 
    Where-Object { 
        $_.FullName -notmatch ($exclude -join '|') 
    } | 
    Compress-Archive -DestinationPath ..\CMS_SOURCE.zip -Force

# 결과 확인
Get-Item ..\CMS_SOURCE.zip | Select-Object Name, @{N='Size(MB)';E={[math]::Round($_.Length/1MB,2)}}
```

**예상 크기**: 10-20MB

### Step 2: node_modules 압축

```powershell
cd D:\CMS_NEW

# 깨끗한 설치
Remove-Item node_modules -Recurse -Force -ErrorAction SilentlyContinue
npm install --legacy-peer-deps

# 압축
Compress-Archive -Path node_modules -DestinationPath ..\CMS_node_modules.zip -Force

# 결과 확인
Get-Item ..\CMS_node_modules.zip | Select-Object Name, @{N='Size(MB)';E={[math]::Round($_.Length/1MB,2)}}
```

**예상 크기**: 150-200MB

### Step 3: DB 스크립트 압축

```powershell
cd D:\CMS_NEW

# sql/dba_setup 폴더만 압축
Compress-Archive -Path sql\dba_setup -DestinationPath ..\CMS_DB_SCRIPTS.zip -Force

# 결과 확인
Get-Item ..\CMS_DB_SCRIPTS.zip | Select-Object Name, @{N='Size(MB)';E={[math]::Round($_.Length/1MB,2)}}
```

**예상 크기**: 1MB 미만

### Step 4: 문서 압축

```powershell
cd D:\CMS_NEW

# docs 폴더 압축
Compress-Archive -Path docs -DestinationPath ..\CMS_DOCS.zip -Force

# README.md 포함
Compress-Archive -Path README.md -Update -DestinationPath ..\CMS_DOCS.zip

# 결과 확인
Get-Item ..\CMS_DOCS.zip | Select-Object Name, @{N='Size(MB)';E={[math]::Round($_.Length/1MB,2)}}
```

**예상 크기**: 1-2MB

---

## 📥 외부 파일 다운로드

### 1. Node.js 설치 파일

```
✅ 파일명: node-v22.20.0-x64.msi
📥 다운로드: https://nodejs.org/dist/v22.20.0/node-v22.20.0-x64.msi
💾 크기: 약 30MB
```

### 2. PostgreSQL 설치 파일

```
✅ 파일명: postgresql-14.x-windows-x64.exe
📥 다운로드: https://www.postgresql.org/download/windows/
💾 크기: 약 250MB
🔧 버전: 14.x (안정 버전)
```

### 3. pgAdmin 4 (선택사항)

```
✅ 파일명: pgadmin4-x.x-x64.exe
📥 다운로드: https://www.pgadmin.org/download/
💾 크기: 약 100MB
📝 참고: PostgreSQL 설치 시 함께 설치 가능
```

---

## 📋 최종 패키지 구성

### 폴더 구조

```
📦 CMS_MIGRATION/
├── 📄 CMS_SOURCE.zip (10-20MB)
│   └── 전체 소스코드 (node_modules 제외)
│
├── 📄 CMS_node_modules.zip (150-200MB)
│   └── npm 패키지
│
├── 📄 CMS_DB_SCRIPTS.zip (1MB)
│   └── sql/dba_setup 폴더
│
├── 📄 CMS_DOCS.zip (1-2MB)
│   └── 문서 및 README
│
├── 📄 node-v22.20.0-x64.msi (30MB)
│   └── Node.js 설치 파일
│
├── 📄 postgresql-14.x-windows-x64.exe (250MB)
│   └── PostgreSQL 설치 파일
│
└── 📄 README_이관가이드.txt
    └── 간단한 설치 순서 요약

💾 총 용량: 약 440MB - 500MB
```

### README_이관가이드.txt 작성

```powershell
cd D:\CMS_MIGRATION

# 간단한 가이드 파일 생성
@"
========================================
계약관리시스템(CMS) 폐쇄망 이관 가이드
========================================

📦 패키지 구성:
1. CMS_SOURCE.zip - 소스코드
2. CMS_node_modules.zip - npm 패키지
3. CMS_DB_SCRIPTS.zip - 데이터베이스 스크립트
4. CMS_DOCS.zip - 상세 문서
5. node-v22.20.0-x64.msi - Node.js
6. postgresql-14.x-windows-x64.exe - PostgreSQL

🚀 설치 순서:
1. Node.js 설치 (node-v22.20.0-x64.msi)
2. PostgreSQL 설치 (postgresql-14.x-windows-x64.exe)
3. 소스코드 압축 해제 (C:\WebApps\CMS)
4. node_modules 압축 해제 (소스코드 폴더 내)
5. DB 스크립트 실행 (순서대로)
6. 환경 설정 (.env 파일 생성)
7. 빌드 및 실행

📖 상세 가이드:
CMS_DOCS.zip 압축 해제 후
docs/CODE_MIGRATION_GUIDE.md 참조

📞 문의:
IT 부서 내선: XXXX
"@ | Out-File -FilePath README_이관가이드.txt -Encoding UTF8
```

---

## ✅ 패키징 완료 확인

### 파일 체크리스트

```powershell
cd D:\CMS_MIGRATION

# 모든 파일 확인
Get-ChildItem | Select-Object Name, @{N='Size(MB)';E={[math]::Round($_.Length/1MB,2)}}
```

**예상 출력:**
```
Name                                Size(MB)
----                                --------
CMS_SOURCE.zip                      15.50
CMS_node_modules.zip                180.25
CMS_DB_SCRIPTS.zip                  0.85
CMS_DOCS.zip                        1.20
node-v22.20.0-x64.msi               30.12
postgresql-14.x-windows-x64.exe     245.80
README_이관가이드.txt               0.01
```

### 압축 파일 무결성 검사

```powershell
# 각 압축 파일 테스트
Test-Path CMS_SOURCE.zip
Test-Path CMS_node_modules.zip
Test-Path CMS_DB_SCRIPTS.zip
Test-Path CMS_DOCS.zip

# ZIP 파일 열어서 내용 확인
Expand-Archive -Path CMS_SOURCE.zip -DestinationPath .\TEST_EXTRACT -Force
Get-ChildItem .\TEST_EXTRACT -Recurse | Measure-Object | Select-Object Count
Remove-Item .\TEST_EXTRACT -Recurse -Force
```

---

## 💾 전송 준비

### USB 메모리 준비

```powershell
# USB 드라이브 확인
Get-Volume | Where-Object {$_.DriveType -eq 'Removable'}

# USB로 복사 (E: 드라이브 가정)
$usbDrive = "E:"
Copy-Item D:\CMS_MIGRATION\* $usbDrive\CMS_MIGRATION\ -Recurse -Force

# 복사 확인
Get-ChildItem $usbDrive\CMS_MIGRATION\
```

### 체크섬 생성 (무결성 검증용)

```powershell
cd D:\CMS_MIGRATION

# 각 파일의 MD5 해시 생성
Get-ChildItem *.zip, *.msi, *.exe | ForEach-Object {
    $hash = Get-FileHash $_.FullName -Algorithm MD5
    "$($_.Name): $($hash.Hash)"
} | Out-File checksums.txt

# checksums.txt도 함께 전송
cat checksums.txt
```

---

## 🎯 패키징 완료 후 작업

### 1. 백업 보관

```powershell
# 패키징한 파일들을 백업 위치에 복사
$backupPath = "D:\Backups\CMS_$(Get-Date -Format 'yyyyMMdd')"
New-Item -ItemType Directory -Path $backupPath -Force
Copy-Item D:\CMS_MIGRATION\* $backupPath\ -Recurse
```

### 2. 전송 로그 작성

```powershell
@"
이관 패키징 완료 보고

패키징 일시: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
패키징 PC: $env:COMPUTERNAME
작업자: $env:USERNAME

패키지 내용:
- CMS_SOURCE.zip: $('{0:N2} MB' -f ((Get-Item D:\CMS_MIGRATION\CMS_SOURCE.zip).Length/1MB))
- CMS_node_modules.zip: $('{0:N2} MB' -f ((Get-Item D:\CMS_MIGRATION\CMS_node_modules.zip).Length/1MB))
- CMS_DB_SCRIPTS.zip: $('{0:N2} MB' -f ((Get-Item D:\CMS_MIGRATION\CMS_DB_SCRIPTS.zip).Length/1MB))
- CMS_DOCS.zip: $('{0:N2} MB' -f ((Get-Item D:\CMS_MIGRATION\CMS_DOCS.zip).Length/1MB))
- Node.js: $('{0:N2} MB' -f ((Get-Item D:\CMS_MIGRATION\node-v22.20.0-x64.msi).Length/1MB))
- PostgreSQL: $('{0:N2} MB' -f ((Get-Item D:\CMS_MIGRATION\postgresql-14.x-windows-x64.exe).Length/1MB))

총 용량: $('{0:N2} MB' -f ((Get-ChildItem D:\CMS_MIGRATION\*.zip, D:\CMS_MIGRATION\*.msi, D:\CMS_MIGRATION\*.exe | Measure-Object Length -Sum).Sum/1MB))

체크섬 파일: checksums.txt
전송 방법: USB 메모리
전송 예정일: [입력 필요]
"@ | Out-File D:\CMS_MIGRATION\packaging_report.txt -Encoding UTF8
```

---

## 📞 문제 발생 시

### 압축 실패

```powershell
# 오류 발생 시 수동 압축
# Windows 탐색기에서 마우스 우클릭 → 보내기 → 압축(ZIP) 폴더
```

### 용량 부족

```powershell
# 임시 파일 정리
Remove-Item $env:TEMP\* -Recurse -Force -ErrorAction SilentlyContinue

# 디스크 정리
cleanmgr
```

---

## ✅ 최종 체크리스트

```
패키징 작업:
✅ 소스코드 압축 완료
✅ node_modules 압축 완료
✅ DB 스크립트 압축 완료
✅ 문서 압축 완료

외부 파일:
✅ Node.js 설치 파일 다운로드
✅ PostgreSQL 설치 파일 다운로드

검증:
✅ 파일 무결성 확인
✅ 체크섬 생성
✅ 압축 테스트 완료

문서:
✅ README 작성
✅ 패키징 보고서 작성
✅ 이관 가이드 포함

전송:
✅ USB 메모리 준비
✅ 파일 복사 완료
✅ 백업 보관 완료
```

---

**패키징 완료! 폐쇄망 이관 준비가 완료되었습니다.** 🎉

---

**작성일**: 2025-11-05  
**버전**: 1.0

