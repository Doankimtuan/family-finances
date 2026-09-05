import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  coingeckoFxAdapter,
  frankfurterAdapter,
} from "@/modules/investments/infrastructure/fx";

const MIGRATION = readFileSync(
  "supabase/migrations/20260825125516_v1_baseline.sql",
  "utf8",
);
const INPUT_CURRENCY_MIGRATION = readFileSync(
  "supabase/migrations/20260905090000_investment_input_currency.sql",
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

  it("normalizes direct USDT and USDC VND rates from CoinGecko", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          tether: { vnd: 25_100, last_updated_at: 1_756_000_000 },
          "usd-coin": { vnd: 25_050, last_updated_at: 1_756_000_100 },
        }),
      ),
    );
    const result = await coingeckoFxAdapter.fetchRates([
      { baseCurrency: "USDT", quoteCurrency: "VND" },
      { baseCurrency: "USDC", quoteCurrency: "VND" },
    ]);
    expect(result.failures).toHaveLength(0);
    expect(result.rates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          baseCurrency: "USDT",
          quoteCurrency: "VND",
          rate: 25_100,
          provider: "COINGECKO",
        }),
        expect.objectContaining({
          baseCurrency: "USDC",
          quoteCurrency: "VND",
          rate: 25_050,
          provider: "COINGECKO",
        }),
      ]),
    );
  });

  it("keeps the migration current-only and service-write protected", () => {
    expect(MIGRATION).toMatch(/create table "public"\."market_currency_rates"/);
    expect(MIGRATION).toMatch(/primary key \(base_currency, quote_currency\)/i);
    expect(MIGRATION).toMatch(/provider = 'FRANKFURTER'::text/);
    expect(MIGRATION).toMatch(
      /revoke all on all tables in schema public from anon, authenticated/,
    );
    expect(MIGRATION).toMatch(
      /grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"\."market_currency_rates" to "service_role"/,
    );
    expect(MIGRATION).not.toMatch(/market_currency_rate_history/);
  });

  it("keeps stablecoin providers and the conversion RPC protected", () => {
    expect(INPUT_CURRENCY_MIGRATION).toMatch(
      /provider = any \(array\['FRANKFURTER', 'COINGECKO'\]\)/,
    );
    expect(INPUT_CURRENCY_MIGRATION).toMatch(
      /create or replace function public\.record_investment_with_input_currency/i,
    );
    expect(INPUT_CURRENCY_MIGRATION).toMatch(
      /revoke all on function public\.record_investment_with_input_currency/i,
    );
    expect(INPUT_CURRENCY_MIGRATION).toMatch(
      /grant execute on function public\.record_investment_with_input_currency\(text, jsonb\)\s+to authenticated/i,
    );
  });
});
