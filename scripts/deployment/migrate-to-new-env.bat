@echo off
chcp 65001 >nul
color 0A
echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║        계약관리시스템 - 새 환경 마이그레이션 자동화           ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

REM 관리자 권한 확인
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ⚠️  이 스크립트는 관리자 권한이 필요할 수 있습니다.
    echo.
)

echo [📋 준비사항 확인]
echo.
echo 다음 사항이 준비되었는지 확인하세요:
echo   ✓ Node.js 설치 완료 (node --version)
echo   ✓ PostgreSQL 설치 완료 (psql --version)
echo   ✓ .env 파일 설정 완료
echo   ✓ data-export-*.json 파일 준비
echo.
pause
echo.

REM Node.js 확인
echo [1/7] Node.js 확인 중...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js가 설치되어 있지 않습니다!
    echo    https://nodejs.org/ 에서 다운로드하세요.
    goto error
)
echo ✅ Node.js 확인 완료
echo.

REM PostgreSQL 확인
echo [2/7] PostgreSQL 확인 중...
psql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  PostgreSQL이 설치되어 있지 않거나 PATH에 없습니다.
    echo    계속 진행하시겠습니까? (Y/N)
    set /p CONTINUE=
    if /i not "%CONTINUE%"=="Y" goto error
)
echo ✅ PostgreSQL 확인 완료
echo.

REM .env 파일 확인
echo [3/7] 환경 설정 파일 확인 중...
if not exist ".env" (
    echo ⚠️  .env 파일이 없습니다!
    echo.
    echo .env 파일을 생성하시겠습니까? (Y/N)
    set /p CREATE_ENV=
    if /i "%CREATE_ENV%"=="Y" (
        copy env.example .env
        echo ✅ .env 파일이 생성되었습니다. 내용을 확인하고 수정하세요.
        echo.
        notepad .env
        pause
    ) else (
        goto error
    )
)
echo ✅ .env 파일 확인 완료
echo.

REM npm 패키지 설치
echo [4/7] npm 패키지 설치 중...
if not exist "node_modules" (
    echo 📦 패키지를 설치합니다...
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ npm 패키지 설치 실패!
        goto error
    )
    echo ✅ 패키지 설치 완료
) else (
    echo ✅ 패키지가 이미 설치되어 있습니다.
)
echo.

REM 데이터베이스 생성
echo [5/7] 데이터베이스 생성 중...
node create-database.js
if %errorlevel% neq 0 (
    echo ❌ 데이터베이스 생성 실패!
    echo.
    echo 다음을 확인하세요:
    echo   - PostgreSQL 서비스가 실행 중인지
    echo   - .env 파일의 DB 설정이 올바른지
    echo   - PostgreSQL 비밀번호가 맞는지
    goto error
)
echo.

REM 테이블 생성
echo [6/7] 데이터베이스 테이블 생성 중...
node create-all-tables.js
if %errorlevel% neq 0 (
    echo ❌ 테이블 생성 실패!
    goto error
)
echo.

REM 데이터 임포트
echo [7/7] 데이터 임포트...
echo.
echo 📁 data-export-*.json 파일 목록:
echo.
dir /b data-export-*.json 2>nul
if %errorlevel% neq 0 (
    echo ⚠️  data-export-*.json 파일이 없습니다!
    echo.
    echo 데이터 임포트를 건너뛰시겠습니까? (Y/N)
    set /p SKIP_IMPORT=
    if /i not "%SKIP_IMPORT%"=="Y" goto error
) else (
    echo.
    echo 임포트할 JSON 파일명을 입력하세요:
    set /p IMPORT_FILE=
    
    if not exist "%IMPORT_FILE%" (
        echo ❌ 파일을 찾을 수 없습니다: %IMPORT_FILE%
        goto error
    )
    
    node import-current-data.js "%IMPORT_FILE%"
    if %errorlevel% neq 0 (
        echo ❌ 데이터 임포트 실패!
        echo.
        echo 일부 데이터는 임포트되었을 수 있습니다.
        echo 계속 진행하시겠습니까? (Y/N)
        set /p CONTINUE_AFTER_ERROR=
        if /i not "%CONTINUE_AFTER_ERROR%"=="Y" goto error
    )
)
echo.

REM 연결 테스트
echo [테스트] 데이터베이스 연결 테스트 중...
node test-db.js
echo.

REM 완료
echo ╔════════════════════════════════════════════════════════════════╗
echo ║                 🎉 마이그레이션 완료! 🎉                       ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.
echo 다음 단계:
echo   1. 터미널에서 실행: node server.js
echo   2. 새 터미널에서 실행: npm start
echo   3. 브라우저에서 접속: http://localhost:3002
echo.
echo 또는 자동으로 서버를 시작하시겠습니까? (Y/N)
set /p START_SERVER=
if /i "%START_SERVER%"=="Y" (
    echo.
    echo 🚀 서버를 시작합니다...
    echo    Ctrl+C를 눌러 종료할 수 있습니다.
    echo.
    start cmd /k "node server.js"
    timeout /t 3 /nobreak >nul
    start cmd /k "npm start"
    echo.
    echo ✅ 서버가 시작되었습니다!
    echo    브라우저가 자동으로 열리지 않으면:
    echo    http://localhost:3002 로 접속하세요.
)
echo.
pause
goto end

:error
echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║                  ❌ 오류 발생!                                 ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.
echo 위의 오류 메시지를 확인하고 문제를 해결한 후 다시 시도하세요.
echo.
echo 도움말:
echo   - MIGRATION_GUIDE.md 문서를 참고하세요
echo   - 수동으로 각 단계를 실행해보세요
echo   - logs/ 폴더의 로그 파일을 확인하세요
echo.
pause
exit /b 1

:end
exit /b 0 