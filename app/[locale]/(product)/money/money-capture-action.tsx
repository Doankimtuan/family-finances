"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { useOnlineStatusClient } from "@/shared/hooks/use-online-status";
import { ButtonVariant } from "@/shared/ui/button";
import { AppIcon, AppIconSize } from "@/shared/ui/app-icon";
import { ACTION_ICONS } from "@/shared/ui/icon-registry";
import { FloatingActionButton } from "@/shared/patterns/floating-action";

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
    <FloatingActionButton
      variant={ButtonVariant.PRIMARY}
      isDisabled={!online}
      data-testid={testId}
      onPress={() => router.push(APP_PATH.MONEY_ADD)}
    >
      <AppIcon icon={ACTION_ICONS.add} size={AppIconSize.SM} />
      <span>{online ? t("capture") : t("captureOffline")}</span>
    </FloatingActionButton>
  );
}
