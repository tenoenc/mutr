import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { auth } from '../utils/auth'; 
import api from '../api/axios';
import { activateSocket, deactivateSocket } from '../api/socket.js'

// 애플리케이션 전역에서 인증 상태를 공유하기 위한 Context 생성
const AuthContext = createContext();

/**
 * AuthProvider: 사용자 인증 상태를 관리하고 하위 컴포넌트에 공급하는 래퍼 컴포넌트
 */
export const AuthProvider = ({ children }) => {
    // 1. 초기 사용자 상태 설정: 로컬 스토리지에 저장된 게스트 정보를 우선 확인
    const [user, setUser] = useState(() => {
        const token = auth.getGuestToken();
        const nickname = auth.getGuestNickname();
        if (token && nickname) return { nickname, isMember: false };
        return null;
    });

    // 2. 인증 로딩 상태: 초기 유저 정보 유무에 따라 시작 값 결정
    const [loading, setLoading] = useState(!user);

    /**
     * setupGuest: 익명 사용자(게스트) 정체성을 설정하거나 발급받는 함수
     */
    const setupGuest = useCallback(async () => {
        // 로컬 스토리지에 기존 게스트 토큰과 닉네임이 있는지 확인
        const existingToken = auth.getGuestToken();
        const existingNickname = auth.getGuestNickname();
    
        // 기존 정보가 있다면 서버 요청 없이 즉시 상태 업데이트 (계정 유지)
        if (existingToken && existingNickname) {
            setUser({ nickname: existingNickname, isMember: false });
            setLoading(false);
            return;
        }
    
        // 기존 정보가 없는 경우 서버에 새로운 게스트 아이디 발급 요청
        try {
            const res = await api.post('/v1/auth/guest');
            const { guestToken, nickname } = res.data.data;
            
            // 발급받은 정보를 로컬 스토리지에 저장 및 상태 반영
            auth.setGuestIdentity(guestToken, nickname);
            setUser({ nickname, isMember: false });
        } catch (err) {
            console.error("게스트 발급 실패", err);
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * getCookie: 브라우저 쿠키에서 특정 이름의 값을 추출하는 유틸리티 함수
     */
    const getCookie = (name) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
    };

    /**
     * initAuth: 앱 초기 구동 시 사용자의 인증 상태를 결정하는 핵심 로직
     */
    const initAuth = useCallback(async () => {
        setLoading(true);
    
        // 1. 소셜 로그인(OAuth) 결과로 내려온 쿠키 토큰 확인
        const tokenFromCookie = getCookie('accessToken');
        
        if (tokenFromCookie) {
            // 쿠키에 토큰이 있다면 로컬 스토리지로 옮기고 쿠키는 즉시 삭제 (보안 및 청소)
            auth.setMemberToken(tokenFromCookie);
            document.cookie = "accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        }
    
        // 2. 현재 저장된 회원 토큰 유무 확인
        const currentMemberToken = auth.getMemberToken();
    
        if (currentMemberToken) {
            try {
                // 토큰이 있다면 서버에 내 정보 조회를 요청하여 유효성 검증
                const res = await api.get('/v1/users/me'); 
                setUser({ ...res.data.data, isMember: true });
            } catch (err) {
                // 토큰이 만료되었거나 유효하지 않은 경우 로그아웃 처리 후 게스트로 전환
                auth.logout();
                await setupGuest();
            }
        } else {
            // 회원 토큰이 없는 초기 상태라면 게스트 로직 실행
            await setupGuest();
        }
        
        setLoading(false);
    }, [setupGuest]);

    // 앱 마운트 시 최초 1회 인증 초기화 실행
    useEffect(() => {
        initAuth();
    }, [initAuth]);

    /**
     * handleLogout: 회원 로그아웃 처리 및 게스트 모드로 즉시 복구
     */
    const handleLogout = () => {
        auth.logout(); // 회원 토큰 삭제
        setupGuest();  // 기존 게스트 정체성 복구 또는 신규 발급
    };

    /**
     * 웹소켓 동기화: 유저의 인증 상태(회원/비회원)가 변경될 때마다 소켓 연결을 재설정
     */
    useEffect(() => {
        // 유저 정보가 존재하면 웹소켓 활성화 (연결 시점의 토큰 헤더 반영)
        if (user) {
          activateSocket();
        }
    
        // 컴포넌트 언마운트 시 또는 유저 변경 직전 기존 소켓 종료 (리소스 정리)
        return () => deactivateSocket();
      }, [user?.isMember]);

    return (
        <AuthContext.Provider value={{ user, loading, logout: handleLogout }}>
            {children}
        </AuthContext.Provider>
    );
};

/**
 * useAuth: 컴포넌트에서 인증 상태와 기능을 쉽게 가져다 쓰기 위한 커스텀 훅
 */
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);