import { execFile as execFileCallback } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { promisify } from "node:util";
import { expect, type Page } from "@playwright/test";

const execFile = promisify(execFileCallback);
const LOCAL_ENV_FILE = ".env.local";

function loadLocalEnv(): void {
  const path = resolve(process.cwd(), LOCAL_ENV_FILE);
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator < 0) continue;
    const key = trimmed.slice(0, separator);
    if (!process.env[key]) process.env[key] = trimmed.slice(separator + 1);
  }
}

loadLocalEnv();

const RELEASE_CREDENTIALS_PATH =
  "output/playwright/release-23d3-credentials.json";

type ReleaseCredentials = {
  admin: {
    email: string;
    password: string;
  };
};

export function assertReleaseEnvironment(): void {
  const missing = [
    ["NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL],
    [
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY",
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    ],
    [
      "SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY",
      process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY,
    ],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);
  if (missing.length > 0) {
    throw new Error(
      `V1 release smoke preflight failed; missing ${missing.join(", ")}`,
    );
  }
}

export async function runReleaseHarness(
  command: "release-23d-setup" | "release-23d-cleanup",
): Promise<void> {
  await execFile("node", ["scripts/ownership-test-harness.mjs", command], {
    cwd: process.cwd(),
    env: process.env,
  });
}

export async function authenticateReleaseAdmin(page: Page): Promise<void> {
  const credentials = JSON.parse(
    readFileSync(resolve(process.cwd(), RELEASE_CREDENTIALS_PATH), "utf8"),
  ) as ReleaseCredentials;
  const identity = credentials.admin;
  await page.goto("/en/login");
  await page.getByLabel("Email").fill(identity.email);
  await page.locator("#login-password").fill(identity.password);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/en\/(home|together)/, { timeout: 20_000 });
}

export async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth,
      ),
    )
    .toBe(true);
}
