import React, { useState } from "react";
import DOMPurify from "dompurify";
import { RichTextEditor } from "@/components/RichTextEditor/RichTextEditor";

export const BRD_06 = (): React.JSX.Element => {
  const [title, setTitle] = useState<string>("");
  const [contentHtml, setContentHtml] = useState<string>("<p></p>");
  const [tags, setTags] = useState<string>("#태그1 #태그2");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    // 보안: XSS 방지용 sanitize
    const safeHtml = DOMPurify.sanitize(contentHtml, { USE_PROFILES: { html: true } });

    const postData = {
      title,
      contentHtml: safeHtml, // 서버가 HTML로 받는 경우
      // contentJson: ... (원하면 editor.getJSON()로 JSON도 함께 저장 설계 가능)
      tags,
    };

    console.log("POST /api/posts payload", postData);
    // await fetch("/api/posts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(postData) });
    // navigate("/board");
  };

  return (
    <div
      className="relative w-full min-w-[1431px] min-h-[1059px]
                 bg-[color:var(--color-bg-canvas)]
                 text-[color:var(--color-fg-primary)]"
      style={{ fontFamily: "var(--font-sans, ui-sans-serif, system-ui)" }}
      data-model-id="9:1943"
    >
      <form onSubmit={handleSubmit} className="relative">
        {/* 배경 레이어 */}
        <div className="absolute top-[171px] left-[125px] w-[1181px] h-[783px]
                        bg-[color:var(--color-bg-elev-1)]
                        rounded-[var(--radius-md)]" />
        <div className="absolute top-[272px] left-[145px] w-[1141px] h-[590px]
                        bg-[color:var(--color-bg-elev-2)]
                        rounded-[var(--radius-md)]" />

        {/* 제목 */}
        <label htmlFor="title-input" className="sr-only">제목</label>
        <input
          id="title-input"
          type="text"
          value={title}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
          placeholder="제목을 입력하세요"
          className="absolute top-[307px] left-[169px] w-[1063px]
                     text-[55.4px] leading-[normal] font-medium tracking-[0]
                     text-[color:var(--color-fg-primary)]
                     bg-transparent border-b border-[color:var(--color-border-subtle)]
                     focus:outline-none focus:border-[color:var(--color-accent)]
                     placeholder:text-[color:var(--color-fg-muted)]"
          aria-label="제목 입력"
        />

        {/* 에디터 (textarea 대체) */}
        <div className="absolute left-[169px] w-[1063px] h-[480px]" style={{ top: 380 }}>
          <RichTextEditor
            valueHtml={contentHtml}
            onChange={setContentHtml}
            placeholder="내용을 입력하세요"
          />
        </div>

        {/* 태그 */}
        <label htmlFor="tags-input" className="sr-only">태그</label>
        <input
          id="tags-input"
          type="text"
          value={tags}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTags(e.target.value)}
          placeholder="#태그1 #태그2"
          className="absolute top-[211px] left-[573px] w-[733px] h-[38px]
                     text-base text-center
                     text-[color:var(--color-fg-primary)]
                     bg-transparent
                     border-b border-[color:var(--color-border-subtle)]
                     focus:outline-none focus:border-[color:var(--color-accent)]
                     placeholder:text-[color:var(--color-fg-muted)]"
          aria-label="태그 입력"
        />

        {/* 등록 버튼 */}
        <button
          type="submit"
          className="absolute top-[885px] left-[1198px] w-[120px] h-10
                     flex items-center justify-center
                     rounded-[var(--radius-md)]
                     bg-[color:var(--color-accent)]
                     text-[color:var(--color-on-accent)]
                     text-xl font-semibold
                     hover:opacity-90 transition"
          aria-label="게시글 등록"
        >
          등록
        </button>
      </form>
    </div>
  );
};
