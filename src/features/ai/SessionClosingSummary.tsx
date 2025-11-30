import React, { useMemo } from "react";
import { SessionClosingPayload } from "@/types/ai";
import MarkdownRenderer from "./MarkdownRenderer";

interface SessionClosingSummaryProps {
  payload?: SessionClosingPayload | null;
  meta?: {
    jobId?: string;
    latencyMs?: number;
  };
  fallbackText?: string;
}

function BasicInfo({ meta, payload }: Pick<SessionClosingSummaryProps, "meta" | "payload">) {
  const disagreements = payload?.plan?.disagreements?.length ?? 0;
  const nextSteps = payload?.plan?.nextSteps?.length ?? 0;

  return (
    <div className="grid grid-cols-2 gap-2 text-xs text-[color:var(--chatdock-fg-muted)]">
      {meta?.jobId && <div>작업 ID: {meta.jobId}</div>}
      {typeof meta?.latencyMs === "number" && <div>지연 시간: {meta.latencyMs}ms</div>}
      <div>쟁점: {disagreements}개</div>
      <div>다음 단계: {nextSteps}개</div>
    </div>
  );
}

function DisagreementCard({
  title,
  viewA,
  viewB,
  summary,
}: {
  title?: string;
  viewA?: string;
  viewB?: string;
  summary?: string;
}) {
  return (
    <div className="rounded-lg border border-[color:var(--chatdock-border-subtle)] bg-[color:var(--chatdock-bg-elev-1)] p-3 space-y-1">
      {title && <div className="text-sm font-semibold text-[color:var(--chatdock-fg-primary)]">{title}</div>}
      {summary && <div className="text-xs text-[color:var(--chatdock-fg-muted)]">{summary}</div>}
      <div className="grid grid-cols-2 gap-2 text-xs">
        {viewA && (
          <div className="rounded-md bg-[color:var(--chatdock-bg-elev-2)] p-2">
            <div className="font-semibold text-[color:var(--chatdock-fg-primary)]">관점 A</div>
            <div className="text-[color:var(--chatdock-fg-muted)]">{viewA}</div>
          </div>
        )}
        {viewB && (
          <div className="rounded-md bg-[color:var(--chatdock-bg-elev-2)] p-2">
            <div className="font-semibold text-[color:var(--chatdock-fg-primary)]">관점 B</div>
            <div className="text-[color:var(--chatdock-fg-muted)]">{viewB}</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SessionClosingSummary({ payload, meta, fallbackText }: SessionClosingSummaryProps) {
  const disagreements = payload?.plan?.disagreements ?? [];
  const nextSteps = payload?.plan?.nextSteps ?? [];

  const hasMarkdown = useMemo(() => Boolean(payload?.closingMarkdown), [payload?.closingMarkdown]);

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[10px] uppercase tracking-wide text-[color:var(--chatdock-fg-muted)]">Session Summary</div>
          <div className="text-base font-bold text-[color:var(--chatdock-fg-primary)]">세션 클로징 결과</div>
        </div>
        <BasicInfo meta={meta} payload={payload} />
      </div>

      <div className="h-px bg-[color:var(--chatdock-border-subtle)]" />

      {hasMarkdown && payload?.closingMarkdown ? (
        <MarkdownRenderer markdown={payload.closingMarkdown} />
      ) : (
        <div className="rounded-md bg-[color:var(--chatdock-bg-elev-2)] p-3 text-sm text-[color:var(--chatdock-fg-muted)]">
          {fallbackText || "생성된 마감문이 없습니다."}
        </div>
      )}

      {disagreements.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-semibold text-[color:var(--chatdock-fg-primary)]">서로 다른 의견</div>
          <div className="space-y-2">
            {disagreements.map((item, index) => (
              <DisagreementCard
                key={`${item.title ?? "disagreement"}-${index}`}
                title={item.title}
                viewA={item.viewA}
                viewB={item.viewB}
                summary={item.summary}
              />
            ))}
          </div>
        </div>
      )}

      {nextSteps.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-semibold text-[color:var(--chatdock-fg-primary)]">다음 모임 준비</div>
          <ul className="list-disc space-y-1 pl-4 text-sm text-[color:var(--chatdock-fg-primary)]">
            {nextSteps.map((step, index) => (
              <li key={`${step}-${index}`}>{step}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
