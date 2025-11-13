# 📋 ReadOur Front - TODO & Roadmap

> **Last Updated:** 2025-11-13
> **Current Status:** 캘린더 API 연동 완료, JWT 인증 시스템 구현 예정, 시연 시나리오 중심 개발

---

## 🎯 진행 중 (In Progress)

- [ ] JWT 토큰 인증 시스템 구현 (Access Token만 사용)
- [ ] 시연 시나리오 중심 개발 (18일 목표)
- [ ] 커뮤니티 UI 완성 (18일 목표)

---

## 📌 최우선 (Top Priority - 시연 시나리오 중심)

### 🔐 인증 시스템 (Authentication) ⚠️ CRITICAL
- [ ] **JWT 토큰 인증 시스템**
  - [ ] userId → token으로 변경
  - [ ] Access Token만 사용 (Refresh Token 제외)
  - [ ] 로그아웃 시 로컬 스토리지 토큰 삭제
  - [ ] JWT 시큐리티 연동 (현재는 꺼진 상태)
- [ ] **로그인 페이지 (LOG_02)**
  - [x] 로그인 폼 UI
  - [ ] 로그인 API 연동 (Access Token 발급)
  - [ ] 토큰 저장 및 관리
- [ ] **회원가입 페이지 (REG_03)**
  - [x] 회원가입 폼 UI
  - [ ] 이메일 = ID (중복체크 필수)
  - [ ] 닉네임 중복체크
  - [ ] 이메일 변경 불가 처리
  - [ ] 회원가입 API 연동
- [ ] **계정 관리**
  - [ ] 아이디 찾기 (닉네임 + 생년월일)
  - [ ] 비밀번호 찾기 (이메일 + 닉네임 + 생일) → 임시 비밀번호 발송
  - [ ] 비밀번호 변경
  - [ ] 회원 탈퇴

### 📌 메인페이지 개선
- [ ] **메인페이지 구성**
  - [ ] 인기 게시글
  - [ ] 모임 모집 게시글
  - [ ] 인기 도서

## 📌 우선순위 높음 (High Priority)

### 📝 게시판 개선 (Board Improvements)
- [ ] **게시글 상세 (BRD_05) 개선**
  - [x] 태그 부분 개선 (spoiler 방지 영역에서 보여주기)
  - [ ] 조회수 무차별적 증가 수정 (IP/세션 기반 중복 방지) -> back하고 상의 필요
  - [ ] **조회수 증가 API 분리 및 연결** ⚠️ 현재 백엔드 GET 시 자동 증가
    - [x] API 분리됨 (postService.ts:70-72, endpoints.ts:39)
    - [ ] 프론트엔드 연결 (BRD_05.tsx:7, 128-130 주석 해제 및 호출)
- [ ] **게시글 작성/수정 (BRD_06) 개선**
  - [x] 태그 작성 방식 개선 (text → tag 형식)
  - [x] 태그 입력 영역 UI 개선 (Tag Input Component)
  - [ ] 태그 자동완성 기능
- [ ] **게스트 기능 제한**
  - [ ] 게스트 댓글 작성 제한
  - [ ] 게스트 기타 작성 제한
- [ ] **모임/모집 게시글**
  - [ ] 카테고리 변경 시 수정 막기 (박살 방지)
- [ ] **독후감 기능**
  - [ ] 독후감에 책 ID 작성 기능 추가

### 👤 사용자 기능 (User Features)
- [ ] **마이페이지 (MYB_14)**
  - [x] 프로필 조회
  - [x] 프로필 수정 (닉네임, 프로필 이미지)
  - [ ] 북마크 → 좋아요로 변경
  - [ ] 내가 작성한 댓글 목록
  - [ ] 내가 작성한 게시글 목록
  - [ ] 나와 관련된 책 관련 게시글
  - [ ] 비밀번호 변경
- [ ] 프로필 페이지 (PRF_10)
  - [ ] 작성한 글 목록

### 🚨 신고 및 관리
- [ ] **신고 시스템**
  - [ ] 신고 접수 기능
  - [ ] 신고 조회 기능

### 📚 내서재 기능 (Library)
- [ ] **도서 검색과 내서재 분리**
  - [ ] 도서 검색 페이지 독립
  - [ ] 내서재 페이지 독립
- [ ] **책 검색 기능 (BOS_16)**
  - [x] 책 검색 페이지 UI
  - [ ] 외부 API 연동 (알라딘/교보문고 등)
  - [x] 검색 결과 표시
  - [ ] 내서재에 책 추가
- [x] **책 소개 글 (BOD_15)**
  - [x] 책 상세 정보 페이지
  - [x] 책 소개, 저자, 출판사 정보
  - [x] 독자 리뷰/평점
  - [x] ✅ 하이라이트, 작가, 출판사명 모두 구현됨 (BOD_15.tsx:168-170, 174-199)
  - [ ] 대출 가능 여부 표시 (설정의 선호 도서관 기준)
- [ ] **하이라이트(명대사) 기능**
  - [ ] 마음에 드는 한 줄 저장
  - [ ] 인용구 및 페이지 번호 기록
- [ ] **내서재 페이지 기본 구조**
  - [x] 책 목록 조회
  - [ ] 책 추가/삭제
  - [ ] 읽은 책/읽고 있는 책/읽을 책 분류
  - [ ] 위시리스트 전체보기 추가
- [ ] 책 상세 페이지
  - [ ] 책 정보 표시
  - [ ] 독서 노트 작성
  - [ ] 북마크 기능
- [ ] **제외 예정**
  - ❌ 모임 게시글 관련
  - ❌ 도서 추가 (모임 관련)
  - ❌ 모임 관련 게시글

### ⚙️ 설정 페이지 (SET_13)
- [ ] 설정 페이지 기본 구조
- [ ] 선호 도서관 설정 (대출 가능 여부 판단 기준)
- [ ] 다크모드 토글 UI 구현
  - [ ] 토글 스위치 컴포넌트
  - [ ] data-theme 전환 로직
  - [ ] localStorage에 테마 저장
- [ ] 알림 설정
- [ ] 개인정보 설정

### 🔔 알림 기능
- [ ] **알림 시스템**
  - [ ] 알림 조회
  - [ ] 알림 삭제

---

## 📌 중간 우선순위 (Medium Priority)

### 🤖 AI 어시스턴트 (AI_09)
- [ ] AI 어시스턴트 페이지 구조
- [ ] AI API 연동
- [ ] 채팅 UI (ChatDock 활용)
- [ ] 대화 히스토리 저장

### 📅 캘린더 (CAL_11)
- [x] **일정 CRUD 기능** ✅ 완료
  - [x] 일정 조회 (월별 고정)
  - [x] 일정 생성
  - [x] 일정 수정 (팝오버 내 인라인 수정)
  - [x] 일정 삭제
- [x] **팝오버 UI** ✅ 완료
  - [x] 날짜 클릭 시 일정 목록 팝오버
  - [x] 팝오버 드래그 기능
  - [x] 인라인 수정 (title, description, startsAt, endsAt)
- [x] **API 연동** ✅ 완료
  - [x] GET /calendar/events (일정 조회)
  - [x] POST /calendar/events (일정 생성)
  - [x] PUT /calendar/events/:eventId (일정 수정)
  - [x] DELETE /calendar/events/:eventId (일정 삭제)
  - [x] X-User-Id 헤더 인증
  - [x] userId === -1 (게스트) 시 로그인 요구
- [ ] **일정 생성 scope 처리**
  - [ ] 채팅방에서 일정 생성 시 scope: ROOM
  - [ ] 이후 개인이 수정 가능하도록 (scope: USER)
  - ⚠️ GLOBAL scope는 사용하지 않음
- [ ] 일정 알림 기능

### 💬 댓글/채팅 개선
- [ ] 댓글 대댓글 기능
- [ ] 댓글 좋아요/신고
- [ ] **채팅 기능**
  - [x] 채팅방 목록 API 연동 (CHT_17)
  - [x] ChatDock 채팅방 목록 API 연동
  - [x] ChatDock 메시지 로드 기능
  - [ ] 핀 토글 기능 백엔드 API 연동
  - [ ] **메시지 전송** (HTTP POST)
  - [ ] **실시간 채팅** (WebSocket으로 수신)
    - [ ] 채팅방 입장 시 WebSocket 연결
    - [ ] 메시지 실시간 수신
    - [ ] WebSocket 응용
  - [ ] 실시간 업데이트 (React Query 캐시 무효화)
  - [ ] userId 동적 로딩 (로그인 연동)
  - [ ] 읽음/안읽음 표시
  - [ ] **메시지 가리기/열람** (구현됐으나 안되면 제외)

### 🔍 검색 기능
- [x] 게시글 검색
- [ ] 필터링 (카테고리, 태그, 날짜)
- [ ] 검색 자동완성
- [ ] 검색 결과 하이라이트
- [ ] **카테고리 && 제목 동시 검색** ⚠️ 부분 구현
  - [x] UI에서 카테고리+검색어 전달 (BRD_04.tsx:85)
  - [ ] SearchPostsParams에 category 타입 추가 필요 (postService.ts:82-88)
  - [ ] searchPosts 함수에서 category API 전달 필요 (postService.ts:149)

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
  - [x] 기본 UI 구조
  - [x] 채팅방 목록 API 연동
  - [x] 메시지 로드 기능

### 게시판 기능
- [x] 게시글 목록 (BRD_04)
- [x] 게시글 상세 (BRD_05)
- [x] 게시글 작성/수정 (BRD_06)
- [x] 게시글 삭제
- [x] 댓글 조회/작성/삭제

### 채팅 기능
- [x] 채팅방 목록 페이지 (CHT_17)
  - [x] 채팅방 목록 API 연동 (getRoomsOverview)
  - [x] 카테고리별 필터링 (1:1, 단체, 모임)
  - [x] 검색 기능
- [x] ChatDock API 연동
  - [x] 내 채팅방 목록 조회 (getMyRooms)
  - [x] 채팅방 메시지 조회 (getRoomMessages)
  - [x] 백엔드 응답 → UI 형식 변환

### 캘린더
- [x] 캘린더 페이지 기본 구조 (CAL_11)
- [x] 캘린더 API 연동 완료
- [x] 일정 CRUD 완료
- [x] 팝오버 UI 및 드래그 기능 완료
- [x] 인라인 수정 기능 완료

---

## 🗂️ 페이지 ID 매핑

| 경로 | 페이지 ID | 상태 |
|------|----------|------|
| `/` | BRD_04 (게시판 목록) | ✅ 완료 |
| `/boards` | BRD_04 (게시판 목록) | ✅ 완료 |
| `/boards/write` | BRD_06 (게시글 작성) | ✅ 완료 |
| `/boards/:postId` | BRD_05 (게시글 상세) | ✅ 완료 |
| `/boards/:postId/edit` | BRD_06 (게시글 수정) | ✅ 완료 |
| `/calendar` | CAL_11 (캘린더) | ✅ 완료 (API 연동, CRUD, 팝오버) |
| `/chat` | CHT_17 (채팅방 목록) | ✅ 완료 |
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

### JWT 인증 시스템
- [ ] **JWT 토큰 구조**
  - Access Token만 사용 (Refresh Token 사용 안함)
  - 로그인 시 id, password로 Access Token 발급
  - 토큰을 로컬 스토리지에 저장
  - API 요청 시 토큰을 헤더에 포함
  - 로그아웃 시 로컬 스토리지에서 토큰 삭제
- [ ] **JWT 시큐리티**
  - 현재: 시큐리티 꺼진 상태 (테스트 가능)
  - 향후: 시큐리티 켜면 권한 확인 후 로직 실행
  - Access Token 인증 필요
- [ ] **userId → token 마이그레이션**
  - 모든 API에서 userId 대신 token 사용
  - AuthContext 업데이트 필요

### 시연 및 개발 우선순위
- [ ] **시연 시나리오 중심**
  - 최종 시나리오 선정 후 집중 개발
  - 시연으로 못 보여주는 부분은 PPT로 설명
  - 세세한 기능은 시간 남으면 구현
- [ ] **커뮤니티 UI 완성 목표: 18일**

### Scope 설계
- [ ] **일정 생성 scope**
  - 채팅방에서 일정 생성: scope = ROOM
  - 개인이 수정 시: scope = USER
  - ⚠️ GLOBAL scope는 사용하지 않음

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
