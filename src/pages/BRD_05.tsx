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
import { Loading } from "@/components/Loading";

/**
 * 게시글 상세 페이지 (BRD_05)
 *
 * 역할:
 * - BRD_04에서 게시글을 클릭하면 /boards/{postId} 경로로 이동하여 이 페이지가 표시됨
 * - API를 통해 게시글 상세 정보를 불러와서 표시
 * - 좋아요, 댓글 작성/삭제 등의 인터랙션 제공
 *
 * 주요 기능:
 * 1. 게시글 상세 정보 표시 (제목, 내용, 작성자, 조회수, 작성일 등)
 * 2. 좋아요 버튼 (isLiked 상태에 따라 ❤️/🤍 표시)
 * 3. 첨부파일 목록 표시
 * 4. 댓글 목록 조회 및 작성/삭제
 */

export default function PostShow() {
  // URL에서 postId 파라미터 추출 (예: /boards/123 → postId = "123")
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();

  // 댓글 입력 필드의 상태 관리
  const [commentText, setCommentText] = useState("");

  // ===== API 데이터 페칭 =====

  // 1. 게시글 상세 정보 가져오기 (GET /community/posts/{postId})
  const {
    data: post,           // 게시글 데이터 (title, content, authorNickname, hit, likeCount, isLiked 등)
    isLoading: isPostLoading,  // 로딩 중 여부
    error: postError,     // 에러 발생 시 에러 객체
  } = usePost(postId || "");

  // 2. 댓글 목록 가져오기 (GET /community/posts/{postId}/comments)
  const {
    data: commentsData,   // 댓글 목록 데이터
    isLoading: isCommentsLoading,
    error: commentsError,
  } = useComments({ postId: postId || "", page: 1, pageSize: 50 });

  // 3. 좋아요 토글 mutation (POST/DELETE /community/posts/{postId}/like)
  const likeMutation = useLikePost();

  // 4. 댓글 작성 mutation (POST /community/posts/{postId}/comments)
  const createCommentMutation = useCreateComment({
    onSuccess: () => setCommentText(""),  // 댓글 작성 성공 시 입력 필드 초기화
  });

  // 5. 댓글 삭제 mutation (DELETE /community/posts/{postId}/comments/{commentId})
  const deleteCommentMutation = useDeleteComment();

  // ===== 이벤트 핸들러 =====

  /**
   * 좋아요 버튼 클릭 핸들러
   * - 현재 isLiked 상태에 따라 좋아요 추가/취소를 서버에 요청
   * - 성공 시 React Query가 자동으로 데이터를 갱신하여 UI 업데이트
   */
  function handleLike() {
    if (!postId || !post) return;
    likeMutation.mutate({
      postId,
      isLiked: post.isLiked || false,  // 현재 좋아요 상태
    });
  }

  /**
   * 댓글 작성 핸들러
   * - 입력된 댓글 내용을 서버로 전송
   * - 성공 시 댓글 목록이 자동 갱신되고 입력 필드가 초기화됨
   */
  function handleCommentSubmit() {
    const trimmed = commentText.trim();
    if (!trimmed || !postId) return;  // 빈 댓글은 전송하지 않음

    const request: CreateCommentRequest = {
      postId,
      content: trimmed,
    };

    createCommentMutation.mutate(request);
  }

  /**
   * 댓글 삭제 핸들러
   * - 사용자 확인 후 댓글 삭제 요청
   * - 성공 시 댓글 목록이 자동 갱신됨
   */
  function handleCommentDelete(commentId: string) {
    if (!postId) return;
    if (confirm("댓글을 삭제하시겠습니까?")) {
      deleteCommentMutation.mutate({ commentId, postId });
    }
  }

  // ===== 로딩 및 에러 처리 =====

  // 1. postId가 없는 경우 (잘못된 URL 접근)
  if (!postId) {
    return (
      <div className="w-full min-h-[400px] flex items-center justify-center">
        <p className="text-[color:var(--color-fg-muted)]">잘못된 게시글 ID입니다.</p>
      </div>
    );
  }

  // 2. 게시글 데이터 로딩 중
  if (isPostLoading) {
    return <Loading message="게시글을 불러오는 중..." />;
  }

  // 3. 게시글 로딩 실패 또는 데이터가 없는 경우
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

  // 댓글 목록 추출 (없으면 빈 배열)
  const comments = commentsData?.items || [];

  // ===== UI 렌더링 =====
  return (
    <main
      className="w-full min-w-[1100px] min-h-[800px] mx-auto px-6 py-8 bg-[color:var(--color-bg-elev-1)]"
      data-model-id="post:show"
    >
      {/* ========== 상단 헤더 바 ========== */}
      {/* 게시글 메타 정보 표시: 작성일, 조회수, 작성자 */}
      <section className="rounded-xl overflow-hidden border border-[color:var(--color-border-subtle)] shadow-sm mb-4">
        <div className="h-[68px] bg-[color:var(--color-accent)] flex items-center justify-between px-5">
          <h2 className="text-[color:var(--color-fg-secondary)] text-xl font-semibold">게시글</h2>
          <div className="flex items-center gap-4 text-[color:var(--color-fg-secondary)] text-sm">
            {/* API에서 받아온 createdAt 필드를 한국 시간 형식으로 표시 */}
            <span>작성: {new Date(post.createdAt).toLocaleString("ko-KR")}</span>
            {/* API에서 받아온 hit(조회수) 필드를 천 단위 구분자와 함께 표시 */}
            <span>조회: {post.hit.toLocaleString()}</span>
            {/* API에서 받아온 authorNickname 필드 표시 */}
            <span>작성자: {post.authorNickname}</span>
          </div>
        </div>
      </section>

      {/* ========== 게시글 본문 카드 ========== */}
      {/* 제목, 내용, 좋아요 버튼, 첨부파일을 표시하는 메인 영역 */}
      <article
        aria-labelledby="title"
        className="bg-[color:var(--color-bg-elev-1)] border border-[color:var(--color-border-subtle)] rounded-xl p-5 shadow-sm"
      >
        <header className="flex items-center justify-between gap-4">
          {/* 게시글 제목 (API의 title 필드) */}
          <h1 id="title" className="text-2xl font-extrabold text-[color:var(--color-fg-primary)]">
            {post.title}
          </h1>

          {/* 좋아요 버튼 */}
          {/* - isLiked 상태에 따라 ❤️(좋아요 누름) 또는 🤍(안 누름) 표시 */}
          {/* - likeCount 숫자 표시 */}
          {/* - 클릭 시 handleLike 함수 호출하여 좋아요 토글 */}
          <button
            onClick={handleLike}
            disabled={likeMutation.isPending}  // 요청 중에는 비활성화
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
        {/* attachments 배열이 있고 길이가 0보다 크면 표시 */}
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
        {/* API의 content 필드를 표시 */}
        {/* whitespace-pre-wrap으로 줄바꿈 유지 */}
        <div className="mt-4 text-[color:var(--color-fg-primary)] leading-relaxed whitespace-pre-wrap">
          {post.content}
        </div>
      </article>

      {/* ========== 댓글 섹션 ========== */}
      {/* 댓글 목록 조회, 작성, 삭제 기능을 제공하는 영역 */}
      <section className="mt-5 bg-[color:var(--color-bg-elev-2)] border border-[color:var(--color-border-subtle)] rounded-xl p-4">
        <h2 className="text-lg font-semibold text-[color:var(--color-fg-primary)] flex items-baseline gap-2">
          {/* 댓글 개수 표시 (로딩 중이면 "..." 표시) */}
          댓글 <span className="text-[color:#b45309]">[{isCommentsLoading ? "..." : comments.length}]</span>
        </h2>

        {/* 댓글 입력 폼 */}
        {/* - 텍스트 입력 필드 + 등록 버튼 */}
        {/* - Enter 키로도 제출 가능 (Shift+Enter는 제외) */}
        <div className="grid grid-cols-[1fr_auto] gap-2 mt-3">
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => {
              // Enter 키 눌렀을 때 댓글 제출 (Shift+Enter는 제외)
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleCommentSubmit();
              }
            }}
            placeholder="댓글을 입력하세요"
            aria-label="댓글 입력"
            disabled={createCommentMutation.isPending}  // 제출 중에는 비활성화
            className="px-3 py-2 rounded-lg border border-[color:var(--color-border-subtle)] bg-[color:var(--color-bg-elev-1)] text-[color:var(--color-fg-primary)] outline-none focus:ring-2 focus:ring-[color:var(--color-accent)] disabled:opacity-50"
          />
          <button
            onClick={handleCommentSubmit}
            disabled={createCommentMutation.isPending || !commentText.trim()}  // 제출 중이거나 빈 텍스트면 비활성화
            className="px-4 py-2 rounded-lg border border-[color:var(--color-border-subtle)] bg-[color:var(--color-accent)] font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createCommentMutation.isPending ? "등록 중..." : "등록"}
          </button>
        </div>

        {/* 댓글 목록 렌더링 */}
        {/* 상태에 따라 다른 내용을 표시: 로딩 중 / 에러 / 댓글 없음 / 댓글 목록 */}
        <div className="mt-3" aria-live="polite">
          {isCommentsLoading ? (
            // 1. 댓글 로딩 중
            <div className="text-center py-4">
              <span className="text-[color:var(--color-fg-muted)]">댓글을 불러오는 중...</span>
            </div>
          ) : commentsError ? (
            // 2. 댓글 로딩 실패
            <div className="text-center py-4">
              <span className="text-[color:var(--color-error)]">댓글을 불러오는 데 실패했습니다.</span>
            </div>
          ) : comments.length === 0 ? (
            // 3. 댓글이 없는 경우
            <div className="text-center py-4">
              <span className="text-[color:var(--color-fg-muted)]">첫 댓글을 작성해보세요!</span>
            </div>
          ) : (
            // 4. 댓글 목록 표시
            // API에서 받아온 comments 배열을 순회하며 각 댓글 렌더링
            comments.map((comment) => (
              <div
                key={comment.commentId}
                className="grid grid-cols-[40px_1fr_auto] gap-3 py-3 border-t first:border-t-0 border-[color:var(--color-border-subtle)]"
              >
                {/* 작성자 아바타 (닉네임의 첫 글자로 표시) */}
                <div className="w-10 h-10 rounded-full bg-[color:var(--color-bg-elev-1)] border border-[color:var(--color-border-subtle)] flex items-center justify-center text-[color:var(--color-fg-muted)] text-sm font-semibold">
                  {comment.authorNickname[0]?.toUpperCase() || "?"}
                </div>

                {/* 댓글 내용 및 메타 정보 */}
                <div>
                  {/* 댓글 본문 (comment.content) */}
                  <div className="text-[color:var(--color-fg-primary)]">{comment.content}</div>
                  {/* 작성자 닉네임 및 작성 시간 */}
                  <div className="text-xs text-[color:var(--color-fg-secondary)] mt-1">
                    {comment.authorNickname} · {new Date(comment.createdAt).toLocaleString("ko-KR")}
                  </div>
                </div>

                {/* 댓글 삭제 버튼 */}
                {/* 클릭 시 handleCommentDelete 함수 호출 */}
                <button
                  onClick={() => handleCommentDelete(String(comment.commentId))}
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
