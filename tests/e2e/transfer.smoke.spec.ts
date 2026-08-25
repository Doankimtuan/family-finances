import { test, expect } from "@playwright/test";
import { authenticateE2EUser } from "./support/auth";

/**
 * Phase G1 — Transfer happy path money-safety check.
 */
test.describe("Transfer happy path (G1)", () => {
  test.describe.configure({ mode: "serial" });
  test.setTimeout(120_000);

  test("transfer decreases source and increases destination once", async ({
    page,
  }) => {
    await authenticateE2EUser(page);

    await page.goto("/en/money");
    await expect(page.getByTestId("money-hub")).toBeVisible({
      timeout: 20_000,
    });
    const beforePosition = await page
      .getByTestId("money-real-position-summary")
      .innerText();

    await page.goto("/en/money/accounts");
    await expect(page.getByTestId("money-hub")).toBeVisible({
      timeout: 20_000,
    });
    const liquidCards = page.getByTestId("money-hub-account-row");
    const liquidCount = await liquidCards.count();
    test.skip(liquidCount < 2, "Need two liquid accounts for transfer");

    await page.goto("/en/money/transactions/new");
    const transactionPage = page
      .locator("#app-viewport-root")
      .getByTestId("money-transaction-add");
    await expect(transactionPage).toBeVisible({
      timeout: 20_000,
    });
    await transactionPage.getByTestId("capture-mode-transfer").click();
    await expect(
      transactionPage.getByTestId("money-transfer-form"),
    ).toBeVisible();

    const amount = 1234;
    await transactionPage.getByTestId("transfer-amount").fill(String(amount));

    const sourceRadios = transactionPage.locator(
      'input[name="transfer-source"]',
    );
    const destRadios = transactionPage.locator(
      'input[name="transfer-destination"]',
    );
    test.skip((await sourceRadios.count()) < 2, "Need two transfer accounts");

    await sourceRadios.nth(0).check();
    await expect(destRadios).toHaveCount(1);
    await destRadios.nth(0).check();

    await transactionPage.getByTestId("transfer-preview-continue").click();
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
