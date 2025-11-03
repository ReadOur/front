import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  usePost,
  useLikePost,
  useComments,
  useCreateComment,
  useDeleteComment,
} from "@/hooks/api";
import { CreateCommentRequest } from "@/types";

/**
 * 게시글 상세 페이지 (API 연동 버전)
 * - React Query로 게시글 및 댓글 데이터 fetching
 * - 좋아요, 댓글 작성/삭제 기능
 * - 토큰 규칙: 절대 하드코딩 금지, 색상은 var(--color-*)로 참조
 */

export default function PostShow() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();

  const [commentText, setCommentText] = useState("");

  // ===== API 훅 =====
  const {
    data: post,
    isLoading: isPostLoading,
    error: postError,
  } = usePost(postId || "");

  const {
    data: commentsData,
    isLoading: isCommentsLoading,
    error: commentsError,
  } = useComments({ postId: postId || "", page: 1, pageSize: 50 });

  const likeMutation = useLikePost();
  const createCommentMutation = useCreateComment({
    onSuccess: () => setCommentText(""),
  });
  const deleteCommentMutation = useDeleteComment();

  // ===== 이벤트 핸들러 =====
  function handleLike() {
    if (!postId || !post) return;
    likeMutation.mutate({
      postId,
      isLiked: post.isLiked || false,
    });
  }

  function handleCommentSubmit() {
    const trimmed = commentText.trim();
    if (!trimmed || !postId) return;

    const request: CreateCommentRequest = {
      postId,
      content: trimmed,
    };

    createCommentMutation.mutate(request);
  }

  function handleCommentDelete(commentId: string) {
    if (!postId) return;
    if (confirm("댓글을 삭제하시겠습니까?")) {
      deleteCommentMutation.mutate({ commentId, postId });
    }
  }

  // ===== 로딩 및 에러 처리 =====
  if (!postId) {
    return (
      <div className="w-full min-h-[400px] flex items-center justify-center">
        <p className="text-[color:var(--color-fg-muted)]">잘못된 게시글 ID입니다.</p>
      </div>
    );
  }

  if (isPostLoading) {
    return (
      <div className="w-full min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-[color:var(--color-accent)] border-t-transparent rounded-full animate-spin mb-2"></div>
          <p className="text-[color:var(--color-fg-muted)]">게시글을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (postError || !post) {
    return (
      <div className="w-full min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[color:var(--color-error)] mb-4">
            게시글을 불러오는 데 실패했습니다.
          </p>
          <button
            onClick={() => navigate("/boards")}
            className="px-4 py-2 bg-[color:var(--color-accent)] rounded-lg hover:opacity-90"
          >
            목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  const comments = commentsData?.items || [];

  return (
    <main
      className="w-full min-w-[1100px] min-h-[800px] mx-auto px-6 py-8 bg-[color:var(--color-bg-elev-1)]"
      data-model-id="post:show"
    >
      {/* 헤더 바 */}
      <section className="rounded-xl overflow-hidden border border-[color:var(--color-border-subtle)] shadow-sm mb-4">
        <div className="h-[68px] bg-[color:var(--color-accent)] flex items-center justify-between px-5">
          <h2 className="text-[color:var(--color-fg-secondary)] text-xl font-semibold">게시글</h2>
          <div className="flex items-center gap-4 text-[color:var(--color-fg-secondary)] text-sm">
            <span>작성: {new Date(post.createdAt).toLocaleString("ko-KR")}</span>
            <span>조회: {post.viewCount.toLocaleString()}</span>
            <span>작성자: {post.author.nickname}</span>
          </div>
        </div>
      </section>

      {/* 본문 카드 */}
      <article
        aria-labelledby="title"
        className="bg-[color:var(--color-bg-elev-1)] border border-[color:var(--color-border-subtle)] rounded-xl p-5 shadow-sm"
      >
        <header className="flex items-center justify-between gap-4">
          <h1 id="title" className="text-2xl font-extrabold text-[color:var(--color-fg-primary)]">
            {post.title}
          </h1>

          {/* 좋아요 버튼 */}
          <button
            onClick={handleLike}
            disabled={likeMutation.isPending}
            aria-pressed={post.isLiked}
            aria-label={`좋아요 ${post.likeCount}개`}
            className="inline-flex items-center gap-2 bg-[color:var(--color-bg-elev-2)] border border-[color:var(--color-border-subtle)] rounded-lg px-3 py-2 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)] disabled:opacity-50 disabled:cursor-not-allowed"
            data-active={post.isLiked}
          >
            <span>{post.isLiked ? "❤️" : "🤍"}</span>
            <strong className="text-[color:var(--color-fg-primary)]">{post.likeCount}</strong>
          </button>
        </header>

        {/* 첨부파일 영역 */}
        {post.attachments && post.attachments.length > 0 && (
          <div
            role="button"
            tabIndex={0}
            aria-label={`첨부파일 ${post.attachments.length}개`}
            className="mt-3 bg-[color:var(--color-bg-elev-2)] border border-dashed border-[color:var(--color-border-subtle)] rounded-lg px-3 py-2 flex items-center justify-between"
          >
            <span className="text-[color:var(--color-fg-primary)] font-medium">
              첨부파일 ({post.attachments.length})
            </span>
            <span className="text-[color:var(--color-fg-secondary)]">▼</span>
          </div>
        )}

        {/* 본문 내용 */}
        <div className="mt-4 text-[color:var(--color-fg-primary)] leading-relaxed whitespace-pre-wrap">
          {post.content}
        </div>
      </article>

      {/* 댓글 섹션 */}
      <section className="mt-5 bg-[color:var(--color-bg-elev-2)] border border-[color:var(--color-border-subtle)] rounded-xl p-4">
        <h2 className="text-lg font-semibold text-[color:var(--color-fg-primary)] flex items-baseline gap-2">
          댓글 <span className="text-[color:#b45309]">[{isCommentsLoading ? "..." : comments.length}]</span>
        </h2>

        {/* 댓글 입력 */}
        <div className="grid grid-cols-[1fr_auto] gap-2 mt-3">
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleCommentSubmit();
              }
            }}
            placeholder="댓글을 입력하세요"
            aria-label="댓글 입력"
            disabled={createCommentMutation.isPending}
            className="px-3 py-2 rounded-lg border border-[color:var(--color-border-subtle)] bg-[color:var(--color-bg-elev-1)] text-[color:var(--color-fg-primary)] outline-none focus:ring-2 focus:ring-[color:var(--color-accent)] disabled:opacity-50"
          />
          <button
            onClick={handleCommentSubmit}
            disabled={createCommentMutation.isPending || !commentText.trim()}
            className="px-4 py-2 rounded-lg border border-[color:var(--color-border-subtle)] bg-[color:var(--color-accent)] font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createCommentMutation.isPending ? "등록 중..." : "등록"}
          </button>
        </div>

        {/* 댓글 목록 */}
        <div className="mt-3" aria-live="polite">
          {isCommentsLoading ? (
            <div className="text-center py-4">
              <span className="text-[color:var(--color-fg-muted)]">댓글을 불러오는 중...</span>
            </div>
          ) : commentsError ? (
            <div className="text-center py-4">
              <span className="text-[color:var(--color-error)]">댓글을 불러오는 데 실패했습니다.</span>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-4">
              <span className="text-[color:var(--color-fg-muted)]">첫 댓글을 작성해보세요!</span>
            </div>
          ) : (
            comments.map((comment) => (
              <div
                key={comment.id}
                className="grid grid-cols-[40px_1fr_auto] gap-3 py-3 border-t first:border-t-0 border-[color:var(--color-border-subtle)]"
              >
                {/* 아바타 */}
                <div className="w-10 h-10 rounded-full bg-[color:var(--color-bg-elev-1)] border border-[color:var(--color-border-subtle)] flex items-center justify-center text-[color:var(--color-fg-muted)] text-sm font-semibold">
                  {comment.author.nickname[0]?.toUpperCase() || "?"}
                </div>

                {/* 댓글 내용 */}
                <div>
                  <div className="text-[color:var(--color-fg-primary)]">{comment.content}</div>
                  <div className="text-xs text-[color:var(--color-fg-secondary)] mt-1">
                    {comment.author.nickname} · {new Date(comment.createdAt).toLocaleString("ko-KR")}
                  </div>
                </div>

                {/* 삭제 버튼 */}
                <button
                  onClick={() => handleCommentDelete(comment.id)}
                  disabled={deleteCommentMutation.isPending}
                  className="text-xs text-[color:var(--color-fg-muted)] hover:text-[color:var(--color-error)] disabled:opacity-50"
                  aria-label="댓글 삭제"
                >
                  삭제
                </button>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
