/**
 * Capabilities registry smoke (no worker execution).
 * Run: npm run aios:capabilities:smoke
 */
import { promises as fs } from "node:fs";
import path from "node:path";

const REQUIRED_CAPS = [
  "discover",
  "reverse-engineer",
  "architect",
  "specify",
  "validate",
  "review",
  "qualify",
  "runtime",
] as const;

async function main() {
  const root = path.resolve(process.cwd(), "ai-os");
  const version = (await fs.readFile(path.join(root, "VERSION"), "utf8")).trim();
  if (version !== "0.13.0") {
    throw new Error(`Expected VERSION 0.13.0, got ${version}`);
  }

  for (const rel of [
    "docs/capabilities/registry.json",
    "docs/capabilities/README.md",
    "docs/architecture/SIMPLIFIED_ARCHITECTURE.md",
    "docs/architecture/REFACTORING_BOARD_REPORT.md",
    "docs/releases/RELEASE_NOTES_0.13.0.md",
    "runtime/commands/command-registry.json",
    "runtime/configs/.ai-os.yaml",
  ]) {
    await fs.access(path.join(root, rel));
  }

  // Untitled must be gone
  try {
    await fs.access(path.join(root, "Untitled"));
    throw new Error("Untitled/ should have been deleted");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      if ((error as Error).message.includes("should have been deleted")) throw error;
    }
  }

  const registry = JSON.parse(
    await fs.readFile(path.join(root, "docs/capabilities/registry.json"), "utf8"),
  );
  const ids = new Set((registry.capabilities ?? []).map((c: { id: string }) => c.id));
  for (const id of REQUIRED_CAPS) {
    if (!ids.has(id)) throw new Error(`Missing capability ${id}`);
    await fs.access(path.join(root, "docs/capabilities", id, "README.md"));
  }
  if (!registry.optional || registry.optional.id !== "scaffold") {
    throw new Error("optional scaffold capability missing");
  }
  if ((registry.run_full_order ?? []).length !== 6) {
    throw new Error("run_full_order must list 6 capabilities");
  }

  const cmdReg = JSON.parse(
    await fs.readFile(
      path.join(root, "runtime/commands/command-registry.json"),
      "utf8",
    ),
  );
  if (!cmdReg.capability_map?.["@Run full"]?.includes("discover")) {
    throw new Error("@Run full must map to discover capability");
  }
  if (cmdReg.capability_map["@Run full"].includes("scaffold")) {
    throw new Error("@Run full must NOT include optional scaffold");
  }
  for (const cmd of [
    "@Run full",
    "@Run incremental",
    "@Run validate",
    "@Run review",
    "@Run benchmark",
    "@Run resume",
  ]) {
    if (!cmdReg.capability_map?.[cmd]) {
      throw new Error(`capability_map missing ${cmd}`);
    }
  }

  // Duplicate YAML must not remain
  try {
    await fs.access(path.join(root, "core/packages/configs/runtime/.ai-os.yaml"));
    throw new Error("core/packages/configs/runtime/.ai-os.yaml should be deleted");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      if ((error as Error).message.includes("should be deleted")) throw error;
    }
  }

  const agents = await fs.readFile(path.join(root, "AGENTS.md"), "utf8");
  if (!agents.includes("Capability-first") && !agents.includes("capabilities")) {
    throw new Error("AGENTS.md must be capability-first");
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        version,
        capabilities: REQUIRED_CAPS.length,
        optional: "scaffold",
        note: "Capability layer validated; workers not executed; physical merges deferred",
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
