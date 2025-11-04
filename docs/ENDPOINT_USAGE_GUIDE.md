# 엔드포인트 사용 가이드

## 목차

1. [엔드포인트란?](#엔드포인트란)
2. [기본 사용법](#기본-사용법)
3. [새 기능 추가 시 엔드포인트 작성법](#새-기능-추가-시-엔드포인트-작성법)
4. [실전 예제](#실전-예제)
5. [베스트 프랙티스](#베스트-프랙티스)

---

## 엔드포인트란?

**엔드포인트 = API의 주소를 미리 정의해둔 것**

```typescript
// ❌ 나쁜 방법: 주소를 매번 하드코딩
await apiClient.get("/posts/123");
await apiClient.get("/posts/456");
await apiClient.post("/posts/123/like");

// ✅ 좋은 방법: 엔드포인트 사용
await apiClient.get(POST_ENDPOINTS.DETAIL("123"));
await apiClient.get(POST_ENDPOINTS.DETAIL("456"));
await apiClient.post(POST_ENDPOINTS.LIKE("123"));
```

**장점:**
- ✅ 한 곳만 수정하면 됨
- ✅ 오타 방지
- ✅ 자동완성 지원
- ✅ API 구조 파악 쉬움

---

## 기본 사용법

### 1. 엔드포인트 확인

**파일:** `src/api/endpoints.ts`

```typescript
// 게시글 관련 엔드포인트
export const POST_ENDPOINTS = {
  LIST: "/posts",                              // 목록
  CREATE: "/posts",                            // 생성
  DETAIL: (postId: string) => `/posts/${postId}`,  // 상세
  UPDATE: (postId: string) => `/posts/${postId}`,  // 수정
  DELETE: (postId: string) => `/posts/${postId}`,  // 삭제
  LIKE: (postId: string) => `/posts/${postId}/like`,  // 좋아요
  UNLIKE: (postId: string) => `/posts/${postId}/unlike`,  // 좋아요 취소
} as const;

// 댓글 관련 엔드포인트
export const COMMENT_ENDPOINTS = {
  LIST: (postId: string) => `/posts/${postId}/comments`,  // 목록
  CREATE: (postId: string) => `/posts/${postId}/comments`,  // 생성
  DELETE: (commentId: string) => `/comments/${commentId}`,  // 삭제
} as const;
```

### 2. 서비스에서 사용

**파일:** `src/services/postService.ts`

```typescript
import { apiClient } from '@/api/client';
import { POST_ENDPOINTS } from '@/api/endpoints';

// ① 게시글 목록 조회
export async function getPosts(params?: GetPostsParams) {
  return apiClient.get<PaginatedResponse<PostListItem>>(
    POST_ENDPOINTS.LIST,  // ← "/posts"
    { params }
  );
}

// ② 게시글 상세 조회
export async function getPost(postId: string) {
  return apiClient.get<Post>(
    POST_ENDPOINTS.DETAIL(postId)  // ← "/posts/123"
  );
}

// ③ 게시글 생성
export async function createPost(data: CreatePostRequest) {
  return apiClient.post<Post>(
    POST_ENDPOINTS.CREATE,  // ← "/posts"
    data
  );
}

// ④ 게시글 좋아요
export async function likePost(postId: string) {
  return apiClient.post<LikeResponse>(
    POST_ENDPOINTS.LIKE(postId)  // ← "/posts/123/like"
  );
}
```

### 3. 페이지에서 사용

**파일:** `src/pages/BRD_05.tsx`

```typescript
import { usePost } from '@/hooks/api';

export default function PostDetailPage() {
  const { postId } = useParams();

  // usePost 훅이 내부적으로 POST_ENDPOINTS 사용
  const { data: post, isLoading } = usePost(postId || "");

  if (isLoading) return <div>로딩 중...</div>;

  return <div>{post?.title}</div>;
}
```

---

## 새 기능 추가 시 엔드포인트 작성법

### 시나리오: "북마크" 기능 추가하기

#### Step 1: 백엔드 API 확인

먼저 백엔드 개발자에게 API 스펙을 받습니다:

```
GET    /bookmarks          - 북마크 목록
POST   /bookmarks          - 북마크 추가
DELETE /bookmarks/:id      - 북마크 삭제
GET    /bookmarks/:id      - 북마크 상세
```

#### Step 2: 엔드포인트 정의

**파일:** `src/api/endpoints.ts`

```typescript
/**
 * 북마크 관련 엔드포인트
 */
export const BOOKMARK_ENDPOINTS = {
  // 고정 경로
  LIST: "/bookmarks",
  CREATE: "/bookmarks",

  // 파라미터가 필요한 경로
  DETAIL: (bookmarkId: string) => `/bookmarks/${bookmarkId}`,
  DELETE: (bookmarkId: string) => `/bookmarks/${bookmarkId}`,
} as const;
```

**규칙:**
- 상수 이름은 대문자 + 언더스코어 (LIST, CREATE, DETAIL)
- 고정 경로는 문자열로
- 동적 경로는 함수로 (화살표 함수)
- `as const`로 타입 안전성 확보

#### Step 3: 타입 정의

**파일:** `src/types/bookmark.ts` (새로 생성)

```typescript
import { BaseEntity } from './api';

/**
 * 북마크 정보
 */
export interface Bookmark extends BaseEntity {
  id: string;
  postId: string;
  postTitle: string;
  createdAt: string;
}

/**
 * 북마크 추가 요청
 */
export interface CreateBookmarkRequest {
  postId: string;
}

/**
 * 북마크 목록 조회 파라미터
 */
export interface GetBookmarksParams {
  page?: number;
  pageSize?: number;
  sort?: string;
}
```

#### Step 4: 서비스 함수 작성

**파일:** `src/services/bookmarkService.ts` (새로 생성)

```typescript
import { apiClient } from '@/api/client';
import { BOOKMARK_ENDPOINTS } from '@/api/endpoints';
import {
  Bookmark,
  CreateBookmarkRequest,
  GetBookmarksParams,
  PaginatedResponse,
} from '@/types';

/**
 * 북마크 목록 조회
 */
export async function getBookmarks(
  params?: GetBookmarksParams
): Promise<PaginatedResponse<Bookmark>> {
  return apiClient.get<PaginatedResponse<Bookmark>>(
    BOOKMARK_ENDPOINTS.LIST,
    { params }
  );
}

/**
 * 북마크 상세 조회
 */
export async function getBookmark(bookmarkId: string): Promise<Bookmark> {
  return apiClient.get<Bookmark>(
    BOOKMARK_ENDPOINTS.DETAIL(bookmarkId)
  );
}

/**
 * 북마크 추가
 */
export async function createBookmark(
  data: CreateBookmarkRequest
): Promise<Bookmark> {
  return apiClient.post<Bookmark, CreateBookmarkRequest>(
    BOOKMARK_ENDPOINTS.CREATE,
    data
  );
}

/**
 * 북마크 삭제
 */
export async function deleteBookmark(bookmarkId: string): Promise<void> {
  return apiClient.delete<void>(
    BOOKMARK_ENDPOINTS.DELETE(bookmarkId)
  );
}

/**
 * 북마크 서비스 객체
 */
export const bookmarkService = {
  getBookmarks,
  getBookmark,
  createBookmark,
  deleteBookmark,
};

export default bookmarkService;
```

#### Step 5: React Query 훅 작성

**파일:** `src/hooks/api/useBookmark.ts` (새로 생성)

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookmarkService } from '@/services/bookmarkService';
import {
  Bookmark,
  CreateBookmarkRequest,
  GetBookmarksParams,
  PaginatedResponse,
} from '@/types';

// ===== Query Keys =====
export const BOOKMARK_QUERY_KEYS = {
  all: ['bookmarks'] as const,
  lists: () => [...BOOKMARK_QUERY_KEYS.all, 'list'] as const,
  list: (params?: GetBookmarksParams) =>
    [...BOOKMARK_QUERY_KEYS.lists(), params] as const,
  details: () => [...BOOKMARK_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...BOOKMARK_QUERY_KEYS.details(), id] as const,
};

// ===== Queries =====

/**
 * 북마크 목록 조회
 */
export function useBookmarks(params?: GetBookmarksParams) {
  return useQuery<PaginatedResponse<Bookmark>>({
    queryKey: BOOKMARK_QUERY_KEYS.list(params),
    queryFn: () => bookmarkService.getBookmarks(params),
  });
}

/**
 * 북마크 상세 조회
 */
export function useBookmark(bookmarkId: string) {
  return useQuery<Bookmark>({
    queryKey: BOOKMARK_QUERY_KEYS.detail(bookmarkId),
    queryFn: () => bookmarkService.getBookmark(bookmarkId),
    enabled: !!bookmarkId,
  });
}

// ===== Mutations =====

/**
 * 북마크 추가
 */
export function useCreateBookmark() {
  const queryClient = useQueryClient();

  return useMutation<Bookmark, Error, CreateBookmarkRequest>({
    mutationFn: bookmarkService.createBookmark,
    onSuccess: () => {
      // 북마크 목록 갱신
      queryClient.invalidateQueries({
        queryKey: BOOKMARK_QUERY_KEYS.lists()
      });
    },
  });
}

/**
 * 북마크 삭제
 */
export function useDeleteBookmark() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: bookmarkService.deleteBookmark,
    onSuccess: () => {
      // 북마크 목록 갱신
      queryClient.invalidateQueries({
        queryKey: BOOKMARK_QUERY_KEYS.lists()
      });
    },
  });
}
```

#### Step 6: 페이지에서 사용

**파일:** `src/pages/BookmarkPage.tsx` (새로 생성)

```typescript
import { useBookmarks, useCreateBookmark, useDeleteBookmark } from '@/hooks/api/useBookmark';

export default function BookmarkPage() {
  // 북마크 목록 조회
  const { data: bookmarks, isLoading } = useBookmarks({ page: 1, pageSize: 20 });

  // 북마크 추가 mutation
  const createMutation = useCreateBookmark();

  // 북마크 삭제 mutation
  const deleteMutation = useDeleteBookmark();

  const handleAddBookmark = (postId: string) => {
    createMutation.mutate({ postId });
  };

  const handleDeleteBookmark = (bookmarkId: string) => {
    if (confirm('북마크를 삭제하시겠습니까?')) {
      deleteMutation.mutate(bookmarkId);
    }
  };

  if (isLoading) return <div>로딩 중...</div>;

  return (
    <div>
      <h1>내 북마크</h1>
      <ul>
        {bookmarks?.items.map((bookmark) => (
          <li key={bookmark.id}>
            {bookmark.postTitle}
            <button onClick={() => handleDeleteBookmark(bookmark.id)}>
              삭제
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

---

## 실전 예제

### 예제 1: 파라미터가 여러 개인 경우

```typescript
// 백엔드 API: POST /posts/:postId/comments/:commentId/like

// endpoints.ts
export const COMMENT_ENDPOINTS = {
  LIKE: (postId: string, commentId: string) =>
    `/posts/${postId}/comments/${commentId}/like`,
} as const;

// 사용
await apiClient.post(COMMENT_ENDPOINTS.LIKE("123", "456"));
// → POST /posts/123/comments/456/like
```

### 예제 2: 쿼리 파라미터 포함

```typescript
// 백엔드 API: GET /posts/search?q=keyword&category=tech

// endpoints.ts
export const POST_ENDPOINTS = {
  SEARCH: "/posts/search",  // 쿼리는 params로 전달
} as const;

// 사용
await apiClient.get(POST_ENDPOINTS.SEARCH, {
  params: { q: 'keyword', category: 'tech' }
});
// → GET /posts/search?q=keyword&category=tech
```

### 예제 3: 중첩 리소스

```typescript
// 백엔드 API:
// GET /posts/:postId/comments           - 댓글 목록
// GET /posts/:postId/comments/:commentId - 댓글 상세

// endpoints.ts
export const COMMENT_ENDPOINTS = {
  // 방법 1: 함수 오버로딩 느낌
  LIST: (postId: string) => `/posts/${postId}/comments`,
  DETAIL: (postId: string, commentId: string) =>
    `/posts/${postId}/comments/${commentId}`,

  // 방법 2: 조건부 반환
  RESOURCE: (postId: string, commentId?: string) =>
    commentId
      ? `/posts/${postId}/comments/${commentId}`
      : `/posts/${postId}/comments`,
} as const;

// 사용
await apiClient.get(COMMENT_ENDPOINTS.LIST("123"));
// → /posts/123/comments

await apiClient.get(COMMENT_ENDPOINTS.DETAIL("123", "456"));
// → /posts/123/comments/456
```

### 예제 4: RESTful하지 않은 레거시 API

```typescript
// 백엔드 API: POST /api/doSomething?action=like&id=123

// endpoints.ts
export const LEGACY_ENDPOINTS = {
  DO_SOMETHING: "/api/doSomething",
} as const;

// 사용
await apiClient.post(LEGACY_ENDPOINTS.DO_SOMETHING, null, {
  params: { action: 'like', id: '123' }
});
```

### 예제 5: 버전별 API

```typescript
// endpoints.ts
const API_VERSION = 'v2';

export const POST_ENDPOINTS = {
  LIST: `/${API_VERSION}/posts`,
  DETAIL: (id: string) => `/${API_VERSION}/posts/${id}`,
} as const;

// 또는 버전별 분리
export const POST_ENDPOINTS_V1 = {
  LIST: "/v1/posts",
} as const;

export const POST_ENDPOINTS_V2 = {
  LIST: "/v2/community/posts",
} as const;

// 기본 사용
export const POST_ENDPOINTS = POST_ENDPOINTS_V2;
```

---

## 베스트 프랙티스

### 1. 명명 규칙

```typescript
// ✅ 좋은 예
export const POST_ENDPOINTS = {
  LIST: "/posts",              // 동사 없이 명사만
  CREATE: "/posts",
  DETAIL: (id) => `/posts/${id}`,
  UPDATE: (id) => `/posts/${id}`,
  DELETE: (id) => `/posts/${id}`,
} as const;

// ❌ 나쁜 예
export const PostEndpoints = {  // 대문자로 시작 X
  getPosts: "/posts",           // 동사 포함 X
  post_detail: (id) => `/posts/${id}`,  // snake_case X
};
```

### 2. 함수 vs 문자열

```typescript
// ✅ 파라미터 없음 → 문자열
LIST: "/posts",
CREATE: "/posts",

// ✅ 파라미터 있음 → 함수
DETAIL: (postId: string) => `/posts/${postId}`,
LIKE: (postId: string) => `/posts/${postId}/like`,

// ❌ 파라미터 없는데 함수 (불필요)
LIST: () => "/posts",
```

### 3. 타입 안전성

```typescript
// ✅ as const 사용
export const POST_ENDPOINTS = {
  LIST: "/posts",
} as const;

// ❌ as const 없음
export const POST_ENDPOINTS = {
  LIST: "/posts",  // string 타입으로 추론됨
};
```

### 4. 주석 추가

```typescript
/**
 * 게시글 관련 API 엔드포인트
 */
export const POST_ENDPOINTS = {
  /**
   * 게시글 목록 조회
   * @method GET
   * @query page - 페이지 번호
   * @query pageSize - 페이지 크기
   */
  LIST: "/posts",

  /**
   * 게시글 상세 조회
   * @method GET
   * @param postId - 게시글 ID
   */
  DETAIL: (postId: string) => `/posts/${postId}`,

  /**
   * 게시글 좋아요
   * @method POST
   * @param postId - 게시글 ID
   */
  LIKE: (postId: string) => `/posts/${postId}/like`,
} as const;
```

### 5. 그룹화

```typescript
// ✅ 도메인별로 그룹화
export const POST_ENDPOINTS = { ... };
export const COMMENT_ENDPOINTS = { ... };
export const USER_ENDPOINTS = { ... };

// ✅ 통합 export (선택사항)
export const ENDPOINTS = {
  POST: POST_ENDPOINTS,
  COMMENT: COMMENT_ENDPOINTS,
  USER: USER_ENDPOINTS,
} as const;

// 사용
import { ENDPOINTS } from '@/api/endpoints';
await apiClient.get(ENDPOINTS.POST.LIST);
```

### 6. 하나의 파일에 모두 작성

```typescript
// ✅ 좋은 구조
src/api/
  └─ endpoints.ts  // 모든 엔드포인트 한 곳에

// ❌ 나쁜 구조
src/api/
  ├─ postEndpoints.ts
  ├─ commentEndpoints.ts
  └─ userEndpoints.ts
```

---

## 체크리스트

새로운 기능 추가 시:

- [ ] 백엔드 API 스펙 확인
- [ ] `endpoints.ts`에 엔드포인트 정의
- [ ] `types/*.ts`에 타입 정의
- [ ] `services/*.ts`에 서비스 함수 작성
- [ ] `hooks/api/*.ts`에 React Query 훅 작성
- [ ] 페이지에서 사용
- [ ] 테스트 (선택사항)

---

## 요약

### 엔드포인트 정의

```typescript
// src/api/endpoints.ts
export const RESOURCE_ENDPOINTS = {
  LIST: "/resources",
  CREATE: "/resources",
  DETAIL: (id: string) => `/resources/${id}`,
  UPDATE: (id: string) => `/resources/${id}`,
  DELETE: (id: string) => `/resources/${id}`,
} as const;
```

### 서비스 사용

```typescript
// src/services/resourceService.ts
import { RESOURCE_ENDPOINTS } from '@/api/endpoints';

export async function getResource(id: string) {
  return apiClient.get(RESOURCE_ENDPOINTS.DETAIL(id));
}
```

### 훅 사용

```typescript
// src/hooks/api/useResource.ts
export function useResource(id: string) {
  return useQuery({
    queryKey: ['resource', id],
    queryFn: () => resourceService.getResource(id),
  });
}
```

### 페이지 사용

```typescript
// src/pages/ResourcePage.tsx
const { data } = useResource(id);
```

---

## 다음 단계

- [API 커스터마이징 가이드](./API_CUSTOMIZATION_GUIDE.md) - 백엔드 응답 변환
- [API 동작 흐름 설명](./API_FLOW_EXPLANATION.md) - 전체 흐름 이해
- [API 사용 가이드](./API_USAGE.md) - apiClient 기본 사용법
