"use client";

import {
  Card as HeroCard,
  type CardProps as HeroCardProps,
} from "@heroui/react";
import { cn } from "@/shared/utils/cn";

export type CardProps = HeroCardProps;

export function Card({ className, ...props }: CardProps) {
  return (
    <HeroCard
      className={cn(
        "bg-[var(--color-surface)] border-[var(--color-border-subtle)]",
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
