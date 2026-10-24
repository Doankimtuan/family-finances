import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { MARKET_SYNC_CRON_HTTP_TIMEOUT_MS } from "@/modules/investments/application/investment-constants";

const migration = readFileSync(
  "supabase/migrations/20261024110647_market_sync_cron_http_timeout.sql",
  "utf8",
);

describe("market sync cron HTTP timeout migration", () => {
  it("gives catalog and provider price jobs enough time for sync responses", () => {
    expect(migration).toContain(
      `timeout_milliseconds := ${MARKET_SYNC_CRON_HTTP_TIMEOUT_MS}`,
    );
    expect(migration).toContain("market_catalog_sync_daily");
    expect(migration).toContain("market_price_sync_coingecko_daily");
    expect(migration).toContain("market_price_sync_vnstock_weekdays");
    expect(migration).toContain("market_price_sync_fmarket_weekdays");
    expect(migration).toContain("market_price_sync_vang_today_daily");
    expect(migration).toContain("cron.alter_job(");
  });
});
