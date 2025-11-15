/**
 * 사용자 관련 API 서비스
 */

import { apiClient } from '@/api/client';
import { USER_ENDPOINTS } from '@/api/endpoints';
import type { MyPageResponse } from '@/types';

/**
 * 내 마이페이지 조회
 */
export async function getMyPage(): Promise<MyPageResponse> {
  return apiClient.get<MyPageResponse>(USER_ENDPOINTS.MY_PAGE);
}

export const userService = {
  getMyPage,
};

export default userService;
