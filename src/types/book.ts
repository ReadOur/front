/**
 * 책 관련 타입 정의
 */

/**
 * 책 정보
 */
export interface Book {
  bookId: string;
  title: string;
  author: string;
  publisher?: string;
  publishedDate?: string;
  isbn?: string;
  thumbnail?: string;
  description?: string;
}

/**
 * 책 검색 결과 아이템
 * GET /api/books/search
 */
export interface BookSearchItem {
  bookId: number | null;
  bookname: string;
  authors: string;
  publisher: string;
  publicationYear: string;
  isbn13: string;
  bookImageURL: string;
  averageRating: number | null;
  reviewCount: number;
}

/**
 * 책 검색 타입
 */
export type BookSearchType = "TITLE" | "AUTHOR" | "PUBLISHER" | "ISBN";

/**
 * 책 상세 정보 (API 응답)
 */
export interface BookDetail {
  bookId: number;
  isbn13: string;
  bookname: string;
  authors: string;
  publisher: string;
  publicationYear: number;
  description: string;
  bookImageUrl: string;
  averageRating: number | null;
  reviewCount: number;
  isWishlisted: boolean;
}

/**
 * 위시리스트 응답
 */
export interface WishlistResponse {
  isWishlisted: boolean;
}

/**
 * 위시리스트 목록 아이템
 */
export interface WishlistItem extends Book {
  addedAt: string; // 위시리스트에 추가된 날짜
}

/**
 * 책 리뷰
 */
export interface BookReview {
  reviewId: string;
  bookId: number;
  authorId: number;
  authorNickname: string; // 백엔드는 authorNickname 사용
  content: string;
  rating: number; // 1-5
  createdAt: string;
  updatedAt: string;
}

/**
 * 책 하이라이트
 */
export interface BookHighlight {
  highlightId: number;
  bookId: number;
  authorId: number;
  authorNickname: string; // 백엔드는 authorNickname 사용
  content: string;
  pageNumber?: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * 하이라이트 생성 요청
 */
export interface CreateHighlightRequest {
  content: string;
  pageNumber?: number;
}

/**
 * 도서관 대출 가능 여부
 */
export interface LibraryAvailability {
  libraryName: string;
  hasBook: boolean; // 해당 도서관에 책이 있는지 여부
  loanAvailable: boolean; // 대출 가능한지 여부
  loanStatus?: string;
  returnDate?: string;
}

/**
 * 내 서재 리뷰 아이템
 * 백엔드 GET /my-library/reviews 응답 형식
 */
export interface MyLibraryReview {
  reviewId: number;
  bookId: number;
  bookname: string;
  bookImageUrl: string;
  rating: number;
  content: string;
  createdAt: string;
}

/**
 * 내 서재 리뷰 목록 응답
 * GET /my-library/reviews
 */
export interface MyLibraryReviewsResponse {
  userId: number;
  nickname: string;
  reviewPage: import("./spring").SpringPage<MyLibraryReview>;
}
