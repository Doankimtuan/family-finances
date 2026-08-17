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
import { revalidateTransactionTagViews } from "@/app/mutation-revalidation";

export type TransactionTagActionState =
  | { status: "success"; tag?: TransactionTag }
  | { status: "error"; code: ProductActionErrorCode };

export async function createTransactionTagAction(
  input: TransactionTagInput,
): Promise<TransactionTagActionState> {
  const result = await createTransactionTag(input);
  if (result.ok) revalidateTransactionTagViews();
  return result.ok
    ? { status: "success", tag: result.tag }
    : { status: "error", code: result.code };
}

export async function archiveTransactionTagAction(
  tagId: string,
): Promise<TransactionTagActionState> {
  const result = await archiveTransactionTag(tagId);
  if (result.ok) revalidateTransactionTagViews();
  return result.ok
    ? { status: "success" }
    : { status: "error", code: result.code };
}

export async function updateTransactionTagAction(
  tagId: string,
  input: TransactionTagInput,
): Promise<TransactionTagActionState> {
  const result = await updateTransactionTag(tagId, input);
  if (result.ok) revalidateTransactionTagViews();
  return result.ok
    ? { status: "success", tag: result.tag }
    : { status: "error", code: result.code };
}

export async function setTransactionTagsAction(
  transactionId: string,
  tagIds: string[],
): Promise<TransactionTagActionState> {
  const result = await setTransactionTags(transactionId, tagIds);
  if (result.ok) revalidateTransactionTagViews();
  return result.ok
    ? { status: "success" }
    : { status: "error", code: result.code };
}
