import { test, expect } from "@playwright/test";

test.describe("Chrome layouts (ST-E01-002)", () => {
  for (const locale of ["en", "vi"] as const) {
    test(`/${locale}/home keeps product BottomNav`, async ({ page }) => {
      await page.goto(`/${locale}/home`);

      await expect(page.locator('[data-chrome="product"]')).toBeVisible();
      const nav = page.getByRole("navigation", {
        name: locale === "en" ? "Primary" : "Điều hướng chính",
      });
      await expect(nav).toBeVisible();

      const homeTab = nav.getByRole("link").first();
      const box = await homeTab.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.height).toBeGreaterThanOrEqual(44);

      await expect(page.getByTestId("inbox-badge-placeholder")).toBeAttached();
    });

    test(`/${locale}/welcome uses auth chrome without BottomNav`, async ({
      page,
    }) => {
      await page.goto(`/${locale}/welcome`);

      await expect(page.locator('[data-chrome="auth"]')).toBeVisible();
      await expect(page.getByTestId("auth-welcome")).toBeVisible();
      await expect(page.locator("#app-viewport-root")).toBeVisible();
      await expect(
        page.getByRole("navigation", {
          name: locale === "en" ? "Primary" : "Điều hướng chính",
        }),
      ).toHaveCount(0);
    });
  }
});
