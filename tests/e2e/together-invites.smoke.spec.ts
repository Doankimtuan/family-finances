import { test, expect } from "@playwright/test";
import { APP_PATH } from "@/modules/tenancy/application/app-path";

test.describe("Together invitations", () => {
  test("unauthenticated invitations redirects to login", async ({ page }) => {
    await page.goto(`/en${APP_PATH.INVITATIONS}`);
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
});
