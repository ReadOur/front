# 프로젝트 구조 문서

## 📋 프로젝트 개요

React + TypeScript + Vite 기반의 모던 웹 애플리케이션입니다. TanStack Query를 사용한 서버 상태 관리와 Tailwind CSS를 활용한 스타일링이 특징입니다.

## 🛠 기술 스택

### Core
- **React** 19.1.1 - UI 라이브러리
- **TypeScript** 5.8.3 - 타입 안정성
- **Vite** 7.1.2 - 빌드 도구 및 개발 서버

### 상태 관리 & API
- **@tanstack/react-query** 5.90.6 - 서버 상태 관리
- **axios** 1.13.1 - HTTP 클라이언트
- **react-router-dom** 7.9.4 - 라우팅

### UI & 스타일링
- **Tailwind CSS** 4.1.14 - 유틸리티 기반 CSS 프레임워크
- **lucide-react** 0.546.0 - 아이콘 라이브러리
- **clsx** 2.1.1 - 클래스명 조건부 결합

### 리치 텍스트 에디터
- **@tiptap/react** 3.10.1 - 리치 텍스트 에디터 코어
- **@tiptap/starter-kit** 3.10.1 - 기본 확장 기능
- **@tiptap/extension-underline** 3.10.1 - 밑줄 기능
- **@tiptap/extension-link** 3.10.1 - 링크 기능
- **@tiptap/extension-placeholder** 3.10.1 - 플레이스홀더
- **dompurify** 3.3.0 - HTML 새니타이제이션

### 개발 도구
- **ESLint** 9.35.0 - 코드 린팅
- **Prettier** 3.6.2 - 코드 포매팅
- **Vitest** 3.2.4 - 테스트 프레임워크
- **@testing-library/react** 16.3.0 - React 컴포넌트 테스팅

## 📁 프로젝트 구조

```
/front
├── docs/                        # 프로젝트 문서
│   ├── AGENTS.md               # 에이전트 문서
│   ├── API_CUSTOMIZATION_GUIDE.md
│   ├── API_FLOW_EXPLANATION.md
│   ├── API_INTEGRATION_GUIDE.md
│   ├── API_USAGE.md
│   ├── API_UTILS_GUIDE.md
│   ├── ENDPOINT_USAGE_GUIDE.md
│   ├── TODO.md
│   └── PROJECT_STRUCTURE.md    # 이 문서
│
├── public/                      # 정적 리소스
│
├── src/
│   ├── api/                    # API 레이어
│   │   ├── client.ts          # Axios 클라이언트 설정
│   │   ├── endpoints.ts       # API 엔드포인트 정의
│   │   ├── index.ts           # API 내보내기
│   │   ├── posts.ts           # 게시물 API
│   │   ├── queryBuilder.ts    # 쿼리 빌더
│   │   └── transformers.ts    # 데이터 변환기
│   │
│   ├── assets/                 # 이미지, 폰트 등
│   │
│   ├── components/             # 재사용 가능한 컴포넌트
│   │   ├── Avatar/            # 아바타 컴포넌트
│   │   ├── Badge/             # 배지 컴포넌트
│   │   ├── Button/            # 버튼 컴포넌트
│   │   ├── Card/              # 카드 컴포넌트
│   │   ├── Checkbox/          # 체크박스 컴포넌트
│   │   ├── ConfirmModal/      # 확인 모달
│   │   ├── Divider/           # 구분선
│   │   ├── Icon/              # 아이콘 래퍼
│   │   ├── Input/             # 입력 필드
│   │   ├── Loading/           # 로딩 표시기
│   │   ├── Logo/              # 로고 컴포넌트
│   │   ├── Modal/             # 모달 컴포넌트
│   │   ├── RichTextEditor/    # 리치 텍스트 에디터
│   │   ├── Spinner/           # 스피너
│   │   ├── Switch/            # 스위치 토글
│   │   ├── TagInput/          # 태그 입력
│   │   ├── Toast/             # 토스트 알림
│   │   └── Tooltip/           # 툴팁
│   │
│   ├── contexts/               # React Context
│   │   └── ChatContext.tsx    # 채팅 컨텍스트
│   │
│   ├── features/               # 기능별 모듈
│   │   ├── layout/            # 레이아웃 관련
│   │   │   └── Header/        # 헤더 컴포넌트
│   │   │       └── HeaderApp.tsx
│   │   └── message/           # 메시지 관련
│   │       └── ChatDock.tsx   # 채팅 독
│   │
│   ├── hooks/                  # 커스텀 훅
│   │   └── api/               # API 관련 훅
│   │       ├── useChat.ts     # 채팅 훅
│   │       ├── usePost.ts     # 게시물 훅
│   │       └── useComment.ts  # 댓글 훅
│   │
│   ├── lib/                    # 외부 라이브러리 설정
│   │   └── queryClient.ts     # React Query 설정
│   │
│   ├── pages/                  # 페이지 컴포넌트
│   │   ├── HOM_01.tsx         # 홈
│   │   ├── LOG_02.tsx         # 로그인
│   │   ├── REG_03.tsx         # 회원가입
│   │   ├── BRD_04.tsx         # 게시판 목록
│   │   ├── BRD_05.tsx         # 게시글 상세
│   │   ├── BRD_06.tsx         # 게시글 작성/수정
│   │   ├── PRF_10.tsx         # 프로필
│   │   ├── CAL_11.tsx         # 캘린더
│   │   ├── SET_13.tsx         # 설정
│   │   ├── MYB_14.tsx         # 마이북
│   │   ├── BOD_15.tsx         # 북 상세
│   │   ├── CHT_17.tsx         # 채팅
│   │   ├── LibrarySearch.tsx  # 도서관 검색
│   │   └── ComponentsDemo.tsx # 컴포넌트 데모
│   │
│   ├── services/               # 비즈니스 로직
│   │   ├── authService.ts     # 인증 서비스
│   │   ├── postService.ts     # 게시물 서비스
│   │   ├── commentService.ts  # 댓글 서비스
│   │   └── chatService.ts     # 채팅 서비스
│   │
│   ├── style/                  # 전역 스타일
│   │
│   ├── types/                  # TypeScript 타입 정의
│   │   ├── api.ts             # API 타입
│   │   ├── chat.ts            # 채팅 타입
│   │   ├── comment.ts         # 댓글 타입
│   │   ├── post.ts            # 게시물 타입
│   │   ├── spring.ts          # Spring 백엔드 타입
│   │   ├── user.ts            # 사용자 타입
│   │   └── index.ts           # 타입 내보내기
│   │
│   ├── utils/                  # 유틸리티 함수
│   │   ├── array.ts           # 배열 유틸리티
│   │   ├── classnames.ts      # 클래스명 유틸리티
│   │   ├── date.ts            # 날짜 유틸리티
│   │   ├── debounce.ts        # 디바운스
│   │   ├── format.ts          # 포맷팅
│   │   ├── storage.ts         # 로컬 스토리지
│   │   ├── string.ts          # 문자열 유틸리티
│   │   ├── validation.ts      # 유효성 검사
│   │   └── index.ts           # 유틸리티 내보내기
│   │
│   ├── App.tsx                 # 메인 앱 컴포넌트
│   ├── ErrorBoundary.tsx       # 에러 경계
│   ├── main.tsx                # 애플리케이션 진입점
│   ├── setupTests.ts           # 테스트 설정
│   └── vite-env.d.ts           # Vite 환경 타입
│
├── .env.example                # 환경 변수 예시
├── .eslintrc.cjs              # ESLint 설정 (구버전)
├── .gitignore                 # Git 제외 파일
├── .prettierrc                # Prettier 설정
├── eslint.config.js           # ESLint 설정
├── index.html                 # HTML 진입점
├── package.json               # 프로젝트 의존성
├── postcss.config.js          # PostCSS 설정
├── tailwind.config.js         # Tailwind 설정
├── tsconfig.json              # TypeScript 설정
├── tsconfig.app.json          # 앱용 TS 설정
├── tsconfig.node.json         # Node용 TS 설정
└── vite.config.ts             # Vite 설정
```

## 🏗 아키텍처 패턴

### 1. 레이어드 아키텍처

프로젝트는 명확한 레이어 분리를 따릅니다:

```
┌─────────────────────────────────────┐
│      Presentation Layer             │
│  (Pages, Components, Features)      │
├─────────────────────────────────────┤
│      Business Logic Layer           │
│  (Services, Hooks)                  │
├─────────────────────────────────────┤
│      Data Access Layer              │
│  (API, QueryClient)                 │
├─────────────────────────────────────┤
│      Utility Layer                  │
│  (Utils, Types)                     │
└─────────────────────────────────────┘
```

### 2. 컴포넌트 구조

각 컴포넌트는 독립적인 디렉토리로 구성되어 있으며, 다음과 같은 파일을 포함합니다:
- `ComponentName.tsx` - 메인 컴포넌트
- `index.ts` - 내보내기
- 필요시 추가 파일 (스타일, 테스트 등)

### 3. 상태 관리

- **서버 상태**: TanStack Query (React Query)
  - API 데이터 캐싱 및 동기화
  - `hooks/api/` 디렉토리에 커스텀 훅으로 추상화

- **클라이언트 상태**: React Context
  - 전역 UI 상태 관리
  - `contexts/` 디렉토리에 컨텍스트 정의

### 4. API 통신

모든 API 통신은 `api/` 디렉토리를 통해 중앙화되어 관리됩니다:

1. `client.ts`: Axios 인스턴스 설정
2. `endpoints.ts`: API 엔드포인트 URL 정의
3. `transformers.ts`: 요청/응답 데이터 변환
4. `queryBuilder.ts`: 쿼리 스트링 생성
5. 서비스별 API 파일 (`posts.ts` 등)

자세한 내용은 `docs/API_*.md` 문서를 참조하세요.

## 📄 주요 페이지

| 페이지 | 파일명 | 설명 |
|--------|--------|------|
| 홈 | `HOM_01.tsx` | 메인 페이지 |
| 로그인 | `LOG_02.tsx` | 사용자 로그인 |
| 회원가입 | `REG_03.tsx` | 신규 사용자 등록 |
| 게시판 목록 | `BRD_04.tsx` | 게시글 목록 보기 |
| 게시글 상세 | `BRD_05.tsx` | 게시글 상세 보기 |
| 게시글 작성/수정 | `BRD_06.tsx` | 게시글 생성 및 편집 |
| 프로필 | `PRF_10.tsx` | 사용자 프로필 |
| 캘린더 | `CAL_11.tsx` | 일정 관리 |
| 설정 | `SET_13.tsx` | 사용자 설정 |
| 마이북 | `MYB_14.tsx` | 내 도서 관리 |
| 북 상세 | `BOD_15.tsx` | 도서 상세 정보 |
| 채팅 | `CHT_17.tsx` | 실시간 채팅 |
| 도서관 검색 | `LibrarySearch.tsx` | 도서 검색 |

## 🧩 재사용 가능한 컴포넌트

프로젝트는 다양한 재사용 가능한 UI 컴포넌트를 제공합니다:

### 기본 컴포넌트
- **Avatar**: 사용자 아바타 표시
- **Badge**: 상태 또는 카테고리 표시
- **Button**: 다양한 스타일의 버튼
- **Card**: 콘텐츠 카드
- **Checkbox**: 체크박스 입력
- **Divider**: 시각적 구분선
- **Icon**: Lucide 아이콘 래퍼
- **Input**: 텍스트 입력 필드
- **Logo**: 애플리케이션 로고
- **Switch**: 토글 스위치

### 고급 컴포넌트
- **ConfirmModal**: 확인 대화상자
- **Loading**: 로딩 인디케이터
- **Modal**: 범용 모달
- **RichTextEditor**: Tiptap 기반 리치 텍스트 에디터
- **Spinner**: 로딩 스피너
- **TagInput**: 태그 입력 컴포넌트
- **Toast**: 알림 메시지
- **Tooltip**: 도움말 툴팁

`ComponentsDemo.tsx` 페이지에서 모든 컴포넌트의 사용 예시를 확인할 수 있습니다.

## 🔧 유틸리티 함수

`utils/` 디렉토리는 다양한 헬퍼 함수를 제공합니다:

- **array.ts**: 배열 조작 유틸리티
- **classnames.ts**: CSS 클래스명 동적 결합
- **date.ts**: 날짜 포맷팅 및 조작
- **debounce.ts**: 함수 디바운싱
- **format.ts**: 데이터 포맷팅
- **storage.ts**: 로컬 스토리지 관리
- **string.ts**: 문자열 조작
- **validation.ts**: 입력 유효성 검사

## 🔒 타입 안정성

TypeScript를 활용하여 전체 애플리케이션의 타입 안정성을 보장합니다:

- `types/` 디렉토리에 모든 타입 정의가 중앙화되어 있습니다
- API 응답, 도메인 모델, 컴포넌트 props 등의 타입이 정의되어 있습니다
- `tsconfig.json`에서 엄격한 타입 검사가 활성화되어 있습니다

## 📜 스크립트

```json
{
  "dev": "vite",              // 개발 서버 실행
  "build": "vite build",      // 프로덕션 빌드
  "typecheck": "tsc --noEmit", // 타입 검사
  "lint": "eslint .",         // 코드 린팅
  "preview": "vite preview"   // 빌드 미리보기
}
```

## 🌐 개발 서버

```bash
npm run dev
```

기본적으로 `http://localhost:5173`에서 실행됩니다.

## 📚 관련 문서

- [API 통합 가이드](./API_INTEGRATION_GUIDE.md)
- [API 사용법](./API_USAGE.md)
- [API 흐름 설명](./API_FLOW_EXPLANATION.md)
- [API 커스터마이징 가이드](./API_CUSTOMIZATION_GUIDE.md)
- [API 유틸리티 가이드](./API_UTILS_GUIDE.md)
- [엔드포인트 사용 가이드](./ENDPOINT_USAGE_GUIDE.md)
- [에이전트 문서](./AGENTS.md)
- [할 일 목록](./TODO.md)

## 🤝 컨벤션

### 파일 명명 규칙
- 컴포넌트: PascalCase (예: `HeaderApp.tsx`)
- 유틸리티/서비스: camelCase (예: `authService.ts`)
- 페이지: 대문자_숫자 형식 (예: `LOG_02.tsx`) 또는 PascalCase

### 코드 스타일
- ESLint와 Prettier를 사용한 일관된 코드 스타일
- 함수형 컴포넌트와 Hooks 사용
- TypeScript strict mode 활성화

### 커밋 메시지
- 명확하고 설명적인 커밋 메시지 작성
- 기능, 버그 수정, 리팩토링 등을 구분

## 📝 추가 정보

이 문서는 프로젝트의 전반적인 구조를 이해하는 데 도움을 주기 위한 것입니다. 각 모듈과 컴포넌트의 상세한 사용법은 해당 디렉토리의 코드와 주석을 참조하세요.

---

*최종 업데이트: 2025-11-08*
