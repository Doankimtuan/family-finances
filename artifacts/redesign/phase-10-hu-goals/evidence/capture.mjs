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
const baseURL = process.env.PHASE10_BASE_URL ?? "http://127.0.0.1:3000";
const outDir = dirname(fileURLToPath(import.meta.url));
mkdirSync(outDir, { recursive: true });

const notes = {
  baseURL,
  startedAt: new Date().toISOString(),
  auth: "not-started",
  routes: {},
  viewports: {},
  sheetsOpened: {},
  realData: {},
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

async function recordRoute(path, testId) {
  await page.goto(`${baseURL}${path}`, {
    waitUntil: "domcontentloaded",
    timeout: 30_000,
  });
  const visible = testId
    ? await page.getByTestId(testId).isVisible().catch(() => false)
    : false;
  notes.routes[path] = { url: page.url(), visible, testId };
  return visible;
}

try {
  await page.goto(`${baseURL}/en/login`, {
    waitUntil: "domcontentloaded",
    timeout: 30_000,
  });
  const loginButton = page.getByRole("button", { name: /^log in$/i });
  await loginButton.waitFor({ state: "visible", timeout: 20_000 });
  await page.waitForTimeout(2000);
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
        { timeout: 25_000 },
      )
      .then(() => true)
      .catch(() => false);
  }
  notes.routes["/en/login"] = { url: page.url(), loginEnabled };

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
      await page.waitForURL(/\/en\/(home|together\/onboard)/, {
        timeout: 25_000,
      });
      notes.auth = page.url().includes("/together/onboard")
        ? "onboard-no-household"
        : "authenticated";
    } catch {
      notes.auth = loginEnabled ? "login-failed" : "login-disabled";
      notes.limitations.push(`Stayed on ${page.url()}`);
      await page.screenshot({
        path: shot("login-disabled.png"),
        fullPage: true,
      });
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
      await page.goto(`${baseURL}/en/plan/jars`, {
        waitUntil: "networkidle",
        timeout: 30_000,
      });
      const jars = await page.getByTestId("plan-jars").isVisible().catch(() => false);
      notes.viewports[`jars-${viewport.name}`] = { jars, url: page.url() };
      await page.screenshot({
        path: shot(`jars-en-${viewport.name}.png`),
        fullPage: true,
      });
    }

    await page.setViewportSize({ width: 440, height: 844 });
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto(`${baseURL}/en/plan/jars`, {
      waitUntil: "networkidle",
      timeout: 30_000,
    });
    notes.viewports["jars-440-dark"] = {
      jars: await page.getByTestId("plan-jars").isVisible().catch(() => false),
      url: page.url(),
    };
    await page.screenshot({
      path: shot("jars-en-440-dark.png"),
      fullPage: true,
    });

    await page.emulateMedia({ colorScheme: "light" });
    await page.goto(`${baseURL}/en/plan/goals`, {
      waitUntil: "networkidle",
      timeout: 30_000,
    });
    notes.viewports["goals-440-light"] = {
      goals: await page.getByTestId("plan-goals").isVisible().catch(() => false),
      url: page.url(),
    };
    await page.screenshot({
      path: shot("goals-en-440-light.png"),
      fullPage: true,
    });

    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto(`${baseURL}/en/plan/goals`, {
      waitUntil: "networkidle",
      timeout: 30_000,
    });
    notes.viewports["goals-440-dark"] = {
      goals: await page.getByTestId("plan-goals").isVisible().catch(() => false),
      url: page.url(),
    };
    await page.screenshot({
      path: shot("goals-en-440-dark.png"),
      fullPage: true,
    });
    await page.emulateMedia({ colorScheme: "light" });

    await recordRoute("/en/plan", "plan-hub");
    await page.screenshot({ path: shot("plan-en-440-light.png"), fullPage: true });

    await recordRoute("/en/plan/jars", "plan-jars");
    const jarCards = page.locator("[data-testid^='jar-card-']");
    const jarCount = await jarCards.count();
    notes.realData.jarCards = jarCount;
    notes.realData.jarsEmpty = await page
      .getByText(/no jars yet|chưa có hũ/i)
      .isVisible()
      .catch(() => false);

    if (jarCount > 0) {
      await jarCards.first().click();
      notes.routes["/en/plan/jars/[id]"] = {
        url: page.url(),
        visible: await page.getByTestId("plan-jar-detail").isVisible().catch(() => false),
        hero: await page.getByTestId("plan-jar-hero").isVisible().catch(() => false),
      };
      await page.screenshot({
        path: shot("jar-detail-en-440-light.png"),
        fullPage: true,
      });
      const reallocate = page.getByTestId("jar-reallocate-open");
      if (await reallocate.isVisible().catch(() => false)) {
        await reallocate.click();
        notes.sheetsOpened.reallocate = true;
        await page.screenshot({
          path: shot("jar-reallocate-sheet.png"),
          fullPage: true,
        });
        await page.keyboard.press("Escape");
      }
    }

    await recordRoute("/en/plan/goals", "plan-goals");
    const goalCards = page.locator("[data-testid^='goal-card-']");
    const goalCount = await goalCards.count();
    notes.realData.goalCards = goalCount;
    notes.realData.goalsEmpty = await page
      .getByText(/no goals yet|chưa có mục tiêu/i)
      .isVisible()
      .catch(() => false);

    if (goalCount > 0) {
      await goalCards.first().click();
      notes.routes["/en/plan/goals/[id]"] = {
        url: page.url(),
        visible: await page
          .getByTestId("plan-goal-detail")
          .isVisible()
          .catch(() => false),
        hero: await page.getByTestId("plan-goal-hero").isVisible().catch(() => false),
      };
      await page.screenshot({
        path: shot("goal-detail-en-440-light.png"),
        fullPage: true,
      });
    }

    const createJar = page.getByTestId("jar-create-open");
    await page.goto(`${baseURL}/en/plan/jars`, {
      waitUntil: "networkidle",
      timeout: 30_000,
    });
    if (await createJar.isVisible().catch(() => false)) {
      await createJar.click();
      notes.sheetsOpened.createJar = true;
      await page.screenshot({ path: shot("jar-create-sheet.png"), fullPage: true });
      await page.keyboard.press("Escape");
    }

    await page.goto(`${baseURL}/en/plan/goals`, {
      waitUntil: "networkidle",
      timeout: 30_000,
    });
    const createGoal = page.getByTestId("goal-create-open");
    if (await createGoal.isVisible().catch(() => false)) {
      await createGoal.click();
      notes.sheetsOpened.createGoal = true;
      await page.screenshot({
        path: shot("goal-create-sheet.png"),
        fullPage: true,
      });
      await page.keyboard.press("Escape");
    }

    await page.goto(`${baseURL}/vi/plan/jars`, {
      waitUntil: "networkidle",
      timeout: 30_000,
    });
    notes.routes["/vi/plan/jars"] = {
      url: page.url(),
      visible: await page.getByTestId("plan-jars").isVisible().catch(() => false),
    };
    await page.screenshot({ path: shot("jars-vi-440-light.png"), fullPage: true });

    const privacy = page.getByTestId("plan-jars-privacy-toggle");
    notes.privacyToggle = await privacy.isVisible().catch(() => false);
    if (notes.privacyToggle) {
      await privacy.click();
      await page.screenshot({
        path: shot("jars-en-440-privacy.png"),
        fullPage: true,
      });
    }
  }
} catch (error) {
  notes.auth = notes.auth === "not-started" ? "error" : notes.auth;
  notes.limitations.push(String(error));
  await page
    .screenshot({ path: shot("capture-error.png"), fullPage: true })
    .catch(() => {});
} finally {
  notes.finishedAt = new Date().toISOString();
  writeFileSync(join(outDir, "notes.json"), JSON.stringify(notes, null, 2));
  await browser.close();
}
