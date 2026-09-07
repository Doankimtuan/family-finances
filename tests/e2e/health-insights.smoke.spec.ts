import { test, expect } from "@playwright/test";
import { APP_PATH } from "@/modules/tenancy/application/app-path";

test.describe("Health overview and insights (ST-E07-002)", () => {
  test.describe.configure({ mode: "serial" });

  test("unauthenticated health insights redirects to login", async ({
    page,
  }) => {
    await page.goto("/en/health/insights", {
      waitUntil: "domcontentloaded",
    });
    await expect(page).toHaveURL(/\/en\/login/, { timeout: 20_000 });
  });

  test("health overview links to insights when E2E credentials exist", async ({
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

    await page.goto("/en/money");
    const app = page.locator("#app-viewport-root");
    const financialStateBefore = await app
      .getByTestId("money-real-position-summary")
      .getByTestId("ledger-balance")
      .first()
      .innerText();

    await page.goto("/en/health");
    await expect(page.getByTestId("health-overview")).toBeVisible();
    await expect(page.getByTestId("health-overview-card")).toBeVisible();
    await expect(page.getByTestId("health-view-insights")).toBeVisible();

    await page.getByTestId("health-view-insights").click();
    await expect(page.getByTestId("health-insights")).toBeVisible();
    await expect(page.getByTestId("health-insight-list")).toBeVisible();
    await expect(page.getByTestId("health-insight-ai_guardrail")).toBeVisible();
    await expect(page.getByTestId("health-scenario-list")).toBeVisible();
    await expect(
      page.getByText(/must not invent balances|không được bịa số dư/i),
    ).toBeVisible();

    const sourceLink = page.locator("[data-testid^='health-source-']").first();
    await expect(sourceLink).toBeVisible();
    await sourceLink.click();
    await expect(page).not.toHaveURL(/\/health\/insights/);
    await expect(page).toHaveURL(/origin=%2Fhealth%2Finsights&factor=/);
    await page.goBack();
    await expect(page.getByTestId("health-insights")).toBeVisible();

    await page.getByRole("link", { name: "Back to Health" }).click();
    await expect(page.getByTestId("health-overview")).toBeVisible();

    await page.getByRole("link", { name: "Back to Home" }).click();
    await expect(page).toHaveURL(/\/en\/home/);

    await page.goto("/en/money");
    const financialStateAfter = await app
      .getByTestId("money-real-position-summary")
      .getByTestId("ledger-balance")
      .first()
      .innerText();
    expect(financialStateAfter).toBe(financialStateBefore);
  });
});
