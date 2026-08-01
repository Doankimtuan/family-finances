import { z } from "zod";
import {
  ArtifactId,
  ArtifactRef,
  ArtifactStatus,
  ArtifactTypeId,
  EdgeType,
  GateProfile,
  IsoDateTime,
  KebabId,
  SchemaVersion,
  Semver,
  SideEffect,
  TaskStatus,
  TraceContext,
} from "./common";

export const GoalPayload = z
  .object({
    schema_version: SchemaVersion,
    artifact_id: ArtifactId,
    title: z.string().min(1).max(200),
    problem: z.string().min(1).max(8000),
    success_criteria: z
      .array(
        z.object({
          id: KebabId,
          description: z.string().min(1),
        }),
      )
      .min(1),
    constraints: z.array(z.string()),
    non_goals: z.array(z.string()),
    risks: z.array(z.string()).optional(),
    preferred_gate_profile: GateProfile.optional(),
    created_at: IsoDateTime,
    extensions: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();

export const TaskPayload = z
  .object({
    schema_version: SchemaVersion,
    artifact_id: ArtifactId,
    title: z.string().min(1).max(200),
    description: z.string().max(4000).optional(),
    skill_id: KebabId,
    skill_version: z.union([Semver, z.literal("active")]),
    primary_output_type: ArtifactTypeId,
    inputs: z.array(
      z.object({
        name: z.string().min(1),
        artifact_id: ArtifactId.optional(),
        artifact_version: z
          .union([z.number().int().min(1), z.literal("latest-in-run")])
          .optional(),
        from_task_id: ArtifactId.optional(),
        required: z.boolean().optional(),
      }),
    ),
    validators: z.array(KebabId).optional(),
    reviewers: z.array(KebabId).optional(),
    done_when: z.array(z.string()).min(1),
    side_effect_budget: z.array(SideEffect).min(1),
    allow_parallel_attempts: z.boolean().optional(),
    continue_on_cancel: z.boolean().optional(),
    status: TaskStatus,
    trace: TraceContext.optional(),
    extensions: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();

export const DependencyGraphPayload = z
  .object({
    schema_version: SchemaVersion,
    artifact_id: ArtifactId,
    kind: z.enum(["task", "artifact", "mixed"]),
    plan_id: ArtifactId.optional(),
    orchestration_id: ArtifactId.optional(),
    created_at: IsoDateTime,
    nodes: z
      .array(
        z.object({
          id: ArtifactId,
          node_type: z.enum(["task", "artifact"]),
          label: z.string().optional(),
          artifact_version: z.number().int().min(1).optional(),
        }),
      )
      .min(1),
    edges: z.array(
      z.object({
        predecessor: ArtifactId,
        successor: ArtifactId,
        type: EdgeType,
        hard: z.boolean().optional(),
      }),
    ),
    acyclic: z.boolean().optional(),
    extensions: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();

export const PlanPayload = z
  .object({
    schema_version: SchemaVersion,
    artifact_id: ArtifactId,
    plan_version: z.number().int().min(1),
    goal_ref: ArtifactRef,
    title: z.string().min(1).max(200),
    summary: z.string().max(2000).optional(),
    success_criteria: z
      .array(
        z.object({
          id: KebabId,
          description: z.string().min(1),
          maps_to_task_id: ArtifactId.optional(),
        }),
      )
      .min(1),
    non_goals: z.array(z.string()),
    risks: z.array(z.string()).optional(),
    task_refs: z.array(ArtifactRef).min(1),
    dependency_graph_ref: ArtifactRef,
    gate_profile: GateProfile,
    status: ArtifactStatus,
    trace: TraceContext.optional(),
    created_at: IsoDateTime,
    updated_at: IsoDateTime.optional(),
    extensions: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();

export type GoalPayload = z.infer<typeof GoalPayload>;
export type TaskPayload = z.infer<typeof TaskPayload>;
export type DependencyGraphPayload = z.infer<typeof DependencyGraphPayload>;
export type PlanPayload = z.infer<typeof PlanPayload>;
