/**
 * Framework Generator pipeline registration smoke (no worker invocation, no generation).
 * Run: npm run aios:framework-generator:smoke
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { createAiosCore } from "../index";

const GENERATORS = [
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
] as const;

const CLOSURE = ["generation-orchestrator", "generation-reporter"] as const;

const ALL_WORKERS = [...GENERATORS, ...CLOSURE] as const;

const REQUIRED_FIELDS = [
  "generation_id",
  "target",
  "spec_ref",
  "output_plan",
  "evidence",
  "impact",
  "severity",
  "recommendation",
  "alternative_solution",
  "confidence",
  "source_paths",
  "unknowns",
  "traceability",
  "folder_mirror",
] as const;

function assertWaveTopology(
  waves: string[][],
  edges: Array<{ predecessor: string; successor: string }>,
): void {
  const waveIndex = new Map<string, number>();
  waves.forEach((wave, idx) => {
    for (const id of wave) waveIndex.set(id, idx);
  });
  for (const edge of edges) {
    const pred = waveIndex.get(edge.predecessor);
    const succ = waveIndex.get(edge.successor);
    if (pred === undefined || succ === undefined) {
      throw new Error(`Edge references unknown worker: ${edge.predecessor}→${edge.successor}`);
    }
    if (pred >= succ) {
      throw new Error(
        `Wave violation: ${edge.predecessor} (wave ${pred}) must precede ${edge.successor} (wave ${succ})`,
      );
    }
  }
}

async function main() {
  const root = path.resolve(process.cwd(), "ai-os");
  const core = createAiosCore({ aiosRoot: root });

  const result =
    await core.knowledge.validateFrameworkGeneratorPipelineRegistration();
  if (result.workerCount !== 12) {
    throw new Error(
      `Expected 12 framework-generator workers, got ${result.workerCount}`,
    );
  }
  if (result.pipeline.waves.length !== 9) {
    throw new Error(`Expected 9 waves, got ${result.pipeline.waves.length}`);
  }

  assertWaveTopology(result.pipeline.waves, result.graph.edges);

  const version = (await fs.readFile(path.join(root, "VERSION"), "utf8")).trim();
  if (version !== "0.10.0") {
    throw new Error(`Expected VERSION 0.10.0, got ${version}`);
  }

  const meta = JSON.parse(
    await fs.readFile(
      path.join(root, "pipelines/framework-generator/.workers-meta.json"),
      "utf8",
    ),
  );
  const raci = await fs.readFile(
    path.join(root, "pipelines/framework-generator/RACI.md"),
    "utf8",
  );
  for (const id of ALL_WORKERS) {
    for (const kind of meta[id]?.entry_kinds ?? []) {
      const line = `| \`${kind}\` | \`${id}\` |`;
      if (!raci.includes(line)) {
        throw new Error(`RACI missing ownership: ${kind} → ${id}`);
      }
    }
  }

  for (const rel of [
    "schemas/framework-generator-payload.schema.json",
    "schemas/framework-generation.schema.json",
    "schemas/framework-generation-status.schema.json",
    "schemas/framework-generation-report.schema.json",
    "schemas/gate-framework-generation-report.schema.json",
    "schemas/generation-spec.schema.json",
    "contracts/framework-generator.md",
    "framework-generator/templates/capability-spec.template.yaml",
    "configs/examples/worker-generator.yaml",
    "RELEASE_NOTES_0.10.0.md",
  ]) {
    await fs.access(path.join(root, rel));
  }

  const vManifest = JSON.parse(
    await fs.readFile(
      path.join(root, "validators/framework-generator-schema-check/manifest.json"),
      "utf8",
    ),
  );
  if (vManifest.version !== "0.2.0") {
    throw new Error("validator must be 0.2.0");
  }
  const checkIds = new Set(
    (vManifest.checks ?? []).map((c: { check_id: string }) => c.check_id),
  );
  for (const id of ["raci-entry-kind", "generation-spec-valid", "gate-type-separate"]) {
    if (!checkIds.has(id)) {
      throw new Error(`validator missing check ${id}`);
    }
  }

  for (const id of GENERATORS) {
    const payload = JSON.parse(
      await fs.readFile(
        path.join(root, "workers", id, "examples", "sample-primary-payload.json"),
        "utf8",
      ),
    );
    if (payload.type !== "framework-generation") {
      throw new Error(`${id} primary payload must be framework-generation`);
    }
    for (const entry of payload.entries) {
      for (const f of REQUIRED_FIELDS) {
        if (entry[f] === undefined) {
          throw new Error(`entry missing ${f} for ${id}`);
        }
      }
      if (entry.impact.includes("{g['title']}")) {
        throw new Error(`corrupted impact template in ${id}`);
      }
      if (!entry.folder_mirror?.startsWith(`framework-generator/generators/${id}/`)) {
        throw new Error(`folder_mirror partition invalid for ${id}`);
      }
      if (!Array.isArray(entry.output_plan?.registries) || !entry.output_plan?.semver) {
        throw new Error(`output_plan typed fields missing for ${id}`);
      }
    }

    const skillMd = await fs.readFile(path.join(root, "skills", id, "SKILL.md"), "utf8");
    if (skillMd.includes("1. Load capability spec (YAML/JSON) from `configs/` or task input.\n2. Resolve template packs")) {
      throw new Error(`clone SKILL shell detected for ${id}`);
    }
  }

  const orch = JSON.parse(
    await fs.readFile(
      path.join(root, "workers/generation-orchestrator/examples/sample-primary-payload.json"),
      "utf8",
    ),
  );
  if (orch.type !== "framework-generation-status") {
    throw new Error("orchestrator must emit framework-generation-status");
  }

  const repGate = JSON.parse(
    await fs.readFile(
      path.join(root, "workers/generation-reporter/examples/sample-gate-payload.json"),
      "utf8",
    ),
  );
  if (repGate.type !== "gate-framework-generation-report") {
    throw new Error("reporter gate sample must be gate-framework-generation-report");
  }

  const multiIds = ["worker-generator", "project-bootstrap-generator", "pipeline-generator"];
  for (const id of multiIds) {
    const payload = JSON.parse(
      await fs.readFile(
        path.join(root, "workers", id, "examples", "sample-primary-payload.json"),
        "utf8",
      ),
    );
    if (payload.entries.length < 2) {
      throw new Error(`${id} must have multi-mode gold sample`);
    }
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        version,
        pipelineId: result.pipeline.id,
        workerCount: result.workerCount,
        waves: result.pipeline.waves.length,
        validatorVersion: "0.2.0",
        note: "Registration validated; Core does not invoke workers; generation not executed",
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
