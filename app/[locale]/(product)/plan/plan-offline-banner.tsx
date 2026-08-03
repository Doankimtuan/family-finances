"use client";

import { useTranslations } from "next-intl";
import { StatusAlert } from "@/shared/ui/status-alert";
import { useOnlineStatusClient } from "@/shared/hooks/use-online-status";

/** Fail-closed offline banner for Plan jar mutations (AC-018 / BR-15). */
export function PlanOfflineBanner() {
  const t = useTranslations("plan.jars");
  const { online, ready } = useOnlineStatusClient();

  if (!ready || online) {
    return null;
  }

  return (
    <div data-testid="plan-offline-banner">
      <StatusAlert
        variant="warning"
        title={t("offlineTitle")}
        description={t("offlineBody")}
      />
    </div>
  );
}
