/**
 * 메인 페이지 API
 */

import { apiClient } from './client';
import { MAIN_PAGE_ENDPOINTS } from './endpoints';
import { Post } from './posts';

/**
 * 인기 도서 정보
 */
export interface PopularBook {
  bookname: string;
  authors: string;
  publisher: string;
  publicationYear: string;
  isbn13: string;
  bookImageURL: string;
  loanCount: number;
}

/**
 * 인기 도서 응답
 */
export interface PopularBooksResponse {
  criteria: string;
  popularBooks: {
    content: PopularBook[];
    totalPages: number;
    totalElements: number;
    size: number;
    number: number;
    first: boolean;
    last: boolean;
    empty: boolean;
  };
}

/**
 * 메인 페이지 응답 타입
 */
export interface MainPageResponse {
  popularPosts: Post[];        // 인기 게시글 (좋아요 순)
  recruitmentPosts: Post[];    // 모임 모집 게시글
  popularBooks: PopularBooksResponse;  // 인기 도서
}

/**
 * 메인 페이지 데이터 조회
 * - 인기 게시글
 * - 모임 모집 게시글
 * - 인기 도서
 */
export async function getMainPageData(): Promise<MainPageResponse> {
  return apiClient.get<MainPageResponse>(MAIN_PAGE_ENDPOINTS.MAIN);
}
