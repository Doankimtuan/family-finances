/**
 * Review Engine pipeline registration smoke (no worker invocation).
 * Run: npm run aios:review-engine:smoke
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { createAiosCore } from "../index";

const REQUIRED_REVIEW_FIELDS = [
  "review_id",
  "target",
  "finding",
  "evidence",
  "impact",
  "severity",
  "recommendation",
  "alternative_solution",
  "confidence",
  "source_paths",
  "unknowns",
  "traceability",
] as const;

const SEVERITY_LITERALS = new Set([
  "critical",
  "high",
  "medium",
  "low",
  "info",
]);

const SCORE_KINDS = [
  "architecture",
  "business",
  "product",
  "documentation",
  "specifications",
  "maintainability",
  "scalability",
  "extensibility",
  "ai-reliability",
  "overall-engineering-quality",
] as const;

const DECISION_KINDS = [
  "summary",
  "overall-recommendation",
  "critical-risks",
  "improvement-plan",
  "go-no-go",
  "release-recommendation",
  "decision",
] as const;

const REVIEWER_WORKERS = [
  "architecture-reviewer",
  "product-reviewer",
  "business-reviewer",
  "specification-reviewer",
  "documentation-reviewer",
  "maintainability-reviewer",
  "scalability-reviewer",
  "extensibility-reviewer",
  "ai-quality-reviewer",
] as const;

const SKILL_INPUTS: Record<string, string[]> = {
  "product-reviewer": [
    "feature-inventory",
    "requirement-spec",
    "acceptance-criteria",
    "product-architecture-notes",
    "business-rules",
  ],
  "business-reviewer": [
    "business-rules",
    "workflow-model",
    "acceptance-criteria",
    "feature-inventory",
  ],
  "architecture-reviewer": [
    "architecture-v2-spec",
    "product-architecture-notes",
    "architecture-decision-record",
  ],
  "ai-quality-reviewer": ["doc-source"],
};

async function main() {
  const root = path.resolve(process.cwd(), "ai-os");
  const core = createAiosCore({ aiosRoot: root });

  const result = await core.knowledge.validateReviewEnginePipelineRegistration();
  if (result.workerCount !== 11) {
    throw new Error(
      `Expected 11 review-engine workers, got ${result.workerCount}`,
    );
  }
  if (result.pipeline.waves.length !== 3) {
    throw new Error(`Expected 3 waves, got ${result.pipeline.waves.length}`);
  }

  for (const rel of [
    "schemas/review-engine-payload.schema.json",
    "pipelines/review-engine/RACI.md",
    "contracts/review-engine.md",
    "templates/review/DECISION_RECORD.md",
    "templates/review/REVIEW_MATRIX.md",
    "validators/review-engine-schema-check/manifest.json",
    "reviewers/review-engine-coverage-review/rubric/review-engine-coverage.json",
    "RELEASE_NOTES_0.9.1.md",
  ]) {
    await fs.access(path.join(root, rel));
  }

  const version = (await fs.readFile(path.join(root, "VERSION"), "utf8")).trim();
  if (version !== "0.9.1") {
    throw new Error(`Expected VERSION 0.9.1, got ${version}`);
  }

  const vManifest = JSON.parse(
    await fs.readFile(
      path.join(root, "validators/review-engine-schema-check/manifest.json"),
      "utf8",
    ),
  );
  if (vManifest.version !== "0.3.0") {
    throw new Error("validator must be 0.3.0");
  }
  const checkIds = new Set(
    (vManifest.checks ?? []).map((c: { check_id: string }) => c.check_id),
  );
  for (const id of [
    "folder-mirror-finding",
    "folder-mirror-decision",
    "score-dimension-coverage",
    "status-kinds",
    "raci-entry-kind",
  ]) {
    if (!checkIds.has(id)) {
      throw new Error(`validator missing check ${id}`);
    }
  }

  const workersMeta = JSON.parse(
    await fs.readFile(
      path.join(root, "pipelines/review-engine/.workers-meta.json"),
      "utf8",
    ),
  );

  for (const id of REVIEWER_WORKERS) {
    await fs.access(
      path.join(root, "reviews/examples", `${id}-finding.json`),
    );
  }
  if (
    workersMeta["architecture-reviewer"]?.entry_kinds?.includes(
      "extensibility-review",
    )
  ) {
    throw new Error("architecture-reviewer must not own extensibility-review");
  }
  if (
    workersMeta["architecture-reviewer"]?.entry_kinds?.includes(
      "scalability-review",
    )
  ) {
    throw new Error("architecture-reviewer must not own scalability-review");
  }
  if (
    !workersMeta["architecture-reviewer"]?.entry_kinds?.includes(
      "architecture-quality",
    )
  ) {
    throw new Error("architecture-reviewer entry_kinds missing");
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

    for (const entry of payload.entries) {
      for (const f of REQUIRED_REVIEW_FIELDS) {
        if (entry[f] === undefined) {
          throw new Error(`entry missing ${f} for ${id}`);
        }
      }
      if (SEVERITY_LITERALS.has(entry.impact)) {
        throw new Error(`impact must not be severity literal for ${id}`);
      }
      for (const u of entry.unknowns) {
        if (!u.startsWith("UNKNOWN:")) {
          throw new Error(`unknowns must start with UNKNOWN: in ${id}`);
        }
      }
    }

    if ((REVIEWER_WORKERS as readonly string[]).includes(id)) {
      for (const entry of payload.entries) {
        if (!entry.folder_mirror?.startsWith(`reviews/${id}/`)) {
          throw new Error(`folder_mirror must start with reviews/${id}/`);
        }
      }
    }

    if (id === "review-orchestrator") {
      await fs.access(
        path.join(root, "workers/review-orchestrator/examples/sample-secondary-payload.json"),
      );
      const scores = JSON.parse(
        await fs.readFile(
          path.join(root, "workers/review-orchestrator/examples/sample-secondary-payload.json"),
          "utf8",
        ),
      );
      if (scores.type !== "review-scores") {
        throw new Error("orchestrator secondary must be review-scores");
      }
      const scoreKinds = new Set(scores.entries.map((e: { entry_kind: string }) => e.entry_kind));
      for (const k of SCORE_KINDS) {
        if (!scoreKinds.has(k)) {
          throw new Error(`review-scores missing ${k}`);
        }
      }
      const skillMan = JSON.parse(
        await fs.readFile(path.join(root, "skills/review-orchestrator/manifest.json"), "utf8"),
      );
      const outs = skillMan.outputs ?? [];
      if (!outs.some((o: { artifact_type: string }) => o.artifact_type === "review-scores")) {
        throw new Error("orchestrator skill must declare review-scores output");
      }
    }

    if (id === "final-decision-board") {
      const kinds = new Set(payload.entries.map((e: { entry_kind: string }) => e.entry_kind));
      for (const k of DECISION_KINDS) {
        if (!kinds.has(k)) {
          throw new Error(`governance-decision missing ${k}`);
        }
      }
      for (const entry of payload.entries) {
        if (
          !entry.folder_mirror?.match(
            /^(decisions|recommendations|improvements|governance)\/final-decision-board\//,
          )
        ) {
          throw new Error("decision folder_mirror partition invalid");
        }
      }
      const goNoGo = payload.entries.find(
        (e: { entry_kind: string }) => e.entry_kind === "go-no-go",
      );
      if (!goNoGo?.finding?.includes("NO-GO")) {
        throw new Error("go-no-go gold sample must demonstrate NO-GO path");
      }
    }

    if (id === "product-reviewer") {
      const hasCritical = payload.entries.some(
        (e: { entry_kind: string; severity: string }) =>
          e.entry_kind === "missing-product-features" && e.severity === "critical",
      );
      if (!hasCritical) {
        throw new Error("product-reviewer must include critical gold example");
      }
    }

    const skillMd = await fs.readFile(path.join(root, "skills", id, "SKILL.md"), "utf8");
    for (const section of ["## Ownership", "## Heuristics", "### Rule catalog", "## Done when"]) {
      if (!skillMd.includes(section)) {
        throw new Error(`SKILL.md missing ${section} for ${id}`);
      }
    }

    const skillMan = JSON.parse(
      await fs.readFile(path.join(root, "skills", id, "manifest.json"), "utf8"),
    );
    if (
      typeof skillMan.description !== "string" ||
      skillMan.description.startsWith("pipelines/ Never")
    ) {
      throw new Error(`skill manifest description corrupt for ${id}`);
    }
    if (SKILL_INPUTS[id]) {
      const types = new Set(
        (skillMan.inputs ?? []).map((i: { artifact_type: string }) => i.artifact_type),
      );
      for (const t of SKILL_INPUTS[id]) {
        if (!types.has(t)) {
          throw new Error(`skill ${id} missing input type ${t}`);
        }
      }
    }
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        version,
        pipelineId: result.pipeline.id,
        workerCount: result.workerCount,
        validatorVersion: "0.3.0",
        note: "Registration validated; Core does not invoke workers; reviews not executed",
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
