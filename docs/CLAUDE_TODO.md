# 🤖 Claude 작업 체크리스트

> **세션 시작:** 2025-11-17
> **브랜치:** `claude/review-codebase-018kxQ852QRdx6FQEDjiYZ86`
> **목적:** TODO.md 기반 API 연동 작업 진행 및 추적

---

## ✅ 완료된 작업

### 2025-11-17: 마이페이지 & 내서재 API 연동

#### 1. 마이페이지 API 연동
- [x] **타입 정의** (`src/types/user.ts`)
  - [x] `MyPagePreview` 인터페이스 생성
  - [x] `userId` 타입을 `string` → `number`로 수정
  - [x] 구조를 stats 필드 → 배열(`myPosts[]`, `myComments[]`, `likedPosts[]`)로 변경
  - [x] 실제 백엔드 응답 형식에 맞춰 수정 완료

- [x] **엔드포인트 추가** (`src/api/endpoints.ts`)
  - [x] `USER_ENDPOINTS.MY_PAGE = "/my-page"` 추가

- [x] **서비스 레이어** (`src/services/userService.ts`)
  - [x] `getMyPage()` 함수 구현
  - [x] `apiClient.get<MyPagePreview>()` 호출

- [x] **React Query 훅** (`src/hooks/api/useUser.ts`)
  - [x] `USER_QUERY_KEYS.myPage()` 추가
  - [x] `useMyPage()` 훅 구현

- [x] **페이지 연동** (`src/pages/PRF_10.tsx`)
  - [x] Mock 데이터 제거
  - [x] `useMyPage()` 훅 사용
  - [x] 실제 API 데이터로 UI 렌더링
  - [x] 로딩 및 에러 상태 처리

**연관 TODO.md 항목:**
- [ ] Line 146-147: 내 마이페이지 조회 (백엔드 완료) → 프론트엔드 API 연동

---

#### 2. 내 서재 리뷰 목록 API 연동
- [x] **타입 정의** (`src/types/book.ts`)
  - [x] `MyLibraryReview` 인터페이스 생성
  - [x] `MyLibraryReviewsResponse` 인터페이스 생성
  - [x] Spring Page 형식 (`SpringPage<MyLibraryReview>`) 사용
  - [x] 실제 백엔드 응답에 맞춰 `bookname`, `bookImageUrl` 필드 사용

- [x] **엔드포인트 추가** (`src/api/endpoints.ts`)
  - [x] `LIBRARY_ENDPOINTS.MY_REVIEWS = "/my-library/reviews"` 추가

- [x] **서비스 레이어** (`src/services/bookService.ts`)
  - [x] `getMyReviews(params?)` 함수 구현
  - [x] 페이지네이션 파라미터 처리 (`page`, `size`, `sort`)
  - [x] 기본값: `page: 0, size: 10, sort: "createdAt,DESC"`

- [x] **React Query 훅** (`src/hooks/api/useBook.ts`)
  - [x] `BOOK_QUERY_KEYS.myReviews(params)` 추가
  - [x] `useMyReviews(params?)` 훅 구현

- [x] **페이지 연동** (`src/pages/MYB_14.tsx`)
  - [x] `useMyReviews()` 훅 사용
  - [x] 리뷰 목록 렌더링 (`reviewedBooks`)
  - [x] 책 이미지 및 제목 표시
  - [x] 로딩 및 빈 상태 처리

**연관 TODO.md 항목:**
- [ ] Line 196-197: 내 서재 조회 (백엔드 완료) → 프론트엔드 API 연동
- [ ] Line 204-212: 책 리뷰 (백엔드 완료) → 프론트엔드 API 연동

---

#### 3. 게시글 좋아요 기능 확인
- [x] **기존 구현 확인**
  - [x] `src/services/postService.ts`: `likePost()`, `unlikePost()` 함수 존재 확인
  - [x] `src/hooks/api/usePost.ts`: `useLikePost()` 훅 존재 확인 (낙관적 업데이트 포함)
  - [x] `src/pages/BRD_05.tsx`: `handleLike()` 함수 및 버튼 연결 확인

- [x] **결과**
  - ✅ 이미 완전히 구현되어 있음
  - ✅ API 레이어, React Query 훅, UI 연결 모두 완료
  - ✅ 낙관적 업데이트 및 에러 핸들링 구현됨

**연관 TODO.md 항목:**
- [ ] Line 126-127: 게시글 좋아요 (백엔드 완료) → 프론트엔드 API 연동 (실제로는 이미 완료됨)

---

## 📋 대기 중인 작업 (TODO.md 기반)

### 🔐 인증 시스템
- [ ] 로그인 - JWT 발급 API 연동 (Line 78-80)
- [ ] 로그아웃 - Access Token 삭제 구현 (Line 82-83)
- [ ] 회원가입 API 연동 (Line 90-91)
- [ ] 이메일 중복 검사 API 연동 (Line 86-88)
- [ ] 닉네임 중복 검사 API 연동 (Line 88-89)
- [ ] 아이디(이메일) 찾기 API 연동 (Line 94-96)
- [ ] 비밀번호 찾기 - 임시 비밀번호 발급 API 연동 (Line 96-98)
- [ ] 로그인 사용자의 비밀번호 변경 API 연동 (Line 98-99)

### 📝 게시판
- [x] **게시글 좋아요 프론트엔드 연동** (Line 126-127) ✅ **완료**
  - ✅ `postService.likePost()`, `unlikePost()` 이미 구현됨
  - ✅ `usePost.useLikePost()` 훅 이미 구현됨 (낙관적 업데이트 포함)
  - ✅ `BRD_05.tsx` 버튼 연결 완료
- [ ] 게시글 조회수 증가 프론트엔드 연결 (Line 125)
  - API는 분리되어 있음 (`postService.ts:70-72`)
  - `BRD_05.tsx:7, 128-130` 주석 해제 및 호출 필요

### 👤 마이페이지
- [x] **내 마이페이지 조회 API 연동** (Line 146-147) ✅ **완료**
  - ✅ `MyPagePreview` 타입 정의 완료
  - ✅ `getMyPage()` 서비스 함수 구현
  - ✅ `useMyPage()` 훅 구현
  - ✅ `PRF_10.tsx` 페이지 연동 완료
- [ ] 좋아요 누른 글 조회 API 연동 (Line 148-149, 페이징)
- [ ] 내가 작성한 게시글 목록 API 연동 (Line 150-151, 페이징)
- [ ] 내가 작성한 댓글 목록 API 연동 (Line 152-153, 페이징)
- [ ] 특정 사용자 마이페이지 조회 API 연동 (Line 157-158)
- [ ] 특정 사용자 작성 게시글 조회 API 연동 (Line 159-160)
- [ ] 특정 사용자 좋아요 누른 글 조회 API 연동 (Line 161-162)
- [ ] 특정 사용자 작성 댓글 조회 API 연동 (Line 163-164)

### 📚 내서재
- [x] **내 서재 리뷰 조회 API 연동** (Line 196-197, 205-206) ✅ **완료**
  - ✅ `MyLibraryReview`, `MyLibraryReviewsResponse` 타입 정의
  - ✅ `getMyReviews()` 서비스 함수 구현 (페이지네이션)
  - ✅ `useMyReviews()` 훅 구현
  - ✅ `MYB_14.tsx` 페이지 연동 완료
- [ ] 도서 검색 (외부 API) 프론트엔드 연동 (Line 177-178)
- [ ] 도서 상세 조회 (DB 저장) 프론트엔드 연동 (Line 186-187)
- [ ] DB 도서 상세 정보 조회 프론트엔드 연동 (Line 188-189)
- [ ] 책 연관 게시글 목록 조회 프론트엔드 연동 (Line 190-191)
- [ ] 선호 도서관 대출 가능 여부 조회 프론트엔드 연동 (Line 192-194)
- [ ] 위시리스트 조회 프론트엔드 연동 (Line 199-200)
- [ ] 도서 위시리스트 토글 프론트엔드 연동 (Line 201-202)
- [ ] 책 리뷰 작성 프론트엔드 연동 (Line 207-208)
- [ ] 책 리뷰 수정 프론트엔드 연동 (Line 209-210)
- [ ] 책 리뷰 삭제 프론트엔드 연동 (Line 211-212)
- [ ] 책 하이라이트 조회 프론트엔드 연동 (Line 214-215)
- [ ] 책 하이라이트 작성 프론트엔드 연동 (Line 216-217)
- [ ] 책 하이라이트 수정 프론트엔드 연동 (Line 218-219)
- [ ] 책 하이라이트 삭제 프론트엔드 연동 (Line 220-221)
- [ ] 특정 사용자 서재 조회 프론트엔드 연동 (Line 227-228)
- [ ] 특정 사용자 위시리스트 조회 프론트엔드 연동 (Line 229-230)
- [ ] 특정 사용자 리뷰 조회 프론트엔드 연동 (Line 231-232)
- [ ] 특정 사용자 하이라이트 조회 프론트엔드 연동 (Line 233-234)

### ⚙️ 설정 페이지
- [ ] 사용자 선호 도서관 목록 조회 프론트엔드 연동 (Line 247-248)
- [ ] 사용자 선호 도서관 등록 프론트엔드 연동 (Line 249-250)
- [ ] 선호 도서관 등록을 위한 도서관 검색 프론트엔드 연동 (Line 251-252)
- [ ] 사용자 선호 도서관 삭제 프론트엔드 연동 (Line 253-254)
- [ ] 광역시/도 (대분류) 목록 조회 프론트엔드 연동 (Line 256-257)
- [ ] 시/군/구 (세부) 목록 조회 프론트엔드 연동 (Line 258-259)
- [ ] 이름으로 지역 검색 프론트엔드 연동 (Line 260-261)

### 📁 파일 관리
- [ ] 파일 업로드 프론트엔드 연동 (Line 276-277)
- [ ] 파일 메타데이터 조회 프론트엔드 연동 (Line 278-279)
- [ ] 파일 다운로드 프론트엔드 연동 (Line 280-281)

### 💬 채팅
- [ ] 채팅방 개설 프론트엔드 연동 (Line 328-329)
- [ ] 채팅방 목록 프론트엔드 연동 (Line 330-331)
- [ ] 내 채팅방 목록 조회 프론트엔드 연동 (Line 332-333)
- [ ] 채팅방 참여 프론트엔드 연동 (Line 334-335)
- [ ] 방 나가기 프론트엔드 연동 (Line 336-337)
- [ ] 채팅방 일괄 나가기 프론트엔드 연동 (Line 338-339)
- [ ] 채팅방 강퇴 프론트엔드 연동 (Line 340-341)
- [ ] 방 폭파 프론트엔드 연동 (Line 342-343)
- [ ] 채팅방 멤버 프로필 조회 프론트엔드 연동 (Line 344-345)
- [ ] 채팅방 핀 설정 프론트엔드 연동 (Line 347-348)
- [ ] 채팅방 핀 해제 프론트엔드 연동 (Line 349-350)
- [ ] 채팅 메시지 타임라인 조회 프론트엔드 연동 (Line 352-353)
- [ ] 채팅 메시지 전송 프론트엔드 연동 (Line 354-355)
- [ ] 채팅 파일 메시지 전송 프론트엔드 연동 (Line 356-357)
- [ ] 채팅 메시지 가리기 프론트엔드 연동 (Line 358-359)
- [ ] 채팅 메시지 가리기 해제 프론트엔드 연동 (Line 360-361)
- [ ] 채팅 투표 생성 프론트엔드 연동 (Line 363-364)
- [ ] 채팅 투표 참여 또는 수정 프론트엔드 연동 (Line 365-366)
- [ ] 채팅 투표 결과 조회 프론트엔드 연동 (Line 367-368)

---

## 📝 작업 노트

### 중요한 교훈
1. **항상 실제 백엔드 API 응답 형식을 먼저 확인**
   - 타입 정의 전에 `curl` 또는 실제 응답 예시를 요청
   - ID 타입 (`string` vs `number`) 주의
   - 중첩 객체 vs 평면 필드 구조 확인

2. **이미 구현된 기능인지 먼저 확인**
   - TODO.md 체크 상태만 믿지 말고 실제 코드 검토
   - 서비스 레이어 → 훅 → 페이지 순서로 확인
   - 불필요한 재작업 방지

3. **체계적인 작업 순서**
   - 타입 정의 → 엔드포인트 → 서비스 → 훅 → 페이지 연동
   - 각 단계마다 실제 백엔드 응답 형식 확인

---

## 🔗 참고 문서

- [TODO.md](./TODO.md) - 전체 프로젝트 로드맵 및 백엔드 API 완료 상태
- [API 사용 가이드](./API_USAGE.md)
- [엔드포인트 사용 가이드](./ENDPOINT_USAGE_GUIDE.md)
