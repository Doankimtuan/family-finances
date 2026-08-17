import { parseQuantity } from "./decimal-quantity";
import { INVESTMENT_QUANTITY_SCALE } from "./investment-constants";
const QUANTITY_SCALE = BigInt(10) ** BigInt(INVESTMENT_QUANTITY_SCALE);
export const HistoricalBasisInputMode = {
  PER_UNIT: "per-unit",
  TOTAL: "total",
} as const;
export type HistoricalBasisInputMode =
  (typeof HistoricalBasisInputMode)[keyof typeof HistoricalBasisInputMode];
export type HistoricalImportPreview = {
  quantity: string;
  basisInputMode: HistoricalBasisInputMode;
  averageCostPerUnit: number | null;
  totalCostBasis: number | null;
  currentUnitValuation: number | null;
  currentTotalValue: number | null;
  unrealizedPnl: number | null;
  unrealizedPnlPercent: number | null;
  basisKnown: boolean;
  valuationKnown: boolean;
};
function money(value: number | null) {
  return value != null && Number.isSafeInteger(value) && value >= 0
    ? BigInt(value)
    : null;
}
function multiply(quantity: string, unit: number | null) {
  const value = money(unit);
  if (value == null) return null;
  try {
    const result =
      (parseQuantity(quantity) * value + QUANTITY_SCALE / BigInt(2)) /
      QUANTITY_SCALE;
    const numberValue = Number(result);
    return Number.isSafeInteger(numberValue) ? numberValue : null;
  } catch {
    return null;
  }
}
function divide(total: number | null, quantity: string) {
  const value = money(total);
  if (value == null) return null;
  try {
    const parsed = parseQuantity(quantity);
    if (parsed <= BigInt(0)) return null;
    const result = (value * QUANTITY_SCALE + parsed / BigInt(2)) / parsed;
    const numberValue = Number(result);
    return Number.isSafeInteger(numberValue) ? numberValue : null;
  } catch {
    return null;
  }
}
export function buildHistoricalImportPreview(input: {
  quantity: string;
  basisInputMode: HistoricalBasisInputMode;
  averageCostPerUnit: number | null;
  totalCostBasis: number | null;
  currentUnitValuation: number | null;
}): HistoricalImportPreview {
  const totalCostBasis =
    input.basisInputMode === HistoricalBasisInputMode.PER_UNIT
      ? multiply(input.quantity, input.averageCostPerUnit)
      : input.totalCostBasis;
  const averageCostPerUnit =
    input.basisInputMode === HistoricalBasisInputMode.PER_UNIT
      ? input.averageCostPerUnit
      : divide(input.totalCostBasis, input.quantity);
  const currentTotalValue = multiply(
    input.quantity,
    input.currentUnitValuation,
  );
  const unrealizedPnl =
    totalCostBasis != null && currentTotalValue != null
      ? currentTotalValue - totalCostBasis
      : null;
  const unrealizedPnlPercent =
    unrealizedPnl != null && totalCostBasis != null && totalCostBasis > 0
      ? unrealizedPnl / totalCostBasis
      : null;
  return {
    quantity: input.quantity,
    basisInputMode: input.basisInputMode,
    averageCostPerUnit,
    totalCostBasis,
    currentUnitValuation: input.currentUnitValuation,
    currentTotalValue,
    unrealizedPnl,
    unrealizedPnlPercent,
    basisKnown: totalCostBasis != null,
    valuationKnown: currentTotalValue != null,
  };
}
