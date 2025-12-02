import React, { useMemo, useState } from 'react';
import { SessionClosingPayload } from '@/types/ai';
import MarkdownRenderer from './MarkdownRenderer';
import { Copy, Download, Check } from 'lucide-react';

interface SessionClosingSummaryProps {
  payload?: SessionClosingPayload | null;
  meta?: {
    jobId?: string;
    latencyMs?: number;
  };
  fallbackText?: string;
}

function BasicInfo({ meta, payload }: Pick<SessionClosingSummaryProps, 'meta' | 'payload'>) {
  const disagreements = payload?.plan?.disagreements?.length ?? 0;
  const nextSteps = payload?.plan?.nextSteps?.length ?? 0;

  return (
    <div className="grid grid-cols-2 gap-2 text-xs text-[color:var(--chatdock-fg-muted)]">
      {meta?.jobId && <div>작업 ID: {meta.jobId}</div>}
      {typeof meta?.latencyMs === 'number' && <div>지연 시간: {meta.latencyMs}ms</div>}
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
      {title && (
        <div className="text-sm font-semibold text-[color:var(--chatdock-fg-primary)]">{title}</div>
      )}
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

function buildMarkdownFromPlan(plan: SessionClosingPayload['plan']): string | null {
  if (!plan) return null;

  const sections: string[] = [];

  if (plan.storyFlow && plan.storyFlow.length > 0) {
    const flows = plan.storyFlow
      .map((paragraph) => paragraph.trim())
      .filter(Boolean)
      .join('\n\n');

    if (flows) {
      sections.push(['## 📝 오늘의 이야기 흐름', flows].join('\n\n'));
    }
  }

  if (plan.commonThemes && plan.commonThemes.length > 0) {
    const themes = plan.commonThemes.map((item) => `- ${item}`).join('\n');

    if (themes) {
      sections.push(['## 🔍 나눔 내용 요약 (핵심 포인트)', themes].join('\n\n'));
    }
  }

  if (plan.disagreements && plan.disagreements.length > 0) {
    const disagreements = plan.disagreements
      .map((item, idx) => {
        const lines: string[] = [];
        const title = item.title || '의견 차이';
        lines.push(`### 🟦 **의견 차이 ${idx + 1} — ${title}**`);
        if (item.viewA) lines.push(`- **관점 A:** ${item.viewA}`);
        if (item.viewB) lines.push(`- **관점 B:** ${item.viewB}`);
        if (item.summary) lines.push(`- **정리:** ${item.summary}`);
        return lines.join('\n');
      })
      .filter(Boolean)
      .join('\n\n\n');

    if (disagreements) {
      sections.push(
        [
          '## 🔀 서로 다른 의견',
          '프론트에서는 아래처럼 **카드 UI**로 보일 가능성이 높아.',
          disagreements,
        ].join('\n\n'),
      );
    }
  }

  if (plan.extras && plan.extras.length > 0) {
    const extras = plan.extras.map((item) => `- ${item}`).join('\n');

    if (extras) {
      sections.push(['## 💬 추가로 나왔던 이야기', extras].join('\n\n'));
    }
  }

  if (plan.nextSteps && plan.nextSteps.length > 0) {
    const nextSteps = plan.nextSteps.map((step) => `- ${step}`).join('\n');

    if (nextSteps) {
      sections.push(['## 📌 다음 모임 준비', nextSteps].join('\n\n'));
    }
  }

  if (sections.length === 0) return null;

  return sections.join('\n\n---\n\n');
}

export default function SessionClosingSummary({
  payload,
  meta,
  fallbackText,
}: SessionClosingSummaryProps) {
  const disagreements = payload?.plan?.disagreements ?? [];
  const nextSteps = payload?.plan?.nextSteps ?? [];
  const [copied, setCopied] = useState(false);

  const markdown = useMemo(() => {
    if (payload?.closingMarkdown) return payload.closingMarkdown;
    return buildMarkdownFromPlan(payload?.plan);
  }, [payload?.closingMarkdown, payload?.plan]);

  const hasMarkdown = Boolean(markdown);
  
  // closingMarkdown이 있으면 plan의 내용은 이미 포함되어 있으므로 중복 렌더링하지 않음
  const hasClosingMarkdown = Boolean(payload?.closingMarkdown);

  // 전체 마감문 내용을 텍스트로 변환
  const getFullText = useMemo(() => {
    const parts: string[] = [];

    if (markdown) {
      parts.push(markdown);
    }

    // closingMarkdown이 있으면 이미 모든 내용이 포함되어 있으므로 plan의 내용을 추가하지 않음
    if (hasClosingMarkdown) {
      return parts.join('');
    }

    // closingMarkdown이 없을 때만 plan에서 추가
    if (disagreements.length > 0) {
      parts.push('\n\n## 서로 다른 의견\n');
      disagreements.forEach((item, index) => {
        parts.push(`\n### 의견 차이 ${index + 1}${item.title ? ` - ${item.title}` : ''}\n`);
        if (item.viewA) parts.push(`관점 A: ${item.viewA}\n`);
        if (item.viewB) parts.push(`관점 B: ${item.viewB}\n`);
        if (item.summary) parts.push(`정리: ${item.summary}\n`);
      });
    }

    if (nextSteps.length > 0) {
      parts.push('\n\n## 다음 모임 준비\n');
      nextSteps.forEach((step) => {
        parts.push(`- ${step}\n`);
      });
    }

    return parts.join('');
  }, [markdown, disagreements, nextSteps, hasClosingMarkdown]);

  const handleCopy = async (e?: React.MouseEvent) => {
    // 이벤트 전파 중단
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }

    // 디버깅: 복사할 내용 확인
    console.log('[SessionClosingSummary] 복사 시도:', {
      hasFullText: !!getFullText,
      fullTextLength: getFullText?.length || 0,
      hasMarkdown: !!markdown,
      markdownLength: markdown?.length || 0,
      disagreementsCount: disagreements.length,
      nextStepsCount: nextSteps.length,
    });

    // 복사할 내용이 없으면 경고
    if (!getFullText || getFullText.trim().length === 0) {
      console.warn('[SessionClosingSummary] 복사할 내용이 없습니다.');
      alert('복사할 내용이 없습니다.');
      return;
    }

    try {
      // Clipboard API 사용 (최신 방법)
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(getFullText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        // Fallback: 구형 브라우저나 HTTP 환경을 위한 대체 방법
        const textArea = document.createElement('textarea');
        textArea.value = getFullText;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          const successful = document.execCommand('copy');
          if (successful) {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } else {
            throw new Error('execCommand 실패');
          }
        } catch (err) {
          console.error('복사 실패 (fallback):', err);
          alert('복사에 실패했습니다. 텍스트를 직접 선택해서 복사해주세요.');
        } finally {
          document.body.removeChild(textArea);
        }
      }
    } catch (err) {
      console.error('복사 실패:', err);
      // 사용자에게 알림
      alert('복사에 실패했습니다. 텍스트를 직접 선택해서 복사해주세요.');
    }
  };

  const handleExport = () => {
    const blob = new Blob([getFullText], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const date = new Date().toISOString().split('T')[0];
    link.href = url;
    link.download = `마감문_${date}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[10px] uppercase tracking-wide text-[color:var(--chatdock-fg-muted)]">
            Session Summary
          </div>
          <div className="text-base font-bold text-[color:var(--chatdock-fg-primary)]">
            세션 클로징 결과
          </div>
        </div>
      </div>
      <BasicInfo meta={meta} payload={payload} />

      <div className="h-px bg-[color:var(--chatdock-border-subtle)]" />

      {hasMarkdown && markdown ? (
        <MarkdownRenderer markdown={markdown} />
      ) : (
        <div className="rounded-md bg-[color:var(--chatdock-bg-elev-2)] p-3 text-sm text-[color:var(--chatdock-fg-muted)]">
          {fallbackText || '생성된 마감문이 없습니다.'}
        </div>
      )}

      {hasMarkdown && markdown && (
        <div className="flex justify-end">
          <div className="mt-2 max-w-[80%] px-3 py-2 rounded-lg bg-[color:var(--chatdock-bg-elev-1)] border border-[color:var(--chatdock-border-subtle)] text-xs text-[color:var(--chatdock-fg-primary)] flex items-center gap-2">
            <span className="text-[color:var(--chatdock-fg-muted)] whitespace-nowrap">
              마감문 결과 활용
            </span>
            <button
              onClick={(e) => handleCopy(e)}
              type="button"
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="마감문 전체 복사"
              disabled={!getFullText || getFullText.trim().length === 0}
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              <span>복사</span>
            </button>
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[color:var(--chatdock-bg-elev-2)] text-[color:var(--chatdock-fg-primary)] hover:bg-[color:var(--chatdock-bg-elev-3)] transition-colors"
              title="마감문 파일로 내보내기"
            >
              <Download className="w-3 h-3" />
              <span>내보내기</span>
            </button>
          </div>
        </div>
      )}

      {/* closingMarkdown이 있으면 이미 모든 내용이 포함되어 있으므로 plan의 내용을 중복 렌더링하지 않음 */}
      {!hasClosingMarkdown && disagreements.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-semibold text-[color:var(--chatdock-fg-primary)]">
            서로 다른 의견
          </div>
          <div className="space-y-2">
            {disagreements.map((item, index) => (
              <DisagreementCard
                key={`${item.title ?? 'disagreement'}-${index}`}
                title={item.title}
                viewA={item.viewA}
                viewB={item.viewB}
                summary={item.summary}
              />
            ))}
          </div>
        </div>
      )}

      {!hasClosingMarkdown && nextSteps.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-semibold text-[color:var(--chatdock-fg-primary)]">
            다음 모임 준비
          </div>
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
