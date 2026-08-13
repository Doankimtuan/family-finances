"use client";
import type { ReactNode } from "react";
import type { IconSvgElement } from "@hugeicons/react";
import { useTranslations } from "next-intl";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { Link } from "@/i18n/navigation";
import { cn } from "@/shared/utils/cn";
import { IconButton } from "@/shared/ui/icon-button";
import { Heading } from "@/shared/ui/heading";
import { AppIcon } from "@/shared/ui/app-icon";
import { IconContainer } from "@/shared/ui/icon-container";

export type TopAppBarVariant = "primary" | "contextual" | "detail" | "form";
export type HeaderPillTone = "neutral" | "positive" | "attention" | "info";

export type TopAppBarProps = {
  variant?: TopAppBarVariant;
  eyebrow?: ReactNode;
  title?: ReactNode;
  subtitle?: ReactNode;
  icon?: IconSvgElement;
  status?: ReactNode;
  meta?: ReactNode;
  insight?: ReactNode;
  onBack?: () => void;
  backHref?: string;
  trailing?: ReactNode;
  className?: string;
  backLabel?: string;
};

const headerPillToneClassName: Record<HeaderPillTone, string> = {
  neutral: "bg-surface-muted text-text-secondary",
  positive: "bg-success/10 text-success",
  attention: "bg-warning/10 text-warning",
  info: "bg-info/10 text-info",
};

export function HeaderPill({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: HeaderPillTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex min-h-7 items-center rounded-full px-(--space-2) text-xs font-semibold leading-none",
        headerPillToneClassName[tone],
        className,
      )}
      data-slot="header-pill"
    >
      {children}
    </span>
  );
}

/**
 * Composable page header for the compact mobile-native shell. Contextual
 * headers can add a human headline, semantic icon, status, period, and insight
 * without turning every screen into a card or marketing hero.
 */
export function TopAppBar({
  variant = "primary",
  eyebrow,
  title,
  subtitle,
  icon,
  status,
  meta,
  insight,
  onBack,
  backHref,
  trailing,
  className,
  backLabel,
}: TopAppBarProps) {
  const tA11y = useTranslations("a11y");
  const resolvedBackLabel = backLabel ?? tA11y("back");
  const isContextual = variant === "contextual";
  return (
    <header
      className={cn(
        "shrink-0 px-(--page-gutter)",
        isContextual
          ? "pb-(--space-5) pt-(--space-5)"
          : variant === "primary"
            ? "pb-(--space-4) pt-(--space-5)"
            : "pb-(--space-3) pt-(--space-2)",
        className,
        isContextual ? "vinha-header-contextual" : null,
      )}
      data-header-variant={variant}
    >
      <div
        className={cn(
          "flex items-start gap-(--space-2)",
          isContextual || variant === "primary"
            ? "min-h-0"
            : "min-h-11 items-center",
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
            <AppIcon icon={ArrowLeft01Icon} size="sm" emphasized />
          </IconButton>
        ) : backHref ? (
          <Link
            href={backHref}
            aria-label={resolvedBackLabel}
            className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-md text-text-secondary transition-[background-color,color] duration-(--duration-fast) ease-(--ease-standard) hover:bg-surface-hover hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring motion-reduce:transition-none"
          >
            <AppIcon icon={ArrowLeft01Icon} size="sm" emphasized />
          </Link>
        ) : null}
        <div className="min-w-0 flex-1">
          {eyebrow ? (
            <div className="mb-(--space-1) text-sm font-medium leading-snug text-text-secondary">
              {eyebrow}
            </div>
          ) : null}
          <div className="flex items-start gap-(--space-3)">
            <div className="min-w-0 flex-1">
              {typeof title === "string" ? (
                <Heading
                  level={1}
                  className={cn(
                    "text-text-primary",
                    isContextual
                      ? "text-3xl leading-tight"
                      : variant === "primary"
                        ? "text-2xl leading-tight"
                        : "text-lg leading-snug",
                    isContextual
                      ? "vinha-header-title text-balance break-words"
                      : subtitle
                        ? ""
                        : "truncate",
                  )}
                >
                  <span data-slot="header-title">{title}</span>
                </Heading>
              ) : (
                title
              )}
              {subtitle ? (
                <div className="mt-(--space-1) max-w-(--subtitle-max-width) text-sm leading-relaxed text-text-secondary">
                  {typeof subtitle === "string" ? <p>{subtitle}</p> : subtitle}
                </div>
              ) : null}
            </div>
            {icon ? (
              <IconContainer
                tone="primary"
                size="md"
                className="mt-(--space-1)"
              >
                <AppIcon icon={icon} size="lg" emphasized />
              </IconContainer>
            ) : null}
          </div>
          {meta || status ? (
            <div className="mt-(--space-3) flex flex-wrap items-center gap-(--space-2) text-sm leading-snug text-text-secondary">
              {meta ? <span>{meta}</span> : null}
              {status}
            </div>
          ) : null}
          {insight ? (
            <div className="mt-(--space-2) text-sm leading-relaxed text-text-secondary">
              {insight}
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
