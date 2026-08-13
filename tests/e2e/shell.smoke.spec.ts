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

test.describe("AppViewport shell smoke (ST-E01-001)", () => {
  for (const locale of ["en", "vi"] as const) {
    test(`/${locale}/home renders AppViewport at 440px max`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await login(page);
      await page.goto(`/${locale}/home`);
      const root = page.locator("#app-viewport-root");
      await expect(root).toBeVisible();
      const maxWidth = await root.evaluate(
        (el) => getComputedStyle(el).maxWidth,
      );
      expect(maxWidth).toBe("440px");
      const box = await root.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.width).toBeLessThanOrEqual(440);
    });
  }

  test("dark class applies dark canvas token on product shell", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await login(page);
    await page.goto("/en/home");
    const root = page.locator("#app-viewport-root");
    await expect(root).toBeVisible();
    await page.evaluate(() => {
      document.documentElement.classList.add("dark");
    });
    const canvas = await root.evaluate((el) => {
      return getComputedStyle(el).getPropertyValue("--vinha-canvas").trim();
    });
    expect(canvas).toBe("#141416");
  });
});
