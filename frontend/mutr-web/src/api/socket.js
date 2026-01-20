import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useEffect } from 'react';
import auth from '../utils/auth';

/**
 * 전역 구독 관리 맵 (Topic -> Handler)
 * 컴포넌트가 언마운트되지 않았음에도 소켓 연결이 재설정되는 경우(예: 로그인/로그아웃),
 * 기존 구독을 자동으로 복구하기 위해 핸들러 함수들을 보관합니다.
 */
const activeSubscriptions = new Map();

/**
 * STOMP 클라이언트 인스턴스 설정
 */
const socketClient = new Client({
    // SockJS를 통해 서버의 웹소켓 엔드포인트와 연결
    webSocketFactory: () => new SockJS('http://localhost:8080/ws-mutr'),
    
    /**
     * 연결 시 전달할 헤더 정보
     * 'get' 키워드를 사용하여 연결 시점에 최신 토큰 상태를 동적으로 읽어옵니다.
     */
    connectHeaders: {
        get Authorization() {
            const token = auth.getMemberToken();
            return token ? `Bearer ${token}` : null;
        },
        get 'X-Guest-Token'() {
            return auth.getGuestToken();
        }
    },

    /**
     * 연결 성공 시 실행되는 콜백
     * 소켓이 새로 연결될 때마다 activeSubscriptions 맵에 저장된 모든 토픽을 재구독합니다.
     */
    onConnect: () => {
        console.log('✅ STOMP Connected. Resubscribing all topics...');
        
        activeSubscriptions.forEach((handler, topic) => {
            socketClient.subscribe(topic, (msg) => handler(JSON.parse(msg.body)));
        });
    },

    // 연결이 끊겼을 때 재연결을 시도하기 전 대기 시간 (5초)
    reconnectDelay: 5000,
});

/**
 * useStompSubscription: 리액트 컴포넌트에서 특정 토픽을 안전하게 구독하기 위한 커스텀 훅
 * @param {string} topic - 구독할 주소 (예: '/topic/galaxy/public')
 * @param {function} onMessageReceived - 메시지 수신 시 실행할 콜백 함수
 */
export const useStompSubscription = (topic, onMessageReceived) => {
    useEffect(() => {
        // 1. 전역 구독 리스트에 현재 토픽과 핸들러를 등록
        activeSubscriptions.set(topic, onMessageReceived);

        let subscription = null;

        // 2. 이미 소켓이 연결된 상태라면 즉시 구독 수행
        if (socketClient.connected) {
            subscription = socketClient.subscribe(topic, (msg) => onMessageReceived(JSON.parse(msg.body)));
        }

        /**
         * 3. 컴포넌트 언마운트 시 클린업 로직
         * 전역 리스트에서 제거하고 실제 STOMP 구독을 해제합니다.
         */
        return () => {
            activeSubscriptions.delete(topic);
            if (subscription) subscription.unsubscribe();
        };
    }, [topic, onMessageReceived]);
};

/**
 * 클라이언트 활성화/비활성화 제어 함수 외부 노출
 */
export const activateSocket = () => socketClient.activate();
export const deactivateSocket = () => socketClient.deactivate();

export default socketClient;