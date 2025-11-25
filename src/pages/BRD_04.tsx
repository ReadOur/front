// src/pages/BRD_04.tsx
import React, { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getPosts, Post } from "@/api/posts";
import { searchPosts, SearchType } from "@/services/postService";
import { PostListSkeleton } from "@/components/Skeleton/Skeleton";

// 날짜 포맷 함수 (ISO -> yyyy.MM.dd)
function formatDate(dateString: string): string {
  const d = new Date(dateString);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

// 카테고리 정의
const CATEGORIES = [
  { key: "", label: "전체" },
  { key: "REVIEW", label: "리뷰" },
  { key: "DISCUSSION", label: "토의" },
  { key: "QUESTION", label: "질문" },
  { key: "FREE", label: "자유" },
  { key: "GROUP", label: "모임" },
] as const;

// 검색 타입 정의
const SEARCH_TYPES: Array<{ key: SearchType; label: string }> = [
  { key: "TITLE", label: "제목" },
  { key: "TITLE-CONTENT", label: "제목+내용" },
  { key: "USERNAME", label: "작성자" },
  { key: "BOOK_TITLE", label: "책제목" },
] as const;

// 카테고리 한글 변환 함수
function getCategoryLabel(category: string): string {
  const categoryMap: Record<string, string> = {
    FREE: "자유",
    NOTICE: "공지",
    QNA: "Q&A",
    REVIEW: "리뷰",
    GENERAL: "일반",
    DISCUSSION: "토의",
    QUESTION: "질문",
    GROUP: "모임",
  };
  return categoryMap[category] || category;
}

function calculateBadges(post: Post): { type: "hot" | "new" | "count"; value?: string | number }[] {
  const badges: { type: "hot" | "new" | "count"; value?: string | number }[] = [];
  if (post.commentCount && post.commentCount > 0) badges.push({ type: "count", value: post.commentCount });
  if ((post.likeCount ?? 0) >= 10) badges.push({ type: "hot" });
  const diffH = (Date.now() - new Date(post.createdAt).getTime()) / 36e5;
  if (diffH < 24) badges.push({ type: "new" });
  return badges;
}

export const BRD_List: React.FC = () => {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const page = Number(params.get("page") || 1);
  const category = params.get("category") || "";
  const searchQuery = params.get("search") || "";
  const searchTypeParam = (params.get("searchType") as SearchType) || "TITLE";
  const pageSize = 20;

  // 검색어 입력 상태 (실시간 입력용)
  const [searchInput, setSearchInput] = useState(searchQuery);

  // 검색 타입 상태
  const [searchType, setSearchType] = useState<SearchType>(searchTypeParam);

  // 메인 게시글 목록
  const { data, isLoading, error } = useQuery({
    queryKey: ["posts", page, pageSize, category, searchQuery, searchType],
    queryFn: async () => {
      // 검색어가 있으면 검색 API 사용
      if (searchQuery) {
        return searchPosts({
          type: searchType,
          keyword: searchQuery,
          page: page - 1, // searchPosts는 0부터 시작
          size: pageSize,
          sort: "createdAt,desc",
          ...(category ? {category} : {}),
        });
      }
      // 검색어가 없으면 일반 목록 조회
      return getPosts({
        page,
        size: pageSize,
        ...(category && { category }),
      });
    },
    staleTime: 1000 * 60 * 5,
  });


  const totalPages = useMemo(() => Math.max(1, data?.totalPages ?? 1), [data]);

  const goPage = (p: number) => {
    const np = Math.min(Math.max(1, p), totalPages);
    params.set("page", String(np));
    setParams(params, { replace: true });
  };

  // 카테고리 변경
  const handleCategoryChange = (newCategory: string) => {
    if (newCategory) {
      params.set("category", newCategory);
    } else {
      params.delete("category");
    }
    params.set("page", "1");
    setParams(params, { replace: true });
  };

  // 검색 실행
  const handleSearch = () => {
    if (searchInput.trim()) {
      params.set("search", searchInput.trim());
      params.set("searchType", searchType);
    } else {
      params.delete("search");
      params.delete("searchType");
    }
    params.set("page", "1");
    setParams(params, { replace: true });
  };

  // 필터 초기화
  const handleResetFilters = () => {
    setSearchInput("");
    setSearchType("TITLE");
    params.delete("category");
    params.delete("search");
    params.delete("searchType");
    params.set("page", "1");
    setParams(params, { replace: true });
  };

  if (isLoading) {
    return (
      <div className="animate-fadeIn">
        <PostListSkeleton count={10} />
      </div>
    );
  }

  // 공용 폭 컨테이너 (헤더 선과 리스트가 정확히 맞물리도록)
  // grid 정의: 헤더와 행 모두 동일하게 사용
  // 데스크톱: 7열, 태블릿: 4열, 모바일: 2열
  const gridCols = "grid-cols-2 sm:grid-cols-[1fr_auto_auto_auto] lg:grid-cols-[115px_115px_minmax(0,1fr)_80px_140px_145px_80px]";

  return (
    <div
      className="w-full min-h-screen pb-[40px]
      bg-[color:var(--color-bg-canvas)] text-[color:var(--color-fg-primary)]"
      style={{ fontFamily: "var(--font-sans, ui-sans-serif, system-ui)" }}
    >
      <div className="mx-auto px-3 sm:px-4 md:px-6 mt-[70px] sm:mt-[80px] md:mt-[90px] lg:mt-[100px]" style={{ maxWidth: "var(--layout-max, 1200px)" }}>
        {/* 카테고리 탭 네비게이션 */}
        <nav className="flex justify-center border-b border-[color:var(--color-border-subtle)] mb-4 sm:mb-6 overflow-x-auto scrollbar-hide">
          <ul className="flex items-stretch h-12 sm:h-14 md:h-16 font-medium text-[color:var(--color-fg-muted)] text-sm sm:text-base md:text-lg whitespace-nowrap">
            {CATEGORIES.map((cat, idx) => (
              <li key={cat.key} className="relative flex items-center px-3 sm:px-4 md:px-6">
                <button
                  onClick={() => handleCategoryChange(cat.key)}
                  className={[
                    "relative h-full flex items-center pb-1 cursor-pointer transition-colors duration-200",
                    category === cat.key
                      ? "text-[color:var(--color-fg-primary)] font-semibold"
                      : "hover:text-[color:var(--color-fg-primary)]",
                  ].join(" ")}
                >
                  {cat.label}
                  {category === cat.key && (
                    <span className="absolute -bottom-[1px] left-0 right-0 h-[2px] bg-[color:var(--color-fg-primary)]" />
                  )}
                </button>
                {idx < CATEGORIES.length - 1 && (
                  <span className="absolute right-0 top-1/2 -translate-y-1/2 h-4 w-px bg-[color:var(--color-border-subtle)]" />
                )}
              </li>
            ))}
          </ul>
        </nav>

        {/* 검색 및 액션바 */}
        <div className="py-3 sm:py-4 space-y-3 sm:space-y-4">
          {/* 검색/액션 섹션 */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            {/* 검색 입력 - 한 줄로 배치 */}
            <div className="flex-1 flex flex-row gap-2">
              {/* 검색 타입 선택 - 왼쪽 */}
              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value as SearchType)}
                className="w-[120px] md:w-[150px] h-[36px] sm:h-[40px] px-3 rounded-[var(--radius-md)] bg-[color:var(--color-bg-elev-1)] border border-[color:var(--color-border-subtle)] text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]"
                aria-label="검색 타입 선택"
              >
                {SEARCH_TYPES.map((type) => (
                  <option key={type.key} value={type.key}>
                    {type.label}
                  </option>
                ))}
              </select>

              {/* 검색어 입력 - 오른쪽 */}
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSearch();
                  }
                }}
                placeholder="게시글 검색..."
                className="flex-1 h-[36px] sm:h-[40px] px-3 rounded-[var(--radius-md)] bg-[color:var(--color-bg-elev-1)] border border-[color:var(--color-border-subtle)] text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]"
                aria-label="검색어 입력"
              />

              {/* 검색 버튼 */}
              <button
                onClick={handleSearch}
                className="h-[36px] sm:h-[40px] px-3 sm:px-4 rounded-[var(--radius-md)] bg-[color:var(--color-accent)] text-[color:var(--color-on-accent)] text-sm font-medium hover:opacity-90 whitespace-nowrap"
                aria-label="검색"
              >
                <span className="hidden sm:inline">🔍 검색</span>
                <span className="sm:hidden">🔍</span>
              </button>
            </div>

            {/* 액션 버튼 그룹 */}
            <div className="flex gap-2">
              {/* 검색 초기화 */}
              {searchQuery && (
                <button
                  onClick={handleResetFilters}
                  className="flex-1 sm:flex-none h-[36px] sm:h-[40px] px-3 sm:px-4 rounded-[var(--radius-md)] bg-[color:var(--color-bg-elev-2)] border border-[color:var(--color-border-subtle)] text-sm hover:bg-[color:var(--color-bg-elev-1)] whitespace-nowrap"
                  aria-label="검색 초기화"
                >
                  <span className="hidden sm:inline">검색 초기화</span>
                  <span className="sm:hidden">초기화</span>
                </button>
              )}

              {/* 모임모집 버튼 (전체 또는 모임 카테고리일 때 표시) */}
              {(category === "" || category === "GROUP") && (
                <button
                  className="flex-1 sm:flex-none h-[36px] sm:h-[40px] px-4 sm:px-5 rounded-[var(--radius-md)] bg-[color:var(--color-primary)] text-white text-sm font-medium hover:opacity-90 whitespace-nowrap"
                  onClick={() => navigate("/boards/write?category=GROUP")}
                  aria-label="모임모집"
                >
                  <span className="hidden sm:inline">📢 모임모집</span>
                  <span className="sm:hidden">📢 모임</span>
                </button>
              )}

              {/* 글 쓰기 버튼 */}
              <button
                className="flex-1 sm:flex-none h-[36px] sm:h-[40px] px-4 sm:px-5 rounded-[var(--radius-md)] bg-[color:var(--color-accent)] text-[color:var(--color-on-accent)] text-sm font-medium hover:opacity-90 whitespace-nowrap"
                onClick={() => navigate("/boards/write")}
                aria-label="글 쓰기"
              >
                <span className="hidden sm:inline">✏️ 글 쓰기</span>
                <span className="sm:hidden">✏️ 글쓰기</span>
              </button>
            </div>
          </div>

          {/* 현재 검색어 표시 */}
          {searchQuery && (
            <div className="flex items-center gap-2 text-xs sm:text-sm text-[color:var(--color-fg-muted)]">
              <span>검색:</span>
              <span className="px-2 py-1 rounded bg-[color:var(--color-bg-elev-2)] border border-[color:var(--color-border-subtle)] truncate">
                [{SEARCH_TYPES.find((t) => t.key === searchType)?.label}] "{searchQuery}"
              </span>
            </div>
          )}
        </div>

        {/* 컬럼 헤더 (데스크톱에서만 표시) */}
        <div
          className={`hidden lg:grid ${gridCols} items-center bg-[color:var(--color-bg-elev-2)]
                      rounded-t-[var(--radius-md)] py-3 px-4 text-[15px]`}
        >
          <div className="text-center">번호</div>
          <div className="text-center">카테고리</div>
          <div className="text-center">제목</div>
          <div className="text-center">좋아요</div>
          <div className="text-center">작성자</div>
          <div className="text-center whitespace-nowrap">작성일</div>
          <div className="text-center whitespace-nowrap">조회수</div>
        </div>

        {/* 헤더 아래 선: 리스트 폭과 정확히 일치 (데스크톱에서만) */}
        <div className="hidden lg:block border-b border-[color:var(--color-border-default)]" />

        {/* 목록 박스 (콘텐츠 높이에 맞게 auto) */}
        <div
          className="bg-[color:var(--color-bg-elev-1)]
                     rounded-[var(--radius-md)] lg:rounded-b-[var(--radius-md)] lg:rounded-t-none px-2 sm:px-3 md:px-4 py-3"
        >
          {/* 에러 */}
          {error && (
            <div className="w-full rounded-[var(--radius-md)]
                            bg-[color:var(--color-bg-elev-2)]
                            border border-[color:var(--color-border-default)]
                            flex flex-col items-center justify-center p-4 mb-3">
              <span className="text-[color:var(--color-fg-danger)] font-bold mb-2">
                ❌ 데이터를 불러올 수 없습니다
              </span>
              <span className="text-[color:var(--color-fg-muted)] text-sm mb-2">
                에러 메시지: {error instanceof Error ? error.message : "알 수 없는 에러"}
              </span>
              <button
                onClick={() => window.location.reload()}
                className="mt-2 px-3 py-1.5 bg-[color:var(--color-accent)] text-[color:var(--color-on-accent)] rounded hover:opacity-90"
              >
                🔄 새로고침
              </button>
            </div>
          )}

          {/* 게시글 목록 */}
          <div className="flex flex-col gap-2 sm:gap-1.5">
            {(data?.items ?? []).map((post, idx) => {
              const badges = calculateBadges(post);
              const rowIndex = (data?.page ?? page) - 1;
              const no = rowIndex * (data?.pageSize ?? pageSize) + idx + 1;

              return (
                <div
                  key={post.postId}
                  onClick={() => navigate(`/boards/${post.postId}`)}
                  role="button"
                  aria-label={`${post.title} 상세로 이동`}
                  className="bg-[color:var(--color-bg-elev-2)]
                              border border-[color:var(--color-border-default)]
                              rounded-[var(--radius-md)]
                              hover:bg-[color:var(--color-bg-elev-2-hover, var(--color-bg-elev-2)))]
                              cursor-pointer transition px-3 py-3 sm:py-0 sm:h-[56px]"
                >
                  {/* 데스크톱: 그리드 레이아웃 */}
                  <div className={`hidden lg:grid ${gridCols} items-center h-full`}>
                    {/* 번호 */}
                    <div className="text-center">{no}</div>

                    {/* 카테고리 */}
                    <div className="text-center truncate">{getCategoryLabel(post.category)}</div>

                    {/* 제목 (+ 뱃지) */}
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="truncate">{post.title}</span>
                      {/* 댓글 수 */}
                      {badges.find((b) => b.type === "count") && (
                        <span className="text-[color:var(--color-fg-danger)] text-sm shrink-0">
                          [{badges.find((b) => b.type === "count")?.value}]
                        </span>
                      )}
                      {/* HOT */}
                      {badges.find((b) => b.type === "hot") && (
                        <span className="text-[color:var(--color-fg-muted)] text-sm shrink-0">[H]</span>
                      )}
                      {/* NEW */}
                      {badges.find((b) => b.type === "new") && (
                        <span className="text-[color:var(--color-accent)] text-sm shrink-0">[NEW]</span>
                      )}
                      {/* GROUP 카테고리일 때 참여 인원수 표시 */}
                      {post.category === "GROUP" && post.currentMemberCount !== undefined && post.recruitmentLimit !== undefined && (
                        <span className="text-[color:var(--color-accent)] text-sm shrink-0">
                          [👥 {post.currentMemberCount}/{post.recruitmentLimit}]
                        </span>
                      )}
                    </div>

                    {/* 좋아요 */}
                    <div className="text-center">{post.likeCount ?? 0}</div>

                    {/* 작성자 */}
                    <div className="text-center truncate">{post.authorNickname}</div>

                    {/* 작성일 */}
                    <div className="text-center">{formatDate(post.createdAt)}</div>

                    {/* 조회수 */}
                    <div className="text-center">{post.hit}</div>
                  </div>

                  {/* 모바일/태블릿: 카드 레이아웃 */}
                  <div className="lg:hidden flex flex-col gap-2">
                    {/* 제목 + 뱃지 */}
                    <div className="flex items-start gap-2">
                      <h3 className="flex-1 font-medium text-sm sm:text-base line-clamp-2">{post.title}</h3>
                      <div className="flex gap-1 shrink-0">
                        {badges.find((b) => b.type === "count") && (
                          <span className="text-[color:var(--color-fg-danger)] text-xs">
                            [{badges.find((b) => b.type === "count")?.value}]
                          </span>
                        )}
                        {badges.find((b) => b.type === "hot") && (
                          <span className="text-[color:var(--color-fg-muted)] text-xs">[H]</span>
                        )}
                        {badges.find((b) => b.type === "new") && (
                          <span className="text-[color:var(--color-accent)] text-xs">[NEW]</span>
                        )}
                      </div>
                    </div>

                    {/* 메타 정보 */}
                    <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-[color:var(--color-fg-muted)]">
                      <span className="px-2 py-0.5 rounded bg-[color:var(--color-bg-elev-1)] text-xs">
                        {getCategoryLabel(post.category)}
                      </span>
                      <span>{post.authorNickname}</span>
                      <span>·</span>
                      <span>{formatDate(post.createdAt)}</span>
                      {/* GROUP 카테고리일 때 참여 인원수 표시 */}
                      {post.category === "GROUP" && post.currentMemberCount !== undefined && post.recruitmentLimit !== undefined && (
                        <>
                          <span>·</span>
                          <span className="text-[color:var(--color-accent)]">
                            👥 {post.currentMemberCount}/{post.recruitmentLimit}
                          </span>
                        </>
                      )}
                      <span className="ml-auto flex items-center gap-2">
                        <span>❤️ {post.likeCount ?? 0}</span>
                        <span>👁 {post.hit}</span>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 페이지네이션: 목록 아래, 항상 중앙 */}
          <div className="mt-4 sm:mt-[20px] mb-4 sm:mb-[30px] flex justify-center items-center gap-1 sm:gap-2 flex-wrap">
            <button
              onClick={() => goPage(1)}
              className="w-[28px] h-[28px] sm:w-[30px] sm:h-[30px] rounded-[var(--radius-md)]
                         bg-[color:var(--color-bg-elev-1)]
                         border border-[color:var(--color-border-default)] text-sm"
              aria-label="첫 페이지"
            >
              &laquo;
            </button>
            <button
              onClick={() => goPage(page - 1)}
              className="w-[28px] h-[28px] sm:w-[30px] sm:h-[30px] rounded-[var(--radius-md)]
                         bg-[color:var(--color-bg-elev-1)]
                         border border-[color:var(--color-border-default)] text-sm"
              aria-label="이전 페이지"
            >
              &lsaquo;
            </button>

            {Array.from(
              { length: Math.min(10, totalPages) },
              (_, i) => i + Math.max(1, Math.min(page - 4, totalPages - 9))
            ).map((n) => (
              <button
                key={n}
                onClick={() => goPage(n)}
                className={
                  "w-[32px] h-[32px] sm:w-[40px] sm:h-[40px] rounded-[var(--radius-md)] border text-sm sm:text-base " +
                  (n === page
                    ? "bg-[color:var(--color-accent)] text-[color:var(--color-on-accent)] border-transparent font-medium"
                    : "bg-[color:var(--color-bg-elev-1)] border-[color:var(--color-border-default)]")
                }
                aria-label={`${n}페이지`}
                aria-current={n === page ? "page" : undefined}
              >
                {n}
              </button>
            ))}

            <button
              onClick={() => goPage(page + 1)}
              className="w-[28px] h-[28px] sm:w-[30px] sm:h-[30px] rounded-[var(--radius-md)]
                         bg-[color:var(--color-bg-elev-1)]
                         border border-[color:var(--color-border-default)] text-sm"
              aria-label="다음 페이지"
            >
              &rsaquo;
            </button>
            <button
              onClick={() => goPage(totalPages)}
              className="w-[28px] h-[28px] sm:w-[30px] sm:h-[30px] rounded-[var(--radius-md)]
                         bg-[color:var(--color-bg-elev-1)]
                         border border-[color:var(--color-border-default)] text-sm"
              aria-label="마지막 페이지"
            >
              &raquo;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
