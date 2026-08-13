import { test, expect } from "@playwright/test";
import { APP_PATH } from "@/modules/tenancy/application/app-path";

test.describe("Home three answers (ST-E07-001)", () => {
  test.describe.configure({ mode: "serial" });

  test("unauthenticated home redirects to login", async ({ page }) => {
    await page.goto("/en/home", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/en\/login/, { timeout: 20_000 });
  });

  test("home dashboard chrome when E2E credentials exist", async ({ page }) => {
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

    await page.goto("/en/home");
    await expect(page.getByTestId("home-dashboard")).toBeVisible();
    await expect(page.getByTestId("home-real-position")).toBeVisible();
    await expect(page.getByTestId("ledger-balance")).toBeVisible();
    await expect(page.getByTestId("home-plan-pulse")).toBeVisible();
    await expect(
      page.getByText(
        /A simple plan|Một kế hoạch nhẹ nhàng|Intention envelopes|Phong bì ý định/i,
      ),
    ).toBeVisible();
    await expect(page.getByTestId("home-inbox-cta")).toBeVisible();
    await expect(page.getByTestId("home-health-chip")).toBeVisible();

    await page.getByTestId("home-health-chip").click();
    await expect(page.getByTestId("health-overview")).toBeVisible();
    await expect(page.getByTestId("health-overview-card")).toBeVisible();
    await expect(page.getByTestId("health-back-home")).toBeVisible();
  });
});
