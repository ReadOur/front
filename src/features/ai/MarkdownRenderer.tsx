import React, { useMemo } from "react";
import DOMPurify from "dompurify";

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatInline(text: string) {
  let formatted = escapeHtml(text);
  formatted = formatted.replace(/`([^`]+)`/g, "<code>$1</code>");
  formatted = formatted.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  formatted = formatted.replace(/__([^_]+)__+/g, "<strong>$1</strong>");
  formatted = formatted.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  formatted = formatted.replace(/_([^_]+)_/g, "<em>$1</em>");
  return formatted;
}

function simpleMarkdownToHtml(markdown: string) {
  const lines = markdown.split(/\n/);
  const html: string[] = [];
  let inList = false;

  const closeList = () => {
    if (inList) {
      html.push("</ul>");
      inList = false;
    }
  };

  lines.forEach((rawLine) => {
    const line = rawLine.trim();

    if (!line) {
      closeList();
      return;
    }

    if (/^---+$/.test(line)) {
      closeList();
      html.push("<hr />");
      return;
    }

    if (/^[*-]\s+/.test(line)) {
      if (!inList) {
        html.push("<ul>");
        inList = true;
      }
      const itemText = line.replace(/^[*-]\s+/, "");
      html.push(`<li>${formatInline(itemText)}</li>`);
      return;
    }

    closeList();

    const headingMatch = line.match(/^(#{1,6})\s+(.+)/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const content = formatInline(headingMatch[2]);
      html.push(`<h${level}>${content}</h${level}>`);
      return;
    }

    html.push(`<p>${formatInline(line)}</p>`);
  });

  closeList();
  return html.join("\n");
}

export function renderSafeMarkdown(markdown: string) {
  const rawHtml = simpleMarkdownToHtml(markdown);
  return DOMPurify.sanitize(rawHtml, { USE_PROFILES: { html: true } });
}

export function MarkdownRenderer({ markdown }: { markdown: string }) {
  const rendered = useMemo(() => renderSafeMarkdown(markdown), [markdown]);

  return (
    <div
      className="text-sm leading-relaxed space-y-2 markdown-renderer"
      dangerouslySetInnerHTML={{ __html: rendered }}
    />
  );
}

export default MarkdownRenderer;
