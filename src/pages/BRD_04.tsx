// src/pages/BRD_04.tsx
import React, { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getPosts, Post } from "@/api/posts";
import { Loading } from "@/components/Loading";

// 날짜 포맷 함수 (ISO -> yyyy.MM.dd)
function formatDate(dateString: string): string {
  const d = new Date(dateString);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

function calculateBadges(post: Post): { type: "hot" | "new" | "count"; value?: string | number }[] {
  const badges: { type: "hot" | "new" | "count"; value?: string | number }[] = [];
  if (post.commentCount && post.commentCount > 0) badges.push({ type: "count", value: post.commentCount });
  if (post.likeCount >= 10) badges.push({ type: "hot" });
  const diffH = (Date.now() - new Date(post.createdAt).getTime()) / 36e5;
  if (diffH < 24) badges.push({ type: "new" });
  return badges;
}

export const BRD_List: React.FC = () => {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const page = Number(params.get("page") || 1);
  const pageSize = 20;

  const { data, isLoading, error } = useQuery({
    queryKey: ["posts", page, pageSize],
    queryFn: () => getPosts({ page, size: pageSize }),
    staleTime: 1000 * 60 * 5,
  });

  const totalPages = useMemo(() => Math.max(1, data?.totalPages ?? 1), [data]);

  const goPage = (p: number) => {
    const np = Math.min(Math.max(1, p), totalPages);
    params.set("page", String(np));
    setParams(params, { replace: true });
  };

  if (isLoading) return <Loading message="게시글을 불러오는 중..." />;

  // 공용 폭 컨테이너 (헤더 선과 리스트가 정확히 맞물리도록)
  // grid 정의: 헤더와 행 모두 동일하게 사용
  const gridCols =
    "grid-cols-[115px_115px_minmax(0,1fr)_80px_140px_145px_80px]"; // 번호 / 카테고리 / 제목(flex) / 좋아요 / 작성자 / 작성일 / 조회수

  return (
    <div
      className="w-full min-h-screen pb-[40px]
      bg-[color:var(--color-bg-canvas)] text-[color:var(--color-fg-primary)]"
      style={{ fontFamily: "var(--font-sans, ui-sans-serif, system-ui)" }}
    >
      <div className="mx-auto px-6 mt-[80px]" style={{ maxWidth: "var(--layout-max, 1200px)" }}>
        {/* 상단 액션바 */}
        <div className="flex items-center justify-end py-6">
          <button
            className="h-[36px] px-5 rounded-[var(--radius-md)]
                       bg-[color:var(--color-accent)]
                       text-[color:var(--color-on-accent)] text-sm font-medium"
            onClick={() => navigate("/boards/write")}
          >
            ✏️ 글 쓰기
          </button>
        </div>

        {/* 컬럼 헤더 */}
        <div
          className={`grid ${gridCols} items-center bg-[color:var(--color-bg-elev-2)]
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

        {/* 헤더 아래 선: 리스트 폭과 정확히 일치 */}
        <div className="border-b border-[color:var(--color-border-default)]" />

        {/* 목록 박스 (콘텐츠 높이에 맞게 auto) */}
        <div
          className="bg-[color:var(--color-bg-elev-1)]
                     rounded-b-[var(--radius-md)] px-4 py-3"
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

          {/* 게시글 목록: absolute 제거 → 자연 흐름 / 간격 절반 */}
          <div className="flex flex-col gap-1.5">
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
                  className={`grid ${gridCols} items-center
                              bg-[color:var(--color-bg-elev-2)]
                              border border-[color:var(--color-border-default)]
                              rounded-[var(--radius-md)]
                              hover:bg-[color:var(--color-bg-elev-2-hover, var(--color-bg-elev-2)))]
                              cursor-pointer transition h-[56px] px-3`}
                >
                  {/* 번호 */}
                  <div className="text-center">{no}</div>

                  {/* 카테고리 */}
                  <div className="text-center truncate">{post.category}</div>

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
                  </div>

                  {/* 좋아요 */}
                  <div className="text-center">{post.likeCount}</div>

                  {/* 작성자 */}
                  <div className="text-center truncate">{post.authorNickname}</div>

                  {/* 작성일 */}
                  <div className="text-center">{formatDate(post.createdAt)}</div>

                  {/* 조회수 */}
                  <div className="text-center">{post.hit}</div>
                </div>
              );
            })}
          </div>

          {/* 페이지네이션: 목록 아래, 항상 중앙 */}
          <div className="mt-[20px] mb-[30px] flex justify-center items-center gap-2">
            <button
              onClick={() => goPage(1)}
              className="w-[30px] h-[30px] rounded-[var(--radius-md)]
                         bg-[color:var(--color-bg-elev-1)]
                         border border-[color:var(--color-border-default)]"
              aria-label="첫 페이지"
            >
              &laquo;
            </button>
            <button
              onClick={() => goPage(page - 1)}
              className="w-[30px] h-[30px] rounded-[var(--radius-md)]
                         bg-[color:var(--color-bg-elev-1)]
                         border border-[color:var(--color-border-default)]"
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
                  "w-[40px] h-[40px] rounded-[var(--radius-md)] border " +
                  (n === page
                    ? "bg-[color:var(--color-accent)] text-[color:var(--color-on-accent)] border-transparent font-medium"
                    : "bg-[color:var(--color-bg-elev-1)] border-[color:var(--color-border-default)]")
                }
              >
                {n}
              </button>
            ))}

            <button
              onClick={() => goPage(page + 1)}
              className="w-[30px] h-[30px] rounded-[var(--radius-md)]
                         bg-[color:var(--color-bg-elev-1)]
                         border border-[color:var(--color-border-default)]"
              aria-label="다음 페이지"
            >
              &rsaquo;
            </button>
            <button
              onClick={() => goPage(totalPages)}
              className="w-[30px] h-[30px] rounded-[var(--radius-md)]
                         bg-[color:var(--color-bg-elev-1)]
                         border border-[color:var(--color-border-default)]"
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
