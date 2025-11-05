# 사용자 인증 시스템 연동 가이드

## 현재 상태

현재 시스템은 하드코딩된 기본 사용자 정보를 사용합니다.
- 파일: `src/utils/userHelper.js`
- 기본 사용자: `{ id: 'admin', name: '작성자', department: 'IT팀', position: '과장', email: 'admin@company.com' }`

## 연동이 필요한 곳

### 1. 품의서 작성/수정 (ProposalForm.js)
- 작성자(createdBy) 정보
- 수정자 정보

### 2. 품의서 상태 변경 (ContractList.js)
- 상태 변경자(changedBy) 정보

### 3. 기타 작업자 정보가 필요한 곳
- 결재 처리
- 히스토리 기록
- 업무 보고서 생성

## 향후 연동 방법

### 방법 1: JWT 토큰 기반 인증

```javascript
// src/utils/userHelper.js 수정

export const getCurrentUser = async () => {
  const token = localStorage.getItem('authToken');
  
  if (!token) {
    return null; // 로그인 필요
  }
  
  try {
    const response = await fetch('/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('사용자 정보 조회 실패:', error);
  }
  
  return null;
};

// 로그인 함수
export const login = async (username, password) => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  
  if (response.ok) {
    const { token, user } = await response.json();
    localStorage.setItem('authToken', token);
    localStorage.setItem('currentUser', JSON.stringify(user));
    return user;
  }
  
  throw new Error('로그인 실패');
};
```

### 방법 2: Active Directory (AD) 연동

```javascript
// src/utils/userHelper.js 수정

export const getCurrentUser = async () => {
  try {
    // Windows 통합 인증 사용
    const response = await fetch('/api/auth/ad-user', {
      credentials: 'include' // 쿠키 포함
    });
    
    if (response.ok) {
      const adUser = await response.json();
      return {
        id: adUser.samAccountName,
        name: adUser.displayName,
        department: adUser.department,
        position: adUser.title,
        email: adUser.mail
      };
    }
  } catch (error) {
    console.error('AD 사용자 정보 조회 실패:', error);
  }
  
  return null;
};
```

### 방법 3: SSO (Single Sign-On) 연동

```javascript
// src/utils/userHelper.js 수정

export const getCurrentUser = () => {
  // SSO 프로바이더에서 사용자 정보 가져오기
  if (window.SSOProvider && window.SSOProvider.isAuthenticated()) {
    const ssoUser = window.SSOProvider.getCurrentUser();
    return {
      id: ssoUser.userId,
      name: ssoUser.name,
      department: ssoUser.department,
      position: ssoUser.position,
      email: ssoUser.email
    };
  }
  
  // 로그인 필요
  window.location.href = '/sso/login';
  return null;
};
```

### 방법 4: 세션 기반 인증

```javascript
// src/utils/userHelper.js 수정

export const getCurrentUser = async () => {
  try {
    // 서버 세션에서 사용자 정보 가져오기
    const response = await fetch('/api/auth/session', {
      credentials: 'include' // 쿠키 포함
    });
    
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('세션 조회 실패:', error);
  }
  
  return null;
};
```

## 백엔드 API 예시 (Node.js/Express)

### JWT 인증 엔드포인트

```javascript
// server.js 또는 routes/auth.js

// 로그인
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  
  // 사용자 인증 (DB 또는 LDAP)
  const user = await authenticateUser(username, password);
  
  if (user) {
    const token = jwt.sign(
      { id: user.id, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );
    
    res.json({ token, user });
  } else {
    res.status(401).json({ error: '인증 실패' });
  }
});

// 현재 사용자 정보
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  const user = await getUserById(req.user.id);
  res.json(user);
});

// JWT 검증 미들웨어
function authenticateToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: '토큰 없음' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: '유효하지 않은 토큰' });
    }
    req.user = user;
    next();
  });
}
```

## 개발 중 임시 사용자 설정

개발 중에는 브라우저 콘솔에서 임시 사용자를 설정할 수 있습니다:

```javascript
// 브라우저 콘솔에서 실행
import { setCurrentUser } from './utils/userHelper';

setCurrentUser({
  id: 'test_user',
  name: '테스트사용자',
  department: '개발팀',
  position: '대리',
  email: 'test@company.com'
});

// 페이지 새로고침
location.reload();
```

또는 로컬스토리지에 직접 설정:

```javascript
localStorage.setItem('currentUser', JSON.stringify({
  id: 'test_user',
  name: '김철수',
  department: '영업팀',
  position: '과장',
  email: 'kim@company.com'
}));

// 페이지 새로고침
location.reload();
```

## 체크리스트

인증 시스템 연동 시 확인해야 할 사항:

- [ ] 로그인/로그아웃 기능 구현
- [ ] 토큰/세션 만료 처리
- [ ] 권한 관리 (역할 기반 접근 제어)
- [ ] 로그인 페이지로 리다이렉트
- [ ] 사용자 정보 캐싱 전략
- [ ] 보안 (HTTPS, XSS, CSRF 방어)
- [ ] 에러 처리 및 사용자 피드백
- [ ] 로깅 및 감사 추적

## 참고 문서

- [JWT 인증](https://jwt.io/)
- [Active Directory 연동](https://docs.microsoft.com/en-us/windows-server/identity/ad-ds/)
- [OAuth 2.0](https://oauth.net/2/)
- [SAML SSO](https://en.wikipedia.org/wiki/Security_Assertion_Markup_Language)

