import { test, expect } from "@playwright/test";

test.describe("Login + money gates (ST-E02-002)", () => {
  test("login screen renders inside auth chrome", async ({ page }) => {
    await page.goto("/en/login");
    await expect(page.locator('[data-chrome="auth"]')).toBeVisible();
    await expect(page.getByTestId("auth-login")).toBeVisible();
    await expect(page.locator("#app-viewport-root")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
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
    await page.getByLabel("Password").fill("definitely-wrong-password");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText("Could not sign in")).toBeVisible({
      timeout: 15_000,
    });
  });

  test("confirm error UI offers continue to login", async ({ page }) => {
    await page.goto("/en/auth/confirm?status=error&code=invalid");
    await expect(page.getByTestId("auth-confirm")).toBeVisible();
    await expect(page.getByText("Link not valid")).toBeVisible();
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page).toHaveURL(/\/en\/login/);
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
    await page.getByLabel("Password").fill(password!);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/en\/home/, { timeout: 20_000 });
    await expect(page.locator("#app-viewport-root")).toBeVisible();
    await expect(
      page.getByRole("navigation", { name: "Primary" }),
    ).toBeVisible();
  });
});
