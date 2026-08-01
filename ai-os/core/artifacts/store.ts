import { promises as fs } from "node:fs";
import path from "node:path";
import type { z } from "zod";
import { AiosError } from "../lib/errors";
import { contentHash, nowIso } from "../lib/hash";
import { isArtifactId } from "../lib/ids";
import { ArtifactMeta, type ArtifactMeta as ArtifactMetaType } from "../schemas/artifact";
import type {
  ArtifactStatus,
  PayloadKind,
  PayloadPath,
  ProducerRole,
  ArtifactRef,
  TraceContext,
} from "../schemas/common";

export type WriteArtifactInput = {
  artifactId: string;
  type: string;
  title?: string;
  status?: ArtifactStatus;
  version?: number;
  payloadKind: PayloadKind;
  payload: string | Buffer | unknown;
  producedBy: {
    role: ProducerRole;
    runId: string;
    skillId?: string;
    skillVersion?: string;
    taskId?: string;
  };
  dependsOn?: ArtifactRef[];
  supersedes?: ArtifactRef;
  trace?: TraceContext;
  tags?: string[];
  allowUnstable?: boolean;
};

export type StoredArtifact = {
  meta: ArtifactMetaType;
  dir: string;
  payloadAbsolutePath: string;
  payloadBytes: Buffer;
};

export type ArtifactStoreOptions = {
  /** Registry gate — required; every write must validate artifact type. */
  assertArtifactType: (typeId: string) => Promise<void>;
};

function payloadPathFor(kind: PayloadKind): PayloadPath {
  switch (kind) {
    case "json":
      return "payload.json";
    case "markdown":
      return "payload.md";
    case "patch":
      return "payload.patch";
    case "binary":
      return "payload.bin";
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}

function encodePayload(kind: PayloadKind, payload: string | Buffer | unknown): Buffer {
  if (Buffer.isBuffer(payload)) return payload;
  if (kind === "json") {
    return Buffer.from(JSON.stringify(payload, null, 2) + "\n", "utf8");
  }
  if (typeof payload === "string") return Buffer.from(payload, "utf8");
  throw new AiosError(
    "invalid-payload",
    `Payload for kind ${kind} must be string or Buffer`,
  );
}

export class ArtifactStore {
  constructor(
    private readonly runtimeRoot: string,
    private readonly options: ArtifactStoreOptions,
  ) {
    if (!options.assertArtifactType) {
      throw new AiosError(
        "artifact-store-misconfigured",
        "ArtifactStore requires assertArtifactType",
      );
    }
  }

  artifactDir(artifactId: string, version: number): string {
    if (!isArtifactId(artifactId)) {
      throw new AiosError(
        "invalid-artifact-id",
        `Invalid artifact id: ${artifactId}`,
      );
    }
    return path.join(this.runtimeRoot, "artifacts", artifactId, `v${version}`);
  }

  async write(input: WriteArtifactInput): Promise<StoredArtifact> {
    await this.options.assertArtifactType(input.type);

    const version = input.version ?? 1;
    const dir = this.artifactDir(input.artifactId, version);
    const payloadFile = payloadPathFor(input.payloadKind);
    const bytes = encodePayload(input.payloadKind, input.payload);
    const hash = contentHash(bytes);
    const ts = nowIso();

    const meta: ArtifactMetaType = {
      schema_version: "1.0.0",
      artifact_id: input.artifactId,
      artifact_version: version,
      type: input.type,
      title: input.title,
      status: input.status ?? "draft",
      created_at: ts,
      updated_at: ts,
      tags: input.tags,
      trace: input.trace,
      produced_by: {
        role: input.producedBy.role,
        run_id: input.producedBy.runId,
        skill_id: input.producedBy.skillId,
        skill_version: input.producedBy.skillVersion,
        task_id: input.producedBy.taskId,
      },
      depends_on: input.dependsOn ?? [],
      supersedes: input.supersedes,
      content_hash: hash,
      payload: {
        kind: input.payloadKind,
        path: payloadFile,
        content_type:
          input.payloadKind === "json"
            ? "application/json"
            : input.payloadKind === "markdown"
              ? "text/markdown"
              : undefined,
      },
      allow_unstable: input.allowUnstable,
    };

    const parsed = ArtifactMeta.parse(meta);

    await fs.mkdir(dir, { recursive: true });
    const payloadAbs = path.join(dir, payloadFile);
    const metaAbs = path.join(dir, "meta.json");

    try {
      await fs.writeFile(payloadAbs, bytes, { flag: "wx" });
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code === "EEXIST") {
        throw new AiosError(
          "artifact-version-exists",
          `Artifact ${input.artifactId} v${version} already exists`,
          { details: { dir } },
        );
      }
      throw error;
    }

    try {
      await fs.writeFile(
        metaAbs,
        JSON.stringify(parsed, null, 2) + "\n",
        { flag: "wx", encoding: "utf8" },
      );
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code === "EEXIST") {
        throw new AiosError(
          "artifact-version-exists",
          `Artifact ${input.artifactId} v${version} meta already exists`,
          { details: { dir } },
        );
      }
      throw error;
    }

    return {
      meta: parsed,
      dir,
      payloadAbsolutePath: payloadAbs,
      payloadBytes: bytes,
    };
  }

  async readMeta(artifactId: string, version: number): Promise<ArtifactMetaType> {
    const metaPath = path.join(this.artifactDir(artifactId, version), "meta.json");
    try {
      const raw = await fs.readFile(metaPath, "utf8");
      return ArtifactMeta.parse(JSON.parse(raw));
    } catch (error) {
      if (error instanceof AiosError) throw error;
      throw new AiosError(
        "artifact-not-found",
        `Cannot read meta for ${artifactId} v${version}`,
        { details: { metaPath }, cause: error },
      );
    }
  }

  async readPayloadJson<T = unknown>(
    artifactId: string,
    version: number,
    schema?: z.ZodType<T>,
  ): Promise<T> {
    const meta = await this.readMeta(artifactId, version);
    if (meta.payload.kind !== "json") {
      throw new AiosError(
        "payload-kind-mismatch",
        `Expected json payload for ${artifactId} v${version}, got ${meta.payload.kind}`,
      );
    }
    const abs = path.join(this.artifactDir(artifactId, version), meta.payload.path);
    const raw = await fs.readFile(abs, "utf8");
    const parsed: unknown = JSON.parse(raw);
    if (schema) {
      return schema.parse(parsed);
    }
    return parsed as T;
  }

  async transitionStatus(
    artifactId: string,
    version: number,
    next: ArtifactStatus,
  ): Promise<ArtifactMetaType> {
    const meta = await this.readMeta(artifactId, version);
    assertStatusTransition(meta.status, next);
    const updated: ArtifactMetaType = {
      ...meta,
      status: next,
      updated_at: nowIso(),
    };
    const parsed = ArtifactMeta.parse(updated);
    const metaPath = path.join(this.artifactDir(artifactId, version), "meta.json");
    await fs.writeFile(metaPath, JSON.stringify(parsed, null, 2) + "\n", "utf8");
    return parsed;
  }

  /**
   * Publish a JSON artifact by writing a new version with payload.status synced
   * to meta.status=published (payload bytes remain create-once per version).
   */
  async publishJsonVersion<T extends { status?: ArtifactStatus; updated_at?: string }>(
    input: {
      artifactId: string;
      fromVersion: number;
      type: string;
      title?: string;
      schema: z.ZodType<T>;
      producedBy: WriteArtifactInput["producedBy"];
      dependsOn?: ArtifactRef[];
      trace?: TraceContext;
      mutate?: (payload: T) => T;
    },
  ): Promise<{ version: number; payload: T }> {
    const prev = await this.readPayloadJson(input.artifactId, input.fromVersion, input.schema);
    const nextVersion = ((await this.latestVersion(input.artifactId)) ?? input.fromVersion) + 1;
    const ts = nowIso();
    let nextPayload = {
      ...prev,
      status: "published" as const,
      updated_at: ts,
    } as T;
    if (input.mutate) nextPayload = input.mutate(nextPayload);
    nextPayload = input.schema.parse(nextPayload);

    await this.write({
      artifactId: input.artifactId,
      type: input.type,
      title: input.title,
      status: "published",
      version: nextVersion,
      payloadKind: "json",
      payload: nextPayload,
      producedBy: input.producedBy,
      dependsOn: input.dependsOn,
      supersedes: {
        artifact_id: input.artifactId,
        artifact_version: input.fromVersion,
        relation: "derived-from",
      },
      trace: input.trace,
    });

    const fromMeta = await this.readMeta(input.artifactId, input.fromVersion);
    if (fromMeta.status === "ready") {
      await this.transitionStatus(input.artifactId, input.fromVersion, "published");
    }
    if (
      fromMeta.status === "published" ||
      (await this.readMeta(input.artifactId, input.fromVersion)).status === "published"
    ) {
      await this.transitionStatus(input.artifactId, input.fromVersion, "superseded");
    } else if (fromMeta.status === "draft") {
      await this.transitionStatus(input.artifactId, input.fromVersion, "archived");
    }

    return { version: nextVersion, payload: nextPayload };
  }

  async latestVersion(artifactId: string): Promise<number | null> {
    if (!isArtifactId(artifactId)) {
      throw new AiosError(
        "invalid-artifact-id",
        `Invalid artifact id: ${artifactId}`,
      );
    }
    const base = path.join(this.runtimeRoot, "artifacts", artifactId);
    try {
      const entries = await fs.readdir(base);
      const versions = entries
        .map((e) => /^v(\d+)$/.exec(e))
        .filter((m): m is RegExpExecArray => Boolean(m))
        .map((m) => Number(m[1]));
      if (versions.length === 0) return null;
      return Math.max(...versions);
    } catch {
      return null;
    }
  }
}

const ALLOWED: Record<ArtifactStatus, ArtifactStatus[]> = {
  draft: ["ready", "archived"],
  ready: ["published", "archived"],
  published: ["superseded", "archived"],
  superseded: ["archived"],
  archived: [],
};

function assertStatusTransition(from: ArtifactStatus, to: ArtifactStatus): void {
  if (from === to) return;
  if (!ALLOWED[from].includes(to)) {
    throw new AiosError(
      "illegal-status-transition",
      `Cannot transition artifact status ${from} → ${to}`,
    );
  }
}
