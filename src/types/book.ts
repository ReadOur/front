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
  bookId: string;
  userId: string;
  userNickname: string;
  content: string;
  rating: number; // 1-5
  createdAt: string;
  updatedAt?: string;
}

/**
 * 책 하이라이트
 */
export interface BookHighlight {
  highlightId: number;
  bookId: number;
  userId: number;
  userNickname: string;
  content: string;
  pageNumber?: number;
  createdAt: string;
  updatedAt?: string;
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
  available: boolean;
  loanStatus?: string;
  returnDate?: string;
}
