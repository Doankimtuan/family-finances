"use client";

import { useEffect, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "@/shared/ui/button";
import { StatusAlert } from "@/shared/ui/status-alert";
import type { MonthlyReview } from "@/modules/plan/application/queries/get-monthly-review";
import { MonthlyReviewStatus } from "@/modules/plan/application/plan-constants";
import {
  markMonthlyReviewReviewed,
  markMonthlyReviewViewed,
} from "./actions-review";

type ReviewSnapshot = NonNullable<MonthlyReview["review"]["snapshot"]>;

type Props = {
  periodMonth: string;
  reviewState: MonthlyReview["review"]["state"];
  snapshot: Pick<ReviewSnapshot, "cashFlow" | "jars" | "goals">;
};

export function MonthlyReviewActions({
  periodMonth,
  reviewState,
  snapshot,
}: Props) {
  const t = useTranslations("plan.monthlyReview");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (reviewState === MonthlyReviewStatus.NOT_STARTED) {
      void markMonthlyReviewViewed(periodMonth);
    }
  }, [periodMonth, reviewState]);

  function markReviewed() {
    startTransition(async () => {
      await markMonthlyReviewReviewed(periodMonth, {
        capturedAt: new Date().toISOString(),
        ...snapshot,
      });
      router.refresh();
    });
  }

  return reviewState === MonthlyReviewStatus.MARKED_REVIEWED ? (
    <StatusAlert
      variant="success"
      title={t("reviewed")}
      description={t("reviewedBody")}
    />
  ) : (
    <Button onPress={markReviewed} isDisabled={isPending} className="w-full">
      {isPending ? t("saving") : t("markReviewed")}
    </Button>
  );
}
