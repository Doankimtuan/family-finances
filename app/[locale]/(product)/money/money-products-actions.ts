"use server";

import {
  createLiability,
  recordLiabilityPayment,
  createSavingsProduct,
  enqueueSavingsMaturity,
  createLoan,
  recordLoanPayment,
  updateLoanMetadata,
  setLoanStatus,
  updateLoanInterestRate,
  LoanPaymentMode,
  type CreateLiabilityInput,
  type RecordLiabilityPaymentInput,
  type CreateSavingsInput,
  type EnqueueSavingsMaturityInput,
  type CreateLoanInput,
  type RecordLoanPaymentInput,
  type UpdateLoanMetadataInput,
  type SetLoanStatusInput,
  type UpdateLoanInterestRateInput,
  type MoneyProductMutationResult,
} from "@/modules/ledger/application";
import {
  PRODUCT_ACTION_ERROR_CODE,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";

export type MoneyProductActionState =
  | {
      status: "success";
      id?: string;
      inboxItemId?: string;
      completed?: boolean;
    }
  | { status: "error"; code: ProductActionErrorCode };

function toState(result: MoneyProductMutationResult): MoneyProductActionState {
  if (result.ok) {
    return {
      status: "success",
      id: result.id,
      inboxItemId: result.inboxItemId,
      completed: result.completed,
    };
  }
  return { status: "error", code: result.code };
}

export async function createLiabilityAction(
  input: CreateLiabilityInput,
): Promise<MoneyProductActionState> {
  return toState(await createLiability(input));
}

export async function recordLiabilityPaymentAction(
  input: RecordLiabilityPaymentInput,
): Promise<MoneyProductActionState> {
  return toState(await recordLiabilityPayment(input));
}

export async function createSavingsAction(
  input: CreateSavingsInput,
): Promise<MoneyProductActionState> {
  return toState(await createSavingsProduct(input));
}

export async function enqueueSavingsMaturityAction(
  input: EnqueueSavingsMaturityInput,
): Promise<MoneyProductActionState> {
  return toState(await enqueueSavingsMaturity(input));
}

export async function createLoanAction(
  input: CreateLoanInput,
): Promise<MoneyProductActionState> {
  return toState(await createLoan(input));
}

export async function recordLoanPaymentAction(
  input: RecordLoanPaymentInput,
): Promise<MoneyProductActionState> {
  return toState(await recordLoanPayment(input));
}

export async function updateLoanMetadataAction(
  input: UpdateLoanMetadataInput,
): Promise<MoneyProductActionState> {
  return toState(await updateLoanMetadata(input));
}

export async function setLoanStatusAction(
  input: SetLoanStatusInput,
): Promise<MoneyProductActionState> {
  return toState(await setLoanStatus(input));
}

export async function updateLoanInterestRateAction(
  input: UpdateLoanInterestRateInput,
): Promise<MoneyProductActionState> {
  return toState(await updateLoanInterestRate(input));
}

/** @deprecated Use createLoanAction. */
export const createInstallmentAction = createLoanAction;
/** @deprecated Use recordLoanPaymentAction. */
export async function recordInstallmentPaymentAction(input: {
  planId: string;
  accountId?: string;
}): Promise<MoneyProductActionState> {
  if (!input.accountId) {
    return { status: "error", code: PRODUCT_ACTION_ERROR_CODE.INVALID };
  }
  return recordLoanPaymentAction({
    loanId: input.planId,
    accountId: input.accountId,
    mode: LoanPaymentMode.SCHEDULED,
  });
}
