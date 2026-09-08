import { test, expect } from "@playwright/test";
import {
  APP_PATH,
  moneyInvestmentBuyPath,
  moneyInvestmentPath,
} from "@/modules/tenancy/application/app-path";
import { localeConfirmPath } from "@/modules/tenancy/application/auth-constants";

const SAMPLE_HOLDING_ID = "00000000-0000-4000-8000-000000000099";

function localeLoginPattern(locale: "en" | "vi") {
  return new RegExp(`/${locale}${APP_PATH.LOGIN}`);
}

test.describe("Investment product auth consistency (P1-01)", () => {
  test("unauthenticated investment new redirects to login", async ({
    page,
  }) => {
    await page.goto(`/en${APP_PATH.MONEY_INVESTMENTS_NEW}`, {
      waitUntil: "domcontentloaded",
    });
    await expect(page).toHaveURL(localeLoginPattern("en"), { timeout: 20_000 });
    await expect(page.getByTestId("auth-login")).toBeVisible();
    await expect(page.locator('[data-chrome="product"]')).toHaveCount(0);
  });

  test("unauthenticated investment detail redirects to login", async ({
    page,
  }) => {
    await page.goto(`/en${moneyInvestmentPath(SAMPLE_HOLDING_ID)}`, {
      waitUntil: "domcontentloaded",
    });
    await expect(page).toHaveURL(localeLoginPattern("en"), { timeout: 20_000 });
    await expect(page.getByTestId("auth-login")).toBeVisible();
    await expect(page.locator('[data-chrome="product"]')).toHaveCount(0);
  });

  test("unauthenticated investment operation redirects to login", async ({
    page,
  }) => {
    await page.goto(`/en${moneyInvestmentBuyPath(SAMPLE_HOLDING_ID)}`, {
      waitUntil: "domcontentloaded",
    });
    await expect(page).toHaveURL(localeLoginPattern("en"), { timeout: 20_000 });
    await expect(page.getByTestId("auth-login")).toBeVisible();
    await expect(page.locator('[data-chrome="product"]')).toHaveCount(0);
  });

  test("unauthenticated investment new preserves locale on redirect", async ({
    page,
  }) => {
    await page.goto(`/vi${APP_PATH.MONEY_INVESTMENTS_NEW}`, {
      waitUntil: "domcontentloaded",
    });
    await expect(page).toHaveURL(localeLoginPattern("vi"), { timeout: 20_000 });
    await expect(page.getByTestId("auth-login")).toBeVisible();
  });

  test("public login remains accessible", async ({ page }) => {
    await page.goto(`/en${APP_PATH.LOGIN}`);
    await expect(page).toHaveURL(localeLoginPattern("en"));
    await expect(page.getByTestId("auth-login")).toBeVisible();
    await expect(page.locator('[data-chrome="auth"]')).toBeVisible();
  });

  test("public register remains accessible", async ({ page }) => {
    await page.goto(`/en${APP_PATH.REGISTER}`);
    await expect(page).toHaveURL(new RegExp(`/en${APP_PATH.REGISTER}`));
    await expect(page.getByTestId("auth-register")).toBeVisible();
  });

  test("auth confirm callback remains publicly reachable", async ({ page }) => {
    await page.goto(localeConfirmPath("en"));
    await expect(page.getByTestId("auth-confirm")).toBeVisible();
  });

  test("authenticated investment routes continue normally when credentials exist", async ({
    page,
  }) => {
    const email = process.env.E2E_USER_EMAIL;
    const password = process.env.E2E_USER_PASSWORD;
    test.skip(!email || !password, "E2E credentials not provided");

    await page.goto(`/en${APP_PATH.LOGIN}`);
    await page.getByLabel("Email").fill(email!);
    await page.locator("#login-password").fill(password!);
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page).toHaveURL(/\/en\/(home|together\/onboard)/, {
      timeout: 20_000,
    });
    test.skip(
      page.url().includes(APP_PATH.ONBOARD),
      "E2E user has no household",
    );

    await page.goto(`/en${APP_PATH.MONEY_INVESTMENTS}`, {
      waitUntil: "domcontentloaded",
    });
    await expect(page.getByTestId("money-investments")).toBeVisible();
    await expect(page.locator('[data-chrome="product"]')).toBeVisible();

    await page.goto(`/en${APP_PATH.MONEY_INVESTMENTS_NEW}`, {
      waitUntil: "domcontentloaded",
    });
    await expect(page.getByTestId("money-investments-new")).toBeVisible();
    await expect(page).not.toHaveURL(localeLoginPattern("en"));
  });
});
