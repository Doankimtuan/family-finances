"use client";

import { useTranslations } from "next-intl";
import {
  FinancialPrivacyToggle,
  FinancialPrivacyToggleTone,
} from "@/shared/patterns/financial-privacy-toggle";

type InvestmentPrivacyToggleProps = {
  testId: string;
  onSurface?: boolean;
};

/**
 * Same hide/show store as Home and Money. Investment amounts already mask
 * through FinancialValue; this only exposes the control on hero surfaces.
 */
export function InvestmentPrivacyToggle({
  testId,
  onSurface = false,
}: InvestmentPrivacyToggleProps) {
  const t = useTranslations("money");

  return (
    <FinancialPrivacyToggle
      hideLabel={t("financialPrivacy.hide")}
      showLabel={t("financialPrivacy.show")}
      testId={testId}
      tone={
        onSurface
          ? FinancialPrivacyToggleTone.SURFACE
          : FinancialPrivacyToggleTone.HERO
      }
    />
  );
}
