import { describe, expect, it, vi } from "vitest";

const { rpc } = vi.hoisted(() => ({
  rpc: vi.fn(async () => ({
    data: [
      {
        instrument_id: "instrument-1",
        asset_class: "crypto",
        symbol: "BTC",
        currency: "USD",
        pricing_mode: "UNIT_PRICE",
        provider: "COINGECKO",
        provider_instrument_id: "bitcoin",
      },
      { instrument_id: null },
    ],
    error: null,
  })),
}));

vi.mock("@/modules/platform/supabase/admin", () => ({
  createSupabaseAdminClient: () => ({ rpc }),
}));

import { listActiveMarketPriceTargets } from "@/modules/investments/application/queries/list-active-market-price-targets";

describe("MARKET 03 active price target query", () => {
  it("uses the service-role RPC and returns only valid canonical targets", async () => {
    const targets = await listActiveMarketPriceTargets({
      assetClass: "crypto",
      provider: "COINGECKO",
    });
    expect(rpc).toHaveBeenCalledWith("list_active_market_price_targets", {
      p_asset_class: "crypto",
      p_provider: "COINGECKO",
    });
    expect(targets).toEqual([
      {
        instrumentId: "instrument-1",
        providerInstrumentId: "bitcoin",
        symbol: "BTC",
        assetClass: "crypto",
        pricingMode: "UNIT_PRICE",
        currency: "USD",
        provider: "COINGECKO",
      },
    ]);
  });
});
