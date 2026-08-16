import { test, expect } from "@playwright/test";
import { APP_PATH } from "@/modules/tenancy/application/app-path";

test.describe("Plan jars (ST-E05-002)", () => {
  test.describe.configure({ mode: "serial" });

  test("unauthenticated jars redirects to login", async ({ page }) => {
    await page.goto("/en/plan/jars", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/en\/login/, { timeout: 20_000 });
  });

  test("jars list and detail when E2E credentials exist", async ({ page }) => {
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

    await page.goto("/en/plan/jars");
    await expect(page.getByTestId("plan-jars")).toBeVisible();
    await expect(
      page.getByText(/allocation targets|đích phân bổ/i),
    ).toBeVisible();
    await expect(page.getByTestId("jar-create-open")).toBeVisible();

    const firstCard = page.locator("[data-testid^='jar-card-']").first();
    test.skip(
      (await firstCard.count()) === 0,
      "No jars seeded for E2E household",
    );
    await firstCard.click();
    await expect(page.getByTestId("plan-jar-detail")).toBeVisible();
    await expect(page.getByTestId("intention-amount").first()).toBeVisible();
    await expect(page.getByTestId("jar-state-badge")).toBeVisible();
    await expect(page.getByTestId("jar-monthly-review-info")).toBeVisible();
    await expect(page.getByTestId("jar-ritual-lock")).toHaveCount(0);
    await expect(page.getByTestId("jar-plan-edit")).toBeVisible();
    await expect(page.getByText(/bank balance|số dư ngân hàng/i).first()).toBeVisible();
  });
});
