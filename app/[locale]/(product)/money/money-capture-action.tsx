"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { useOnlineStatusClient } from "@/shared/hooks/use-online-status";
import { Button, ButtonVariant } from "@/shared/ui/button";
import { AppIcon, AppIconSize } from "@/shared/ui/app-icon";
import { ACTION_ICONS } from "@/shared/ui/icon-registry";

type Props = {
  testId?: string;
};

/**
 * Money-level capture pill (canonical FloatingAction quick action). Matches the
 * Home capture pill so Add Transaction stays one thumb-reach away on both hub
 * screens; disabled only while offline.
 */
export function MoneyCaptureAction({ testId = "money-capture" }: Props) {
  const t = useTranslations("money");
  const router = useRouter();
  const { online } = useOnlineStatusClient();

  return (
    <Button
      variant={ButtonVariant.PRIMARY}
      className="pointer-events-auto min-h-(--floating-action-size) shrink-0 gap-(--space-2) rounded-full px-(--space-4) shadow-(--elevation-2)"
      isDisabled={!online}
      data-testid={testId}
      onPress={() => router.push(APP_PATH.MONEY_ADD)}
    >
      <AppIcon icon={ACTION_ICONS.add} size={AppIconSize.SM} />
      <span>{online ? t("capture") : t("captureOffline")}</span>
    </Button>
  );
}
