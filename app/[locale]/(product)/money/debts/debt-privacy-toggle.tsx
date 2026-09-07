"use client";

import { useTranslations } from "next-intl";
import { FinancialPrivacyToggle } from "@/shared/patterns/financial-privacy-toggle";

type DebtPrivacyToggleProps = {
  testId: string;
};

/**
 * Same hide/show store as Home and Money. Debt amounts already mask through
 * FinancialValue; this only exposes the control on hero surfaces.
 */
export function DebtPrivacyToggle({ testId }: DebtPrivacyToggleProps) {
  const t = useTranslations("money");

  return (
    <FinancialPrivacyToggle
      hideLabel={t("financialPrivacy.hide")}
      showLabel={t("financialPrivacy.show")}
      testId={testId}
    />
  );
}
