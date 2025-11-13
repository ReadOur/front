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
  highlightId: string;
  bookId: string;
  userId: string;
  userNickname: string;
  content: string;
  page?: number;
  createdAt: string;
  updatedAt?: string;
}
