import { test, expect } from "@playwright/test";
import { APP_PATH } from "@/modules/tenancy/application/app-path";

test.describe("Money capture (ST-E04-002)", () => {
  test.describe.configure({ mode: "serial" });

  test("unauthenticated capture redirects to login", async ({ page }) => {
    await page.goto("/en/money/transactions/new", {
      waitUntil: "domcontentloaded",
    });
    await expect(page).toHaveURL(/\/en\/login/, { timeout: 20_000 });
  });

  test("money add alias redirects toward capture or login", async ({
    page,
  }) => {
    await page.goto("/en/money/add", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/en\/(login|money\/transactions\/new)/, {
      timeout: 20_000,
    });
  });

  test("capture form when E2E credentials exist", async ({ page }) => {
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

    await page.goto("/en/money/transactions/new");
    await expect(page.getByTestId("money-transaction-add")).toBeVisible();
    await expect(page.getByTestId("money-capture-form")).toBeVisible();
    await expect(page.getByTestId("capture-amount")).toBeVisible();
    await expect(page.getByTestId("capture-direction-expense")).toBeVisible();
    await expect(page.getByTestId("capture-save")).toBeVisible();
  });
});
