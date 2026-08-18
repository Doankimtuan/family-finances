"use client";

import { useTranslations } from "next-intl";
import type { FinancialScope } from "@/modules/shared-kernel/application/financial-scope";
import { FINANCIAL_SCOPE } from "@/modules/shared-kernel/application/financial-scope";
import { Text } from "@/shared/ui/text";

type Props = {
  financialScope: FinancialScope;
  isOwnedByMe: boolean;
};

export function FinancialOwnershipBadge({
  financialScope,
  isOwnedByMe,
}: Props) {
  const t = useTranslations("money.ownership");
  const label =
    financialScope === FINANCIAL_SCOPE.HOUSEHOLD
      ? t("household")
      : isOwnedByMe
        ? t("personalYou")
        : t("personalPartner");

  return (
    <Text
      size="xs"
      tone="secondary"
      className="inline-flex w-fit items-center rounded-full border border-border-subtle bg-surface-muted px-(--space-2) py-1"
      data-testid="financial-ownership-badge"
    >
      {label}
    </Text>
  );
}
