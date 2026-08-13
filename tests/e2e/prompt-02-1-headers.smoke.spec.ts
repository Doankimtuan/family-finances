import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { test, expect, type Page } from "@playwright/test";
import { APP_PATH } from "@/modules/tenancy/application/app-path";

const TOP_LEVEL_ROUTES = [
  { key: "home", path: "/home", testId: "home-dashboard" },
  { key: "money", path: "/money", testId: "money-hub" },
  { key: "plan", path: "/plan", testId: "plan-hub" },
  { key: "inbox", path: "/inbox", testId: "inbox-queue" },
  {
    key: "together",
    path: "/together",
    testId: "together-overview-page",
  },
] as const;

const VIEWPORTS = [
  { key: "390", width: 390, height: 844 },
  { key: "440", width: 440, height: 956 },
  { key: "768", width: 768, height: 956 },
  { key: "1280", width: 1280, height: 900 },
] as const;

const POLISH_SCREENSHOT_PHASE =
  process.env.PROMPT_02_2_SCREENSHOT_PHASE ?? "current";

async function login(page: Page) {
  const email = process.env.E2E_USER_EMAIL;
  const password = process.env.E2E_USER_PASSWORD;
  test.skip(!email || !password, "E2E credentials not provided");

  await page.goto("/en/login");
  await page.getByLabel("Email").fill(email!);
  await page.locator("#login-password").fill(password!);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/en\/(home|together\/onboard)/, {
    timeout: 20_000,
  });
  test.skip(page.url().includes(APP_PATH.ONBOARD), "E2E user has no household");
}

async function expectShellGeometry(page: Page, width: number) {
  const root = page.locator("#app-viewport-root");
  await expect(root).toBeVisible();
  await expect(
    root.locator('[data-header-variant="contextual"]'),
  ).toBeVisible();
  const title = root.locator('[data-slot="header-title"]');
  await expect(title).toBeVisible();
  const titleStyle = await title.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      textOverflow: style.textOverflow,
      whiteSpace: style.whiteSpace,
      clientHeight: element.clientHeight,
      scrollHeight: element.scrollHeight,
    };
  });
  expect(titleStyle.textOverflow).not.toBe("ellipsis");
  expect(titleStyle.whiteSpace).not.toBe("nowrap");
  expect(titleStyle.scrollHeight).toBe(titleStyle.clientHeight);
  const dimensions = await page.evaluate(() => ({
    viewport: window.innerWidth,
    content: document.documentElement.scrollWidth,
  }));
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport);
  const box = await root.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.width).toBeLessThanOrEqual(440);
  if (width > 440) {
    expect(Math.abs(box!.x - (width - box!.width) / 2)).toBeLessThanOrEqual(1);
  }
}

test.describe("Prompt 02.1 expressive top-level headers", () => {
  test.setTimeout(180_000);

  test("all five destinations keep one expressive, localized shell", async ({
    page,
  }) => {
    await login(page);
    const screenshotDir = join(
      process.cwd(),
      "screenshots",
      "prompt-02-2",
      POLISH_SCREENSHOT_PHASE,
    );
    mkdirSync(screenshotDir, { recursive: true });

    for (const locale of ["en", "vi"] as const) {
      for (const viewport of VIEWPORTS) {
        await page.setViewportSize({
          width: viewport.width,
          height: viewport.height,
        });
        for (const route of TOP_LEVEL_ROUTES) {
          await page.goto(`/${locale}${route.path}`, {
            waitUntil: "domcontentloaded",
          });
          await expect(
            page.locator("#app-viewport-root").getByTestId(route.testId),
          ).toBeVisible();
          await expectShellGeometry(page, viewport.width);
          await page.screenshot({
            path: join(
              screenshotDir,
              `${locale}-${viewport.key}-${route.key}.png`,
            ),
            fullPage: true,
          });
        }
      }
    }
  });
});

test("contextual header respects reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await login(page);
  await page.goto("/en/home");
  const header = page.locator(
    '#app-viewport-root [data-header-variant="contextual"]',
  );
  await expect(header).toBeVisible();
  await expect
    .poll(() =>
      header.evaluate((element) => getComputedStyle(element).animationName),
    )
    .toBe("none");
});
