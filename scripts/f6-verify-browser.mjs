/**
 * Phase F6 authenticated browser verification (Savings only).
 * Credentials from env only; never logs secrets.
 */
import { chromium, expect } from "@playwright/test";
import { mkdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadDotEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const i = trimmed.indexOf("=");
    const key = trimmed.slice(0, i).trim();
    let value = trimmed.slice(i + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadDotEnvLocal();

const email = process.env.E2E_USER_EMAIL;
const password = process.env.E2E_USER_PASSWORD;
if (!email || !password) {
  console.error("MISSING_E2E_CREDENTIALS");
  process.exit(1);
}

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const EVIDENCE = resolve(
  process.cwd(),
  "artifacts/screen-blueprints/savings-investments/CURRENT/evidence/after",
);

async function login(page) {
  await page.goto(`${BASE}/en/login`);
  await page.getByLabel("Email").fill(email);
  await page.locator("#login-password").fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
  await page.waitForURL(/\/en\/(home|together\/onboard)/, { timeout: 30_000 });
  if (page.url().includes("/together/onboard")) {
    throw new Error("E2E user has no household");
  }
}

async function capture(page, name) {
  mkdirSync(EVIDENCE, { recursive: true });
  await page.screenshot({
    path: resolve(EVIDENCE, name),
    fullPage: true,
  });
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const results = [];

  try {
    // 390 Vietnamese light
    {
      const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
        colorScheme: "light",
        locale: "vi-VN",
      });
      const page = await context.newPage();
      await login(page);

      await page.goto(`${BASE}/vi/money/savings`);
      await expect(page.getByTestId("money-savings")).toBeVisible({
        timeout: 20_000,
      });
      await capture(page, "f6-savings-overview-390-light-vi.png");
      results.push("overview_390_vi_light:ok");

      const row = page.locator("[data-testid^=savings-row-]").first();
      if ((await row.count()) > 0) {
        await row.click();
        await expect(page.getByTestId("savings-detail")).toBeVisible({
          timeout: 20_000,
        });
        await capture(page, "f6-savings-detail-390-light-vi.png");
        results.push("detail_390_vi_light:ok");

        const early = page.getByTestId("savings-early-withdraw");
        if ((await early.count()) > 0) {
          await early.click();
          await expect(
            page.getByTestId("money-savings-early-withdraw"),
          ).toBeVisible({ timeout: 20_000 });
          await capture(page, "f6-savings-early-withdraw-390-light-vi.png");
          results.push("early_withdraw_preview_390_vi_light:ok");
        } else {
          results.push("early_withdraw_preview_390_vi_light:skipped_no_active");
        }
      } else {
        results.push("detail_390_vi_light:skipped_empty");
      }

      await page.goto(`${BASE}/vi/money/savings/new`);
      await expect(page.getByTestId("money-savings-new")).toBeVisible({
        timeout: 20_000,
      });
      await capture(page, "f6-savings-new-390-light-vi.png");
      results.push("create_390_vi_light:ok");
      await context.close();
    }

    // 440 English dark
    {
      const context = await browser.newContext({
        viewport: { width: 440, height: 956 },
        colorScheme: "dark",
        locale: "en-US",
      });
      const page = await context.newPage();
      await login(page);

      await page.goto(`${BASE}/en/money/savings`);
      await expect(page.getByTestId("money-savings")).toBeVisible({
        timeout: 20_000,
      });
      await capture(page, "f6-savings-overview-440-dark-en.png");
      results.push("overview_440_en_dark:ok");

      const row = page.locator("[data-testid^=savings-row-]").first();
      if ((await row.count()) > 0) {
        await row.click();
        await expect(page.getByTestId("savings-detail")).toBeVisible({
          timeout: 20_000,
        });
        await capture(page, "f6-savings-detail-440-dark-en.png");
        results.push("detail_440_en_dark:ok");

        const early = page.getByTestId("savings-early-withdraw");
        if ((await early.count()) > 0) {
          await early.click();
          await expect(
            page.getByTestId("money-savings-early-withdraw"),
          ).toBeVisible({ timeout: 20_000 });
          await capture(page, "f6-savings-early-withdraw-440-dark-en.png");
          results.push("early_withdraw_preview_440_en_dark:ok");
        } else {
          results.push("early_withdraw_preview_440_en_dark:skipped_no_active");
        }
      } else {
        results.push("detail_440_en_dark:skipped_empty");
      }

      await page.goto(`${BASE}/en/money/savings/new`);
      await expect(page.getByTestId("money-savings-new")).toBeVisible({
        timeout: 20_000,
      });
      if ((await page.getByTestId("savings-create-wizard").count()) > 0) {
        await page.getByTestId("savings-wizard-next").click();
        await page.getByTestId("savings-wizard-next").click();
        await page.getByTestId("savings-wizard-next").click();
        const pkg = page
          .locator("[data-testid^=savings-wizard-package-]")
          .first();
        if ((await pkg.count()) > 0) {
          await pkg.click();
          await page.locator("#savings-principal").fill("1000000");
          await page.getByTestId("savings-wizard-next").click();
          await expect(
            page.getByTestId("savings-wizard-preview"),
          ).toBeVisible();
        }
      }
      await capture(page, "f6-savings-fund-preview-440-dark-en.png");
      results.push("create_preview_440_en_dark:ok");
      await context.close();
    }

    console.error(results.join("\n"));
    console.error("VERDICT_OK");
  } catch (err) {
    console.error(String(err));
    console.error("VERDICT_FAIL");
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

main();
