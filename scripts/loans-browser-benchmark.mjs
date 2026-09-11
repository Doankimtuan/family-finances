import { writeFile } from "node:fs/promises";
import nextEnv from "@next/env";
import { createChunks, stringToBase64URL } from "@supabase/ssr";
import { chromium } from "@playwright/test";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const LOCAL_URL = "http://localhost:3101";
const LOANS_PATH = "/en/money/loans";
const TARGET_PATH = process.env.VINHA_LOANS_BROWSER_PATH ?? LOANS_PATH;
const IS_DETAIL = /^\/en\/money\/loans\/[^/]+$/.test(TARGET_PATH);
const REPEATS = Number(
  process.env.VINHA_LOANS_BROWSER_REPEATS ?? (IS_DETAIL ? 5 : 10),
);
const OUTPUT =
  process.env.VINHA_LOANS_BROWSER_OUTPUT ??
  "output/playwright/loans-benchmark/browser.json";

function requireEnvironment() {
  const minimumRepeats = IS_DETAIL ? 5 : 10;
  if (!Number.isInteger(REPEATS) || REPEATS < minimumRepeats) {
    throw new Error(
      `VINHA_LOANS_BROWSER_REPEATS must be an integer >= ${minimumRepeats}`,
    );
  }
  for (const name of [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    "E2E_USER_EMAIL",
    "E2E_USER_PASSWORD",
  ]) {
    if (!process.env[name]?.trim()) throw new Error(`${name} is required`);
  }
}

async function signIn() {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/token?grant_type=password`,
    {
      method: "POST",
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        email: process.env.E2E_USER_EMAIL.trim(),
        password: process.env.E2E_USER_PASSWORD,
      }),
    },
  );
  if (!response.ok)
    throw new Error(`benchmark sign-in failed: ${response.status}`);
  return response.json();
}

async function authCookies(session) {
  const projectRef = new URL(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
  ).hostname.split(".")[0];
  const name = `sb-${projectRef}-auth-token`;
  const value = `base64-${stringToBase64URL(JSON.stringify(session))}`;
  return createChunks(name, value).map((cookie) => ({
    ...cookie,
    url: LOCAL_URL,
  }));
}

async function main() {
  requireEnvironment();
  const session = await signIn();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 440, height: 900 },
  });
  await context.addCookies(await authCookies(session));
  const page = await context.newPage();
  let events = [];
  const onRequest = (request) => {
    const url = new URL(request.url());
    events.push({
      method: request.method(),
      pathname: url.pathname,
      search: url.search,
      resourceType: request.resourceType(),
    });
  };
  page.on("request", onRequest);

  const samples = [];
  for (let index = 0; index < REPEATS; index += 1) {
    events = [];
    const started = Date.now();
    await page.goto(`${LOCAL_URL}${TARGET_PATH}`, {
      waitUntil: "domcontentloaded",
    });
    if (page.url().endsWith("/login"))
      throw new Error("benchmark session was rejected");
    const responseStart = await page.evaluate(
      () =>
        performance.getEntriesByType("navigation")[0]?.responseStart ?? null,
    );
    await page.waitForSelector(
      IS_DETAIL
        ? '[data-testid="loan-detail-tabs"]'
        : '[data-testid="loans-summary"]',
    );
    const summaryMs = Date.now() - started;
    if (!IS_DETAIL) await page.waitForSelector('[data-testid^="loan-row-"]');
    const rowsMs = Date.now() - started;
    const rowCount = IS_DETAIL
      ? 1
      : await page.locator('[data-testid^="loan-row-"]').count();
    await page.waitForLoadState("load");
    const completeMs = Date.now() - started;
    await page.waitForTimeout(1200);
    const detailRsc = events.filter(
      (event) =>
        event.method === "GET" &&
        !IS_DETAIL &&
        event.pathname.startsWith(`${LOANS_PATH}/`) &&
        event.pathname.split("/").length === 5 &&
        event.search.includes("_rsc="),
    );
    samples.push({
      index: index + 1,
      responseStart,
      summaryMs,
      rowsMs,
      completeMs,
      rowCount,
      browserRequests: events.length,
      detailRscPrefetches: detailRsc.length,
      detailRscPaths: detailRsc.map((event) => event.pathname),
    });
  }

  page.off("request", onRequest);
  await browser.close();
  await writeFile(
    OUTPUT,
    JSON.stringify(
      {
        label: process.env.VINHA_LOANS_BROWSER_LABEL ?? "unspecified",
        path: TARGET_PATH,
        repeats: REPEATS,
        viewport: { width: 440, height: 900 },
        samples,
      },
      null,
      2,
    ),
  );
  console.error(JSON.stringify({ output: OUTPUT, repeats: REPEATS, samples }));
}

main().catch((error) => {
  console.error(
    error instanceof Error ? error.message : "browser benchmark failed",
  );
  process.exitCode = 1;
});
