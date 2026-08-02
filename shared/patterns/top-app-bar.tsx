"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { CaretLeft } from "@phosphor-icons/react";
import { cn } from "@/shared/utils/cn";
import { IconButton } from "@/shared/ui/icon-button";
import { Heading } from "@/shared/ui/heading";

const BACK_ICON_SIZE = 20;

/**
 * Top app bar — title + optional subtitle / back / trailing.
 * Seamless canvas blur (no hard rule) so page content reads as one surface.
 */
export function TopAppBar({
  title,
  subtitle,
  onBack,
  trailing,
  className,
  backLabel,
}: {
  title?: ReactNode;
  /** Soft supporting line under the title (e.g. Home lead). */
  subtitle?: ReactNode;
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
        "sticky top-0 z-(--z-sticky) shrink-0",
        "backdrop-blur-md",
        "[background-color:color-mix(in_srgb,var(--color-canvas)_calc(var(--opacity-chrome)*100%),transparent)]",
        "px-(--space-4) pt-(--space-3) pb-(--space-3)",
        "shadow-[inset_0_-1px_0_0_color-mix(in_srgb,var(--color-border-subtle)_calc(var(--opacity-chrome-hairline)*100%),transparent)]",
        className,
      )}
    >
      <div
        className={cn(
          "flex items-start gap-(--space-2)",
          subtitle ? "min-h-0" : "min-h-11 items-center",
        )}
      >
        {onBack ? (
          <IconButton
            aria-label={resolvedBackLabel}
            variant="ghost"
            size="sm"
            className="shrink-0 self-center"
            onPress={onBack}
          >
            <CaretLeft size={BACK_ICON_SIZE} weight="bold" />
          </IconButton>
        ) : null}

        <div className="min-w-0 flex-1">
          {typeof title === "string" ? (
            <Heading
              level={1}
              className="truncate text-lg font-semibold tracking-tight text-text-primary"
            >
              {title}
            </Heading>
          ) : (
            title
          )}
          {subtitle ? (
            <div className="mt-(--space-1) max-w-(--subtitle-max-width) text-sm leading-snug text-text-secondary">
              {typeof subtitle === "string" ? <p>{subtitle}</p> : subtitle}
            </div>
          ) : null}
        </div>

        {trailing ? (
          <div className="flex shrink-0 items-center gap-(--space-1) self-center">
            {trailing}
          </div>
        ) : null}
      </div>
    </header>
  );
}
