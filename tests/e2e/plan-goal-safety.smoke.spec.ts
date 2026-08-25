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
    const app = page.locator("#app-viewport-root");

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

    // Unlock planning period if ritual shows correction path.
    await page.goto("/en/plan/ritual");
    await expect(app.getByTestId("plan-ritual-page")).toBeVisible();
    const correct = app.getByTestId("ritual-correct");
    if ((await correct.count()) > 0 && (await correct.first().isVisible())) {
      const note = app.getByTestId("ritual-correction-note").locator("input");
      if ((await note.count()) > 0) {
        await note.first().fill("F3 unlock for plan mutation verification");
      }
      await correct.first().click();
      await page.waitForTimeout(1500);
    }

    await page.goto("/en/plan");
    await expect(app.getByTestId("plan-hub")).toBeVisible();
    await expect(app.getByTestId("plan-period-pulse")).toBeVisible();

    await page.goto("/en/plan/jars");
    const firstJar = app.locator("[data-testid^='jar-card-']").first();
    test.skip((await firstJar.count()) === 0, "No jars for E2E household");
    await firstJar.click();
    await expect(app.getByTestId("plan-jar-detail")).toBeVisible();

    await app.getByTestId("jar-edit-open").click();
    await expect(app.getByTestId("jar-edit-form")).toBeVisible();
    await app.getByTestId("jar-edit-plan-percent").click();
    await page.getByLabel(/Percent of income|Phần trăm/i).fill("10");
    await app.getByTestId("jar-plan-edit").click();

    const monthLocked = app.getByText(/month is locked|tháng này đã khoá/i);
    await Promise.race([
      app
        .getByTestId("jar-edit-form")
        .waitFor({ state: "hidden", timeout: 20_000 }),
      monthLocked.waitFor({ state: "visible", timeout: 20_000 }),
    ]).catch(() => undefined);

    test.skip(
      await monthLocked.isVisible().catch(() => false),
      "E2E household plan period remains locked (pending review/approved); mutation happy path blocked by BR-08",
    );
    await expect(app.getByTestId("jar-edit-form")).toBeHidden();

    const reallocateOpen = app.getByTestId("jar-reallocate-open");
    if ((await reallocateOpen.count()) > 0) {
      await reallocateOpen.click();
      await expect(app.getByTestId("jar-reallocate-form")).toBeVisible();
      await app.getByTestId("jar-reallocate-amount").fill("1000");
      await app.getByTestId("jar-reallocate-submit").click();

      const warn = app.getByTestId("jar-reallocate-warn");
      if (await warn.isVisible().catch(() => false)) {
        await warn.locator("input[type=checkbox]").check();
        await app.getByTestId("jar-reallocate-submit").click();
      }

      await expect(app.getByTestId("jar-reallocate-receipt")).toBeVisible({
        timeout: 20_000,
      });
      await expect(
        app.getByText(/Real money unchanged|Tiền thật không đổi/i).first(),
      ).toBeVisible();
      await app.getByTestId("jar-reallocate-receipt-done").click();
    }

    await page.goto("/en/plan/goals");
    await expect(app.getByTestId("plan-goals")).toBeVisible();
    const goalName = `F3 Goal ${Date.now()}`;
    await app.getByTestId("goal-create-open").click();
    await expect(app.getByTestId("goal-create-form")).toBeVisible();
    const form = app.getByTestId("goal-create-form");
    await form.locator("input").nth(0).fill(goalName);
    await form.locator("input").nth(1).fill("500000");
    await page.getByRole("radio", { name: "Save up" }).click();
    await app.getByTestId("goal-create-submit").click();
    await expect(app.getByTestId("plan-goal-detail")).toBeVisible({
      timeout: 20_000,
    });

    const contributeOpen = app.getByTestId("goal-contribute-open");
    if (await contributeOpen.isVisible().catch(() => false)) {
      await contributeOpen.click();
      await page
        .getByTestId("goal-contribute-amount")
        .locator("input")
        .fill("10000");
      await app.getByTestId("goal-contribute-submit").click();
      await expect(app.getByTestId("goal-contribute-receipt")).toBeVisible({
        timeout: 20_000,
      });
    } else {
      await expect(app.getByText(/needs a funding source/i)).toBeVisible();
    }

    await app.getByTestId("goal-more-actions").click();
    await app.getByTestId("goal-pause").click();
    await page.getByRole("button", { name: "Pause", exact: true }).click();

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
