/**
 * Discovery pipeline registration smoke (no worker invocation).
 * Run: npm run aios:discovery:smoke
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { createAiosCore } from "../index";

async function main() {
  const root = path.resolve(process.cwd(), "ai-os");
  const core = createAiosCore({ aiosRoot: root });

  const result = await core.knowledge.validateDiscoveryPipelineRegistration();
  if (result.workerCount !== 6) {
    throw new Error(`Expected 6 discovery workers, got ${result.workerCount}`);
  }
  if (result.pipeline.allows_feature_workers) {
    throw new Error("Feature workers must be forbidden");
  }
  if (result.graph.edges.length !== 7) {
    throw new Error(`Expected 7 graph edges, got ${result.graph.edges.length}`);
  }

  // Schemas present
  for (const rel of [
    "schemas/discovery-report.schema.json",
    "schemas/pipeline.schema.json",
    "schemas/pipeline-dependency-graph.schema.json",
    "schemas/worker-output-envelope.schema.json",
    "contracts/pipeline.md",
  ]) {
    await fs.access(path.join(root, rel));
  }

  // Sample discovery-report exists per worker
  for (const id of result.pipeline.workers) {
    await fs.access(
      path.join(root, "workers", id, "examples", "sample-discovery-report.json"),
    );
    const report = JSON.parse(
      await fs.readFile(
        path.join(root, "workers", id, "examples", "sample-discovery-report.json"),
        "utf8",
      ),
    );
    if (report.worker_id !== id) {
      throw new Error(`sample-discovery-report worker_id mismatch for ${id}`);
    }
    if (!Array.isArray(report.findings) || report.findings.length < 1) {
      throw new Error(`sample-discovery-report findings empty for ${id}`);
    }
  }

  // Allow Discovery + Product RE packages; forbid Feature Workers
  const workersReg = await core.knowledge.workers();
  const workerDirs = await fs.readdir(path.join(root, "workers"));
  for (const name of workerDirs) {
    if (name === "README.md") continue;
    const full = path.join(root, "workers", name);
    const st = await fs.stat(full);
    if (!st.isDirectory()) continue;
    const entry = workersReg.entries[name] as
      | { worker_class?: string; pipeline?: string }
      | undefined;
    if (!entry) {
      throw new Error(`Worker package ${name} not registered`);
    }
    if (entry.worker_class === "feature") {
      throw new Error(`Feature Worker package forbidden: ${name}`);
    }
    if (
      entry.pipeline !== "discovery" &&
      entry.pipeline !== "product-re"
    ) {
      throw new Error(
        `Unexpected worker pipeline for ${name}: ${entry.pipeline ?? "(missing)"}`,
      );
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
