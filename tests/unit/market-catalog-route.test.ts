import { describe, expect, it, vi } from "vitest";

const { syncMarketCatalog } = vi.hoisted(() => ({
  syncMarketCatalog: vi.fn(async () => ({ providers: [] })),
}));

vi.mock("@/modules/investments/application", () => ({
  MARKET_CATALOG_SYNC_SECRET_ENV: "MARKET_CATALOG_SYNC_SECRET",
  syncMarketCatalog,
}));

import { POST } from "@/app/api/admin/market-catalog-sync/route";

describe("MARKET 02 sync route", () => {
  it("rejects unauthenticated requests before invoking sync", async () => {
    process.env.MARKET_CATALOG_SYNC_SECRET = "test-secret";
    const response = await POST(new Request("http://localhost/api"));
    expect(response.status).toBe(401);
    expect(syncMarketCatalog).not.toHaveBeenCalled();
  });

  it("accepts the server-only bearer secret", async () => {
    process.env.MARKET_CATALOG_SYNC_SECRET = "test-secret";
    const response = await POST(
      new Request("http://localhost/api", {
        headers: { authorization: "Bearer test-secret" },
      }),
    );
    expect(response.status).toBe(200);
    expect(syncMarketCatalog).toHaveBeenCalledTimes(1);
  });
});
