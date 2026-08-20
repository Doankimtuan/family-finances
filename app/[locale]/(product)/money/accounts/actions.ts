"use server";

import {
  addCardCashback,
  archiveAccount,
  createAccount,
  settleCard,
  registerCreditCardInstallment,
  stopCreditCardInstallmentTracking,
  updateAccount,
  archiveAccountInputSchema,
  createAccountInputSchema,
  updateAccountInputSchema,
} from "@/modules/ledger/application";
import type {
  AddCardCashbackInput,
  RegisterCreditCardInstallmentInput,
  StopCreditCardInstallmentTrackingInput,
  SettleCardInput,
} from "@/modules/ledger/application";
import {
  PRODUCT_ACTION_ERROR_CODE,
  ProductActionStatus,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import type { LedgerActionErrorCode } from "@/modules/ledger/application";
import { revalidateAccountViews } from "@/app/mutation-revalidation";

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
  input: unknown,
): Promise<CreateAccountActionState> {
  const parsed = createAccountInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      status: ProductActionStatus.ERROR,
      code: PRODUCT_ACTION_ERROR_CODE.INVALID,
    };
  }
  const result = await createAccount(parsed.data);
  if (result.ok) {
    revalidateAccountViews();
    return {
      status: ProductActionStatus.SUCCESS,
      accountId: result.accountId,
    };
  }
  return { status: ProductActionStatus.ERROR, code: result.code };
}

export async function updateAccountAction(
  input: unknown,
): Promise<UpdateAccountActionState> {
  const parsed = updateAccountInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      status: ProductActionStatus.ERROR,
      code: PRODUCT_ACTION_ERROR_CODE.INVALID,
    };
  }
  const result = await updateAccount(parsed.data);
  if (result.ok) {
    revalidateAccountViews();
    return { status: ProductActionStatus.SUCCESS };
  }
  return { status: ProductActionStatus.ERROR, code: result.code };
}

export async function archiveAccountAction(
  input: unknown,
): Promise<ArchiveAccountActionState> {
  const parsed = archiveAccountInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      status: ProductActionStatus.ERROR,
      code: PRODUCT_ACTION_ERROR_CODE.INVALID,
    };
  }
  const result = await archiveAccount(parsed.data);
  if (result.ok) {
    revalidateAccountViews();
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
