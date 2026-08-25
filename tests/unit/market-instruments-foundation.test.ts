import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  INVESTMENT_ASSET_CLASS_VALUES,
  MARKET_DATA_PROVIDER_VALUES,
  MARKET_PRICE_TYPE_VALUES,
  MARKET_PRICING_MODE_VALUES,
} from "@/modules/investments/application/investment-constants";

const SQL = readFileSync(
  "supabase/migrations/20260825125516_v1_baseline.sql",
  "utf8",
);

describe("MARKET 01 instrument catalog migration", () => {
  it("defines the catalog, source mapping, and one-current-price tables", () => {
    expect(SQL).toMatch(/create table "public"\."market_instruments"/);
    expect(SQL).toMatch(/create table "public"\."market_instrument_sources"/);
    expect(SQL).toMatch(/create table "public"\."market_instrument_prices"/);
    expect(SQL).toMatch(/primary key \(instrument_id, provider\)/i);
    expect(SQL).toMatch(/unique \(provider, provider_instrument_id\)/i);
    expect(SQL).not.toMatch(
      /create table public\.market_instrument_price_history/,
    );
    expect(SQL).not.toMatch(
      /create table public\.market_instrument_price_snapshots/,
    );
  });

  it("keeps the shared market vocabularies synchronized with SQL checks", () => {
    for (const value of INVESTMENT_ASSET_CLASS_VALUES) {
      expect(SQL).toContain(`'${value}'`);
    }
    for (const value of MARKET_PRICING_MODE_VALUES) {
      expect(SQL).toContain(`'${value}'`);
    }
    for (const value of MARKET_DATA_PROVIDER_VALUES) {
      expect(SQL).toContain(`'${value}'`);
    }
    for (const value of MARKET_PRICE_TYPE_VALUES) {
      expect(SQL).toContain(`'${value}'`);
    }
  });

  it("preserves nullable holding links while replacing legacy local links", () => {
    expect(SQL).toMatch(/"instrument_id" uuid/);
    expect(SQL).not.toContain("set instrument_id = null");
    expect(SQL).toMatch(
      /investment_holdings_instrument_id_fkey[\s\S]*foreign key \(instrument_id\)[\s\S]*market_instruments/i,
    );
  });

  it("protects catalog writes and exposes only authenticated reads", () => {
    expect(SQL).toMatch(/enable row level security/);
    expect(SQL).toMatch(/for SELECT\n  to "authenticated"\n  using \(true\)/);
    expect(SQL).toMatch(
      /revoke all on all tables in schema public from anon, authenticated/,
    );
    expect(SQL).toMatch(/grant SELECT on table[\s\S]*to "authenticated"/);
    expect(SQL).toMatch(
      /grant [A-Z, ]* on table "public"\."market_instruments" to "service_role"/,
    );
  });

  it("adds only the intended lookup indexes", () => {
    expect(SQL).toMatch(/market_instruments_asset_class_active_idx/);
    expect(SQL).toMatch(/market_instruments_symbol_search_idx/);
    expect(SQL).toMatch(/market_instrument_sources_lookup_idx/);
    expect(SQL).toMatch(/investment_holdings_instrument_lookup_idx/);
  });
});
