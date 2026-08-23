"use client";

import { useTranslations } from "next-intl";
import { UserGroupIcon } from "@hugeicons/core-free-icons";
import type { FinancialScope } from "@/modules/shared-kernel/application/financial-scope";
import { FINANCIAL_SCOPE } from "@/modules/shared-kernel/application/financial-scope";
import {
  OWNER_STATUS,
  type OwnerStatus,
} from "@/modules/shared-kernel/application/financial-ownership";
import { AppIcon, AppIconSize } from "@/shared/ui/app-icon";
import { Text } from "@/shared/ui/text";
import { cn } from "@/shared/utils/cn";

type Props = {
  financialScope: FinancialScope;
  isOwnedByMe: boolean;
  ownerStatus?: OwnerStatus;
  showExplanation?: boolean;
  compact?: boolean;
  /** Render as quiet hero-surface text instead of a surface pill. */
  onHero?: boolean;
};

export function FinancialOwnershipBadge({
  financialScope,
  isOwnedByMe,
  ownerStatus = OWNER_STATUS.ACTIVE,
  showExplanation = false,
  compact = false,
  onHero = false,
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
        tone={onHero ? undefined : "secondary"}
        className={cn(
          onHero
            ? "w-fit text-hero-muted"
            : compact
              ? "inline-flex w-fit items-center gap-(--space-1) font-medium"
              : "inline-flex w-fit items-center gap-(--space-1-5) rounded-full bg-primary-soft px-(--space-2-5) py-1 font-medium text-primary ring-1 ring-primary/15",
        )}
        data-testid="financial-ownership-badge"
        aria-label={label}
      >
        {onHero ? null : (
          <AppIcon
            icon={UserGroupIcon}
            size={AppIconSize.XS}
            decorative
            className="text-primary"
          />
        )}
        {label}
      </Text>
      {showExplanation && ownerStatus === OWNER_STATUS.FORMER ? (
        <Text
          size="sm"
          tone={onHero ? undefined : "secondary"}
          className={cn("max-w-prose", onHero && "text-hero-muted")}
          data-testid="financial-former-member-notice"
        >
          {t("formerMemberReadOnly")}
        </Text>
      ) : null}
    </div>
  );
}
