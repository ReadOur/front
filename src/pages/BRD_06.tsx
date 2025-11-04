import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DOMPurify from "dompurify";
import { RichTextEditor } from "@/components/RichTextEditor/RichTextEditor";
import { useCreatePost, useUpdatePost, usePost } from "@/hooks/api";
import { CreatePostRequest, UpdatePostRequest } from "@/types";
import { Loading } from "@/components/Loading";

export const BRD_06 = (): React.JSX.Element => {
  const navigate = useNavigate();
  const { postId } = useParams<{ postId: string }>();
  const isEditMode = !!postId;

  const [title, setTitle] = useState<string>("");
  const [contentHtml, setContentHtml] = useState<string>("<p></p>");
  const [tags, setTags] = useState<string>("");
  const [category, setCategory] = useState<string>("FREE");
  const [isSpoiler, setIsSpoiler] = useState<boolean>(false);

  // 수정 모드: 기존 게시글 로드
  const { data: existingPost, isLoading: isLoadingPost } = usePost(postId || "", {
    enabled: isEditMode,
  });

  // 수정 모드: 기존 데이터를 폼에 채우기
  useEffect(() => {
    if (isEditMode && existingPost) {
      setTitle(existingPost.title);
      setContentHtml(existingPost.content);

      // 태그 배열을 문자열로 변환 (현재 백엔드에서 tags를 반환하지 않을 수 있음)
      // setTags(existingPost.tags ? existingPost.tags.map(t => `#${t}`).join(" ") : "");

      setCategory(existingPost.category);
      setIsSpoiler(existingPost.isSpoiler || false);
    }
  }, [isEditMode, existingPost]);

  const createPostMutation = useCreatePost({
    onSuccess: () => {
      alert("게시글이 작성되었습니다.");
      navigate("/boards");
    },
    onError: (error) => {
      alert(`게시글 작성 실패: ${error.message}`);
    },
  });

  const updatePostMutation = useUpdatePost({
    onSuccess: (data) => {
      alert("게시글이 수정되었습니다.");
      navigate(`/boards/${data.postId}`);
    },
    onError: (error) => {
      alert(`게시글 수정 실패: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();

    // 제목 검증
    if (!title.trim()) {
      alert("제목을 입력해주세요.");
      return;
    }

    // HTML 콘텐츠 sanitize
    const safeHtml = DOMPurify.sanitize(contentHtml, { USE_PROFILES: { html: true } });

    // 태그 파싱: "#태그1 #태그2" → ["태그1", "태그2"]
    const parsedTags = tags
      .split(/\s+/)
      .filter((tag) => tag.startsWith("#"))
      .map((tag) => tag.substring(1))
      .filter((tag) => tag.length > 0);

    if (isEditMode && postId) {
      // 수정 모드
      const updateData: UpdatePostRequest = {
        title: title.trim(),
        content: safeHtml,
        category: category,
        isSpoiler: isSpoiler,
        tags: parsedTags.length > 0 ? parsedTags : undefined,
      };
      updatePostMutation.mutate({ postId, data: updateData });
    } else {
      // 작성 모드
      const createData: CreatePostRequest = {
        title: title.trim(),
        content: safeHtml,
        category: category,
        isSpoiler: isSpoiler,
        tags: parsedTags.length > 0 ? parsedTags : undefined,
      };
      createPostMutation.mutate(createData);
    }
  };

  // 수정 모드에서 로딩 중일 때
  if (isEditMode && isLoadingPost) {
    return <Loading message="게시글을 불러오는 중..." />;
  }

  // 수정 모드에서 게시글을 찾을 수 없을 때
  if (isEditMode && !existingPost) {
    return (
      <div className="w-full min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[color:var(--color-error)] mb-4">게시글을 찾을 수 없습니다.</p>
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

  const isPending = createPostMutation.isPending || updatePostMutation.isPending;

  return (
    <div
      className="w-full min-h-screen bg-[color:var(--color-bg-canvas)] text-[color:var(--color-fg-primary)]"
      style={{ fontFamily: "var(--font-sans, ui-sans-serif, system-ui)" }}
    >
      {/* ▼ 전체를 50px 내림 */}
      <div className="mx-auto max-w-[var(--layout-max)] px-6 py-8 mt-[50px]">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/** ─────────────────────────────────────────────
           상단 컨트롤: 한 줄로 (카테고리 / 공지 / 태그)
           공지 블록은 절반 크기 수준으로 축소
           ───────────────────────────────────────────── */}
          <div className="flex items-center gap-4">
            {/* 카테고리 */}
            <div className="min-w-[200px]">
              <label htmlFor="category" className="block mb-2 text-sm text-[color:var(--color-fg-muted)]">
                카테고리
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="
                  w-full h-10 rounded-[var(--radius-md)]
                  bg-[color:var(--color-bg-elev-1)]
                  text-[color:var(--color-fg-primary)]
                  border border-transparent
                  focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]
                  px-3
                "
              >
                <option value="FREE">자유</option>
                <option value="NOTICE">공지</option>
                <option value="REVIEW">리뷰</option>
                <option value="DISCUSSION">토의</option>
                <option value="QUESTION">질문</option>
              </select>
            </div>

            {/* 스포일러 체크 */}
            <label className="inline-flex items-center gap-2 select-none">
              <input
                type="checkbox"
                checked={isSpoiler}
                onChange={(e) => setIsSpoiler(e.target.checked)}
                className="h-4 w-4 rounded border-[color:var(--color-border-subtle)] accent-[color:var(--color-accent)]"
              />
              <span className="text-xs">스포일러로 등록</span>
            </label>

            {/* 태그 프리뷰 (가운데 정렬, hairline만) */}
            <div className="flex-1">
              <div className="w-full text-center text-sm shadow-[inset_0_-1px_0_0_var(--color-border-subtle)] pb-1">
                {tags || <span className="text-[color:var(--color-fg-muted)]">#태그를 입력하세요</span>}
              </div>
            </div>
          </div>

          {/** ─────────────────────────────────────────────
           작성부: 카드 외곽 보더 제거 → 에디터 박스 한 줄만 보이게
           제목 상단 여백은 유지
           ───────────────────────────────────────────── */}
          <div className="rounded-[var(--radius-md)] bg-[color:var(--color-bg-elev-1)] overflow-hidden">
            {/* 제목 영역 */}
            <div className="px-6 pt-[36px]">
              <label htmlFor="title-input" className="sr-only">제목</label>
              <input
                id="title-input"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="제목"
                className="
                  w-full bg-transparent outline-none
                  text-[40px] leading-[1.2] font-semibold
                  placeholder:text-[color:var(--color-fg-muted)]
                  border-none
                "
                aria-label="제목 입력"
              />
              {/* 제목과 내용 사이 구분선 */}
              <div className="mt-2 h-px bg-[color:var(--color-border-subtle)]" />
            </div>

            {/* 에디터: '한 줄 보더만' 보이도록 외곽은 border, 내부 RTE는 보더 제거 시도 */}
            {/* 에디터 섹션만 교체 */}
            <div className="px-6 pt-4 pb-6">
              <div
                className="
                          h-[52vh] min-h-[360px]
                          bg-[color:var(--color-bg-elev-1)]
                          rounded-[var(--radius-md)]
                          flex flex-col min-h-0 overflow-hidden
                        "
              >
                <RichTextEditor
                  valueHtml={contentHtml}
                  onChange={setContentHtml}
                  placeholder="내용을 입력해주세요."
                  className="h-full"   // ← 부모 높이를 가득 채우도록
                />
              </div>
            </div>
          </div>

          {/* 태그 입력 (우측 정렬) */}
          <div className="flex justify-end">
            <label htmlFor="tags-input" className="sr-only">태그</label>
            <input
              id="tags-input"
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="#태그1 #태그2"
              className="
                w-full sm:w-[420px] h-10
                rounded-[var(--radius-md)]
                bg-[color:var(--color-bg-elev-1)]
                text-[color:var(--color-fg-primary)]
                border border-transparent
                focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]
                px-3
              "
              aria-label="태그 입력"
            />
          </div>

          {/* 등록/수정 버튼: 더 키움 */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isPending}
              className="
                inline-flex items-center justify-center gap-2
                h-64 px-40 text-2xl        /* 크기 2배로 증가 */
                rounded-[var(--radius-full,9999px)]
                bg-[color:var(--btn-primary-bg,var(--color-accent))]
                text-[color:var(--btn-primary-fg,var(--color-on-accent))]
                shadow-[var(--shadow-sm)]
                transition
                hover:bg-[color:var(--btn-primary-bg-hover,var(--color-accent-600))]
                active:scale-[.98]
                focus:outline-none
                focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent)]
                focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--color-bg-canvas)]
                disabled:opacity-50 disabled:cursor-not-allowed
              "
              aria-label={isEditMode ? "게시글 수정" : "게시글 등록"}
            >
              {isPending
                ? isEditMode
                  ? "수정 중..."
                  : "등록 중..."
                : isEditMode
                ? "수정"
                : "등록"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
