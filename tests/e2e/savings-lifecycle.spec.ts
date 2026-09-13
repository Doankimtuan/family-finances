import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import {
  inboxItemPath,
  moneySavingsPath,
} from "@/modules/tenancy/application/app-path";
import {
  InboxItemKind,
  InboxItemStatus,
  INBOX_TEST_ID,
} from "@/modules/inbox/application/inbox-constants";
import {
  CycleStatus,
  RenewalDecisionSource,
  SAVINGS_AUTO_RENEWAL_IDEMPOTENCY_KEY_PREFIX,
  SAVINGS_RPC,
  SavingStatus,
  SavingsAutoRenewalOutcomeStatus,
  RenewalPolicy,
  SettlementRule,
} from "@/modules/savings/application/savings-constants";

const FIXTURE_PATH = "output/playwright/savings-lifecycle-fixture.json";
const PRINCIPAL = "1000000";
const APP_SURFACE_SELECTOR = "#app-viewport-root";
const AUTO_RENEWAL_FIXTURE_KEY = "auto-renewal";
const INVALID_AUTO_RENEWAL_FIXTURE_KEY = "auto-renewal-invalid-config";
const CHANGED_AUTO_RENEWAL_FIXTURE_KEY = "auto-renewal-policy-changed";
const FUTURE_AUTO_RENEWAL_FIXTURE_KEY = "auto-renewal-future";

type Fixture = {
  householdId: string;
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function inboxData(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) throw new Error("Inbox context is unavailable");
  return isRecord(value.data) ? value.data : value;
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

  test("preauthorized rollover creates a read-only Inbox result that only changes read state", async ({
    page,
  }) => {
    test.skip(
      process.env.SAVINGS_AUTO_RENEWAL_E2E_ISOLATED !== "true",
      "Requires a disposable Supabase project isolated from household savings",
    );

    const state = fixture();
    const saving = state.fixtures[AUTO_RENEWAL_FIXTURE_KEY];
    test.skip(!saving, "Automatic-renewal fixture was not enabled");
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const publishableKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const email = process.env.E2E_USER_EMAIL;
    const password = process.env.E2E_USER_PASSWORD;
    test.skip(
      !url || !publishableKey || !serviceKey || !email || !password,
      "E2E Supabase credentials are not configured",
    );

    const adminClient = createClient(url!, serviceKey!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const memberClient = createClient(url!, publishableKey!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error: signInError } = await memberClient.auth.signInWithPassword({
      email: email!,
      password: password!,
    });
    expect(signInError).toBeNull();

    const initialCycleResult = await adminClient
      .from("saving_cycles")
      .select("status")
      .eq("id", saving.cycleId)
      .single();
    expect(initialCycleResult.error).toBeNull();
    const changedPolicySaving =
      state.fixtures[CHANGED_AUTO_RENEWAL_FIXTURE_KEY];
    const { error: updatePolicyError } = await adminClient
      .from("savings")
      .update({ renewal_policy: RenewalPolicy.ALWAYS_ASK })
      .eq("id", changedPolicySaving.savingId);
    expect(updatePolicyError).toBeNull();

    if (initialCycleResult.data.status === CycleStatus.ACTIVE) {
      const detections = await Promise.all(
        [0, 1].map(() =>
          memberClient.rpc(SAVINGS_RPC.DETECT_MATURED, {
            p_household_id: state.householdId,
          }),
        ),
      );
      let automaticRenewalCount = 0;
      for (const detection of detections) {
        expect(detection.error).toBeNull();
        if (!isRecord(detection.data)) {
          throw new Error("Maturity detection did not return a result");
        }
        automaticRenewalCount += Number(detection.data.autoRenewedCount ?? 0);
      }
      expect(automaticRenewalCount).toBeLessThanOrEqual(1);
    } else {
      expect(initialCycleResult.data.status).toBe(CycleStatus.ROLLED);
    }

    const [savingResult, cyclesResult, itemResult, transactionsResult] =
      await Promise.all([
        adminClient
          .from("savings")
          .select("id, status")
          .eq("id", saving.savingId)
          .single(),
        adminClient
          .from("saving_cycles")
          .select(
            "id, cycle_number, status, previous_cycle_id, next_cycle_id, principal, renewal_decision",
          )
          .eq("saving_id", saving.savingId)
          .order("cycle_number"),
        adminClient
          .from("inbox_items")
          .select("id, status, amount, context_json, read_at")
          .eq("household_id", state.householdId)
          .eq("kind", InboxItemKind.SAVINGS_MATURITY)
          .eq("source_id", saving.savingId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        adminClient
          .from("transactions")
          .select("id, idempotency_key")
          .like(
            "idempotency_key",
            `${SAVINGS_AUTO_RENEWAL_IDEMPOTENCY_KEY_PREFIX}:${saving.savingId}:${saving.cycleId}:%`,
          ),
      ]);

    const scenarioSavingIds = [
      state.fixtures[INVALID_AUTO_RENEWAL_FIXTURE_KEY].savingId,
      changedPolicySaving.savingId,
      state.fixtures[FUTURE_AUTO_RENEWAL_FIXTURE_KEY].savingId,
    ];
    const scenarioFixtures = [
      state.fixtures[INVALID_AUTO_RENEWAL_FIXTURE_KEY],
      changedPolicySaving,
      state.fixtures[FUTURE_AUTO_RENEWAL_FIXTURE_KEY],
    ];
    const [scenarioCyclesResult, scenarioItemsResult, ...scenarioTransactions] =
      await Promise.all([
        adminClient
          .from("saving_cycles")
          .select("id, saving_id, status")
          .in("saving_id", scenarioSavingIds),
        adminClient
          .from("inbox_items")
          .select("id, source_id, status, context_json")
          .eq("household_id", state.householdId)
          .eq("kind", InboxItemKind.SAVINGS_MATURITY)
          .in("source_id", scenarioSavingIds),
        ...scenarioFixtures.map((fixtureRow) =>
          adminClient
            .from("transactions")
            .select("id")
            .like(
              "idempotency_key",
              `${SAVINGS_AUTO_RENEWAL_IDEMPOTENCY_KEY_PREFIX}:${fixtureRow.savingId}:${fixtureRow.cycleId}:%`,
            ),
        ),
      ]);

    expect(savingResult.error).toBeNull();
    expect(cyclesResult.error).toBeNull();
    expect(itemResult.error).toBeNull();
    expect(transactionsResult.error).toBeNull();
    expect(scenarioCyclesResult.error).toBeNull();
    expect(scenarioItemsResult.error).toBeNull();
    for (const transactionResult of scenarioTransactions) {
      expect(transactionResult.error).toBeNull();
      expect(transactionResult.data).toHaveLength(0);
    }
    expect(savingResult.data.status).toBe(SavingStatus.ACTIVE);
    const cycles = cyclesResult.data ?? [];
    expect(cycles).toHaveLength(2);
    const previousCycle = cycles[0];
    const nextCycle = cycles[1];
    expect(previousCycle.status).toBe(CycleStatus.ROLLED);
    expect(previousCycle.next_cycle_id).toBe(nextCycle.id);
    expect(previousCycle.renewal_decision).toMatchObject({
      renewalPolicy: RenewalPolicy.AUTO_RENEW_UNTIL_CANCELLED,
      settlementRule: SettlementRule.ROLL_PRINCIPAL_INTEREST,
      decisionSource: RenewalDecisionSource.POLICY_APPLIED,
    });
    expect(nextCycle.previous_cycle_id).toBe(previousCycle.id);
    expect(nextCycle.status).toBe(CycleStatus.ACTIVE);
    expect(transactionsResult.data?.length).toBeGreaterThan(0);
    const inboxItem = itemResult.data;
    if (!inboxItem) throw new Error("Maturity result was not created");
    expect(inboxItem.read_at).toBeNull();

    const context = inboxData(inboxItem.context_json);
    const outcome = context.autoRenewalOutcome;
    if (!isRecord(outcome)) throw new Error("Renewal outcome is unavailable");
    expect(outcome).toMatchObject({
      status: SavingsAutoRenewalOutcomeStatus.COMPLETED,
      previousCycleId: previousCycle.id,
      nextCycleId: nextCycle.id,
      nextCycleNumber: nextCycle.cycle_number,
      rolloverAmount: Number(nextCycle.principal),
    });

    const scenarioCycles = scenarioCyclesResult.data ?? [];
    const scenarioItems = scenarioItemsResult.data ?? [];
    const invalidFixture = state.fixtures[INVALID_AUTO_RENEWAL_FIXTURE_KEY];
    const invalidCycle = scenarioCycles.find(
      (cycle) => cycle.saving_id === invalidFixture.savingId,
    );
    const invalidItem = scenarioItems.find(
      (item) => item.source_id === invalidFixture.savingId,
    );
    if (!invalidItem) throw new Error("Fallback maturity item was not created");
    expect(
      scenarioCycles.filter(
        (cycle) => cycle.saving_id === invalidFixture.savingId,
      ),
    ).toHaveLength(1);
    expect(invalidCycle?.status).toBe(CycleStatus.MATURED);
    expect(invalidItem?.status).toBe(InboxItemStatus.PENDING);
    const invalidContext = inboxData(invalidItem.context_json);
    expect(invalidContext.autoRenewalFallbackRequired).toBe(true);
    expect(invalidContext.autoRenewalOutcome).toBeUndefined();
    expect(invalidContext.recommendedPackages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ packageId: state.packages.BANK }),
      ]),
    );

    const changedPolicyFixture =
      state.fixtures[CHANGED_AUTO_RENEWAL_FIXTURE_KEY];
    const changedPolicyCycle = scenarioCycles.find(
      (cycle) => cycle.saving_id === changedPolicyFixture.savingId,
    );
    const changedPolicyItem = scenarioItems.find(
      (item) => item.source_id === changedPolicyFixture.savingId,
    );
    expect(
      scenarioCycles.filter(
        (cycle) => cycle.saving_id === changedPolicyFixture.savingId,
      ),
    ).toHaveLength(1);
    expect(changedPolicyCycle?.status).toBe(CycleStatus.MATURED);
    expect(changedPolicyItem?.status).toBe(InboxItemStatus.PENDING);
    expect(inboxData(changedPolicyItem?.context_json).renewalPolicy).toBe(
      RenewalPolicy.ALWAYS_ASK,
    );
    expect(
      inboxData(changedPolicyItem?.context_json).autoRenewalOutcome,
    ).toBeUndefined();

    const futureFixture = state.fixtures[FUTURE_AUTO_RENEWAL_FIXTURE_KEY];
    const futureCycle = scenarioCycles.find(
      (cycle) => cycle.saving_id === futureFixture.savingId,
    );
    expect(
      scenarioCycles.filter(
        (cycle) => cycle.saving_id === futureFixture.savingId,
      ),
    ).toHaveLength(1);
    expect(futureCycle?.status).toBe(CycleStatus.ACTIVE);
    expect(
      scenarioItems.some((item) => item.source_id === futureFixture.savingId),
    ).toBe(false);

    const cycleIdsBeforeRead = cycles.map((cycle) => cycle.id);
    const transactionIdsBeforeRead = (transactionsResult.data ?? [])
      .map((transaction) => transaction.id)
      .sort();

    await login(page);
    await page.goto(`/en${inboxItemPath(invalidItem.id)}`);
    await expect(
      surface(page).getByTestId("inbox-maturity-panel"),
    ).toBeVisible();
    await expect(
      surface(page).getByTestId("inbox-maturity-package"),
    ).toBeVisible();
    await page.goto(`/en${inboxItemPath(inboxItem.id)}`);
    await expect(
      surface(page).getByTestId(INBOX_TEST_ID.SAVINGS_AUTO_RENEWAL_RESULT),
    ).toBeVisible();
    await expect(
      surface(page).getByText("Savings renewed", { exact: true }),
    ).toBeVisible();
    await expect(
      surface(page).getByTestId(INBOX_TEST_ID.READ_STATE),
    ).toHaveText("Mark as read");
    await expect(
      surface(page).locator('[data-testid^="inbox-ack-"]'),
    ).toHaveCount(0);
    await expect(surface(page).getByTestId("inbox-maturity-panel")).toHaveCount(
      0,
    );

    await surface(page).getByTestId(INBOX_TEST_ID.READ_STATE).click();
    await expect(
      surface(page).getByTestId(INBOX_TEST_ID.READ_STATE),
    ).toHaveText("Mark as unread");
    await page.goto(`/vi${inboxItemPath(inboxItem.id)}`);
    await expect(
      surface(page).getByTestId(INBOX_TEST_ID.SAVINGS_AUTO_RENEWAL_RESULT),
    ).toBeVisible();
    await expect(
      surface(page).getByText("Đã gia hạn tiết kiệm", { exact: true }),
    ).toBeVisible();
    await surface(page).getByTestId(INBOX_TEST_ID.READ_STATE).click();
    await expect(
      surface(page).getByTestId(INBOX_TEST_ID.READ_STATE),
    ).toHaveText("Đánh dấu đã đọc");

    const [afterCycles, afterTransactions, afterInboxItem] = await Promise.all([
      adminClient
        .from("saving_cycles")
        .select("id")
        .eq("saving_id", saving.savingId)
        .order("cycle_number"),
      adminClient
        .from("transactions")
        .select("id")
        .like(
          "idempotency_key",
          `${SAVINGS_AUTO_RENEWAL_IDEMPOTENCY_KEY_PREFIX}:${saving.savingId}:${saving.cycleId}:%`,
        ),
      adminClient
        .from("inbox_items")
        .select("read_at")
        .eq("id", inboxItem.id)
        .single(),
    ]);
    expect(afterCycles.error).toBeNull();
    expect(afterTransactions.error).toBeNull();
    expect(afterInboxItem.error).toBeNull();
    expect(afterCycles.data?.map((cycle) => cycle.id)).toEqual(
      cycleIdsBeforeRead,
    );
    expect(
      afterTransactions.data?.map((transaction) => transaction.id).sort(),
    ).toEqual(transactionIdsBeforeRead);
    expect(afterInboxItem.data.read_at).toBeNull();
  });
});
