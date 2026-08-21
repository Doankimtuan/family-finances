import { createClient } from "@supabase/supabase-js";
import nextEnv from "@next/env";

nextEnv.loadEnvConfig(process.cwd());
const env = process.env;
const url = env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const anonKey = (
  env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)?.trim();
const serviceKey = (
  env.SUPABASE_SECRET_KEY ?? env.SUPABASE_SERVICE_ROLE_KEY
)?.trim();
if (!url || !anonKey || !serviceKey)
  throw new Error("Supabase test credentials are incomplete");

const suffix = crypto.randomUUID().slice(0, 8);
const emailA = `investments-12b1-a-${suffix}@example.com`;
const emailB = `investments-12b1-b-${suffix}@example.com`;
const password = `Investments-12B1-${crypto.randomUUID()}!aA1`;
const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const clients = [];
const created = {
  userIds: [],
  householdId: null,
  accountIds: [],
  holdingIds: [],
};

function fail(message) {
  throw new Error(message);
}
async function one(query, label) {
  const { data, error } = await query.select().single();
  if (error) fail(`${label}: ${error.code ?? error.message}`);
  return data;
}
async function signedIn(email) {
  const client = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });
  if (error || !data.session)
    fail(`sign in failed: ${error?.message ?? email}`);
  clients.push(client);
  return client;
}
async function snapshot(householdId, holdingId, accountId) {
  const [holding, operations, transactions, fees, valuations, lots] =
    await Promise.all([
      admin
        .from("investment_holdings")
        .select("quantity,remaining_total_cost_basis")
        .eq("id", holdingId)
        .single(),
      admin
        .from("investment_operations")
        .select("id")
        .eq("household_id", householdId),
      admin
        .from("transactions")
        .select("id,account_id,amount,type")
        .eq("household_id", householdId),
      admin
        .from("investment_fees")
        .select("id")
        .eq("household_id", householdId),
      admin
        .from("investment_valuations")
        .select("id")
        .eq("household_id", householdId),
      admin
        .from("investment_lots")
        .select("id,remaining_quantity")
        .eq("household_id", householdId),
    ]);
  for (const result of [
    holding,
    operations,
    transactions,
    fees,
    valuations,
    lots,
  ])
    if (result.error) fail(result.error.message);
  const accountTransactions = (transactions.data ?? []).filter(
    (row) => row.account_id === accountId,
  );
  return {
    quantity: holding.data.quantity,
    basis: holding.data.remaining_total_cost_basis,
    operationIds: (operations.data ?? []).map((row) => row.id).sort(),
    transactionIds: (transactions.data ?? []).map((row) => row.id).sort(),
    feeIds: (fees.data ?? []).map((row) => row.id).sort(),
    valuationIds: (valuations.data ?? []).map((row) => row.id).sort(),
    lotState: (lots.data ?? [])
      .map((row) => [row.id, row.remaining_quantity])
      .sort(),
    accountTransactionIds: accountTransactions.map((row) => row.id).sort(),
    accountDelta: accountTransactions.reduce(
      (sum, row) => sum + Number(row.amount),
      0,
    ),
  };
}
function same(before, after) {
  return JSON.stringify(before) === JSON.stringify(after);
}
async function rpc(client, name, args) {
  const { data, error } = await client.rpc(name, args);
  return { data, error };
}

try {
  const userA = await admin.auth.admin.createUser({
    email: emailA,
    password,
    email_confirm: true,
  });
  if (userA.error) fail(userA.error.message);
  const userB = await admin.auth.admin.createUser({
    email: emailB,
    password,
    email_confirm: true,
  });
  if (userB.error) fail(userB.error.message);
  created.userIds.push(userA.data.user.id, userB.data.user.id);
  const household = await one(
    admin.from("households").insert({
      name: `Investments 12B.1 ${suffix}`,
      base_currency: "VND",
      locale: "en-VN",
      timezone: "Asia/Ho_Chi_Minh",
      created_by: userA.data.user.id,
    }),
    "create household",
  );
  created.householdId = household.id;
  const memberA = await one(
    admin.from("household_members").insert({
      household_id: household.id,
      user_id: userA.data.user.id,
      role: "admin",
      is_active: true,
    }),
    "create member A",
  );
  await one(
    admin.from("household_members").insert({
      household_id: household.id,
      user_id: userB.data.user.id,
      role: "partner",
      is_active: true,
    }),
    "create member B",
  );
  const account = await one(
    admin.from("accounts").insert({
      household_id: household.id,
      name: `Investments 12B.1 cash ${suffix}`,
      type: "cash",
      opening_balance: 10000000,
      financial_scope: "household",
      created_by: userA.data.user.id,
    }),
    "create cash account",
  );
  created.accountIds.push(account.id);
  const holding = await one(
    admin.from("investment_holdings").insert({
      household_id: household.id,
      name: `Investments 12B.1 holding ${suffix}`,
      symbol: "NEG12B1",
      asset_class: "stock",
      visibility_context: "household",
      lifecycle_status: "active",
      history_status: "opening_position",
      quantity: 10,
      remaining_total_cost_basis: 1000000,
      financial_scope: "personal",
      owner_membership_id: memberA.id,
      created_by: userA.data.user.id,
    }),
    "create personal holding",
  );
  created.holdingIds.push(holding.id);
  const destination = await one(
    admin.from("investment_holdings").insert({
      household_id: household.id,
      name: `Investments 12B.1 destination ${suffix}`,
      symbol: "NEG12B1-D",
      asset_class: "stock",
      visibility_context: "household",
      lifecycle_status: "active",
      history_status: "opening_position",
      quantity: 1,
      remaining_total_cost_basis: 100000,
      financial_scope: "personal",
      owner_membership_id: memberA.id,
      created_by: userA.data.user.id,
    }),
    "create destination holding",
  );
  created.holdingIds.push(destination.id);
  const clientA = await signedIn(emailA);
  const clientB = await signedIn(emailB);
  const before = await snapshot(household.id, holding.id, account.id);

  const unauthorized = [
    [
      "buy",
      "record_investment_buy",
      {
        p_holding_id: holding.id,
        p_cash_account_id: account.id,
        p_bought_quantity: "1",
        p_unit_price_vnd: 100000,
        p_total_value_vnd: null,
        p_quoted_value_vnd: null,
        p_effective_date: "2026-08-21",
        p_fees: [],
        p_notes: "negative",
        p_idempotency_key: `negative-buy-${suffix}`,
      },
    ],
    [
      "sell",
      "record_investment_sell",
      {
        p_holding_id: holding.id,
        p_cash_account_id: account.id,
        p_sold_quantity: "1",
        p_unit_price_vnd: 100000,
        p_total_value_vnd: null,
        p_quoted_value_vnd: null,
        p_effective_date: "2026-08-21",
        p_fees: [],
        p_notes: "negative",
        p_idempotency_key: `negative-sell-${suffix}`,
      },
    ],
    [
      "valuation",
      "record_investment_valuation",
      {
        p_holding_id: holding.id,
        p_unit_price_vnd: 110000,
        p_total_value_vnd: null,
        p_valuation_date: "2026-08-21",
        p_source: "manual",
        p_notes: "negative",
        p_idempotency_key: `negative-valuation-${suffix}`,
      },
    ],
    [
      "income",
      "record_investment_income",
      {
        p_holding_id: holding.id,
        p_cash_account_id: account.id,
        p_amount_vnd: 50000,
        p_income_kind: "dividend",
        p_effective_date: "2026-08-21",
        p_notes: "negative",
        p_idempotency_key: `negative-income-${suffix}`,
      },
    ],
    [
      "conversion",
      "record_investment_conversion",
      {
        p_source_holding_id: holding.id,
        p_destination_holding_id: destination.id,
        p_source_quantity: "1",
        p_destination_quantity: "1",
        p_executed_value_vnd: 100000,
        p_quoted_value_vnd: null,
        p_effective_date: "2026-08-21",
        p_fees: [],
        p_notes: "negative",
        p_idempotency_key: `negative-conversion-${suffix}`,
      },
    ],
  ];
  for (const [label, name, args] of unauthorized) {
    const result = await rpc(clientB, name, args);
    if (!result.error) fail(`${label} unexpectedly succeeded`);
    const after = await snapshot(household.id, holding.id, account.id);
    if (!same(before, after))
      fail(
        `${label} changed financial state: ${JSON.stringify({ before, after })}`,
      );
  }

  const allowed = [
    [
      "buy",
      "record_investment_buy",
      {
        p_holding_id: holding.id,
        p_cash_account_id: account.id,
        p_bought_quantity: "1",
        p_unit_price_vnd: 100000,
        p_total_value_vnd: null,
        p_quoted_value_vnd: null,
        p_effective_date: "2026-08-21",
        p_fees: [],
        p_notes: "allowed",
        p_idempotency_key: `allowed-buy-${suffix}`,
      },
    ],
    [
      "sell",
      "record_investment_sell",
      {
        p_holding_id: holding.id,
        p_cash_account_id: account.id,
        p_sold_quantity: "1",
        p_unit_price_vnd: 120000,
        p_total_value_vnd: null,
        p_quoted_value_vnd: null,
        p_effective_date: "2026-08-21",
        p_fees: [],
        p_notes: "allowed",
        p_idempotency_key: `allowed-sell-${suffix}`,
      },
    ],
    [
      "valuation",
      "record_investment_valuation",
      {
        p_holding_id: holding.id,
        p_unit_price_vnd: 110000,
        p_total_value_vnd: null,
        p_valuation_date: "2026-08-21",
        p_source: "manual",
        p_notes: "allowed",
        p_idempotency_key: `allowed-valuation-${suffix}`,
      },
    ],
    [
      "income",
      "record_investment_income",
      {
        p_holding_id: holding.id,
        p_cash_account_id: account.id,
        p_amount_vnd: 50000,
        p_income_kind: "dividend",
        p_effective_date: "2026-08-21",
        p_notes: "allowed",
        p_idempotency_key: `allowed-income-${suffix}`,
      },
    ],
    [
      "conversion",
      "record_investment_conversion",
      {
        p_source_holding_id: holding.id,
        p_destination_holding_id: destination.id,
        p_source_quantity: "1",
        p_destination_quantity: "1",
        p_executed_value_vnd: 100000,
        p_quoted_value_vnd: null,
        p_effective_date: "2026-08-21",
        p_fees: [],
        p_notes: "allowed",
        p_idempotency_key: `allowed-conversion-${suffix}`,
      },
    ],
  ];
  for (const [label, name, args] of allowed) {
    const result = await rpc(clientA, name, args);
    if (result.error)
      fail(`${label} allowed mutation failed: ${result.error.message}`);
  }
  const replay = await rpc(clientA, "record_investment_income", {
    ...allowed[3][2],
    p_idempotency_key: `allowed-income-${suffix}`,
  });
  if (replay.error || !replay.data?.idempotentReplay)
    fail("allowed income replay was not idempotent");
  const afterAllowed = await snapshot(household.id, holding.id, account.id);
  if (
    afterAllowed.operationIds.length !== 4 ||
    afterAllowed.valuationIds.length !== 1
  )
    fail(`unexpected allowed mutation counts: ${JSON.stringify(afterAllowed)}`);
  console.error(
    JSON.stringify({
      status: "passed",
      unauthorizedAttempts: unauthorized.map(([label]) => label),
      allowedMutations: allowed.map(([label]) => label),
      replay: true,
    }),
  );
} finally {
  if (created.householdId) {
    for (const table of [
      "investment_events",
      "investment_fees",
      "investment_operations",
      "investment_valuations",
      "investment_lots",
      "transactions",
      "investment_holdings",
      "accounts",
      "household_members",
      "households",
    ]) {
      const result = await admin
        .from(table)
        .delete()
        .eq("household_id", created.householdId);
      if (result.error && !["PGRST205", "42703"].includes(result.error.code))
        console.error(`cleanup ${table}: ${result.error.message}`);
    }
  }
  for (const userId of created.userIds) {
    const result = await admin.auth.admin.deleteUser(userId);
    if (result.error)
      console.error(`cleanup auth user: ${result.error.message}`);
  }
}
