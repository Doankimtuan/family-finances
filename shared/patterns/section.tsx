import type { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";
import { SectionHeader } from "@/shared/patterns/section-header";

export type SectionProps = {
  title?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  variant?: "plain" | "surface" | "emphasized";
  className?: string;
  contentClassName?: string;
  testId?: string;
};

/**
 * Canonical product section. Prefer this over wrapping every group in a Card.
 */
export function Section({
  title,
  action,
  children,
  variant = "plain",
  className,
  contentClassName,
  testId,
}: SectionProps) {
  return (
    <section
      className={cn(
        "flex flex-col gap-(--space-3)",
        variant === "surface" &&
          "rounded-xl border border-border-subtle bg-surface p-(--space-4)",
        variant === "emphasized" &&
          "rounded-xl border border-accent/25 bg-accent/10 p-(--space-4) shadow-[var(--elevation-1)]",
        className,
      )}
      data-testid={testId}
    >
      {title ? <SectionHeader title={title} action={action} /> : null}
      <div className={cn("flex flex-col gap-(--space-3)", contentClassName)}>
        {children}
      </div>
    </section>
  );
}
