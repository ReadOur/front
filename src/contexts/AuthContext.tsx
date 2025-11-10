import React, { createContext, useContext, useState, ReactNode } from 'react';

interface User {
  id: number;
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
  // 임시로 로그인된 상태로 시작 (실제로는 localStorage나 세션에서 가져와야 함)
  const [user, setUser] = useState<User | null>({ id: 1, name: 'user' });

  const login = (userData: User) => {
    setUser(userData);
    // TODO: localStorage나 세션에 저장
  };

  const logout = () => {
    setUser(null);
    // TODO: localStorage나 세션에서 제거
  };

  const isAuthenticated = user !== null && user.id !== -1;

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
