"use client";

import type { IconSvgElement } from "@hugeicons/react";
import { ChevronRightIcon } from "@hugeicons/core-free-icons";
import { Link } from "@/i18n/navigation";
import { AppIcon } from "@/shared/ui/app-icon";
import {
  IconContainer,
  type IconContainerTone,
} from "@/shared/ui/icon-container";
import { Text } from "@/shared/ui/text";

export function MoneyMoreLink({
  href,
  label,
  description,
  icon,
  iconTone,
  testId,
}: {
  href: string;
  label: string;
  description: string;
  icon: IconSvgElement;
  iconTone: IconContainerTone;
  testId: string;
}) {
  return (
    <Link
      href={href}
      className="flex min-h-11 items-center gap-(--space-3) rounded-[var(--radius-control)] px-(--space-3) py-(--space-2) transition-[background-color,transform] duration-(--duration-fast) hover:bg-surface-hover active:scale-[var(--press-scale)] motion-reduce:transition-none motion-reduce:active:scale-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
      data-testid={testId}
    >
      <IconContainer tone={iconTone} size="sm">
        <AppIcon icon={icon} size="sm" />
      </IconContainer>
      <div className="min-w-0 flex-1">
        <Text size="sm" className="font-medium text-text-primary">
          {label}
        </Text>
        <Text size="sm" tone="secondary" className="truncate">
          {description}
        </Text>
      </div>
      <AppIcon
        icon={ChevronRightIcon}
        size="sm"
        className="shrink-0 text-text-tertiary"
      />
    </Link>
  );
}
