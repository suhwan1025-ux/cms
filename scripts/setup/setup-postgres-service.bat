@echo off
chcp 65001 >nul
echo ========================================
echo PostgreSQL 서비스 자동 시작 설정
echo ========================================
echo.
echo 이 스크립트는 관리자 권한이 필요합니다.
echo.
pause

:: 관리자 권한으로 PowerShell 실행
powershell -Command "Start-Process powershell -ArgumentList '-ExecutionPolicy Bypass -File ""%~dp0register-postgres-service.ps1""' -Verb RunAs"

