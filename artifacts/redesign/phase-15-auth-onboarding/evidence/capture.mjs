import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pkg from "@next/env";
import { chromium } from "playwright";

const { loadEnvConfig } = pkg;
const root = join(dirname(fileURLToPath(import.meta.url)), "../../../..");
loadEnvConfig(root);

const baseURL = process.env.PHASE15_BASE_URL ?? "http://127.0.0.1:3000";
const outDir = dirname(fileURLToPath(import.meta.url));
mkdirSync(outDir, { recursive: true });

const notes = {
  baseURL,
  startedAt: new Date().toISOString(),
  auth: "unauthenticated-playwright-context",
  routes: {},
  viewports: {},
  themes: {},
  interactions: {},
  limitations: [],
};

function shot(name) {
  return join(outDir, name);
}

async function shellMetrics(page) {
  return page.evaluate(() => {
    const shell = document.querySelector("#app-viewport-root");
    return {
      innerWidth: window.innerWidth,
      shellWidth: shell instanceof HTMLElement ? shell.offsetWidth : null,
    };
  });
}

const browser = await chromium.launch({ headless: true });

async function capturePage(page, path, testId, fileName) {
  await page.goto(`${baseURL}${path}`, {
    waitUntil: "domcontentloaded",
    timeout: 30_000,
  });
  await page.waitForTimeout(600);
  const visible = testId
    ? await page
        .getByTestId(testId)
        .isVisible()
        .catch(() => false)
    : false;
  const metrics = await shellMetrics(page);
  notes.routes[path] = {
    url: page.url(),
    visible,
    testId,
    ...metrics,
  };
  await page.screenshot({ path: shot(fileName), fullPage: true });
  return visible;
}

try {
  const light = await browser.newContext({
    viewport: { width: 440, height: 844 },
    colorScheme: "light",
  });
  const page = await light.newPage();

  await capturePage(page, "/en/welcome", "auth-welcome", "welcome-440-light.png");
  await capturePage(page, "/en/login", "auth-login", "login-440-light.png");
  await capturePage(
    page,
    "/en/register",
    "auth-register",
    "register-440-light.png",
  );
  await capturePage(
    page,
    "/en/forgot-password",
    "auth-forgot-password",
    "forgot-440-light.png",
  );
  await capturePage(
    page,
    "/en/reset-password",
    "auth-reset-password",
    "reset-440-light.png",
  );
  await capturePage(
    page,
    "/en/auth/confirm",
    "auth-confirm",
    "confirm-440-light.png",
  );
  await capturePage(
    page,
    "/en/invite/not-a-valid-uuid",
    "invite-accept",
    "invite-invalid-440-light.png",
  );

  await page.goto(`${baseURL}/en/login`, {
    waitUntil: "domcontentloaded",
    timeout: 30_000,
  });
  const loginSubmit = page.getByRole("button", { name: /^log in$/i });
  await loginSubmit.waitFor({ state: "visible", timeout: 20_000 });
  const loginEnabled = await loginSubmit.isEnabled().catch(() => false);
  notes.interactions.loginHydration = {
    enabled: loginEnabled,
    gate: "busy || !hydrated preserved",
  };
  if (loginEnabled) {
    await loginSubmit.click();
    const emailError = await page
      .getByText(/enter a valid email|invalid email|email/i)
      .first()
      .isVisible()
      .catch(() => false);
    notes.interactions.loginValidation = { emailErrorVisible: emailError };
    await page.screenshot({
      path: shot("login-validation-440-light.png"),
      fullPage: true,
    });
  } else {
    notes.limitations.push(
      "Login submit stayed disabled because of the existing hydration gate.",
    );
  }

  await page.goto(`${baseURL}/en/together/onboard`, {
    waitUntil: "domcontentloaded",
    timeout: 30_000,
  });
  await page.waitForTimeout(800);
  notes.routes["/en/together/onboard"] = {
    url: page.url(),
    visible: await page
      .getByTestId("onboard-wizard")
      .isVisible()
      .catch(() => false),
  };
  if (!String(page.url()).includes("/together/onboard")) {
    notes.limitations.push(
      "Unauthenticated /together/onboard redirected away; wizard not exercised without a membership-less session.",
    );
  }

  const viewports = [
    { width: 390, height: 844, name: "390" },
    { width: 440, height: 844, name: "440" },
    { width: 768, height: 1024, name: "768" },
    { width: 1280, height: 800, name: "1280" },
  ];
  for (const viewport of viewports) {
    await page.setViewportSize({
      width: viewport.width,
      height: viewport.height,
    });
    await page.goto(`${baseURL}/en/welcome`, {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });
    await page.waitForTimeout(400);
    const metrics = await shellMetrics(page);
    notes.viewports[`welcome-${viewport.name}`] = metrics;
    await page.screenshot({
      path: shot(`welcome-${viewport.name}.png`),
      fullPage: true,
    });
    await page.goto(`${baseURL}/en/login`, {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });
    await page.waitForTimeout(400);
    notes.viewports[`login-${viewport.name}`] = await shellMetrics(page);
    await page.screenshot({
      path: shot(`login-${viewport.name}.png`),
      fullPage: true,
    });
    await page.goto(`${baseURL}/en/register`, {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });
    await page.waitForTimeout(400);
    notes.viewports[`register-${viewport.name}`] = await shellMetrics(page);
    await page.screenshot({
      path: shot(`register-${viewport.name}.png`),
      fullPage: true,
    });
    await page.goto(`${baseURL}/en/forgot-password`, {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });
    await page.waitForTimeout(400);
    notes.viewports[`forgot-${viewport.name}`] = await shellMetrics(page);
    await page.screenshot({
      path: shot(`forgot-${viewport.name}.png`),
      fullPage: true,
    });
  }

  await light.close();

  const dark = await browser.newContext({
    viewport: { width: 440, height: 844 },
    colorScheme: "dark",
  });
  const darkPage = await dark.newPage();
  await capturePage(
    darkPage,
    "/en/welcome",
    "auth-welcome",
    "welcome-440-dark.png",
  );
  await capturePage(darkPage, "/en/login", "auth-login", "login-440-dark.png");
  await capturePage(
    darkPage,
    "/en/register",
    "auth-register",
    "register-440-dark.png",
  );
  await capturePage(
    darkPage,
    "/en/forgot-password",
    "auth-forgot-password",
    "forgot-440-dark.png",
  );
  notes.themes.dark = "captured at 440";
  await dark.close();
} catch (error) {
  notes.limitations.push(
    error instanceof Error ? error.message : "Capture failed.",
  );
  throw error;
} finally {
  notes.finishedAt = new Date().toISOString();
  writeFileSync(join(outDir, "notes.json"), JSON.stringify(notes, null, 2));
  await browser.close();
}
