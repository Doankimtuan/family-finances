import "server-only";

import { randomUUID } from "node:crypto";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/modules/platform/supabase/admin";
import { logActionFailure } from "@/modules/shared-kernel/application/log-action-failure";
import {
  INVESTMENT_ASSET_CLASS_VALUES,
  MARKET_PRICE_SYNC_BATCH_SIZE,
  MARKET_PRICE_SYNC_ERROR_LIMIT,
  MARKET_PRICE_SYNC_LOCK_KEY,
  MARKET_PRICE_SYNC_LOCK_TTL_MINUTES,
  MARKET_PRICE_SYNC_OPERATION,
  MARKET_PRICE_SYNC_RPC,
  MARKET_SYNC_PROVIDER_VALUES,
  MarketSyncStatus,
  type InvestmentAssetClass,
  type MarketSyncProvider,
} from "../investment-constants";
import type {
  MarketPriceFetchFailure,
  MarketPriceFetchTarget,
  MarketPriceResult,
  MarketPriceSyncInput,
  MarketPriceSyncProviderResult,
  MarketPriceSyncResult,
} from "../investment-types";
import { listActiveMarketPriceTargets } from "../queries/list-active-market-price-targets";
import { syncMarketFxRates } from "./sync-market-fx";
import { marketCatalogAdapters } from "../../infrastructure/market-providers";

const MARKET_SYNC_RUNS_TABLE = "market_sync_runs";
const MARKET_PRICES_TABLE = "market_instrument_prices";

export const MarketPriceSyncInputSchema = z.object({
  assetClass: z.enum(INVESTMENT_ASSET_CLASS_VALUES).optional(),
  provider: z.enum(MARKET_SYNC_PROVIDER_VALUES).optional(),
});

type RunRow = { id: string };

function chunks<T>(values: readonly T[]): T[][] {
  const result: T[][] = [];
  for (
    let index = 0;
    index < values.length;
    index += MARKET_PRICE_SYNC_BATCH_SIZE
  ) {
    result.push(values.slice(index, index + MARKET_PRICE_SYNC_BATCH_SIZE));
  }
  return result;
}

function errorText(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Market price synchronization failed";
}

function summarizeFailures(
  failures: readonly MarketPriceFetchFailure[],
): string | null {
  const messages = [...new Set(failures.map((failure) => failure.error))];
  if (messages.length === 0) return null;
  return messages.join("; ").slice(0, MARKET_PRICE_SYNC_ERROR_LIMIT);
}

function statusFor(
  successCount: number,
  failedCount: number,
): MarketSyncStatus {
  if (failedCount === 0) return MarketSyncStatus.SUCCEEDED;
  if (successCount === 0) return MarketSyncStatus.FAILED;
  return MarketSyncStatus.PARTIAL;
}

function targetAssetClass(
  targets: readonly MarketPriceFetchTarget[],
): InvestmentAssetClass | null {
  const assetClasses = new Set(targets.map((target) => target.assetClass));
  return assetClasses.size === 1 ? [...assetClasses][0] : null;
}

async function recordRunStart(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  provider: MarketSyncProvider,
  assetClass: InvestmentAssetClass | null,
  requestedCount: number,
  runKey: string,
  startedAt: string,
): Promise<string> {
  const { data, error } = await admin
    .from(MARKET_SYNC_RUNS_TABLE)
    .insert({
      provider,
      sync_kind: "price",
      asset_class: assetClass,
      started_at: startedAt,
      requested_count: requestedCount,
      status: MarketSyncStatus.RUNNING,
      run_key: runKey,
    })
    .select("id")
    .single();
  if (error || !data) {
    logActionFailure({
      operation: MARKET_PRICE_SYNC_OPERATION.RUN,
      error,
      context: { provider, phase: "record_start" },
    });
    throw error ?? new Error("Unable to create market price sync run");
  }
  return (data as RunRow).id;
}

async function recordRunFinish(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  runId: string,
  result: MarketPriceSyncProviderResult,
): Promise<void> {
  const { error } = await admin
    .from(MARKET_SYNC_RUNS_TABLE)
    .update({
      finished_at: result.finishedAt,
      fetched_count: result.requestedCount,
      inserted_count: result.successCount,
      updated_count: result.successCount,
      requested_count: result.requestedCount,
      success_count: result.successCount,
      failed_count: result.failedCount,
      status: result.status,
      error_summary: result.errorSummary,
      error: result.errorSummary,
    })
    .eq("id", runId);
  if (error) {
    logActionFailure({
      operation: MARKET_PRICE_SYNC_OPERATION.RUN,
      error,
      context: { provider: result.provider, phase: "record_finish" },
    });
  }
}

async function upsertPriceChunk(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  prices: readonly MarketPriceResult[],
): Promise<{ successes: string[]; failures: MarketPriceFetchFailure[] }> {
  const rows = prices.map((price) => ({
    instrument_id: price.instrumentId,
    price: price.price,
    currency: price.currency,
    price_type: price.priceType,
    price_date: price.priceDate,
    fetched_at: price.fetchedAt,
    provider: price.provider,
    metadata: price.metadata,
    updated_at: price.fetchedAt,
  }));
  const { error } = await admin
    .from(MARKET_PRICES_TABLE)
    .upsert(rows, { onConflict: "instrument_id" });
  if (!error) {
    return {
      successes: prices.map((price) => price.instrumentId),
      failures: [],
    };
  }

  const successes: string[] = [];
  const failures: MarketPriceFetchFailure[] = [];
  for (const [index, row] of rows.entries()) {
    const { error: rowError } = await admin
      .from(MARKET_PRICES_TABLE)
      .upsert(row, { onConflict: "instrument_id" });
    if (rowError) {
      failures.push({
        instrumentId: prices[index].instrumentId,
        error: rowError.code ?? "Price persistence failed",
      });
    } else {
      successes.push(prices[index].instrumentId);
    }
  }
  return { successes, failures };
}

async function syncProvider(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  provider: MarketSyncProvider,
  targets: readonly MarketPriceFetchTarget[],
  runKey: string,
): Promise<MarketPriceSyncProviderResult> {
  const startedAt = new Date().toISOString();
  const assetClass = targetAssetClass(targets);
  const runId = await recordRunStart(
    admin,
    provider,
    assetClass,
    targets.length,
    runKey,
    startedAt,
  );
  let failures: MarketPriceFetchFailure[] = [];
  let successCount = 0;
  try {
    const adapter = marketCatalogAdapters.find(
      (candidate) => candidate.provider === provider,
    );
    if (!adapter) {
      failures = targets.map((target) => ({
        instrumentId: target.instrumentId,
        error: "No provider adapter registered",
      }));
    } else {
      const fetched = await adapter.fetchPrices(targets);
      failures = [...fetched.failures];
      const fetchedIds = new Set(
        fetched.prices.map((price) => price.instrumentId),
      );
      failures.push(
        ...targets
          .filter(
            (target) =>
              !fetchedIds.has(target.instrumentId) &&
              !failures.some(
                (failure) => failure.instrumentId === target.instrumentId,
              ),
          )
          .map((target) => ({
            instrumentId: target.instrumentId,
            error: "Provider returned no result",
          })),
      );
      for (const priceChunk of chunks(fetched.prices)) {
        const persisted = await upsertPriceChunk(admin, priceChunk);
        successCount += persisted.successes.length;
        failures.push(...persisted.failures);
      }
    }
  } catch (error) {
    logActionFailure({
      operation: MARKET_PRICE_SYNC_OPERATION.RUN,
      error,
      context: { provider, phase: "provider_sync" },
    });
    failures.push(
      ...targets.map((target) => ({
        instrumentId: target.instrumentId,
        error: errorText(error),
      })),
    );
  }

  const finishedAt = new Date().toISOString();
  const result: MarketPriceSyncProviderResult = {
    provider,
    assetClass,
    startedAt,
    finishedAt,
    requestedCount: targets.length,
    successCount,
    failedCount: targets.length - successCount,
    status: statusFor(successCount, targets.length - successCount),
    errorSummary: summarizeFailures(failures),
  };
  await recordRunFinish(admin, runId, result);
  return result;
}

export async function syncMarketPrices(
  input: MarketPriceSyncInput,
): Promise<MarketPriceSyncResult> {
  const admin = createSupabaseAdminClient();
  const ownerId = randomUUID();
  const expiresAt = new Date(
    Date.now() + MARKET_PRICE_SYNC_LOCK_TTL_MINUTES * 60_000,
  ).toISOString();
  const { data: acquired, error: lockError } = await admin.rpc(
    MARKET_PRICE_SYNC_RPC.ACQUIRE_LOCK,
    {
      p_lock_key: MARKET_PRICE_SYNC_LOCK_KEY,
      p_owner_id: ownerId,
      p_expires_at: expiresAt,
    },
  );
  if (lockError) throw lockError;
  if (!acquired) {
    return {
      status: MarketSyncStatus.SKIPPED,
      skipped: true,
      requestedCount: 0,
      successCount: 0,
      failedCount: 0,
      providers: [],
    };
  }

  try {
    const targets = await listActiveMarketPriceTargets(input);
    if (targets == null)
      throw new Error("Unable to list active market price targets");
    const grouped = new Map<MarketSyncProvider, MarketPriceFetchTarget[]>();
    for (const target of targets) {
      const providerTargets = grouped.get(target.provider) ?? [];
      providerTargets.push(target);
      grouped.set(target.provider, providerTargets);
    }
    const providers = await Promise.all(
      [...grouped.entries()].map(([provider, providerTargets]) =>
        syncProvider(admin, provider, providerTargets, ownerId),
      ),
    );
    await syncMarketFxRates(targets.map((target) => target.currency));
    const requestedCount = providers.reduce(
      (total, provider) => total + provider.requestedCount,
      0,
    );
    const successCount = providers.reduce(
      (total, provider) => total + provider.successCount,
      0,
    );
    const failedCount = requestedCount - successCount;
    return {
      status: statusFor(successCount, failedCount),
      skipped: false,
      requestedCount,
      successCount,
      failedCount,
      providers,
    };
  } finally {
    const { error } = await admin.rpc(MARKET_PRICE_SYNC_RPC.RELEASE_LOCK, {
      p_lock_key: MARKET_PRICE_SYNC_LOCK_KEY,
      p_owner_id: ownerId,
    });
    if (error) {
      logActionFailure({
        operation: MARKET_PRICE_SYNC_OPERATION.RUN,
        error,
        context: { phase: "release_lock" },
      });
    }
  }
}
