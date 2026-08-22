import "server-only";
import { randomUUID } from "node:crypto";
import { createSupabaseAdminClient } from "@/modules/platform/supabase/admin";
import { logActionFailure } from "@/modules/shared-kernel/application/log-action-failure";
import {
  MARKET_CATALOG_SYNC_OPERATION,
  MARKET_SYNC_PROVIDER_VALUES,
  type MarketSyncProvider,
} from "../investment-constants";
import type {
  MarketCatalogCandidate,
  MarketCatalogSyncProviderResult,
  MarketCatalogSyncResult,
} from "../investment-types";
import { marketCatalogAdapters } from "../../infrastructure/market-providers";

const MARKET_INSTRUMENTS_TABLE = "market_instruments";
const MARKET_SOURCES_TABLE = "market_instrument_sources";
const MARKET_SYNC_RUNS_TABLE = "market_sync_runs";
const SUPABASE_BATCH_SIZE = 500;

type SyncRunRow = { id: string };
type ExistingSourceRow = {
  instrument_id: string;
  provider_instrument_id: string;
};

function errorText(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Provider synchronization failed";
}

function uniqueCandidates(
  candidates: readonly MarketCatalogCandidate[],
): MarketCatalogCandidate[] {
  const unique = new Map<string, MarketCatalogCandidate>();
  for (const candidate of candidates) {
    if (!unique.has(candidate.providerInstrumentId)) {
      unique.set(candidate.providerInstrumentId, candidate);
    }
  }
  return [...unique.values()];
}

function chunks<T>(values: readonly T[]): T[][] {
  const result: T[][] = [];
  for (let index = 0; index < values.length; index += SUPABASE_BATCH_SIZE) {
    result.push(values.slice(index, index + SUPABASE_BATCH_SIZE));
  }
  return result;
}

async function recordRunStart(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  provider: MarketSyncProvider,
  startedAt: string,
): Promise<string | null> {
  const { data, error } = await admin
    .from(MARKET_SYNC_RUNS_TABLE)
    .insert({ provider, started_at: startedAt })
    .select("id")
    .single();
  if (error || !data) {
    logActionFailure({
      operation: MARKET_CATALOG_SYNC_OPERATION.RUN,
      error,
      context: { provider, phase: "record_start" },
    });
    return null;
  }
  return (data as SyncRunRow).id;
}

async function recordRunFinish(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  runId: string | null,
  result: MarketCatalogSyncProviderResult,
): Promise<void> {
  if (!runId) return;
  const { error } = await admin
    .from(MARKET_SYNC_RUNS_TABLE)
    .update({
      finished_at: result.finishedAt,
      fetched_count: result.fetchedCount,
      inserted_count: result.insertedCount,
      updated_count: result.updatedCount,
      failed_count: result.failedCount,
      error: result.error,
    })
    .eq("id", runId);
  if (error) {
    logActionFailure({
      operation: MARKET_CATALOG_SYNC_OPERATION.RUN,
      error,
      context: { provider: result.provider, phase: "record_finish" },
    });
  }
}

async function upsertCatalog(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  candidates: readonly MarketCatalogCandidate[],
): Promise<{ insertedCount: number; updatedCount: number }> {
  if (candidates.length === 0) return { insertedCount: 0, updatedCount: 0 };
  const provider = candidates[0].provider;
  const providerIds = candidates.map(
    (candidate) => candidate.providerInstrumentId,
  );
  const existingRows: ExistingSourceRow[] = [];
  for (const providerIdChunk of chunks(providerIds)) {
    const { data, error } = await admin
      .from(MARKET_SOURCES_TABLE)
      .select("instrument_id, provider_instrument_id")
      .eq("provider", provider)
      .in("provider_instrument_id", providerIdChunk);
    if (error) throw error;
    existingRows.push(...((data ?? []) as ExistingSourceRow[]));
  }

  const existingByProviderId = new Map(
    ((existingRows ?? []) as ExistingSourceRow[]).map((row) => [
      row.provider_instrument_id,
      row.instrument_id,
    ]),
  );
  const rows = candidates.map((candidate) => ({
    id:
      existingByProviderId.get(candidate.providerInstrumentId) ?? randomUUID(),
    asset_class: candidate.assetClass,
    symbol: candidate.symbol,
    name: candidate.name,
    exchange: candidate.exchange,
    currency: candidate.currency,
    pricing_mode: candidate.pricingMode,
    auto_price_supported: candidate.autoPriceSupported,
    is_active: candidate.isActive,
    metadata: candidate.metadata,
  }));
  for (const rowChunk of chunks(rows)) {
    const { error } = await admin
      .from(MARKET_INSTRUMENTS_TABLE)
      .upsert(rowChunk, { onConflict: "id" });
    if (error) throw error;
  }

  const sourceRows = candidates.map((candidate, index) => ({
    instrument_id: rows[index].id,
    provider: candidate.provider,
    provider_instrument_id: candidate.providerInstrumentId,
    priority: 0,
    is_enabled: candidate.isActive,
    metadata: {},
  }));
  for (const sourceChunk of chunks(sourceRows)) {
    const { error } = await admin
      .from(MARKET_SOURCES_TABLE)
      .upsert(sourceChunk, { onConflict: "provider,provider_instrument_id" });
    if (error) throw error;
  }

  return {
    insertedCount: candidates.filter(
      (candidate) => !existingByProviderId.has(candidate.providerInstrumentId),
    ).length,
    updatedCount: candidates.filter((candidate) =>
      existingByProviderId.has(candidate.providerInstrumentId),
    ).length,
  };
}

async function syncProvider(
  provider: MarketSyncProvider,
  admin: ReturnType<typeof createSupabaseAdminClient>,
): Promise<MarketCatalogSyncProviderResult> {
  const startedAt = new Date().toISOString();
  const runId = await recordRunStart(admin, provider, startedAt);
  let result: MarketCatalogSyncProviderResult = {
    provider,
    startedAt,
    finishedAt: startedAt,
    fetchedCount: 0,
    insertedCount: 0,
    updatedCount: 0,
    failedCount: 0,
    error: null,
  };
  try {
    const adapter = marketCatalogAdapters.find(
      (candidate) => candidate.provider === provider,
    );
    if (!adapter) throw new Error(`No adapter registered for ${provider}`);
    const rawRows = await adapter.listInstruments();
    result = { ...result, fetchedCount: rawRows.length };
    const candidates: MarketCatalogCandidate[] = [];
    let failedCount = 0;
    for (const raw of rawRows) {
      const candidate = adapter.normalizeProviderResult(raw);
      if (candidate) candidates.push(candidate);
      else failedCount += 1;
    }
    const unique = uniqueCandidates(candidates);
    const counts = await upsertCatalog(admin, unique);
    result = {
      ...result,
      finishedAt: new Date().toISOString(),
      fetchedCount: rawRows.length,
      insertedCount: counts.insertedCount,
      updatedCount: counts.updatedCount,
      failedCount,
    };
  } catch (error) {
    logActionFailure({
      operation: MARKET_CATALOG_SYNC_OPERATION.RUN,
      error,
      context: { provider },
    });
    result = {
      ...result,
      finishedAt: new Date().toISOString(),
      error: errorText(error),
      failedCount: Math.max(result.failedCount, 1),
    };
  }
  await recordRunFinish(admin, runId, result);
  return result;
}

export async function syncMarketCatalog(): Promise<MarketCatalogSyncResult> {
  const admin = createSupabaseAdminClient();
  const settled = await Promise.allSettled(
    MARKET_SYNC_PROVIDER_VALUES.map((provider) =>
      syncProvider(provider, admin),
    ),
  );
  const finishedAt = new Date().toISOString();
  return {
    providers: settled.map((entry, index) => {
      if (entry.status === "fulfilled") return entry.value;
      const provider = MARKET_SYNC_PROVIDER_VALUES[index];
      logActionFailure({
        operation: MARKET_CATALOG_SYNC_OPERATION.RUN,
        error: entry.reason,
        context: { provider, phase: "provider_fan_out" },
      });
      return {
        provider,
        startedAt: finishedAt,
        finishedAt,
        fetchedCount: 0,
        insertedCount: 0,
        updatedCount: 0,
        failedCount: 1,
        error: errorText(entry.reason),
      };
    }),
  };
}
