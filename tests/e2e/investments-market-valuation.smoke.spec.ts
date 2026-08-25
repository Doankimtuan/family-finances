import { expect, test } from "@playwright/test";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import {
  FINANCIAL_PRIVACY_STORAGE_KEY,
  FINANCIAL_PRIVACY_STORAGE_TRUE,
} from "@/shared/constants/financial-privacy";
import { authenticateE2EUser } from "./support/auth";

test.describe("Investment Market Valuation UI 02", () => {
  test.beforeEach(async ({ page }) => {
    await authenticateE2EUser(page);
  });

  for (const viewport of [
    { width: 390, height: 844, locale: "vi" as const, theme: "light" as const },
    { width: 440, height: 900, locale: "en" as const, theme: "dark" as const },
    { width: 768, height: 900, locale: "vi" as const, theme: "light" as const },
    { width: 1280, height: 900, locale: "en" as const, theme: "dark" as const },
  ]) {
    test(`${viewport.width}px ${viewport.locale} ${viewport.theme} list/detail stays readable`, async ({
      page,
    }) => {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });
      await page.emulateMedia({
        colorScheme: viewport.theme,
        reducedMotion: "reduce",
      });
      await page.goto(`/${viewport.locale}${APP_PATH.MONEY_INVESTMENTS}`);

      await expect(
        page.getByTestId("investment-overview-client"),
      ).toBeVisible();
      await expect(
        page.getByTestId("investment-valuation-meta").first(),
      ).toBeVisible();
      expect(
        await page.evaluate(
          () =>
            document.documentElement.scrollWidth <=
            document.documentElement.clientWidth,
        ),
      ).toBe(true);

      await page.locator("[data-testid^=investment-position-]").first().click();
      await expect(page.getByTestId("investment-detail")).toBeVisible();
      await expect(
        page.getByTestId("investment-valuation-meta").first(),
      ).toBeVisible();
      await expect(
        page.getByText(
          viewport.locale === "vi" ? "Lịch sử hoạt động" : "Activity history",
        ),
      ).toBeVisible();
    });
  }

  test("shows privacy-safe valuation metadata while offline", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
    await page.goto(`/vi${APP_PATH.MONEY_INVESTMENTS}`);
    await page.evaluate(
      ([key, value]) => localStorage.setItem(key, value),
      [FINANCIAL_PRIVACY_STORAGE_KEY, FINANCIAL_PRIVACY_STORAGE_TRUE],
    );
    await page.reload();
    await expect(page.getByText("••••••").first()).toBeVisible();
    await page.context().setOffline(true);
    await expect(page.getByTestId("money-offline-banner")).toBeVisible();
    await page.context().setOffline(false);
  });
});
