/** Household policy values consumed by Tenancy persistence and Plan behavior. */

export const IncomeAllocateMode = {
  OFF: "off",
  SUGGEST: "suggest",
  AUTO: "auto",
} as const;

export type IncomeAllocateMode =
  (typeof IncomeAllocateMode)[keyof typeof IncomeAllocateMode];

export const INCOME_ALLOCATE_MODE_VALUES = [
  IncomeAllocateMode.OFF,
  IncomeAllocateMode.SUGGEST,
  IncomeAllocateMode.AUTO,
] as const;

export const RitualMode = {
  ASSISTED: "assisted",
  AUTO: "auto",
  MANUAL: "manual",
  QUICK_CLOSE: "quick_close",
} as const;

export type RitualMode = (typeof RitualMode)[keyof typeof RitualMode];

export const RITUAL_MODE_VALUES = [
  RitualMode.ASSISTED,
  RitualMode.AUTO,
  RitualMode.MANUAL,
  RitualMode.QUICK_CLOSE,
] as const;
