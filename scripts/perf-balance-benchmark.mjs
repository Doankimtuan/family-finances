/**
 * Phase 2 balance benchmark: current Node aggregation vs SQL aggregate.
 *
 * Fail-closed like the fixture. Reads only the dedicated household
 * VINHA_PERF_BENCHMARK_DO_NOT_USE.
 *
 *   node scripts/perf-balance-benchmark.mjs
 */
/* eslint-disable no-console -- CLI benchmark reports JSON on stdout */
import { createClient } from "@supabase/supabase-js";
import nextEnv from "@next/env";

nextEnv.loadEnvConfig(process.cwd());

const HOUSEHOLD_NAME = "VINHA_PERF_BENCHMARK_DO_NOT_USE";
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1"]);
const REPEATS = 11;
const LIQUID_TYPES = [
  "cash",
  "checking",
  "savings",
  "ewallet",
  "brokerage",
  "other",
];
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
const CREDIT_SET = new Set(CREDIT_TYPES);
const DEBIT_SET = new Set(DEBIT_TYPES);

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
const serviceKey = (
  process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY
)?.trim();

function assertSafeTarget() {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is missing or invalid");
  }
  if (!serviceKey) throw new Error("Service role key is required");
  if (LOCAL_HOSTS.has(parsed.hostname)) {
    return { mode: "local", hostname: parsed.hostname };
  }
  if (process.env.VINHA_PERF_ALLOW_HOSTED !== "1") {
    throw new Error(
      `Refusing benchmark against non-local host ${parsed.hostname}`,
    );
  }
  const allowed = process.env.VINHA_PERF_ALLOWED_HOST?.trim();
  if (!allowed || parsed.hostname !== allowed) {
    throw new Error(
      "Hosted benchmark requires matching VINHA_PERF_ALLOWED_HOST",
    );
  }
  return { mode: "hosted", hostname: parsed.hostname };
}

function percentile(sorted, p) {
  if (sorted.length === 0) return null;
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil((p / 100) * sorted.length) - 1),
  );
  return sorted[index];
}

function summarize(samples) {
  const sorted = [...samples].sort((a, b) => a - b);
  return {
    n: sorted.length,
    min: sorted[0],
    median: percentile(sorted, 50),
    p95: percentile(sorted, 95),
    max: sorted[sorted.length - 1],
  };
}

function applyTransactionDeltas(accounts, deltas) {
  const byId = new Map(accounts.map((account) => [account.id, { ...account }]));
  for (const row of deltas) {
    const account = byId.get(row.accountId);
    if (!account) continue;
    const amount =
      typeof row.amount === "string" ? Number(row.amount) : row.amount;
    if (!Number.isFinite(amount)) continue;
    if (CREDIT_SET.has(row.type)) account.balance += amount;
    if (DEBIT_SET.has(row.type)) account.balance -= amount;
  }
  return Array.from(byId.values());
}

function signedSqlExpression() {
  const credits = CREDIT_TYPES.map((type) => `'${type}'`).join(", ");
  const debits = DEBIT_TYPES.map((type) => `'${type}'`).join(", ");
  const statuses = BALANCE_STATUSES.map((status) => `'${status}'`).join(", ");
  const liquids = LIQUID_TYPES.map((type) => `'${type}'`).join(", ");
  return { credits, debits, statuses, liquids };
}

async function timed(fn) {
  const memoryBefore = process.memoryUsage().heapUsed;
  const started = performance.now();
  const value = await fn();
  const elapsedMs = performance.now() - started;
  const memoryAfter = process.memoryUsage().heapUsed;
  return {
    value,
    elapsedMs,
    heapDeltaBytes: memoryAfter - memoryBefore,
    heapUsedBytes: memoryAfter,
  };
}

async function fetchPositionRows(admin, householdId) {
  const accountsStarted = performance.now();
  const { data: accountRows, error: accountError } = await admin
    .from("accounts")
    .select("id, name, type, opening_balance, is_archived")
    .eq("household_id", householdId)
    .eq("is_archived", false)
    .in("type", LIQUID_TYPES)
    .order("created_at", { ascending: true });
  const accountsMs = performance.now() - accountsStarted;
  if (accountError) throw accountError;

  const accountIds = (accountRows ?? []).map((row) => row.id);
  const txStarted = performance.now();
  const query = admin
    .from("transactions")
    .select("account_id, type, amount")
    .eq("household_id", householdId)
    .in("account_id", accountIds)
    .in("status", BALANCE_STATUSES);
  const { data: txRows, error: txError, count } = await query;
  const txMs = performance.now() - txStarted;
  if (txError) throw txError;

  const processStarted = performance.now();
  const accounts = applyTransactionDeltas(
    (accountRows ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      type: row.type,
      balance:
        typeof row.opening_balance === "string"
          ? Number(row.opening_balance)
          : Number(row.opening_balance),
    })),
    (txRows ?? []).map((row) => ({
      accountId: row.account_id,
      type: row.type,
      amount: row.amount,
    })),
  );
  const totalBalance = accounts.reduce(
    (sum, account) => sum + account.balance,
    0,
  );
  const processMs = performance.now() - processStarted;
  const payloadBytes = Buffer.byteLength(JSON.stringify(txRows ?? []), "utf8");

  return {
    accountsMs,
    txMs,
    processMs,
    totalMs: accountsMs + txMs + processMs,
    rowCount: (txRows ?? []).length,
    countHeader: count ?? null,
    payloadBytes,
    totalBalance,
    accounts: accounts.map((account) => ({
      id: account.id,
      name: account.name,
      type: account.type,
      balance: account.balance,
    })),
  };
}

async function fetchSqlAggregate(admin, householdId) {
  const { error } = await admin.rpc("vinha_perf_prototype_liquid_balances", {
    p_household_id: householdId,
  });
  if (error) {
    return { available: false, error: error.message, code: error.code };
  }
  const started = performance.now();
  const { data, error: rpcError } = await admin.rpc(
    "vinha_perf_prototype_liquid_balances",
    { p_household_id: householdId },
  );
  const elapsedMs = performance.now() - started;
  if (rpcError) {
    return { available: false, error: rpcError.message, code: rpcError.code };
  }
  const accounts = (data ?? []).map((row) => ({
    id: row.account_id,
    balance:
      typeof row.balance === "string"
        ? Number(row.balance)
        : Number(row.balance),
  }));
  const totalBalance = accounts.reduce(
    (sum, account) => sum + account.balance,
    0,
  );
  return {
    available: true,
    elapsedMs,
    rowCount: accounts.length,
    payloadBytes: Buffer.byteLength(JSON.stringify(data ?? []), "utf8"),
    totalBalance,
    accounts,
    warmupDiscarded: true,
  };
}

async function probeMaxRows(admin, householdId, accountIds) {
  const { data, error } = await admin
    .from("transactions")
    .select("id")
    .eq("household_id", householdId)
    .in("account_id", accountIds)
    .in("status", BALANCE_STATUSES)
    .range(0, 49_999);
  if (error) return { error: error.message };
  return { returned: (data ?? []).length };
}

async function main() {
  const target = assertSafeTarget();
  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: household, error: householdError } = await admin
    .from("households")
    .select("id, name, base_currency")
    .eq("name", HOUSEHOLD_NAME)
    .maybeSingle();
  if (householdError) throw householdError;
  if (!household?.id || household.name !== HOUSEHOLD_NAME) {
    throw new Error("Benchmark household not found. Run fixture setup first.");
  }

  const { count: totalTx } = await admin
    .from("transactions")
    .select("id", { count: "exact", head: true })
    .eq("household_id", household.id);

  const first = await fetchPositionRows(admin, household.id);
  const maxRows = await probeMaxRows(
    admin,
    household.id,
    first.accounts.map((account) => account.id),
  );

  const samples = [];
  for (let index = 0; index < REPEATS; index += 1) {
    const run = await timed(() => fetchPositionRows(admin, household.id));
    samples.push(run);
  }

  const sql = await fetchSqlAggregate(admin, household.id);
  const sqlSamples = [];
  if (sql.available) {
    for (let index = 0; index < REPEATS; index += 1) {
      const run = await timed(async () => {
        const { data, error } = await admin.rpc(
          "vinha_perf_prototype_liquid_balances",
          { p_household_id: household.id },
        );
        if (error) throw error;
        return data;
      });
      sqlSamples.push(run);
    }
  }

  const nodeTotals = summarize(samples.map((sample) => sample.value.totalMs));
  const nodeTx = summarize(samples.map((sample) => sample.value.txMs));
  const nodeProcess = summarize(
    samples.map((sample) => sample.value.processMs),
  );
  const nodeHeap = summarize(samples.map((sample) => sample.heapUsedBytes));
  const sqlTotals = sql.available
    ? summarize(sqlSamples.map((sample) => sample.elapsedMs))
    : null;

  const last = samples[samples.length - 1]?.value;
  const sqlMatch =
    sql.available && last
      ? last.totalBalance === sql.totalBalance &&
        last.accounts.length === sql.accounts.length &&
        last.accounts.every((account) => {
          const other = sql.accounts.find((row) => row.id === account.id);
          return other != null && other.balance === account.balance;
        })
      : null;

  const { credits, debits, statuses, liquids } = signedSqlExpression();
  const explainSql = `
SELECT a.id, a.opening_balance + COALESCE(SUM(
  CASE
    WHEN t.type IN (${credits}) THEN t.amount
    WHEN t.type IN (${debits}) THEN -t.amount
    ELSE 0
  END
), 0) AS balance
FROM public.accounts a
LEFT JOIN public.transactions t
  ON t.account_id = a.id
 AND t.household_id = a.household_id
 AND t.status IN (${statuses})
WHERE a.household_id = '${household.id}'::uuid
  AND a.is_archived = false
  AND a.type IN (${liquids})
GROUP BY a.id, a.opening_balance
`.trim();

  const currentRowSql = `
SELECT t.account_id, t.type, t.amount
FROM public.transactions t
WHERE t.household_id = '${household.id}'::uuid
  AND t.account_id IN (${last.accounts.map((account) => `'${account.id}'`).join(", ")})
  AND t.status IN (${statuses})
`.trim();

  console.log(
    JSON.stringify(
      {
        ok: true,
        mode: target.mode,
        hostname: target.hostname,
        householdId: household.id,
        householdName: household.name,
        currency: (household.base_currency ?? "VND").trim(),
        householdTransactionCount: totalTx ?? 0,
        warmupDiscarded: true,
        repeats: REPEATS,
        current: {
          rowsReturned: last.rowCount,
          payloadBytes: last.payloadBytes,
          totalBalance: last.totalBalance,
          accountBalances: last.accounts,
          maxRowsProbe: maxRows,
          truncated:
            typeof totalTx === "number" && last.rowCount < (totalTx ?? 0)
              ? last.rowCount < (totalTx ?? 0)
              : null,
          timingMs: {
            accounts: summarize(
              samples.map((sample) => sample.value.accountsMs),
            ),
            postgrestTx: nodeTx,
            nodeProcess: nodeProcess,
            total: nodeTotals,
          },
          heapUsedBytes: nodeHeap,
        },
        sql: {
          available: sql.available,
          error: sql.error ?? null,
          rowsReturned: sql.available ? sql.rowCount : null,
          payloadBytes: sql.available ? sql.payloadBytes : null,
          totalBalance: sql.available ? sql.totalBalance : null,
          timingMs: sqlTotals,
          exactMatch: sqlMatch,
        },
        explainQueries: {
          currentRowFetch: currentRowSql,
          sqlAggregate: explainSql,
        },
      },
      null,
      2,
    ),
  );
}

await main();
