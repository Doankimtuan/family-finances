import { Text } from "@/shared/ui/text";
import type { HouseholdMemberRow } from "@/modules/tenancy/application/list-household-members";
import {
  EMPTY_MEMBERSHIP_IMPACT,
  type MembershipImpactSummary,
} from "@/modules/tenancy/application/membership-lifecycle";
import { HOUSEHOLD_ROLE } from "@/modules/tenancy/application/tenancy-constants";
import { Card } from "@/shared/patterns/card";
import { IconContainer } from "@/shared/ui/icon-container";
import { StatusBadge } from "@/shared/ui/status-badge";
import { MemberRoleAction } from "./members/member-role-action";
import { MemberLifecycleAction } from "./members/member-lifecycle-action";

function initials(email: string | null, displayName: string | null): string {
  const source = (displayName ?? email ?? "?").trim();
  const parts = source.split(/[\s@._-]+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

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
          const memberName =
            member.displayName ?? member.email ?? member.userId.slice(0, 8);
          const capabilityHint = isAdmin ? roleAdminHint : rolePartnerHint;
          return (
            <li
              key={member.id}
              className="flex flex-col gap-(--space-3) p-(--space-4)"
              data-testid={`together-member-${member.id}`}
            >
              <div className="flex items-start gap-(--space-3)">
                <IconContainer tone={isAdmin ? "primary" : "neutral"} size="md">
                  <span className="text-sm font-semibold text-text-primary">
                    {initials(member.email, member.displayName)}
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
                    <Text size="xs" tone="secondary">
                      {activeLabel} · {capabilityHint}
                    </Text>
                  </div>
                </div>
              </div>
              {canManageRoles ? <MemberRoleAction member={member} /> : null}
              {member.isSelf ||
              (canManageMembers && member.role === HOUSEHOLD_ROLE.PARTNER) ? (
                <MemberLifecycleAction
                  action={member.isSelf ? "leave" : "remove"}
                  member={member}
                  impact={
                    impactByMemberId?.[member.id] ?? EMPTY_MEMBERSHIP_IMPACT
                  }
                  isLastAdmin={
                    member.role === HOUSEHOLD_ROLE.ADMIN &&
                    activeAdminCount === 1
                  }
                  isSoloAdmin={members.length === 1}
                />
              ) : null}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
