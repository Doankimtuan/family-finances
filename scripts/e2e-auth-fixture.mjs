/** Run-scoped disposable authenticated E2E identity and household. */

import { randomBytes, randomUUID } from "node:crypto";
import { readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import nextEnv from "@next/env";

nextEnv.loadEnvConfig(process.cwd());

const STATE_PATH = resolve(
  process.cwd(),
  "output/playwright/e2e-auth-fixture.json",
);
const FIXTURE_PREFIX = "E2E 23D1";
const FIXTURE_CASH_ACCOUNT_NAME = "E2E cash";
const FIXTURE_TRANSFER_SOURCE_NAME = `${FIXTURE_PREFIX} transfer source`;
const FIXTURE_TRANSFER_DESTINATION_NAME = `${FIXTURE_PREFIX} transfer destination`;
const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceKey = (
  process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY
)?.trim();
const anonKey = (
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)?.trim();

if (!url || !serviceKey || !anonKey)
  throw new Error(
    "E2E auth fixture requires Supabase URL, anon key, and service key",
  );

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const publicClient = createClient(url, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function readState() {
  try {
    return JSON.parse(await readFile(STATE_PATH, "utf8"));
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

function fail(label, error) {
  if (error) throw new Error(`${label}: ${error.code ?? error.message}`);
}

async function assertOwnedState(state) {
  const { data: user, error: userError } = await admin.auth.admin.getUserById(
    state.userId,
  );
  fail("read disposable auth user", userError);
  if (user.user?.user_metadata?.fixture !== FIXTURE_PREFIX)
    throw new Error(
      "refusing disposable fixture: auth identity is not fixture-owned",
    );

  const { data: members, error: memberError } = await admin
    .from("household_members")
    .select("user_id")
    .eq("household_id", state.householdId);
  fail("verify disposable household members", memberError);
  if ((members ?? []).some((member) => member.user_id !== state.userId))
    throw new Error(
      "refusing disposable fixture: household contains another user",
    );
}

async function ensurePlanSeed(householdId) {
  const { error: householdError } = await admin
    .from("households")
    .update({ qualifying_monthly_income: 1_000_000 })
    .eq("id", householdId);
  fail("seed disposable Plan income", householdError);

  const { data: jars, error: jarError } = await admin
    .from("jars")
    .select("id, sort_order")
    .eq("household_id", householdId)
    .order("sort_order", { ascending: true });
  fail("read disposable Plan jars", jarError);
  const percentages = [5_000, 3_000, 2_000];
  const plans = (jars ?? []).map((jar, index) => ({
    household_id: householdId,
    jar_id: jar.id,
    plan_kind: "percent",
    percent_bps: percentages[index] ?? 0,
    fixed_amount: 0,
  }));
  if (!plans.length) throw new Error("disposable Plan jars were not created");
  const { error: planError } = await admin
    .from("jar_plans")
    .upsert(plans, { onConflict: "jar_id" });
  fail("seed disposable Plan rules", planError);
}

async function ensureTransferAccounts(householdId, userId) {
  for (const [name, openingBalance] of [
    [FIXTURE_TRANSFER_SOURCE_NAME, 5_000_000],
    [FIXTURE_TRANSFER_DESTINATION_NAME, 0],
  ]) {
    const { data: existing, error: readError } = await admin
      .from("accounts")
      .select("id")
      .eq("household_id", householdId)
      .eq("name", name)
      .maybeSingle();
    fail("read disposable transfer account", readError);

    const query = existing
      ? admin
          .from("accounts")
          .update({ opening_balance: openingBalance })
          .eq("id", existing.id)
      : admin.from("accounts").insert({
          household_id: householdId,
          name,
          type: "cash",
          opening_balance: openingBalance,
          created_by: userId,
        });
    const { error } = await query;
    fail("seed disposable transfer account", error);
  }
}

async function setup() {
  const existing = await readState();
  if (existing) {
    await assertOwnedState(existing);
    await ensurePlanSeed(existing.householdId);
    await ensureTransferAccounts(existing.householdId, existing.userId);
    process.stdout.write(`${JSON.stringify(existing)}\n`);
    return;
  }

  const runId = randomUUID();
  const email = `e2e-23d1-${runId}@example.invalid`;
  const password = `E2E23D1-${randomBytes(24).toString("base64url")}!`;
  const { data: created, error: userError } = await admin.auth.admin.createUser(
    {
      email,
      password,
      email_confirm: true,
      user_metadata: { fixture: FIXTURE_PREFIX },
    },
  );
  fail("create disposable E2E auth user", userError);
  if (!created.user)
    throw new Error("disposable E2E auth user was not created");

  const { data: session, error: signInError } =
    await publicClient.auth.signInWithPassword({ email, password });
  fail("authenticate disposable E2E user", signInError);
  if (!session.session)
    throw new Error("disposable E2E session was not created");

  const { data: householdId, error: householdError } = await publicClient.rpc(
    "create_household_with_essentials",
    {
      p_name: `${FIXTURE_PREFIX} ${runId}`,
      p_account_name: FIXTURE_CASH_ACCOUNT_NAME,
      p_plan_preset: "simple",
      p_base_currency: "VND",
      p_locale: "en-VN",
      p_timezone: "Asia/Ho_Chi_Minh",
    },
  );
  fail("create disposable E2E household", householdError);
  if (typeof householdId !== "string")
    throw new Error("disposable E2E household id was not returned");

  const { error: cashBalanceError } = await admin
    .from("accounts")
    .update({ opening_balance: 5_000_000 })
    .eq("household_id", householdId)
    .eq("name", FIXTURE_CASH_ACCOUNT_NAME);
  fail("seed disposable cash balance", cashBalanceError);

  const { error: accountError } = await admin.from("accounts").insert({
    household_id: householdId,
    name: `${FIXTURE_PREFIX} settlement account`,
    type: "cash",
    created_by: created.user.id,
  });
  fail("create disposable settlement account", accountError);
  await ensureTransferAccounts(householdId, created.user.id);
  await ensurePlanSeed(householdId);

  const today = new Date().toISOString().slice(0, 10);
  const { data: holdings, error: holdingError } = await admin
    .from("investment_holdings")
    .insert([
      {
        household_id: householdId,
        name: `${FIXTURE_PREFIX} active investment`,
        symbol: "E2E23D1A",
        asset_class: "stock",
        visibility_context: "household",
        lifecycle_status: "active",
        history_status: "opening_position",
        quantity: 10,
        remaining_total_cost_basis: 1_000_000,
        financial_scope: "household",
        created_by: created.user.id,
      },
      {
        household_id: householdId,
        name: `${FIXTURE_PREFIX} exited investment`,
        symbol: "E2E23D1X",
        asset_class: "crypto",
        visibility_context: "household",
        lifecycle_status: "exited",
        history_status: "full",
        quantity: 0,
        remaining_total_cost_basis: 0,
        financial_scope: "household",
        created_by: created.user.id,
      },
    ])
    .select("id, lifecycle_status");
  fail("create disposable investment holdings", holdingError);

  const activeHolding = holdings?.find(
    (holding) => holding.lifecycle_status === "active",
  );
  const exitedHolding = holdings?.find(
    (holding) => holding.lifecycle_status === "exited",
  );
  if (!activeHolding || !exitedHolding)
    throw new Error("disposable investment holdings were not created");

  const { error: valuationError } = await admin
    .from("investment_valuations")
    .insert([
      {
        household_id: householdId,
        holding_id: activeHolding.id,
        value_vnd: 1_200_000,
        valuation_date: today,
        source: "manual",
        idempotency_key: `${FIXTURE_PREFIX}|active|${householdId}`,
        created_by: created.user.id,
      },
      {
        household_id: householdId,
        holding_id: exitedHolding.id,
        value_vnd: 0,
        valuation_date: today,
        source: "manual",
        idempotency_key: `${FIXTURE_PREFIX}|exited|${householdId}`,
        created_by: created.user.id,
      },
    ]);
  fail("create disposable investment valuations", valuationError);

  const state = { email, password, userId: created.user.id, householdId };
  await writeFile(STATE_PATH, `${JSON.stringify(state, null, 2)}\n`, {
    mode: 0o600,
  });
  process.stdout.write(`${JSON.stringify(state)}\n`);
}

async function deleteByHousehold(table, householdId) {
  const { error } = await admin
    .from(table)
    .delete()
    .eq("household_id", householdId);
  if (error && !["PGRST205", "42703"].includes(error.code))
    fail(`remove disposable ${table}`, error);
}

async function cleanup() {
  const state = await readState();
  if (!state) return;
  await assertOwnedState(state);

  const { error: householdError } = await admin
    .from("households")
    .delete()
    .eq("id", state.householdId)
    .like("name", `${FIXTURE_PREFIX} %`);
  if (householdError) {
    const readIds = async (table) => {
      const { data, error } = await admin
        .from(table)
        .select("id")
        .eq("household_id", state.householdId);
      if (error && !["PGRST205", "42703"].includes(error.code))
        fail(`read disposable ${table}`, error);
      return (data ?? []).map((row) => row.id);
    };
    const deleteByIds = async (table, column, ids) => {
      if (!ids.length) return;
      const { error } = await admin.from(table).delete().in(column, ids);
      if (error && !["PGRST205", "42703"].includes(error.code))
        fail(`remove disposable ${table}`, error);
    };
    const savingIds = await readIds("savings");
    const loanIds = await readIds("loans");
    const holdingIds = await readIds("investment_holdings");
    const operationIds = await readIds("investment_operations");
    const providerIds = await readIds("saving_providers");
    await deleteByIds("early_withdrawals", "saving_id", savingIds);
    await deleteByIds("saving_cycles", "saving_id", savingIds);
    await deleteByIds("saving_packages", "provider_id", providerIds);
    await deleteByIds("loan_payments", "loan_id", loanIds);
    await deleteByIds("loan_schedule_entries", "loan_id", loanIds);
    await deleteByIds("loan_interest_rate_periods", "loan_id", loanIds);
    await deleteByIds("investment_fees", "holding_id", holdingIds);
    await deleteByIds("investment_fees", "operation_id", operationIds);
    await deleteByIds("investment_valuations", "holding_id", holdingIds);
    await deleteByIds("investment_lots", "position_id", holdingIds);
    await deleteByIds("investment_events", "position_id", holdingIds);
    await deleteByIds("investment_operations", "source_holding_id", holdingIds);
    await deleteByIds(
      "investment_operations",
      "destination_holding_id",
      holdingIds,
    );

    for (const table of [
      "inbox_items",
      "transaction_tag_assignments",
      "goal_funding_links",
      "goal_contributions",
      "plan_movements",
      "jar_period_adjustments",
      "jar_period_rule_snapshots",
      "debt_payments",
      "loan_payments",
      "loan_schedule_entries",
      "loan_interest_rate_periods",
      "card_payment_applications",
      "card_payments",
      "card_billing_items",
      "card_billing_months",
      "credit_card_installment_schedule",
      "credit_card_installments",
      "installment_plans",
      "investment_fees",
      "investment_operations",
      "investment_valuations",
      "investment_events",
      "investment_lots",
      "early_withdrawals",
      "saving_cycles",
      "transactions",
      "goals",
      "jars",
      "liabilities",
      "loans",
      "savings",
      "saving_packages",
      "saving_providers",
      "investment_holdings",
      "accounts",
      "household_invitations",
      "household_policy_events",
      "household_configuration_events",
      "month_ritual_runs",
      "market_sync_runs",
      "ai_audit_logs",
      "household_members",
    ])
      await deleteByHousehold(table, state.householdId);

    const { error: retryError } = await admin
      .from("households")
      .delete()
      .eq("id", state.householdId)
      .like("name", `${FIXTURE_PREFIX} %`);
    fail("remove disposable E2E household", retryError);
  }

  const { error: userError } = await admin.auth.admin.deleteUser(state.userId);
  fail("remove disposable E2E auth user", userError);
  await rm(STATE_PATH, { force: true });
}

if (process.argv[2] === "setup") await setup();
else if (process.argv[2] === "cleanup") await cleanup();
else throw new Error("Use setup or cleanup");
