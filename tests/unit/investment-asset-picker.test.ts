import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const SQL = readFileSync(
  "supabase/migrations/20260825125516_v1_baseline.sql",
  "utf8",
);

describe("Investment asset picker UI 01 migration", () => {
  it("accepts nullable linked instruments on both creation RPCs", () => {
    expect(SQL).toMatch(/p_instrument_id uuid DEFAULT NULL/i);
    expect(SQL).toContain('"instrument_id" uuid');
    expect(SQL).toContain('"asset_class" text');
  });

  it("rejects inactive or mismatched catalog links server-side", () => {
    expect(SQL).toMatch(
      /from public\.market_instruments[\s\S]*where id = p_instrument_id and is_active = true and asset_class = p_asset_class/,
    );
    expect(SQL).toContain("Invalid market instrument");
  });

  it("preserves authenticated-only RPC execution", () => {
    expect(SQL).toContain(
      "revoke all on all functions in schema public from public, anon, authenticated",
    );
    expect(SQL).toMatch(
      /grant EXECUTE on function public\.(?:record_investment_initial_purchase|record_investment_opening_position).*to "authenticated"/,
    );
  });
});
