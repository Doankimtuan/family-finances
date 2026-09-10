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
const baseURL = process.env.PHASE11_BASE_URL ?? "http://127.0.0.1:3000";
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
      await page.goto(`${baseURL}/en/plan/recurring`, {
        waitUntil: "networkidle",
        timeout: 30_000,
      });
      notes.viewports[`recurring-${viewport.name}`] = {
        visible: await page.getByTestId("plan-recurring").isVisible().catch(() => false),
        url: page.url(),
      };
      await page.screenshot({
        path: shot(`recurring-en-${viewport.name}.png`),
        fullPage: true,
      });
    }

    await page.setViewportSize({ width: 440, height: 844 });
    await page.goto(`${baseURL}/en/plan/calendar`, {
      waitUntil: "networkidle",
      timeout: 30_000,
    });
    notes.viewports["calendar-440-light"] = {
      visible: await page.getByTestId("plan-calendar").isVisible().catch(() => false),
      url: page.url(),
    };
    await page.screenshot({
      path: shot("calendar-en-440-light.png"),
      fullPage: true,
    });

    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto(`${baseURL}/en/plan/calendar`, {
      waitUntil: "networkidle",
      timeout: 30_000,
    });
    notes.viewports["calendar-440-dark"] = {
      visible: await page.getByTestId("plan-calendar").isVisible().catch(() => false),
      url: page.url(),
    };
    await page.screenshot({
      path: shot("calendar-en-440-dark.png"),
      fullPage: true,
    });
    await page.emulateMedia({ colorScheme: "light" });

    await recordRoute("/en/plan/ritual", "plan-ritual-page");
    await page.screenshot({
      path: shot("ritual-en-440-light.png"),
      fullPage: true,
    });

    await recordRoute("/en/plan", "plan-hub");
    await page.screenshot({ path: shot("plan-en-440-light.png"), fullPage: true });

    await recordRoute("/en/plan/recurring", "plan-recurring");
    const recurringCards = page.locator("[data-testid^='recurring-card-']");
    notes.realData.recurringCards = await recurringCards.count();
    notes.realData.recurringEmpty = await page
      .getByText(/no repeating commitments yet|chưa có cam kết lặp lại/i)
      .isVisible()
      .catch(() => false);

    const createOpen = page.getByTestId("recurring-create-open");
    if (await createOpen.isVisible().catch(() => false)) {
      await createOpen.click();
      notes.sheetsOpened.createRecurring = await page
        .getByTestId("recurring-create-form")
        .isVisible()
        .catch(() => false);
      await page.screenshot({
        path: shot("recurring-create-sheet.png"),
        fullPage: true,
      });
      await page.keyboard.press("Escape");
    }

    if ((notes.realData.recurringCards ?? 0) > 0) {
      await recurringCards.first().click();
      notes.routes["/en/plan/recurring/[id]"] = {
        url: page.url(),
        visible: await page
          .getByTestId("plan-recurring-detail")
          .isVisible()
          .catch(() => false),
      };
      await page.screenshot({
        path: shot("recurring-detail-en-440-light.png"),
        fullPage: true,
      });
    }

    await page.goto(`${baseURL}/en/plan/calendar`, {
      waitUntil: "networkidle",
      timeout: 30_000,
    });
    const previous = page.getByTestId("calendar-month-previous");
    if (await previous.isVisible().catch(() => false)) {
      await previous.click();
      notes.routes["calendar-previous"] = { url: page.url() };
    }

    await recordRoute("/vi/plan/recurring", "plan-recurring");
    await page.screenshot({
      path: shot("recurring-vi-440-light.png"),
      fullPage: true,
    });
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
