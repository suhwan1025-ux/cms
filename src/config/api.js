// API 설정 - 모든 API 호출에서 사용할 기본 URL
// 개발 환경: REACT_APP_API_URL=http://localhost:3002 설정
// 프로덕션: 사용자가 접속한 주소(호스트:포트)를 자동으로 사용
const API_BASE_URL = process.env.REACT_APP_API_URL || 
  (typeof window !== 'undefined' ? window.location.origin : '');

export const getApiUrl = () => {
  return API_BASE_URL;
};

export default API_BASE_URL;

