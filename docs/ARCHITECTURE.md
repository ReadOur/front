# 📐 ReadOur Front - 프로젝트 구조 및 아키텍처

> **Last Updated:** 2025-11-10
> **프로젝트**: ReadOur 프론트엔드 (독서 커뮤니티 플랫폼)

---

## 📁 프로젝트 폴더 구조

```
front/
├── src/
│   ├── api/              # API 클라이언트 및 엔드포인트
│   ├── assets/           # 정적 파일 (이미지, 폰트 등)
│   ├── components/       # 공통 UI 컴포넌트
│   ├── contexts/         # React Context (전역 상태)
│   ├── features/         # 기능별 컴포넌트 (layout 등)
│   ├── hooks/            # Custom Hooks
│   ├── lib/              # 외부 라이브러리 설정
│   ├── pages/            # 페이지 컴포넌트
│   ├── services/         # 비즈니스 로직 서비스
│   ├── style/            # 전역 스타일 (tokens, globals)
│   ├── types/            # TypeScript 타입 정의
│   ├── utils/            # 유틸리티 함수
│   ├── App.tsx           # 메인 앱 레이아웃 (헤더 포함)
│   └── main.tsx          # 엔트리 포인트 (라우터 설정)
├── docs/                 # 문서화
├── public/               # 정적 리소스
└── package.json
```

---

## 🏗️ 아키텍처 개요

### 기술 스택

- **프레임워크**: React 18 + TypeScript
- **빌드 도구**: Vite
- **상태 관리**:
  - React Query (서버 상태)
  - React Context (전역 클라이언트 상태: Auth, Chat, Theme)
- **라우팅**: React Router v7
- **스타일링**:
  - Tailwind CSS
  - CSS Variables (디자인 토큰 시스템)
- **폼/검증**: 자체 유효성 검증 유틸리티
- **HTTP 클라이언트**: Axios

---

## 📂 주요 디렉토리 상세 설명

### 1️⃣ `/src/api` - API 클라이언트

백엔드 API와 통신하는 레이어입니다.

```
api/
├── client.ts           # Axios 인스턴스 및 인터셉터 설정
├── posts.ts            # 게시글 관련 API
├── comments.ts         # 댓글 관련 API
├── auth.ts             # 인증 관련 API
└── chat.ts             # 채팅 관련 API
```

**특징:**
- Axios 인터셉터로 인증 토큰 자동 추가
- API 응답 자동 변환 (camelCase ↔ snake_case)
- 에러 처리 일원화

---

### 2️⃣ `/src/components` - 공통 UI 컴포넌트

재사용 가능한 UI 컴포넌트 라이브러리입니다.

```
components/
├── Avatar/             # 프로필 이미지
├── Badge/              # 뱃지 (HOT, NEW 등)
├── Button/             # 버튼
├── Card/               # 카드 컨테이너
├── Checkbox/           # 체크박스
├── ConfirmModal/       # 확인 모달
├── Divider/            # 구분선
├── Icon/               # 아이콘 (Lucide React)
├── Input/              # 입력 필드
├── Loading/            # 로딩 스피너
├── Modal/              # 모달
├── ProtectedRoute.tsx  # 로그인 인증 가드
├── RichTextEditor/     # TipTap 기반 에디터
├── Skeleton/           # 로딩 스켈레톤 UI
├── Spinner/            # 스피너
├── Switch/             # 토글 스위치
├── TagInput/           # 태그 입력 컴포넌트
├── Toast/              # 토스트 알림
└── Tooltip/            # 툴팁
```

**컴포넌트 원칙:**
- 각 컴포넌트는 독립적이고 재사용 가능
- `var(--*)` 디자인 토큰만 사용 (하드코딩 금지)
- Props 기반 커스터마이징

---

### 3️⃣ `/src/contexts` - 전역 상태 관리

React Context API를 사용한 전역 상태입니다.

```
contexts/
├── AuthContext.tsx     # 사용자 인증 상태 (로그인/로그아웃)
└── ChatContext.tsx     # 채팅 상태
```

**AuthContext:**
- 사용자 로그인 상태 관리
- `user`, `login()`, `logout()`, `isAuthenticated` 제공
- localStorage에 토큰 저장 (TODO)

---

### 4️⃣ `/src/features` - 기능별 컴포넌트

특정 기능을 담당하는 복합 컴포넌트입니다.

```
features/
├── layout/
│   └── Header/
│       ├── HeaderApp.tsx       # 메인 헤더
│       └── UserDropdown.tsx    # 유저 드롭다운 메뉴
└── message/
    └── ChatDock.tsx            # 채팅 독 (우측 하단)
```

---

### 5️⃣ `/src/hooks` - Custom Hooks

재사용 가능한 커스텀 훅입니다.

```
hooks/
├── api/                # React Query 기반 API 훅
│   ├── index.ts        # 통합 export
│   ├── usePosts.ts     # 게시글 관련 훅
│   ├── useComments.ts  # 댓글 관련 훅
│   └── useChat.ts      # 채팅 관련 훅
└── useDebounce.ts      # 디바운스 훅 (예시)
```

**API 훅 예시:**
- `usePosts()` - 게시글 목록 조회
- `usePost(id)` - 게시글 상세 조회
- `useCreatePost()` - 게시글 작성
- `useUpdatePost()` - 게시글 수정
- `useDeletePost()` - 게시글 삭제

---

### 6️⃣ `/src/pages` - 페이지 컴포넌트

각 라우트에 매핑되는 페이지 컴포넌트입니다.

**페이지 네이밍 규칙:** `[기능약어]_[번호].tsx`

```
pages/
├── BRD_04.tsx          # 게시판 목록
├── BRD_05.tsx          # 게시글 상세
├── BRD_06.tsx          # 게시글 작성/수정
├── BOD_15.tsx          # 책 소개 페이지
├── CAL_11.tsx          # 캘린더
├── CHT_17.tsx          # 채팅방 목록
├── FID_18.tsx          # 아이디/비밀번호 찾기
├── LibrarySearch.tsx   # 책 검색
├── LOG_02.tsx          # 로그인
├── MYB_14.tsx          # 내서재
├── PRF_10.tsx          # 프로필
├── REG_03.tsx          # 회원가입
└── SET_13.tsx          # 설정
```

---

### 7️⃣ `/src/services` - 비즈니스 로직

API 호출을 감싸는 비즈니스 로직 레이어입니다.

```
services/
├── authService.ts      # 인증 로직 (signup, login 등)
├── postService.ts      # 게시글 관련 서비스
└── chatService.ts      # 채팅 관련 서비스
```

---

### 8️⃣ `/src/style` - 스타일 시스템

```
style/
├── tokens.css          # 디자인 토큰 (색상, 간격, 폰트 등)
├── globals.css         # 전역 스타일
└── mixins.css          # CSS 믹스인
```

**디자인 토큰 시스템:**
- 모든 컴포넌트는 `var(--color-*)`, `var(--spacing-*)` 등 토큰 사용
- 하드코딩된 색상/크기 금지

---

### 9️⃣ `/src/utils` - 유틸리티 함수

공통 헬퍼 함수 모음입니다.

```
utils/
├── array.ts            # 배열 유틸 (unique, groupBy, chunk, shuffle)
├── classnames.ts       # cn, clsx (클래스네임 병합)
├── date.ts             # 날짜 포맷 (formatDate, formatRelativeTime)
├── debounce.ts         # 디바운스/쓰로틀
├── format.ts           # 숫자, 파일 크기 포맷
├── storage.ts          # localStorage/sessionStorage 헬퍼
├── string.ts           # 문자열 유틸 (truncate, capitalize, slugify)
└── validation.ts       # 유효성 검증 (이메일, 비밀번호, 전화번호 등)
```

---

## 🔄 데이터 플로우

### 1. API 호출 흐름

```
페이지 컴포넌트
    ↓ useQuery / useMutation
API 훅 (hooks/api/)
    ↓ 서비스 호출
서비스 레이어 (services/)
    ↓ API 클라이언트
API 클라이언트 (api/)
    ↓ Axios
백엔드 서버
```

### 2. 인증 플로우

```
로그인 폼 (LOG_02)
    ↓ handleSubmit
AuthContext.login()
    ↓ localStorage 저장
전역 상태 업데이트
    ↓ user != null
HeaderApp에서 UserDropdown 표시
```

### 3. 라우팅 구조

```
main.tsx (RouterProvider)
    ├── /login          (로그인 - 헤더 없음)
    ├── /register       (회원가입 - 헤더 없음)
    ├── /find           (아이디/비밀번호 찾기 - 헤더 없음)
    └── /               (App.tsx - 헤더 있음)
        ├── /boards             (게시판 목록)
        ├── /boards/write       (게시글 작성 - 로그인 필요 ✅)
        ├── /boards/:postId     (게시글 상세)
        ├── /calendar           (캘린더 - 로그인 필요 ✅)
        ├── /chat               (채팅 - 로그인 필요 ✅)
        ├── /library            (내서재 - 로그인 필요 ✅)
        ├── /mypage             (마이페이지 - 로그인 필요 ✅)
        └── /settings           (설정 - 로그인 필요 ✅)
```

**로그인 필요 페이지**: `<ProtectedRoute>` 컴포넌트로 감싸져 있습니다.

---

## 🎨 디자인 시스템

### CSS 변수 구조

```css
:root {
  /* 색상 */
  --color-primary: #f4a261;
  --color-secondary: #90be6d;
  --color-accent: #ffd166;
  --color-error: #e76f51;

  /* 배경 */
  --color-bg: #fff9f2;
  --color-bg-elev-1: #f5efe9;
  --color-bg-elev-2: #e9e5dc;

  /* 텍스트 */
  --color-fg-primary: #0f0f0f;
  --color-fg-muted: #6b6b6b;

  /* 간격 */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
}
```

---

## 🔐 인증 시스템

### ProtectedRoute

```tsx
<ProtectedRoute>
  <SomePage />
</ProtectedRoute>
```

- 비로그인 상태에서 접근 시 `/login`으로 리다이렉트
- 로그인 후 원래 가려던 페이지로 자동 복귀

### 로그인 검증 로직

1. `AuthContext`에서 `isAuthenticated` 체크
2. `user.id !== -1` && `user !== null`이면 로그인 상태
3. 비로그인 상태면 `<Navigate to="/login" />`

---

## 📝 컨벤션 및 베스트 프랙티스

### 1. 파일 네이밍

- **컴포넌트**: PascalCase (`Button.tsx`, `UserDropdown.tsx`)
- **유틸리티 함수**: camelCase (`validation.ts`, `debounce.ts`)
- **페이지**: `[기능약어]_[번호].tsx` (`BRD_04.tsx`, `LOG_02.tsx`)

### 2. 코드 스타일

- `var(--*)` 디자인 토큰 사용 (하드코딩 금지)
- `@/` 별칭 사용 (상대 경로 금지)
- TypeScript `any` 사용 지양
- ESLint + Prettier 규칙 준수

### 3. 커밋 메시지

```
feat: 새로운 기능 추가
fix: 버그 수정
refactor: 코드 리팩토링
docs: 문서 수정
style: 코드 스타일 변경 (포맷팅)
test: 테스트 코드
chore: 빌드 설정, 기타
```

---

## 🚀 향후 개선 계획

- [ ] 에러 바운더리 추가
- [ ] 코드 스플리팅 (React.lazy)
- [ ] PWA 지원
- [ ] E2E 테스트 (Playwright)
- [ ] 성능 최적화 (번들 크기 분석)

---

## 📚 관련 문서

- [API 사용 가이드](./API_USAGE.md)
- [TODO 및 로드맵](./TODO.md)
- [엔드포인트 가이드](./ENDPOINT_USAGE_GUIDE.md)
