import { describe, expect, it, vi } from "vitest";

const queryRows = [
  {
    id: "2",
    asset_class: "stock",
    symbol: "VIC",
    name: "Vingroup",
    exchange: "HOSE",
    currency: "VND",
    pricing_mode: "UNIT_PRICE",
    auto_price_supported: true,
    is_active: true,
    metadata: {},
  },
  {
    id: "1",
    asset_class: "stock",
    symbol: "FPT",
    name: "FPT Corporation",
    exchange: "HOSE",
    currency: "VND",
    pricing_mode: "UNIT_PRICE",
    auto_price_supported: true,
    is_active: true,
    metadata: {},
  },
];

vi.mock("@/modules/platform/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    from: vi.fn(() => {
      const builder = {
        select: vi.fn(() => builder),
        eq: vi.fn(() => builder),
        ilike: vi.fn(() => builder),
        limit: vi.fn(() => builder),
        then: (resolve: (value: unknown) => unknown) =>
          Promise.resolve({ data: queryRows, error: null }).then(resolve),
      };
      return builder;
    }),
  })),
}));

import { listMarketInstruments } from "@/modules/investments/application/queries/list-market-instruments";

describe("listMarketInstruments", () => {
  it("returns active instruments in stable bounded order", async () => {
    const result = await listMarketInstruments({
      assetClass: "stock",
      limit: 2,
    });
    expect(result).toEqual({
      ok: true,
      instruments: [
        expect.objectContaining({ symbol: "FPT" }),
        expect.objectContaining({ symbol: "VIC" }),
      ],
    });
  });

  it("rejects a result limit above the application bound", async () => {
    await expect(listMarketInstruments({ limit: 51 })).resolves.toEqual({
      ok: false,
      code: "invalid",
    });
  });
});
