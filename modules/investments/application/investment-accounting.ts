import {
  AccountingMethod,
  applyAcquisition,
  deriveUnrealizedPnl,
  disposeCostBasis,
} from "../domain/investment-domain";

/** Backward-compatible facade for existing v1 commands. New lifecycle code should use the domain strategy registry directly. */
export function applyInvestmentBuy(input: {
  oldQuantity: string;
  oldBasis: number | null;
  boughtQuantity: string;
  totalAcquisitionCost: number;
}) {
  const result = applyAcquisition({
    position: {
      quantity: input.oldQuantity,
      remainingCostBasis: input.oldBasis,
    },
    quantity: input.boughtQuantity,
    totalCost: input.totalAcquisitionCost,
  });
  return { quantity: result.quantity, basis: result.remainingCostBasis };
}

export function applyInvestmentConsumption(input: {
  oldQuantity: string;
  oldBasis: number | null;
  consumedQuantity: string;
}) {
  const result = disposeCostBasis({
    position: {
      quantity: input.oldQuantity,
      remainingCostBasis: input.oldBasis,
      accountingMethod: AccountingMethod.WEIGHTED_AVERAGE,
    },
    quantity: input.consumedQuantity,
  });
  return {
    quantity: result.remainingQuantity,
    consumedBasis: result.disposedCostBasis,
    basis: result.remainingCostBasis,
  };
}

export function deriveUnrealizedResult(
  currentValue: number | null,
  remainingBasis: number | null,
): number | null {
  return deriveUnrealizedPnl(currentValue, remainingBasis);
}
export function deriveSlippage(input: {
  quotedValue: number | null;
  executedValue: number;
}): number | null {
  return input.quotedValue == null
    ? null
    : input.executedValue - input.quotedValue;
}
