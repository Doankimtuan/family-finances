import { z } from "zod";

export const SchemaVersion = z.literal("1.0.0");
export const IsoDateTime = z.iso.datetime();
export const Semver = z
  .string()
  .regex(
    /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/,
  );
export const ArtifactId = z
  .string()
  .min(5)
  .max(128)
  .regex(/^art_[A-Za-z0-9][A-Za-z0-9_-]*$/);
export const KebabId = z
  .string()
  .min(2)
  .max(64)
  .regex(/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/);
export const ArtifactTypeId = KebabId;

export const ArtifactStatus = z.enum([
  "draft",
  "ready",
  "published",
  "superseded",
  "archived",
]);
export const TaskStatus = z.enum([
  "pending",
  "ready",
  "running",
  "succeeded",
  "failed",
  "blocked",
  "cancelled",
]);
export const RunStatus = z.enum([
  "pending",
  "claimed",
  "running",
  "succeeded",
  "failed",
  "cancelled",
]);
export const OrchestrationStatus = z.enum([
  "idle",
  "accepting",
  "planning",
  "scheduled",
  "running",
  "gating",
  "settling",
  "succeeded",
  "failed",
  "aborted",
  "superseded",
]);
export const WaveStatus = z.enum([
  "pending",
  "running",
  "succeeded",
  "failed",
  "cancelled",
]);
export const GateResult = z.enum(["pass", "fail", "warn", "skip"]);
export const GateProfile = z.enum(["strict", "standard", "advisory"]);
export const Severity = z.enum(["critical", "high", "medium", "low", "info"]);
export const SideEffect = z.enum([
  "none",
  "repo-write",
  "runtime-write",
  "external",
]);
export const ControlDecision = z.enum([
  "continue",
  "retry",
  "replan",
  "abort",
  "escalate",
  "publish",
  "hold",
]);
export const ArtifactRelation = z.enum([
  "requires",
  "derived-from",
  "reviews",
  "validates",
  "implements",
  "informs",
]);
export const EdgeType = z.enum(["blocks", "feeds", "informs"]);
export const PayloadKind = z.enum(["json", "markdown", "patch", "binary"]);
export const PayloadPath = z.enum([
  "payload.json",
  "payload.md",
  "payload.patch",
  "payload.bin",
]);
export const ContentHash = z.string().regex(/^sha256:[a-f0-9]{64}$/);
export const ProducerRole = z.enum([
  "orchestrator",
  "planner",
  "executor",
  "validator",
  "reviewer",
  "orchestrator-helper",
  "human",
]);

export const ArtifactRef = z.object({
  artifact_id: ArtifactId,
  artifact_version: z.number().int().min(1),
  relation: ArtifactRelation.optional(),
});

export const TraceContext = z.object({
  orchestration_id: ArtifactId.optional(),
  goal_id: ArtifactId.optional(),
  plan_id: ArtifactId.optional(),
  task_id: ArtifactId.optional(),
  run_id: ArtifactId.optional(),
});

export type ArtifactId = z.infer<typeof ArtifactId>;
export type ArtifactStatus = z.infer<typeof ArtifactStatus>;
export type TaskStatus = z.infer<typeof TaskStatus>;
export type RunStatus = z.infer<typeof RunStatus>;
export type OrchestrationStatus = z.infer<typeof OrchestrationStatus>;
export type WaveStatus = z.infer<typeof WaveStatus>;
export type GateResult = z.infer<typeof GateResult>;
export type GateProfile = z.infer<typeof GateProfile>;
export type Severity = z.infer<typeof Severity>;
export type SideEffect = z.infer<typeof SideEffect>;
export type ControlDecision = z.infer<typeof ControlDecision>;
export type ArtifactRelation = z.infer<typeof ArtifactRelation>;
export type ArtifactRef = z.infer<typeof ArtifactRef>;
export type TraceContext = z.infer<typeof TraceContext>;
export type EdgeType = z.infer<typeof EdgeType>;
export type PayloadKind = z.infer<typeof PayloadKind>;
export type PayloadPath = z.infer<typeof PayloadPath>;
export type ProducerRole = z.infer<typeof ProducerRole>;
