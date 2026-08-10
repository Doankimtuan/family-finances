import {
  addQuantities,
  consumeWeightedAverageBasis,
  subtractQuantities,
} from "./decimal-quantity";

export function applyInvestmentBuy(input: {
  oldQuantity: string;
  oldBasis: number | null;
  boughtQuantity: string;
  totalAcquisitionCost: number;
}) {
  return {
    quantity: addQuantities(input.oldQuantity, input.boughtQuantity),
    basis:
      input.oldBasis == null
        ? null
        : input.oldBasis + input.totalAcquisitionCost,
  };
}

export function applyInvestmentConsumption(input: {
  oldQuantity: string;
  oldBasis: number | null;
  consumedQuantity: string;
}) {
  const consumedBasis = consumeWeightedAverageBasis({
    basis: input.oldBasis,
    priorQuantity: input.oldQuantity,
    consumedQuantity: input.consumedQuantity,
  });
  const quantity = subtractQuantities(
    input.oldQuantity,
    input.consumedQuantity,
  );
  return {
    quantity,
    consumedBasis,
    basis:
      input.oldBasis == null || consumedBasis == null
        ? null
        : input.oldBasis - consumedBasis,
  };
}

export function deriveUnrealizedResult(
  currentValue: number | null,
  remainingBasis: number | null,
): number | null {
  return currentValue == null || remainingBasis == null
    ? null
    : currentValue - remainingBasis;
}

export function deriveSlippage(input: {
  quotedValue: number | null;
  executedValue: number;
}): number | null {
  return input.quotedValue == null
    ? null
    : input.executedValue - input.quotedValue;
}
