import { z } from "zod";
import {
  ArtifactId,
  ArtifactRef,
  GateResult,
  IsoDateTime,
  KebabId,
  RunStatus,
  SchemaVersion,
  Semver,
  TraceContext,
} from "./common";

/** Zod mirror of execution-run.schema.json (control-plane stub runs; no workers). */
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
    phase: z
      .enum([
        "claim",
        "execute",
        "validate",
        "review",
        "publish",
        "complete",
      ])
      .optional(),
    started_at: IsoDateTime,
    ended_at: IsoDateTime.optional(),
    inputs: z.array(
      z.object({
        name: z.string().min(1),
        artifact_id: ArtifactId,
        artifact_version: z.number().int().min(1),
      }),
    ),
    outputs: z.array(ArtifactRef),
    gate_results: z.array(
      z.object({
        kind: z.enum(["validation", "review", "quality"]),
        artifact_id: ArtifactId.optional(),
        result: GateResult,
      }),
    ),
    notes: z.string().max(4000).optional(),
    stub: z.boolean().optional(),
    trace: TraceContext.optional(),
    extensions: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();

export type ExecutionRunPayload = z.infer<typeof ExecutionRunPayload>;
