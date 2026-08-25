import { test, expect } from "@playwright/test";

test.describe("bootstrap smoke", () => {
  test("landing renders brand", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("img", { name: "Family Finance" }),
    ).toBeVisible();
  });
});
