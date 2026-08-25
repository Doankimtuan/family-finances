"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { HOME_TEST_ID } from "@/modules/home/application/home-constants";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { useOnlineStatusClient } from "@/shared/hooks/use-online-status";
import { Button, ButtonVariant } from "@/shared/ui/button";
import { AppIcon, AppIconSize } from "@/shared/ui/app-icon";
import { ACTION_ICONS, FINANCE_ICONS } from "@/shared/ui/icon-registry";

/** Persistent Home-level action for capturing a transaction or adding an account. */
export function HomeCaptureAction({ accountCount }: { accountCount: number }) {
  const t = useTranslations("home");
  const router = useRouter();
  const { online } = useOnlineStatusClient();
  const hasAccount = accountCount > 0;
  const actionLabel = t(hasAccount ? "capture" : "addAccount");

  return (
    <Button
      variant={ButtonVariant.PRIMARY}
      className="pointer-events-auto min-h-(--floating-action-size) shrink-0 gap-(--space-2) rounded-full px-(--space-4) shadow-(--elevation-2)"
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
      <span>{actionLabel}</span>
    </Button>
  );
}
