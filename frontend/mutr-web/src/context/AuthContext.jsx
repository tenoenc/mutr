import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initGuest = async () => {
      let token = localStorage.getItem('mutr_guest_token');
      let nickname = localStorage.getItem('mutr_guest_nickname');

      if (!token) {
        try {
          const response = await api.post('/api/v1/auth/guest');
          const { guestToken, nickname: newNickname } = response.data.data;
          
          localStorage.setItem('mutr_guest_token', guestToken);
          localStorage.setItem('mutr_guest_nickname', newNickname);
          setUser({ nickname: newNickname });
        } catch (error) {
          console.error('게스트 발급 실패', error);
        }
      } else {
        setUser({ nickname });
      }
      setLoading(false);
    };

    initGuest();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);