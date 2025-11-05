# API 연동 가이드

프론트엔드 API 연동 구조 및 사용법 가이드입니다.

---

## 📁 디렉토리 구조

```
src/
├── api/
│   ├── client.ts          # Axios 인스턴스 및 요청/응답 헬퍼
│   └── endpoints.ts       # API 엔드포인트 상수 정의
│
├── types/
│   ├── api.ts            # API 공통 타입 (Response, Pagination 등)
│   ├── user.ts           # 사용자 관련 타입
│   ├── post.ts           # 게시글 관련 타입
│   ├── comment.ts        # 댓글 관련 타입
│   └── index.ts          # 타입 통합 export
│
├── services/
│   ├── postService.ts    # 게시글 API 호출 함수
│   └── commentService.ts # 댓글 API 호출 함수
│
├── hooks/
│   └── api/
│       ├── usePost.ts    # 게시글 React Query 훅
│       ├── useComment.ts # 댓글 React Query 훅
│       └── index.ts      # 훅 통합 export
│
└── lib/
    └── queryClient.ts    # React Query 설정
```

---

## 🚀 시작하기

### 1. 환경변수 설정

`.env` 파일에서 API Base URL을 설정하세요:

```env
# API 설정
VITE_API_BASE_URL=http://localhost:8080/api/v1
VITE_API_TIMEOUT=10000

# 환경 설정
VITE_ENV=development
```

### 2. 의존성

이미 설치된 패키지:
- `@tanstack/react-query` - 서버 상태 관리
- `axios` - HTTP 클라이언트

---

## 🔧 핵심 컴포넌트

### 1. API 클라이언트 (`src/api/client.ts`)

Axios 기반 HTTP 클라이언트로, 모든 API 요청을 처리합니다.

**주요 기능:**
- ✅ 자동 인증 토큰 추가 (Authorization Header)
- ✅ 토큰 만료 시 자동 갱신 (Refresh Token)
- ✅ 에러 처리 (401, 403, 500 등)
- ✅ 타입 안전한 요청/응답

**사용 예시:**
```typescript
import { apiClient } from "@/api/client";

// GET 요청
const posts = await apiClient.get<Post[]>("/posts");

// POST 요청
const newPost = await apiClient.post<Post>("/posts", { title, content });

// PUT 요청
const updated = await apiClient.put<Post>(`/posts/${id}`, { title });

// DELETE 요청
await apiClient.delete(`/posts/${id}`);

// 파일 업로드
const formData = new FormData();
formData.append("file", file);
const uploaded = await apiClient.upload("/attachments/upload", formData);
```

---

### 2. 엔드포인트 상수 (`src/api/endpoints.ts`)

모든 API 경로를 중앙에서 관리합니다.

**사용 예시:**
```typescript
import { POST_ENDPOINTS, COMMENT_ENDPOINTS } from "@/api/endpoints";

// 게시글 목록
const url = POST_ENDPOINTS.LIST; // "/posts"

// 게시글 상세
const url = POST_ENDPOINTS.DETAIL("123"); // "/posts/123"

// 게시글 좋아요
const url = POST_ENDPOINTS.LIKE("123"); // "/posts/123/like"

// 댓글 목록
const url = COMMENT_ENDPOINTS.LIST("123"); // "/posts/123/comments"
```

---

### 3. 서비스 레이어 (`src/services/`)

API 호출 로직을 캡슐화한 순수 함수들입니다.

**게시글 서비스 예시:**
```typescript
import { postService } from "@/services/postService";

// 게시글 목록 조회
const posts = await postService.getPosts({ page: 1, pageSize: 20 });

// 게시글 상세 조회
const post = await postService.getPost("123");

// 게시글 생성
const newPost = await postService.createPost({
  title: "제목",
  content: "내용",
  category: "일반",
});

// 게시글 수정
const updated = await postService.updatePost("123", { title: "수정된 제목" });

// 게시글 삭제
await postService.deletePost("123");

// 좋아요
const result = await postService.likePost("123");

// 좋아요 취소
const result = await postService.unlikePost("123");
```

**댓글 서비스 예시:**
```typescript
import { commentService } from "@/services/commentService";

// 댓글 목록 조회
const comments = await commentService.getComments({
  postId: "123",
  page: 1,
  pageSize: 50,
});

// 댓글 작성
const newComment = await commentService.createComment({
  postId: "123",
  content: "댓글 내용",
});

// 댓글 삭제
await commentService.deleteComment("456");
```

---

### 4. React Query 훅 (`src/hooks/api/`)

컴포넌트에서 바로 사용할 수 있는 데이터 fetching 훅입니다.

#### **게시글 조회 (Query)**

```typescript
import { usePosts, usePost } from "@/hooks/api";

// 게시글 목록
function PostList() {
  const { data, isLoading, error } = usePosts({ page: 1, pageSize: 20 });

  if (isLoading) return <div>로딩 중...</div>;
  if (error) return <div>에러 발생</div>;

  return (
    <ul>
      {data.items.map(post => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  );
}

// 게시글 상세
function PostDetail({ postId }: { postId: string }) {
  const { data: post, isLoading, error } = usePost(postId);

  if (isLoading) return <div>로딩 중...</div>;
  if (error) return <div>에러 발생</div>;

  return (
    <article>
      <h1>{post.title}</h1>
      <p>{post.content}</p>
    </article>
  );
}
```

#### **게시글 변경 (Mutation)**

```typescript
import { useCreatePost, useUpdatePost, useDeletePost, useLikePost } from "@/hooks/api";

function PostActions() {
  // 생성
  const createMutation = useCreatePost({
    onSuccess: (newPost) => {
      console.log("게시글 생성됨:", newPost);
    },
  });

  const handleCreate = () => {
    createMutation.mutate({
      title: "제목",
      content: "내용",
    });
  };

  // 수정
  const updateMutation = useUpdatePost({
    onSuccess: (updated) => {
      console.log("게시글 수정됨:", updated);
    },
  });

  const handleUpdate = (postId: string) => {
    updateMutation.mutate({
      postId,
      data: { title: "수정된 제목" },
    });
  };

  // 삭제
  const deleteMutation = useDeletePost({
    onSuccess: () => {
      console.log("게시글 삭제됨");
    },
  });

  const handleDelete = (postId: string) => {
    deleteMutation.mutate(postId);
  };

  // 좋아요 (낙관적 업데이트)
  const likeMutation = useLikePost();

  const handleLike = (postId: string, isLiked: boolean) => {
    likeMutation.mutate({ postId, isLiked });
  };

  return (
    <div>
      <button onClick={handleCreate} disabled={createMutation.isPending}>
        게시글 생성
      </button>
      <button onClick={() => handleUpdate("123")} disabled={updateMutation.isPending}>
        게시글 수정
      </button>
      <button onClick={() => handleDelete("123")} disabled={deleteMutation.isPending}>
        게시글 삭제
      </button>
      <button onClick={() => handleLike("123", false)} disabled={likeMutation.isPending}>
        좋아요
      </button>
    </div>
  );
}
```

#### **댓글 조회 및 변경**

```typescript
import { useComments, useCreateComment, useDeleteComment } from "@/hooks/api";

function CommentSection({ postId }: { postId: string }) {
  const [text, setText] = useState("");

  // 댓글 목록 조회
  const { data: commentsData, isLoading } = useComments({
    postId,
    page: 1,
    pageSize: 50,
  });

  // 댓글 생성
  const createMutation = useCreateComment({
    onSuccess: () => setText(""),
  });

  // 댓글 삭제
  const deleteMutation = useDeleteComment();

  const handleSubmit = () => {
    createMutation.mutate({ postId, content: text });
  };

  const handleDelete = (commentId: string) => {
    deleteMutation.mutate({ commentId, postId });
  };

  if (isLoading) return <div>로딩 중...</div>;

  const comments = commentsData?.items || [];

  return (
    <div>
      <input value={text} onChange={(e) => setText(e.target.value)} />
      <button onClick={handleSubmit} disabled={createMutation.isPending}>
        댓글 작성
      </button>

      {comments.map(comment => (
        <div key={comment.id}>
          <p>{comment.content}</p>
          <button onClick={() => handleDelete(comment.id)}>삭제</button>
        </div>
      ))}
    </div>
  );
}
```

---

## 🎯 타입 시스템

### 공통 타입

```typescript
// API 응답 래퍼
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// 페이지네이션 응답
interface PaginatedResponse<T> {
  items: T[];
  meta: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

// 페이지네이션 파라미터
interface PaginationParams {
  page?: number;
  pageSize?: number;
  sort?: string;
  order?: "asc" | "desc";
}
```

### 게시글 타입

```typescript
// 게시글 상세
interface Post {
  id: string;
  title: string;
  content: string;
  author: UserProfile;
  category?: string;
  tags?: string[];
  viewCount: number;
  likeCount: number;
  commentCount: number;
  attachments?: Attachment[];
  isPinned?: boolean;
  isLiked?: boolean;
  createdAt: string;
  updatedAt: string;
}

// 게시글 생성 요청
interface CreatePostRequest {
  title: string;
  content: string;
  category?: string;
  tags?: string[];
  attachmentIds?: string[];
}

// 게시글 수정 요청
interface UpdatePostRequest {
  title?: string;
  content?: string;
  category?: string;
  tags?: string[];
  attachmentIds?: string[];
}
```

### 댓글 타입

```typescript
// 댓글
interface Comment {
  id: string;
  postId: string;
  content: string;
  author: UserProfile;
  parentId?: string | null;
  likeCount?: number;
  isLiked?: boolean;
  replies?: Comment[];
  replyCount?: number;
  createdAt: string;
  updatedAt: string;
}

// 댓글 생성 요청
interface CreateCommentRequest {
  postId: string;
  content: string;
  parentId?: string | null;
}
```

---

## 🔐 인증 시스템

### 토큰 저장 위치

- **Access Token**: `localStorage.getItem("accessToken")`
- **Refresh Token**: `localStorage.getItem("refreshToken")`
- **사용자 정보**: `localStorage.getItem("user")`

### 자동 토큰 갱신

API 클라이언트는 자동으로 다음을 처리합니다:

1. 모든 요청에 `Authorization: Bearer {accessToken}` 헤더 추가
2. 401 응답 시 Refresh Token으로 새 Access Token 발급
3. 토큰 갱신 성공 시 원래 요청 재시도
4. 토큰 갱신 실패 시 자동 로그아웃

**로그아웃 처리:**
```typescript
// src/api/client.ts의 handleLogout 함수 참고
function handleLogout() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
  // window.location.href = "/login";
}
```

---

## 📊 캐싱 전략

React Query의 기본 설정 (`src/lib/queryClient.ts`):

```typescript
{
  staleTime: 1000 * 60 * 5,        // 5분 (fresh 상태 유지)
  gcTime: 1000 * 60 * 10,          // 10분 (캐시 메모리 유지)
  retry: 1,                         // 실패 시 1번 재시도
  refetchOnWindowFocus: false,      // 윈도우 포커스 시 자동 리패치 비활성화
}
```

### Query Key 구조

```typescript
// 게시글
["posts"]                                    // 모든 게시글 관련
["posts", "list"]                           // 게시글 목록
["posts", "list", { page: 1, pageSize: 20 }] // 특정 파라미터의 게시글 목록
["posts", "detail"]                         // 게시글 상세
["posts", "detail", "123"]                  // 특정 게시글 상세

// 댓글
["comments"]                                 // 모든 댓글 관련
["comments", "list", { postId: "123" }]      // 특정 게시글의 댓글 목록
["comments", "detail", "456"]                // 특정 댓글 상세
["comments", "replies", "456"]               // 특정 댓글의 대댓글
```

### 캐시 무효화

```typescript
import { useQueryClient } from "@tanstack/react-query";

function MyComponent() {
  const queryClient = useQueryClient();

  // 특정 게시글 캐시 무효화
  queryClient.invalidateQueries({ queryKey: ["posts", "detail", "123"] });

  // 모든 게시글 목록 캐시 무효화
  queryClient.invalidateQueries({ queryKey: ["posts", "list"] });

  // 모든 게시글 관련 캐시 무효화
  queryClient.invalidateQueries({ queryKey: ["posts"] });
}
```

---

## 🛠 추가 기능 구현 가이드

### 1. 새로운 API 엔드포인트 추가

#### **Step 1: 타입 정의**
```typescript
// src/types/calendar.ts
export interface CalendarEvent {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  description?: string;
}

export interface CreateEventRequest {
  title: string;
  startDate: string;
  endDate: string;
  description?: string;
}
```

#### **Step 2: 엔드포인트 추가**
```typescript
// src/api/endpoints.ts
export const CALENDAR_ENDPOINTS = {
  EVENTS: "/calendar/events",
  EVENT_DETAIL: (eventId: string) => `/calendar/events/${eventId}`,
  CREATE: "/calendar/events",
  UPDATE: (eventId: string) => `/calendar/events/${eventId}`,
  DELETE: (eventId: string) => `/calendar/events/${eventId}`,
} as const;
```

#### **Step 3: 서비스 함수 작성**
```typescript
// src/services/calendarService.ts
import { apiClient } from "@/api/client";
import { CALENDAR_ENDPOINTS } from "@/api/endpoints";
import { CalendarEvent, CreateEventRequest } from "@/types";

export async function getEvents(): Promise<CalendarEvent[]> {
  return apiClient.get<CalendarEvent[]>(CALENDAR_ENDPOINTS.EVENTS);
}

export async function createEvent(data: CreateEventRequest): Promise<CalendarEvent> {
  return apiClient.post<CalendarEvent, CreateEventRequest>(CALENDAR_ENDPOINTS.CREATE, data);
}

export const calendarService = {
  getEvents,
  createEvent,
};
```

#### **Step 4: React Query 훅 작성**
```typescript
// src/hooks/api/useCalendar.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { calendarService } from "@/services/calendarService";
import { CalendarEvent, CreateEventRequest } from "@/types";

export const CALENDAR_QUERY_KEYS = {
  all: ["calendar"] as const,
  events: () => [...CALENDAR_QUERY_KEYS.all, "events"] as const,
};

export function useEvents() {
  return useQuery<CalendarEvent[]>({
    queryKey: CALENDAR_QUERY_KEYS.events(),
    queryFn: calendarService.getEvents,
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();

  return useMutation<CalendarEvent, Error, CreateEventRequest>({
    mutationFn: calendarService.createEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CALENDAR_QUERY_KEYS.events() });
    },
  });
}
```

#### **Step 5: 컴포넌트에서 사용**
```typescript
// src/pages/CAL_11.tsx
import { useEvents, useCreateEvent } from "@/hooks/api/useCalendar";

function CalendarPage() {
  const { data: events, isLoading } = useEvents();
  const createMutation = useCreateEvent();

  const handleCreate = () => {
    createMutation.mutate({
      title: "새 이벤트",
      startDate: "2025-01-01",
      endDate: "2025-01-02",
    });
  };

  if (isLoading) return <div>로딩 중...</div>;

  return (
    <div>
      <button onClick={handleCreate}>이벤트 생성</button>
      {events?.map(event => (
        <div key={event.id}>{event.title}</div>
      ))}
    </div>
  );
}
```

---

## 🐛 디버깅

### React Query DevTools 설치 (선택사항)

```bash
npm install @tanstack/react-query-devtools
```

```typescript
// src/main.tsx
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

<QueryClientProvider client={queryClient}>
  <RouterProvider router={router} />
  <ReactQueryDevtools initialIsOpen={false} />
</QueryClientProvider>
```

### 네트워크 요청 확인

브라우저 개발자 도구 > Network 탭에서:
- 요청 URL 확인
- Request Headers (Authorization 토큰 포함 여부)
- Request Payload (요청 데이터)
- Response (응답 데이터 또는 에러)

### 에러 로그

API 클라이언트는 자동으로 다음을 콘솔에 출력합니다:
- 403 에러: "접근 권한이 없습니다."
- 500 에러: "서버 에러가 발생했습니다."
- 토큰 갱신 실패: "로그아웃 처리됨 - 로그인 페이지로 이동 필요"

---

## 📝 체크리스트

### 백엔드 연동 전

- [ ] `.env` 파일에서 `VITE_API_BASE_URL` 설정
- [ ] 백엔드 팀과 API 스펙 확인 (요청/응답 형식)
- [ ] 타입 정의가 백엔드 스펙과 일치하는지 확인

### 백엔드 연동 후

- [ ] 네트워크 탭에서 요청/응답 확인
- [ ] 에러 응답 형식이 `ApiError` 타입과 일치하는지 확인
- [ ] 토큰 갱신 로직 테스트 (401 응답 시)
- [ ] 로딩 상태 UI 확인
- [ ] 에러 상태 UI 확인

---

## 🎉 완료!

이제 API 연동 준비가 완료되었습니다!

**구현된 기능:**
- ✅ 게시글 CRUD (생성, 조회, 수정, 삭제)
- ✅ 게시글 좋아요/좋아요 취소
- ✅ 댓글 CRUD
- ✅ 페이지네이션
- ✅ 자동 토큰 갱신
- ✅ 낙관적 업데이트 (좋아요)
- ✅ 캐싱 및 자동 리패칭

**다음 단계:**
1. 백엔드 API 서버 실행
2. `.env`에서 Base URL 설정
3. 브라우저에서 `/boards/123` 접속
4. React Query DevTools로 캐싱 상태 확인

궁금한 점이 있으면 이 가이드를 참고하세요! 🚀
