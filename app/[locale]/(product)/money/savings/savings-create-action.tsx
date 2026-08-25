"use client";

import { useTranslations } from "next-intl";
import { AppIcon, AppIconSize } from "@/shared/ui/app-icon";
import { Button } from "@/shared/ui/button";
import { ACTION_ICONS } from "@/shared/ui/icon-registry";
import { FloatingAction } from "@/shared/patterns/floating-action";
import { moneySavingsNewPath } from "@/modules/tenancy/application/app-path";
import { useRouter } from "@/i18n/navigation";

/** Canonical create quick action for the Savings list (FloatingAction pill). */
export function SavingsCreateAction() {
  const t = useTranslations("money.savingsPage");
  const router = useRouter();
  return (
    <FloatingAction>
      <Button
        className="pointer-events-auto min-h-(--floating-action-size) shrink-0 gap-(--space-2) rounded-full px-(--space-4) shadow-(--elevation-2)"
        onPress={() => router.push(moneySavingsNewPath())}
        data-testid="savings-add-open"
      >
        <AppIcon icon={ACTION_ICONS.add} size={AppIconSize.SM} />
        <span>{t("add")}</span>
      </Button>
    </FloatingAction>
  );
}
