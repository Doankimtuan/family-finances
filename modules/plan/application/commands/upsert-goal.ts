import { z } from "zod";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import {
  PRODUCT_ACTION_ERROR_CODE,
  productActionErrorFromDeniedReason,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import { assertPlanPeriodUnlocked } from "../assert-plan-unlocked";
import { FINANCIAL_SCOPE } from "@/modules/shared-kernel/application/financial-scope";
import { isGoalFundingSourceCompatible } from "../goal-funding";
import {
  GoalStatus,
  GOAL_STATUS_VALUES,
  GOAL_TYPE_VALUES,
} from "../plan-constants";

export const createGoalInputSchema = z.object({
  name: z.string().trim().min(2).max(80),
  targetAmount: z.number().finite().int().positive(),
  goalType: z.enum(GOAL_TYPE_VALUES),
  targetDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .nullable(),
});

export type CreateGoalInput = z.infer<typeof createGoalInputSchema>;

export type CreateGoalResult =
  { ok: true; goalId: string } | { ok: false; code: ProductActionErrorCode };

export async function createGoal(
  raw: CreateGoalInput,
): Promise<CreateGoalResult> {
  const parsed = createGoalInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
  }

  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) {
    return {
      ok: false,
      code: productActionErrorFromDeniedReason(gate.reason),
    };
  }

  const lock = await assertPlanPeriodUnlocked(gate.householdId);
  if (!lock.ok) {
    return { ok: false, code: lock.code };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("goals")
      .insert({
        household_id: gate.householdId,
        name: parsed.data.name,
        target_amount: parsed.data.targetAmount,
        funded_amount: 0,
        legacy_funded_amount: null,
        goal_type: parsed.data.goalType,
        target_date: parsed.data.targetDate ?? null,
        status: GoalStatus.ACTIVE,
        created_by: gate.userId,
        financial_scope: FINANCIAL_SCOPE.HOUSEHOLD,
        owner_membership_id: null,
      })
      .select("id")
      .single();

    if (error || !data?.id) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }
    return { ok: true, goalId: data.id };
  } catch {
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
  }
}

export const contributeToGoalInputSchema = z.object({
  goalId: z.string().uuid(),
  /** BR-06: positive whole magnitude; direction is contribute. */
  amount: z.number().finite().int().positive(),
  note: z.string().trim().max(200).optional(),
});

export type ContributeToGoalInput = z.infer<typeof contributeToGoalInputSchema>;

export type ContributeToGoalResult =
  | { ok: true; fundedAmount: number }
  | { ok: false; code: ProductActionErrorCode };

export async function contributeToGoal(
  raw: ContributeToGoalInput,
): Promise<ContributeToGoalResult> {
  const parsed = contributeToGoalInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
  }

  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) {
    return {
      ok: false,
      code: productActionErrorFromDeniedReason(gate.reason),
    };
  }

  const lock = await assertPlanPeriodUnlocked(gate.householdId);
  if (!lock.ok) {
    return { ok: false, code: lock.code };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { count: activeLinkCount, error: linkError } = await supabase
      .from("goal_funding_links")
      .select("id", { count: "exact", head: true })
      .eq("goal_id", parsed.data.goalId)
      .eq("household_id", gate.householdId)
      .eq("is_active", true);
    if (linkError || (activeLinkCount ?? 0) > 0) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
    }
    const { data, error } = await supabase.rpc("contribute_to_goal", {
      p_goal_id: parsed.data.goalId,
      p_amount: parsed.data.amount,
      p_note: parsed.data.note ?? null,
    });

    if (error || !data) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }
    const payload = data as { funded_amount?: number };
    return {
      ok: true,
      fundedAmount: Number(payload.funded_amount) || 0,
    };
  } catch {
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
  }
}

export const updateGoalInputSchema = z.object({
  goalId: z.string().uuid(),
  name: z.string().trim().min(2).max(80),
  targetAmount: z.number().finite().int().positive(),
  goalType: z.enum(GOAL_TYPE_VALUES),
  targetDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .nullable(),
  status: z.enum(GOAL_STATUS_VALUES).optional(),
});

export type UpdateGoalInput = z.infer<typeof updateGoalInputSchema>;

export type UpdateGoalResult =
  { ok: true } | { ok: false; code: ProductActionErrorCode };

export async function updateGoal(
  raw: UpdateGoalInput,
): Promise<UpdateGoalResult> {
  const parsed = updateGoalInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
  }

  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) {
    return {
      ok: false,
      code: productActionErrorFromDeniedReason(gate.reason),
    };
  }

  const lock = await assertPlanPeriodUnlocked(gate.householdId);
  if (!lock.ok) {
    return { ok: false, code: lock.code };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data: activeLinks, error: activeLinksError } = await supabase
      .from("goal_funding_links")
      .select("source_kind")
      .eq("goal_id", parsed.data.goalId)
      .eq("household_id", gate.householdId)
      .eq("is_active", true);
    if (
      activeLinksError ||
      (activeLinks ?? []).some(
        (link) =>
          !isGoalFundingSourceCompatible(
            parsed.data.goalType,
            link.source_kind as never,
          ),
      )
    ) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
    }
    const patch: Record<string, unknown> = {
      name: parsed.data.name,
      target_amount: parsed.data.targetAmount,
      goal_type: parsed.data.goalType,
      target_date: parsed.data.targetDate ?? null,
      updated_at: new Date().toISOString(),
    };
    if (parsed.data.status) patch.status = parsed.data.status;

    const { data, error } = await supabase
      .from("goals")
      .update(patch)
      .eq("id", parsed.data.goalId)
      .eq("household_id", gate.householdId)
      .select("id")
      .maybeSingle();

    if (error || !data) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }
    return { ok: true };
  } catch {
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
  }
}
