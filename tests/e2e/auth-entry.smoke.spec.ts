import { test, expect } from "@playwright/test";

test.describe("Splash + Welcome (ST-E02-001)", () => {
  test("landing Open app goes to Welcome, not home", async ({ page }) => {
    await page.goto("/en");
    await page.getByRole("button", { name: "Open app" }).click();
    await expect(page).toHaveURL(/\/en\/welcome$/);
    await expect(page.getByTestId("auth-welcome")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Welcome to ViNha" }),
    ).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Primary" })).toHaveCount(
      0,
    );
  });

  test("unauthenticated locale root keeps the public entry flow", async ({
    page,
  }) => {
    await page.goto("/vi");
    await expect(
      page.getByRole("button", { name: "Mở ứng dụng" }),
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
    await expect(page.getByRole("heading", { name: "ViNha" })).toBeVisible();
    await expect(page).toHaveURL(/\/en\/welcome$/, { timeout: 15_000 });
    await expect(page.getByTestId("auth-welcome")).toBeVisible();
  });
});
