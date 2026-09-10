import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pkg from "@next/env";
import { chromium } from "playwright";

const { loadEnvConfig } = pkg;
const root = join(dirname(fileURLToPath(import.meta.url)), "../../../..");
loadEnvConfig(root);

const baseURL = process.env.PHASE16_BASE_URL ?? "http://127.0.0.1:3000";
const outDir = dirname(fileURLToPath(import.meta.url));
const authStatePath = join(root, "output/playwright/.auth/user.json");
mkdirSync(outDir, { recursive: true });

const notes = {
  baseURL,
  startedAt: new Date().toISOString(),
  authStatePresent: existsSync(authStatePath),
  unauthenticated: {},
  authenticated: {},
  loginHydration: null,
  limitations: [],
};

function shot(name) {
  return join(outDir, name);
}

async function shellMetrics(page) {
  return page.evaluate(() => {
    const shell = document.querySelector("#app-viewport-root");
    const loginSubmit = document.querySelector(
      '[data-testid="auth-login"] button[type="submit"]',
    );
    return {
      innerWidth: window.innerWidth,
      shellWidth: shell instanceof HTMLElement ? shell.offsetWidth : null,
      loginSubmitDisabled:
        loginSubmit instanceof HTMLButtonElement ? loginSubmit.disabled : null,
    };
  });
}

async function capture(page, path, fileName, testId) {
  await page.goto(`${baseURL}${path}`, {
    waitUntil: "domcontentloaded",
    timeout: 30_000,
  });
  await page.waitForTimeout(700);
  const visible = testId
    ? await page
        .getByTestId(testId)
        .isVisible()
        .catch(() => false)
    : false;
  const metrics = await shellMetrics(page);
  await page.screenshot({ path: shot(fileName), fullPage: true });
  return { url: page.url(), visible, testId, ...metrics };
}

const UNAUTH_ROUTES = [
  ["/en/welcome", "auth-welcome", "welcome"],
  ["/en/login", "auth-login", "login"],
  ["/en/register", "auth-register", "register"],
  ["/en/forgot-password", "auth-forgot-password", "forgot"],
];

const AUTH_ROUTES = [
  ["/en/home", "home-dashboard", "home"],
  ["/en/money", "money-hub", "money"],
  ["/en/money/transactions", "money-transactions", "transactions"],
  ["/en/plan", "plan-hub", "plan"],
  ["/en/inbox", "inbox-queue", "inbox"],
  ["/en/together", "together-overview-page", "together"],
  ["/en/health", "health-overview", "health"],
];

const browser = await chromium.launch({ headless: true });

try {
  const light440 = await browser.newContext({
    viewport: { width: 440, height: 844 },
    colorScheme: "light",
  });
  const page = await light440.newPage();

  for (const [path, testId, name] of UNAUTH_ROUTES) {
    notes.unauthenticated[`${name}-440-light`] = await capture(
      page,
      path,
      `${name}-440-light.png`,
      testId,
    );
  }

  const loginShot = notes.unauthenticated["login-440-light"];
  notes.loginHydration =
    loginShot.loginSubmitDisabled === true
      ? "busy || !hydrated — submit remained disabled; no auth bypass"
      : "login submit was enabled";

  await page.setViewportSize({ width: 390, height: 844 });
  notes.unauthenticated["welcome-390-light"] = await capture(
    page,
    "/en/welcome",
    "welcome-390-light.png",
    "auth-welcome",
  );

  await page.setViewportSize({ width: 1280, height: 800 });
  notes.unauthenticated["welcome-1280-light"] = await capture(
    page,
    "/en/welcome",
    "welcome-1280-light.png",
    "auth-welcome",
  );
  notes.unauthenticated["login-1280-light"] = await capture(
    page,
    "/en/login",
    "login-1280-light.png",
    "auth-login",
  );
  await light440.close();

  const dark440 = await browser.newContext({
    viewport: { width: 440, height: 844 },
    colorScheme: "dark",
  });
  const darkPage = await dark440.newPage();
  notes.unauthenticated["welcome-440-dark"] = await capture(
    darkPage,
    "/en/welcome",
    "welcome-440-dark.png",
    "auth-welcome",
  );
  notes.unauthenticated["login-440-dark"] = await capture(
    darkPage,
    "/en/login",
    "login-440-dark.png",
    "auth-login",
  );
  await dark440.close();

  if (!existsSync(authStatePath)) {
    notes.limitations.push(
      "Authenticated browser coverage PARTIAL — no established Playwright storage state.",
    );
  } else {
    const authLight = await browser.newContext({
      viewport: { width: 440, height: 844 },
      colorScheme: "light",
      storageState: authStatePath,
    });
    const authPage = await authLight.newPage();
    for (const [path, testId, name] of AUTH_ROUTES) {
      const result = await capture(
        authPage,
        path,
        `${name}-440-light.png`,
        testId,
      );
      notes.authenticated[`${name}-440-light`] = result;
      if (result.url.includes("/login")) {
        notes.limitations.push(
          `Authenticated route ${path} redirected to login; storage state was not a live session.`,
        );
      }
    }

    await authPage.setViewportSize({ width: 1280, height: 800 });
    notes.authenticated["home-1280-light"] = await capture(
      authPage,
      "/en/home",
      "home-1280-light.png",
      "home-dashboard",
    );
    notes.authenticated["money-1280-light"] = await capture(
      authPage,
      "/en/money",
      "money-1280-light.png",
      "money-hub",
    );
    await authLight.close();

    const authDark = await browser.newContext({
      viewport: { width: 440, height: 844 },
      colorScheme: "dark",
      storageState: authStatePath,
    });
    const authDarkPage = await authDark.newPage();
    notes.authenticated["home-440-dark"] = await capture(
      authDarkPage,
      "/en/home",
      "home-440-dark.png",
      "home-dashboard",
    );
    notes.authenticated["money-440-dark"] = await capture(
      authDarkPage,
      "/en/money",
      "money-440-dark.png",
      "money-hub",
    );
    await authDark.close();
  }
} catch (error) {
  notes.limitations.push(
    error instanceof Error ? error.message : "capture failed",
  );
} finally {
  notes.finishedAt = new Date().toISOString();
  writeFileSync(join(outDir, "notes.json"), JSON.stringify(notes, null, 2));
  await browser.close();
}
