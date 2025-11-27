import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  usePost,
  useLikePost,
  useDeletePost,
  useViewPost,
  useCreateComment,
  useUpdateComment,
  useDeleteComment,
  useToggleRecruitmentApply,
} from "@/hooks/api";
import { useBookDetail } from "@/hooks/api/useBook";
import { useCreateRoom } from "@/hooks/api/useChat";
import { CreateCommentRequest } from "@/types";
import { Loading } from "@/components/Loading";
import { useToast } from "@/components/Toast/ToastProvider";
import { ConfirmModal } from "@/components/ConfirmModal/ConfirmModal";
import DOMPurify from "dompurify";
import { getDownloadUrl, formatFileSize, isImageFile } from "@/api/files";
import { isLoggedIn } from "@/utils/auth";
import { useQueryClient } from "@tanstack/react-query";
import { Avatar } from "@/components/Avatar/Avatar";
import { extractUserIdFromToken } from "@/utils/auth";
import { useAuth } from "@/contexts/AuthContext";

/**
 * HTML 엔티티 디코딩 함수
 * - &gt;, &lt;, &amp; 등의 HTML 엔티티를 실제 문자로 변환
 */
function decodeHtmlEntities(text: string): string {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
}

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
  const toast = useToast();
  const { accessToken } = useAuth();

  // 댓글 입력 필드의 상태 관리
  const [commentText, setCommentText] = useState("");

  // 댓글 수정 상태 관리
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingCommentText, setEditingCommentText] = useState("");

  // 스포일러 가림막 상태 (true가 되면 가림막 해제)
  const [isSpoilerRevealed, setIsSpoilerRevealed] = useState(false);

  // 첨부파일 영역 확장/축소 상태
  const [isAttachmentsExpanded, setIsAttachmentsExpanded] = useState(false);

  // 삭제 확인 모달 상태
  const [deletePostModalOpen, setDeletePostModalOpen] = useState(false);
  const [deleteCommentModalOpen, setDeleteCommentModalOpen] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);

  // 작성자 메뉴 상태
  const [isAuthorMenuOpen, setIsAuthorMenuOpen] = useState(false);
  const authorMenuRef = useRef<HTMLDivElement>(null);

  // 댓글 작성자 메뉴 상태 (commentId를 키로 사용)
  const [openCommentMenuId, setOpenCommentMenuId] = useState<number | null>(null);

  // ===== API 데이터 페칭 =====

  // 1. 게시글 상세 정보 가져오기 (GET /community/posts/{postId})
  // 게시글 데이터와 함께 댓글(comments) 배열도 포함되어 반환됨
  const {
    data: post,
    isLoading: isPostLoading,
    error: postError,
    refetch: _refetch, // ✅ 추가: 저장/등록/삭제 후 강제 재요청에 사용
  } = usePost(postId || "");


  // 2. 좋아요 토글 mutation (POST/DELETE /community/posts/{postId}/like)
  const likeMutation = useLikePost();

  // 3. 댓글 작성 mutation (POST /community/posts/{postId}/comments)
  const createCommentMutation = useCreateComment({
    onSuccess: () => {
      setCommentText("");   // 입력 필드 초기화
      // useCreateComment 훅에서 setQueryData로 캐시 업데이트하므로 refetch 불필요
    },
  });


  // 4. 댓글 수정 mutation (PUT /community/comments/{commentId})
  const updateCommentMutation = useUpdateComment({
    onSuccess: () => {
      setEditingCommentId(null);
      setEditingCommentText("");
      // useUpdateComment 훅에서 setQueryData로 캐시 업데이트하므로 refetch 불필요
    },
  });


  // 5. 댓글 삭제 mutation (DELETE /community/posts/{postId}/comments/{commentId})
  const deleteCommentMutation = useDeleteComment({
    onSuccess: () => {
      // useDeleteComment 훅에서 setQueryData로 캐시 업데이트하므로 refetch 불필요
    },
  });

  const queryClient = useQueryClient();

  // 본문 HTML 가공 (요약 텍스트 추출용)
  // - useMemo로 DOMPurify/DOM 파싱 비용을 post?.content 변경 시점에만 실행
  const sanitizedContent = useMemo(
    () => DOMPurify.sanitize(decodeHtmlEntities(post?.content ?? "")),
    [post?.content]
  );

  const plainContentSummary = useMemo(() => {
    const temp = document.createElement("div");
    temp.innerHTML = sanitizedContent;
    return temp.textContent?.replace(/\s+/g, " ").trim() ?? "";
  }, [sanitizedContent]);

  // 6. 책 정보 조회 (REVIEW 카테고리인 경우)
  const { data: bookDetail, isLoading: _isBookLoading } = useBookDetail(
    post?.category === "REVIEW" && post?.bookId ? String(post.bookId) : ""
  );

  // 7. 게시글 삭제 mutation (DELETE /community/posts/{postId})
  const deletePostMutation = useDeletePost({
    onSuccess: async () => {
      // 모든 posts 관련 쿼리 무효화 (BRD_04의 쿼리 포함)
      await queryClient.invalidateQueries({ queryKey: ["posts"], refetchType: "all" });

      toast.show({ title: "게시글이 삭제되었습니다.", variant: "success" });
      setDeletePostModalOpen(false);
      navigate("/boards"); // 리스트 페이지로 이동 (refetchOnMount로 자동 갱신됨)
    },
    onError: (error) => {
      toast.show({ title: `게시글 삭제 실패: ${error.message}`, variant: "error" });
      setDeletePostModalOpen(false);
    },
  });


  // 7. 게시글 조회수 증가 - POST 요청으로 조회수 증가
  const viewPostMutation = useViewPost();

  // 조회수 증가 API 호출 여부를 추적하는 ref
  const hasCalledViewApi = useRef<string | null>(null);

  // 8. 모임 참여 토글 mutation
  const toggleRecruitmentMutation = useToggleRecruitmentApply({
    onSuccess: () => {
      // useToggleRecruitmentApply hook에서 캐시 업데이트를 처리하므로
      // 별도의 refetch는 불필요 (race condition 방지)
      toast.show({
        title: "처리되었습니다.",
        variant: "success"
      });
    },
    onError: (error: any) => {
      // 백엔드 응답에서 message 추출
      const errorMessage = error.response?.data?.message || error.message || "참여 처리에 실패했습니다.";
      const statusCode = error.response?.status;

      // 400번대, 500번대 에러 경고창 표시
      if (statusCode && (statusCode >= 400 && statusCode < 600)) {
        alert(`[오류 ${statusCode}] ${errorMessage}`);
      }

      // Toast도 함께 표시
      toast.show({
        title: errorMessage,
        variant: "error"
      });
    },
  });

  // 9. 1:1 채팅방 생성 mutation
  const createRoomMutation = useCreateRoom({
    onSuccess: (data) => {
      toast.show({ title: "채팅방이 생성되었습니다.", variant: "success" });
      // 채팅방 페이지로 이동
      navigate(`/chat?roomId=${data.roomId}`);
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message || "채팅방 생성에 실패했습니다.";
      toast.show({ title: errorMessage, variant: "error" });
    },
  });

  // 스포일러 게시글이 로드될 때마다 가림막 초기화
  useEffect(() => {
    setIsSpoilerRevealed(false);
  }, [post?.postId]);

  // 게시글 조회수 증가 - 페이지 진입 시 한 번만 호출
  useEffect(() => {
    // 이미 이 게시글에 대해 조회수 증가 API를 호출했으면 스킵
    if (postId && !isPostLoading && post && hasCalledViewApi.current !== postId) {
      viewPostMutation.mutate(postId);
      hasCalledViewApi.current = postId; // 호출 완료 표시
    }
  }, [postId, post, isPostLoading, viewPostMutation]); // post가 로드된 직후에만 실행

  // 작성자 메뉴 외부 클릭 감지
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (authorMenuRef.current && !authorMenuRef.current.contains(event.target as Node)) {
        setIsAuthorMenuOpen(false);
      }
    }
    if (isAuthorMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isAuthorMenuOpen]);

  // ===== 이벤트 핸들러 =====

  /**
   * 좋아요 버튼 클릭 핸들러
   * - 현재 isLiked 상태에 따라 좋아요 추가/취소를 서버에 요청
   * - 성공 시 React Query가 자동으로 데이터를 갱신하여 UI 업데이트
   */
  function handleLike() {
    // 로그인 확인
    if (!isLoggedIn()) {
      alert("권한이 필요합니다.");
      navigate("/login", { state: { from: { pathname: `/boards/${postId}` } } });
      return;
    }

    if (!postId || !post) return;

    console.log('🖱️ 좋아요 버튼 클릭:', { postId, currentIsLiked: post.isLiked, currentLikeCount: post.likeCount });

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
    // TODO: 로그인 기능 구현 후 활성화
    // if (!isLoggedIn()) {
    //   toast.show({ title: "로그인이 필요합니다.", variant: "warning" });
    //   navigate("/login", { state: { from: { pathname: `/boards/${postId}` } } });
    //   return;
    // }

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
    // TODO: 로그인 기능 구현 후 활성화
    // if (!isLoggedIn()) {
    //   toast.show({ title: "로그인이 필요합니다.", variant: "warning" });
    //   navigate("/login", { state: { from: { pathname: `/boards/${postId}` } } });
    //   return;
    // }

    // TODO: 작성자 권한 체크
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
   * - 삭제 확인 모달 표시
   */
  function handleCommentDelete(commentId: string) {
    if (!postId) return;

    // TODO: 로그인 기능 구현 후 활성화
    // if (!isLoggedIn()) {
    //   toast.show({ title: "로그인이 필요합니다.", variant: "warning" });
    //   navigate("/login", { state: { from: { pathname: `/boards/${postId}` } } });
    //   return;
    // }

    // TODO: 작성자 권한 체크
    setDeletingCommentId(commentId);
    setDeleteCommentModalOpen(true);
  }

  /**
   * 댓글 삭제 확인
   */
  function confirmCommentDelete() {
    if (!postId || !deletingCommentId) return;
    deleteCommentMutation.mutate({ commentId: deletingCommentId, postId });
    setDeleteCommentModalOpen(false);
    setDeletingCommentId(null);
  }

  /**
   * 게시글 수정 핸들러
   * - 수정 페이지로 이동
   */
  function handleEdit() {
    if (!postId) return;

    // TODO: 로그인 기능 구현 후 활성화
    // if (!isLoggedIn()) {
    //   toast.show({ title: "로그인이 필요합니다.", variant: "warning" });
    //   navigate("/login", { state: { from: { pathname: `/boards/${postId}` } } });
    //   return;
    // }

    // TODO: 작성자 권한 체크
    // if (post.authorId !== currentUser.id) {
    //   toast.show({ title: "작성자만 수정할 수 있습니다.", variant: "warning" });
    //   return;
    // }
    navigate(`/boards/${postId}/edit`);
  }

  /**
   * 게시글 삭제 핸들러
   * - 삭제 확인 모달 표시
   */
  function handleDelete() {
    if (!postId) return;

    // TODO: 로그인 기능 구현 후 활성화
    // if (!isLoggedIn()) {
    //   toast.show({ title: "로그인이 필요합니다.", variant: "warning" });
    //   navigate("/login", { state: { from: { pathname: `/boards/${postId}` } } });
    //   return;
    // }

    // TODO: 작성자 권한 체크
    // if (post.authorId !== currentUser.id) {
    //   toast.show({ title: "작성자만 삭제할 수 있습니다.", variant: "warning" });
    //   return;
    // }
    setDeletePostModalOpen(true);
  }

  /**
   * 게시글 삭제 확인
   */
  function confirmPostDelete() {
    if (!postId) return;
    deletePostMutation.mutate(postId);
  }

  /**
   * 모임 참여 토글 핸들러
   */
  function handleToggleRecruitment() {
    if (!postId) return;

    // 로그인 확인
    if (!isLoggedIn()) {
      alert("권한이 필요합니다.");
      navigate("/login", { state: { from: { pathname: `/boards/${postId}` } } });
      return;
    }

    toggleRecruitmentMutation.mutate(postId);
  }

  /**
   * 1:1 채팅방 생성 핸들러
   */
  function handleCreateDirectChat(targetUserId: number, targetUsername: string) {
    // 로그인 확인
    if (!isLoggedIn()) {
      alert("권한이 필요합니다.");
      navigate("/login");
      return;
    }

    // 현재 사용자 ID 가져오기
    const currentUserIdStr = extractUserIdFromToken(accessToken);
    const currentUserId = currentUserIdStr ? Number(currentUserIdStr) : null;

    if (!currentUserId) {
      alert("사용자 정보를 가져올 수 없습니다.");
      return;
    }

    // 자기 자신과의 채팅방은 생성하지 않음
    if (currentUserId === targetUserId) {
      alert("자기 자신과는 채팅할 수 없습니다.");
      return;
    }

    createRoomMutation.mutate({
      scope: "PRIVATE",
      name: `${targetUsername}님과의 채팅`,
      description: "1:1 채팅방",
      memberIds: [currentUserId, targetUserId],
    });

    setIsAuthorMenuOpen(false);
  }

  /**
   * 댓글 작성자와 1:1 채팅방 생성 핸들러
   */
  function handleCreateCommentDirectChat(targetUserId: number, targetUsername: string) {
    // 로그인 확인
    if (!isLoggedIn()) {
      alert("권한이 필요합니다.");
      navigate("/login");
      return;
    }

    // 현재 사용자 ID 가져오기
    const currentUserIdStr = extractUserIdFromToken(accessToken);
    const currentUserId = currentUserIdStr ? Number(currentUserIdStr) : null;

    if (!currentUserId) {
      alert("사용자 정보를 가져올 수 없습니다.");
      return;
    }

    // 자기 자신과의 채팅방은 생성하지 않음
    if (currentUserId === targetUserId) {
      alert("자기 자신과는 채팅할 수 없습니다.");
      return;
    }

    createRoomMutation.mutate({
      scope: "PRIVATE",
      name: `${targetUsername}님과의 채팅`,
      description: "1:1 채팅방",
      memberIds: [currentUserId, targetUserId],
    });

    setOpenCommentMenuId(null);
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
      className="w-full min-h-screen sm:min-h-[800px] mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 bg-[color:var(--color-bg-elev-1)] mt-[70px] sm:mt-[80px] md:mt-[100px]"
      data-model-id="post:show"
    >

      {/* ========== 상단 헤더 바 ========== */}
      {/* 게시글 메타 정보 표시: 작성일, 조회수, 작성자 */}
      <section className="rounded-lg sm:rounded-xl overflow-hidden border border-[color:var(--color-border-subtle)] shadow-sm mb-3 sm:mb-4">
        <div className="h-[56px] sm:h-[68px] bg-[color:var(--color-accent)] flex flex-col sm:flex-row items-start sm:items-center justify-between px-3 sm:px-5 py-2 sm:py-0 gap-2 sm:gap-0">
          <h2 className="text-[color:var(--color-fg-secondary)] text-base sm:text-lg md:text-xl font-semibold">게시글</h2>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 md:gap-4 text-[color:var(--color-fg-secondary)] text-xs sm:text-sm">
            {/* API에서 받아온 createdAt 필드를 한국 시간 형식으로 표시 */}
            <span className="whitespace-nowrap">작성: {new Date(post.createdAt).toLocaleString("ko-KR", { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            {/* API에서 받아온 hit(조회수) 필드를 천 단위 구분자와 함께 표시 */}
            <span className="whitespace-nowrap">조회: {post.hit.toLocaleString()}</span>
            {/* API에서 받아온 authorNickname 필드 표시 */}
            <span className="whitespace-nowrap truncate max-w-[120px] sm:max-w-none">작성자: {post.authorNickname}</span>
          </div>
        </div>
      </section>

      {/* ========== 게시글 본문 카드 ========== */}
      {/* 제목, 내용, 좋아요 버튼, 첨부파일을 표시하는 메인 영역 */}
      <article
        aria-labelledby="title"
        aria-label={plainContentSummary ? `${post.title}. ${plainContentSummary}` : post.title}
        className="relative bg-[color:var(--color-bg-elev-1)] border border-[color:var(--color-border-subtle)] rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5 shadow-sm"
      >
        {post.isSpoiler && !isSpoilerRevealed && (
          <button
            type="button"
            onClick={() => setIsSpoilerRevealed(true)}
            className="absolute inset-x-0 top-[60px] bottom-0 z-10 flex flex-col items-center justify-center gap-3 rounded-xl bg-[color:var(--color-bg-elev-2)]/95 text-center text-base font-semibold text-[color:var(--color-fg-primary)] backdrop-blur"
            aria-label="스포일러 가림막 해제"
          >
            <span className="text-lg">스포일러 방지</span>
            <span className="text-sm text-[color:var(--color-fg-secondary)]">클릭하면 게시글이 표시됩니다.</span>
          </button>
        )}

        {/* 주의사항/태그 영역 - 항상 표시 (spoiler 가림막 위에) */}
        {post.warnings && post.warnings.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4 relative z-20">
            {post.warnings.map((warning, idx) => (
              <span
                key={idx}
                className="inline-flex items-center px-3 py-1 rounded-full bg-[color:var(--color-bg-elev-2)] border border-[color:var(--color-border-subtle)] text-sm text-[color:var(--color-fg-secondary)] hover:bg-[color:var(--color-bg-elev-1)] transition-colors"
              >
                #{warning.id.warning}
              </span>
            ))}
          </div>
        )}

        <div
          className={`transition-opacity ${
            post.isSpoiler && !isSpoilerRevealed ? "pointer-events-none select-none opacity-0" : "opacity-100"
          }`}
          aria-hidden={post.isSpoiler && !isSpoilerRevealed}
        >
          <header className="flex flex-col gap-3 sm:gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          {/* 게시글 제목 및 작성자 */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <h1 id="title" className="flex-1 text-lg sm:text-xl md:text-2xl font-extrabold text-[color:var(--color-fg-primary)] break-words">
              {post.title}
            </h1>

            {/* 작성자 아바타 및 메뉴 */}
            <div className="relative flex-shrink-0" ref={authorMenuRef}>
              <button
                onClick={() => setIsAuthorMenuOpen(!isAuthorMenuOpen)}
                className="focus:outline-none hover:opacity-80 transition-opacity"
                aria-label={`${post.authorNickname} 메뉴`}
              >
                <Avatar
                  name={post.authorNickname}
                  size="md"
                  className="cursor-pointer border-2 border-[color:var(--color-border-subtle)] hover:border-[color:var(--color-accent)]"
                />
              </button>

              {/* 작성자 메뉴 드롭다운 */}
              {isAuthorMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-[color:var(--color-bg-elev-1)] border border-[color:var(--color-border-subtle)] rounded-lg shadow-lg z-20 overflow-hidden">
                  <div className="px-4 py-3 border-b border-[color:var(--color-border-subtle)]">
                    <p className="font-semibold text-[color:var(--color-fg-primary)]">{post.authorNickname}</p>
                    <p className="text-xs text-[color:var(--color-fg-muted)]">작성자</p>
                  </div>
                  {/* 현재 사용자와 작성자가 다를 때만 1:1 채팅 버튼 표시 */}
                  {(() => {
                    const currentUserIdStr = extractUserIdFromToken(accessToken);
                    const currentUserId = currentUserIdStr ? Number(currentUserIdStr) : null;
                    return currentUserId !== post.authorId;
                  })() && (
                    <button
                      onClick={() => handleCreateDirectChat(post.authorId, post.authorNickname)}
                      disabled={createRoomMutation.isPending}
                      className="w-full flex items-center gap-2 px-4 py-3 text-left text-[color:var(--color-fg-primary)] hover:bg-[color:var(--color-bg-hover)] transition-colors disabled:opacity-50"
                    >
                      <span>💬</span>
                      <span>{createRoomMutation.isPending ? "채팅방 생성 중..." : "1:1 채팅방 만들기"}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 버튼 그룹 */}
          <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap">
            {/* TODO: 로그인 후 작성자 확인 - post.authorId === currentUser.id 일 때만 표시 */}
            {/* 수정 버튼 */}
            <button
              onClick={handleEdit}
              className="inline-flex items-center gap-1 bg-[color:var(--color-bg-elev-2)] border border-[color:var(--color-border-subtle)] rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm hover:bg-[color:var(--color-bg-elev-1)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]"
              aria-label="게시글 수정"
            >
              <span className="hidden sm:inline">✏️ 수정</span>
              <span className="sm:hidden">✏️</span>
            </button>

            {/* 삭제 버튼 */}
            <button
              onClick={handleDelete}
              disabled={deletePostMutation.isPending}
              className="inline-flex items-center gap-1 bg-[color:var(--color-bg-elev-2)] border border-[color:var(--color-border-subtle)] rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm hover:bg-[color:var(--color-error)] hover:text-white focus:outline-none focus:ring-2 focus:ring-[color:var(--color-error)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="게시글 삭제"
            >
              <span className="hidden sm:inline">🗑️ 삭제</span>
              <span className="sm:hidden">🗑️</span>
            </button>

            {/* 좋아요 버튼 */}
            {/* - isLiked 상태에 따라 ❤️(좋아요 누름) 또는 🤍(안 누름) 표시 */}
            {/* - likeCount 숫자 표시 */}
            {/* - 클릭 시 handleLike 함수 호출하여 좋아요 토글 */}
            <button
              onClick={handleLike}
              disabled={likeMutation.isPending}  // 요청 중에는 비활성화
              aria-pressed={post.isLiked}
              aria-label={`좋아요 ${post.likeCount ?? 0}개`}
              className="inline-flex items-center gap-1 sm:gap-2 bg-[color:var(--color-bg-elev-2)] border border-[color:var(--color-border-subtle)] rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)] disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
              data-active={post.isLiked}
            >
              <span>{post.isLiked ? "❤️" : "🤍"}</span>
              <strong className="text-[color:var(--color-fg-primary)]">{post.likeCount ?? 0}</strong>
            </button>
          </div>
            </div>

            {/* ========== 책 리뷰 정보 (REVIEW 카테고리인 경우) ========== */}
            {post.category === "REVIEW" && post.bookId && bookDetail && (
              <div
                onClick={() => navigate(`/books/${post.bookId}`)}
                className="mt-1 sm:mt-2 p-2 sm:p-2.5 bg-[color:var(--color-bg-elev-2)] border border-[color:var(--color-border-subtle)] rounded-lg flex items-start gap-2 sm:gap-3 cursor-pointer hover:bg-[color:var(--color-bg-elev-1)] transition-colors"
              >
                {/* 책 표지 - 크기를 절반으로 축소 */}
                <div className="flex-shrink-0 w-4 h-6 sm:w-5 sm:h-7 bg-[color:var(--color-bg-elev-1)] rounded overflow-hidden border border-[color:var(--color-border-subtle)]">
                  {bookDetail.bookImageUrl ? (
                    <img
                      src={bookDetail.bookImageUrl}
                      alt={bookDetail.bookname}
                      className="block w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[color:var(--color-fg-muted)] text-base sm:text-lg">
                      📚
                    </div>
                  )}
                </div>

                {/* 책 정보 - 텍스트 크기 소폭 확장 (가독성 향상) */}
                <div className="flex-1 min-w-0 space-y-0.5">
                  <p className="text-[12px] sm:text-[13px] text-[color:var(--color-fg-muted)] mb-0">리뷰 대상 도서</p>
                  <h3 className="text-[14px] sm:text-sm font-bold text-[color:var(--color-fg-primary)] truncate">{bookDetail.bookname}</h3>
                  {bookDetail.authors && (
                    <p className="text-[12px] sm:text-[13px] text-[color:var(--color-fg-secondary)] truncate">{bookDetail.authors}</p>
                  )}
                  {bookDetail.publisher && (
                    <p className="text-[12px] sm:text-[13px] text-[color:var(--color-fg-muted)] truncate">{bookDetail.publisher}</p>
                  )}
                </div>
              </div>
            )}
          </header>
        {/* 본문 내용 */}
        {/* API의 content 필드를 표시 */}
        {/* HTML 태그(p 태그 등)를 렌더링하기 위해 dangerouslySetInnerHTML 사용 */}
        {/* DOMPurify로 XSS 공격 방지를 위한 sanitize 적용 */}
        <div className="relative mt-3 sm:mt-4">
          <div
            className={`text-sm sm:text-base text-[color:var(--color-fg-primary)] leading-relaxed ${
              post.isSpoiler && !isSpoilerRevealed ? "blur-sm select-none" : ""
            }`}
            aria-hidden={post.isSpoiler && !isSpoilerRevealed}
            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
          />

          {post.isSpoiler && !isSpoilerRevealed && (
            <button
              type="button"
              onClick={() => setIsSpoilerRevealed(true)}
              className="absolute inset-x-0 top-[60px] bottom-0 flex items-center justify-center rounded-lg bg-[color:var(--color-bg-elev-1)]/95 text-center text-sm sm:text-base font-semibold text-[color:var(--color-fg-primary)]"
              aria-label="스포일러 가림막 해제"
            >
              스포일러 방지. 클릭하면 해제합니다.
            </button>
          )}
        </div>

        {/* 첨부파일 영역 */}
        {/* attachments 배열이 있고 길이가 0보다 크면 표시 */}
        {post.attachments && post.attachments.length > 0 && (
          <div className="mt-3">
            {/* 첨부파일 헤더 (클릭하여 확장/축소) */}
            <button
              type="button"
              onClick={() => setIsAttachmentsExpanded(!isAttachmentsExpanded)}
              className="w-full bg-[color:var(--color-bg-elev-2)] border border-dashed border-[color:var(--color-border-subtle)] rounded-lg px-3 py-2 flex items-center justify-between hover:bg-[color:var(--color-bg-elev-1)] transition-colors"
              aria-expanded={isAttachmentsExpanded}
              aria-label={`첨부파일 ${post.attachments.length}개 ${isAttachmentsExpanded ? '숨기기' : '보기'}`}
            >
              <span className="text-[color:var(--color-fg-primary)] font-medium">
                📎 첨부파일 ({post.attachments.length})
              </span>
              <span className="text-[color:var(--color-fg-secondary)] transition-transform duration-200" style={{ transform: isAttachmentsExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                ▼
              </span>
            </button>

            {/* 첨부파일 목록 (확장 시 표시) */}
            {isAttachmentsExpanded && (
              <div className="mt-2 space-y-2">
                {post.attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="bg-[color:var(--color-bg-elev-2)] rounded-lg p-3 hover:bg-[color:var(--color-bg-elev-1)] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {/* 파일 아이콘 또는 이미지 미리보기 */}
                      <div className="flex-shrink-0 w-12 h-12 rounded overflow-hidden bg-[color:var(--color-bg-elev-1)] flex items-center justify-center">
                        {isImageFile(attachment.mimeType) ? (
                          <img
                            src={attachment.fileUrl}
                            alt={attachment.fileName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-2xl">📄</span>
                        )}
                      </div>

                      {/* 파일 정보 */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[color:var(--color-fg-primary)] truncate">
                          {attachment.fileName}
                        </p>
                        <p className="text-xs text-[color:var(--color-fg-muted)]">
                          {formatFileSize(attachment.fileSize)}
                        </p>
                      </div>

                      {/* 다운로드 버튼 */}
                      <a
                        href={getDownloadUrl(attachment.id)}
                        download={attachment.fileName}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0 px-3 py-2 bg-[color:var(--color-accent)] text-[color:var(--color-on-accent)] rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                        aria-label={`${attachment.fileName} 다운로드`}
                      >
                        다운로드
                      </a>
                    </div>

                    {/* 이미지 미리보기 (확대 이미지) */}
                    {isImageFile(attachment.mimeType) && (
                      <div className="mt-3">
                        <img
                          src={attachment.fileUrl}
                          alt={attachment.fileName}
                          className="max-w-full rounded-lg border border-[color:var(--color-border-subtle)]"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========== 모임 참여 섹션 (GROUP 카테고리인 경우) ========== */}
        {post.category === "GROUP" && post.recruitmentDetails && (
          <div className="mt-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-[color:var(--color-bg-elev-2)] rounded-lg border border-[color:var(--color-border-subtle)]">
              <div className="flex-1">
                <h3 className="text-base font-bold text-[color:var(--color-fg-primary)] mb-2">💬 모임 채팅방</h3>
                <div className="flex items-center gap-4 text-sm text-[color:var(--color-fg-secondary)]">
                  <span>
                    참여 인원: <strong className="text-[color:var(--color-fg-primary)]">{post.recruitmentDetails.currentMemberCount}</strong> / {post.recruitmentDetails.recruitmentLimit}
                  </span>
                  {post.recruitmentDetails.isApplied && (
                    <span className="px-2 py-1 bg-[color:var(--color-accent)] text-[color:var(--color-on-accent)] rounded-full text-xs font-medium">
                      참여 중
                    </span>
                  )}
                  {/* 모집 마감 상태 표시 */}
                  {post.recruitmentDetails.currentMemberCount >= post.recruitmentDetails.recruitmentLimit && (
                    <span className="px-2 py-1 bg-[color:var(--color-bg-elev-2)] text-[color:var(--color-fg-muted)] border border-[color:var(--color-border-subtle)] rounded-full text-xs font-medium">
                      모집 마감
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {/* 마감 여부 확인 */}
                {post.recruitmentDetails.currentMemberCount >= post.recruitmentDetails.recruitmentLimit ? (
                  /* 마감 후: 메시지만 표시 */
                  <div className="flex-shrink-0 px-6 py-3 bg-[color:var(--color-bg-elev-2)] text-[color:var(--color-fg-muted)] border border-[color:var(--color-border-subtle)] rounded-lg font-semibold">
                    모집 마감되었습니다
                  </div>
                ) : post.recruitmentDetails.isApplied ? (
                  /* 마감 전 + 참여 중: 참여 취소 버튼 */
                  <button
                    onClick={handleToggleRecruitment}
                    disabled={toggleRecruitmentMutation.isPending}
                    className="flex-shrink-0 px-6 py-3 bg-[color:var(--color-bg-elev-1)] text-[color:var(--color-fg-primary)] border border-[color:var(--color-border-subtle)] rounded-lg font-semibold hover:bg-[color:var(--color-error)] hover:text-white hover:border-[color:var(--color-error)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {toggleRecruitmentMutation.isPending ? "처리 중..." : "참여 취소"}
                  </button>
                ) : (
                  /* 마감 전 + 미참여: 참여하기 버튼 */
                  <button
                    onClick={handleToggleRecruitment}
                    disabled={toggleRecruitmentMutation.isPending}
                    className="flex-shrink-0 px-6 py-3 bg-[color:var(--color-accent)] text-[color:var(--color-on-accent)] rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {toggleRecruitmentMutation.isPending ? "처리 중..." : "참여하기"}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
        </div>
      </article>

      {/* ========== 댓글 섹션 ========== */}
      {/* 댓글 목록 조회, 작성, 삭제 기능을 제공하는 영역 */}
      <section className="mt-3 sm:mt-4 md:mt-5 bg-[color:var(--color-bg-elev-2)] border border-[color:var(--color-border-subtle)] rounded-lg sm:rounded-xl p-3 sm:p-4">
        <h2 className="text-base sm:text-lg font-semibold text-[color:var(--color-fg-primary)] flex items-baseline gap-2">
          {/* 댓글 개수 표시 (API의 commentCount 필드 사용) */}
          댓글 <span className="text-[color:#b45309]">[{post.commentCount}]</span>
        </h2>

        {/* 댓글 입력 폼 */}
        {/* - 텍스트 입력 필드 + 등록 버튼 */}
        {/* - Enter 키로도 제출 가능 (Shift+Enter는 제외) */}
        <div className="grid grid-cols-[1fr_auto] gap-2 mt-3 py-6">
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
            className="px-4 py-[8px] rounded-lg border
             border-[color:var(--color-border-subtle)] bg-[color:var(--color-bg-elev-1)]
              text-[color:var(--color-fg-primary)] outline-none focus:ring-2
               focus:ring-[color:var(--color-accent)] disabled:opacity-50"
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
              const isCommentMenuOpen = openCommentMenuId === comment.commentId;

              return (
                <React.Fragment key={comment.commentId}>
                  <div className="grid grid-cols-[40px_1fr_auto] gap-3 py-3 border-t first:border-t-0 border-[color:var(--color-border-subtle)]">
                    {/* 작성자 아바타 (클릭 가능) */}
                    <div className="relative">
                      <button
                        onClick={() => setOpenCommentMenuId(isCommentMenuOpen ? null : comment.commentId)}
                        className="focus:outline-none hover:opacity-80 transition-opacity"
                        aria-label={`${comment.authorNickname} 메뉴`}
                      >
                        <Avatar
                          name={comment.authorNickname}
                          size="sm"
                          className="cursor-pointer border border-[color:var(--color-border-subtle)] hover:border-[color:var(--color-accent)]"
                        />
                      </button>

                      {/* 댓글 작성자 메뉴 드롭다운 */}
                      {isCommentMenuOpen && (
                        <div className="absolute left-0 top-full mt-2 w-48 bg-[color:var(--color-bg-elev-1)] border border-[color:var(--color-border-subtle)] rounded-lg shadow-lg z-20 overflow-hidden">
                          <div className="px-4 py-3 border-b border-[color:var(--color-border-subtle)]">
                            <p className="font-semibold text-[color:var(--color-fg-primary)]">{comment.authorNickname}</p>
                            <p className="text-xs text-[color:var(--color-fg-muted)]">댓글 작성자</p>
                          </div>
                          {/* 현재 사용자와 댓글 작성자가 다를 때만 1:1 채팅 버튼 표시 */}
                          {(() => {
                            const currentUserIdStr = extractUserIdFromToken(accessToken);
                            const currentUserId = currentUserIdStr ? Number(currentUserIdStr) : null;
                            return currentUserId !== comment.authorId;
                          })() && (
                            <button
                              onClick={() => handleCreateCommentDirectChat(comment.authorId, comment.authorNickname)}
                              disabled={createRoomMutation.isPending}
                              className="w-full flex items-center gap-2 px-4 py-3 text-left text-[color:var(--color-fg-primary)] hover:bg-[color:var(--color-bg-hover)] transition-colors disabled:opacity-50"
                            >
                              <span>💬</span>
                              <span>{createRoomMutation.isPending ? "채팅방 생성 중..." : "1:1 채팅방 만들기"}</span>
                            </button>
                          )}
                        </div>
                      )}
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

      {/* 게시글 삭제 확인 모달 */}
      <ConfirmModal
        open={deletePostModalOpen}
        onClose={() => setDeletePostModalOpen(false)}
        onConfirm={confirmPostDelete}
        title="게시글 삭제"
        message="정말로 이 게시글을 삭제하시겠습니까?&#10;삭제된 게시글은 복구할 수 없습니다."
        confirmText="삭제"
        cancelText="취소"
        variant="danger"
        isLoading={deletePostMutation.isPending}
      />

      {/* 댓글 삭제 확인 모달 */}
      <ConfirmModal
        open={deleteCommentModalOpen}
        onClose={() => {
          setDeleteCommentModalOpen(false);
          setDeletingCommentId(null);
        }}
        onConfirm={confirmCommentDelete}
        title="댓글 삭제"
        message="정말로 이 댓글을 삭제하시겠습니까?"
        confirmText="삭제"
        cancelText="취소"
        variant="danger"
        isLoading={deleteCommentMutation.isPending}
      />
    </main>
  );
}
