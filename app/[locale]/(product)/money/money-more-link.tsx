"use client";

import { CaretRight } from "@phosphor-icons/react";
import { Link } from "@/i18n/navigation";
import { Text } from "@/shared/ui/text";

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
      className="flex min-h-11 items-center justify-between rounded-lg border border-border-subtle bg-surface px-(--space-4) py-(--space-3) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
      data-testid={testId}
    >
      <Text size="sm" className="font-medium text-text-primary">
        {label}
      </Text>
      <CaretRight size={18} className="text-text-secondary" aria-hidden />
    </Link>
  );
}
