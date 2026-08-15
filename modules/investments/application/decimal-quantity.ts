import { INVESTMENT_QUANTITY_SCALE } from "./investment-constants";

const QUANTITY_PATTERN = /^(0|[1-9]\d*)(?:\.(\d{1,18}))?$/;
const DECIMAL_RADIX = 10;
const SCALE_FACTOR = BigInt(DECIMAL_RADIX) ** BigInt(INVESTMENT_QUANTITY_SCALE);
const ZERO_BIGINT = BigInt(0);
const HALF_DIVISOR = BigInt(2);
const MIN_SCALE_INTEGER = 0;

export const QUANTITY_ERROR_CODE = {
  INVALID_QUANTITY: "INVALID_INVESTMENT_QUANTITY",
  INVALID_BASIS: "INVALID_INVESTMENT_BASIS",
  INVALID_CONSUMPTION: "INVALID_INVESTMENT_CONSUMPTION",
  UNSAFE_BASIS: "UNSAFE_INVESTMENT_BASIS",
  INSUFFICIENT_QUANTITY: "INSUFFICIENT_INVESTMENT_QUANTITY",
} as const;
export type QuantityErrorCode =
  (typeof QUANTITY_ERROR_CODE)[keyof typeof QUANTITY_ERROR_CODE];

export type QuantityUnits = bigint;

export function parseQuantity(value: string): QuantityUnits {
  const normalized = value.trim();
  const match = QUANTITY_PATTERN.exec(normalized);
  if (!match) throw new Error(QUANTITY_ERROR_CODE.INVALID_QUANTITY);
  const whole = BigInt(match[1]);
  const fraction = (match[2] ?? "").padEnd(INVESTMENT_QUANTITY_SCALE, "0");
  return whole * SCALE_FACTOR + BigInt(fraction || "0");
}

export function formatQuantity(units: QuantityUnits): string {
  if (units < ZERO_BIGINT)
    throw new Error(QUANTITY_ERROR_CODE.INVALID_QUANTITY);
  const whole = units / SCALE_FACTOR;
  const fraction = (units % SCALE_FACTOR)
    .toString()
    .padStart(INVESTMENT_QUANTITY_SCALE, "0")
    .replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : whole.toString();
}

export function isPositiveQuantity(value: string): boolean {
  try {
    return parseQuantity(value) > ZERO_BIGINT;
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
  if (!Number.isSafeInteger(input.basis) || input.basis < MIN_SCALE_INTEGER) {
    throw new Error(QUANTITY_ERROR_CODE.INVALID_BASIS);
  }
  const prior = parseQuantity(input.priorQuantity);
  const consumed = parseQuantity(input.consumedQuantity);
  if (prior <= ZERO_BIGINT || consumed <= ZERO_BIGINT || consumed > prior) {
    throw new Error(QUANTITY_ERROR_CODE.INVALID_CONSUMPTION);
  }
  if (consumed === prior) return input.basis;
  const numerator = BigInt(input.basis) * consumed;
  const rounded = (numerator + prior / HALF_DIVISOR) / prior;
  const value = Number(rounded);
  if (!Number.isSafeInteger(value))
    throw new Error(QUANTITY_ERROR_CODE.UNSAFE_BASIS);
  return value;
}

export function addQuantities(left: string, right: string): string {
  return formatQuantity(parseQuantity(left) + parseQuantity(right));
}

export function subtractQuantities(left: string, right: string): string {
  const result = parseQuantity(left) - parseQuantity(right);
  if (result < ZERO_BIGINT)
    throw new Error(QUANTITY_ERROR_CODE.INSUFFICIENT_QUANTITY);
  return formatQuantity(result);
}
