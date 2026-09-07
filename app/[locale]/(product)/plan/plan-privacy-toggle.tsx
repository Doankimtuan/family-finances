"use client";

import { useTranslations } from "next-intl";
import { FinancialPrivacyToggle } from "@/shared/patterns/financial-privacy-toggle";

type PlanPrivacyToggleProps = {
  testId: string;
};

/**
 * Same hide/show store as Home and Money. Plan amounts already mask through
 * FinancialValue; this only exposes the control on hero surfaces.
 */
export function PlanPrivacyToggle({ testId }: PlanPrivacyToggleProps) {
  const t = useTranslations("plan");

  return (
    <FinancialPrivacyToggle
      hideLabel={t("financialPrivacy.hide")}
      showLabel={t("financialPrivacy.show")}
      testId={testId}
    />
  );
}
