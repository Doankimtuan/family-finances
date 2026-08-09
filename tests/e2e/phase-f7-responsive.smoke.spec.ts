import { test, expect, type Page } from "@playwright/test";
import { APP_PATH } from "@/modules/tenancy/application/app-path";

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

async function expectNoHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    viewport: window.innerWidth,
    content: document.documentElement.scrollWidth,
  }));
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport);
}

test.describe("Phase F7 minimal responsive UI", () => {
  test.describe.configure({ mode: "serial" });
  test.setTimeout(90_000);

  test("390px Vietnamese light", async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await login(page);

    await page.goto("/en/together/settings");
    await page.getByRole("button", { name: "Light" }).click();
    await page.getByRole("button", { name: /VI.*Vietnamese/i }).click();
    await expect(page).toHaveURL(/\/vi\/together\/settings/);
    await expect(page.locator("html")).toHaveClass(/light/);
    await expectNoHorizontalOverflow(page);

    await page.goto("/vi/health");
    await expect(page.getByTestId("health-overview")).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await page.screenshot({
      path: testInfo.outputPath("390-vi-light-health.png"),
      fullPage: true,
    });

    await page.goto("/vi/together");
    await expect(page.getByTestId("together-overview-page")).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await page.screenshot({
      path: testInfo.outputPath("390-vi-light-household.png"),
      fullPage: true,
    });
  });

  test("440px English dark", async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 440, height: 956 });
    await login(page);

    await page.goto("/en/together/settings");
    await page.getByRole("button", { name: "Dark" }).click();
    await expect(page.locator("html")).toHaveClass(/dark/);
    await expectNoHorizontalOverflow(page);

    await page.goto("/en/health");
    await expect(page.getByTestId("health-overview")).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await page.screenshot({
      path: testInfo.outputPath("440-en-dark-health.png"),
      fullPage: true,
    });

    await page.goto("/en/together");
    await expect(page.getByTestId("together-overview-page")).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await page.screenshot({
      path: testInfo.outputPath("440-en-dark-household.png"),
      fullPage: true,
    });
  });
});
