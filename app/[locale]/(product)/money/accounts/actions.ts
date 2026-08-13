"use server";

import {
  addCardCashback,
  archiveAccount,
  createAccount,
  settleCard,
  registerCreditCardInstallment,
  stopCreditCardInstallmentTracking,
  updateAccount,
} from "@/modules/ledger/application";
import type {
  AddCardCashbackInput,
  ArchiveAccountInput,
  CreateAccountInput,
  RegisterCreditCardInstallmentInput,
  StopCreditCardInstallmentTrackingInput,
  SettleCardInput,
  UpdateAccountInput,
} from "@/modules/ledger/application";
import {
  ProductActionStatus,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import type { LedgerActionErrorCode } from "@/modules/ledger/application";

export type CreateAccountActionState =
  | { status: typeof ProductActionStatus.SUCCESS; accountId: string }
  | { status: typeof ProductActionStatus.ERROR; code: ProductActionErrorCode };

export type UpdateAccountActionState =
  | { status: typeof ProductActionStatus.SUCCESS }
  | { status: typeof ProductActionStatus.ERROR; code: ProductActionErrorCode };

export type ArchiveAccountActionState =
  | { status: typeof ProductActionStatus.SUCCESS }
  | { status: typeof ProductActionStatus.ERROR; code: ProductActionErrorCode };

export type CardMutationActionState =
  | {
      status: typeof ProductActionStatus.SUCCESS;
      id?: string;
      transactionId?: string;
      paymentId?: string;
      sourceDelta?: number;
      appliedAmount?: number;
      remainingDue?: number;
      idempotentReplay?: boolean;
    }
  | {
      status: typeof ProductActionStatus.ERROR;
      code: ProductActionErrorCode | LedgerActionErrorCode;
    };

export async function createAccountAction(
  input: CreateAccountInput,
): Promise<CreateAccountActionState> {
  const result = await createAccount(input);
  if (result.ok) {
    return {
      status: ProductActionStatus.SUCCESS,
      accountId: result.accountId,
    };
  }
  return { status: ProductActionStatus.ERROR, code: result.code };
}

export async function updateAccountAction(
  input: UpdateAccountInput,
): Promise<UpdateAccountActionState> {
  const result = await updateAccount(input);
  if (result.ok) {
    return { status: ProductActionStatus.SUCCESS };
  }
  return { status: ProductActionStatus.ERROR, code: result.code };
}

export async function archiveAccountAction(
  input: ArchiveAccountInput,
): Promise<ArchiveAccountActionState> {
  const result = await archiveAccount(input);
  if (result.ok) {
    return { status: ProductActionStatus.SUCCESS };
  }
  return { status: ProductActionStatus.ERROR, code: result.code };
}

export async function settleCardAction(
  input: SettleCardInput,
): Promise<CardMutationActionState> {
  const result = await settleCard(input);
  if (result.ok) {
    return {
      status: ProductActionStatus.SUCCESS,
      id: result.transactionId,
      transactionId: result.transactionId,
      paymentId: result.paymentId,
      sourceDelta: result.sourceDelta,
      appliedAmount: result.appliedAmount,
      remainingDue: result.remainingDue,
      idempotentReplay: result.idempotentReplay,
    };
  }
  return { status: ProductActionStatus.ERROR, code: result.code };
}

export async function addCardCashbackAction(
  input: AddCardCashbackInput,
): Promise<CardMutationActionState> {
  const result = await addCardCashback(input);
  if (result.ok) {
    return {
      status: ProductActionStatus.SUCCESS,
      id: result.transactionId,
    };
  }

  return { status: ProductActionStatus.ERROR, code: result.code };
}

export async function registerCreditCardInstallmentAction(
  input: RegisterCreditCardInstallmentInput,
): Promise<CardMutationActionState> {
  const result = await registerCreditCardInstallment(input);
  if (result.ok) {
    return { status: ProductActionStatus.SUCCESS, id: result.installmentId };
  }
  return { status: ProductActionStatus.ERROR, code: result.code };
}

export async function stopCreditCardInstallmentTrackingAction(
  input: StopCreditCardInstallmentTrackingInput,
): Promise<CardMutationActionState> {
  const result = await stopCreditCardInstallmentTracking(input);
  if (result.ok) return { status: ProductActionStatus.SUCCESS };
  return { status: ProductActionStatus.ERROR, code: result.code };
}
