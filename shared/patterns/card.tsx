"use client";

import { Card as HeroCard, type CardProps as HeroCardProps } from "@heroui/react";
import { cn } from "@/shared/utils/cn";

export type CardTone =
  | "default"
  | "interactive"
  | "metric"
  | "soft"
  | "highlighted"
  | "warning";

export type CardProps = HeroCardProps & {
  tone?: CardTone;
};

const toneClassName: Record<CardTone, string> = {
  default: "bg-surface border border-border-subtle/80 shadow-[var(--elevation-1)]",
  interactive:
    "bg-surface border border-border-subtle/80 shadow-[var(--elevation-1)] transition-[transform,box-shadow,border-color] duration-(--duration-fast) hover:-translate-y-px hover:border-border-default hover:shadow-[var(--elevation-2)] motion-reduce:transform-none motion-reduce:transition-none",
  metric: "bg-surface border border-border-subtle/60 shadow-none",
  soft: "bg-surface-muted border border-transparent shadow-none",
  highlighted: "bg-surface-highlight border border-primary/15 shadow-none",
  warning: "bg-warning/10 border border-warning/25 shadow-none",
};

/** Composable HeroUI card with a deliberately small semantic tone set. */
export function Card({ className, tone = "default", ...props }: CardProps) {
  return (
    <HeroCard
      className={cn(
        "rounded-[var(--radius-card)] text-text-primary",
        toneClassName[tone],
        className,
      )}
      {...props}
    />
  );
}

Card.Header = HeroCard.Header;
Card.Title = HeroCard.Title;
Card.Description = HeroCard.Description;
Card.Content = HeroCard.Content;
Card.Footer = HeroCard.Footer;
