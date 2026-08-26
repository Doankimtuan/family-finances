import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  "supabase/migrations/20260826045858_market_price_sync_cron_and_gold_provider.sql",
  "utf8",
);

describe("market price sync cron migration", () => {
  it("registers provider-specific Vault-backed schedules", () => {
    expect(migration).toContain("market_sync_app_url");
    expect(migration).toContain("market_price_sync_secret");
    expect(migration).toContain("market_price_sync_coingecko_daily");
    expect(migration).toContain("'0 4 * * *'");
    expect(migration).toContain("market_price_sync_vnstock_weekdays");
    expect(migration).toContain("'30 8 * * 1-5'");
    expect(migration).toContain("market_price_sync_fmarket_weekdays");
    expect(migration).toContain("'0 11 * * 1-5'");
    expect(migration).toContain("market_price_sync_vang_today_daily");
    expect(migration).toContain("'0 12 * * *'");
    expect(migration).toContain("/api/admin/market-price-sync");
  });

  it("keeps cron setup safe when required services or secrets are absent", () => {
    expect(migration).toContain("to_regclass('cron.job')");
    expect(migration).toContain("to_regclass('vault.decrypted_secrets')");
    expect(migration).toContain("Market price cron skipped");
  });
});
