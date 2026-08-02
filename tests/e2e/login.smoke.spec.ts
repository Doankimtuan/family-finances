import { test, expect } from "@playwright/test";
import {
  AUTH_CONFIRM_ERROR_CODE,
  AUTH_CONFIRM_QUERY,
  AUTH_CONFIRM_STATUS,
  localeConfirmPath,
} from "@/modules/tenancy/application/auth-constants";

test.describe("Login + money gates (ST-E02-002)", () => {
  test("login screen renders inside auth chrome", async ({ page }) => {
    await page.goto("/en/login");
    await expect(page.locator('[data-chrome="auth"]')).toBeVisible();
    await expect(page.getByTestId("auth-login")).toBeVisible();
    await expect(page.locator("#app-viewport-root")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.locator("#login-password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Log in" })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Primary" })).toHaveCount(
      0,
    );
  });

  test("unauthenticated money path redirects to login", async ({ page }) => {
    await page.goto("/en/money");
    await expect(page).toHaveURL(/\/en\/login/);
    await expect(page.getByTestId("auth-login")).toBeVisible();
  });

  test("invalid credentials show Alert (Auth reachable)", async ({ page }) => {
    await page.goto("/en/login");
    await page.getByLabel("Email").fill("nobody@example.com");
    await page.locator("#login-password").fill("definitely-wrong-password");
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page.getByText("Could not sign in")).toBeVisible({
      timeout: 15_000,
    });
  });

  test("confirm error UI offers continue to login", async ({ page }) => {
    const qs = new URLSearchParams({
      [AUTH_CONFIRM_QUERY.STATUS]: AUTH_CONFIRM_STATUS.ERROR,
      [AUTH_CONFIRM_QUERY.CODE]: AUTH_CONFIRM_ERROR_CODE.INVALID,
    });
    await page.goto(`${localeConfirmPath("en")}?${qs.toString()}`);
    await expect(page.getByTestId("auth-confirm")).toBeVisible();
    await expect(page.getByText("Link not valid")).toBeVisible();
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page).toHaveURL(/\/en\/login/);
  });

  test("bare confirm path fails closed instead of infinite loading", async ({
    page,
  }) => {
    await page.goto(localeConfirmPath("vi"));
    await expect(page.getByTestId("auth-confirm")).toBeVisible();
    await expect(page.getByText("Liên kết không hợp lệ")).toBeVisible();
    await expect(page.getByText("Đang xác nhận liên kết")).toHaveCount(0);
  });

  test("login happy path when E2E credentials are provided", async ({
    page,
  }) => {
    const email = process.env.E2E_USER_EMAIL;
    const password = process.env.E2E_USER_PASSWORD;
    test.skip(
      !email || !password,
      "Set E2E_USER_EMAIL and E2E_USER_PASSWORD for login happy path",
    );

    await page.goto("/en/login");
    await page.getByLabel("Email").fill(email!);
    await page.locator("#login-password").fill(password!);
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page).toHaveURL(/\/en\/(home|together\/onboard)/, {
      timeout: 20_000,
    });
    await expect(page.locator("#app-viewport-root")).toBeVisible();
    if (page.url().includes("/home")) {
      await expect(
        page.getByRole("navigation", { name: "Primary" }),
      ).toBeVisible();
    } else {
      await expect(page.getByTestId("onboard-wizard")).toBeVisible();
    }
  });
});
