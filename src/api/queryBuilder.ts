/**
 * API 쿼리 빌더 유틸리티
 * - 동적으로 쿼리 파라미터 생성
 * - null/undefined 자동 제거
 * - 타입 안전성 유지
 */

/**
 * 쿼리 파라미터 객체에서 null/undefined/빈 문자열 제거
 *
 * @example
 * cleanParams({ page: 1, search: "", filter: undefined })
 * // { page: 1 }
 */
export function cleanParams<T extends Record<string, unknown>>(
  params: T
): Partial<T> {
  const cleaned: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(params)) {
    // null, undefined, 빈 문자열 제외
    if (value !== null && value !== undefined && value !== "") {
      cleaned[key] = value;
    }
  }

  return cleaned as Partial<T>;
}

/**
 * 쿼리 빌더 클래스 - 체이닝 방식으로 쿼리 구성
 *
 * @example
 * const query = new QueryBuilder()
 *   .page(1)
 *   .pageSize(20)
 *   .filter("category", "tech")
 *   .filter("status", "published")
 *   .sort("createdAt", "desc")
 *   .build();
 *
 * // { page: 1, size: 20, category: "tech", status: "published", sort: "createdAt,desc" }
 */
export class QueryBuilder<T extends Record<string, unknown> = Record<string, unknown>> {
  private params: Record<string, unknown> = {};

  /**
   * 페이지 번호 설정
   */
  page(page: number): this {
    this.params.page = page;
    return this;
  }

  /**
   * 페이지 크기 설정
   * Spring Boot는 'size' 파라미터를 사용
   */
  pageSize(size: number): this {
    this.params.size = size;
    return this;
  }

  /**
   * 정렬 설정
   *
   * @param field - 정렬 필드명 또는 전체 정렬 문자열
   * @param order - 정렬 방향 (생략 시 field를 전체 문자열로 간주)
   *
   * @example
   * // 일반 사용: sort=field&order=desc
   * .sort("createdAt", "desc")
   *
   * // Spring Boot 형식: sort=field,desc
   * .sort("createdAt,desc")
   */
  sort(field: string, order?: "asc" | "desc"): this {
    if (order) {
      // 필드와 방향이 따로 주어진 경우 (일반 형식)
      this.params.sort = field;
      this.params.order = order;
    } else {
      // 전체 문자열로 주어진 경우 (Spring Boot 등)
      this.params.sort = field;
    }
    return this;
  }

  /**
   * 검색어 설정
   */
  search(query: string): this {
    if (query.trim()) {
      this.params.search = query.trim();
    }
    return this;
  }

  /**
   * 필터 추가 (동적으로 어떤 필드든 추가 가능)
   */
  filter(key: string, value: unknown): this {
    if (value !== null && value !== undefined && value !== "") {
      this.params[key] = value;
    }
    return this;
  }

  /**
   * 여러 필터 한 번에 추가
   */
  filters(filters: Record<string, unknown>): this {
    for (const [key, value] of Object.entries(filters)) {
      this.filter(key, value);
    }
    return this;
  }

  /**
   * 날짜 범위 필터
   */
  dateRange(field: string, from?: string | Date, to?: string | Date): this {
    if (from) {
      this.params[`${field}From`] = from instanceof Date ? from.toISOString() : from;
    }
    if (to) {
      this.params[`${field}To`] = to instanceof Date ? to.toISOString() : to;
    }
    return this;
  }

  /**
   * 배열 파라미터 (쉼표로 구분 또는 배열로 전송)
   */
  array(key: string, values: string[] | number[], separator = ","): this {
    if (values.length > 0) {
      // 백엔드가 배열을 어떻게 받는지에 따라 선택
      // 옵션 1: 쉼표 구분 문자열
      this.params[key] = values.join(separator);
      // 옵션 2: 배열 그대로 (axios가 자동으로 key[]=value1&key[]=value2로 변환)
      // this.params[key] = values;
    }
    return this;
  }

  /**
   * 커스텀 파라미터 추가 (타입 안전하게)
   */
  custom(params: Partial<T>): this {
    Object.assign(this.params, cleanParams(params));
    return this;
  }

  /**
   * 특정 키 제거
   */
  remove(key: string): this {
    delete this.params[key];
    return this;
  }

  /**
   * 모든 파라미터 초기화
   */
  reset(): this {
    this.params = {};
    return this;
  }

  /**
   * 최종 쿼리 객체 생성
   */
  build(): T {
    return cleanParams(this.params) as T;
  }

  /**
   * 쿼리 스트링으로 변환 (디버깅용)
   */
  toString(): string {
    const params = this.build();
    const searchParams = new URLSearchParams();

    for (const [key, value] of Object.entries(params)) {
      searchParams.append(key, String(value));
    }

    return searchParams.toString();
  }
}

/**
 * 쿼리 빌더 팩토리 함수 (간편한 사용)
 */
export function createQuery<T extends Record<string, unknown> = Record<string, unknown>>(): QueryBuilder<T> {
  return new QueryBuilder<T>();
}

/**
 * URL에 쿼리 파라미터 병합
 *
 * @example
 * mergeUrlParams("/posts", { page: 1, search: "react" })
 * // "/posts?page=1&search=react"
 */
export function mergeUrlParams(
  baseUrl: string,
  params: Record<string, unknown>
): string {
  const cleaned = cleanParams(params);
  const keys = Object.keys(cleaned);

  if (keys.length === 0) {
    return baseUrl;
  }

  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(cleaned)) {
    searchParams.append(key, String(value));
  }

  const separator = baseUrl.includes("?") ? "&" : "?";
  return `${baseUrl}${separator}${searchParams.toString()}`;
}
