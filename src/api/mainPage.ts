/**
 * 메인 페이지 API
 *
 * 이 파일은 메인 페이지에서 사용하는 데이터를 가져옵니다.
 * - 인기글 (popularPosts): 좋아요가 많은 게시글
 * - 모집글 (recruitmentPosts): GROUP 카테고리의 모집 게시글
 * - 추천도서 (popularBooks): 인기 있는 책 목록
 */

import { apiClient } from './client';
import { MAIN_PAGE_ENDPOINTS } from './endpoints';
import { Post } from './posts';
import { BookDetail } from '@/types/book';
import { SpringPage } from '@/types/spring';

/**
 * 모집글 타입
 * - 일반 게시글(Post)에 모집 관련 필드가 추가됨
 * - currentMemberCount: 현재 참여 인원
 * - recruitmentLimit: 모집 정원
 * - isApplied: 현재 사용자가 참여 신청했는지 여부
 */
export interface RecruitmentPost extends Post {
  currentMemberCount: number;  // 현재 참여 인원
  recruitmentLimit: number;     // 모집 정원
  isApplied: boolean;           // 참여 신청 여부
}

/**
 * 추천도서 응답 타입
 * - criteria: 추천 기준 (예: "좋아요순", "최신순" 등)
 * - popularBooks: Spring 페이징 형식의 책 목록
 */
export interface PopularBooksResponse {
  criteria: string;                      // 추천 기준
  popularBooks: SpringPage<BookDetail>;  // 페이징된 책 목록
}

/**
 * 메인 페이지 응답 타입
 *
 * API 엔드포인트: GET /api/main-page
 *
 * 응답 구조:
 * {
 *   "status": 200,
 *   "body": {
 *     "popularPosts": Post[],           // 인기 게시글 배열
 *     "recruitmentPosts": RecruitmentPost[],  // 모집 게시글 배열
 *     "popularBooks": {
 *       "criteria": string,
 *       "popularBooks": SpringPage<BookDetail>
 *     }
 *   },
 *   "message": "메인 페이지 데이터 조회 성공"
 * }
 */
export interface MainPageResponse {
  popularPosts: Post[];                  // 인기 게시글 (좋아요가 많은 글)
  recruitmentPosts: RecruitmentPost[];   // 모집 게시글 (GROUP 카테고리)
  popularBooks: PopularBooksResponse;    // 추천도서 정보
}

/**
 * 메인 페이지 데이터 조회
 *
 * @returns {Promise<MainPageResponse>} 인기글, 모집글, 추천도서 정보
 *
 * @example
 * const data = await getMainPageData();
 * console.log(data.popularPosts);      // 인기 게시글 배열
 * console.log(data.recruitmentPosts);  // 모집 게시글 배열
 * console.log(data.popularBooks);      // 추천도서 정보
 */
export async function getMainPageData(): Promise<MainPageResponse> {
  return apiClient.get<MainPageResponse>(MAIN_PAGE_ENDPOINTS.MAIN);
}
