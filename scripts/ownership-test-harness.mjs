/**
 * Dedicated ownership validation harness.
 *
 * Commands:
 *   node scripts/ownership-test-harness.mjs preflight
 *   node scripts/ownership-test-harness.mjs setup
 *   node scripts/ownership-test-harness.mjs cleanup
 *
 * Setup uses the service role only to provision isolated fixtures. Returned
 * A/B clients use the public key and real password sessions for RPC calls.
 */

import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const HARNESS = {
  householdName: "Family Finance Ownership Test",
  accountType: "cash",
  currency: "VND",
  roleAdmin: "admin",
  rolePartner: "partner",
  personal: "personal",
  household: "household",
  active: "active",
  pending: "pending",
  today: new Date().toISOString().slice(0, 10),
};

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator < 0) continue;
    const key = trimmed.slice(0, separator);
    if (!process.env[key]) process.env[key] = trimmed.slice(separator + 1);
  }
}

loadEnvLocal();

const env = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL?.trim(),
  anonKey: (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )?.trim(),
  serviceKey: (
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY
  )?.trim(),
  users: {
    admin: {
      email: process.env.OWNERSHIP_TEST_A_EMAIL?.trim(),
      password: process.env.OWNERSHIP_TEST_A_PASSWORD,
    },
    partner: {
      email: process.env.OWNERSHIP_TEST_B_EMAIL?.trim(),
      password: process.env.OWNERSHIP_TEST_B_PASSWORD,
    },
  },
};

function missingEnvironment({ needsServiceRole = false } = {}) {
  const required = [
    ["NEXT_PUBLIC_SUPABASE_URL", env.url],
    [
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY",
      env.anonKey,
    ],
    ["OWNERSHIP_TEST_A_EMAIL", env.users.admin.email],
    ["OWNERSHIP_TEST_A_PASSWORD", env.users.admin.password],
    ["OWNERSHIP_TEST_B_EMAIL", env.users.partner.email],
    ["OWNERSHIP_TEST_B_PASSWORD", env.users.partner.password],
  ];
  if (needsServiceRole)
    required.push([
      "SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY",
      env.serviceKey,
    ]);
  return required.filter(([, value]) => !value).map(([name]) => name);
}

function publicClient() {
  return createClient(env.url, env.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function adminClient() {
  return createClient(env.url, env.serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function fail(message) {
  throw new Error(message);
}

async function one(query, label) {
  const { data, error } = await query.select().single();
  if (error) fail(`${label}: ${error.code ?? "unknown"}`);
  return data;
}

async function findUser(admin, email) {
  const { data, error } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (error) fail(`list auth users: ${error.code ?? "unknown"}`);
  return (
    data.users.find(
      (user) => user.email?.toLowerCase() === email.toLowerCase(),
    ) ?? null
  );
}

async function ensureUser(admin, identity) {
  const existing = await findUser(admin, identity.email);
  if (existing) return existing;
  const { data, error } = await admin.auth.admin.createUser({
    email: identity.email,
    password: identity.password,
    email_confirm: true,
    user_metadata: { ownership_test_identity: true },
  });
  if (error) fail(`create dedicated auth user: ${error.code ?? "unknown"}`);
  return data.user;
}

async function activeMemberships(admin, userId) {
  const { data, error } = await admin
    .from("household_members")
    .select("id, household_id, role, is_active")
    .eq("user_id", userId)
    .eq("is_active", true);
  if (error) fail(`read active memberships: ${error.code ?? "unknown"}`);
  return data ?? [];
}

async function ensureHousehold(admin, users) {
  const { data: households, error } = await admin
    .from("households")
    .select("id, name")
    .eq("name", HARNESS.householdName)
    .limit(2);
  if (error) fail(`find controlled household: ${error.code ?? "unknown"}`);
  if ((households ?? []).length > 1)
    fail("multiple controlled households found; cleanup manually");

  for (const user of users) {
    const memberships = await activeMemberships(admin, user.id);
    if (
      memberships.some(
        (membership) => membership.household_id !== households?.[0]?.id,
      )
    ) {
      fail(`refusing to move an existing active membership for ${user.email}`);
    }
  }

  const household =
    households?.[0] ??
    (await one(
      admin.from("households").insert({
        name: HARNESS.householdName,
        base_currency: HARNESS.currency,
        locale: "en-VN",
        timezone: "Asia/Ho_Chi_Minh",
        created_by: users[0].id,
      }),
      "create controlled household",
    ));

  const { data: householdMembers, error: householdMembersError } = await admin
    .from("household_members")
    .select("user_id")
    .eq("household_id", household.id);
  if (householdMembersError)
    fail(
      `verify controlled household members: ${householdMembersError.code ?? "unknown"}`,
    );
  const dedicatedUserIds = new Set(users.map((user) => user.id));
  if (
    (householdMembers ?? []).some(
      (member) => !dedicatedUserIds.has(member.user_id),
    )
  )
    fail("refusing controlled household: it contains a non-dedicated user");

  const roles = [HARNESS.roleAdmin, HARNESS.rolePartner];
  for (const [index, user] of users.entries()) {
    const existing = await activeMemberships(admin, user.id);
    if (existing.length === 0) {
      await one(
        admin.from("household_members").insert({
          household_id: household.id,
          user_id: user.id,
          role: roles[index],
          is_active: true,
        }),
        `create ${roles[index]} membership`,
      );
    } else if (existing[0].role !== roles[index]) {
      fail(`controlled membership role mismatch for ${user.email}`);
    }
  }

  const { data: account, error: accountError } = await admin
    .from("accounts")
    .select("id")
    .eq("household_id", household.id)
    .eq("name", "Ownership test cash")
    .maybeSingle();
  if (accountError)
    fail(`find controlled cash account: ${accountError.code ?? "unknown"}`);
  if (!account)
    await one(
      admin.from("accounts").insert({
        household_id: household.id,
        name: "Ownership test cash",
        type: HARNESS.accountType,
        opening_balance: 0,
        created_by: users[0].id,
      }),
      "create controlled cash account",
    );
  return household;
}

export async function signInTestIdentity(identity) {
  const client = publicClient();
  const { data, error } = await client.auth.signInWithPassword(identity);
  if (error || !data.session || !data.user)
    fail(`test identity authentication failed: ${error?.code ?? "unknown"}`);
  const { data: membership, error: membershipError } = await client
    .from("household_members")
    .select("id, household_id, role")
    .eq("user_id", data.user.id)
    .eq("is_active", true)
    .single();
  if (membershipError || !membership)
    fail(
      `test identity membership unavailable: ${membershipError?.code ?? "unknown"}`,
    );
  const { data: household, error: householdError } = await client
    .from("households")
    .select("name")
    .eq("id", membership.household_id)
    .single();
  if (householdError || household?.name !== HARNESS.householdName)
    fail("test identity is not in the controlled household");
  return {
    client,
    accessToken: data.session.access_token,
    userId: data.user.id,
    membership,
  };
}

export async function createValidCard(
  admin,
  householdId,
  ownerMembershipId,
  createdBy,
) {
  const account = await one(
    admin.from("accounts").insert({
      household_id: householdId,
      name: `Ownership card ${ownerMembershipId.slice(0, 8)}`,
      type: "credit_card",
      financial_scope: HARNESS.personal,
      owner_membership_id: ownerMembershipId,
      created_by: createdBy,
    }),
    "create valid card account",
  );
  await one(
    admin.from("credit_card_settings").insert({
      account_id: account.id,
      household_id: householdId,
      credit_limit: 10000000,
      statement_day: 25,
      due_day: 15,
    }),
    "create card settings",
  );
  const billing = await one(
    admin.from("card_billing_months").insert({
      household_id: householdId,
      card_account_id: account.id,
      billing_month: `${HARNESS.today.slice(0, 7)}-01`,
      statement_amount: 100000,
      paid_amount: 0,
      due_date: HARNESS.today,
      status: "open",
    }),
    "create open card billing month",
  );
  return { account, billing };
}

export async function createValidLoan(
  admin,
  householdId,
  ownerMembershipId,
  createdBy,
) {
  const loan = await one(
    admin.from("loans").insert({
      household_id: householdId,
      name: "Ownership test loan",
      lender: "Test lender",
      loan_type: "other",
      principal: 1000000,
      remaining_principal: 1000000,
      annual_interest_rate: 0,
      start_date: HARNESS.today,
      expected_end_date: HARNESS.today,
      first_payment_date: HARNESS.today,
      repayment_frequency: "monthly",
      repayment_method: "fixed_monthly",
      term_months: 1,
      monthly_payment: 1000000,
      total_interest: 0,
      total_repayment: 1000000,
      next_payment_date: HARNESS.today,
      due_day: 15,
      currency: HARNESS.currency,
      status: HARNESS.active,
      financial_scope: HARNESS.personal,
      owner_membership_id: ownerMembershipId,
      created_by: createdBy,
    }),
    "create valid loan",
  );
  const schedule = await one(
    admin.from("loan_schedule_entries").insert({
      household_id: householdId,
      loan_id: loan.id,
      sequence: 1,
      due_date: HARNESS.today,
      principal_due: 1000000,
      interest_due: 0,
      total_due: 1000000,
      remaining_balance_after: 0,
      status: "upcoming",
    }),
    "create valid loan schedule",
  );
  return { loan, schedule };
}

export async function createValidLiability(
  admin,
  householdId,
  ownerMembershipId,
  createdBy,
) {
  return one(
    admin.from("liabilities").insert({
      household_id: householdId,
      name: "Ownership test liability",
      creditor: "Test creditor",
      principal_amount: 1000000,
      remaining_amount: 1000000,
      currency: HARNESS.currency,
      direction: "borrowed",
      creation_mode: "existing_balance",
      start_date: HARNESS.today,
      status: HARNESS.active,
      financial_scope: HARNESS.personal,
      owner_membership_id: ownerMembershipId,
      created_by: createdBy,
    }),
    "create valid liability",
  );
}

export async function createValidSaving(
  admin,
  householdId,
  ownerMembershipId,
  createdBy,
) {
  const provider = await one(
    admin.from("saving_providers").select("id").eq("provider_key", "manual"),
    "find saving provider",
  );
  const pkg = await one(
    admin
      .from("saving_packages")
      .select("id, duration_days, annual_interest_rate")
      .eq("provider_id", provider.id)
      .limit(1),
    "find saving package",
  );
  const account = await one(
    admin.from("accounts").insert({
      household_id: householdId,
      name: "Ownership saving settlement",
      type: HARNESS.accountType,
      created_by: createdBy,
    }),
    "create saving settlement account",
  );
  const saving = await one(
    admin.from("savings").insert({
      household_id: householdId,
      status: HARNESS.active,
      funding_account_id: account.id,
      settlement_account_id: account.id,
      provider_id: provider.id,
      product_name: "Ownership test saving",
      product_snapshot: { packageId: pkg.id },
      renewal_preference: "manual_review",
      financial_scope: HARNESS.personal,
      owner_membership_id: ownerMembershipId,
      created_by: createdBy,
    }),
    "create valid saving",
  );
  const cycle = await one(
    admin.from("saving_cycles").insert({
      saving_id: saving.id,
      cycle_number: 1,
      start_date: HARNESS.today,
      end_date: HARNESS.today,
      principal: 1000000,
      locked_rate: pkg.annual_interest_rate,
      package_snapshot: { packageId: pkg.id, durationDays: pkg.duration_days },
      status: HARNESS.active,
    }),
    "create active saving cycle",
  );
  return { saving, cycle, account };
}

export async function createValidInvestmentHolding(
  admin,
  householdId,
  ownerMembershipId,
  createdBy,
) {
  return one(
    admin.from("investment_holdings").insert({
      household_id: householdId,
      name: "Ownership test holding",
      symbol: "OWNTEST",
      asset_class: "stock",
      visibility_context: HARNESS.household,
      lifecycle_status: HARNESS.active,
      history_status: "opening_position",
      quantity: 10,
      remaining_total_cost_basis: 1000000,
      financial_scope: HARNESS.personal,
      owner_membership_id: ownerMembershipId,
      created_by: createdBy,
    }),
    "create valid investment holding",
  );
}

export async function createValidGoalFundingSource(
  admin,
  householdId,
  ownerMembershipId,
  createdBy,
) {
  const account = await one(
    admin.from("accounts").insert({
      household_id: householdId,
      name: "Ownership goal savings account",
      type: "savings",
      financial_scope: HARNESS.personal,
      owner_membership_id: ownerMembershipId,
      created_by: createdBy,
    }),
    "create goal funding account",
  );
  const goal = await one(
    admin.from("goals").insert({
      household_id: householdId,
      name: "Ownership test goal",
      target_amount: 1000000,
      funded_amount: 0,
      status: "active",
      goal_type: "save_up",
      financial_scope: HARNESS.personal,
      owner_membership_id: ownerMembershipId,
      created_by: createdBy,
    }),
    "create goal",
  );
  const link = await one(
    admin.from("goal_funding_links").insert({
      household_id: householdId,
      goal_id: goal.id,
      source_kind: "savings_account",
      account_id: account.id,
      initial_principal_snapshot: 0,
      is_active: true,
      created_by: createdBy,
      linked_by: createdBy,
    }),
    "create goal funding link",
  );
  return { account, goal, link };
}

export async function createPendingPersonalInboxItem(
  admin,
  householdId,
  ownerMembershipId,
  createdBy,
) {
  const account = await one(
    admin.from("accounts").insert({
      household_id: householdId,
      name: "Ownership inbox source",
      type: HARNESS.accountType,
      financial_scope: HARNESS.personal,
      owner_membership_id: ownerMembershipId,
      created_by: createdBy,
    }),
    "create inbox source account",
  );
  const transaction = await one(
    admin.from("transactions").insert({
      household_id: householdId,
      account_id: account.id,
      type: "expense",
      amount: 10000,
      currency: HARNESS.currency,
      transaction_date: HARNESS.today,
      note: "Ownership inbox fixture",
      status: "pending",
      created_by: createdBy,
      source: "manual",
    }),
    "create inbox transaction",
  );
  const item = await one(
    admin.from("inbox_items").insert({
      household_id: householdId,
      kind: "unmapped_expense",
      status: HARNESS.pending,
      source_type: "transaction",
      source_id: transaction.id,
      amount: 10000,
      currency: HARNESS.currency,
      title: "Ownership inbox fixture",
    }),
    "create pending personal inbox item",
  );
  return { account, transaction, item };
}

async function preflight() {
  const missing = missingEnvironment({ needsServiceRole: true });
  if (missing.length) return { ready: false, missing };
  const checks = [];
  for (const [key, identity] of Object.entries(env.users)) {
    try {
      const session = await signInTestIdentity(identity);
      checks.push({
        identity: key,
        ready: true,
        userId: session.userId,
        membership: session.membership,
      });
    } catch (error) {
      checks.push({ identity: key, ready: false, reason: error.message });
    }
  }
  const sameHousehold =
    checks.every((check) => check.ready) &&
    checks.every(
      (check) =>
        check.membership.household_id === checks[0].membership.household_id,
    );
  const roles = checks.every(
    (check) =>
      check.membership.role ===
      (check.identity === "admin" ? HARNESS.roleAdmin : HARNESS.rolePartner),
  );
  return {
    ready:
      checks.length === 2 &&
      checks.every((check) => check.ready) &&
      sameHousehold &&
      roles,
    checks,
  };
}

async function setup() {
  const missing = missingEnvironment({ needsServiceRole: true });
  if (missing.length) return { ready: false, missing };
  const admin = adminClient();
  const users = [
    await ensureUser(admin, env.users.admin),
    await ensureUser(admin, env.users.partner),
  ];
  const household = await ensureHousehold(admin, users);
  return {
    ready: true,
    householdId: household.id,
    identities: users.map((user) => ({ id: user.id, email: user.email })),
  };
}

async function cleanup() {
  if (missingEnvironment({ needsServiceRole: true }).length)
    return {
      ready: false,
      missing: missingEnvironment({ needsServiceRole: true }),
    };
  const admin = adminClient();
  const users = [
    await findUser(admin, env.users.admin.email),
    await findUser(admin, env.users.partner.email),
  ];
  if (users.some((user) => !user))
    return {
      ready: true,
      removedHousehold: false,
      reason: "dedicated users do not exist",
    };
  const { data: household } = await admin
    .from("households")
    .select("id, name")
    .eq("name", HARNESS.householdName)
    .maybeSingle();
  if (!household) return { ready: true, removedHousehold: false };
  const { data: members, error } = await admin
    .from("household_members")
    .select("user_id")
    .eq("household_id", household.id);
  if (error) fail(`verify cleanup scope: ${error.code ?? "unknown"}`);
  const allowed = new Set(users.map((user) => user.id));
  if ((members ?? []).some((member) => !allowed.has(member.user_id)))
    fail("refusing cleanup: household contains a non-dedicated user");

  const roots = await Promise.all(
    [
      "accounts",
      "loans",
      "liabilities",
      "savings",
      "investment_holdings",
      "goals",
    ].map(async (table) => {
      const { data, error } = await admin
        .from(table)
        .select("id")
        .eq("household_id", household.id);
      if (error) fail(`read cleanup ${table}: ${error.code ?? "unknown"}`);
      return [table, (data ?? []).map((row) => row.id)];
    }),
  );
  const rootIds = Object.fromEntries(roots);
  const deleteByIds = async (table, column, ids) => {
    if (!ids.length) return;
    const { error: deleteError } = await admin
      .from(table)
      .delete()
      .in(column, ids);
    if (deleteError && !["PGRST205", "42703"].includes(deleteError.code))
      fail(`cleanup ${table}: ${deleteError.code ?? "unknown"}`);
  };
  const deleteByHousehold = async (table) => {
    const { error: deleteError } = await admin
      .from(table)
      .delete()
      .eq("household_id", household.id);
    if (deleteError && !["PGRST205", "42703"].includes(deleteError.code))
      fail(`cleanup ${table}: ${deleteError.code ?? "unknown"}`);
  };

  await deleteByIds("early_withdrawals", "saving_id", rootIds.savings);
  await deleteByIds("saving_cycles", "saving_id", rootIds.savings);
  await deleteByIds("loan_payments", "loan_id", rootIds.loans);
  await deleteByIds("loan_schedule_entries", "loan_id", rootIds.loans);
  await deleteByIds("loan_interest_rate_periods", "loan_id", rootIds.loans);
  await deleteByIds(
    "investment_fees",
    "holding_id",
    rootIds.investment_holdings,
  );
  await deleteByIds(
    "investment_operations",
    "source_holding_id",
    rootIds.investment_holdings,
  );
  await deleteByIds(
    "investment_valuations",
    "holding_id",
    rootIds.investment_holdings,
  );
  await deleteByHousehold("inbox_items");
  await deleteByHousehold("transaction_tag_assignments");
  await deleteByHousehold("loan_payments");
  await deleteByHousehold("debt_payments");
  await deleteByHousehold("card_payments");
  await deleteByHousehold("investment_fees");
  await deleteByHousehold("investment_operations");
  await deleteByHousehold("investment_valuations");
  await deleteByHousehold("goal_funding_links");
  await deleteByHousehold("goal_contributions");
  await deleteByHousehold("transactions");
  await deleteByHousehold("card_billing_items");
  await deleteByHousehold("card_billing_months");
  await deleteByHousehold("credit_card_settings");
  await deleteByHousehold("goals");
  await deleteByHousehold("liabilities");
  await deleteByHousehold("loans");
  await deleteByHousehold("savings");
  await deleteByHousehold("investment_holdings");
  await deleteByHousehold("accounts");
  await deleteByHousehold("household_members");

  const { error: deleteError } = await admin
    .from("households")
    .delete()
    .eq("id", household.id)
    .eq("name", HARNESS.householdName);
  if (deleteError)
    fail(`cleanup controlled household: ${deleteError.code ?? "unknown"}`);
  return { ready: true, removedHousehold: true, authUsersKept: true };
}

const command = process.argv[2] ?? "preflight";
const result =
  command === "preflight"
    ? await preflight()
    : command === "setup"
      ? await setup()
      : command === "cleanup"
        ? await cleanup()
        : fail("Use preflight, setup, or cleanup");
console.error(
  result.ready
    ? "OWNERSHIP TEST HARNESS READY"
    : "OWNERSHIP TEST HARNESS NOT READY",
);
console.error(JSON.stringify(result, null, 2));
if (!result.ready) process.exitCode = 2;
