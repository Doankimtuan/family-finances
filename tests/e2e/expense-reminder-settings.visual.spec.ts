import { test, expect } from "@playwright/test";
import { APP_LOCALE } from "@/i18n/routing";
import { THEME_STORAGE_KEY } from "@/providers/theme-provider";
import { THEME_MODES } from "@/shared/theme/tokens";
import { TOGETHER_PATH } from "@/modules/tenancy/application/tenancy-constants";
import { authenticateE2EUser } from "./support/auth";
import { getE2EEnvironmentStatus } from "./support/env";

const [, LIGHT_THEME, DARK_THEME] = THEME_MODES;
const SETTINGS_PATH = TOGETHER_PATH.SETTINGS_ACCOUNT;
const REMINDER_TIME_TEST_ID = "daily-expense-reminder-time";

test.describe("Daily expense reminder settings", () => {
  test("fits supported viewports and opens the time control with the keyboard", async ({
    page,
  }, testInfo) => {
    const credentials = getE2EEnvironmentStatus();
    test.skip(
      !credentials.emailPresent || !credentials.passwordPresent,
      "E2E credentials not provided",
    );
    await authenticateE2EUser(page);

    const viewports = [
      { width: 390, height: 844, theme: LIGHT_THEME },
      { width: 440, height: 956, theme: DARK_THEME },
      { width: 768, height: 1024, theme: LIGHT_THEME },
      { width: 1280, height: 900, theme: DARK_THEME },
    ] as const;
    const keyboardViewport = viewports[0];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.emulateMedia({ colorScheme: viewport.theme });
      await page.evaluate(
        ({ key, theme }) => localStorage.setItem(key, theme),
        { key: THEME_STORAGE_KEY, theme: viewport.theme },
      );
      await page.goto(`/${APP_LOCALE.ENGLISH}${SETTINGS_PATH}`);

      await expect(
        page.getByTestId("together-account-settings-page"),
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { name: "Daily expense reminder" }),
      ).toBeVisible();
      const reminderTime = page.getByTestId(REMINDER_TIME_TEST_ID);
      await expect(reminderTime).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);

      if (viewport === keyboardViewport) {
        const trigger = reminderTime.getByRole("button");
        await trigger.focus();
        await page.keyboard.press("Enter");
        await expect(page.getByRole("listbox")).toBeVisible();
        await expect(page.getByRole("option")).toHaveCount(10);
        await page.keyboard.press("Escape");
      }

      await page.screenshot({
        path: testInfo.outputPath(
          `daily-expense-reminder-${viewport.width}-${viewport.theme}.png`,
        ),
        fullPage: true,
      });
    }

    await page.goto(`/${APP_LOCALE.VIETNAMESE}${SETTINGS_PATH}`);
    await expect(
      page.getByRole("heading", { name: "Nhắc ghi chi tiêu mỗi ngày" }),
    ).toBeVisible();
    await expect(page.getByTestId(REMINDER_TIME_TEST_ID)).toBeVisible();
    await page.screenshot({
      path: testInfo.outputPath("daily-expense-reminder-440-vi.png"),
      fullPage: true,
    });
  });
});
