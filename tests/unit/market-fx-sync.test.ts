import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  INVESTMENT_INPUT_CURRENCY_RATE_CURRENCIES,
  INVESTMENT_REPORTING_CURRENCY,
  MARKET_FX_BASE_CURRENCY,
  MARKET_FX_QUOTE_CURRENCY,
  MarketFxProvider,
} from "@/modules/investments/application/investment-constants";

const state = vi.hoisted(() => ({
  upsertedRows: [] as unknown[],
  fetchFiat: vi.fn(),
  fetchStablecoin: vi.fn(),
}));

vi.mock("@/modules/platform/supabase/admin", () => ({
  createSupabaseAdminClient: () => ({
    from: () => ({
      upsert: async (rows: unknown[]) => {
        state.upsertedRows.push(...rows);
        return { error: null };
      },
    }),
  }),
}));

vi.mock("@/modules/shared-kernel/application/log-action-failure", () => ({
  logActionFailure: vi.fn(),
}));

vi.mock("@/modules/investments/infrastructure/fx", () => ({
  frankfurterAdapter: { fetchRates: state.fetchFiat },
  coingeckoFxAdapter: { fetchRates: state.fetchStablecoin },
}));

import { syncMarketFxRates } from "@/modules/investments/application/commands/sync-market-fx";

function rate(baseCurrency: string, provider: string) {
  return {
    baseCurrency,
    quoteCurrency: INVESTMENT_REPORTING_CURRENCY,
    rate: 25_000,
    rateDate: "2026-10-24",
    fetchedAt: "2026-10-24T00:00:00.000Z",
    provider,
    updatedAt: "2026-10-24T00:00:00.000Z",
  };
}

beforeEach(() => {
  state.upsertedRows.length = 0;
  state.fetchFiat.mockReset().mockResolvedValue({
    rates: [rate(MARKET_FX_BASE_CURRENCY, MarketFxProvider.FRANKFURTER)],
    failures: [],
  });
  state.fetchStablecoin.mockReset().mockResolvedValue({
    rates: [
      rate(
        INVESTMENT_INPUT_CURRENCY_RATE_CURRENCIES[0],
        MarketFxProvider.COINGECKO,
      ),
    ],
    failures: [
      `${INVESTMENT_INPUT_CURRENCY_RATE_CURRENCIES[1]}/${INVESTMENT_REPORTING_CURRENCY}`,
    ],
  });
});

describe("market FX synchronization", () => {
  it("persists available pairs but reports provider failures as an incomplete sync", async () => {
    const succeeded = await syncMarketFxRates([
      MARKET_FX_BASE_CURRENCY,
      ...INVESTMENT_INPUT_CURRENCY_RATE_CURRENCIES,
    ]);

    expect(succeeded).toBe(false);
    expect(state.upsertedRows).toHaveLength(2);
    expect(state.fetchFiat).toHaveBeenCalledWith([
      {
        baseCurrency: MARKET_FX_BASE_CURRENCY,
        quoteCurrency: MARKET_FX_QUOTE_CURRENCY,
      },
    ]);
    expect(state.fetchStablecoin).toHaveBeenCalledWith(
      INVESTMENT_INPUT_CURRENCY_RATE_CURRENCIES.map((baseCurrency) => ({
        baseCurrency,
        quoteCurrency: INVESTMENT_REPORTING_CURRENCY,
      })),
    );
  });
});
