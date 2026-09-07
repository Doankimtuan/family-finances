export const FinancialDisplaySize = {
  SM: "sm",
  MD: "md",
  LG: "lg",
  HERO: "hero",
} as const;

export type FinancialDisplaySize =
  (typeof FinancialDisplaySize)[keyof typeof FinancialDisplaySize];

export const FINANCIAL_DISPLAY_SIZE_VALUES = [
  FinancialDisplaySize.SM,
  FinancialDisplaySize.MD,
  FinancialDisplaySize.LG,
  FinancialDisplaySize.HERO,
] as const;

/** Visual scale for Balance / Amount. Hero is the 36px / `text-4xl` role. */
export const FINANCIAL_DISPLAY_SIZE_CLASS = {
  [FinancialDisplaySize.SM]: "text-lg",
  [FinancialDisplaySize.MD]: "text-xl",
  [FinancialDisplaySize.LG]: "text-3xl",
  [FinancialDisplaySize.HERO]: "text-4xl leading-none",
} as const;

export const BalanceSize = FinancialDisplaySize;
export type BalanceSize = FinancialDisplaySize;
export const BALANCE_SIZE_VALUES = FINANCIAL_DISPLAY_SIZE_VALUES;

export const AmountSize = FinancialDisplaySize;
export type AmountSize = FinancialDisplaySize;
export const AMOUNT_SIZE_VALUES = FINANCIAL_DISPLAY_SIZE_VALUES;
