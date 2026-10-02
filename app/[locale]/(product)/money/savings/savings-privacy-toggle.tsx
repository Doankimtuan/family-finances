"use client";

import { useTranslations } from "next-intl";
import {
  FinancialPrivacyToggle,
  FinancialPrivacyToggleTone,
} from "@/shared/patterns/financial-privacy-toggle";

/**
 * Same hide/show store as Home and Money. Savings amounts already mask
 * through FinancialValue; this only exposes the control on the overview hero.
 */
export function SavingsPrivacyToggle({ onHero = true }: { onHero?: boolean }) {
  const t = useTranslations("money");

  return (
    <FinancialPrivacyToggle
      hideLabel={t("financialPrivacy.hide")}
      showLabel={t("financialPrivacy.show")}
      testId="savings-financial-privacy-toggle"
      tone={
        onHero
          ? FinancialPrivacyToggleTone.HERO
          : FinancialPrivacyToggleTone.SURFACE
      }
    />
  );
}
