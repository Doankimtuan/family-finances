import { test, expect } from "@playwright/test";
import { APP_PATH } from "@/modules/tenancy/application/app-path";

/**
 * Phase G1 — Plan/Goals non-money fixture verification after unlock.
 */
test.describe("Plan goal fixture safety", () => {
  test.describe.configure({ mode: "serial" });
  test.setTimeout(120_000);

  test("allocate and contribute leave balances unchanged", async ({ page }) => {
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
    await expect(
      page.locator("#app-viewport-root").getByTestId("money-hub"),
    ).toBeVisible({
      timeout: 20_000,
    });
    const beforePosition = await page
      .locator("#app-viewport-root")
      .getByTestId("money-real-position-summary")
      .innerText();

    await page.goto("/en/plan/jars");
    const firstJar = page.locator("[data-testid^='jar-card-']").first();
    test.skip((await firstJar.count()) === 0, "No jars for E2E household");
    await firstJar.click();
    await expect(page.getByTestId("plan-jar-detail")).toBeVisible();

    await page.getByTestId("jar-edit-open").click();
    await expect(page.getByTestId("jar-edit-form")).toBeVisible();
    await page.getByTestId("jar-edit-plan-percent").click();
    await page.getByLabel(/Percent of income|Phần trăm/i).fill("12");
    await page.getByTestId("jar-plan-edit").click();

    const monthLocked = page.getByText(/month is locked|tháng này đã khoá/i);
    await Promise.race([
      page
        .getByTestId("jar-edit-form")
        .waitFor({ state: "hidden", timeout: 20_000 }),
      monthLocked.waitFor({ state: "visible", timeout: 20_000 }),
    ]).catch(() => undefined);

    test.skip(
      await monthLocked.isVisible().catch(() => false),
      "Plan period still locked after fixture unlock",
    );
    await expect(page.getByTestId("jar-edit-form")).toBeHidden();

    await page.goto("/en/plan/goals");
    await expect(page.getByTestId("plan-goals")).toBeVisible();
    const goalName = `G1 Goal ${Date.now()}`;
    await page.getByTestId("goal-create-open").click();
    await expect(page.getByTestId("goal-create-form")).toBeVisible();
    const form = page.getByTestId("goal-create-form");
    await form.locator("input").nth(0).fill(goalName);
    await form.locator("input").nth(1).fill("500000");
    await page.getByRole("radio", { name: "Save up" }).click();
    await page.getByTestId("goal-create-submit").click();
    await expect(page.getByTestId("plan-goal-detail")).toBeVisible({
      timeout: 20_000,
    });

    const contributeOpen = page.getByTestId("goal-contribute-open");
    if (await contributeOpen.isVisible().catch(() => false)) {
      await contributeOpen.click();
      await page
        .getByTestId("goal-contribute-amount")
        .locator("input")
        .fill("10000");
      await page.getByTestId("goal-contribute-submit").click();
      await expect(page.getByTestId("goal-contribute-receipt")).toBeVisible({
        timeout: 20_000,
      });
    } else {
      await expect(page.getByText(/needs a funding source/i)).toBeVisible();
    }

    await page.goto("/en/money");
    await expect(
      page.locator("#app-viewport-root").getByTestId("money-hub"),
    ).toBeVisible({
      timeout: 20_000,
    });
    const afterPosition = await page
      .locator("#app-viewport-root")
      .getByTestId("money-real-position-summary")
      .innerText();
    expect(afterPosition).toBe(beforePosition);
  });
});
