/**
 * 도서관 관련 타입 정의
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
  code: string;
  name: string;
  parentCode: string | null;
}
