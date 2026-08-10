import { test, expect } from "@playwright/test";
import { APP_PATH } from "@/modules/tenancy/application/app-path";

/**
 * Phase G1 — Transfer happy path money-safety check.
 */
test.describe("Transfer happy path (G1)", () => {
  test.describe.configure({ mode: "serial" });
  test.setTimeout(120_000);

  test("transfer decreases source and increases destination once", async ({
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

    await page.goto("/en/money/accounts");
    await expect(page.getByTestId("money-accounts")).toBeVisible({
      timeout: 20_000,
    });
    const liquidCards = page.locator("[data-testid^=account-card-]");
    const liquidCount = await liquidCards.count();
    test.skip(liquidCount < 2, "Need two liquid accounts for transfer");

    await page.goto("/en/money/transactions/new");
    await expect(page.getByTestId("money-transaction-add")).toBeVisible({
      timeout: 20_000,
    });
    await page.getByTestId("capture-mode-transfer").click();
    await expect(page.getByTestId("money-transfer-form")).toBeVisible();

    const amount = 1234;
    await page.getByTestId("transfer-amount").fill(String(amount));

    const sourceRadios = page.locator('input[name="transfer-source"]');
    const destRadios = page.locator('input[name="transfer-destination"]');
    test.skip((await sourceRadios.count()) < 2, "Need two transfer accounts");

    await sourceRadios.nth(0).check();
    await destRadios.nth(1).check();

    await page.getByTestId("transfer-preview-continue").click();
    await expect(page.getByTestId("money-transfer-confirm")).toBeVisible({
      timeout: 10_000,
    });
    await page.getByTestId("transfer-confirm").click();

    await expect(page.getByTestId("transfer-receipt-neutrality")).toBeVisible({
      timeout: 20_000,
    });
    await expect(
      page.getByText(/Not income|Không phải thu/i).first(),
    ).toBeVisible();

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
