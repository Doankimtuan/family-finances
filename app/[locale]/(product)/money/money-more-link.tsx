"use client";

import { ChevronRightIcon } from "@hugeicons/core-free-icons";
import { Link } from "@/i18n/navigation";
import { Text } from "@/shared/ui/text";
import { AppIcon } from "@/shared/ui/app-icon";

export function MoneyMoreLink({
  href,
  label,
  testId,
}: {
  href: string;
  label: string;
  testId: string;
}) {
  return (
    <Link
      href={href}
      className="flex min-h-11 items-center justify-between rounded-[var(--radius-card)] border border-border-subtle/60 bg-surface-muted/45 px-(--space-4) py-(--space-3) transition-[background-color,border-color,transform] duration-(--duration-fast) hover:border-border-default hover:bg-surface-hover active:scale-[var(--press-scale)] motion-reduce:transition-none motion-reduce:active:scale-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
      data-testid={testId}
    >
      <Text size="sm" className="font-medium text-text-primary">
        {label}
      </Text>
      <AppIcon
        icon={ChevronRightIcon}
        size="sm"
        className="text-text-secondary"
      />
    </Link>
  );
}
