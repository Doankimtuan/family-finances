"use client";

import { useTranslations } from "next-intl";
import { Plus } from "@phosphor-icons/react";
import { useRouter } from "@/i18n/navigation";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { QuickAction } from "@/shared/patterns/quick-action";
import { useOnlineStatusClient } from "@/shared/hooks/use-online-status";

/** Primary capture CTA on Home (flow.daily-capture). */
export function HomeCaptureAction() {
  const t = useTranslations("home");
  const router = useRouter();
  const { online } = useOnlineStatusClient();

  return (
    <QuickAction
      label={t("capture")}
      icon={<Plus size={20} weight="bold" />}
      isDisabled={!online}
      data-testid="home-capture"
      onPress={() => router.push(APP_PATH.MONEY_ADD)}
    />
  );
}
