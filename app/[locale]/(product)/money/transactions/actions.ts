"use server";

import { recordTransaction } from "@/modules/ledger/application";
import type { RecordTransactionInput } from "@/modules/ledger/application";

export type RecordTransactionActionState =
  | {
      status: "success";
      transactionId: string;
      inboxItemId: string | null;
    }
  | {
      status: "error";
      code:
        "unauthenticated" | "no_membership" | "invalid" | "offline" | "unknown";
    };

export async function recordTransactionAction(
  input: RecordTransactionInput,
): Promise<RecordTransactionActionState> {
  const result = await recordTransaction(input);
  if (result.ok) {
    return {
      status: "success",
      transactionId: result.transactionId,
      inboxItemId: result.inboxItemId,
    };
  }
  return { status: "error", code: result.code };
}
