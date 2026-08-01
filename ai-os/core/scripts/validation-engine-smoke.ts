/**
 * Validation Engine pipeline registration smoke (no worker invocation).
 * Run: npm run aios:validation-engine:smoke
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { createAiosCore } from "../index";

const REQUIRED_FINDING_FIELDS = [
  "validation_id",
  "target",
  "rule",
  "result",
  "evidence",
  "severity",
  "recommendation",
  "confidence",
  "source_paths",
  "unknowns",
  "traceability",
] as const;

const SCORE_KINDS = [
  "overall",
  "architecture",
  "documentation",
  "consistency",
  "completeness",
  "maintainability",
  "extensibility",
  "reliability",
  "confidence",
] as const;

const REPORT_KINDS = [
  "summary",
  "critical",
  "high",
  "medium",
  "low",
  "recommended-fix",
  "decision",
] as const;

const TRACE_CONSUMES = [
  "features",
  "business",
  "requirements",
  "acceptance",
  "product-architecture",
  "architecture-v2",
  "specifications",
  "registry",
] as const;

const FINDING_WORKERS = [
  "artifact-validator",
  "schema-validator",
  "dependency-validator",
  "pipeline-validator",
  "traceability-validator",
  "completeness-validator",
  "consistency-validator",
] as const;

async function main() {
  const root = path.resolve(process.cwd(), "ai-os");
  const core = createAiosCore({ aiosRoot: root });

  const result =
    await core.knowledge.validateValidationEnginePipelineRegistration();
  if (result.workerCount !== 10) {
    throw new Error(
      `Expected 10 validation-engine workers, got ${result.workerCount}`,
    );
  }
  if (result.pipeline.allows_feature_workers) {
    throw new Error("Feature workers must be forbidden");
  }
  if (result.pipeline.waves.length !== 6) {
    throw new Error(`Expected 6 waves, got ${result.pipeline.waves.length}`);
  }
  if (result.graph.edges.length < 20) {
    throw new Error(
      `Expected ≥20 graph edges, got ${result.graph.edges.length}`,
    );
  }

  for (const rel of [
    "schemas/validation-engine-payload.schema.json",
    "schemas/validation-finding.schema.json",
    "schemas/validation-status.schema.json",
    "schemas/quality-scores.schema.json",
    "schemas/validation-report.schema.json",
    "schemas/gate-validation-report.schema.json",
    "validation/README.md",
    "validation/TEMPLATE.md",
    "reports/README.md",
    "reports/TEMPLATE.md",
    "scores/README.md",
    "scores/TEMPLATE.md",
    "artifacts/README.md",
    "execution/README.md",
    "quality/validation-scorecard/README.md",
    "contracts/validation-engine.md",
    "pipelines/validation-engine/pipeline.json",
    "pipelines/validation-engine/dependency-graph.json",
    "pipelines/validation-engine/execution-graph.md",
    "pipelines/validation-engine/RACI.md",
    "validators/validation-engine-schema-check/manifest.json",
    "reviewers/validation-engine-coverage-review/manifest.json",
    "reviewers/validation-engine-coverage-review/rubric/validation-engine-coverage.json",
    "RELEASE_NOTES_0.10.0.md",
  ]) {
    await fs.access(path.join(root, rel));
  }

  // SA quality template must remain intact (additive scorecard only)
  await fs.access(path.join(root, "quality/TEMPLATE.md"));

  const version = (await fs.readFile(path.join(root, "VERSION"), "utf8")).trim();
  if (version !== "0.10.0") {
    throw new Error(`Expected VERSION 0.10.0, got ${version}`);
  }

  const vManifest = JSON.parse(
    await fs.readFile(
      path.join(root, "validators/validation-engine-schema-check/manifest.json"),
      "utf8",
    ),
  );
  if (!vManifest.outputs?.includes("gate-validation-report")) {
    throw new Error("validator must output gate-validation-report");
  }
  const checkIds = new Set(
    (vManifest.checks ?? []).map((c: { check_id: string }) => c.check_id),
  );
  for (const id of [
    "folder-mirror-required",
    "score-dimension-coverage",
    "report-decision-required",
  ]) {
    if (!checkIds.has(id)) {
      throw new Error(`validator missing check ${id}`);
    }
  }

  const workersReg = JSON.parse(
    await fs.readFile(path.join(root, "registry/workers.json"), "utf8"),
  );

  for (const id of ["traceability-validator", "completeness-validator", "consistency-validator"]) {
    const consumes: string[] = workersReg.entries[id]?.consumes ?? [];
    for (const c of TRACE_CONSUMES) {
      if (!consumes.includes(c)) {
        throw new Error(`${id} must consume ${c}`);
      }
    }
  }
  for (const id of ["artifact-validator", "dependency-validator", "pipeline-validator"]) {
    const consumes: string[] = workersReg.entries[id]?.consumes ?? [];
    if (!consumes.includes("registry")) {
      throw new Error(`${id} must consume registry`);
    }
  }

  for (const id of result.pipeline.workers) {
    const payloadPath = path.join(
      root,
      "workers",
      id,
      "examples",
      "sample-primary-payload.json",
    );
    await fs.access(payloadPath);
    const payload = JSON.parse(await fs.readFile(payloadPath, "utf8"));
    if (payload.worker_id !== id) {
      throw new Error(`sample-primary-payload worker_id mismatch for ${id}`);
    }
    if (payload.extensions?.mutate_source_artifacts === true) {
      throw new Error(`mutate_source_artifacts true for ${id}`);
    }
    if (payload.extensions?.invent_missing_information === true) {
      throw new Error(`invent_missing_information true for ${id}`);
    }
    for (const entry of payload.entries) {
      for (const f of REQUIRED_FINDING_FIELDS) {
        if (entry[f] === undefined) {
          throw new Error(`entry missing ${f} for ${id}`);
        }
      }
      if (!Array.isArray(entry.evidence) || entry.evidence.length < 1) {
        throw new Error(`entry evidence empty for ${id}`);
      }
      if (!entry.traceability?.source_artifact) {
        throw new Error(`traceability.source_artifact missing for ${id}`);
      }
      for (const u of entry.unknowns) {
        if (typeof u !== "string" || !u.startsWith("UNKNOWN:")) {
          throw new Error(`unknowns must start with UNKNOWN: in ${id}`);
        }
      }
      if (entry.entry_kind === "pass" || entry.entry_kind === "fail") {
        throw new Error(`entry_kind must not be pass|fail in ${id}; use result`);
      }
    }

    if ((FINDING_WORKERS as readonly string[]).includes(id)) {
      for (const entry of payload.entries) {
        if (
          typeof entry.folder_mirror !== "string" ||
          !entry.folder_mirror.startsWith(`validation/${id}/`)
        ) {
          throw new Error(`folder_mirror must start with validation/${id}/ in ${id}`);
        }
      }
      await fs.access(path.join(root, "validation", id, "README.md"));
    }

    if (id === "quality-scoring-engine") {
      const kinds = new Set(payload.entries.map((e: { entry_kind: string }) => e.entry_kind));
      for (const k of SCORE_KINDS) {
        if (!kinds.has(k)) {
          throw new Error(`quality-scores missing dimension ${k}`);
        }
      }
      for (const entry of payload.entries) {
        if (typeof entry.score_value !== "number") {
          throw new Error(`score_value required on quality-scores entries`);
        }
      }
      if (payload.entries.length < 9) {
        throw new Error("quality-scores must have ≥9 entries");
      }
    }

    if (id === "validation-reporter") {
      const kinds = new Set(payload.entries.map((e: { entry_kind: string }) => e.entry_kind));
      for (const k of REPORT_KINDS) {
        if (!kinds.has(k)) {
          throw new Error(`validation-report missing kind ${k}`);
        }
      }
    }

    if (id === "validation-orchestrator") {
      const kinds = new Set(payload.entries.map((e: { entry_kind: string }) => e.entry_kind));
      for (const k of ["plan", "order", "merge", "overall-status"]) {
        if (!kinds.has(k)) {
          throw new Error(`validation-status missing ${k}`);
        }
      }
    }

    if (id === "dependency-validator") {
      if (!payload.entries.some((e: { entry_kind: string }) => e.entry_kind === "circular")) {
        throw new Error("dependency-validator sample must include circular gold example");
      }
    }
    if (id === "traceability-validator") {
      if (!payload.entries.some((e: { entry_kind: string }) => e.entry_kind === "orphan")) {
        throw new Error("traceability-validator sample must include orphan gold example");
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
      await fs.access(path.join(root, "workers", id, rel));
    }
    await fs.access(path.join(root, "skills", id, "manifest.json"));
    await fs.access(path.join(root, "skills", id, "SKILL.md"));
    const skillMd = await fs.readFile(
      path.join(root, "skills", id, "SKILL.md"),
      "utf8",
    );
    for (const section of [
      "## Heuristics",
      "## Done when",
      "## Ownership",
      "## Negative examples",
    ]) {
      if (!skillMd.includes(section)) {
        throw new Error(`SKILL.md missing ${section} for ${id}`);
      }
    }

    const skillMan = JSON.parse(
      await fs.readFile(path.join(root, "skills", id, "manifest.json"), "utf8"),
    );
    const inputTypes = new Set(
      (skillMan.inputs ?? []).map((i: { artifact_type: string }) => i.artifact_type),
    );
    if (!inputTypes.has("goal")) {
      throw new Error(`skill ${id} must accept goal input`);
    }
    if (
      ["traceability-validator", "completeness-validator", "consistency-validator"].includes(
        id,
      )
    ) {
      for (const t of [
        "feature-inventory",
        "business-rules",
        "requirement-spec",
        "acceptance-criteria",
        "product-architecture-notes",
        "architecture-v2-spec",
        "project-specification",
      ]) {
        if (!inputTypes.has(t)) {
          throw new Error(`skill ${id} missing input type ${t}`);
        }
      }
    }
  }

  // Artifact type registry
  const atypes = JSON.parse(
    await fs.readFile(path.join(root, "registry/artifact-types.json"), "utf8"),
  );
  if (!atypes.entries["gate-validation-report"]) {
    throw new Error("gate-validation-report must be registered");
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        version,
        pipelineId: result.pipeline.id,
        workerCount: result.workerCount,
        waves: result.pipeline.waves.length,
        edges: result.graph.edges.length,
        note: "Registration validated; Core does not invoke workers; validations not executed",
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
