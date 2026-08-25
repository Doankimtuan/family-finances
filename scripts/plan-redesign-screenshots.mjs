import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3100";
const authState = resolve(process.cwd(), "output/playwright/.auth/user.json");
const outputRoot = resolve(process.cwd(), "output/playwright/plan-redesign");
const viewports = [
  { name: "390", width: 390, height: 844 },
  { name: "440", width: 440, height: 956 },
  { name: "768", width: 768, height: 1024 },
  { name: "1280", width: 1280, height: 900 },
];
const routes = [
  { name: "hub", path: "/en/plan" },
  { name: "jars", path: "/en/plan/jars" },
  { name: "goals", path: "/en/plan/goals" },
  { name: "review", path: "/en/plan/ritual" },
];

await mkdir(outputRoot, { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext({ storageState: authState });
for (const viewport of viewports) {
  const page = await context.newPage({
    viewport: { width: viewport.width, height: viewport.height },
  });
  for (const route of routes) {
    await page.goto(`${baseURL}${route.path}`, { waitUntil: "networkidle" });
    await page.screenshot({
      path: resolve(outputRoot, `${route.name}-${viewport.name}.png`),
      fullPage: true,
    });
  }
  await page.close();
}
await browser.close();
