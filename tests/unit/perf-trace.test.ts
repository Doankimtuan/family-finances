import { describe, expect, it } from "vitest";
import {
  PERF_TRACE_FLAG,
  isPerfTraceEnabled,
  perfTracePathname,
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
});
