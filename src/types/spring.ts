/**
 * Spring Data JPA의 Page 응답 타입
 * - Spring Boot 백엔드에서 반환하는 페이지네이션 형식
 */

/**
 * Sort 정보
 */
export interface SpringSort {
  empty: boolean;
  sorted: boolean;
  unsorted: boolean;
}

/**
 * Pageable 정보
 */
export interface SpringPageable {
  offset: number;
  sort: SpringSort;
  pageNumber: number;
  paged: boolean;
  pageSize: number;
  unpaged: boolean;
}

/**
 * Spring Page 응답
 */
export interface SpringPage<T> {
  totalElements: number;
  totalPages: number;
  size: number;
  content: T[];
  number: number;
  sort: SpringSort;
  first: boolean;
  last: boolean;
  numberOfElements: number;
  pageable: SpringPageable;
  empty: boolean;
}

/**
 * Spring Page를 우리 프로젝트의 PaginatedResponse로 변환
 */
export function convertSpringPage<T>(springPage: SpringPage<T>): {
  items: T[];
  meta: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
} {
  return {
    items: springPage.content,
    meta: {
      page: springPage.number + 1, // Spring은 0부터 시작, 우리는 1부터
      pageSize: springPage.size,
      totalItems: springPage.totalElements,
      totalPages: springPage.totalPages,
      hasNext: !springPage.last,
      hasPrevious: !springPage.first,
    },
  };
}
