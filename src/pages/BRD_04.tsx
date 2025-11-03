import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePosts } from "@/hooks/api";

/**
 * 게시판 목록 페이지 (API 연동 버전)
 * - React Query로 게시글 목록 fetching
 * - 페이지네이션
 * - 게시글 카드 클릭 시 상세 페이지로 이동
 */

export default function Boards() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // ===== API 훅 =====
  const {
    data: postsData,
    isLoading,
    error,
  } = usePosts({ page, pageSize });

  // ===== 이벤트 핸들러 =====
  const handlePostClick = (postId: string) => {
    navigate(`/boards/${postId}`);
  };

  const handlePrevPage = () => {
    if (page > 1) setPage(page - 1);
  };

  const handleNextPage = () => {
    if (postsData?.meta.hasNext) setPage(page + 1);
  };

  // ===== 로딩 및 에러 처리 =====
  if (isLoading) {
    return (
      <section className="w-full min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-10 h-10 border-4 border-[color:var(--color-accent)] border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-[color:var(--color-fg-muted)]">게시글을 불러오는 중...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="w-full min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[color:var(--color-error)] text-lg mb-4">
            게시글을 불러오는 데 실패했습니다.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-[color:var(--color-accent)] rounded-lg hover:opacity-90"
          >
            다시 시도
          </button>
        </div>
      </section>
    );
  }

  const posts = postsData?.items || [];
  const meta = postsData?.meta;

  return (
    <section className="w-full max-w-5xl mx-auto">
      {/* 헤더 */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[color:var(--color-fg-primary)]">게시판</h1>
          <p className="mt-2 text-[color:var(--color-fg-muted)]">
            {meta ? `전체 ${meta.totalItems.toLocaleString()}개의 게시글` : "게시글 목록"}
          </p>
        </div>

        {/* 새 글 작성 버튼 (추후 구현) */}
        <button
          onClick={() => alert("게시글 작성 기능은 준비 중입니다.")}
          className="px-4 py-2 bg-[color:var(--color-accent)] text-[color:var(--color-on-accent)] rounded-lg font-semibold hover:opacity-90"
        >
          ✏️ 글쓰기
        </button>
      </div>

      {/* 게시글 목록 */}
      {posts.length === 0 ? (
        <div className="text-center py-16 bg-[color:var(--color-bg-elev-1)] rounded-xl border border-[color:var(--color-border-subtle)]">
          <p className="text-[color:var(--color-fg-muted)] text-lg">
            아직 게시글이 없습니다.
          </p>
          <p className="text-[color:var(--color-fg-muted)] text-sm mt-2">
            첫 번째 게시글을 작성해보세요!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <article
              key={post.id}
              onClick={() => handlePostClick(post.id)}
              className="bg-[color:var(--color-bg-elev-1)] border border-[color:var(--color-border-subtle)] rounded-xl p-5 hover:border-[color:var(--color-accent)] hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between gap-4">
                {/* 게시글 정보 */}
                <div className="flex-1 min-w-0">
                  {/* 제목 */}
                  <h2 className="text-lg font-bold text-[color:var(--color-fg-primary)] mb-2 truncate">
                    {post.isPinned && (
                      <span className="inline-block px-2 py-0.5 mr-2 text-xs font-bold bg-[color:var(--color-accent)] text-[color:var(--color-on-accent)] rounded">
                        공지
                      </span>
                    )}
                    {post.title}
                  </h2>

                  {/* 메타 정보 */}
                  <div className="flex items-center gap-4 text-sm text-[color:var(--color-fg-muted)]">
                    <span className="flex items-center gap-1">
                      👤 {post.author.nickname}
                    </span>
                    <span className="flex items-center gap-1">
                      📅 {new Date(post.createdAt).toLocaleDateString("ko-KR")}
                    </span>
                    <span className="flex items-center gap-1">
                      👁️ {post.viewCount.toLocaleString()}
                    </span>
                    {post.category && (
                      <span className="px-2 py-0.5 bg-[color:var(--color-bg-elev-2)] rounded text-xs">
                        {post.category}
                      </span>
                    )}
                  </div>
                </div>

                {/* 우측 통계 */}
                <div className="flex flex-col items-end gap-2 text-sm shrink-0">
                  <div className="flex items-center gap-1 text-[color:var(--color-fg-muted)]">
                    ❤️ <span className="font-semibold">{post.likeCount}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[color:var(--color-fg-muted)]">
                    💬 <span className="font-semibold">{post.commentCount}</span>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* 페이지네이션 */}
      {meta && meta.totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <button
            onClick={handlePrevPage}
            disabled={!meta.hasPrevious}
            className="px-4 py-2 border border-[color:var(--color-border-subtle)] bg-[color:var(--color-bg-elev-1)] rounded-lg hover:bg-[color:var(--color-bg-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← 이전
          </button>

          <div className="flex items-center gap-2">
            <span className="text-[color:var(--color-fg-muted)]">
              {page} / {meta.totalPages}
            </span>
          </div>

          <button
            onClick={handleNextPage}
            disabled={!meta.hasNext}
            className="px-4 py-2 border border-[color:var(--color-border-subtle)] bg-[color:var(--color-bg-elev-1)] rounded-lg hover:bg-[color:var(--color-bg-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            다음 →
          </button>
        </div>
      )}
    </section>
  );
}
