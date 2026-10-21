import { describe, expect, it } from "vitest";
import {
  classifyPortfolioHoldings,
  summarizeActivePortfolio,
} from "@/modules/investments/application/portfolio-view-model";
import {
  InvestmentAssetClass,
  InvestmentLifecycleStatus,
  InvestmentHistoryStatus,
  InvestmentValuationSource,
} from "@/modules/investments/application/investment-constants";
import { resolveInvestmentValuation } from "@/modules/investments/application/market-valuation";
import type { InvestmentHolding } from "@/modules/investments/application/investment-types";
const holding = (
  overrides: Partial<InvestmentHolding> = {},
): InvestmentHolding => ({
  id: crypto.randomUUID(),
  householdId: "h",
  name: "FPT",
  symbol: "FPT",
  assetClass: InvestmentAssetClass.STOCK,
  providerCustodian: "SSI",
  visibilityContext: "household",
  lifecycleStatus: InvestmentLifecycleStatus.ACTIVE,
  historyStatus: InvestmentHistoryStatus.OPENING_POSITION,
  quantity: "10",
  remainingTotalCostBasis: 1_000_000,
  currentValue: 1_200_000,
  currentValuationDate: "2026-08-15",
  unrealizedResult: 200_000,
  notes: null,
  ...overrides,
});
describe("Prompt 09.3 portfolio view model", () => {
  it("keeps closed positions out of active portfolio", () => {
    const result = classifyPortfolioHoldings([
      holding(),
      holding({
        quantity: "0",
        lifecycleStatus: InvestmentLifecycleStatus.EXITED,
      }),
    ]);
    expect(result.activeHoldings).toHaveLength(1);
    expect(result.closedHoldings).toHaveLength(1);
  });
  it("excludes unknown basis from aggregate unrealized P&L instead of treating it as zero", () => {
    const result = summarizeActivePortfolio(
      [
        holding(),
        holding({
          id: "unknown",
          remainingTotalCostBasis: null,
          unrealizedResult: null,
        }),
      ],
      [],
    );
    expect(result.unrealizedResult).toBe(200_000);
    expect(result.incompleteBasisCount).toBe(1);
  });
  it("allocates current value by asset type", () => {
    const result = summarizeActivePortfolio(
      [
        holding(),
        holding({
          id: "crypto",
          assetClass: InvestmentAssetClass.CRYPTO,
          currentValue: 800_000,
          remainingTotalCostBasis: 700_000,
          unrealizedResult: 100_000,
        }),
      ],
      [],
    );
    expect(
      new Set(result.allocationByAssetClass.map((row) => row.assetClass)),
    ).toEqual(
      new Set([InvestmentAssetClass.CRYPTO, InvestmentAssetClass.STOCK]),
    );
    expect(
      result.allocationByAssetClass.reduce(
        (sum, row) => sum + row.shareBasisPoints,
        0,
      ),
    ).toBe(10_000);
  });

  it("aggregates the remaining manual unit-price value after a partial sale", () => {
    const valuation = resolveInvestmentValuation({
      assetClass: InvestmentAssetClass.STOCK,
      quantity: "60",
      remainingCostBasis: 6_000_000,
      instrument: null,
      price: null,
      fxRate: null,
      manualValuation: {
        valueVnd: 12_000_000,
        valuationDate: "2026-10-20",
        unitPriceVnd: 120_000,
        source: InvestmentValuationSource.MANUAL,
      },
    });
    const portfolio = summarizeActivePortfolio(
      [
        holding({
          quantity: "60",
          remainingTotalCostBasis: 6_000_000,
          currentValue: valuation.currentValue,
        }),
      ],
      [],
    );

    expect(portfolio.totalCurrentValue).toBe(7_200_000);
    expect(portfolio.totalRemainingCostBasis).toBe(6_000_000);
    expect(portfolio.unrealizedResult).toBe(1_200_000);
  });
});
