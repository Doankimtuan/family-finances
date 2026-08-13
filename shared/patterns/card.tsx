"use client";

import {
  Card as HeroCard,
  type CardProps as HeroCardProps,
} from "@heroui/react";
import { cn } from "@/shared/utils/cn";

export type CardTone =
  "default" | "interactive" | "metric" | "soft" | "highlighted" | "warning";

export type CardProps = HeroCardProps & {
  tone?: CardTone;
};

const toneClassName: Record<CardTone, string> = {
  default: "bg-surface/90 border border-border-subtle/60 shadow-none",
  interactive:
    "bg-surface border border-border-subtle/60 shadow-none transition-[transform,background-color,border-color] duration-(--duration-fast) hover:-translate-y-px hover:border-border-default hover:bg-surface-hover active:scale-[var(--press-scale)] motion-reduce:transform-none motion-reduce:transition-none motion-reduce:active:scale-100",
  metric: "bg-surface-muted/60 border border-transparent shadow-none",
  soft: "bg-surface-muted/70 border border-transparent shadow-none",
  highlighted: "bg-surface-highlight/80 border border-primary/15 shadow-none",
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
