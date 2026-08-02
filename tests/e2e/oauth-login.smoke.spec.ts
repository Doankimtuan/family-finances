import { test, expect } from "@playwright/test";

test.describe("OAuth-first login (ST-E02-004)", () => {
  test("login hierarchy: Google, Apple, divider, email", async ({ page }) => {
    await page.goto("/en/login");
    await expect(page.locator('[data-chrome="auth"]')).toBeVisible();
    await expect(page.getByTestId("auth-login")).toBeVisible();
    await expect(page.locator("#app-viewport-root")).toBeVisible();

    const google = page.getByTestId("oauth-google");
    const apple = page.getByTestId("oauth-apple");
    await expect(google).toBeVisible();
    await expect(apple).toBeVisible();
    await expect(google).toHaveText("Continue with Google");
    await expect(apple).toHaveText("Continue with Apple");
    await expect(page.getByText("Continue with Email")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Primary" })).toHaveCount(
      0,
    );

    // Google appears before Apple in DOM order
    const googleBox = await google.boundingBox();
    const appleBox = await apple.boundingBox();
    expect(googleBox && appleBox && googleBox.y < appleBox.y).toBeTruthy();
  });

  test("OAuth google starts IdP flow or fails closed with Alert", async ({
    page,
  }) => {
    await page.goto("/en/login");
    await page.getByTestId("oauth-google").click();
    await expect
      .poll(
        async () => {
          const alertVisible = await page
            .getByText("Could not sign in")
            .isVisible()
            .catch(() => false);
          const leftLogin = !page.url().includes("/en/login");
          return alertVisible || leftLogin;
        },
        { timeout: 15_000 },
      )
      .toBe(true);
  });
});
