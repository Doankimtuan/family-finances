"use client";

import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "@/shared/ui/button";
import { StatusAlert } from "@/shared/ui/status-alert";
import type { MonthlyReview } from "@/modules/plan/application/queries/get-monthly-review";
import { MonthlyReviewStatus } from "@/modules/plan/application/plan-constants";
import { useOnlineStatusClient } from "@/shared/hooks/use-online-status";
import {
  CLIENT_ACTION_ERROR_CODE,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import {
  markMonthlyReviewReviewed,
  markMonthlyReviewViewed,
} from "./actions-review";

type ReviewSnapshot = NonNullable<MonthlyReview["review"]["snapshot"]>;
type ErrorCode =
  ProductActionErrorCode | typeof CLIENT_ACTION_ERROR_CODE.OFFLINE;

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
  const { online } = useOnlineStatusClient();
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (reviewState === MonthlyReviewStatus.NOT_STARTED) {
      void markMonthlyReviewViewed(periodMonth);
    }
  }, [periodMonth, reviewState]);

  function markReviewed() {
    setErrorCode(null);
    if (!online) {
      setErrorCode(CLIENT_ACTION_ERROR_CODE.OFFLINE);
      return;
    }
    startTransition(async () => {
      const result = await markMonthlyReviewReviewed(periodMonth, {
        capturedAt: new Date().toISOString(),
        ...snapshot,
      });
      if (!result.ok) {
        setErrorCode(result.code);
        return;
      }
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
    <div className="flex flex-col gap-(--space-2)">
      {errorCode ? (
        <StatusAlert
          variant="danger"
          title={t("markReviewed")}
          description={t(`errors.${errorCode}`)}
        />
      ) : null}
      <Button
        onPress={markReviewed}
        isDisabled={isPending || !online}
        className="w-full"
      >
        {isPending ? t("saving") : t("markReviewed")}
      </Button>
    </div>
  );
}
