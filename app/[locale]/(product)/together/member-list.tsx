import { Text } from "@/shared/ui/text";
import type { HouseholdMemberRow } from "@/modules/tenancy/application/list-household-members";
import {
  EMPTY_MEMBERSHIP_IMPACT,
  type MembershipImpactSummary,
} from "@/modules/tenancy/application/membership-lifecycle";
import {
  HOUSEHOLD_ROLE,
  MEMBERSHIP_LIFECYCLE_ACTION,
} from "@/modules/tenancy/application/tenancy-constants";
import { Card } from "@/shared/patterns/card";
import { IconContainer } from "@/shared/ui/icon-container";
import { StatusBadge } from "@/shared/ui/status-badge";
import { MemberRoleAction } from "./members/member-role-action";
import { MemberLifecycleAction } from "./members/member-lifecycle-action";
import { memberDisplayName, memberInitials } from "./together-member-identity";

/** Shared Together row with role context and state-aware actions. */
export function MemberList({
  members,
  youLabel,
  roleAdminLabel,
  rolePartnerLabel,
  roleAdminHint,
  rolePartnerHint,
  activeLabel,
  canManageRoles,
  canManageMembers,
  impactByMemberId,
  activeAdminCount = 0,
}: {
  members: HouseholdMemberRow[];
  youLabel: string;
  roleAdminLabel: string;
  rolePartnerLabel: string;
  roleAdminHint: string;
  rolePartnerHint: string;
  activeLabel: string;
  canManageRoles?: boolean;
  canManageMembers?: boolean;
  impactByMemberId?: Readonly<Record<string, MembershipImpactSummary>>;
  activeAdminCount?: number;
}) {
  return (
    <Card tone="elevated" className="gap-0 overflow-hidden p-0">
      <ul className="divide-y divide-divider" data-testid="together-members">
        {members.map((member) => {
          const isAdmin = member.role === HOUSEHOLD_ROLE.ADMIN;
          const memberName = memberDisplayName(member);
          const capabilityHint = isAdmin ? roleAdminHint : rolePartnerHint;
          const canManageLifecycle =
            member.isSelf ||
            (canManageMembers && member.role === HOUSEHOLD_ROLE.PARTNER);
          const isLastAdmin =
            member.role === HOUSEHOLD_ROLE.ADMIN && activeAdminCount === 1;
          const shouldShowActions = canManageRoles || canManageLifecycle;

          return (
            <li
              key={member.id}
              className="flex flex-col gap-(--space-3) p-(--space-4)"
              data-testid={`together-member-${member.id}`}
            >
              <div className="flex items-start gap-(--space-3)">
                <IconContainer tone={isAdmin ? "primary" : "neutral"} size="md">
                  <span className="text-sm font-semibold">
                    {memberInitials(member.email, member.displayName)}
                  </span>
                </IconContainer>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-(--space-2) gap-y-1">
                    <Text
                      size="sm"
                      className="min-w-0 truncate font-semibold text-text-primary"
                    >
                      {memberName}
                    </Text>
                    {member.isSelf ? (
                      <Text size="xs" tone="secondary">
                        ({youLabel})
                      </Text>
                    ) : null}
                  </div>
                  {member.email && member.displayName ? (
                    <Text
                      size="xs"
                      tone="secondary"
                      className="mt-0.5 truncate"
                    >
                      {member.email}
                    </Text>
                  ) : null}
                  <div className="mt-(--space-2) flex flex-wrap items-center gap-(--space-2)">
                    <StatusBadge
                      tone={isAdmin ? "info" : "neutral"}
                      data-testid={
                        isAdmin
                          ? "together-role-admin"
                          : "together-role-partner"
                      }
                    >
                      {isAdmin ? roleAdminLabel : rolePartnerLabel}
                    </StatusBadge>
                    <Text size="xs" tone="secondary" className="text-pretty">
                      {activeLabel} · {capabilityHint}
                    </Text>
                  </div>
                </div>
              </div>

              {shouldShowActions ? (
                <div className="flex flex-wrap items-center gap-(--space-2) border-t border-divider pt-(--space-3)">
                  {canManageRoles ? (
                    <MemberRoleAction
                      member={member}
                      className="min-w-0 flex-1"
                    />
                  ) : null}
                  {canManageLifecycle ? (
                    <MemberLifecycleAction
                      action={
                        member.isSelf
                          ? MEMBERSHIP_LIFECYCLE_ACTION.LEAVE
                          : MEMBERSHIP_LIFECYCLE_ACTION.REMOVE
                      }
                      member={member}
                      impact={
                        impactByMemberId?.[member.id] ?? EMPTY_MEMBERSHIP_IMPACT
                      }
                      isLastAdmin={isLastAdmin}
                      isSoloAdmin={members.length === 1}
                      className={isLastAdmin ? "basis-full" : "min-w-0 flex-1"}
                    />
                  ) : null}
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
