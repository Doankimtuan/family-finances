import { Link } from "@/i18n/navigation";
import type { PendingInvitation } from "@/modules/tenancy/application/list-pending-invitations";
import { TOGETHER_PATH } from "@/modules/tenancy/application/tenancy-constants";
import { Card } from "@/shared/patterns/card";
import { AppIcon } from "@/shared/ui/app-icon";
import { IconContainer, IconContainerTone } from "@/shared/ui/icon-container";
import { UTILITY_ICONS } from "@/shared/ui/icon-registry";
import { StatusBadge, StatusBadgeTone } from "@/shared/ui/status-badge";
import { Text } from "@/shared/ui/text";
import { invitationRowAriaLabel } from "./together-presentations";

type TogetherInvitationPreviewProps = {
  invitations: PendingInvitation[];
  locale: string;
  pendingLabel: string;
  expiresLabel: (date: string) => string;
};

export function TogetherInvitationPreview({
  invitations,
  locale,
  pendingLabel,
  expiresLabel,
}: TogetherInvitationPreviewProps) {
  if (invitations.length === 0) return null;

  return (
    <Card
      tone="elevated"
      className="gap-0 overflow-hidden p-0"
      data-testid="together-invitation-preview"
    >
      <ul className="divide-y divide-divider">
        {invitations.map((invitation) => {
          const expiry = expiresLabel(
            new Date(invitation.expiresAt).toLocaleDateString(locale),
          );
          return (
            <li
              key={invitation.id}
              aria-label={invitationRowAriaLabel({
                email: invitation.email,
                status: pendingLabel,
                expiry,
              })}
            >
              <Link
                href={TOGETHER_PATH.INVITATIONS}
                className="flex min-h-14 items-center gap-(--space-3) px-(--space-3) py-(--space-3) transition-[background-color] duration-(--duration-fast) hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring motion-reduce:transition-none"
              >
                <IconContainer tone={IconContainerTone.INFO} size="sm">
                  <AppIcon icon={UTILITY_ICONS.notification} size="sm" />
                </IconContainer>
                <div className="min-w-0 flex-1">
                  <Text
                    size="sm"
                    className="min-w-0 truncate font-semibold text-text-primary"
                  >
                    {invitation.email}
                  </Text>
                  <Text
                    size="xs"
                    tone="secondary"
                    className="mt-0.5 text-pretty"
                  >
                    {expiry}
                  </Text>
                </div>
                <StatusBadge
                  tone={StatusBadgeTone.WARNING}
                  className="shrink-0 whitespace-nowrap"
                >
                  {pendingLabel}
                </StatusBadge>
              </Link>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
