import type { ReactNode } from "react";
import {
  IconContainer,
  type IconContainerTone,
} from "@/shared/ui/icon-container";
import { BaseRow, type BaseRowDivider, BaseRowMinHeight } from "./base-row";
import { getPersonInitials } from "./person-identity";

export type MemberRowProps = {
  displayName: ReactNode;
  initials?: string;
  email?: ReactNode;
  subtitle?: ReactNode;
  roleBadge?: ReactNode;
  role?: ReactNode;
  statusActive?: boolean;
  isActive?: boolean;
  activeLabel?: string;
  roleTone?: IconContainerTone;
  action?: ReactNode;
  href?: string;
  onClick?: () => void;
  onPress?: () => void;
  disabled?: boolean;
  divider?: BaseRowDivider;
  className?: string;
  "aria-label"?: string;
  "data-testid"?: string;
};

/**
 * Canonical ViNha MemberRow primitive (Task 11 / Warm Precision).
 * Renders household members with avatar initials, role badge, email, and administrative actions.
 */
export function MemberRow({
  displayName,
  initials,
  email,
  subtitle,
  roleBadge,
  role,
  statusActive = true,
  isActive,
  activeLabel,
  roleTone = "primary",
  action,
  href,
  onClick,
  onPress,
  disabled = false,
  divider = "inset",
  className,
  "aria-label": ariaLabel,
  "data-testid": testId,
}: MemberRowProps) {
  const resolvedRole = roleBadge ?? role;
  const resolvedActive = isActive !== undefined ? isActive : statusActive;

  const derivedInitials =
    initials ??
    (typeof displayName === "string" ? getPersonInitials(displayName) : "MB");

  const leadingSlot = (
    <div className="relative flex shrink-0 items-center justify-center">
      <IconContainer tone={roleTone} size="md">
        <span
          className="text-xs font-bold tracking-tight select-none"
          aria-hidden
        >
          {derivedInitials}
        </span>
      </IconContainer>
      {resolvedActive ? (
        <span
          className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-surface bg-income"
          title={activeLabel ?? "Active"}
          aria-label={activeLabel ?? "Active"}
        />
      ) : null}
    </div>
  );

  const titleContent = (
    <div className="flex items-center gap-2">
      <span className="truncate font-semibold text-text-primary text-sm">
        {displayName}
      </span>
    </div>
  );

  const subtitleParts = [email, subtitle].filter(Boolean);
  const subtitleContent =
    subtitleParts.length > 0 ? (
      <div className="flex flex-col gap-0.5 text-xs text-text-muted">
        {email ? <span className="truncate">{email}</span> : null}
        {subtitle ? (
          <span className="truncate text-text-muted/80">{subtitle}</span>
        ) : null}
      </div>
    ) : null;

  const trailingSlot = resolvedRole ? (
    <div className="flex items-center gap-2">
      <div className="shrink-0">{resolvedRole}</div>
    </div>
  ) : null;

  return (
    <BaseRow
      leading={leadingSlot}
      title={titleContent}
      subtitle={subtitleContent}
      trailing={trailingSlot}
      action={action}
      minHeight={BaseRowMinHeight.INSTRUMENT}
      divider={divider}
      href={href}
      onClick={onClick}
      onPress={onPress}
      disabled={disabled}
      className={className}
      aria-label={ariaLabel}
      data-testid={testId}
    />
  );
}
