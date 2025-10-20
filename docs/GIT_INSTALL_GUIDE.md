# 🔧 Git 설치 가이드 (Windows)

## 📥 1단계: Git 다운로드

방금 브라우저가 열렸습니다! (https://git-scm.com/download/win)

**또는 직접 다운로드:**
- 64-bit: https://github.com/git-for-windows/git/releases/download/v2.43.0.windows.1/Git-2.43.0-64-bit.exe

페이지에서 **"Click here to download"** 버튼 클릭

## 🔨 2단계: Git 설치

다운로드한 `Git-xxx-64-bit.exe` 파일 실행:

### 설치 옵션 (기본값 사용 권장):

1. **라이센스 동의** → Next

2. **설치 위치** → 기본값 유지 → Next

3. **구성 요소 선택** (기본값 권장):
   - ✅ Windows Explorer integration
   - ✅ Git Bash Here
   - ✅ Git GUI Here
   - ✅ Associate .git* configuration files
   - ✅ Associate .sh files
   → Next

4. **시작 메뉴 폴더** → 기본값 유지 → Next

5. **기본 에디터 선택** → "Use Visual Studio Code as Git's default editor" (또는 원하는 에디터) → Next

6. **PATH 환경 변수** → **"Git from the command line and also from 3rd-party software"** 선택 (중요!) → Next

7. **SSH 실행 파일** → "Use bundled OpenSSH" → Next

8. **HTTPS 전송 백엔드** → "Use the OpenSSL library" → Next

9. **줄 끝 변환** → "Checkout Windows-style, commit Unix-style line endings" → Next

10. **터미널 에뮬레이터** → "Use MinTTY" → Next

11. **git pull 기본 동작** → "Default (fast-forward or merge)" → Next

12. **자격 증명 도우미** → "Git Credential Manager" → Next

13. **추가 옵션** → 기본값 유지 → Next

14. **실험적 옵션** → 체크 해제 → Install

## ✅ 3단계: 설치 확인

설치가 완료되면 **PowerShell을 새로 열어야 합니다!**

1. **현재 PowerShell 창 닫기**

2. **새 PowerShell 창 열기**:
   - Windows 키 누르기
   - "PowerShell" 입력
   - Windows PowerShell 실행

3. **Git 설치 확인**:
```powershell
git --version
```

다음과 같이 표시되면 성공:
```
git version 2.43.0.windows.1
```

## 🎯 4단계: Git 초기 설정

```powershell
# 사용자 이름 설정 (GitHub 계정명 또는 본인 이름)
git config --global user.name "홍길동"

# 이메일 설정 (GitHub 계정 이메일)
git config --global user.email "your.email@example.com"

# 설정 확인
git config --list
```

## 🚀 5단계: 프로젝트로 돌아가기

```powershell
# 프로젝트 폴더로 이동
cd C:\Users\9331\frontend2\contract-management-system

# Git 저장소 초기화
git init

# 현재 상태 확인
git status
```

## 🔍 설치 후 확인 사항

### Git이 제대로 설치되었는지 확인:
```powershell
# Git 버전 확인
git --version

# Git 설정 확인
git config --global --list

# Git Bash 실행 가능 확인 (선택사항)
# 파일 탐색기에서 폴더에서 우클릭 → "Git Bash Here" 옵션이 보이는지 확인
```

## ⚠️ 문제 해결

### "git: command not found" 또는 인식되지 않는 경우:

**해결 방법 1: PowerShell 재시작**
- 현재 PowerShell 완전히 종료
- 새로운 PowerShell 창 열기

**해결 방법 2: PATH 환경 변수 수동 확인**
```powershell
$env:Path
```
- `C:\Program Files\Git\cmd` 경로가 포함되어 있는지 확인

**해결 방법 3: 시스템 재부팅**
- 환경 변수가 제대로 적용되지 않은 경우

## 📋 다음 단계

Git 설치가 완료되면:

1. **GitHub 계정 만들기** (없는 경우)
   - https://github.com 접속
   - Sign up 클릭
   - 이메일, 비밀번호 입력하여 가입

2. **프로젝트를 GitHub에 올리기**
   - `GITHUB_SETUP_GUIDE.md` 파일 참조
   - Git 초기화 및 커밋 생성
   - GitHub 레포지토리 생성 및 푸시

3. **새 환경에서 클론**
   - `git clone` 명령어로 프로젝트 다운로드

---

## 💡 유용한 팁

### Git Bash vs PowerShell
- **Git Bash**: Linux 스타일 명령어 사용 가능
- **PowerShell**: Windows 네이티브 터미널
- 둘 다 Git 명령어 사용 가능!

### Visual Studio Code와 함께 사용
- VS Code에 내장된 Git 기능 활용
- Source Control 탭에서 시각적으로 관리 가능

---

**설치 중 문제가 있으면 언제든지 알려주세요!** 🚀 