"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { QuickAction } from "@/shared/patterns/quick-action";
import { useOnlineStatusClient } from "@/shared/hooks/use-online-status";
import { AppIcon, AppIconSize } from "@/shared/ui/app-icon";
import { ACTION_ICONS } from "@/shared/ui/icon-registry";

/**
 * Contextual capture entry on account detail. One primary action per screen:
 * the shared capture destination also covers transfers, so no second CTA is
 * added here. Offline shows the reconnect label instead of a silent disable.
 */
export function AccountQuickCapture() {
  const t = useTranslations("money");
  const router = useRouter();
  const { online } = useOnlineStatusClient();

  return (
    <QuickAction
      label={online ? t("capture") : t("captureOffline")}
      icon={<AppIcon icon={ACTION_ICONS.add} size={AppIconSize.SM} />}
      isDisabled={!online}
      data-testid="account-quick-capture"
      onPress={() => router.push(APP_PATH.MONEY_ADD)}
    />
  );
}
