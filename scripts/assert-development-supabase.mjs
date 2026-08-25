import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const EXPECTED_PROJECT_REF = "bbzffxvgocjwsdbujvgn";
const EXPECTED_PROJECT_NAME = "family-finances-2";
const EXPECTED_PROJECT_REGION = "ap-southeast-2";
const EXPECTED_SUPABASE_HOST = `${EXPECTED_PROJECT_REF}.supabase.co`;
const CONFIRMATION_FLAG = "--confirm-development";
const REGION_FLAG = "--verified-region";

const args = new Set(process.argv.slice(2));
const regionIndex = process.argv.indexOf(REGION_FLAG);
const verifiedRegion =
  regionIndex === -1 ? undefined : process.argv[regionIndex + 1];

if (
  !args.has(CONFIRMATION_FLAG) ||
  verifiedRegion !== EXPECTED_PROJECT_REGION
) {
  throw new Error(
    `Refusing destructive operation. Usage: node scripts/assert-development-supabase.mjs ${CONFIRMATION_FLAG} ${REGION_FLAG} ${EXPECTED_PROJECT_REGION}`,
  );
}

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const linkedProjectPath = resolve(
  repositoryRoot,
  "supabase/.temp/linked-project.json",
);
const linkedProject = JSON.parse(readFileSync(linkedProjectPath, "utf8"));

if (
  linkedProject.ref !== EXPECTED_PROJECT_REF ||
  linkedProject.name !== EXPECTED_PROJECT_NAME
) {
  throw new Error(
    "Refusing destructive operation: linked Supabase project identity does not match development.",
  );
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!supabaseUrl || new URL(supabaseUrl).host !== EXPECTED_SUPABASE_HOST) {
  throw new Error(
    "Refusing destructive operation: NEXT_PUBLIC_SUPABASE_URL is not the development project.",
  );
}

const environmentMarkers = [
  process.env.NODE_ENV,
  process.env.APP_ENV,
  process.env.SUPABASE_ENVIRONMENT,
]
  .filter(Boolean)
  .map((value) => value.toLowerCase());
if (environmentMarkers.includes("production")) {
  throw new Error(
    "Refusing destructive operation: a production environment marker is set.",
  );
}

console.error(
  `${EXPECTED_PROJECT_NAME} (${EXPECTED_PROJECT_REF}) ${EXPECTED_PROJECT_REGION}: development guard passed`,
);
