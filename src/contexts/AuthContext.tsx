import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  getUserId,
  setUserId,
  removeUserId,
  GUEST_USER_ID,
  getAccessToken,
  setAccessToken,
  removeAccessToken,
  extractUserIdFromToken,
  extractEmailFromToken,
} from '@/utils/auth';

interface User {
  id: string;
  name: string;
  email?: string;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  login: (token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setToken] = useState<string | null>(null);

  // localStorage에서 토큰 읽어오기 (페이지 새로고침 시에도 유지)
  useEffect(() => {
    const storedToken = getAccessToken();
    if (storedToken) {
      // 토큰에서 사용자 정보 추출
      const userId = extractUserIdFromToken(storedToken);
      const email = extractEmailFromToken(storedToken);

      if (userId) {
        setUser({
          id: userId,
          name: email?.split('@')[0] || 'user',
          email: email || undefined,
        });
        setToken(storedToken);
        setUserId(userId); // 기존 시스템과의 호환성을 위해 userId도 저장
      }
    } else {
      // 게스트 사용자로 설정
      setUserId(GUEST_USER_ID);
    }
  }, []);

  const login = (token: string) => {
    // 토큰 저장
    setAccessToken(token);
    setToken(token);

    // 토큰에서 사용자 정보 추출
    const userId = extractUserIdFromToken(token);
    const email = extractEmailFromToken(token);

    if (userId) {
      const userData: User = {
        id: userId,
        name: email?.split('@')[0] || 'user',
        email: email || undefined,
      };
      setUser(userData);
      setUserId(userId); // 기존 시스템과의 호환성을 위해 userId도 저장
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    removeAccessToken();
    removeUserId();
  };

  const isAuthenticated = user !== null && user.id !== GUEST_USER_ID && accessToken !== null;

  return (
    <AuthContext.Provider value={{ user, accessToken, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
