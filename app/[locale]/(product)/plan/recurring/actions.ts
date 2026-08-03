"use server";

import {
  createRecurring,
  updateRecurring,
  deleteRecurring,
  type CreateRecurringInput,
  type UpdateRecurringInput,
  type DeleteRecurringInput,
} from "@/modules/plan/application";
import type { ProductActionErrorCode } from "@/modules/tenancy/application/product-action-error";

type Err = { status: "error"; code: ProductActionErrorCode };

export async function createRecurringAction(
  input: CreateRecurringInput,
): Promise<{ status: "success"; ruleId: string } | Err> {
  const result = await createRecurring(input);
  if (result.ok) return { status: "success", ruleId: result.ruleId };
  return { status: "error", code: result.code };
}

export async function updateRecurringAction(
  input: UpdateRecurringInput,
): Promise<{ status: "success" } | Err> {
  const result = await updateRecurring(input);
  if (result.ok) return { status: "success" };
  return { status: "error", code: result.code };
}

export async function deleteRecurringAction(
  input: DeleteRecurringInput,
): Promise<{ status: "success" } | Err> {
  const result = await deleteRecurring(input);
  if (result.ok) return { status: "success" };
  return { status: "error", code: result.code };
}
