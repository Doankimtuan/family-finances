import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const MIGRATION_DIRECTORY = resolve("supabase/migrations");
const MANIFEST_PATH = resolve(
  ".agents/reports/production-foundation-22b-migration-manifest.json",
);
const MIGRATION_FILE_PATTERN = /^(\d{14})_[a-z0-9][a-z0-9_-]*\.sql$/;

function git(args) {
  return execFileSync("git", args, { encoding: "utf8" }).trim();
}

function log(message) {
  process.stdout.write(`${message}\n`);
}

function hashFile(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function migrationFiles() {
  return readdirSync(MIGRATION_DIRECTORY)
    .filter((file) => file.endsWith(".sql"))
    .sort((left, right) => left.localeCompare(right));
}

function versionOf(file) {
  const match = MIGRATION_FILE_PATTERN.exec(file);
  if (!match) throw new Error(`Invalid migration filename: ${file}`);
  return match[1];
}

function gitStatus(file) {
  const status = git([
    "status",
    "--short",
    "--untracked-files=all",
    "--",
    `supabase/migrations/${file}`,
  ]);
  if (!status) return "tracked-clean";
  if (status.startsWith("??")) return "untracked";
  if (status.includes("D")) return "deleted";
  return "tracked-modified";
}

function assertUniqueAndOrdered(files) {
  const versions = files.map(versionOf);
  const duplicates = versions.filter(
    (version, index) => versions.indexOf(version) !== index,
  );
  if (duplicates.length) {
    throw new Error(
      `Duplicate migration versions: ${[...new Set(duplicates)].join(", ")}`,
    );
  }
  const ordered = [...versions].sort();
  if (versions.some((version, index) => version !== ordered[index])) {
    throw new Error(
      "Migration files are not ordered by their version prefixes",
    );
  }
}

function buildManifest(appliedThrough) {
  const files = migrationFiles();
  assertUniqueAndOrdered(files);
  const migrations = files
    .filter((file) => versionOf(file) <= appliedThrough)
    .map((file) => {
      const status = gitStatus(file);
      return {
        version: versionOf(file),
        filename: file,
        gitStatus: status,
        appliedRemotely: true,
        checksumSha256: hashFile(resolve(MIGRATION_DIRECTORY, file)),
        classification:
          status === "untracked"
            ? "E"
            : status === "tracked-modified"
              ? "C"
              : "A",
        actionRequired:
          status === "untracked"
            ? "Add to the release commit as a forward migration"
            : status === "tracked-modified"
              ? "Review and recover or explicitly approve before release; do not edit after freeze"
              : "Freeze content and retain as applied release source",
      };
    });

  return {
    schemaHead: appliedThrough,
    sourceCommit: git(["rev-parse", "HEAD"]),
    migrations,
  };
}

function validateManifest() {
  if (!existsSync(MANIFEST_PATH)) {
    throw new Error(`Missing migration manifest: ${MANIFEST_PATH}`);
  }
  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
  const files = migrationFiles();
  assertUniqueAndOrdered(files);
  const entries = manifest.migrations;
  if (!Array.isArray(entries) || entries.length === 0) {
    throw new Error("Migration manifest has no entries");
  }

  const manifestVersions = entries.map((entry) => entry.version);
  if (new Set(manifestVersions).size !== manifestVersions.length) {
    throw new Error("Migration manifest contains duplicate versions");
  }
  if (
    manifestVersions.some(
      (version, index) => version !== [...manifestVersions].sort()[index],
    )
  ) {
    throw new Error("Migration manifest is not ordered by version");
  }

  for (const entry of entries) {
    const path = resolve(MIGRATION_DIRECTORY, entry.filename);
    if (!existsSync(path))
      throw new Error(`Frozen migration is missing: ${entry.filename}`);
    if (hashFile(path) !== entry.checksumSha256) {
      throw new Error(`Frozen migration checksum changed: ${entry.filename}`);
    }
  }

  const frozenFiles = new Set(entries.map((entry) => entry.filename));
  const unexpected = files.filter((file) => !frozenFiles.has(file));
  const stale = unexpected.filter(
    (file) => versionOf(file) <= manifest.schemaHead,
  );
  if (stale.length) {
    throw new Error(
      `Unfrozen migration at or before schema head: ${stale.join(", ")}`,
    );
  }
  if (unexpected.length) {
    log(`Allowed forward migrations: ${unexpected.join(", ")}`);
  }
  log(
    `Migration freeze valid: ${entries.length} frozen migrations; head ${manifest.schemaHead}`,
  );
}

if (process.argv.includes("--write")) {
  const appliedThrough =
    process.argv[process.argv.indexOf("--applied-through") + 1];
  if (!/^\d{14}$/.test(appliedThrough ?? "")) {
    throw new Error("--write requires --applied-through YYYYMMDDHHMMSS");
  }
  writeFileSync(
    MANIFEST_PATH,
    `${JSON.stringify(buildManifest(appliedThrough), null, 2)}\n`,
  );
  log(`Wrote migration manifest: ${MANIFEST_PATH}`);
} else {
  validateManifest();
}
