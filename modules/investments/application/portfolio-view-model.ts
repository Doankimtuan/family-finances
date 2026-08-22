import type { InvestmentActivity, InvestmentHolding } from "./investment-types";
import type { InvestmentAssetClass } from "./investment-constants";
import { allocateBasisPoints } from "./queries/investment-queries";
export function classifyPortfolioHoldings(holdings: InvestmentHolding[]) {
  const activeHoldings = holdings.filter(
    (holding) =>
      holding.lifecycleStatus !== "exited" && Number(holding.quantity) > 0,
  );
  const closedHoldings = holdings.filter(
    (holding) => !activeHoldings.some((active) => active.id === holding.id),
  );
  return { activeHoldings, closedHoldings };
}
export function summarizeActivePortfolio(
  activeHoldings: InvestmentHolding[],
  activities: InvestmentActivity[],
) {
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
  const completeCostBasis = complete.length
    ? complete.reduce(
        (sum, holding) => sum + (holding.remainingTotalCostBasis ?? 0),
        0,
      )
    : null;
  const allocation = new Map<InvestmentAssetClass, number>();
  for (const holding of valued)
    allocation.set(
      holding.assetClass,
      (allocation.get(holding.assetClass) ?? 0) + (holding.currentValue ?? 0),
    );
  return {
    totalCurrentValue: valued.length
      ? valued.reduce((sum, holding) => sum + (holding.currentValue ?? 0), 0)
      : null,
    totalRemainingCostBasis: based.length
      ? based.reduce(
          (sum, holding) => sum + (holding.remainingTotalCostBasis ?? 0),
          0,
        )
      : null,
    unrealizedResult: complete.length
      ? complete.reduce(
          (sum, holding) =>
            sum +
            (holding.currentValue ?? 0) -
            (holding.remainingTotalCostBasis ?? 0),
          0,
        )
      : null,
    estimatedUnrealizedPnlPercent:
      completeCostBasis != null && completeCostBasis !== 0 && complete.length
        ? complete.reduce(
            (sum, holding) =>
              sum +
              (holding.currentValue ?? 0) -
              (holding.remainingTotalCostBasis ?? 0),
            0,
          ) / completeCostBasis
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
    basisCoverage: { included: based.length, total: activeHoldings.length },
    incompleteBasisCount: activeHoldings.filter(
      (holding) => holding.remainingTotalCostBasis == null,
    ).length,
    allocationByAssetClass: allocateBasisPoints(
      Array.from(allocation, ([assetClass, valueVnd]) => ({
        assetClass,
        valueVnd,
      })),
    ),
  };
}
