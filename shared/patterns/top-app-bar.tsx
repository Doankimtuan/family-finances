"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { CaretLeft } from "@phosphor-icons/react";
import { cn } from "@/shared/utils/cn";
import { IconButton } from "@/shared/ui/icon-button";
import { Heading } from "@/shared/ui/heading";

/**
 * Top app bar shell — title + optional back / trailing slots.
 * Default back label uses `a11y.back`; override with `backLabel` when needed.
 */
export function TopAppBar({
  title,
  onBack,
  trailing,
  className,
  backLabel,
}: {
  title?: ReactNode;
  onBack?: () => void;
  trailing?: ReactNode;
  className?: string;
  backLabel?: string;
}) {
  const tA11y = useTranslations("a11y");
  const resolvedBackLabel = backLabel ?? tA11y("back");

  return (
    <header
      className={cn(
        "sticky top-0 z-(--z-sticky) flex h-14 shrink-0 items-center gap-(--space-2)",
        "border-b border-border-subtle bg-surface/95 px-(--space-4)",
        "shadow-[var(--elevation-1)] backdrop-blur-md",
        className,
      )}
    >
      {onBack ? (
        <IconButton
          aria-label={resolvedBackLabel}
          variant="ghost"
          size="sm"
          onPress={onBack}
          className="min-h-11 min-w-11"
        >
          <CaretLeft size={20} weight="bold" />
        </IconButton>
      ) : (
        <span className="w-2" aria-hidden />
      )}
      <div className="min-w-0 flex-1">
        {typeof title === "string" ? (
          <Heading level={3} className="truncate text-base font-semibold">
            {title}
          </Heading>
        ) : (
          title
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {trailing ?? <span className="w-2" aria-hidden />}
      </div>
    </header>
  );
}
