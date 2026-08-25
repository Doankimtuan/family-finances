import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";

const MIGRATION_DIRECTORY = resolve("supabase/migrations");
const MANIFEST_PATH = resolve(
  ".agents/reports/v1-baseline-migration-manifest.json",
);
const MIGRATION_FILE_PATTERN = /^(\d{14})_[a-z0-9][a-z0-9_-]*\.sql$/;
const BASELINE_FILE_PATTERN = /^(\d{14})_v1_baseline\.sql$/;

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

function hashFile(file) {
  return createHash("sha256")
    .update(readFileSync(resolve(MIGRATION_DIRECTORY, file)))
    .digest("hex");
}

function git(args) {
  return execFileSync("git", args, { encoding: "utf8" }).trim();
}

function assertOrdered(files) {
  const versions = files.map(versionOf);
  if (new Set(versions).size !== versions.length) {
    throw new Error("Duplicate migration versions");
  }
  if (
    versions.some((version, index) => version !== [...versions].sort()[index])
  ) {
    throw new Error("Migration files are not ordered by version");
  }
}

function baselineFromFiles(files) {
  const baselines = files.filter((file) => BASELINE_FILE_PATTERN.test(file));
  if (baselines.length !== 1) {
    throw new Error(
      `Expected exactly one V1 baseline migration; found ${baselines.length}`,
    );
  }
  return { filename: baselines[0], version: versionOf(baselines[0]) };
}

function writeManifest() {
  const files = migrationFiles();
  assertOrdered(files);
  const baseline = baselineFromFiles(files);
  const manifest = {
    schemaVersion: 1,
    sourceCommit: git(["rev-parse", "HEAD"]),
    baseline: {
      ...baseline,
      checksumSha256: hashFile(baseline.filename),
    },
    policy: "one frozen V1 baseline; future migrations are forward-only",
  };
  writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);
  process.stdout.write(`Wrote migration manifest: ${MANIFEST_PATH}\n`);
}

function validateManifest() {
  if (!existsSync(MANIFEST_PATH)) {
    throw new Error(`Missing migration manifest: ${MANIFEST_PATH}`);
  }
  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
  const files = migrationFiles();
  assertOrdered(files);
  const baseline = baselineFromFiles(files);
  if (
    manifest.schemaVersion !== 1 ||
    manifest.baseline?.filename !== baseline.filename ||
    manifest.baseline?.version !== baseline.version
  ) {
    throw new Error("V1 baseline manifest does not match the repository");
  }
  if (hashFile(baseline.filename) !== manifest.baseline.checksumSha256) {
    throw new Error(
      `Frozen V1 baseline checksum changed: ${baseline.filename}`,
    );
  }
  const historical = files.filter((file) => versionOf(file) < baseline.version);
  if (historical.length) {
    throw new Error(
      `Historical migrations remain before the V1 baseline: ${historical.join(", ")}`,
    );
  }
  process.stdout.write(
    `Migration freeze valid: baseline ${baseline.filename}; forward migrations ${files.length - 1}\n`,
  );
}

if (process.argv.includes("--write")) writeManifest();
else validateManifest();
