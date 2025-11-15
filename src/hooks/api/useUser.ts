/**
 * 사용자 관련 React Query 훅
 */

import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { userService } from '@/services/userService';
import type { MyPageResponse } from '@/types';

/**
 * 마이페이지 데이터 조회
 */
export function useMyPage(
  options?: Omit<UseQueryOptions<MyPageResponse, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery<MyPageResponse, Error>({
    queryKey: ['user', 'myPage'],
    queryFn: userService.getMyPage,
    staleTime: 1000 * 60 * 5, // 5분
    ...options,
  });
}

export const USER_QUERY_KEYS = {
  all: ['user'] as const,
  myPage: () => [...USER_QUERY_KEYS.all, 'myPage'] as const,
} as const;
