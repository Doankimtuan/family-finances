"use client";

import { useTranslations } from "next-intl";
import type { FinancialScope } from "@/modules/shared-kernel/application/financial-scope";
import { FINANCIAL_SCOPE } from "@/modules/shared-kernel/application/financial-scope";
import {
  OWNER_STATUS,
  type OwnerStatus,
} from "@/modules/shared-kernel/application/financial-ownership";
import { Text } from "@/shared/ui/text";
import { cn } from "@/shared/utils/cn";

type Props = {
  financialScope: FinancialScope;
  isOwnedByMe: boolean;
  ownerStatus?: OwnerStatus;
  showExplanation?: boolean;
  compact?: boolean;
};

export function FinancialOwnershipBadge({
  financialScope,
  isOwnedByMe,
  ownerStatus = OWNER_STATUS.ACTIVE,
  showExplanation = false,
  compact = false,
}: Props) {
  const t = useTranslations("money.ownership");
  let label = t("household");
  if (financialScope === FINANCIAL_SCOPE.PERSONAL) {
    label =
      ownerStatus === OWNER_STATUS.FORMER
        ? t("personalFormerMember")
        : isOwnedByMe
          ? t("personalYou")
          : t("personalPartner");
  }

  return (
    <div className="flex flex-col items-start gap-(--space-2)">
      <Text
        size="xs"
        tone="secondary"
        className={cn(
          compact
            ? "w-fit"
            : "inline-flex w-fit items-center rounded-full border border-border-subtle bg-surface-muted px-(--space-2) py-1",
        )}
        data-testid="financial-ownership-badge"
        aria-label={label}
      >
        {label}
      </Text>
      {showExplanation && ownerStatus === OWNER_STATUS.FORMER ? (
        <Text
          size="sm"
          tone="secondary"
          className="max-w-prose"
          data-testid="financial-former-member-notice"
        >
          {t("formerMemberReadOnly")}
        </Text>
      ) : null}
    </div>
  );
}
