import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const SQL = readFileSync(
  "supabase/migrations/20260822010000_investment_asset_picker_ui01.sql",
  "utf8",
);

describe("Investment asset picker UI 01 migration", () => {
  it("accepts nullable linked instruments on both creation RPCs", () => {
    expect(SQL).toContain("p_instrument_id uuid default null");
    expect(SQL).toMatch(
      /insert into public\.investment_holdings\([\s\S]*instrument_id, asset_class/,
    );
  });

  it("rejects inactive or mismatched catalog links server-side", () => {
    expect(SQL).toMatch(
      /from public\.market_instruments[\s\S]*where id = p_instrument_id and is_active = true and asset_class = p_asset_class/,
    );
    expect(SQL).toContain("Invalid market instrument");
  });

  it("preserves authenticated-only RPC execution", () => {
    expect(SQL).toMatch(/revoke all on function[\s\S]*from public, anon/);
    expect(SQL).toMatch(/grant execute on function[\s\S]*to authenticated/);
  });
});
