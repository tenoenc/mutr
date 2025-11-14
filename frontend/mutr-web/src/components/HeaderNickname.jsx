import React from 'react';
import { useAuth } from '../context/AuthContext';
import './HeaderNickname.css';

/**
 * 상단 중앙 사용자 상태 및 인증 제어 컴포넌트
 */
const HeaderNickname = () => {
  const { user, loading, logout } = useAuth();

  // 초기 로딩 중이거나 유저 정보가 없으면 렌더링 제외
  if (loading || !user) return null;

  /**
   * 백엔드 OAuth2 엔드포인트로 리다이렉트 처리
   * @param {string} provider - 소셜 서비스 이름 (google, kakao 등)
   */
  const handleLogin = (provider) => {
    // window.location.href = `http://localhost:8080/oauth2/authorization/${provider}`;
    window.location.href = `/oauth2/authorization/${provider}`;
  };

  return (
    <div className="status-container" onDragStart={(e) => e.preventDefault()}>
      
      {/* 닉네임 정보 영역 (IDENTITY) */}
      <div className="nickname-bar">
        <div className="status-node-indicator" />
        <div className="status-content">
          <span className="label">IDENTITY</span>
          <span className="nickname">{user.nickname}</span>
        </div>
      </div>

      {/* 인증 제어 영역: 비회원 시 로그인 아이콘, 회원 시 로그아웃 표시 */}
      {!user.isMember ? (
        <div className="auth-icons">
          {/* 구글 로그인 버튼 */}
          <button className="icon-circle" onClick={() => handleLogin('google')} title="Google Login">
            <svg viewBox="0 0 24 24" className="svg-icon">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="white" opacity="0.9"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="white" opacity="0.4"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="white" opacity="0.4"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="white" opacity="0.4"/>
            </svg>
          </button>
          
          {/* 카카오 로그인 버튼 */}
          <button className="icon-circle" onClick={() => handleLogin('kakao')} title="Kakao Login">
            <div className="kakao-symbol-minimal" />
          </button>
        </div>
      ) : (
        /* 로그아웃 버튼 (회원 전용) */
        <button className="icon-circle" onClick={logout} title="Sign Out">
          <div className="logout-dot" />
        </button>
      )}
    </div>
  );
};

export default HeaderNickname;