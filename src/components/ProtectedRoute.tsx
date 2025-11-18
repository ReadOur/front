import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
}

/**
 * 로그인이 필요한 페이지를 보호하는 컴포넌트
 * 비로그인 상태에서 접근 시 로그인 페이지로 리다이렉트
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // 초기 로딩 중에는 아무것도 렌더링하지 않음 (깜빡임 방지)
  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    // 로그인 후 원래 가려던 페이지로 돌아갈 수 있도록 state에 저장
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
