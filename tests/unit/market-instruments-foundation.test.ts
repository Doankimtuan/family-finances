import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  INVESTMENT_ASSET_CLASS_VALUES,
  MARKET_DATA_PROVIDER_VALUES,
  MARKET_PRICE_TYPE_VALUES,
  MARKET_PRICING_MODE_VALUES,
} from "@/modules/investments/application/investment-constants";

const SQL = readFileSync(
  "supabase/migrations/20260821163005_market_instruments_foundation_market01.sql",
  "utf8",
);

describe("MARKET 01 instrument catalog migration", () => {
  it("defines the catalog, source mapping, and one-current-price tables", () => {
    expect(SQL).toMatch(/create table public\.market_instruments/);
    expect(SQL).toMatch(/create table public\.market_instrument_sources/);
    expect(SQL).toMatch(/create table public\.market_instrument_prices/);
    expect(SQL).toMatch(
      /instrument_id uuid primary key references public\.market_instruments\(id\)/,
    );
    expect(SQL).toMatch(/primary key \(instrument_id, provider\)/);
    expect(SQL).toMatch(/unique \(provider, provider_instrument_id\)/);
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
    expect(SQL).toMatch(
      /alter table public\.investment_holdings\s+add column if not exists instrument_id uuid/,
    );
    expect(SQL).toMatch(/set instrument_id = null/);
    expect(SQL).toMatch(
      /add constraint investment_holdings_instrument_id_fkey\s+foreign key \(instrument_id\)\s+references public\.market_instruments\(id\)/,
    );
  });

  it("protects catalog writes and exposes only authenticated reads", () => {
    expect(SQL).toMatch(/enable row level security/);
    expect(SQL).toMatch(/for select to authenticated\s+using \(true\)/);
    expect(SQL).toMatch(/revoke all on table[\s\S]*from anon, authenticated/);
    expect(SQL).toMatch(/grant select on table[\s\S]*to authenticated/);
    expect(SQL).toMatch(
      /grant select, insert, update, delete on table[\s\S]*to service_role/,
    );
  });

  it("adds only the intended lookup indexes", () => {
    expect(SQL).toMatch(/market_instruments_asset_class_active_idx/);
    expect(SQL).toMatch(/market_instruments_symbol_search_idx/);
    expect(SQL).toMatch(/market_instrument_sources_lookup_idx/);
    expect(SQL).toMatch(/investment_holdings_instrument_lookup_idx/);
  });
});
