import { cache } from "react";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
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
  INVESTMENT_OPERATION,
} from "../investment-constants";
import { deriveUnrealizedResult } from "../investment-accounting";
import type {
  InvestmentActivity,
  InvestmentHolding,
  InvestmentPortfolio,
} from "../investment-types";

type HoldingRow = {
  id: string;
  household_id: string;
  name: string;
  symbol: string | null;
  asset_class: string;
  provider_custodian: string | null;
  visibility_context: string;
  lifecycle_status: string;
  history_status: string;
  quantity: string | number;
  remaining_total_cost_basis: string | number | null;
  notes: string | null;
};

type ValuationRow = {
  holding_id: string;
  value_vnd: string | number;
  valuation_date: string;
  created_at: string;
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
};

function nullableNumber(value: string | number | null | undefined) {
  return value == null ? null : Number(value);
}

function mapHolding(
  row: HoldingRow,
  valuation?: ValuationRow,
): InvestmentHolding {
  const basis = nullableNumber(row.remaining_total_cost_basis);
  const currentValue = valuation ? Number(valuation.value_vnd) : null;
  return {
    id: row.id,
    householdId: row.household_id,
    name: row.name,
    symbol: row.symbol,
    assetClass: row.asset_class as InvestmentAssetClass,
    providerCustodian: row.provider_custodian,
    visibilityContext: row.visibility_context as InvestmentVisibilityContext,
    lifecycleStatus: row.lifecycle_status as InvestmentLifecycleStatus,
    historyStatus: row.history_status as InvestmentHistoryStatus,
    quantity: String(row.quantity),
    remainingTotalCostBasis: basis,
    currentValue,
    currentValuationDate: valuation?.valuation_date ?? null,
    unrealizedResult: deriveUnrealizedResult(currentValue, basis),
    notes: row.notes,
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
    ] = await Promise.all([
      supabase
        .from("investment_holdings")
        .select(
          "id, household_id, name, symbol, asset_class, provider_custodian, visibility_context, lifecycle_status, history_status, quantity, remaining_total_cost_basis, notes",
        )
        .eq("household_id", gate.householdId)
        .order("created_at", { ascending: true }),
      supabase
        .from("investment_valuations")
        .select("holding_id, value_vnd, valuation_date, created_at")
        .eq("household_id", gate.householdId)
        .order("valuation_date", { ascending: false })
        .order("created_at", { ascending: false }),
    ]);
    if (error || valuationError) {
      logActionFailure({
        operation: INVESTMENT_OPERATION.LIST_HOLDINGS,
        error: error ?? valuationError,
        context: { householdId: gate.householdId },
      });
      return null;
    }
    const latest = new Map<string, ValuationRow>();
    for (const row of (valuations ?? []) as ValuationRow[]) {
      if (!latest.has(row.holding_id)) latest.set(row.holding_id, row);
    }
    return ((holdings ?? []) as HoldingRow[]).map((row) =>
      mapHolding(row, latest.get(row.id)),
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
    unrealizedResult:
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
    valuationCoverage: { included: valued.length, total: holdings.length },
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

export async function getInvestmentHolding(
  holdingId: string,
): Promise<InvestmentHolding | null> {
  const holdings = await loadHoldings();
  return holdings?.find((holding) => holding.id === holdingId) ?? null;
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
        "id, operation_type, source_holding_id, destination_holding_id, source_quantity, destination_quantity, executed_value_vnd, quoted_value_vnd, source_basis_consumed, destination_basis_added, realized_result_vnd, income_kind, transaction_id, correlation_id, effective_date, investment_fees(fee_value_vnd)",
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
      .select("id, holding_id, value_vnd, valuation_date")
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
