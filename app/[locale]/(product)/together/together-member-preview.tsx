import type { HouseholdMemberRow } from "@/modules/tenancy/application/list-household-members";
import { HOUSEHOLD_ROLE } from "@/modules/tenancy/application/tenancy-constants";
import { Card } from "@/shared/patterns/card";
import { IconContainer } from "@/shared/ui/icon-container";
import { StatusBadge } from "@/shared/ui/status-badge";
import { Text } from "@/shared/ui/text";
import { cn } from "@/shared/utils/cn";
import { memberDisplayName, memberInitials } from "./together-member-identity";

type TogetherMemberPreviewProps = {
  members: HouseholdMemberRow[];
  youLabel: string;
  roleAdminLabel: string;
  rolePartnerLabel: string;
};

export function TogetherMemberPreview({
  members,
  youLabel,
  roleAdminLabel,
  rolePartnerLabel,
}: TogetherMemberPreviewProps) {
  return (
    <Card tone="elevated" className="gap-0 overflow-hidden p-0">
      <ul
        className="divide-y divide-divider"
        data-testid="together-member-preview"
      >
        {members.map((member) => {
          const isAdmin = member.role === HOUSEHOLD_ROLE.ADMIN;
          return (
            <li
              key={member.id}
              className="flex items-center gap-(--space-3) px-(--space-3) py-(--space-3)"
            >
              <IconContainer tone={isAdmin ? "primary" : "neutral"} size="sm">
                <span className="text-xs font-semibold">
                  {memberInitials(member.email, member.displayName)}
                </span>
              </IconContainer>
              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-center gap-(--space-2)">
                  <Text
                    size="sm"
                    className="min-w-0 truncate font-semibold text-text-primary"
                  >
                    {memberDisplayName(member)}
                  </Text>
                  {member.isSelf ? (
                    <Text size="xs" tone="secondary" className="shrink-0">
                      ({youLabel})
                    </Text>
                  ) : null}
                </div>
                {member.email && member.displayName ? (
                  <Text size="xs" tone="secondary" className="mt-0.5 truncate">
                    {member.email}
                  </Text>
                ) : null}
              </div>
              <StatusBadge
                tone={isAdmin ? "info" : "neutral"}
                className={cn("shrink-0")}
              >
                {isAdmin ? roleAdminLabel : rolePartnerLabel}
              </StatusBadge>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
