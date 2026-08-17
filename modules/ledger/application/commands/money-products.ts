/**
 * Public compatibility barrel for Ledger money-product commands.
 *
 * Implementations live in cohesive capability files; existing imports from
 * this path remain valid.
 */

export {
  createLiability,
  createLiabilityInputSchema,
  recordLiabilityPayment,
  recordLiabilityPaymentInputSchema,
} from "./liabilities";
export type {
  CreateLiabilityInput,
  RecordLiabilityPaymentInput,
} from "./liabilities";

export {
  createSavingsProduct,
  createSavingsInputSchema,
  enqueueSavingsMaturity,
  enqueueSavingsMaturityInputSchema,
} from "./legacy-savings";
export type {
  CreateSavingsInput,
  EnqueueSavingsMaturityInput,
} from "./legacy-savings";

export {
  createLoan,
  recordLoanPayment,
  recordLoanPaymentInputSchema,
  updateLoanMetadata,
  updateLoanMetadataInputSchema,
  updateLoanInterestRate,
  updateLoanInterestRateInputSchema,
  setLoanStatus,
  setLoanStatusInputSchema,
} from "./loans";
export type {
  RecordLoanPaymentInput,
  UpdateLoanMetadataInput,
  UpdateLoanInterestRateInput,
  SetLoanStatusInput,
} from "./loans";

export {
  createLoanInputSchema,
  type CreateLoanInput,
} from "./money-products.schema";
export type { MoneyProductMutationResult } from "./shared";
