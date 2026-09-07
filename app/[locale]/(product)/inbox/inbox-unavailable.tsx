import { Link } from "@/i18n/navigation";
import { EmptyState } from "@/shared/patterns/empty-state";
import { AppIcon, AppIconSize } from "@/shared/ui/app-icon";
import { NAVIGATION_ICONS } from "@/shared/ui/icon-registry";
import { INBOX_ACCENT_LINK_CLASS } from "./inbox-chrome";

type InboxUnavailableProps = {
  title: string;
  description?: string;
  actionHref: string;
  actionLabel: string;
  testId?: string;
};

/**
 * Recovery for a missing or unloadable Inbox surface. Copy and destination
 * stay with the caller so queue vs detail retry paths remain distinct.
 */
export function InboxUnavailable({
  title,
  description,
  actionHref,
  actionLabel,
  testId,
}: InboxUnavailableProps) {
  return (
    <EmptyState
      title={title}
      description={description}
      icon={
        <AppIcon icon={NAVIGATION_ICONS.inbox} size={AppIconSize.DISPLAY} />
      }
      className="flex-none py-(--space-4)"
      action={
        <Link
          href={actionHref}
          className={INBOX_ACCENT_LINK_CLASS}
          data-testid={testId}
        >
          {actionLabel}
        </Link>
      }
    />
  );
}
