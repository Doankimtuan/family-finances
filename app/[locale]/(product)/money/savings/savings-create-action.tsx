"use client";

import { useTranslations } from "next-intl";
import {
  FloatingAction,
  FloatingActionButton,
} from "@/shared/patterns/floating-action";
import { AppIcon, AppIconSize } from "@/shared/ui/app-icon";
import { ACTION_ICONS } from "@/shared/ui/icon-registry";
import { moneySavingsNewPath } from "@/modules/tenancy/application/app-path";
import { useRouter } from "@/i18n/navigation";

/** Canonical create quick action for the Savings list (FloatingAction pill). */
export function SavingsCreateAction() {
  const t = useTranslations("money.savingsPage");
  const router = useRouter();
  return (
    <FloatingAction>
      <FloatingActionButton
        onPress={() => router.push(moneySavingsNewPath())}
        data-testid="savings-add-open"
      >
        <AppIcon icon={ACTION_ICONS.add} size={AppIconSize.SM} />
        <span>{t("add")}</span>
      </FloatingActionButton>
    </FloatingAction>
  );
}
