import { z } from "zod";

export const AiAuditEventKind = {
  SUGGESTION: "suggestion",
  APPROVAL: "approval",
  REJECTION: "rejection",
  POLICY_BLOCK: "policy_block",
} as const;

export type AiAuditEventKind =
  (typeof AiAuditEventKind)[keyof typeof AiAuditEventKind];

export const AI_AUDIT_EVENT_KIND_VALUES = [
  AiAuditEventKind.SUGGESTION,
  AiAuditEventKind.APPROVAL,
  AiAuditEventKind.REJECTION,
  AiAuditEventKind.POLICY_BLOCK,
] as const;

/** BR-14 audit surfaces — no magic strings at call sites. */
export const AI_AUDIT_SURFACE = {
  HEALTH_INSIGHTS: "health.insights",
} as const;

export type AiAuditSurface =
  (typeof AI_AUDIT_SURFACE)[keyof typeof AI_AUDIT_SURFACE];

export const recordAiAuditEventInputSchema = z.object({
  kind: z.enum(AI_AUDIT_EVENT_KIND_VALUES),
  surface: z.string().trim().min(1).max(80),
  payload: z.record(z.string(), z.unknown()).default({}),
});

export type RecordAiAuditEventInput = z.infer<
  typeof recordAiAuditEventInputSchema
>;
