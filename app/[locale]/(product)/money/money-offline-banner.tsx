"use client";

import { useTranslations } from "next-intl";
import { MutationOfflineBanner } from "@/shared/patterns/mutation-offline-banner";

/**
 * Fail-closed offline banner for Money surfaces (AC-018 / BR-15).
 */
export function MoneyOfflineBanner({
  title,
  description,
}: {
  title?: string;
  description?: string;
}) {
  const t = useTranslations("money");

  return (
    <MutationOfflineBanner
      title={title ?? t("offlineTitle")}
      description={description ?? t("offlineBody")}
      data-testid="money-offline-banner"
    />
  );
}
