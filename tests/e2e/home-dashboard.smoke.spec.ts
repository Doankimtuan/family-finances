import { test, expect } from "@playwright/test";
import { HOME_TEST_ID } from "@/modules/home/application/home-constants";
import { APP_PATH } from "@/modules/tenancy/application/app-path";

test.describe("Home decision dashboard", () => {
  test.describe.configure({ mode: "serial" });

  test("unauthenticated home redirects to login", async ({ page }) => {
    await page.goto("/en/home", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/en\/login/, { timeout: 20_000 });
  });

  test("shows the financial pulse and period controls when E2E credentials exist", async ({
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

    await page.goto("/en/home");
    await expect(page.getByTestId(HOME_TEST_ID.DASHBOARD)).toBeVisible();
    await expect(page.getByTestId(HOME_TEST_ID.PERIOD_CONTROL)).toBeVisible();
    const quarterButton = page.getByRole("button", { name: "Quarter" });
    await quarterButton.click();
    await expect(quarterButton).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByTestId(HOME_TEST_ID.PERIOD_CONTENT)).toBeVisible();
    await expect(page).toHaveURL(/period=quarter/);
    await expect(quarterButton).toBeFocused();
    await expect(page.getByTestId(HOME_TEST_ID.PERIOD_CONTENT)).toHaveAttribute(
      "aria-busy",
      "false",
    );
    await expect(page.getByTestId(HOME_TEST_ID.FINANCIAL_PULSE)).toBeVisible();
    await expect(page.getByTestId(HOME_TEST_ID.CAPTURE_ACTION)).toBeVisible();
    await expect(page.getByTestId(HOME_TEST_ID.INBOX_BLOCK)).toBeVisible();
    await expect(page.getByTestId(HOME_TEST_ID.PLAN_PULSE)).toBeVisible();
  });
});
