"use client";

import { useTranslations } from "next-intl";
import { Plus } from "@phosphor-icons/react";
import { useRouter } from "@/i18n/navigation";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { QuickAction } from "@/shared/patterns/quick-action";
import { useOnlineStatusClient } from "@/shared/hooks/use-online-status";

/**
 * Capture CTA — online required (AC-018). Full form is ST-E04-002.
 */
export function MoneyCaptureAction() {
  const t = useTranslations("money");
  const router = useRouter();
  const { online } = useOnlineStatusClient();

  return (
    <QuickAction
      label={online ? t("capture") : t("captureOffline")}
      icon={<Plus size={20} weight="bold" />}
      isDisabled={!online}
      data-testid="money-capture"
      onPress={() => router.push(APP_PATH.MONEY_ADD)}
    />
  );
}
