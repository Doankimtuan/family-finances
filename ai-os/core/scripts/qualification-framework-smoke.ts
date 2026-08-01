/**
 * Qualification Framework pipeline registration smoke (no worker invocation, no benchmarks).
 * Run: npm run aios:qualification-framework:smoke
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { createAiosCore } from "../index";

const WORKERS = [
  "reference-project-catalog",
  "benchmark-runner",
  "qualification-runner",
  "evaluation-engine",
  "stress-test-runner",
  "metrics-engine",
  "coverage-analyzer",
  "regression-runner",
  "certification-engine",
  "release-qualification-board",
] as const;

const REQUIRED_FIELDS = [
  "qualification_id",
  "target",
  "rule",
  "result",
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

const REFERENCE_PROJECTS = [
  "small-react-app",
  "large-react-app",
  "nextjs-app",
  "vue-app",
  "angular-app",
  "node-backend",
  "nestjs-backend",
  "monorepo",
  "microservices",
  "desktop-app",
  "mobile-app",
  "cli-project",
  "library-project",
  "fullstack-project",
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
      throw new Error(
        `Edge references unknown worker: ${edge.predecessor}→${edge.successor}`,
      );
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
    await core.knowledge.validateQualificationFrameworkPipelineRegistration();
  if (result.workerCount !== 10) {
    throw new Error(
      `Expected 10 qualification-framework workers, got ${result.workerCount}`,
    );
  }
  if (result.pipeline.waves.length !== 7) {
    throw new Error(`Expected 7 waves, got ${result.pipeline.waves.length}`);
  }

  assertWaveTopology(result.pipeline.waves, result.graph.edges);

  const version = (await fs.readFile(path.join(root, "VERSION"), "utf8")).trim();
  if (version !== "0.10.0") {
    throw new Error(`Expected VERSION 0.10.0, got ${version}`);
  }

  const meta = JSON.parse(
    await fs.readFile(
      path.join(root, "pipelines/qualification-framework/.workers-meta.json"),
      "utf8",
    ),
  );
  const raci = await fs.readFile(
    path.join(root, "pipelines/qualification-framework/RACI.md"),
    "utf8",
  );
  for (const id of WORKERS) {
    for (const kind of meta[id]?.entry_kinds ?? []) {
      const line = `| \`${kind}\` | \`${id}\` |`;
      if (!raci.includes(line)) {
        throw new Error(`RACI missing ownership: ${kind} → ${id}`);
      }
    }
  }

  for (const rel of [
    "schemas/qualification-framework-payload.schema.json",
    "schemas/qualification-finding.schema.json",
    "schemas/qualification-scores.schema.json",
    "schemas/certification-report.schema.json",
    "schemas/release-qualification-decision.schema.json",
    "schemas/gate-qualification-report.schema.json",
    "contracts/qualification-framework.md",
    "qualification/reference-projects/catalog.json",
    "qualification/scorecards/metrics-catalog.json",
    "RELEASE_NOTES_0.10.0.md",
  ]) {
    await fs.access(path.join(root, rel));
  }

  const catalog = JSON.parse(
    await fs.readFile(
      path.join(root, "qualification/reference-projects/catalog.json"),
      "utf8",
    ),
  );
  if ((catalog.projects ?? []).length !== 14) {
    throw new Error("Expected 14 reference projects in catalog");
  }
  for (const proj of REFERENCE_PROJECTS) {
    await fs.access(
      path.join(root, "qualification/reference-projects", proj, "manifest.json"),
    );
  }

  const vManifest = JSON.parse(
    await fs.readFile(
      path.join(
        root,
        "validators/qualification-framework-schema-check/manifest.json",
      ),
      "utf8",
    ),
  );
  const checkIds = new Set(
    (vManifest.checks ?? []).map((c: { check_id: string }) => c.check_id),
  );
  for (const id of [
    "raci-entry-kind",
    "evaluate-only",
    "no-benchmark-execution",
    "go-no-go-present",
  ]) {
    if (!checkIds.has(id)) {
      throw new Error(`validator missing check ${id}`);
    }
  }

  for (const id of WORKERS) {
    const payload = JSON.parse(
      await fs.readFile(
        path.join(root, "workers", id, "examples", "sample-primary-payload.json"),
        "utf8",
      ),
    );
    for (const entry of payload.entries) {
      for (const f of REQUIRED_FIELDS) {
        if (entry[f] === undefined) {
          throw new Error(`entry missing ${f} for ${id}`);
        }
      }
      if (!String(entry.folder_mirror ?? "").startsWith("qualification/")) {
        throw new Error(`folder_mirror must be under qualification/ for ${id}`);
      }
      for (const u of entry.unknowns ?? []) {
        if (!String(u).startsWith("UNKNOWN:")) {
          throw new Error(`unknowns must start with UNKNOWN: in ${id}`);
        }
      }
    }

    const skillMd = await fs.readFile(
      path.join(root, "skills", id, "SKILL.md"),
      "utf8",
    );
    for (const section of [
      "## Ownership",
      "## Procedure",
      "## Done when",
      "### Rule catalog",
    ]) {
      if (!skillMd.includes(section)) {
        throw new Error(`SKILL.md missing ${section} for ${id}`);
      }
    }

    await fs.access(
      path.join(root, "qualification/templates", id, "report.template.md"),
    );
  }

  const metrics = JSON.parse(
    await fs.readFile(
      path.join(root, "workers/metrics-engine/examples/sample-primary-payload.json"),
      "utf8",
    ),
  );
  if (metrics.type !== "qualification-scores") {
    throw new Error("metrics-engine must emit qualification-scores");
  }
  if (metrics.entries.length < 13) {
    throw new Error("metrics-engine sample must cover 13 metric kinds");
  }

  const board = JSON.parse(
    await fs.readFile(
      path.join(
        root,
        "workers/release-qualification-board/examples/sample-primary-payload.json",
      ),
      "utf8",
    ),
  );
  if (board.type !== "release-qualification-decision") {
    throw new Error("board must emit release-qualification-decision");
  }
  const goNoGo = board.entries.find(
    (e: { entry_kind: string }) => e.entry_kind === "go-no-go",
  );
  if (!goNoGo || !String(goNoGo.statement ?? "").includes("NO-GO")) {
    throw new Error("board gold sample must demonstrate NO-GO path");
  }

  const contract = await fs.readFile(
    path.join(root, "contracts/qualification-framework.md"),
    "utf8",
  );
  for (const needle of [
    "Feature Discovery Recall",
    ">= 95%",
    "Traceability",
    "Critical Failures",
  ]) {
    if (!contract.includes(needle)) {
      throw new Error(`contract missing certification rule: ${needle}`);
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
        referenceProjects: 14,
        note: "Registration validated; Core does not invoke workers; benchmarks not executed",
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
