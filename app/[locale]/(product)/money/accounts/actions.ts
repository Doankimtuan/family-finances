"use server";

import {
  addCardCashback,
  archiveAccount,
  createAccount,
  settleCard,
  updateAccount,
} from "@/modules/ledger/application";
import type {
  AddCardCashbackInput,
  ArchiveAccountInput,
  CreateAccountInput,
  SettleCardInput,
  UpdateAccountInput,
} from "@/modules/ledger/application";
import type { ProductActionErrorCode } from "@/modules/tenancy/application/product-action-error";
import type { LedgerActionErrorCode } from "@/modules/ledger/application";

export type CreateAccountActionState =
  | { status: "success"; accountId: string }
  | { status: "error"; code: ProductActionErrorCode };

export type UpdateAccountActionState =
  { status: "success" } | { status: "error"; code: ProductActionErrorCode };

export type ArchiveAccountActionState =
  { status: "success" } | { status: "error"; code: ProductActionErrorCode };

export type CardMutationActionState =
  | { status: "success"; id?: string }
  | { status: "error"; code: ProductActionErrorCode | LedgerActionErrorCode };

export async function createAccountAction(
  input: CreateAccountInput,
): Promise<CreateAccountActionState> {
  const result = await createAccount(input);
  if (result.ok) {
    return { status: "success", accountId: result.accountId };
  }
  return { status: "error", code: result.code };
}

export async function updateAccountAction(
  input: UpdateAccountInput,
): Promise<UpdateAccountActionState> {
  const result = await updateAccount(input);
  if (result.ok) {
    return { status: "success" };
  }
  return { status: "error", code: result.code };
}

export async function archiveAccountAction(
  input: ArchiveAccountInput,
): Promise<ArchiveAccountActionState> {
  const result = await archiveAccount(input);
  if (result.ok) {
    return { status: "success" };
  }
  return { status: "error", code: result.code };
}

export async function settleCardAction(
  input: SettleCardInput,
): Promise<CardMutationActionState> {
  const result = await settleCard(input);
  if (result.ok) {
    return { status: "success", id: result.transactionId };
  }
  return { status: "error", code: result.code };
}

export async function addCardCashbackAction(
  input: AddCardCashbackInput,
): Promise<CardMutationActionState> {
  const result = await addCardCashback(input);
  if (result.ok) {
    return { status: "success", id: result.transactionId };
  }
  return { status: "error", code: result.code };
}
