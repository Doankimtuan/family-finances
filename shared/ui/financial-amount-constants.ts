export const FinancialAmountSize = {
  DISPLAY_HERO: "displayHero",
  SECTION_TOTAL: "sectionTotal",
  METRIC_MEDIUM: "metricMedium",
  ROW_AMOUNT: "rowAmount",
  MICRO_AMOUNT: "microAmount",
} as const;

export type FinancialAmountSize =
  | (typeof FinancialAmountSize)[keyof typeof FinancialAmountSize]
  | "hero"
  | "lg"
  | "md"
  | "sm"
  | "xs";

export const FinancialAmountTone = {
  INCOME: "income",
  EXPENSE: "expense",
  DEBT: "debt",
  TRANSFER: "transfer",
  NEUTRAL: "neutral",
  MUTED: "muted",
} as const;

export type FinancialAmountTone =
  (typeof FinancialAmountTone)[keyof typeof FinancialAmountTone];
