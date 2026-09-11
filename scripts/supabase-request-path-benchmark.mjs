/**
 * Read-only Supabase request-path benchmark.
 *
 * Run only with VINHA_SUPABASE_BENCH=1. It uses the local Playwright auth
 * state without printing tokens, performs GET/RPC-style reads only, and emits
 * structured JSON. A real perf_ping RPC is intentionally not created here:
 * the existing database has no safe trivial RPC and this investigation must
 * not change production schema.
 *
 *   VINHA_SUPABASE_BENCH=1 node scripts/supabase-request-path-benchmark.mjs
 */

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;

const BENCH_FLAG = "VINHA_SUPABASE_BENCH";
const BENCH_ENABLED = "1";
const DEFAULT_REPEATS = 21;
const AUTH_COOKIE_PREFIX = "sb-";
const AUTH_COOKIE_SUFFIX = "-auth-token";
const BASE64_COOKIE_PREFIX = "base64-";
const ENVIRONMENT = process.env.VINHA_SUPABASE_BENCH_ENV ?? "LOCAL_VN";

const PROBE_PATH = {
  CONTROL: "/rest/v1/",
  MINIMAL_POSTGREST: "/rest/v1/accounts?select=id&limit=1",
  HOME_ACCOUNTS:
    "/rest/v1/accounts?select=id,name,type,opening_balance,is_archived&is_archived=eq.false&order=created_at.asc",
  AUTH_USER: "/auth/v1/user",
};

function assertEnabled() {
  if (process.env[BENCH_FLAG] !== BENCH_ENABLED) {
    throw new Error(`${BENCH_FLAG}=1 is required`);
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
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance =
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  return {
    n: sorted.length,
    min: sorted[0],
    median: percentile(sorted, 50),
    p75: percentile(sorted, 75),
    p95: percentile(sorted, 95),
    max: sorted[sorted.length - 1],
    standardDeviation: Math.sqrt(variance),
  };
}

function readCookieJson(cookieValue) {
  const encoded = cookieValue.startsWith(BASE64_COOKIE_PREFIX)
    ? cookieValue.slice(BASE64_COOKIE_PREFIX.length)
    : cookieValue;
  return JSON.parse(Buffer.from(encoded, "base64").toString("utf8"));
}

function readJwtSubject(accessToken) {
  const [, payload] = accessToken.split(".");
  if (!payload) return null;
  try {
    const parsed = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    );
    return typeof parsed.sub === "string" ? parsed.sub : null;
  } catch {
    return null;
  }
}

async function readAuthState() {
  const authStatePath = resolve(
    process.env.VINHA_SUPABASE_AUTH_STATE ??
      "output/playwright/.auth/user.json",
  );
  const state = JSON.parse(await readFile(authStatePath, "utf8"));
  const cookie = state.cookies?.find(
    (candidate) =>
      candidate.name.startsWith(AUTH_COOKIE_PREFIX) &&
      candidate.name.endsWith(AUTH_COOKIE_SUFFIX),
  );
  if (!cookie?.value) {
    throw new Error("No Supabase auth cookie found in Playwright state");
  }
  const session = readCookieJson(cookie.value);
  if (typeof session.access_token !== "string") {
    throw new Error("Supabase auth cookie has no access token");
  }
  return session;
}

async function refreshIfExpired(session, url, publicKey) {
  const payload = session.access_token.split(".")[1];
  const expiresAt = payload
    ? Number(JSON.parse(Buffer.from(payload, "base64url").toString("utf8")).exp)
    : 0;
  if (expiresAt * 1000 > Date.now() + 30_000) return session;
  if (typeof session.refresh_token !== "string") {
    throw new Error(
      "Supabase access token expired and no refresh token exists",
    );
  }

  const response = await fetch(
    `${url}/auth/v1/token?grant_type=refresh_token`,
    {
      method: "POST",
      headers: {
        apikey: publicKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({ refresh_token: session.refresh_token }),
    },
  );
  if (!response.ok) {
    throw new Error(`Auth refresh failed with status ${response.status}`);
  }
  const refreshed = await response.json();
  if (
    typeof refreshed.access_token !== "string" ||
    typeof refreshed.refresh_token !== "string"
  ) {
    throw new Error("Auth refresh returned an invalid session");
  }
  return refreshed;
}

async function signInForBenchmark(url, publicKey) {
  const email = process.env.E2E_USER_EMAIL?.trim();
  const password = process.env.E2E_USER_PASSWORD;
  if (!email || !password) {
    throw new Error(
      "E2E credentials are required when the saved session expires",
    );
  }
  const response = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      apikey: publicKey,
      "content-type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    throw new Error(`Benchmark sign-in failed with status ${response.status}`);
  }
  const session = await response.json();
  if (
    typeof session.access_token !== "string" ||
    typeof session.refresh_token !== "string"
  ) {
    throw new Error("Benchmark sign-in returned an invalid session");
  }
  return session;
}

function buildHeaders(publicKey, accessToken) {
  return {
    apikey: publicKey,
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/json",
  };
}

async function timedRequest(label, url, headers, path) {
  const started = performance.now();
  try {
    const response = await fetch(`${url}${path}`, {
      headers,
      cache: "no-store",
    });
    const body = await response.arrayBuffer();
    return {
      probe: label,
      durationMs: performance.now() - started,
      status: response.status,
      responseBytes: body.byteLength,
      ok: response.ok,
    };
  } catch {
    return {
      probe: label,
      durationMs: performance.now() - started,
      status: null,
      responseBytes: null,
      ok: false,
      failed: true,
    };
  }
}

async function runProbe(label, url, headers, path, repeats) {
  const warmup = await timedRequest(label, url, headers, path);
  const samples = [];
  for (let index = 0; index < repeats; index += 1) {
    samples.push(await timedRequest(label, url, headers, path));
  }
  return {
    probe: label,
    warmup,
    samples,
    summary: summarize(samples.map((sample) => sample.durationMs)),
    errorCount: samples.filter((sample) => !sample.ok).length,
  };
}

async function runConcurrency(url, headers, path, concurrency) {
  const started = performance.now();
  const samples = await Promise.all(
    Array.from({ length: concurrency }, () =>
      timedRequest(`concurrency_${concurrency}`, url, headers, path),
    ),
  );
  const durations = samples.map((sample) => sample.durationMs);
  return {
    requests: concurrency,
    totalWallMs: performance.now() - started,
    perRequest: summarize(durations),
    slowestMs: Math.max(...durations),
    errorCount: samples.filter((sample) => !sample.ok).length,
  };
}

async function runSequential(url, headers, path, count) {
  const started = performance.now();
  const samples = [];
  for (let index = 0; index < count; index += 1) {
    samples.push(await timedRequest(`sequential_${count}`, url, headers, path));
  }
  const durations = samples.map((sample) => sample.durationMs);
  return {
    requests: count,
    totalWallMs: performance.now() - started,
    perRequest: summarize(durations),
    slowestMs: Math.max(...durations),
    errorCount: samples.filter((sample) => !sample.ok).length,
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
  if (!url || !publicKey) {
    throw new Error("Supabase public URL and publishable key are required");
  }

  const repeats = Number(
    process.env.VINHA_SUPABASE_BENCH_REPEATS ?? DEFAULT_REPEATS,
  );
  if (!Number.isInteger(repeats) || repeats < 20) {
    throw new Error("VINHA_SUPABASE_BENCH_REPEATS must be an integer >= 20");
  }

  let session = await readAuthState();
  try {
    session = await refreshIfExpired(session, url, publicKey);
  } catch {
    session = await signInForBenchmark(url, publicKey);
  }
  const accessToken = session.access_token;
  const subject = readJwtSubject(accessToken);
  if (!subject) throw new Error("Supabase access token has no user subject");
  const headers = buildHeaders(publicKey, accessToken);
  const membershipPath = `/rest/v1/household_members?select=id,household_id,role,user_id&user_id=eq.${encodeURIComponent(subject)}&is_active=eq.true&limit=1`;

  const probes = [
    await runProbe(
      "control_rest_root",
      url,
      headers,
      PROBE_PATH.CONTROL,
      repeats,
    ),
    await runProbe(
      "minimal_postgrest",
      url,
      headers,
      PROBE_PATH.MINIMAL_POSTGREST,
      repeats,
    ),
    await runProbe(
      "auth_get_user",
      url,
      headers,
      PROBE_PATH.AUTH_USER,
      repeats,
    ),
    await runProbe("membership_lookup", url, headers, membershipPath, repeats),
    await runProbe(
      "representative_home_accounts",
      url,
      headers,
      PROBE_PATH.HOME_ACCOUNTS,
      repeats,
    ),
  ];

  const concurrency = {
    one: await runConcurrency(url, headers, PROBE_PATH.MINIMAL_POSTGREST, 1),
    fiveSequential: await runSequential(
      url,
      headers,
      PROBE_PATH.MINIMAL_POSTGREST,
      5,
    ),
    fiveParallel: await runConcurrency(
      url,
      headers,
      PROBE_PATH.MINIMAL_POSTGREST,
      5,
    ),
    tenParallel: await runConcurrency(
      url,
      headers,
      PROBE_PATH.MINIMAL_POSTGREST,
      10,
    ),
    twentyParallel: await runConcurrency(
      url,
      headers,
      PROBE_PATH.MINIMAL_POSTGREST,
      20,
    ),
  };

  // eslint-disable-next-line no-console -- stdout is the machine-readable benchmark artifact.
  console.log(
    JSON.stringify(
      {
        environment: ENVIRONMENT,
        runtimeRegion: process.env.VINHA_SUPABASE_BENCH_RUNTIME_REGION ?? null,
        repeats,
        authenticated: true,
        probes,
        concurrency,
        connectionReuse: {
          measured: false,
          limitation:
            "Node fetch does not expose DNS/TCP/TLS/socket reuse metadata in this harness.",
        },
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "benchmark failed");
  process.exitCode = 1;
});
