"use server";

import {
  updateTransaction,
  deleteTransaction,
} from "@/modules/ledger/application";
import type {
  UpdateTransactionInput,
  DeleteTransactionInput,
} from "@/modules/ledger/application";

export type MutateTransactionActionState =
  | { status: "success"; transactionId?: string; deleted?: boolean }
  | {
      status: "error";
      code:
        "unauthenticated" | "no_membership" | "invalid" | "offline" | "unknown";
    };

export async function updateTransactionAction(
  input: UpdateTransactionInput,
): Promise<MutateTransactionActionState> {
  const result = await updateTransaction(input);
  if (result.ok) {
    return { status: "success", transactionId: result.transactionId };
  }
  return { status: "error", code: result.code };
}

export async function deleteTransactionAction(
  input: DeleteTransactionInput,
): Promise<MutateTransactionActionState> {
  const result = await deleteTransaction(input);
  if (result.ok) {
    return {
      status: "success",
      transactionId: result.transactionId,
      deleted: true,
    };
  }
  return { status: "error", code: result.code };
}
