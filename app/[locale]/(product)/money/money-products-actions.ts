"use server";

import {
  createLiability,
  recordLiabilityPayment,
  createLoan,
  recordLoanPayment,
  updateLoanMetadata,
  setLoanStatus,
  updateLoanInterestRate,
  LoanPaymentMode,
  type CreateLiabilityInput,
  type RecordLiabilityPaymentInput,
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
import {
  createSavingAction,
  createSavingsAction as deprecatedCreateSavingsAction,
} from "./savings/savings-actions";

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

/** @deprecated Use createSavingAction from savings-actions. */
export async function createSavingsAction(input: {
  name: string;
  principalAmount: number;
  maturityDate: string;
  note?: string;
}): Promise<MoneyProductActionState> {
  return deprecatedCreateSavingsAction(input);
}

export { createSavingAction };

/** @deprecated Maturity is handled by Inbox integration. */
export async function enqueueSavingsMaturityAction(_input: {
  savingsId: string;
}): Promise<MoneyProductActionState> {
  return { status: "error", code: PRODUCT_ACTION_ERROR_CODE.INVALID };
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
