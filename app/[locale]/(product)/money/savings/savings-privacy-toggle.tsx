"use client";

import { useTranslations } from "next-intl";
import { FinancialPrivacyToggle } from "@/shared/patterns/financial-privacy-toggle";

/**
 * Same hide/show store as Home and Money. Savings amounts already mask
 * through FinancialValue; this only exposes the control on the overview hero.
 */
export function SavingsPrivacyToggle() {
  const t = useTranslations("money");

  return (
    <FinancialPrivacyToggle
      hideLabel={t("financialPrivacy.hide")}
      showLabel={t("financialPrivacy.show")}
      testId="savings-financial-privacy-toggle"
    />
  );
}
