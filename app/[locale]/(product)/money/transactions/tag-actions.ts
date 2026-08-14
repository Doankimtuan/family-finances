"use server";

import {
  archiveTransactionTag,
  createTransactionTag,
  updateTransactionTag,
  setTransactionTags,
  type TransactionTagInput,
} from "@/modules/ledger/application";
import type { TransactionTag } from "@/modules/ledger/application/client";
import type { ProductActionErrorCode } from "@/modules/tenancy/application/product-action-error";

export type TransactionTagActionState =
  | { status: "success"; tag?: TransactionTag }
  | { status: "error"; code: ProductActionErrorCode };

export async function createTransactionTagAction(
  input: TransactionTagInput,
): Promise<TransactionTagActionState> {
  const result = await createTransactionTag(input);
  return result.ok
    ? { status: "success", tag: result.tag }
    : { status: "error", code: result.code };
}

export async function archiveTransactionTagAction(
  tagId: string,
): Promise<TransactionTagActionState> {
  const result = await archiveTransactionTag(tagId);
  return result.ok
    ? { status: "success" }
    : { status: "error", code: result.code };
}

export async function updateTransactionTagAction(
  tagId: string,
  input: TransactionTagInput,
): Promise<TransactionTagActionState> {
  const result = await updateTransactionTag(tagId, input);
  return result.ok
    ? { status: "success", tag: result.tag }
    : { status: "error", code: result.code };
}

export async function setTransactionTagsAction(
  transactionId: string,
  tagIds: string[],
): Promise<TransactionTagActionState> {
  const result = await setTransactionTags(transactionId, tagIds);
  return result.ok
    ? { status: "success" }
    : { status: "error", code: result.code };
}
