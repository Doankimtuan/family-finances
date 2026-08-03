import { test, expect } from "@playwright/test";
import { APP_PATH } from "@/modules/tenancy/application/app-path";

test.describe("Plan Month Ritual (ST-E05-004)", () => {
  test.describe.configure({ mode: "serial" });

  test("unauthenticated ritual redirects to login", async ({ page }) => {
    await page.goto("/en/plan/ritual", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/en\/login/, { timeout: 20_000 });
  });

  test("ritual screen when E2E credentials exist", async ({ page }) => {
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

    await page.goto("/en/plan/ritual");
    await expect(page.getByTestId("plan-ritual-page")).toBeVisible();
    await expect(page.getByTestId("plan-ritual")).toBeVisible();
    await expect(page.getByTestId("ritual-preview")).toBeVisible();
    await expect(
      page.getByText(/Assisted|Assisted|ý định|intention/i),
    ).toBeVisible();
    await expect(page.getByTestId("ritual-preview-cta")).toBeVisible();
  });
});
