@echo off
echo ========================================
echo   AI 서버 시작
echo ========================================
echo.

cd /d "%~dp0ai_server"

REM .env 파일 확인
if not exist .env (
    echo [!] .env 파일이 없습니다. 자동 생성 중...
    copy env.example .env
    echo [+] .env 파일 생성 완료
    echo.
)

echo [*] AI 서버를 시작합니다...
echo [*] 최초 실행 시 데이터 인덱싱으로 시간이 걸릴 수 있습니다.
echo.

python main.py

pause

