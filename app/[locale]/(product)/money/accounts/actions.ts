"use server";

import { createAccount } from "@/modules/ledger/application";
import type { CreateAccountInput } from "@/modules/ledger/application";
import type { ProductActionErrorCode } from "@/modules/tenancy/application/product-action-error";

export type CreateAccountActionState =
  | { status: "success"; accountId: string }
  | {
      status: "error";
      code: ProductActionErrorCode;
    };

export async function createAccountAction(
  input: CreateAccountInput,
): Promise<CreateAccountActionState> {
  const result = await createAccount(input);
  if (result.ok) {
    return { status: "success", accountId: result.accountId };
  }
  return { status: "error", code: result.code };
}
