"use server";

import { recordTransaction } from "@/modules/ledger/application";
import type { RecordTransactionInput } from "@/modules/ledger/application";
import type { ProductActionErrorCode } from "@/modules/tenancy/application/product-action-error";

export type RecordTransactionActionState =
  | {
      status: "success";
      transactionId: string;
      inboxItemId: string | null;
    }
  | {
      status: "error";
      code: ProductActionErrorCode;
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
