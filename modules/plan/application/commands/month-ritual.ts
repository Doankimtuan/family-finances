import { z } from "zod";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import {
  PRODUCT_ACTION_ERROR_CODE,
  productActionErrorFromDeniedReason,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import { currentPeriodMonth } from "../ritual-period";
import { buildRitualPreview } from "../queries/get-month-ritual";
import {
  RitualStatus,
  type RitualStatus as RitualStatusValue,
} from "../plan-constants";

export type RitualMutationResult =
  | { ok: true; status: RitualStatusValue; ritualId: string }
  | { ok: false; code: ProductActionErrorCode };

/**
 * AC-008 / BR-08 — generate Assisted preview and mark run previewed.
 */
export async function previewMonthRitual(
  periodMonth: string = currentPeriodMonth(),
): Promise<RitualMutationResult> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) {
    return {
      ok: false,
      code: productActionErrorFromDeniedReason(gate.reason),
    };
  }

  const preview = await buildRitualPreview(gate.householdId, periodMonth);
  if (!preview) {
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data: existing } = await supabase
      .from("month_ritual_runs")
      .select("id, status")
      .eq("household_id", gate.householdId)
      .eq("period_month", periodMonth)
      .maybeSingle();

    if (existing?.status === RitualStatus.APPROVED) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.MONTH_LOCKED };
    }

    const mode = preview.monthCloseMode;
    const payload = {
      household_id: gate.householdId,
      period_month: periodMonth,
      status: RitualStatus.PREVIEWED,
      mode,
      preview_json: preview,
      updated_at: new Date().toISOString(),
    };

    if (existing?.id) {
      const { error } = await supabase
        .from("month_ritual_runs")
        .update(payload)
        .eq("id", existing.id);
      if (error) return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
      return {
        ok: true,
        status: RitualStatus.PREVIEWED,
        ritualId: existing.id,
      };
    }

    const { data, error } = await supabase
      .from("month_ritual_runs")
      .insert(payload)
      .select("id")
      .single();

    if (error || !data?.id) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }
    return { ok: true, status: RitualStatus.PREVIEWED, ritualId: data.id };
  } catch {
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
  }
}

/**
 * Approve Assisted ritual → lock period (BR-08). Confirm-gated in UI.
 */
export async function approveMonthRitual(
  periodMonth: string = currentPeriodMonth(),
): Promise<RitualMutationResult> {
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) {
    return {
      ok: false,
      code: productActionErrorFromDeniedReason(gate.reason),
    };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data: existing } = await supabase
      .from("month_ritual_runs")
      .select("id, status")
      .eq("household_id", gate.householdId)
      .eq("period_month", periodMonth)
      .maybeSingle();

    if (!existing?.id || existing.status !== RitualStatus.PREVIEWED) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
    }

    const now = new Date().toISOString();
    const { error } = await supabase
      .from("month_ritual_runs")
      .update({
        status: RitualStatus.APPROVED,
        approved_by: gate.userId,
        approved_at: now,
        updated_at: now,
      })
      .eq("id", existing.id);

    if (error) return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    return { ok: true, status: RitualStatus.APPROVED, ritualId: existing.id };
  } catch {
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
  }
}

export const correctMonthRitualInputSchema = z.object({
  note: z.string().trim().min(3).max(400),
  periodMonth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

export type CorrectMonthRitualInput = z.infer<
  typeof correctMonthRitualInputSchema
>;

/**
 * Explicit correction path unlocks the period (status → corrected).
 */
export async function correctMonthRitual(
  raw: CorrectMonthRitualInput,
): Promise<RitualMutationResult> {
  const parsed = correctMonthRitualInputSchema.safeParse(raw);
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

  const periodMonth = parsed.data.periodMonth ?? currentPeriodMonth();

  try {
    const supabase = await createSupabaseServerClient();
    const { data: existing } = await supabase
      .from("month_ritual_runs")
      .select("id, status")
      .eq("household_id", gate.householdId)
      .eq("period_month", periodMonth)
      .maybeSingle();

    if (!existing?.id || existing.status !== RitualStatus.APPROVED) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
    }

    const now = new Date().toISOString();
    const { error } = await supabase
      .from("month_ritual_runs")
      .update({
        status: RitualStatus.CORRECTED,
        correction_note: parsed.data.note,
        corrected_by: gate.userId,
        corrected_at: now,
        updated_at: now,
      })
      .eq("id", existing.id);

    if (error) return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    return { ok: true, status: RitualStatus.CORRECTED, ritualId: existing.id };
  } catch {
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
  }
}
