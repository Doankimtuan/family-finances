"use server";
import {
  createGoal,
  contributeToGoal,
  updateGoal,
  type CreateGoalInput,
  type ContributeToGoalInput,
  type UpdateGoalInput,
} from "@/modules/plan/application/commands/upsert-goal";
import {
  linkGoalFunding,
  unlinkGoalFunding,
  type LinkGoalFundingInput,
  type UnlinkGoalFundingInput,
} from "@/modules/plan/application/commands/link-goal-funding";
import {
  changeGoalLifecycle,
  reassignGoalFundingSource,
  type GoalLifecycleAction,
} from "@/modules/plan/application/commands/goal-actions";
import type { ProductActionErrorCode } from "@/modules/tenancy/application/product-action-error";
import { revalidateGoalViews } from "@/app/mutation-revalidation";

type Err = { status: "error"; code: ProductActionErrorCode };
type Ok = { status: "success" };

export async function createGoalAction(
  input: CreateGoalInput,
): Promise<{ status: "success"; goalId: string } | Err> {
  const result = await createGoal(input);
  if (result.ok) {
    revalidateGoalViews();
    return { status: "success", goalId: result.goalId };
  }
  return { status: "error", code: result.code };
}

export async function contributeToGoalAction(
  input: ContributeToGoalInput,
): Promise<{ status: "success"; fundedAmount: number } | Err> {
  const result = await contributeToGoal(input);
  if (result.ok) {
    revalidateGoalViews();
    return { status: "success", fundedAmount: result.fundedAmount };
  }
  return { status: "error", code: result.code };
}

export async function updateGoalAction(
  input: UpdateGoalInput,
): Promise<Ok | Err> {
  const result = await updateGoal(input);
  if (result.ok) {
    revalidateGoalViews();
    return { status: "success" };
  }
  return { status: "error", code: result.code };
}

export async function linkGoalFundingAction(
  input: LinkGoalFundingInput,
): Promise<Ok | Err> {
  const result = await linkGoalFunding(input);
  if (result.ok) {
    revalidateGoalViews();
    return { status: "success" };
  }
  return { status: "error", code: result.code };
}

export async function unlinkGoalFundingAction(
  input: UnlinkGoalFundingInput,
): Promise<Ok | Err> {
  const result = await unlinkGoalFunding(input);
  if (result.ok) {
    revalidateGoalViews();
    return { status: "success" };
  }
  return { status: "error", code: result.code };
}

export async function changeGoalLifecycleAction(input: {
  goalId: string;
  action: GoalLifecycleAction;
}): Promise<Ok | Err> {
  const result = await changeGoalLifecycle(input);
  if (result.ok) {
    revalidateGoalViews();
    return { status: "success" };
  }
  return { status: "error", code: result.code };
}

export async function reassignGoalFundingSourceAction(input: {
  linkId: string;
  fromGoalId: string;
  toGoalId: string;
}): Promise<Ok | Err> {
  const result = await reassignGoalFundingSource(input);
  if (result.ok) {
    revalidateGoalViews();
    return { status: "success" };
  }
  return { status: "error", code: result.code };
}
