/**
 * Product RE pipeline registration smoke (no worker invocation).
 * Run: npm run aios:product-re:smoke
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { createAiosCore } from "../index";

const SOFT_INPUT_TYPES: Record<string, string> = {
  docs: "doc-source",
  app: "app-surface",
  "discovery-report": "discovery-report",
};

const FOLDER_INPUT_TYPES: Record<string, string> = {
  knowledge: "knowledge-notes",
  features: "feature-inventory",
  business: "business-rules",
  "product-architecture": "product-architecture-notes",
  product: "product-model",
  workflow: "workflow-model",
  requirements: "requirement-spec",
  acceptance: "acceptance-criteria",
  gaps: "product-re-gap",
};

async function main() {
  const root = path.resolve(process.cwd(), "ai-os");
  const core = createAiosCore({ aiosRoot: root });

  const result = await core.knowledge.validateProductRePipelineRegistration();
  if (result.workerCount !== 9) {
    throw new Error(`Expected 9 product-re workers, got ${result.workerCount}`);
  }
  if (result.pipeline.allows_feature_workers) {
    throw new Error("Feature workers must be forbidden");
  }
  if (result.pipeline.waves.length !== 6) {
    throw new Error(`Expected 6 waves, got ${result.pipeline.waves.length}`);
  }
  if (result.graph.edges.length !== 21) {
    throw new Error(`Expected 21 graph edges, got ${result.graph.edges.length}`);
  }

  for (const rel of [
    "schemas/product-re-payload.schema.json",
    "schemas/product-model.schema.json",
    "schemas/workflow-model.schema.json",
    "schemas/requirement-spec.schema.json",
    "schemas/acceptance-criteria.schema.json",
    "schemas/product-re-ingest.schema.json",
    "schemas/product-re-gap.schema.json",
    "product-architecture/README.md",
    "gaps/README.md",
    "contracts/pipeline.md",
    "contracts/worker-port.md",
  ]) {
    await fs.access(path.join(root, rel));
  }

  // Soft-input artifact types registered
  for (const typeId of ["doc-source", "app-surface", "discovery-report"]) {
    if (!(await core.knowledge.hasArtifactType(typeId))) {
      throw new Error(`Missing artifact type ${typeId}`);
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
    if (!Array.isArray(payload.entries) || payload.entries.length < 1) {
      throw new Error(`sample-primary-payload entries empty for ${id}`);
    }
    for (const entry of payload.entries) {
      if (!Array.isArray(entry.source_paths) || entry.source_paths.length < 1) {
        throw new Error(`entry missing source_paths for ${id}`);
      }
      for (const sp of entry.source_paths) {
        if (
          typeof sp === "string" &&
          (sp === "architecture" ||
            sp === "architecture/" ||
            sp.startsWith("architecture/") ||
            sp.includes("ai-os/architecture"))
        ) {
          throw new Error(
            `sample payload for ${id} cites architecture/ as product source: ${sp}`,
          );
        }
      }
    }

    if (id === "product-analyst") {
      const kinds = new Set(
        payload.entries.map((e: { entry_kind?: string }) => e.entry_kind),
      );
      if (!kinds.has("value-prop")) {
        throw new Error("product-analyst sample missing value-prop entry_kind");
      }
    }

    const skillManifest = JSON.parse(
      await fs.readFile(
        path.join(root, "skills", id, "manifest.json"),
        "utf8",
      ),
    );
    const inputs = skillManifest.inputs ?? [];
    const inputNames = inputs.map((i: { name: string }) => i.name);
    if (!inputNames.includes("goal")) {
      throw new Error(`skill ${id} missing goal input`);
    }
    if (inputNames.length < 2) {
      throw new Error(
        `skill ${id} still goal-only; expected consume inputs aligned with worker`,
      );
    }

    for (const input of inputs as Array<{
      name: string;
      artifact_type: string;
    }>) {
      if (input.name === "goal") {
        if (input.artifact_type !== "goal") {
          throw new Error(`skill ${id} goal input must be artifact_type goal`);
        }
        continue;
      }
      if (input.artifact_type === "goal") {
        throw new Error(
          `skill ${id} input "${input.name}" must not use artifact_type goal`,
        );
      }
      const expectedSoft = SOFT_INPUT_TYPES[input.name];
      if (expectedSoft && input.artifact_type !== expectedSoft) {
        throw new Error(
          `skill ${id} soft input "${input.name}" expected ${expectedSoft}, got ${input.artifact_type}`,
        );
      }
      const expectedFolder = FOLDER_INPUT_TYPES[input.name];
      if (expectedFolder && input.artifact_type !== expectedFolder) {
        throw new Error(
          `skill ${id} folder input "${input.name}" expected ${expectedFolder}, got ${input.artifact_type}`,
        );
      }
    }

    const skillMd = await fs.readFile(
      path.join(root, "skills", id, "SKILL.md"),
      "utf8",
    );
    for (const section of ["## Ownership", "## Procedure", "## Done when", "## Negative examples"]) {
      if (!skillMd.includes(section)) {
        throw new Error(`skill ${id} SKILL.md missing ${section}`);
      }
    }
  }

  // Domain fixtures present
  for (const rel of [
    "knowledge/examples/household-glossary.json",
    "features/examples/jar-review-queue.json",
    "business/examples/jar-intent-rules.json",
    "product-architecture/examples/domain-pillars.json",
    "product/examples/household-product-model.json",
    "workflow/examples/expense-to-jar-workflow.json",
    "requirements/examples/household-requirements.json",
    "acceptance/examples/household-acceptance.json",
    "gaps/examples/coverage-gaps.json",
  ]) {
    await fs.access(path.join(root, rel));
  }

  // No Feature Worker packages
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
