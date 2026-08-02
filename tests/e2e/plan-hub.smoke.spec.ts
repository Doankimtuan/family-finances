import { test, expect } from "@playwright/test";
import { APP_PATH } from "@/modules/tenancy/application/app-path";

test.describe("Plan hub (ST-E05-001)", () => {
  test.describe.configure({ mode: "serial" });

  test("unauthenticated plan redirects to login", async ({ page }) => {
    await page.goto("/en/plan", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/en\/login/, { timeout: 20_000 });
  });

  test("plan hub teaching and entries when E2E credentials exist", async ({
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

    await page.goto("/en/plan");
    await expect(page.getByTestId("plan-hub")).toBeVisible();
    await expect(page.getByTestId("plan-teaching")).toBeVisible();
    await expect(page.getByText(/bank balance|số dư ngân hàng/i)).toBeVisible();
    await expect(page.getByTestId("plan-see-jars")).toBeVisible();
    await expect(page.getByTestId("plan-entry-goals")).toBeVisible();
    await expect(page.getByTestId("plan-entry-recurring")).toBeVisible();
    await expect(page.getByTestId("plan-ritual-open")).toBeVisible();
    await expect(page.getByTestId("plan-money-link")).toBeVisible();
  });
});
