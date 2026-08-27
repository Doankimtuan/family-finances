import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { moneySavingsPath } from "@/modules/tenancy/application/app-path";

const FIXTURE_PATH = "output/playwright/savings-lifecycle-fixture.json";
const PRINCIPAL = "1000000";
const APP_SURFACE_SELECTOR = "#app-viewport-root";

type Fixture = {
  providers: { BANK: string; PLATFORM: string };
  packages: { BANK: string; PLATFORM: string };
  accounts: { settlementAccountId: string };
  fixtures: Record<string, { savingId: string; cycleId: string }>;
};

function fixture(): Fixture {
  return JSON.parse(readFileSync(FIXTURE_PATH, "utf8")) as Fixture;
}

function surface(page: Page) {
  return page.locator(APP_SURFACE_SELECTOR);
}

async function login(page: Page) {
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
    page.url().includes("/together/onboard"),
    "E2E user has no household",
  );
}

async function createSaving(
  page: Page,
  providerId: string,
  packageId: string,
  historical = false,
) {
  await page.goto("/en/money/savings/new");
  await expect(
    surface(page).getByTestId("savings-create-wizard"),
  ).toBeVisible();
  await surface(page).getByTestId(`savings-provider-${providerId}`).click();
  await surface(page).getByTestId(`savings-package-${packageId}`).click();
  if (historical) {
    await page.getByLabel("Saving name").fill("Existing family saving");
  }
  await surface(page).getByTestId("savings-wizard-next").click();
  await page.locator("#savings-principal").fill(PRINCIPAL);
  if (historical) {
    const start = new Date();
    start.setMonth(start.getMonth() - 3);
    const dateGroup = page.getByRole("group", { name: "Start date" });
    await dateGroup
      .getByRole("spinbutton", { name: "month, Start date" })
      .fill(String(start.getMonth() + 1));
    await dateGroup
      .getByRole("spinbutton", { name: "day, Start date" })
      .fill(String(start.getDate()));
    await dateGroup
      .getByRole("spinbutton", { name: "year, Start date" })
      .fill(String(start.getFullYear()));
    await dateGroup
      .getByRole("spinbutton", { name: "year, Start date" })
      .press("Tab");
    await surface(page).getByTestId("savings-create-mode-historical").click();
    await expect(
      surface(page).locator('[data-testid^="savings-source-"]'),
    ).toHaveCount(0);
    await expect(surface(page).getByText("No source account")).toBeVisible();
    await expect(
      surface(page).getByText("Interest accrued through today"),
    ).toBeVisible();
  }
  await surface(page).getByTestId("savings-wizard-next").click();
  await expect(
    surface(page).getByTestId("savings-review-summary"),
  ).toBeVisible();
  await surface(page).getByTestId("savings-wizard-confirm").click();
  await expect(surface(page).getByTestId("savings-detail")).toBeVisible({
    timeout: 30_000,
  });
  await expect(
    surface(page).getByTestId("savings-cycle-history"),
  ).toBeVisible();
  if (historical) {
    await expect(
      surface(page).getByTestId("savings-added-between-periods"),
    ).toHaveText("Added mid-cycle");
    await expect(
      surface(page).getByTestId("savings-early-withdraw"),
    ).toBeVisible();
    await expect(
      surface(page)
        .getByTestId("savings-financial-activity")
        .locator('[data-testid^="transaction-row-"]'),
    ).toHaveCount(0);
  }
}

async function settle(page: Page, savingId: string, strategy: string) {
  await page.goto(`/en${moneySavingsPath(savingId)}`);
  await expect(surface(page).getByTestId("savings-settle-open")).toBeVisible();
  await surface(page).getByTestId("savings-settle-open").click();
  await surface(page)
    .getByTestId(`savings-settlement-strategy-${strategy}`)
    .click();
  await surface(page).getByTestId("savings-settlement-submit").click();
  await expect(
    surface(page).getByTestId("savings-settlement-submit"),
  ).toContainText("Confirm");
  await surface(page).getByTestId("savings-settlement-submit").click();
  await expect(
    surface(page).getByTestId("savings-settlement-submit"),
  ).toHaveCount(0, { timeout: 30_000 });
  await page.reload();
  await expect(surface(page).getByTestId("savings-detail")).toBeVisible({
    timeout: 30_000,
  });
}

async function openEarlyWithdrawalInboxItem(page: Page) {
  const queue = surface(page).getByTestId("inbox-queue-list");
  await expect(queue).toBeVisible();
  const hrefs = await page
    .locator('[data-testid^="inbox-item-link-"]')
    .evaluateAll((links) =>
      links
        .map((link) => link.getAttribute("href"))
        .filter((href): href is string => href != null),
    );
  for (const href of hrefs) {
    await page.goto(href);
    if (
      (await surface(page)
        .getByTestId("inbox-early-withdrawal-panel")
        .count()) > 0
    ) {
      return;
    }
  }
  throw new Error(
    `Deterministic early-withdrawal Inbox fixture was not found; links=${hrefs.join(",")}; queue=${await queue.innerText()}`,
  );
}

test.describe("Savings deterministic lifecycle", () => {
  test.describe.configure({ mode: "serial" });
  test.setTimeout(180_000);

  test.beforeAll(() => {
    execFileSync("node", ["scripts/savings-lifecycle-fixture.mjs"], {
      stdio: "inherit",
    });
  });

  test("live BANK, live PLATFORM, and historical opening reach detail receipts", async ({
    page,
  }) => {
    const state = fixture();
    await login(page);
    await createSaving(page, state.providers.BANK, state.packages.BANK);
    await createSaving(page, state.providers.PLATFORM, state.packages.PLATFORM);
    await createSaving(page, state.providers.BANK, state.packages.BANK, true);
  });

  test("maturity settlement reaches a terminal read-only state", async ({
    page,
  }) => {
    const state = fixture();
    await login(page);
    await settle(
      page,
      state.fixtures["maturity-settlement"].savingId,
      "withdraw_everything",
    );
    await expect(surface(page).getByTestId("savings-settle-open")).toHaveCount(
      0,
    );
    await expect(
      surface(page).getByTestId("savings-early-withdraw"),
    ).toHaveCount(0);
    await expect(
      surface(page).getByTestId("savings-cycle-history"),
    ).toBeVisible();
  });

  test("principal-only and principal-plus-interest rollover preserve history", async ({
    page,
  }) => {
    const state = fixture();
    await login(page);
    await settle(
      page,
      state.fixtures["principal-only-rollover"].savingId,
      "roll_principal_only",
    );
    await expect(
      surface(page).getByTestId("savings-cycle-history"),
    ).toBeVisible();
    await settle(
      page,
      state.fixtures["principal-interest-rollover"].savingId,
      "roll_principal_interest",
    );
    await expect(
      surface(page).getByTestId("savings-cycle-history"),
    ).toBeVisible();
  });

  test("early withdrawal reaches the savings receipt and terminal state", async ({
    page,
  }) => {
    const state = fixture();
    await login(page);
    const saving = state.fixtures["early-withdrawal"];
    await page.goto(`/en${moneySavingsPath(saving.savingId)}`);
    await surface(page).getByTestId("savings-early-withdraw").click();
    await surface(page).getByTestId("savings-early-withdraw-request").click();
    await expect(page).toHaveURL(/\/en\/inbox/, { timeout: 30_000 });
    await openEarlyWithdrawalInboxItem(page);
    await expect(
      surface(page).getByTestId("inbox-early-withdrawal-panel"),
    ).toBeVisible();
    await surface(page).getByTestId("inbox-ack-confirm-early").click();
    await expect(page).toHaveURL(/receipt=savings/, { timeout: 30_000 });
    await page.goto(`/en${moneySavingsPath(saving.savingId)}`);
    await expect(
      surface(page).getByTestId("savings-early-withdraw"),
    ).toHaveCount(0);
    await expect(surface(page).getByTestId("savings-settle-open")).toHaveCount(
      0,
    );
    await expect(
      surface(page).getByTestId("savings-cycle-history"),
    ).toBeVisible();
  });

  test("settled and early-settled fixtures remain readable and action-free", async ({
    page,
  }) => {
    const state = fixture();
    await login(page);
    for (const key of ["settled-terminal", "early-settled-terminal"]) {
      await page.goto(`/en${moneySavingsPath(state.fixtures[key].savingId)}`);
      await expect(surface(page).getByTestId("savings-detail")).toBeVisible();
      await expect(
        surface(page).getByTestId("savings-settle-open"),
      ).toHaveCount(0);
      await expect(
        surface(page).getByTestId("savings-early-withdraw"),
      ).toHaveCount(0);
      await expect(
        surface(page).getByTestId("savings-cycle-history"),
      ).toBeVisible();
    }
  });
});
