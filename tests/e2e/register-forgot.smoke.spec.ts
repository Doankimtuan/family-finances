import { test, expect } from "@playwright/test";

test.describe("Register + forgot password (ST-E02-003)", () => {
  test("register screen renders inside auth chrome", async ({ page }) => {
    await page.goto("/en/register");
    await expect(page.locator('[data-chrome="auth"]')).toBeVisible();
    await expect(page.getByTestId("auth-register")).toBeVisible();
    await expect(page.locator("#app-viewport-root")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.locator("#register-password")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Create account" }),
    ).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Primary" })).toHaveCount(
      0,
    );
  });

  test("forgot-password screen renders inside auth chrome", async ({
    page,
  }) => {
    await page.goto("/en/forgot-password");
    await expect(page.locator('[data-chrome="auth"]')).toBeVisible();
    await expect(page.getByTestId("auth-forgot-password")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Send reset link" }),
    ).toBeVisible();
    await expect(
      page.getByText("Back to log in", { exact: true }),
    ).toBeVisible();
  });

  test("login links to register and forgot-password", async ({ page }) => {
    await page.goto("/en/login");
    await page.getByRole("link", { name: "Create account" }).click();
    await expect(page).toHaveURL(/\/en\/register/);
    await expect(page.getByTestId("auth-register")).toBeVisible();

    await page.goto("/en/login");
    await page.getByRole("link", { name: "Forgot password?" }).click();
    await expect(page).toHaveURL(/\/en\/forgot-password/);
    await expect(page.getByTestId("auth-forgot-password")).toBeVisible();
  });

  test("register links back to login", async ({ page }) => {
    await page.goto("/en/register");
    await page.getByRole("link", { name: "Log in" }).click();
    await expect(page).toHaveURL(/\/en\/login/);
  });

  test("forgot-password shows Alert when Auth unconfigured or fails", async ({
    page,
  }) => {
    await page.goto("/en/forgot-password");
    await page.getByLabel("Email").fill("nobody@example.com");
    await page.getByRole("button", { name: "Send reset link" }).click();
    // Configured: toast success; unconfigured: danger alert.
    await expect(
      page
        .getByText("Could not send reset link")
        .or(page.getByText("Reset link sent. Check your email.")),
    ).toBeVisible({ timeout: 15_000 });
  });
});
