import type { ProductActionErrorCode } from "@/modules/tenancy/application/product-action-error";

export type MoneyProductMutationResult =
  | {
      ok: true;
      id?: string;
      inboxItemId?: string;
      completed?: boolean;
      transactionId?: string;
      paymentId?: string;
      sourceDelta?: number;
      amount?: number;
      principalPaid?: number;
      interestPaid?: number;
      feePaid?: number;
      remainingPrincipal?: number;
      scheduleEntryId?: string;
      effectiveFrom?: string;
      newRate?: number;
      futureEntriesBefore?: number;
      futureEntriesAfter?: number;
      historicalUnchanged?: boolean;
    }
  | { ok: false; code: ProductActionErrorCode };
