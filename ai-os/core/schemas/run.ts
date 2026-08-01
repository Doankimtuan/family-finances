import { z } from "zod";
import {
  ArtifactId,
  ErrorPhase,
  GateResult,
  IsoDateTime,
  KebabId,
  RunPhase,
  RunStatus,
  SchemaVersion,
  Semver,
  TraceContext,
} from "./common";

/** Zod mirror of execution-run.schema.json — keep in lockstep with JSON Schema. */
export const ExecutionRunPayload = z
  .object({
    schema_version: SchemaVersion,
    artifact_id: ArtifactId,
    orchestration_id: ArtifactId.optional(),
    plan_id: ArtifactId.optional(),
    task_id: ArtifactId,
    skill_id: KebabId,
    skill_version: Semver,
    attempt: z.number().int().min(1),
    allow_parallel_attempts: z.boolean().optional(),
    status: RunStatus,
    phase: RunPhase.optional(),
    started_at: IsoDateTime,
    ended_at: IsoDateTime.optional(),
    inputs: z.array(
      z
        .object({
          name: z.string().min(1),
          artifact_id: ArtifactId,
          artifact_version: z.number().int().min(1),
        })
        .strict(),
    ),
    outputs: z.array(
      z
        .object({
          name: z.string().min(1),
          artifact_id: ArtifactId,
          artifact_version: z.number().int().min(1),
        })
        .strict(),
    ),
    gate_results: z.array(
      z
        .object({
          kind: z.enum(["validation", "review", "quality-gate"]),
          id: ArtifactId,
          result: GateResult,
        })
        .strict(),
    ),
    error: z
      .object({
        code: KebabId,
        message: z.string().min(1).max(2000),
        retryable: z.boolean(),
        phase: ErrorPhase.optional(),
        details: z.record(z.string(), z.unknown()).optional(),
      })
      .strict()
      .optional(),
    trace: TraceContext.optional(),
    extensions: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();

export type ExecutionRunPayload = z.infer<typeof ExecutionRunPayload>;
