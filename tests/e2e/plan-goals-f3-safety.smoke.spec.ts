import { test, expect } from "@playwright/test";
import { APP_PATH } from "@/modules/tenancy/application/app-path";

/**
 * Phase F3 financial-safety happy paths:
 * allocate / reallocate / goal contribute must leave Money reality unchanged.
 */
test.describe("Plan + Goals financial safety (F3)", () => {
  test.describe.configure({ mode: "serial" });
  test.setTimeout(120_000);

  test("allocate, reallocate, contribute leave balances unchanged", async ({
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
    await expect(page.getByTestId("money-hub")).toBeVisible({
      timeout: 20_000,
    });
    const beforePosition = await page
      .getByTestId("money-real-position-summary")
      .innerText();

    // Unlock planning period if ritual shows correction path.
    await page.goto("/en/plan/ritual");
    await expect(page.getByTestId("plan-ritual-page")).toBeVisible();
    const correct = page.getByTestId("ritual-correct");
    if ((await correct.count()) > 0 && (await correct.first().isVisible())) {
      const note = page.getByTestId("ritual-correction-note").locator("input");
      if ((await note.count()) > 0) {
        await note.first().fill("F3 unlock for plan mutation verification");
      }
      await correct.first().click();
      await page.waitForTimeout(1500);
    }

    await page.goto("/en/plan");
    await expect(page.getByTestId("plan-hub")).toBeVisible();
    await expect(page.getByTestId("plan-period-pulse")).toBeVisible();

    await page.goto("/en/plan/jars");
    const firstJar = page.locator("[data-testid^='jar-card-']").first();
    test.skip((await firstJar.count()) === 0, "No jars for E2E household");
    await firstJar.click();
    await expect(page.getByTestId("plan-jar-detail")).toBeVisible();

    await page.getByTestId("jar-plan-edit").click();
    await expect(page.getByTestId("jar-plan-form")).toBeVisible();
    await page.getByLabel(/Percent of income|Phần trăm/i).fill("10");
    await page.getByTestId("jar-plan-save").click();

    const allocateReceipt = page.getByTestId("jar-allocate-receipt");
    const monthLocked = page.getByText(/month is locked|tháng này đã khoá/i);
    await Promise.race([
      allocateReceipt.waitFor({ state: "visible", timeout: 20_000 }),
      monthLocked.waitFor({ state: "visible", timeout: 20_000 }),
    ]).catch(() => undefined);

    test.skip(
      (await monthLocked.isVisible().catch(() => false)) &&
        !(await allocateReceipt.isVisible().catch(() => false)),
      "E2E household plan period remains locked (pending review/approved); mutation happy path blocked by BR-08",
    );

    await expect(allocateReceipt).toBeVisible({ timeout: 5_000 });

    const reallocateOpen = page.getByTestId("jar-reallocate-open");
    if ((await reallocateOpen.count()) > 0) {
      await reallocateOpen.click();
      await expect(page.getByTestId("jar-reallocate-form")).toBeVisible();
      await page
        .getByTestId("jar-reallocate-amount")
        .locator("input")
        .fill("1000");
      await page.getByTestId("jar-reallocate-submit").click();

      const warn = page.getByTestId("jar-reallocate-warn");
      if (await warn.isVisible().catch(() => false)) {
        await warn.locator("input[type=checkbox]").check();
        await page.getByTestId("jar-reallocate-submit").click();
      }

      await expect(page.getByTestId("jar-reallocate-receipt")).toBeVisible({
        timeout: 20_000,
      });
      await expect(
        page.getByText(/Real money unchanged|Tiền thật không đổi/i).first(),
      ).toBeVisible();
      await page.getByTestId("jar-reallocate-receipt-done").click();
    }

    await page.goto("/en/plan/goals");
    await expect(page.getByTestId("plan-goals")).toBeVisible();
    const goalName = `F3 Goal ${Date.now()}`;
    await page.getByTestId("goal-create-open").click();
    await expect(page.getByTestId("goal-create-form")).toBeVisible();
    const form = page.getByTestId("goal-create-form");
    await form.locator("input").nth(0).fill(goalName);
    await form.locator("input").nth(1).fill("500000");
    await page.getByTestId("goal-create-submit").click();
    await expect(page.getByTestId("plan-goal-detail")).toBeVisible({
      timeout: 20_000,
    });

    await page
      .getByTestId("goal-contribute-amount")
      .locator("input")
      .fill("10000");
    await page.getByTestId("goal-contribute-submit").click();
    await expect(page.getByTestId("goal-contribute-receipt")).toBeVisible({
      timeout: 20_000,
    });
    await expect(
      page.getByText(/Real money unchanged|Tiền thật không đổi/i).first(),
    ).toBeVisible();

    await page.getByTestId("goal-pause").click();
    await expect(page.getByTestId("goal-resume")).toBeVisible({
      timeout: 20_000,
    });

    await page.goto("/en/money");
    await expect(page.getByTestId("money-hub")).toBeVisible({
      timeout: 20_000,
    });
    const afterPosition = await page
      .getByTestId("money-real-position-summary")
      .innerText();

    expect(afterPosition).toBe(beforePosition);
  });
});
