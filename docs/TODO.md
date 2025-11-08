# 📋 ReadOur Front - TODO & Roadmap

> **Last Updated:** 2025-11-05
> **Current Status:** 게시판 CRUD 완료, 페이지 구현 단계

---

## 🎯 진행 중 (In Progress)

- [ ] 프로젝트 구조 문서화

---

## 📌 우선순위 높음 (High Priority)

### 📝 게시판 개선 (Board Improvements)
- [ ] **게시글 상세 (BRD_05) 개선**
  - [x] 태그 부분 개선 (spoiler 방지 영역에서 보여주기)
  - [ ] 조회수 무차별적 증가 수정 (IP/세션 기반 중복 방지) -> back하고 상의 필요
- [ ] **게시글 작성/수정 (BRD_06) 개선**
  - [x] 태그 작성 방식 개선 (text → tag 형식)
  - [x] 태그 입력 영역 UI 개선 (Tag Input Component)
  - [ ] 태그 자동완성 기능

### 🔐 인증 시스템 (Authentication)
- [ ] 로그인 페이지 구현 (LOG_02)
  - [x] 로그인 폼 UI
  - [ ] 로그인 API 연동
  - [ ] 토큰 저장 및 관리
  - [ ] 소셜 로그인 (선택)
- [ ] 회원가입 페이지 구현 (REG_03)
  - [x] 회원가입 폼 UI
  - [ ] 유효성 검증 (이메일, 비밀번호 보안 -> 백에서 처리, 포맷 맞는지 체크) 
  - [ ] 회원가입 API 연동
- [ ] 인증 가드 구현
  - [ ] ProtectedRoute 컴포넌트
  - [ ] 로그인 상태 관리 (Context/Zustand)
  - [ ] 자동 로그아웃 (토큰 만료 시)

### 👤 사용자 기능 (User Features)
- [ ] 마이페이지 (MYB_14)
  - [x] 프로필 조회
  - [x] 프로필 수정 (닉네임, 프로필 이미지)
  - [ ] 내가 쓴 글/댓글 목록
  - [ ] 비밀번호 변경
- [ ] 프로필 페이지 (PRF_10)
  - [ ] 작성한 글 목록

### 📚 내서재 기능 (Library)
- [ ] **책 검색 기능 (BOS_16)**
  - [x] 책 검색 페이지 UI
  - [ ] 외부 API 연동 (알라딘/교보문고 등)
  - [x] 검색 결과 표시
  - [ ] 내서재에 책 추가
- [x] **책 소개 글 (BOD_15)**
  - [x] 책 상세 정보 페이지
  - [x] 책 소개, 저자, 출판사 정보
  - [x] 독자 리뷰/평점
- [ ] 내서재 페이지 기본 구조
  - [x] 책 목록 조회
  - [ ] 책 추가/삭제
  - [ ] 읽은 책/읽고 있는 책/읽을 책 분류
- [ ] 책 상세 페이지
  - [ ] 책 정보 표시
  - [ ] 독서 노트 작성
  - [ ] 북마크 기능

### ⚙️ 설정 페이지 (SET_13)
- [ ] 설정 페이지 기본 구조
- [ ] 다크모드 토글 UI 구현
  - [ ] 토글 스위치 컴포넌트
  - [ ] data-theme 전환 로직
  - [ ] localStorage에 테마 저장
- [ ] 알림 설정
- [ ] 개인정보 설정

---

## 📌 중간 우선순위 (Medium Priority)

### 🤖 AI 어시스턴트 (AI_09)
- [ ] AI 어시스턴트 페이지 구조
- [ ] AI API 연동
- [ ] 채팅 UI (ChatDock 활용)
- [ ] 대화 히스토리 저장

### 📅 캘린더 개선 (CAL_11)
- [ ] 일정 CRUD 기능
- [ ] 일정 알림 기능
- [ ] 캘린더 뷰 개선 (월/주/일)

### 💬 댓글/채팅 개선
- [ ] 댓글 대댓글 기능
- [ ] 댓글 좋아요/신고
- [ ] 실시간 채팅 (WebSocket)
- [ ] 읽음/안읽음 표시

### 🔍 검색 기능
- [ ] 게시글 검색
- [ ] 필터링 (카테고리, 태그, 날짜)
- [ ] 검색 자동완성
- [ ] 검색 결과 하이라이트
- [ ] **보류: 카테고리 && 제목 동시 검색**

---

## 📌 낮은 우선순위 (Low Priority)

### 🎨 UI/UX 개선
- [ ] 로딩 스켈레톤 UI
- [ ] 애니메이션 개선
- [ ] 반응형 디자인 보완
- [ ] 접근성 개선 (ARIA 레이블, 키보드 네비게이션)

### 🧪 테스트
- [ ] 단위 테스트 (utils, hooks)
- [ ] 컴포넌트 테스트 (React Testing Library)
- [ ] E2E 테스트 (Playwright/Cypress)
- [ ] API Mock 테스트

### 📊 성능 최적화
- [ ] 이미지 최적화 (lazy loading, WebP)
- [ ] 코드 스플리팅
- [ ] 번들 사이즈 분석 및 최적화
- [ ] React Query 캐싱 최적화

### 🚀 배포 및 인프라
- [ ] Vercel/Netlify 배포 설정
- [ ] CI/CD 파이프라인 (GitHub Actions)
- [ ] 환경변수 관리 (dev/staging/prod)
- [ ] 에러 모니터링 (Sentry)
- [ ] 분석 도구 연동 (GA4)

---

## ✅ 완료됨 (Completed)

### 기본 구조
- [x] 프로젝트 초기 설정 (Vite, React, TypeScript)
- [x] 라우팅 설정 (React Router v7)
- [x] 디자인 토큰 시스템 (tokens.css, globals.css, mixins.css)
- [x] API 클라이언트 설정 (axios, interceptors)
- [x] React Query 설정
- [x] Tailwind CSS 설정

### 공통 컴포넌트
- [x] Avatar
- [x] Badge
- [x] Button
- [x] Card
- [x] Checkbox
- [x] Divider
- [x] Icon
- [x] Input
- [x] Loading
- [x] Logo
- [x] Modal
- [x] RichTextEditor (TipTap)
- [x] Spinner
- [x] Switch
- [x] Toast
- [x] Tooltip

### 유틸리티 함수
- [x] classnames (cn, clsx)
- [x] date (formatDate, formatDateTime, formatRelativeTime)
- [x] string (truncate, capitalize, kebabToCamel, slugify)
- [x] storage (localStorage/sessionStorage helpers)
- [x] debounce/throttle
- [x] array (unique, groupBy, chunk, shuffle)
- [x] format (formatNumber, formatCurrency, formatFileSize)
- [x] validation (email, phone, password, credit card)

### 레이아웃
- [x] HeaderApp (전역 헤더)
- [x] ChatDock (채팅 독)

### 게시판 기능
- [x] 게시글 목록 (BRD_04)
- [x] 게시글 상세 (BRD_05)
- [x] 게시글 작성/수정 (BRD_06)
- [x] 게시글 삭제
- [x] 댓글 조회/작성/삭제

### 기타
- [x] 캘린더 페이지 기본 구조 (CAL_11)

---

## 🗂️ 페이지 ID 매핑

| 경로 | 페이지 ID | 상태 |
|------|----------|------|
| `/` | BRD_04 (게시판 목록) | ✅ 완료 |
| `/boards` | BRD_04 (게시판 목록) | ✅ 완료 |
| `/boards/write` | BRD_06 (게시글 작성) | ✅ 완료 |
| `/boards/:postId` | BRD_05 (게시글 상세) | ✅ 완료 |
| `/boards/:postId/edit` | BRD_06 (게시글 수정) | ✅ 완료 |
| `/calendar` | CAL_11 (캘린더) | 🚧 기본 구조만 |
| `/login` | LOG_02 (로그인) | ❌ 미구현 |
| `/register` | REG_03 (회원가입) | ❌ 미구현 |
| `/mypage` | MYB_14 (마이페이지) | ❌ 미구현 |
| `/profile/:userId` | PRF_10 (프로필) | ❌ 미구현 |
| `/library` | (내서재) | ❌ 미구현 |
| `/library/search` | BOS_16 (책 검색) | ❌ 미구현 |
| `/library/:bookId` | BOD_15 (책 소개) | ❌ 미구현 |
| `/settings` | SET_13 (설정) | ❌ 미구현 |
| `/assistant` | AI_09 (AI 어시스턴트) | ❌ 미구현 |

---

## 📝 컨벤션 체크리스트

작업 시 항상 확인:
- [ ] `var(--*)` 토큰 사용 (하드코딩 색상/간격 금지)
- [ ] 컴포넌트 파일은 PascalCase
- [ ] 유틸리티 함수는 camelCase
- [ ] 페이지 파일명은 `[기능약어]_[번호]` 형식
- [ ] `@/` 별칭 사용
- [ ] React Query 사용 시 적절한 query key 설정
- [ ] 타입 정의 (any 사용 지양)
- [ ] ESLint/Prettier 규칙 준수
- [ ] 커밋 메시지: `feat:`, `fix:`, `refactor:`, `docs:` 등

---

## 💡 아이디어 / 나중에 검토

- [ ] PWA 지원 (Service Worker, Offline)
- [ ] 다국어 지원 (i18n)
- [ ] 북마크/즐겨찾기 기능
- [ ] 글 임시저장 기능
- [ ] Markdown 편집기 옵션
- [ ] 태그 시스템
- [ ] 좋아요/추천 기능
- [ ] 알림 센터
- [ ] 활동 로그
- [ ] 통계/대시보드

---

## 🤔 고려사항 (Considerations)

### 데이터 저장 방식
- [ ] **HTML을 Markdown으로 저장**
  - 현재: TipTap (HTML 기반)
  - 검토: Markdown으로 변환하여 저장 후 렌더링 시 HTML로 변환
  - 장점: 데이터 크기 감소, 버전 관리 용이, 백엔드 부담 감소
  - 단점: 변환 로직 필요, 일부 서식 손실 가능성
  - 결정: 백엔드와 협의 필요

### 검색 기능 설계
- [ ] **카테고리 && 제목 동시 검색 (보류)**
  - 백엔드 API 지원 여부 확인 필요
  - 프론트엔드에서 다중 필터 UI 구현 가능
  - 쿼리 파라미터 설계: `?category=XXX&query=XXX`

---

## 🔗 관련 문서

- [API 사용 가이드](./API_USAGE.md)
- [API 커스터마이징 가이드](./API_CUSTOMIZATION_GUIDE.md)
- [API 플로우 설명](./API_FLOW_EXPLANATION.md)
- [엔드포인트 사용 가이드](./ENDPOINT_USAGE_GUIDE.md)
- [루트 README](../README.md)
