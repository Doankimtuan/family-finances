import type { ReactNode } from "react";
import type { HouseholdMemberRow } from "@/modules/tenancy/application/list-household-members";
import { Avatar, AvatarFallback } from "@/shared/ui/avatar";
import { AppIcon } from "@/shared/ui/app-icon";
import { IconContainer, IconContainerTone } from "@/shared/ui/icon-container";
import { UTILITY_ICONS } from "@/shared/ui/icon-registry";
import { StatusBadge, StatusBadgeTone } from "@/shared/ui/status-badge";
import { Text } from "@/shared/ui/text";
import { memberDisplayName, memberInitials } from "./together-member-identity";
import { cn } from "@/shared/utils/cn";
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
  compact?: boolean;
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
  compact = false,
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
  const roleBadgeTone = isHouseholdAdmin(member.role)
    ? StatusBadgeTone.INFO
    : StatusBadgeTone.NEUTRAL;

  const avatarToneClassName = isHouseholdAdmin(member.role)
    ? "bg-info/10 text-info"
    : "bg-primary-soft text-primary";
  const roleIconTone = isHouseholdAdmin(member.role)
    ? IconContainerTone.PRIMARY
    : IconContainerTone.NEUTRAL;

  return (
    <li
      data-testid={testId}
      className={cn(
        "flex min-h-14 flex-col gap-(--space-3)",
        compact ? "p-(--space-3)" : "px-(--space-3) py-(--space-3)",
      )}
      aria-label={memberRowAriaLabel({
        name,
        isSelf: member.isSelf,
        youLabel,
        roleLabel,
        activeLabel,
      })}
    >
      <div
        className={cn(
          "flex min-h-11 gap-(--space-3)",
          compact ? "items-center justify-between" : "items-start",
        )}
      >
        {compact ? (
          <Avatar className="size-9 shrink-0" aria-hidden="true">
            <AvatarFallback
              className={cn(
                "size-full rounded-full text-xs font-semibold",
                avatarToneClassName,
              )}
            >
              {memberInitials(member.email, member.displayName)}
            </AvatarFallback>
          </Avatar>
        ) : (
          <IconContainer tone={roleIconTone} size="sm">
            <span className="text-xs font-semibold" aria-hidden>
              {memberInitials(member.email, member.displayName)}
            </span>
          </IconContainer>
        )}
        <div className="min-w-0 flex-1">
          <div
            className={cn(
              "flex min-w-0 items-center gap-x-(--space-2) gap-y-(--space-1)",
              !compact && "flex-wrap",
            )}
          >
            {compact ? (
              <span
                className="min-w-0 truncate text-sm font-medium text-text-primary"
                title={name}
              >
                {name}
              </span>
            ) : (
              <Text
                size="sm"
                className="min-w-0 truncate font-semibold text-text-primary"
              >
                {name}
              </Text>
            )}
            {member.isSelf ? (
              compact ? (
                <span className="shrink-0 text-xs text-text-muted">
                  ({youLabel})
                </span>
              ) : (
                <Text size="xs" tone="secondary" className="shrink-0">
                  ({youLabel})
                </Text>
              )
            ) : null}
          </div>
          {compact ? (
            <StatusBadge
              tone={roleBadgeTone}
              className="mt-(--space-1)"
              data-testid={roleTestId}
            >
              {roleLabel}
            </StatusBadge>
          ) : null}
          {member.email && member.displayName ? (
            compact ? (
              <p className="mt-(--space-1) truncate text-xs font-normal text-text-secondary">
                {member.email}
              </p>
            ) : (
              <Text size="xs" tone="secondary" className="mt-0.5 truncate">
                {member.email}
              </Text>
            )
          ) : null}
        </div>
        {!compact ? (
          <div className="flex shrink-0 items-center gap-(--space-2)">
            {activeLabel ? (
              <span className="inline-block size-2 rounded-full bg-success">
                <span className="sr-only">{activeLabel}</span>
              </span>
            ) : null}
            <StatusBadge
              tone={roleBadgeTone}
              className="shrink-0 whitespace-nowrap"
              data-testid={roleTestId}
            >
              {roleLabel}
            </StatusBadge>
          </div>
        ) : null}
        {compact && activeLabel ? (
          <span className="flex shrink-0 items-center gap-(--space-1) text-xs text-success">
            <span
              className="inline-block size-2 rounded-full bg-success"
              aria-hidden="true"
            />
            <span>{activeLabel}</span>
          </span>
        ) : null}
      </div>
      {!compact ? (
        <div className="mt-(--space-1) flex items-center gap-(--space-2) rounded-(--radius-control) border border-border-subtle bg-surface-raised/40 p-(--space-2) text-xs text-text-secondary">
          <AppIcon
            icon={UTILITY_ICONS.info}
            size="xs"
            className="shrink-0 text-primary"
          />
          <span className="line-clamp-1">{roleHint}</span>
        </div>
      ) : null}
      {children}
    </li>
  );
}
