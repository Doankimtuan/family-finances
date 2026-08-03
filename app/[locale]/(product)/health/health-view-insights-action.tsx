"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { Button } from "@/shared/ui/button";

export function HealthViewInsightsAction() {
  const t = useTranslations("health");
  const router = useRouter();

  return (
    <Button
      variant="primary"
      className="min-h-11 w-full"
      data-testid="health-view-insights"
      onPress={() => router.push(APP_PATH.HEALTH_INSIGHTS)}
    >
      {t("viewInsights")}
    </Button>
  );
}
