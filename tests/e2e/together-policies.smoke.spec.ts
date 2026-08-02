import { test, expect } from "@playwright/test";
import { APP_PATH } from "@/modules/tenancy/application/app-path";

test.describe("Together policies + preferences (ST-E03-003)", () => {
  test("unauthenticated policies redirects to login", async ({ page }) => {
    await page.goto("/en/together/policies");
    await expect(page).toHaveURL(/\/en\/login/);
  });

  test("unauthenticated preferences redirects to login", async ({ page }) => {
    await page.goto("/en/together/preferences");
    await expect(page).toHaveURL(/\/en\/login/);
  });

  test("policies and preferences reachable when E2E credentials exist", async ({
    page,
  }) => {
    const email = process.env.E2E_USER_EMAIL;
    const password = process.env.E2E_USER_PASSWORD;
    test.skip(!email || !password, "E2E credentials not provided");

    await page.goto("/en/login");
    await page.getByLabel("Email").fill(email!);
    await page.locator("#login-password").fill(password!);
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page).toHaveURL(/\/en\/(home|together\/onboard)/, {
      timeout: 20_000,
    });
    test.skip(
      page.url().includes(APP_PATH.ONBOARD),
      "E2E user has no household — complete onboard first",
    );

    await page.goto("/en/together");
    await expect(page.getByTestId("together-policies-link")).toBeVisible();
    await expect(page.getByTestId("together-preferences-link")).toBeVisible();

    await page.getByTestId("together-policies-link").click();
    await expect(page).toHaveURL(/\/en\/together\/policies/);
    await expect(page.getByTestId("together-policies")).toBeVisible();
    await expect(page.getByText(/Overspend policy|Warn/i)).toBeVisible();

    await page.goto("/en/together/preferences");
    await expect(page.getByTestId("together-preferences-page")).toBeVisible();
    await expect(page.getByTestId("account-lifecycle")).toBeVisible();
  });
});
