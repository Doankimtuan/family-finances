import { test, expect } from "@playwright/test";
import { APP_PATH } from "@/modules/tenancy/application/app-path";

test.describe("Money hub + accounts (ST-E04-001)", () => {
  // Avoid parallel compile races against a shared dev server on first hit.
  test.describe.configure({ mode: "serial" });

  test("unauthenticated money redirects to login", async ({ page }) => {
    await page.goto("/en/money", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/en\/login/, { timeout: 20_000 });
  });

  test("unauthenticated accounts index redirects toward login", async ({
    page,
  }) => {
    await page.goto("/en/money/accounts", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/en\/login/, { timeout: 20_000 });
  });

  test("money hub create account when E2E credentials exist", async ({
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
      "E2E user has no household",
    );

    const app = page.locator("#app-viewport-root");
    await page.goto("/en/money");
    await expect(app.getByTestId("money-hub")).toBeVisible();
    await expect(
      page
        .getByTestId("money-real-position-summary")
        .getByTestId("ledger-balance"),
    ).toBeVisible();
    await expect(page.getByTestId("money-see-activity")).toBeVisible();
    await expect(
      page
        .getByTestId("money-real-position-summary")
        .getByTestId("ledger-balance"),
    ).toBeVisible();
    await expect(page.getByTestId("money-accounts-scan")).toBeVisible();

    await page.getByTestId("money-create-account").click();
    await expect(page.getByTestId("account-add-form")).toBeVisible();
    await page.getByTestId("account-type").click();
    await page.getByRole("option", { name: "Checking" }).click();
    await expect(page.getByTestId("account-opening-balance")).toBeVisible();
    await page.getByTestId("account-type").click();
    await page.getByRole("option", { name: "Credit card" }).click();
    await expect(
      page.getByTestId("account-credit-card-settings"),
    ).toBeVisible();
    await expect(page.getByTestId("account-credit-limit")).toBeVisible();

    await page.goto("/en/money/accounts");
    await expect(page).toHaveURL(/\/en\/money\/?$/);
    await expect(app.getByTestId("money-hub")).toBeVisible();
  });
});
