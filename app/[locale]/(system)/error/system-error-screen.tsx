"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { ErrorState } from "@/shared/patterns/error-state";
import { Button } from "@/shared/ui/button";

/**
 * system.error — unhandled / recoverable shell (ST-E08-001).
 */
export function SystemErrorScreen({ onRetry }: { onRetry?: () => void }) {
  const t = useTranslations("system.error");
  const router = useRouter();

  return (
    <div data-testid="system-error">
      <ErrorState
        title={t("title")}
        description={t("body")}
        action={
          <div className="flex w-full max-w-[20rem] flex-col gap-(--space-3)">
            <Button
              variant="primary"
              className="min-h-11 w-full"
              data-testid="system-error-retry"
              onPress={() => {
                if (onRetry) {
                  onRetry();
                  return;
                }
                router.refresh();
              }}
            >
              {t("retry")}
            </Button>
            <Button
              variant="secondary"
              className="min-h-11 w-full"
              data-testid="system-error-home"
              onPress={() => router.push(APP_PATH.HOME)}
            >
              {t("home")}
            </Button>
          </div>
        }
      />
    </div>
  );
}
