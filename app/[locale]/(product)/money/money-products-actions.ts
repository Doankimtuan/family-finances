"use server";

import {
  createLiability,
  recordLiabilityPayment,
  createSavingsProduct,
  enqueueSavingsMaturity,
  createInstallmentPlan,
  recordInstallmentPayment,
  type CreateLiabilityInput,
  type RecordLiabilityPaymentInput,
  type CreateSavingsInput,
  type EnqueueSavingsMaturityInput,
  type CreateInstallmentInput,
  type RecordInstallmentPaymentInput,
  type MoneyProductMutationResult,
} from "@/modules/ledger/application";
import type { ProductActionErrorCode } from "@/modules/tenancy/application/product-action-error";

export type MoneyProductActionState =
  | {
      status: "success";
      id?: string;
      inboxItemId?: string;
      completed?: boolean;
    }
  | { status: "error"; code: ProductActionErrorCode };

function toState(result: MoneyProductMutationResult): MoneyProductActionState {
  if (result.ok) {
    return {
      status: "success",
      id: result.id,
      inboxItemId: result.inboxItemId,
      completed: result.completed,
    };
  }
  return { status: "error", code: result.code };
}

export async function createLiabilityAction(
  input: CreateLiabilityInput,
): Promise<MoneyProductActionState> {
  return toState(await createLiability(input));
}

export async function recordLiabilityPaymentAction(
  input: RecordLiabilityPaymentInput,
): Promise<MoneyProductActionState> {
  return toState(await recordLiabilityPayment(input));
}

export async function createSavingsAction(
  input: CreateSavingsInput,
): Promise<MoneyProductActionState> {
  return toState(await createSavingsProduct(input));
}

export async function enqueueSavingsMaturityAction(
  input: EnqueueSavingsMaturityInput,
): Promise<MoneyProductActionState> {
  return toState(await enqueueSavingsMaturity(input));
}

export async function createInstallmentAction(
  input: CreateInstallmentInput,
): Promise<MoneyProductActionState> {
  return toState(await createInstallmentPlan(input));
}

export async function recordInstallmentPaymentAction(
  input: RecordInstallmentPaymentInput,
): Promise<MoneyProductActionState> {
  return toState(await recordInstallmentPayment(input));
}
