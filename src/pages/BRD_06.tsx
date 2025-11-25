import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import DOMPurify from "dompurify";
import { RichTextEditor } from "@/components/RichTextEditor/RichTextEditor";
import { TagInput } from "@/components/TagInput/TagInput";
import { FileUpload } from "@/components/FileUpload/FileUpload";
import { useCreatePost, useUpdatePost, usePost } from "@/hooks/api";
import { useBookSearch, useBookDetail } from "@/hooks/api/useBook";
import { CreatePostRequest, UpdatePostRequest, Attachment } from "@/types";
import { Loading } from "@/components/Loading";
import { useToast } from "@/components/Toast/ToastProvider";
import { useQueryClient } from "@tanstack/react-query";

export const BRD_06 = (): React.JSX.Element => {
  const navigate = useNavigate();
  const { postId } = useParams<{ postId: string }>();
  const [searchParams] = useSearchParams();
  const isEditMode = !!postId;
  const toast = useToast();

  // URL 쿼리 파라미터에서 카테고리 읽기
  const initialCategory = searchParams.get("category") || "FREE";

  const [title, setTitle] = useState<string>("");
  const [contentHtml, setContentHtml] = useState<string>("");
  const [warnings, setWarnings] = useState<string[]>([]);
  const [category, setCategory] = useState<string>(initialCategory);
  const [bookId, setBookId] = useState<number | undefined>(undefined);
  const [bookSearchQuery, setBookSearchQuery] = useState<string>("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>("");
  const [selectedBookInfo, setSelectedBookInfo] = useState<{ title: string; author: string } | null>(null);
  const [showBookDropdown, setShowBookDropdown] = useState<boolean>(false);
  const [chatRoomId, setChatRoomId] = useState<number | undefined>(undefined);
  const [recruitmentLimit, setRecruitmentLimit] = useState<number | undefined>(10);
  const [chatRoomName, setChatRoomName] = useState<string>("");
  const [chatRoomDescription, setChatRoomDescription] = useState<string>("");
  const [isSpoiler, setIsSpoiler] = useState<boolean>(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  // 주의사항/태그 자동완성을 위한 추천 목록
  const suggestedWarnings = [
    "스포일러",
    "주의",
    "반전",
    "결말",
    "추천",
    "비추천",
    "감동",
    "재미",
    "지루",
    "힐링",
    "스릴러",
    "로맨스",
    "판타지",
    "SF",
    "미스터리",
  ];

  // 책 검색어 debounce (300ms 후 실행)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(bookSearchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [bookSearchQuery]);

  // 책 검색 (REVIEW 카테고리용) - debounced 검색어 사용
  const { data: bookSearchResults, isLoading: isSearchingBooks } = useBookSearch({
    type: "TITLE",
    keyword: debouncedSearchQuery,
    page: 0,
    size: 3,
  });

  // 수정 모드: 기존 게시글 로드
  const { data: existingPost, isLoading: isLoadingPost } = usePost(postId || "", {
    enabled: isEditMode,
  });

  // 편집 모드에서 책 정보 로드 (REVIEW 카테고리이고 bookId가 있는 경우만)
  // 빈 문자열은 useBookDetail의 enabled: !!bookId로 인해 API 호출되지 않음
  const existingBookId = existingPost?.bookId ? String(existingPost.bookId) : "";
  const { data: existingBookDetail } = useBookDetail(existingBookId);

  // 수정 모드: 기존 데이터를 폼에 채우기
  useEffect(() => {
    if (isEditMode && existingPost) {
      setTitle(existingPost.title);
      setContentHtml(existingPost.content);
      // warnings 객체 배열을 문자열 배열로 변환
      setWarnings(existingPost.warnings?.map(w => w.id.warning) || []);
      setCategory(existingPost.category);
      setBookId(existingPost.bookId);
      setChatRoomId(existingPost.chatRoomId);
      setRecruitmentLimit(existingPost.recruitmentLimit);
      setChatRoomName(existingPost.chatRoomName || "");
      setChatRoomDescription(existingPost.chatRoomDescription || "");
      setIsSpoiler(existingPost.isSpoiler || false);
      setAttachments(existingPost.attachments || []);
    }
  }, [isEditMode, existingPost]);

  // 편집 모드에서 책 정보 설정
  useEffect(() => {
    if (isEditMode && existingBookDetail) {
      setSelectedBookInfo({
        title: existingBookDetail.bookname,
        author: existingBookDetail.authors,
      });
    }
  }, [isEditMode, existingBookDetail]);

  const queryClient = useQueryClient();

  const createPostMutation = useCreatePost({
    onSuccess: async () => {
      // 모든 posts 관련 쿼리 무효화 (BRD_04의 쿼리 포함)
      await queryClient.invalidateQueries({ queryKey: ["posts"], refetchType: "all" });

      toast.show({ title: "게시글이 작성되었습니다.", variant: "success" });
      navigate("/boards"); // 리스트 페이지로 이동 (refetchOnMount로 자동 갱신됨)
    },
    onError: (error: any) => {
      // 백엔드 응답에서 message 추출
      const errorMessage = error.response?.data?.message || error.message || "게시글 작성에 실패했습니다.";
      toast.show({ title: errorMessage, variant: "error" });
    },
  });


  const updatePostMutation = useUpdatePost({
    onSuccess: async (data) => {
      // 모든 posts 관련 쿼리 무효화 (상세 페이지 및 리스트 모두)
      await queryClient.invalidateQueries({ queryKey: ["posts"], refetchType: "all" });

      toast.show({ title: "게시글이 수정되었습니다.", variant: "success" });
      navigate(`/boards/${data.postId}`);
    },
    onError: (error: any) => {
      // 백엔드 응답에서 message 추출
      const errorMessage = error.response?.data?.message || error.message || "게시글 수정에 실패했습니다.";
      toast.show({ title: errorMessage, variant: "error" });
    },
  });


  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();

    // 제목 검증
    if (!title.trim()) {
      toast.show({ title: "제목을 입력해주세요.", variant: "warning" });
      return;
    }

    // REVIEW 카테고리 책 ID 필수 검증
    if (category === "REVIEW" && !bookId) {
      toast.show({ title: "리뷰 작성 시 책을 선택해주세요.", variant: "warning" });
      return;
    }

    // HTML 콘텐츠 sanitize
    let safeHtml = DOMPurify.sanitize(contentHtml, { USE_PROFILES: { html: true } });

    // 빈 태그 제거 (앞뒤의 빈 <p></p>, <p><br></p> 등)
    safeHtml = safeHtml
      .replace(/^(<p>(<br\s*\/?>|\s|&nbsp;)*<\/p>)+/gi, '') // 앞쪽 빈 태그
      .replace(/(<p>(<br\s*\/?>|\s|&nbsp;)*<\/p>)+$/gi, '') // 뒤쪽 빈 태그
      .trim();

    if (isEditMode && postId) {
      // 수정 모드
      const updateData: UpdatePostRequest = {
        title: title.trim(),
        content: safeHtml,
        category: category,
        bookId: category === "REVIEW" ? bookId : undefined,
        chatRoomId: category === "GROUP" ? chatRoomId : undefined,
        isSpoiler: isSpoiler,
        warnings: warnings.length > 0 ? warnings : undefined,
        attachmentIds: attachments.length > 0 ? attachments.map(a => a.id) : undefined,
      };
      updatePostMutation.mutate({ postId, data: updateData });
    } else {
      // 작성 모드
      const createData: CreatePostRequest = {
        title: title.trim(),
        content: safeHtml,
        category: category,
        bookId: category === "REVIEW" ? bookId : undefined,
        isSpoiler: isSpoiler,
        warnings: warnings.length > 0 ? warnings : undefined,
        attachmentIds: attachments.length > 0 ? attachments.map(a => a.id) : undefined,
        // GROUP 카테고리일 때 모임 관련 필드 추가
        ...(category === "GROUP" && {
          recruitmentLimit: recruitmentLimit,
          chatRoomName: chatRoomName.trim() || title.trim(),
          chatRoomDescription: chatRoomDescription.trim() || safeHtml,
        }),
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
                카테고리 {isEditMode && <span className="text-xs">(변경 불가)</span>}
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={isEditMode}
                className="
                  w-full h-10 rounded-[var(--radius-md)]
                  bg-[color:var(--color-bg-elev-1)]
                  text-[color:var(--color-fg-primary)]
                  border border-transparent
                  focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]
                  px-3
                  disabled:opacity-60 disabled:cursor-not-allowed
                "
              >
                <option value="FREE">자유</option>
                <option value="NOTICE">공지</option>
                <option value="REVIEW">리뷰</option>
                <option value="DISCUSSION">토의</option>
                <option value="QUESTION">질문</option>
                <option value="GROUP">모임</option>
              </select>
            </div>

            {/* 책 검색 (REVIEW 카테고리인 경우) */}
            {category === "REVIEW" && (
              <div className="min-w-[300px] relative">
                <label htmlFor="bookSearch" className="block mb-2 text-sm text-[color:var(--color-fg-muted)]">
                  책 검색 {isEditMode && <span className="text-xs">(변경 불가)</span>}
                </label>
                <input
                  id="bookSearch"
                  type="text"
                  value={selectedBookInfo ? `${selectedBookInfo.title} - ${selectedBookInfo.author}` : bookSearchQuery}
                  onChange={(e) => {
                    if (!isEditMode) {
                      setBookSearchQuery(e.target.value);
                      setShowBookDropdown(true);
                      if (!e.target.value) {
                        setBookId(undefined);
                        setSelectedBookInfo(null);
                      }
                    }
                  }}
                  onFocus={() => !isEditMode && setShowBookDropdown(true)}
                  onBlur={() => setTimeout(() => setShowBookDropdown(false), 200)}
                  placeholder="책 제목을 입력하세요"
                  disabled={isEditMode}
                  className="
                    w-full h-10 rounded-[var(--radius-md)]
                    bg-[color:var(--color-bg-elev-1)]
                    text-[color:var(--color-fg-primary)]
                    border border-[color:var(--color-border-subtle)]
                    focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]
                    px-3
                    disabled:opacity-60 disabled:cursor-not-allowed
                  "
                />

                {/* 검색 결과 드롭다운 */}
                {showBookDropdown && bookSearchQuery.length > 0 && !selectedBookInfo && !isEditMode && (
                  <div
                    className="absolute top-full mt-2 w-full rounded-[var(--radius-md)] bg-[color:var(--color-bg-elev-1)] border border-[color:var(--color-border-subtle)] shadow-lg z-10 max-h-[300px] overflow-y-auto"
                  >
                    {isSearchingBooks ? (
                      <div className="p-4 text-center text-[color:var(--color-fg-muted)]">
                        검색 중...
                      </div>
                    ) : bookSearchResults && bookSearchResults.content.length > 0 ? (
                      <div>
                        {bookSearchResults.content.slice(0, 3).map((book) => (
                          <div
                            key={book.bookId || book.isbn13}
                            onClick={() => {
                              if (book.bookId) {
                                setBookId(book.bookId);
                                setSelectedBookInfo({ title: book.bookname, author: book.authors });
                                setBookSearchQuery("");
                                setShowBookDropdown(false);
                              }
                            }}
                            className="p-3 cursor-pointer hover:bg-[color:var(--color-bg-elev-2)] transition border-b border-[color:var(--color-border-subtle)] last:border-b-0"
                          >
                            <div className="font-medium text-[color:var(--color-fg-primary)]">
                              {book.bookname}
                            </div>
                            <div className="text-sm text-[color:var(--color-fg-muted)] mt-1">
                              {book.authors}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-[color:var(--color-fg-muted)]">
                        검색 결과가 없습니다
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 모집 인원 입력 (GROUP 카테고리인 경우) */}
            {category === "GROUP" && (
              <div className="min-w-[200px]">
                <label htmlFor="recruitmentLimit" className="block mb-2 text-sm text-[color:var(--color-fg-muted)]">
                  모집 인원 {isEditMode && <span className="text-xs">(변경 불가)</span>}
                </label>
                <input
                  id="recruitmentLimit"
                  type="number"
                  value={recruitmentLimit || ""}
                  onChange={(e) => setRecruitmentLimit(e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="예: 10"
                  min={2}
                  max={100}
                  disabled={isEditMode}
                  className="
                    w-full h-10 rounded-[var(--radius-md)]
                    bg-[color:var(--color-bg-elev-1)]
                    text-[color:var(--color-fg-primary)]
                    border border-[color:var(--color-border-subtle)]
                    focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]
                    px-3
                    disabled:opacity-60 disabled:cursor-not-allowed
                  "
                />
              </div>
            )}


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

            {/* 주의사항/태그 프리뷰 (가운데 정렬) */}
            <div className="flex-1">
              <div className="w-full text-center text-sm flex flex-wrap gap-2 justify-center items-center min-h-[32px]">
                {warnings.length > 0 ? (
                  warnings.map((warning, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center px-2.5 py-1 rounded-full bg-[color:var(--color-accent)] text-[color:var(--color-on-accent)] text-xs font-medium"
                    >
                      #{warning}
                    </span>
                  ))
                ) : (
                  <span className="text-[color:var(--color-fg-muted)]">#주의사항 입력</span>
                )}
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

          {/* 주의사항/태그 입력 (TagInput 컴포넌트 사용) */}
          <div className="flex justify-end">
            <div className="w-full sm:w-[600px]">
              <TagInput
                value={warnings}
                onChange={setWarnings}
                placeholder="#주의사항 입력 (Enter로 추가)"
                suggestions={suggestedWarnings}
                maxTags={10}
                helperText="주의사항/태그를 입력하고 Enter 또는 스페이스를 눌러 추가하세요"
              />
            </div>
          </div>

          {/* 모임 채팅방 정보 (GROUP 카테고리인 경우) */}
          {category === "GROUP" && !isEditMode && (
            <div className="rounded-[var(--radius-md)] bg-[color:var(--color-bg-elev-1)] p-6 border border-[color:var(--color-border-subtle)]">
              <h3 className="text-lg font-semibold text-[color:var(--color-fg-primary)] mb-4">모임 채팅방 설정</h3>

              {/* 채팅방 이름 */}
              <div className="mb-4">
                <label htmlFor="chatRoomName" className="block mb-2 text-sm text-[color:var(--color-fg-muted)]">
                  채팅방 이름 (선택)
                </label>
                <input
                  id="chatRoomName"
                  type="text"
                  value={chatRoomName}
                  onChange={(e) => setChatRoomName(e.target.value)}
                  placeholder="비워두면 모임 제목과 동일하게 설정됩니다"
                  maxLength={100}
                  className="
                    w-full h-10 rounded-[var(--radius-md)]
                    bg-[color:var(--color-bg-elev-2)]
                    text-[color:var(--color-fg-primary)]
                    border border-[color:var(--color-border-subtle)]
                    focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]
                    px-3
                  "
                />
              </div>

              {/* 채팅방 설명 */}
              <div>
                <label htmlFor="chatRoomDescription" className="block mb-2 text-sm text-[color:var(--color-fg-muted)]">
                  채팅방 설명 (선택)
                </label>
                <textarea
                  id="chatRoomDescription"
                  value={chatRoomDescription}
                  onChange={(e) => setChatRoomDescription(e.target.value)}
                  placeholder="비워두면 게시글 내용과 동일하게 설정됩니다"
                  maxLength={500}
                  rows={3}
                  className="
                    w-full rounded-[var(--radius-md)]
                    bg-[color:var(--color-bg-elev-2)]
                    text-[color:var(--color-fg-primary)]
                    border border-[color:var(--color-border-subtle)]
                    focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]
                    px-3 py-2
                    resize-none
                  "
                />
                <p className="text-xs text-[color:var(--color-fg-muted)] mt-1">
                  {chatRoomDescription.length} / 500자
                </p>
              </div>
            </div>
          )}

          {/* 파일 첨부 */}
          <div>
            <FileUpload
              attachments={attachments}
              onChange={setAttachments}
              maxFiles={10}
              maxFileSize={10 * 1024 * 1024}
              disabled={isPending}
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
