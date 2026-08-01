/**
 * Specification Engineering pipeline registration smoke (no worker invocation).
 * Run: npm run aios:specification-engineering:smoke
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { createAiosCore } from "../index";

const REQUIRED_SPEC_KINDS = [
  "project-overview",
  "functional",
  "non-functional",
  "architecture",
  "module",
  "feature",
  "api",
  "database",
  "ui",
  "security",
  "deployment",
  "coding-standards",
  "testing-strategy",
] as const;

const BODY_FIELDS = [
  "purpose",
  "scope",
  "actors",
  "preconditions",
  "postconditions",
  "workflow",
  "business_rules",
  "validation_rules",
  "error_handling",
  "edge_cases",
  "dependencies",
  "acceptance_criteria",
] as const;

const TRACE_FIELDS = [
  "feature",
  "business_rule",
  "api",
  "database",
  "workflow",
  "architecture_decision",
  "source_artifact",
] as const;

const EXPECTED_SKILL_TYPES: Record<string, string> = {
  knowledge: "knowledge-notes",
  repository: "repository-notes",
  features: "feature-inventory",
  business: "business-rules",
  architecture: "product-architecture-notes",
  "architecture-v2": "architecture-v2-spec",
  "decision-records": "architecture-decision-record",
  "tech-stack": "tech-stack-recommendation",
  migration: "migration-plan",
  "folder-structure": "folder-structure-spec",
  requirements: "requirement-spec",
  quality: "quality-notes",
  redesign: "redesign-overview",
  workflow: "workflow-model",
  acceptance: "acceptance-criteria",
  specifications: "project-specification",
  tasks: "engineering-task-graph",
  roadmap: "delivery-roadmap",
};

function assertNoAiosArchitecturePaths(paths: string[], workerId: string) {
  for (const p of paths) {
    if (
      p.includes("ai-os/architecture") ||
      p === "docs/architecture/" ||
      p.startsWith("docs/architecture/")
    ) {
      throw new Error(
        `forbidden architecture path in ${workerId} sample: ${p}`,
      );
    }
  }
}

async function main() {
  const root = path.resolve(process.cwd(), "ai-os");
  const core = createAiosCore({ aiosRoot: root });

  const result =
    await core.knowledge.validateSpecificationEngineeringPipelineRegistration();
  if (result.workerCount !== 4) {
    throw new Error(
      `Expected 4 specification-engineering workers, got ${result.workerCount}`,
    );
  }
  if (result.pipeline.allows_feature_workers) {
    throw new Error("Feature workers must be forbidden");
  }
  if (result.pipeline.waves.length !== 4) {
    throw new Error(`Expected 4 waves, got ${result.pipeline.waves.length}`);
  }
  if (result.graph.edges.length !== 6) {
    throw new Error(`Expected 6 graph edges, got ${result.graph.edges.length}`);
  }

  for (const rel of [
    "core/packages/schemas/specification-engineering-payload.schema.json",
    "core/packages/schemas/project-specification.schema.json",
    "core/packages/schemas/engineering-task-graph.schema.json",
    "core/packages/schemas/delivery-roadmap.schema.json",
    "core/packages/schemas/implementation-plan.schema.json",
    "core/packages/schemas/repository-notes.schema.json",
    "artifacts/repository/README.md",
    "artifacts/specifications/README.md",
    "artifacts/specifications/examples/household-project-specification.json",
    "artifacts/tasks/README.md",
    "artifacts/tasks/examples/jar-engineering-task-graph.json",
    "artifacts/roadmap/README.md",
    "artifacts/roadmap/examples/r1-delivery-roadmap.json",
    "artifacts/implementation/README.md",
    "artifacts/implementation/examples/jar-implementation-plan.json",
    "core/packages/pipelines/specification-engineering/pipeline.json",
    "core/packages/pipelines/specification-engineering/dependency-graph.json",
    "core/packages/pipelines/specification-engineering/RACI.md",
    "core/packages/validators/specification-engineering-schema-check/manifest.json",
    "core/packages/reviewers/specification-engineering-coverage-review/manifest.json",
    "core/packages/reviewers/specification-engineering-coverage-review/rubric/specification-engineering-coverage.json",
  ]) {
    await fs.access(path.join(root, rel));
  }

  const validator = JSON.parse(
    await fs.readFile(
      path.join(
        root,
        "core/packages/validators/specification-engineering-schema-check/manifest.json",
      ),
      "utf8",
    ),
  );
  if (validator.version !== "0.2.0") {
    throw new Error(`Expected validator 0.2.0, got ${validator.version}`);
  }
  const checkIds = new Set(validator.checks.map((c: { check_id: string }) => c.check_id));
  for (const id of [
    "spec-section-coverage",
    "spec-body-fields",
    "spec-traceability-matrix",
    "no-aios-architecture-as-product",
  ]) {
    if (!checkIds.has(id)) {
      throw new Error(`Validator missing check ${id}`);
    }
  }

  const requiredConsumes = [
    "decision-records",
    "tech-stack",
    "migration",
    "folder-structure",
    "product-architecture",
  ];
  const workersReg = await core.knowledge.workers();

  for (const id of result.pipeline.workers) {
    const entry = workersReg.entries[id] as { consumes?: string[] };
    for (const c of requiredConsumes) {
      if (!(entry.consumes ?? []).includes(c)) {
        throw new Error(`Worker ${id} missing consume ${c}`);
      }
    }
    if ((entry.consumes ?? []).includes("architecture")) {
      throw new Error(`Worker ${id} must not consume docs/architecture/`);
    }

    const payloadPath = path.join(
      root,
      "core/packages/workers",
      id,
      "examples",
      "sample-primary-payload.json",
    );
    await fs.access(payloadPath);
    const payload = JSON.parse(await fs.readFile(payloadPath, "utf8"));
    if (payload.worker_id !== id) {
      throw new Error(`sample-primary-payload worker_id mismatch for ${id}`);
    }
    for (const e of payload.entries) {
      if (!Array.isArray(e.source_paths) || e.source_paths.length < 1) {
        throw new Error(`entry missing source_paths for ${id}`);
      }
      assertNoAiosArchitecturePaths(e.source_paths, id);
      if (typeof e.confidence !== "number") {
        throw new Error(`entry missing confidence for ${id}`);
      }
      if (!Array.isArray(e.unknowns) || e.unknowns.length < 1) {
        throw new Error(`entry missing unknowns[] for ${id}`);
      }
      for (const u of e.unknowns) {
        if (typeof u !== "string" || !u.startsWith("UNKNOWN:")) {
          throw new Error(`unknowns must start with UNKNOWN: in ${id}`);
        }
      }
      if (!e.traceability?.source_artifact) {
        throw new Error(`entry missing traceability.source_artifact for ${id}`);
      }
    }

    if (payload.type === "project-specification") {
      const kinds = new Set(
        payload.entries.map((e: { entry_kind: string }) => e.entry_kind),
      );
      for (const k of REQUIRED_SPEC_KINDS) {
        if (!kinds.has(k)) {
          throw new Error(`spec sample missing section kind ${k}`);
        }
      }
      for (const e of payload.entries) {
        if (e.entry_kind === "conflict" || e.entry_kind === "gap") continue;
        for (const f of BODY_FIELDS) {
          if (e[f] === undefined) {
            throw new Error(`spec sample entry ${e.id} missing ${f}`);
          }
        }
        for (const f of TRACE_FIELDS) {
          if (!e.traceability?.[f]) {
            throw new Error(`spec sample entry ${e.id} missing traceability.${f}`);
          }
        }
      }
    }

    if (payload.type === "engineering-task-graph") {
      const kinds = new Set(
        payload.entries.map((e: { entry_kind: string }) => e.entry_kind),
      );
      if (!kinds.has("epic")) throw new Error("task sample missing epic");
      if (!kinds.has("feature") && !kinds.has("story")) {
        throw new Error("task sample missing feature|story");
      }
      if (!kinds.has("task") && !kinds.has("subtask")) {
        throw new Error("task sample missing task|subtask");
      }
    }

    if (payload.type === "delivery-roadmap") {
      const kinds = new Set(
        payload.entries.map((e: { entry_kind: string }) => e.entry_kind),
      );
      if (!kinds.has("phase") && !kinds.has("release")) {
        throw new Error("roadmap sample missing phase|release");
      }
      if (!kinds.has("delivery-order")) {
        throw new Error("roadmap sample missing delivery-order");
      }
      if (!kinds.has("risk")) throw new Error("roadmap sample missing risk");
    }

    if (payload.type === "implementation-plan") {
      const kinds = new Set(
        payload.entries.map((e: { entry_kind: string }) => e.entry_kind),
      );
      if (!kinds.has("build-order")) {
        throw new Error("implementation sample missing build-order");
      }
      if (!kinds.has("critical-path")) {
        throw new Error("implementation sample missing critical-path");
      }
      if (!kinds.has("parallel-work") && !kinds.has("blocked")) {
        throw new Error("implementation sample missing parallel-work|blocked");
      }
    }

    for (const rel of [
      "README.md",
      "skill.md",
      "validator.md",
      "reviewer.md",
      "checklist.md",
      "output-schema.json",
      "testcases.md",
      "manifest.json",
    ]) {
      await fs.access(path.join(root, "core/packages/workers", id, rel));
    }

    const skillPath = path.join(root, "skills", id, "manifest.json");
    await fs.access(skillPath);
    await fs.access(path.join(root, "skills", id, "SKILL.md"));
    const skill = JSON.parse(await fs.readFile(skillPath, "utf8"));
    const skillMd = await fs.readFile(
      path.join(root, "skills", id, "SKILL.md"),
      "utf8",
    );
    if (!skillMd.includes("## Heuristics")) {
      throw new Error(`SKILL.md missing Heuristics for ${id}`);
    }
    if (!skillMd.includes("## Done when")) {
      throw new Error(`SKILL.md missing Done when for ${id}`);
    }
    for (const input of skill.inputs as {
      name: string;
      artifact_type: string;
    }[]) {
      if (input.name === "goal") {
        if (input.artifact_type !== "goal") {
          throw new Error(`skill ${id} goal input must be artifact_type goal`);
        }
        continue;
      }
      const expected = EXPECTED_SKILL_TYPES[input.name];
      if (expected && input.artifact_type !== expected) {
        throw new Error(
          `skill ${id} input "${input.name}" expected ${expected}, got ${input.artifact_type}`,
        );
      }
    }
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        pipelineId: result.pipeline.id,
        pipelineVersion: result.pipeline.version,
        workerCount: result.workerCount,
        waves: result.pipeline.waves.length,
        edges: result.graph.edges.length,
        validatorVersion: validator.version,
        note: "Registration + coverage fixtures validated; Core does not invoke workers",
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
