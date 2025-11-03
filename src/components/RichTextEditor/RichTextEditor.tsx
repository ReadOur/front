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
};

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
                                                                valueHtml,
                                                                onChange,
                                                                placeholder = "내용을 입력하세요",
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
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: valueHtml || "<p></p>",
    autofocus: false,
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
        // 토큰 기반 배경/테두리/텍스트
          "prose max-w-none outline-none " +
          "bg-[color:var(--color-bg-elev-1)] text-[color:var(--color-fg-primary)] " +
          "min-h-[420px] p-4 rounded-[var(--radius-md)] " +
          "selection:bg-[color:var(--color-accent)]/20",
      },
    },
  });

  // 외부 valueHtml이 바뀌면(초기값 교체 등) 에디터에 반영
  useEffect(() => {
    if (editor && valueHtml !== editor.getHTML()) {
      editor.commands.setContent(valueHtml || "<p></p>", { emitUpdate : false });
    }
  }, [valueHtml, editor]);

  if (!editor) return null;

  const toggleLink = () => {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("링크 URL을 입력하세요:", prev ?? "https://");
    if (url === null) return; // 취소
    if (url === "") {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return (
    <div
      className="w-full rounded-[var(--radius-md)] border border-[color:var(--color-border-default)]
                 bg-[color:var(--color-bg-elev-2)]"
    >
      {/* 툴바 */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-[color:var(--color-border-subtle)]
                      bg-[color:var(--color-bg-elev-2)] rounded-t-[var(--radius-md)]">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={"px-2 py-1 rounded-[var(--radius-md)] transition "
            + (editor.isActive("bold")
              ? "bg-[color:var(--color-accent)] text-[color:var(--color-on-accent)]"
              : "bg-[color:var(--color-bg-elev-1)]")}
          aria-label="굵게"
        >
          B
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={"px-2 py-1 rounded-[var(--radius-md)] transition "
            + (editor.isActive("italic")
              ? "bg-[color:var(--color-accent)] text-[color:var(--color-on-accent)]"
              : "bg-[color:var(--color-bg-elev-1)]")}
          aria-label="기울임"
        >
          I
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={"px-2 py-1 rounded-[var(--radius-md)] transition "
            + (editor.isActive("underline")
              ? "bg-[color:var(--color-accent)] text-[color:var(--color-on-accent)]"
              : "bg-[color:var(--color-bg-elev-1)]")}
          aria-label="밑줄"
        >
          U
        </button>

        <div className="mx-1 w-px h-5 bg-[color:var(--color-border-subtle)]" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className="px-2 py-1 rounded-[var(--radius-md)] bg-[color:var(--color-bg-elev-1)]"
          aria-label="불릿 리스트"
        >
          • List
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className="px-2 py-1 rounded-[var(--radius-md)] bg-[color:var(--color-bg-elev-1)]"
          aria-label="번호 리스트"
        >
          1. List
        </button>

        <div className="mx-1 w-px h-5 bg-[color:var(--color-border-subtle)]" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className="px-2 py-1 rounded-[var(--radius-md)] bg-[color:var(--color-bg-elev-1)]"
          aria-label="인용구"
        >
          ❝ ❞
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className="px-2 py-1 rounded-[var(--radius-md)] bg-[color:var(--color-bg-elev-1)]"
          aria-label="코드 블록"
        >
          {"</>"}
        </button>

        <div className="mx-1 w-px h-5 bg-[color:var(--color-border-subtle)]" />

        <button
          type="button"
          onClick={toggleLink}
          className="px-2 py-1 rounded-[var(--radius-md)] bg-[color:var(--color-bg-elev-1)]"
          aria-label="링크"
        >
          🔗
        </button>

        <div className="ml-auto flex gap-1">
          <button
            type="button"
            onClick={() => editor.chain().focus().setParagraph().run()}
            className={"px-2 py-1 rounded-[var(--radius-md)] transition "
              + (editor.isActive("paragraph")
                ? "bg-[color:var(--color-accent)] text-[color:var(--color-on-accent)]"
                : "bg-[color:var(--color-bg-elev-1)]")}
          >
            P
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={"px-2 py-1 rounded-[var(--radius-md)] transition "
              + (editor.isActive("heading", { level: 2 })
                ? "bg-[color:var(--color-accent)] text-[color:var(--color-on-accent)]"
                : "bg-[color:var(--color-bg-elev-1)]")}
          >
            H2
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={"px-2 py-1 rounded-[var(--radius-md)] transition "
              + (editor.isActive("heading", { level: 3 })
                ? "bg-[color:var(--color-accent)] text-[color:var(--color-on-accent)]"
                : "bg-[color:var(--color-bg-elev-1)]")}
          >
            H3
          </button>
        </div>
      </div>

      {/* 에디터 본문 */}
      <EditorContent editor={editor} />
    </div>
  );
};
