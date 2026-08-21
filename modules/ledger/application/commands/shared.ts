import type { ProductActionErrorCode } from "@/modules/tenancy/application/product-action-error";
import type { Result } from "@/modules/shared-kernel/application/result";

export type MoneyProductMutationSuccess = {
  id?: string;
  inboxItemId?: string;
  completed?: boolean;
  transactionId?: string;
  transactionIds?: readonly string[];
  paymentId?: string;
  sourceDelta?: number;
  amount?: number;
  principalPaid?: number;
  interestPaid?: number;
  remainingPrincipal?: number;
  scheduleEntryId?: string;
  effectiveFrom?: string;
  newRate?: number;
  futureEntriesBefore?: number;
  futureEntriesAfter?: number;
  historicalUnchanged?: boolean;
  idempotentReplay?: boolean;
};

export type MoneyProductMutationResult = Result<
  MoneyProductMutationSuccess,
  ProductActionErrorCode
>;
