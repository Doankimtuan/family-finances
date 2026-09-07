import { Link } from "@/i18n/navigation";
import { EmptyState } from "@/shared/patterns/empty-state";
import { AppIcon, AppIconSize } from "@/shared/ui/app-icon";
import { FINANCE_ICONS } from "@/shared/ui/icon-registry";

type SavingsUnavailableProps = {
  title: string;
  description?: string;
  actionHref: string;
  actionLabel: string;
};

/**
 * Recovery for a missing or unavailable savings surface. Copy and destination
 * stay with the caller so detail vs early-withdraw paths remain distinct.
 */
export function SavingsUnavailable({
  title,
  description,
  actionHref,
  actionLabel,
}: SavingsUnavailableProps) {
  return (
    <EmptyState
      title={title}
      description={description}
      icon={<AppIcon icon={FINANCE_ICONS.savings} size={AppIconSize.DISPLAY} />}
      className="flex-none py-(--space-4)"
      action={
        <Link
          href={actionHref}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-(--radius-control) bg-accent px-(--space-4) text-sm font-semibold text-accent-fg transition-[background-color,transform] duration-(--duration-fast) hover:-translate-y-px active:scale-(--press-scale) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring motion-reduce:transition-none motion-reduce:active:scale-100"
        >
          {actionLabel}
        </Link>
      }
    />
  );
}
