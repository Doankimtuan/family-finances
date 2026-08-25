import { test, expect } from "@playwright/test";
import { HOME_TEST_ID } from "@/modules/home/application/home-constants";
import { APP_PATH } from "@/modules/tenancy/application/app-path";

const HOME_VIEWPORTS = [
  { width: 390, height: 844 },
  { width: 440, height: 956 },
  { width: 768, height: 1024 },
  { width: 1280, height: 720 },
] as const;

test.describe("Home decision dashboard", () => {
  test.describe.configure({ mode: "serial" });

  test("unauthenticated home redirects to login", async ({ page }) => {
    await page.goto("/en/home", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/en\/login/, { timeout: 20_000 });
  });

  for (const viewport of HOME_VIEWPORTS) {
    test(`keeps transaction capture visible in the initial ${viewport.width}px viewport`, async ({
      page,
    }) => {
      const email = process.env.E2E_USER_EMAIL;
      const password = process.env.E2E_USER_PASSWORD;
      test.skip(!email || !password, "E2E credentials not provided");

      await page.setViewportSize(viewport);
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

      const captureAction = page.getByTestId(HOME_TEST_ID.CAPTURE_ACTION);
      await expect(captureAction).toBeVisible();
      await expect(captureAction).toBeInViewport();
      await expect(captureAction).toHaveText("Add transaction");
    });
  }

  test("shows the financial pulse and period controls when E2E credentials exist", async ({
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

    await page.goto("/en/home");
    await expect(page.getByTestId(HOME_TEST_ID.DASHBOARD)).toBeVisible();
    await expect(
      page.locator('[data-header-variant="contextual"]'),
    ).toBeVisible();
    await expect(page.getByTestId(HOME_TEST_ID.PERIOD_CONTROL)).toBeVisible();
    const quarterButton = page.getByRole("button", { name: "Quarter" });
    await quarterButton.focus();
    await quarterButton.press("Enter");
    await expect(quarterButton).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByTestId(HOME_TEST_ID.PERIOD_CONTENT)).toBeVisible();
    await expect(page).toHaveURL(/period=quarter/);
    await expect(quarterButton).toBeFocused();
    const monthButton = page.getByRole("button", { name: "Month" });
    await monthButton.focus();
    await monthButton.press("Enter");
    await expect(page).toHaveURL(/\/en\/home(?:\?|$)/);
    await expect(monthButton).toBeFocused();
    await expect(page.getByTestId(HOME_TEST_ID.PERIOD_CONTENT)).toHaveAttribute(
      "aria-busy",
      "false",
    );
    await expect(page.getByTestId(HOME_TEST_ID.FINANCIAL_PULSE)).toBeVisible();
    const captureAction = page.getByTestId(HOME_TEST_ID.CAPTURE_ACTION);
    await expect(captureAction).toBeVisible();
    await expect(captureAction).toHaveCount(1);
    await expect(page.getByText("What’s included")).toBeVisible();
    await expect(page.getByTestId(HOME_TEST_ID.INBOX_BLOCK)).toBeVisible();
    await expect(page.getByTestId(HOME_TEST_ID.PLAN_PULSE)).toBeVisible();
    await expect(
      page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth,
      ),
    ).resolves.toBe(true);
  });
});
