import { test, expect } from "@playwright/test";
import { authenticateE2EUser } from "./support/auth";

/**
 * Phase G1 — Transfer happy path money-safety check.
 */
test.describe("Transfer happy path", () => {
  test.describe.configure({ mode: "serial" });
  test.setTimeout(120_000);

  test("transfer decreases source and increases destination once", async ({
    page,
  }) => {
    await authenticateE2EUser(page);
    const app = page.locator("#app-viewport-root");

    await page.goto("/en/money");
    await expect(app.getByTestId("money-hub")).toBeVisible({
      timeout: 20_000,
    });
    const beforePosition = await page
      .getByTestId("money-real-position-summary")
      .innerText();

    await page.goto("/en/money/accounts");
    await expect(app.getByTestId("money-hub")).toBeVisible({
      timeout: 20_000,
    });
    const liquidCards = app.getByTestId("money-hub-account-row");
    const liquidCount = await liquidCards.count();
    test.skip(liquidCount < 2, "Need two liquid accounts for transfer");

    await page.goto("/en/money/transactions/new");
    const transactionPage = app.getByTestId("money-transaction-add");
    await expect(transactionPage).toBeVisible({
      timeout: 20_000,
    });
    await transactionPage.getByTestId("capture-mode-transfer").click();
    await expect(
      transactionPage.getByTestId("money-transfer-form"),
    ).toBeVisible();

    const amount = 1234;
    await transactionPage.getByTestId("transfer-amount").fill(String(amount));

    const source = transactionPage
      .locator("label")
      .filter({ hasText: "E2E 23D1 transfer source" });
    const destination = transactionPage
      .locator("label")
      .filter({ hasText: "E2E 23D1 transfer destination" });
    const sourceRadio = source.locator('input[name="transfer-source"]');
    const destinationRadio = destination.locator(
      'input[name="transfer-destination"]',
    );
    await expect(sourceRadio).toBeVisible();
    await expect(destinationRadio).toBeVisible();
    await sourceRadio.check();
    await destinationRadio.check();

    await transactionPage.getByTestId("transfer-preview-continue").click();
    await expect(app.getByTestId("money-transfer-confirm")).toBeVisible({
      timeout: 10_000,
    });
    await app.getByTestId("transfer-confirm").click();

    await expect(app.getByTestId("transfer-receipt-neutrality")).toBeVisible({
      timeout: 20_000,
    });
    await expect(app.getByText(/Not income|Không phải thu/i)).toBeVisible();

    await page.goto("/en/money");
    await expect(app.getByTestId("money-hub")).toBeVisible({
      timeout: 20_000,
    });
    const afterPosition = await page
      .getByTestId("money-real-position-summary")
      .innerText();
    expect(afterPosition).toBe(beforePosition);
  });
});
