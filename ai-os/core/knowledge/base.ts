import { promises as fs } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { AiosError } from "../lib/errors";
import { GateProfile, KebabId, Semver, Severity } from "../schemas/common";

const PackageStatus = z.enum(["reserved", "draft", "active", "deprecated"]);

const RegistryDocument = z
  .object({
    schema_version: z.literal("1.0.0"),
    registry_kind: z.enum([
      "skills",
      "validators",
      "reviewers",
      "artifact-types",
      "workers",
    ]),
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

const PipelineDocument = z
  .object({
    schema_version: z.literal("1.0.0"),
    id: KebabId,
    title: z.string().min(1),
    version: Semver,
    status: PackageStatus,
    worker_class: z.enum(["discovery", "feature"]),
    gate_profile: GateProfile.optional(),
    allows_feature_workers: z.boolean(),
    side_effect_ceiling: z.array(z.string()).min(1),
    workers: z.array(KebabId).min(1),
    dependency_graph_ref: z
      .object({
        path: z.string().min(1),
        artifact_id: z.string().min(5),
        schema: z.string().optional(),
      })
      .strict(),
    waves: z.array(z.array(KebabId).min(1)).min(1),
    primary_output_type: z.string().optional(),
    validator_id: KebabId.optional(),
    reviewer_id: KebabId.optional(),
    goal: z
      .object({
        title: z.string(),
        problem: z.string(),
        success_criteria: z
          .array(
            z
              .object({
                id: z.string().min(2),
                description: z.string(),
              })
              .strict(),
          )
          .min(1),
        non_goals: z.array(z.string()),
      })
      .strict()
      .optional(),
    created_at: z.string(),
    extensions: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();

const PipelineDependencyGraph = z
  .object({
    schema_version: z.literal("1.0.0"),
    artifact_id: z.string().min(5),
    kind: z.literal("worker"),
    pipeline_id: KebabId,
    title: z.string().optional(),
    created_at: z.string(),
    nodes: z
      .array(
        z
          .object({
            id: KebabId,
            node_type: z.literal("worker"),
            label: z.string().optional(),
            worker_class: z.enum(["discovery", "feature"]).optional(),
          })
          .strict(),
      )
      .min(1),
    edges: z.array(
      z
        .object({
          predecessor: KebabId,
          successor: KebabId,
          type: z.enum(["blocks", "feeds", "informs"]),
          relation: z.string().optional(),
        })
        .strict(),
    ),
    notes: z.array(z.string()).optional(),
    extensions: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();

export type RegistryDocument = z.infer<typeof RegistryDocument>;
export type GateProfiles = z.infer<typeof GateProfileFile>;
export type GateProfileEntry = z.infer<typeof GateProfileEntry>;
export type PipelineDocument = z.infer<typeof PipelineDocument>;
export type PipelineDependencyGraph = z.infer<typeof PipelineDependencyGraph>;

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

  async workers(): Promise<RegistryDocument> {
    return this.readJson("registry/workers.json", RegistryDocument);
  }

  async getPipeline(pipelineId: string): Promise<PipelineDocument> {
    KebabId.parse(pipelineId);
    return this.readJson(
      path.posix.join("pipelines", pipelineId, "pipeline.json"),
      PipelineDocument,
    );
  }

  async getPipelineDependencyGraph(
    pipelineId: string,
  ): Promise<PipelineDependencyGraph> {
    const pipeline = await this.getPipeline(pipelineId);
    const abs = path.join(this.aiosRoot, pipeline.dependency_graph_ref.path);
    try {
      const raw = await fs.readFile(abs, "utf8");
      return PipelineDependencyGraph.parse(JSON.parse(raw));
    } catch (error) {
      throw new AiosError(
        "pipeline-graph-load-failed",
        `Failed to load pipeline graph for ${pipelineId}`,
        { cause: error, details: { abs } },
      );
    }
  }

  /** Assert a registry entry path exists on disk under aiosRoot. */
  async assertRegistryPathExists(relPath: string): Promise<void> {
    const abs = path.join(this.aiosRoot, relPath);
    try {
      await fs.access(abs);
    } catch (error) {
      throw new AiosError(
        "registry-path-missing",
        `Registered path missing on disk: ${relPath}`,
        { cause: error, details: { abs } },
      );
    }
  }

  /**
   * Load discovery pipeline and verify workers + capability package paths exist.
   * Does not invoke workers.
   */
  async validateDiscoveryPipelineRegistration(): Promise<{
    pipeline: PipelineDocument;
    graph: PipelineDependencyGraph;
    workerCount: number;
  }> {
    const pipeline = await this.getPipeline("discovery");
    if (pipeline.allows_feature_workers) {
      throw new AiosError(
        "feature-workers-forbidden",
        "Discovery pipeline must set allows_feature_workers=false",
      );
    }
    if (pipeline.worker_class !== "discovery") {
      throw new AiosError(
        "invalid-worker-class",
        "Discovery pipeline worker_class must be discovery",
      );
    }

    const workersReg = await this.workers();
    const graph = await this.getPipelineDependencyGraph("discovery");
    const nodeIds = new Set(graph.nodes.map((n) => n.id));
    const workerIds = new Set(pipeline.workers);

    for (const id of pipeline.workers) {
      const entry = workersReg.entries[id] as
        | {
            path?: string;
            worker_class?: string;
            skill_id?: string;
          }
        | undefined;
      if (!entry) {
        throw new AiosError(
          "pipeline-worker-unregistered",
          `Pipeline worker ${id} missing from registry/workers.json`,
        );
      }
      if (entry.worker_class && entry.worker_class !== "discovery") {
        throw new AiosError(
          "feature-workers-forbidden",
          `Worker ${id} is not discovery class`,
        );
      }
      await this.assertRegistryPathExists(entry.path ?? `workers/${id}`);
      if (!nodeIds.has(id)) {
        throw new AiosError(
          "pipeline-graph-mismatch",
          `Worker ${id} missing from dependency graph nodes`,
        );
      }
    }

    for (const node of graph.nodes) {
      if (!workerIds.has(node.id)) {
        throw new AiosError(
          "pipeline-graph-mismatch",
          `Graph node ${node.id} not listed in pipeline.workers`,
        );
      }
    }

    for (const edge of graph.edges) {
      if (!workerIds.has(edge.predecessor) || !workerIds.has(edge.successor)) {
        throw new AiosError(
          "pipeline-graph-mismatch",
          `Edge ${edge.predecessor}→${edge.successor} references unknown worker`,
        );
      }
    }

    const skills = await this.skills();
    const validators = await this.validators();
    const reviewers = await this.reviewers();
    for (const id of pipeline.workers) {
      const entry = workersReg.entries[id] as { skill_id?: string };
      const skillId = entry.skill_id;
      if (skillId) {
        const skill = skills.entries[skillId];
        if (!skill?.path) {
          throw new AiosError(
            "registry-path-missing",
            `Skill ${skillId} missing path for worker ${id}`,
          );
        }
        await this.assertRegistryPathExists(skill.path);
      }
    }
    if (pipeline.validator_id) {
      const v = validators.entries[pipeline.validator_id];
      if (!v?.path) {
        throw new AiosError(
          "registry-path-missing",
          `Validator ${pipeline.validator_id} missing`,
        );
      }
      await this.assertRegistryPathExists(v.path);
    }
    if (pipeline.reviewer_id) {
      const r = reviewers.entries[pipeline.reviewer_id];
      if (!r?.path) {
        throw new AiosError(
          "registry-path-missing",
          `Reviewer ${pipeline.reviewer_id} missing`,
        );
      }
      await this.assertRegistryPathExists(r.path);
    }

    if (!(await this.hasArtifactType("discovery-report"))) {
      throw new AiosError(
        "unknown-artifact-type",
        "discovery-report must be registered",
      );
    }

    return {
      pipeline,
      graph,
      workerCount: pipeline.workers.length,
    };
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

  /** Resolve `"active"` pin to registry version, or return explicit semver. */
  async resolveSkillVersion(
    skillId: string,
    pin: string,
  ): Promise<string> {
    if (pin !== "active") {
      Semver.parse(pin);
      return pin;
    }
    const reg = await this.skills();
    const entry = reg.entries[skillId];
    const version = entry?.version;
    if (!version) {
      throw new AiosError(
        "skill-version-unresolved",
        `Cannot resolve active version for skill "${skillId}"`,
      );
    }
    Semver.parse(version);
    return version;
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
      workers: path.join(this.aiosRoot, "workers"),
      pipelines: path.join(this.aiosRoot, "pipelines"),
    };
  }
}
