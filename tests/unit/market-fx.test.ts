import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { frankfurterAdapter } from "@/modules/investments/infrastructure/fx";

const MIGRATION = readFileSync(
  "supabase/migrations/20260822000000_market_valuation_integration_market04.sql",
  "utf8",
);

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("MARKET 04 FX boundary", () => {
  it("normalizes the current USD/VND rate", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          base: "USD",
          quote: "VND",
          rate: 25_000,
          date: "2026-08-21",
        }),
      ),
    );
    const result = await frankfurterAdapter.fetchRates([
      { baseCurrency: "USD", quoteCurrency: "VND" },
    ]);
    expect(result.failures).toHaveLength(0);
    expect(result.rates[0]).toMatchObject({
      baseCurrency: "USD",
      quoteCurrency: "VND",
      rate: 25_000,
      rateDate: "2026-08-21",
    });
  });

  it("keeps the migration current-only and service-write protected", () => {
    expect(MIGRATION).toMatch(/create table public\.market_currency_rates/);
    expect(MIGRATION).toMatch(/primary key \(base_currency, quote_currency\)/);
    expect(MIGRATION).toMatch(/provider in \('FRANKFURTER'\)/);
    expect(MIGRATION).toMatch(
      /revoke all on table public\.market_currency_rates from anon, authenticated/,
    );
    expect(MIGRATION).toMatch(
      /grant select, insert, update, delete on table public\.market_currency_rates to service_role/,
    );
    expect(MIGRATION).not.toMatch(/market_currency_rate_history/);
  });
});
