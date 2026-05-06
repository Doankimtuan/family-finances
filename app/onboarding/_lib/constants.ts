/**
 * Onboarding constants
 * Centralized magic values, select options, and form defaults
 */

// Form validation constants
export const VALIDATION = {
  MIN_HOUSEHOLD_NAME_LENGTH: 2,
  MIN_NAME_LENGTH: 2,
  MIN_DUE_DAY: 1,
  MAX_DUE_DAY: 31,
  DEFAULT_STATEMENT_DAY: 25,
  DEFAULT_DUE_DAY: 15,
  DEFAULT_QUANTITY_STEP: 0.001,
} as const;

// Default values
export const DEFAULTS = {
  TIMEZONE: "Asia/Ho_Chi_Minh",
  LOCALE: "en-US",
  UNIT_LABEL: "unit",
  QUANTITY: 1,
  MONTHLY_INCOME: 50000000,
  MONTHLY_ESSENTIALS: 25000000,
  TARGET_AMOUNT: 180000000,
  ANNUAL_RATE: 0,
  PRINCIPAL: 0,
  OUTSTANDING: 0,
  UNIT_PRICE: 0,
} as const;

// Asset class options
export const ASSET_CLASS_OPTIONS = [
  { value: "gold", label: "onboarding.assets.class.gold" },
  { value: "mutual_fund", label: "onboarding.assets.class.mutual_fund" },
  { value: "real_estate", label: "onboarding.assets.class.real_estate" },
  { value: "savings_deposit", label: "onboarding.assets.class.savings_deposit" },
  { value: "other", label: "onboarding.assets.class.other" },
] as const;

// Liquidity options
export const LIQUIDITY_OPTIONS = [
  { value: "true", label: "onboarding.assets.liquid" },
  { value: "false", label: "onboarding.assets.illiquid" },
] as const;

// Debt type options
export const DEBT_TYPE_OPTIONS = [
  { value: "mortgage", label: "onboarding.debts.type.mortgage" },
  { value: "family_loan", label: "onboarding.debts.type.family_loan" },
  { value: "personal_loan", label: "onboarding.debts.type.personal_loan" },
  { value: "car_loan", label: "onboarding.debts.type.car_loan" },
  { value: "other", label: "onboarding.debts.type.other" },
] as const;

// Repayment method options
export const REPAYMENT_METHOD_OPTIONS = [
  { value: "annuity", label: "onboarding.debts.repayment.annuity" },
  { value: "equal_principal", label: "onboarding.debts.repayment.equal_principal" },
  { value: "flexible", label: "onboarding.debts.repayment.flexible" },
] as const;

// Goal type options
export const GOAL_TYPE_OPTIONS = [
  { value: "emergency_fund", label: "onboarding.goals.type.emergency_fund" },
  { value: "property_purchase", label: "onboarding.goals.type.property_purchase" },
  { value: "vehicle", label: "onboarding.goals.type.vehicle" },
  { value: "education", label: "onboarding.goals.type.education" },
  { value: "retirement", label: "onboarding.goals.type.retirement" },
  { value: "custom", label: "onboarding.goals.type.custom" },
] as const;

// Input class name for consistent styling
export const INPUT_CLASS_NAME = "h-11 rounded-xl border-border bg-background px-4 text-base shadow-sm";
