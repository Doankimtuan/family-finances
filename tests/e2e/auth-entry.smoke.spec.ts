import { test, expect } from "@playwright/test";

test.describe("Splash + Welcome (ST-E02-001)", () => {
  test("locale root is the Welcome screen, not a pass-through landing", async ({
    page,
  }) => {
    await page.goto("/en");
    await expect(page).toHaveURL(/\/en$/);
    await expect(page.getByTestId("auth-welcome")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Create account" }),
    ).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Primary" })).toHaveCount(
      0,
    );
  });

  test("unauthenticated locale root keeps the public entry flow", async ({
    page,
  }) => {
    await page.goto("/vi");
    await expect(page.getByTestId("auth-welcome")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Tạo tài khoản" }),
    ).toBeVisible();
  });

  test("Welcome exposes login and register CTAs", async ({ page }) => {
    await page.goto("/en/welcome");
    await expect(page.getByRole("button", { name: "Log in" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Create account" }),
    ).toBeVisible();
  });

  test("Splash shows brand then lands on Welcome when signed out", async ({
    page,
  }) => {
    await page.goto("/en/splash");
    await expect(page.getByTestId("auth-splash")).toBeVisible();
    await expect(
      page.getByRole("img", { name: "Family Finance" }),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/en\/welcome$/, { timeout: 15_000 });
    await expect(page.getByTestId("auth-welcome")).toBeVisible();
  });
});
