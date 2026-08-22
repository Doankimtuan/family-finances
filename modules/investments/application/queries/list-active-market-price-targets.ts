import "server-only";

import { createSupabaseAdminClient } from "@/modules/platform/supabase/admin";
import { logActionFailure } from "@/modules/shared-kernel/application/log-action-failure";
import {
  INVESTMENT_ASSET_CLASS_VALUES,
  MARKET_PRICE_SYNC_OPERATION,
  MARKET_PRICE_SYNC_RPC,
  MARKET_SYNC_PROVIDER_VALUES,
  MarketPricingMode,
  type InvestmentAssetClass,
  type MarketPricingMode as MarketPricingModeValue,
  type MarketSyncProvider,
} from "../investment-constants";
import type { MarketPriceFetchTarget } from "../investment-types";

type ActivePriceTargetInput = {
  assetClass?: InvestmentAssetClass;
  provider?: MarketSyncProvider;
};

function isAssetClass(value: unknown): value is InvestmentAssetClass {
  return INVESTMENT_ASSET_CLASS_VALUES.some((candidate) => candidate === value);
}

function isProvider(value: unknown): value is MarketSyncProvider {
  return MARKET_SYNC_PROVIDER_VALUES.some((candidate) => candidate === value);
}

function isPricingMode(value: unknown): value is MarketPricingModeValue {
  return Object.values(MarketPricingMode).some(
    (candidate) => candidate === value,
  );
}

function parseTarget(value: unknown): MarketPriceFetchTarget | null {
  if (typeof value !== "object" || value === null) return null;
  const row = value as Record<string, unknown>;
  if (
    typeof row.instrument_id !== "string" ||
    typeof row.asset_class !== "string" ||
    typeof row.symbol !== "string" ||
    typeof row.currency !== "string" ||
    typeof row.pricing_mode !== "string" ||
    typeof row.provider !== "string" ||
    typeof row.provider_instrument_id !== "string" ||
    !isAssetClass(row.asset_class) ||
    !isPricingMode(row.pricing_mode) ||
    !isProvider(row.provider)
  ) {
    return null;
  }
  return {
    instrumentId: row.instrument_id,
    providerInstrumentId: row.provider_instrument_id,
    symbol: row.symbol,
    assetClass: row.asset_class,
    pricingMode: row.pricing_mode,
    currency: row.currency,
    provider: row.provider,
  };
}

export async function listActiveMarketPriceTargets(
  input: ActivePriceTargetInput = {},
): Promise<MarketPriceFetchTarget[] | null> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.rpc(MARKET_PRICE_SYNC_RPC.LIST_TARGETS, {
    p_asset_class: input.assetClass ?? null,
    p_provider: input.provider ?? null,
  });
  if (error) {
    logActionFailure({
      operation: MARKET_PRICE_SYNC_OPERATION.RUN,
      error,
      context: { phase: "list_active_targets" },
    });
    return null;
  }
  const rows: readonly unknown[] = Array.isArray(data) ? data : [];
  return rows
    .map(parseTarget)
    .filter((target): target is MarketPriceFetchTarget => target !== null);
}
