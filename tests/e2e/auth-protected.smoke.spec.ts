import { test, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { THEME_STORAGE_KEY } from "@/providers/theme-provider";
import { THEME_MODES } from "@/shared/theme/tokens";

const AUTH_FINAL_PATH = "output/playwright/auth-final";

test.describe("Authenticated E2E infrastructure", () => {
  test("preserves the session through reload and auth entry routes", async ({
    page,
  }) => {
    await page.goto(`/vi${APP_PATH.HOME}`);
    await expect(page).toHaveURL(/\/vi\/home\/?$/);

    await page.reload();
    await expect(page).toHaveURL(/\/vi\/home\/?$/);

    for (const path of [
      "/vi",
      `/vi${APP_PATH.LOGIN}`,
      `/vi${APP_PATH.WELCOME}`,
    ]) {
      await page.goto(path);
      await expect(page).toHaveURL(/\/vi\/home\/?$/);
    }
  });

  test("reaches Transactions and create shell", async ({ page }) => {
    await mkdir(AUTH_FINAL_PATH, { recursive: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(
      ({ storageKey, theme }) => localStorage.setItem(storageKey, theme),
      { storageKey: THEME_STORAGE_KEY, theme: THEME_MODES[2] },
    );

    await page.goto(`/vi${APP_PATH.MONEY_TRANSACTIONS}`);
    await expect(page.getByTestId("money-transactions").last()).toBeVisible();
    await page.screenshot({
      path: `${AUTH_FINAL_PATH}/vi-transactions-list-390-dark.png`,
      fullPage: true,
    });

    await page.getByTestId("transactions-add").click();
    await expect(page.getByTestId("money-capture-entry").last()).toBeVisible();
    await page.screenshot({
      path: `${AUTH_FINAL_PATH}/vi-create-390-dark.png`,
      fullPage: true,
    });
  });
});
