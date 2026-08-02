"use client";

import { cn } from "@/shared/utils/cn";
import { Spinner } from "@/shared/ui/spinner";
import { Text } from "@/shared/ui/text";

const DEFAULT_LABEL = "Loading";

/**
 * Presentational loading state. Pass a localized `label` from callers.
 * Default is an English fallback so this works outside NextIntlClientProvider.
 */
export function LoadingState({
  label = DEFAULT_LABEL,
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
        "flex flex-col items-center justify-center gap-(--space-3) px-(--space-6) py-(--space-8)",
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
