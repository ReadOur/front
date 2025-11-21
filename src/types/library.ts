/**
 * 도서관 및 내서재 관련 타입 정의
 */

/**
 * 도서관 정보
 */
export interface Library {
  libraryCode: string;
  libraryName: string;
  address: string;
  homepage: string;
}

/**
 * 북마크 (책갈피)
 */
export interface Bookmark {
  bookmarkId: string;
  postId: number;
  postTitle: string;
  postCategory: string;
  authorNickname: string;
  createdAt: string;
  bookmarkedAt: string;
}

/**
 * 저장한 게시글
 */
export interface SavedPost {
  savedPostId: string;
  postId: number;
  postTitle: string;
  postCategory: string;
  authorNickname: string;
  createdAt: string;
  savedAt: string;
}

/**
 * 관심 도서관
 */
export interface FavoriteLibrary {
  libraryName: string;
  address: string;
  tel?: string;
  homepage?: string;
  latitude?: number;
  longitude?: number;
  addedAt: string;
}

/**
 * 도서관 검색 파라미터
 */
export interface LibrarySearchParams {
  region?: string;      // 광역시/도 코드
  dtlRegion?: string;   // 시/군/구 코드
  page?: number;
  size?: number;
}

/**
 * 도서관 검색 응답 (Spring Page)
 */
export interface LibrarySearchResponse {
  content: Library[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  last: boolean;
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}

/**
 * 지역 정보
 */
export interface Region {
  id: number;
  name: string;
  code?: string;
}
