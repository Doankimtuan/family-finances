"use client";

import { useTranslations } from "next-intl";
import { UserGroupIcon, PiggyBankIcon, PlusSignIcon } from "@hugeicons/core-free-icons";
import { useRouter } from "@/i18n/navigation";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { EmptyState } from "@/shared/patterns/empty-state";
import { QuickAction } from "@/shared/patterns/quick-action";
import { useOnlineStatusClient } from "@/shared/hooks/use-online-status";
import { AppIcon } from "@/shared/ui/app-icon";

/** Day-0 empty trio — invite / set up plan / add expense. */
export function HomeDayZeroTrio() {
  const t = useTranslations("home");
  const router = useRouter();
  const { online } = useOnlineStatusClient();

  return (
    <div
      className="flex flex-col gap-(--space-3) rounded-xl border border-border-subtle bg-surface p-(--space-4)"
      data-testid="home-day-zero"
    >
      <EmptyState
        title={t("dayZero.title")}
        description={t("dayZero.description")}
        className="flex-none py-(--space-4)"
      />
      <QuickAction
        label={t("dayZero.invite")}
        icon={<AppIcon icon={UserGroupIcon} size="sm" />}
        data-testid="home-day-zero-invite"
        onPress={() => router.push(APP_PATH.INVITATIONS)}
      />
      <QuickAction
        label={t("dayZero.setupPlan")}
        icon={<AppIcon icon={PiggyBankIcon} size="sm" />}
        data-testid="home-day-zero-plan"
        onPress={() => router.push(APP_PATH.PLAN)}
      />
      <QuickAction
        label={t("dayZero.addExpense")}
        icon={<AppIcon icon={PlusSignIcon} size="sm" />}
        isDisabled={!online}
        data-testid="home-day-zero-capture"
        onPress={() => router.push(APP_PATH.MONEY_ADD)}
      />
    </div>
  );
}
