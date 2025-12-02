import React, { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { InlineImage } from "./extensions/InlineImage";
import { getImageBlobUrl } from "@/api/files";
import { useAuth } from "@/contexts/AuthContext";

type RichTextEditorProps = {
  valueHtml: string;
  onChange: (html: string) => void;
  placeholder?: string;
  /** 외부에서 높이/보더/배경 등을 제어하고 싶을 때 사용 */
  className?: string;
  onUploadImage?: (file: File) => Promise<{ src: string; alt?: string; title?: string } | null>;
};

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  valueHtml,
  onChange,
  placeholder = "내용 입력하세요",
  className = "",
  onUploadImage,
}) => {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
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
      InlineImage,
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
           // ↓ 행간/간격 조정 (정상적인 줄 간격)
          "leading-relaxed prose-p:my-2 prose-li:my-1 prose-ul:my-2 prose-ol:my-2",
      },
    },
  });

  const { accessToken } = useAuth();
  const editorRef = useRef<HTMLDivElement>(null);
  const blobUrlsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (editor && valueHtml !== editor.getHTML()) {
      editor.commands.setContent(valueHtml || "<p></p>", { emitUpdate: false });
    }
  }, [valueHtml, editor]);

  // 에디터 내 이미지 처리 (S3 URL 등 CORS 문제 해결)
  useEffect(() => {
    if (!editor || !editorRef.current) return;

    const handleImageLoad = async () => {
      const editorElement = editorRef.current?.querySelector('.ProseMirror');
      if (!editorElement) return;

      const images = editorElement.querySelectorAll('img');
      
      images.forEach(async (img) => {
        const originalSrc = img.getAttribute('src');
        if (!originalSrc) return;

        // 이미 blob URL이거나 data URL이면 스킵
        if (originalSrc.startsWith('blob:') || originalSrc.startsWith('data:')) {
          return;
        }

        try {
          console.log('[RichTextEditor] 에디터 이미지 로드 시작:', originalSrc);
          const blobUrl = await getImageBlobUrl(originalSrc);
          console.log('[RichTextEditor] 에디터 이미지 로드 완료:', blobUrl);
          
          // blob URL인 경우 정리 목록에 추가
          if (blobUrl.startsWith('blob:')) {
            blobUrlsRef.current.add(blobUrl);
          }
          
          // 이미지 src 업데이트
          if (img.getAttribute('src') === originalSrc) {
            img.src = blobUrl;
          }
        } catch (error) {
          console.error('[RichTextEditor] 에디터 이미지 로드 실패:', error);
          // 에러 시 원본 URL 유지
        }
      });
    };

    // 에디터 업데이트 시 이미지 처리 (MutationObserver 사용)
    const observer = new MutationObserver(() => {
      handleImageLoad();
    });

    const editorElement = editorRef.current?.querySelector('.ProseMirror');
    if (editorElement) {
      observer.observe(editorElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['src'],
      });
      
      // 초기 로드
      handleImageLoad();
    }
    
    // cleanup: blob URL 정리
    return () => {
      observer.disconnect();
      blobUrlsRef.current.forEach((url) => {
        URL.revokeObjectURL(url);
      });
      blobUrlsRef.current.clear();
    };
  }, [editor, accessToken]);

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

  const handleImageFile = async (file: File) => {
    if (!onUploadImage) return;
    setIsUploadingImage(true);
    try {
      const uploaded = await onUploadImage(file);
      if (uploaded?.src) {
        editor.chain().focus().setImage(uploaded).run();
      }
    } finally {
      setIsUploadingImage(false);
    }
  };

  const insertImage = () => {
    if (onUploadImage) {
      imageInputRef.current?.click();
      return;
    }
    const url = window.prompt("이미지 URL을 입력하세요:");
    if (!url) return;
    const alt = window.prompt("대체 텍스트(선택)를 입력하세요:", "");
    editor.chain().focus().setImage({ src: url, alt: alt ?? undefined }).run();
  };

  return (
    <div
      ref={editorRef}
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

        <button
          type="button"
          onClick={insertImage}
          disabled={isUploadingImage}
          className={
            "px-1.5 py-1 rounded-[var(--radius-md)] bg-[color:var(--color-bg-elev-1)] " +
            (isUploadingImage ? "opacity-60 cursor-wait" : "")
          }
          aria-label="이미지"
        >
          {isUploadingImage ? "업로드 중" : "🖼️"}
        </button>

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

      {/* 본문: 남은 높이 + 내부 스크롤 - 전체 영역 클릭 가능 */}
      <div
        className="flex-1 min-h-0 overflow-y-auto pl-8 pr-4 py-6 cursor-text"
        onClick={() => editor?.chain().focus().run()}
      >
        <EditorContent editor={editor} className="min-h-full" />
      </div>

      {onUploadImage && (
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              handleImageFile(file);
            }
            if (imageInputRef.current) {
              imageInputRef.current.value = "";
            }
          }}
        />
      )}
    </div>
  );
};
