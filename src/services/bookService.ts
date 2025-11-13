/**
 * 책 관련 API 서비스
 */

import { apiClient } from "@/api/client";
import { BOOK_ENDPOINTS } from "@/api/endpoints";
import {
  WishlistResponse,
  WishlistItem,
  BookReview,
  BookHighlight,
} from "@/types";

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
export async function getBookHighlights(bookId: string): Promise<BookHighlight[]> {
  return apiClient.get<BookHighlight[]>(BOOK_ENDPOINTS.HIGHLIGHTS(bookId));
}

/**
 * 책 하이라이트 작성
 */
export async function createBookHighlight(
  bookId: string,
  data: { content: string; page?: number }
): Promise<BookHighlight> {
  return apiClient.post<BookHighlight>(BOOK_ENDPOINTS.CREATE_HIGHLIGHT(bookId), data);
}

/**
 * 책 하이라이트 수정
 */
export async function updateBookHighlight(
  bookId: string,
  highlightId: string,
  data: { content: string; page?: number }
): Promise<BookHighlight> {
  return apiClient.put<BookHighlight>(
    BOOK_ENDPOINTS.UPDATE_HIGHLIGHT(bookId, highlightId),
    data
  );
}

/**
 * 책 하이라이트 삭제
 */
export async function deleteBookHighlight(bookId: string, highlightId: string): Promise<void> {
  return apiClient.delete(BOOK_ENDPOINTS.DELETE_HIGHLIGHT(bookId, highlightId));
}

export const bookService = {
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
};
