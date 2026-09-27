import type { IconSvgElement } from "@hugeicons/react";
import type { ReactNode } from "react";
import { AppIcon } from "@/shared/ui/app-icon";
import {
  IconContainer,
  type IconContainerTone,
} from "@/shared/ui/icon-container";
import { ACTION_ICONS } from "@/shared/ui/icon-registry";
import { BaseRow, type BaseRowDivider } from "./base-row";

export type NavigationRowProps = {
  href?: string;
  onClick?: () => void;
  onPress?: () => void;
  icon?: IconSvgElement;
  iconNode?: ReactNode;
  iconTone?: IconContainerTone;
  iconSize?: "sm" | "md";
  title: ReactNode;
  subtitle?: ReactNode;
  badge?: ReactNode;
  metadata?: ReactNode;
  divider?: BaseRowDivider;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
  "data-testid"?: string;
};

/**
 * Standard settings / management navigation row.
 * Composed over BaseRow with leading icon, labels, trailing metadata/badge, and forward chevron.
 */
export function NavigationRow({
  href,
  onClick,
  onPress,
  icon,
  iconNode,
  iconTone = "neutral",
  iconSize = "md",
  title,
  subtitle,
  badge,
  metadata,
  divider = "inset",
  disabled = false,
  className,
  "aria-label": ariaLabel,
  "data-testid": testId,
}: NavigationRowProps) {
  const leadingElement = iconNode ? (
    iconNode
  ) : icon ? (
    <IconContainer tone={iconTone} size={iconSize}>
      <AppIcon icon={icon} size="md" />
    </IconContainer>
  ) : null;

  const trailingElement = (
    <div className="flex items-center gap-(--space-2)">
      {metadata ? (
        <span className="text-xs text-text-muted">{metadata}</span>
      ) : null}
      {badge ? <div className="shrink-0">{badge}</div> : null}
      <AppIcon
        icon={ACTION_ICONS.forward}
        size="sm"
        className="text-text-muted/70 group-hover:text-text-primary transition-colors"
      />
    </div>
  );

  return (
    <BaseRow
      href={href}
      onClick={onClick}
      onPress={onPress}
      disabled={disabled}
      leading={leadingElement}
      title={title}
      subtitle={subtitle}
      trailing={trailingElement}
      divider={divider}
      className={className}
      aria-label={ariaLabel}
      data-testid={testId}
    />
  );
}
