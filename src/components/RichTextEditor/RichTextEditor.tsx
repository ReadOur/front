import React, { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";

type RichTextEditorProps = {
  valueHtml: string;
  onChange: (html: string) => void;
  placeholder?: string;
  /** 외부에서 높이/보더/배경 등을 제어하고 싶을 때 사용 */
  className?: string;
};

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
                                                                valueHtml,
                                                                onChange,
                                                                placeholder = "내용 입력하세요",
                                                                className = "",
                                                              }) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: { keepMarks: true },
        orderedList: { keepMarks: true },
      }),
      Underline,
      Link.configure({
        autolink: true,
        openOnClick: true,
        protocols: ["http", "https", "mailto", "tel"],
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: valueHtml || "<p></p>",
    autofocus: false,
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        // 배경/라운드/보더는 바깥에서, 여기선 편집 영역 스타일만
        class:
          "prose max-w-none outline-none bg-transparent min-h-full pl-[10px] pr-0 py-0 " +
          "text-[color:var(--color-fg-primary)] selection:bg-[color:var(--color-accent)]/20 " +
           // ↓ 행간/간격 조정 (약 절반 느낌)
          "leading-[0.6] prose-p:my-1 prose-li:my-0.5 prose-ul:my-1 prose-ol:my-1",
      },
    },
  });

  useEffect(() => {
    if (editor && valueHtml !== editor.getHTML()) {
      editor.commands.setContent(valueHtml || "<p></p>", { emitUpdate: false });
    }
  }, [valueHtml, editor]);

  if (!editor) return null;

  const toggleLink = () => {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("링크 URL을 입력하세요:", prev ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return (
    <div
      className={
        // 루트: 세로 플렉스 + 스크롤 가능한 구조
        "w-full flex flex-col min-h-0 overflow-hidden rounded-[var(--radius-md)] " +
        "border border-[color:var(--color-border-subtle)] bg-[color:var(--color-bg-elev-2)] " +
        className
      }
    >
      {/* 툴바 (고정) */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-[color:var(--color-border-subtle)] bg-[color:var(--color-bg-elev-2)] flex-none">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={"px-1.5 py-1 rounded-[var(--radius-md)] transition " +
            (editor.isActive("bold")
              ? "bg-[color:var(--color-accent)] text-[color:var(--color-on-accent)]"
              : "bg-[color:var(--color-bg-elev-1)]")}
          aria-label="굵게"
        >B</button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={"px-1.5 py-1 rounded-[var(--radius-md)] transition " +
            (editor.isActive("italic")
              ? "bg-[color:var(--color-accent)] text-[color:var(--color-on-accent)]"
              : "bg-[color:var(--color-bg-elev-1)]")}
          aria-label="기울임"
        >I</button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={"px-1.5 py-1 rounded-[var(--radius-md)] transition " +
            (editor.isActive("underline")
              ? "bg-[color:var(--color-accent)] text-[color:var(--color-on-accent)]"
              : "bg-[color:var(--color-bg-elev-1)]")}
          aria-label="밑줄"
        >U</button>

        <div className="mx-1 w-px h-5 bg-[color:var(--color-border-subtle)]" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className="px-1.5 py-1 rounded-[var(--radius-md)] bg-[color:var(--color-bg-elev-1)]"
          aria-label="불릿 리스트"
        >• List</button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className="px-1.5 py-1 rounded-[var(--radius-md)] bg-[color:var(--color-bg-elev-1)]"
          aria-label="번호 리스트"
        >1. List</button>

        <div className="mx-1 w-px h-5 bg-[color:var(--color-border-subtle)]" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className="px-1.5 py-1 rounded-[var(--radius-md)] bg-[color:var(--color-bg-elev-1)]"
          aria-label="인용구"
        >❝ ❞</button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className="px-1.5 py-1 rounded-[var(--radius-md)] bg-[color:var(--color-bg-elev-1)]"
          aria-label="코드 블록"
        >{"</>"}</button>

        <div className="mx-1 w-px h-5 bg-[color:var(--color-border-subtle)]" />

        <button
          type="button"
          onClick={toggleLink}
          className="px-1.5 py-1 rounded-[var(--radius-md)] bg-[color:var(--color-bg-elev-1)]"
          aria-label="링크"
        >🔗</button>

        <div className="ml-auto flex gap-1">
          <button
            type="button"
            onClick={() => editor.chain().focus().setParagraph().run()}
            className={"px-1.5 py-1 rounded-[var(--radius-md)] transition " +
              (editor.isActive("paragraph")
                ? "bg-[color:var(--color-accent)] text-[color:var(--color-on-accent)]"
                : "bg-[color:var(--color-bg-elev-1)]")}
          >P</button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={"px-1.5 py-1 rounded-[var(--radius-md)] transition " +
              (editor.isActive("heading", { level: 2 })
                ? "bg-[color:var(--color-accent)] text-[color:var(--color-on-accent)]"
                : "bg-[color:var(--color-bg-elev-1)]")}
          >H2</button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={"px-1.5 py-1 rounded-[var(--radius-md)] transition " +
              (editor.isActive("heading", { level: 3 })
                ? "bg-[color:var(--color-accent)] text-[color:var(--color-on-accent)]"
                : "bg-[color:var(--color-bg-elev-1)]")}
          >H3</button>
        </div>
      </div>

      {/* 본문: 남은 높이 + 내부 스크롤 */}
      <div className="flex-1 min-h-0 overflow-y-auto pl-8 pr-4 py-6">
        <EditorContent editor={editor} className="min-h-full" />
      </div>
    </div>
  );
};
