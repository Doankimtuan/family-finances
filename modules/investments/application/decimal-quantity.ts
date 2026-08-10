import { INVESTMENT_QUANTITY_SCALE } from "./investment-constants";

const QUANTITY_PATTERN = /^(0|[1-9]\d*)(?:\.(\d{1,18}))?$/;
const SCALE_FACTOR = BigInt(10) ** BigInt(INVESTMENT_QUANTITY_SCALE);

export type QuantityUnits = bigint;

export function parseQuantity(value: string): QuantityUnits {
  const normalized = value.trim();
  const match = QUANTITY_PATTERN.exec(normalized);
  if (!match) throw new Error("INVALID_INVESTMENT_QUANTITY");
  const whole = BigInt(match[1]);
  const fraction = (match[2] ?? "").padEnd(INVESTMENT_QUANTITY_SCALE, "0");
  return whole * SCALE_FACTOR + BigInt(fraction || "0");
}

export function formatQuantity(units: QuantityUnits): string {
  if (units < BigInt(0)) throw new Error("INVALID_INVESTMENT_QUANTITY");
  const whole = units / SCALE_FACTOR;
  const fraction = (units % SCALE_FACTOR)
    .toString()
    .padStart(INVESTMENT_QUANTITY_SCALE, "0")
    .replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : whole.toString();
}

export function isPositiveQuantity(value: string): boolean {
  try {
    return parseQuantity(value) > BigInt(0);
  } catch {
    return false;
  }
}

/** One half-up VND rounding of basis * consumed quantity / prior quantity. */
export function consumeWeightedAverageBasis(input: {
  basis: number | null;
  priorQuantity: string;
  consumedQuantity: string;
}): number | null {
  if (input.basis == null) return null;
  if (!Number.isSafeInteger(input.basis) || input.basis < 0) {
    throw new Error("INVALID_INVESTMENT_BASIS");
  }
  const prior = parseQuantity(input.priorQuantity);
  const consumed = parseQuantity(input.consumedQuantity);
  if (prior <= BigInt(0) || consumed <= BigInt(0) || consumed > prior) {
    throw new Error("INVALID_INVESTMENT_CONSUMPTION");
  }
  if (consumed === prior) return input.basis;
  const numerator = BigInt(input.basis) * consumed;
  const rounded = (numerator + prior / BigInt(2)) / prior;
  const value = Number(rounded);
  if (!Number.isSafeInteger(value)) throw new Error("UNSAFE_INVESTMENT_BASIS");
  return value;
}

export function addQuantities(left: string, right: string): string {
  return formatQuantity(parseQuantity(left) + parseQuantity(right));
}

export function subtractQuantities(left: string, right: string): string {
  const result = parseQuantity(left) - parseQuantity(right);
  if (result < BigInt(0)) throw new Error("INSUFFICIENT_INVESTMENT_QUANTITY");
  return formatQuantity(result);
}
