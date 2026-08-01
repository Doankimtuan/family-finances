import { z } from "zod";
import {
  ArtifactId,
  ArtifactRef,
  ControlDecision,
  GateProfile,
  GateResult,
  IsoDateTime,
  OrchestrationStatus,
  SchemaVersion,
  SideEffect,
  TaskStatus,
  TraceContext,
  WaveStatus,
} from "./common";

export const TaskOutcome = z
  .object({
    task_id: ArtifactId,
    status: TaskStatus,
    run_id: ArtifactId.optional(),
    attempt: z.number().int().min(1).optional(),
    at: IsoDateTime,
  })
  .strict();

export const OrchestrationStatePayload = z
  .object({
    schema_version: SchemaVersion,
    artifact_id: ArtifactId,
    status: OrchestrationStatus,
    gate_profile: GateProfile,
    goal_ref: ArtifactRef,
    plan_ref: ArtifactRef.optional(),
    budget: z.object({
      max_waves: z.number().int().min(1),
      max_retries_per_task: z.number().int().min(0),
      allowed_side_effects: z.array(SideEffect),
    }),
  waves: z.array(
    z
      .object({
        wave_index: z.number().int().min(0),
        task_ids: z.array(ArtifactId),
        status: WaveStatus,
      })
      .strict(),
  ),
  task_outcomes: z.array(TaskOutcome).optional(),
  decisions: z
    .array(
      z
        .object({
          at: IsoDateTime,
          decision: ControlDecision,
          reason: z.string().min(1),
          task_id: ArtifactId.optional(),
        })
        .strict(),
    )
    .optional(),
    trace: TraceContext.optional(),
    created_at: IsoDateTime,
    updated_at: IsoDateTime,
    extensions: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();

export const PlanDecisionPayload = z
  .object({
    schema_version: SchemaVersion,
    artifact_id: ArtifactId,
    plan_ref: ArtifactRef,
    decision: z.enum(["accept", "reject", "revise"]),
    reason: z.string().min(1).max(4000),
    requested_changes: z.array(z.string()).optional(),
    trace: TraceContext.optional(),
    created_at: IsoDateTime,
    extensions: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();

export const QualityGatePayload = z
  .object({
    schema_version: SchemaVersion,
    artifact_id: ArtifactId,
    orchestration_id: ArtifactId.optional(),
    profile: GateProfile,
    subject: z.object({
      kind: z.enum(["artifact", "task", "wave", "orchestration"]),
      id: ArtifactId,
      artifact_version: z.number().int().min(1).optional(),
    }),
    validation_results: z.array(
      z.object({
        artifact_id: ArtifactId,
        result: GateResult,
      }),
    ),
    review_results: z.array(
      z.object({
        artifact_id: ArtifactId,
        result: GateResult,
      }),
    ),
    result: GateResult,
    decision: ControlDecision,
    notes: z.string().max(2000).optional(),
    trace: TraceContext.optional(),
    created_at: IsoDateTime,
    extensions: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();

export const EscalationPayload = z
  .object({
    schema_version: SchemaVersion,
    artifact_id: ArtifactId,
    reason: z.string().min(1).max(4000),
    blocking: z.boolean(),
    options: z.array(z.string()).optional(),
    trace: TraceContext.optional(),
    created_at: IsoDateTime,
    extensions: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();

export type TaskOutcome = z.infer<typeof TaskOutcome>;
export type OrchestrationStatePayload = z.infer<typeof OrchestrationStatePayload>;
export type PlanDecisionPayload = z.infer<typeof PlanDecisionPayload>;
export type QualityGatePayload = z.infer<typeof QualityGatePayload>;
export type EscalationPayload = z.infer<typeof EscalationPayload>;
