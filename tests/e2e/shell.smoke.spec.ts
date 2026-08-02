import { test, expect } from "@playwright/test";

test.describe("AppViewport shell smoke (ST-E01-001)", () => {
  for (const locale of ["en", "vi"] as const) {
    test(`/${locale}/home renders AppViewport at 440px max`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
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
    await page.goto("/en/home");
    await page.locator("#app-viewport-root").waitFor({ state: "visible" });

    await page.evaluate(() => {
      document.documentElement.classList.add("dark");
    });

    const canvas = await page.locator("#app-viewport-root").evaluate((el) => {
      return getComputedStyle(el).getPropertyValue("--vinha-canvas").trim();
    });
    expect(canvas).toBe("#09090b");
  });
});
