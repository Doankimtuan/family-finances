"use server";

import {
  archiveAccount,
  createAccount,
  updateAccount,
} from "@/modules/ledger/application";
import type {
  ArchiveAccountInput,
  CreateAccountInput,
  UpdateAccountInput,
} from "@/modules/ledger/application";
import type { ProductActionErrorCode } from "@/modules/tenancy/application/product-action-error";

export type CreateAccountActionState =
  | { status: "success"; accountId: string }
  | {
      status: "error";
      code: ProductActionErrorCode;
    };

export type UpdateAccountActionState =
  { status: "success" } | { status: "error"; code: ProductActionErrorCode };

export type ArchiveAccountActionState =
  { status: "success" } | { status: "error"; code: ProductActionErrorCode };

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
