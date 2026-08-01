import { z } from "zod";
import {
  ArtifactId,
  ArtifactRef,
  ArtifactStatus,
  ArtifactTypeId,
  ContentHash,
  IsoDateTime,
  KebabId,
  PayloadKind,
  PayloadPath,
  ProducerRole,
  SchemaVersion,
  Semver,
  TraceContext,
} from "./common";

export const ArtifactMeta = z
  .object({
    schema_version: SchemaVersion,
    artifact_id: ArtifactId,
    artifact_version: z.number().int().min(1),
    type: ArtifactTypeId,
    title: z.string().max(200).optional(),
    status: ArtifactStatus,
    created_at: IsoDateTime,
    updated_at: IsoDateTime,
    tags: z.array(z.string().min(1).max(64)).optional(),
    trace: TraceContext.optional(),
    produced_by: z.object({
      role: ProducerRole,
      skill_id: KebabId.optional(),
      skill_version: Semver.optional(),
      run_id: ArtifactId,
      task_id: ArtifactId.optional(),
    }),
    depends_on: z.array(ArtifactRef),
    supersedes: ArtifactRef.optional(),
    content_hash: ContentHash,
    payload: z.object({
      kind: PayloadKind,
      path: PayloadPath,
      content_type: z.string().optional(),
    }),
    allow_unstable: z.boolean().optional(),
    extensions: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();

export type ArtifactMeta = z.infer<typeof ArtifactMeta>;
