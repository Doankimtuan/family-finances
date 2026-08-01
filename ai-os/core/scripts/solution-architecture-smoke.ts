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
    "schemas/solution-architecture-payload.schema.json",
    "schemas/architecture-v2-spec.schema.json",
    "schemas/tech-stack-recommendation.schema.json",
    "schemas/migration-plan.schema.json",
    "schemas/folder-structure-spec.schema.json",
    "quality/README.md",
    "architecture-v2/README.md",
    "tech-stack/README.md",
    "migration/README.md",
    "folder-structure/README.md",
    "decision-records/README.md",
    "redesign/README.md",
  ]) {
    await fs.access(path.join(root, rel));
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
    for (const entry of payload.entries) {
      if (!Array.isArray(entry.source_paths) || entry.source_paths.length < 1) {
        throw new Error(`entry missing source_paths for ${id}`);
      }
      if (typeof entry.confidence !== "number") {
        throw new Error(`entry missing confidence for ${id}`);
      }
    }
    await fs.access(path.join(root, "workers", id, "testcases.md"));
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
