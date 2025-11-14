// API 설정 - 모든 API 호출에서 사용할 기본 URL
// 개발 환경: REACT_APP_API_URL=http://localhost:3002 설정
// 프로덕션: 사용자가 접속한 주소(호스트:포트)를 자동으로 사용
const API_BASE_URL = process.env.REACT_APP_API_URL || 
  (typeof window !== 'undefined' ? window.location.origin : '');

export const getApiUrl = () => {
  return API_BASE_URL;
};

/**
 * API 호출 시 공통 에러 처리
 * @param {Response} response - Fetch API 응답 객체
 * @returns {Promise<Response>} - 처리된 응답 객체
 */
export const handleApiError = async (response) => {
  // IP 접근 제어로 차단된 경우 (403 Forbidden)
  if (response.status === 403) {
    try {
      const errorData = await response.json();
      if (errorData.error === '접근 권한이 없습니다.') {
        alert(`❌ 접근 권한이 없습니다.\n\n${errorData.message}\n\n클라이언트 IP: ${errorData.clientIP}\n\n시스템 관리자에게 문의하세요.`);
      }
    } catch (e) {
      alert('❌ 접근 권한이 없습니다.\n\n시스템 관리자에게 문의하세요.');
    }
  }
  return response;
};

export default API_BASE_URL;

