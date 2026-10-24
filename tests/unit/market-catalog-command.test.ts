import { beforeEach, describe, expect, it, vi } from "vitest";
import { MarketSyncStatus } from "@/modules/investments/application/investment-constants";

const state = vi.hoisted(() => ({
  runStarts: [] as Array<Record<string, unknown>>,
  runUpdates: [] as Array<Record<string, unknown>>,
  rawRows: new Map<string, unknown[]>(),
  failedProviders: new Set<string>(),
}));

vi.mock("@/modules/platform/supabase/admin", () => ({
  createSupabaseAdminClient: () => ({
    from: (table: string) => {
      let pendingUpdate: Record<string, unknown> = {};
      const builder = {
        insert: (row: Record<string, unknown>) => {
          if (table === "market_sync_runs") state.runStarts.push(row);
          return builder;
        },
        select: () => builder,
        single: async () => ({
          data: { id: `run-${state.runStarts.length}` },
          error: null,
        }),
        update: (row: Record<string, unknown>) => {
          pendingUpdate = row;
          return builder;
        },
        eq: (_column: string, id: string) => {
          if (table === "market_sync_runs") {
            state.runUpdates.push({ id, ...pendingUpdate });
          }
          return builder;
        },
        in: async () => ({ data: [], error: null }),
        upsert: async () => ({ error: null }),
      };
      return builder;
    },
  }),
}));

vi.mock("@/modules/shared-kernel/application/log-action-failure", () => ({
  logActionFailure: vi.fn(),
}));

vi.mock("@/modules/investments/infrastructure/market-providers", () => ({
  marketCatalogAdapters: ["COINGECKO", "VNSTOCK", "FMARKET", "VANG_TODAY"].map(
    (provider) => ({
      provider,
      listInstruments: async () => {
        if (state.failedProviders.has(provider)) {
          throw new Error("Provider unavailable");
        }
        return state.rawRows.get(provider) ?? [];
      },
      normalizeProviderResult: (raw: unknown) => {
        if (!raw || typeof raw !== "object" || !("id" in raw)) return null;
        return {
          assetClass: provider === "COINGECKO" ? "crypto" : "stock",
          symbol: String(raw.id).toUpperCase(),
          name: String(raw.id),
          exchange: null,
          currency: provider === "COINGECKO" ? "USD" : "VND",
          pricingMode: "UNIT_PRICE",
          autoPriceSupported: true,
          provider,
          providerInstrumentId: String(raw.id),
          isActive: true,
          metadata: {},
        };
      },
    }),
  ),
}));

import { syncMarketCatalog } from "@/modules/investments/application/commands/sync-market-catalog";

beforeEach(() => {
  state.runStarts.length = 0;
  state.runUpdates.length = 0;
  state.rawRows.clear();
  state.failedProviders.clear();
});

describe("market catalog sync command", () => {
  it("records running and partial status for malformed provider rows", async () => {
    state.rawRows.set("COINGECKO", [{ id: "bitcoin" }, {}]);

    await syncMarketCatalog();

    expect(state.runStarts).toHaveLength(4);
    expect(
      state.runStarts.every((run) => run.status === MarketSyncStatus.RUNNING),
    ).toBe(true);
    expect(state.runUpdates).toContainEqual(
      expect.objectContaining({
        failed_count: 1,
        inserted_count: 1,
        status: MarketSyncStatus.PARTIAL,
      }),
    );
  });

  it("records failed provider runs instead of leaving the default succeeded status", async () => {
    state.failedProviders.add("COINGECKO");

    const result = await syncMarketCatalog();

    expect(
      result.providers.find((provider) => provider.provider === "COINGECKO"),
    ).toMatchObject({ failedCount: 1, error: "Provider unavailable" });
    expect(state.runUpdates).toContainEqual(
      expect.objectContaining({
        failed_count: 1,
        status: MarketSyncStatus.FAILED,
      }),
    );
  });
});
