import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { expect, type Page } from "@playwright/test";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { getE2ECredentials } from "./env";

export const E2E_AUTH_STATE_PATH = resolve(
  process.cwd(),
  "output/playwright/.auth/user.json",
);
export const E2E_AUTH_DEBUG_PATH = resolve(
  process.cwd(),
  "output/playwright/auth-debug",
);

const E2E_LOGIN_PATH = `/en${APP_PATH.LOGIN}`;
const E2E_MONEY_PATH = `/en${APP_PATH.MONEY}`;

export async function ensureE2EAuthDirectories(): Promise<void> {
  await mkdir(dirname(E2E_AUTH_STATE_PATH), { recursive: true });
  await mkdir(E2E_AUTH_DEBUG_PATH, { recursive: true });
}

async function writeAuthDebug(page: Page): Promise<void> {
  await ensureE2EAuthDirectories();
  const visibleErrors = await page.locator('[role="alert"]').allTextContents();
  await page.screenshot({
    path: resolve(E2E_AUTH_DEBUG_PATH, "auth-failure.png"),
    fullPage: true,
  });
  console.error(
    JSON.stringify({
      url: page.url(),
      visibleErrors: visibleErrors.map((error) => error.trim()).filter(Boolean),
    }),
  );
}

export async function authenticateE2EUser(page: Page): Promise<void> {
  const { email, password } = getE2ECredentials();

  try {
    await page.goto(E2E_LOGIN_PATH);
    const emailField = page.getByLabel("Email");
    const loginButton = page.getByRole("button", { name: /log in/i });
    await expect(emailField).toBeVisible({ timeout: 20_000 });
    await emailField.fill(email);
    const passwordField = page.getByRole("textbox", { name: "Password" });
    await passwordField.fill(password);
    await loginButton.click();
    await expect(page).toHaveURL(/\/en\/(home|together\/onboard)(?:\?.*)?$/, {
      timeout: 20_000,
    });

    if (page.url().includes(APP_PATH.ONBOARD)) {
      throw new Error(
        "E2E user authenticated but has no active household; run the controlled fixture setup.",
      );
    }

    await page.goto(E2E_MONEY_PATH, {
      waitUntil: "domcontentloaded",
    });
    await expect(
      page.locator("#app-viewport-root").getByTestId("money-hub"),
    ).toBeVisible({ timeout: 20_000 });
  } catch (error) {
    await writeAuthDebug(page);
    const reason = error instanceof Error ? error.message : "unknown failure";
    throw new Error(
      `E2E authentication failed; debug evidence saved under ${E2E_AUTH_DEBUG_PATH}. ${reason}`,
    );
  }
}
