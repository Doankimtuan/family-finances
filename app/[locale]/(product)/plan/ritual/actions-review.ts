"use server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import {
  MonthlyReviewStatus,
  RitualMode,
  RitualStatus,
} from "@/modules/plan/application/plan-constants";

const PERIOD_MONTH_PATTERN = /^\d{4}-\d{2}-01$/;
const periodSchema = z.string().regex(PERIOD_MONTH_PATTERN);
const REVIEW_ACTION_ERROR = {
  INVALID: "invalid",
  UNAVAILABLE: "unavailable",
} as const;
type ReviewActionError =
  (typeof REVIEW_ACTION_ERROR)[keyof typeof REVIEW_ACTION_ERROR];
type ReviewActionState =
  | typeof MonthlyReviewStatus.VIEWED
  | typeof MonthlyReviewStatus.MARKED_REVIEWED;
type ReviewActionResult =
  | { ok: true; state: ReviewActionState }
  | { ok: false; error: ReviewActionError };

async function upsertReviewMetadata(
  periodMonth: string,
  state: ReviewActionState,
  snapshot?: unknown,
): Promise<ReviewActionResult> {
  const parsed = periodSchema.safeParse(periodMonth);
  if (!parsed.success) {
    return { ok: false, error: REVIEW_ACTION_ERROR.INVALID };
  }
  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) {
    return { ok: false, error: REVIEW_ACTION_ERROR.UNAVAILABLE };
  }

  try {
    const now = new Date().toISOString();
    const supabase = await createSupabaseServerClient();
    const { data: existing, error: readError } = await supabase
      .from("month_ritual_runs")
      .select("id, viewed_at, reviewed_at, review_status")
      .eq("household_id", gate.householdId)
      .eq("period_month", periodMonth)
      .maybeSingle();
    if (readError) {
      return { ok: false, error: REVIEW_ACTION_ERROR.UNAVAILABLE };
    }

    const update =
      state === MonthlyReviewStatus.MARKED_REVIEWED
        ? {
            review_status: MonthlyReviewStatus.MARKED_REVIEWED,
            viewed_at: existing?.viewed_at ?? now,
            reviewed_at: now,
            review_snapshot: snapshot ?? null,
            updated_at: now,
          }
        : {
            review_status:
              existing?.review_status === MonthlyReviewStatus.MARKED_REVIEWED
                ? MonthlyReviewStatus.MARKED_REVIEWED
                : MonthlyReviewStatus.VIEWED,
            viewed_at: existing?.viewed_at ?? now,
            updated_at: now,
          };

    if (existing?.id) {
      const { error } = await supabase
        .from("month_ritual_runs")
        .update(update)
        .eq("id", existing.id);
      return error
        ? { ok: false, error: REVIEW_ACTION_ERROR.UNAVAILABLE }
        : { ok: true, state };
    }

    const { error } = await supabase.from("month_ritual_runs").insert({
      household_id: gate.householdId,
      period_month: periodMonth,
      status: RitualStatus.DRAFT,
      mode: RitualMode.ASSISTED,
      preview_json: {},
      ...update,
    });
    return error
      ? { ok: false, error: REVIEW_ACTION_ERROR.UNAVAILABLE }
      : { ok: true, state };
  } catch (error) {
    console.error("[plan.monthly-review] metadata persistence failed", {
      error,
      householdId: gate.householdId,
      periodMonth,
      state,
    });
    return { ok: false, error: REVIEW_ACTION_ERROR.UNAVAILABLE };
  }
}

export async function markMonthlyReviewViewed(periodMonth: string) {
  return upsertReviewMetadata(periodMonth, MonthlyReviewStatus.VIEWED);
}

export async function markMonthlyReviewReviewed(
  periodMonth: string,
  snapshot: unknown,
) {
  return upsertReviewMetadata(
    periodMonth,
    MonthlyReviewStatus.MARKED_REVIEWED,
    snapshot,
  );
}
