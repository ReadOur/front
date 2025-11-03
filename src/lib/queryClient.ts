/**
 * React Query QueryClient 설정
 */

import { QueryClient } from "@tanstack/react-query";

/**
 * QueryClient 인스턴스 생성
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 기본 옵션
      staleTime: 1000 * 60 * 5, // 5분 (데이터가 fresh 상태를 유지하는 시간)
      gcTime: 1000 * 60 * 10, // 10분 (캐시가 메모리에 유지되는 시간, 구 cacheTime)
      retry: 1, // 실패 시 1번만 재시도
      refetchOnWindowFocus: false, // 윈도우 포커스 시 자동 리패치 비활성화

      // 에러 핸들링
      throwOnError: false, // 에러를 throw하지 않고 error 객체로 반환
    },
    mutations: {
      // Mutation 기본 옵션
      retry: 0, // mutation은 재시도 하지 않음

      // 에러 핸들링
      throwOnError: false,
    },
  },
});

export default queryClient;
