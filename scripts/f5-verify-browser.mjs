/**
 * Phase F5 authenticated browser verification.
 * Credentials from env only; never logs secrets.
 */
import { chromium, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
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

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    colorScheme: "light",
    locale: "vi-VN",
  });
  const page = await context.newPage();
  const results = [];

  try {
    await login(page);

    await page.goto(`${BASE}/vi/money`);
    await expect(page.getByTestId("money-hub")).toBeVisible({ timeout: 20_000 });
    results.push("cards_overview:ok");

    await page.goto(
      `${BASE}/vi/money/accounts/9173fa37-0894-4659-b557-0df4fbade4b1`,
    );
    await expect(page.getByTestId("money-account-detail")).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByTestId("credit-card-actions")).toBeVisible();
    await expect(page.getByTestId("card-due-lead")).toBeVisible();
    results.push("card_detail_due:ok");

    const settleAmount = page.getByTestId("card-settle-amount");
    if ((await settleAmount.count()) > 0) {
      await page.getByTestId("card-settle-amount").fill("100000");
      await page.getByTestId("card-settle-submit").click();
      await expect(page.getByTestId("card-pay-confirm")).toBeVisible();
      await page.getByTestId("card-settle-confirm").click();
      try {
        await expect(page.getByTestId("transaction-receipt")).toBeVisible({
          timeout: 20_000,
        });
        results.push("card_payment_receipt:ok");
      } catch (err) {
        const alertText = await page
          .locator("[data-testid='card-pay-confirm'], [data-testid='credit-card-actions']")
          .locator("[role='alert'], .text-danger, [data-variant='danger']")
          .allTextContents()
          .catch(() => []);
        const bodySnippet = await page
          .getByTestId("card-pay-confirm")
          .innerText()
          .catch(() => "no-confirm");
        console.error("CARD_PAY_DEBUG", JSON.stringify({ alertText, bodySnippet: bodySnippet.slice(0, 800) }));
        throw err;
      }
    } else {
      results.push("card_payment:skipped_no_cta");
    }

    await page.goto(`${BASE}/vi/money/loans`);
    await expect(page.getByTestId("money-loans")).toBeVisible();
    await expect(page.getByTestId("loans-list")).toBeVisible();
    await expect(page.getByTestId("loan-add-open")).toBeVisible();
    results.push("loans_overview:ok");

    await page.goto(
      `${BASE}/vi/money/loans/7905c227-7cd9-4deb-a93f-cfae0d853966`,
    );
    await expect(page.getByTestId("loan-detail")).toBeVisible();
    await expect(page.getByTestId("loan-summary")).toBeVisible();
    await expect(page.getByTestId("loan-schedule")).toBeVisible();
    await expect(page.getByTestId("loan-pay")).toBeVisible();
    results.push("loan_detail_schedule:ok");

    await page.getByTestId("loan-payoff-estimate-open").click();
    await expect(page.getByTestId("loan-payoff-estimate")).toBeVisible();
    results.push("loan_payoff_estimate:ok");

    await page.getByTestId("loan-payoff-estimate-close").click();
    await page.getByTestId("loan-pay-preview").click();
    await expect(page.getByTestId("loan-pay-confirm")).toBeVisible();
    await page.getByTestId("loan-pay-cta").click();
    await expect(page.getByTestId("transaction-receipt")).toBeVisible({
      timeout: 20_000,
    });
    results.push("loan_payment_receipt:ok");

    await context.close();
    const dark = await browser.newContext({
      viewport: { width: 440, height: 900 },
      colorScheme: "dark",
      locale: "en-US",
    });
    const page2 = await dark.newPage();
    await login(page2);
    await page2.goto(`${BASE}/en/money/loans`);
    await expect(page2.getByTestId("money-loans")).toBeVisible();
    await page2.goto(
      `${BASE}/en/money/accounts/9173fa37-0894-4659-b557-0df4fbade4b1`,
    );
    await expect(page2.getByTestId("credit-card-actions")).toBeVisible();
    results.push("layout_440_en_dark:ok");
    await dark.close();

    console.error("VERDICT_OK");
    for (const line of results) console.error(line);
  } catch (error) {
    console.error("VERDICT_FAIL");
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

main();
