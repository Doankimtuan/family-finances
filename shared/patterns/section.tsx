import type { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";
import { SectionHeader } from "@/shared/patterns/section-header";

export const SectionVariant = {
  PLAIN: "plain",
  SURFACE: "surface",
  EMPHASIZED: "emphasized",
} as const;

export type SectionVariant =
  (typeof SectionVariant)[keyof typeof SectionVariant];

export const SECTION_VARIANT_VALUES = [
  SectionVariant.PLAIN,
  SectionVariant.SURFACE,
  SectionVariant.EMPHASIZED,
] as const;

export type SectionProps = {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  variant?: SectionVariant;
  className?: string;
  contentClassName?: string;
  testId?: string;
};

/**
 * Canonical product section. Prefer this over wrapping every group in a Card.
 */
export function Section({
  title,
  description,
  action,
  children,
  variant = SectionVariant.PLAIN,
  className,
  contentClassName,
  testId,
}: SectionProps) {
  return (
    <section
      className={cn(
        "flex flex-col gap-(--space-3)",
        variant === SectionVariant.SURFACE &&
          "rounded-(--radius-card) bg-surface-muted/55 p-(--space-4)",
        variant === SectionVariant.EMPHASIZED &&
          "rounded-(--radius-card) border border-accent/20 bg-accent/10 p-(--space-4)",
        className,
      )}
      data-testid={testId}
    >
      {title || description || action ? (
        <SectionHeader
          title={title}
          description={description}
          action={action}
        />
      ) : null}
      <div className={cn("flex flex-col gap-(--space-3)", contentClassName)}>
        {children}
      </div>
    </section>
  );
}
