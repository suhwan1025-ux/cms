@echo off
chcp 65001 > nul
echo ================================
echo 워크스테이션 환경 설정 스크립트
echo ================================
echo.

echo 관리자 권한 확인 중...
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo 경고: 관리자 권한이 필요합니다.
    echo 일부 설정이 제한될 수 있습니다.
    echo.
)

echo [1/8] 시스템 정보 확인...
echo CPU 정보:
wmic cpu get name /format:list | findstr Name=
echo.
echo 메모리 정보:
wmic computersystem get TotalPhysicalMemory /format:list | findstr TotalPhysicalMemory=
echo.
echo 디스크 여유 공간:
wmic logicaldisk get size,freespace,caption /format:table
echo.

echo [2/8] Node.js 및 PostgreSQL 확인...
node --version 2>nul
if %errorlevel% neq 0 (
    echo 오류: Node.js가 설치되지 않았습니다.
    echo https://nodejs.org에서 LTS 버전을 다운로드하세요.
    pause
    exit /b 1
)

psql --version 2>nul
if %errorlevel% neq 0 (
    echo 경고: PostgreSQL이 설치되지 않았거나 PATH에 없습니다.
    echo https://www.postgresql.org/download/에서 다운로드하세요.
)
echo.

echo [3/8] 방화벽 포트 설정 (관리자 권한 필요)...
netsh advfirewall firewall add rule name="Contract Management Backend" dir=in action=allow protocol=TCP localport=3001 2>nul
netsh advfirewall firewall add rule name="Contract Management Frontend" dir=in action=allow protocol=TCP localport=3002 2>nul
netsh advfirewall firewall add rule name="PostgreSQL Database" dir=in action=allow protocol=TCP localport=5432 2>nul
if %errorlevel% equ 0 (
    echo 방화벽 규칙이 추가되었습니다.
) else (
    echo 방화벽 설정을 수동으로 확인하세요.
)
echo.

echo [4/8] npm 설정 최적화...
call npm config set fund false
call npm config set audit-level moderate
call npm install --production=false
echo.

echo [5/8] 환경 변수 파일 설정...
if not exist .env (
    if exist .env.example (
        copy .env.example .env
        echo .env 파일이 생성되었습니다.
    )
)

echo [6/8] 성능 최적화 설정...
echo NODE_OPTIONS=--max-old-space-size=4096 >> .env.local
echo 메모리 제한이 4GB로 설정되었습니다.
echo.

echo [7/8] 로그 디렉토리 생성...
if not exist logs mkdir logs
if not exist uploads mkdir uploads
echo 필요한 디렉토리가 생성되었습니다.
echo.

echo [8/8] 데이터베이스 연결 테스트...
node -e "
const { Sequelize } = require('sequelize');
require('dotenv').config();
const sequelize = new Sequelize(
    process.env.DB_NAME || 'contract_management',
    process.env.DB_USERNAME || 'postgres',
    process.env.DB_PASSWORD || 'meritz123!',
    {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        dialect: 'postgres',
        logging: false
    }
);
sequelize.authenticate()
    .then(() => {
        console.log('✓ 데이터베이스 연결 성공!');
        process.exit(0);
    })
    .catch(err => {
        console.log('✗ 데이터베이스 연결 실패:', err.message);
        console.log('PostgreSQL 서비스를 시작하고 .env 파일을 확인하세요.');
        process.exit(1);
    });
"
echo.

echo ================================
echo 워크스테이션 설정 완료!
echo ================================
echo.
echo 추가 권장 사항:
echo 1. 바이러스 백신에서 프로젝트 폴더 제외 설정
echo 2. 자동 백업 스케줄 설정
echo 3. 시스템 리소스 모니터링 도구 설치
echo.
echo 다음 단계:
echo 1. npx sequelize-cli db:migrate
echo 2. node create-basic-samples.js (선택사항)
echo 3. node server.js (백엔드 실행)
echo 4. npm start (프론트엔드 실행)
echo.
echo 워크스테이션 가이드: WORKSTATION_SETUP_GUIDE.md 참조
echo.
pause 