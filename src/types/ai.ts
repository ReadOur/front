export type AiCommandType =
  | "PUBLIC_SUMMARY"
  | "GROUP_QUESTION_GENERATOR"
  | "GROUP_KEYPOINTS"
  | "GROUP_CLOSING"
  | "SESSION_START"
  | "SESSION_SUMMARY_SLICE"
  | "SESSION_END"
  | "SESSION_CLOSING";

export type AiJobStatus = "RUNNING" | "COMPLETED" | "FAILED";

export interface SessionClosingDisagreement {
  title?: string;
  viewA?: string;
  viewB?: string;
  summary?: string;
}

export interface SessionClosingPlan {
  storyFlow?: string[];
  commonThemes?: string[];
  disagreements?: SessionClosingDisagreement[];
  extras?: string[];
  nextSteps?: string[];
}

export interface SessionClosingPayload {
  closingMarkdown?: string;
  plan?: SessionClosingPlan;
  fallback?: boolean;
  reason?: string;
}

export interface AiJobRequest {
  command: AiCommandType;
  messageLimit?: number;
  note?: string;
}

export interface AiJobResponse<TPayload = Record<string, unknown>> {
  status: AiJobStatus;
  payload?: (TPayload & { fallback?: boolean; reason?: string }) | null;
  jobId: string;
  latencyMs?: number;
}
