import { test, expect } from "@playwright/test";
import { APP_PATH } from "@/modules/tenancy/application/app-path";

test.describe("Inbox queue (ST-E06-001)", () => {
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
      page.getByText(/What needs a decision|Việc nào cần quyết định/i),
    ).toBeVisible();

    const list = page.getByTestId("inbox-queue-list");
    if ((await list.count()) > 0) {
      await expect(page.getByTestId("inbox-kind-filter")).toBeVisible();
      await expect(page.getByTestId("inbox-search")).toBeVisible();
      await expect(page.getByTestId("inbox-partner-note")).toBeVisible();
      await expect(page.getByTestId("inbox-filter-all")).toBeVisible();

      const firstLink = page
        .locator("[data-testid^='inbox-item-link-']")
        .first();
      if ((await firstLink.count()) > 0) {
        await firstLink.click();
        await expect(page.getByTestId("inbox-detail")).toBeVisible();
        await expect(page.getByTestId("inbox-decision-panel")).toBeVisible();
        await expect(page.getByTestId("inbox-dismiss")).toBeVisible();
        await expect(page.getByTestId("inbox-partner-equal")).toBeVisible();
      }
    }
  });
});
