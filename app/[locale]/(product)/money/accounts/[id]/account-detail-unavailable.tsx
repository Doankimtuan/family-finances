import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { EmptyState } from "@/shared/patterns/empty-state";
import { AppIcon, AppIconSize } from "@/shared/ui/app-icon";
import { FINANCE_ICONS } from "@/shared/ui/icon-registry";

type AccountDetailUnavailableProps = {
  title: string;
  description: string;
  actionHref: string;
  actionLabel: string;
  icon?: ReactNode;
};

/**
 * Composed recovery for a missing or unloadable account. Copy and destination
 * stay with the caller so liquid vs card retry paths remain distinct.
 */
export function AccountDetailUnavailable({
  title,
  description,
  actionHref,
  actionLabel,
  icon,
}: AccountDetailUnavailableProps) {
  return (
    <div className="flex flex-1 flex-col items-center px-(--page-gutter) pb-(--space-6) pt-(--space-3)">
      <EmptyState
        title={title}
        description={description}
        icon={
          icon ?? (
            <AppIcon icon={FINANCE_ICONS.account} size={AppIconSize.DISPLAY} />
          )
        }
        className="flex-none"
      />
      <Link
        href={actionHref}
        className="inline-flex min-h-11 w-full max-w-[18rem] items-center justify-center rounded-[var(--radius-control)] px-(--space-2) text-sm font-medium text-accent hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
      >
        {actionLabel}
      </Link>
    </div>
  );
}
