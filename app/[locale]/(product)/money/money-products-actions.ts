"use server";

import {
  createLiability,
  createDebt,
  recordLiabilityPayment,
  recordDebtPayment,
  updateDebt,
  createLoan,
  recordLoanPayment,
  updateLoanMetadata,
  setLoanStatus,
  updateLoanInterestRate,
  LoanPaymentMode,
  type CreateLiabilityInput,
  type CreateDebtInput,
  type RecordLiabilityPaymentInput,
  type RecordDebtPaymentInput,
  type UpdateDebtInput,
  type CreateLoanInput,
  type RecordLoanPaymentInput,
  type UpdateLoanMetadataInput,
  type SetLoanStatusInput,
  type UpdateLoanInterestRateInput,
  type MoneyProductMutationResult,
} from "@/modules/ledger/application";
import {
  PRODUCT_ACTION_ERROR_CODE,
  ProductActionStatus,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import {
  createSavingAction,
  createSavingsAction as deprecatedCreateSavingsAction,
} from "./savings/savings-actions";

export type MoneyProductActionState =
  | {
      status: typeof ProductActionStatus.SUCCESS;
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
    }
  | { status: typeof ProductActionStatus.ERROR; code: ProductActionErrorCode };

function toState(result: MoneyProductMutationResult): MoneyProductActionState {
  if (result.ok) {
    return {
      status: ProductActionStatus.SUCCESS,
      id: result.id,
      inboxItemId: result.inboxItemId,
      completed: result.completed,
      transactionId: result.transactionId,
      transactionIds: result.transactionIds,
      paymentId: result.paymentId,
      sourceDelta: result.sourceDelta,
      amount: result.amount,
      principalPaid: result.principalPaid,
      interestPaid: result.interestPaid,
      remainingPrincipal: result.remainingPrincipal,
      scheduleEntryId: result.scheduleEntryId,
      effectiveFrom: result.effectiveFrom,
      newRate: result.newRate,
      futureEntriesBefore: result.futureEntriesBefore,
      futureEntriesAfter: result.futureEntriesAfter,
      historicalUnchanged: result.historicalUnchanged,
      idempotentReplay: result.idempotentReplay,
    };
  }
  return { status: ProductActionStatus.ERROR, code: result.code };
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

export async function createDebtAction(
  input: CreateDebtInput,
): Promise<MoneyProductActionState> {
  const result = await createDebt(input);
  if (!result.ok) {
    return { status: ProductActionStatus.ERROR, code: result.code };
  }
  return {
    status: ProductActionStatus.SUCCESS,
    id: result.debtId,
    transactionId: result.transactionId,
    idempotentReplay: result.idempotentReplay,
  };
}

export async function recordDebtPaymentAction(
  input: RecordDebtPaymentInput,
): Promise<MoneyProductActionState> {
  const result = await recordDebtPayment(input);
  if (!result.ok) {
    return { status: ProductActionStatus.ERROR, code: result.code };
  }
  return {
    status: ProductActionStatus.SUCCESS,
    id: result.debtId,
    transactionId: result.transactionId,
    paymentId: result.paymentId,
    amount: result.amount,
    remainingPrincipal: result.remainingAmount,
    completed: result.completed,
    idempotentReplay: result.idempotentReplay,
  };
}

export async function updateDebtAction(
  input: UpdateDebtInput,
): Promise<MoneyProductActionState> {
  const result = await updateDebt(input);
  if (!result.ok) {
    return { status: ProductActionStatus.ERROR, code: result.code };
  }
  return { status: ProductActionStatus.SUCCESS, id: result.debtId };
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
  void _input;
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
    idempotencyKey: crypto.randomUUID(),
    mode: LoanPaymentMode.SCHEDULED,
  });
}
