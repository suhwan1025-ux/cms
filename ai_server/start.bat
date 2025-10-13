@echo off
echo ========================================
echo   CMS AI Assistant Server
echo ========================================
echo.

REM Python 가상환경 활성화 (있는 경우)
if exist venv\Scripts\activate.bat (
    echo [*] 가상환경 활성화...
    call venv\Scripts\activate.bat
)

REM 환경 변수 파일 확인
if not exist .env (
    echo [!] .env 파일이 없습니다. env.example을 복사하여 .env를 생성하고 설정을 입력하세요.
    pause
    exit /b 1
)

echo [*] AI 서버 시작 중...
python main.py

pause

