/**
 * 로컬 스토리지에서 사용할 키 값 상수 정의
 * 오타를 방지하고 유지보수를 용이하게 하기 위해 상수로 관리합니다.
 */
const GUEST_TOKEN_KEY = 'mutr_guest_token';
const GUEST_NICKNAME_KEY = 'mutr_guest_nickname';
const MEMBER_TOKEN_KEY = 'mutr_access_token';

/**
 * auth: 인증 관련 로컬 스토리지 조작을 담당하는 유틸리티 객체
 */
export const auth = {
  
  // --- 게스트(비회원) 관련 메서드 ---

  /**
   * 저장된 게스트 토큰 반환
   */
  getGuestToken: () => localStorage.getItem(GUEST_TOKEN_KEY),

  /**
   * 저장된 게스트 닉네임 반환
   */
  getGuestNickname: () => localStorage.getItem(GUEST_NICKNAME_KEY),
  
  // --- 회원 관련 메서드 ---

  /**
   * 저장된 회원용 액세스 토큰(JWT) 반환
   */
  getMemberToken: () => localStorage.getItem(MEMBER_TOKEN_KEY),

  /**
   * 로그인 성공 시 전달받은 회원 토큰을 로컬 스토리지에 저장
   */
  setMemberToken: (token) => localStorage.setItem(MEMBER_TOKEN_KEY, token),
  
  // --- 공통 상태 관리 및 삭제 메서드 ---

  /**
   * 게스트 식별 정보(토큰 및 닉네임)를 한 번에 저장
   */
  setGuestIdentity: (token, nickname) => {
    localStorage.setItem(GUEST_TOKEN_KEY, token);
    localStorage.setItem(GUEST_NICKNAME_KEY, nickname);
  },

  /**
   * 회원 로그아웃: 저장된 회원 토큰만 삭제하여 세션을 종료
   * (게스트 정보는 유지하여 로그아웃 후에도 익명 활동을 지속할 수 있게 함)
   */
  logout: () => {
    localStorage.removeItem(MEMBER_TOKEN_KEY);
  }
};

export default auth;