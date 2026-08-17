"use server";

import {
  MonthlyReviewStatus,
  monthlyReviewMetadataInputSchema,
  updateMonthlyReviewMetadata,
} from "@/modules/plan/application";
import { PRODUCT_ACTION_ERROR_CODE } from "@/modules/tenancy/application/product-action-error";
import { revalidateMonthlyReviewViews } from "@/app/mutation-revalidation";

export async function markMonthlyReviewViewed(periodMonth: string) {
  const parsed = monthlyReviewMetadataInputSchema.safeParse({
    periodMonth,
    state: MonthlyReviewStatus.VIEWED,
  });
  if (!parsed.success) {
    return { ok: false as const, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
  }

  const result = await updateMonthlyReviewMetadata(parsed.data);
  if (result.ok) revalidateMonthlyReviewViews();
  return result;
}

export async function markMonthlyReviewReviewed(
  periodMonth: string,
  snapshot: unknown,
) {
  const parsed = monthlyReviewMetadataInputSchema.safeParse({
    periodMonth,
    state: MonthlyReviewStatus.MARKED_REVIEWED,
    snapshot,
  });
  if (!parsed.success) {
    return { ok: false as const, code: PRODUCT_ACTION_ERROR_CODE.INVALID };
  }

  const result = await updateMonthlyReviewMetadata(parsed.data);
  if (result.ok) revalidateMonthlyReviewViews();
  return result;
}
