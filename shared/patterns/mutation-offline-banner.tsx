"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { StatusAlert } from "@/shared/ui/status-alert";
import { useOnlineStatusClient } from "@/shared/hooks/use-online-status";

export type MutationOfflineBannerProps = {
  title: string;
  description: string;
  "data-testid"?: string;
};

/**
 * Shared fail-closed offline banner with escalate link to system.offline (AC-018 / BR-15).
 */
export function MutationOfflineBanner({
  title,
  description,
  "data-testid": testId,
}: MutationOfflineBannerProps) {
  const t = useTranslations("system.offline");
  const { online, ready } = useOnlineStatusClient();

  if (!ready || online) {
    return null;
  }

  return (
    <div data-testid={testId ?? "mutation-offline-banner"}>
      <StatusAlert variant="warning" title={title} description={description} />
      <Link
        href={APP_PATH.OFFLINE}
        className="mt-(--space-2) inline-flex min-h-11 items-center text-sm font-medium text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        data-testid="offline-escalate"
      >
        {t("escalate")}
      </Link>
    </div>
  );
}
