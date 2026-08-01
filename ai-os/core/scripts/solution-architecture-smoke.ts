/**
 * Solution Architecture pipeline registration smoke (no worker invocation).
 * Run: npm run aios:solution-architecture:smoke
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { createAiosCore } from "../index";

async function main() {
  const root = path.resolve(process.cwd(), "ai-os");
  const core = createAiosCore({ aiosRoot: root });

  const result =
    await core.knowledge.validateSolutionArchitecturePipelineRegistration();
  if (result.workerCount !== 4) {
    throw new Error(
      `Expected 4 solution-architecture workers, got ${result.workerCount}`,
    );
  }
  if (result.pipeline.allows_feature_workers) {
    throw new Error("Feature workers must be forbidden");
  }
  if (result.pipeline.waves.length !== 3) {
    throw new Error(`Expected 3 waves, got ${result.pipeline.waves.length}`);
  }
  if (result.graph.edges.length !== 4) {
    throw new Error(`Expected 4 graph edges, got ${result.graph.edges.length}`);
  }

  for (const rel of [
    "core/packages/schemas/solution-architecture-payload.schema.json",
    "core/packages/schemas/architecture-v2-spec.schema.json",
    "core/packages/schemas/tech-stack-recommendation.schema.json",
    "core/packages/schemas/migration-plan.schema.json",
    "core/packages/schemas/folder-structure-spec.schema.json",
    "governance/quality/README.md",
    "artifacts/architecture-v2/README.md",
    "artifacts/tech-stack/README.md",
    "artifacts/migration/README.md",
    "artifacts/folder-structure/README.md",
    "governance/decision-records/README.md",
    "artifacts/redesign/README.md",
  ]) {
    await fs.access(path.join(root, rel));
  }

  for (const id of result.pipeline.workers) {
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
    for (const entry of payload.entries) {
      if (!Array.isArray(entry.source_paths) || entry.source_paths.length < 1) {
        throw new Error(`entry missing source_paths for ${id}`);
      }
      if (typeof entry.confidence !== "number") {
        throw new Error(`entry missing confidence for ${id}`);
      }
    }
    await fs.access(path.join(root, "core/packages/workers", id, "testcases.md"));
    await fs.access(path.join(root, "skills", id, "manifest.json"));
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        pipelineId: result.pipeline.id,
        workerCount: result.workerCount,
        waves: result.pipeline.waves.length,
        edges: result.graph.edges.length,
        note: "Registration validated; Core does not invoke workers",
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
