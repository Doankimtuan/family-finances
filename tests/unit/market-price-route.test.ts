import { beforeEach, describe, expect, it, vi } from "vitest";

const { syncMarketPrices } = vi.hoisted(() => ({
  syncMarketPrices: vi.fn(async () => ({
    status: "succeeded",
    skipped: false,
    requestedCount: 1,
    successCount: 1,
    failedCount: 0,
    providers: [],
  })),
}));

vi.mock("@/modules/investments/application", () => ({
  MARKET_PRICE_SYNC_SECRET_ENV: "MARKET_PRICE_SYNC_SECRET",
  MarketPriceSyncInputSchema: {
    safeParse(value: unknown) {
      if (typeof value !== "object" || value === null || Array.isArray(value)) {
        return { success: false };
      }
      return { success: true, data: value };
    },
  },
  syncMarketPrices,
}));

import { POST } from "@/app/api/admin/market-price-sync/route";

beforeEach(() => {
  syncMarketPrices.mockClear();
});

describe("MARKET 03 price sync route", () => {
  it("rejects requests without the server-only secret", async () => {
    process.env.MARKET_PRICE_SYNC_SECRET = "test-secret";
    const response = await POST(
      new Request("http://localhost/api", {
        method: "POST",
        body: JSON.stringify({}),
      }),
    );
    expect(response.status).toBe(401);
    expect(syncMarketPrices).not.toHaveBeenCalled();
  });

  it("accepts the protected backend bearer secret", async () => {
    process.env.MARKET_PRICE_SYNC_SECRET = "test-secret";
    const response = await POST(
      new Request("http://localhost/api", {
        method: "POST",
        headers: {
          authorization: "Bearer test-secret",
          "content-type": "application/json",
        },
        body: JSON.stringify({ provider: "COINGECKO" }),
      }),
    );
    expect(response.status).toBe(200);
    expect(syncMarketPrices).toHaveBeenCalledWith({ provider: "COINGECKO" });
  });

  it("rejects malformed debug filters", async () => {
    process.env.MARKET_PRICE_SYNC_SECRET = "test-secret";
    const response = await POST(
      new Request("http://localhost/api", {
        method: "POST",
        headers: {
          authorization: "Bearer test-secret",
          "content-type": "application/json",
        },
        body: JSON.stringify([]),
      }),
    );
    expect(response.status).toBe(400);
    expect(syncMarketPrices).not.toHaveBeenCalled();
  });
});
