import { Link } from "@/i18n/navigation";
import {
  APP_PATH,
  inboxItemPath,
} from "@/modules/tenancy/application/app-path";
import { InboxItemKind } from "@/modules/inbox/application/inbox-constants";
import type { InboxReviewItem } from "@/modules/inbox/application/inbox-types";
import { isPartnerEmergencyAlert } from "@/modules/plan/application/client";
import { StatusAlert } from "@/shared/ui/status-alert";
import { Text } from "@/shared/ui/text";

type Props = {
  items: InboxReviewItem[];
  viewerUserId: string;
  title: string;
  body: string;
  openLabel: string;
};

/**
 * Partner-visible emergency declaration alerts (BR-13 / ST-E02-003).
 * Only surfaces items assigned to / intended for the viewing partner.
 */
export function EmergencyInboxBanner({
  items,
  viewerUserId,
  title,
  body,
  openLabel,
}: Props) {
  const emergencies = items.filter((item) =>
    isPartnerEmergencyAlert({
      kind: item.kind,
      executedByUserId: item.executedByUserId,
      assignedToUserId: item.assignedToUserId,
      viewerUserId,
      emergencyKind: InboxItemKind.EMERGENCY_DECLARATION,
    }),
  );
  if (emergencies.length === 0) {
    return null;
  }

  const first = emergencies[0];

  return (
    <div
      className="flex flex-col gap-(--space-2)"
      data-testid="plan-emergency-banner"
    >
      <StatusAlert
        variant="warning"
        title={title}
        description={first.intentNote ? `${body} ${first.intentNote}` : body}
      />
      <ul className="flex flex-col gap-(--space-2)">
        {emergencies.map((item) => (
          <li key={item.id}>
            <Link
              href={inboxItemPath(item.id)}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-border-subtle bg-surface px-(--space-4) text-sm font-medium text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
              data-testid={`plan-emergency-open-${item.id}`}
            >
              {openLabel}
            </Link>
          </li>
        ))}
      </ul>
      {emergencies.length > 1 ? (
        <Text size="sm" tone="secondary">
          <Link
            href={APP_PATH.INBOX}
            className="font-medium text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          >
            {openLabel}
          </Link>
        </Text>
      ) : null}
    </div>
  );
}
