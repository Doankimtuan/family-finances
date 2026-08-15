import { describe, expect, it } from "vitest";
import { buildHistoricalImportPreview } from "@/modules/investments/application/historical-import-view-model";

function preview(quantity: string, cost: number | null, value: number | null) {
  return buildHistoricalImportPreview({
    quantity,
    basisInputMode: "per-unit",
    averageCostPerUnit: cost,
    totalCostBasis: null,
    currentUnitValuation: value,
  });
}

describe("historical import preview", () => {
  it.each([
    ["fund", "12", 10000, 10250, 120000, 123000, 3000, 0.025],
    ["security", "100", 80000, 92000, 8000000, 9200000, 1200000, 0.15],
    ["crypto", "0.25", 60000, 70000, 15000, 17500, 2500, 1 / 6],
    ["gold", "2", 9000000, 9500000, 18000000, 19000000, 1000000, 1 / 18],
  ])(
    "derives totals for %s from quantity and unit prices",
    (_name, quantity, cost, value, basis, totalValue, pnl, pnlPercent) => {
      const result = preview(
        quantity as string,
        cost as number,
        value as number,
      );
      expect(result.totalCostBasis).toBe(basis);
      expect(result.currentTotalValue).toBe(totalValue);
      expect(result.unrealizedPnl).toBe(pnl);
      expect(result.unrealizedPnlPercent).toBeCloseTo(pnlPercent as number);
    },
  );

  it("switches from per-unit to total basis without financial drift", () => {
    const perUnit = preview("12", 10000, 10250);
    const totalMode = buildHistoricalImportPreview({
      quantity: "12",
      basisInputMode: "total",
      averageCostPerUnit: null,
      totalCostBasis: perUnit.totalCostBasis,
      currentUnitValuation: 10250,
    });
    const backToPerUnit = buildHistoricalImportPreview({
      quantity: "12",
      basisInputMode: "per-unit",
      averageCostPerUnit: totalMode.averageCostPerUnit,
      totalCostBasis: null,
      currentUnitValuation: 10250,
    });
    expect(totalMode.totalCostBasis).toBe(120000);
    expect(totalMode.averageCostPerUnit).toBe(10000);
    expect(backToPerUnit.totalCostBasis).toBe(perUnit.totalCostBasis);
    expect(backToPerUnit.currentTotalValue).toBe(perUnit.currentTotalValue);
  });

  it("keeps missing valuation unavailable instead of zero", () => {
    const result = preview("12", 10000, null);
    expect(result.totalCostBasis).toBe(120000);
    expect(result.currentTotalValue).toBeNull();
    expect(result.unrealizedPnl).toBeNull();
  });

  it("keeps missing basis unavailable instead of fake profit", () => {
    const result = buildHistoricalImportPreview({
      quantity: "12",
      basisInputMode: "total",
      averageCostPerUnit: null,
      totalCostBasis: null,
      currentUnitValuation: 10250,
    });
    expect(result.totalCostBasis).toBeNull();
    expect(result.currentTotalValue).toBe(123000);
    expect(result.unrealizedPnl).toBeNull();
  });
});
