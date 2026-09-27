import type { IconSvgElement } from "@hugeicons/react";
import type { ReactNode } from "react";
import { AppIcon } from "@/shared/ui/app-icon";
import { Button, ButtonSize, ButtonVariant } from "@/shared/ui/button";
import {
  IconContainer,
  type IconContainerTone,
} from "@/shared/ui/icon-container";
import { BaseRow, type BaseRowDivider, BaseRowMinHeight } from "./base-row";

export type StatusRowProps = {
  icon?: IconSvgElement;
  iconNode?: ReactNode;
  iconTone?: IconContainerTone;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  statusBadge?: ReactNode;
  divider?: BaseRowDivider;
  className?: string;
  "aria-label"?: string;
  "data-testid"?: string;
};

/**
 * Standard status/diagnostic row for integrations, security, or sync health.
 */
export function StatusRow({
  icon,
  iconNode,
  iconTone = "neutral",
  title,
  description,
  action,
  actionLabel,
  onAction,
  statusBadge,
  divider = "none",
  className,
  "aria-label": ariaLabel,
  "data-testid": testId,
}: StatusRowProps) {
  const leadingSlot = iconNode ? (
    iconNode
  ) : icon ? (
    <IconContainer tone={iconTone} size="md">
      <AppIcon icon={icon} size="md" />
    </IconContainer>
  ) : null;

  const trailingSlot = statusBadge ? (
    <div className="shrink-0">{statusBadge}</div>
  ) : null;

  const actionSlot =
    action !== undefined ? (
      action
    ) : actionLabel && onAction ? (
      <Button
        variant={ButtonVariant.SECONDARY}
        size={ButtonSize.SM}
        onClick={onAction}
      >
        {actionLabel}
      </Button>
    ) : null;

  return (
    <BaseRow
      leading={leadingSlot}
      title={title}
      subtitle={description}
      trailing={trailingSlot}
      action={actionSlot}
      minHeight={BaseRowMinHeight.STANDARD}
      divider={divider}
      className={className}
      aria-label={ariaLabel}
      data-testid={testId}
    />
  );
}
