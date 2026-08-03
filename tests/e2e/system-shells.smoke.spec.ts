import { test, expect } from "@playwright/test";

test.describe("System shells (ST-E08-001)", () => {
  test("error shell renders retry and home", async ({ page }) => {
    await page.goto("/en/error", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("system-error")).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByTestId("system-error-retry")).toBeVisible();
    await expect(page.getByTestId("system-error-home")).toBeVisible();
  });

  test("offline shell explains fail-closed mutations", async ({ page }) => {
    await page.goto("/en/offline", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("system-offline")).toBeVisible({
      timeout: 20_000,
    });
    await expect(
      page.getByText(/offline writes|ghi ngoại tuyến/i),
    ).toBeVisible();
    await expect(page.getByTestId("system-offline-retry")).toBeVisible();
    await expect(page.getByTestId("system-offline-readonly")).toBeVisible();
  });

  test("permission shell explains partner vs admin", async ({ page }) => {
    await page.goto("/en/permission?reason=admin", {
      waitUntil: "domcontentloaded",
    });
    await expect(page.getByTestId("system-permission")).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByTestId("system-permission-together")).toBeVisible();
    await expect(page.getByText(/Admin role|vai Admin/i)).toBeVisible();
  });

  test("maintenance shell is terminal and calm", async ({ page }) => {
    await page.goto("/en/maintenance", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("system-maintenance")).toBeVisible({
      timeout: 20_000,
    });
    await expect(
      page.getByText(/Under maintenance|Đang bảo trì/i),
    ).toBeVisible();
  });
});
