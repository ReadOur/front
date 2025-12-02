/**
 * 책 관련 API 서비스
 */

import { apiClient } from "@/api/client";
import { BOOK_ENDPOINTS, LIBRARY_ENDPOINTS } from "@/api/endpoints";
import { SpringPage, convertSpringPage } from "@/types/spring";
import {
  BookDetail,
  BookSearchItem,
  BookSearchType,
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
import { SpringPage } from "@/types/spring";

/**
 * 책 검색
 * GET /api/books/search?type=TITLE&keyword={keyword}&page=0&size=10
 */
export async function searchBooks(params: {
  type: BookSearchType;
  keyword: string;
  page?: number;
  size?: number;
}): Promise<SpringPage<BookSearchItem>> {
  return apiClient.get<SpringPage<BookSearchItem>>(BOOK_ENDPOINTS.SEARCH, {
    params: {
      type: params.type,
      keyword: params.keyword,
      page: params.page || 0,
      size: params.size || 10,
    },
  });
}

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
  const endpoint = BOOK_ENDPOINTS.RELATED_POSTS(bookId);
  const requestParams = { page: params?.page || 0, size: params?.size || 20 };
  
  console.log("[bookService] 연관 게시글 조회:", {
    bookId,
    endpoint,
    params: requestParams,
  });
  
  // Spring Page 형식으로 응답이 오므로 SpringPage 타입으로 받음
  // 인터셉터가 body를 언래핑하지만, 경우에 따라 body가 남아있을 수 있음
  const rawResponse = await apiClient.get<SpringPage<PostListItem> | { body: SpringPage<PostListItem> }>(
    endpoint,
    { params: requestParams }
  );
  
  // body가 있으면 언래핑, 없으면 그대로 사용
  const springPage: SpringPage<PostListItem> | null = 
    rawResponse && typeof rawResponse === 'object' && 'body' in rawResponse
      ? (rawResponse as { body: SpringPage<PostListItem> }).body
      : (rawResponse as SpringPage<PostListItem> | null);
  
  console.log("[bookService] 연관 게시글 응답 (Spring Page):", {
    bookId,
    hasBody: rawResponse && typeof rawResponse === 'object' && 'body' in rawResponse,
    contentCount: springPage?.content?.length || 0,
    totalElements: springPage?.totalElements || 0,
    content: springPage?.content,
  });
  
  // Spring Page를 PaginatedResponse로 변환
  if (!springPage) {
    return {
      items: [],
      meta: {
        page: 1,
        pageSize: requestParams.size,
        totalItems: 0,
        totalPages: 0,
        hasNext: false,
        hasPrevious: false,
      },
    };
  }
  
  const result = convertSpringPage(springPage);
  
  console.log("[bookService] 연관 게시글 변환 결과:", {
    bookId,
    itemsCount: result.items.length,
    totalItems: result.meta.totalItems,
  });
  
  return result;
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
  const response = await apiClient.get<SpringPage<BookReview>>(BOOK_ENDPOINTS.REVIEWS(bookId));
  return response.content; // SpringPage의 content 필드 반환
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
  reviewId: string,
  data: { content: string; rating: number }
): Promise<BookReview> {
  return apiClient.put<BookReview>(BOOK_ENDPOINTS.UPDATE_REVIEW(reviewId), data);
}

/**
 * 책 리뷰 삭제
 */
export async function deleteBookReview(reviewId: string): Promise<void> {
  return apiClient.delete(BOOK_ENDPOINTS.DELETE_REVIEW(reviewId));
}

/**
 * 책 하이라이트 목록 조회
 */
export async function getBookHighlights(
  bookId: string,
  params?: { page?: number; size?: number }
): Promise<PaginatedResponse<BookHighlight>> {
  const response = await apiClient.get<SpringPage<BookHighlight>>(BOOK_ENDPOINTS.HIGHLIGHTS(bookId), {
    params: { page: params?.page || 0, size: params?.size || 20 },
  });
  return convertSpringPage(response); // SpringPage를 PaginatedResponse로 변환
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
  searchBooks,
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
