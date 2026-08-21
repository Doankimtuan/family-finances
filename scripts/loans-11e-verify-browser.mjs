/** Authenticated browser gate for the disposable Loans 11E fixture. */

import { chromium } from "@playwright/test";
import nextEnv from "@next/env";
import { readFile } from "node:fs/promises";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const email = process.env.E2E_USER_EMAIL;
const password = process.env.E2E_USER_PASSWORD;
const fixture = JSON.parse(
  await readFile("output/playwright/loans-11e-fixture.json", "utf8"),
);
const mask = "••••••";

if (!email || !password || !fixture.loanId) {
  throw new Error("E2E credentials or Loan fixture state is missing");
}

const browser = await chromium.launch({ headless: true });
const consoleErrors = [];

async function login(page) {
  await page.goto(`${baseUrl}/en/login`);
  await page.getByLabel("Email").fill(email);
  await page.locator("#login-password").fill(password);
  await page.getByRole("button", { name: /log in/i }).click();
  await page.waitForURL(/\/en\/(home|together\/onboard)/, { timeout: 30_000 });
  if (page.url().includes("/together/onboard")) {
    throw new Error("E2E identity has no active household");
  }
}

async function newPage({ width, height, locale, colorScheme }) {
  const context = await browser.newContext({
    viewport: { width, height },
    colorScheme,
    locale: locale === "vi" ? "vi-VN" : "en-US",
  });
  const page = await context.newPage();
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));
  await login(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  return { context, page };
}

async function visit(page, path) {
  await page.goto(`${baseUrl}/${path}`);
  await page.getByTestId("loan-detail").waitFor({ state: "visible" });
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth,
  );
  if (overflow) throw new Error(`Horizontal overflow at ${path}`);
  if ((await page.locator("body").innerText()).match(/money\.[A-Za-z]/)) {
    throw new Error(`Raw translation key at ${path}`);
  }
}

const first = await newPage({
  width: 390,
  height: 844,
  locale: "vi",
  colorScheme: "light",
});
const firstPath = `vi/money/loans/${fixture.loanId}`;
await visit(first.page, firstPath);
await first.page.getByTestId("loan-summary").waitFor();
if (!(await first.page.getByText("Quá hạn").count())) {
  throw new Error(
    `Overdue state is not visible in VI detail: ${(await first.page.locator("body").innerText()).slice(0, 1200)}`,
  );
}
await first.page.getByTestId("loan-pay-open").click();
await first.page.getByTestId("loan-pay-account").waitFor();
if (!(await first.page.getByText("Tiền mặt").count())) {
  throw new Error("VI system account name was not localized");
}
await first.page.getByTestId("loan-pay-preview").click();
await first.page.getByTestId("loan-pay-confirm").waitFor();
await first.page.getByTestId("loan-pay-cta").click();
await first.page
  .getByTestId("transaction-receipt")
  .waitFor({ timeout: 30_000 });
if (!(await first.page.getByText("Tiền mặt").count())) {
  throw new Error("VI receipt account name was not localized");
}

await first.page.goto(`${baseUrl}/${firstPath}?view=history`);
await first.page.getByTestId("loan-payment-history").waitFor();
await first.page.getByTestId("loan-rate-history").waitFor();
await first.context.close();

const second = await newPage({
  width: 440,
  height: 900,
  locale: "en",
  colorScheme: "dark",
});
const secondPath = `en/money/loans/${fixture.loanId}`;
await visit(second.page, `${secondPath}?view=schedule`);
const visibleScheduleEntries = await second.page
  .locator("[data-testid^='loan-schedule-']")
  .count();
if (visibleScheduleEntries === 0 || visibleScheduleEntries > 4) {
  throw new Error(
    `Unexpected initial schedule entry count: ${visibleScheduleEntries}`,
  );
}
await second.page.goto(`${baseUrl}/en/money/loans/${fixture.loanId}/schedule`);
await second.page.getByTestId("loan-full-schedule").waitFor();
const yearLinks = await second.page
  .locator("[data-testid='loan-full-schedule'] nav a")
  .evaluateAll((links) => links.map((link) => link.href));
let fullScheduleEntries = 0;
for (const yearLink of yearLinks) {
  await second.page.goto(yearLink);
  fullScheduleEntries += await second.page
    .locator("[data-testid^='loan-schedule-']")
    .count();
}
if (fullScheduleEntries < 24) {
  throw new Error(`Full schedule is not populated: ${fullScheduleEntries}`);
}
await second.context.close();

for (const width of [768, 1280]) {
  const check = await newPage({
    width,
    height: 900,
    locale: "en",
    colorScheme: "light",
  });
  await visit(check.page, `${secondPath}?view=history`);
  await check.context.close();
}

const privacy = await newPage({
  width: 390,
  height: 844,
  locale: "vi",
  colorScheme: "dark",
});
await privacy.page.addInitScript(() => {
  window.localStorage.setItem("vinha.financial-values-hidden", "true");
});
await visit(privacy.page, firstPath);
if ((await privacy.page.getByText(mask, { exact: true }).count()) === 0) {
  throw new Error("Privacy ON did not mask Loan amounts");
}
await privacy.page.addInitScript(() => {
  window.localStorage.setItem("vinha.financial-values-hidden", "false");
});
await privacy.page.reload();
if ((await privacy.page.getByText(mask, { exact: true }).count()) > 0) {
  throw new Error("Privacy OFF left Loan amounts masked");
}
await privacy.context.setOffline(true);
await privacy.page.waitForTimeout(100);
if (!(await privacy.page.getByTestId("loan-pay-open").isDisabled())) {
  throw new Error("Offline Loan read-only action remained enabled");
}
await privacy.context.close();

if (consoleErrors.length > 0) {
  throw new Error(`Browser console errors: ${consoleErrors.join(" | ")}`);
}
console.error(
  JSON.stringify({
    status: "passed",
    viewports: [390, 440, 768, 1280],
    locales: ["vi", "en"],
    themes: ["light", "dark"],
    reducedMotion: true,
    privacy: ["on", "off"],
  }),
);
await browser.close();
