import React, { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getPosts, Post } from "@/api/posts";
import { Loading } from "@/components/Loading";

// 날짜 포맷 함수 (ISO -> yyyy.MM.dd)
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
}

// 뱃지 계산 (댓글 수, HOT, NEW)
function calculateBadges(post: Post): { type: "hot" | "new" | "count"; value?: string | number }[] {
  const badges: { type: "hot" | "new" | "count"; value?: string | number }[] = [];

  // 댓글 수
  if (post.commentCount && post.commentCount > 0) {
    badges.push({ type: "count", value: post.commentCount });
  }

  // HOT (좋아요 10개 이상)
  if (post.likeCount >= 10) {
    badges.push({ type: "hot" });
  }

  // NEW (24시간 이내)
  const createdAt = new Date(post.createdAt);
  const now = new Date();
  const diffHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
  if (diffHours < 24) {
    badges.push({ type: "new" });
  }

  return badges;
}

export const BRD_List: React.FC = () => {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const page = Number(params.get("page") || 1);
  const pageSize = 20;

  // React Query로 데이터 페칭
  const { data, isLoading, error } = useQuery({
    queryKey: ['posts', page, pageSize],
    queryFn: () => getPosts({ page, size: pageSize }),
    staleTime: 1000 * 60 * 5, // 5분
  });

  const totalPages = useMemo(() => {
    if (!data) return 1;
    return Math.max(1, data.totalPages);
  }, [data]);

  const goPage = (p: number) => {
    const np = Math.min(Math.max(1, p), totalPages);
    params.set("page", String(np));
    setParams(params, { replace: true });
  };

  // 로딩 중일 때 전체 화면 로딩 표시
  if (isLoading) {
    return <Loading message="게시글을 불러오는 중..." />;
  }

  return (
    <div
      className="w-full min-w-[1431px] min-h-[1059px] relative
                 bg-[color:var(--color-bg-canvas)]
                 text-[color:var(--color-fg-primary)]"
      style={{ fontFamily: "var(--font-sans, ui-sans-serif, system-ui)" }}
      data-model-id="7:81"
    >
      {/* 상단 바 */}
      <div className="absolute top-[170px] left-[100px] w-[1250px] h-[67px]
                      bg-[color:var(--color-bg-elev-2)] rounded-[var(--radius-md)]" />

      {/* 리스트 박스 */}
      <div className="absolute top-[237px] left-[100px] w-[1250px] h-[735px]
                      bg-[color:var(--color-bg-elev-1)]
                      rounded-[var(--radius-md)]" />

      {/* 헤더 라인 */}
      <div className="absolute top-[50px] left-[100px] w-[1100px] h-[63px]
                      bg-[color:var(--color-bg-elev-2)]
                      border-b border-[color:var(--color-border-default)]
                      rounded-t-[var(--radius-md)]" />

      {/* 컬럼 헤더 */}
      <div className="absolute top-[80px] left-[100px] w-[115px] text-2xl text-center">번호</div>
      <div className="absolute top-[80px] left-[235px] w-[115px] text-2xl text-center">카테고리</div>
      <div className="absolute top-[80px] left-[200px] w-[850px] text-2xl text-center">제목</div>
      <div className="absolute top-[80px] left-[940px] text-2xl text-center">좋아요</div>
      <div className="absolute top-[80px] left-[1000px] text-2xl text-center">작성자</div>
      <div className="absolute top-[80px] left-[1050px] w-[84px] text-2xl text-center whitespace-nowrap">작성일</div>
      <div className="absolute top-[80px] left-[1125px] w-[68px] text-2xl text-center whitespace-nowrap">조회수</div>

      {/* 목록 영역 */}
      <div className="absolute left-[100px] w-[1250px]" style={{ top: 300 }}>
        {/* 에러 */}
        {error && (
          <div className="w-full min-h-[120px] rounded-[var(--radius-md)]
                          bg-[color:var(--color-bg-elev-2)]
                          border border-[color:var(--color-border-default)]
                          flex flex-col items-center justify-center p-4">
            <span className="text-[color:var(--color-fg-danger)] text-lg font-bold mb-2">
              ❌ 데이터를 불러올 수 없습니다
            </span>
            <span className="text-[color:var(--color-fg-muted)] text-sm mb-2">
              에러 메시지: {error instanceof Error ? error.message : '알 수 없는 에러'}
            </span>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 px-4 py-2 bg-[color:var(--color-accent)] text-white rounded hover:opacity-90"
            >
              🔄 새로고침
            </button>
            {/* 디버깅 정보 */}
            <details className="mt-3 w-full">
              <summary className="cursor-pointer text-xs text-[color:var(--color-fg-muted)]">
                디버깅 정보 보기
              </summary>
              <pre className="mt-2 p-2 bg-black text-green-400 text-xs rounded overflow-auto">
                {JSON.stringify(error, Object.getOwnPropertyNames(error), 2)}
              </pre>
            </details>
          </div>
        )}

        {/* 게시글 목록 */}
        {(data?.items ?? []).map((post, idx) => {
          const top = 0 + idx * 68;
          const badges = calculateBadges(post);

          return (
            <div
              key={post.postId}
              className="relative w-full h-[68px] mb-2
                         bg-[color:var(--color-bg-elev-2)]
                         border border-[color:var(--color-border-default)]
                         rounded-[var(--radius-md)]
                         hover:bg-[color:var(--color-bg-elev-2-hover, var(--color-bg-elev-2)))]
                         cursor-pointer transition"
              style={{ top }}
              onClick={() => navigate(`/boards/${post.postId}`)}
              role="button"
              aria-label={`${post.title} 상세로 이동`}
            >
              {/* 번호 */}
              <div className="absolute top-[21px] left-4 w-[108px] h-[31px] flex items-center justify-center">
                <div className="text-2xl">{(data.page - 1) * data.pageSize + idx + 1}</div>
              </div>

              {/* 카테고리 */}
              <div className="absolute top-[21px] left-[156px] w-[375px] h-[31px] flex items-center">
                <div className="text-2xl">{post.category}</div>
              </div>

              {/* 제목 */}
              <div className="absolute top-[21px] left-[243px] w-[375px] h-[31px] flex items-center">
                <div className="text-2xl line-clamp-1">{post.title}</div>
              </div>

              {/* 작성자 */}
              <div className="absolute top-[21px] left-[1012px] w-[200px] h-[31px] flex items-center">
                <div className="text-2xl">{post.authorNickname}</div>
              </div>

              {/* 보조 정보 (뱃지, 좋아요, 날짜, 조회수) */}
              <div className="absolute top-[21px] left-[332px] w-[912px] h-[23px]">
                {/* 댓글 수 */}
                <div className="absolute left-0 top-0 w-14 text-2xl text-center
                                text-[color:var(--color-fg-danger)] whitespace-nowrap">
                  {badges.find(b => b.type === "count")?.value ? `[${badges.find(b => b.type === "count")?.value}]` : null}
                </div>

                {/* HOT 뱃지 */}
                <div className="absolute left-[54px] top-0 w-14 text-2xl text-center
                                text-[color:var(--color-fg-muted)] whitespace-nowrap">
                  {badges.find(b => b.type === "hot") ? "[H]" : ""}
                </div>

                {/* NEW 뱃지 */}
                <div className="absolute left-[100px] top-0 w-[78px] text-2xl text-center
                                text-[color:var(--color-accent)] whitespace-nowrap">
                  {badges.find(b => b.type === "new") ? "[NEW]" : ""}
                </div>

                {/* 좋아요 */}
                <div className="absolute left-[469px] top-0 w-14 text-2xl text-center">{post.likeCount}</div>

                {/* 작성일 */}
                <div className="absolute left-[678px] top-0 w-[145px] text-2xl text-center">
                  {formatDate(post.createdAt)}
                </div>

                {/* 조회수 */}
                <div className="absolute left-[844px] top-0 w-14 text-2xl text-center">{post.hit}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 페이지네이션 */}
      <div className="absolute top-[983px] left-[485px] flex items-center gap-2">
        <button onClick={() => goPage(1)} className="w-[30px] h-[30px] rounded-[var(--radius-md)]
                           bg-[color:var(--color-bg-elev-1)]
                           border border-[color:var(--color-border-default)]" aria-label="첫 페이지">&laquo;</button>
        <button onClick={() => goPage(page - 1)} className="w-[30px] h-[30px] rounded-[var(--radius-md)]
                           bg-[color:var(--color-bg-elev-1)]
                           border border-[color:var(--color-border-default)]" aria-label="이전 페이지">&lsaquo;</button>

        {Array.from({ length: Math.min(10, totalPages) }, (_, i) => i + Math.max(1, Math.min(page - 4, totalPages - 9)))
          .map(n => (
            <button key={n}
                    onClick={() => goPage(n)}
                    className={"w-[40px] h-[40px] rounded-[var(--radius-md)] border " + (n === page
                      ? "bg-[color:var(--color-accent)] text-[color:var(--color-on-accent)] border-transparent font-medium"
                      : "bg-[color:var(--color-bg-elev-1)] border-[color:var(--color-border-default)]")}>
              {n}
            </button>
          ))}

        <button onClick={() => goPage(page + 1)} className="w-[30px] h-[30px] rounded-[var(--radius-md)]
                           bg-[color:var(--color-bg-elev-1)]
                           border border-[color:var(--color-border-default)]" aria-label="다음 페이지">&rsaquo;</button>
        <button onClick={() => goPage(totalPages)} className="w-[30px] h-[30px] rounded-[var(--radius-md)]
                           bg-[color:var(--color-bg-elev-1)]
                           border border-[color:var(--color-border-default)]" aria-label="마지막 페이지">&raquo;</button>
      </div>

      {/* 글쓰기 버튼 */}
      <button
        className="absolute top-[35px] left-[1120px] h-[35px] px-5
                   rounded-[var(--radius-md)]
                   bg-[color:var(--color-accent)]
                   text-[color:var(--color-on-accent)]
                   text-xl font-medium"
        onClick={() => navigate("/boards/write")}
      >
        ✏️ 글 쓰기
      </button>
    </div>
  );
};
