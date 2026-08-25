import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3100";
const authState = resolve(process.cwd(), "output/playwright/.auth/user.json");
const outputRoot = resolve(process.cwd(), "output/playwright/plan-refinement");
const viewports = [
  { name: "390", width: 390, height: 844 },
  { name: "440", width: 440, height: 956 },
  { name: "768", width: 768, height: 1024 },
  { name: "1280", width: 1280, height: 900 },
];

await mkdir(outputRoot, { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext({ storageState: authState });
for (const viewport of viewports) {
  const page = await context.newPage({
    viewport: { width: viewport.width, height: viewport.height },
  });
  await page.goto(`${baseURL}/vi/plan`, { waitUntil: "networkidle" });
  await page.screenshot({
    path: resolve(outputRoot, `hub-${viewport.name}.png`),
    fullPage: true,
  });
  const scrollRegion = page.locator('[data-slot="shell-scroll-region"]');
  await scrollRegion.evaluate((element) =>
    element.scrollTo({ top: element.scrollHeight, behavior: "instant" }),
  );
  await page.waitForTimeout(250);
  await page.screenshot({
    path: resolve(outputRoot, `hub-lower-${viewport.name}.png`),
    fullPage: false,
  });
  const goalLink = page.locator('[data-testid^="plan-home-goal-"]').first();
  if (await goalLink.count()) {
    const goalHref = await goalLink.getAttribute("href");
    if (goalHref) {
      await page.goto(`${baseURL}${goalHref}`, { waitUntil: "networkidle" });
      await page.waitForTimeout(1200);
      await page.screenshot({
        path: resolve(outputRoot, `goal-detail-${viewport.name}.png`),
        fullPage: true,
      });
      await scrollRegion.evaluate((element) =>
        element.scrollTo({ top: element.scrollHeight, behavior: "instant" }),
      );
      await page.waitForTimeout(250);
      await page.screenshot({
        path: resolve(outputRoot, `goal-detail-actions-${viewport.name}.png`),
        fullPage: false,
      });
    }
  }
  await page.close();
}
await browser.close();
