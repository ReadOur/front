/**
 * 책 관련 API 서비스
 */

import { apiClient } from "@/api/client";
import { BOOK_ENDPOINTS, LIBRARY_ENDPOINTS } from "@/api/endpoints";
import {
  BookDetail,
  WishlistResponse,
  WishlistItem,
  BookReview,
  BookHighlight,
  CreateHighlightRequest,
  LibraryAvailability,
  MyLibraryReviewsResponse,
  PaginatedResponse,
  PostListItem,
} from "@/types";

/**
 * 책 상세 정보 조회
 */
export async function getBookDetail(bookId: string): Promise<BookDetail> {
  return apiClient.get<BookDetail>(BOOK_ENDPOINTS.DETAIL(bookId));
}

/**
 * ISBN으로 책 상세 정보 조회
 */
export async function getBookDetailByISBN(isbn13: string): Promise<BookDetail> {
  return apiClient.get<BookDetail>(BOOK_ENDPOINTS.DETAIL_BY_ISBN(isbn13));
}

/**
 * 책 연관 게시글 목록 조회
 */
export async function getRelatedPosts(
  bookId: string,
  params?: { page?: number; size?: number }
): Promise<PaginatedResponse<PostListItem>> {
  return apiClient.get<PaginatedResponse<PostListItem>>(
    BOOK_ENDPOINTS.RELATED_POSTS(bookId),
    { params: { page: params?.page || 0, size: params?.size || 20 } }
  );
}

/**
 * 도서관 대출 가능 여부 조회
 */
export async function getLibraryAvailability(isbn13: string): Promise<LibraryAvailability[]> {
  return apiClient.get<LibraryAvailability[]>(BOOK_ENDPOINTS.AVAILABILITY, {
    params: { isbn13 },
  });
}

/**
 * 위시리스트 토글 (추가/삭제)
 */
export async function toggleWishlist(bookId: string): Promise<WishlistResponse> {
  return apiClient.post<WishlistResponse>(BOOK_ENDPOINTS.TOGGLE_WISHLIST(bookId));
}

/**
 * 위시리스트 목록 조회
 */
export async function getWishlist(): Promise<WishlistItem[]> {
  return apiClient.get<WishlistItem[]>(BOOK_ENDPOINTS.WISHLIST);
}

/**
 * 책 리뷰 목록 조회
 */
export async function getBookReviews(bookId: string): Promise<BookReview[]> {
  return apiClient.get<BookReview[]>(BOOK_ENDPOINTS.REVIEWS(bookId));
}

/**
 * 책 리뷰 작성
 */
export async function createBookReview(
  bookId: string,
  data: { content: string; rating: number }
): Promise<BookReview> {
  return apiClient.post<BookReview>(BOOK_ENDPOINTS.CREATE_REVIEW(bookId), data);
}

/**
 * 책 리뷰 수정
 */
export async function updateBookReview(
  bookId: string,
  reviewId: string,
  data: { content: string; rating: number }
): Promise<BookReview> {
  return apiClient.put<BookReview>(BOOK_ENDPOINTS.UPDATE_REVIEW(bookId, reviewId), data);
}

/**
 * 책 리뷰 삭제
 */
export async function deleteBookReview(bookId: string, reviewId: string): Promise<void> {
  return apiClient.delete(BOOK_ENDPOINTS.DELETE_REVIEW(bookId, reviewId));
}

/**
 * 책 하이라이트 목록 조회
 */
export async function getBookHighlights(
  bookId: string,
  params?: { page?: number; size?: number }
): Promise<PaginatedResponse<BookHighlight>> {
  return apiClient.get<PaginatedResponse<BookHighlight>>(BOOK_ENDPOINTS.HIGHLIGHTS(bookId), {
    params: { page: params?.page || 0, size: params?.size || 20 },
  });
}

/**
 * 책 하이라이트 작성
 */
export async function createBookHighlight(
  bookId: string,
  data: CreateHighlightRequest
): Promise<BookHighlight> {
  return apiClient.post<BookHighlight>(BOOK_ENDPOINTS.CREATE_HIGHLIGHT(bookId), data);
}

/**
 * 책 하이라이트 수정
 */
export async function updateBookHighlight(
  highlightId: string,
  data: CreateHighlightRequest
): Promise<BookHighlight> {
  return apiClient.put<BookHighlight>(
    BOOK_ENDPOINTS.UPDATE_HIGHLIGHT(highlightId),
    data
  );
}

/**
 * 책 하이라이트 삭제
 */
export async function deleteBookHighlight(highlightId: string): Promise<void> {
  return apiClient.delete(BOOK_ENDPOINTS.DELETE_HIGHLIGHT(highlightId));
}

/**
 * 내 서재 - 리뷰 목록 조회 (페이지네이션)
 * GET /my-library/reviews?page=0&size=10&sort=createdAt,ASC
 */
export async function getMyReviews(params?: {
  page?: number;
  size?: number;
  sort?: string;
}): Promise<MyLibraryReviewsResponse> {
  return apiClient.get<MyLibraryReviewsResponse>(LIBRARY_ENDPOINTS.MY_REVIEWS, {
    params: {
      page: params?.page || 0,
      size: params?.size || 10,
      sort: params?.sort || "createdAt,DESC",
    },
  });
}

export const bookService = {
  getBookDetail,
  getBookDetailByISBN,
  getRelatedPosts,
  getLibraryAvailability,
  toggleWishlist,
  getWishlist,
  getBookReviews,
  createBookReview,
  updateBookReview,
  deleteBookReview,
  getBookHighlights,
  createBookHighlight,
  updateBookHighlight,
  deleteBookHighlight,
  getMyReviews,
};
