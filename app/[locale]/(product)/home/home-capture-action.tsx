"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { HOME_TEST_ID } from "@/modules/home/application/home-constants";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { useOnlineStatusClient } from "@/shared/hooks/use-online-status";
import { ButtonVariant } from "@/shared/ui/button";
import { AppIcon, AppIconSize } from "@/shared/ui/app-icon";
import { ACTION_ICONS, FINANCE_ICONS } from "@/shared/ui/icon-registry";
import { FloatingActionButton } from "@/shared/patterns/floating-action";

/** Persistent Home-level action for capturing a transaction or adding an account. */
export function HomeCaptureAction({ accountCount }: { accountCount: number }) {
  const t = useTranslations("home");
  const router = useRouter();
  const { online } = useOnlineStatusClient();
  const hasAccount = accountCount > 0;
  const actionLabel = t(hasAccount ? "capture" : "addAccount");

  return (
    <FloatingActionButton
      variant={ButtonVariant.PRIMARY}
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
    </FloatingActionButton>
  );
}
