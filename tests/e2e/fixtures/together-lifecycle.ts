import { execFile as execFileCallback } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { promisify } from "node:util";
import { expect, type Page } from "@playwright/test";
import { APP_PATH } from "@/modules/tenancy/application/app-path";

const execFile = promisify(execFileCallback);
const LOCAL_ENV_FILE = ".env.local";
const LIFECYCLE_CREDENTIALS_FILE =
  "output/playwright/together-20a-credentials.json";

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
  admin: "admin",
  partner: "partner",
} as const;

export function hasLifecycleCredentials(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) &&
    (process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY),
  );
}

export async function runLifecycleHarness(
  command:
    | "together-20a-setup"
    | "together-20a-seed-member"
    | "together-20a-assert-active"
    | "together-20a-assert-final"
    | "together-20a-cleanup",
  options: { invitationToken?: string } = {},
): Promise<void> {
  await execFile("node", ["scripts/ownership-test-harness.mjs", command], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      ...(options.invitationToken
        ? { TOGETHER_20A_INVITATION_TOKEN: options.invitationToken }
        : {}),
    },
  });
}

function getLifecycleCredentials(): Record<
  keyof typeof LIFECYCLE_IDENTITIES,
  { email: string; password: string }
> {
  if (!existsSync(resolve(process.cwd(), LIFECYCLE_CREDENTIALS_FILE))) {
    throw new Error("20A disposable credentials were not provisioned");
  }
  const credentials = JSON.parse(
    readFileSync(resolve(process.cwd(), LIFECYCLE_CREDENTIALS_FILE), "utf8"),
  ) as Record<string, { email?: unknown; password?: unknown }>;
  const result = {} as Record<
    keyof typeof LIFECYCLE_IDENTITIES,
    { email: string; password: string }
  >;
  for (const identity of Object.values(LIFECYCLE_IDENTITIES)) {
    const credential = credentials[identity];
    if (
      typeof credential?.email !== "string" ||
      typeof credential.password !== "string"
    ) {
      throw new Error(`Invalid 20A credentials for ${identity}`);
    }
    result[identity] = {
      email: credential.email,
      password: credential.password,
    };
  }
  return result;
}

export function lifecycleIdentityEmail(
  identity: keyof typeof LIFECYCLE_IDENTITIES,
): string {
  return getLifecycleCredentials()[LIFECYCLE_IDENTITIES[identity]].email;
}

export async function authenticateLifecycleUser(
  page: Page,
  identity: keyof typeof LIFECYCLE_IDENTITIES,
): Promise<void> {
  const config = getLifecycleCredentials()[LIFECYCLE_IDENTITIES[identity]];
  await page.goto("/en/login");
  await page.getByLabel("Email").fill(config.email);
  await page.locator("#login-password").fill(config.password);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/en\/(home|together)/, { timeout: 20_000 });
}

export async function openLifecycleMembers(
  page: Page,
  locale: "en" | "vi" = "en",
): Promise<void> {
  await page.goto(`/${locale}/together/members`);
  await expect(
    page.locator("#app-viewport-root").getByTestId("together-members-page"),
  ).toBeVisible();
}

export async function openLifecycleAccount(page: Page): Promise<void> {
  await page.goto(`/en${APP_PATH.MONEY}`);
  const surface = page.locator("#app-viewport-root");
  const showAll = surface.getByTestId("money-accounts-show-all");
  if (await showAll.isVisible()) await showAll.click();
  await expect(
    surface
      .getByTestId("money-hub-account-row")
      .filter({ hasText: "Ownership former-member account" }),
  ).toBeVisible();
}
