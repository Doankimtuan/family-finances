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

import { createHash } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";
import nextEnv from "@next/env";

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

const TOGETHER_20A = {
  householdName: "Together 20A Disposable Fixture",
  credentialsPath: "output/playwright/together-20a-credentials.json",
  users: {
    admin: {
      emailEnv: "TOGETHER_20A_A_EMAIL",
      passwordEnv: "TOGETHER_20A_A_PASSWORD",
      defaultEmail: "ownership-20a1-a@example.com",
    },
    partner: {
      emailEnv: "TOGETHER_20A_B_EMAIL",
      passwordEnv: "TOGETHER_20A_B_PASSWORD",
      defaultEmail: "ownership-20a1-b@example.com",
    },
  },
};

const RELEASE_23D3 = {
  householdName: "Family Finance Release 23D3",
  credentialsPath: "output/playwright/release-23d3-credentials.json",
  identityMarker: "release-23d3",
  users: {
    admin: {
      emailEnv: "RELEASE_23D3_A_EMAIL",
      passwordEnv: "RELEASE_23D3_A_PASSWORD",
      defaultEmail: "release-23d3-a@example.com",
    },
    partner: {
      emailEnv: "RELEASE_23D3_B_EMAIL",
      passwordEnv: "RELEASE_23D3_B_PASSWORD",
      defaultEmail: "release-23d3-b@example.com",
    },
  },
};

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

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

function together20aIdentity(key) {
  const config = TOGETHER_20A.users[key];
  const email = process.env[config.emailEnv]?.trim() ?? config.defaultEmail;
  const configuredPassword = process.env[config.passwordEnv];
  const password =
    configuredPassword ??
    `Together20A1-${createHash("sha256").update(email).digest("hex").slice(0, 24)}!`;
  return { email, password };
}

function together20aUsers() {
  return {
    admin: together20aIdentity("admin"),
    partner: together20aIdentity("partner"),
  };
}

function together20aMissingEnvironment({ needsServiceRole = false } = {}) {
  const required = [
    ["NEXT_PUBLIC_SUPABASE_URL", env.url],
    [
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY",
      env.anonKey,
    ],
  ];
  if (needsServiceRole)
    required.push([
      "SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY",
      env.serviceKey,
    ]);
  return required.filter(([, value]) => !value).map(([name]) => name);
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

async function ensureTogether20aUser(admin, identity) {
  const existing = await findUser(admin, identity.email);
  if (existing) {
    if (
      existing.user_metadata?.ownership_test_identity !== "together-20a1" &&
      existing.user_metadata?.ownership_test_identity !== true
    )
      fail(`refusing non-test-owned disposable identity: ${identity.email}`);
    const { error } = await admin.auth.admin.updateUserById(existing.id, {
      password: identity.password,
      email_confirm: true,
      user_metadata: { ownership_test_identity: "together-20a1" },
    });
    if (error) fail(`reset disposable auth user: ${error.code ?? "unknown"}`);
    return existing;
  }
  const { data, error } = await admin.auth.admin.createUser({
    email: identity.email,
    password: identity.password,
    email_confirm: true,
    user_metadata: { ownership_test_identity: "together-20a1" },
  });
  if (error) fail(`create disposable auth user: ${error.code ?? "unknown"}`);
  return data.user;
}

function release23d3Identity(key) {
  const config = RELEASE_23D3.users[key];
  const email = process.env[config.emailEnv]?.trim() ?? config.defaultEmail;
  const configuredPassword = process.env[config.passwordEnv];
  const password =
    configuredPassword ??
    `Release23D3-${createHash("sha256").update(email).digest("hex").slice(0, 24)}!`;
  return { email, password };
}

function release23d3Users() {
  return {
    admin: release23d3Identity("admin"),
    partner: release23d3Identity("partner"),
  };
}

function release23d3MissingEnvironment({ needsServiceRole = false } = {}) {
  const required = [
    ["NEXT_PUBLIC_SUPABASE_URL", env.url],
    [
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY",
      env.anonKey,
    ],
  ];
  if (needsServiceRole)
    required.push([
      "SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY",
      env.serviceKey,
    ]);
  return required.filter(([, value]) => !value).map(([name]) => name);
}

async function ensureRelease23dUser(admin, identity) {
  const existing = await findUser(admin, identity.email);
  if (existing) {
    if (
      existing.user_metadata?.ownership_test_identity !==
      RELEASE_23D3.identityMarker
    )
      fail(`refusing non-release-owned identity: ${identity.email}`);
    const { error } = await admin.auth.admin.updateUserById(existing.id, {
      password: identity.password,
      email_confirm: true,
      user_metadata: { ownership_test_identity: RELEASE_23D3.identityMarker },
    });
    if (error) fail(`reset release auth user: ${error.code ?? "unknown"}`);
    return existing;
  }
  const { data, error } = await admin.auth.admin.createUser({
    email: identity.email,
    password: identity.password,
    email_confirm: true,
    user_metadata: { ownership_test_identity: RELEASE_23D3.identityMarker },
  });
  if (error) fail(`create release auth user: ${error.code ?? "unknown"}`);
  return data.user;
}

async function writeRelease23dCredentials(users) {
  await mkdir("output/playwright", { recursive: true });
  await writeFile(
    RELEASE_23D3.credentialsPath,
    JSON.stringify(users, null, 2),
    {
      mode: 0o600,
    },
  );
}

async function removeRelease23dCredentials() {
  try {
    await unlink(RELEASE_23D3.credentialsPath);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

async function writeTogether20aCredentials(users) {
  await mkdir("output/playwright", { recursive: true });
  await writeFile(
    TOGETHER_20A.credentialsPath,
    JSON.stringify(users, null, 2),
    { mode: 0o600 },
  );
}

async function removeTogether20aCredentials() {
  try {
    await unlink(TOGETHER_20A.credentialsPath);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
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

async function ensureHousehold(
  admin,
  users,
  householdName = HARNESS.householdName,
) {
  const { data: households, error } = await admin
    .from("households")
    .select("id, name")
    .eq("name", householdName)
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
        name: householdName,
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

  const partnerMembership = (await activeMemberships(admin, users[1].id))[0];
  if (!partnerMembership) fail("controlled partner membership unavailable");
  const { data: formerMemberAccount, error: formerMemberAccountError } =
    await admin
      .from("accounts")
      .select("id, owner_membership_id, financial_scope")
      .eq("household_id", household.id)
      .eq("name", "Ownership former-member account")
      .maybeSingle();
  if (formerMemberAccountError)
    fail(
      `find former-member account: ${formerMemberAccountError.code ?? "unknown"}`,
    );
  if (!formerMemberAccount) {
    await one(
      admin.from("accounts").insert({
        household_id: household.id,
        name: "Ownership former-member account",
        type: HARNESS.accountType,
        opening_balance: 250000,
        financial_scope: HARNESS.personal,
        owner_membership_id: partnerMembership.id,
        created_by: users[1].id,
      }),
      "create former-member account",
    );
  } else if (
    formerMemberAccount.financial_scope !== HARNESS.personal ||
    formerMemberAccount.owner_membership_id !== partnerMembership.id
  ) {
    fail("controlled former-member account ownership mismatch");
  }

  const { data: inboxFixture, error: inboxFixtureError } = await admin
    .from("inbox_items")
    .select("id")
    .eq("household_id", household.id)
    .eq("title", "Ownership inbox fixture")
    .maybeSingle();
  if (inboxFixtureError)
    fail(
      `find controlled Inbox fixture: ${inboxFixtureError.code ?? "unknown"}`,
    );
  if (!inboxFixture)
    await createPendingPersonalInboxItem(
      admin,
      household.id,
      partnerMembership.id,
      users[1].id,
    );

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

async function ensureReleaseFixtures(admin, household, users) {
  const { data: memberships, error: membershipsError } = await admin
    .from("household_members")
    .select("id, user_id")
    .eq("household_id", household.id)
    .eq("is_active", true);
  if (membershipsError)
    fail(
      `read release fixture memberships: ${membershipsError.code ?? "unknown"}`,
    );

  const adminMembership = memberships?.find(
    (membership) => membership.user_id === users[0].id,
  );
  const partnerMembership = memberships?.find(
    (membership) => membership.user_id === users[1].id,
  );
  if (!adminMembership || !partnerMembership)
    fail("release fixture memberships unavailable");

  const ensureAccount = async (name, openingBalance) => {
    const { data: existingRows, error } = await admin
      .from("accounts")
      .select("id")
      .eq("household_id", household.id)
      .eq("name", name)
      .limit(1);
    if (error) fail(`find release account: ${error.code ?? "unknown"}`);
    const existing = existingRows?.[0];
    if (existing) return existing;
    return one(
      admin.from("accounts").insert({
        household_id: household.id,
        name,
        type: HARNESS.accountType,
        opening_balance: openingBalance,
        created_by: users[0].id,
      }),
      `create release account ${name}`,
    );
  };

  await ensureAccount("Ownership release cash", 10000000);
  await ensureAccount("Ownership transfer destination", 0);

  const { data: jarRows, error: jarError } = await admin
    .from("jars")
    .select("id")
    .eq("household_id", household.id)
    .eq("name", "Ownership release jar")
    .limit(1);
  if (jarError) fail(`find release jar: ${jarError.code ?? "unknown"}`);
  const jar = jarRows?.[0];
  if (!jar)
    await one(
      admin.from("jars").insert({
        household_id: household.id,
        name: "Ownership release jar",
        kind: "spending",
        sort_order: 99,
        is_archived: false,
        is_paused: false,
      }),
      "create release jar",
    );

  const { data: loanRows, error: loanError } = await admin
    .from("loans")
    .select("id")
    .eq("household_id", household.id)
    .eq("name", "Ownership test loan")
    .limit(1);
  if (loanError) fail(`find release loan: ${loanError.code ?? "unknown"}`);
  const loan = loanRows?.[0];
  if (!loan)
    await createValidLoan(admin, household.id, adminMembership.id, users[0].id);

  const { data: liabilityRows, error: liabilityError } = await admin
    .from("liabilities")
    .select("id")
    .eq("household_id", household.id)
    .eq("name", "Ownership test liability")
    .limit(1);
  if (liabilityError)
    fail(`find release liability: ${liabilityError.code ?? "unknown"}`);
  const liability = liabilityRows?.[0];
  if (!liability)
    await createValidLiability(
      admin,
      household.id,
      adminMembership.id,
      users[0].id,
    );

  const { data: holdingRows, error: holdingError } = await admin
    .from("investment_holdings")
    .select("id")
    .eq("household_id", household.id)
    .eq("name", "Ownership test holding")
    .limit(1);
  if (holdingError)
    fail(`find release investment: ${holdingError.code ?? "unknown"}`);
  const holding = holdingRows?.[0];
  if (!holding)
    await createValidInvestmentHolding(
      admin,
      household.id,
      adminMembership.id,
      users[0].id,
    );

  const { data: goalRows, error: goalError } = await admin
    .from("goals")
    .select("id")
    .eq("household_id", household.id)
    .eq("name", "Ownership test goal")
    .limit(1);
  if (goalError) fail(`find release goal: ${goalError.code ?? "unknown"}`);
  const goal = goalRows?.[0];
  if (!goal)
    await createValidGoalFundingSource(
      admin,
      household.id,
      adminMembership.id,
      users[0].id,
    );

  const { data: savingRows, error: savingError } = await admin
    .from("savings")
    .select("id")
    .eq("household_id", household.id)
    .eq("product_name", "Ownership test saving")
    .limit(1);
  if (savingError)
    fail(`find release saving: ${savingError.code ?? "unknown"}`);
  const saving = savingRows?.[0];
  if (!saving)
    await createValidSaving(
      admin,
      household.id,
      adminMembership.id,
      users[0].id,
    );

  const { data: releaseInboxRows, error: releaseInboxError } = await admin
    .from("inbox_items")
    .select("id")
    .eq("household_id", household.id)
    .eq("title", "Ownership release inbox fixture")
    .limit(1);
  if (releaseInboxError)
    fail(`find release Inbox fixture: ${releaseInboxError.code ?? "unknown"}`);
  if (!releaseInboxRows?.[0])
    await createPendingPersonalInboxItem(
      admin,
      household.id,
      adminMembership.id,
      users[0].id,
      "Ownership release inbox fixture",
    );
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
      monthly_payment: 1000000,
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
  fixtureName = "Ownership inbox fixture",
) {
  const account = await one(
    admin.from("accounts").insert({
      household_id: householdId,
      name:
        fixtureName === "Ownership inbox fixture"
          ? "Ownership inbox source"
          : `${fixtureName} source`,
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
      note: fixtureName,
      status: "pending_mapping",
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
      title: fixtureName,
    }),
    "create pending personal inbox item",
  );
  return { account, transaction, item };
}

async function getTogether20aHousehold(admin) {
  const { data, error } = await admin
    .from("households")
    .select("id, name")
    .eq("name", TOGETHER_20A.householdName)
    .maybeSingle();
  if (error) fail(`find 20A household: ${error.code ?? "unknown"}`);
  return data;
}

async function getTogether20aUsers(admin) {
  const identities = together20aUsers();
  return {
    identities,
    users: {
      admin: await findUser(admin, identities.admin.email),
      partner: await findUser(admin, identities.partner.email),
    },
  };
}

async function cleanupTogether20aHousehold(admin, users) {
  const household = await getTogether20aHousehold(admin);
  if (!household) return false;

  const { data: members, error } = await admin
    .from("household_members")
    .select("user_id")
    .eq("household_id", household.id);
  if (error) fail(`verify 20A cleanup scope: ${error.code ?? "unknown"}`);
  const allowed = new Set(users.filter(Boolean).map((user) => user.id));
  if ((members ?? []).some((member) => !allowed.has(member.user_id)))
    fail("refusing 20A cleanup: household contains a non-dedicated user");

  for (const table of [
    "inbox_items",
    "transactions",
    "household_invitations",
    "accounts",
    "jars",
    "household_members",
  ]) {
    const { error: deleteError } = await admin
      .from(table)
      .delete()
      .eq("household_id", household.id);
    if (deleteError && !["PGRST205", "42703"].includes(deleteError.code))
      fail(`cleanup 20A ${table}: ${deleteError.code ?? "unknown"}`);
  }

  const { error: deleteError } = await admin
    .from("households")
    .delete()
    .eq("id", household.id)
    .eq("name", TOGETHER_20A.householdName);
  if (deleteError)
    fail(`cleanup 20A household: ${deleteError.code ?? "unknown"}`);

  for (const user of users.filter(Boolean)) {
    const { data: memberships, error: membershipError } = await admin
      .from("household_members")
      .select("id")
      .eq("user_id", user.id);
    if (membershipError)
      fail(`verify 20A memberships: ${membershipError.code ?? "unknown"}`);
    if ((memberships ?? []).length)
      fail(`20A cleanup left memberships for ${user.email}`);
  }
  return true;
}

async function setupTogether20a() {
  const missing = together20aMissingEnvironment({ needsServiceRole: true });
  if (missing.length) return { ready: false, missing };

  const admin = adminClient();
  const identities = together20aUsers();
  const users = [
    await ensureTogether20aUser(admin, identities.admin),
    await ensureTogether20aUser(admin, identities.partner),
  ];
  await cleanupTogether20aHousehold(admin, users);

  for (const user of users) {
    const memberships = await activeMemberships(admin, user.id);
    if (memberships.length)
      fail(
        `refusing 20A setup: ${user.email} has an unrelated active membership`,
      );
  }

  const ownerClient = publicClient();
  const { data: ownerSession, error: signInError } =
    await ownerClient.auth.signInWithPassword(identities.admin);
  if (signInError || !ownerSession.session)
    fail(`20A owner authentication: ${signInError?.code ?? "unknown"}`);
  const { data: householdId, error: householdError } = await ownerClient.rpc(
    "create_household_with_essentials",
    {
      p_name: TOGETHER_20A.householdName,
      p_account_name: "Ownership test cash",
      p_plan_preset: "simple",
      p_base_currency: HARNESS.currency,
      p_locale: "en-VN",
      p_timezone: "Asia/Ho_Chi_Minh",
    },
  );
  if (householdError || typeof householdId !== "string")
    fail(`20A household onboarding: ${householdError?.code ?? "unknown"}`);

  await writeTogether20aCredentials(identities);
  return {
    ready: true,
    householdId,
    identities: users.map((user) => ({ id: user.id, email: user.email })),
    activeMemberships: 1,
  };
}

async function seedTogether20aMemberData() {
  const missing = together20aMissingEnvironment({ needsServiceRole: true });
  if (missing.length) return { ready: false, missing };
  const admin = adminClient();
  const { users } = await getTogether20aUsers(admin);
  if (!users.admin || !users.partner)
    fail("20A disposable identities are unavailable");
  const household = await getTogether20aHousehold(admin);
  if (!household) fail("20A household is unavailable");
  const memberships = await activeMemberships(admin, users.partner.id);
  const partnerMembership = memberships.find(
    (membership) => membership.household_id === household.id,
  );
  if (!partnerMembership) fail("20A partner membership is unavailable");

  const { data: account, error: accountError } = await admin
    .from("accounts")
    .select("id, owner_membership_id, financial_scope")
    .eq("household_id", household.id)
    .eq("name", "Ownership former-member account")
    .maybeSingle();
  if (accountError)
    fail(`find 20A personal account: ${accountError.code ?? "unknown"}`);
  if (!account) {
    await one(
      admin.from("accounts").insert({
        household_id: household.id,
        name: "Ownership former-member account",
        type: HARNESS.accountType,
        opening_balance: 250000,
        financial_scope: HARNESS.personal,
        owner_membership_id: partnerMembership.id,
        created_by: users.partner.id,
      }),
      "create 20A personal account",
    );
  } else if (
    account.owner_membership_id !== partnerMembership.id ||
    account.financial_scope !== HARNESS.personal
  ) {
    fail("20A personal account ownership mismatch");
  }

  const { data: inboxItem, error: inboxError } = await admin
    .from("inbox_items")
    .select("id")
    .eq("household_id", household.id)
    .eq("title", "Ownership inbox fixture")
    .maybeSingle();
  if (inboxError)
    fail(`find 20A Inbox fixture: ${inboxError.code ?? "unknown"}`);
  if (!inboxItem)
    await createPendingPersonalInboxItem(
      admin,
      household.id,
      partnerMembership.id,
      users.partner.id,
    );
  return { ready: true, householdId: household.id, seeded: true };
}

async function assertTogether20aActive(invitationToken) {
  const missing = together20aMissingEnvironment({ needsServiceRole: true });
  if (missing.length) return { ready: false, missing };
  if (!invitationToken) fail("20A invitation token is required");

  const admin = adminClient();
  const { identities, users } = await getTogether20aUsers(admin);
  if (!users.admin || !users.partner)
    fail("20A disposable identities are unavailable");
  const household = await getTogether20aHousehold(admin);
  if (!household) fail("20A household is unavailable");
  const { data: invitation, error: invitationError } = await admin
    .from("household_invitations")
    .select("id, household_id, status, accepted_by")
    .eq("token", invitationToken)
    .single();
  if (invitationError || !invitation)
    fail(`verify 20A invitation: ${invitationError?.code ?? "unknown"}`);
  if (
    invitation.household_id !== household.id ||
    invitation.status !== "accepted" ||
    invitation.accepted_by !== users.partner.id
  )
    fail("20A invitation is not in its canonical accepted state");

  const { data: memberships, error: membershipError } = await admin
    .from("household_members")
    .select("id, user_id, role, is_active")
    .eq("household_id", household.id)
    .eq("is_active", true);
  if (membershipError)
    fail(`verify 20A active memberships: ${membershipError.code ?? "unknown"}`);
  if (
    memberships?.length !== 2 ||
    memberships.filter((membership) => membership.user_id === users.partner.id)
      .length !== 1
  )
    fail("20A accept did not create exactly one active partner membership");

  const partnerClient = publicClient();
  const { data: partnerSession, error: partnerSignInError } =
    await partnerClient.auth.signInWithPassword(identities.partner);
  if (partnerSignInError || !partnerSession.session)
    fail(
      `20A partner authentication: ${partnerSignInError?.code ?? "unknown"}`,
    );
  const { error: retryError } = await partnerClient.rpc(
    "accept_household_invitation",
    { p_token: invitationToken },
  );
  if (!retryError) fail("20A invitation retry unexpectedly succeeded");
  return {
    ready: true,
    invitationStatus: invitation.status,
    activeMemberships: 2,
  };
}

async function assertTogether20aFinal() {
  const missing = together20aMissingEnvironment({ needsServiceRole: true });
  if (missing.length) return { ready: false, missing };
  const admin = adminClient();
  const { users } = await getTogether20aUsers(admin);
  if (!users.admin || !users.partner)
    fail("20A disposable identities are unavailable");
  const household = await getTogether20aHousehold(admin);
  if (!household) fail("20A household is unavailable");
  const { data: memberships, error } = await admin
    .from("household_members")
    .select("user_id, role, is_active")
    .eq("household_id", household.id);
  if (error) fail(`verify 20A final memberships: ${error.code ?? "unknown"}`);
  const active =
    memberships?.filter((membership) => membership.is_active) ?? [];
  const partner = memberships?.find(
    (membership) => membership.user_id === users.partner.id,
  );
  const owner = memberships?.find(
    (membership) => membership.user_id === users.admin.id,
  );
  if (
    active.length !== 1 ||
    partner?.is_active !== true ||
    partner.role !== HARNESS.roleAdmin ||
    owner?.is_active !== false
  )
    fail("20A final leave did not preserve Admin continuity");
  return { ready: true, activeMemberships: 1, formerOwnerInactive: true };
}

async function together20aCleanup() {
  const missing = together20aMissingEnvironment({ needsServiceRole: true });
  if (missing.length) return { ready: false, missing };
  const admin = adminClient();
  const { users } = await getTogether20aUsers(admin);
  const removedHousehold = await cleanupTogether20aHousehold(admin, [
    users.admin,
    users.partner,
  ]);
  await removeTogether20aCredentials();
  return { ready: true, removedHousehold, authUsersKept: true };
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
  const allReady = checks.length === 2 && checks.every((check) => check.ready);
  const sameHousehold =
    allReady &&
    checks.every(
      (check) =>
        check.membership?.household_id === checks[0].membership?.household_id,
    );
  const roles =
    allReady &&
    checks.every(
      (check) =>
        check.membership?.role ===
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
  await ensureReleaseFixtures(admin, household, users);
  return {
    ready: true,
    householdId: household.id,
    identities: users.map((user) => ({ id: user.id, email: user.email })),
  };
}

async function cleanupControlledHousehold(admin, users, householdName) {
  if (users.some((user) => !user))
    return {
      ready: true,
      removedHousehold: false,
      reason: "dedicated users do not exist",
    };
  const { data: household } = await admin
    .from("households")
    .select("id, name")
    .eq("name", householdName)
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
  const { data: providerRows, error: providerError } = await admin
    .from("saving_providers")
    .select("id")
    .eq("household_id", household.id);
  if (providerError)
    fail(`read cleanup saving providers: ${providerError.code ?? "unknown"}`);
  const providerIds = (providerRows ?? []).map((row) => row.id);
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
  await deleteByIds("saving_packages", "provider_id", providerIds);
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
  await deleteByHousehold("jars");
  await deleteByHousehold("liabilities");
  await deleteByHousehold("loans");
  await deleteByHousehold("savings");
  await deleteByHousehold("saving_providers");
  await deleteByHousehold("investment_holdings");
  await deleteByHousehold("accounts");
  await deleteByHousehold("household_members");

  const { error: deleteError } = await admin
    .from("households")
    .delete()
    .eq("id", household.id)
    .eq("name", householdName);
  if (deleteError)
    fail(`cleanup controlled household: ${deleteError.code ?? "unknown"}`);
  return { ready: true, removedHousehold: true, authUsersKept: true };
}

async function cleanup() {
  const missing = missingEnvironment({ needsServiceRole: true });
  if (missing.length) return { ready: false, missing };
  const admin = adminClient();
  const users = [
    await findUser(admin, env.users.admin.email),
    await findUser(admin, env.users.partner.email),
  ];
  return cleanupControlledHousehold(admin, users, HARNESS.householdName);
}

async function setupRelease23d() {
  const missing = release23d3MissingEnvironment({ needsServiceRole: true });
  if (missing.length) return { ready: false, missing };
  const admin = adminClient();
  const identities = release23d3Users();
  const users = [
    await ensureRelease23dUser(admin, identities.admin),
    await ensureRelease23dUser(admin, identities.partner),
  ];
  await cleanupControlledHousehold(admin, users, RELEASE_23D3.householdName);
  for (const user of users) {
    const memberships = await activeMemberships(admin, user.id);
    if (memberships.length)
      fail(
        `refusing release setup: ${user.email} has an unrelated active membership`,
      );
  }
  const household = await ensureHousehold(
    admin,
    users,
    RELEASE_23D3.householdName,
  );
  await ensureReleaseFixtures(admin, household, users);
  await writeRelease23dCredentials(identities);
  return {
    ready: true,
    householdId: household.id,
    identities: users.map((user) => ({ id: user.id, email: user.email })),
    authUsersKept: true,
  };
}

async function cleanupRelease23d() {
  const missing = release23d3MissingEnvironment({ needsServiceRole: true });
  if (missing.length) return { ready: false, missing };
  const admin = adminClient();
  const identities = release23d3Users();
  const users = [
    await findUser(admin, identities.admin.email),
    await findUser(admin, identities.partner.email),
  ];
  const result = await cleanupControlledHousehold(
    admin,
    users,
    RELEASE_23D3.householdName,
  );
  await removeRelease23dCredentials();
  return result;
}

const command = process.argv[2] ?? "preflight";
const result =
  command === "preflight"
    ? await preflight()
    : command === "setup"
      ? await setup()
      : command === "cleanup"
        ? await cleanup()
        : command === "release-23d-setup"
          ? await setupRelease23d()
          : command === "release-23d-cleanup"
            ? await cleanupRelease23d()
            : command === "together-20a-setup"
              ? await setupTogether20a()
              : command === "together-20a-seed-member"
                ? await seedTogether20aMemberData()
                : command === "together-20a-assert-active"
                  ? await assertTogether20aActive(
                      process.env.TOGETHER_20A_INVITATION_TOKEN,
                    )
                  : command === "together-20a-assert-final"
                    ? await assertTogether20aFinal()
                    : command === "together-20a-cleanup"
                      ? await together20aCleanup()
                      : fail(
                          "Use preflight, setup, cleanup, release-23d-setup, release-23d-cleanup, together-20a-setup, together-20a-seed-member, together-20a-assert-active, or together-20a-cleanup",
                        );
console.error(
  result.ready
    ? "OWNERSHIP TEST HARNESS READY"
    : "OWNERSHIP TEST HARNESS NOT READY",
);
console.error(JSON.stringify(result, null, 2));
if (!result.ready) process.exitCode = 2;
