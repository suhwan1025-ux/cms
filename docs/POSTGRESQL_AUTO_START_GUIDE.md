# PostgreSQL Windows 자동 시작 설정 가이드

이 가이드는 Windows에서 PostgreSQL을 설치하고 자동 시작하도록 설정하는 방법을 설명합니다.

## 1. PostgreSQL 설치 확인

### 방법 1: PostgreSQL이 이미 설치되어 있는 경우

PowerShell에서 다음 명령어로 서비스 확인:
```powershell
Get-Service | Where-Object {$_.DisplayName -like "*PostgreSQL*"}
```

### 방법 2: PostgreSQL이 설치되지 않은 경우

1. **PostgreSQL 다운로드**
   - https://www.postgresql.org/download/windows/ 접속
   - 최신 버전 다운로드 (권장: PostgreSQL 15 이상)
   - 설치 프로그램 실행

2. **설치 시 중요 설정**
   - Port: 5432 (기본값)
   - 비밀번호: meritz123! (또는 원하는 비밀번호)
   - Locale: Korean, Korea
   - **중요**: "Launch PostgreSQL at Windows startup?" 옵션 체크

## 2. PostgreSQL 서비스 자동 시작 설정

### A. GUI를 통한 설정 (쉬운 방법)

1. Windows 키 + R 키를 누르고 `services.msc` 입력
2. "PostgreSQL" 관련 서비스 찾기 (예: postgresql-x64-15)
3. 서비스를 더블클릭
4. "시작 유형"을 **자동**으로 변경
5. "적용" 및 "확인" 클릭
6. 서비스가 중지되어 있다면 "시작" 버튼 클릭

### B. PowerShell을 통한 설정 (빠른 방법)

관리자 권한으로 PowerShell을 실행하고 다음 스크립트를 사용:

```powershell
# PostgreSQL 서비스 찾기
$pgService = Get-Service | Where-Object {$_.DisplayName -like "*PostgreSQL*"} | Select-Object -First 1

if ($pgService) {
    # 서비스를 자동 시작으로 설정
    Set-Service -Name $pgService.Name -StartupType Automatic
    
    # 서비스 시작
    Start-Service -Name $pgService.Name
    
    Write-Host "PostgreSQL 서비스가 자동 시작으로 설정되었습니다." -ForegroundColor Green
    Write-Host "서비스 이름: $($pgService.Name)" -ForegroundColor Cyan
    Write-Host "상태: $(Get-Service -Name $pgService.Name | Select-Object -ExpandProperty Status)" -ForegroundColor Cyan
} else {
    Write-Host "PostgreSQL 서비스를 찾을 수 없습니다." -ForegroundColor Red
    Write-Host "PostgreSQL이 설치되어 있는지 확인하세요." -ForegroundColor Yellow
}
```

## 3. Docker를 사용하는 경우

프로젝트에 `docker-compose.yml` 파일이 있으므로 Docker를 사용할 수도 있습니다.

### Docker Desktop 설치 및 설정

1. **Docker Desktop 설치**
   - https://www.docker.com/products/docker-desktop 에서 다운로드
   - 설치 후 재부팅

2. **Docker Desktop 자동 시작 설정**
   - Docker Desktop 실행
   - 설정(Settings) → General
   - "Start Docker Desktop when you log in" 체크

3. **PostgreSQL 컨테이너 시작**
   ```powershell
   cd D:\CMS_NEW
   docker-compose up -d postgres
   ```

4. **Windows 시작 시 자동 실행 스크립트 생성**
   - `auto-start-postgres.ps1` 스크립트 사용 (함께 제공됨)
   - Windows 작업 스케줄러에 등록

## 4. 확인 방법

PostgreSQL이 정상적으로 실행되는지 확인:

```powershell
# 서비스 상태 확인
Get-Service | Where-Object {$_.DisplayName -like "*PostgreSQL*"}

# 또는 Docker 컨테이너 확인
docker ps | findstr postgres

# 포트 확인
netstat -an | findstr :5432
```

## 5. 문제 해결

### 서비스가 시작되지 않는 경우
1. 이벤트 뷰어에서 오류 로그 확인 (Windows 키 + R → `eventvwr`)
2. PostgreSQL 로그 파일 확인 (보통 `C:\Program Files\PostgreSQL\15\data\log`)

### 포트 충돌
5432 포트가 이미 사용 중인 경우:
```powershell
netstat -ano | findstr :5432
```
프로세스 ID를 확인하고 필요시 종료

## 추가 정보

- 데이터베이스명: contract_management
- 사용자명: postgres
- 비밀번호: meritz123! (프로젝트 설정 기준)
- 포트: 5432

