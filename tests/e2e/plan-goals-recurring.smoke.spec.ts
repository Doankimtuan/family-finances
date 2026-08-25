import { test, expect } from "@playwright/test";
import { APP_PATH } from "@/modules/tenancy/application/app-path";

test.describe("Plan goals & recurring (ST-E05-003)", () => {
  test.describe.configure({ mode: "serial" });

  test("unauthenticated goals redirects to login", async ({ page }) => {
    await page.goto("/en/plan/goals", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/en\/login/, { timeout: 20_000 });
  });

  test("unauthenticated recurring redirects to login", async ({ page }) => {
    await page.goto("/en/plan/recurring", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/en\/login/, { timeout: 20_000 });
  });

  test("goals and recurring screens when E2E credentials exist", async ({
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

    const surface = page.locator("#app-viewport-root");
    await page.goto("/en/plan/goals");
    await expect(surface.getByTestId("plan-goals")).toBeVisible();
    await expect(surface.getByTestId("goal-create-open")).toBeVisible();
    await expect(
      surface
        .getByText(/intention|ý định|bank balance|số dư ngân hàng/i)
        .first(),
    ).toBeVisible();

    await page.goto("/en/plan/recurring");
    await expect(surface.getByTestId("plan-recurring")).toBeVisible();
    await expect(surface.getByTestId("recurring-create-open")).toBeVisible();
    await expect(surface.getByText(/Suggest|Gợi ý/i).first()).toBeVisible();
  });
});
