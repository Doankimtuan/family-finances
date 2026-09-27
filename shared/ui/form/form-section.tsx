"use client";

import type { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";

export const FormSectionVariant = {
  PLAIN: "plain",
  SURFACE: "surface",
} as const;

export type FormSectionVariant =
  (typeof FormSectionVariant)[keyof typeof FormSectionVariant];

export type FormSectionProps = {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  variant?: FormSectionVariant;
  className?: string;
  contentClassName?: string;
  testId?: string;
};

/**
 * ViNha Canonical FormSection composition primitive.
 * Enforces canonical vertical rhythm between form groups without forcing card bloat.
 */
export function FormSection({
  title,
  description,
  action,
  children,
  variant = FormSectionVariant.PLAIN,
  className,
  contentClassName,
  testId,
}: FormSectionProps) {
  const isSurface = variant === FormSectionVariant.SURFACE;

  return (
    <section
      data-testid={testId}
      className={cn(
        "flex flex-col gap-(--space-3)",
        isSurface &&
          "rounded-(--radius-card) border border-border-subtle bg-surface-muted/40 p-(--space-4)",
        className,
      )}
    >
      {title || description || action ? (
        <div className="flex items-start justify-between gap-(--space-2)">
          <div className="flex flex-col gap-0.5 min-w-0">
            {title ? (
              <h3 className="text-sm font-semibold text-text-primary">
                {title}
              </h3>
            ) : null}
            {description ? (
              <p className="text-xs text-text-muted leading-relaxed">
                {description}
              </p>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      ) : null}

      <div className={cn("flex flex-col gap-(--space-3)", contentClassName)}>
        {children}
      </div>
    </section>
  );
}
