/**
 * Disposable populated Loans benchmark fixture for the linked development project.
 *
 *   VINHA_LOANS_FIXTURE=1 node scripts/loans-populated-fixture.mjs setup
 *   VINHA_LOANS_FIXTURE=1 node scripts/loans-populated-fixture.mjs cleanup
 *
 * The service key is used only by this development fixture script. The
 * application continues to use the publishable key and normal RLS paths.
 */

import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const FIXTURE_FLAG = "VINHA_LOANS_FIXTURE";
const FIXTURE_ENABLED = "1";
const FIXTURE = {
  marker: "Loans populated benchmark fixture",
  accountName: "Loans populated benchmark fixture account",
  currency: "VND",
  statePath: resolve(
    process.cwd(),
    "output/playwright/loans-populated-fixture.json",
  ),
};
const LOAN_STATUS = { ACTIVE: "active", COMPLETED: "completed" };
const SCHEDULE_STATUS = { UPCOMING: "upcoming", PAID: "paid" };
const FIXTURE_LOANS = [
  {
    key: "active-household",
    name: `${FIXTURE.marker} active household`,
    lender: "Benchmark Bank",
    loanType: "home",
    principal: 48_000_000,
    monthlyPrincipal: 2_000_000,
    monthlyInterest: 400_000,
    termMonths: 24,
    paidPeriods: 3,
    firstDueOffset: 7,
    financialScope: "household",
    interestStrategy: "fixed",
    annualInterestRate: 10,
  },
  {
    key: "active-personal",
    name: `${FIXTURE.marker} active personal`,
    lender: "Benchmark Auto Finance",
    loanType: "vehicle",
    principal: 30_000_000,
    monthlyPrincipal: 1_500_000,
    monthlyInterest: 250_000,
    termMonths: 20,
    paidPeriods: 2,
    firstDueOffset: 3,
    financialScope: "personal",
    interestStrategy: "promo_fixed_to_floating",
    annualInterestRate: 6,
    promoFixedRate: 6,
    promoFixedMonths: 6,
    promoFloatingRate: 11,
  },
  {
    key: "active-overdue",
    name: `${FIXTURE.marker} active overdue`,
    lender: "Benchmark Family Finance",
    loanType: "personal_loan",
    principal: 18_000_000,
    monthlyPrincipal: 1_000_000,
    monthlyInterest: 180_000,
    termMonths: 18,
    paidPeriods: 0,
    firstDueOffset: -2,
    financialScope: "household",
    interestStrategy: "fixed",
    annualInterestRate: 12,
  },
  {
    key: "completed-history",
    name: `${FIXTURE.marker} completed history`,
    lender: "Benchmark Family Finance",
    loanType: "family_loan",
    principal: 12_000_000,
    monthlyPrincipal: 1_000_000,
    monthlyInterest: 100_000,
    termMonths: 12,
    paidPeriods: 12,
    firstDueOffset: -420,
    financialScope: "household",
    interestStrategy: "fixed",
    annualInterestRate: 10,
  },
];

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const anonKey = (
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)?.trim();
const serviceKey = (
  process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY
)?.trim();
const email = process.env.E2E_USER_EMAIL?.trim();
const password = process.env.E2E_USER_PASSWORD;

function requireEnvironment() {
  if (process.env[FIXTURE_FLAG] !== FIXTURE_ENABLED) {
    throw new Error(
      `${FIXTURE_FLAG}=1 is required for development fixture mutations`,
    );
  }
  const missing = [
    ["NEXT_PUBLIC_SUPABASE_URL", url],
    [
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY",
      anonKey,
    ],
    ["SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY", serviceKey],
    ["E2E_USER_EMAIL", email],
    ["E2E_USER_PASSWORD", password],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);
  if (missing.length > 0) throw new Error(`Missing ${missing.join(", ")}`);
}

function publicClient() {
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function adminClient() {
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function fail(label, error) {
  if (error) throw new Error(`${label}: ${error.code ?? error.message}`);
}

function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

function shiftDate(base, unit, offset) {
  const date = new Date(`${base}T00:00:00.000Z`);
  if (unit === "month") date.setUTCMonth(date.getUTCMonth() + offset);
  else date.setUTCDate(date.getUTCDate() + offset);
  return isoDate(date);
}

function monthDate(base, offset) {
  return shiftDate(base, "month", offset);
}

function dayDate(base, offset) {
  return shiftDate(base, "day", offset);
}

async function householdContext() {
  const client = publicClient();
  const { data: auth, error: authError } = await client.auth.signInWithPassword(
    {
      email,
      password,
    },
  );
  fail("authenticate E2E identity", authError);
  if (!auth.user) throw new Error("E2E identity did not resolve");

  const { data: membership, error: membershipError } = await client
    .from("household_members")
    .select("id, household_id")
    .eq("user_id", auth.user.id)
    .eq("is_active", true)
    .single();
  fail("resolve E2E household", membershipError);
  if (!membership) throw new Error("E2E identity has no active household");
  return { userId: auth.user.id, membership, admin: adminClient() };
}

async function readState() {
  try {
    return JSON.parse(await readFile(FIXTURE.statePath, "utf8"));
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

async function writeState(state) {
  await mkdir(dirname(FIXTURE.statePath), { recursive: true });
  await writeFile(FIXTURE.statePath, JSON.stringify(state, null, 2));
}

async function idsFor(admin, table, column, ids) {
  if (ids.length === 0) return [];
  const { data, error } = await admin.from(table).select("id").in(column, ids);
  fail(`find fixture ${table}`, error);
  return (data ?? []).map((row) => row.id);
}

async function cleanup() {
  requireEnvironment();
  const { membership, admin } = await householdContext();
  const state = await readState();
  const recordedLoanIds = state?.loanIds ?? [];
  let loanIds = recordedLoanIds;
  if (loanIds.length === 0) {
    const { data, error } = await admin
      .from("loans")
      .select("id")
      .eq("household_id", membership.household_id)
      .like("name", `${FIXTURE.marker}%`);
    fail("find benchmark loans", error);
    loanIds = (data ?? []).map((row) => row.id);
  }

  const paymentIds = [
    ...(state?.paymentIds ?? []),
    ...(await idsFor(admin, "loan_payments", "loan_id", loanIds)),
  ];
  const transactionIds = [
    ...(state?.transactionIds ?? []),
    ...(await idsFor(admin, "transactions", "loan_payment_id", paymentIds)),
  ];
  const uniquePaymentIds = [...new Set(paymentIds)];
  const uniqueTransactionIds = [...new Set(transactionIds)];

  if (uniqueTransactionIds.length > 0) {
    const { error: tagError } = await admin
      .from("transaction_tag_assignments")
      .delete()
      .in("transaction_id", uniqueTransactionIds);
    fail("remove fixture transaction tags", tagError);
    const { error: inboxError } = await admin
      .from("inbox_items")
      .delete()
      .in("source_id", uniqueTransactionIds);
    fail("remove fixture Inbox items", inboxError);
    const { error: unlinkError } = await admin
      .from("transactions")
      .update({ loan_payment_id: null })
      .in("id", uniqueTransactionIds);
    fail("unlink fixture transactions", unlinkError);
  }
  if (uniquePaymentIds.length > 0) {
    const { error } = await admin
      .from("loan_payments")
      .delete()
      .in("id", uniquePaymentIds);
    fail("remove fixture payments", error);
  }
  if (uniqueTransactionIds.length > 0) {
    const { error } = await admin
      .from("transactions")
      .delete()
      .in("id", uniqueTransactionIds);
    fail("remove fixture transactions", error);
  }
  const scheduleIds = state?.scheduleIds ?? [];
  const ratePeriodIds = state?.ratePeriodIds ?? [];
  for (const [table, ids] of [
    ["loan_schedule_entries", scheduleIds],
    ["loan_interest_rate_periods", ratePeriodIds],
  ]) {
    const query = ids.length
      ? admin.from(table).delete().in("id", ids)
      : admin.from(table).delete().in("loan_id", loanIds);
    const { error } = await query;
    fail(`remove fixture ${table}`, error);
  }
  if (loanIds.length > 0) {
    const { error } = await admin
      .from("loans")
      .delete()
      .in("id", loanIds)
      .like("name", `${FIXTURE.marker}%`);
    fail("remove fixture loans", error);
  }
  const accountId = state?.accountId;
  if (accountId) {
    const { error } = await admin
      .from("accounts")
      .delete()
      .eq("id", accountId)
      .eq("name", FIXTURE.accountName);
    fail("remove fixture account", error);
  }
  await rm(FIXTURE.statePath, { force: true });
  console.error(
    JSON.stringify({
      status: "cleaned",
      loans: loanIds.length,
      payments: uniquePaymentIds.length,
      transactions: uniqueTransactionIds.length,
      scheduleEntries: state?.scheduleIds?.length ?? null,
      ratePeriods: state?.ratePeriodIds?.length ?? null,
    }),
  );
}

async function insertRows(admin, table, rows, label) {
  const { data, error } = await admin.from(table).insert(rows).select("id");
  fail(label, error);
  return data ?? [];
}

function buildSchedule(spec, today, householdId) {
  const firstDue = dayDate(today, spec.firstDueOffset);
  return Array.from({ length: spec.termMonths }, (_, index) => {
    const sequence = index + 1;
    const dueDate = monthDate(firstDue, index);
    const isPaid = index < spec.paidPeriods;
    return {
      household_id: householdId,
      sequence,
      due_date: dueDate,
      principal_due: spec.monthlyPrincipal,
      interest_due: spec.monthlyInterest,
      total_due: spec.monthlyPrincipal + spec.monthlyInterest,
      remaining_balance_after: Math.max(
        0,
        spec.principal - sequence * spec.monthlyPrincipal,
      ),
      status: isPaid ? SCHEDULE_STATUS.PAID : SCHEDULE_STATUS.UPCOMING,
      paid_at: isPaid ? dayDate(dueDate, -1) : null,
    };
  });
}

function buildRatePeriods(spec, firstDue, userId) {
  const base = {
    sequence: 1,
    effective_from: firstDue,
    annual_rate: spec.annualInterestRate,
    kind: "fixed",
    created_by: userId,
  };
  if (spec.interestStrategy !== "promo_fixed_to_floating") return [base];
  const switchDate = monthDate(firstDue, spec.promoFixedMonths);
  return [
    {
      ...base,
      annual_rate: spec.promoFixedRate,
      kind: "promotional",
      effective_to: switchDate,
    },
    {
      sequence: 2,
      effective_from: switchDate,
      annual_rate: spec.promoFloatingRate,
      kind: "floating",
      created_by: userId,
    },
  ];
}

async function setup() {
  requireEnvironment();
  await cleanup();
  const { userId, membership, admin } = await householdContext();
  const today = isoDate(new Date());
  const state = {
    householdId: membership.household_id,
    membershipId: membership.id,
    accountId: null,
    loanIds: [],
    paymentIds: [],
    transactionIds: [],
    scheduleIds: [],
    ratePeriodIds: [],
  };

  const [account] = await insertRows(
    admin,
    "accounts",
    [
      {
        household_id: membership.household_id,
        name: FIXTURE.accountName,
        type: "cash",
        opening_balance: 100_000_000,
        created_by: userId,
      },
    ],
    "create fixture account",
  );
  state.accountId = account.id;
  await writeState(state);

  for (const spec of FIXTURE_LOANS) {
    const schedule = buildSchedule(spec, today, membership.household_id);
    const firstDue = schedule[0].due_date;
    const nextEntry = schedule.find(
      (entry) => entry.status === SCHEDULE_STATUS.UPCOMING,
    );
    const paidPrincipal = spec.paidPeriods * spec.monthlyPrincipal;
    const [loan] = await insertRows(
      admin,
      "loans",
      [
        {
          household_id: membership.household_id,
          name: spec.name,
          lender: spec.lender,
          loan_type: spec.loanType,
          principal: spec.principal,
          remaining_principal: spec.principal - paidPrincipal,
          annual_interest_rate: spec.annualInterestRate,
          interest_strategy: spec.interestStrategy,
          promo_fixed_rate: spec.promoFixedRate ?? null,
          promo_fixed_months: spec.promoFixedMonths ?? null,
          promo_floating_rate: spec.promoFloatingRate ?? null,
          promo_rate_effective_on:
            spec.promoFixedMonths == null
              ? null
              : monthDate(firstDue, spec.promoFixedMonths),
          start_date: monthDate(firstDue, -1),
          expected_end_date: schedule.at(-1).due_date,
          first_payment_date: firstDue,
          repayment_frequency: "monthly",
          repayment_method: "reducing_balance",
          term_months: spec.termMonths,
          monthly_payment: spec.monthlyPrincipal + spec.monthlyInterest,
          total_interest: spec.termMonths * spec.monthlyInterest,
          total_repayment:
            spec.principal + spec.termMonths * spec.monthlyInterest,
          next_payment_date: nextEntry?.due_date ?? null,
          due_day: Number(firstDue.slice(-2)),
          currency: FIXTURE.currency,
          status:
            spec.paidPeriods === spec.termMonths
              ? LOAN_STATUS.COMPLETED
              : LOAN_STATUS.ACTIVE,
          note: `${FIXTURE.marker} synthetic data`,
          created_by: userId,
          financial_scope: spec.financialScope,
          owner_membership_id:
            spec.financialScope === "personal" ? membership.id : null,
          idempotency_key: `${FIXTURE.marker}:${spec.key}`,
        },
      ],
      `create fixture loan ${spec.key}`,
    );
    state.loanIds.push(loan.id);

    const scheduleRows = await insertRows(
      admin,
      "loan_schedule_entries",
      schedule.map((entry) => ({ ...entry, loan_id: loan.id })),
      `create fixture schedule ${spec.key}`,
    );
    state.scheduleIds.push(...scheduleRows.map((row) => row.id));

    const rateRows = buildRatePeriods(spec, firstDue, userId).map((entry) => ({
      ...entry,
      household_id: membership.household_id,
      loan_id: loan.id,
    }));
    const insertedRateRows = await insertRows(
      admin,
      "loan_interest_rate_periods",
      rateRows,
      `create fixture rate periods ${spec.key}`,
    );
    state.ratePeriodIds.push(...insertedRateRows.map((row) => row.id));

    for (let index = 0; index < spec.paidPeriods; index += 1) {
      const entry = schedule[index];
      const [transaction] = await insertRows(
        admin,
        "transactions",
        [
          {
            household_id: membership.household_id,
            account_id: state.accountId,
            type: "liability_payment",
            amount: entry.total_due,
            currency: FIXTURE.currency,
            transaction_date: entry.paid_at,
            note: `${FIXTURE.marker} payment ${spec.key}-${index + 1}`,
            status: "posted",
            idempotency_key: `${FIXTURE.marker}:transaction:${spec.key}:${index + 1}`,
            created_by: userId,
            source: "manual",
          },
        ],
        `create fixture transaction ${spec.key}-${index + 1}`,
      );
      const [payment] = await insertRows(
        admin,
        "loan_payments",
        [
          {
            household_id: membership.household_id,
            loan_id: loan.id,
            account_id: state.accountId,
            transaction_id: transaction.id,
            amount: entry.total_due,
            principal_paid: entry.principal_due,
            interest_paid: entry.interest_due,
            paid_at: entry.paid_at,
            created_by: userId,
            idempotency_key: `${FIXTURE.marker}:payment:${spec.key}:${index + 1}`,
          },
        ],
        `create fixture payment ${spec.key}-${index + 1}`,
      );
      const { error: linkTransactionError } = await admin
        .from("transactions")
        .update({ loan_payment_id: payment.id })
        .eq("id", transaction.id);
      fail(
        `link fixture payment ${spec.key}-${index + 1}`,
        linkTransactionError,
      );
      const { error: linkScheduleError } = await admin
        .from("loan_schedule_entries")
        .update({ loan_payment_id: payment.id })
        .eq("id", scheduleRows[index].id);
      fail(`link fixture schedule ${spec.key}-${index + 1}`, linkScheduleError);
      state.transactionIds.push(transaction.id);
      state.paymentIds.push(payment.id);
    }
    await writeState(state);
  }

  console.error(JSON.stringify({ status: "ready", ...state }));
}

const command = process.argv[2];
if (command === "setup") await setup();
else if (command === "cleanup") await cleanup();
else throw new Error("Use setup or cleanup");
