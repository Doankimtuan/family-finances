"use client";

import { useTranslations } from "next-intl";
import { FinancialPrivacyToggle } from "@/shared/patterns/financial-privacy-toggle";

/**
 * Same hide/show store as Home and Money. Account detail only needs the
 * control; Balance / Amount already mask through FinancialValue.
 */
export function AccountDetailPrivacyToggle() {
  const t = useTranslations("money");

  return (
    <FinancialPrivacyToggle
      hideLabel={t("financialPrivacy.hide")}
      showLabel={t("financialPrivacy.show")}
      testId="account-financial-privacy-toggle"
    />
  );
}
