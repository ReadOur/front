import React, { useState } from "react";
import DOMPurify from "dompurify";
import { RichTextEditor } from "@/components/RichTextEditor/RichTextEditor";

export const BRD_06 = (): React.JSX.Element => {
  const [title, setTitle] = useState<string>("");
  const [contentHtml, setContentHtml] = useState<string>("<p></p>");
  const [tags, setTags] = useState<string>("#태그1 #태그2");
  const [category, setCategory] = useState<string>("free");
  const [isNotice, setIsNotice] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    const safeHtml = DOMPurify.sanitize(contentHtml, { USE_PROFILES: { html: true } });
    const postData = { title, contentHtml: safeHtml, tags, category, isNotice };
    console.log("POST /api/posts payload", postData);
    // await fetch(...);
    // navigate("/boards");
  };

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
                <option value="free">자유</option>
                <option value="notice">공지</option>
                <option value="qna">Q&amp;A</option>
              </select>
            </div>

            {/* 공지 체크 (절반 크기 느낌) */}
            <label className="inline-flex items-center gap-2 select-none">
              <input
                type="checkbox"
                checked={isNotice}
                onChange={(e) => setIsNotice(e.target.checked)}
                className="h-4 w-4 rounded border-[color:var(--color-border-subtle)] accent-[color:var(--color-accent)]"
              />
              <span className="text-xs">공지로 등록</span>
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
                  placeholder="내용 입력"
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

          {/* 등록 버튼: 더 키움 */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="
                inline-flex items-center justify-center gap-2
                h-32 px-20                 /* 크기 업 */
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
              "
              aria-label="게시글 등록"
            >
              등록
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
