# API 사용 가이드

ReadOur 프로젝트의 API 클라이언트 사용법을 설명합니다.

## 📚 목차

1. [기본 설정](#기본-설정)
2. [API 클라이언트 사용법](#api-클라이언트-사용법)
3. [쿼리 빌더 사용법](#쿼리-빌더-사용법)
4. [React Query와 함께 사용하기](#react-query와-함께-사용하기)
5. [타입 정의](#타입-정의)
6. [에러 처리](#에러-처리)

---

## 기본 설정

### 환경 변수

`.env` 파일에 다음을 추가하세요:

```env
VITE_API_BASE_URL=http://localhost:8080/api/v1
VITE_API_TIMEOUT=10000
```

### 주요 특징

- ✅ **자동 인증**: localStorage의 `accessToken` 자동 추가
- ✅ **토큰 갱신**: 401 에러 시 자동 리프레시 토큰 갱신
- ✅ **타입 안전**: TypeScript로 완전한 타입 지원
- ✅ **에러 처리**: 통일된 에러 응답 처리

---

## API 클라이언트 사용법

### 기본 사용

```typescript
import { apiClient } from '@/api';

// GET 요청
const posts = await apiClient.get<Post[]>('/posts');

// POST 요청
const newPost = await apiClient.post<Post>('/posts', {
  title: '새 게시글',
  content: '내용',
});

// PUT 요청
const updatedPost = await apiClient.put<Post>(`/posts/${id}`, {
  title: '수정된 제목',
});

// DELETE 요청
await apiClient.delete(`/posts/${id}`);
```

### 데모: 게시글 CRUD

```typescript
import { apiClient } from '@/api';
import { Post } from '@/types';

// 1. 게시글 목록 조회
async function getPosts() {
  try {
    const posts = await apiClient.get<Post[]>('/posts');
    console.log('게시글 목록:', posts);
    return posts;
  } catch (error) {
    console.error('게시글 조회 실패:', error);
    throw error;
  }
}

// 2. 게시글 상세 조회
async function getPost(postId: string) {
  const post = await apiClient.get<Post>(`/posts/${postId}`);
  return post;
}

// 3. 게시글 작성
async function createPost(data: { title: string; content: string }) {
  const newPost = await apiClient.post<Post>('/posts', data);
  console.log('생성된 게시글:', newPost);
  return newPost;
}

// 4. 게시글 수정
async function updatePost(postId: string, data: Partial<Post>) {
  const updated = await apiClient.put<Post>(`/posts/${postId}`, data);
  return updated;
}

// 5. 게시글 삭제
async function deletePost(postId: string) {
  await apiClient.delete(`/posts/${postId}`);
  console.log('게시글 삭제 완료');
}
```

### 파일 업로드

```typescript
import { apiClient } from '@/api';

async function uploadImage(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const result = await apiClient.upload<{ url: string }>(
    '/upload/image',
    formData,
    (progress) => {
      const percent = (progress.loaded / progress.total!) * 100;
      console.log(`업로드 진행률: ${percent.toFixed(2)}%`);
    }
  );

  return result.url;
}

// 사용 예시
const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
const file = fileInput.files?.[0];

if (file) {
  const imageUrl = await uploadImage(file);
  console.log('업로드된 이미지 URL:', imageUrl);
}
```

---

## 쿼리 빌더 사용법

복잡한 쿼리 파라미터를 체이닝 방식으로 쉽게 생성할 수 있습니다.

### 기본 사용

```typescript
import { createQuery, apiClient } from '@/api';
import { Post, PaginatedResponse } from '@/types';

// 쿼리 빌더로 파라미터 생성
const query = createQuery()
  .page(1)
  .pageSize(20)
  .sort('createdAt', 'desc')
  .search('React')
  .filter('category', 'tech')
  .filter('status', 'published')
  .build();

// API 호출
const response = await apiClient.get<PaginatedResponse<Post>>('/posts', {
  params: query,
});

console.log('게시글:', response.items);
console.log('총 페이지:', response.meta.totalPages);
```

### 데모: 게시글 검색 및 필터링

```typescript
import { createQuery, apiClient } from '@/api';

async function searchPosts(options: {
  search?: string;
  category?: string;
  author?: string;
  page?: number;
  sortBy?: 'latest' | 'popular';
}) {
  const query = createQuery()
    .page(options.page || 1)
    .pageSize(20);

  // 검색어가 있으면 추가
  if (options.search) {
    query.search(options.search);
  }

  // 카테고리 필터
  if (options.category) {
    query.filter('category', options.category);
  }

  // 작성자 필터
  if (options.author) {
    query.filter('author', options.author);
  }

  // 정렬
  if (options.sortBy === 'latest') {
    query.sort('createdAt', 'desc');
  } else if (options.sortBy === 'popular') {
    query.sort('viewCount', 'desc');
  }

  const params = query.build();

  const response = await apiClient.get('/posts', { params });
  return response;
}

// 사용 예시
const results = await searchPosts({
  search: 'React',
  category: 'tech',
  page: 1,
  sortBy: 'latest',
});
```

### 날짜 범위 필터

```typescript
const query = createQuery()
  .dateRange('createdAt', '2024-01-01', '2024-12-31')
  .build();

// 결과: { createdAtFrom: '2024-01-01', createdAtTo: '2024-12-31' }
```

### 배열 파라미터

```typescript
const query = createQuery()
  .array('tags', ['react', 'typescript', 'vite'])
  .build();

// 결과: { tags: 'react,typescript,vite' }
```

### 쿼리 스트링으로 변환

```typescript
const query = createQuery()
  .page(1)
  .pageSize(20)
  .search('React')
  .toString();

// 결과: "page=1&pageSize=20&search=React"
```

---

## React Query와 함께 사용하기

### 설정 (이미 완료됨)

`src/lib/queryClient.ts`에 QueryClient가 설정되어 있습니다.

```typescript
import { queryClient } from '@/lib/queryClient';
// 또는
import { QueryClientProvider } from '@tanstack/react-query';
```

### useQuery 사용

```typescript
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api';
import { Post } from '@/types';

function PostList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['posts'],
    queryFn: () => apiClient.get<Post[]>('/posts'),
  });

  if (isLoading) return <div>로딩 중...</div>;
  if (error) return <div>에러 발생: {error.message}</div>;

  return (
    <ul>
      {data?.map((post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  );
}
```

### useMutation 사용

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api';

function CreatePostForm() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (newPost: { title: string; content: string }) =>
      apiClient.post('/posts', newPost),
    onSuccess: () => {
      // 게시글 목록 쿼리 무효화 (자동 새로고침)
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      title: '새 게시글',
      content: '내용',
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* 폼 필드 */}
      <button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? '작성 중...' : '게시'}
      </button>
      {mutation.isError && <div>에러: {mutation.error.message}</div>}
    </form>
  );
}
```

### 데모: 페이지네이션이 있는 게시글 목록

```typescript
import { useQuery } from '@tanstack/react-query';
import { createQuery, apiClient } from '@/api';
import { Post, PaginatedResponse } from '@/types';
import { useState } from 'react';

function PaginatedPosts() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['posts', page, search],
    queryFn: async () => {
      const params = createQuery()
        .page(page)
        .pageSize(10)
        .search(search)
        .sort('createdAt', 'desc')
        .build();

      return apiClient.get<PaginatedResponse<Post>>('/posts', { params });
    },
  });

  return (
    <div>
      <input
        type="text"
        placeholder="검색..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {isLoading ? (
        <div>로딩 중...</div>
      ) : (
        <>
          <ul>
            {data?.items.map((post) => (
              <li key={post.id}>{post.title}</li>
            ))}
          </ul>

          <div>
            <button
              disabled={!data?.meta.hasPrevious}
              onClick={() => setPage((p) => p - 1)}
            >
              이전
            </button>
            <span>
              {page} / {data?.meta.totalPages}
            </span>
            <button
              disabled={!data?.meta.hasNext}
              onClick={() => setPage((p) => p + 1)}
            >
              다음
            </button>
          </div>
        </>
      )}
    </div>
  );
}
```

---

## 타입 정의

### API 응답 타입

```typescript
// 표준 API 응답
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp?: string;
}

// 에러 응답
interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  timestamp?: string;
}

// 페이지네이션 응답
interface PaginatedResponse<T> {
  items: T[];
  meta: PaginationMeta;
}

interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}
```

### 사용 예시

```typescript
import { Post, PaginatedResponse, ApiResponse } from '@/types';

// 단일 게시글
const post: Post = await apiClient.get<Post>(`/posts/${id}`);

// 게시글 목록 (페이지네이션)
const response: PaginatedResponse<Post> = await apiClient.get<PaginatedResponse<Post>>('/posts');

// 응답 전체 (필요한 경우)
const fullResponse: ApiResponse<Post> = await axiosInstance.get(`/posts/${id}`).then(res => res.data);
```

---

## 에러 처리

### try-catch 방식

```typescript
import { apiClient } from '@/api';

async function getPost(id: string) {
  try {
    const post = await apiClient.get(`/posts/${id}`);
    return post;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      // Axios 에러
      console.error('상태 코드:', error.response?.status);
      console.error('에러 메시지:', error.response?.data?.error?.message);
    } else {
      // 기타 에러
      console.error('알 수 없는 에러:', error);
    }
    throw error;
  }
}
```

### React Query 에러 처리

```typescript
const { data, error } = useQuery({
  queryKey: ['post', id],
  queryFn: () => apiClient.get(`/posts/${id}`),
  retry: 1, // 실패 시 1번 재시도
  onError: (error) => {
    console.error('게시글 조회 실패:', error);
    // 토스트 알림 등
  },
});

if (error) {
  return <div>에러가 발생했습니다: {error.message}</div>;
}
```

### 전역 에러 핸들러

API 클라이언트에 이미 다음이 구현되어 있습니다:

- **401 Unauthorized**: 자동 토큰 갱신 시도
- **403 Forbidden**: 권한 없음 처리
- **500 Internal Server Error**: 서버 에러 처리

---

## 인증 관련

### 로그인

```typescript
import { apiClient } from '@/api';

async function login(email: string, password: string) {
  const response = await apiClient.post<{
    accessToken: string;
    refreshToken: string;
    user: User;
  }>('/auth/login', { email, password });

  // 토큰 저장 (자동으로 모든 요청에 포함됨)
  localStorage.setItem('accessToken', response.accessToken);
  localStorage.setItem('refreshToken', response.refreshToken);
  localStorage.setItem('user', JSON.stringify(response.user));

  return response;
}
```

### 로그아웃

```typescript
async function logout() {
  // 서버에 로그아웃 요청 (선택사항)
  await apiClient.post('/auth/logout');

  // 로컬 스토리지 정리
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');

  // 로그인 페이지로 이동
  window.location.href = '/login';
}
```

---

## 고급 사용법

### 커스텀 헤더 추가

```typescript
const data = await apiClient.get('/posts', {
  headers: {
    'X-Custom-Header': 'value',
  },
});
```

### 요청 타임아웃 변경

```typescript
const data = await apiClient.get('/posts', {
  timeout: 5000, // 5초
});
```

### Axios 인스턴스 직접 사용

```typescript
import { axiosInstance } from '@/api';

// 더 세밀한 제어가 필요한 경우
const response = await axiosInstance.get('/posts', {
  // Axios의 모든 옵션 사용 가능
  transformResponse: [(data) => {
    // 응답 변환 로직
    return JSON.parse(data);
  }],
});
```

---

## 요약

### 간단한 CRUD

```typescript
// 조회
const posts = await apiClient.get<Post[]>('/posts');
const post = await apiClient.get<Post>(`/posts/${id}`);

// 생성
const newPost = await apiClient.post<Post>('/posts', data);

// 수정
const updated = await apiClient.put<Post>(`/posts/${id}`, data);
const patched = await apiClient.patch<Post>(`/posts/${id}`, partialData);

// 삭제
await apiClient.delete(`/posts/${id}`);
```

### 쿼리 빌더

```typescript
const query = createQuery()
  .page(1)
  .pageSize(20)
  .search('검색어')
  .filter('category', 'tech')
  .sort('createdAt', 'desc')
  .build();
```

### React Query

```typescript
// 조회
const { data } = useQuery({
  queryKey: ['posts'],
  queryFn: () => apiClient.get('/posts'),
});

// 변경
const mutation = useMutation({
  mutationFn: (data) => apiClient.post('/posts', data),
  onSuccess: () => queryClient.invalidateQueries(['posts']),
});
```

---

## 추가 리소스

- [Axios 공식 문서](https://axios-http.com/docs/intro)
- [React Query 공식 문서](https://tanstack.com/query/latest)
- [TypeScript 공식 문서](https://www.typescriptlang.org/docs/)

## 문의

API 관련 문제나 개선 제안이 있으시면 GitHub Issues에 등록해주세요.
