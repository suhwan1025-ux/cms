# AI 어시스턴트 사전 요구사항 자동 설치 스크립트
# Python 3.12 및 Ollama 자동 설치

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  AI 어시스턴트 사전 요구사항 설치" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 관리자 권한 확인
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "[!] 이 스크립트는 관리자 권한이 필요합니다." -ForegroundColor Yellow
    Write-Host "[*] PowerShell을 관리자 권한으로 실행한 후 다시 시도해주세요." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "방법: PowerShell 아이콘 우클릭 > '관리자 권한으로 실행'" -ForegroundColor Yellow
    pause
    exit 1
}

# winget 확인
Write-Host "[*] Windows 패키지 관리자(winget) 확인 중..." -ForegroundColor Yellow
try {
    winget --version | Out-Null
    Write-Host "[+] winget 사용 가능" -ForegroundColor Green
    $useWinget = $true
} catch {
    Write-Host "[!] winget을 사용할 수 없습니다. 수동 설치 모드로 전환합니다." -ForegroundColor Yellow
    $useWinget = $false
}

Write-Host ""

# ========================================
# Python 설치
# ========================================
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  1. Python 설치" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Python 설치 확인
$pythonInstalled = $false
try {
    $pythonVersion = python --version 2>&1
    if ($pythonVersion -match "Python (\d+)\.(\d+)") {
        $majorVersion = [int]$matches[1]
        $minorVersion = [int]$matches[2]
        if ($majorVersion -ge 3 -and $minorVersion -ge 9) {
            Write-Host "[+] Python이 이미 설치되어 있습니다: $pythonVersion" -ForegroundColor Green
            $pythonInstalled = $true
        }
    }
} catch {
    Write-Host "[*] Python이 설치되어 있지 않습니다." -ForegroundColor Yellow
}

if (-not $pythonInstalled) {
    Write-Host "[*] Python 3.12 설치를 시작합니다..." -ForegroundColor Yellow
    
    if ($useWinget) {
        # winget으로 설치
        Write-Host "[*] winget을 사용하여 Python 설치 중..." -ForegroundColor Yellow
        winget install Python.Python.3.12 --silent --accept-package-agreements --accept-source-agreements
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "[+] Python 설치 완료!" -ForegroundColor Green
            
            # PATH 갱신
            $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
            
            Write-Host "[*] Python 버전 확인 중..." -ForegroundColor Yellow
            Start-Sleep -Seconds 2
            python --version
        } else {
            Write-Host "[!] Python 설치 실패. 수동 설치가 필요합니다." -ForegroundColor Red
            Write-Host "[*] https://www.python.org/downloads/ 에서 다운로드하세요." -ForegroundColor Yellow
        }
    } else {
        # 수동 설치 안내
        Write-Host "[!] 수동 설치가 필요합니다:" -ForegroundColor Yellow
        Write-Host "    1. https://www.python.org/downloads/ 접속" -ForegroundColor White
        Write-Host "    2. 'Download Python 3.12' 클릭" -ForegroundColor White
        Write-Host "    3. 설치 시 'Add Python to PATH' 체크!" -ForegroundColor Red
        Write-Host ""
        Write-Host "[?] Python 설치를 완료한 후 아무 키나 누르세요..." -ForegroundColor Yellow
        pause
    }
} else {
    Write-Host "[+] Python 설치 건너뛰기 (이미 설치됨)" -ForegroundColor Green
}

Write-Host ""

# ========================================
# Ollama 설치
# ========================================
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  2. Ollama 설치" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Ollama 설치 확인
$ollamaInstalled = $false
try {
    ollama --version | Out-Null
    Write-Host "[+] Ollama가 이미 설치되어 있습니다." -ForegroundColor Green
    $ollamaInstalled = $true
} catch {
    Write-Host "[*] Ollama가 설치되어 있지 않습니다." -ForegroundColor Yellow
}

if (-not $ollamaInstalled) {
    Write-Host "[*] Ollama 설치를 시작합니다..." -ForegroundColor Yellow
    
    # Ollama 다운로드 URL
    $ollamaUrl = "https://ollama.com/download/OllamaSetup.exe"
    $ollamaInstaller = "$env:TEMP\OllamaSetup.exe"
    
    try {
        Write-Host "[*] Ollama 설치 파일 다운로드 중..." -ForegroundColor Yellow
        Invoke-WebRequest -Uri $ollamaUrl -OutFile $ollamaInstaller -UseBasicParsing
        
        Write-Host "[*] Ollama 설치 실행 중..." -ForegroundColor Yellow
        Start-Process -FilePath $ollamaInstaller -Wait
        
        Write-Host "[+] Ollama 설치 완료!" -ForegroundColor Green
        
        # PATH 갱신
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
        
        # 설치 파일 삭제
        Remove-Item $ollamaInstaller -ErrorAction SilentlyContinue
        
    } catch {
        Write-Host "[!] Ollama 자동 다운로드 실패. 수동 설치가 필요합니다." -ForegroundColor Red
        Write-Host "[*] https://ollama.com/download 에서 다운로드하세요." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "[?] Ollama 설치를 완료한 후 아무 키나 누르세요..." -ForegroundColor Yellow
        pause
    }
} else {
    Write-Host "[+] Ollama 설치 건너뛰기 (이미 설치됨)" -ForegroundColor Green
}

Write-Host ""

# ========================================
# Ollama 모델 다운로드
# ========================================
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  3. Ollama 모델 다운로드" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

try {
    ollama --version | Out-Null
    
    Write-Host "[*] 필요한 모델을 다운로드합니다..." -ForegroundColor Yellow
    Write-Host "[*] 이 과정은 시간이 걸릴 수 있습니다 (약 10-20분)" -ForegroundColor Yellow
    Write-Host ""
    
    # 모델 목록 확인
    $models = ollama list 2>&1 | Out-String
    
    # qwen2.5:7b 확인
    if ($models -notmatch "qwen2.5:7b") {
        Write-Host "[*] qwen2.5:7b 모델 다운로드 중... (약 4.4GB)" -ForegroundColor Yellow
        ollama pull qwen2.5:7b
        Write-Host "[+] qwen2.5:7b 다운로드 완료!" -ForegroundColor Green
    } else {
        Write-Host "[+] qwen2.5:7b 이미 다운로드됨" -ForegroundColor Green
    }
    
    Write-Host ""
    
    # nomic-embed-text 확인
    if ($models -notmatch "nomic-embed-text") {
        Write-Host "[*] nomic-embed-text 모델 다운로드 중... (약 274MB)" -ForegroundColor Yellow
        ollama pull nomic-embed-text
        Write-Host "[+] nomic-embed-text 다운로드 완료!" -ForegroundColor Green
    } else {
        Write-Host "[+] nomic-embed-text 이미 다운로드됨" -ForegroundColor Green
    }
    
} catch {
    Write-Host "[!] Ollama 모델 다운로드 실패" -ForegroundColor Red
    Write-Host "[*] Ollama 서비스가 실행 중인지 확인하고 수동으로 다운로드하세요:" -ForegroundColor Yellow
    Write-Host "    ollama pull qwen2.5:7b" -ForegroundColor White
    Write-Host "    ollama pull nomic-embed-text" -ForegroundColor White
}

Write-Host ""

# ========================================
# Python 패키지 설치
# ========================================
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  4. Python 패키지 설치" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$aiServerPath = Join-Path $PSScriptRoot "ai_server"
if (Test-Path $aiServerPath) {
    Push-Location $aiServerPath
    
    Write-Host "[*] Python 패키지 설치 중..." -ForegroundColor Yellow
    
    try {
        python -m pip install --upgrade pip
        pip install -r requirements.txt
        
        Write-Host "[+] Python 패키지 설치 완료!" -ForegroundColor Green
    } catch {
        Write-Host "[!] 패키지 설치 중 오류 발생" -ForegroundColor Red
        Write-Host "[*] 수동으로 설치하세요: pip install -r requirements.txt" -ForegroundColor Yellow
    }
    
    Pop-Location
} else {
    Write-Host "[!] ai_server 폴더를 찾을 수 없습니다." -ForegroundColor Red
}

Write-Host ""

# ========================================
# 설치 완료
# ========================================
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  설치 완료!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[+] 모든 사전 요구사항 설치가 완료되었습니다!" -ForegroundColor Green
Write-Host ""
Write-Host "다음 단계:" -ForegroundColor Yellow
Write-Host "  1. 새 PowerShell 창을 열어주세요 (PATH 갱신)" -ForegroundColor White
Write-Host "  2. ai_server 폴더로 이동: cd ai_server" -ForegroundColor White
Write-Host "  3. AI 서버 실행: python main.py" -ForegroundColor White
Write-Host ""
Write-Host "  또는 start-ai-server.bat 파일을 실행하세요!" -ForegroundColor Cyan
Write-Host ""

pause

