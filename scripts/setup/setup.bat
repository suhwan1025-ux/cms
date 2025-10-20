@echo off
chcp 65001 > nul
echo ================================
echo 계약관리시스템 설정 스크립트
echo ================================
echo.

echo [1/5] Node.js 버전 확인 중...
node --version
if %errorlevel% neq 0 (
    echo 오류: Node.js가 설치되지 않았습니다.
    echo Node.js 16.x 이상을 설치해주세요.
    pause
    exit /b 1
)
echo.

echo [2/5] npm 의존성 설치 중...
call npm install
if %errorlevel% neq 0 (
    echo 오류: npm install 실패
    pause
    exit /b 1
)
echo.

echo [3/5] 환경 변수 파일 설정...
if not exist .env (
    if exist .env.example (
        copy .env.example .env
        echo .env 파일이 생성되었습니다.
        echo 데이터베이스 설정을 확인하고 수정해주세요.
    ) else (
        echo .env.example 파일이 없습니다.
    )
) else (
    echo .env 파일이 이미 존재합니다.
)
echo.

echo [4/5] PostgreSQL 연결 테스트...
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
        console.log('데이터베이스 연결 성공!');
        process.exit(0);
    })
    .catch(err => {
        console.log('데이터베이스 연결 실패:', err.message);
        console.log('PostgreSQL이 실행 중인지 확인하고 .env 파일의 설정을 확인해주세요.');
        process.exit(1);
    });
"
echo.

echo [5/5] 설정 완료!
echo.
echo 다음 단계:
echo 1. PostgreSQL에서 데이터베이스를 생성하세요:
echo    CREATE DATABASE contract_management;
echo.
echo 2. 마이그레이션을 실행하세요:
echo    npx sequelize-cli db:migrate
echo.
echo 3. 샘플 데이터를 생성하세요 (선택사항):
echo    node create-basic-samples.js
echo.
echo 4. 서버를 실행하세요:
echo    node server.js (백엔드)
echo    npm start (프론트엔드)
echo.
pause 