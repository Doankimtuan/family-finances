/**
 * Runtime Engine pipeline registration smoke (no worker invocation, no execution).
 * Run: npm run aios:runtime-engine:smoke
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { createAiosCore } from "../index";

const WORKERS = [
  "runtime-configuration-loader",
  "event-bus",
  "logging-engine",
  "command-interpreter",
  "dependency-resolver",
  "execution-context-manager",
  "artifact-manager",
  "execution-planner",
  "checkpoint-manager",
  "progress-tracker",
  "worker-scheduler",
  "retry-engine",
  "resume-engine",
  "pipeline-engine",
  "master-orchestrator",
] as const;

const REQUIRED_FIELDS = [
  "runtime_id",
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

const COMMANDS = [
  "@Run full",
  "@Run incremental",
  "@Run phase 1",
  "@Run phase 2",
  "@Run resume",
  "@Run retry",
  "@Run validate",
  "@Run review",
  "@Run freeze",
  "@Run status",
  "@Run benchmark",
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
    await core.knowledge.validateRuntimeEnginePipelineRegistration();
  if (result.workerCount !== 15) {
    throw new Error(
      `Expected 15 runtime-engine workers, got ${result.workerCount}`,
    );
  }
  if (result.pipeline.waves.length !== 7) {
    throw new Error(`Expected 7 waves, got ${result.pipeline.waves.length}`);
  }

  assertWaveTopology(result.pipeline.waves, result.graph.edges);

  const version = (await fs.readFile(path.join(root, "VERSION"), "utf8")).trim();
  if (version !== "0.11.0") {
    throw new Error(`Expected VERSION 0.11.0, got ${version}`);
  }

  const meta = JSON.parse(
    await fs.readFile(
      path.join(root, "pipelines/runtime-engine/.workers-meta.json"),
      "utf8",
    ),
  );
  const raci = await fs.readFile(
    path.join(root, "pipelines/runtime-engine/RACI.md"),
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
    "schemas/runtime-engine-payload.schema.json",
    "schemas/runtime-status.schema.json",
    "schemas/runtime-plan.schema.json",
    "schemas/runtime-command.schema.json",
    "schemas/runtime-execution-report.schema.json",
    "schemas/gate-runtime-report.schema.json",
    "contracts/runtime-engine.md",
    "runtime/configs/.ai-os.yaml",
    "runtime/configs/run.yaml",
    "runtime/configs/workspace.yaml",
    "runtime/commands/command-registry.json",
    "runtime/execution/execution-model.md",
    "RELEASE_NOTES_0.11.0.md",
  ]) {
    await fs.access(path.join(root, rel));
  }

  const aiosYaml = await fs.readFile(
    path.join(root, "runtime/configs/.ai-os.yaml"),
    "utf8",
  );
  for (const key of [
    "mode:",
    "entry:",
    "projectRoot:",
    "output:",
    "resume:",
    "validation:",
    "review:",
    "freezeEachPhase:",
    "parallelWorkers:",
    "maxRetry:",
    "logging:",
  ]) {
    if (!aiosYaml.includes(key)) {
      throw new Error(`.ai-os.yaml missing key ${key}`);
    }
  }

  const cmdReg = JSON.parse(
    await fs.readFile(
      path.join(root, "runtime/commands/command-registry.json"),
      "utf8",
    ),
  );
  for (const c of COMMANDS) {
    if (!(cmdReg.commands ?? []).includes(c)) {
      throw new Error(`command-registry missing ${c}`);
    }
  }

  const vManifest = JSON.parse(
    await fs.readFile(
      path.join(root, "validators/runtime-engine-schema-check/manifest.json"),
      "utf8",
    ),
  );
  const checkIds = new Set(
    (vManifest.checks ?? []).map((c: { check_id: string }) => c.check_id),
  );
  for (const id of [
    "raci-entry-kind",
    "orchestrate-only",
    "no-worker-execution",
    "plan-before-execute",
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
      if (!String(entry.folder_mirror ?? "").startsWith("runtime/")) {
        throw new Error(`folder_mirror must be under runtime/ for ${id}`);
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
      path.join(root, "runtime/templates", id, "report.template.md"),
    );
  }

  const planner = JSON.parse(
    await fs.readFile(
      path.join(
        root,
        "workers/execution-planner/examples/sample-primary-payload.json",
      ),
      "utf8",
    ),
  );
  if (planner.type !== "runtime-plan") {
    throw new Error("execution-planner must emit runtime-plan");
  }
  const graphEntry = planner.entries.find(
    (e: { entry_kind: string }) => e.entry_kind === "execution-graph",
  );
  if (!graphEntry || !String(graphEntry.statement ?? "").includes("deferred")) {
    throw new Error("execution-planner must document deferred execution");
  }

  const master = JSON.parse(
    await fs.readFile(
      path.join(
        root,
        "workers/master-orchestrator/examples/sample-primary-payload.json",
      ),
      "utf8",
    ),
  );
  if (master.type !== "runtime-execution-report") {
    throw new Error("master-orchestrator must emit runtime-execution-report");
  }
  if (master.entries.length < 10) {
    throw new Error("master-orchestrator sample must cover 10 entry_kinds");
  }

  const cmds = JSON.parse(
    await fs.readFile(
      path.join(
        root,
        "workers/command-interpreter/examples/sample-primary-payload.json",
      ),
      "utf8",
    ),
  );
  if (cmds.type !== "runtime-command") {
    throw new Error("command-interpreter must emit runtime-command");
  }
  if (cmds.entries.length < 10) {
    throw new Error("command-interpreter must cover all @Run command kinds");
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        version,
        pipelineId: result.pipeline.id,
        workerCount: result.workerCount,
        waves: result.pipeline.waves.length,
        commands: COMMANDS.length,
        note: "Registration validated; Core does not invoke workers; runtime not executed",
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
