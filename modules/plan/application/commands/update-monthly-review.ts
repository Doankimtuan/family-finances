import { z } from "zod";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";
import {
  PRODUCT_ACTION_ERROR_CODE,
  productActionErrorFromDeniedReason,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import type { Result } from "@/modules/shared-kernel/application/result";
import {
  MonthlyReviewStatus,
  PLAN_OPERATION,
  RitualMode,
  RitualStatus,
} from "../plan-constants";
import { logPlanFailure } from "../plan-error";

const PERIOD_MONTH_PATTERN = /^\d{4}-\d{2}-01$/;
const MONTHLY_REVIEW_MUTABLE_STATUS_VALUES = [
  MonthlyReviewStatus.VIEWED,
  MonthlyReviewStatus.MARKED_REVIEWED,
] as const;

export const monthlyReviewMetadataInputSchema = z.object({
  periodMonth: z.string().regex(PERIOD_MONTH_PATTERN),
  state: z.enum(MONTHLY_REVIEW_MUTABLE_STATUS_VALUES),
  snapshot: z.unknown().optional(),
});

export type MonthlyReviewMetadataInput = z.input<
  typeof monthlyReviewMetadataInputSchema
>;

export type MonthlyReviewMetadataResult = Result<
  { state: MonthlyReviewMetadataInput["state"] },
  ProductActionErrorCode
>;

export async function updateMonthlyReviewMetadata(
  raw: MonthlyReviewMetadataInput,
): Promise<MonthlyReviewMetadataResult> {
  const parsed = monthlyReviewMetadataInputSchema.safeParse(raw);
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

  const { periodMonth, state, snapshot } = parsed.data;

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
      logPlanFailure(readError, PLAN_OPERATION.MONTHLY_REVIEW_METADATA, {
        householdId: gate.householdId,
        periodMonth,
      });
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
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
      if (error) {
        logPlanFailure(error, PLAN_OPERATION.MONTHLY_REVIEW_METADATA, {
          householdId: gate.householdId,
          periodMonth,
        });
        return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
      }
      return { ok: true, state };
    }

    const { error } = await supabase.from("month_ritual_runs").insert({
      household_id: gate.householdId,
      period_month: periodMonth,
      status: RitualStatus.DRAFT,
      mode: RitualMode.ASSISTED,
      preview_json: {},
      ...update,
    });
    if (error) {
      logPlanFailure(error, PLAN_OPERATION.MONTHLY_REVIEW_METADATA, {
        householdId: gate.householdId,
        periodMonth,
      });
      return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
    }

    return { ok: true, state };
  } catch (error) {
    logPlanFailure(error, PLAN_OPERATION.MONTHLY_REVIEW_METADATA, {
      householdId: gate.householdId,
      periodMonth,
    });
    return { ok: false, code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN };
  }
}
