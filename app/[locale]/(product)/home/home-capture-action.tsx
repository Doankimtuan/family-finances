"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { HOME_TEST_ID } from "@/modules/home/application/home-constants";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { useOnlineStatusClient } from "@/shared/hooks/use-online-status";
import { Button, ButtonVariant } from "@/shared/ui/button";
import { AppIcon, AppIconSize } from "@/shared/ui/app-icon";
import { ACTION_ICONS, FINANCE_ICONS } from "@/shared/ui/icon-registry";

/** Contextual daily-capture action placed within the current financial position. */
export function HomeCaptureAction({ accountCount }: { accountCount: number }) {
  const t = useTranslations("home");
  const router = useRouter();
  const { online } = useOnlineStatusClient();
  const hasAccount = accountCount > 0;

  return (
    <Button
      variant={hasAccount ? ButtonVariant.TERTIARY : ButtonVariant.PRIMARY}
      className="min-h-11 shrink-0 rounded-(--radius-control) px-(--space-3) text-sm"
      isDisabled={!online}
      data-testid={
        hasAccount ? HOME_TEST_ID.CAPTURE_ACTION : HOME_TEST_ID.ACCOUNT_ACTION
      }
      onPress={() =>
        router.push(hasAccount ? APP_PATH.MONEY_ADD : APP_PATH.MONEY)
      }
    >
      <AppIcon
        icon={hasAccount ? ACTION_ICONS.add : FINANCE_ICONS.account}
        size={AppIconSize.SM}
      />
      {t(hasAccount ? "capture" : "addAccount")}
    </Button>
  );
}
