"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { HOME_TEST_ID } from "@/modules/home/application/home-constants";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { EmptyState } from "@/shared/patterns/empty-state";
import { QuickAction } from "@/shared/patterns/quick-action";
import { Card } from "@/shared/patterns/card";
import { useOnlineStatusClient } from "@/shared/hooks/use-online-status";
import { AppIcon } from "@/shared/ui/app-icon";
import { NAVIGATION_ICONS, FINANCE_ICONS } from "@/shared/ui/icon-registry";

/** Day-0 setup actions ordered by prerequisite and urgency. */
export function HomeDayZeroTrio() {
  const t = useTranslations("home");
  const router = useRouter();
  const { online } = useOnlineStatusClient();

  return (
    <Card
      tone="soft"
      className="gap-(--space-3) p-(--space-4)"
      data-testid={HOME_TEST_ID.DAY_ZERO}
    >
      <EmptyState
        title={t("dayZero.title")}
        description={t("dayZero.description")}
        className="flex-none py-(--space-4)"
      />
      <QuickAction
        label={t("addAccount")}
        icon={<AppIcon icon={FINANCE_ICONS.account} size="sm" />}
        data-testid={HOME_TEST_ID.DAY_ZERO_ACCOUNT}
        isDisabled={!online}
        onPress={() => router.push(APP_PATH.MONEY)}
      />
      <QuickAction
        label={t("dayZero.setupPlan")}
        icon={<AppIcon icon={NAVIGATION_ICONS.plan} size="sm" />}
        variant="secondary"
        data-testid={HOME_TEST_ID.DAY_ZERO_PLAN}
        onPress={() => router.push(APP_PATH.PLAN)}
      />
      <QuickAction
        label={t("dayZero.invite")}
        icon={<AppIcon icon={NAVIGATION_ICONS.together} size="sm" />}
        variant="ghost"
        data-testid={HOME_TEST_ID.DAY_ZERO_INVITE}
        onPress={() => router.push(APP_PATH.INVITATIONS)}
      />
    </Card>
  );
}
