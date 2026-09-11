import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const FLAG = "VINHA_LOANS_DIRECT_BENCH";
const REPEATS = 20;
const OUTPUT =
  process.env.VINHA_LOANS_DIRECT_OUTPUT ??
  "output/playwright/loans-benchmark/direct.json";
const LOAN_SELECT =
  "id,name,lender,loan_type,principal,remaining_principal,annual_interest_rate,interest_strategy,promo_fixed_rate,promo_fixed_months,promo_floating_rate,promo_rate_effective_on,start_date,expected_end_date,first_payment_date,repayment_frequency,repayment_method,term_months,monthly_payment,total_interest,total_repayment,next_payment_date,currency,status,note,due_day,financial_scope,owner_membership_id";

function requireEnvironment() {
  if (process.env[FLAG] !== "1") throw new Error(`${FLAG}=1 is required`);
  for (const name of [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    "E2E_USER_EMAIL",
    "E2E_USER_PASSWORD",
  ]) {
    if (!process.env[name]?.trim()) throw new Error(`${name} is required`);
  }
}

function percentile(sorted, percentage) {
  return sorted[
    Math.min(
      sorted.length - 1,
      Math.ceil((percentage / 100) * sorted.length) - 1,
    )
  ];
}

function summarize(samples) {
  const values = samples.filter((sample) => Number.isFinite(sample.ms));
  const sorted = values.map((sample) => sample.ms).sort((a, b) => a - b);
  return sorted.length === 0
    ? { n: 0, min: null, median: null, p75: null, p95: null, max: null }
    : {
        n: sorted.length,
        min: sorted[0],
        median: percentile(sorted, 50),
        p75: percentile(sorted, 75),
        p95: percentile(sorted, 95),
        max: sorted[sorted.length - 1],
      };
}

async function signIn() {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/token?grant_type=password`,
    {
      method: "POST",
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        email: process.env.E2E_USER_EMAIL.trim(),
        password: process.env.E2E_USER_PASSWORD,
      }),
    },
  );
  if (!response.ok) throw new Error(`sign-in failed: ${response.status}`);
  const session = await response.json();
  if (typeof session.access_token !== "string")
    throw new Error("sign-in returned no access token");
  return session.access_token;
}

function requestHeaders(accessToken) {
  return {
    apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    Authorization: `Bearer ${accessToken}`,
  };
}

async function request(accessToken, path) {
  const started = performance.now();
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}${path}`,
    {
      headers: requestHeaders(accessToken),
    },
  );
  const body = await response.text();
  let data = null;
  try {
    data = JSON.parse(body);
  } catch {}
  return {
    ms: Math.round((performance.now() - started) * 100) / 100,
    status: response.status,
    bytes: Buffer.byteLength(body),
    rows: Array.isArray(data) ? data.length : data == null ? 0 : 1,
    data,
    error: response.ok ? null : body.slice(0, 300),
  };
}

function encodeList(values) {
  return `(${values.join(",")})`;
}

async function benchmarkEndpoint(accessToken, name, path) {
  await request(accessToken, path);
  const samples = [];
  for (let index = 0; index < REPEATS; index += 1) {
    const result = await request(accessToken, path);
    samples.push({
      index: index + 1,
      ms: result.ms,
      status: result.status,
      bytes: result.bytes,
      rows: result.rows,
      error: result.error,
    });
  }
  return { name, path, summary: summarize(samples), samples };
}

async function main() {
  requireEnvironment();
  const accessToken = await signIn();
  const authUser = await request(accessToken, "/auth/v1/user");
  const userId = authUser.data?.id;
  if (typeof userId !== "string") throw new Error("auth user lookup failed");

  const membershipPath =
    `/rest/v1/household_members?select=id%2Chousehold_id%2Cuser_id%2Crole&user_id=eq.${userId}&is_active=eq.true` +
    "&limit=1";
  const membership = await request(accessToken, membershipPath);
  const currentMembership = membership.data?.[0];
  if (!currentMembership?.household_id)
    throw new Error("membership lookup failed");
  const householdId = currentMembership.household_id;

  const loansPath = `/rest/v1/loans?select=${LOAN_SELECT}&household_id=eq.${householdId}&order=created_at.desc`;
  const loans = await request(accessToken, loansPath);
  if (!Array.isArray(loans.data)) throw new Error("loans lookup failed");
  const loanIds = loans.data.map((loan) => loan.id);
  const ownerIds = [
    ...new Set(
      loans.data
        .map((loan) => loan.owner_membership_id)
        .filter((id) => typeof id === "string"),
    ),
  ];
  const encodedLoanIds = encodeList(loanIds);
  const endpoints = [
    ["auth user", "/auth/v1/user"],
    ["membership", membershipPath],
    ["loans list", loansPath],
    [
      "loan payments aggregate",
      `/rest/v1/loan_payments?select=loan_id%2Cprincipal_paid%2Cinterest_paid&household_id=eq.${householdId}&loan_id=in.${encodedLoanIds}`,
    ],
    [
      "upcoming schedule",
      `/rest/v1/loan_schedule_entries?select=loan_id%2Ctotal_due%2Csequence&household_id=eq.${householdId}&loan_id=in.${encodedLoanIds}&status=eq.upcoming&order=sequence.asc`,
    ],
  ];
  if (ownerIds.length > 0) {
    endpoints.push([
      "owner membership",
      `/rest/v1/household_members?select=id&household_id=eq.${householdId}&is_active=eq.true&id=in.${encodeList(ownerIds)}`,
    ]);
  }

  const results = [];
  for (const [name, path] of endpoints) {
    results.push(await benchmarkEndpoint(accessToken, name, path));
  }

  await mkdir(dirname(OUTPUT), { recursive: true });
  await writeFile(
    OUTPUT,
    JSON.stringify(
      {
        repeats: REPEATS,
        householdId,
        loanCount: loanIds.length,
        ownerMembershipCount: ownerIds.length,
        endpoints: results,
      },
      null,
      2,
    ),
  );
  console.error(
    JSON.stringify({
      output: OUTPUT,
      loanCount: loanIds.length,
      endpoints: results.map(({ name, summary }) => ({ name, summary })),
    }),
  );
}

main().catch((error) => {
  console.error(
    error instanceof Error ? error.message : "direct benchmark failed",
  );
  process.exitCode = 1;
});
