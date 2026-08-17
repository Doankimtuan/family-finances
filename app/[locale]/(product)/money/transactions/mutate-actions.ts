"use server";

import {
  updateTransaction,
  deleteTransaction,
  refundTransaction,
  correctTransaction,
} from "@/modules/ledger/application";
import type {
  UpdateTransactionInput,
  DeleteTransactionInput,
  RefundTransactionInput,
  CorrectTransactionInput,
} from "@/modules/ledger/application";
import type { ProductActionErrorCode } from "@/modules/tenancy/application/product-action-error";
import type { LedgerActionErrorCode } from "@/modules/ledger/application/ledger-constants";
import { revalidateTransactionViews } from "@/app/mutation-revalidation";

export type MutateTransactionActionState =
  | {
      status: "success";
      transactionId?: string;
      deleted?: boolean;
      refundTransactionId?: string;
      reversalTransactionId?: string;
      correctionTransactionId?: string;
      capacityRestored?: number;
    }
  | {
      status: "error";
      code: ProductActionErrorCode | LedgerActionErrorCode;
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

export async function refundTransactionAction(
  input: RefundTransactionInput,
): Promise<MutateTransactionActionState> {
  const result = await refundTransaction(input);
  if (result.ok) {
    revalidateTransactionViews();
    return {
      status: "success",
      transactionId: result.originalTransactionId,
      refundTransactionId: result.refundTransactionId,
      capacityRestored: result.capacityRestored,
    };
  }
  return { status: "error", code: result.code };
}

export async function correctTransactionAction(
  input: CorrectTransactionInput,
): Promise<MutateTransactionActionState> {
  const result = await correctTransaction(input);
  if (result.ok) {
    revalidateTransactionViews();
    return {
      status: "success",
      transactionId: result.correctionTransactionId,
      reversalTransactionId: result.reversalTransactionId,
      correctionTransactionId: result.correctionTransactionId,
    };
  }
  return { status: "error", code: result.code };
}
