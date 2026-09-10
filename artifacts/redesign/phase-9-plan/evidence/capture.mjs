import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pkg from "@next/env";
const { loadEnvConfig } = pkg;
import { chromium } from "playwright";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../../..");
loadEnvConfig(root);

const email = process.env.E2E_USER_EMAIL?.trim();
const password = process.env.E2E_USER_PASSWORD;
const baseURL = process.env.PHASE9_BASE_URL ?? "http://127.0.0.1:3000";
const outDir = dirname(fileURLToPath(import.meta.url));
mkdirSync(outDir, { recursive: true });

const notes = {
  baseURL,
  startedAt: new Date().toISOString(),
  auth: "not-started",
  routes: {},
  viewports: {},
  limitations: [],
};

function shot(name) {
  return join(outDir, name);
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 440, height: 844 },
  colorScheme: "light",
});
const page = await context.newPage();

try {
  await page.goto(`${baseURL}/en/login`, { waitUntil: "domcontentloaded", timeout: 30_000 });
  const loginButton = page.getByRole("button", { name: /^log in$/i });
  await loginButton.waitFor({ state: "visible", timeout: 20_000 });
  await page.waitForTimeout(1500);
  let loginEnabled = await loginButton.isEnabled().catch(() => false);
  if (!loginEnabled) {
    loginEnabled = await page
      .waitForFunction(
        () => {
          const buttons = [...document.querySelectorAll("button")];
          const login = buttons.find((button) =>
            /^log in$/i.test((button.textContent ?? "").trim()),
          );
          return Boolean(
            login &&
              !login.disabled &&
              login.getAttribute("aria-disabled") !== "true",
          );
        },
        { timeout: 20_000 },
      )
      .then(() => true)
      .catch(() => false);
  }
  notes.routes["/en/login"] = {
    url: page.url(),
    loginEnabled,
  };
  if (!email || !password) {
    notes.auth = "missing-credentials";
    notes.limitations.push("E2E_USER_EMAIL / E2E_USER_PASSWORD missing");
  } else {
    await page.getByLabel("Email").fill(email);
    await page.locator("#login-password").fill(password);
    await loginButton.click({ force: true, timeout: 10_000 }).catch(async () => {
      await loginButton.dispatchEvent("click");
    });
    try {
      await page.waitForURL(/\/en\/(home|together\/onboard)/, { timeout: 25_000 });
      notes.auth = page.url().includes("/together/onboard")
        ? "onboard-no-household"
        : "authenticated";
    } catch {
      notes.auth = loginEnabled ? "login-failed" : "login-disabled";
      notes.limitations.push(`Stayed on ${page.url()}`);
      await page.screenshot({ path: shot("login-disabled.png"), fullPage: true });
    }
  }

  if (notes.auth === "authenticated") {
    const viewports = [
      { width: 390, height: 844, name: "390-light" },
      { width: 440, height: 844, name: "440-light" },
      { width: 768, height: 1024, name: "768-light" },
      { width: 1280, height: 800, name: "1280-light" },
    ];
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.goto(`${baseURL}/en/plan`, { waitUntil: "networkidle", timeout: 30_000 });
      const hub = await page.getByTestId("plan-hub").isVisible().catch(() => false);
      notes.viewports[viewport.name] = { hub, url: page.url() };
      await page.screenshot({
        path: shot(`plan-en-${viewport.name}.png`),
        fullPage: true,
      });
    }

    await page.emulateMedia({ colorScheme: "dark" });
    await page.setViewportSize({ width: 440, height: 844 });
    await page.goto(`${baseURL}/en/plan`, { waitUntil: "networkidle", timeout: 30_000 });
    notes.viewports["440-dark"] = {
      hub: await page.getByTestId("plan-hub").isVisible().catch(() => false),
      url: page.url(),
    };
    await page.screenshot({ path: shot("plan-en-440-dark.png"), fullPage: true });

    await page.emulateMedia({ colorScheme: "light" });
    await page.goto(`${baseURL}/vi/plan`, { waitUntil: "networkidle", timeout: 30_000 });
    notes.routes["/vi/plan"] = {
      hub: await page.getByTestId("plan-hub").isVisible().catch(() => false),
      url: page.url(),
    };
    await page.screenshot({ path: shot("plan-vi-440-light.png"), fullPage: true });

    const childRoutes = [
      ["/en/plan/jars", "plan-jars"],
      ["/en/plan/goals", "plan-goals"],
      ["/en/plan/recurring", "plan-recurring"],
      ["/en/plan/calendar", "plan-calendar"],
      ["/en/plan/ritual", "plan-ritual-page"],
    ];
    for (const [path, testId] of childRoutes) {
      await page.goto(`${baseURL}${path}`, { waitUntil: "networkidle", timeout: 30_000 });
      notes.routes[path] = {
        url: page.url(),
        visible: await page.getByTestId(testId).isVisible().catch(() => false),
      };
    }

    await page.goto(`${baseURL}/en/plan`, { waitUntil: "networkidle", timeout: 30_000 });
    const toggle = page.getByTestId("plan-financial-privacy-toggle");
    notes.privacyToggle = await toggle.isVisible().catch(() => false);
    if (notes.privacyToggle) {
      await toggle.click();
      await page.screenshot({ path: shot("plan-en-440-privacy.png"), fullPage: true });
    }
  }
} catch (error) {
  notes.auth = notes.auth === "not-started" ? "error" : notes.auth;
  notes.limitations.push(String(error));
  await page.screenshot({ path: shot("capture-error.png"), fullPage: true }).catch(() => {});
} finally {
  notes.finishedAt = new Date().toISOString();
  writeFileSync(join(outDir, "notes.json"), JSON.stringify(notes, null, 2));
  await browser.close();
}
