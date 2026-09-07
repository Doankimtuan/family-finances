"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { FloatingAction } from "@/shared/patterns/floating-action";
import { AppIcon, AppIconSize } from "@/shared/ui/app-icon";
import { ACTION_ICONS } from "@/shared/ui/icon-registry";
import { Button } from "@/shared/ui/button";

/** Canonical create quick action for the Investments list (FloatingAction pill). */
export function InvestmentCreateAction() {
  const t = useTranslations("money.investments.overview");
  const router = useRouter();

  return (
    <FloatingAction>
      <Button
        className="pointer-events-auto min-h-(--floating-action-size) shrink-0 gap-(--space-2) rounded-full px-(--space-4) shadow-(--elevation-2)"
        onPress={() => router.push(APP_PATH.MONEY_INVESTMENTS_NEW)}
        data-testid="investment-opening-link"
      >
        <AppIcon icon={ACTION_ICONS.add} size={AppIconSize.SM} />
        <span>{t("addOpening")}</span>
      </Button>
    </FloatingAction>
  );
}
