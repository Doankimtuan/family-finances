"use server";

import {
  createGoal,
  contributeToGoal,
  updateGoal,
  type CreateGoalInput,
  type ContributeToGoalInput,
  type UpdateGoalInput,
} from "@/modules/plan/application";
import type { ProductActionErrorCode } from "@/modules/tenancy/application/product-action-error";

type Err = { status: "error"; code: ProductActionErrorCode };

export async function createGoalAction(
  input: CreateGoalInput,
): Promise<{ status: "success"; goalId: string } | Err> {
  const result = await createGoal(input);
  if (result.ok) return { status: "success", goalId: result.goalId };
  return { status: "error", code: result.code };
}

export async function contributeToGoalAction(
  input: ContributeToGoalInput,
): Promise<{ status: "success"; fundedAmount: number } | Err> {
  const result = await contributeToGoal(input);
  if (result.ok) {
    return { status: "success", fundedAmount: result.fundedAmount };
  }
  return { status: "error", code: result.code };
}

export async function updateGoalAction(
  input: UpdateGoalInput,
): Promise<{ status: "success" } | Err> {
  const result = await updateGoal(input);
  if (result.ok) return { status: "success" };
  return { status: "error", code: result.code };
}
