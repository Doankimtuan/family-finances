import { test, expect } from "@playwright/test";
import { APP_PATH } from "@/modules/tenancy/application/app-path";

test.describe("Onboard wizard chrome (ST-E03-001)", () => {
  test("unauthenticated onboard redirects to login", async ({ page }) => {
    await page.goto(`/en${APP_PATH.ONBOARD}`);
    await expect(page).toHaveURL(/\/en\/login/);
    await expect(page.getByTestId("auth-login")).toBeVisible();
  });

  test("onboard route stays in auth chrome without BottomNav when reachable", async ({
    page,
  }) => {
    const email = process.env.E2E_USER_EMAIL;
    const password = process.env.E2E_USER_PASSWORD;
    test.skip(
      !email || !password,
      "Set E2E_USER_EMAIL and E2E_USER_PASSWORD to exercise onboard chrome",
    );

    await page.goto("/en/login");
    await page.getByLabel("Email").fill(email!);
    await page.locator("#login-password").fill(password!);
    await page.getByRole("button", { name: "Log in" }).click();

    // Existing E2E users may already have a household → home; new ones → onboard.
    await expect(page).toHaveURL(/\/en\/(home|together\/onboard)/, {
      timeout: 20_000,
    });

    if (page.url().includes(APP_PATH.ONBOARD)) {
      await expect(page.locator('[data-chrome="auth"]')).toBeVisible();
      await expect(page.getByTestId("onboard-wizard")).toBeVisible();
      await expect(
        page.getByRole("navigation", { name: "Primary" }),
      ).toHaveCount(0);
      await expect(page.getByText(/Step 1 of 3/i)).toBeVisible();
      await page.getByLabel("Household name").fill("E2E Home");
      await page.getByTestId("onboard-next").click();
      await expect(page.getByText(/Step 2 of 3/i)).toBeVisible();
      await page.getByTestId("onboard-next").click();
      await expect(page.getByText(/Step 3 of 3/i)).toBeVisible();
      await expect(page.getByTestId("onboard-finish")).toBeVisible();
    }
  });
});
