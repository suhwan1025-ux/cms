# PostgreSQL 자동 시작 빠른 가이드

Windows 시작 시 PostgreSQL이 자동으로 실행되도록 설정하는 간단한 가이드입니다.

## 📋 사전 확인

먼저 어떤 방법으로 PostgreSQL을 사용하고 있는지 확인하세요:

### 방법 1: Windows 서비스로 설치된 PostgreSQL
- PostgreSQL을 직접 설치한 경우
- 프로그램 및 기능에서 "PostgreSQL"을 확인할 수 있음

### 방법 2: Docker로 실행하는 PostgreSQL
- 프로젝트에 `docker-compose.yml` 파일이 있는 경우
- Docker Desktop이 설치되어 있는 경우

## 🚀 빠른 실행

### A. Windows 서비스 방식 (PostgreSQL 직접 설치)

**관리자 권한으로 PowerShell 실행 후:**

```powershell
cd D:\CMS_NEW
.\setup-postgres-autostart.ps1
```

이 스크립트가 자동으로:
- PostgreSQL 서비스를 찾습니다
- 시작 유형을 "자동"으로 설정합니다
- 서비스를 시작합니다

### B. Docker 방식

**관리자 권한으로 PowerShell 실행 후:**

```powershell
cd D:\CMS_NEW
.\setup-docker-autostart.ps1
```

이 스크립트가 자동으로:
- Docker 설치를 확인합니다
- 자동 시작 스크립트를 생성합니다
- Windows 작업 스케줄러에 등록합니다

**추가 설정 (중요!):**
1. Docker Desktop을 실행합니다
2. 설정(Settings) 아이콘을 클릭합니다
3. General 탭으로 이동합니다
4. **"Start Docker Desktop when you log in"** 체크박스를 선택합니다
5. "Apply & Restart" 클릭

## ✅ 확인 방법

### PowerShell에서 확인:

```powershell
# 서비스 방식
Get-Service | Where-Object {$_.DisplayName -like "*PostgreSQL*"}

# Docker 방식
docker ps | findstr postgres

# 포트 확인 (공통)
netstat -an | findstr :5432
```

### 결과 예시 (정상):
```
# 서비스 방식
Status   Name           DisplayName
------   ----           -----------
Running  postgresql-... PostgreSQL Server 15

# Docker 방식
contract-management-db   Up 2 minutes   0.0.0.0:5432->5432/tcp

# 포트 확인
TCP    0.0.0.0:5432    0.0.0.0:0    LISTENING
```

## 🔧 문제 해결

### PostgreSQL이 설치되어 있지 않은 경우

**옵션 1: PostgreSQL 직접 설치 (권장)**
1. https://www.postgresql.org/download/windows/ 접속
2. 최신 버전 다운로드
3. 설치 시 다음 설정:
   - Port: 5432
   - Password: meritz123!
   - ☑ Launch PostgreSQL at Windows startup
4. 설치 완료 후 `setup-postgres-autostart.ps1` 실행

**옵션 2: Docker 사용**
1. https://www.docker.com/products/docker-desktop 에서 Docker Desktop 설치
2. 설치 후 재부팅
3. `setup-docker-autostart.ps1` 실행

### 스크립트 실행 오류

**오류: "스크립트 실행이 거부되었습니다"**

PowerShell 실행 정책을 변경:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**오류: "관리자 권한이 필요합니다"**

1. Windows 검색에서 "PowerShell" 검색
2. **우클릭** → "관리자 권한으로 실행"
3. 스크립트 다시 실행

### Docker가 시작되지 않는 경우

1. Docker Desktop이 설치되어 있는지 확인
2. WSL 2가 설치되어 있는지 확인
   ```powershell
   wsl --status
   ```
3. 필요시 WSL 2 설치:
   ```powershell
   wsl --install
   ```

## 📝 로그 확인

### Docker 방식 로그:
```powershell
type D:\CMS_NEW\postgres-autostart.log
```

### 서비스 로그:
1. Windows 키 + R
2. `eventvwr` 입력
3. Windows 로그 → 응용 프로그램
4. "PostgreSQL" 검색

## 🎯 다음 단계

PostgreSQL이 자동 시작되도록 설정한 후:

1. **컴퓨터 재시작하여 테스트**
   ```powershell
   Restart-Computer
   ```

2. **재시작 후 확인**
   ```powershell
   # 서비스 확인
   Get-Service | Where-Object {$_.DisplayName -like "*PostgreSQL*"}
   
   # 또는 Docker 확인
   docker ps
   ```

3. **애플리케이션 시작**
   ```powershell
   cd D:\CMS_NEW
   npm start
   ```

## 💡 추가 팁

### 수동으로 시작/중지

**서비스 방식:**
```powershell
# 시작
Start-Service postgresql-x64-15

# 중지
Stop-Service postgresql-x64-15
```

**Docker 방식:**
```powershell
cd D:\CMS_NEW

# 시작
docker-compose up -d postgres

# 중지
docker-compose stop postgres

# 완전 제거
docker-compose down
```

### 자동 시작 해제

**서비스 방식:**
```powershell
Set-Service -Name "postgresql-x64-15" -StartupType Manual
```

**Docker 방식:**
```powershell
Unregister-ScheduledTask -TaskName "PostgreSQL Docker AutoStart" -Confirm:$false
```

## 📞 도움말

더 자세한 정보는 다음 파일을 참조하세요:
- `POSTGRESQL_AUTO_START_GUIDE.md` - 상세 가이드
- `setup-postgres-autostart.ps1` - 서비스 방식 스크립트
- `setup-docker-autostart.ps1` - Docker 방식 스크립트

