// API 설정 - 모든 API 호출에서 사용할 기본 URL
// 배포 PC IP: 172.22.32.200
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://172.22.32.200:3002';

export const getApiUrl = () => {
  return API_BASE_URL;
};

export default API_BASE_URL;

