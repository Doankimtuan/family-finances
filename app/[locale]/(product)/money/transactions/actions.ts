"use server";

import { recordTransaction } from "@/modules/ledger/application";
import type {
  RecordTransactionInput,
  RecordTransactionErrorCode,
} from "@/modules/ledger/application";
import {
  recordTransfer,
  type RecordTransferInput,
} from "@/modules/ledger/application";
import {
  ProductActionStatus,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";

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
  input: RecordTransferInput,
): Promise<RecordTransferActionState> {
  const result = await recordTransfer(input);
  if (result.ok) {
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
