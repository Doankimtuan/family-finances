import { test, expect } from "@playwright/test";
import { locales } from "@/i18n/locales";
import { APP_PATH } from "@/modules/tenancy/application/app-path";

const CHROME_SELECTOR = {
  product: '[data-chrome="product"]',
  auth: '[data-chrome="auth"]',
} as const;

const APP_VIEWPORT_SELECTOR = "#app-viewport-root";

const PRIMARY_NAV_LABEL: Record<string, string> = {
  en: "Primary",
  vi: "Điều hướng chính",
};

const INBOX_TAB_LABEL: Record<string, string> = {
  en: "Inbox",
  vi: "Hộp thư",
};

async function signIn(page) {
  const email = process.env.E2E_USER_EMAIL;
  const password = process.env.E2E_USER_PASSWORD;
  if (!email || !password) {
    test.skip(!email || !password, "E2E credentials not provided");
  }
  await page.goto(`/en${APP_PATH.LOGIN}`);
  await page.getByLabel("Email").fill(email!);
  await page.locator("#login-password").fill(password!);
  await page.getByRole("button", { name: "Log in" }).click();
  const postAuthPattern = new RegExp(
    `\\/en\\/(${APP_PATH.HOME.slice(1)}|${APP_PATH.ONBOARD.slice(1)})`,
  );
  await expect(page).toHaveURL(postAuthPattern, {
    timeout: 20_000,
  });
}

test.describe("Chrome layouts (ST-E01-002)", () => {
  for (const locale of locales) {
    test(`/${locale}/home keeps product BottomNav`, async ({ page }) => {
      await signIn(page);
      await page.goto(`/${locale}${APP_PATH.HOME}`, {
        waitUntil: "domcontentloaded",
      });

      await expect(page.locator(CHROME_SELECTOR.product)).toBeVisible();
      const nav = page.getByRole("navigation", {
        name: PRIMARY_NAV_LABEL[locale],
      });
      await expect(nav).toBeVisible();

      const homeTab = nav.getByRole("link").first();
      const box = await homeTab.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.height).toBeGreaterThanOrEqual(44);

      const inboxTab = nav.getByRole("link", {
        name: INBOX_TAB_LABEL[locale],
      });
      await expect(inboxTab).toBeVisible();
    });

    test(`/${locale}/welcome uses auth chrome without BottomNav`, async ({
      page,
    }) => {
      await page.goto(`/${locale}${APP_PATH.WELCOME}`);

      await expect(page.locator(CHROME_SELECTOR.auth)).toBeVisible();
      await expect(page.getByTestId("auth-welcome")).toBeVisible();
      await expect(page.locator(APP_VIEWPORT_SELECTOR)).toBeVisible();
      await expect(
        page.getByRole("navigation", {
          name: PRIMARY_NAV_LABEL[locale],
        }),
      ).toHaveCount(0);
    });
  }
});
