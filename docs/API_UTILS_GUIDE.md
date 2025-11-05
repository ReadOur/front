# API 유틸리티 사용 가이드

백엔드 API의 세부 사양이 다르거나, 다양한 필터 조합이 필요할 때 유연하게 대응할 수 있는 유틸리티 모음입니다.

---

## 📦 파일 구조

```
src/api/
├── client.ts           # Axios 클라이언트 (기존)
├── endpoints.ts        # API 경로 상수 (기존)
├── queryBuilder.ts     # 쿼리 파라미터 빌더 (신규)
├── transformers.ts     # 응답 데이터 변환기 (신규)
└── index.ts           # 통합 export (신규)
```

---

## 🔧 1. Query Builder (쿼리 빌더)

### 기본 사용법

```typescript
import { createQuery } from "@/api";

// 체이닝 방식으로 쿼리 구성
const params = createQuery()
  .page(1)
  .pageSize(20)
  .search("리액트")
  .filter("category", "tech")
  .filter("status", "published")
  .sort("createdAt", "desc")
  .build();

// 결과:
// {
//   page: 1,
//   pageSize: 20,
//   search: "리액트",
//   category: "tech",
//   status: "published",
//   sort: "createdAt",
//   order: "desc"
// }
```

### 서비스에서 사용

```typescript
// src/services/postService.ts
import { apiClient, createQuery, POST_ENDPOINTS } from "@/api";

export async function searchPosts(options: {
  search?: string;
  category?: string;
  tags?: string[];
  page?: number;
}) {
  const params = createQuery()
    .page(options.page || 1)
    .pageSize(20)
    .search(options.search || "")
    .filter("category", options.category)
    .array("tags", options.tags || [])  // 배열 파라미터
    .build();

  return apiClient.get(POST_ENDPOINTS.LIST, { params });
}
```

### 날짜 범위 검색

```typescript
const params = createQuery()
  .dateRange("createdAt", "2024-01-01", "2024-12-31")
  .build();

// 결과:
// {
//   createdAtFrom: "2024-01-01",
//   createdAtTo: "2024-12-31"
// }
```

### 동적 필터 추가

```typescript
// 사용자가 선택한 필터만 추가
const query = createQuery().page(1).pageSize(20);

if (userSelectedCategory) {
  query.filter("category", userSelectedCategory);
}

if (userSelectedTags.length > 0) {
  query.array("tags", userSelectedTags);
}

if (dateRange.start) {
  query.dateRange("createdAt", dateRange.start, dateRange.end);
}

const params = query.build();
// 빈 값(null/undefined/"")은 자동으로 제외됨
```

### URL 문자열 생성 (디버깅용)

```typescript
const query = createQuery()
  .page(1)
  .search("react")
  .filter("category", "tech");

console.log(query.toString());
// "page=1&search=react&category=tech"
```

---

## 🔄 2. Transformers (응답 변환기)

### 날짜 형식 변환

```typescript
import { formatKoreanDate, formatRelativeTime } from "@/api";

// ISO 날짜 → 한국어 형식
formatKoreanDate("2024-01-15T10:30:00Z");
// "2024년 1월 15일"

// 상대 시간 표시
formatRelativeTime("2024-11-03T08:00:00Z");
// "2시간 전" / "3일 전" / "1주 전"
```

### 숫자 표기 변환

```typescript
import { formatKoreanNumber } from "@/api";

formatKoreanNumber(1500);      // "1.5천"
formatKoreanNumber(25000);     // "2.5만"
formatKoreanNumber(5000000);   // "500.0만"
formatKoreanNumber(150000000); // "1.5억"
```

### 페이지네이션 응답 변환

백엔드가 다른 필드명을 사용할 경우:

```typescript
import { transformPaginatedResponse } from "@/api";

// 백엔드 응답
const backendData = {
  items: [
    { post_id: "1", post_title: "제목", created_time: "2024-01-01" },
  ],
  meta: { ... }
};

// 프론트엔드 형식으로 변환
const frontendData = transformPaginatedResponse(backendData, (item) => ({
  id: item.post_id,
  title: item.post_title,
  createdAt: item.created_time,
}));
```

### 안전한 속성 접근

```typescript
import { safeGet } from "@/api";

const user = {
  profile: {
    avatar: {
      url: "https://example.com/avatar.png"
    }
  }
};

// 중첩 객체 안전하게 접근
safeGet(user, "profile.avatar.url", "default.png");
// "https://example.com/avatar.png"

safeGet(user, "profile.cover.url", "default.png");
// "default.png" (존재하지 않으면 기본값)
```

### 배열 유틸리티

```typescript
import { pluck, toMap, toRecord } from "@/api";

const posts = [
  { id: "1", title: "첫 글", authorId: "user1" },
  { id: "2", title: "둘째 글", authorId: "user2" },
];

// ID만 추출
pluck(posts, "id");
// ["1", "2"]

// Map으로 변환 (빠른 조회)
const postMap = toMap(posts, "id");
postMap.get("1");  // { id: "1", title: "첫 글", ... }

// Record로 변환
const postRecord = toRecord(posts, "id");
postRecord["1"];   // { id: "1", title: "첫 글", ... }
```

---

## 🎯 3. 실전 예제

### 예제 1: 고급 검색 기능

```typescript
// src/services/advancedSearchService.ts
import { apiClient, createQuery, POST_ENDPOINTS } from "@/api";
import type { PaginatedResponse, PostListItem } from "@/types";

export interface AdvancedSearchParams {
  // 검색어
  query?: string;

  // 필터
  categories?: string[];
  tags?: string[];
  authorId?: string;
  status?: "draft" | "published" | "archived";

  // 날짜 범위
  createdAfter?: Date;
  createdBefore?: Date;

  // 정렬
  sortBy?: "createdAt" | "viewCount" | "likeCount";
  sortOrder?: "asc" | "desc";

  // 페이지네이션
  page?: number;
  pageSize?: number;
}

export async function advancedSearch(
  params: AdvancedSearchParams
): Promise<PaginatedResponse<PostListItem>> {
  const query = createQuery()
    .page(params.page || 1)
    .pageSize(params.pageSize || 20)
    .search(params.query || "")
    .filter("authorId", params.authorId)
    .filter("status", params.status)
    .array("categories", params.categories || [])
    .array("tags", params.tags || [])
    .dateRange("createdAt", params.createdAfter, params.createdBefore)
    .sort(params.sortBy || "createdAt", params.sortOrder || "desc");

  return apiClient.get(POST_ENDPOINTS.LIST, { params: query.build() });
}
```

### 예제 2: 백엔드 형식이 다를 때

```typescript
// 백엔드가 다른 필드명을 사용하는 경우
import { apiClient, transformPaginatedResponse } from "@/api";

// 백엔드 응답 타입
interface BackendPost {
  post_id: string;
  post_title: string;
  post_content: string;
  author_info: {
    user_id: string;
    user_name: string;
  };
  view_cnt: number;
  like_cnt: number;
  created_time: string;
}

// 프론트엔드 타입
interface Post {
  id: string;
  title: string;
  content: string;
  author: {
    id: string;
    name: string;
  };
  viewCount: number;
  likeCount: number;
  createdAt: string;
}

export async function getPostsWithTransform() {
  const backendData = await apiClient.get<PaginatedResponse<BackendPost>>(
    "/posts"
  );

  // 변환
  return transformPaginatedResponse<BackendPost, Post>(
    backendData,
    (item) => ({
      id: item.post_id,
      title: item.post_title,
      content: item.post_content,
      author: {
        id: item.author_info.user_id,
        name: item.author_info.user_name,
      },
      viewCount: item.view_cnt,
      likeCount: item.like_cnt,
      createdAt: item.created_time,
    })
  );
}
```

### 예제 3: 컴포넌트에서 사용

```typescript
// src/pages/PostSearchPage.tsx
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { advancedSearch } from "@/services/advancedSearchService";
import { formatRelativeTime, formatKoreanNumber } from "@/api";

export default function PostSearchPage() {
  const [searchParams, setSearchParams] = useState({
    query: "",
    categories: [] as string[],
    page: 1,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["posts", "search", searchParams],
    queryFn: () => advancedSearch(searchParams),
  });

  return (
    <div>
      <input
        value={searchParams.query}
        onChange={(e) => setSearchParams({ ...searchParams, query: e.target.value })}
        placeholder="검색어 입력"
      />

      {/* 카테고리 필터 */}
      <select
        onChange={(e) =>
          setSearchParams({
            ...searchParams,
            categories: e.target.value ? [e.target.value] : [],
          })
        }
      >
        <option value="">전체</option>
        <option value="tech">기술</option>
        <option value="life">라이프</option>
      </select>

      {/* 결과 표시 */}
      {isLoading ? (
        <div>로딩 중...</div>
      ) : (
        <div>
          {data?.items.map((post) => (
            <article key={post.id}>
              <h2>{post.title}</h2>
              <p>
                조회 {formatKoreanNumber(post.viewCount)} ·
                {formatRelativeTime(post.createdAt)}
              </p>
            </article>
          ))}

          {/* 페이지네이션 */}
          <div>
            <button
              disabled={!data?.meta.hasPrevious}
              onClick={() =>
                setSearchParams({ ...searchParams, page: searchParams.page - 1 })
              }
            >
              이전
            </button>
            <span>
              {data?.meta.page} / {data?.meta.totalPages}
            </span>
            <button
              disabled={!data?.meta.hasNext}
              onClick={() =>
                setSearchParams({ ...searchParams, page: searchParams.page + 1 })
              }
            >
              다음
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## 🚀 4. 주요 장점

### ✅ URL 파라미터 유연성
- 새로운 필터 추가 시 타입 수정 불필요
- 빈 값 자동 제거로 깔끔한 URL
- 체이닝으로 가독성 향상

### ✅ 백엔드 형식 변화 대응
- 필드명이 달라도 변환 함수로 해결
- 날짜/숫자 형식 일관성 유지
- 타입 안전성 보장

### ✅ 재사용성
- 모든 API에서 동일한 패턴 사용
- 유틸리티 함수로 중복 코드 제거
- 유지보수 용이

---

## 📝 5. 기존 코드와의 비교

### Before (기존)

```typescript
// 필터 추가할 때마다 타입 수정 필요
export interface GetPostsParams {
  page?: number;
  pageSize?: number;
  category?: string;
  tag?: string;  // 새로 추가됨
  search?: string;
}

// 빈 값 처리 수동으로 해야 함
const params: any = { page: 1 };
if (category) params.category = category;
if (tag) params.tag = tag;
if (search) params.search = search;
```

### After (개선)

```typescript
// 타입 수정 없이 동적으로 필터 추가
const params = createQuery()
  .page(1)
  .filter("category", category)
  .filter("tag", tag)
  .filter("anyNewField", value)  // 새 필드도 자유롭게 추가
  .search(search)
  .build();
// 빈 값은 자동으로 제거됨
```

---

## 🔗 참고

- `src/api/queryBuilder.ts` - 쿼리 빌더 구현
- `src/api/transformers.ts` - 변환 유틸리티 구현
- `API_INTEGRATION_GUIDE.md` - 기본 API 통합 가이드
