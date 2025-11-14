import axios from 'axios';
import { Client } from '@stomp/stompjs';
import auth from '../utils/auth'

/**
 * api: 애플리케이션 전역에서 사용할 Axios 인스턴스 설정
 * 모든 API 요청의 기본 URL과 공통 헤더를 정의합니다.
 */
const api = axios.create({
  baseURL: 'http://localhost:8080', // 백엔드 서버 주소
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * 요청 인터셉터 (Request Interceptor)
 * 서버로 요청이 발송되기 직전에 실행되며, 현재 브라우저에 저장된 인증 토큰을 헤더에 삽입합니다.
 */
api.interceptors.request.use((config) => {
    // auth 유틸리티를 통해 최신 토큰 상태를 읽어옴
    const memberToken = auth.getMemberToken();
    const guestToken = auth.getGuestToken();
  
    /**
     * 인증 우선순위 적용 로직
     */
    if (memberToken) {
      // 1순위: 회원 로그인 상태일 경우 JWT를 Authorization 헤더에 Bearer 스킴으로 부착
      config.headers['Authorization'] = `Bearer ${memberToken}`;
    } else if (guestToken) {
      // 2순위: 비회원(게스트) 상태일 경우 사용자 정의 헤더(X-Guest-Token)에 게스트 토큰 부착
      config.headers['X-Guest-Token'] = guestToken;
    }
    
    // 수정된 설정(헤더가 추가된 상태)으로 요청 진행
    return config;
  });

export default api;