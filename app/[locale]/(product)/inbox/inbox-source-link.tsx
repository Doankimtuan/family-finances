import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  APP_PATH,
  moneyDebtPath,
  moneyLoanPath,
  moneySavingsPath,
  moneyTransactionPath,
  planJarPath,
} from "@/modules/tenancy/application/app-path";
import {
  InboxItemKind,
  InboxSourceType,
  INBOX_TEST_ID,
  isJarResolvableKind,
} from "@/modules/inbox/application/inbox-constants";
import type { InboxReviewItem } from "@/modules/inbox/application/inbox-types";
import { AppIcon, AppIconSize } from "@/shared/ui/app-icon";
import { ACTION_ICONS } from "@/shared/ui/icon-registry";
import { INBOX_META_ROW_CLASS } from "./inbox-chrome";

type SourceTarget = {
  href: string;
  labelKey:
    | "viewSourceTransaction"
    | "viewSourceSavings"
    | "viewSourceLoan"
    | "viewSourceDebt"
    | "viewSourcePlan";
};

/**
 * Resolve a source-domain deep link when source type/id are known.
 * Omit rather than invent destinations. Canonical kinds only (Prompt 13A).
 */
export function resolveInboxSourceTarget(
  item: InboxReviewItem,
): SourceTarget | null {
  if (!item.kind) return null;

  if (item.kind === InboxItemKind.LOAN_PAYMENT_ATTENTION) {
    const loanId =
      item.typed?.type === InboxItemKind.LOAN_PAYMENT_ATTENTION
        ? item.typed.payload.loanId
        : item.sourceId;
    return { href: moneyLoanPath(loanId), labelKey: "viewSourceLoan" };
  }

  if (item.kind === InboxItemKind.DEBT_PAYMENT_ATTENTION) {
    const debtId =
      item.typed?.type === InboxItemKind.DEBT_PAYMENT_ATTENTION
        ? item.typed.payload.debtId
        : item.sourceId;
    return { href: moneyDebtPath(debtId), labelKey: "viewSourceDebt" };
  }

  if (item.kind === InboxItemKind.EMI_COMPLETE) {
    if (item.typed?.type === InboxItemKind.EMI_COMPLETE) {
      if (item.typed.payload.loanId) {
        return {
          href: moneyLoanPath(item.typed.payload.loanId),
          labelKey: "viewSourceLoan",
        };
      }
      if (item.typed.payload.debtId) {
        return {
          href: moneyDebtPath(item.typed.payload.debtId),
          labelKey: "viewSourceDebt",
        };
      }
    }
  }

  if (
    item.sourceType === InboxSourceType.TRANSACTION ||
    isJarResolvableKind(item.kind)
  ) {
    if (!item.sourceId) return null;
    return {
      href: moneyTransactionPath(item.sourceId),
      labelKey: "viewSourceTransaction",
    };
  }

  if (item.sourceType === InboxSourceType.GUIDED) {
    const savingId =
      item.typed?.type === InboxItemKind.SAVINGS_MATURITY ||
      item.typed?.type === InboxItemKind.EARLY_WITHDRAWAL_CONFIRMATION
        ? item.typed.payload.savingId
        : item.kind === InboxItemKind.SAVINGS_MATURITY ||
            item.kind === InboxItemKind.EARLY_WITHDRAWAL_CONFIRMATION
          ? item.sourceId
          : null;
    if (!savingId) return null;
    return {
      href: moneySavingsPath(savingId),
      labelKey: "viewSourceSavings",
    };
  }

  if (
    item.sourceType === InboxSourceType.PLAN_MOVEMENT ||
    item.kind === InboxItemKind.EMERGENCY_DECLARATION
  ) {
    const jarId =
      item.typed?.type === InboxItemKind.EMERGENCY_DECLARATION
        ? (item.typed.payload.sourceJarId ?? item.typed.payload.targetJarId)
        : null;
    if (jarId) {
      return { href: planJarPath(jarId), labelKey: "viewSourcePlan" };
    }
    return { href: APP_PATH.PLAN, labelKey: "viewSourcePlan" };
  }

  return null;
}

/**
 * Link into the owning Money/Plan object without making Inbox the owner.
 */
export async function InboxSourceLink({ item }: { item: InboxReviewItem }) {
  const t = await getTranslations("inbox");
  const target = resolveInboxSourceTarget(item);
  if (!target) return null;

  return (
    <Link
      href={target.href}
      className={INBOX_META_ROW_CLASS}
      data-testid={INBOX_TEST_ID.VIEW_SOURCE}
    >
      <span className="min-w-0 text-pretty">{t(target.labelKey)}</span>
      <AppIcon
        icon={ACTION_ICONS.forward}
        size={AppIconSize.SM}
        className="shrink-0 text-text-tertiary"
      />
    </Link>
  );
}
