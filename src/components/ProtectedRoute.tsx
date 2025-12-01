import { ReactNode, useEffect, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
}

/**
 * 로그인이 필요한 페이지를 보호하는 컴포넌트
 * 비로그인 상태에서 접근 시 경고 메시지를 표시하고 로그인 페이지로 리다이렉트
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const alertedRef = useRef(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !alertedRef.current) {
      alertedRef.current = true;
      alert("권한이 필요합니다.");
    }
  }, [isAuthenticated, isLoading]);

  // 초기 로딩 중에는 아무것도 렌더링하지 않음 (깜빡임 방지)
  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
