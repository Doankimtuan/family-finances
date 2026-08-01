import { promises as fs } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { AiosError } from "../lib/errors";
import { GateProfile, KebabId, Severity } from "../schemas/common";

const PackageStatus = z.enum(["reserved", "draft", "active", "deprecated"]);

const RegistryDocument = z
  .object({
    schema_version: z.literal("1.0.0"),
    registry_kind: z.enum(["skills", "validators", "reviewers", "artifact-types"]),
    updated_at: z.string(),
    entries: z.record(
      z.string(),
      z
        .object({
          id: z.string(),
          path: z.string().optional(),
          version: z.string().optional(),
          status: PackageStatus.optional(),
          description: z.string().optional(),
          payload_kinds: z.array(z.string()).optional(),
        })
        .passthrough(),
    ),
  })
  .strict();

const GateProfileEntry = z
  .object({
    blocking_severities: z.array(Severity),
    require_review_on_repo_write: z.boolean(),
    require_review_on_plan: z.boolean().optional(),
    allow_publish_with_warn: z.boolean(),
    validators_blocking: z.boolean(),
    reviews_blocking: z.boolean(),
  })
  .strict();

const GateProfileFile = z
  .object({
    schema_version: z.literal("1.0.0"),
    profiles: z.record(GateProfile, GateProfileEntry),
  })
  .strict();

export type RegistryDocument = z.infer<typeof RegistryDocument>;
export type GateProfiles = z.infer<typeof GateProfileFile>;
export type GateProfileEntry = z.infer<typeof GateProfileEntry>;

/**
 * Read-only knowledge plane: registries, policies, and framework pointers.
 */
export class KnowledgeBase {
  private cache = new Map<string, unknown>();

  constructor(private readonly aiosRoot: string) {}

  private async readJson<T>(rel: string, schema: z.ZodType<T>): Promise<T> {
    const abs = path.join(this.aiosRoot, rel);
    if (this.cache.has(abs)) return this.cache.get(abs) as T;
    try {
      const raw = await fs.readFile(abs, "utf8");
      const parsed = schema.parse(JSON.parse(raw));
      this.cache.set(abs, parsed);
      return parsed;
    } catch (error) {
      throw new AiosError("knowledge-load-failed", `Failed to load ${rel}`, {
        cause: error,
        details: { abs },
      });
    }
  }

  invalidate(): void {
    this.cache.clear();
  }

  async artifactTypes(): Promise<RegistryDocument> {
    return this.readJson("registry/artifact-types.json", RegistryDocument);
  }

  async skills(): Promise<RegistryDocument> {
    return this.readJson("registry/skills.json", RegistryDocument);
  }

  async validators(): Promise<RegistryDocument> {
    return this.readJson("registry/validators.json", RegistryDocument);
  }

  async reviewers(): Promise<RegistryDocument> {
    return this.readJson("registry/reviewers.json", RegistryDocument);
  }

  async gateProfiles(): Promise<GateProfiles> {
    return this.readJson("policies/gate-profiles.json", GateProfileFile);
  }

  async hasArtifactType(typeId: string): Promise<boolean> {
    const reg = await this.artifactTypes();
    return Object.prototype.hasOwnProperty.call(reg.entries, typeId);
  }

  async assertArtifactType(typeId: string): Promise<void> {
    if (!(await this.hasArtifactType(typeId))) {
      throw new AiosError(
        "unknown-artifact-type",
        `Artifact type "${typeId}" is not registered`,
      );
    }
  }

  async skillStatus(skillId: string): Promise<string | undefined> {
    KebabId.parse(skillId);
    const reg = await this.skills();
    return reg.entries[skillId]?.status;
  }

  async getGateProfile(name: z.infer<typeof GateProfile>): Promise<GateProfileEntry> {
    const all = await this.gateProfiles();
    const profile = all.profiles[name];
    if (!profile) {
      throw new AiosError(
        "unknown-gate-profile",
        `Gate profile "${name}" is not defined`,
      );
    }
    return profile;
  }

  frameworkPointers(): Record<string, string> {
    return {
      overview: path.join(this.aiosRoot, "architecture/OVERVIEW.md"),
      agents: path.join(this.aiosRoot, "AGENTS.md"),
      traceability: path.join(this.aiosRoot, "architecture/TRACEABILITY.md"),
      migrations: path.join(this.aiosRoot, "architecture/MIGRATIONS.md"),
      jsonSchemas: path.join(this.aiosRoot, "schemas"),
      templates: path.join(this.aiosRoot, "templates"),
      core: path.join(this.aiosRoot, "core"),
    };
  }
}
