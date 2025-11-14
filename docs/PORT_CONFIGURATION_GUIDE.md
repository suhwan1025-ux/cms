# 포트 설정 가이드

## 📋 개요

계약관리시스템은 환경변수를 통해 포트를 유연하게 변경할 수 있습니다.

---

## 🔧 포트 변경 방법

### 1. .env 파일 수정

```bash
# .env 파일에서 PORT 변경
PORT=3002  # 원하는 포트로 변경 (예: 8080, 80, 3000 등)
```

### 2. 서버 재시작

```bash
# 서버 재시작
node server.js
```

### 3. 사용자 접속

```
http://서버IP:변경한포트
```

---

## 🎯 작동 원리

### 백엔드 (server.js)
```javascript
const PORT = process.env.PORT || 3002;
```
- `.env` 파일의 `PORT` 값 사용
- 없으면 기본값 3002 사용

### 프론트엔드 (src/config/api.js)
```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 
  (typeof window !== 'undefined' ? window.location.origin : '');
```
- 개발 환경: `REACT_APP_API_URL` 사용
- 프로덕션: 사용자가 접속한 URL의 호스트와 포트를 자동 감지

---

## 💡 예시

### 예시 1: 포트 8080 사용
```bash
# .env 파일
PORT=8080
```
- 서버 시작: `http://서버IP:8080`
- 사용자 접속: `http://서버IP:8080`
- API 호출: 자동으로 `http://서버IP:8080/api/...`

### 예시 2: 포트 80 사용 (기본 HTTP 포트)
```bash
# .env 파일
PORT=80
```
- 서버 시작: `http://서버IP:80`
- 사용자 접속: `http://서버IP` (포트 생략 가능)
- API 호출: 자동으로 `http://서버IP/api/...`

---

## ⚠️ 주의사항

### 1. 포트 사용 가능 여부 확인
```bash
# Windows에서 포트 사용 확인
netstat -ano | findstr :포트번호
```

### 2. 방화벽 설정
- 새로운 포트를 사용하면 방화벽에서 해당 포트 열기 필요

### 3. 80 포트 사용 시
- Windows: 관리자 권한 필요
- 다른 웹 서버(IIS, Apache 등)와 충돌 가능

### 4. 빌드 후 배포
- 포트 변경 후 **빌드 불필요**
- `.env` 파일만 수정하고 서버 재시작

---

## 🔥 방화벽 설정 예시

### Windows 방화벽
```powershell
# 포트 8080 열기
New-NetFirewallRule -DisplayName "CMS Port 8080" -Direction Inbound -Protocol TCP -LocalPort 8080 -Action Allow
```

### 리눅스 방화벽 (firewalld)
```bash
# 포트 8080 열기
firewall-cmd --permanent --add-port=8080/tcp
firewall-cmd --reload
```

---

## 📞 문의

포트 설정 관련 문제 발생 시 IT 부서로 문의하세요.

