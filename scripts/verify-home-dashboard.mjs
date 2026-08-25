import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const baseURL = process.env.HOME_VERIFY_BASE_URL ?? "http://localhost:3101";
const email = process.env.E2E_USER_EMAIL;
const password = process.env.E2E_USER_PASSWORD;

if (!email || !password) {
  throw new Error("E2E_USER_EMAIL and E2E_USER_PASSWORD are required");
}

const cases = [
  {
    name: "home-dashboard-390-vi-light",
    width: 390,
    locale: "vi",
    theme: "light",
  },
  {
    name: "home-dashboard-440-en-dark",
    width: 440,
    locale: "en",
    theme: "dark",
  },
  {
    name: "home-dashboard-768-en-light",
    width: 768,
    locale: "en",
    theme: "light",
  },
  {
    name: "home-dashboard-1280-vi-dark",
    width: 1280,
    locale: "vi",
    theme: "dark",
  },
];

mkdirSync("screenshots", { recursive: true });
const browser = await chromium.launch({ headless: true });
const results = [];

for (const config of cases) {
  const context = await browser.newContext({
    viewport: { width: config.width, height: 900 },
    colorScheme: config.theme,
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  await page.addInitScript((theme) => {
    localStorage.setItem("vinha-theme", theme);
  }, config.theme);

  await page.goto(`${baseURL}/${config.locale}/login`, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForTimeout(750);
  await page.getByLabel("Email").fill(email);
  await page.locator("#login-password").fill(password);
  const loginButton = page.getByRole("button", { name: /log in|đăng nhập/i });
  await page.waitForFunction(
    () =>
      Array.from(document.querySelectorAll("button")).some(
        (button) =>
          /log in|đăng nhập/i.test(button.textContent ?? "") &&
          !button.hasAttribute("disabled"),
      ),
    undefined,
    { timeout: 20_000 },
  );
  await Promise.all([
    page.waitForURL(new RegExp(`/${config.locale}/(?:home|together/onboard)`), {
      timeout: 30_000,
    }),
    loginButton.click(),
  ]);
  if (page.url().includes("together/onboard")) {
    throw new Error("Authenticated verification account has no household");
  }

  await page.goto(`${baseURL}/${config.locale}/home`, {
    waitUntil: "networkidle",
  });
  await page.getByTestId("home-financial-pulse").waitFor({ timeout: 20_000 });
  await page.screenshot({
    path: `screenshots/${config.name}.png`,
    fullPage: true,
  });

  const shellWidth = await page
    .locator("#app-viewport-root")
    .evaluate((element) => Math.round(element.getBoundingClientRect().width));
  const dashboardState = {
    cashFlow: await page.getByTestId("home-cash-flow").count(),
    spending: await page.getByTestId("home-spending").count(),
    plan: await page.getByTestId("home-plan-pulse").count(),
    inbox: await page.getByTestId("home-inbox-block").count(),
  };
  results.push({ ...config, shellWidth, dashboardState });
  await context.close();
}

await browser.close();
writeFileSync(
  "screenshots/home-dashboard-verification.json",
  `${JSON.stringify(results, null, 2)}\n`,
);
