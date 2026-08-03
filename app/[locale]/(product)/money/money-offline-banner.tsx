"use client";

import { useTranslations } from "next-intl";
import { MutationOfflineBanner } from "@/shared/patterns/mutation-offline-banner";

/**
 * Fail-closed offline banner for Money surfaces (AC-018 / BR-15).
 */
export function MoneyOfflineBanner() {
  const t = useTranslations("money");

  return (
    <MutationOfflineBanner
      title={t("offlineTitle")}
      description={t("offlineBody")}
      data-testid="money-offline-banner"
    />
  );
}
