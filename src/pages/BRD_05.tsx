import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  usePost,
  useLikePost,
  useDeletePost,
  useViewPost,
  useCreateComment,
  useUpdateComment,
  useDeleteComment,
} from "@/hooks/api";
import { CreateCommentRequest } from "@/types";
import { Loading } from "@/components/Loading";

import { useQueryClient } from "@tanstack/react-query";
import { POST_QUERY_KEYS } from "@/hooks/api/usePost"; // 위치는 프로젝트에 맞게

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
 *
 * API 응답 형식:
 * GET /api/community/posts/{postId} 요청 시 다음 형식으로 데이터를 받음:
 * {
 *   status: 200,
 *   body: {
 *     postId, title, content, category, authorNickname, authorId,
 *     hit, likeCount, commentCount, isLiked, warnings, createdAt, updatedAt,
 *     comments: [{ commentId, content, authorNickname, authorId, createdAt }]
 *   },
 *   message: "게시글 상세 조회 성공"
 * }
 * 게시글 정보와 댓글이 함께 반환되므로 별도의 댓글 조회 API 호출이 불필요함
 */

export default function PostShow() {
  // URL에서 postId 파라미터 추출 (예: /boards/123 → postId = "123")
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();

  // 댓글 입력 필드의 상태 관리
  const [commentText, setCommentText] = useState("");

  // 댓글 수정 상태 관리
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingCommentText, setEditingCommentText] = useState("");

  // 스포일러 가림막 상태 (true가 되면 가림막 해제)
  const [isSpoilerRevealed, setIsSpoilerRevealed] = useState(false);

  // ===== API 데이터 페칭 =====

  // 1. 게시글 상세 정보 가져오기 (GET /community/posts/{postId})
  // 게시글 데이터와 함께 댓글(comments) 배열도 포함되어 반환됨
  const {
    data: post,
    isLoading: isPostLoading,
    error: postError,
    refetch, // ✅ 추가: 저장/등록/삭제 후 강제 재요청에 사용
  } = usePost(postId || "");


  // 2. 좋아요 토글 mutation (POST/DELETE /community/posts/{postId}/like)
  const likeMutation = useLikePost();

  // 3. 댓글 작성 mutation (POST /community/posts/{postId}/comments)
  const createCommentMutation = useCreateComment({
    onSuccess: async () => {
      setCommentText("");   // 기존 동작 유지
      await refetch();      // ✅ 등록 직후 게시글(댓글 포함) 다시 GET
    },
  });


  // 4. 댓글 수정 mutation (PUT /community/comments/{commentId})
  const updateCommentMutation = useUpdateComment({
    onSuccess: async () => {
      setEditingCommentId(null);
      setEditingCommentText("");
      await refetch();      // ✅ 수정 직후 다시 GET
    },
  });


  // 5. 댓글 삭제 mutation (DELETE /community/posts/{postId}/comments/{commentId})
  const deleteCommentMutation = useDeleteComment({
    onSuccess: async () => {
      await refetch();      // ✅ 삭제 직후 다시 GET
    },
  });

  const queryClient = useQueryClient();

  // 6. 게시글 삭제 mutation (DELETE /community/posts/{postId})
  const deletePostMutation = useDeletePost({
    onSuccess: async () => {
      // 모든 posts 관련 쿼리 무효화 (BRD_04의 쿼리 포함)
      await queryClient.invalidateQueries({ queryKey: ["posts"], refetchType: "all" });

      alert("게시글이 삭제되었습니다.");
      navigate("/boards"); // 리스트 페이지로 이동 (refetchOnMount로 자동 갱신됨)
    },
    onError: (error) => {
      alert(`게시글 삭제 실패: ${error.message}`);
    },
  });


  // 7. 게시글 조회수 증가 mutation (POST /community/posts/{postId}/view)
  const viewPostMutation = useViewPost();

  // ===== 조회수 자동 증가 =====
  // 게시글이 로드되면 조회수를 증가시킴
  useEffect(() => {
    if (postId && post) {
      viewPostMutation.mutate(postId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId, post?.postId]); // post?.postId로 게시글이 로드되었을 때만 실행

  // 스포일러 게시글이 로드될 때마다 가림막 초기화
  useEffect(() => {
    setIsSpoilerRevealed(false);
  }, [post?.postId]);

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
   * 댓글 수정 모드 진입 핸들러
   * - 댓글 수정 모드로 전환하고 현재 내용을 편집 필드에 설정
   */
  function handleCommentEdit(commentId: number, content: string) {
    // TODO: 로그인 기능 구현 후 작성자 권한 체크
    setEditingCommentId(commentId);
    setEditingCommentText(content);
  }

  /**
   * 댓글 수정 저장 핸들러
   * - 수정된 댓글 내용을 서버에 전송
   */
  function handleCommentUpdate() {
    if (!editingCommentText.trim() || editingCommentId === null || !postId) return;

    updateCommentMutation.mutate({
      commentId: String(editingCommentId),
      postId: postId,
      data: { content: editingCommentText.trim() },
    });
  }


  /**
   * 댓글 수정 취소 핸들러
   * - 편집 모드를 종료하고 상태 초기화
   */
  function handleCommentEditCancel() {
    setEditingCommentId(null);
    setEditingCommentText("");
  }

  /**
   * 댓글 삭제 핸들러
   * - 사용자 확인 후 댓글 삭제 요청
   * - 성공 시 댓글 목록이 자동 갱신됨
   */
  function handleCommentDelete(commentId: string) {
    if (!postId) return;
    // TODO: 로그인 기능 구현 후 작성자 권한 체크
    if (confirm("댓글을 삭제하시겠습니까?")) {
      deleteCommentMutation.mutate({ commentId, postId });
    }
  }

  /**
   * 게시글 수정 핸들러
   * - 수정 페이지로 이동
   */
  function handleEdit() {
    if (!postId) return;
    // TODO: 로그인 기능 구현 후 작성자 권한 체크
    // if (post.authorId !== currentUser.id) {
    //   alert("작성자만 수정할 수 있습니다.");
    //   return;
    // }
    navigate(`/boards/${postId}/edit`);
  }

  /**
   * 게시글 삭제 핸들러
   * - 사용자 확인 후 게시글 삭제 요청
   * - 성공 시 목록으로 이동
   */
  function handleDelete() {
    if (!postId) return;
    // TODO: 로그인 기능 구현 후 작성자 권한 체크
    // if (post.authorId !== currentUser.id) {
    //   alert("작성자만 삭제할 수 있습니다.");
    //   return;
    // }
    if (confirm("게시글을 삭제하시겠습니까?")) {
      deletePostMutation.mutate(postId);
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

  // 댓글 목록 추출 (게시글 데이터에 포함된 comments 배열 사용, 없으면 빈 배열)
  const comments = post?.comments || [];

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
        className="relative bg-[color:var(--color-bg-elev-1)] border border-[color:var(--color-border-subtle)] rounded-xl p-5 shadow-sm"
      >
        {post.isSpoiler && !isSpoilerRevealed && (
          <button
            type="button"
            onClick={() => setIsSpoilerRevealed(true)}
            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-xl bg-[color:var(--color-bg-elev-2)]/95 text-center text-base font-semibold text-[color:var(--color-fg-primary)] backdrop-blur"
            aria-label="스포일러 가림막 해제"
          >
            <span className="text-lg">스포일러 방지</span>
            <span className="text-sm text-[color:var(--color-fg-secondary)]">클릭하면 게시글이 표시됩니다.</span>
          </button>
        )}

        <div
          className={`transition-opacity ${
            post.isSpoiler && !isSpoilerRevealed ? "pointer-events-none select-none opacity-0" : "opacity-100"
          }`}
          aria-hidden={post.isSpoiler && !isSpoilerRevealed}
        >
          <header className="flex items-center justify-between gap-4">
          {/* 게시글 제목 (API의 title 필드) */}
          <h1 id="title" className="text-2xl font-extrabold text-[color:var(--color-fg-primary)]">
            {post.title}
          </h1>

          {/* 버튼 그룹 */}
          <div className="flex items-center gap-2">
            {/* TODO: 로그인 후 작성자 확인 - post.authorId === currentUser.id 일 때만 표시 */}
            {/* 수정 버튼 */}
            <button
              onClick={handleEdit}
              className="inline-flex items-center gap-1 bg-[color:var(--color-bg-elev-2)] border border-[color:var(--color-border-subtle)] rounded-lg px-3 py-2 text-sm hover:bg-[color:var(--color-bg-elev-1)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]"
              aria-label="게시글 수정"
            >
              ✏️ 수정
            </button>

            {/* 삭제 버튼 */}
            <button
              onClick={handleDelete}
              disabled={deletePostMutation.isPending}
              className="inline-flex items-center gap-1 bg-[color:var(--color-bg-elev-2)] border border-[color:var(--color-border-subtle)] rounded-lg px-3 py-2 text-sm hover:bg-[color:var(--color-error)] hover:text-white focus:outline-none focus:ring-2 focus:ring-[color:var(--color-error)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="게시글 삭제"
            >
              🗑️ 삭제
            </button>

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
          </div>
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
        <div className="relative mt-4">
          <div
            className={`text-[color:var(--color-fg-primary)] leading-relaxed whitespace-pre-wrap ${
              post.isSpoiler && !isSpoilerRevealed ? "blur-sm select-none" : ""
            }`}
            aria-hidden={post.isSpoiler && !isSpoilerRevealed}
          >
            {post.content}
          </div>

          {post.isSpoiler && !isSpoilerRevealed && (
            <button
              type="button"
              onClick={() => setIsSpoilerRevealed(true)}
              className="absolute inset-0 flex items-center justify-center rounded-lg bg-[color:var(--color-bg-elev-1)]/95 text-center text-base font-semibold text-[color:var(--color-fg-primary)]"
              aria-label="스포일러 가림막 해제"
            >
              스포일러 방지. 클릭하면 해제합니다.
            </button>
          )}
        </div>
        </div>
      </article>

      {/* ========== 댓글 섹션 ========== */}
      {/* 댓글 목록 조회, 작성, 삭제 기능을 제공하는 영역 */}
      <section className="mt-5 bg-[color:var(--color-bg-elev-2)] border border-[color:var(--color-border-subtle)] rounded-xl p-4">
        <h2 className="text-lg font-semibold text-[color:var(--color-fg-primary)] flex items-baseline gap-2">
          {/* 댓글 개수 표시 (API의 commentCount 필드 사용) */}
          댓글 <span className="text-[color:#b45309]">[{post.commentCount}]</span>
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
        {/* 게시글 데이터에 포함된 comments 배열을 표시 */}
        <div className="mt-3" aria-live="polite">
          {comments.length === 0 ? (
            // 댓글이 없는 경우
            <div className="text-center py-4">
              <span className="text-[color:var(--color-fg-muted)]">첫 댓글을 작성해보세요!</span>
            </div>
          ) : (
            // 댓글 목록 표시
            // API 응답의 comments 배열을 순회하며 각 댓글 렌더링
            comments.map((comment) => {
              const isEditing = editingCommentId === comment.commentId;

              return (
                <React.Fragment key={comment.commentId}>
                  <div className="grid grid-cols-[40px_1fr_auto] gap-3 py-3 border-t first:border-t-0 border-[color:var(--color-border-subtle)]">
                    {/* 작성자 아바타 (닉네임의 첫 글자로 표시) */}
                    <div className="w-10 h-10 rounded-full bg-[color:var(--color-bg-elev-1)] border border-[color:var(--color-border-subtle)] flex items-center justify-center text-[color:var(--color-fg-muted)] text-sm font-semibold">
                      {comment.authorNickname[0]?.toUpperCase() || "?"}
                    </div>

                    {/* 댓글 내용 및 메타 정보 */}
                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        // 편집 모드
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={editingCommentText}
                            onChange={(e) => setEditingCommentText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleCommentUpdate();
                              } else if (e.key === "Escape") {
                                handleCommentEditCancel();
                              }
                            }}
                            disabled={updateCommentMutation.isPending}
                            className="flex-1 px-3 py-2 rounded-lg border border-[color:var(--color-border-subtle)] bg-[color:var(--color-bg-elev-1)] text-[color:var(--color-fg-primary)] outline-none focus:ring-2 focus:ring-[color:var(--color-accent)] disabled:opacity-50"
                            autoFocus
                          />
                          <button
                            onClick={handleCommentUpdate}
                            disabled={updateCommentMutation.isPending || !editingCommentText.trim()}
                            className="px-3 py-2 rounded-lg border border-[color:var(--color-border-subtle)] bg-[color:var(--color-accent)] text-sm font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {updateCommentMutation.isPending ? "저장 중..." : "저장"}
                          </button>
                          <button
                            onClick={handleCommentEditCancel}
                            disabled={updateCommentMutation.isPending}
                            className="px-3 py-2 rounded-lg border border-[color:var(--color-border-subtle)] bg-[color:var(--color-bg-elev-2)] text-sm hover:opacity-90 disabled:opacity-50"
                          >
                            취소
                          </button>
                        </div>
                      ) : (
                        // 일반 모드
                        <>
                          {/* 댓글 본문 (comment.content) */}
                          <div className="text-[color:var(--color-fg-primary)]">{comment.content}</div>
                          {/* 작성자 닉네임 및 작성 시간 */}
                          <div className="text-xs text-[color:var(--color-fg-secondary)] mt-1">
                            {comment.authorNickname} · {new Date(comment.createdAt).toLocaleString("ko-KR")}
                          </div>
                        </>
                      )}
                    </div>

                    {/* 댓글 수정/삭제/답글 버튼 */}
                    {!isEditing && (
                      <div className="flex gap-2">
                        {/* TODO: 로그인 후 작성자 확인 - comment.authorId === currentUser.id 일 때만 표시 */}
                        <button
                          onClick={() => handleCommentEdit(comment.commentId, comment.content)}
                          className="text-xs text-[color:var(--color-fg-muted)] hover:text-[color:var(--color-accent)]"
                          aria-label="댓글 수정"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleCommentDelete(String(comment.commentId))}
                          disabled={deleteCommentMutation.isPending}
                          className="text-xs text-[color:var(--color-fg-muted)] hover:text-[color:var(--color-error)] disabled:opacity-50"
                          aria-label="댓글 삭제"
                        >
                          삭제
                        </button>
                      </div>
                    )}
                  </div>
                </React.Fragment>
              );
            })
          )}
        </div>
      </section>
    </main>
  );
}
