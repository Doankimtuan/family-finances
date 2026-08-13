"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { WifiOff01Icon } from "@hugeicons/core-free-icons";
import { useRouter } from "@/i18n/navigation";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { SystemShell } from "@/shared/patterns/system-shell";
import { Button } from "@/shared/ui/button";
import { useOnlineStatusClient } from "@/shared/hooks/use-online-status";
import { AppIcon } from "@/shared/ui/app-icon";

/**
 * system.offline — mutations fail closed (AC-018 / BR-15).
 */
export function SystemOfflineScreen() {
  const t = useTranslations("system.offline");
  const router = useRouter();
  const { online } = useOnlineStatusClient();
  const [retryAttemptedOffline, setRetryAttemptedOffline] = useState(false);

  const showStillOffline = retryAttemptedOffline && !online;

  return (
    <SystemShell
      data-testid="system-offline"
      title={t("title")}
      description={showStillOffline ? t("stillOffline") : t("body")}
      icon={
        <AppIcon icon={WifiOff01Icon} size="xl" className="text-warning" />
      }
      actions={
        <>
          <Button
            variant="primary"
            className="min-h-11 w-full"
            data-testid="system-offline-retry"
            onPress={() => {
              if (online) {
                router.back();
                return;
              }
              setRetryAttemptedOffline(true);
            }}
          >
            {t("retry")}
          </Button>
          <Button
            variant="secondary"
            className="min-h-11 w-full"
            data-testid="system-offline-readonly"
            onPress={() => router.push(APP_PATH.HOME)}
          >
            {t("readOnly")}
          </Button>
        </>
      }
    />
  );
}
