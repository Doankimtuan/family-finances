import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  APP_PATH,
  moneySavingsPath,
  moneyTransactionPath,
  planJarPath,
} from "@/modules/tenancy/application/app-path";
import {
  InboxItemKind,
  InboxSourceType,
  isJarResolvableKind,
} from "@/modules/inbox/application/inbox-constants";
import type { InboxReviewItem } from "@/modules/inbox/application/inbox-types";

type SourceTarget = {
  href: string;
  labelKey: "viewSourceTransaction" | "viewSourceSavings" | "viewSourcePlan";
};

/**
 * Resolve a source-domain deep link when source type/id are known.
 * Omit rather than invent destinations. Canonical kinds only (Prompt 13A).
 */
export function resolveInboxSourceTarget(
  item: InboxReviewItem,
): SourceTarget | null {
  if (!item.kind) return null;

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
      className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-border-subtle bg-surface px-(--space-4) text-sm font-medium text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
      data-testid="inbox-view-source"
    >
      {t(target.labelKey)}
    </Link>
  );
}
