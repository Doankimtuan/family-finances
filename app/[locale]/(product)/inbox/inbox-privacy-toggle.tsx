"use client";

import { useTranslations } from "next-intl";
import {
  FinancialPrivacyToggle,
  FinancialPrivacyToggleTone,
} from "@/shared/patterns/financial-privacy-toggle";

type InboxPrivacyToggleProps = {
  testId: string;
  tone?: FinancialPrivacyToggleTone;
};

/**
 * Same hide/show store as Home, Money, and Plan. Inbox amounts already mask
 * through FinancialValue; this exposes the existing control for Inbox rows.
 */
export function InboxPrivacyToggle({
  testId,
  tone = FinancialPrivacyToggleTone.SURFACE,
}: InboxPrivacyToggleProps) {
  const t = useTranslations("inbox");

  return (
    <FinancialPrivacyToggle
      hideLabel={t("financialPrivacy.hide")}
      showLabel={t("financialPrivacy.show")}
      testId={testId}
      tone={tone}
    />
  );
}
