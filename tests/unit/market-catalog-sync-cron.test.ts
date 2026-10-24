import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { MARKET_CATALOG_SYNC_CRON_UTC } from "@/modules/investments/application/investment-constants";

const migration = readFileSync(
  "supabase/migrations/20261024105901_market_catalog_sync_cron.sql",
  "utf8",
);
const guardMigration = readFileSync(
  "supabase/migrations/20261024110007_market_catalog_sync_cron_guard.sql",
  "utf8",
);

describe("market catalog sync cron migration", () => {
  it("schedules the protected catalog endpoint before daily price refresh", () => {
    expect(migration).toContain("market_catalog_sync_daily");
    expect(migration).toContain(MARKET_CATALOG_SYNC_CRON_UTC);
    expect(migration).toContain("market_sync_app_url");
    expect(migration).toContain("market_catalog_sync_secret");
    expect(migration).toContain("/api/admin/market-catalog-sync");
    expect(migration).toContain("cron.schedule(");
  });

  it("skips scheduling when pg_cron or Vault secrets are unavailable", () => {
    expect(migration).toContain("to_regclass('cron.job')");
    expect(migration).toContain("to_regclass('vault.decrypted_secrets')");
    expect(migration).toContain("Market catalog cron skipped");
  });

  it("repairs the applied schedule with a guard that checks both Vault secret names", () => {
    expect(guardMigration).toContain("market_catalog_sync_daily");
    expect(guardMigration).toContain("count(distinct name)");
    expect(guardMigration).toContain("market_catalog_sync_secret");
  });
});
