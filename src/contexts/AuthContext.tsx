import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  getAccessToken,
  setAccessToken,
  removeAccessToken,
} from '@/utils/auth';

/**
 * 사용자 정보
 *
 * JWT 토큰 기반 인증:
 * - userId는 JWT 토큰에 포함되어 있으며, 백엔드가 자동으로 추출
 * - 프론트엔드는 JWT 토큰만 관리하면 됨
 * - user 객체는 UI 표시용 최소 정보만 포함
 */
interface User {
  name: string;
  email?: string;
}

/**
 * 인증 컨텍스트 타입
 *
 * @property accessToken - JWT 액세스 토큰 (모든 API 요청에 자동 포함)
 * @property user - 사용자 UI 표시용 정보
 * @property isAuthenticated - 로그인 여부
 */
interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  login: (token: string, userData?: Partial<User>) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setToken] = useState<string | null>(null);

  /**
   * 페이지 로드 시 초기화
   * 현재는 자동 로그인 비활성화 (매번 로그아웃 상태로 시작)
   */
  useEffect(() => {
    removeAccessToken();
  }, []);

  /**
   * 로그인
   *
   * @param token - JWT 액세스 토큰
   * @param userData - 선택적 사용자 정보 (기본값: { name: 'user' })
   *
   * JWT 토큰이 localStorage 및 state에 저장되면,
   * 모든 API 요청에 자동으로 Authorization 헤더 포함됨
   */
  const login = (token: string, userData?: Partial<User>) => {
    // JWT 토큰 저장
    setAccessToken(token);  // localStorage
    setToken(token);        // state

    // 사용자 UI 표시용 정보 저장
    setUser({
      name: userData?.name || 'user',
      email: userData?.email,
    });
  };

  /**
   * 로그아웃
   * JWT 토큰 및 사용자 정보 제거
   */
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
