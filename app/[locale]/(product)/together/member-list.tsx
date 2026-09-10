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
import { isHouseholdAdmin } from "./together-presentations";
import { TogetherMemberRow } from "./together-member-row";
import { MemberRoleAction } from "./members/member-role-action";
import { MemberLifecycleAction } from "./members/member-lifecycle-action";

/** Shared Together row with role context and state-aware actions. */
export function MemberList({
  members,
  youLabel,
  unnamedFallback,
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
  unnamedFallback: string;
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
          const canManageLifecycle =
            member.isSelf ||
            (canManageMembers && member.role === HOUSEHOLD_ROLE.PARTNER);
          const isLastAdmin =
            isHouseholdAdmin(member.role) && activeAdminCount === 1;
          const shouldShowActions = canManageRoles || canManageLifecycle;

          return (
            <TogetherMemberRow
              key={member.id}
              member={member}
              youLabel={youLabel}
              unnamedFallback={unnamedFallback}
              roleAdminLabel={roleAdminLabel}
              rolePartnerLabel={rolePartnerLabel}
              roleAdminHint={roleAdminHint}
              rolePartnerHint={rolePartnerHint}
              activeLabel={activeLabel}
              testId={`together-member-${member.id}`}
              roleTestId={
                isHouseholdAdmin(member.role)
                  ? "together-role-admin"
                  : "together-role-partner"
              }
            >
              {shouldShowActions ? (
                <div className="flex flex-wrap items-center gap-(--space-2) border-t border-divider pt-(--space-3)">
                  {canManageRoles ? (
                    <MemberRoleAction
                      member={member}
                      className="min-h-11 min-w-0 flex-1"
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
                      className={
                        isLastAdmin ? "basis-full" : "min-h-11 min-w-0 flex-1"
                      }
                    />
                  ) : null}
                </div>
              ) : null}
            </TogetherMemberRow>
          );
        })}
      </ul>
    </Card>
  );
}
