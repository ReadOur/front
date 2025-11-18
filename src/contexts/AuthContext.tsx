import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  getAccessToken,
  setAccessToken,
  removeAccessToken,
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
      setToken(storedToken);
      setUser({
        id: storedToken,
        name: 'user',
      });
    }
  }, []);

  const login = (token: string) => {
    // 토큰 저장
    setAccessToken(token);
    setToken(token);

    // accessToken을 사용자 ID로 사용
    const userData: User = {
      id: token,
      name: 'user',
    };
    setUser(userData);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    removeAccessToken();
  };

  const isAuthenticated = accessToken !== null;

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
