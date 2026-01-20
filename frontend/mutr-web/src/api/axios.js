import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터: 모든 요청 전에 실행되어 게스트 토큰을 헤더에 주입
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('mutr_guest_token');
  if (token) {
    config.headers['X-Guest-Token'] = token;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;