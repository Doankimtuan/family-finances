import { test, expect } from "@playwright/test";
import { APP_PATH } from "@/modules/tenancy/application/app-path";

test.describe("Money debts/savings/loans (Loan domain evolution)", () => {
  test.describe.configure({ mode: "serial" });

  test("unauthenticated debts redirects to login", async ({ page }) => {
    await page.goto("/en/money/debts", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/en\/login/, { timeout: 20_000 });
  });

  test("money hub links to product surfaces when E2E credentials exist", async ({
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

    await page.goto("/en/money");
    await expect(page.getByTestId("money-link-debts")).toBeVisible();
    await expect(page.getByTestId("money-link-savings")).toBeVisible();
    await expect(page.getByTestId("money-link-loans")).toBeVisible();

    await page.getByTestId("money-link-debts").click();
    await expect(page.getByTestId("money-debts")).toBeVisible();
    await expect(
      page.getByText(/never labeled as bank balance|không gắn nhãn số dư/i),
    ).toBeVisible();

    await page.goto("/en/money/savings");
    await expect(page.getByTestId("money-savings")).toBeVisible();

    await page.goto("/en/money/loans");
    await expect(page.getByTestId("money-loans")).toBeVisible();
    await expect(page.getByTestId("loan-add-open")).toBeVisible();

    await page.goto("/en/money/cards");
    await expect(page).toHaveURL(/\/en\/money\/loans/);
  });
});
