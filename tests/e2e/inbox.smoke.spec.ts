import { test, expect } from "@playwright/test";
import { APP_PATH } from "@/modules/tenancy/application/app-path";

test.describe("Inbox review queue (ST-E04-002 / ST-E06-001)", () => {
  test.describe.configure({ mode: "serial" });

  test("unauthenticated inbox redirects to login", async ({ page }) => {
    await page.goto("/en/inbox", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/en\/login/, { timeout: 20_000 });
  });

  test("inbox queue chrome when E2E credentials exist", async ({ page }) => {
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
    await expect(page.getByTestId("inbox-queue")).toBeVisible();
    await expect(
      page
        .getByText(
          /What needs a decision|Needs your attention|Việc nào cần quyết định|Cần bạn chú ý|Review items waiting|Mục cần gắn/i,
        )
        .first(),
    ).toBeVisible();
  });
});
