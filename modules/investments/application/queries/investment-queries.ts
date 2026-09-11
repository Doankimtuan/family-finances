import { cache } from "react";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import { listActiveMembershipIds } from "@/modules/tenancy/application/list-active-membership-ids";
import { logActionFailure } from "@/modules/shared-kernel/application/log-action-failure";
import {
  type InvestmentAssetClass,
  type InvestmentFeeSource,
  type InvestmentHistoryStatus,
  type InvestmentIncomeKind,
  InvestmentLifecycleStatus,
  InvestmentActivityType,
  InvestmentInputRateSource,
  type InvestmentOperationType,
  type InvestmentVisibilityContext,
  InvestmentValuationSource,
  INVESTMENT_REPORTING_CURRENCY,
  INVESTMENT_OPERATION,
  INVESTMENT_QUERY_PHASE,
  INVESTMENT_QUERY_RPC,
  MarketDataProvider,
  MarketFxProvider,
  MarketPricingMode,
  MarketPriceType,
  MarketValuationQuality,
  MarketValuationSource,
  InvestmentHoldingReadStatus,
} from "../investment-constants";
import { resolveInvestmentValuation } from "../market-valuation";
import {
  isInvestmentInputCurrency,
  isInvestmentInputRateSource,
} from "../investment-money";
import type {
  InvestmentActivity,
  InvestmentHolding,
  InvestmentPortfolio,
  InvestmentValuationResolution,
  InvestmentHoldingReadResult,
  MarketCurrencyRate,
  MarketInstrument,
  MarketInstrumentPrice,
} from "../investment-types";
import {
  FINANCIAL_SCOPE,
  isFinancialScope,
} from "@/modules/shared-kernel/application/financial-scope";
import { resolveFinancialCapabilities } from "@/modules/shared-kernel/application/financial-ownership";
import { AccountingMethod, type InvestmentLot } from "../../domain";

type HoldingRow = {
  id: string;
  household_id: string;
  name: string;
  symbol: string | null;
  instrument_id: string | null;
  asset_class: string;
  provider_custodian: string | null;
  visibility_context: string;
  lifecycle_status: string;
  history_status: string;
  quantity: string | number;
  remaining_total_cost_basis: string | number | null;
  notes: string | null;
  financial_scope?: string | null;
  owner_membership_id?: string | null;
  accounting_method?: string | null;
};

type ValuationRow = {
  holding_id: string;
  value_vnd: string | number;
  valuation_date: string;
  created_at: string;
  quantity: string | number;
  unit_price_vnd: string | number | null;
  source: string;
  input_currency?: string | null;
  input_unit_price?: string | number | null;
  input_total_value?: string | number | null;
  input_rate_to_vnd?: string | number | null;
  input_rate_date?: string | null;
  input_rate_source?: string | null;
};

type InstrumentRow = {
  id: string;
  asset_class: string;
  symbol: string;
  name: string;
  exchange: string | null;
  currency: string;
  pricing_mode: string;
  auto_price_supported: boolean;
  is_active: boolean;
  metadata: Record<string, unknown>;
};

type PriceRow = {
  instrument_id: string;
  price: string | number;
  currency: string;
  price_type: string;
  price_date: string;
  fetched_at: string;
  provider: string;
  metadata: Record<string, unknown>;
  updated_at: string;
};

type CurrencyRateRow = {
  base_currency: string;
  quote_currency: string;
  rate: string | number;
  rate_date: string;
  fetched_at: string;
  provider: string;
  updated_at: string;
};

type LotRow = {
  id: string;
  position_id: string;
  source_event_id: string | null;
  acquired_at: string;
  original_quantity: string | number;
  remaining_quantity: string | number;
  unit_cost: string | number;
  total_cost: string | number;
};

type OperationRow = {
  id: string;
  operation_type: string;
  source_holding_id: string | null;
  destination_holding_id: string | null;
  source_quantity: string | number | null;
  destination_quantity: string | number | null;
  executed_value_vnd: string | number | null;
  quoted_value_vnd: string | number | null;
  source_basis_consumed: string | number | null;
  destination_basis_added: string | number | null;
  realized_result_vnd: string | number | null;
  income_kind: string | null;
  transaction_id: string | null;
  correlation_id: string;
  effective_date: string;
  investment_fees?: Array<{
    fee_value_vnd: string | number;
    input_amount?: string | number | null;
    input_fee_value?: string | number | null;
  }> | null;
  unit_price_vnd: string | number | null;
  input_currency?: string | null;
  input_amount?: string | number | null;
  input_unit_price?: string | number | null;
  input_total_value?: string | number | null;
  input_executed_value?: string | number | null;
  input_quoted_value?: string | number | null;
  input_cost_basis?: string | number | null;
  input_current_valuation?: string | number | null;
  input_rate_to_vnd?: string | number | null;
  input_rate_date?: string | null;
  input_rate_source?: string | null;
};

export const InvestmentHomeValuationQuality = {
  CURRENT: "current",
  STALE: "stale",
  MANUAL: "manual",
  PARTIAL: "partial",
  UNKNOWN: "unknown",
} as const;

export type InvestmentHomeValuationQuality =
  (typeof InvestmentHomeValuationQuality)[keyof typeof InvestmentHomeValuationQuality];

export type InvestmentHomeSummary = {
  activeCount: number;
  marketValue: number | null;
  unrealizedPnl: number | null;
  realizedPnl: number;
  income: number;
  valuationQuality: InvestmentHomeValuationQuality;
  valuationStale: boolean;
  valuationIncluded: number;
  valuationTotal: number;
};

type HomeInvestmentRawInputRow = {
  holding_id: string;
  asset_class: string;
  instrument_id: string | null;
  quantity: string | number;
  remaining_total_cost_basis: string | number | null;
  instrument_asset_class: string | null;
  instrument_symbol: string | null;
  instrument_name: string | null;
  instrument_exchange: string | null;
  instrument_currency: string | null;
  instrument_pricing_mode: string | null;
  instrument_auto_price_supported: boolean | null;
  instrument_is_active: boolean | null;
  instrument_metadata: Record<string, unknown> | null;
  price: string | number | null;
  price_currency: string | null;
  price_type: string | null;
  price_date: string | null;
  price_fetched_at: string | null;
  price_provider: string | null;
  price_metadata: Record<string, unknown> | null;
  price_updated_at: string | null;
  fx_base_currency: string | null;
  fx_quote_currency: string | null;
  fx_rate: string | number | null;
  fx_rate_date: string | null;
  fx_fetched_at: string | null;
  fx_provider: string | null;
  fx_updated_at: string | null;
  manual_value_vnd: string | number | null;
  manual_valuation_date: string | null;
  manual_created_at: string | null;
  manual_quantity: string | number | null;
  manual_unit_price_vnd: string | number | null;
  manual_source: string | null;
  manual_input_currency: string | null;
  manual_input_unit_price: string | number | null;
  manual_input_total_value: string | number | null;
  manual_input_rate_to_vnd: string | number | null;
  manual_input_rate_date: string | null;
  manual_input_rate_source: string | null;
  realized_pnl: string | number | null;
  investment_income: string | number | null;
};

type InvestmentListRawInputRow = HomeInvestmentRawInputRow & {
  household_id: string;
  name: string;
  symbol: string | null;
  provider_custodian: string | null;
  visibility_context: string;
  lifecycle_status: string;
  history_status: string;
  notes: string | null;
  financial_scope: string | null;
  owner_membership_id: string | null;
  accounting_method: string | null;
  created_at: string;
  owner_membership_is_active: boolean;
  fees_total: string | number | null;
};

function investmentHomeQuality(
  resolutions: readonly InvestmentValuationResolution[],
  total: number,
): InvestmentHomeSummary["valuationQuality"] {
  const known = resolutions.filter(
    (resolution) => resolution.currentValue != null,
  );
  if (known.length === 0) return "unknown";
  if (known.length < total) return "partial";
  if (
    known.some(
      (resolution) => resolution.quality === MarketValuationQuality.AUTO_STALE,
    )
  )
    return "stale";
  if (
    known.some(
      (resolution) => resolution.quality === MarketValuationQuality.MANUAL,
    )
  )
    return "manual";
  return "current";
}

function nullableNumber(value: string | number | null | undefined) {
  return value == null ? null : Number(value);
}

function inputCurrencyOrReporting(value: string | null | undefined) {
  return value && isInvestmentInputCurrency(value)
    ? value
    : INVESTMENT_REPORTING_CURRENCY;
}

function inputRateSourceOrIdentity(value: string | null | undefined) {
  return value && isInvestmentInputRateSource(value)
    ? value
    : InvestmentInputRateSource.IDENTITY;
}

function mapHolding(
  row: HoldingRow,
  instrument: MarketInstrument | null,
  manualValuation: ValuationRow | undefined,
  valuation: InvestmentValuationResolution,
  activeMembershipId = "",
  activeMembershipIds?: ReadonlySet<string>,
  lots: InvestmentLot[] = [],
): InvestmentHolding {
  const basis = nullableNumber(row.remaining_total_cost_basis);
  const rawFinancialScope = row.financial_scope ?? "";
  const financialScope = isFinancialScope(rawFinancialScope)
    ? rawFinancialScope
    : FINANCIAL_SCOPE.HOUSEHOLD;
  return {
    id: row.id,
    householdId: row.household_id,
    name: row.name,
    symbol: row.symbol,
    instrumentId: row.instrument_id,
    instrument,
    assetClass: row.asset_class as InvestmentAssetClass,
    providerCustodian: row.provider_custodian,
    visibilityContext: row.visibility_context as InvestmentVisibilityContext,
    lifecycleStatus: row.lifecycle_status as InvestmentLifecycleStatus,
    historyStatus: row.history_status as InvestmentHistoryStatus,
    quantity: String(row.quantity),
    remainingTotalCostBasis: basis,
    currentValue: valuation.currentValue,
    currentValuationDate: valuation.priceDate,
    currentValuationSource:
      valuation.quality === MarketValuationQuality.UNKNOWN
        ? null
        : valuation.source === MarketValuationSource.AUTOMATIC
          ? InvestmentValuationSource.PROVIDER
          : ((manualValuation?.source as InvestmentValuationSource) ??
            InvestmentValuationSource.MANUAL),
    unrealizedResult: valuation.estimatedUnrealizedPnl,
    estimatedUnrealizedPnl: valuation.estimatedUnrealizedPnl,
    estimatedUnrealizedPnlPercent: valuation.estimatedUnrealizedPnlPercent,
    valuation,
    notes: row.notes,
    accountingMethod:
      row.accounting_method === AccountingMethod.FIFO
        ? AccountingMethod.FIFO
        : AccountingMethod.WEIGHTED_AVERAGE,
    lots,
    ownership: resolveFinancialCapabilities(
      {
        financialScope,
        ownerMembershipId: row.owner_membership_id ?? null,
      },
      activeMembershipId,
      activeMembershipIds == null || row.owner_membership_id == null
        ? true
        : activeMembershipIds.has(row.owner_membership_id),
    ),
  };
}

function mapActivity(row: OperationRow): InvestmentActivity {
  return {
    id: row.id,
    type: row.operation_type as InvestmentOperationType,
    sourceHoldingId: row.source_holding_id,
    destinationHoldingId: row.destination_holding_id,
    sourceQuantity:
      row.source_quantity == null ? null : String(row.source_quantity),
    destinationQuantity:
      row.destination_quantity == null
        ? null
        : String(row.destination_quantity),
    executedValueVnd: nullableNumber(row.executed_value_vnd),
    quotedValueVnd: nullableNumber(row.quoted_value_vnd),
    sourceBasisConsumed: nullableNumber(row.source_basis_consumed),
    destinationBasisAdded: nullableNumber(row.destination_basis_added),
    realizedResultVnd: nullableNumber(row.realized_result_vnd),
    incomeKind: row.income_kind as InvestmentIncomeKind | null,
    transactionId: row.transaction_id,
    correlationId: row.correlation_id,
    effectiveDate: row.effective_date,
    feesVnd: (row.investment_fees ?? []).reduce(
      (sum, fee) => sum + Number(fee.fee_value_vnd),
      0,
    ),
    unitPriceVnd: nullableNumber(row.unit_price_vnd),
    inputCurrency: inputCurrencyOrReporting(row.input_currency),
    inputAmount: nullableNumber(row.input_amount),
    inputUnitPrice: nullableNumber(row.input_unit_price),
    inputTotalValue: nullableNumber(row.input_total_value),
    inputExecutedValue: nullableNumber(row.input_executed_value),
    inputQuotedValue: nullableNumber(row.input_quoted_value),
    inputCostBasis: nullableNumber(row.input_cost_basis),
    inputCurrentValuation: nullableNumber(row.input_current_valuation),
    inputRateToVnd: nullableNumber(row.input_rate_to_vnd),
    inputRateDate: row.input_rate_date ?? null,
    inputRateSource: inputRateSourceOrIdentity(row.input_rate_source),
    inputFeeAmount: nullableNumber(row.investment_fees?.[0]?.input_amount),
    inputFeeValue: nullableNumber(row.investment_fees?.[0]?.input_fee_value),
  };
}

function mapMarketInstrument(row: InstrumentRow): MarketInstrument {
  return {
    id: row.id,
    assetClass: row.asset_class as InvestmentAssetClass,
    symbol: row.symbol,
    name: row.name,
    exchange: row.exchange,
    currency: row.currency,
    pricingMode: row.pricing_mode as MarketPricingMode,
    autoPriceSupported: row.auto_price_supported,
    isActive: row.is_active,
    metadata: row.metadata,
  };
}

function mapMarketPrice(row: PriceRow): MarketInstrumentPrice {
  return {
    instrumentId: row.instrument_id,
    price: Number(row.price),
    currency: row.currency,
    priceType: row.price_type as MarketPriceType,
    priceDate: row.price_date,
    fetchedAt: row.fetched_at,
    provider: row.provider as MarketDataProvider,
    metadata: row.metadata,
    updatedAt: row.updated_at,
  };
}

function mapCurrencyRate(row: CurrencyRateRow): MarketCurrencyRate {
  return {
    baseCurrency: row.base_currency,
    quoteCurrency: row.quote_currency,
    rate: Number(row.rate),
    rateDate: row.rate_date,
    fetchedAt: row.fetched_at,
    provider: row.provider as MarketFxProvider,
    updatedAt: row.updated_at,
  };
}

function mapHomeInstrument(
  row: HomeInvestmentRawInputRow,
): MarketInstrument | null {
  if (
    row.instrument_id == null ||
    row.instrument_asset_class == null ||
    row.instrument_symbol == null ||
    row.instrument_name == null ||
    row.instrument_currency == null ||
    row.instrument_pricing_mode == null ||
    row.instrument_auto_price_supported == null ||
    row.instrument_is_active == null
  )
    return null;
  return mapMarketInstrument({
    id: row.instrument_id,
    asset_class: row.instrument_asset_class,
    symbol: row.instrument_symbol,
    name: row.instrument_name,
    exchange: row.instrument_exchange,
    currency: row.instrument_currency,
    pricing_mode: row.instrument_pricing_mode,
    auto_price_supported: row.instrument_auto_price_supported,
    is_active: row.instrument_is_active,
    metadata: row.instrument_metadata ?? {},
  });
}

function mapHomePrice(
  row: HomeInvestmentRawInputRow,
): MarketInstrumentPrice | null {
  if (
    row.instrument_id == null ||
    row.price == null ||
    row.price_currency == null ||
    row.price_type == null ||
    row.price_date == null ||
    row.price_fetched_at == null ||
    row.price_provider == null ||
    row.price_updated_at == null
  )
    return null;
  return mapMarketPrice({
    instrument_id: row.instrument_id,
    price: row.price,
    currency: row.price_currency,
    price_type: row.price_type,
    price_date: row.price_date,
    fetched_at: row.price_fetched_at,
    provider: row.price_provider,
    metadata: row.price_metadata ?? {},
    updated_at: row.price_updated_at,
  });
}

function mapHomeRate(
  row: HomeInvestmentRawInputRow,
): MarketCurrencyRate | null {
  if (
    row.fx_base_currency == null ||
    row.fx_quote_currency == null ||
    row.fx_rate == null ||
    row.fx_rate_date == null ||
    row.fx_fetched_at == null ||
    row.fx_provider == null ||
    row.fx_updated_at == null
  )
    return null;
  return mapCurrencyRate({
    base_currency: row.fx_base_currency,
    quote_currency: row.fx_quote_currency,
    rate: row.fx_rate,
    rate_date: row.fx_rate_date,
    fetched_at: row.fx_fetched_at,
    provider: row.fx_provider,
    updated_at: row.fx_updated_at,
  });
}

function mapHomeManualValuation(
  row: HomeInvestmentRawInputRow,
): ValuationRow | undefined {
  if (row.manual_value_vnd == null) return undefined;
  return {
    holding_id: row.holding_id,
    value_vnd: row.manual_value_vnd,
    valuation_date: row.manual_valuation_date ?? "",
    created_at: row.manual_created_at ?? "",
    quantity: row.manual_quantity ?? 0,
    unit_price_vnd: row.manual_unit_price_vnd,
    source: row.manual_source ?? "",
    input_currency: row.manual_input_currency,
    input_unit_price: row.manual_input_unit_price,
    input_total_value: row.manual_input_total_value,
    input_rate_to_vnd: row.manual_input_rate_to_vnd,
    input_rate_date: row.manual_input_rate_date,
    input_rate_source: row.manual_input_rate_source,
  };
}

export function allocateBasisPoints(
  groups: Array<{ assetClass: InvestmentAssetClass; valueVnd: number }>,
) {
  const total = groups.reduce((sum, group) => sum + group.valueVnd, 0);
  if (total <= 0)
    return groups.map((group) => ({ ...group, shareBasisPoints: 0 }));
  const rows = groups.map((group) => {
    const numerator = BigInt(group.valueVnd) * BigInt(10_000);
    const denominator = BigInt(total);
    return {
      ...group,
      shareBasisPoints: Number(numerator / denominator),
      remainder: numerator % denominator,
    };
  });
  let unassigned =
    10_000 - rows.reduce((sum, row) => sum + row.shareBasisPoints, 0);
  const ranked = [...rows].sort((left, right) =>
    left.remainder === right.remainder
      ? left.assetClass.localeCompare(right.assetClass)
      : left.remainder > right.remainder
        ? -1
        : 1,
  );
  for (let index = 0; index < ranked.length && unassigned > 0; index += 1) {
    ranked[index].shareBasisPoints += 1;
    unassigned -= 1;
  }
  return rows.map((row) => ({
    assetClass: row.assetClass,
    valueVnd: row.valueVnd,
    shareBasisPoints: row.shareBasisPoints,
  }));
}

async function loadHoldings(): Promise<InvestmentHolding[] | null> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) return null;
  try {
    const supabase = await createSupabaseServerClient();
    const [
      { data: holdings, error },
      { data: valuations, error: valuationError },
      { data: lots, error: lotError },
    ] = await Promise.all([
      supabase
        .from("investment_holdings")
        .select(
          "id, household_id, name, symbol, instrument_id, asset_class, provider_custodian, visibility_context, lifecycle_status, history_status, quantity, remaining_total_cost_basis, notes, financial_scope, owner_membership_id, accounting_method",
        )
        .eq("household_id", gate.householdId)
        .order("created_at", { ascending: true }),
      supabase
        .from("investment_valuations")
        .select(
          "holding_id, value_vnd, valuation_date, created_at, quantity, unit_price_vnd, source, input_currency, input_unit_price, input_total_value, input_rate_to_vnd, input_rate_date, input_rate_source",
        )
        .eq("household_id", gate.householdId)
        .order("valuation_date", { ascending: false })
        .order("created_at", { ascending: false }),
      supabase
        .from("investment_lots")
        .select(
          "id, position_id, source_event_id, acquired_at, original_quantity, remaining_quantity, unit_cost, total_cost",
        )
        .eq("household_id", gate.householdId)
        .order("acquired_at", { ascending: true }),
    ]);
    if (error || valuationError || lotError) {
      logActionFailure({
        operation: INVESTMENT_OPERATION.LIST_HOLDINGS,
        error: error ?? valuationError ?? lotError,
        context: { householdId: gate.householdId },
      });
      return null;
    }
    const holdingRows = (holdings ?? []) as HoldingRow[];
    const instrumentIds = [
      ...new Set(
        holdingRows
          .map((row) => row.instrument_id)
          .filter((id): id is string => id != null),
      ),
    ];
    const [activeOwnerMembershipIds, marketRows] = await Promise.all([
      listActiveMembershipIds(
        supabase,
        gate.householdId,
        holdingRows
          .map((row) => row.owner_membership_id)
          .filter((id): id is string => id != null),
      ),
      instrumentIds.length
        ? Promise.all([
            supabase
              .from("market_instruments")
              .select(
                "id, asset_class, symbol, name, exchange, currency, pricing_mode, auto_price_supported, is_active, metadata",
              )
              .in("id", instrumentIds),
            supabase
              .from("market_instrument_prices")
              .select(
                "instrument_id, price, currency, price_type, price_date, fetched_at, provider, metadata, updated_at",
              )
              .in("instrument_id", instrumentIds),
            supabase
              .from("market_currency_rates")
              .select(
                "base_currency, quote_currency, rate, rate_date, fetched_at, provider, updated_at",
              )
              .eq("quote_currency", INVESTMENT_REPORTING_CURRENCY),
          ])
        : Promise.resolve([
            { data: [], error: null },
            { data: [], error: null },
            { data: [], error: null },
          ]),
    ]);
    const latest = new Map<string, ValuationRow>();
    for (const row of (valuations ?? []) as ValuationRow[]) {
      if (!latest.has(row.holding_id)) latest.set(row.holding_id, row);
    }
    const lotsByHolding = new Map<string, InvestmentLot[]>();
    for (const row of (lots ?? []) as LotRow[]) {
      const holdingLots = lotsByHolding.get(row.position_id) ?? [];
      holdingLots.push({
        id: row.id,
        positionId: row.position_id,
        sourceEventId: row.source_event_id,
        acquiredAt: row.acquired_at,
        originalQuantity: String(row.original_quantity),
        remainingQuantity: String(row.remaining_quantity),
        unitCost: Number(row.unit_cost),
        totalCost: Number(row.total_cost),
      });
      lotsByHolding.set(row.position_id, holdingLots);
    }
    const [instrumentResult, priceResult, fxResult] = marketRows;
    if (instrumentResult.error || priceResult.error || fxResult.error) {
      logActionFailure({
        operation: INVESTMENT_OPERATION.LIST_HOLDINGS,
        error: instrumentResult.error ?? priceResult.error ?? fxResult.error,
        context: { householdId: gate.householdId, phase: "market_valuation" },
      });
      return null;
    }
    const instrumentsById = new Map(
      (instrumentResult.data as InstrumentRow[]).map((row) => [
        row.id,
        mapMarketInstrument(row),
      ]),
    );
    const pricesByInstrumentId = new Map(
      (priceResult.data as PriceRow[]).map((row) => [
        row.instrument_id,
        mapMarketPrice(row),
      ]),
    );
    const ratesByCurrencyPair = new Map(
      (fxResult.data as CurrencyRateRow[]).map((row) => {
        const rate = mapCurrencyRate(row);
        return [`${rate.baseCurrency}/${rate.quoteCurrency}`, rate];
      }),
    );
    return holdingRows.map((row) =>
      (() => {
        const instrument = row.instrument_id
          ? (instrumentsById.get(row.instrument_id) ?? null)
          : null;
        const price = row.instrument_id
          ? (pricesByInstrumentId.get(row.instrument_id) ?? null)
          : null;
        const resolution = resolveInvestmentValuation({
          assetClass: row.asset_class as InvestmentAssetClass,
          quantity: String(row.quantity),
          remainingCostBasis: nullableNumber(row.remaining_total_cost_basis),
          instrument,
          price,
          fxRate: price
            ? (ratesByCurrencyPair.get(
                `${price.currency}/${INVESTMENT_REPORTING_CURRENCY}`,
              ) ?? null)
            : null,
          manualValuation: latest.get(row.id)
            ? {
                valueVnd: Number(latest.get(row.id)?.value_vnd),
                valuationDate: latest.get(row.id)?.valuation_date ?? "",
                unitPriceVnd: nullableNumber(
                  latest.get(row.id)?.unit_price_vnd,
                ),
                source: latest.get(row.id)?.source ?? "",
                inputCurrency: latest.get(row.id)?.input_currency
                  ? inputCurrencyOrReporting(latest.get(row.id)?.input_currency)
                  : null,
                inputUnitPrice: nullableNumber(
                  latest.get(row.id)?.input_unit_price,
                ),
                inputTotalValue: nullableNumber(
                  latest.get(row.id)?.input_total_value,
                ),
                inputRateToVnd: nullableNumber(
                  latest.get(row.id)?.input_rate_to_vnd,
                ),
                inputRateDate: latest.get(row.id)?.input_rate_date,
                inputRateSource: latest.get(row.id)?.input_rate_source
                  ? inputRateSourceOrIdentity(
                      latest.get(row.id)?.input_rate_source,
                    )
                  : null,
              }
            : null,
        });
        return mapHolding(
          row,
          instrument,
          latest.get(row.id),
          resolution,
          gate.membershipId,
          activeOwnerMembershipIds ?? undefined,
          lotsByHolding.get(row.id) ?? [],
        );
      })(),
    );
  } catch (error) {
    logActionFailure({
      operation: INVESTMENT_OPERATION.LIST_HOLDINGS,
      error,
      context: { householdId: gate.householdId },
    });
    return null;
  }
}

/**
 * Home-sized Investment read. It intentionally omits lots, holding activity
 * history, and per-holding provider work; valuation semantics stay in the
 * shared resolver used by the Investments product.
 */
async function loadInvestmentHomeSummary(): Promise<InvestmentHomeSummary | null> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) return null;
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc(
      INVESTMENT_QUERY_RPC.HOME_RAW_INPUTS,
    );
    if (error) {
      logActionFailure({
        operation: INVESTMENT_OPERATION.LIST_HOLDINGS,
        error,
        context: {
          householdId: gate.householdId,
          phase: INVESTMENT_QUERY_PHASE.HOME_RAW_INPUTS,
        },
      });
      return null;
    }

    const rows = (data ?? []) as HomeInvestmentRawInputRow[];
    if (rows.length === 0) {
      return {
        activeCount: 0,
        marketValue: null,
        unrealizedPnl: null,
        realizedPnl: 0,
        income: 0,
        valuationQuality: "unknown",
        valuationStale: false,
        valuationIncluded: 0,
        valuationTotal: 0,
      };
    }
    const resolutions = rows.map((row) => {
      const instrument = mapHomeInstrument(row);
      const price = mapHomePrice(row);
      const fxRate = mapHomeRate(row);
      const manual = mapHomeManualValuation(row);
      return resolveInvestmentValuation({
        assetClass: row.asset_class as InvestmentAssetClass,
        quantity: String(row.quantity),
        remainingCostBasis: nullableNumber(row.remaining_total_cost_basis),
        instrument,
        price,
        fxRate,
        manualValuation: manual
          ? {
              valueVnd: Number(manual.value_vnd),
              valuationDate: manual.valuation_date,
              unitPriceVnd: nullableNumber(manual.unit_price_vnd),
              source: manual.source,
              inputCurrency: manual.input_currency
                ? inputCurrencyOrReporting(manual.input_currency)
                : null,
              inputUnitPrice: nullableNumber(manual.input_unit_price),
              inputTotalValue: nullableNumber(manual.input_total_value),
              inputRateToVnd: nullableNumber(manual.input_rate_to_vnd),
              inputRateDate: manual.input_rate_date,
              inputRateSource: manual.input_rate_source
                ? inputRateSourceOrIdentity(manual.input_rate_source)
                : null,
            }
          : null,
      });
    });
    const known = resolutions.filter(
      (resolution) => resolution.currentValue != null,
    );
    const complete = resolutions.filter(
      (resolution, index) =>
        resolution.currentValue != null &&
        rows[index].remaining_total_cost_basis != null,
    );
    return {
      activeCount: rows.length,
      marketValue: known.length
        ? known.reduce((sum, row) => sum + (row.currentValue ?? 0), 0)
        : null,
      unrealizedPnl: complete.length
        ? complete.reduce(
            (sum, row, index) =>
              sum +
              (row.currentValue ?? 0) -
              Number(rows[index].remaining_total_cost_basis),
            0,
          )
        : null,
      realizedPnl: Number(rows[0].realized_pnl ?? 0),
      income: Number(rows[0].investment_income ?? 0),
      valuationQuality: investmentHomeQuality(resolutions, rows.length),
      valuationStale: resolutions.some(
        (resolution) =>
          resolution.quality === MarketValuationQuality.AUTO_STALE,
      ),
      valuationIncluded: known.length,
      valuationTotal: rows.length,
    };
  } catch (error) {
    logActionFailure({
      operation: INVESTMENT_OPERATION.LIST_HOLDINGS,
      error,
      context: { phase: INVESTMENT_QUERY_PHASE.HOME_RAW_INPUTS },
    });
    return null;
  }
}

export const listInvestmentHomeSummary = cache(loadInvestmentHomeSummary);

type InvestmentOperationTotals = {
  realizedPnl: number;
  investmentIncome: number;
  fees: number;
};

function summarizeInvestmentActivities(
  activities: readonly InvestmentActivity[],
): InvestmentOperationTotals {
  return {
    realizedPnl: activities.reduce(
      (sum, activity) => sum + (activity.realizedResultVnd ?? 0),
      0,
    ),
    investmentIncome: activities.reduce(
      (sum, activity) =>
        sum + (activity.incomeKind ? (activity.executedValueVnd ?? 0) : 0),
      0,
    ),
    fees: activities.reduce((sum, activity) => sum + activity.feesVnd, 0),
  };
}

export function buildInvestmentPortfolio(
  holdings: InvestmentHolding[],
  operationTotals: InvestmentOperationTotals,
): InvestmentPortfolio {
  const activeHoldings = holdings.filter(
    (holding) =>
      holding.lifecycleStatus !== InvestmentLifecycleStatus.EXITED &&
      Number(holding.quantity) > 0,
  );
  const closedHoldings = holdings.filter(
    (holding) => !activeHoldings.some((active) => active.id === holding.id),
  );
  const valued = activeHoldings.filter(
    (holding) => holding.currentValue != null,
  );
  const based = activeHoldings.filter(
    (holding) => holding.remainingTotalCostBasis != null,
  );
  const complete = activeHoldings.filter(
    (holding) =>
      holding.currentValue != null && holding.remainingTotalCostBasis != null,
  );
  const totalCurrentValue = valued.length
    ? valued.reduce((sum, holding) => sum + (holding.currentValue ?? 0), 0)
    : null;
  const totalRemainingCostBasis = based.length
    ? based.reduce(
        (sum, holding) => sum + (holding.remainingTotalCostBasis ?? 0),
        0,
      )
    : null;
  const estimatedUnrealizedPnl =
    totalCurrentValue == null || totalRemainingCostBasis == null
      ? null
      : complete.length
        ? complete.reduce(
            (sum, holding) =>
              sum +
              (holding.currentValue ?? 0) -
              (holding.remainingTotalCostBasis ?? 0),
            0,
          )
        : null;
  const completeCostBasis = complete.length
    ? complete.reduce(
        (sum, holding) => sum + (holding.remainingTotalCostBasis ?? 0),
        0,
      )
    : null;
  const allocationGroups = new Map<InvestmentAssetClass, number>();
  for (const holding of valued) {
    allocationGroups.set(
      holding.assetClass,
      (allocationGroups.get(holding.assetClass) ?? 0) +
        (holding.currentValue ?? 0),
    );
  }
  return {
    holdings,
    activeHoldings,
    closedHoldings,
    incompleteBasisCount: activeHoldings.filter(
      (holding) => holding.remainingTotalCostBasis == null,
    ).length,
    closedPositionCount: closedHoldings.length,
    totalCurrentValue,
    totalRemainingCostBasis,
    unrealizedResult: estimatedUnrealizedPnl,
    estimatedUnrealizedPnl,
    estimatedUnrealizedPnlPercent:
      estimatedUnrealizedPnl != null &&
      completeCostBasis != null &&
      completeCostBasis !== 0
        ? estimatedUnrealizedPnl / completeCostBasis
        : null,
    realizedSaleResult: operationTotals.realizedPnl,
    investmentIncome: operationTotals.investmentIncome,
    investmentFees: operationTotals.fees,
    valuationCoverage: {
      included: valued.length,
      total: activeHoldings.length,
    },
    basisCoverage: { included: based.length, total: holdings.length },
    allocationByAssetClass: allocateBasisPoints(
      Array.from(allocationGroups, ([assetClass, valueVnd]) => ({
        assetClass,
        valueVnd,
      })),
    ),
  };
}

function mapListRawHolding(
  row: InvestmentListRawInputRow,
  activeMembershipId: string,
  activeMembershipIds: ReadonlySet<string>,
): InvestmentHolding {
  const instrument = mapHomeInstrument(row);
  const price = mapHomePrice(row);
  const manual = mapHomeManualValuation(row);
  const valuation = resolveInvestmentValuation({
    assetClass: row.asset_class as InvestmentAssetClass,
    quantity: String(row.quantity),
    remainingCostBasis: nullableNumber(row.remaining_total_cost_basis),
    instrument,
    price,
    fxRate: mapHomeRate(row),
    manualValuation: manual
      ? {
          valueVnd: Number(manual.value_vnd),
          valuationDate: manual.valuation_date,
          unitPriceVnd: nullableNumber(manual.unit_price_vnd),
          source: manual.source,
          inputCurrency: manual.input_currency
            ? inputCurrencyOrReporting(manual.input_currency)
            : null,
          inputUnitPrice: nullableNumber(manual.input_unit_price),
          inputTotalValue: nullableNumber(manual.input_total_value),
          inputRateToVnd: nullableNumber(manual.input_rate_to_vnd),
          inputRateDate: manual.input_rate_date,
          inputRateSource: manual.input_rate_source
            ? inputRateSourceOrIdentity(manual.input_rate_source)
            : null,
        }
      : null,
  });
  return mapHolding(
    {
      id: row.holding_id,
      household_id: row.household_id,
      name: row.name,
      symbol: row.symbol,
      instrument_id: row.instrument_id,
      asset_class: row.asset_class,
      provider_custodian: row.provider_custodian,
      visibility_context: row.visibility_context,
      lifecycle_status: row.lifecycle_status,
      history_status: row.history_status,
      quantity: row.quantity,
      remaining_total_cost_basis: row.remaining_total_cost_basis,
      notes: row.notes,
      financial_scope: row.financial_scope,
      owner_membership_id: row.owner_membership_id,
      accounting_method: row.accounting_method,
    },
    instrument,
    manual,
    valuation,
    activeMembershipId,
    activeMembershipIds,
  );
}

async function loadInvestmentListPortfolio(): Promise<InvestmentPortfolio | null> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) return null;
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc(
      INVESTMENT_QUERY_RPC.LIST_RAW_INPUTS,
    );
    if (error) {
      logActionFailure({
        operation: INVESTMENT_OPERATION.LIST_HOLDINGS,
        error,
        context: {
          householdId: gate.householdId,
          phase: INVESTMENT_QUERY_PHASE.LIST_RAW_INPUTS,
        },
      });
      return null;
    }

    const rows = (data ?? []) as InvestmentListRawInputRow[];
    const activeMembershipIds = new Set(
      rows
        .filter(
          (row) =>
            row.owner_membership_is_active && row.owner_membership_id != null,
        )
        .map((row) => row.owner_membership_id)
        .filter((id): id is string => id != null),
    );
    const holdings = rows.map((row) =>
      mapListRawHolding(row, gate.membershipId, activeMembershipIds),
    );
    const operationTotals: InvestmentOperationTotals = {
      realizedPnl: Number(rows[0]?.realized_pnl ?? 0),
      investmentIncome: Number(rows[0]?.investment_income ?? 0),
      fees: Number(rows[0]?.fees_total ?? 0),
    };
    return buildInvestmentPortfolio(holdings, operationTotals);
  } catch (error) {
    logActionFailure({
      operation: INVESTMENT_OPERATION.LIST_HOLDINGS,
      error,
      context: {
        householdId: gate.householdId,
        phase: INVESTMENT_QUERY_PHASE.LIST_RAW_INPUTS,
      },
    });
    return null;
  }
}

export const listInvestmentListPortfolio = cache(loadInvestmentListPortfolio);

async function loadInvestmentPortfolio(): Promise<InvestmentPortfolio | null> {
  const [holdings, activities] = await Promise.all([
    loadHoldings(),
    listInvestmentActivities(),
  ]);
  if (!holdings || !activities) return null;
  return buildInvestmentPortfolio(
    holdings,
    summarizeInvestmentActivities(activities),
  );
}

export const listInvestmentPortfolio = cache(loadInvestmentPortfolio);

/**
 * Head-count of active holdings for hub-level summaries. Deliberately avoids
 * the full portfolio valuation read (lots, prices, FX, activities) — module
 * totals with valuation semantics stay on the Investments screens.
 */
async function loadActiveInvestmentHoldingCount(): Promise<number | null> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) return null;
  try {
    const supabase = await createSupabaseServerClient();
    const { count, error } = await supabase
      .from("investment_holdings")
      .select("id", { count: "exact", head: true })
      .eq("household_id", gate.householdId)
      .neq("lifecycle_status", InvestmentLifecycleStatus.EXITED)
      .gt("quantity", 0);
    if (error) {
      logActionFailure({
        operation: INVESTMENT_OPERATION.LIST_HOLDINGS,
        error,
        context: { householdId: gate.householdId, phase: "hub_count" },
      });
      return null;
    }
    return count ?? 0;
  } catch (error) {
    logActionFailure({
      operation: INVESTMENT_OPERATION.LIST_HOLDINGS,
      error,
      context: { householdId: gate.householdId, phase: "hub_count" },
    });
    return null;
  }
}

export const countActiveInvestmentHoldings = cache(
  loadActiveInvestmentHoldingCount,
);

export async function getInvestmentHoldingResult(
  holdingId: string,
): Promise<InvestmentHoldingReadResult> {
  const holdings = await loadHoldings();
  if (!holdings) return { status: InvestmentHoldingReadStatus.ERROR };
  const holding = holdings.find((candidate) => candidate.id === holdingId);
  return holding
    ? { status: InvestmentHoldingReadStatus.READY, holding }
    : { status: InvestmentHoldingReadStatus.NOT_FOUND };
}

export async function getInvestmentHolding(
  holdingId: string,
): Promise<InvestmentHolding | null> {
  const result = await getInvestmentHoldingResult(holdingId);
  return result.status === InvestmentHoldingReadStatus.READY
    ? result.holding
    : null;
}

export async function listInvestmentActivities(
  holdingId?: string,
): Promise<InvestmentActivity[] | null> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) return null;
  try {
    const supabase = await createSupabaseServerClient();
    let query = supabase
      .from("investment_operations")
      .select(
        "id, operation_type, source_holding_id, destination_holding_id, source_quantity, destination_quantity, executed_value_vnd, quoted_value_vnd, source_basis_consumed, destination_basis_added, realized_result_vnd, income_kind, transaction_id, correlation_id, effective_date, unit_price_vnd, input_currency, input_amount, input_unit_price, input_total_value, input_executed_value, input_quoted_value, input_cost_basis, input_current_valuation, input_rate_to_vnd, input_rate_date, input_rate_source, investment_fees(fee_value_vnd, input_amount, input_fee_value)",
      )
      .eq("household_id", gate.householdId)
      .order("effective_date", { ascending: false })
      .order("created_at", { ascending: false });
    if (holdingId) {
      query = query.or(
        `source_holding_id.eq.${holdingId},destination_holding_id.eq.${holdingId}`,
      );
    }
    let valuationQuery = supabase
      .from("investment_valuations")
      .select(
        "id, holding_id, value_vnd, valuation_date, quantity, unit_price_vnd, input_currency, input_unit_price, input_total_value, input_rate_to_vnd, input_rate_date, input_rate_source",
      )
      .eq("household_id", gate.householdId)
      .order("valuation_date", { ascending: false });
    if (holdingId) valuationQuery = valuationQuery.eq("holding_id", holdingId);
    const [{ data, error }, { data: valuations, error: valuationError }] =
      await Promise.all([query, valuationQuery]);
    if (error || valuationError) {
      logActionFailure({
        operation: INVESTMENT_OPERATION.LIST_ACTIVITIES,
        error: error ?? valuationError,
        context: {
          householdId: gate.householdId,
          ...(holdingId ? { holdingId } : {}),
        },
      });
      return null;
    }
    const operationActivities = ((data ?? []) as OperationRow[]).map(
      mapActivity,
    );
    const valuationActivities = (valuations ?? []).map(
      (row) =>
        ({
          id: row.id,
          type: InvestmentActivityType.VALUATION,
          sourceHoldingId: null,
          destinationHoldingId: row.holding_id,
          sourceQuantity: null,
          destinationQuantity: null,
          executedValueVnd: Number(row.value_vnd),
          quotedValueVnd: null,
          sourceBasisConsumed: null,
          destinationBasisAdded: null,
          realizedResultVnd: null,
          incomeKind: null,
          transactionId: null,
          correlationId: row.id,
          effectiveDate: row.valuation_date,
          feesVnd: 0,
          unitPriceVnd: nullableNumber(row.unit_price_vnd),
          inputCurrency: inputCurrencyOrReporting(row.input_currency),
          inputAmount: null,
          inputUnitPrice: nullableNumber(row.input_unit_price),
          inputTotalValue: nullableNumber(row.input_total_value),
          inputExecutedValue: null,
          inputQuotedValue: null,
          inputCostBasis: null,
          inputCurrentValuation: nullableNumber(row.input_total_value),
          inputRateToVnd: nullableNumber(row.input_rate_to_vnd),
          inputRateDate: row.input_rate_date ?? null,
          inputRateSource: inputRateSourceOrIdentity(row.input_rate_source),
          inputFeeAmount: null,
          inputFeeValue: null,
        }) satisfies InvestmentActivity,
    );
    return [...operationActivities, ...valuationActivities].sort(
      (left, right) => right.effectiveDate.localeCompare(left.effectiveDate),
    );
  } catch (error) {
    logActionFailure({
      operation: INVESTMENT_OPERATION.LIST_ACTIVITIES,
      error,
      context: {
        householdId: gate.householdId,
        ...(holdingId ? { holdingId } : {}),
      },
    });
    return null;
  }
}

export type { InvestmentFeeSource };
