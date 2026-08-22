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
  type InvestmentLifecycleStatus,
  InvestmentActivityType,
  type InvestmentOperationType,
  type InvestmentVisibilityContext,
  InvestmentValuationSource,
  INVESTMENT_REPORTING_CURRENCY,
  INVESTMENT_OPERATION,
  MarketDataProvider,
  MarketFxProvider,
  MarketPricingMode,
  MarketPriceType,
  MarketValuationQuality,
  MarketValuationSource,
  InvestmentHoldingReadStatus,
} from "../investment-constants";
import { resolveInvestmentValuation } from "../market-valuation";
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
  investment_fees?: Array<{ fee_value_vnd: string | number }> | null;
  unit_price_vnd: string | number | null;
};

function nullableNumber(value: string | number | null | undefined) {
  return value == null ? null : Number(value);
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
          "holding_id, value_vnd, valuation_date, created_at, quantity, unit_price_vnd, source",
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
    const activeOwnerMembershipIds = await listActiveMembershipIds(
      supabase,
      gate.householdId,
      (holdings ?? [])
        .map((row) => row.owner_membership_id)
        .filter((id): id is string => id != null),
    );
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
    const instrumentIds = [
      ...new Set(
        ((holdings ?? []) as HoldingRow[])
          .map((row) => row.instrument_id)
          .filter((id): id is string => id != null),
      ),
    ];
    const marketRows = instrumentIds.length
      ? await Promise.all([
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
      : [
          { data: [], error: null },
          { data: [], error: null },
          { data: [], error: null },
        ];
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
    return ((holdings ?? []) as HoldingRow[]).map((row) =>
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

async function loadInvestmentPortfolio(): Promise<InvestmentPortfolio | null> {
  const holdings = await loadHoldings();
  if (!holdings) return null;
  const activities = await listInvestmentActivities();
  if (!activities) return null;
  const activeHoldings = holdings.filter(
    (holding) =>
      holding.lifecycleStatus !== "exited" && Number(holding.quantity) > 0,
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
    realizedSaleResult: activities.reduce(
      (sum, activity) => sum + (activity.realizedResultVnd ?? 0),
      0,
    ),
    investmentIncome: activities.reduce(
      (sum, activity) =>
        sum + (activity.incomeKind ? (activity.executedValueVnd ?? 0) : 0),
      0,
    ),
    investmentFees: activities.reduce(
      (sum, activity) => sum + activity.feesVnd,
      0,
    ),
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

export const listInvestmentPortfolio = cache(loadInvestmentPortfolio);

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
        "id, operation_type, source_holding_id, destination_holding_id, source_quantity, destination_quantity, executed_value_vnd, quoted_value_vnd, source_basis_consumed, destination_basis_added, realized_result_vnd, income_kind, transaction_id, correlation_id, effective_date, unit_price_vnd, investment_fees(fee_value_vnd)",
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
        "id, holding_id, value_vnd, valuation_date, quantity, unit_price_vnd",
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
