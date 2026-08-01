"use client";

import type { ReactNode } from "react";
import { CaretLeft } from "@phosphor-icons/react";
import { cn } from "@/shared/utils/cn";
import { IconButton } from "@/shared/ui/icon-button";
import { Heading } from "@/shared/ui/heading";

/**
 * Top app bar shell — title + optional back / trailing slots.
 */
export function TopAppBar({
  title,
  onBack,
  trailing,
  className,
}: {
  title?: ReactNode;
  onBack?: () => void;
  trailing?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "sticky top-0 z-(--z-sticky) flex h-14 items-center gap-(--space-2)",
        "border-b border-border-subtle bg-surface/95 px-(--space-4)",
        "backdrop-blur-sm",
        className,
      )}
    >
      {onBack ? (
        <IconButton
          aria-label="Back"
          variant="ghost"
          size="sm"
          onPress={onBack}
        >
          <CaretLeft size={20} />
        </IconButton>
      ) : (
        <span className="w-8" aria-hidden />
      )}
      <div className="min-w-0 flex-1">
        {typeof title === "string" ? (
          <Heading level={3} className="truncate text-base">
            {title}
          </Heading>
        ) : (
          title
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1">{trailing}</div>
    </header>
  );
}
