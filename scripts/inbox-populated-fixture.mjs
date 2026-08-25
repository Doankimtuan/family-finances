/** Disposable populated Inbox fixture for the 18C.1 browser gate. */

import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import nextEnv from "@next/env";

nextEnv.loadEnvConfig(process.cwd());

const PREFIX = "INBOX 18C1";
const STATE_PATH = resolve(
  process.cwd(),
  "output/playwright/inbox-populated-fixture.json",
);
const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceKey = (
  process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY
)?.trim();
const email = process.env.E2E_USER_EMAIL?.trim().toLowerCase();
const password = process.env.E2E_USER_PASSWORD;

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const publicClient = createClient(
  url,
  (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )?.trim(),
  { auth: { persistSession: false, autoRefreshToken: false } },
);

function requireEnvironment() {
  const missing = [
    ["NEXT_PUBLIC_SUPABASE_URL", url],
    ["SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY", serviceKey],
    ["E2E_USER_EMAIL", email],
    ["E2E_USER_PASSWORD", password],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);
  if (missing.length) throw new Error(`Missing ${missing.join(", ")}`);
}

function fail(label, error) {
  if (error) throw new Error(`${label}: ${error.code ?? error.message}`);
}

function fixtureUuid(index) {
  return `18c10000-0000-4000-8000-${String(index).padStart(12, "0")}`;
}

function dateAt(index) {
  const hour = 23 - Math.floor(index / 4);
  const minute = index % 4;
  return `2027-08-24T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00Z`;
}

async function target() {
  const { data: auth, error: authError } =
    await publicClient.auth.signInWithPassword({
      email,
      password,
    });
  fail("authenticate E2E identity", authError);
  if (!auth.user) throw new Error("E2E identity did not resolve");

  const { data: membership, error } = await admin
    .from("household_members")
    .select("id, household_id, user_id")
    .eq("user_id", auth.user.id)
    .eq("is_active", true)
    .single();
  fail("resolve E2E household", error);
  if (!membership) throw new Error("E2E identity has no active household");

  const { data: members, error: membersError } = await admin
    .from("household_members")
    .select("id, user_id")
    .eq("household_id", membership.household_id)
    .eq("is_active", true)
    .neq("user_id", auth.user.id)
    .limit(1);
  fail("find second household member", membersError);

  if (members?.[0]) {
    return {
      userId: auth.user.id,
      householdId: membership.household_id,
      membership,
      otherMembership: members[0],
      createdUserId: null,
      createdMembershipId: null,
    };
  }

  const fixtureEmail = `inbox-18c1-${auth.user.id}@example.invalid`;
  const { data: fixtureUser, error: userError } =
    await admin.auth.admin.createUser({
      email: fixtureEmail,
      password: `Inbox18C1-${auth.user.id.slice(0, 8)}!aA1`,
      email_confirm: true,
      user_metadata: { fixture: PREFIX },
    });
  fail("create temporary fixture member", userError);
  if (!fixtureUser.user) throw new Error("temporary fixture member missing");

  const { data: otherMembership, error: membershipError } = await admin
    .from("household_members")
    .insert({
      household_id: membership.household_id,
      user_id: fixtureUser.user.id,
      role: "partner",
      is_active: true,
    })
    .select("id, user_id")
    .single();
  fail("create temporary fixture membership", membershipError);
  return {
    userId: auth.user.id,
    householdId: membership.household_id,
    membership,
    otherMembership,
    createdUserId: fixtureUser.user.id,
    createdMembershipId: otherMembership.id,
  };
}

async function readState() {
  try {
    return JSON.parse(await readFile(STATE_PATH, "utf8"));
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

async function cleanup() {
  requireEnvironment();
  const state = await readState();
  const context = state ?? (await target());
  const householdId = context.householdId ?? context.membership.household_id;

  const { error: inboxError } = await admin
    .from("inbox_items")
    .delete()
    .eq("household_id", householdId)
    .like("dedupe_key", `${PREFIX}|%`);
  fail("remove Inbox fixture", inboxError);

  for (const [table, name] of [
    ["loans", `${PREFIX} owner loan`],
    ["liabilities", `${PREFIX} non-owner debt`],
  ]) {
    const { data: rows, error } = await admin
      .from(table)
      .select("id")
      .eq("household_id", householdId)
      .eq("name", name);
    fail(`find fixture ${table}`, error);
    const sourceIds = (rows ?? []).map((row) => row.id);
    if (sourceIds.length) {
      const { error: sourceError } = await admin
        .from("inbox_items")
        .delete()
        .eq("household_id", householdId)
        .in("source_id", sourceIds);
      fail("remove source Inbox fixture rows", sourceError);
    }
  }

  for (const [table, name] of [
    ["loans", `${PREFIX} owner loan`],
    ["liabilities", `${PREFIX} non-owner debt`],
  ]) {
    const { error } = await admin
      .from(table)
      .delete()
      .eq("household_id", householdId)
      .eq("name", name);
    fail(`remove fixture ${table}`, error);
  }

  if (context.createdMembershipId) {
    const { error } = await admin
      .from("household_members")
      .delete()
      .eq("id", context.createdMembershipId);
    fail("remove temporary fixture membership", error);
  }
  if (context.createdUserId) {
    const { error } = await admin.auth.admin.deleteUser(context.createdUserId);
    fail("remove temporary fixture user", error);
  }
  await rm(STATE_PATH, { force: true });
  console.error(JSON.stringify({ status: "cleaned", householdId }));
}

function inboxRow({
  index,
  kind,
  sourceType,
  sourceId,
  amount,
  context,
  readAt,
  dedupeKey,
}) {
  return {
    id: fixtureUuid(index),
    household_id: context.householdId,
    kind,
    status: "pending",
    source_type: sourceType,
    source_id: sourceId,
    amount,
    currency: "VND",
    title: `${PREFIX} ${String(index).padStart(2, "0")}`,
    context_json: { version: 1, kind, data: context.data },
    expires_at: context.expiresAt ?? null,
    read_at: readAt ?? null,
    dedupe_key: dedupeKey ?? `${PREFIX}|${String(index).padStart(2, "0")}`,
    created_at: dateAt(index),
    updated_at: dateAt(index),
  };
}

async function setup() {
  requireEnvironment();
  await cleanup();
  const { userId, membership, otherMembership, createdUserId } = await target();
  const householdId = membership.household_id;
  const today = new Date().toISOString().slice(0, 10);
  const overdueDate = new Date(Date.now() - 86_400_000)
    .toISOString()
    .slice(0, 10);
  const dueSoonDate = new Date(Date.now() + 2 * 86_400_000)
    .toISOString()
    .slice(0, 10);
  const { count: baselineUnreadCount, error: baselineError } = await admin
    .from("inbox_items")
    .select("id", { count: "exact", head: true })
    .eq("household_id", householdId)
    .eq("status", "pending")
    .is("read_at", null);
  fail("read baseline Inbox unread count", baselineError);

  const { data: loan, error: loanError } = await admin
    .from("loans")
    .insert({
      household_id: householdId,
      name: `${PREFIX} owner loan`,
      lender: "18C1 Fixture Lender",
      loan_type: "personal_loan",
      principal: 2_000_000,
      remaining_principal: 2_000_000,
      annual_interest_rate: 0,
      start_date: today,
      expected_end_date: dueSoonDate,
      first_payment_date: overdueDate,
      repayment_frequency: "monthly",
      repayment_method: "reducing_balance",
      term_months: 2,
      monthly_payment: 1_000_000,
      total_interest: 0,
      total_repayment: 2_000_000,
      next_payment_date: overdueDate,
      due_day: 1,
      currency: "VND",
      status: "active",
      financial_scope: "personal",
      owner_membership_id: membership.id,
      created_by: userId,
    })
    .select("id")
    .single();
  fail("create owner Loan fixture", loanError);

  const { data: debt, error: debtError } = await admin
    .from("liabilities")
    .insert({
      household_id: householdId,
      name: `${PREFIX} non-owner debt`,
      creditor: "18C1 Fixture Creditor",
      principal_amount: 1_500_000,
      remaining_amount: 1_500_000,
      currency: "VND",
      due_date: dueSoonDate,
      status: "active",
      direction: "borrowed",
      creation_mode: "existing_balance",
      start_date: today,
      financial_scope: "personal",
      owner_membership_id: otherMembership.id,
      created_by: userId,
    })
    .select("id")
    .single();
  fail("create non-owner Debt fixture", debtError);

  const { error: staleGuidedError } = await admin
    .from("inbox_items")
    .delete()
    .eq("household_id", householdId)
    .eq("source_type", "guided")
    .in("source_id", [loan.id, debt.id]);
  fail("remove stale guided Inbox fixture rows", staleGuidedError);

  const rows = [];
  for (let index = 1; index <= 75; index += 1) {
    let kind = "emergency_declaration";
    let sourceType = "plan_movement";
    let sourceId = fixtureUuid(1000 + index);
    let data = { intentNote: `${PREFIX} review context ${index}` };
    let expiresAt = null;
    let dedupeKey;

    if (index === 1) {
      kind = "loan_payment_attention";
      sourceType = "guided";
      sourceId = loan.id;
      data = { loanId: loan.id, dueState: "overdue", dueDate: overdueDate };
      dedupeKey = `loan_payment_attention|guided|${loan.id}|none|none|none|loan-payment-attention`;
    } else if (index === 2) {
      kind = "debt_payment_attention";
      sourceType = "guided";
      sourceId = debt.id;
      data = { debtId: debt.id, dueState: "due_soon", dueDate: dueSoonDate };
      dedupeKey = `debt_payment_attention|guided|${debt.id}|none|none|none|debt-payment-attention`;
    } else if (index === 3) {
      kind = "savings_maturity";
      sourceType = "guided";
      sourceId = fixtureUuid(2003);
      data = {
        savingId: sourceId,
        cycleId: fixtureUuid(3003),
        providerName: `${PREFIX} Provider`,
        currentPackage: `${PREFIX} Package`,
        currentRate: 4,
        previousRate: null,
        rateDifference: 0,
        recommendedPackages: [],
        estimatedInterest: 10_000,
        configuredRenewalPreference: "manual_review",
        settlementRule: "roll_principal_interest",
        principal: 1_000_000,
        accruedInterest: 10_000,
        maturityDate: overdueDate,
      };
      expiresAt = `${dueSoonDate}T00:00:00.000Z`;
    } else if (index === 4) {
      kind = "unmapped_expense";
      sourceType = "transaction";
      sourceId = fixtureUuid(4004);
      data = { transactionId: sourceId };
    }

    rows.push(
      inboxRow({
        index,
        kind,
        sourceType,
        sourceId,
        amount: 100_000 + index,
        context: { householdId, data, expiresAt },
        readAt: index === 2 ? `${today}T01:00:00.000Z` : null,
        dedupeKey,
      }),
    );
  }

  const { error: inboxError } = await admin
    .from("inbox_items")
    .upsert(rows, { onConflict: "id" });
  fail("create Inbox fixture", inboxError);

  await mkdir(resolve(process.cwd(), "output/playwright"), { recursive: true });
  await writeFile(
    STATE_PATH,
    JSON.stringify(
      {
        householdId,
        loanId: loan.id,
        debtId: debt.id,
        createdUserId,
        createdMembershipId: createdUserId ? otherMembership.id : null,
        baselineUnreadCount: baselineUnreadCount ?? 0,
        itemIds: rows.map((row) => row.id),
        unreadItemId: rows[0].id,
        readItemId: rows[1].id,
      },
      null,
      2,
    ),
  );
  console.error(
    JSON.stringify({ status: "ready", householdId, items: rows.length }),
  );
}

const command = process.argv[2];
if (command === "setup") await setup();
else if (command === "cleanup") await cleanup();
else throw new Error("Use setup or cleanup");
