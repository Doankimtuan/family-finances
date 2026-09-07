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
    const surface = page.locator("#app-viewport-root");
    await expect(
      surface.getByTestId("together-policies-link").first(),
    ).toBeVisible();
    await expect(
      surface.getByTestId("together-preferences-link").first(),
    ).toBeVisible();

    await surface.getByTestId("together-policies-link").first().click();
    await expect(page).toHaveURL(/\/en\/together\/policies/);
    await expect(page.getByTestId("together-policies")).toBeVisible();
    await expect(page.getByTestId("policies-money-none")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /Overspend policy|chi vượt/i }),
    ).toBeVisible();
    await expect(page.getByTestId("together-change-role")).toHaveCount(0);

    await page.goto("/en/together");
    await surface.getByTestId("together-preferences-link").first().click();
    await expect(page).toHaveURL(/\/en\/together\/preferences/);
    await expect(
      page
        .locator("#app-viewport-root")
        .getByTestId("together-preferences-page"),
    ).toBeVisible();
  });
});
