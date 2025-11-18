/**
 * 메인 페이지 API
 */

import { apiClient } from './client';
import { MAIN_PAGE_ENDPOINTS } from './endpoints';
import { Post } from './posts';

/**
 * 메인 페이지 응답 타입
 */
export interface MainPageResponse {
  hotPosts: Post[];      // 인기 게시글 (좋아요 순)
  recentPosts: Post[];   // 최근 게시글
}

/**
 * 메인 페이지 데이터 조회
 * - 인기 게시글 5개
 * - 최근 게시글 6개
 */
export async function getMainPageData(): Promise<MainPageResponse> {
  return apiClient.get<MainPageResponse>(MAIN_PAGE_ENDPOINTS.MAIN);
}
