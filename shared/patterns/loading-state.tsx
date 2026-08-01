"use client";

import { cn } from "@/shared/utils/cn";
import { Spinner } from "@/shared/ui/spinner";
import { Text } from "@/shared/ui/text";

export function LoadingState({
  label = "Loading",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex flex-col items-center justify-center gap-[var(--space-3)] px-[var(--space-6)] py-[var(--space-10)]",
        className,
      )}
    >
      <Spinner />
      <Text tone="secondary" size="sm">
        {label}
      </Text>
    </div>
  );
}
