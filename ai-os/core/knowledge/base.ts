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

  /**
   * Load product-re pipeline and verify workers + capability package paths exist.
   * Does not invoke workers. Enforces no architecture/ consume and no Feature Workers.
   */
  async validateProductRePipelineRegistration(): Promise<{
    pipeline: PipelineDocument;
    graph: PipelineDependencyGraph;
    workerCount: number;
  }> {
    const pipeline = await this.getPipeline("product-re");
    if (pipeline.allows_feature_workers) {
      throw new AiosError(
        "feature-workers-forbidden",
        "Product RE pipeline must set allows_feature_workers=false",
      );
    }
    if (pipeline.worker_class !== "discovery") {
      throw new AiosError(
        "invalid-worker-class",
        "Product RE pipeline worker_class must be discovery (feature deferred)",
      );
    }

    const workersReg = await this.workers();
    const graph = await this.getPipelineDependencyGraph("product-re");
    const nodeIds = new Set(graph.nodes.map((n) => n.id));
    const workerIds = new Set(pipeline.workers);

    for (const id of pipeline.workers) {
      const entry = workersReg.entries[id] as
        | {
            path?: string;
            worker_class?: string;
            skill_id?: string;
            pipeline?: string;
            consumes?: string[];
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
      if (entry.pipeline && entry.pipeline !== "product-re") {
        throw new AiosError(
          "pipeline-graph-mismatch",
          `Worker ${id} registry pipeline must be product-re`,
        );
      }
      const consumes = entry.consumes ?? [];
      if (consumes.includes("architecture")) {
        throw new AiosError(
          "invalid-consume-path",
          `Worker ${id} must not consume architecture/ (use product-architecture/)`,
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

    for (const typeId of [
      "knowledge-notes",
      "feature-inventory",
      "business-rules",
      "product-architecture-notes",
      "product-model",
      "workflow-model",
      "requirement-spec",
      "acceptance-criteria",
      "product-re-gap",
    ]) {
      if (!(await this.hasArtifactType(typeId))) {
        throw new AiosError(
          "unknown-artifact-type",
          `${typeId} must be registered for product-re`,
        );
      }
    }

    await this.assertRegistryPathExists("product-architecture");
    await this.assertRegistryPathExists("gaps");
    await this.assertRegistryPathExists("schemas/product-re-payload.schema.json");
    await this.assertRegistryPathExists("schemas/product-model.schema.json");

    for (const typeId of ["doc-source", "app-surface"]) {
      if (!(await this.hasArtifactType(typeId))) {
        throw new AiosError(
          "unknown-artifact-type",
          `${typeId} must be registered for product-re soft inputs`,
        );
      }
    }

    return {
      pipeline,
      graph,
      workerCount: pipeline.workers.length,
    };
  }

  /**
   * Load solution-architecture pipeline and verify workers + packages exist.
   * Does not invoke workers. Enforces preserve-business-behavior invariants.
   */
  async validateSolutionArchitecturePipelineRegistration(): Promise<{
    pipeline: PipelineDocument;
    graph: PipelineDependencyGraph;
    workerCount: number;
  }> {
    const pipeline = await this.getPipeline("solution-architecture");
    if (pipeline.allows_feature_workers) {
      throw new AiosError(
        "feature-workers-forbidden",
        "Solution architecture pipeline must set allows_feature_workers=false",
      );
    }
    if (pipeline.worker_class !== "discovery") {
      throw new AiosError(
        "invalid-worker-class",
        "Solution architecture pipeline worker_class must be discovery (feature deferred)",
      );
    }

    const workersReg = await this.workers();
    const graph = await this.getPipelineDependencyGraph("solution-architecture");
    const nodeIds = new Set(graph.nodes.map((n) => n.id));
    const workerIds = new Set(pipeline.workers);

    for (const id of pipeline.workers) {
      const entry = workersReg.entries[id] as
        | {
            path?: string;
            worker_class?: string;
            skill_id?: string;
            pipeline?: string;
            consumes?: string[];
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
      if (entry.pipeline && entry.pipeline !== "solution-architecture") {
        throw new AiosError(
          "pipeline-graph-mismatch",
          `Worker ${id} registry pipeline must be solution-architecture`,
        );
      }
      const consumes = entry.consumes ?? [];
      if (consumes.includes("architecture")) {
        throw new AiosError(
          "invalid-consume-path",
          `Worker ${id} must consume product-architecture/ (alias for architecture/), not architecture/`,
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

    for (const typeId of [
      "architecture-v2-spec",
      "tech-stack-recommendation",
      "migration-plan",
      "folder-structure-spec",
      "quality-notes",
    ]) {
      if (!(await this.hasArtifactType(typeId))) {
        throw new AiosError(
          "unknown-artifact-type",
          `${typeId} must be registered for solution-architecture`,
        );
      }
    }

    await this.assertRegistryPathExists("quality");
    await this.assertRegistryPathExists("architecture-v2");
    await this.assertRegistryPathExists("tech-stack");
    await this.assertRegistryPathExists("migration");
    await this.assertRegistryPathExists("folder-structure");
    await this.assertRegistryPathExists("decision-records");
    await this.assertRegistryPathExists("redesign");
    await this.assertRegistryPathExists(
      "schemas/solution-architecture-payload.schema.json",
    );

    return {
      pipeline,
      graph,
      workerCount: pipeline.workers.length,
    };
  }

  /**
   * Load specification-engineering pipeline and verify workers + packages exist.
   * Does not invoke workers. Enforces no-invent / no-overwrite / architecture alias invariants.
   */
  async validateSpecificationEngineeringPipelineRegistration(): Promise<{
    pipeline: PipelineDocument;
    graph: PipelineDependencyGraph;
    workerCount: number;
  }> {
    const pipeline = await this.getPipeline("specification-engineering");
    if (pipeline.allows_feature_workers) {
      throw new AiosError(
        "feature-workers-forbidden",
        "Specification engineering pipeline must set allows_feature_workers=false",
      );
    }
    if (pipeline.worker_class !== "discovery") {
      throw new AiosError(
        "invalid-worker-class",
        "Specification engineering pipeline worker_class must be discovery (feature deferred)",
      );
    }

    const workersReg = await this.workers();
    const graph = await this.getPipelineDependencyGraph(
      "specification-engineering",
    );
    const nodeIds = new Set(graph.nodes.map((n) => n.id));
    const workerIds = new Set(pipeline.workers);

    for (const id of pipeline.workers) {
      const entry = workersReg.entries[id] as
        | {
            path?: string;
            worker_class?: string;
            skill_id?: string;
            pipeline?: string;
            consumes?: string[];
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
      if (entry.pipeline && entry.pipeline !== "specification-engineering") {
        throw new AiosError(
          "pipeline-graph-mismatch",
          `Worker ${id} registry pipeline must be specification-engineering`,
        );
      }
      const consumes = entry.consumes ?? [];
      if (consumes.includes("architecture")) {
        throw new AiosError(
          "invalid-consume-path",
          `Worker ${id} must consume product-architecture/ (alias for architecture/), not architecture/`,
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

    for (const typeId of [
      "repository-notes",
      "project-specification",
      "engineering-task-graph",
      "delivery-roadmap",
      "implementation-plan",
    ]) {
      if (!(await this.hasArtifactType(typeId))) {
        throw new AiosError(
          "unknown-artifact-type",
          `${typeId} must be registered for specification-engineering`,
        );
      }
    }

    await this.assertRegistryPathExists("repository");
    await this.assertRegistryPathExists("specifications");
    await this.assertRegistryPathExists("tasks");
    await this.assertRegistryPathExists("roadmap");
    await this.assertRegistryPathExists("implementation");
    await this.assertRegistryPathExists("decision-records");
    await this.assertRegistryPathExists("tech-stack");
    await this.assertRegistryPathExists("migration");
    await this.assertRegistryPathExists("folder-structure");
    await this.assertRegistryPathExists(
      "pipelines/specification-engineering/RACI.md",
    );
    await this.assertRegistryPathExists(
      "reviewers/specification-engineering-coverage-review/rubric/specification-engineering-coverage.json",
    );
    await this.assertRegistryPathExists(
      "schemas/specification-engineering-payload.schema.json",
    );
    await this.assertRegistryPathExists("schemas/repository-notes.schema.json");

    for (const id of pipeline.workers) {
      const entry = workersReg.entries[id] as { consumes?: string[] };
      for (const required of [
        "decision-records",
        "tech-stack",
        "migration",
        "folder-structure",
        "product-architecture",
      ]) {
        if (!(entry.consumes ?? []).includes(required)) {
          throw new AiosError(
            "invalid-consume-path",
            `Worker ${id} must consume ${required}`,
          );
        }
      }
    }

    return {
      pipeline,
      graph,
      workerCount: pipeline.workers.length,
    };
  }

  /**
   * Load validation-engine pipeline and verify workers + packages exist.
   * Does not invoke workers. Enforces no-mutate / no-invent invariants.
   */
  async validateValidationEnginePipelineRegistration(): Promise<{
    pipeline: PipelineDocument;
    graph: PipelineDependencyGraph;
    workerCount: number;
  }> {
    const pipeline = await this.getPipeline("validation-engine");
    if (pipeline.allows_feature_workers) {
      throw new AiosError(
        "feature-workers-forbidden",
        "Validation engine pipeline must set allows_feature_workers=false",
      );
    }
    if (pipeline.worker_class !== "discovery") {
      throw new AiosError(
        "invalid-worker-class",
        "Validation engine pipeline worker_class must be discovery",
      );
    }

    const workersReg = await this.workers();
    const graph = await this.getPipelineDependencyGraph("validation-engine");
    const nodeIds = new Set(graph.nodes.map((n) => n.id));
    const workerIds = new Set(pipeline.workers);

    for (const id of pipeline.workers) {
      const entry = workersReg.entries[id] as
        | {
            path?: string;
            worker_class?: string;
            skill_id?: string;
            pipeline?: string;
            consumes?: string[];
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
      if (entry.pipeline && entry.pipeline !== "validation-engine") {
        throw new AiosError(
          "pipeline-graph-mismatch",
          `Worker ${id} registry pipeline must be validation-engine`,
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

    for (const typeId of [
      "validation-finding",
      "validation-status",
      "quality-scores",
      "validation-report",
      "gate-validation-report",
    ]) {
      if (!(await this.hasArtifactType(typeId))) {
        throw new AiosError(
          "unknown-artifact-type",
          `${typeId} must be registered for validation-engine`,
        );
      }
    }

    const requiredSoftConsumes = [
      "features",
      "business",
      "requirements",
      "acceptance",
      "product-architecture",
      "architecture-v2",
      "specifications",
      "registry",
    ];
    for (const id of [
      "traceability-validator",
      "completeness-validator",
      "consistency-validator",
    ]) {
      const entry = workersReg.entries[id] as { consumes?: string[] } | undefined;
      const consumes = entry?.consumes ?? [];
      for (const c of requiredSoftConsumes) {
        if (!consumes.includes(c)) {
          throw new AiosError(
            "pipeline-graph-mismatch",
            `Worker ${id} must consume ${c} (Validation Engine C1)`,
          );
        }
      }
    }

    await this.assertRegistryPathExists("validation");
    await this.assertRegistryPathExists("reports");
    await this.assertRegistryPathExists("scores");
    await this.assertRegistryPathExists("artifacts");
    await this.assertRegistryPathExists("execution");
    await this.assertRegistryPathExists("quality/validation-scorecard");
    await this.assertRegistryPathExists("contracts/validation-engine.md");
    await this.assertRegistryPathExists("pipelines/validation-engine/RACI.md");
    await this.assertRegistryPathExists(
      "schemas/validation-engine-payload.schema.json",
    );
    await this.assertRegistryPathExists(
      "schemas/gate-validation-report.schema.json",
    );
    await this.assertRegistryPathExists(
      "reviewers/validation-engine-coverage-review/rubric/validation-engine-coverage.json",
    );

    return {
      pipeline,
      graph,
      workerCount: pipeline.workers.length,
    };
  }

  /**
   * Load review-engine pipeline and verify workers + packages exist.
   * Does not invoke workers. Enforces no-mutate / no-regenerate / no-schema-validation invariants.
   */
  async validateReviewEnginePipelineRegistration(): Promise<{
    pipeline: PipelineDocument;
    graph: PipelineDependencyGraph;
    workerCount: number;
  }> {
    const pipeline = await this.getPipeline("review-engine");
    if (pipeline.allows_feature_workers) {
      throw new AiosError(
        "feature-workers-forbidden",
        "Review engine pipeline must set allows_feature_workers=false",
      );
    }
    if (pipeline.worker_class !== "discovery") {
      throw new AiosError(
        "invalid-worker-class",
        "Review engine pipeline worker_class must be discovery",
      );
    }

    const workersReg = await this.workers();
    const graph = await this.getPipelineDependencyGraph("review-engine");
    const nodeIds = new Set(graph.nodes.map((n) => n.id));
    const workerIds = new Set(pipeline.workers);

    for (const id of pipeline.workers) {
      const entry = workersReg.entries[id] as
        | {
            path?: string;
            worker_class?: string;
            skill_id?: string;
            pipeline?: string;
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
      if (entry.pipeline && entry.pipeline !== "review-engine") {
        throw new AiosError(
          "pipeline-graph-mismatch",
          `Worker ${id} registry pipeline must be review-engine`,
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

    for (const typeId of [
      "review-finding",
      "review-status",
      "review-scores",
      "governance-decision",
      "gate-review-report",
    ]) {
      if (!(await this.hasArtifactType(typeId))) {
        throw new AiosError(
          "unknown-artifact-type",
          `${typeId} must be registered for review-engine`,
        );
      }
    }

    const requiredConsumes = [
      "artifacts",
      "validation",
      "reports",
      "scores",
      "knowledge",
      "specifications",
      "pipelines",
    ];
    const domainConsumes: Record<string, string[]> = {
      "architecture-reviewer": [
        "architecture-v2",
        "product-architecture",
        "decision-records",
        "workers",
        "schemas",
        "registry",
      ],
      "product-reviewer": [
        "features",
        "requirements",
        "acceptance",
        "product-architecture",
        "business",
      ],
      "business-reviewer": ["business", "workflow", "acceptance", "features"],
      "specification-reviewer": [
        "requirements",
        "acceptance",
        "architecture-v2",
        "tech-stack",
        "migration",
        "folder-structure",
        "features",
      ],
      "documentation-reviewer": ["templates", "workers", "schemas", "features"],
      "maintainability-reviewer": ["workers", "architecture-v2", "templates"],
      "scalability-reviewer": ["architecture-v2", "tech-stack", "migration"],
      "extensibility-reviewer": ["architecture-v2", "workers", "templates"],
      "ai-quality-reviewer": [
        "workers",
        "skills",
        "schemas",
        "registry",
        "templates",
      ],
    };
    for (const id of [
      "architecture-reviewer",
      "product-reviewer",
      "business-reviewer",
      "specification-reviewer",
      "documentation-reviewer",
      "maintainability-reviewer",
      "scalability-reviewer",
      "extensibility-reviewer",
      "ai-quality-reviewer",
    ]) {
      const entry = workersReg.entries[id] as { consumes?: string[] } | undefined;
      const consumes = entry?.consumes ?? [];
      for (const c of requiredConsumes) {
        if (!consumes.includes(c)) {
          throw new AiosError(
            "pipeline-graph-mismatch",
            `Worker ${id} must consume ${c}`,
          );
        }
      }
      for (const c of domainConsumes[id] ?? []) {
        if (!consumes.includes(c)) {
          throw new AiosError(
            "pipeline-graph-mismatch",
            `Worker ${id} must consume ${c} (Review Engine C1)`,
          );
        }
      }
    }

    await this.assertRegistryPathExists("reviews");
    await this.assertRegistryPathExists("governance");
    await this.assertRegistryPathExists("recommendations");
    await this.assertRegistryPathExists("decisions");
    await this.assertRegistryPathExists("improvements");
    await this.assertRegistryPathExists("contracts/review-engine.md");
    await this.assertRegistryPathExists("pipelines/review-engine/RACI.md");
    await this.assertRegistryPathExists("templates/review/DECISION_RECORD.md");
    await this.assertRegistryPathExists(
      "schemas/review-engine-payload.schema.json",
    );
    await this.assertRegistryPathExists("schemas/gate-review-report.schema.json");
    await this.assertRegistryPathExists(
      "reviewers/review-engine-coverage-review/rubric/review-engine-coverage.json",
    );

    return {
      pipeline,
      graph,
      workerCount: pipeline.workers.length,
    };
  }

  /**
   * Load framework-generator pipeline and verify workers + packages exist.
   * Does not invoke workers or execute generation.
   */
  async validateFrameworkGeneratorPipelineRegistration(): Promise<{
    pipeline: PipelineDocument;
    graph: PipelineDependencyGraph;
    workerCount: number;
  }> {
    const pipeline = await this.getPipeline("framework-generator");
    if (pipeline.allows_feature_workers) {
      throw new AiosError(
        "feature-workers-forbidden",
        "Framework generator pipeline must set allows_feature_workers=false",
      );
    }
    if (pipeline.worker_class !== "discovery") {
      throw new AiosError(
        "invalid-worker-class",
        "Framework generator pipeline worker_class must be discovery",
      );
    }

    const workersReg = await this.workers();
    const graph = await this.getPipelineDependencyGraph("framework-generator");
    const nodeIds = new Set(graph.nodes.map((n) => n.id));
    const workerIds = new Set(pipeline.workers);

    for (const id of pipeline.workers) {
      const entry = workersReg.entries[id] as
        | {
            path?: string;
            worker_class?: string;
            skill_id?: string;
            pipeline?: string;
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
      if (entry.pipeline && entry.pipeline !== "framework-generator") {
        throw new AiosError(
          "pipeline-graph-mismatch",
          `Worker ${id} registry pipeline must be framework-generator`,
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

    for (const typeId of [
      "framework-generation",
      "framework-generation-status",
      "framework-generation-report",
      "gate-framework-generation-report",
      "generation-spec",
    ]) {
      if (!(await this.hasArtifactType(typeId))) {
        throw new AiosError(
          "unknown-artifact-type",
          `${typeId} must be registered for framework-generator`,
        );
      }
    }

    const requiredConsumes = [
      "templates",
      "schemas",
      "workers",
      "validators",
      "reviewers",
      "pipelines",
      "knowledge",
      "configs",
      "artifacts",
      "registry",
    ];
    const generatorIds = [
      "schema-generator",
      "artifact-generator",
      "prompt-generator",
      "worker-generator",
      "validator-generator",
      "reviewer-generator",
      "pipeline-generator",
      "test-generator",
      "documentation-generator",
      "project-bootstrap-generator",
    ];
    for (const id of generatorIds) {
      const entry = workersReg.entries[id] as { consumes?: string[] } | undefined;
      const consumes = entry?.consumes ?? [];
      for (const c of requiredConsumes) {
        if (!consumes.includes(c)) {
          throw new AiosError(
            "pipeline-graph-mismatch",
            `Worker ${id} must consume ${c}`,
          );
        }
      }
    }

    await this.assertRegistryPathExists("framework-generator");
    await this.assertRegistryPathExists("framework-generator/catalog");
    await this.assertRegistryPathExists("configs/sample-capability.yaml");
    await this.assertRegistryPathExists("configs/examples/worker-generator.yaml");
    await this.assertRegistryPathExists("framework-generator/templates/capability-spec.template.yaml");
    await this.assertRegistryPathExists(
      "workers/generation-orchestrator/examples/sample-primary-payload.json",
    );
    await this.assertRegistryPathExists(
      "workers/generation-reporter/examples/sample-gate-payload.json",
    );
    await this.assertRegistryPathExists("contracts/framework-generator.md");
    await this.assertRegistryPathExists("pipelines/framework-generator/RACI.md");
    await this.assertRegistryPathExists(
      "schemas/framework-generator-payload.schema.json",
    );
    await this.assertRegistryPathExists("schemas/framework-generation.schema.json");
    await this.assertRegistryPathExists(
      "schemas/framework-generation-status.schema.json",
    );
    await this.assertRegistryPathExists(
      "schemas/framework-generation-report.schema.json",
    );
    await this.assertRegistryPathExists("schemas/generation-spec.schema.json");
    await this.assertRegistryPathExists(
      "schemas/gate-framework-generation-report.schema.json",
    );

    return {
      pipeline,
      graph,
      workerCount: pipeline.workers.length,
    };
  }

  /**
   * Load qualification-framework pipeline and verify workers + packages exist.
   * Does not invoke workers or execute benchmarks.
   */
  async validateQualificationFrameworkPipelineRegistration(): Promise<{
    pipeline: PipelineDocument;
    graph: PipelineDependencyGraph;
    workerCount: number;
  }> {
    const pipeline = await this.getPipeline("qualification-framework");
    if (pipeline.allows_feature_workers) {
      throw new AiosError(
        "feature-workers-forbidden",
        "Qualification framework pipeline must set allows_feature_workers=false",
      );
    }
    if (pipeline.worker_class !== "discovery") {
      throw new AiosError(
        "invalid-worker-class",
        "Qualification framework pipeline worker_class must be discovery",
      );
    }

    const workersReg = await this.workers();
    const graph = await this.getPipelineDependencyGraph("qualification-framework");
    const nodeIds = new Set(graph.nodes.map((n) => n.id));
    const workerIds = new Set(pipeline.workers);

    for (const id of pipeline.workers) {
      const entry = workersReg.entries[id] as
        | {
            path?: string;
            worker_class?: string;
            skill_id?: string;
            pipeline?: string;
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
      if (entry.pipeline && entry.pipeline !== "qualification-framework") {
        throw new AiosError(
          "pipeline-graph-mismatch",
          `Worker ${id} registry pipeline must be qualification-framework`,
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

    // Wave topological validity
    const waveIndex = new Map<string, number>();
    pipeline.waves.forEach((wave, idx) => {
      for (const id of wave) waveIndex.set(id, idx);
    });
    for (const edge of graph.edges) {
      const pred = waveIndex.get(edge.predecessor);
      const succ = waveIndex.get(edge.successor);
      if (pred === undefined || succ === undefined || pred >= succ) {
        throw new AiosError(
          "pipeline-graph-mismatch",
          `Wave violation: ${edge.predecessor} must precede ${edge.successor}`,
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

    for (const typeId of [
      "qualification-finding",
      "qualification-scores",
      "certification-report",
      "release-qualification-decision",
      "gate-qualification-report",
    ]) {
      if (!(await this.hasArtifactType(typeId))) {
        throw new AiosError(
          "unknown-artifact-type",
          `${typeId} must be registered for qualification-framework`,
        );
      }
    }

    const requiredConsumes = [
      "workers",
      "validators",
      "reviewers",
      "pipelines",
      "artifacts",
      "schemas",
      "templates",
      "reports",
      "knowledge",
      "specifications",
      "registry",
    ];
    for (const id of pipeline.workers) {
      const entry = workersReg.entries[id] as { consumes?: string[] } | undefined;
      const consumes = entry?.consumes ?? [];
      for (const c of requiredConsumes) {
        if (!consumes.includes(c)) {
          throw new AiosError(
            "pipeline-graph-mismatch",
            `Worker ${id} must consume ${c}`,
          );
        }
      }
    }

    await this.assertRegistryPathExists("qualification");
    await this.assertRegistryPathExists("qualification/reference-projects/catalog.json");
    await this.assertRegistryPathExists("qualification/scorecards/metrics-catalog.json");
    await this.assertRegistryPathExists("contracts/qualification-framework.md");
    await this.assertRegistryPathExists("pipelines/qualification-framework/RACI.md");
    await this.assertRegistryPathExists(
      "schemas/qualification-framework-payload.schema.json",
    );
    await this.assertRegistryPathExists("schemas/qualification-finding.schema.json");
    await this.assertRegistryPathExists("schemas/qualification-scores.schema.json");
    await this.assertRegistryPathExists("schemas/certification-report.schema.json");
    await this.assertRegistryPathExists(
      "schemas/release-qualification-decision.schema.json",
    );
    await this.assertRegistryPathExists("schemas/gate-qualification-report.schema.json");
    await this.assertRegistryPathExists(
      "reviewers/qualification-framework-coverage-review/rubric/qualification-framework-coverage.json",
    );

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
