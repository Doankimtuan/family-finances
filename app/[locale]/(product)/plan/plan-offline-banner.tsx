"use client";

import { useTranslations } from "next-intl";
import { MutationOfflineBanner } from "@/shared/patterns/mutation-offline-banner";

/** Fail-closed offline banner for Plan jar mutations (AC-018 / BR-15). */
export function PlanOfflineBanner() {
  const t = useTranslations("plan.jars");

  return (
    <MutationOfflineBanner
      title={t("offlineTitle")}
      description={t("offlineBody")}
      data-testid="plan-offline-banner"
    />
  );
}
