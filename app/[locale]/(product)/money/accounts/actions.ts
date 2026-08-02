"use server";

import { createAccount } from "@/modules/ledger/application";
import type { CreateAccountInput } from "@/modules/ledger/application";

export type CreateAccountActionState =
  | { status: "success"; accountId: string }
  | {
      status: "error";
      code: "unauthenticated" | "no_membership" | "invalid" | "unknown";
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
