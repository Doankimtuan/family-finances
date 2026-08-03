import { test, expect } from "@playwright/test";
import { APP_PATH } from "@/modules/tenancy/application/app-path";

test.describe("Inbox decisions (ST-E06-002)", () => {
  test.describe.configure({ mode: "serial" });

  test("unauthenticated detail redirects to login", async ({ page }) => {
    await page.goto("/en/inbox/550e8400-e29b-41d4-a716-446655440000", {
      waitUntil: "domcontentloaded",
    });
    await expect(page).toHaveURL(/\/en\/login/, { timeout: 20_000 });
  });

  test("detail decision chrome when E2E credentials and items exist", async ({
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

    await page.goto("/en/inbox");
    const firstLink = page.locator("[data-testid^='inbox-item-link-']").first();
    test.skip((await firstLink.count()) === 0, "No pending inbox items");

    await firstLink.click();
    await expect(page.getByTestId("inbox-decision-panel")).toBeVisible();
    await expect(page.getByTestId("inbox-dismiss")).toBeVisible();

    const resolve = page.getByTestId("inbox-resolve");
    if ((await resolve.count()) > 0) {
      await expect(page.getByText(/Active jar|hũ Active/i)).toBeVisible();
    }
  });
});
