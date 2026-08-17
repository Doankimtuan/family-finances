"use server";

import { recordTransaction } from "@/modules/ledger/application";
import type { RecordTransactionErrorCode } from "@/modules/ledger/application";
import {
  recordTransfer,
  recordTransactionInputSchema,
  recordTransferInputSchema,
} from "@/modules/ledger/application";
import {
  PRODUCT_ACTION_ERROR_CODE,
  ProductActionStatus,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import { revalidateTransactionViews } from "@/app/mutation-revalidation";

export type RecordTransactionActionState =
  | {
      status: "success";
      transactionId: string;
      inboxItemId: string | null;
    }
  | {
      status: "error";
      code: RecordTransactionErrorCode;
    };

export async function recordTransactionAction(
  input: unknown,
): Promise<RecordTransactionActionState> {
  const parsed = recordTransactionInputSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "error", code: PRODUCT_ACTION_ERROR_CODE.INVALID };
  }

  const result = await recordTransaction(parsed.data);
  if (result.ok) {
    revalidateTransactionViews();
    return {
      status: "success",
      transactionId: result.transactionId,
      inboxItemId: result.inboxItemId,
    };
  }
  return { status: "error", code: result.code };
}

export type RecordTransferActionState =
  | {
      status: typeof ProductActionStatus.SUCCESS;
      transferGroupId: string;
      sourceTransactionId: string;
      destinationTransactionId: string;
      sourceDelta: number;
      destinationDelta: number;
    }
  | {
      status: typeof ProductActionStatus.ERROR;
      code: ProductActionErrorCode;
    };

export async function recordTransferAction(
  input: unknown,
): Promise<RecordTransferActionState> {
  const parsed = recordTransferInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      status: ProductActionStatus.ERROR,
      code: PRODUCT_ACTION_ERROR_CODE.INVALID,
    };
  }

  const result = await recordTransfer(parsed.data);
  if (result.ok) {
    revalidateTransactionViews();
    return {
      status: ProductActionStatus.SUCCESS,
      transferGroupId: result.transferGroupId,
      sourceTransactionId: result.sourceTransactionId,
      destinationTransactionId: result.destinationTransactionId,
      sourceDelta: result.sourceDelta,
      destinationDelta: result.destinationDelta,
    };
  }
  return { status: ProductActionStatus.ERROR, code: result.code };
}
