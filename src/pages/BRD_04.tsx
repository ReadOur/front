import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

type Post = {
  id: number | string;
  title: string;
  author: string;
  category: string;
  date: string;   // ISO or yyyy.MM.dd
  likes: number;
  views: number;
  badges?: { type: "hot" | "new" | "count"; value?: string | number }[];
};

type ListResponse = {
  items: Post[];
  page: number;
  pageSize: number;
  total: number;
};

export const BRD_List: React.FC = () => {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const page = Number(params.get("page") || 1);
  const pageSize = 10;

  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1) 에러 메시지 유틸 추가
  function toErrorMessage(e: unknown): string {
    if (e instanceof Error) return e.message;
    if (typeof e === "string") return e;
    try {
      // 서버 에러 응답이 { message: string } 형태라면 이런 식으로 안전 접근
      const maybe = e as { message?: string };
      if (maybe?.message && typeof maybe.message === "string") return maybe.message;
    } catch { /* noop */ }
    return "Unknown error";
  }

// 2) fetchPosts는 그대로 둬도 되고, 에러 타입 명시는 하지 않음
  async function fetchPosts(page = 1, pageSize = 10): Promise<ListResponse> {
    const res = await fetch(`/api/posts?page=${page}&pageSize=${pageSize}`);
    if (!res.ok) throw new Error("Failed to load posts");
    return res.json();
  }

// 3) useEffect의 catch 부분 수정 (any 제거)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const payload = await fetchPosts(page, pageSize);
        if (alive) {
          setData(payload);
          setError(null);
        }
      } catch (e: unknown) {
        if (alive) setError(toErrorMessage(e));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [page]);

  const totalPages = useMemo(() => {
    if (!data) return 1;
    return Math.max(1, Math.ceil(data.total / data.pageSize));
  }, [data]);

  const goPage = (p: number) => {
    const np = Math.min(Math.max(1, p), totalPages);
    params.set("page", String(np));
    setParams(params, { replace: true });
  };

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
      <div className="absolute left-[100px] w-[1100px]" style={{ top: 300 }}>
        {/* 로딩/에러 */}
        {loading && (
          <div className="w-full h-[68px] rounded-[var(--radius-md)]
                          bg-[color:var(--color-bg-elev-2)]
                          border border-[color:var(--color-border-default)]
                          animate-pulse" />
        )}
        {error && (
          <div className="w-full h-[68px] rounded-[var(--radius-md)]
                          bg-[color:var(--color-bg-elev-2)]
                          border border-[color:var(--color-border-default)]
                          flex items-center justify-center">
            <span className="text-[color:var(--color-fg-danger)]">에러: {error}</span>
          </div>
        )}

        {/* 아이템 */}
        {data?.items.map((post, idx) => {
          const top = 0 + idx * 68;
          return (
            <div
              key={post.id}
              className="relative w-full h-[68px] mb-2
                         bg-[color:var(--color-bg-elev-2)]
                         border border-[color:var(--color-border-default)]
                         rounded-[var(--radius-md)]
                         hover:bg-[color:var(--color-bg-elev-2-hover, var(--color-bg-elev-2)))]
                         cursor-pointer transition"
              style={{ top }}
              onClick={() => navigate(`/board/${post.id}`)}
              role="button"
              aria-label={`${post.title} 상세로 이동`}
            >
              {/* 번호 */}
              <div className="absolute top-[21px] left-4 w-[108px] h-[31px] flex items-center justify-center">
                <div className="text-2xl">{(data.page - 1) * data.pageSize + idx + 1}</div>
              </div>

              {/* 카테고리/제목/작성자 */}
              <div className="absolute top-[21px] left-[156px] w-[375px] h-[31px] flex items-center">
                <div className="text-2xl">{post.category}</div>
              </div>
              <div className="absolute top-[21px] left-[243px] w-[375px] h-[31px] flex items-center">
                <div className="text-2xl line-clamp-1">{post.title}</div>
              </div>
              <div className="absolute top-[21px] left-[1012px] w-[200px] h-[31px] flex items-center">
                <div className="text-2xl">{post.author}</div>
              </div>

              {/* 보조 정보 */}
              <div className="absolute top-[21px] left-[332px] w-[912px] h-[23px]">
                <div className="absolute left-0 top-0 w-14 text-2xl text-center
                                text-[color:var(--color-fg-danger)] whitespace-nowrap">
                  {post.badges?.find(b => b.type === "count")?.value ? `[${post.badges?.find(b => b.type === "count")?.value}]` : null}
                </div>
                <div className="absolute left-[54px] top-0 w-14 text-2xl text-center
                                text-[color:var(--color-fg-muted)] whitespace-nowrap">
                  {post.badges?.find(b => b.type === "hot") ? "[H]" : ""}
                </div>
                <div className="absolute left-[100px] top-0 w-[78px] text-2xl text-center
                                text-[color:var(--color-accent)] whitespace-nowrap">
                  {post.badges?.find(b => b.type === "new") ? "[NEW]" : ""}
                </div>

                <div className="absolute left-[469px] top-0 w-14 text-2xl text-center">{post.likes}</div>
                <div className="absolute left-[678px] top-0 w-[145px] text-2xl text-center">{post.date}</div>
                <div className="absolute left-[844px] top-0 w-14 text-2xl text-center">{post.views}</div>
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
