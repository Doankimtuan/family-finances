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
    "validation/README.md",
    "reports/README.md",
    "scores/README.md",
    "artifacts/README.md",
    "execution/README.md",
    "quality/validation-scorecard/README.md",
    "contracts/validation-engine.md",
    "pipelines/validation-engine/pipeline.json",
    "pipelines/validation-engine/dependency-graph.json",
    "pipelines/validation-engine/execution-graph.md",
    "validators/validation-engine-schema-check/manifest.json",
    "reviewers/validation-engine-coverage-review/manifest.json",
    "reviewers/validation-engine-coverage-review/rubric/validation-engine-coverage.json",
  ]) {
    await fs.access(path.join(root, rel));
  }

  // SA quality template must remain intact (additive scorecard only)
  await fs.access(path.join(root, "quality/TEMPLATE.md"));

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
    if (!skillMd.includes("## Heuristics")) {
      throw new Error(`SKILL.md missing Heuristics for ${id}`);
    }
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
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
