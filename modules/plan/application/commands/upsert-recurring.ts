import { z } from "zod";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import {
  PRODUCT_ACTION_ERROR_CODE,
  productActionErrorFromDeniedReason,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import { assertPlanPeriodUnlocked } from "../assert-plan-unlocked";
import {
  RecurringFrequency,
  RECURRING_DIRECTION_OPTIONS,
  RECURRING_FREQUENCY_VALUES,
} from "../plan-constants";

const recurringBaseSchema = z.object({
  name: z.string().trim().min(2).max(80),
  direction: z.enum(RECURRING_DIRECTION_OPTIONS),
  amount: z.number().finite().int().positive(),
  frequency: z.enum(RECURRING_FREQUENCY_VALUES),
  intervalCount: z.number().int().positive().default(1),
  dayOfMonth: z.number().int().min(1).max(31).optional().nullable(),
  dayOfWeek: z.number().int().min(0).max(6).optional().nullable(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  nextRunDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .nullable(),
  isActive: z.boolean().default(true),
});

export const createRecurringInputSchema = recurringBaseSchema;

export type CreateRecurringInput = z.infer<typeof createRecurringInputSchema>;

export type CreateRecurringResult =
  { ok: true; ruleId: string } | { ok: false; code: ProductActionErrorCode };

export async function createRecurring(
  raw: CreateRecurringInput,
): Promise<CreateRecurringResult> {
  const parsed = createRecurringInputSchema.safeParse(raw);
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
    const nextRun = parsed.data.nextRunDate ?? parsed.data.startDate;
    const { data, error } = await supabase
      .from("recurring_rules")
      .insert({
        household_id: gate.householdId,
        name: parsed.data.name,
        direction: parsed.data.direction,
        amount: parsed.data.amount,
        frequency: parsed.data.frequency,
        interval_count: parsed.data.intervalCount,
        day_of_month:
          parsed.data.frequency === RecurringFrequency.MONTHLY
            ? (parsed.data.dayOfMonth ?? null)
            : null,
        day_of_week:
          parsed.data.frequency === RecurringFrequency.WEEKLY
            ? (parsed.data.dayOfWeek ?? null)
            : null,
        start_date: parsed.data.startDate,
        next_run_date: nextRun,
        is_active: parsed.data.isActive,
        created_by: gate.userId,
      })
      .select("id")
      .single();

    if (error || !data?.id) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }
    return { ok: true, ruleId: data.id };
  } catch {
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
  }
}

export const updateRecurringInputSchema = recurringBaseSchema.extend({
  ruleId: z.string().uuid(),
});

export type UpdateRecurringInput = z.infer<typeof updateRecurringInputSchema>;

export type UpdateRecurringResult =
  { ok: true } | { ok: false; code: ProductActionErrorCode };

export async function updateRecurring(
  raw: UpdateRecurringInput,
): Promise<UpdateRecurringResult> {
  const parsed = updateRecurringInputSchema.safeParse(raw);
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
      .from("recurring_rules")
      .update({
        name: parsed.data.name,
        direction: parsed.data.direction,
        amount: parsed.data.amount,
        frequency: parsed.data.frequency,
        interval_count: parsed.data.intervalCount,
        day_of_month:
          parsed.data.frequency === RecurringFrequency.MONTHLY
            ? (parsed.data.dayOfMonth ?? null)
            : null,
        day_of_week:
          parsed.data.frequency === RecurringFrequency.WEEKLY
            ? (parsed.data.dayOfWeek ?? null)
            : null,
        start_date: parsed.data.startDate,
        next_run_date: parsed.data.nextRunDate ?? parsed.data.startDate,
        is_active: parsed.data.isActive,
        updated_at: new Date().toISOString(),
      })
      .eq("id", parsed.data.ruleId)
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

export const deleteRecurringInputSchema = z.object({
  ruleId: z.string().uuid(),
});

export type DeleteRecurringInput = z.infer<typeof deleteRecurringInputSchema>;

export type DeleteRecurringResult =
  { ok: true } | { ok: false; code: ProductActionErrorCode };

export async function deleteRecurring(
  raw: DeleteRecurringInput,
): Promise<DeleteRecurringResult> {
  const parsed = deleteRecurringInputSchema.safeParse(raw);
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
    const { error } = await supabase
      .from("recurring_rules")
      .delete()
      .eq("id", parsed.data.ruleId)
      .eq("household_id", gate.householdId);

    if (error) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }
    return { ok: true };
  } catch {
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
  }
}
