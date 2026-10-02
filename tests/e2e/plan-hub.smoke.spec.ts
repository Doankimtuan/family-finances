import { test, expect } from "@playwright/test";
import { APP_PATH } from "@/modules/tenancy/application/app-path";

test.describe("Plan hub (ST-E05-001)", () => {
  test.describe.configure({ mode: "serial" });

  test("unauthenticated plan redirects to login", async ({ page }) => {
    await page.goto("/en/plan", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/en\/login/, { timeout: 20_000 });
  });

  test("plan overview and destinations when E2E credentials exist", async ({
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
    await expect(page.getByTestId("plan-period-pulse")).toBeVisible();
    await expect(page.getByTestId("plan-summary-planned")).toBeVisible();
    await expect(page.getByTestId("plan-jar-sort")).toBeVisible();
    await expect(page.getByTestId("plan-home-upcoming")).toBeVisible();
    await expect(page.getByTestId("plan-shortcuts")).toBeVisible();
    await expect(page.getByTestId("plan-shortcut-calendar")).toBeVisible();
    await expect(page.getByTestId("plan-entry-goals")).toBeVisible();
    await expect(page.getByTestId("plan-entry-recurring")).toBeVisible();
    await expect(page.getByTestId("plan-shortcut-review")).toBeVisible();
    await expect(page.getByTestId("money-capture")).toBeVisible();
  });
});
