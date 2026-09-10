import type { ReactNode } from "react";
import type { HouseholdMemberRow } from "@/modules/tenancy/application/list-household-members";
import { IconContainer, IconContainerTone } from "@/shared/ui/icon-container";
import { StatusBadge, StatusBadgeTone } from "@/shared/ui/status-badge";
import { Text } from "@/shared/ui/text";
import { memberDisplayName, memberInitials } from "./together-member-identity";
import {
  householdRoleHint,
  householdRoleLabel,
  isHouseholdAdmin,
  memberRowAriaLabel,
} from "./together-presentations";

type TogetherMemberRowProps = {
  member: HouseholdMemberRow;
  youLabel: string;
  unnamedFallback: string;
  roleAdminLabel: string;
  rolePartnerLabel: string;
  roleAdminHint: string;
  rolePartnerHint: string;
  activeLabel?: string;
  testId?: string;
  roleTestId?: string;
  children?: ReactNode;
};

export function TogetherMemberRow({
  member,
  youLabel,
  unnamedFallback,
  roleAdminLabel,
  rolePartnerLabel,
  roleAdminHint,
  rolePartnerHint,
  activeLabel,
  testId,
  roleTestId,
  children,
}: TogetherMemberRowProps) {
  const name = memberDisplayName(member, unnamedFallback);
  const roleLabel = householdRoleLabel(member.role, {
    admin: roleAdminLabel,
    partner: rolePartnerLabel,
  });
  const roleHint = householdRoleHint(member.role, {
    admin: roleAdminHint,
    partner: rolePartnerHint,
  });
  const meta = activeLabel ? `${activeLabel} · ${roleHint}` : roleHint;
  const roleBadgeTone = isHouseholdAdmin(member.role)
    ? StatusBadgeTone.INFO
    : StatusBadgeTone.NEUTRAL;
  const roleIconTone = isHouseholdAdmin(member.role)
    ? IconContainerTone.PRIMARY
    : IconContainerTone.NEUTRAL;

  return (
    <li
      data-testid={testId}
      className="flex min-h-14 flex-col gap-(--space-3) px-(--space-3) py-(--space-3)"
      aria-label={memberRowAriaLabel({
        name,
        isSelf: member.isSelf,
        youLabel,
        roleLabel,
      })}
    >
      <div className="flex min-h-11 items-start gap-(--space-3)">
        <IconContainer tone={roleIconTone} size="sm">
          <span className="text-xs font-semibold" aria-hidden>
            {memberInitials(member.email, member.displayName)}
          </span>
        </IconContainer>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-x-(--space-2) gap-y-1">
            <Text
              size="sm"
              className="min-w-0 truncate font-semibold text-text-primary"
            >
              {name}
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
          <Text size="xs" tone="secondary" className="mt-0.5 text-pretty">
            {meta}
          </Text>
        </div>
        <StatusBadge
          tone={roleBadgeTone}
          className="shrink-0 whitespace-nowrap"
          data-testid={roleTestId}
        >
          {roleLabel}
        </StatusBadge>
      </div>
      {children}
    </li>
  );
}
