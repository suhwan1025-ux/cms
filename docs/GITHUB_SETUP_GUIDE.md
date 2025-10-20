# 📦 GitHub를 사용한 프로젝트 이관 가이드

## 🎯 목표
계약관리시스템을 GitHub를 통해 안전하게 백업하고 새로운 환경으로 이관합니다.

## 📋 사전 준비

### 1. Git 설치 확인
```bash
git --version
```
- 설치되지 않았다면: https://git-scm.com/download/win 에서 다운로드

### 2. GitHub 계정 준비
- GitHub 계정이 없다면: https://github.com 에서 회원가입
- 로그인 후 새 레포지토리 생성 준비

## 🚀 현재 PC에서 해야 할 작업

### 1단계: Git 초기화 및 설정

```bash
# contract-management-system 폴더로 이동
cd contract-management-system

# Git 초기화
git init

# 사용자 정보 설정 (한 번만 필요)
git config --global user.name "당신의이름"
git config --global user.email "당신의이메일@example.com"
```

### 2단계: 민감한 정보 확인

**.env 파일이 제외되었는지 확인:**
```bash
# .gitignore 파일이 제대로 설정되어 있는지 확인
cat .gitignore
```

**중요:** `.env` 파일에 있는 데이터베이스 비밀번호 등은 GitHub에 올라가지 않습니다!

### 3단계: 초기 커밋 생성

```bash
# 모든 파일 추가 (.gitignore에 명시된 파일 제외)
git add .

# 초기 커밋 생성
git commit -m "Initial commit: 계약관리시스템 v1.0"
```

### 4단계: GitHub 레포지토리 생성

1. **GitHub 웹사이트 접속**: https://github.com
2. **새 레포지토리 생성**:
   - 우측 상단 `+` 버튼 클릭 → `New repository`
   - Repository name: `contract-management-system`
   - Description: `계약 및 품의서 관리 시스템`
   - Visibility: **Private** (중요! 회사 내부 시스템이므로)
   - **Create repository** 클릭

### 5단계: 원격 저장소 연결 및 푸시

GitHub에서 생성된 레포지토리 페이지에 나오는 명령어 실행:

```bash
# 원격 저장소 연결 (GitHub에서 제공하는 URL 사용)
git remote add origin https://github.com/당신의계정/contract-management-system.git

# 기본 브랜치 이름 설정
git branch -M main

# GitHub에 업로드
git push -u origin main
```

**인증이 필요한 경우:**
- GitHub 아이디와 비밀번호 입력
- 또는 Personal Access Token 사용 (권장)

## 🔄 새로운 PC에서 해야 할 작업

### 1단계: 프로젝트 다운로드

```bash
# 원하는 위치로 이동
cd C:\Users\YourName\Projects

# GitHub에서 클론
git clone https://github.com/당신의계정/contract-management-system.git

# 프로젝트 폴더로 이동
cd contract-management-system
```

### 2단계: 환경 설정

```bash
# 의존성 설치
npm install

# .env 파일 생성
copy .env.example .env
```

**.env 파일 편집하여 새 환경의 데이터베이스 정보 입력:**
```env
DB_NAME=contract_management
DB_USERNAME=postgres
DB_PASSWORD=새환경의비밀번호
DB_HOST=localhost
DB_PORT=5432
```

### 3단계: 데이터베이스 설정

```bash
# 데이터베이스 생성 (PostgreSQL에서)
# psql -U postgres
# CREATE DATABASE contract_management;

# 테이블 생성 및 기본 데이터 세팅
node quick-migrate.js
```

### 4단계: 서버 실행 테스트

```bash
# 백엔드 서버 실행
node server.js

# 새 터미널에서 프론트엔드 실행
npm start
```

## 📊 데이터 이관 (기존 데이터 유지하는 경우)

GitHub는 **코드만** 관리하고, **데이터는 별도로 이관**해야 합니다.

### 방법 1: JSON 파일 사용 (권장)

**현재 PC에서:**
```bash
# 데이터 내보내기
node export-current-data.js
```

생성된 `data-export-*.json` 파일을:
- 이메일, USB, 클라우드 등으로 새 PC로 전송

**새 PC에서:**
```bash
# 데이터 가져오기 스크립트 실행 (추후 생성 예정)
node import-data.js data-export-2025-09-30-xxx.json
```

### 방법 2: PostgreSQL 백업 사용

**현재 PC에서:**
```bash
# PostgreSQL 백업
pg_dump -U postgres -h localhost -d contract_management > backup.sql
```

**새 PC에서:**
```bash
# 데이터베이스 복원
psql -U postgres -h localhost -d contract_management < backup.sql
```

## 🔐 보안 주의사항

### ✅ GitHub에 올라가는 것:
- 소스 코드
- 설정 예시 파일 (.env.example)
- 문서 파일
- 패키지 정보 (package.json)

### ❌ GitHub에 올라가지 않는 것 (.gitignore에 설정됨):
- .env 파일 (데이터베이스 비밀번호 등)
- node_modules (의존성 파일들)
- 업로드된 파일들
- 데이터베이스 백업 파일들
- 로그 파일들

## 📝 일상적인 작업 흐름

### 코드 변경 후 GitHub에 올리기:

```bash
# 변경사항 확인
git status

# 변경된 파일 추가
git add .

# 커밋 (변경 내용 설명)
git commit -m "기능 추가: 결재라인 자동 설정"

# GitHub에 업로드
git push
```

### 다른 PC에서 최신 코드 받기:

```bash
# 최신 코드 가져오기
git pull
```

## 🆘 문제 해결

### "Permission denied" 오류:
→ GitHub Personal Access Token 사용
   1. GitHub 설정 → Developer settings → Personal access tokens
   2. 새 토큰 생성 (repo 권한 선택)
   3. 비밀번호 대신 토큰 사용

### "Already exists" 오류:
→ 기존 .git 폴더 삭제 후 다시 시도
```bash
rm -rf .git
git init
```

### 민감한 정보를 실수로 올렸다면:
→ 즉시 레포지토리를 Private으로 변경하고, 비밀번호 변경

## 📚 추가 참고자료

- Git 기본 사용법: https://git-scm.com/book/ko/v2
- GitHub 가이드: https://docs.github.com/ko
- Git 명령어 치트시트: https://training.github.com/downloads/ko/github-git-cheat-sheet/

---

**💡 팁:** 정기적으로 GitHub에 푸시하여 변경사항을 백업하세요! 