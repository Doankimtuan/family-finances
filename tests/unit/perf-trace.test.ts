import { describe, expect, it, vi } from "vitest";
import {
  PERF_TRACE_FLAG,
  PERF_TRACE_OP,
  isPerfTraceEnabled,
  perfTracePathname,
  withPerfSpan,
  wrapFetchForPerfTrace,
} from "@/modules/platform/application/perf-trace";

describe("perf trace helpers", () => {
  it("is off unless VINHA_PERF_TRACE=1", () => {
    const previous = process.env[PERF_TRACE_FLAG.ENV];
    delete process.env[PERF_TRACE_FLAG.ENV];
    expect(isPerfTraceEnabled()).toBe(false);
    process.env[PERF_TRACE_FLAG.ENV] = PERF_TRACE_FLAG.ENABLED;
    expect(isPerfTraceEnabled()).toBe(true);
    if (previous == null) {
      delete process.env[PERF_TRACE_FLAG.ENV];
    } else {
      process.env[PERF_TRACE_FLAG.ENV] = previous;
    }
  });

  it("logs pathnames without query strings or fragments", () => {
    expect(
      perfTracePathname(
        "https://example.supabase.co/rest/v1/transactions?select=id,amount&household_id=eq.secret",
      ),
    ).toBe("/rest/v1/transactions");
    expect(
      perfTracePathname(new URL("https://example.supabase.co/auth/v1/user")),
    ).toBe("/auth/v1/user");
  });

  it("keeps successful telemetry out of the browser error channel", async () => {
    const previous = process.env[PERF_TRACE_FLAG.ENV];
    const stdoutWrite = vi
      .spyOn(process.stdout, "write")
      .mockImplementation(() => true);
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const baseFetch: typeof fetch = async () =>
      new Response(null, { status: 200 });
    process.env[PERF_TRACE_FLAG.ENV] = PERF_TRACE_FLAG.ENABLED;

    try {
      await wrapFetchForPerfTrace(baseFetch)(
        "https://example.supabase.co/rest/v1/transactions",
      );
      await withPerfSpan(PERF_TRACE_OP.AUTH_GET_USER, async () => undefined);

      expect(stdoutWrite).toHaveBeenCalledTimes(2);
      expect(consoleError).not.toHaveBeenCalled();
    } finally {
      if (previous == null) delete process.env[PERF_TRACE_FLAG.ENV];
      else process.env[PERF_TRACE_FLAG.ENV] = previous;
      stdoutWrite.mockRestore();
      consoleError.mockRestore();
    }
  });
});
