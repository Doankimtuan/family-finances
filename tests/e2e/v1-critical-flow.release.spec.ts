import { expect, test, type Page } from "@playwright/test";
import { HOME_TEST_ID } from "@/modules/home/application/home-constants";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import {
  assertReleaseEnvironment,
  authenticateReleaseAdmin,
  expectNoHorizontalOverflow,
  runReleaseHarness,
} from "./fixtures/v1-release";

const LOCALE_PATH = "/en";
const RELEASE_RUN_ID = Date.now().toString();

function route(path: string): string {
  return `${LOCALE_PATH}${path}`;
}

function attachBrowserDiagnostics(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  page.on("pageerror", (error) =>
    errors.push(`pageerror: ${error.stack ?? error.message}`),
  );
  page.on("requestfailed", (request) => {
    const errorText = request.failure()?.errorText ?? "failed";
    if (errorText !== "net::ERR_ABORTED") {
      errors.push(`request: ${request.url()} — ${errorText}`);
    }
  });
  return errors;
}

test.describe("V1 deterministic critical-flow release smoke", () => {
  test.describe.configure({ mode: "serial" });
  test.setTimeout(180_000);

  const diagnostics = new WeakMap<Page, string[]>();

  test.beforeAll(async () => {
    assertReleaseEnvironment();
    await runReleaseHarness("setup");
  });

  test.afterAll(async () => {
    await runReleaseHarness("cleanup");
  });

  test.beforeEach(async ({ page }) => {
    diagnostics.set(page, attachBrowserDiagnostics(page));
    await authenticateReleaseAdmin(page);
  });

  test.afterEach(async ({ page }, testInfo) => {
    const errors = diagnostics.get(page) ?? [];
    if (errors.length > 0) {
      await testInfo.attach("browser-errors", {
        body: errors.join("\n"),
        contentType: "text/plain",
      });
    }
    expect(errors, errors.join("\n")).toEqual([]);
  });

  test("auth/onboarding, home, household money, and account receipt", async ({
    page,
  }) => {
    await expect(page).toHaveURL(/\/en\/home\/?$/);
    await expect(page.getByTestId(HOME_TEST_ID.DASHBOARD)).toBeVisible();

    await page.goto(route(APP_PATH.MONEY));
    await expect(page.getByTestId("money-hub")).toBeVisible();
    await expect(page.getByTestId("money-real-position-summary")).toBeVisible();
    await expect(page.getByTestId("money-accounts-scan")).toBeVisible();

    await page.getByTestId("money-create-account").click();
    await expect(page.getByTestId("account-add-form")).toBeVisible();
    await page
      .locator("#account-name")
      .fill(`Release account ${RELEASE_RUN_ID}`);
    await page.getByTestId("account-type").getByRole("button").click();
    await page.getByRole("option", { name: /Checking|Thanh toán/i }).click();
    await page.getByTestId("account-opening-balance").fill("123456");
    await page.getByTestId("account-add-submit").click();
    await expect(page.getByTestId("transaction-receipt")).toBeVisible();
    await page
      .getByRole("link", { name: /View account|Xem tài khoản/i })
      .click();
    await expect(page.getByTestId("money-account-detail")).toBeVisible();
  });

  test("personal money and transaction expense/income receipts", async ({
    page,
  }) => {
    await page.goto(route(APP_PATH.MONEY_TRANSACTIONS));
    await expect(page.getByTestId("money-transactions")).toHaveCount(1);
    await page.getByTestId("transactions-add").click();
    await expect(page.getByTestId("money-transaction-add")).toBeVisible();

    await page.getByRole("radio", { name: "Ownership release cash" }).check();
    await page.getByTestId("capture-amount").fill("1000");
    await page
      .getByTestId("capture-note")
      .fill(`Release expense ${RELEASE_RUN_ID}`);
    await page.getByTestId("capture-save").click();
    await expect(page.getByTestId("transaction-receipt")).toBeVisible();
    await expect(page.getByText(/expense|chi phí/i).first()).toBeVisible();

    await page
      .getByRole("button", { name: /Record another|Ghi thêm/i })
      .click();
    await page.getByRole("radio", { name: "Ownership release cash" }).check();
    await page.getByTestId("capture-direction-income").click();
    await page.getByTestId("capture-amount").fill("2000");
    await page
      .getByTestId("capture-note")
      .fill(`Release income ${RELEASE_RUN_ID}`);
    await page.getByTestId("capture-save").click();
    await expect(page.getByTestId("transaction-receipt")).toBeVisible();

    await page.goto(route(APP_PATH.MONEY_TRANSACTIONS));
    await expect(
      page.getByRole("link", { name: `Release expense ${RELEASE_RUN_ID}` }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: `Release income ${RELEASE_RUN_ID}` }),
    ).toBeVisible();
  });

  test("transfer uses the current transaction route and produces neutral receipt", async ({
    page,
  }) => {
    await page.goto(route(APP_PATH.MONEY_ADD), {
      waitUntil: "domcontentloaded",
    });
    await expect(page.getByTestId("money-transaction-add")).toBeVisible({
      timeout: 20_000,
    });
    await page.getByTestId("capture-mode-transfer").click();
    await expect(page.getByTestId("money-transfer-form")).toBeVisible();

    const source = page.locator('input[name="transfer-source"]');
    const destination = page.locator('input[name="transfer-destination"]');
    expect(await source.count()).toBeGreaterThan(1);
    expect(await destination.count()).toBeGreaterThan(1);
    await page
      .locator("label")
      .filter({ hasText: "Ownership release cash" })
      .first()
      .locator('input[name="transfer-source"]')
      .check();
    await page
      .locator("label")
      .filter({ hasText: "Ownership transfer destination" })
      .last()
      .locator('input[name="transfer-destination"]')
      .check();
    await page.getByTestId("transfer-amount").fill("1234");
    await page.getByTestId("transfer-preview-continue").click();
    await expect(page.getByTestId("money-transfer-confirm")).toBeVisible();
    await page.getByTestId("transfer-confirm").click();
    await expect(page.getByTestId("transfer-receipt-neutrality")).toBeVisible();
    await expect(page.getByText(/Not income|Không phải thu/i)).toBeVisible();
  });

  test("savings create, funding, list, detail, and lifecycle state", async ({
    page,
  }) => {
    await page.goto(route(APP_PATH.MONEY_SAVINGS));
    await expect(page.getByTestId("money-savings")).toHaveCount(1);
    await page.getByTestId("savings-add-open").click();
    await expect(page.getByTestId("savings-create-wizard")).toBeVisible();
    await expect(
      page.locator("[data-testid^='savings-package-']").first(),
    ).toBeVisible();
    await page.locator("[data-testid^='savings-package-']").first().click();
    await page.getByTestId("savings-wizard-next").click();
    await page
      .locator("[data-testid^='savings-source-']")
      .filter({ hasText: "Ownership release cash" })
      .click();
    await page.getByTestId("savings-wizard-principal").fill("1000000");
    await page.getByTestId("savings-wizard-next").click();
    await expect(page.getByTestId("savings-review-summary")).toBeVisible();
    await page
      .locator("[data-testid^='savings-payout-account-']")
      .filter({ hasText: "Ownership transfer destination" })
      .click();
    await page.getByTestId("savings-wizard-confirm").click();
    await expect(page).toHaveURL(/\/en\/money\/savings\/[0-9a-f-]+$/, {
      timeout: 20_000,
    });
    await expect(page.getByTestId("savings-identity")).toBeVisible();

    await page.goto(route(APP_PATH.MONEY_SAVINGS));
    const rows = page.locator("[data-testid^='savings-row-']");
    await expect(rows.first()).toBeVisible();
    await rows.first().click();
    await expect(page.getByTestId("savings-identity")).toBeVisible();
    await expect(page.getByTestId("savings-cycle-facts")).toBeVisible();
  });

  test("investment opening position uses quantity times unit price", async ({
    page,
  }) => {
    await page.goto(route(APP_PATH.MONEY_INVESTMENTS));
    await expect(page.getByTestId("investment-overview-client")).toBeVisible();
    const holding = page
      .locator("[data-testid^='investment-position-']")
      .first();
    await expect(holding).toBeVisible();
    await holding.click();
    await expect(page.getByTestId("investment-detail-hero")).toBeVisible();
    await expect(page.getByText(/10 units|10 đơn vị|10/).first()).toBeVisible();
  });

  test("loan and liability representative details", async ({ page }) => {
    await page.goto(route(APP_PATH.MONEY_LOANS));
    await expect(page.getByTestId("money-loans")).toBeVisible();
    const loan = page.locator("[data-testid^='loan-row-']").first();
    await expect(loan).toBeVisible();
    await loan.click();
    await expect(page.getByTestId("loan-detail")).toBeVisible();

    await page.goto(route(APP_PATH.MONEY_DEBTS));
    await expect(page.getByTestId("money-debts")).toBeVisible();
    const debt = page.locator("[data-testid^='debt-row-']").first();
    await expect(debt).toBeVisible();
    await debt.click();
    await expect(page.getByTestId("debt-detail")).toBeVisible();
  });

  test("goals and plan representative pages", async ({ page }) => {
    await page.goto(route(APP_PATH.PLAN));
    await expect(page.getByTestId("plan-hub")).toBeVisible();
    await page.goto(route(APP_PATH.PLAN_GOALS));
    await expect(page.getByTestId("plan-goals")).toBeVisible();
    const goal = page.locator("[data-testid^='goal-card-']").first();
    await expect(goal).toBeVisible();
    await goal.click();
    await expect(page.getByTestId("plan-goal-detail")).toBeVisible();
  });

  test("health renders deterministic source coverage and insights", async ({
    page,
  }) => {
    await page.goto(route(APP_PATH.HEALTH));
    await expect(page.getByTestId("health-overview")).toBeVisible();
    await expect(page.getByTestId("health-overview-card")).toBeVisible();
    await page.getByTestId("health-view-insights").click();
    await expect(page.getByTestId("health-insights")).toBeVisible();
    await expect(page.getByTestId("health-insight-list")).toBeVisible();
    await expect(page.getByTestId("health-scenario-list")).toBeVisible();
  });

  test("Inbox current decision flow resolves a deterministic actionable item", async ({
    page,
  }) => {
    await page.goto(route(APP_PATH.INBOX));
    await expect(page.getByTestId("inbox-queue")).toBeVisible();
    await expect(
      page.getByText(/A few things are ready for you/i),
    ).toBeVisible();
    const item = page
      .locator("[data-testid^='inbox-item-link-']")
      .filter({ hasText: "Ownership release inbox fixture" });
    await expect(item).toBeVisible();
    await item.click();
    await expect(page.getByTestId("inbox-decision-panel")).toBeVisible();
    await expect(page.getByTestId("inbox-jar-select")).toBeVisible();
    await page.getByTestId("inbox-resolve").click();
    await expect(page).toHaveURL(/\/en\/inbox(?:\?|$)/);
    await expect(page.getByTestId("inbox-receipt-jar")).toBeVisible();
  });

  test("critical page test IDs remain unique", async ({ page }) => {
    for (const path of [
      APP_PATH.MONEY,
      APP_PATH.MONEY_TRANSACTIONS,
      APP_PATH.MONEY_SAVINGS,
    ]) {
      await page.goto(route(path));
      const testId =
        path === APP_PATH.MONEY
          ? "ledger-balance"
          : path === APP_PATH.MONEY_TRANSACTIONS
            ? "money-transactions"
            : "money-savings";
      await expect(page.locator(`[data-testid="${testId}"]`)).toHaveCount(1);
    }
    await expectNoHorizontalOverflow(page);
  });

  test("representative pages fit the intentional single-column shell", async ({
    page,
  }) => {
    for (const width of [390, 440, 768, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(route(APP_PATH.MONEY_SAVINGS));
      await expect(page.getByTestId("money-savings")).toBeVisible();
      await expectNoHorizontalOverflow(page);
    }
  });
});
