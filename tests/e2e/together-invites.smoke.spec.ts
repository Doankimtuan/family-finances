import { test, expect } from "@playwright/test";
import { APP_PATH } from "@/modules/tenancy/application/app-path";

test.describe("Together members + invitations (ST-E03-002)", () => {
  test("unauthenticated invitations redirects to login", async ({ page }) => {
    await page.goto("/en/together/invitations");
    await expect(page).toHaveURL(/\/en\/login/);
  });

  test("invite accept invalid token shows fail-closed UI", async ({ page }) => {
    await page.goto("/en/invite/not-a-valid-uuid");
    await expect(page.getByTestId("invite-accept")).toBeVisible();
    await expect(
      page.getByText(/Invitation not found|not valid/i),
    ).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Primary" })).toHaveCount(
      0,
    );
  });

  test("together members hub when E2E credentials exist", async ({ page }) => {
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
      "E2E user has no household — complete onboard first",
    );

    await page.goto("/en/together");
    await expect(page.getByTestId("together-members-page")).toBeVisible();
    await expect(page.getByTestId("together-members")).toBeVisible();
    await expect(page.getByTestId("together-invite-cta")).toBeVisible();

    await page.getByTestId("together-invite-cta").click();
    await expect(page).toHaveURL(/\/en\/together\/invitations/);
    await expect(page.getByTestId("together-invitations")).toBeVisible();
    await expect(page.getByTestId("invite-send")).toBeVisible();
  });
});
