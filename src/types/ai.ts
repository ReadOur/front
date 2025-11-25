export type AiCommandType =
  | "PUBLIC_SUMMARY"
  | "GROUP_QUESTION_GENERATOR"
  | "GROUP_KEYPOINTS"
  | "SESSION_START"
  | "SESSION_END"
  | "SESSION_CLOSING";

export type AiJobStatus = "RUNNING" | "COMPLETED" | "FAILED";

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
