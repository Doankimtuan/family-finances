/**
 * Repeatable ~10k transaction fixture for Phase 2 balance benchmarks.
 *
 * Default: local Supabase only (localhost / 127.0.0.1 / ::1).
 * Hosted: fail-closed unless VINHA_PERF_ALLOW_HOSTED=1 and
 * VINHA_PERF_ALLOWED_HOST matches the URL hostname exactly.
 *
 * Never attaches to an existing product household. Creates or reuses only:
 *   VINHA_PERF_BENCHMARK_DO_NOT_USE
 *
 *   VINHA_PERF_TARGET_COUNT=1000 node scripts/perf-10k-transaction-fixture.mjs setup
 *   VINHA_PERF_TARGET_COUNT=10000 node scripts/perf-10k-transaction-fixture.mjs setup
 *   node scripts/perf-10k-transaction-fixture.mjs status
 *   node scripts/perf-10k-transaction-fixture.mjs cleanup
 */
/* eslint-disable no-console -- CLI fixture reports JSON on stdout */
import { createClient } from "@supabase/supabase-js";
import nextEnv from "@next/env";

nextEnv.loadEnvConfig(process.cwd());

const HOUSEHOLD_NAME = "VINHA_PERF_BENCHMARK_DO_NOT_USE";
const NOTE_PREFIX = "VINHA_PERF_TX";
const DEFAULT_TARGET_COUNT = 10_000;
const BATCH_SIZE = 500;
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1"]);

/** Must match TRANSACTION_LEDGER_* / TRANSACTION_BALANCE_STATUS_VALUES. */
const CREDIT_TYPES = [
  "income",
  "debt_borrowing",
  "debt_receivable_payment",
  "transfer_in",
  "investment_sell_proceeds",
  "investment_income",
];
const DEBIT_TYPES = [
  "expense",
  "debt_lending",
  "liability_payment",
  "loan_interest",
  "transfer_out",
  "investment_buy",
  "investment_fee",
];
const BALANCE_STATUSES = [
  "pending_mapping",
  "posted",
  "partially_refunded",
  "fully_refunded",
  "reversed",
];
const LIQUID_ACCOUNT_SPECS = [
  { key: "cash", name: "VINHA PERF Cash", type: "cash", opening: 5_000_000 },
  {
    key: "checking",
    name: "VINHA PERF Checking",
    type: "checking",
    opening: 25_000_000,
  },
  {
    key: "savings",
    name: "VINHA PERF Savings",
    type: "savings",
    opening: 80_000_000,
  },
  {
    key: "ewallet",
    name: "VINHA PERF EWallet",
    type: "ewallet",
    opening: 2_000_000,
  },
  {
    key: "brokerage",
    name: "VINHA PERF Brokerage",
    type: "brokerage",
    opening: 0,
  },
  { key: "other", name: "VINHA PERF Other", type: "other", opening: 1_000_000 },
];
const EXCLUDED_ACCOUNT_SPECS = [
  {
    key: "card",
    name: "VINHA PERF Card",
    type: "credit_card",
    opening: 0,
    archived: false,
  },
  {
    key: "product",
    name: "VINHA PERF Term",
    type: "savings_product",
    opening: 100_000_000,
    archived: false,
  },
  {
    key: "archived",
    name: "VINHA PERF Archived Cash",
    type: "cash",
    opening: 500_000,
    archived: true,
  },
];

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
const serviceKey = (
  process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY
)?.trim();

function targetCount() {
  const raw = process.env.VINHA_PERF_TARGET_COUNT?.trim();
  if (!raw) return DEFAULT_TARGET_COUNT;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 50_000) {
    throw new Error("VINHA_PERF_TARGET_COUNT must be an integer 1..50000");
  }
  return parsed;
}

function assertSafeTarget() {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is missing or invalid");
  }
  if (!serviceKey) {
    throw new Error("Service role key is required");
  }
  if (LOCAL_HOSTS.has(parsed.hostname)) {
    return { mode: "local", hostname: parsed.hostname };
  }
  if (process.env.VINHA_PERF_ALLOW_HOSTED !== "1") {
    throw new Error(
      `Refusing 10k fixture against non-local host ${parsed.hostname}. Use local Supabase, or set VINHA_PERF_ALLOW_HOSTED=1 and VINHA_PERF_ALLOWED_HOST=<exact hostname> for a dedicated development project.`,
    );
  }
  const allowed = process.env.VINHA_PERF_ALLOWED_HOST?.trim();
  if (!allowed) {
    throw new Error(
      "VINHA_PERF_ALLOWED_HOST is required when VINHA_PERF_ALLOW_HOSTED=1",
    );
  }
  if (parsed.hostname !== allowed) {
    throw new Error(
      `Host ${parsed.hostname} is not VINHA_PERF_ALLOWED_HOST (${allowed})`,
    );
  }
  return { mode: "hosted", hostname: parsed.hostname };
}

function adminClient() {
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function pickLiquidKey(index) {
  const bucket = index % 100;
  if (bucket < 40) return "checking";
  if (bucket < 60) return "cash";
  if (bucket < 75) return "ewallet";
  if (bucket < 90) return "savings";
  if (bucket < 98) return "brokerage";
  return "other";
}

function pickType(index) {
  const bucket = index % 100;
  if (bucket < 70) return "expense";
  if (bucket < 85) return "income";
  if (bucket < 88) return "transfer_out";
  if (bucket < 91) return "transfer_in";
  if (bucket < 94) return "investment_buy";
  if (bucket < 96) return "investment_sell_proceeds";
  if (bucket < 97) return "investment_income";
  if (bucket < 98) return "investment_fee";
  if (bucket < 99) return "liability_payment";
  return "debt_borrowing";
}

function pickStatus(index) {
  const bucket = index % 100;
  if (bucket < 85) return "posted";
  if (bucket < 90) return "pending_mapping";
  if (bucket < 94) return "partially_refunded";
  if (bucket < 97) return "fully_refunded";
  return "reversed";
}

function pickAmount(index, type) {
  if (CREDIT_TYPES.includes(type)) {
    return 8_000_000 + (index % 10) * 500_000;
  }
  return 25_000 + (index % 500) * 1_000;
}

function transactionDate(index) {
  const day = new Date(Date.UTC(2024, 0, 1));
  day.setUTCDate(day.getUTCDate() + (index % 730));
  return day.toISOString().slice(0, 10);
}

function buildRow(householdId, accountsByKey, index) {
  const kindBucket = index % 50;
  let accountKey = pickLiquidKey(index);
  if (kindBucket === 0) accountKey = "card";
  if (kindBucket === 1) accountKey = "archived";
  const type = pickType(index);
  const isTransfer = type === "transfer_out" || type === "transfer_in";
  return {
    household_id: householdId,
    account_id: accountsByKey[accountKey],
    type,
    amount: pickAmount(index, type),
    currency: "VND",
    transaction_date: transactionDate(index),
    note: `${NOTE_PREFIX}:${index}`,
    status: pickStatus(index),
    source: "manual",
    transfer_group_id: isTransfer
      ? `aaaaaaaa-bbbb-4ccc-8ddd-${String(index).padStart(12, "0")}`
      : null,
  };
}

async function loadBenchmarkHousehold(admin) {
  const { data, error } = await admin
    .from("households")
    .select("id, name")
    .eq("name", HOUSEHOLD_NAME)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function assertNoProtectedCollision(admin) {
  const { data, error } = await admin
    .from("households")
    .select("id, name")
    .eq("name", HOUSEHOLD_NAME);
  if (error) throw error;
  if ((data ?? []).length > 1) {
    throw new Error("Multiple benchmark households found; cleanup first");
  }
}

async function ensureHousehold(admin) {
  await assertNoProtectedCollision(admin);
  const existing = await loadBenchmarkHousehold(admin);
  if (existing?.id) return existing.id;
  const { data, error } = await admin
    .from("households")
    .insert({
      name: HOUSEHOLD_NAME,
      base_currency: "VND",
      locale: "en-VN",
      timezone: "Asia/Ho_Chi_Minh",
    })
    .select("id, name")
    .single();
  if (error) throw error;
  if (data.name !== HOUSEHOLD_NAME) {
    throw new Error("Household insert returned unexpected name");
  }
  return data.id;
}

async function ensureAccounts(admin, householdId) {
  const specs = [...LIQUID_ACCOUNT_SPECS, ...EXCLUDED_ACCOUNT_SPECS];
  const { data: existing, error } = await admin
    .from("accounts")
    .select("id, name, type, is_archived")
    .eq("household_id", householdId);
  if (error) throw error;
  const byName = new Map((existing ?? []).map((row) => [row.name, row]));
  const missing = specs.filter((spec) => !byName.has(spec.name));
  if (missing.length > 0) {
    const { error: insertError } = await admin.from("accounts").insert(
      missing.map((spec) => ({
        household_id: householdId,
        name: spec.name,
        type: spec.type,
        opening_balance: spec.opening,
        is_archived: spec.archived === true,
        financial_scope: "household",
      })),
    );
    if (insertError) throw insertError;
  }
  const { data: rows, error: reloadError } = await admin
    .from("accounts")
    .select("id, name")
    .eq("household_id", householdId);
  if (reloadError) throw reloadError;
  const byKey = {};
  for (const spec of specs) {
    const row = (rows ?? []).find((item) => item.name === spec.name);
    if (!row) throw new Error(`Missing account ${spec.name}`);
    byKey[spec.key] = row.id;
  }
  return byKey;
}

async function countFixtureTransactions(admin, householdId) {
  const { count, error } = await admin
    .from("transactions")
    .select("id", { count: "exact", head: true })
    .eq("household_id", householdId)
    .like("note", `${NOTE_PREFIX}:%`);
  if (error) throw error;
  return count ?? 0;
}

async function setup() {
  const target = assertSafeTarget();
  const admin = adminClient();
  const count = targetCount();
  const householdId = await ensureHousehold(admin);
  const household = await loadBenchmarkHousehold(admin);
  if (!household || household.name !== HOUSEHOLD_NAME) {
    throw new Error("Safety check failed: benchmark household name mismatch");
  }
  const accountsByKey = await ensureAccounts(admin, householdId);
  const existing = await countFixtureTransactions(admin, householdId);
  const remaining = count - existing;
  if (remaining <= 0) {
    console.log(
      JSON.stringify({
        ok: true,
        mode: target.mode,
        hostname: target.hostname,
        householdId,
        householdName: HOUSEHOLD_NAME,
        count: existing,
        target: count,
      }),
    );
    return;
  }

  for (let offset = existing; offset < count; offset += BATCH_SIZE) {
    const size = Math.min(BATCH_SIZE, count - offset);
    const rows = Array.from({ length: size }, (_, index) =>
      buildRow(householdId, accountsByKey, offset + index),
    );
    const { error } = await admin.from("transactions").insert(rows);
    if (error) throw error;
  }

  const finalCount = await countFixtureTransactions(admin, householdId);
  console.log(
    JSON.stringify({
      ok: true,
      mode: target.mode,
      hostname: target.hostname,
      householdId,
      householdName: HOUSEHOLD_NAME,
      count: finalCount,
      target: count,
      liquidAccountIds: LIQUID_ACCOUNT_SPECS.map(
        (spec) => accountsByKey[spec.key],
      ),
      excludedAccountIds: EXCLUDED_ACCOUNT_SPECS.map(
        (spec) => accountsByKey[spec.key],
      ),
      creditTypes: CREDIT_TYPES,
      debitTypes: DEBIT_TYPES,
      balanceStatuses: BALANCE_STATUSES,
    }),
  );
}

async function status() {
  const target = assertSafeTarget();
  const admin = adminClient();
  const household = await loadBenchmarkHousehold(admin);
  if (!household) {
    console.log(JSON.stringify({ ok: true, mode: target.mode, exists: false }));
    return;
  }
  const count = await countFixtureTransactions(admin, household.id);
  const { count: totalTx } = await admin
    .from("transactions")
    .select("id", { count: "exact", head: true })
    .eq("household_id", household.id);
  console.log(
    JSON.stringify({
      ok: true,
      mode: target.mode,
      hostname: target.hostname,
      exists: true,
      householdId: household.id,
      householdName: household.name,
      fixtureCount: count,
      householdTransactionCount: totalTx ?? 0,
    }),
  );
}

async function cleanup() {
  const target = assertSafeTarget();
  const admin = adminClient();
  const household = await loadBenchmarkHousehold(admin);
  if (!household) {
    console.log(
      JSON.stringify({
        ok: true,
        mode: target.mode,
        cleaned: true,
        existed: false,
      }),
    );
    return;
  }
  if (household.name !== HOUSEHOLD_NAME) {
    throw new Error(
      "Refusing cleanup: household name is not the benchmark marker",
    );
  }
  const { error: txError } = await admin
    .from("transactions")
    .delete()
    .eq("household_id", household.id);
  if (txError) throw txError;
  const { error: accountError } = await admin
    .from("accounts")
    .delete()
    .eq("household_id", household.id);
  if (accountError) throw accountError;
  const { error: householdError } = await admin
    .from("households")
    .delete()
    .eq("id", household.id)
    .eq("name", HOUSEHOLD_NAME);
  if (householdError) throw householdError;
  console.log(
    JSON.stringify({
      ok: true,
      mode: target.mode,
      hostname: target.hostname,
      cleaned: true,
      householdId: household.id,
    }),
  );
}

const command = process.argv[2];
if (command === "setup") {
  await setup();
} else if (command === "cleanup") {
  await cleanup();
} else if (command === "status") {
  await status();
} else {
  throw new Error(
    "Usage: node scripts/perf-10k-transaction-fixture.mjs setup|status|cleanup",
  );
}
