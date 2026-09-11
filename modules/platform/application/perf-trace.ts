/**
 * Development-only request timing. Enable with VINHA_PERF_TRACE=1.
 * Logs durations and URL pathnames only — never tokens, bodies, or row data.
 */

export const PERF_TRACE_FLAG = {
  ENV: "VINHA_PERF_TRACE",
  ENABLED: "1",
} as const;

export const PERF_TRACE_LOG_PREFIX = "[vinha.perf]";

export const PERF_TRACE_OP = {
  FETCH: "fetch",
  AUTH_GET_USER: "auth.getUser",
  AUTH_GET_CLAIMS: "auth.getClaims",
  MEMBERSHIP_RESOLVE: "membership.resolve",
} as const;

export function isPerfTraceEnabled(): boolean {
  return process.env[PERF_TRACE_FLAG.ENV] === PERF_TRACE_FLAG.ENABLED;
}

export function perfTracePathname(input: RequestInfo | URL): string {
  try {
    if (typeof input === "string") {
      return new URL(input).pathname;
    }
    if (input instanceof URL) {
      return input.pathname;
    }
    if (input instanceof Request) {
      return new URL(input.url).pathname;
    }
  } catch {
    return "unparseable";
  }
  return "unknown";
}

function requestMethod(input: RequestInfo | URL, init?: RequestInit): string {
  if (init?.method) return init.method;
  if (input instanceof Request) return input.method;
  return "GET";
}

function writePerfTrace(event: Record<string, unknown>): void {
  process.stdout.write(`${PERF_TRACE_LOG_PREFIX} ${JSON.stringify(event)}\n`);
}

export function wrapFetchForPerfTrace(baseFetch: typeof fetch): typeof fetch {
  if (!isPerfTraceEnabled()) {
    return baseFetch;
  }

  return async (input, init) => {
    const start = performance.now();
    const method = requestMethod(input, init);
    try {
      const response = await baseFetch(input, init);
      writePerfTrace({
        op: PERF_TRACE_OP.FETCH,
        method,
        path: perfTracePathname(input),
        status: response.status,
        at: Math.round(start),
        ms: Math.round(performance.now() - start),
      });
      return response;
    } catch (error) {
      console.error(PERF_TRACE_LOG_PREFIX, {
        op: PERF_TRACE_OP.FETCH,
        method,
        path: perfTracePathname(input),
        at: Math.round(start),
        ms: Math.round(performance.now() - start),
        failed: true,
      });
      throw error;
    }
  };
}

export async function withPerfSpan<T>(
  op: (typeof PERF_TRACE_OP)[keyof typeof PERF_TRACE_OP],
  fn: () => Promise<T>,
): Promise<T> {
  if (!isPerfTraceEnabled()) {
    return fn();
  }
  const start = performance.now();
  try {
    return await fn();
  } finally {
    writePerfTrace({
      op,
      at: Math.round(start),
      ms: Math.round(performance.now() - start),
    });
  }
}
