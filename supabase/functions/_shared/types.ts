export const AI_FUNCTION_TYPES = [
  "monthly_review",
  "goal_risk_coach",
  "spending_anomaly_explainer",
] as const;

export type InsightFunctionType = (typeof AI_FUNCTION_TYPES)[number];

export type TriggerSource = "pg_cron" | "manual" | "replay" | "vercel_cron";

export type InsightPeriod = {
  start: string;
  end: string;
  label: string;
};

export type PromptVersion = {
  id: number;
  function_type: InsightFunctionType;
  version: string;
  role_frame: string;
  task_instruction: string;
  output_contract: Record<string, unknown>;
  guardrails: unknown;
};

export type GeminiUsage = {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
};

export type GeminiResult = {
  text: string;
  usage: GeminiUsage;
  raw: unknown;
};

export type StoredInsightInput = {
  householdId: string;
  functionType: InsightFunctionType;
  period: InsightPeriod;
  promptVersionId: number | null;
  runId: number | null;
  language: "vi" | "en";
  contentText: string;
  contentJson: Record<string, unknown>;
  recommendationText: string;
  confidenceLabel: "high" | "medium" | "low";
  modelProvider: string;
  modelName: string;
  tokenInput: number | null;
  tokenOutput: number | null;
  latencyMs: number | null;
};

export type DispatchResult = {
  householdId: string;
  functionType: InsightFunctionType;
  status: "completed" | "failed" | "skipped";
  reason?: string;
  runId?: number;
  insightId?: string;
};
