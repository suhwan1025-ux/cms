/**
 * 사용자 정보 관리 유틸리티
 * 
 * IP 기반 자동 사용자 인식
 */

import { getApiUrl } from '../config/api';

// 현재 로그인한 사용자 정보 가져오기
export const getCurrentUser = async () => {
  try {
    // 1. 캐시된 사용자 정보 확인 (세션 스토리지)
    const cachedUser = sessionStorage.getItem('currentUser');
    if (cachedUser) {
      try {
        const user = JSON.parse(cachedUser);
        // 캐시 유효성 확인 (5분)
        if (user.timestamp && Date.now() - user.timestamp < 5 * 60 * 1000) {
          return user.data;
        }
      } catch (error) {
        console.error('캐시된 사용자 정보 파싱 오류:', error);
      }
    }
    
    // 2. 서버에서 사용자 정보 조회 (IP 기반)
    const response = await fetch(`${getApiUrl()}/api/auth/me`);
    
    // IP 접근 제어로 차단된 경우 (403 Forbidden)
    if (response.status === 403) {
      const errorData = await response.json();
      alert(`❌ 접근 권한이 없습니다.\n\n${errorData.message || '허가되지 않은 IP 주소에서의 접근입니다.'}\n\n클라이언트 IP: ${errorData.clientIP || '알 수 없음'}\n\n시스템 관리자에게 문의하세요.`);
      throw new Error('IP 접근 제어: 접근 거부됨');
    }
    
    if (!response.ok) {
      throw new Error('사용자 정보 조회 실패');
    }
    
    const userInfo = await response.json();
    
    // 3. 세션 스토리지에 캐시
    sessionStorage.setItem('currentUser', JSON.stringify({
      data: userInfo,
      timestamp: Date.now()
    }));
    
    return userInfo;
  } catch (error) {
    console.error('사용자 정보 조회 실패:', error);
    
    // 폴백: 기본값 반환
    // 개발환경에서는 '사용자1'로 설정 (작성중인 품의서 조회를 위해)
    const isDevelopment = process.env.NODE_ENV === 'development' || 
                          window.location.hostname === 'localhost' || 
                          window.location.hostname === '127.0.0.1';
    
    return {
      id: 'admin',
      name: isDevelopment ? '사용자1' : '작성자',
      department: 'IT팀',
      position: '과장',
      email: 'admin@company.com'
    };
  }
};

// 사용자 이름만 가져오기
export const getCurrentUserName = async () => {
  const user = await getCurrentUser();
  return user.name || '작성자';
};

// 사용자 부서 가져오기
export const getCurrentUserDepartment = async () => {
  const user = await getCurrentUser();
  return user.department || '미지정';
};

// 사용자 정보 캐시 삭제 (새로고침용)
export const clearUserCache = () => {
  sessionStorage.removeItem('currentUser');
  console.log('사용자 정보 캐시 삭제됨');
};

// 사용자 정보 강제 새로고침
export const refreshCurrentUser = async () => {
  clearUserCache();
  return await getCurrentUser();
};

// 사용자 인증 여부 확인
export const isAuthenticated = async () => {
  try {
    const user = await getCurrentUser();
    return user && user.id;
  } catch (error) {
    return false;
  }
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

