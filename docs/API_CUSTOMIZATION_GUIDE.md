# API 응답 커스터마이징 가이드

## 개요

백엔드에서 JSON으로 응답이 온다고 가정하고, 그 구조에 맞춰 프론트엔드에서 필요한 형태로 변환하는 방법을 설명합니다.

---

## 커스터마이징 포인트 (5단계)

```
백엔드 JSON
    ↓
① 응답 인터셉터 (client.ts)
    ↓
② 자동 unwrapping (client.ts)
    ↓
③ 형식 변환기 (spring.ts, transformers.ts)
    ↓
④ 서비스 레이어 (services/*.ts)
    ↓
⑤ 페이지/컴포넌트
```

---

## ① 응답 인터셉터: 전역 처리

**위치:** `src/api/client.ts` (43-104번째 줄)

### 용도
- 모든 API 응답에 공통으로 적용되는 처리
- 에러 처리, 토큰 갱신, 로깅 등

### 예제: 백엔드 응답 래퍼 형식 강제

```typescript
// src/api/client.ts
axiosInstance.interceptors.response.use(
  (response) => {
    const data = response.data;

    // 백엔드가 표준 형식이 아니면 변환
    if (!data.hasOwnProperty('success') || !data.hasOwnProperty('data')) {
      console.warn('Non-standard response format, wrapping:', response.config.url);
      response.data = {
        success: true,
        data: data,  // 원본을 data로 감싸기
        timestamp: new Date().toISOString(),
      };
    }

    return response;
  },
  async (error) => {
    // 에러 처리
    return Promise.reject(error);
  }
);
```

### 실제 사용 시나리오

**시나리오 1: 백엔드가 래퍼 없이 직접 데이터 반환**

```json
// 백엔드 응답
{ "id": "123", "title": "제목" }

// 인터셉터 처리 후
{
  "success": true,
  "data": { "id": "123", "title": "제목" },
  "timestamp": "2024-11-04T10:00:00Z"
}
```

**시나리오 2: snake_case → camelCase 자동 변환**

```typescript
import camelcaseKeys from 'camelcase-keys';  // npm install camelcase-keys

axiosInstance.interceptors.response.use(
  (response) => {
    // 모든 응답을 camelCase로 변환
    response.data = camelcaseKeys(response.data, { deep: true });
    return response;
  }
);
```

```json
// 백엔드 응답
{ "user_id": "123", "first_name": "홍길동" }

// 인터셉터 처리 후
{ "userId": "123", "firstName": "홍길동" }
```

---

## ② 자동 Unwrapping: 중첩 제거

**위치:** `src/api/client.ts` (124-177번째 줄)

### 현재 구조

```typescript
// 백엔드 표준 응답
interface ApiResponse<T> {
  success: boolean;
  data: T;         // ← 실제 데이터
  message?: string;
}

// 자동 unwrapping
export async function get<T>(url: string): Promise<T> {
  const response = await axiosInstance.get<ApiResponse<T>>(url);
  return response.data.data;  // ← response.data.data 자동 추출
}
```

### 백엔드 구조에 맞춰 수정

**예제 1: 다른 래퍼 필드명**

```typescript
// 백엔드 응답
interface BackendResponse<T> {
  status: "success" | "error";
  result: T;  // ← "data"가 아니라 "result"
  code: number;
}

// client.ts 수정
export async function get<T>(url: string): Promise<T> {
  const response = await axiosInstance.get<BackendResponse<T>>(url);

  if (response.data.status === 'error') {
    throw new Error(`API Error: ${response.data.code}`);
  }

  return response.data.result;  // ← result 추출
}
```

**예제 2: 래퍼 없음 (데이터 직접 반환)**

```typescript
// 백엔드가 래퍼 없이 직접 반환
export async function get<T>(url: string): Promise<T> {
  const response = await axiosInstance.get<T>(url);
  return response.data;  // ← 바로 반환
}
```

**예제 3: 조건부 unwrapping**

```typescript
export async function get<T>(url: string): Promise<T> {
  const response = await axiosInstance.get(url);
  const data = response.data;

  // 래퍼가 있는지 확인
  if (data && typeof data === 'object' && 'data' in data) {
    return data.data as T;  // ApiResponse<T> 형식
  }

  return data as T;  // 래퍼 없음
}
```

---

## ③ 형식 변환기: 재사용 가능한 변환 함수

**위치:** `src/api/transformers.ts`, `src/types/spring.ts`

### 용도
- 백엔드 형식을 프론트엔드 표준 형식으로 변환
- 여러 API에서 재사용

### 예제 1: Spring Boot 페이지네이션 변환

**위치:** `src/types/spring.ts:47-69`

```typescript
// Spring Boot 응답
interface SpringPage<T> {
  content: T[];          // ← items
  number: number;        // ← 0-based page
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

// 프론트엔드 표준 형식으로 변환
export function convertSpringPage<T>(springPage: SpringPage<T>): PaginatedResponse<T> {
  return {
    items: springPage.content,  // content → items
    meta: {
      page: springPage.number + 1,  // 0-based → 1-based
      pageSize: springPage.size,
      totalItems: springPage.totalElements,
      totalPages: springPage.totalPages,
      hasNext: !springPage.last,
      hasPrevious: !springPage.first,
    },
  };
}
```

**사용:**

```typescript
// src/services/postService.ts
export async function getPosts(params?: GetPostsParams) {
  const springPage = await apiClient.get<SpringPage<Post>>('/posts', { params });
  return convertSpringPage(springPage);  // ← 변환
}
```

### 예제 2: 커스텀 페이지네이션 변환

```typescript
// src/api/transformers.ts 에 추가

/**
 * Laravel 형식 페이지네이션 변환
 */
export function convertLaravelPagination<T>(laravelResponse: {
  data: T[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}): PaginatedResponse<T> {
  return {
    items: laravelResponse.data,
    meta: {
      page: laravelResponse.current_page,
      pageSize: laravelResponse.per_page,
      totalItems: laravelResponse.total,
      totalPages: laravelResponse.last_page,
      hasNext: laravelResponse.current_page < laravelResponse.last_page,
      hasPrevious: laravelResponse.current_page > 1,
    },
  };
}

/**
 * Django REST Framework 페이지네이션 변환
 */
export function convertDjangoPagination<T>(djangoResponse: {
  results: T[];
  count: number;
  next: string | null;
  previous: string | null;
}, currentPage: number, pageSize: number): PaginatedResponse<T> {
  const totalPages = Math.ceil(djangoResponse.count / pageSize);

  return {
    items: djangoResponse.results,
    meta: {
      page: currentPage,
      pageSize: pageSize,
      totalItems: djangoResponse.count,
      totalPages: totalPages,
      hasNext: djangoResponse.next !== null,
      hasPrevious: djangoResponse.previous !== null,
    },
  };
}
```

### 예제 3: 필드명 매핑 (어댑터 패턴)

```typescript
// src/adapters/postAdapter.ts (새 파일 생성)

/**
 * 백엔드 Post를 프론트엔드 Post로 변환
 */
export function adaptPost(backendPost: any): Post {
  return {
    id: backendPost.post_id || backendPost.id,
    title: backendPost.title,
    content: backendPost.content || backendPost.body,

    // 작성자: 문자열 또는 객체 처리
    author: typeof backendPost.author === 'string'
      ? { id: backendPost.author_id, nickname: backendPost.author }
      : {
          id: backendPost.author.id || backendPost.author.user_id,
          nickname: backendPost.author.nickname || backendPost.author.name,
        },

    // snake_case → camelCase
    viewCount: backendPost.view_count || backendPost.viewCount || 0,
    likeCount: backendPost.like_count || backendPost.likeCount || 0,
    commentCount: backendPost.comment_count || backendPost.commentCount || 0,

    // 날짜: 다양한 형식 처리
    createdAt: backendPost.created_at || backendPost.createdAt,
    updatedAt: backendPost.updated_at || backendPost.updatedAt,

    // 선택적 필드
    category: backendPost.category,
    tags: backendPost.tags || [],
    attachments: backendPost.attachments?.map(adaptAttachment) || [],
    isPinned: backendPost.is_pinned || backendPost.isPinned || false,
    isLiked: backendPost.is_liked || backendPost.isLiked,
  };
}

/**
 * 첨부파일 어댑터
 */
function adaptAttachment(backendAttachment: any): Attachment {
  return {
    id: backendAttachment.id,
    fileName: backendAttachment.file_name || backendAttachment.fileName,
    fileUrl: backendAttachment.file_url || backendAttachment.url,
    fileSize: backendAttachment.file_size || backendAttachment.size || 0,
    mimeType: backendAttachment.mime_type || backendAttachment.type,
    createdAt: backendAttachment.created_at || backendAttachment.createdAt,
  };
}

/**
 * 게시글 목록 어댑터
 */
export function adaptPosts(backendPosts: any[]): Post[] {
  return backendPosts.map(adaptPost);
}
```

**사용:**

```typescript
// src/services/postService.ts
import { adaptPost, adaptPosts } from '@/adapters/postAdapter';

export async function getPost(postId: string): Promise<Post> {
  const backendPost = await apiClient.get(`/posts/${postId}`);
  return adaptPost(backendPost);  // ← 변환
}

export async function getPosts(params?: GetPostsParams): Promise<PaginatedResponse<Post>> {
  const response = await apiClient.get<any>('/posts', { params });

  return {
    items: adaptPosts(response.items),  // ← 각 아이템 변환
    meta: response.meta,
  };
}
```

---

## ④ 서비스 레이어: API별 커스터마이징

**위치:** `src/services/*.ts`

### 기본 패턴

```typescript
// src/services/postService.ts
export async function getPosts(params?: GetPostsParams): Promise<PaginatedResponse<Post>> {
  // 1. 요청 파라미터 변환
  const backendParams = {
    page: params?.page ? params.page - 1 : 0,  // 1-based → 0-based
    size: params?.pageSize || 20,
    sort: params?.sort,
    category: params?.category,
  };

  // 2. API 호출
  const response = await apiClient.get<any>('/posts', { params: backendParams });

  // 3. 응답 변환
  return convertBackendResponse(response);
}
```

### 실전 예제

**예제 1: 복잡한 응답 구조 처리**

```typescript
// 백엔드 응답
{
  "posts": [
    {
      "post_id": "123",
      "user": { "id": "u1", "name": "홍길동" },
      "stats": { "views": 100, "likes": 10, "comments": 5 }
    }
  ],
  "pagination": {
    "current": 1,
    "total": 10,
    "per_page": 20
  }
}

// 서비스에서 변환
export async function getPosts(params?: GetPostsParams): Promise<PaginatedResponse<PostListItem>> {
  const response = await apiClient.get<any>('/posts', { params });

  return {
    items: response.posts.map((item: any) => ({
      id: item.post_id,
      title: item.title,
      author: {
        id: item.user.id,
        nickname: item.user.name,
      },
      viewCount: item.stats.views,
      likeCount: item.stats.likes,
      commentCount: item.stats.comments,
      createdAt: item.created_at,
    })),
    meta: {
      page: response.pagination.current,
      pageSize: response.pagination.per_page,
      totalItems: response.pagination.total * response.pagination.per_page,
      totalPages: response.pagination.total,
      hasNext: response.pagination.current < response.pagination.total,
      hasPrevious: response.pagination.current > 1,
    },
  };
}
```

**예제 2: 여러 API 조합**

```typescript
export async function getPostWithAuthorDetails(postId: string): Promise<Post> {
  // 1. 게시글 조회
  const post = await apiClient.get<any>(`/posts/${postId}`);

  // 2. 작성자 상세 정보 별도 조회
  const author = await apiClient.get<any>(`/users/${post.author_id}`);

  // 3. 조합
  return {
    id: post.id,
    title: post.title,
    content: post.content,
    author: {
      id: author.id,
      nickname: author.nickname,
      avatar: author.avatar_url,
      bio: author.bio,
    },
    viewCount: post.view_count,
    likeCount: post.like_count,
    commentCount: post.comment_count,
    createdAt: post.created_at,
  };
}
```

**예제 3: 조건부 데이터 처리**

```typescript
export async function createPost(data: CreatePostRequest): Promise<Post> {
  // 1. 첨부파일이 있으면 먼저 업로드
  let attachmentIds: string[] = [];
  if (data.attachments && data.attachments.length > 0) {
    const uploadPromises = data.attachments.map(file =>
      apiClient.upload<{ id: string }>('/upload', file)
    );
    const uploads = await Promise.all(uploadPromises);
    attachmentIds = uploads.map(u => u.id);
  }

  // 2. 게시글 생성 (백엔드 형식에 맞춰 변환)
  const backendPayload = {
    title: data.title,
    content: data.content,
    category: data.category || 'general',
    tag_list: data.tags?.join(','),  // ["tag1", "tag2"] → "tag1,tag2"
    attachment_ids: attachmentIds,
  };

  const response = await apiClient.post<any>('/posts', backendPayload);

  // 3. 응답 변환
  return adaptPost(response);
}
```

---

## ⑤ 페이지/컴포넌트: 최종 사용

**위치:** `src/pages/*.tsx`, `src/hooks/api/*.ts`

### React Query 훅에서 변환

```typescript
// src/hooks/api/usePost.ts
export function usePosts(params?: GetPostsParams) {
  return useQuery<PaginatedResponse<PostListItem>>({
    queryKey: POST_QUERY_KEYS.list(params),
    queryFn: () => postService.getPosts(params),  // ← 서비스가 변환 처리
  });
}
```

### 페이지에서 직접 변환 (특수한 경우)

```typescript
// src/pages/BRD_04.tsx
export function PostListPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['posts'],
    queryFn: async () => {
      const response = await apiClient.get<any>('/posts');

      // 페이지 전용 변환 로직
      return {
        items: response.data.map((item: any) => ({
          ...item,
          displayTitle: `[${item.category}] ${item.title}`,  // UI 전용 필드
          isNew: isWithin24Hours(item.created_at),
        })),
        meta: response.meta,
      };
    },
  });

  return (
    <div>
      {data?.items.map(post => (
        <div key={post.id}>{post.displayTitle}</div>
      ))}
    </div>
  );
}
```

---

## 전체 흐름 예시

### 시나리오: 백엔드가 다음과 같은 응답을 보냄

```json
{
  "status": "ok",
  "result": {
    "post_list": [
      {
        "post_id": "123",
        "post_title": "제목",
        "user_info": { "user_id": "u1", "user_name": "홍길동" },
        "meta": { "view": 100, "like": 10 }
      }
    ],
    "page_info": {
      "current_page": 1,
      "total_page": 5,
      "page_size": 20
    }
  }
}
```

### 커스터마이징 단계

#### 1단계: 응답 인터셉터 (선택)

```typescript
// src/api/client.ts
axiosInstance.interceptors.response.use((response) => {
  // status: ok → success: true 변환
  if (response.data.status === 'ok') {
    response.data = {
      success: true,
      data: response.data.result,
    };
  }
  return response;
});
```

#### 2단계: 어댑터 작성

```typescript
// src/adapters/postAdapter.ts
export function adaptBackendPostList(backendResponse: any): PaginatedResponse<PostListItem> {
  return {
    items: backendResponse.post_list.map((item: any) => ({
      id: item.post_id,
      title: item.post_title,
      author: {
        id: item.user_info.user_id,
        nickname: item.user_info.user_name,
      },
      viewCount: item.meta.view,
      likeCount: item.meta.like,
      commentCount: 0,
      createdAt: item.created_at,
    })),
    meta: {
      page: backendResponse.page_info.current_page,
      pageSize: backendResponse.page_info.page_size,
      totalItems: backendResponse.page_info.total_page * backendResponse.page_info.page_size,
      totalPages: backendResponse.page_info.total_page,
      hasNext: backendResponse.page_info.current_page < backendResponse.page_info.total_page,
      hasPrevious: backendResponse.page_info.current_page > 1,
    },
  };
}
```

#### 3단계: 서비스에서 사용

```typescript
// src/services/postService.ts
import { adaptBackendPostList } from '@/adapters/postAdapter';

export async function getPosts(params?: GetPostsParams): Promise<PaginatedResponse<PostListItem>> {
  const response = await apiClient.get<any>('/posts', { params });
  return adaptBackendPostList(response);  // ← 변환
}
```

#### 4단계: 페이지에서 사용

```typescript
// src/pages/BRD_04.tsx
const { data } = usePosts({ page: 1, pageSize: 20 });
// data는 PaginatedResponse<PostListItem> 타입으로 보장됨
```

---

## 베스트 프랙티스

### 1. 레이어별 책임 분리

```
인터셉터     → 전역적인 변환 (모든 API 공통)
변환기       → 재사용 가능한 변환 로직 (페이지네이션, 날짜 등)
어댑터       → 도메인별 변환 (Post, Comment, User 등)
서비스       → API별 변환 (특정 엔드포인트 전용)
페이지/훅    → UI 전용 변환 (표시 형식 등)
```

### 2. 타입 안전성 유지

```typescript
// ❌ any 사용
const response = await apiClient.get<any>('/posts');
return response.data.items;  // 타입 체크 없음

// ✅ 중간 타입 정의
interface BackendPostResponse {
  post_list: Array<{
    post_id: string;
    post_title: string;
    // ...
  }>;
}

const response = await apiClient.get<BackendPostResponse>('/posts');
return adaptBackendPostList(response);  // 타입 체크됨
```

### 3. 변환 로직 테스트

```typescript
// src/adapters/__tests__/postAdapter.test.ts
import { adaptPost } from '../postAdapter';

describe('adaptPost', () => {
  it('should convert backend post to frontend format', () => {
    const backendPost = {
      post_id: '123',
      post_title: '제목',
      user_info: { user_id: 'u1', user_name: '홍길동' },
      meta: { view: 100, like: 10 },
    };

    const result = adaptPost(backendPost);

    expect(result).toEqual({
      id: '123',
      title: '제목',
      author: { id: 'u1', nickname: '홍길동' },
      viewCount: 100,
      likeCount: 10,
    });
  });
});
```

### 4. 디버깅 용이성

```typescript
// src/adapters/postAdapter.ts
export function adaptPost(backendPost: any): Post {
  // 개발 환경에서만 로깅
  if (import.meta.env.DEV) {
    console.log('[adaptPost] Input:', backendPost);
  }

  const result = {
    id: backendPost.post_id,
    // ...
  };

  if (import.meta.env.DEV) {
    console.log('[adaptPost] Output:', result);
  }

  return result;
}
```

---

## 자주 묻는 질문 (FAQ)

### Q1: 백엔드 응답이 API마다 완전히 다른 구조인데?

**A:** 각 API마다 별도 어댑터를 작성하세요.

```typescript
// src/adapters/
├── postAdapter.ts      // 게시글 API용
├── commentAdapter.ts   // 댓글 API용
└── userAdapter.ts      // 사용자 API용
```

### Q2: 변환 로직이 너무 복잡해지면?

**A:** 작은 함수로 분리하세요.

```typescript
function adaptAuthor(backendAuthor: any): UserProfile {
  return {
    id: backendAuthor.user_id || backendAuthor.id,
    nickname: backendAuthor.user_name || backendAuthor.nickname,
  };
}

function adaptStats(backendStats: any) {
  return {
    viewCount: backendStats.view || backendStats.view_count || 0,
    likeCount: backendStats.like || backendStats.like_count || 0,
  };
}

export function adaptPost(backendPost: any): Post {
  return {
    id: backendPost.post_id,
    title: backendPost.post_title,
    author: adaptAuthor(backendPost.user_info),
    ...adaptStats(backendPost.meta),
  };
}
```

### Q3: 백엔드가 snake_case, 프론트엔드가 camelCase 사용

**A:** 전역 변환기 사용 또는 개별 매핑

```typescript
// 방법 1: 라이브러리 사용 (인터셉터)
import camelcaseKeys from 'camelcase-keys';
axiosInstance.interceptors.response.use((response) => {
  response.data = camelcaseKeys(response.data, { deep: true });
  return response;
});

// 방법 2: 수동 매핑
viewCount: backendPost.view_count,
createdAt: backendPost.created_at,
```

### Q4: 페이지네이션 형식이 API마다 다르면?

**A:** 범용 변환 함수 작성

```typescript
// src/api/transformers.ts
export function createPaginationMeta(params: {
  totalItems: number;
  page: number;
  pageSize: number;
}): PaginationMeta {
  // ... (기존 코드)
}

// 사용
return {
  items: adaptPosts(response.data),
  meta: createPaginationMeta({
    totalItems: response.total,
    page: response.current_page,
    pageSize: response.per_page,
  }),
};
```

---

## 체크리스트

새 API를 추가할 때:

- [ ] 백엔드 응답 형식 확인 (Postman/Swagger)
- [ ] 표준 형식과 차이점 파악
- [ ] 변환이 필요한지 결정
  - [ ] 전역 인터셉터에서?
  - [ ] 어댑터 함수?
  - [ ] 서비스 레이어에서?
- [ ] 타입 정의 작성
- [ ] 변환 함수 작성
- [ ] 서비스 함수에 적용
- [ ] 테스트 작성
- [ ] React Query 훅 작성

---

---

## API 엔드포인트 커스터마이징

### 1. Base URL 설정

**위치:** `src/api/client.ts` (11-12번째 줄)

```typescript
// 환경변수에서 읽기
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1";

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});
```

**환경별 설정:**

```bash
# .env.development
VITE_API_BASE_URL=http://localhost:8080/api/v1

# .env.production
VITE_API_BASE_URL=https://api.example.com/v1

# .env.staging
VITE_API_BASE_URL=https://staging-api.example.com/v1
```

**여러 API 서버 사용:**

```typescript
// src/api/client.ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1";
const AUTH_API_URL = import.meta.env.VITE_AUTH_API_URL || "http://localhost:8081/auth";
const CDN_URL = import.meta.env.VITE_CDN_URL || "https://cdn.example.com";

// 메인 API 클라이언트
export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
});

// 인증 전용 클라이언트
export const authClient = axios.create({
  baseURL: AUTH_API_URL,
});

// CDN 클라이언트
export const cdnClient = axios.create({
  baseURL: CDN_URL,
});
```

---

### 2. 엔드포인트 중앙 관리

**위치:** `src/api/endpoints.ts`

#### 현재 구조

```typescript
export const AUTH_ENDPOINTS = {
  LOGIN: "/auth/login",
  SIGNUP: "/auth/signup",
  REFRESH: "/auth/refresh",
  ME: "/auth/me",
} as const;

export const POST_ENDPOINTS = {
  LIST: "/posts",
  DETAIL: (postId: string) => `/posts/${postId}`,
  CREATE: "/posts",
  UPDATE: (postId: string) => `/posts/${postId}`,
  DELETE: (postId: string) => `/posts/${postId}`,
  LIKE: (postId: string) => `/posts/${postId}/like`,
  UNLIKE: (postId: string) => `/posts/${postId}/unlike`,
} as const;

export const COMMENT_ENDPOINTS = {
  LIST: (postId: string) => `/posts/${postId}/comments`,
  CREATE: `/comments`,
  UPDATE: (commentId: string) => `/comments/${commentId}`,
  DELETE: (commentId: string) => `/comments/${commentId}`,
  CREATE_REPLY: (commentId: string) => `/comments/${commentId}/replies`,
} as const;
```

#### 백엔드 구조에 맞춰 커스터마이징

**예제 1: 다른 URL 패턴**

```typescript
// 백엔드가 /api/v2/board/post/:id 형식 사용
export const POST_ENDPOINTS = {
  LIST: "/api/v2/board/posts",
  DETAIL: (postId: string) => `/api/v2/board/post/${postId}`,
  CREATE: "/api/v2/board/post/create",
  UPDATE: (postId: string) => `/api/v2/board/post/update/${postId}`,
  DELETE: (postId: string) => `/api/v2/board/post/delete/${postId}`,
} as const;
```

**예제 2: RESTful vs 동사형 URL**

```typescript
// RESTful 스타일
export const POST_ENDPOINTS_REST = {
  LIST: "/posts",                              // GET
  DETAIL: (id: string) => `/posts/${id}`,      // GET
  CREATE: "/posts",                            // POST
  UPDATE: (id: string) => `/posts/${id}`,      // PUT/PATCH
  DELETE: (id: string) => `/posts/${id}`,      // DELETE
} as const;

// 동사형 스타일 (일부 레거시 API)
export const POST_ENDPOINTS_VERB = {
  LIST: "/getPostList",
  DETAIL: (id: string) => `/getPost?id=${id}`,
  CREATE: "/createPost",
  UPDATE: "/updatePost",
  DELETE: "/deletePost",
} as const;
```

**예제 3: 복잡한 파라미터 처리**

```typescript
export const POST_ENDPOINTS = {
  LIST: "/posts",
  DETAIL: (postId: string) => `/posts/${postId}`,

  // 여러 파라미터
  LIKE: (postId: string, userId: string) => `/posts/${postId}/like/${userId}`,

  // 쿼리 파라미터 포함
  SEARCH: (query: string, category?: string) => {
    const params = new URLSearchParams({ q: query });
    if (category) params.append('category', category);
    return `/posts/search?${params.toString()}`;
  },

  // 중첩 리소스
  COMMENTS: (postId: string, commentId?: string) =>
    commentId
      ? `/posts/${postId}/comments/${commentId}`
      : `/posts/${postId}/comments`,
} as const;
```

**예제 4: 버전 관리**

```typescript
// src/api/endpoints.ts
const API_VERSION = 'v2';

export const POST_ENDPOINTS = {
  LIST: `/${API_VERSION}/posts`,
  DETAIL: (postId: string) => `/${API_VERSION}/posts/${postId}`,
} as const;

// 또는 버전별 분리
export const POST_ENDPOINTS_V1 = {
  LIST: "/v1/posts",
  // ...
} as const;

export const POST_ENDPOINTS_V2 = {
  LIST: "/v2/posts",
  // ...
} as const;

// 기본 사용
export const POST_ENDPOINTS = POST_ENDPOINTS_V2;
```

---

### 3. 동적 엔드포인트 빌더

복잡한 엔드포인트는 빌더 패턴 사용:

```typescript
// src/api/endpointBuilder.ts
export class EndpointBuilder {
  private base: string;
  private segments: string[] = [];
  private params: URLSearchParams = new URLSearchParams();

  constructor(base: string) {
    this.base = base;
  }

  segment(segment: string | number): this {
    this.segments.push(String(segment));
    return this;
  }

  param(key: string, value: string | number | boolean): this {
    this.params.append(key, String(value));
    return this;
  }

  build(): string {
    let url = this.base;
    if (this.segments.length > 0) {
      url += '/' + this.segments.join('/');
    }
    const paramString = this.params.toString();
    if (paramString) {
      url += '?' + paramString;
    }
    return url;
  }
}

// 사용
const endpoint = new EndpointBuilder('/posts')
  .segment('123')
  .segment('comments')
  .param('page', 1)
  .param('sort', 'latest')
  .build();
// "/posts/123/comments?page=1&sort=latest"
```

---

### 4. 엔드포인트 사용 패턴

#### 서비스 레이어에서 사용

```typescript
// src/services/postService.ts
import { apiClient } from '@/api/client';
import { POST_ENDPOINTS } from '@/api/endpoints';

export async function getPosts(params?: GetPostsParams) {
  return apiClient.get(POST_ENDPOINTS.LIST, { params });
}

export async function getPost(postId: string) {
  return apiClient.get(POST_ENDPOINTS.DETAIL(postId));
}

export async function likePost(postId: string) {
  return apiClient.post(POST_ENDPOINTS.LIKE(postId));
}
```

#### 직접 URL 사용 (비권장)

```typescript
// ❌ 하드코딩 (비권장)
export async function getPost(postId: string) {
  return apiClient.get(`/posts/${postId}`);
}

// ✅ 엔드포인트 상수 사용 (권장)
export async function getPost(postId: string) {
  return apiClient.get(POST_ENDPOINTS.DETAIL(postId));
}
```

---

### 5. 프록시 설정 (개발 환경)

CORS 문제 해결을 위한 프록시:

**vite.config.ts:**

```typescript
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    proxy: {
      // /api 요청을 백엔드로 프록시
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        // rewrite: (path) => path.replace(/^\/api/, ''),
      },

      // 여러 프록시 설정
      '/auth': {
        target: 'http://localhost:8081',
        changeOrigin: true,
      },
    },
  },
});
```

**사용:**

```typescript
// 프록시 사용 (개발 환경)
const API_BASE_URL = '/api/v1';  // → http://localhost:8080/api/v1

// 직접 연결 (프로덕션)
const API_BASE_URL = 'https://api.example.com/v1';
```

---

### 6. 엔드포인트 테스트

```typescript
// src/api/__tests__/endpoints.test.ts
import { POST_ENDPOINTS } from '../endpoints';

describe('POST_ENDPOINTS', () => {
  it('should generate correct detail URL', () => {
    expect(POST_ENDPOINTS.DETAIL('123')).toBe('/posts/123');
  });

  it('should generate correct like URL', () => {
    expect(POST_ENDPOINTS.LIKE('123')).toBe('/posts/123/like');
  });
});
```

---

### 7. API 문서화

엔드포인트에 JSDoc 추가:

```typescript
/**
 * 게시글 관련 API 엔드포인트
 */
export const POST_ENDPOINTS = {
  /**
   * 게시글 목록 조회
   * @method GET
   * @query page - 페이지 번호 (1부터 시작)
   * @query pageSize - 페이지당 아이템 수
   * @query category - 카테고리 필터
   */
  LIST: "/posts",

  /**
   * 게시글 상세 조회
   * @method GET
   * @param postId - 게시글 ID
   */
  DETAIL: (postId: string) => `/posts/${postId}`,

  /**
   * 게시글 생성
   * @method POST
   * @body CreatePostRequest
   */
  CREATE: "/posts",

  /**
   * 게시글 좋아요
   * @method POST
   * @param postId - 게시글 ID
   */
  LIKE: (postId: string) => `/posts/${postId}/like`,
} as const;
```

---

### 8. 실전 시나리오

#### 시나리오 1: 백엔드 API 버전 업그레이드

```typescript
// 1. 기존 v1 엔드포인트 유지
export const POST_ENDPOINTS_V1 = {
  LIST: "/v1/posts",
  DETAIL: (postId: string) => `/v1/posts/${postId}`,
} as const;

// 2. 새로운 v2 엔드포인트 추가
export const POST_ENDPOINTS_V2 = {
  LIST: "/v2/community/posts",
  DETAIL: (postId: string) => `/v2/community/posts/${postId}`,
} as const;

// 3. 점진적 마이그레이션
export const POST_ENDPOINTS = POST_ENDPOINTS_V2;

// 4. 서비스에서 조건부 사용
export async function getPosts(useV2 = true) {
  const endpoints = useV2 ? POST_ENDPOINTS_V2 : POST_ENDPOINTS_V1;
  return apiClient.get(endpoints.LIST);
}
```

#### 시나리오 2: 마이크로서비스 아키텍처

```typescript
// src/api/clients.ts
export const communityClient = axios.create({
  baseURL: 'https://community-api.example.com',
});

export const authClient = axios.create({
  baseURL: 'https://auth-api.example.com',
});

export const mediaClient = axios.create({
  baseURL: 'https://media-api.example.com',
});

// src/api/endpoints.ts
export const POST_ENDPOINTS = {
  LIST: "/posts",  // communityClient 사용
} as const;

export const AUTH_ENDPOINTS = {
  LOGIN: "/login",  // authClient 사용
} as const;

export const UPLOAD_ENDPOINTS = {
  IMAGE: "/images",  // mediaClient 사용
} as const;

// src/services/postService.ts
import { communityClient } from '@/api/clients';

export async function getPosts() {
  return communityClient.get(POST_ENDPOINTS.LIST);
}
```

#### 시나리오 3: 테넌트별 URL

```typescript
// 테넌트별 다른 API 서버 사용
export function getApiBaseUrl(tenantId: string): string {
  const tenantUrls: Record<string, string> = {
    'tenant1': 'https://tenant1-api.example.com',
    'tenant2': 'https://tenant2-api.example.com',
  };
  return tenantUrls[tenantId] || 'https://default-api.example.com';
}

// 동적 클라이언트 생성
export function createTenantClient(tenantId: string) {
  return axios.create({
    baseURL: getApiBaseUrl(tenantId),
  });
}
```

---

## 참고 파일

- `src/api/client.ts` - HTTP 클라이언트 및 인터셉터
- `src/api/endpoints.ts` - 엔드포인트 정의 ⭐
- `src/api/transformers.ts` - 범용 변환 유틸리티
- `src/types/spring.ts` - Spring Boot 전용 변환
- `src/adapters/` - 도메인별 어댑터 (생성 권장)
- `src/services/` - API 서비스 레이어
- `.env.development`, `.env.production` - 환경변수 ⭐
- `vite.config.ts` - 개발 서버 프록시 설정 ⭐
