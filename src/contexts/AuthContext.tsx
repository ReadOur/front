import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getUserId, setUserId, removeUserId, GUEST_USER_ID } from '@/utils/auth';

interface User {
  id: string;
  name: string;
  email?: string;
}

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // localStorage에서 userId 읽어오기 (페이지 새로고침 시에도 유지)
  useEffect(() => {
    const storedUserId = getUserId();
    if (storedUserId !== GUEST_USER_ID) {
      setUser({ id: storedUserId, name: 'user' });
    } else {
      // 테스트용: localStorage에 userId가 없으면 '1'로 설정
      setUserId('1');
      setUser({ id: '1', name: 'user' });
    }
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    setUserId(userData.id);
  };

  const logout = () => {
    setUser(null);
    removeUserId();
  };

  const isAuthenticated = user !== null && user.id !== GUEST_USER_ID;

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated }}>
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
