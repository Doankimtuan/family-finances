import { z } from "zod";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import {
  PRODUCT_ACTION_ERROR_CODE,
  productActionErrorFromDeniedReason,
} from "@/modules/tenancy/application/product-action-error";
import { currentPeriodMonth } from "../ritual-period";
import { buildRitualPreview } from "../queries/get-month-ritual";
import { listRitualDivergence } from "../queries/ritual-gates";
import {
  RitualMode,
  RitualStatus,
  RITUAL_GATE_ERROR_CODE,
  QUICK_CLOSE_CONSECUTIVE_RITUALS,
  type RitualStatus as RitualStatusValue,
} from "../plan-constants";
import {
  resolveQuickCloseEligible,
  type RitualActionErrorCode,
} from "../ritual-types";

export type { RitualActionErrorCode };

export type RitualMutationResult =
  | { ok: true; status: RitualStatusValue; ritualId: string }
  | { ok: false; code: RitualActionErrorCode };

async function assertNoDivergence(
  householdId: string,
  periodMonth: string,
): Promise<RitualActionErrorCode | null> {
  const divergence = await listRitualDivergence(householdId, periodMonth);
  if (divergence.length > 0) {
    return RITUAL_GATE_ERROR_CODE.RITUAL_DIVERGENCE;
  }
  return null;
}

/**
 * AC-008 / BR-08 — generate Assisted preview and mark run previewed.
 * Blocked when Step 1 Category-Jar divergence exists (ST-E04-002).
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

  const divergenceCode = await assertNoDivergence(
    gate.householdId,
    periodMonth,
  );
  if (divergenceCode) {
    return { ok: false, code: divergenceCode };
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

    if (
      existing?.status === RitualStatus.APPROVED ||
      existing?.status === RitualStatus.PENDING_REVIEW
    ) {
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

export type ApproveMonthRitualOptions = {
  periodMonth?: string;
  /** BR-23 1-tap Quick Close path. */
  quickClose?: boolean;
};

/**
 * Approve Assisted (or Quick Close) ritual → lock period (BR-08 / BR-23).
 */
export async function approveMonthRitual(
  options: ApproveMonthRitualOptions = {},
): Promise<RitualMutationResult> {
  const periodMonth = options.periodMonth ?? currentPeriodMonth();
  const quickClose = options.quickClose === true;

  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) {
    return {
      ok: false,
      code: productActionErrorFromDeniedReason(gate.reason),
    };
  }

  const divergenceCode = await assertNoDivergence(
    gate.householdId,
    periodMonth,
  );
  if (divergenceCode) {
    return { ok: false, code: divergenceCode };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data: household } = await supabase
      .from("households")
      .select("consecutive_completed_rituals, month_close_mode")
      .eq("id", gate.householdId)
      .maybeSingle();

    const consecutive = Number(household?.consecutive_completed_rituals ?? 0);
    if (quickClose && !resolveQuickCloseEligible(consecutive)) {
      return { ok: false, code: RITUAL_GATE_ERROR_CODE.QUICK_CLOSE_LOCKED };
    }

    let { data: existing } = await supabase
      .from("month_ritual_runs")
      .select("id, status, mode")
      .eq("household_id", gate.householdId)
      .eq("period_month", periodMonth)
      .maybeSingle();

    if (
      existing?.status === RitualStatus.APPROVED ||
      existing?.status === RitualStatus.PENDING_REVIEW
    ) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.MONTH_LOCKED };
    }

    // Quick Close may approve from draft by generating preview first.
    if (quickClose && existing?.status !== RitualStatus.PREVIEWED) {
      const previewed = await previewMonthRitual(periodMonth);
      if (!previewed.ok) return previewed;
      const refreshed = await supabase
        .from("month_ritual_runs")
        .select("id, status, mode")
        .eq("household_id", gate.householdId)
        .eq("period_month", periodMonth)
        .maybeSingle();
      existing = refreshed.data;
    }

    if (!existing?.id || existing.status !== RitualStatus.PREVIEWED) {
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
    }

    const now = new Date().toISOString();
    const approveMode = quickClose
      ? RitualMode.QUICK_CLOSE
      : mapApproveMode(existing.mode);

    const { error } = await supabase
      .from("month_ritual_runs")
      .update({
        status: RitualStatus.APPROVED,
        mode: approveMode,
        approved_by: gate.userId,
        approved_at: now,
        updated_at: now,
      })
      .eq("id", existing.id);

    if (error) return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };

    // BR-23 streak: Assisted (or Quick Close after unlock) counts as completed.
    const nextConsecutive = consecutive + 1;
    const householdPatch: {
      consecutive_completed_rituals: number;
      month_close_mode?: string;
    } = {
      consecutive_completed_rituals: nextConsecutive,
    };
    if (nextConsecutive >= QUICK_CLOSE_CONSECUTIVE_RITUALS) {
      householdPatch.month_close_mode = RitualMode.QUICK_CLOSE;
    }

    await supabase
      .from("households")
      .update(householdPatch)
      .eq("id", gate.householdId);

    return { ok: true, status: RitualStatus.APPROVED, ritualId: existing.id };
  } catch {
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
  }
}

function mapApproveMode(mode: string | null | undefined): string {
  if (
    mode === RitualMode.AUTO ||
    mode === RitualMode.MANUAL ||
    mode === RitualMode.QUICK_CLOSE
  ) {
    return mode;
  }
  return RitualMode.ASSISTED;
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
 * Explicit correction path unlocks approved or pending_review periods.
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

    if (
      !existing?.id ||
      (existing.status !== RitualStatus.APPROVED &&
        existing.status !== RitualStatus.PENDING_REVIEW)
    ) {
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
        auto_locked_at: null,
        updated_at: now,
      })
      .eq("id", existing.id);

    if (error) return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    return { ok: true, status: RitualStatus.CORRECTED, ritualId: existing.id };
  } catch {
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
  }
}
