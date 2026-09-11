/**
 * Read-only Home Account/Ledger raw-input benchmark and tenancy probe.
 *
 * Run with:
 *   VINHA_HOME_ACCOUNT_BENCH=1 node scripts/home-account-ledger-one-wave-benchmark.mjs
 */

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import nextEnv from "@next/env";
import { createJiti } from "jiti";

const { loadEnvConfig } = nextEnv;
const jiti = createJiti(import.meta.url, { tsconfigPaths: true });
const { mapAccountRow } = await jiti.import(
  "../modules/ledger/application/account-types.ts",
);
const { applyLedgerBalances } = await jiti.import(
  "../modules/ledger/application/queries/load-account-ledger-balances.ts",
);

const BENCHMARK_FLAG = "VINHA_HOME_ACCOUNT_BENCH";
const BENCHMARK_ENABLED = "1";
const DEFAULT_REPEATS = 20;
const AUTH_COOKIE_PREFIX = "sb-";
const AUTH_COOKIE_SUFFIX = "-auth-token";
const BASE64_COOKIE_PREFIX = "base64-";
const ACCOUNT_TYPES = [
  "cash",
  "checking",
  "savings",
  "ewallet",
  "brokerage",
  "other",
];
const SELECT = {
  ACCOUNT:
    "id,name,type,opening_balance,is_archived,financial_scope,owner_membership_id,created_at",
  MEMBERSHIP: "id,household_id,user_id,is_active",
  POSITION:
    "account_id,account_name,account_type,opening_balance,is_archived,financial_scope,owner_membership_id,owner_membership_is_active,balance",
};
const RPC = {
  LEDGER: "get_account_ledger_balances",
  PROTOTYPE: "get_home_account_ledger_raw_inputs",
};

function assertEnabled() {
  if (process.env[BENCHMARK_FLAG] !== BENCHMARK_ENABLED) {
    throw new Error(`${BENCHMARK_FLAG}=1 is required`);
  }
}

function percentile(sorted, percentage) {
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil((percentage / 100) * sorted.length) - 1),
  );
  return sorted[index];
}

function summarize(samples) {
  const values = samples.filter((value) => Number.isFinite(value));
  const sorted = [...values].sort((left, right) => left - right);
  if (sorted.length === 0) {
    return { n: 0, min: null, median: null, p75: null, p95: null, max: null };
  }
  return {
    n: sorted.length,
    min: percentile(sorted, 0),
    median: percentile(sorted, 50),
    p75: percentile(sorted, 75),
    p95: percentile(sorted, 95),
    max: percentile(sorted, 100),
  };
}

function readCookieJson(cookieValue) {
  const encoded = cookieValue.startsWith(BASE64_COOKIE_PREFIX)
    ? cookieValue.slice(BASE64_COOKIE_PREFIX.length)
    : cookieValue;
  return JSON.parse(Buffer.from(encoded, "base64").toString("utf8"));
}

function accessTokenExpired(accessToken) {
  const [, payload] = accessToken.split(".");
  if (!payload) return true;
  const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  return Number(parsed.exp) * 1000 <= Date.now() + 30_000;
}

function readJwtSubject(accessToken) {
  const [, payload] = accessToken.split(".");
  if (!payload) return null;
  const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  return typeof parsed.sub === "string" ? parsed.sub : null;
}

async function signIn(url, publicKey, email, password) {
  const response = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: publicKey, "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) throw new Error(`sign-in failed: HTTP ${response.status}`);
  return response.json();
}

async function readPrimarySession(url, publicKey) {
  const statePath = resolve(
    process.env.VINHA_SUPABASE_AUTH_STATE ??
      "output/playwright/.auth/user.json",
  );
  const state = JSON.parse(await readFile(statePath, "utf8"));
  const cookie = state.cookies?.find(
    (candidate) =>
      candidate.name.startsWith(AUTH_COOKIE_PREFIX) &&
      candidate.name.endsWith(AUTH_COOKIE_SUFFIX),
  );
  if (!cookie?.value) throw new Error("no Playwright Supabase auth cookie");
  let session = readCookieJson(cookie.value);
  if (typeof session.access_token !== "string") {
    throw new Error("auth cookie has no access token");
  }
  if (accessTokenExpired(session.access_token)) {
    session = await signIn(
      url,
      publicKey,
      process.env.E2E_USER_EMAIL?.trim(),
      process.env.E2E_USER_PASSWORD,
    );
  }
  return session;
}

function headers(publicKey, accessToken) {
  return {
    apikey: publicKey,
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/json",
  };
}

function pathFor(table, select, filters = [], order) {
  const params = new URLSearchParams({ select });
  for (const [key, value] of filters) params.set(key, value);
  if (order) params.set("order", order);
  return `/rest/v1/${table}?${params.toString()}`;
}

function rpcPath(name) {
  return `/rest/v1/rpc/${name}`;
}

async function request(url, requestHeaders, path, options = {}) {
  const started = performance.now();
  try {
    const response = await fetch(`${url}${path}`, {
      ...options,
      headers: { ...requestHeaders, ...(options.headers ?? {}) },
      cache: "no-store",
    });
    const body = await response.arrayBuffer();
    let data = null;
    try {
      data = JSON.parse(new TextDecoder().decode(body));
    } catch {
      data = null;
    }
    return {
      durationMs: performance.now() - started,
      status: response.status,
      responseBytes: body.byteLength,
      ok: response.ok,
      data,
      errorCode: response.ok ? null : (data?.code ?? null),
    };
  } catch (error) {
    return {
      durationMs: performance.now() - started,
      status: null,
      responseBytes: null,
      ok: false,
      data: null,
      errorCode: error instanceof Error ? error.name : "NETWORK_ERROR",
    };
  }
}

function numeric(value) {
  return value == null ? null : String(value);
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, stable(item)]),
    );
  }
  return value;
}

function currentContract(accounts, ownerMemberships, balances) {
  const activeOwnerMembershipIds = new Set(
    (ownerMemberships.data ?? []).map((row) => row.id),
  );
  const balanceByAccount = new Map(
    (balances.data ?? []).map((row) => [row.account_id, numeric(row.balance)]),
  );
  return (accounts.data ?? []).map((row) =>
    stable({
      accountId: row.id,
      accountName: row.name,
      accountType: row.type,
      openingBalance: numeric(row.opening_balance),
      isArchived: row.is_archived,
      financialScope: row.financial_scope,
      ownerMembershipId: row.owner_membership_id,
      ownerMembershipIsActive:
        row.owner_membership_id == null ||
        activeOwnerMembershipIds.has(row.owner_membership_id),
      balance: balanceByAccount.get(row.id) ?? numeric(row.opening_balance),
    }),
  );
}

function prototypeContract(result) {
  return (result.data ?? []).map((row) =>
    stable({
      accountId: row.account_id,
      accountName: row.account_name,
      accountType: row.account_type,
      openingBalance: numeric(row.opening_balance),
      isArchived: row.is_archived,
      financialScope: row.financial_scope,
      ownerMembershipId: row.owner_membership_id,
      ownerMembershipIsActive: row.owner_membership_is_active,
      balance: numeric(row.balance),
    }),
  );
}

function financialContract(rows, membershipId) {
  const ownerMembershipIds = new Set(
    rows
      .filter((row) => row.ownerMembershipIsActive)
      .map((row) => row.ownerMembershipId)
      .filter((id) => id != null),
  );
  const accounts = rows.map((row) =>
    mapAccountRow(
      {
        id: row.accountId,
        name: row.accountName,
        type: row.accountType,
        opening_balance: row.openingBalance,
        is_archived: row.isArchived,
        financial_scope: row.financialScope,
        owner_membership_id: row.ownerMembershipId,
      },
      membershipId,
      ownerMembershipIds,
    ),
  );
  const balances = new Map(
    rows.map((row) => [row.accountId, Number(row.balance)]),
  );
  const mapped = applyLedgerBalances(accounts, balances);
  return stable({
    totalBalance: mapped.reduce((sum, account) => sum + account.balance, 0),
    accounts: mapped.map((account) => ({
      id: account.id,
      type: account.type,
      balance: account.balance,
      financialScope: account.financialScope,
      ownerMembershipId: account.ownerMembershipId,
      isPersonal: account.isPersonal,
      isOwnedByMe: account.isOwnedByMe,
      canMutate: account.canMutate,
      ownerStatus: account.ownerStatus,
    })),
  });
}

async function currentShape(url, requestHeaders, householdId) {
  const started = performance.now();
  const accounts = await request(
    url,
    requestHeaders,
    pathFor(
      "accounts",
      SELECT.ACCOUNT,
      [
        ["household_id", `eq.${householdId}`],
        ["is_archived", "eq.false"],
        ["type", `in.(${ACCOUNT_TYPES.join(",")})`],
      ],
      "created_at.asc",
    ),
  );
  if (!accounts.ok) {
    return {
      durationMs: performance.now() - started,
      calls: 1,
      waves: 1,
      results: [accounts],
    };
  }
  const ownerIds = [
    ...new Set(
      (accounts.data ?? [])
        .map((row) => row.owner_membership_id)
        .filter((id) => typeof id === "string"),
    ),
  ];
  const accountIds = (accounts.data ?? []).map((row) => row.id);
  if (accountIds.length === 0) {
    return {
      durationMs: performance.now() - started,
      calls: 1,
      waves: 1,
      results: [accounts],
      raw: currentContract(accounts, { data: [] }, { data: [] }),
      responseBytes: accounts.responseBytes ?? 0,
    };
  }
  const [ownerMemberships, balances] = await Promise.all([
    request(
      url,
      requestHeaders,
      pathFor("household_members", SELECT.MEMBERSHIP, [
        ["household_id", `eq.${householdId}`],
        ["is_active", "eq.true"],
        ["id", `in.(${ownerIds.join(",")})`],
      ]),
    ),
    request(url, requestHeaders, rpcPath(RPC.LEDGER), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ p_account_ids: accountIds }),
    }),
  ]);
  const results = [accounts, ownerMemberships, balances];
  return {
    durationMs: performance.now() - started,
    calls: results.length,
    waves: 2,
    results,
    raw: currentContract(accounts, ownerMemberships, balances),
    responseBytes: results.reduce(
      (sum, result) => sum + (result.responseBytes ?? 0),
      0,
    ),
  };
}

async function prototypeShape(url, requestHeaders) {
  const result = await request(url, requestHeaders, rpcPath(RPC.PROTOTYPE), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{}",
  });
  return {
    durationMs: result.durationMs,
    calls: 1,
    waves: 1,
    results: [result],
    raw: prototypeContract(result),
    responseBytes: result.responseBytes ?? 0,
  };
}

async function benchmark(
  url,
  requestHeaders,
  householdId,
  membershipId,
  repeats,
) {
  await currentShape(url, requestHeaders, householdId);
  await prototypeShape(url, requestHeaders);
  const current = [];
  const prototype = [];
  const rawMatches = [];
  const financialMatches = [];
  for (let index = 0; index < repeats; index += 1) {
    const currentSample = await currentShape(url, requestHeaders, householdId);
    const prototypeSample = await prototypeShape(url, requestHeaders);
    const currentRaw = currentSample.raw ?? [];
    const prototypeRaw = prototypeSample.raw ?? [];
    current.push(currentSample);
    prototype.push(prototypeSample);
    rawMatches.push(
      JSON.stringify(currentRaw) === JSON.stringify(prototypeRaw),
    );
    financialMatches.push(
      JSON.stringify(financialContract(currentRaw, membershipId)) ===
        JSON.stringify(financialContract(prototypeRaw, membershipId)),
    );
  }
  const shapeSummary = (samples) => ({
    duration: summarize(samples.map((sample) => sample.durationMs)),
    responseBytes: summarize(samples.map((sample) => sample.responseBytes)),
    rowCounts: samples[0]?.results.map((result) =>
      Array.isArray(result.data) ? result.data.length : null,
    ),
    calls: [...new Set(samples.map((sample) => sample.calls))],
    waves: [...new Set(samples.map((sample) => sample.waves))],
    errors: samples.reduce(
      (count, sample) =>
        count + sample.results.filter((result) => !result.ok).length,
      0,
    ),
  });
  return {
    current: shapeSummary(current),
    prototype: shapeSummary(prototype),
    rawInputEquivalence: {
      samples: rawMatches.length,
      matches: rawMatches.filter(Boolean).length,
      mismatches: rawMatches
        .map((matched, index) => (matched ? null : index + 1))
        .filter((index) => index != null),
    },
    financialEquivalence: {
      samples: financialMatches.length,
      matches: financialMatches.filter(Boolean).length,
      mismatches: financialMatches
        .map((matched, index) => (matched ? null : index + 1))
        .filter((index) => index != null),
    },
  };
}

async function tenancyProbe(url, publicKey, primarySession) {
  const identities = [{ name: "primary", session: primarySession }];
  for (const [name, emailKey, passwordKey] of [
    ["ownershipA", "OWNERSHIP_TEST_A_EMAIL", "OWNERSHIP_TEST_A_PASSWORD"],
    ["ownershipB", "OWNERSHIP_TEST_B_EMAIL", "OWNERSHIP_TEST_B_PASSWORD"],
    ["zeroAccount", "ZERO_ACCOUNT_TEST_EMAIL", "ZERO_ACCOUNT_TEST_PASSWORD"],
  ]) {
    const email = process.env[emailKey]?.trim();
    const password = process.env[passwordKey];
    if (email && password) {
      identities.push({
        name,
        session: await signIn(url, publicKey, email, password),
      });
    }
  }

  const rows = [];
  for (const identity of identities) {
    const requestHeaders = headers(publicKey, identity.session.access_token);
    const subject = readJwtSubject(identity.session.access_token);
    const [memberships, accounts, prototype] = await Promise.all([
      request(
        url,
        requestHeaders,
        pathFor("household_members", SELECT.MEMBERSHIP, [
          ["user_id", `eq.${subject}`],
          ["is_active", "eq.true"],
        ]),
      ),
      request(
        url,
        requestHeaders,
        pathFor("accounts", SELECT.ACCOUNT, [
          ["is_archived", "eq.false"],
          ["type", `in.(${ACCOUNT_TYPES.join(",")})`],
        ]),
      ),
      prototypeShape(url, requestHeaders),
    ]);
    rows.push({
      identity: identity.name,
      activeMemberships: memberships.data?.length ?? 0,
      accountRows: accounts.data?.length ?? 0,
      prototypeRows: prototype.raw?.length ?? 0,
      rpcStatus: prototype.results[0].status,
      rpcErrorCode: prototype.results[0].errorCode,
      accountIds: new Set((accounts.data ?? []).map((row) => row.id)),
    });
  }
  const primary = rows[0];
  const comparisons = rows.slice(1).map((row) => ({
    identity: row.identity,
    sharesPrimaryAccount:
      primary && [...row.accountIds].some((id) => primary.accountIds.has(id)),
    expectedForeignRows: row.activeMemberships === 0 ? row.accountRows : null,
  }));
  const anonymous = await request(
    url,
    { apikey: publicKey, Accept: "application/json" },
    rpcPath(RPC.PROTOTYPE),
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
    },
  );
  return {
    identities: rows.map((row) =>
      Object.fromEntries(
        Object.entries(row).filter(([key]) => key !== "accountIds"),
      ),
    ),
    nonMemberComparisons: comparisons,
    anonymous: {
      status: anonymous.status,
      errorCode: anonymous.errorCode,
      denied: !anonymous.ok,
    },
  };
}

async function main() {
  assertEnabled();
  loadEnvConfig(process.cwd());
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publicKey = (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )?.trim();
  if (!url || !publicKey) throw new Error("Supabase public URL/key required");
  const repeats = Number(
    process.env.VINHA_HOME_ACCOUNT_BENCH_REPEATS ?? DEFAULT_REPEATS,
  );
  if (!Number.isInteger(repeats) || repeats < DEFAULT_REPEATS) {
    throw new Error(`repeats must be an integer >= ${DEFAULT_REPEATS}`);
  }
  const primarySession = await readPrimarySession(url, publicKey);
  const primaryHeaders = headers(publicKey, primarySession.access_token);
  const primarySubject = readJwtSubject(primarySession.access_token);
  const membership = await request(
    url,
    primaryHeaders,
    pathFor("household_members", SELECT.MEMBERSHIP, [
      ["user_id", `eq.${primarySubject}`],
      ["is_active", "eq.true"],
    ]),
  );
  const activeMembership = membership.data?.[0];
  if (!activeMembership?.household_id || !activeMembership.id) {
    throw new Error("primary active membership required");
  }
  const report = await benchmark(
    url,
    primaryHeaders,
    activeMembership.household_id,
    activeMembership.id,
    repeats,
  );
  const rls = await tenancyProbe(url, publicKey, primarySession);
  process.stdout.write(
    `${JSON.stringify({ repeats, authenticated: true, report, rls }, null, 2)}\n`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "benchmark failed");
  process.exitCode = 1;
});
