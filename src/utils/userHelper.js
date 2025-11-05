/**
 * 사용자 정보 관리 유틸리티
 * 
 * 현재: 기본값 반환
 * 향후: 로그인 시스템, Active Directory, SSO 등과 연동 예정
 */

// 현재 로그인한 사용자 정보 가져오기
export const getCurrentUser = () => {
  // TODO: 나중에 실제 인증 시스템과 연동
  // 예시:
  // - localStorage에서 토큰 확인
  // - API로 사용자 정보 조회
  // - Active Directory 연동
  // - SSO (Single Sign-On) 연동
  
  // 임시: 로컬스토리지에서 사용자 정보 확인 (향후 구현 대비)
  const storedUser = localStorage.getItem('currentUser');
  if (storedUser) {
    try {
      return JSON.parse(storedUser);
    } catch (error) {
      console.error('사용자 정보 파싱 오류:', error);
    }
  }
  
  // 기본값 (인증 시스템 연동 전)
  return {
    id: 'admin',
    name: '작성자',
    department: 'IT팀',
    position: '과장',
    email: 'admin@company.com'
  };
};

// 사용자 이름만 가져오기
export const getCurrentUserName = () => {
  const user = getCurrentUser();
  return user.name || '작성자';
};

// 사용자 부서 가져오기
export const getCurrentUserDepartment = () => {
  const user = getCurrentUser();
  return user.department || '미지정';
};

// 사용자 정보 설정 (임시 - 개발용)
export const setCurrentUser = (userInfo) => {
  try {
    localStorage.setItem('currentUser', JSON.stringify(userInfo));
    console.log('사용자 정보 설정됨:', userInfo);
  } catch (error) {
    console.error('사용자 정보 저장 오류:', error);
  }
};

// 사용자 로그아웃 (임시 - 개발용)
export const clearCurrentUser = () => {
  localStorage.removeItem('currentUser');
  console.log('사용자 정보 삭제됨');
};

// 사용자 인증 여부 확인
export const isAuthenticated = () => {
  // TODO: 실제 인증 토큰 확인 로직 추가
  const user = getCurrentUser();
  return user && user.id;
};

/**
 * 향후 연동 예시:
 * 
 * // Active Directory 연동
 * export const getCurrentUser = async () => {
 *   const response = await fetch('/api/auth/me', {
 *     headers: {
 *       'Authorization': `Bearer ${getAuthToken()}`
 *     }
 *   });
 *   return await response.json();
 * };
 * 
 * // JWT 토큰 기반 인증
 * export const getAuthToken = () => {
 *   return localStorage.getItem('authToken');
 * };
 * 
 * // SSO 연동
 * export const getCurrentUser = () => {
 *   return window.SSOProvider?.getCurrentUser() || defaultUser;
 * };
 */

