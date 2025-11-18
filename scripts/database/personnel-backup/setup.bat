@echo off
REM ============================================================
REM Personnel Backup 초기 설정 스크립트 (Windows)
REM ============================================================

echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo 📦 Personnel Backup 초기 설정
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

REM DB 설정 확인
echo 🔍 DB 설정 확인...
if exist ".env" (
  echo ✅ .env 파일 존재
  findstr /C:"DB_NAME" .env >nul 2>&1
  if %errorlevel% equ 0 (
    echo ✅ DB 설정 발견
  ) else (
    echo ⚠️  .env에 DB 설정이 없습니다
    echo    DB_NAME, DB_USERNAME, DB_PASSWORD 설정 필요
  )
) else (
  echo ⚠️  .env 파일이 없습니다
)
echo.

REM 테이블 생성 안내
echo 📋 다음 단계:
echo    1. personnel_backup 테이블 생성
echo       psql -U postgres -d cms_db -f scripts\database\personnel-backup\01-create-personnel-backup-table.sql
echo.
echo    2. 첫 백업 실행
echo       node scripts\database\personnel-backup\04-auto-backup.js
echo.
echo    3. 자동 백업 설정 (선택사항)
echo       작업 스케줄러에서 매월 1일 자정 실행 설정
echo       프로그램: node
echo       인수: %CD%\scripts\database\personnel-backup\04-auto-backup.js
echo       시작 위치: %CD%
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo ✅ 초기 설정 완료!
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

pause

