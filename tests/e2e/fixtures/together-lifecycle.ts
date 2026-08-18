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

export const LIFECYCLE_IDENTITIES = {
  admin: {
    email: "OWNERSHIP_TEST_A_EMAIL",
    password: "OWNERSHIP_TEST_A_PASSWORD",
  },
  partner: {
    email: "OWNERSHIP_TEST_B_EMAIL",
    password: "OWNERSHIP_TEST_B_PASSWORD",
  },
} as const;

export function hasLifecycleCredentials(): boolean {
  return Object.values(LIFECYCLE_IDENTITIES).every(({ email, password }) =>
    Boolean(process.env[email] && process.env[password]),
  );
}

export async function runLifecycleHarness(
  command: "setup" | "cleanup",
): Promise<void> {
  await execFile("node", ["scripts/ownership-test-harness.mjs", command], {
    cwd: process.cwd(),
    env: process.env,
  });
}

export async function authenticateLifecycleUser(
  page: Page,
  identity: keyof typeof LIFECYCLE_IDENTITIES,
): Promise<void> {
  const config = LIFECYCLE_IDENTITIES[identity];
  await page.goto("/en/login");
  await page.getByLabel("Email").fill(process.env[config.email] ?? "");
  await page
    .locator("#login-password")
    .fill(process.env[config.password] ?? "");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/en\/(home|together)/, { timeout: 20_000 });
}

export async function openLifecycleMembers(page: Page): Promise<void> {
  await page.goto("/en/together/members");
  await expect(page.getByTestId("together-members-page")).toBeVisible();
}

export async function openLifecycleAccount(page: Page): Promise<void> {
  await page.goto("/en/money/accounts");
  await expect(page.getByText("Ownership former-member account")).toBeVisible();
}
