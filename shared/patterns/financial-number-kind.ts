export const FinancialNumberKind = {
  CURRENT_STATE: "current-state",
  MOVEMENT: "movement",
  INTENTION: "intention",
  ESTIMATE: "estimate",
} as const;

export type FinancialNumberKind =
  (typeof FinancialNumberKind)[keyof typeof FinancialNumberKind];

export const FINANCIAL_NUMBER_KIND_VALUES = [
  FinancialNumberKind.CURRENT_STATE,
  FinancialNumberKind.MOVEMENT,
  FinancialNumberKind.INTENTION,
  FinancialNumberKind.ESTIMATE,
] as const;
