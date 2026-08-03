"use client";

import { useTranslations } from "next-intl";
import { MutationOfflineBanner } from "@/shared/patterns/mutation-offline-banner";

/** Fail-closed offline banner for Inbox mutations (AC-018 / BR-15). */
export function InboxOfflineBanner() {
  const t = useTranslations("inbox");

  return (
    <MutationOfflineBanner
      title={t("offlineTitle")}
      description={t("offlineBody")}
      data-testid="inbox-offline-banner"
    />
  );
}
