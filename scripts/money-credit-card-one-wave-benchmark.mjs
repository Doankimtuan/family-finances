/**
 * Read-only MONEY credit-card raw-input benchmark and tenancy probe.
 *
 * Run with:
 *   VINHA_MONEY_CARD_BENCH=1 node scripts/money-credit-card-one-wave-benchmark.mjs
 */

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import nextEnv from "@next/env";
import { createJiti } from "jiti";

const { loadEnvConfig } = nextEnv;
const jiti = createJiti(import.meta.url, { tsconfigPaths: true });
const { buildCreditCardSummary, mapBillingMonthRow, mapCreditCardSettingsRow } =
  await jiti.import("../modules/ledger/application/credit-card-types.ts");

const BENCHMARK_FLAG = "VINHA_MONEY_CARD_BENCH";
const BENCHMARK_ENABLED = "1";
const DEFAULT_REPEATS = 20;
const AUTH_COOKIE_PREFIX = "sb-";
const AUTH_COOKIE_SUFFIX = "-auth-token";
const BASE64_COOKIE_PREFIX = "base64-";
const RPC = "get_money_credit_card_raw_inputs";
const SELECT = {
  ACCOUNT:
    "id,name,type,is_archived,financial_scope,owner_membership_id,created_at",
  SETTINGS:
    "account_id,credit_limit,statement_day,due_day,linked_bank_account_id",
  MONTH:
    "id,card_account_id,billing_month,statement_amount,paid_amount,due_date,status",
  MEMBERSHIP: "id,household_id,user_id,is_active",
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
  const authCookies = (state.cookies ?? [])
    .filter(
      (candidate) =>
        candidate.name.startsWith(AUTH_COOKIE_PREFIX) &&
        candidate.name.includes(AUTH_COOKIE_SUFFIX),
    )
    .sort((left, right) => left.name.localeCompare(right.name));
  const authCookieValue = authCookies.map((cookie) => cookie.value).join("");
  if (!authCookieValue) throw new Error("no Playwright Supabase auth cookie");
  let session = readCookieJson(authCookieValue);
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

function rpcPath() {
  return `/rest/v1/rpc/${RPC}`;
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

function dateOnly(value) {
  return value == null ? null : String(value).slice(0, 10);
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

function normalizeSettings(row) {
  return {
    accountId: row.account_id,
    creditLimit: numeric(row.credit_limit),
    statementDay: row.statement_day,
    dueDay: row.due_day,
    linkedBankAccountId: row.linked_bank_account_id,
  };
}

function normalizeMonth(row) {
  return {
    id: row.id,
    cardAccountId: row.card_account_id,
    billingMonth: dateOnly(row.billing_month),
    statementAmount: numeric(row.statement_amount),
    paidAmount: numeric(row.paid_amount),
    dueDate: dateOnly(row.due_date),
    status: row.status,
  };
}

function normalizeCurrent(results) {
  const [accounts, settings, months] = results;
  const settingsByAccount = new Map(
    (settings.data ?? []).map((row) => [
      row.account_id,
      normalizeSettings(row),
    ]),
  );
  const monthsByAccount = new Map();
  for (const row of months.data ?? []) {
    const list = monthsByAccount.get(row.card_account_id) ?? [];
    list.push(normalizeMonth(row));
    monthsByAccount.set(row.card_account_id, list);
  }
  return (accounts.data ?? [])
    .map((row) => ({
      accountId: row.id,
      accountName: row.name,
      accountType: row.type,
      isArchived: row.is_archived,
      financialScope: row.financial_scope,
      ownerMembershipId: row.owner_membership_id,
      settings: settingsByAccount.get(row.id) ?? null,
      months: (monthsByAccount.get(row.id) ?? []).sort((left, right) =>
        left.id.localeCompare(right.id),
      ),
    }))
    .sort((left, right) => left.accountId.localeCompare(right.accountId))
    .map(stable);
}

function normalizeCandidate(result) {
  const cards = new Map();
  for (const row of result.data ?? []) {
    let card = cards.get(row.account_id);
    if (!card) {
      card = {
        accountId: row.account_id,
        accountName: row.account_name,
        accountType: row.account_type,
        isArchived: false,
        financialScope: row.financial_scope,
        ownerMembershipId: row.owner_membership_id,
        settings:
          row.credit_limit == null
            ? null
            : {
                accountId: row.account_id,
                creditLimit: numeric(row.credit_limit),
                statementDay: row.statement_day,
                dueDay: row.due_day,
                linkedBankAccountId: row.linked_bank_account_id,
              },
        months: [],
      };
      cards.set(row.account_id, card);
    }
    if (row.billing_month_id != null) {
      card.months.push({
        id: row.billing_month_id,
        cardAccountId: row.card_account_id,
        billingMonth: dateOnly(row.billing_month),
        statementAmount: numeric(row.statement_amount),
        paidAmount: numeric(row.paid_amount),
        dueDate: dateOnly(row.due_date),
        status: row.status,
      });
    }
  }
  return [...cards.values()]
    .sort((left, right) => left.accountId.localeCompare(right.accountId))
    .map((card) => ({
      ...card,
      months: card.months.sort((left, right) =>
        left.id.localeCompare(right.id),
      ),
    }))
    .map(stable);
}

function finalCardContract(rawCards) {
  return rawCards
    .filter((card) => card.settings != null)
    .map((card) => {
      const settings = mapCreditCardSettingsRow({
        account_id: card.settings.accountId,
        credit_limit: card.settings.creditLimit,
        statement_day: card.settings.statementDay,
        due_day: card.settings.dueDay,
        linked_bank_account_id: card.settings.linkedBankAccountId,
      });
      const months = card.months.map((month) =>
        mapBillingMonthRow({
          id: month.id,
          card_account_id: month.cardAccountId,
          billing_month: month.billingMonth,
          statement_amount: month.statementAmount,
          paid_amount: month.paidAmount,
          due_date: month.dueDate,
          status: month.status,
        }),
      );
      return buildCreditCardSummary({
        accountId: card.accountId,
        name: card.accountName,
        settings,
        months,
      });
    })
    .sort((left, right) => left.accountId.localeCompare(right.accountId))
    .map(stable);
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
        ["type", "eq.credit_card"],
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
      raw: [],
      final: [],
    };
  }
  const accountIds = (accounts.data ?? []).map((row) => row.id);
  if (accountIds.length === 0) {
    return {
      durationMs: performance.now() - started,
      calls: 1,
      waves: 1,
      results: [accounts],
      raw: normalizeCurrent([accounts, { data: [] }, { data: [] }]),
      final: [],
      responseBytes: accounts.responseBytes ?? 0,
    };
  }
  const [settings, months] = await Promise.all([
    request(
      url,
      requestHeaders,
      pathFor("credit_card_settings", SELECT.SETTINGS, [
        ["household_id", `eq.${householdId}`],
        ["account_id", `in.(${accountIds.join(",")})`],
      ]),
    ),
    request(
      url,
      requestHeaders,
      pathFor("card_billing_months", SELECT.MONTH, [
        ["household_id", `eq.${householdId}`],
        ["card_account_id", `in.(${accountIds.join(",")})`],
        ["status", "neq.settled"],
      ]),
    ),
  ]);
  const results = [accounts, settings, months];
  const raw = normalizeCurrent(results);
  return {
    durationMs: performance.now() - started,
    calls: 3,
    waves: 2,
    results,
    raw,
    final: finalCardContract(raw),
    responseBytes: results.reduce(
      (sum, result) => sum + (result.responseBytes ?? 0),
      0,
    ),
  };
}

async function candidateShape(url, requestHeaders) {
  const result = await request(url, requestHeaders, rpcPath(), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{}",
  });
  const raw = normalizeCandidate(result);
  return {
    durationMs: result.durationMs,
    calls: 1,
    waves: 1,
    results: [result],
    raw,
    final: finalCardContract(raw),
    responseBytes: result.responseBytes ?? 0,
  };
}

function shapeSummary(samples) {
  return {
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
  };
}

async function benchmark(url, requestHeaders, householdId, repeats) {
  await currentShape(url, requestHeaders, householdId);
  await candidateShape(url, requestHeaders);
  const current = [];
  const candidate = [];
  const rawMatches = [];
  const finalMatches = [];
  for (let index = 0; index < repeats; index += 1) {
    const currentSample = await currentShape(url, requestHeaders, householdId);
    const candidateSample = await candidateShape(url, requestHeaders);
    current.push(currentSample);
    candidate.push(candidateSample);
    rawMatches.push(
      JSON.stringify(currentSample.raw) === JSON.stringify(candidateSample.raw),
    );
    finalMatches.push(
      JSON.stringify(currentSample.final) ===
        JSON.stringify(candidateSample.final),
    );
  }
  return {
    current: shapeSummary(current),
    candidate: shapeSummary(candidate),
    rawInputEquivalence: {
      samples: rawMatches.length,
      matches: rawMatches.filter(Boolean).length,
      mismatches: rawMatches
        .map((matched, index) => (matched ? null : index + 1))
        .filter((index) => index != null),
    },
    finalCardEquivalence: {
      samples: finalMatches.length,
      matches: finalMatches.filter(Boolean).length,
      mismatches: finalMatches
        .map((matched, index) => (matched ? null : index + 1))
        .filter((index) => index != null),
    },
  };
}

async function readIdentity(url, publicKey, name, session) {
  const requestHeaders = headers(publicKey, session.access_token);
  const subject = readJwtSubject(session.access_token);
  const memberships = await request(
    url,
    requestHeaders,
    pathFor("household_members", SELECT.MEMBERSHIP, [
      ["user_id", `eq.${subject}`],
      ["is_active", "eq.true"],
    ]),
  );
  const cards = await request(
    url,
    requestHeaders,
    pathFor("accounts", "id,household_id", [
      ["is_archived", "eq.false"],
      ["type", "eq.credit_card"],
    ]),
  );
  const candidate = await candidateShape(url, requestHeaders);
  return {
    name,
    requestHeaders,
    memberships: memberships.data ?? [],
    visibleCardRows: cards.data ?? [],
    candidate,
  };
}

async function tenancyProbe(url, publicKey, primarySession) {
  const identities = [
    await readIdentity(url, publicKey, "primary", primarySession),
  ];
  for (const [name, emailKey, passwordKey] of [
    ["ownershipA", "OWNERSHIP_TEST_A_EMAIL", "OWNERSHIP_TEST_A_PASSWORD"],
    ["ownershipB", "OWNERSHIP_TEST_B_EMAIL", "OWNERSHIP_TEST_B_PASSWORD"],
    ["zeroAccount", "ZERO_ACCOUNT_TEST_EMAIL", "ZERO_ACCOUNT_TEST_PASSWORD"],
  ]) {
    const email = process.env[emailKey]?.trim();
    const password = process.env[passwordKey];
    if (email && password) {
      identities.push(
        await readIdentity(
          url,
          publicKey,
          name,
          await signIn(url, publicKey, email, password),
        ),
      );
    }
  }

  const primaryHouseholdId = identities[0].memberships[0]?.household_id;
  const primaryCardIds = new Set(
    identities[0].visibleCardRows.map((row) => row.id),
  );
  const identityResults = identities.map((identity) => ({
    identity: identity.name,
    activeMemberships: identity.memberships.length,
    visibleCardRows: identity.visibleCardRows.length,
    candidateRows: identity.candidate.raw.length,
    candidateStatus: identity.candidate.results[0].status,
    sharesPrimaryCard:
      identity.name === "primary"
        ? false
        : identity.visibleCardRows.some((row) => primaryCardIds.has(row.id)),
  }));
  const noCardIdentity = identityResults.find(
    (identity) =>
      identity.activeMemberships > 0 && identity.candidateRows === 0,
  );
  const nonMemberIdentity = identityResults.find(
    (identity) => identity.activeMemberships === 0,
  );
  const foreignIdentity = identities.find(
    (identity) =>
      identity.name !== "primary" &&
      identity.memberships[0]?.household_id != null &&
      identity.memberships[0].household_id !== primaryHouseholdId,
  );
  let crossHousehold = { status: "not_available" };
  if (foreignIdentity && primaryHouseholdId) {
    const attempt = await request(
      url,
      foreignIdentity.requestHeaders,
      pathFor("accounts", "id", [["household_id", `eq.${primaryHouseholdId}`]]),
    );
    crossHousehold = {
      status: attempt.status,
      rows: attempt.data?.length ?? 0,
      passed: attempt.ok && (attempt.data?.length ?? 0) === 0,
    };
  }
  const anonymous = await request(
    url,
    { apikey: publicKey, Accept: "application/json" },
    rpcPath(),
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
    },
  );
  return {
    identities: identityResults,
    activeHouseholdWithoutCards: noCardIdentity
      ? { identity: noCardIdentity.identity, passed: true }
      : { status: "not_available", passed: false },
    authenticatedNonMember: nonMemberIdentity
      ? {
          identity: nonMemberIdentity.identity,
          status: nonMemberIdentity.candidateStatus,
          rows: nonMemberIdentity.candidateRows,
          passed: nonMemberIdentity.candidateRows === 0,
        }
      : { status: "not_available", passed: false },
    crossHousehold,
    anonymous: {
      status: anonymous.status,
      errorCode: anonymous.errorCode,
      passed: !anonymous.ok,
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
    process.env.VINHA_MONEY_CARD_BENCH_REPEATS ?? DEFAULT_REPEATS,
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
  if (!activeMembership?.household_id) {
    throw new Error("primary active membership required");
  }
  const report = await benchmark(
    url,
    primaryHeaders,
    activeMembership.household_id,
    repeats,
  );
  const rls = await tenancyProbe(url, publicKey, primarySession);
  process.stdout.write(
    `${JSON.stringify({ repeats, report, rls }, null, 2)}\n`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "benchmark failed");
  process.exitCode = 1;
});
