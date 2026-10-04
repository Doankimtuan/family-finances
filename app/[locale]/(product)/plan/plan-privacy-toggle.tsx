"use client";

import { useTranslations } from "next-intl";
import {
  FinancialPrivacyToggle,
  FinancialPrivacyToggleTone,
} from "@/shared/patterns/financial-privacy-toggle";

type PlanPrivacyToggleProps = {
  testId: string;
  onSurface?: boolean;
  className?: string;
};

/**
 * Same hide/show store as Home and Money. Plan amounts already mask through
 * FinancialValue; this only exposes the control on hero surfaces.
 */
export function PlanPrivacyToggle({
  testId,
  onSurface,
  className,
}: PlanPrivacyToggleProps) {
  const t = useTranslations("plan");

  return (
    <FinancialPrivacyToggle
      hideLabel={t("financialPrivacy.hide")}
      showLabel={t("financialPrivacy.show")}
      testId={testId}
      className={className}
      tone={
        onSurface
          ? FinancialPrivacyToggleTone.SURFACE
          : FinancialPrivacyToggleTone.HERO
      }
    />
  );
}
