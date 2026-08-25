/**
 * Disposable authenticated Loan fixture for the 11E browser gate.
 *
 *   node scripts/loans-fixture.mjs setup
 *   node scripts/loans-fixture.mjs cleanup
 *
 * Uses the configured E2E identity to resolve its existing household, then
 * uses the service key only for isolated fixture rows and cleanup.
 */

import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const FIXTURE = {
  loanName: "Loans 11E disposable loan",
  lender: "Fixture lender",
  accountName: "Cash",
  principal: 24_000_000,
  monthlyPrincipal: 1_000_000,
  monthlyInterest: 100_000,
  termMonths: 24,
  currency: "VND",
  statePath: resolve(process.cwd(), "output/playwright/loans-fixture.json"),
};

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

function monthDate(base, offset) {
  const date = new Date(`${base}T00:00:00.000Z`);
  date.setUTCMonth(date.getUTCMonth() + offset);
  return isoDate(date);
}

function dayDate(base, offset) {
  const date = new Date(`${base}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + offset);
  return isoDate(date);
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

async function cleanup() {
  requireEnvironment();
  const { membership, admin } = await householdContext();
  const state = await readState();
  const loanQuery = admin
    .from("loans")
    .select("id")
    .eq("household_id", membership.household_id)
    .eq("name", FIXTURE.loanName)
    .limit(1);
  const { data: loans, error: loanError } = await loanQuery;
  fail("find Loan fixture", loanError);
  const loanId = state?.loanId ?? loans?.[0]?.id;
  if (!loanId) return;

  const { data: payments, error: paymentsError } = await admin
    .from("loan_payments")
    .select("id")
    .eq("loan_id", loanId);
  fail("find fixture payments", paymentsError);
  const paymentIds = (payments ?? []).map((row) => row.id);

  let transactionIds = [];
  if (paymentIds.length > 0) {
    const { data: transactions, error: transactionsError } = await admin
      .from("transactions")
      .select("id")
      .in("loan_payment_id", paymentIds);
    fail("find fixture transactions", transactionsError);
    transactionIds = (transactions ?? []).map((row) => row.id);
  }

  if (transactionIds.length > 0) {
    const { error } = await admin
      .from("transaction_tag_assignments")
      .delete()
      .in("transaction_id", transactionIds);
    fail("remove fixture transaction tags", error);
    const { error: inboxError } = await admin
      .from("inbox_items")
      .delete()
      .in("source_id", transactionIds);
    fail("remove fixture Inbox items", inboxError);
    const { error: unlinkError } = await admin
      .from("transactions")
      .update({ loan_payment_id: null })
      .in("id", transactionIds);
    fail("unlink fixture transactions", unlinkError);
  }

  if (paymentIds.length > 0) {
    const { error } = await admin
      .from("loan_payments")
      .delete()
      .in("id", paymentIds);
    fail("remove fixture payments", error);
  }

  if (transactionIds.length > 0) {
    const { error } = await admin
      .from("transactions")
      .delete()
      .in("id", transactionIds);
    fail("remove fixture transactions", error);
  }

  for (const table of ["loan_schedule_entries", "loan_interest_rate_periods"]) {
    const { error } = await admin.from(table).delete().eq("loan_id", loanId);
    fail(`remove fixture ${table}`, error);
  }
  const { error: loanDeleteError } = await admin
    .from("loans")
    .delete()
    .eq("id", loanId)
    .eq("name", FIXTURE.loanName);
  fail("remove fixture Loan", loanDeleteError);

  if (state?.accountId) {
    const { error: accountError } = await admin
      .from("accounts")
      .delete()
      .eq("id", state.accountId)
      .eq("name", FIXTURE.accountName);
    fail("remove fixture account", accountError);
  }
  await rm(FIXTURE.statePath, { force: true });
  console.error(JSON.stringify({ status: "cleaned", loanId }));
}

async function setup() {
  requireEnvironment();
  await cleanup();
  const { userId, membership, admin } = await householdContext();
  const today = isoDate(new Date());
  const firstDue = dayDate(today, -1);
  const schedule = Array.from({ length: FIXTURE.termMonths }, (_, index) => {
    const sequence = index + 1;
    const dueDate = sequence === 1 ? firstDue : monthDate(today, sequence - 1);
    return {
      household_id: membership.household_id,
      sequence,
      due_date: dueDate,
      principal_due: FIXTURE.monthlyPrincipal,
      interest_due: FIXTURE.monthlyInterest,
      total_due: FIXTURE.monthlyPrincipal + FIXTURE.monthlyInterest,
      remaining_balance_after:
        FIXTURE.principal - sequence * FIXTURE.monthlyPrincipal,
      status: "upcoming",
    };
  });

  const { data: account, error: accountError } = await admin
    .from("accounts")
    .insert({
      household_id: membership.household_id,
      name: FIXTURE.accountName,
      type: "cash",
      opening_balance: 50_000_000,
      created_by: userId,
    })
    .select("id")
    .single();
  fail("create fixture account", accountError);

  const { data: loan, error: loanError } = await admin
    .from("loans")
    .insert({
      household_id: membership.household_id,
      name: FIXTURE.loanName,
      lender: FIXTURE.lender,
      loan_type: "home",
      principal: FIXTURE.principal,
      remaining_principal: FIXTURE.principal,
      annual_interest_rate: 10,
      interest_strategy: "fixed",
      start_date: monthDate(today, -1),
      expected_end_date: schedule.at(-1).due_date,
      first_payment_date: firstDue,
      repayment_frequency: "monthly",
      repayment_method: "reducing_balance",
      term_months: FIXTURE.termMonths,
      monthly_payment: FIXTURE.monthlyPrincipal + FIXTURE.monthlyInterest,
      total_interest: FIXTURE.termMonths * FIXTURE.monthlyInterest,
      total_repayment:
        FIXTURE.principal + FIXTURE.termMonths * FIXTURE.monthlyInterest,
      next_payment_date: firstDue,
      due_day: new Date(`${today}T00:00:00.000Z`).getUTCDate(),
      currency: FIXTURE.currency,
      status: "active",
      note: "Disposable 11E browser fixture",
      financial_scope: "household",
      created_by: userId,
    })
    .select("id")
    .single();
  fail("create fixture Loan", loanError);

  const scheduleRows = schedule.map((entry) => ({
    ...entry,
    loan_id: loan.id,
  }));
  const { error: scheduleError } = await admin
    .from("loan_schedule_entries")
    .insert(scheduleRows);
  fail("create fixture schedule", scheduleError);

  const { error: rateError } = await admin
    .from("loan_interest_rate_periods")
    .insert({
      household_id: membership.household_id,
      loan_id: loan.id,
      sequence: 1,
      effective_from: monthDate(today, -1),
      annual_rate: 10,
      kind: "fixed",
      created_by: userId,
    });
  fail("create fixture rate history", rateError);

  await mkdir(dirname(FIXTURE.statePath), { recursive: true });
  await writeFile(
    FIXTURE.statePath,
    JSON.stringify(
      {
        householdId: membership.household_id,
        loanId: loan.id,
        accountId: account.id,
      },
      null,
      2,
    ),
  );
  console.error(
    JSON.stringify({
      status: "ready",
      loanId: loan.id,
      accountId: account.id,
      scheduleEntries: scheduleRows.length,
    }),
  );
}

const command = process.argv[2];
if (command === "setup") await setup();
else if (command === "cleanup") await cleanup();
else throw new Error("Use setup or cleanup");
